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

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
