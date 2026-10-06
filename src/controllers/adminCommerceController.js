const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("../config/db");
const { activatePackage } = require("./orderController");
const { notifyAdmins } = require("../services/adminNotificationService");
const {
  verifyMoneybagTransaction,
  normalizeMoneybagStatus,
  getMoneybagTransactionId,
  getMoneybagOrderRef,
  getMoneybagAmount,
  getMoneybagCurrency,
} = require("../services/moneybagService");

const ensureCommerceTables = async () => {
  await pool.query(`CREATE TABLE IF NOT EXISTS payment_methods (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await pool.query(`CREATE TABLE IF NOT EXISTS admin_notifications (
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
    CONSTRAINT fk_admin_notifications_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  const safe = async (sql) => {
    try {
      await pool.query(sql);
    } catch (e) {
      if (!["ER_DUP_FIELDNAME", "ER_DUP_KEYNAME"].includes(e.code))
        console.warn("[Commerce migration]", e.code, e.message);
    }
  };
  await safe(
    `ALTER TABLE payment_methods ADD COLUMN logo_url VARCHAR(500) NULL AFTER config`
  );
  await pool.query(
    `INSERT INTO site_settings (setting_key, setting_value, setting_group) VALUES ('primary_096_number','096490123756','telecom') ON DUPLICATE KEY UPDATE setting_key=setting_key`
  );
  await pool.query(
    `INSERT INTO ip_numbers (number,status,assigned_user_id,category,price,device_count,max_devices,sip_username,sip_password) VALUES ('096490123756','available',NULL,'regular',0,0,5,'sip_096490123756','sip_pass_primary') ON DUPLICATE KEY UPDATE number=number`
  );
  await safe(
    `ALTER TABLE orders ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'BDT' AFTER amount`
  );
  await safe(
    `ALTER TABLE orders ADD COLUMN customer_note TEXT NULL AFTER details`
  );
  await safe(
    `ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(150) NULL AFTER customer_note`
  );
  await safe(
    `ALTER TABLE orders ADD COLUMN payment_proof_url VARCHAR(500) NULL AFTER payment_reference`
  );
  await safe(
    `ALTER TABLE orders ADD COLUMN reviewed_by INT UNSIGNED NULL AFTER payment_proof_url`
  );
  await safe(
    `ALTER TABLE orders ADD COLUMN reviewed_at DATETIME NULL AFTER reviewed_by`
  );
  await safe(
    `ALTER TABLE orders ADD INDEX idx_orders_payment_reference (payment_reference)`
  );
  await safe(
    `ALTER TABLE orders ADD INDEX idx_orders_reviewed_by (reviewed_by)`
  );
  await safe(
    `ALTER TABLE orders ADD CONSTRAINT fk_orders_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL`
  );
  await safe(
    `ALTER TABLE payments ADD COLUMN provider_name VARCHAR(100) NULL AFTER gateway`
  );
  await safe(
    `ALTER TABLE payments ADD COLUMN payer_phone VARCHAR(30) NULL AFTER payment_method`
  );
  await safe(
    `ALTER TABLE payments ADD COLUMN proof_url VARCHAR(500) NULL AFTER gateway_response`
  );
  await safe(`ALTER TABLE payments ADD COLUMN notes TEXT NULL AFTER proof_url`);
  await safe(
    `ALTER TABLE payments ADD COLUMN reviewed_by INT UNSIGNED NULL AFTER notes`
  );
  await safe(
    `ALTER TABLE payments ADD COLUMN reviewed_at DATETIME NULL AFTER reviewed_by`
  );
  await safe(
    `ALTER TABLE payments ADD INDEX idx_payments_reviewed_by (reviewed_by)`
  );
  await safe(
    `ALTER TABLE payments ADD CONSTRAINT fk_payments_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL`
  );
  await safe(
    `ALTER TABLE recharges MODIFY COLUMN payment_method ENUM('bkash','nagad','rocket','card','bank','manual','dgepay','moneybag') NOT NULL`
  );
  await safe(
    `ALTER TABLE user_subscriptions ADD COLUMN source_order_id INT UNSIGNED NULL AFTER package_id`
  );
  await safe(
    `ALTER TABLE user_subscriptions ADD COLUMN last_extended_by INT UNSIGNED NULL AFTER auto_renew`
  );
  await safe(
    `ALTER TABLE user_subscriptions ADD COLUMN last_extended_at DATETIME NULL AFTER last_extended_by`
  );
  await safe(
    `ALTER TABLE user_subscriptions ADD INDEX idx_subscriptions_source_order (source_order_id)`
  );
  await safe(
    `ALTER TABLE user_subscriptions ADD CONSTRAINT fk_subscriptions_source_order FOREIGN KEY (source_order_id) REFERENCES orders(id) ON DELETE SET NULL`
  );
  await safe(
    `ALTER TABLE user_subscriptions ADD CONSTRAINT fk_subscriptions_extended_by FOREIGN KEY (last_extended_by) REFERENCES users(id) ON DELETE SET NULL`
  );
  await pool.query(`CREATE TABLE IF NOT EXISTS moneybag_webhook_events (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`INSERT INTO payment_methods (name,code,method_type,provider,instructions,sort_order,is_active) VALUES
    ('DGePay Online','dgepay','gateway','DGePay','Secure hosted checkout. Payment is verified server-side.',1,1),
    ('Moneybag Online','moneybag','gateway','Moneybag','Secure hosted checkout. Gateway state is verified server-side and admin approval is required before activation/credit.',2,1),
    ('bKash Personal','bkash','mobile_banking','bKash','Send Money and submit the TrxID for admin verification.',2,0),
    ('Nagad Personal','nagad','mobile_banking','Nagad','Send Money and submit the TrxID for admin verification.',3,0),
    ('Voucher Payment','voucher','voucher','Manual Voucher','Submit voucher/coupon code and proof. Admin approval is required.',4,1),
    ('Bank Transfer','bank','bank','Bank','Submit transfer reference and proof. Admin approval is required.',5,0)
    ON DUPLICATE KEY UPDATE name=VALUES(name)`);

  // Preserve a previously uploaded placeholder logo when migrating it to the Moneybag code.
  await safe(`UPDATE payment_methods mb
  JOIN payment_methods old ON old.code='moneybank'
  SET mb.logo_url=COALESCE(mb.logo_url, old.logo_url)
  WHERE mb.code='moneybag' AND (mb.logo_url IS NULL OR mb.logo_url='')`);

  // The old placeholder row from the previous UI should not remain selectable.
  await safe(`UPDATE payment_methods SET is_active=0 WHERE code='moneybank'`);
};

const makeRef = (prefix) =>
  `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

const logAdmin = async (
  connection,
  adminId,
  userId,
  action,
  description,
  metadata = {}
) => {
  await connection.query(
    `INSERT INTO user_admin_activity (admin_id, user_id, action, description, metadata) VALUES (?, ?, ?, ?, ?)`,
    [adminId, userId, action, description, JSON.stringify(metadata)]
  );
};

const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      company_name,
      address,
      status = "active",
      initial_balance = 0,
    } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Name, email and password (minimum 6 characters) are required",
        });
    }
    const balance = Number(initial_balance || 0);
    if (!Number.isFinite(balance) || balance < 0)
      return res
        .status(400)
        .json({ success: false, message: "Invalid initial balance" });
    const hashed = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      `INSERT INTO users (name,email,phone,password,role,status,balance,company_name,address,kyc_status) VALUES (?,?,?,?, 'user', ?, ?, ?, ?, 'unsubmitted')`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        phone?.trim() || null,
        hashed,
        status,
        balance,
        company_name?.trim() || null,
        address?.trim() || null,
      ]
    );
    if (balance > 0) {
      await pool.query(
        `INSERT INTO transactions (transaction_code,user_id,type,direction,amount,balance_after,reference_id,description,status) VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          makeRef("ADJ"),
          result.insertId,
          "adjustment",
          "credit",
          balance,
          balance,
          "ADMIN-CREATE",
          "Initial wallet balance added by admin",
          "completed",
        ]
      );
    }
    return res
      .status(201)
      .json({
        success: true,
        message: "Customer account created successfully",
        user_id: result.insertId,
      });
  } catch (error) {
    console.error("ADMIN CREATE USER ERROR:", error);
    if (error.code === "ER_DUP_ENTRY")
      return res
        .status(409)
        .json({
          success: false,
          message: "Email or phone is already registered",
        });
    return res
      .status(500)
      .json({ success: false, message: "Server error creating customer" });
  }
};

const getPayments = async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `SELECT p.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
      o.order_number, o.item_title, o.item_type, o.status AS order_status, o.payment_status AS order_payment_status, o.payment_reference AS order_payment_reference, o.payment_proof_url AS order_payment_proof_url,
      r.transaction_id AS recharge_transaction_id, r.status AS recharge_status
      FROM payments p JOIN users u ON u.id=p.user_id
      LEFT JOIN orders o ON o.id=p.order_id
      LEFT JOIN recharges r ON r.id=p.recharge_id WHERE 1=1`;
    const params = [];
    if (status) {
      if (status === "pending") {
        sql +=
          " AND ((p.gateway = 'manual' AND p.status = 'pending') OR (p.gateway IN ('dgepay','moneybag') AND p.gateway_status IN ('approved','success','3','paid') AND p.status <> 'cancelled' AND (COALESCE(o.payment_status,'unpaid') = 'unpaid' OR r.status = 'pending')))";
      } else if (status === "cancelled") {
        sql += " AND (p.status = 'cancelled' OR p.gateway_status = 'cancelled' OR o.status = 'cancelled' OR r.status = 'cancelled')";
      } else if (status === "failed") {
        sql += " AND (p.status IN ('failed','rejected') OR p.gateway_status IN ('failed','rejected') OR o.status = 'failed' OR r.status = 'failed')";
      } else if (status === "approved") {
        sql += " AND (p.status = 'approved' OR o.payment_status = 'paid' OR r.status = 'completed')";
      } else {
        sql += " AND p.status = ?";
        params.push(status);
      }
    }
    if (search) {
      const q = `%${search}%`;
      sql +=
        " AND (u.name LIKE ? OR u.email LIKE ? OR p.gateway_unique_txn_id LIKE ? OR p.gateway_transaction_id LIKE ? OR o.order_number LIKE ? OR r.transaction_id LIKE ?)";
      params.push(q, q, q, q, q, q);
    }
    sql += " ORDER BY p.created_at DESC";
    const [payments] = await pool.query(sql, params);
    return res.json({ success: true, payments });
  } catch (error) {
    console.error("ADMIN GET PAYMENTS ERROR:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching payments" });
  }
};

const parseOrderDetails = (details) => {
  if (details == null || details === "") return null;
  if (typeof details === "object") return details;
  try {
    return JSON.parse(details);
  } catch (error) {
    console.warn(
      "Invalid order.details JSON; using package lookup fallback:",
      error.message
    );
    return null;
  }
};

const verifyPayment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const paymentId = Number(req.params.id);
    const decision = String(req.body?.status || "").toLowerCase();
    const note = String(req.body?.note || "").trim();
    if (
      !Number.isInteger(paymentId) ||
      !["approved", "failed", "cancelled"].includes(decision)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Valid payment and verification status are required",
        });
    }

    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT * FROM payments WHERE id=? LIMIT 1 FOR UPDATE`,
      [paymentId]
    );
    if (!rows.length) {
      await connection.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }
    const payment = rows[0];
    if (payment.status === "approved" && decision !== "approved") {
      await connection.rollback();
      return res
        .status(409)
        .json({
          success: false,
          message: "An approved payment cannot be rejected from this screen",
        });
    }
    if (payment.status === decision && decision !== "approved") {
      await connection.rollback();
      return res.json({
        success: true,
        message: "Payment already has this status",
      });
    }

    // Online gateways must be verified server-side immediately before approval.
    if (
      decision === "approved" &&
      ["dgepay", "moneybag"].includes(
        String(payment.gateway || "").toLowerCase()
      )
    ) {
      const gatewayName = String(payment.gateway || "").toLowerCase();
      if (gatewayName === "moneybag") {
        const txId = String(payment.gateway_transaction_id || "").trim();
        if (!txId) {
          await connection.rollback();
          return res
            .status(409)
            .json({
              success: false,
              message:
                "Moneybag transaction ID is missing. Wait for payment verification first.",
            });
        }

        const gatewayData = await verifyMoneybagTransaction(txId);
        const gatewayState = normalizeMoneybagStatus(gatewayData);
        if (gatewayState !== "approved") {
          await connection.rollback();
          return res
            .status(409)
            .json({
              success: false,
              message: `Moneybag has not confirmed this transaction as successful. Current gateway status: ${gatewayState}.`,
            });
        }

        const verifiedTxn = String(
          getMoneybagTransactionId(gatewayData) || txId
        ).trim();
        const verifiedRef = String(
          getMoneybagOrderRef(gatewayData) || ""
        ).trim();
        const verifiedAmount = Number(getMoneybagAmount(gatewayData));
        const verifiedCurrency = String(
          getMoneybagCurrency(gatewayData) || payment.currency || "BDT"
        ).toUpperCase();

        let expectedRef = String(payment.gateway_order_id || "").trim();
        let expectedAmount = Number(payment.amount || 0);
        if (payment.recharge_id) {
          const [[r]] = await connection.query(
            `SELECT transaction_id, amount FROM recharges WHERE id=? LIMIT 1`,
            [payment.recharge_id]
          );
          if (!r) throw new Error("Related recharge not found");
          expectedRef = String(r.transaction_id || expectedRef).trim();
          expectedAmount = Number(r.amount || expectedAmount);
        } else if (payment.order_id) {
          const [[o]] = await connection.query(
            `SELECT order_number, amount, currency FROM orders WHERE id=? LIMIT 1`,
            [payment.order_id]
          );
          if (!o) throw new Error("Related order not found");
          expectedRef = String(o.order_number || expectedRef).trim();
          expectedAmount = Number(o.amount || expectedAmount);
        }

        if (!verifiedRef || verifiedRef !== expectedRef) {
          await connection.rollback();
          return res
            .status(409)
            .json({
              success: false,
              message: `Moneybag order reference mismatch. Expected ${expectedRef}, received ${
                verifiedRef || "missing"
              }.`,
            });
        }
        if (
          !Number.isFinite(verifiedAmount) ||
          Math.abs(verifiedAmount - expectedAmount) > 0.01
        ) {
          await connection.rollback();
          return res
            .status(409)
            .json({
              success: false,
              message: `Moneybag amount mismatch. Expected ৳${expectedAmount.toFixed(
                2
              )}, received ${
                Number.isFinite(verifiedAmount)
                  ? verifiedAmount.toFixed(2)
                  : "invalid"
              }.`,
            });
        }
        if (
          verifiedCurrency !== String(payment.currency || "BDT").toUpperCase()
        ) {
          await connection.rollback();
          return res
            .status(409)
            .json({
              success: false,
              message: `Moneybag currency mismatch. Expected ${
                payment.currency || "BDT"
              }, received ${verifiedCurrency}.`,
            });
        }

        // Save the latest provider response, but do NOT credit wallet here.
        // The normal approval block below performs the one-time credit.
        await connection.query(
          `UPDATE payments SET gateway_transaction_id=?, gateway_status='approved', gateway_response=? WHERE id=?`,
          [verifiedTxn, JSON.stringify(gatewayData || {}), paymentId]
        );
        payment.gateway_transaction_id = verifiedTxn;
        payment.gateway_status = "approved";
      } else {
        const gatewayStatus = String(
          payment.gateway_status || ""
        ).toLowerCase();
        if (
          ![
            "approved",
            "verified",
            "success",
            "successful",
            "paid",
            "completed",
          ].includes(gatewayStatus)
        ) {
          await connection.rollback();
          return res
            .status(409)
            .json({
              success: false,
              message: `Gateway verification is not complete. Current gateway status: ${
                payment.gateway_status || "pending"
              }.`,
            });
        }
      }
    }

    await connection.query(
      `UPDATE payments SET status=?, gateway_status=?, notes=?, reviewed_by=?, reviewed_at=NOW(), paid_at=CASE WHEN ?='approved' THEN COALESCE(paid_at,NOW()) ELSE paid_at END WHERE id=?`,
      [decision, decision, note || null, req.user.id, decision, paymentId]
    );

    if (decision === "approved" && payment.order_id) {
      const [orders] = await connection.query(
        `SELECT * FROM orders WHERE id=? LIMIT 1 FOR UPDATE`,
        [payment.order_id]
      );
      if (!orders.length) throw new Error("Related order not found");
      const order = orders[0];
      if (order.payment_status !== "paid") {
        await connection.query(
          `UPDATE orders SET payment_status='paid', status=?, reviewed_by=?, reviewed_at=NOW() WHERE id=?`,
          [
            order.item_type === "package" ? "active" : "completed",
            req.user.id,
            order.id,
          ]
        );
        if (order.item_type === "package") {
          const snapshot = parseOrderDetails(order.details);
          const [pkgRows] = await connection.query(
            "SELECT * FROM packages WHERE id=? LIMIT 1",
            [order.package_id]
          );
          const pkg = snapshot && snapshot.id ? snapshot : pkgRows[0];
          if (!pkg) throw new Error("Package not found while activating order");
          await activatePackage(
            connection,
            { id: order.user_id },
            pkg,
            null,
            order.id
          );
        }
      }
      await connection.query(
        `INSERT INTO notifications (user_id,title,message,type,link) VALUES (?,?,?,?,?)`,
        [
          order.user_id,
          "Payment verified",
          `Your payment for order #${order.order_number} was approved and the service is now active.`,
          "order",
          "/user/orders",
        ]
      );
      await logAdmin(
        connection,
        req.user.id,
        order.user_id,
        "payment_verified",
        `Admin approved payment for order #${order.order_number}`,
        { payment_id: paymentId, order_id: order.id }
      );
    }

    if (decision === "approved" && payment.recharge_id) {
      const [recharges] = await connection.query(
        `SELECT * FROM recharges WHERE id=? LIMIT 1 FOR UPDATE`,
        [payment.recharge_id]
      );
      if (!recharges.length) throw new Error("Related recharge not found");
      const recharge = recharges[0];
      if (recharge.status !== "completed") {
        const [users] = await connection.query(
          `SELECT balance FROM users WHERE id=? LIMIT 1 FOR UPDATE`,
          [recharge.user_id]
        );
        if (!users.length) throw new Error("User not found");
        const next = Number(users[0].balance || 0) + Number(recharge.amount);
        await connection.query("UPDATE users SET balance=? WHERE id=?", [
          next,
          recharge.user_id,
        ]);
        await connection.query(
          `UPDATE recharges SET status='completed', notes=CONCAT(COALESCE(notes,''),' | Admin verified') WHERE id=?`,
          [recharge.id]
        );
        await connection.query(
          `INSERT INTO transactions (transaction_code,user_id,type,direction,amount,balance_after,reference_id,description,status) VALUES (?,?,?,?,?,?,?,?,?)`,
          [
            makeRef("RCH"),
            recharge.user_id,
            "recharge",
            "credit",
            recharge.amount,
            next,
            recharge.transaction_id,
            "Manual/admin verified wallet recharge",
            "completed",
          ]
        );
      }
      await connection.query(
        `INSERT INTO notifications (user_id,title,message,type,link) VALUES (?,?,?,?,?)`,
        [
          recharge.user_id,
          "Recharge approved",
          `Your recharge of ৳${Number(recharge.amount).toFixed(
            2
          )} has been credited to your wallet.`,
          "recharge",
          "/user/transactions",
        ]
      );
      await logAdmin(
        connection,
        req.user.id,
        recharge.user_id,
        "recharge_verified",
        `Admin approved recharge ${recharge.transaction_id}`,
        { payment_id: paymentId, recharge_id: recharge.id }
      );
    }

    if (decision !== "approved") {
      if (payment.order_id)
        await connection.query(
          `UPDATE orders SET status='cancelled', payment_status='unpaid', reviewed_by=?, reviewed_at=NOW() WHERE id=? AND payment_status <> 'paid'`,
          [req.user.id, payment.order_id]
        );
      if (payment.recharge_id)
        await connection.query(
          `UPDATE recharges SET status='failed', notes=CONCAT(COALESCE(notes,''),' | Admin verification: ',?) WHERE id=? AND status='pending'`,
          [decision, payment.recharge_id]
        );
    }

    await connection.commit();
    return res.json({
      success: true,
      message: `Payment ${decision} successfully`,
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}
    console.error("ADMIN VERIFY PAYMENT ERROR:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Server error verifying payment",
      });
  } finally {
    connection.release();
  }
};

const getPaymentMethods = async (req, res) => {
  try {
    const [methods] = await pool.query(
      "SELECT * FROM payment_methods ORDER BY sort_order ASC, id ASC"
    );
    return res.json({ success: true, methods });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error fetching payment methods",
      });
  }
};

const getPublicPaymentMethods = async (req, res) => {
  try {
    const [methods] = await pool.query(
      `SELECT id,name,code,method_type,provider,account_number,instructions,logo_url,sort_order FROM payment_methods WHERE is_active=1 ORDER BY sort_order ASC,id ASC`
    );
    return res.json({ success: true, methods });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error fetching payment methods",
      });
  }
};

const toBool = (value, fallback = true) => {
  if (value === undefined || value === null || value === "") return fallback;
  return value === true || value === 1 || value === "1" || value === "true";
};

const createPaymentMethod = async (req, res) => {
  try {
    const {
      name,
      code,
      method_type = "mobile_banking",
      provider,
      account_number,
      instructions,
      sort_order = 0,
    } = req.body || {};
    if (!name?.trim() || !code?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Method name and code are required" });
    const logoUrl = req.file
      ? `/uploads/payment-methods/${req.file.filename}`
      : null;
    const [result] = await pool.query(
      `INSERT INTO payment_methods (name,code,method_type,provider,account_number,instructions,sort_order,is_active,config,logo_url) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        name.trim(),
        code.trim().toLowerCase(),
        method_type,
        provider?.trim() || null,
        account_number?.trim() || null,
        instructions?.trim() || null,
        Number(sort_order) || 0,
        toBool(req.body.is_active, true) ? 1 : 0,
        null,
        logoUrl,
      ]
    );
    return res
      .status(201)
      .json({
        success: true,
        message: "Payment method added",
        id: result.insertId,
      });
  } catch (error) {
    console.error("CREATE PAYMENT METHOD ERROR:", error);
    if (error.code === "ER_DUP_ENTRY")
      return res
        .status(409)
        .json({
          success: false,
          message: "Payment method code already exists",
        });
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error creating payment method",
      });
  }
};

const updatePaymentMethod = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment method id" });
    const {
      name,
      code,
      method_type,
      provider,
      account_number,
      instructions,
      sort_order,
      is_active,
    } = req.body || {};
    const fields = [];
    const values = [];
    if (name !== undefined) {
      fields.push("name=?");
      values.push(name.trim());
    }
    if (code !== undefined) {
      fields.push("code=?");
      values.push(code.trim().toLowerCase());
    }
    if (method_type !== undefined) {
      fields.push("method_type=?");
      values.push(method_type);
    }
    if (provider !== undefined) {
      fields.push("provider=?");
      values.push(provider?.trim() || null);
    }
    if (account_number !== undefined) {
      fields.push("account_number=?");
      values.push(account_number?.trim() || null);
    }
    if (instructions !== undefined) {
      fields.push("instructions=?");
      values.push(instructions?.trim() || null);
    }
    if (sort_order !== undefined) {
      fields.push("sort_order=?");
      values.push(Number(sort_order) || 0);
    }
    if (is_active !== undefined) {
      fields.push("is_active=?");
      values.push(toBool(is_active, false) ? 1 : 0);
    }
    if (req.file) {
      fields.push("logo_url=?");
      values.push(`/uploads/payment-methods/${req.file.filename}`);
    }
    if (!fields.length)
      return res
        .status(400)
        .json({ success: false, message: "No changes supplied" });
    values.push(id);
    await pool.query(
      `UPDATE payment_methods SET ${fields.join(", ")} WHERE id=?`,
      values
    );
    return res.json({ success: true, message: "Payment method updated" });
  } catch (error) {
    console.error("UPDATE PAYMENT METHOD ERROR:", error);
    if (error.code === "ER_DUP_ENTRY")
      return res
        .status(409)
        .json({
          success: false,
          message: "Payment method code already exists",
        });
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error updating payment method",
      });
  }
};

const deletePaymentMethod = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [[method]] = await pool.query(
      "SELECT code FROM payment_methods WHERE id=? LIMIT 1",
      [id]
    );
    if (!method)
      return res
        .status(404)
        .json({ success: false, message: "Payment method not found" });
    const [[used]] = await pool.query(
      "SELECT COUNT(*) AS count FROM payments WHERE payment_method=?",
      [method.code]
    );
    if (Number(used.count) > 0 || method.code === "dgepay") {
      await pool.query("UPDATE payment_methods SET is_active=0 WHERE id=?", [
        id,
      ]);
      return res.json({
        success: true,
        message:
          "Payment method has history or is a core gateway, so it was deactivated instead of deleted",
      });
    }
    await pool.query("DELETE FROM payment_methods WHERE id=?", [id]);
    return res.json({ success: true, message: "Payment method deleted" });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error deleting payment method",
      });
  }
};

const getSubscriptions = async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `SELECT s.*,u.name AS user_name,u.email AS user_email,u.phone AS user_phone,p.name AS package_name,p.price AS package_price,p.billing_period,p.service_type,o.order_number AS source_order_number FROM user_subscriptions s JOIN users u ON u.id=s.user_id JOIN packages p ON p.id=s.package_id LEFT JOIN orders o ON o.id=s.source_order_id WHERE 1=1`;
    const params = [];
    if (status) {
      sql += " AND s.status=?";
      params.push(status);
    }
    if (search) {
      const q = `%${search}%`;
      sql +=
        " AND (u.name LIKE ? OR u.email LIKE ? OR p.name LIKE ? OR s.assigned_number LIKE ?)";
      params.push(q, q, q, q);
    }
    sql += " ORDER BY s.expires_at DESC";
    const [subscriptions] = await pool.query(sql, params);
    return res.json({ success: true, subscriptions });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching subscriptions" });
  }
};

const extendSubscription = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    const days = Number(req.body?.days);
    const note = String(req.body?.note || "").trim();
    if (
      !Number.isInteger(id) ||
      !Number.isInteger(days) ||
      days <= 0 ||
      days > 3650
    )
      return res
        .status(400)
        .json({ success: false, message: "Valid extension days are required" });
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT s.*,u.name AS user_name,p.name AS package_name FROM user_subscriptions s JOIN users u ON u.id=s.user_id JOIN packages p ON p.id=s.package_id WHERE s.id=? FOR UPDATE`,
      [id]
    );
    if (!rows.length) {
      await connection.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }
    const sub = rows[0];
    const current = new Date(sub.expires_at);
    const base = current > new Date() ? current : new Date();
    const next = new Date(base.getTime() + days * 86400000);
    await connection.query(
      `UPDATE user_subscriptions SET status='active',expires_at=?,last_extended_by=?,last_extended_at=NOW() WHERE id=?`,
      [next, req.user.id, id]
    );
    await logAdmin(
      connection,
      req.user.id,
      sub.user_id,
      "subscription_extended",
      `Admin extended ${sub.package_name} by ${days} day(s)`,
      {
        subscription_id: id,
        days,
        note,
        previous_expiry: sub.expires_at,
        new_expiry: next,
      }
    );
    await connection.query(
      `INSERT INTO notifications (user_id,title,message,type,link) VALUES (?,?,?,?,?)`,
      [
        sub.user_id,
        "Subscription extended",
        `Your ${
          sub.package_name
        } subscription was extended by ${days} day(s). New expiry: ${next
          .toISOString()
          .slice(0, 10)}.`,
        "package",
        "/user/packages",
      ]
    );
    await connection.commit();
    return res.json({
      success: true,
      message: "Subscription extended successfully",
      expires_at: next,
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Server error extending subscription" });
  } finally {
    connection.release();
  }
};

const createManualSubscription = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = Number(req.body?.user_id),
      packageId = Number(req.body?.package_id),
      days = Number(req.body?.days || 0),
      note = String(req.body?.note || "Manual admin activation").trim();
    if (!userId || !packageId)
      return res
        .status(400)
        .json({ success: false, message: "User and package are required" });
    await connection.beginTransaction();
    const [[user]] = await connection.query(
      "SELECT id,name,email FROM users WHERE id=? LIMIT 1 FOR UPDATE",
      [userId]
    );
    const [[pkg]] = await connection.query(
      "SELECT * FROM packages WHERE id=? LIMIT 1 FOR UPDATE",
      [packageId]
    );
    if (!user || !pkg) {
      await connection.rollback();
      return res
        .status(404)
        .json({ success: false, message: "User or package not found" });
    }
    const orderNumber = makeRef("MAN");
    const amount = Number(pkg.price);
    const [orderResult] = await connection.query(
      `INSERT INTO orders (order_number,user_id,package_id,item_type,item_title,amount,currency,payment_method,payment_status,status,details,customer_note,reviewed_by,reviewed_at) VALUES (?,?,?,?,?,?,'BDT','manual','paid','active',?,?,?,?,NOW())`,
      [
        orderNumber,
        userId,
        packageId,
        "package",
        pkg.name,
        amount,
        JSON.stringify(pkg),
        note,
        req.user.id,
      ]
    );
    const fakeUser = { id: userId };
    await activatePackage(
      connection,
      fakeUser,
      pkg,
      null,
      orderResult.insertId
    );
    if (days > 0) {
      const manualExpiry = new Date(Date.now() + days * 86400000);
      await connection.query(
        `UPDATE user_subscriptions SET expires_at=?, last_extended_by=?, last_extended_at=NOW() WHERE user_id=? AND package_id=? ORDER BY id DESC LIMIT 1`,
        [manualExpiry, req.user.id, userId, packageId]
      );
    }
    const paymentRef = makeRef("MANPAY");
    await connection.query(
      `INSERT INTO payments (order_id,user_id,gateway,payment_method,provider_name,amount,currency,gateway_unique_txn_id,gateway_status,status,notes,reviewed_by,reviewed_at,paid_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
      [
        orderResult.insertId,
        userId,
        "manual",
        "manual",
        "Admin Manual",
        amount,
        "BDT",
        paymentRef,
        "approved",
        "approved",
        note,
        req.user.id,
      ]
    );
    await logAdmin(
      connection,
      req.user.id,
      userId,
      "manual_subscription_created",
      `Admin manually activated ${pkg.name}`,
      { order_id: orderResult.insertId, package_id: packageId, note }
    );
    await connection.query(
      `INSERT INTO notifications (user_id,title,message,type,link) VALUES (?,?,?,?,?)`,
      [
        userId,
        "Subscription activated",
        `Your ${pkg.name} subscription was activated manually by support/admin.`,
        "package",
        "/user/packages",
      ]
    );
    await connection.commit();
    return res
      .status(201)
      .json({
        success: true,
        message: "Manual subscription activated",
        order_id: orderResult.insertId,
      });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}
    console.error("MANUAL SUB ERROR", error);
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Server error creating manual subscription",
      });
  } finally {
    connection.release();
  }
};

const getMyPayments = async (req, res) => {
  try {
    const [payments] = await pool.query(
      `SELECT p.id,p.gateway,p.payment_method,p.provider_name,p.payer_phone,p.amount,p.currency,p.gateway_unique_txn_id,p.gateway_transaction_id,p.gateway_status,p.status,p.proof_url,p.notes,p.paid_at,p.created_at,o.order_number,o.item_title,r.transaction_id AS recharge_transaction_id FROM payments p LEFT JOIN orders o ON o.id=p.order_id LEFT JOIN recharges r ON r.id=p.recharge_id WHERE p.user_id=? ORDER BY p.created_at DESC LIMIT 100`,
      [req.user.id]
    );
    return res.json({ success: true, payments });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching your payments" });
  }
};

module.exports = {
  ensureCommerceTables,
  createUser,
  getPayments,
  verifyPayment,
  getPaymentMethods,
  getPublicPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getSubscriptions,
  extendSubscription,
  createManualSubscription,
  getMyPayments,
};
