const express = require("express");
const router = express.Router();
const {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
} = require("../controllers/packageController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// Public routes
router.get("/", getAllPackages);
router.get("/:id", getPackageById);

// Admin routes (No-code package manager)
router.post("/", protect, adminOnly, createPackage);
router.put("/:id", protect, adminOnly, updatePackage);
router.delete("/:id", protect, adminOnly, deletePackage);

module.exports = router;

