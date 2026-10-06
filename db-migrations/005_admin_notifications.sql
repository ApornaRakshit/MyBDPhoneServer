USE my_bd_phone_db;

CREATE TABLE IF NOT EXISTS admin_notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  message VARCHAR(500) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'system',
  link VARCHAR(255) NULL,
  entity_type VARCHAR(50) NULL,
  entity_id BIGINT UNSIGNED NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL DEFAULT NULL,
  dedupe_key VARCHAR(255) NULL,
  INDEX idx_admin_notifications_admin_read (admin_id, is_read, created_at),
  INDEX idx_admin_notifications_created (created_at),
  UNIQUE KEY uq_admin_notifications_dedupe (dedupe_key),
  CONSTRAINT fk_admin_notifications_admin
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
