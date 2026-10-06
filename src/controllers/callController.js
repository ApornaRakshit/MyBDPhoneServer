const pool = require("../config/db");

// GET USER CALL HISTORY
const getMyCalls = async (req, res) => {
  try {
    const { call_type, status } = req.query;

    let query = "SELECT * FROM call_logs WHERE user_id = ?";
    const params = [req.user.id];

    if (call_type) {
      query += " AND call_type = ?";
      params.push(call_type);
    }
    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC LIMIT 100";

    const [calls] = await pool.query(query, params);

    return res.json({
      success: true,
      count: calls.length,
      calls,
    });
  } catch (error) {
    console.error("GET CALLS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching call history",
    });
  }
};

// ADMIN: GET ALL CALL LOGS
const getAllCalls = async (req, res) => {
  try {
    const { call_type, status, search } = req.query;

    let query = `
      SELECT c.*, u.name AS user_name, u.email AS user_email
      FROM call_logs c
      JOIN users u ON c.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (call_type) {
      query += " AND c.call_type = ?";
      params.push(call_type);
    }
    if (status) {
      query += " AND c.status = ?";
      params.push(status);
    }
    if (search) {
      query +=
        " AND (c.from_number LIKE ? OR c.to_number LIKE ? OR u.name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += " ORDER BY c.created_at DESC LIMIT 200";

    const [calls] = await pool.query(query, params);

    return res.json({
      success: true,
      count: calls.length,
      calls,
    });
  } catch (error) {
    console.error("ADMIN CALLS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// SIMULATE A TEST CALL
const simulateTestCall = async (req, res) => {
  try {
    const { call_type = "outgoing", to_number = "01700000000" } = req.body;

    const [userSubs] = await pool.query(
      "SELECT assigned_number FROM user_subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1",
      [req.user.id]
    );

    const [[primarySetting]] = await pool.query(
      "SELECT setting_value FROM site_settings WHERE setting_key='primary_096_number' LIMIT 1"
    );
    const from_number =
      userSubs[0]?.assigned_number ||
      primarySetting?.setting_value ||
      "096490123756";
    const duration = Math.floor(Math.random() * 180) + 15; // 15 - 195 seconds
    const cost = (duration * 0.015).toFixed(2); // 90 poisha per min approx

    const [result] = await pool.query(
      `
      INSERT INTO call_logs (user_id, call_type, from_number, to_number, duration_seconds, cost, status, recording_url)
      VALUES (?, ?, ?, ?, ?, ?, 'completed', 'https://actions.google.com/sounds/v1/telephones/phone_ring.ogg')
      `,
      [req.user.id, call_type, from_number, to_number, duration, cost]
    );

    return res.status(201).json({
      success: true,
      message: `Test call generated successfully (${duration}s)`,
      call_id: result.insertId,
    });
  } catch (error) {
    console.error("SIMULATE CALL ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error generating test call",
    });
  }
};

module.exports = {
  getMyCalls,
  getAllCalls,
  simulateTestCall,
};
