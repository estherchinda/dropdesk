import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY!);
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader || '',
          },
        },
      }
    );

    const body = await req.json();
    const { type, studentId, classId, title, className, extraData, link } = body;

    let emailsToNotify: string[] = [];

    // Fetch emails depending on event type
    if (classId) {
      // Get all students in the class
      const { data: enrollments, error } = await supabase
        .from('class_enrollments')
        .select(`
          student_id,
          profiles:student_id (email)
        `)
        .eq('class_id', classId);
      
      if (error) {
        console.error('Enrollment fetch error:', error);
      }
      
      if (enrollments) {
        emailsToNotify = enrollments
          .map((e: any) => e.profiles?.email)
          .filter(Boolean);
      }
    } else if (studentId) {
      // Get single student's email
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', studentId)
        .single();
      
      if (error) {
         console.error('Profile fetch error:', error);
      }
      if (profile?.email) {
        emailsToNotify.push(profile.email);
      }
    }

    if (emailsToNotify.length === 0) {
      return NextResponse.json({ success: true, message: 'No emails to send to' });
    }

    let subject = '';
    let htmlContent = '';

    const baseUrl = req.headers.get('origin') || 'http://localhost:3000';
    const ctaLink = link ? `${baseUrl}${link}` : baseUrl;

    switch (type) {
      case 'ASSIGNMENT_ADDED':
        subject = `New Assignment in ${className || 'your class'}: ${title}`;
        htmlContent = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>A new assignment has been added!</h2>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Class:</strong> ${className || 'Your class'}</p>
            ${extraData?.description ? `<p>${extraData.description}</p>` : ''}
            <br/>
            <a href="${ctaLink}" style="padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">View Assignment</a>
          </div>
        `;
        break;
      case 'ASSIGNMENT_GRADED':
        subject = `Assignment Graded: ${title}`;
        htmlContent = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Your assignment has been graded!</h2>
            <p><strong>Assignment:</strong> ${title}</p>
            <p><strong>Grade:</strong> ${extraData?.grade || 'N/A'}</p>
            ${extraData?.comment ? `<p><strong>Feedback:</strong> ${extraData.comment}</p>` : ''}
          </div>
        `;
        break;
      case 'MATERIAL_ADDED':
        subject = `New Material in ${className || 'your class'}: ${title}`;
        htmlContent = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>New study material has been added!</h2>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Class:</strong> ${className || 'Your class'}</p>
            <br/>
            <a href="${ctaLink}" style="padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">View Material</a>
          </div>
        `;
        break;
      case 'QUESTION_ANSWERED':
        subject = `Your question received an answer`;
        htmlContent = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Your instructor has answered your question!</h2>
            <p><strong>Your Question:</strong> ${title}</p>
            <p><strong>Answer:</strong> ${extraData?.answer}</p>
          </div>
        `;
        break;
      default:
        throw new Error('Invalid notification type');
    }

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: `DropDesk <${fromEmail}>`,
      to: emailsToNotify.length === 1 ? emailsToNotify : [fromEmail],
      bcc: emailsToNotify.length > 1 ? emailsToNotify : undefined,
      subject,
      html: htmlContent,
    });

    if (resendError) throw resendError;

    return NextResponse.json({ success: true, data: resendData });
  } catch (error: any) {
    console.error('Notify API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
