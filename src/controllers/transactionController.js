const pool = require("../config/db");

// GET USER TRANSACTIONS
const getMyTransactions = async (req, res) => {
  try {
    const { type, direction } = req.query;

    let query = "SELECT * FROM transactions WHERE user_id = ?";
    const params = [req.user.id];

    if (type) {
      query += " AND type = ?";
      params.push(type);
    }
    if (direction) {
      query += " AND direction = ?";
      params.push(direction);
    }

    query += " ORDER BY created_at DESC LIMIT 100";

    const [transactions] = await pool.query(query, params);

    return res.json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("GET TRANSACTIONS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ADMIN: GET ALL TRANSACTIONS
const getAllTransactions = async (req, res) => {
  try {
    const { type, search } = req.query;

    let query = `
      SELECT t.*, u.name AS user_name, u.email AS user_email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      query += " AND t.type = ?";
      params.push(type);
    }
    if (search) {
      query += " AND (t.transaction_code LIKE ? OR u.name LIKE ? OR u.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += " ORDER BY t.created_at DESC LIMIT 200";

    const [transactions] = await pool.query(query, params);

    return res.json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("ADMIN TRANSACTIONS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getMyTransactions,
  getAllTransactions,
};

