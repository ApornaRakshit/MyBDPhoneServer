const express = require('express');
const router = express.Router();
const { getPublicPaymentMethods, getMyPayments } = require('../controllers/adminCommerceController');
const { protect } = require('../middleware/authMiddleware');
router.get('/public', getPublicPaymentMethods);
router.get('/my', protect, getMyPayments);
module.exports = router;
