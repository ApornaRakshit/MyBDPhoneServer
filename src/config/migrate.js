require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./db");

const migrate = async () => {
  try {
    console.log("🚀 Starting database migration for MyBDPhone...");

    // 1. Users table (enhanced)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        phone VARCHAR(20) UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
        balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        ai_minutes INT NOT NULL DEFAULT 0,
        avatar VARCHAR(500) NULL,
        nid_number VARCHAR(50) NULL,
        kyc_status ENUM('pending', 'verified', 'rejected', 'unsubmitted') NOT NULL DEFAULT 'unsubmitted',
        company_name VARCHAR(150) NULL,
        address TEXT NULL,
        last_login DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure users table has balance and ai_minutes if it already existed
    try {
      await pool.query("ALTER TABLE users ADD COLUMN balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER status;");
    } catch (e) { /* column exists */ }
    try {
      await pool.query("ALTER TABLE users ADD COLUMN ai_minutes INT NOT NULL DEFAULT 0 AFTER balance;");
    } catch (e) { /* column exists */ }
    try {
      await pool.query("ALTER TABLE users ADD COLUMN nid_number VARCHAR(50) NULL AFTER avatar;");
    } catch (e) { /* column exists */ }
    try {
      await pool.query("ALTER TABLE users ADD COLUMN kyc_status ENUM('pending', 'verified', 'rejected', 'unsubmitted') NOT NULL DEFAULT 'unsubmitted' AFTER nid_number;");
    } catch (e) { /* column exists */ }
    try {
      await pool.query("ALTER TABLE users ADD COLUMN company_name VARCHAR(150) NULL AFTER kyc_status;");
    } catch (e) { /* column exists */ }
    try {
      await pool.query("ALTER TABLE users ADD COLUMN address TEXT NULL AFTER company_name;");
    } catch (e) { /* column exists */ }

    // 1B. Admin audit trail for customer-management actions.
    await pool.query(`
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
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. User password reset tokens (secure, single-use links)
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

    // 2. Packages table (Dynamic 100% No-code)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS packages (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(120) NOT NULL UNIQUE,
        service_type ENUM('ip_phone', 'ai_calling') NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        billing_period ENUM('monthly', 'quarterly', 'yearly', 'one_time') NOT NULL DEFAULT 'monthly',
        description TEXT NULL,
        features JSON NOT NULL,
        call_minutes INT NOT NULL DEFAULT 0,
        device_limit INT NOT NULL DEFAULT 1,
        ai_credits INT NOT NULL DEFAULT 0,
        concurrent_calls INT NOT NULL DEFAULT 1,
        recording_enabled BOOLEAN NOT NULL DEFAULT 0,
        caller_tune_enabled BOOLEAN NOT NULL DEFAULT 0,
        is_recommended BOOLEAN NOT NULL DEFAULT 0,
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        badge_text VARCHAR(50) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. IP Numbers pool
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ip_numbers (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        number VARCHAR(20) NOT NULL UNIQUE,
        status ENUM('available', 'assigned', 'reserved') NOT NULL DEFAULT 'available',
        assigned_user_id INT UNSIGNED NULL,
        category ENUM('regular', 'silver', 'gold', 'platinum') NOT NULL DEFAULT 'regular',
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        caller_tune VARCHAR(100) NULL DEFAULT 'Default Telecom Tone',
        call_recording BOOLEAN NOT NULL DEFAULT 0,
        device_count INT NOT NULL DEFAULT 1,
        max_devices INT NOT NULL DEFAULT 5,
        sip_username VARCHAR(50) NULL,
        sip_password VARCHAR(100) NULL,
        sip_server VARCHAR(100) NOT NULL DEFAULT 'sip.mybdphone.com:5060',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. User Subscriptions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        package_id INT UNSIGNED NOT NULL,
        ip_number_id INT UNSIGNED NULL,
        assigned_number VARCHAR(20) NULL,
        service_type ENUM('ip_phone', 'ai_calling') NOT NULL,
        status ENUM('active', 'expired', 'cancelled', 'pending') NOT NULL DEFAULT 'active',
        started_at DATETIME NOT NULL,
        expires_at DATETIME NOT NULL,
        auto_renew BOOLEAN NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE RESTRICT,
        FOREIGN KEY (ip_number_id) REFERENCES ip_numbers(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Recharges table (৳100 - ৳10,000)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recharges (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method ENUM('bkash', 'nagad', 'rocket', 'card', 'bank', 'manual') NOT NULL,
        transaction_id VARCHAR(100) NOT NULL UNIQUE,
        sender_phone VARCHAR(20) NULL,
        status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Transactions Ledger table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        transaction_code VARCHAR(50) NOT NULL UNIQUE,
        user_id INT UNSIGNED NOT NULL,
        type ENUM('recharge', 'package_purchase', 'shop_order', 'ai_call_charge', 'refund', 'adjustment') NOT NULL,
        direction ENUM('credit', 'debit') NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        balance_after DECIMAL(10, 2) NOT NULL,
        reference_id VARCHAR(100) NULL,
        description VARCHAR(255) NOT NULL,
        status ENUM('completed', 'pending', 'failed') NOT NULL DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Shop Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shop_products (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(180) NOT NULL UNIQUE,
        category ENUM('caller_tune', 'recording', 'device_addon', 'vip_number', 'ai_addon', 'integration') NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        billing_type ENUM('ONE_TIME', 'MONTHLY', 'YEARLY') NOT NULL DEFAULT 'MONTHLY',
        description TEXT NOT NULL,
        features JSON NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        badge VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await safeAlter(`ALTER TABLE shop_products ADD COLUMN billing_type ENUM('ONE_TIME', 'MONTHLY', 'YEARLY') NOT NULL DEFAULT 'MONTHLY' AFTER price`);

    // 8. Orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) NOT NULL UNIQUE,
        user_id INT UNSIGNED NOT NULL,
        product_id INT UNSIGNED NULL,
        package_id INT UNSIGNED NULL,
        item_type ENUM('package', 'shop_product', 'recharge') NOT NULL,
        item_title VARCHAR(150) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL DEFAULT 'wallet_balance',
        payment_status ENUM('paid', 'unpaid', 'refunded') NOT NULL DEFAULT 'unpaid',
        status ENUM('pending', 'processing', 'active', 'completed', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
        details JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8B. DGePay payments table (server-side verified gateway payments)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        order_id INT UNSIGNED NULL,
        recharge_id INT UNSIGNED NULL,
        user_id INT UNSIGNED NOT NULL,
        gateway VARCHAR(30) NOT NULL DEFAULT 'dgepay',
        payment_method VARCHAR(50) NOT NULL DEFAULT 'dgepay',
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
        gateway_unique_txn_id VARCHAR(100) NOT NULL UNIQUE,
        gateway_order_id VARCHAR(100) NULL,
        gateway_transaction_id VARCHAR(100) NULL,
        gateway_status VARCHAR(100) NULL,
        gateway_response JSON NULL,
        status ENUM('pending', 'approved', 'failed', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
        paid_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_payments_user_id (user_id),
        INDEX idx_payments_order_id (order_id),
        INDEX idx_payments_recharge_id (recharge_id),
        INDEX idx_payments_status (status),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
        FOREIGN KEY (recharge_id) REFERENCES recharges(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 1C. Customer billing / manual verification tables and additive columns.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        method_type ENUM('gateway','manual','voucher','bank','mobile_banking') NOT NULL DEFAULT 'manual',
        provider VARCHAR(100) NULL,
        account_number VARCHAR(100) NULL,
        instructions TEXT NULL,
        config JSON NULL,
        logo_url VARCHAR(500) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    const safeAlter = async (sql) => { try { await pool.query(sql); } catch (e) { if (!['ER_DUP_FIELDNAME','ER_DUP_KEYNAME','ER_CANT_CREATE_TABLE','ER_TABLE_EXISTS_ERROR'].includes(e.code)) console.warn('Migration note:', e.code, e.message); } };
    await safeAlter(`ALTER TABLE payment_methods ADD COLUMN logo_url VARCHAR(500) NULL AFTER config`);
    await safeAlter(`ALTER TABLE orders ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'BDT' AFTER amount`);
    await safeAlter(`ALTER TABLE orders ADD COLUMN customer_note TEXT NULL AFTER details`);
    await safeAlter(`ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(150) NULL AFTER customer_note`);
    await safeAlter(`ALTER TABLE orders ADD COLUMN payment_proof_url VARCHAR(500) NULL AFTER payment_reference`);
    await safeAlter(`ALTER TABLE orders ADD COLUMN reviewed_by INT UNSIGNED NULL AFTER payment_proof_url`);
    await safeAlter(`ALTER TABLE orders ADD COLUMN reviewed_at DATETIME NULL AFTER reviewed_by`);
    await safeAlter(`ALTER TABLE orders ADD INDEX idx_orders_payment_reference (payment_reference)`);
    await safeAlter(`ALTER TABLE orders ADD INDEX idx_orders_reviewed_by (reviewed_by)`);
    await safeAlter(`ALTER TABLE orders ADD CONSTRAINT fk_orders_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL`);
    await safeAlter(`ALTER TABLE payments ADD COLUMN provider_name VARCHAR(100) NULL AFTER gateway`);
    await safeAlter(`ALTER TABLE payments ADD COLUMN payer_phone VARCHAR(30) NULL AFTER payment_method`);
    await safeAlter(`ALTER TABLE payments ADD COLUMN proof_url VARCHAR(500) NULL AFTER gateway_response`);
    await safeAlter(`ALTER TABLE payments ADD COLUMN notes TEXT NULL AFTER proof_url`);
    await safeAlter(`ALTER TABLE payments ADD COLUMN reviewed_by INT UNSIGNED NULL AFTER notes`);
    await safeAlter(`ALTER TABLE payments ADD COLUMN reviewed_at DATETIME NULL AFTER reviewed_by`);
    await safeAlter(`ALTER TABLE payments ADD INDEX idx_payments_reviewed_by (reviewed_by)`);
    await safeAlter(`ALTER TABLE payments ADD CONSTRAINT fk_payments_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL`);
    await safeAlter(`ALTER TABLE user_subscriptions ADD COLUMN source_order_id INT UNSIGNED NULL AFTER package_id`);
    await safeAlter(`ALTER TABLE user_subscriptions ADD COLUMN last_extended_by INT UNSIGNED NULL AFTER auto_renew`);
    await safeAlter(`ALTER TABLE user_subscriptions ADD COLUMN last_extended_at DATETIME NULL AFTER last_extended_by`);
    await safeAlter(`ALTER TABLE user_subscriptions ADD INDEX idx_subscriptions_source_order (source_order_id)`);
    await safeAlter(`ALTER TABLE user_subscriptions ADD CONSTRAINT fk_subscriptions_source_order FOREIGN KEY (source_order_id) REFERENCES orders(id) ON DELETE SET NULL`);
    await safeAlter(`ALTER TABLE user_subscriptions ADD CONSTRAINT fk_subscriptions_extended_by FOREIGN KEY (last_extended_by) REFERENCES users(id) ON DELETE SET NULL`);
    await pool.query(`
      INSERT INTO payment_methods (name,code,method_type,provider,instructions,sort_order,is_active)
      VALUES
      ('DGePay Online','dgepay','gateway','DGePay','Secure hosted checkout. Payment is verified server-side.',1,1),
      ('bKash Personal','bkash','mobile_banking','bKash','Send Money and submit the TrxID for admin verification.',2,0),
      ('Nagad Personal','nagad','mobile_banking','Nagad','Send Money and submit the TrxID for admin verification.',3,0),
      ('Voucher Payment','voucher','voucher','Manual Voucher','Submit voucher/coupon code and proof. Admin approval is required.',4,1),
      ('Bank Transfer','bank','bank','Bank','Submit transfer reference and proof. Admin approval is required.',5,0)
      ON DUPLICATE KEY UPDATE name=VALUES(name);
    `);

    // Keep previous payment methods and add DGePay as the verified online gateway.
    try {
      await pool.query(`ALTER TABLE recharges MODIFY payment_method ENUM('bkash', 'nagad', 'rocket', 'card', 'bank', 'manual', 'dgepay') NOT NULL;`);
    } catch (e) { /* column already supports dgepay or table differs */ }

    // DGePay existing-database fix is also available at db-migrations/002_dgepay_existing_db_fixes.sql

    // 9. Call Logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS call_logs (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        call_type ENUM('incoming', 'outgoing', 'ai_outbound') NOT NULL,
        from_number VARCHAR(30) NOT NULL,
        to_number VARCHAR(30) NOT NULL,
        duration_seconds INT NOT NULL DEFAULT 0,
        cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        status ENUM('completed', 'missed', 'busy', 'failed') NOT NULL DEFAULT 'completed',
        recording_url VARCHAR(255) NULL,
        ai_campaign_id INT UNSIGNED NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 10. AI Voice Campaigns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_campaigns (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        name VARCHAR(150) NOT NULL,
        status ENUM('draft', 'running', 'paused', 'completed') NOT NULL DEFAULT 'running',
        voice_type VARCHAR(50) NOT NULL DEFAULT 'Bangla Natural Female',
        script_template TEXT NOT NULL,
        total_contacts INT NOT NULL DEFAULT 0,
        contacts_completed INT NOT NULL DEFAULT 0,
        successful_calls INT NOT NULL DEFAULT 0,
        failed_calls INT NOT NULL DEFAULT 0,
        scheduled_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 11. AI Campaign Contacts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_contacts (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        campaign_id INT UNSIGNED NOT NULL,
        user_id INT UNSIGNED NOT NULL,
        contact_name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(25) NOT NULL,
        status ENUM('pending', 'calling', 'completed', 'failed', 'busy') NOT NULL DEFAULT 'pending',
        call_duration INT NOT NULL DEFAULT 0,
        result_notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES ai_campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 12. Support Tickets
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        ticket_code VARCHAR(30) NOT NULL UNIQUE,
        user_id INT UNSIGNED NOT NULL,
        department ENUM('technical', 'billing', 'telecom_pbx', 'ai_calling', 'general') NOT NULL DEFAULT 'technical',
        subject VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
        status ENUM('open', 'in_progress', 'waiting_for_user', 'resolved', 'closed') NOT NULL DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 13. Ticket Messages (Conversation thread)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT UNSIGNED NOT NULL,
        user_id INT UNSIGNED NOT NULL,
        sender_type ENUM('user', 'admin') NOT NULL,
        message TEXT NOT NULL,
        attachment VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 14. Notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        title VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('recharge', 'package', 'order', 'support', 'system', 'ai_usage') NOT NULL DEFAULT 'system',
        is_read BOOLEAN NOT NULL DEFAULT 0,
        link VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 15. Site Settings (CMS table for dynamic contents & settings)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT NOT NULL,
        setting_group VARCHAR(50) NOT NULL DEFAULT 'general',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log("✅ Database tables created successfully (including DGePay payments)." );

    // ============================================
    // SEEDING INITIAL DATA
    // ============================================
    console.log("🌱 Seeding initial records...");

    // Seed Admin & Default User
    const adminPass = await bcrypt.hash("admin@gmail.com", 12);
    const userPass = await bcrypt.hash("password123", 12);

    await pool.query(`
      INSERT INTO users (id, name, email, phone, password, role, status, balance, ai_minutes)
      VALUES 
        (1, 'Aporna User', 'user@mybdphone.com', '01711000001', ?, 'user', 'active', 1500.00, 120),
        (2, 'System Admin', 'admin@gmail.com', '01711000000', ?, 'admin', 'active', 50000.00, 10000)
      ON DUPLICATE KEY UPDATE 
        name=VALUES(name), 
        password=VALUES(password), 
        role=VALUES(role),
        status=VALUES(status);
    `, [userPass, adminPass]);

    // Seed Packages (2 IP Phone + 2 AI Calling)
    const initialPackages = [
      {
        id: 1,
        name: "StartUp Monthly",
        slug: "startup-monthly",
        service_type: "ip_phone",
        price: 500.00,
        billing_period: "monthly",
        description: "Perfect for startups and growing teams requiring a professional 096 IP number and multi-device access.",
        features: JSON.stringify([
          "096XXXXXXXX Number Registration",
          "Caller Tune Included",
          "PC Support (Windows / Linux / Mac)",
          "Laptop Support",
          "Android App Support",
          "Maximum 5 Devices / Extensions",
          "Comprehensive Call History"
        ]),
        call_minutes: 300,
        device_limit: 5,
        ai_credits: 0,
        concurrent_calls: 3,
        recording_enabled: 0,
        caller_tune_enabled: 1,
        is_recommended: 0,
        status: "active",
        badge_text: "Starter Choice",
        sort_order: 1
      },
      {
        id: 2,
        name: "Pro Monthly",
        slug: "pro-monthly",
        service_type: "ip_phone",
        price: 1000.00,
        billing_period: "monthly",
        description: "High-capacity corporate PBX with automated call recording, crystal-clear audio, and up to 10 connected devices.",
        features: JSON.stringify([
          "096XXXXXXXX Number Registration",
          "Caller Tune Included",
          "PC Support (Windows / Mac)",
          "Laptop Support",
          "Android App Support",
          "Maximum 10 Devices / Extensions",
          "Call History & Analytics",
          "Automated Call Recording (Cloud Archive)",
          "Priority 24/7 Enterprise Support"
        ]),
        call_minutes: 1000,
        device_limit: 10,
        ai_credits: 0,
        concurrent_calls: 10,
        recording_enabled: 1,
        caller_tune_enabled: 1,
        is_recommended: 1,
        status: "active",
        badge_text: "Most Popular",
        sort_order: 2
      },
      {
        id: 3,
        name: "AI Starter",
        slug: "ai-starter",
        service_type: "ai_calling",
        price: 1500.00,
        billing_period: "monthly",
        description: "Automate appointment reminders, customer surveys, and outbound notifications with natural Bangla & English AI voices.",
        features: JSON.stringify([
          "500 Outbound AI Call Minutes",
          "Natural Bangla & English Voice Engine",
          "Smart Text-to-Speech (TTS)",
          "Up to 3 Active Call Campaigns",
          "5 Concurrent Automated Calls",
          "Campaign Analytics & Delivery Logs",
          "Contact List CSV Uploader (Max 2,000 Contacts)"
        ]),
        call_minutes: 500,
        device_limit: 1,
        ai_credits: 500,
        concurrent_calls: 5,
        recording_enabled: 0,
        caller_tune_enabled: 0,
        is_recommended: 0,
        status: "active",
        badge_text: "Automation Starter",
        sort_order: 3
      },
      {
        id: 4,
        name: "AI Pro",
        slug: "ai-pro",
        service_type: "ai_calling",
        price: 3500.00,
        billing_period: "monthly",
        description: "Enterprise voice automation platform with interactive IVR keypad responses, high concurrency, and premium neural AI voices.",
        features: JSON.stringify([
          "2,000 Outbound AI Call Minutes",
          "Premium Neural AI Bangla & Multilingual Voices",
          "Interactive IVR Keypad Touch-tone (DTMF) Flow",
          "Unlimited Active Call Campaigns",
          "25 Concurrent Automated Calls",
          "Full Voice Call Recording & AI Transcription",
          "Deep Real-Time Analytics & Webhook API Bridge",
          "Priority Dedicated Support"
        ]),
        call_minutes: 2000,
        device_limit: 5,
        ai_credits: 2000,
        concurrent_calls: 25,
        recording_enabled: 1,
        caller_tune_enabled: 0,
        is_recommended: 1,
        status: "active",
        badge_text: "Enterprise Voice",
        sort_order: 4
      }
    ];

    // Delete any previous corrupted seeds if any
    await pool.query("DELETE FROM user_subscriptions;");
    await pool.query("DELETE FROM packages;");

    for (const pkg of initialPackages) {
      await pool.query(`
        INSERT INTO packages 
        (id, name, slug, service_type, price, billing_period, description, features, call_minutes, device_limit, ai_credits, concurrent_calls, recording_enabled, caller_tune_enabled, is_recommended, status, badge_text, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        pkg.id, pkg.name, pkg.slug, pkg.service_type, pkg.price, pkg.billing_period, pkg.description, pkg.features,
        pkg.call_minutes, pkg.device_limit, pkg.ai_credits, pkg.concurrent_calls, pkg.recording_enabled,
        pkg.caller_tune_enabled, pkg.is_recommended, pkg.status, pkg.badge_text, pkg.sort_order
      ]);
    }

    // Seed IP Numbers pool
    const ipNumbers = [
      { number: "096490123756", status: "assigned", assigned_user_id: 1, category: "regular", price: 0.00, device_count: 3, max_devices: 10, sip_username: "user_096490123756", sip_password: "sip_pass_secure_123" },
      { number: "09678112233", status: "available", assigned_user_id: null, category: "silver", price: 200.00, device_count: 0, max_devices: 5, sip_username: "09678112233", sip_password: "sip_pass_seed_1" },
      { number: "09678990011", status: "available", assigned_user_id: null, category: "gold", price: 500.00, device_count: 0, max_devices: 10, sip_username: "09678990011", sip_password: "sip_pass_seed_2" },
      { number: "09612778899", status: "available", assigned_user_id: null, category: "regular", price: 0.00, device_count: 0, max_devices: 5, sip_username: "09612778899", sip_password: "sip_pass_seed_3" },
      { number: "09600008888", status: "available", assigned_user_id: null, category: "platinum", price: 1200.00, device_count: 0, max_devices: 20, sip_username: "09600008888", sip_password: "sip_pass_seed_4" },
    ];

    for (const num of ipNumbers) {
      await pool.query(`
        INSERT INTO ip_numbers 
        (number, status, assigned_user_id, category, price, device_count, max_devices, sip_username, sip_password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE status=VALUES(status), assigned_user_id=VALUES(assigned_user_id);
      `, [num.number, num.status, num.assigned_user_id, num.category, num.price, num.device_count, num.max_devices, num.sip_username, num.sip_password]);
    }

    // Get Pro Monthly Package and first IP number
    const [proPkgs] = await pool.query("SELECT id FROM packages WHERE slug = 'pro-monthly' LIMIT 1");
    const [ipNums] = await pool.query("SELECT id FROM ip_numbers WHERE number = '096490123756' LIMIT 1");

    const proPkgId = proPkgs.length > 0 ? proPkgs[0].id : 2;
    const ipNumId = ipNums.length > 0 ? ipNums[0].id : 1;

    // Seed Active Subscription for default user
    await pool.query(`
      INSERT INTO user_subscriptions 
      (id, user_id, package_id, ip_number_id, assigned_number, service_type, status, started_at, expires_at, auto_renew)
      VALUES (1, 1, ?, ?, '096490123756', 'ip_phone', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 1)
      ON DUPLICATE KEY UPDATE status='active';
    `, [proPkgId, ipNumId]);

    // Seed Shop Products
    const shopProducts = [
      {
        name: "Caller Tune Subscription",
        slug: "caller-tune-subscription",
        category: "caller_tune",
        price: 99.00,
        description: "Set customized corporate greeting or brand music for all inbound callers on your 096 number.",
        features: JSON.stringify(["Custom Audio File Upload", "MP3 / WAV Support", "Schedule Business Hours Jingle", "Instant Audio Live Preview"]),
        badge: "Popular Add-on"
      },
      {
        name: "Call Recording Cloud Archive",
        slug: "call-recording-cloud-archive",
        category: "recording",
        price: 199.00,
        description: "Secure, encrypted cloud storage for 90 days of all inbound and outbound call audio recordings with instant playback.",
        features: JSON.stringify(["90-Day Cloud Storage", "In-Browser Audio Player", "Downloadable MP3 Files", "GDPR / BTRC Compliant Encryption"]),
        badge: "Essential for Business"
      },
      {
        name: "Additional 5 Device Licenses",
        slug: "additional-5-device-licenses",
        category: "device_addon",
        price: 300.00,
        description: "Expand your PBX capacity by connecting 5 additional PC, Android, or hardware IP phones to your 096 number.",
        features: JSON.stringify(["5 Additional Concurrent Device Logins", "SIP Authentication Tokens", "Multi-Seat Ring Group Support"]),
        badge: "Scale Your Team"
      },
      {
        name: "VIP Golden 096 IP Number",
        slug: "vip-golden-096-ip-number",
        category: "vip_number",
        price: 999.00,
        description: "Memorable repeating digit premium 096 business phone number that establishes immediate enterprise authority.",
        features: JSON.stringify(["Exclusive Golden Digit Sequence", "Lifetime Number Ownership", "Free Number Portability Guidance"]),
        badge: "Exclusive"
      }
    ];

    for (const prod of shopProducts) {
      await pool.query(`
        INSERT INTO shop_products (name, slug, category, price, description, features, badge)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), description=VALUES(description), features=VALUES(features);
      `, [prod.name, prod.slug, prod.category, prod.price, prod.description, prod.features, prod.badge]);
    }

    // Seed Sample Recharges & Transactions for default user
    await pool.query(`
      INSERT INTO recharges (id, user_id, amount, payment_method, transaction_id, sender_phone, status, notes)
      VALUES 
        (1, 1, 1000.00, 'bkash', 'BTRX99882211', '01711000001', 'completed', 'bKash instant online recharge'),
        (2, 1, 1500.00, 'nagad', 'NGD77665544', '01711000001', 'completed', 'Nagad online payment')
      ON DUPLICATE KEY UPDATE status='completed';
    `);

    await pool.query(`
      INSERT INTO transactions (id, transaction_code, user_id, type, direction, amount, balance_after, reference_id, description, status)
      VALUES 
        (1, 'TXN-2026-001', 1, 'recharge', 'credit', 1000.00, 1000.00, 'BTRX99882211', 'bKash Wallet Recharge', 'completed'),
        (2, 'TXN-2026-002', 1, 'package_purchase', 'debit', 1000.00, 0.00, 'PKG-PRO-01', 'Purchased Pro Monthly Package', 'completed'),
        (3, 'TXN-2026-003', 1, 'recharge', 'credit', 1500.00, 1500.00, 'NGD77665544', 'Nagad Wallet Recharge', 'completed')
      ON DUPLICATE KEY UPDATE status='completed';
    `);

    // Seed Sample Orders
    await pool.query(`
      INSERT INTO orders (id, order_number, user_id, product_id, package_id, item_type, item_title, amount, payment_method, payment_status, status, details)
      VALUES 
        (1, 'ORD-88001', 1, NULL, 2, 'package', 'Pro Monthly Package (096490123756)', 1000.00, 'wallet_balance', 'paid', 'active', JSON_OBJECT('devices', 10, 'recording', true)),
        (2, 'ORD-88002', 1, 1, NULL, 'shop_product', 'Caller Tune Subscription', 99.00, 'wallet_balance', 'paid', 'completed', JSON_OBJECT('tune', 'Welcome to Corporate Hotline'))
      ON DUPLICATE KEY UPDATE status='completed';
    `);

    // Seed Sample Call Logs
    await pool.query(`
      INSERT INTO call_logs (id, user_id, call_type, from_number, to_number, duration_seconds, cost, status, recording_url)
      VALUES 
        (1, 1, 'incoming', '01799887766', '096490123756', 145, 0.00, 'completed', 'https://actions.google.com/sounds/v1/telephones/phone_ring.ogg'),
        (2, 1, 'outgoing', '096490123756', '01811223344', 310, 2.50, 'completed', 'https://actions.google.com/sounds/v1/telephones/phone_ring.ogg'),
        (3, 1, 'ai_outbound', '096490123756', '01912345678', 45, 1.20, 'completed', NULL),
        (4, 1, 'incoming', '01655443322', '096490123756', 0, 0.00, 'missed', NULL)
      ON DUPLICATE KEY UPDATE status=VALUES(status);
    `);

    // Seed Sample AI Campaign
    await pool.query(`
      INSERT INTO ai_campaigns (id, user_id, name, status, voice_type, script_template, total_contacts, contacts_completed, successful_calls, failed_calls)
      VALUES 
        (1, 1, 'Ramadan Customer Greeting & Promo', 'running', 'Bangla Natural Female', 'আসসালামু আলাইকুম {name}! MyBDPhone এর পক্ষ থেকে আপনাকে আন্তরিক শুভেচ্ছা। আপনার ব্যবসার জন্য আমাদের নতুন অফার চালু হয়েছে। বিস্তারিত জানতে ১ চাপুন।', 50, 42, 38, 4)
      ON DUPLICATE KEY UPDATE status=VALUES(status);
    `);

    // Seed Sample Support Ticket & Messages
    await pool.query(`
      INSERT INTO support_tickets (id, ticket_code, user_id, department, subject, message, priority, status)
      VALUES 
        (1, 'TCK-2026-901', 1, 'telecom_pbx', 'Need assistance configuring Android SIP Softphone', 'Hello, I registered 096490123756 and want to know how to connect Zoiper on Android.', 'medium', 'open')
      ON DUPLICATE KEY UPDATE status=VALUES(status);
    `);

    await pool.query(`
      INSERT INTO ticket_messages (id, ticket_id, user_id, sender_type, message)
      VALUES 
        (1, 1, 1, 'user', 'Hello, I registered 096490123756 and want to know how to connect Zoiper on Android.'),
        (2, 1, 2, 'admin', 'Hello Aporna! You can use Domain: sip.mybdphone.com:5060 with your assigned SIP username and password shown on your dashboard under My IP Phone tab.')
      ON DUPLICATE KEY UPDATE message=VALUES(message);
    `);

    // Seed Sample Notifications
    await pool.query(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
      VALUES 
        (1, 1, 'Welcome to MyBDPhone', 'Your 096490123756 IP Phone line is now active and ready for multi-device calling.', 'system', 0, '/user/ip-phone'),
        (2, 1, 'Recharge Successful', '৳1,500 has been credited to your account balance via Nagad.', 'recharge', 1, '/user/transactions')
      ON DUPLICATE KEY UPDATE title=VALUES(title);
    `);

    // Seed CMS Settings
    const defaultSettings = [
      { key: "site_name", value: "MyBDPhone", group: "general" },
      { key: "tagline", value: "Your Phone. Your Business. Powered by AI.", group: "general" },
      { key: "hero_headline", value: "Smart Business Calling, Simplified.", group: "homepage" },
      { key: "hero_subtitle", value: "Get your dedicated 096 IP phone number, manage calling balances, and automate business customer calls with intelligent AI voice agents — all in one unified telecom platform.", group: "homepage" },
      { key: "hotline_phone", value: "+880 1521561710", group: "contact" },
      { key: "support_email", value: "support@mybdphone.com", group: "contact" },
      { key: "office_address", value: "Level 14, BDBL Bhaban, 12 Kazi Nazrul Islam Ave, Karwan Bazar, Dhaka-1215, Bangladesh", group: "contact" },
      { key: "min_recharge", value: "1", group: "billing" },
      { key: "max_recharge", value: "10000", group: "billing" },
      { key: "primary_096_number", value: "096490123756", group: "telecom" },
      { key: "bkash_merchant", value: "01700000000", group: "payment" },
      { key: "nagad_merchant", value: "01800000000", group: "payment" },
      { key: "rocket_merchant", value: "01900000000", group: "payment" }
    ];

    for (const setting of defaultSettings) {
      await pool.query(`
        INSERT INTO site_settings (setting_key, setting_value, setting_group)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
      `, [setting.key, setting.value, setting.group]);
    }

    // Ensure no-code CMS tables and starter content exist. This is additive and does not delete CMS data.
    const { ensureCmsTables } = require("../controllers/cmsController");
    await ensureCmsTables();

    // Ensure client brand slider tables and starter logos exist.
    const { ensureClientBrandTables } = require("../controllers/clientBrandController");
    await ensureClientBrandTables();

    console.log("🎉 Database migration and seeding completed successfully!");
    process.exit(0);

  } catch (error) {
    // console.error("❌ MIGRATION ERROR:", error);
    process.exit(1);
  }
};

migrate();
