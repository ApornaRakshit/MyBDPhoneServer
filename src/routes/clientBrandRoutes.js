const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const c = require("../controllers/clientBrandController");

const uploadDir = path.join(__dirname, "..", "..", "uploads", "brands");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const base = path
      .basename(file.originalname || "brand-logo", ext)
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "logo";
    cb(null, `${Date.now()}-${base}${ext || ".png"}`);
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(png|jpe?g|webp|svg\+xml|gif)$/i.test(
      file.mimetype || ""
    );
    cb(
      ok ? null : new Error("Only PNG, JPG, WEBP, GIF or SVG images are allowed"),
      ok
    );
  },
});

// ===================================
// PUBLIC ROUTES
// ===================================
router.get("/", c.getPublicBrands);

// ===================================
// ADMIN ROUTES (Protected)
// ===================================
router.get("/admin", protect, adminOnly, c.getAdminBrands);
router.post(
  "/upload",
  protect,
  adminOnly,
  imageUpload.any(),
  c.uploadBrandLogo
);
router.put("/reorder", protect, adminOnly, c.reorderBrands);
router.get("/:id", protect, adminOnly, c.getBrandById);
router.post(
  "/",
  protect,
  adminOnly,
  imageUpload.any(),
  c.createBrand
);
router.put(
  "/:id",
  protect,
  adminOnly,
  imageUpload.any(),
  c.updateBrand
);
router.put("/:id/toggle", protect, adminOnly, c.toggleBrandVisibility);
router.delete("/:id", protect, adminOnly, c.deleteBrand);

module.exports = router;
