const express = require("express");
const router = express.Router();
const {
  checkout,
  manualCheckout,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const proofDir = path.join(__dirname, '..', '..', 'uploads', 'payment-proofs');
fs.mkdirSync(proofDir, { recursive: true });
const proofStorage = multer.diskStorage({ destination: proofDir, filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname).toLowerCase()}`) });
const uploadProof = multer({ storage: proofStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, ['image/png','image/jpeg','image/webp','application/pdf'].includes(file.mimetype)) });
const { adminOnly } = require("../middleware/adminMiddleware");

router.post("/checkout", protect, checkout);
router.post("/manual", protect, uploadProof.single("proof"), manualCheckout);
router.get("/my", protect, getMyOrders);

// Admin
router.get("/admin/all", protect, adminOnly, getAllOrders);
router.put("/admin/:id/status", protect, adminOnly, updateOrderStatus);

module.exports = router;

