import { NotificationType } from './email';

export async function sendEmailNotification(
  to: string | string[],
  type: NotificationType,
  data: Record<string, any>
) {
  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, type, data }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('[Notify] Failed:', err);
    }
  } catch (err) {
    // Fire-and-forget: don't block UI for email failures
    console.error('[Notify] Network error:', err);
  }
}
