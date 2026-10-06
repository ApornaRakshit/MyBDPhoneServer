const assert = require('assert');
const crypto = require('crypto');

process.env.MONEYBAG_ENV = 'production';
process.env.MONEYBAG_MERCHANT_API_KEY = 'TEST_MONEYBAG_KEY';
process.env.MONEYBAG_WEBHOOK_SECRET = 'TEST_MONEYBAG_SECRET';

const moneybag = require('../src/services/moneybagService');

const payload = moneybag.makeMoneybagCheckoutBody({
  orderRef: 'ORD-1234567890',
  amount: 500,
  description: 'MyBDPhone Test Payment',
  customer: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+8801700000000',
    city: 'Dhaka',
    country: 'Bangladesh',
  },
});

assert.strictEqual(payload.order_amount, '500.00');
assert.strictEqual(payload.currency, 'BDT');
assert.ok(payload.order_id.length >= 10 && payload.order_id.length <= 36);
assert.ok(payload.success_url.includes('/api/moneybag/callback'));

const rawBody = Buffer.from(JSON.stringify({ event: 'payment.succeeded', order_id: payload.order_id }));
const timestamp = Math.floor(Date.now() / 1000).toString();
const signature = 'sha256=' + crypto
  .createHmac('sha256', process.env.MONEYBAG_WEBHOOK_SECRET)
  .update(`${timestamp}.${rawBody.toString('utf8')}`, 'utf8')
  .digest('hex');

assert.strictEqual(moneybag.verifyWebhookSignature(rawBody, signature, timestamp).valid, true);
assert.strictEqual(moneybag.getConfig().baseUrl, 'https://api.moneybag.com.bd/api/v2');

console.log('Moneybag service tests passed.');
