const express = require("express");
const router = express.Router();
const {
  getMyTickets,
  createTicket,
  getTicketById,
  replyTicket,
  getAllTickets,
  updateTicketStatus,
} = require("../controllers/ticketController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

router.get("/my", protect, getMyTickets);
router.post("/create", protect, createTicket);
router.get("/:id", protect, getTicketById);
router.post("/:id/reply", protect, replyTicket);
router.put("/:id/status", protect, updateTicketStatus);

// Admin
router.get("/admin/all", protect, adminOnly, getAllTickets);

module.exports = router;

