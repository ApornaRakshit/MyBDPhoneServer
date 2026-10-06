const express = require("express");
const router = express.Router();
const { getMyTransactions, getAllTransactions } = require("../controllers/transactionController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

router.get("/my", protect, getMyTransactions);
router.get("/admin/all", protect, adminOnly, getAllTransactions);

module.exports = router;

