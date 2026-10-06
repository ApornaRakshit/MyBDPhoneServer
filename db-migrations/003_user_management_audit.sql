-- MyBDPhone: customer-management audit trail
-- Run once against the existing MyBDPhone database.

CREATE TABLE IF NOT EXISTS user_admin_activity (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  action VARCHAR(80) NOT NULL,
  description VARCHAR(255) NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_admin_activity_user (user_id),
  INDEX idx_user_admin_activity_admin (admin_id),
  INDEX idx_user_admin_activity_created (created_at),
  CONSTRAINT fk_user_admin_activity_admin
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_admin_activity_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
