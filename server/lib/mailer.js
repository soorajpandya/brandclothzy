import nodemailer from 'nodemailer';

let cachedTransporter = null;
let isEthereal = false;

export async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT } = process.env;

  // 1. If real credentials exist in .env, connect to SMTP server
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 465),
      secure: Number(SMTP_PORT || 465) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    isEthereal = false;
    console.log('[Mailer] Connected to configured SMTP server');
    return cachedTransporter;
  }

  // 2. Local dev fallback: Create Ethereal test account (No crash!)
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    isEthereal = true;
    console.log('[Mailer] Using Ethereal Test Account (No real SMTP in .env)');
    return cachedTransporter;
  } catch (err) {
    console.warn('[Mailer] Offline fallback mode:', err.message);
    return null;
  }
}

/**
 * Universal Mail Sending Function
 * @param {Object} options
 * @param {string} options.to - Receiver email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 */
export async function sendMail({ to, subject, html }) {
  if (!to) throw new Error("Receiver email 'to' is required");

  const transporter = await getTransporter();
  const from = process.env.SMTP_FROM || `"BrandClothzy" <${process.env.SMTP_USER || 'noreply@brandclothzy.com'}>`;

  const mailOptions = { from, to, subject, html };

  if (!transporter) {
    console.log(`[Mailer Mock] Sent to: ${to} | Subject: ${subject}`);
    return { success: true, mocked: true };
  }

  const info = await transporter.sendMail(mailOptions);

  let previewUrl = null;
  if (isEthereal) {
    previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`\n==================================================`);
    console.log(`🎉 [TEST EMAIL DISPATCHED SUCCESSFULLY!]`);
    console.log(`Recipient: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`🔗 Click below to preview live HTML email in browser:`);
    console.log(`👉 ${previewUrl}`);
    console.log(`==================================================\n`);
  }

  return { success: true, messageId: info.messageId, previewUrl };
}
