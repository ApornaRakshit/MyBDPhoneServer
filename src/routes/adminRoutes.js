const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserProfile,
  updateUserStatus,
  updateUserKyc,
} = require('../controllers/adminController');
const {
  createUser,
  getPayments,
  verifyPayment,
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getSubscriptions,
  extendSubscription,
  createManualSubscription,
} = require('../controllers/adminCommerceController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { getAdminNotifications, markAdminNotificationRead, markAllAdminNotificationsRead } = require('../controllers/adminNotificationController');

const paymentMethodLogoDir = path.join(__dirname, '..', '..', 'uploads', 'payment-methods');
fs.mkdirSync(paymentMethodLogoDir, { recursive: true });
const paymentMethodLogoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, paymentMethodLogoDir),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ['image/png','image/jpeg','image/webp','image/svg+xml'].includes(file.mimetype)),
});

router.get('/dashboard-stats', protect, adminOnly, getDashboardStats);
router.get('/notifications', protect, adminOnly, getAdminNotifications);
router.put('/notifications/:id/read', protect, adminOnly, markAdminNotificationRead);
router.put('/notifications/all/read', protect, adminOnly, markAllAdminNotificationsRead);
router.post('/notifications/mark-all-read', protect, adminOnly, markAllAdminNotificationsRead);
router.get('/users', protect, adminOnly, getAllUsers);
router.post('/users', protect, adminOnly, createUser);
router.get('/users/:id', protect, adminOnly, getUserDetails);
router.put('/users/:id/profile', protect, adminOnly, updateUserProfile);
router.put('/users/:id/status', protect, adminOnly, updateUserStatus);
router.put('/users/:id/kyc', protect, adminOnly, updateUserKyc);

// Billing / verification control room
router.get('/payments', protect, adminOnly, getPayments);
router.put('/payments/:id/verify', protect, adminOnly, verifyPayment);
router.get('/payment-methods', protect, adminOnly, getPaymentMethods);
router.post('/payment-methods', protect, adminOnly, paymentMethodLogoUpload.single('logo'), createPaymentMethod);
router.put('/payment-methods/:id', protect, adminOnly, paymentMethodLogoUpload.single('logo'), updatePaymentMethod);
router.delete('/payment-methods/:id', protect, adminOnly, deletePaymentMethod);
router.get('/subscriptions', protect, adminOnly, getSubscriptions);
router.post('/subscriptions/manual', protect, adminOnly, createManualSubscription);
router.put('/subscriptions/:id/extend', protect, adminOnly, extendSubscription);

// Pages & Sections CMS CRUD under /api/admin
const cms = require('../controllers/cmsController');
router.get('/pages', protect, adminOnly, cms.listPages);
router.post('/pages', protect, adminOnly, cms.createPage);
router.put('/pages/:id', protect, adminOnly, cms.updatePage);
router.delete('/pages/:id', protect, adminOnly, cms.deletePage);
router.put('/pages/:id/toggle', protect, adminOnly, cms.togglePage);
router.get('/pages/:pageId/sections', protect, adminOnly, cms.listSections);
router.post('/pages/:pageId/sections', protect, adminOnly, cms.createSection);
router.get('/sections/:id', protect, adminOnly, cms.getSection);
router.put('/sections/:id', protect, adminOnly, cms.updateSection);
router.put('/sections/:id/toggle', protect, adminOnly, cms.toggleSection);
router.delete('/sections/:id', protect, adminOnly, cms.deleteSection);
router.put('/sections/reorder', protect, adminOnly, cms.reorderSections);

module.exports = router;
