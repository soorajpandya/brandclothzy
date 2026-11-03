import nodemailer from 'nodemailer';

/** Masks an address for logs: "jane.doe@gmail.com" → "ja***@gmail.com". */
export function maskEmail(addr) {
  const [user = '', domain = ''] = String(addr || '').split('@');
  return `${user.slice(0, 2)}***@${domain}`;
}

/**
 * SMTP mailer. Credentials stay server-side. Without SMTP configured, emails are
 * not sent anywhere — only a masked log line is written (no message contents).
 */
export function createMailer(env = process.env, logger = console) {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT, SMTP_FROM } = env;
  const configured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
  const transporter = configured
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT || 465),
        secure: Number(SMTP_PORT || 465) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    : null;
  const from = SMTP_FROM || `"BrandClothzy" <${SMTP_USER || 'noreply@brandclothzy.com'}>`;

  return {
    configured,
    async send({ to, subject, html }) {
      if (!to) throw new Error('Recipient missing');
      if (!transporter) {
        logger.log(`[mailer] SMTP not configured — not sent: "${subject.slice(0, 40)}…" to ${maskEmail(to)}`);
        return { mocked: true };
      }
      const info = await transporter.sendMail({ from, to, subject, html });
      logger.log(`[mailer] sent to ${maskEmail(to)} (${info.messageId})`);
      return { messageId: info.messageId };
    },
  };
}
