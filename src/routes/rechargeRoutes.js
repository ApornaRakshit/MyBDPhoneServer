const express = require("express");
const router = express.Router();
const {
  processRecharge,
  getMyRecharges,
  getAllRecharges,
  manualBalanceAdjustment,
} = require("../controllers/rechargeController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

router.post("/process", protect, processRecharge);
router.get("/my-history", protect, getMyRecharges);

// Admin
router.get("/admin/all", protect, adminOnly, getAllRecharges);
router.post("/admin/adjust-balance", protect, adminOnly, manualBalanceAdjustment);

module.exports = router;

