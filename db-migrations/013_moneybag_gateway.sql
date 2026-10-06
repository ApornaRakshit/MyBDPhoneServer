-- MyBDPhone Moneybag migration
START TRANSACTION;

ALTER TABLE recharges
  MODIFY COLUMN payment_method ENUM('bkash','nagad','rocket','card','bank','manual','dgepay','moneybag') NOT NULL;

CREATE TABLE IF NOT EXISTS moneybag_webhook_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(120) NULL,
  status ENUM('processing','processed','failed') NOT NULL DEFAULT 'processing',
  payload JSON NULL,
  last_error VARCHAR(1000) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  UNIQUE KEY uq_moneybag_webhook_event_id (event_id),
  INDEX idx_moneybag_webhook_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO payment_methods (name,code,method_type,provider,instructions,sort_order,is_active)
VALUES ('Moneybag Online','moneybag','gateway','Moneybag','Secure hosted checkout. Gateway state is verified server-side and admin approval is required before activation/credit.',2,1)
ON DUPLICATE KEY UPDATE
  name=VALUES(name),
  method_type=VALUES(method_type),
  provider=VALUES(provider),
  instructions=VALUES(instructions),
  is_active=1;

UPDATE payment_methods mb
JOIN payment_methods old ON old.code='moneybank'
SET mb.logo_url=COALESCE(mb.logo_url, old.logo_url)
WHERE mb.code='moneybag' AND (mb.logo_url IS NULL OR mb.logo_url='');

UPDATE payment_methods SET is_active=0 WHERE code='moneybank';

COMMIT;
