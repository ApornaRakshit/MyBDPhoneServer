const express = require("express");
const router = express.Router();
const {
  getPublicFeaturePage,
  getAdminFeaturePages,
  createAdminFeaturePage,
  updateAdminFeaturePage,
  deleteAdminFeaturePage,
} = require("../controllers/featureController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// Admin CRUD (when mounted at /api/admin/features OR accessed via /api/features/admin)
router.get("/admin/all", protect, adminOnly, getAdminFeaturePages);
router.post("/admin/create", protect, adminOnly, createAdminFeaturePage);
router.put("/admin/:id", protect, adminOnly, updateAdminFeaturePage);
router.delete("/admin/:id", protect, adminOnly, deleteAdminFeaturePage);

// Standard root handlers for /api/admin/features
router.get("/admin", protect, adminOnly, getAdminFeaturePages);
router.post("/admin", protect, adminOnly, createAdminFeaturePage);

// Also direct root paths when mounted on /api/admin/features
router.get("/", (req, res, next) => {
  if (req.baseUrl.includes("/admin/features")) {
    return protect(req, res, () => adminOnly(req, res, () => getAdminFeaturePages(req, res)));
  }
  return next();
});

router.post("/", (req, res, next) => {
  if (req.baseUrl.includes("/admin/features")) {
    return protect(req, res, () => adminOnly(req, res, () => createAdminFeaturePage(req, res)));
  }
  return next();
});

router.put("/:id", (req, res, next) => {
  if (req.baseUrl.includes("/admin/features")) {
    return protect(req, res, () => adminOnly(req, res, () => updateAdminFeaturePage(req, res)));
  }
  return next();
});

router.delete("/:id", (req, res, next) => {
  if (req.baseUrl.includes("/admin/features")) {
    return protect(req, res, () => adminOnly(req, res, () => deleteAdminFeaturePage(req, res)));
  }
  return next();
});

// Public slug endpoint: GET /api/features/:slug
router.get("/:slug", getPublicFeaturePage);

module.exports = router;
