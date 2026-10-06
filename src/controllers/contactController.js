const pool = require("../config/db");
const { notifyAdmins } = require("../services/adminNotificationService");

const ensureContactTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_inquiries (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        subject VARCHAR(150) NULL,
        message TEXT NOT NULL,
        status ENUM('new', 'read', 'contacted', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'new',
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        admin_notes TEXT NULL,
        responded_by INT UNSIGNED NULL,
        responded_at DATETIME NULL,
        ip_address VARCHAR(45) NULL,
        user_agent VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_contact_inquiries_status (status),
        INDEX idx_contact_inquiries_is_read (is_read),
        INDEX idx_contact_inquiries_created (created_at),
        FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Safe column migrations in case of existing table
    const safeAlter = async (sql) => {
      try {
        await pool.query(sql);
      } catch (e) {
        if (!["ER_DUP_FIELDNAME", "ER_DUP_KEYNAME"].includes(e.code)) {
          // ignore duplicate
        }
      }
    };
    await safeAlter(`ALTER TABLE contact_inquiries ADD COLUMN subject VARCHAR(150) NULL AFTER phone;`);
    await safeAlter(`ALTER TABLE contact_inquiries ADD COLUMN admin_notes TEXT NULL AFTER is_read;`);
    await safeAlter(`ALTER TABLE contact_inquiries ADD COLUMN responded_by INT UNSIGNED NULL AFTER admin_notes;`);
    await safeAlter(`ALTER TABLE contact_inquiries ADD COLUMN responded_at DATETIME NULL AFTER responded_by;`);
    await safeAlter(`ALTER TABLE contact_inquiries ADD COLUMN ip_address VARCHAR(45) NULL AFTER responded_at;`);
    await safeAlter(`ALTER TABLE contact_inquiries ADD COLUMN user_agent VARCHAR(255) NULL AFTER ip_address;`);
  } catch (error) {
    console.error("Error creating contact_inquiries table:", error.message);
  }
};

const validateEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim());
};

const validatePhone = (phone) => {
  if (!phone || typeof phone !== "string") return false;
  const cleaned = phone.replace(/[\s\-()]/g, "");
  // Strictly matches Bangladesh mobile (013-019XXXXXXXX, +8801..., 8801...) or IP/PBX (096..., +88096...)
  const bdMobileRegex = /^(?:\+?880|880|0)1[3-9]\d{8}$/;
  const bdIpRegex = /^(?:\+?880|880|0)96\d{8,9}$/;
  return bdMobileRegex.test(cleaned) || bdIpRegex.test(cleaned);
};

/**
 * Public: Submit contact form inquiry
 */
const submitContactInquiry = async (req, res) => {
  try {
    await ensureContactTables();

    const { name, email, phone, subject, message } = req.body;

    if (!name || typeof name !== "string" || !name.trim() || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid full name (minimum 2 characters).",
      });
    }

    if (!phone || typeof phone !== "string" || !phone.trim() || !validatePhone(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number (e.g. 017XXXXXXXX or +8801XXXXXXXXX).",
      });
    }

    if (!email || typeof email !== "string" || !email.trim() || !validateEmail(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address (e.g. name@company.com).",
      });
    }

    if (!message || typeof message !== "string" || !message.trim() || message.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Please provide a message description with at least 5 characters.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanSubject = (subject || "").trim() || "General Inquiry";
    const cleanMessage = message.trim();
    const ipAddress = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().slice(0, 45);
    const userAgent = (req.headers["user-agent"] || "").slice(0, 255);

    const [result] = await pool.query(
      `INSERT INTO contact_inquiries (name, email, phone, subject, message, status, is_read, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, 'new', 0, ?, ?)`,
      [cleanName, cleanEmail, cleanPhone, cleanSubject, cleanMessage, ipAddress, userAgent]
    );

    const inquiryId = result.insertId;

    // Send admin notification
    try {
      await notifyAdmins(null, {
        title: "New Contact Inquiry",
        message: `${cleanName} (${cleanPhone}) sent an inquiry: "${cleanSubject}" - ${cleanMessage.slice(0, 80)}${cleanMessage.length > 80 ? "..." : ""}`,
        type: "contact_inquiry",
        link: "/admin/inquiries",
        entityType: "contact_inquiry",
        entityId: inquiryId,
      });
    } catch (notifErr) {
      console.error("Admin notification error for contact inquiry:", notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Thank you for reaching out! Your inquiry has been submitted successfully.",
      inquiry_id: inquiryId,
    });
  } catch (error) {
    console.error("SUBMIT CONTACT INQUIRY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while submitting your inquiry. Please try again or call our hotline.",
    });
  }
};

/**
 * Admin: Get all inquiries with stats, search & filters
 */
const getAdminInquiries = async (req, res) => {
  try {
    await ensureContactTables();

    const { status, search, is_read } = req.query;
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    let whereClauses = [];
    let params = [];

    if (status && status !== "all") {
      whereClauses.push("ci.status = ?");
      params.push(status);
    }

    if (typeof is_read !== "undefined" && is_read !== "") {
      whereClauses.push("ci.is_read = ?");
      params.push(Number(is_read) === 1 ? 1 : 0);
    }

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      whereClauses.push("(ci.name LIKE ? OR ci.email LIKE ? OR ci.phone LIKE ? OR ci.subject LIKE ? OR ci.message LIKE ?)");
      params.push(s, s, s, s, s);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const [inquiries] = await pool.query(
      `SELECT ci.*, 
              u.name AS responder_name, 
              u.email AS responder_email
       FROM contact_inquiries ci
       LEFT JOIN users u ON ci.responded_by = u.id
       ${whereSql}
       ORDER BY ci.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const [[counts]] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(is_read = 0) AS unread,
        SUM(status = 'new') AS new_count,
        SUM(status = 'contacted') AS contacted_count,
        SUM(status = 'in_progress') AS in_progress_count,
        SUM(status = 'resolved') AS resolved_count,
        SUM(status = 'closed') AS closed_count
      FROM contact_inquiries
    `);

    return res.json({
      success: true,
      inquiries,
      stats: {
        total: Number(counts?.total || 0),
        unread: Number(counts?.unread || 0),
        new: Number(counts?.new_count || 0),
        contacted: Number(counts?.contacted_count || 0),
        in_progress: Number(counts?.in_progress_count || 0),
        resolved: Number(counts?.resolved_count || 0),
        closed: Number(counts?.closed_count || 0),
      },
      page,
      limit,
    });
  } catch (error) {
    console.error("GET ADMIN INQUIRIES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact inquiries.",
    });
  }
};

/**
 * Admin: Get single inquiry by ID
 */
const getAdminInquiryById = async (req, res) => {
  try {
    await ensureContactTables();
    const id = Number(req.params.id);

    const [inquiries] = await pool.query(
      `SELECT ci.*, 
              u.name AS responder_name, 
              u.email AS responder_email
       FROM contact_inquiries ci
       LEFT JOIN users u ON ci.responded_by = u.id
       WHERE ci.id = ? LIMIT 1`,
      [id]
    );

    if (!inquiries.length) {
      return res.status(404).json({ success: false, message: "Inquiry not found." });
    }

    return res.json({
      success: true,
      inquiry: inquiries[0],
    });
  } catch (error) {
    console.error("GET INQUIRY ERROR:", error);
    return res.status(500).json({ success: false, message: "Error fetching inquiry details." });
  }
};

/**
 * Admin: Update inquiry status and notes
 */
const updateInquiryStatus = async (req, res) => {
  try {
    await ensureContactTables();
    const id = Number(req.params.id);
    const { status, is_read, admin_notes } = req.body;

    const [existing] = await pool.query("SELECT id FROM contact_inquiries WHERE id = ?", [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: "Inquiry not found." });
    }

    const updates = [];
    const params = [];

    if (status) {
      updates.push("status = ?");
      params.push(status);
    }
    if (typeof is_read !== "undefined") {
      updates.push("is_read = ?");
      params.push(Number(is_read) === 1 ? 1 : 0);
    }
    if (typeof admin_notes !== "undefined") {
      updates.push("admin_notes = ?");
      params.push(admin_notes);
    }

    updates.push("responded_by = ?");
    params.push(req.user.id);

    updates.push("responded_at = NOW()");

    params.push(id);

    await pool.query(
      `UPDATE contact_inquiries SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    const [updated] = await pool.query(
      `SELECT ci.*, u.name AS responder_name, u.email AS responder_email 
       FROM contact_inquiries ci 
       LEFT JOIN users u ON ci.responded_by = u.id 
       WHERE ci.id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: "Inquiry updated successfully.",
      inquiry: updated[0],
    });
  } catch (error) {
    console.error("UPDATE INQUIRY STATUS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update inquiry." });
  }
};

/**
 * Admin: Mark inquiry read / unread
 */
const markInquiryRead = async (req, res) => {
  try {
    await ensureContactTables();
    const id = Number(req.params.id);
    const is_read = typeof req.body.is_read !== "undefined" ? (req.body.is_read ? 1 : 0) : 1;

    await pool.query(
      "UPDATE contact_inquiries SET is_read = ? WHERE id = ?",
      [is_read, id]
    );

    return res.json({
      success: true,
      message: is_read ? "Inquiry marked as read." : "Inquiry marked as unread.",
    });
  } catch (error) {
    console.error("MARK INQUIRY READ ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update read state." });
  }
};

/**
 * Admin: Mark all inquiries as read
 */
const markAllInquiriesRead = async (req, res) => {
  try {
    await ensureContactTables();
    const [result] = await pool.query(
      "UPDATE contact_inquiries SET is_read = 1 WHERE is_read = 0"
    );

    return res.json({
      success: true,
      message: "All inquiries marked as read.",
      updated: result.affectedRows,
    });
  } catch (error) {
    console.error("MARK ALL INQUIRIES READ ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to mark all as read." });
  }
};

/**
 * Admin: Delete inquiry
 */
const deleteInquiry = async (req, res) => {
  try {
    await ensureContactTables();
    const id = Number(req.params.id);

    const [result] = await pool.query("DELETE FROM contact_inquiries WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Inquiry not found." });
    }

    return res.json({
      success: true,
      message: "Inquiry deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE INQUIRY ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to delete inquiry." });
  }
};

module.exports = {
  ensureContactTables,
  submitContactInquiry,
  getAdminInquiries,
  getAdminInquiryById,
  updateInquiryStatus,
  markInquiryRead,
  markAllInquiriesRead,
  deleteInquiry,
};
