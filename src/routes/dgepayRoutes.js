const express = require("express");
const router = express.Router();

const {
  testAuthentication,
  getConfigStatus,
  createOrGetGatewayPayment,
  testInitiate,
  checkOrderPaymentStatus,
  checkPaymentByTxnId,
  verifyCallbackResult,
  callback,
} = require("../controllers/dgepayController");
const { protect } = require("../middleware/authMiddleware");

router.get("/config-status", protect, getConfigStatus);
router.get("/test-auth", testAuthentication);

// Normal order payment flow
router.post("/initiate", protect, createOrGetGatewayPayment);
router.post("/initialize", protect, createOrGetGatewayPayment);
router.get("/status/:orderId", protect, checkOrderPaymentStatus);
router.get("/status/transaction/:uniqueTxnId", protect, checkPaymentByTxnId);
router.post("/verify-result", protect, verifyCallbackResult);

// Development-only direct UAT gateway test
router.post("/test-initiate", protect, testInitiate);

// DGePay browser redirect / IPN callback
router.get("/callback", callback);
router.post("/callback", callback);

module.exports = router;
