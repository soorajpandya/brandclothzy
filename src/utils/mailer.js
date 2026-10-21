/**
 * Universal Frontend Email Dispatcher
 * Dispatches emails in the background without blocking UI or auth flows.
 */
export function triggerEmail({ to, type = 'welcome', name, data, subject, html }) {
  if (!to) return;

  const endpoint = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/send-email`
    : '/api/send-email';

  // Non-blocking async fire-and-forget
  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, type, name, data, subject, html }),
  })
    .then((r) => r.json())
    .then((res) => {
      if (res?.previewUrl) {
        console.log(`🔗 [Email Preview]: ${res.previewUrl}`);
      }
    })
    .catch((err) => {
      console.warn('[Mailer] Background notification notice:', err?.message);
    });
}
