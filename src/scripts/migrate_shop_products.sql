-- Migration script for Digital Marketplace (shop_products)
-- Run this query on your MySQL database (e.g. via phpMyAdmin or MySQL CLI)

CREATE TABLE IF NOT EXISTS `shop_products` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(180) NOT NULL UNIQUE,
  `category` VARCHAR(100) NOT NULL DEFAULT 'caller_tune',
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `billing_type` VARCHAR(50) NOT NULL DEFAULT 'MONTHLY',
  `description` TEXT NULL,
  `features` JSON NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `badge` VARCHAR(100) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_shop_products_active` (`is_active`),
  INDEX `idx_shop_products_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- If the table already exists, alter to add missing columns safely:
ALTER TABLE `shop_products` ADD COLUMN IF NOT EXISTS `billing_type` VARCHAR(50) NOT NULL DEFAULT 'MONTHLY' AFTER `price`;
ALTER TABLE `shop_products` MODIFY COLUMN `category` VARCHAR(100) NOT NULL DEFAULT 'caller_tune';
ALTER TABLE `shop_products` MODIFY COLUMN `description` TEXT NULL;
ALTER TABLE `shop_products` MODIFY COLUMN `badge` VARCHAR(100) NULL;
ALTER TABLE `shop_products` ADD COLUMN IF NOT EXISTS `sort_order` INT NOT NULL DEFAULT 0 AFTER `badge`;
