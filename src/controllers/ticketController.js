const pool = require("../config/db");

// GET USER TICKETS
const getMyTickets = async (req, res) => {
  try {
    const [tickets] = await pool.query(
      `
      SELECT t.*, 
        (SELECT COUNT(*) FROM ticket_messages m WHERE m.ticket_id = t.id) AS reply_count
      FROM support_tickets t
      WHERE t.user_id = ?
      ORDER BY t.updated_at DESC
      `,
      [req.user.id]
    );

    return res.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("GET TICKETS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching tickets",
    });
  }
};

// CREATE TICKET
const createTicket = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { department = "technical", subject, message, priority = "medium" } = req.body;

    if (!subject || !message) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: "Subject and message description are required",
      });
    }

    await connection.beginTransaction();

    const ticketCode = `TCK-${Date.now().toString().slice(-6)}`;

    const [result] = await connection.query(
      `
      INSERT INTO support_tickets (ticket_code, user_id, department, subject, message, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, 'open')
      `,
      [ticketCode, req.user.id, department, subject, message, priority]
    );

    const ticketId = result.insertId;

    // Add first initial message
    await connection.query(
      `
      INSERT INTO ticket_messages (ticket_id, user_id, sender_type, message)
      VALUES (?, ?, 'user', ?)
      `,
      [ticketId, req.user.id, message]
    );

    await connection.commit();
    connection.release();

    return res.status(201).json({
      success: true,
      message: `Support ticket #${ticketCode} created successfully! Our engineers will respond shortly.`,
      ticketId,
      ticketCode,
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("CREATE TICKET ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating support ticket",
    });
  }
};

// GET TICKET DETAILS WITH MESSAGES
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    // If user, ensure it's their ticket or admin
    let ticketQuery = "SELECT t.*, u.name AS user_name, u.email AS user_email FROM support_tickets t JOIN users u ON t.user_id = u.id WHERE t.id = ? OR t.ticket_code = ?";
    const [tickets] = await pool.query(ticketQuery, [id, id]);

    if (tickets.length === 0) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const ticket = tickets[0];

    if (req.user.role !== "admin" && ticket.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const [messages] = await pool.query(
      `
      SELECT m.*, u.name AS sender_name, u.role AS sender_role, u.avatar AS sender_avatar
      FROM ticket_messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.ticket_id = ?
      ORDER BY m.created_at ASC
      `,
      [ticket.id]
    );

    return res.json({
      success: true,
      ticket,
      messages,
    });
  } catch (error) {
    console.error("GET TICKET ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// REPLY TO TICKET
const replyTicket = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { message, attachment } = req.body;

    if (!message) {
      connection.release();
      return res.status(400).json({ success: false, message: "Reply message cannot be empty" });
    }

    const [tickets] = await connection.query("SELECT * FROM support_tickets WHERE id = ?", [id]);
    if (tickets.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const ticket = tickets[0];
    const senderType = req.user.role === "admin" ? "admin" : "user";

    await connection.beginTransaction();

    await connection.query(
      `
      INSERT INTO ticket_messages (ticket_id, user_id, sender_type, message, attachment)
      VALUES (?, ?, ?, ?, ?)
      `,
      [id, req.user.id, senderType, message, attachment || null]
    );

    // Update ticket status & updated_at
    const newStatus = senderType === "admin" ? "waiting_for_user" : "in_progress";
    await connection.query(
      "UPDATE support_tickets SET status = ?, updated_at = NOW() WHERE id = ?",
      [newStatus, id]
    );

    // If admin replied, send notification to user
    if (senderType === "admin" && ticket.user_id !== req.user.id) {
      await connection.query(
        `
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'New Reply on Support Ticket', ?, 'support', ?)
        `,
        [
          ticket.user_id,
          `Our support team has replied to ticket #${ticket.ticket_code}: "${ticket.subject}"`,
          `/user/support/${ticket.id}`,
        ]
      );
    }

    await connection.commit();
    connection.release();

    return res.json({
      success: true,
      message: "Reply sent successfully!",
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("REPLY TICKET ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ADMIN: GET ALL TICKETS
const getAllTickets = async (req, res) => {
  try {
    const { status, department, priority, search } = req.query;

    let query = `
      SELECT t.*, u.name AS user_name, u.email AS user_email,
        (SELECT COUNT(*) FROM ticket_messages m WHERE m.ticket_id = t.id) AS reply_count
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += " AND t.status = ?";
      params.push(status);
    }
    if (department) {
      query += " AND t.department = ?";
      params.push(department);
    }
    if (priority) {
      query += " AND t.priority = ?";
      params.push(priority);
    }
    if (search) {
      query += " AND (t.ticket_code LIKE ? OR t.subject LIKE ? OR u.name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += " ORDER BY t.updated_at DESC";

    const [tickets] = await pool.query(query, params);

    return res.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("ADMIN TICKETS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// UPDATE TICKET STATUS / PRIORITY (Admin or User closing)
const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, department } = req.body;

    await pool.query(
      `
      UPDATE support_tickets
      SET
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        department = COALESCE(?, department)
      WHERE id = ?
      `,
      [status, priority, department, id]
    );

    return res.json({
      success: true,
      message: "Ticket updated successfully",
    });
  } catch (error) {
    console.error("UPDATE TICKET ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getMyTickets,
  createTicket,
  getTicketById,
  replyTicket,
  getAllTickets,
  updateTicketStatus,
};

