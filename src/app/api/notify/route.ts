import { NextRequest, NextResponse } from 'next/server';
import { sendNotification, NotificationType } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, type, data } = body as {
      to: string | string[];
      type: NotificationType;
      data: Record<string, any>;
    };

    if (!to || !type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: to, type, data' },
        { status: 400 }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];
    
    const results = await Promise.allSettled(
      recipients.map((email) =>
        sendNotification({ to: email, type, data })
      )
    );

    const successes = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    const failures = results.length - successes;

    return NextResponse.json({
      message: `Sent ${successes}/${recipients.length} notifications`,
      failures,
    });
  } catch (error: any) {
    console.error('[API /notify] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
