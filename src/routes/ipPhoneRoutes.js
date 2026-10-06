const express = require("express");
const router = express.Router();
const {
  getAvailableNumbers,
  getMyIpPhone,
  updateIpPhoneSettings,
  getAllNumbers,
  addIpNumber,
  assignOrRevokeNumber,
} = require("../controllers/ipPhoneController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// Public
router.get("/available-numbers", getAvailableNumbers);

// User Protected
router.get("/my-service", protect, getMyIpPhone);
router.put("/my-service", protect, updateIpPhoneSettings);

// Admin Protected
router.get("/admin/all-numbers", protect, adminOnly, getAllNumbers);
router.post("/admin/add-number", protect, adminOnly, addIpNumber);
router.put("/admin/numbers/:id/assign-revoke", protect, adminOnly, assignOrRevokeNumber);

module.exports = router;

