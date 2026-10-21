import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import cors from 'cors';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import { sendMail } from './lib/mailer.js';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const razorpay = process.env.RAZORPAY_KEY_ID
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    })
  : null;

// Decode QR code from Razorpay's branded PNG to extract raw UPI URL
async function decodeQrImage(imageUrl) {
  const resp = await fetch(imageUrl, { redirect: 'follow' });
  const buffer = Buffer.from(await resp.arrayBuffer());
  const png = PNG.sync.read(buffer);
  const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  return code?.data || null;
}

// Create a Razorpay order + QR code
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, receipt, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!razorpay) {
      return res.status(500).json({ error: 'Razorpay keys not configured' });
    }

    // Create Razorpay order (amount in paise)
    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency: 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    });

    // Create QR code for this order
    const qrCode = await razorpay.qrCode.create({
      type: 'upi_qr',
      name: 'BrandClothzy Order',
      usage: 'single_use',
      fixed_amount: true,
      payment_amount: Math.round(amount),
      description: `Order ${order.id}`,
      close_by: Math.floor(Date.now() / 1000) + 300, // 5 min expiry
      notes: { order_id: order.id },
    });

    // Decode the branded QR image to extract the raw UPI payment URL
    const qrPaymentUrl = await decodeQrImage(qrCode.image_url);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      qrCodeId: qrCode.id,
      qrPaymentUrl,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Check payment status for an order
app.get('/api/order-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await razorpay.orders.fetch(orderId);

    // Fetch payments for this order
    const payments = await razorpay.orders.fetchPayments(orderId);
    const successPayment = payments.items?.find((p) => p.status === 'captured');

    res.json({
      orderId: order.id,
      status: order.status, // created | attempted | paid
      amountPaid: order.amount_paid,
      paymentId: successPayment?.id || null,
      paid: order.status === 'paid',
    });
  } catch (err) {
    console.error('Order status error:', err);
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
});

// Verify payment signature
app.post('/api/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment details', verified: false });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const verified = expectedSignature === razorpay_signature;

    res.json({ verified });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: 'Verification failed', verified: false });
  }
});

// Get public key for frontend checkout
app.get('/api/config', (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

// Close/expire a QR code
app.post('/api/close-qr/:qrCodeId', async (req, res) => {
  try {
    const { qrCodeId } = req.params;
    const result = await razorpay.qrCode.close(qrCodeId);
    res.json({ closed: true, id: result.id });
  } catch (err) {
    console.error('Close QR error:', err);
    res.status(500).json({ error: 'Failed to close QR code' });
  }
});

// Universal Email Endpoint
app.post('/api/send-email', async (req, res) => {
  const { to, type = 'welcome', name, data, subject: customSubject, html: customHtml } = req.body;

  console.log(`\n==================================================`);
  console.log(`📧 [Incoming Email Request] To: ${to} | Type: ${type} | Name: ${name || 'Customer'}`);
  console.log(`==================================================`);

  if (!to) {
    return res.status(400).json({ error: "Receiver email 'to' is required" });
  }

  try {
    let subject = customSubject || 'Welcome to BrandClothzy';
    let html = customHtml;

    if (!html) {
      if (type === 'welcome') {
        const customerName = name || 'Valued Member';
        subject = `Welcome to BrandClothzy, ${customerName}`;
        html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to BrandClothzy</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;padding:40px 10px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#181818;border:1px solid #282828;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:40px 30px;text-align:center;border-bottom:1px solid #282828;background-color:#121212;">
              <h1 style="margin:0;font-size:24px;letter-spacing:4px;text-transform:uppercase;color:#d4af37;font-weight:700;">BrandClothzy</h1>
              <p style="margin:8px 0 0;font-size:11px;letter-spacing:2px;color:#888888;text-transform:uppercase;">Luxury Indian Fashion</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 35px;">
              <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#ffffff;">Welcome to BrandClothzy, ${customerName}.</h2>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#b3b3b3;">
                Your BrandClothzy account is officially active. Step into a curated world where master Indian craftsmanship meets high-fashion luxury.
              </p>
              <div style="background-color:#202020;border-left:3px solid #d4af37;padding:16px 20px;margin:25px 0;">
                <p style="margin:0;font-size:13px;color:#e0e0e0;line-height:1.6;">
                  Enjoy complimentary express delivery on orders above ₹999, bespoke couture tailoring access, and private drops reserved for members.
                </p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://brandclothzy.com" style="display:inline-block;background-color:#d4af37;color:#0f0f0f;text-decoration:none;padding:14px 32px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;border-radius:4px;">
                      Explore Collection
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:25px 0 0;font-size:12px;color:#777777;line-height:1.6;">
                If you have any questions or bespoke inquiries, simply reply to this email or reach us at contact@brandclothzy.com.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:25px 30px;background-color:#121212;border-top:1px solid #282828;text-align:center;">
              <p style="margin:0;font-size:11px;color:#666666;letter-spacing:1px;">
                © ${new Date().getFullYear()} BrandClothzy · Burptech Private Limited
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;
      } else if (type === 'order_confirmed') {
        const orderId = data?.orderId || `BCZ-${Date.now().toString().slice(-6)}`;
        const total = data?.total || 0;
        subject = `Order Confirmation #${orderId} — BrandClothzy`;
        html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background-color:#111;color:#fff;padding:30px;">
  <div style="max-width:500px;margin:auto;background:#1a1a1a;padding:30px;border:1px solid #333;border-radius:6px;">
    <h2 style="color:#d4af37;letter-spacing:2px;text-transform:uppercase;margin-top:0;">BrandClothzy</h2>
    <h3>Thank you for your order, ${name || 'Customer'}!</h3>
    <p>Your order <strong>#${orderId}</strong> has been received and is being processed by master artisans.</p>
    <div style="padding:15px;background:#242424;margin:20px 0;">
      <p style="margin:0;font-size:16px;"><strong>Total:</strong> ₹${Number(total).toLocaleString('en-IN')}</p>
    </div>
    <p style="font-size:12px;color:#888;">We will notify you once your order is dispatched.</p>
  </div>
</body>
</html>
        `;
      }
    }

    const result = await sendMail({ to, subject, html });
    res.json({
      success: true,
      messageId: result.messageId,
      previewUrl: result.previewUrl || null,
      mocked: result.mocked || false,
    });
  } catch (err) {
    console.error('[Email Error]:', err);
    res.status(200).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
