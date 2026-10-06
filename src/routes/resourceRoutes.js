const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const r = require("../controllers/resourceController");
const t = require("../controllers/ticketController");

// ==========================================
// PUBLIC RESOURCES ENDPOINTS
// ==========================================
router.get("/pages/:slug", r.getPublicResourcePage);
router.get("/guides", r.getProductGuides);
router.get("/guides/:slug", r.getProductGuideBySlug);
router.get("/faqs", r.getResourceFaqs);
router.get("/hardware", r.getHardwareProducts);
router.get("/hardware/:slug", r.getHardwareProductBySlug);

// Direct slug lookup on /api/resources/:slug
router.get("/:slug", (req, res, next) => {
  const skipSlugs = ["guides", "faqs", "hardware", "tickets", "admin"];
  if (skipSlugs.includes(req.params.slug)) {
    return next();
  }
  return r.getPublicResourcePage(req, res, next);
});

// ==========================================
// PROTECTED USER SUPPORT TICKET ENDPOINTS
// ==========================================
router.get("/tickets", protect, t.getMyTickets);
router.post("/tickets", protect, t.createTicket);
router.get("/tickets/:id", protect, t.getTicketById);
router.post("/tickets/:id/messages", protect, t.replyTicket);

// ==========================================
// ADMIN CMS CRUD ENDPOINTS (JWT + ADMIN PROTECTED)
// ==========================================
router.use("/admin", protect, adminOnly);

// Admin Resource Pages
router.put("/admin/pages/:slug", r.updateAdminResourcePage);
router.put("/admin/cms/resources/:slug", r.updateAdminResourcePage);
router.put("/admin/:slug", (req, res, next) => {
  const skipSlugs = ["sections", "guides", "faqs", "hardware", "tickets"];
  if (skipSlugs.includes(req.params.slug)) {
    return next();
  }
  return r.updateAdminResourcePage(req, res, next);
});

// Admin Sections
router.get("/admin/sections", r.adminGetSections);
router.post("/admin/sections", r.adminCreateSection);
router.put("/admin/sections/:id", r.adminUpdateSection);
router.delete("/admin/sections/:id", r.adminDeleteSection);

// Admin Guides
router.get("/admin/guides", r.adminGetGuides);
router.post("/admin/guides", r.adminCreateGuide);
router.put("/admin/guides/:id", r.adminUpdateGuide);
router.delete("/admin/guides/:id", r.adminDeleteGuide);

// Admin FAQs
router.get("/admin/faqs", r.adminGetFaqs);
router.post("/admin/faqs", r.adminCreateFaq);
router.put("/admin/faqs/:id", r.adminUpdateFaq);
router.delete("/admin/faqs/:id", r.adminDeleteFaq);

// Admin Hardware
router.get("/admin/hardware", r.adminGetHardware);
router.post("/admin/hardware", r.adminCreateHardware);
router.put("/admin/hardware/:id", r.adminUpdateHardware);
router.delete("/admin/hardware/:id", r.adminDeleteHardware);

// Admin Tickets Management
router.get("/admin/tickets", t.getAllTickets);
router.get("/admin/tickets/:id", t.getTicketById);
router.post("/admin/tickets/:id/reply", t.replyTicket);
router.put("/admin/tickets/:id/status", t.updateTicketStatus);

module.exports = router;
