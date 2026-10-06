const express = require("express");
const router = express.Router();
const {
  getVoices,
  getMyAiOverview,
  createCampaign,
  toggleCampaignStatus,
  deleteCampaign,
  getAllAiCampaigns,
} = require("../controllers/aiCallingController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// Public
router.get("/voices", getVoices);

// User Protected
router.get("/my-overview", protect, getMyAiOverview);
router.post("/campaigns", protect, createCampaign);
router.put("/campaigns/:id/status", protect, toggleCampaignStatus);
router.delete("/campaigns/:id", protect, deleteCampaign);

// Admin Protected
router.get("/admin/all-campaigns", protect, adminOnly, getAllAiCampaigns);

module.exports = router;

