USE my_bd_phone_db;

CREATE TABLE IF NOT EXISTS payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NULL,
  recharge_id INT UNSIGNED NULL,
  user_id INT UNSIGNED NOT NULL,
  gateway VARCHAR(30) NOT NULL DEFAULT 'dgepay',
  payment_method VARCHAR(50) NOT NULL DEFAULT 'dgepay',
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
  gateway_unique_txn_id VARCHAR(100) NOT NULL UNIQUE,
  gateway_order_id VARCHAR(100) NULL,
  gateway_transaction_id VARCHAR(100) NULL,
  gateway_status VARCHAR(100) NULL,
  gateway_response JSON NULL,
  status ENUM('pending','approved','failed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  paid_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payments_user_id (user_id),
  INDEX idx_payments_order_id (order_id),
  INDEX idx_payments_recharge_id (recharge_id),
  INDEX idx_payments_status (status),
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_payments_recharge FOREIGN KEY (recharge_id) REFERENCES recharges(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE recharges
  MODIFY payment_method ENUM('bkash','nagad','rocket','card','bank','manual','dgepay') NOT NULL;
