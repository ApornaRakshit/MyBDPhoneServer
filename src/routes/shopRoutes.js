const express = require("express");
const router = express.Router();
const {
  getShopProducts,
  getShopProductById,
  createShopProduct,
  updateShopProduct,
  toggleShopProduct,
  deleteShopProduct,
} = require("../controllers/shopController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// Public / User routes
router.get("/products", getShopProducts);
router.get("/products/:id", getShopProductById);

// Admin routes
router.post("/products", protect, adminOnly, createShopProduct);
router.put("/products/:id", protect, adminOnly, updateShopProduct);
router.patch("/products/:id/toggle", protect, adminOnly, toggleShopProduct);
router.delete("/products/:id", protect, adminOnly, deleteShopProduct);

module.exports = router;
