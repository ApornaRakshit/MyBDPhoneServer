const pool = require("../config/db");

const getAdminNotifications = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

    const [notifications] = await pool.query(
      `SELECT id, title, message, type, is_read, link, entity_type, entity_id, created_at, read_at
       FROM admin_notifications
       WHERE admin_id = ?
       ORDER BY created_at DESC
       LIMIT ${limit}`,
      [req.user.id]
    );

    const [[unread]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM admin_notifications
       WHERE admin_id = ? AND is_read = 0`,
      [req.user.id]
    );

    return res.json({
      success: true,
      notifications,
      unread_count: Number(unread?.count || 0),
    });
  } catch (error) {
    console.error("ADMIN NOTIFICATIONS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching admin notifications",
    });
  }
};

const markAdminNotificationRead = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification id",
      });
    }

    const [result] = await pool.query(
      `UPDATE admin_notifications
       SET is_read = 1, read_at = COALESCE(read_at, NOW())
       WHERE id = ? AND admin_id = ? AND is_read = 0`,
      [id, req.user.id]
    );

    return res.json({
      success: true,
      updated: Number(result.affectedRows || 0),
    });
  } catch (error) {
    console.error("ADMIN NOTIFICATION READ ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating notification",
    });
  }
};

const markAllAdminNotificationsRead = async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE admin_notifications
       SET is_read = 1, read_at = COALESCE(read_at, NOW())
       WHERE admin_id = ? AND is_read = 0`,
      [req.user.id]
    );

    return res.json({
      success: true,
      updated: Number(result.affectedRows || 0),
      unread_count: 0,
    });
  } catch (error) {
    console.error("ADMIN NOTIFICATIONS ALL READ ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating notifications",
    });
  }
};

module.exports = {
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
};
