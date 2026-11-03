/**
 * Transactional emails. There is NO generic "send any email" endpoint:
 * each email type has a fixed template, recipients come from verified server-side
 * records (Firebase ID token or the stored order), every interpolated value is
 * HTML-escaped, and each email is sent at most once (email_log de-duplication).
 */

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function layout(title, inner) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background-color:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;padding:40px 10px;"><tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#181818;border:1px solid #282828;border-radius:8px;overflow:hidden;">
      <tr><td style="padding:32px 30px;text-align:center;border-bottom:1px solid #282828;background-color:#121212;">
        <h1 style="margin:0;font-size:24px;letter-spacing:4px;text-transform:uppercase;color:#d4af37;font-weight:700;">BrandClothzy</h1>
        <p style="margin:8px 0 0;font-size:11px;letter-spacing:2px;color:#888888;text-transform:uppercase;">Luxury Indian Fashion</p>
      </td></tr>
      <tr><td style="padding:36px 35px;">${inner}</td></tr>
      <tr><td style="padding:22px 30px;background-color:#121212;border-top:1px solid #282828;text-align:center;">
        <p style="margin:0;font-size:11px;color:#666666;letter-spacing:1px;">© ${new Date().getFullYear()} BrandClothzy · Burptech Private Limited</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

export function welcomeEmail({ name, siteUrl }) {
  const safeName = escapeHtml(String(name || 'Valued Member').slice(0, 60));
  return {
    subject: `Welcome to BrandClothzy, ${String(name || 'Valued Member').slice(0, 60).replace(/[\r\n]/g, ' ')}`,
    html: layout('Welcome to BrandClothzy', `
      <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#ffffff;">Welcome to BrandClothzy, ${safeName}.</h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#b3b3b3;">Your BrandClothzy account is now active. Step into a curated world where Indian craftsmanship meets modern fashion.</p>
      <div style="background-color:#202020;border-left:3px solid #d4af37;padding:16px 20px;margin:25px 0;">
        <p style="margin:0;font-size:13px;color:#e0e0e0;line-height:1.6;">Enjoy free standard delivery on orders above ₹999.</p>
      </div>
      <p style="text-align:center;margin:30px 0;"><a href="${escapeHtml(siteUrl)}" style="display:inline-block;background-color:#d4af37;color:#0f0f0f;text-decoration:none;padding:14px 32px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;border-radius:4px;">Explore Collection</a></p>
      <p style="margin:25px 0 0;font-size:12px;color:#777777;line-height:1.6;">Questions? Reply to this email or write to contact@brandclothzy.com.</p>`),
  };
}

export function orderConfirmationEmail(order) {
  const rows = (order.items || [])
    .map((i) => `<tr>
        <td style="padding:8px 0;font-size:13px;color:#e0e0e0;">${escapeHtml(i.name)}${i.size ? ` · Size ${escapeHtml(i.size)}` : ''} × ${Number(i.quantity)}</td>
        <td style="padding:8px 0;font-size:13px;color:#e0e0e0;text-align:right;">${inr(i.line_total)}</td></tr>`)
    .join('');
  return {
    subject: `Order Confirmation #${order.id} — BrandClothzy`,
    html: layout('Order confirmation', `
      <h2 style="margin:0 0 12px;font-size:20px;color:#ffffff;">Thank you for your order, ${escapeHtml(order.customer_name)}!</h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#b3b3b3;">Your payment was received and order <strong>#${escapeHtml(order.id)}</strong> is confirmed.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #333;border-bottom:1px solid #333;margin:16px 0;">${rows}</table>
      <p style="margin:4px 0;font-size:13px;color:#b3b3b3;">Shipping: ${order.shipping === 0 ? 'Free' : inr(order.shipping)}</p>
      <p style="margin:4px 0 20px;font-size:16px;color:#ffffff;"><strong>Total paid: ${inr(order.total)}</strong></p>
      <p style="font-size:12px;color:#888;">We will email you again when your order is dispatched.</p>`),
  };
}

/**
 * Sends an email at most once per dedupe key. Failures are recorded and the claim is
 * released so a later retry can send it; they never affect the order itself.
 */
export async function sendOnce({ store, mailer, key, to, build, logger = console }) {
  const claimed = await store.claimEmail(key);
  if (!claimed) return { status: 'duplicate' };
  try {
    const { subject, html } = build();
    const result = await mailer.send({ to, subject, html });
    await store.setEmailStatus(key, { status: 'sent', mocked: Boolean(result?.mocked) });
    return { status: 'sent' };
  } catch (err) {
    logger.error(`[email] ${key.split('_')[0]} send failed: ${err?.message}`);
    await store.releaseEmail(key).catch(() => {});
    return { status: 'failed' };
  }
}
