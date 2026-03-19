import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export type NotificationType =
  | 'grade_notification'
  | 'new_material'
  | 'new_assignment'
  | 'question_answered'
  | 'new_submission'
  | 'new_question';

interface SendEmailOptions {
  to: string;
  studentName?: string;
  type: NotificationType;
  data: Record<string, any>;
}

const subjects: Record<NotificationType, (data: Record<string, any>) => string> = {
  grade_notification: (d) => `Your assignment "${d.assignmentTitle}" has been graded`,
  new_material: (d) => `New material: "${d.materialTitle}" has been added`,
  new_assignment: (d) => `New assignment: "${d.assignmentTitle}" is now available`,
  question_answered: () => `Your question has been answered`,
  new_submission: (d) => `New submission from ${d.studentName}`,
  new_question: (d) => `New question from ${d.studentName}`,
};

function buildHtml(type: NotificationType, data: Record<string, any>): string {
  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #f8fafc;
    padding: 40px 20px;
  `;

  const cardStyle = `
    max-width: 520px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    padding: 32px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  `;

  const heading = `font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;`;
  const text = `font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 16px 0;`;
  const highlight = `
    background: #f1f5f9;
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #e2e8f0;
    margin: 16px 0;
  `;
  const badge = `
    display: inline-block;
    background: #4f46e5;
    color: #ffffff;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
  `;
  const footer = `font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;`;

  let body = '';

  switch (type) {
    case 'grade_notification':
      body = `
        <h2 style="${heading}">Assignment Graded 🎓</h2>
        <p style="${text}">Your assignment has been graded by your instructor.</p>
        <div style="${highlight}">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #0f172a;">${data.assignmentTitle}</p>
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #4f46e5;">${data.grade}</p>
        </div>
        ${data.feedback ? `<p style="${text}"><strong>Feedback:</strong> ${data.feedback.replace(/<[^>]+>/g, ' ')}</p>` : ''}
      `;
      break;

    case 'new_material':
      body = `
        <h2 style="${heading}">New Material Added 📚</h2>
        <p style="${text}">Your instructor has added new course material.</p>
        <div style="${highlight}">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #0f172a;">${data.materialTitle}</p>
          ${data.description ? `<p style="margin: 0; font-size: 13px; color: #64748b;">${data.description.replace(/<[^>]+>/g, ' ').substring(0, 150)}...</p>` : ''}
        </div>
      `;
      break;

    case 'new_assignment':
      body = `
        <h2 style="${heading}">New Assignment Available 📝</h2>
        <p style="${text}">A new assignment has been created for your class.</p>
        <div style="${highlight}">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #0f172a;">${data.assignmentTitle}</p>
          <span style="${badge}">Code: ${data.assignmentCode}</span>
          ${data.deadline ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #f59e0b;">⏰ Due: ${new Date(data.deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
        </div>
      `;
      break;

    case 'question_answered':
      body = `
        <h2 style="${heading}">Your Question Was Answered ✅</h2>
        <p style="${text}">Your instructor has responded to your question.</p>
        <div style="${highlight}">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong>Your question:</strong></p>
          <p style="margin: 0 0 12px 0; color: #0f172a;">${data.question?.replace(/<[^>]+>/g, ' ').substring(0, 200)}</p>
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #4f46e5; font-weight: 600;">Instructor's response:</p>
          <p style="margin: 0; color: #0f172a;">${data.answer?.replace(/<[^>]+>/g, ' ').substring(0, 300)}</p>
        </div>
      `;
      break;

    case 'new_submission':
      body = `
        <h2 style="${heading}">New Submission Received 📬</h2>
        <p style="${text}">A student has submitted their work.</p>
        <div style="${highlight}">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #0f172a;">${data.studentName}</p>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;">Assignment: ${data.assignmentTitle}</p>
          <span style="${badge}">Code: ${data.assignmentCode}</span>
        </div>
      `;
      break;

    case 'new_question':
      body = `
        <h2 style="${heading}">New Student Question ❓</h2>
        <p style="${text}">A student has asked a question that needs your attention.</p>
        <div style="${highlight}">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #0f172a;">${data.studentName}</p>
          <p style="margin: 0; font-size: 13px; color: #64748b;">${data.message?.replace(/<[^>]+>/g, ' ').substring(0, 250)}</p>
        </div>
      `;
      break;
  }

  return `
    <div style="${baseStyle}">
      <div style="${cardStyle}">
        ${body}
      </div>
      <p style="${footer}">DropDesk — Submission Portal</p>
    </div>
  `;
}

export async function sendNotification({ to, type, data }: SendEmailOptions) {
  try {
    const subject = subjects[type](data);
    const html = buildHtml(type, data);

    const result = await resend.emails.send({
      from: `DropDesk <${fromEmail}>`,
      to,
      subject,
      html,
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error(`[Email] Failed to send ${type} notification:`, error);
    return { success: false, error: error.message };
  }
}
