import { supabase } from '@/lib/supabase';

export type NotifyType = 'ASSIGNMENT_ADDED' | 'ASSIGNMENT_GRADED' | 'MATERIAL_ADDED' | 'QUESTION_ANSWERED';

export interface NotifyPayload {
  type: NotifyType;
  studentId?: string;
  classId?: string;
  className?: string;
  title: string;
  link?: string;
  extraData?: any;
}

export async function sendNotification(payload: NotifyPayload) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Failed to notify:', err);
  }
}
