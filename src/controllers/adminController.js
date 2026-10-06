const pool = require("../config/db");

// ADMIN DASHBOARD STATS & ANALYTICS
const getDashboardStats = async (req, res) => {
  try {
    const [[users]] = await pool.query(
      "SELECT COUNT(*) AS total_users, SUM(status='active') AS active_users FROM users WHERE role='user'"
    );
    const [[revenue]] = await pool.query(
      "SELECT COALESCE(SUM(amount),0) AS total_revenue FROM orders WHERE payment_status='paid' AND status <> 'cancelled'"
    );
    const [[recharge]] = await pool.query(
      "SELECT COALESCE(SUM(amount),0) AS total_recharge FROM recharges WHERE status='completed'"
    );
    const [[subs]] = await pool.query(
      "SELECT SUM(service_type='ip_phone' AND status='active') AS active_ip_subscriptions, SUM(service_type='ai_calling' AND status='active') AS active_ai_subscriptions FROM user_subscriptions"
    );
    const [[calls]] = await pool.query(
      "SELECT COUNT(*) AS total_calls, COALESCE(SUM(duration_seconds),0) AS total_seconds, SUM(call_type='ai_outbound') AS total_ai_calls FROM call_logs"
    );
    const [[pendingOrders]] = await pool.query(
      "SELECT COUNT(*) AS count FROM orders WHERE status IN ('pending','processing') AND payment_status <> 'paid'"
    );
    const [[openTickets]] = await pool.query(
      "SELECT COUNT(*) AS count FROM support_tickets WHERE status IN ('open','in_progress','waiting_for_user')"
    );
    const [[pendingPayments]] = await pool.query(
      "SELECT COUNT(*) AS count FROM payments WHERE status IN ('pending','submitted') OR (status='approved' AND (order_id IN (SELECT id FROM orders WHERE payment_status='unpaid') OR recharge_id IN (SELECT id FROM recharges WHERE status='pending')))"
    );
    const [[pendingRecharges]] = await pool.query(
      "SELECT COUNT(*) AS count FROM recharges WHERE status='pending'"
    );
    let openInquiriesCount = 0;
    try {
      const [[inquiries]] = await pool.query(
        "SELECT COUNT(*) AS count FROM contact_inquiries WHERE status IN ('new', 'read', 'in_progress') OR is_read = 0"
      );
      openInquiriesCount = Number(inquiries?.count || 0);
    } catch (e) {
      // table may not exist yet
    }

    const [recentTransactions] = await pool.query(`
      SELECT t.*, u.name AS user_name, u.email AS user_email
      FROM transactions t JOIN users u ON t.user_id=u.id
      ORDER BY t.created_at DESC LIMIT 6`);
    const [recentOrders] = await pool.query(`
      SELECT o.*, u.name AS user_name
      FROM orders o JOIN users u ON o.user_id=u.id
      ORDER BY o.created_at DESC LIMIT 6`);

    // Actual monthly data for the last 6 calendar months, including the current month.
    const [monthlyRows] = await pool.query(`
      SELECT months.month,
             COALESCE((SELECT SUM(o.amount) FROM orders o WHERE o.payment_status='paid' AND o.status <> 'cancelled' AND DATE_FORMAT(o.created_at,'%Y-%m')=months.ym),0) AS revenue,
             COALESCE((SELECT SUM(r.amount) FROM recharges r WHERE r.status='completed' AND DATE_FORMAT(r.created_at,'%Y-%m')=months.ym),0) AS recharge,
             COALESCE((SELECT COUNT(*) FROM call_logs c WHERE DATE_FORMAT(c.created_at,'%Y-%m')=months.ym),0) AS calls
      FROM (
        SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL seq MONTH),'%Y-%m') AS ym,
               DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL seq MONTH),'%b') AS month
        FROM (SELECT 0 seq UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) s
      ) months
      ORDER BY months.ym ASC`);

    const [distributionRows] = await pool.query(`
      SELECT service_type, COUNT(*) AS count
      FROM user_subscriptions
      WHERE status='active'
      GROUP BY service_type`);
    const ipCount = Number(
      distributionRows.find((r) => r.service_type === "ip_phone")?.count || 0
    );
    const aiCount = Number(
      distributionRows.find((r) => r.service_type === "ai_calling")?.count || 0
    );
    const totalService = ipCount + aiCount;
    const serviceDistribution = totalService
      ? [
          {
            name: "IP Telephony",
            value: Math.round((ipCount / totalService) * 100),
          },
          {
            name: "AI Voice Automation",
            value: Math.round((aiCount / totalService) * 100),
          },
        ]
      : [
          { name: "IP Telephony", value: 0 },
          { name: "AI Voice Automation", value: 0 },
        ];

    return res.json({
      success: true,
      stats: {
        total_users: Number(users?.total_users || 0),
        active_users: Number(users?.active_users || 0),
        total_revenue: Number(revenue?.total_revenue || 0),
        total_recharge: Number(recharge?.total_recharge || 0),
        active_ip_subscriptions: Number(subs?.active_ip_subscriptions || 0),
        active_ai_subscriptions: Number(subs?.active_ai_subscriptions || 0),
        total_calls: Number(calls?.total_calls || 0),
        total_call_minutes: Math.ceil(Number(calls?.total_seconds || 0) / 60),
        total_ai_calls: Number(calls?.total_ai_calls || 0),
        pending_orders: Number(pendingOrders?.count || 0),
        open_tickets: Number(openTickets?.count || 0),
        pending_payments: Number(pendingPayments?.count || 0),
        pending_recharges: Number(pendingRecharges?.count || 0),
        open_inquiries: openInquiriesCount,
      },
      charts: {
        monthly_trend: monthlyRows.map((r) => ({
          month: r.month,
          revenue: Number(r.revenue || 0),
          recharge: Number(r.recharge || 0),
          calls: Number(r.calls || 0),
        })),
        service_distribution: serviceDistribution,
      },
      recentTransactions,
      recentOrders,
    });
  } catch (error) {
    console.error("DASHBOARD STATS ERROR:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error fetching admin dashboard stats",
      });
  }
};

// GET ALL USERS (Admin Directory)
const getAllUsers = async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT
        u.id, u.name, u.email, u.phone, u.role, u.status,
        u.balance, u.ai_minutes, u.company_name, u.kyc_status,
        u.created_at, u.last_login,
        (SELECT COUNT(*) FROM user_subscriptions s WHERE s.user_id = u.id AND s.status = 'active') AS active_plans_count,
        (SELECT COUNT(*) FROM ip_numbers n WHERE n.assigned_user_id = u.id AND n.status = 'assigned') AS assigned_numbers_count,
        (SELECT COUNT(*) FROM support_tickets t WHERE t.user_id = u.id AND t.status IN ('open','in_progress','waiting_for_user')) AS open_tickets_count
      FROM users u
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += " AND u.status = ?";
      params.push(status);
    }

    if (search) {
      query +=
        " AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.company_name LIKE ?)";
      const q = `%${search}%`;
      params.push(q, q, q, q);
    }

    query += " ORDER BY u.created_at DESC";

    const [users] = await pool.query(query, params);

    return res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error("ADMIN GET USERS ERROR:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching users" });
  }
};

// GET ONE USER + ALL CUSTOMER-OWNED DATA USED BY ADMIN USER MANAGEMENT.
const getUserDetails = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user id" });
    }

    const [
      [userRows],
      [subscriptions],
      [numbers],
      [transactions],
      [recharges],
      [orders],
      [payments],
      [calls],
      [campaigns],
      [tickets],
      [notifications],
      [activity],
    ] = await Promise.all([
      pool.query(
        `
        SELECT id, name, email, phone, role, status, balance, ai_minutes, avatar,
               nid_number, kyc_status, company_name, address, last_login,
               created_at, updated_at
        FROM users WHERE id = ? LIMIT 1`,
        [userId]
      ),
      pool.query(
        `
        SELECT s.*, p.name AS package_name, p.slug AS package_slug,
               p.price AS package_price, p.billing_period, p.call_minutes,
               p.device_limit, p.ai_credits, p.recording_enabled,
               p.caller_tune_enabled
        FROM user_subscriptions s
        JOIN packages p ON p.id = s.package_id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC`,
        [userId]
      ),
      pool.query(
        `
        SELECT id, number, status, category, price, caller_tune,
               call_recording, device_count, max_devices, sip_username,
               sip_server, created_at, updated_at
        FROM ip_numbers
        WHERE assigned_user_id = ?
        ORDER BY created_at DESC`,
        [userId]
      ),
      pool.query(
        `
        SELECT id, transaction_code, type, direction, amount, balance_after,
               reference_id, description, status, created_at
        FROM transactions WHERE user_id = ?
        ORDER BY created_at DESC LIMIT 50`,
        [userId]
      ),
      pool.query(
        `
        SELECT id, amount, payment_method, transaction_id, sender_phone,
               status, notes, created_at, updated_at
        FROM recharges WHERE user_id = ?
        ORDER BY created_at DESC LIMIT 50`,
        [userId]
      ),
      pool.query(
        `
        SELECT id, order_number, product_id, package_id, item_type, item_title,
               amount, payment_method, payment_status, status, details,
               created_at, updated_at
        FROM orders WHERE user_id = ?
        ORDER BY created_at DESC LIMIT 50`,
        [userId]
      ),
      pool.query(
        `
        SELECT id, order_id, recharge_id, gateway, payment_method, amount,
               currency, gateway_unique_txn_id, gateway_order_id,
               gateway_transaction_id, gateway_status, status, paid_at,
               created_at, updated_at
        FROM payments WHERE user_id = ?
        ORDER BY created_at DESC LIMIT 50`,
        [userId]
      ),
      pool.query(
        `
        SELECT id, call_type, from_number, to_number, duration_seconds,
               cost, status, recording_url, ai_campaign_id, created_at
        FROM call_logs WHERE user_id = ?
        ORDER BY created_at DESC LIMIT 50`,
        [userId]
      ),
      pool.query(
        `
        SELECT id, name, status, voice_type, total_contacts,
               contacts_completed, successful_calls, failed_calls,
               scheduled_at, created_at, updated_at
        FROM ai_campaigns WHERE user_id = ?
        ORDER BY created_at DESC LIMIT 50`,
        [userId]
      ),
      pool.query(
        `
        SELECT t.id, t.ticket_code, t.department, t.subject, t.priority,
               t.status, t.created_at, t.updated_at,
               (SELECT COUNT(*) FROM ticket_messages tm WHERE tm.ticket_id = t.id) AS reply_count
        FROM support_tickets t WHERE t.user_id = ?
        ORDER BY t.created_at DESC LIMIT 50`,
        [userId]
      ),
      pool.query(
        `
        SELECT id, title, message, type, is_read, link, created_at
        FROM notifications WHERE user_id = ?
        ORDER BY created_at DESC LIMIT 20`,
        [userId]
      ),
      pool.query(
        `
        SELECT a.id, a.action, a.description, a.metadata, a.created_at,
               admin.name AS admin_name, admin.email AS admin_email
        FROM user_admin_activity a
        LEFT JOIN users admin ON admin.id = a.admin_id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC LIMIT 50`,
        [userId]
      ),
    ]);

    if (!userRows.length) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const user = userRows[0];
    const totalCallSeconds = calls.reduce(
      (sum, c) => sum + Number(c.duration_seconds || 0),
      0
    );
    const totalCallCost = calls.reduce(
      (sum, c) => sum + Number(c.cost || 0),
      0
    );

    return res.json({
      success: true,
      data: {
        user,
        summary: {
          active_subscriptions: subscriptions.filter(
            (s) => s.status === "active"
          ).length,
          assigned_numbers: numbers.filter((n) => n.status === "assigned")
            .length,
          total_transactions: transactions.length,
          total_recharges: recharges.length,
          total_orders: orders.length,
          total_payments: payments.length,
          total_calls: calls.length,
          total_call_minutes: Math.ceil(totalCallSeconds / 60),
          total_call_cost: totalCallCost,
          active_campaigns: campaigns.filter((c) => c.status === "running")
            .length,
          open_tickets: tickets.filter((t) =>
            ["open", "in_progress", "waiting_for_user"].includes(t.status)
          ).length,
        },
        subscriptions,
        numbers,
        transactions,
        recharges,
        orders,
        payments,
        calls,
        campaigns,
        tickets,
        notifications,
        activity,
      },
    });
  } catch (error) {
    console.error("ADMIN GET USER DETAILS ERROR:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching user details" });
  }
};

// UPDATE BASIC CUSTOMER PROFILE. Password is intentionally excluded.
const updateUserProfile = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = Number(req.params.id);
    const { name, phone, company_name, address } = req.body || {};

    if (!Number.isInteger(userId) || userId <= 0 || !name?.trim()) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Valid user id and name are required",
        });
    }

    await connection.beginTransaction();
    const [beforeRows] = await connection.query(
      "SELECT id, name, phone, company_name, address FROM users WHERE id = ? FOR UPDATE",
      [userId]
    );
    if (!beforeRows.length) {
      await connection.rollback();
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await connection.query(
      `
      UPDATE users
      SET name = ?, phone = ?, company_name = ?, address = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [
        name.trim(),
        phone?.trim() || null,
        company_name?.trim() || null,
        address?.trim() || null,
        userId,
      ]
    );

    await connection.query(
      `
      INSERT INTO user_admin_activity (admin_id, user_id, action, description, metadata)
      VALUES (?, ?, 'profile_updated', 'Admin updated customer profile', ?)
    `,
      [
        req.user.id,
        userId,
        JSON.stringify({
          before: beforeRows[0],
          after: { name, phone, company_name, address },
        }),
      ]
    );

    await connection.commit();
    return res.json({
      success: true,
      message: "User profile updated successfully",
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}
    console.error("ADMIN UPDATE USER PROFILE ERROR:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({
          success: false,
          message: "That phone number is already used by another account",
        });
    }
    return res
      .status(500)
      .json({ success: false, message: "Server error updating user profile" });
  } finally {
    connection.release();
  }
};

// UPDATE ACCOUNT STATUS. The database is checked on every protected request,
// so suspension takes effect even for users who still have an old JWT.
const updateUserStatus = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = Number(req.params.id);
    const { status } = req.body || {};
    const allowed = ["active", "inactive", "suspended"];

    if (!Number.isInteger(userId) || userId <= 0 || !allowed.includes(status)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Valid user id and status are required",
        });
    }

    if (userId === Number(req.user.id)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "You cannot change your own account status",
        });
    }

    await connection.beginTransaction();
    const [rows] = await connection.query(
      "SELECT id, name, status, role FROM users WHERE id = ? FOR UPDATE",
      [userId]
    );
    if (!rows.length) {
      await connection.rollback();
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const target = rows[0];
    if (target.role === "admin") {
      await connection.rollback();
      return res
        .status(403)
        .json({
          success: false,
          message:
            "Admin accounts cannot be managed from the subscriber directory",
        });
    }

    await connection.query(
      "UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, userId]
    );

    await connection.query(
      `
      INSERT INTO user_admin_activity (admin_id, user_id, action, description, metadata)
      VALUES (?, ?, 'status_changed', ?, ?)
    `,
      [
        req.user.id,
        userId,
        `Account status changed from ${target.status} to ${status}`,
        JSON.stringify({ from: target.status, to: status }),
      ]
    );

    await connection.query(
      `
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, ?, ?, 'system', '/user/profile')
    `,
      [
        userId,
        status === "active" ? "Account activated" : "Account status updated",
        status === "active"
          ? "Your MyBDPhone account is active again."
          : `Your MyBDPhone account is now ${status}. Please contact support if you need assistance.`,
      ]
    );

    await connection.commit();
    return res.json({
      success: true,
      message: `User #${userId} is now ${status}`,
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}
    console.error("UPDATE USER STATUS ERROR:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error updating user status" });
  } finally {
    connection.release();
  }
};

// ADMIN KYC DECISION. User submission remains pending until an admin reviews it.
const updateUserKyc = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = Number(req.params.id);
    const { status, note } = req.body || {};
    const allowed = ["pending", "verified", "rejected", "unsubmitted"];

    if (!Number.isInteger(userId) || userId <= 0 || !allowed.includes(status)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Valid user id and KYC status are required",
        });
    }

    await connection.beginTransaction();
    const [rows] = await connection.query(
      "SELECT id, kyc_status FROM users WHERE id = ? FOR UPDATE",
      [userId]
    );
    if (!rows.length) {
      await connection.rollback();
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await connection.query(
      "UPDATE users SET kyc_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, userId]
    );

    await connection.query(
      `
      INSERT INTO user_admin_activity (admin_id, user_id, action, description, metadata)
      VALUES (?, ?, 'kyc_updated', ?, ?)
    `,
      [
        req.user.id,
        userId,
        `KYC status changed from ${rows[0].kyc_status} to ${status}`,
        JSON.stringify({
          from: rows[0].kyc_status,
          to: status,
          note: note || null,
        }),
      ]
    );

    await connection.query(
      `
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'KYC status updated', ?, 'system', '/user/profile')
    `,
      [
        userId,
        `Your KYC status is now ${status}${
          note ? `. Admin note: ${note}` : "."
        }`,
      ]
    );

    await connection.commit();
    return res.json({ success: true, message: `KYC marked as ${status}` });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}
    console.error("UPDATE USER KYC ERROR:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error updating KYC status" });
  } finally {
    connection.release();
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserProfile,
  updateUserStatus,
  updateUserKyc,
};
