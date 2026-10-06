-- MyBDPhone customer billing / payment verification schema.
-- Preferred production path: start the server once after deploying the updated code.
-- The server automatically runs ensureCommerceTables() and creates these additions safely.
-- If you prefer SQL manually, select the database first:
-- USE my_bd_phone_db;

USE my_bd_phone_db;

CREATE TABLE IF NOT EXISTS payment_methods (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  method_type ENUM('gateway','manual','voucher','bank','mobile_banking') NOT NULL DEFAULT 'manual',
  provider VARCHAR(100) NULL,
  account_number VARCHAR(100) NULL,
  instructions TEXT NULL,
  config JSON NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Existing columns are also created automatically by ensureCommerceTables().
-- If executing manually on a fresh existing database, run the ALTER statements
-- once after the tables orders/payments/user_subscriptions already exist.
ALTER TABLE orders ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'BDT';
ALTER TABLE orders ADD COLUMN customer_note TEXT NULL;
ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(150) NULL;
ALTER TABLE orders ADD COLUMN payment_proof_url VARCHAR(500) NULL;
ALTER TABLE orders ADD COLUMN reviewed_by INT UNSIGNED NULL;
ALTER TABLE orders ADD COLUMN reviewed_at DATETIME NULL;

ALTER TABLE payments ADD COLUMN provider_name VARCHAR(100) NULL;
ALTER TABLE payments ADD COLUMN payer_phone VARCHAR(30) NULL;
ALTER TABLE payments ADD COLUMN proof_url VARCHAR(500) NULL;
ALTER TABLE payments ADD COLUMN notes TEXT NULL;
ALTER TABLE payments ADD COLUMN reviewed_by INT UNSIGNED NULL;
ALTER TABLE payments ADD COLUMN reviewed_at DATETIME NULL;

ALTER TABLE user_subscriptions ADD COLUMN source_order_id INT UNSIGNED NULL;
ALTER TABLE user_subscriptions ADD COLUMN last_extended_by INT UNSIGNED NULL;
ALTER TABLE user_subscriptions ADD COLUMN last_extended_at DATETIME NULL;
