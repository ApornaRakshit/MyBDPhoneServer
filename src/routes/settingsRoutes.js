const express = require("express");
const router = express.Router();
const {
  getPublicSettings,
  getAllSettings,
  updateSettings,
} = require("../controllers/settingsController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

router.get("/public", getPublicSettings);

// Admin
router.get("/admin/all", protect, adminOnly, getAllSettings);
router.put("/admin/update", protect, adminOnly, updateSettings);

module.exports = router;

