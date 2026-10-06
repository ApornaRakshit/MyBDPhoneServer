const express = require("express");

const router = express.Router();

const {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  me,
  updateProfile,
  changePhone,
  requestEmailChange,
  changePassword,
  submitKYC,
  getNotifications,
  markNotificationRead,
  adminForgotPassword,
  adminResetPassword,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

// Authentication
router.post("/register", register);
router.post("/login", login);

// Email verification
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

// Password recovery
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Admin password recovery compatibility
router.post("/admin/forgot-password", adminForgotPassword);
router.post("/admin/reset-password", adminResetPassword);

// Authenticated user
router.get("/me", protect, me);

// Profile / account settings
router.put("/profile", protect, updateProfile);
router.post("/change-phone", protect, changePhone);
router.post("/request-email-change", protect, requestEmailChange);
router.post("/change-password", protect, changePassword);

// KYC
router.post("/kyc", protect, submitKYC);

// Notifications
router.get("/notifications", protect, getNotifications);
router.put("/notifications/:id/read", protect, markNotificationRead);

module.exports = router;
