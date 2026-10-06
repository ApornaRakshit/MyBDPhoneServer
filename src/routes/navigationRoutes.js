const express = require("express");
const router = express.Router();
const {
  getPublicNavigation,
  getAllNavigationAdmin,
  createNavigationItem,
  updateNavigationItem,
  toggleItemVisibility,
  deleteNavigationItem,
  reorderNavigation,
  resetDefaultNavigation,
} = require("../controllers/navigationController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// Public Endpoint (Used by Navbar)
router.get("/public", getPublicNavigation);

// Admin Endpoints
router.get("/admin/all", protect, adminOnly, getAllNavigationAdmin);
router.post("/admin/item", protect, adminOnly, createNavigationItem);
router.put("/admin/item/:id", protect, adminOnly, updateNavigationItem);
router.patch("/admin/item/:id/toggle-visibility", protect, adminOnly, toggleItemVisibility);
router.delete("/admin/item/:id", protect, adminOnly, deleteNavigationItem);
router.put("/admin/reorder", protect, adminOnly, reorderNavigation);
router.post("/admin/reset-default", protect, adminOnly, resetDefaultNavigation);

module.exports = router;

