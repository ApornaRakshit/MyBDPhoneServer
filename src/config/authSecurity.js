
const pool = require("./db");

const ensureAuthSecurityTables = async () => {
  // Existing accounts are treated as already verified so this change does not lock out
  // users that existed before email verification was introduced.
  try {
    await pool.query(
      "ALTER TABLE users ADD COLUMN email_verified_at DATETIME NULL AFTER email"
    );
  } catch (e) {
    if (!["ER_DUP_FIELDNAME"].includes(e.code)) {
      console.warn("email_verified_at migration:", e.code, e.message);
    }
  }

  try {
    await pool.query(
      "ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0 AFTER status"
    );
  } catch (e) {
    if (!["ER_DUP_FIELDNAME"].includes(e.code)) {
      console.warn("token_version migration:", e.code, e.message);
    }
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      token_hash CHAR(64) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_password_reset_user_id (user_id),
      INDEX idx_password_reset_expires_at (expires_at),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      email VARCHAR(150) NOT NULL,
      purpose VARCHAR(30) NOT NULL DEFAULT 'registration',
      token_hash CHAR(64) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email_verify_user (user_id),
      INDEX idx_email_verify_email (email),
      INDEX idx_email_verify_expires (expires_at),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log("Authentication security tables ready.");
};

module.exports = { ensureAuthSecurityTables };
