const pool = require('../config/db');

/**
 * Create one notification per active admin so each administrator has an
 * independent read/unread state. Call this inside an existing transaction
 * when the caller already has a connection; otherwise omit connection.
 */
const notifyAdmins = async (connection, {
  title,
  message,
  type = 'system',
  link = '/admin/dashboard',
  entityType = null,
  entityId = null,
  dedupeKey = null,
}) => {
  if (!title || !message) return;
  const db = connection || pool;
  const [admins] = await db.query(
    `SELECT id FROM users WHERE role = 'admin' AND status = 'active'`
  );

  if (!admins.length) return;

  for (const admin of admins) {
    const adminDedupe = dedupeKey ? `${dedupeKey}:admin:${admin.id}` : null;
    await db.query(
      `INSERT INTO admin_notifications
       (admin_id, title, message, type, link, entity_type, entity_id, dedupe_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id = id`,
      [admin.id, title, message, type, link, entityType, entityId, adminDedupe]
    );
  }
};

module.exports = { notifyAdmins };
