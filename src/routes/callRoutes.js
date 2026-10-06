const express = require("express");
const router = express.Router();
const { getMyCalls, getAllCalls, simulateTestCall } = require("../controllers/callController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

router.get("/my", protect, getMyCalls);
router.post("/simulate", protect, simulateTestCall);

// Admin
router.get("/admin/all", protect, adminOnly, getAllCalls);

module.exports = router;

