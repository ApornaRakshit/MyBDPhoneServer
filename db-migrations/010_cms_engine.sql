CREATE TABLE IF NOT EXISTS cms_pages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  template VARCHAR(80) NOT NULL DEFAULT 'standard',
  content_html LONGTEXT NULL,
  featured_image VARCHAR(1000) NULL,
  seo_title VARCHAR(255) NULL,
  seo_description TEXT NULL,
  status ENUM('draft','published','inactive') NOT NULL DEFAULT 'draft',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cms_sections (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  page_id INT UNSIGNED NOT NULL,
  section_key VARCHAR(100) NOT NULL,
  section_type VARCHAR(60) NOT NULL DEFAULT 'rich_text',
  title VARCHAR(255) NULL,
  subtitle TEXT NULL,
  content_html LONGTEXT NULL,
  settings JSON NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_page_section_key (page_id, section_key),
  CONSTRAINT fk_cms_sections_page FOREIGN KEY (page_id) REFERENCES cms_pages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cms_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  collection_key VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NULL,
  description TEXT NULL,
  content_html LONGTEXT NULL,
  image_url VARCHAR(1000) NULL,
  icon VARCHAR(80) NULL,
  link_url VARCHAR(500) NULL,
  meta VARCHAR(255) NULL,
  payload JSON NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('active','inactive','draft','published') NOT NULL DEFAULT 'active',
  published_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_collection_status (collection_key, status),
  INDEX idx_collection_order (collection_key, sort_order)
);

CREATE TABLE IF NOT EXISTS cms_media (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(1200) NOT NULL,
  media_type VARCHAR(60) NOT NULL DEFAULT 'image',
  alt_text VARCHAR(255) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
