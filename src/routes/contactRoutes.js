const express = require("express");
const router = express.Router();
const {
  submitContactInquiry,
  getAdminInquiries,
  getAdminInquiryById,
  updateInquiryStatus,
  markInquiryRead,
  markAllInquiriesRead,
  deleteInquiry,
} = require("../controllers/contactController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// Public routes for contact form submission
router.post("/submit", submitContactInquiry);
router.post("/inquiry", submitContactInquiry);

// Admin Control Room routes
router.get("/admin/inquiries", protect, adminOnly, getAdminInquiries);
router.get("/admin/inquiries/:id", protect, adminOnly, getAdminInquiryById);
router.put("/admin/inquiries/mark-all-read", protect, adminOnly, markAllInquiriesRead);
router.put("/admin/inquiries/:id/status", protect, adminOnly, updateInquiryStatus);
router.put("/admin/inquiries/:id/read", protect, adminOnly, markInquiryRead);
router.delete("/admin/inquiries/:id", protect, adminOnly, deleteInquiry);

module.exports = router;
