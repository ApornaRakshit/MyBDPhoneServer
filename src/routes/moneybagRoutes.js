const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const {
  createOrderCheckout,
  verifyResult,
  callback,
  configStatus,
} = require('../controllers/moneybagController');

// Create a hosted checkout for an already-created MyBDPhone order.
router.post('/checkout', protect, createOrderCheckout);
router.post('/verify-result', verifyResult);
router.get('/config-status', protect, adminOnly, configStatus);

// Browser return/callback from Moneybag. The callback itself never trusts the
// redirect as proof; it only captures identifiers and triggers server-side verification when possible.
router.get('/callback', callback);
router.post('/callback', callback);

module.exports = router;
