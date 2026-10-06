const pool = require("../config/db");
const crypto = require("crypto");
const { initiateDgePayPayment } = require("../services/dgepayService");
const { createMoneybagCheckout } = require("../services/moneybagService");
const { notifyAdmins } = require("../services/adminNotificationService");

function makeOrderNumber() {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
}

function makeTransactionCode(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
}

function billingDays(period) {
  if (period === "quarterly") return 90;
  if (period === "yearly") return 365;
  return 30;
}

async function activatePackage(
  connection,
  user,
  pkg,
  assignedNumberId = null,
  sourceOrderId = null
) {
  const [activeSubs] = await connection.query(
    `SELECT * FROM user_subscriptions
     WHERE user_id = ? AND service_type = ? AND status = 'active'
     ORDER BY expires_at DESC LIMIT 1 FOR UPDATE`,
    [user.id, pkg.service_type]
  );

  let assignedNumber = activeSubs[0]?.assigned_number || null;
  let ipNumberId = activeSubs[0]?.ip_number_id || null;

  if (pkg.service_type === "ip_phone" && !ipNumberId) {
    if (assignedNumberId) {
      const [requested] = await connection.query(
        `SELECT * FROM ip_numbers WHERE id = ? AND status = 'available' LIMIT 1 FOR UPDATE`,
        [assignedNumberId]
      );
      if (requested.length) {
        ipNumberId = requested[0].id;
        assignedNumber = requested[0].number;
      }
    }

    if (!ipNumberId) {
      const [[setting]] = await connection.query(
        `SELECT setting_value FROM site_settings WHERE setting_key='primary_096_number' LIMIT 1`
      );
      const preferredNumber = String(setting?.setting_value || "").trim();
      if (preferredNumber) {
        const [preferred] = await connection.query(
          `SELECT * FROM ip_numbers WHERE number = ? AND status = 'available' LIMIT 1 FOR UPDATE`,
          [preferredNumber]
        );
        if (preferred.length) {
          ipNumberId = preferred[0].id;
          assignedNumber = preferred[0].number;
        }
      }
    }

    if (!ipNumberId) {
      const [available] = await connection.query(
        `SELECT * FROM ip_numbers WHERE status = 'available' ORDER BY id ASC LIMIT 1 FOR UPDATE`
      );
      if (available.length) {
        ipNumberId = available[0].id;
        assignedNumber = available[0].number;
      }
    }

    if (!ipNumberId)
      throw new Error("No available 096 IP number is currently available");

    await connection.query(
      `UPDATE ip_numbers
       SET assigned_user_id = ?, status = 'assigned', max_devices = ?, device_count = 0
       WHERE id = ?`,
      [user.id, pkg.device_limit || 5, ipNumberId]
    );
  }

  if (pkg.service_type === "ip_phone" && ipNumberId) {
    await connection.query(
      `UPDATE ip_numbers SET assigned_user_id = ?, status = 'assigned', max_devices = ? WHERE id = ?`,
      [user.id, pkg.device_limit || 5, ipNumberId]
    );
  }

  if (pkg.service_type === "ai_calling") {
    const minutes = Number(pkg.call_minutes || pkg.ai_credits || 0);
    if (minutes > 0) {
      await connection.query(
        `UPDATE users SET ai_minutes = ai_minutes + ? WHERE id = ?`,
        [minutes, user.id]
      );
    }
  }

  const days = billingDays(pkg.billing_period);
  const now = new Date();

  if (activeSubs.length) {
    const old = activeSubs[0];
    const oldExpiry = new Date(old.expires_at);
    const baseDate = oldExpiry > now ? oldExpiry : now;
    const expiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    await connection.query(
      `UPDATE user_subscriptions
       SET package_id = ?, ip_number_id = ?, assigned_number = ?, status = 'active',
           started_at = COALESCE(started_at, NOW()), expires_at = ?, auto_renew = 1, source_order_id = COALESCE(?, source_order_id)
       WHERE id = ?`,
      [pkg.id, ipNumberId, assignedNumber, expiry, sourceOrderId, old.id]
    );
  } else {
    const expiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    await connection.query(
      `INSERT INTO user_subscriptions
       (user_id, package_id, source_order_id, ip_number_id, assigned_number, service_type, status, started_at, expires_at, auto_renew)
       VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), ?, 1)`,
      [
        user.id,
        pkg.id,
        sourceOrderId,
        ipNumberId,
        assignedNumber,
        pkg.service_type,
        expiry,
      ]
    );
  }
}

// CHECKOUT / PURCHASE (Wallet, Online Gateway, or Manual/Mobile Banking)
const checkout = async (req, res) => {
  const connection = await pool.getConnection();
  let pendingOrder = null;

  try {
    const {
      item_type,
      item_id,
      payment_method = "wallet_balance",
      assigned_number_id,
      gateway_payment_method,
      payment_reference,
      customer_note,
      payer_phone,
      payment_proof_url,
    } = req.body;

    if (!["package", "shop_product"].includes(item_type) || !item_id) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Valid item type and item ID are required",
        });
    }

    const requestedPaymentMethod = String(
      payment_method || "wallet_balance"
    ).toLowerCase().trim();
    const isWalletPayment = requestedPaymentMethod === "wallet_balance";

    await connection.beginTransaction();

    let methodRecord = null;
    if (!isWalletPayment) {
      const [activeMethods] = await connection.query(
        `SELECT * FROM payment_methods WHERE code=? AND is_active=1 LIMIT 1`,
        [requestedPaymentMethod]
      );
      if (!activeMethods.length) {
        await connection.rollback();
        return res
          .status(400)
          .json({
            success: false,
            message: `Selected payment method (${requestedPaymentMethod}) is currently unavailable or inactive.`,
          });
      }
      methodRecord = activeMethods[0];
    }

    const [users] = await connection.query(
      `SELECT id, name, email, phone, balance, ai_minutes FROM users WHERE id = ? LIMIT 1 FOR UPDATE`,
      [req.user.id]
    );
    if (!users.length) {
      await connection.rollback();
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const user = users[0];

    let itemTitle = "";
    let itemPrice = 0;
    let packageData = null;
    let shopProductData = null;

    if (item_type === "package") {
      const [rows] = await connection.query(
        `SELECT * FROM packages WHERE id = ? AND status = 'active' LIMIT 1`,
        [item_id]
      );
      if (!rows.length) {
        await connection.rollback();
        return res
          .status(404)
          .json({ success: false, message: "Package not found or inactive" });
      }
      packageData = rows[0];
      itemTitle = packageData.name;
      itemPrice = Number(packageData.price);
    } else {
      const [rows] = await connection.query(
        `SELECT * FROM shop_products WHERE id = ? AND is_active = 1 LIMIT 1`,
        [item_id]
      );
      if (!rows.length) {
        await connection.rollback();
        return res
          .status(404)
          .json({
            success: false,
            message: "Shop product not found or inactive",
          });
      }
      shopProductData = rows[0];
      itemTitle = shopProductData.name;
      itemPrice = Number(shopProductData.price);

      // Verify product payment methods restriction if configured
      if (shopProductData.payment_methods) {
        let allowed = null;
        try {
          allowed = typeof shopProductData.payment_methods === 'string'
            ? JSON.parse(shopProductData.payment_methods)
            : shopProductData.payment_methods;
        } catch (e) {
          allowed = null;
        }

        if (Array.isArray(allowed) && allowed.length > 0) {
          if (!allowed.includes(requestedPaymentMethod)) {
            await connection.rollback();
            return res.status(400).json({
              success: false,
              message: `The payment method "${requestedPaymentMethod}" is not enabled for this product.`,
            });
          }
        }
      }
    }

    if (!Number.isFinite(itemPrice) || itemPrice <= 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Invalid item price" });
    }

    // 1. WALLET PURCHASE (Instant debit & instant activation)
    if (isWalletPayment) {
      const balance = Number(user.balance || 0);
      if (balance < itemPrice) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance (Current: ৳${balance.toFixed(
            2
          )}). Please recharge ৳${(itemPrice - balance).toFixed(2)} or more.`,
          required_recharge: Number((itemPrice - balance).toFixed(2)),
        });
      }

      const newBalance = balance - itemPrice;
      await connection.query(`UPDATE users SET balance = ? WHERE id = ?`, [
        newBalance,
        user.id,
      ]);

      const orderNumber = makeOrderNumber();
      const [orderResult] = await connection.query(
        `INSERT INTO orders
         (order_number, user_id, product_id, package_id, item_type, item_title, amount,
          payment_method, payment_status, status, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'wallet_balance', 'paid', ?, ?)`,
        [
          orderNumber,
          user.id,
          shopProductData?.id || null,
          packageData?.id || null,
          item_type,
          itemTitle,
          itemPrice,
          item_type === "package" ? "active" : "completed",
          JSON.stringify(packageData || shopProductData),
        ]
      );

      await connection.query(
        `INSERT INTO transactions
         (transaction_code, user_id, type, direction, amount, balance_after, reference_id, description, status)
         VALUES (?, ?, ?, 'debit', ?, ?, ?, ?, 'completed')`,
        [
          makeTransactionCode("TXN"),
          user.id,
          item_type === "package" ? "package_purchase" : "shop_order",
          itemPrice,
          newBalance,
          orderNumber,
          `Purchased ${itemTitle} using wallet balance`,
        ]
      );

      if (item_type === "package") {
        await activatePackage(
          connection,
          user,
          packageData,
          assigned_number_id,
          orderResult.insertId
        );
      }

      await connection.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES (?, 'Purchase Successful', ?, 'order', '/user/orders')`,
        [
          user.id,
          `Your order #${orderNumber} for "${itemTitle}" was successful and activated.`,
        ]
      );

      await notifyAdmins(connection, {
        title: item_type === "package" ? "New Subscription Purchased" : "New Shop Order Placed",
        message: `${user.name} purchased ${itemTitle} for ৳${itemPrice.toFixed(2)} using wallet balance.`,
        type: item_type === "package" ? "subscription" : "order",
        link: `/admin/orders`,
        entityType: "order",
        entityId: orderResult.insertId,
        dedupeKey: `order:${orderResult.insertId}:wallet-purchase`,
      });

      await connection.commit();

      return res.status(201).json({
        success: true,
        message: `🎉 Successfully purchased & activated "${itemTitle}"!`,
        order_id: orderResult.insertId,
        order_number: orderNumber,
        new_balance: newBalance,
        payment_method: "wallet_balance",
      });
    }

    // 2. ONLINE PAYMENT GATEWAYS (DGePay, Moneybag)
    const isOnlineGateway = methodRecord?.method_type === "gateway" || ["dgepay", "moneybag"].includes(requestedPaymentMethod);
    if (isOnlineGateway) {
      const orderNumber = makeOrderNumber();
      const [orderResult] = await connection.query(
        `INSERT INTO orders
         (order_number, user_id, product_id, package_id, item_type, item_title, amount,
          payment_method, payment_status, status, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'pending', ?)`,
        [
          orderNumber,
          user.id,
          shopProductData?.id || null,
          packageData?.id || null,
          item_type,
          itemTitle,
          itemPrice,
          requestedPaymentMethod,
          JSON.stringify({
            ...(packageData || shopProductData || {}),
            ...(item_type === "package" && assigned_number_id
              ? { assigned_number_id: Number(assigned_number_id) }
              : {}),
          }),
        ]
      );

      pendingOrder = {
        id: orderResult.insertId,
        orderNumber,
        itemTitle,
        amount: itemPrice,
        user,
      };

      await connection.commit();

      let gateway;
      const gatewayCode = requestedPaymentMethod;
      if (gatewayCode === "dgepay") {
        gateway = await initiateDgePayPayment({
          amount: pendingOrder.amount,
          orderId: pendingOrder.id,
          orderNumber: pendingOrder.orderNumber,
          note: `MyBDPhone - ${pendingOrder.itemTitle} - ${pendingOrder.orderNumber}`,
          customer: {
            userId: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
          },
          paymentMethod: gateway_payment_method || null,
        });

        if (!gateway.paymentUrl) {
          throw new Error("DGePay did not return a payment URL");
        }
      } else {
        const mb = await createMoneybagCheckout({
          orderRef: pendingOrder.orderNumber,
          amount: pendingOrder.amount,
          description: `MyBDPhone - ${pendingOrder.itemTitle}`,
          customer: {
            name: user.name,
            email: user.email,
            phone: user.phone,
          },
          item: {
            name: pendingOrder.itemTitle,
            category: item_type === "package" ? "Subscription" : "Telecom Add-on",
            sku: `MYBD-${item_type}-${pendingOrder.id}`,
          },
        });
        gateway = {
          paymentUrl: mb.checkoutUrl,
          uniqueTxnId:
            mb.transactionId ||
            `MB-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          gatewayOrderId: mb.sessionId || pendingOrder.orderNumber,
          gatewayTransactionId: mb.transactionId || null,
          gatewayStatus: mb.transactionId ? "pending" : "initiated",
          raw: mb.raw || {},
        };
      }

      const providerName = methodRecord?.provider || (gatewayCode === "moneybag" ? "Moneybag" : "DGePay");
      const paymentMethodValue = gateway_payment_method || gatewayCode;

      const [paymentResult] = await pool.query(
        `INSERT INTO payments
         (
           order_id,
           recharge_id,
           user_id,
           gateway,
           payment_method,
           provider_name,
           payer_phone,
           amount,
           currency,
           gateway_unique_txn_id,
           gateway_order_id,
           gateway_transaction_id,
           gateway_status,
           gateway_response,
           status,
           notes
         )
         VALUES
         (?, NULL, ?, ?, ?, ?, ?, ?, 'BDT', ?, ?, ?, ?, ?, 'pending', ?)`,
        [
          pendingOrder.id,
          user.id,
          gatewayCode,
          paymentMethodValue,
          providerName,
          user.phone || null,
          Number(pendingOrder.amount),
          gateway.uniqueTxnId,
          gateway.gatewayOrderId || pendingOrder.orderNumber,
          gateway.gatewayTransactionId || null,
          gateway.gatewayStatus || "initiated",
          JSON.stringify(gateway.raw || {}),
          `${providerName} hosted checkout initialized`,
        ]
      );

      await pool.query(
        `UPDATE orders SET status = 'processing', payment_status = 'unpaid' WHERE id = ?`,
        [pendingOrder.id]
      );

      await notifyAdmins(null, {
        title: item_type === "package" ? "Subscription Payment Pending" : "Shop Order Payment Pending",
        message: `${user.name} started checkout for ${itemTitle} (৳${itemPrice.toFixed(2)}) via ${providerName}. Payment awaiting verification.`,
        type: "payment",
        link: "/admin/payments",
        entityType: "payment",
        entityId: paymentResult.insertId,
        dedupeKey: `payment:${paymentResult.insertId}:created`,
      });

      return res.status(201).json({
        success: true,
        message: `${providerName} payment initialized`,
        order_id: pendingOrder.id,
        order_number: pendingOrder.orderNumber,
        payment_id: paymentResult.insertId,
        payment_method: requestedPaymentMethod,
        data: {
          order_id: pendingOrder.id,
          order_number: pendingOrder.orderNumber,
          payment_id: paymentResult.insertId,
          unique_txn_id: gateway.uniqueTxnId || null,
          payment_url: gateway.paymentUrl,
          transaction_id: gateway.gatewayTransactionId || null,
          status: "pending",
        },
      });
    }

    // 3. MANUAL / MOBILE BANKING / VOUCHER / BANK TRANSFER
    const orderNumber = makeOrderNumber();
    const [orderResult] = await connection.query(
      `INSERT INTO orders
       (order_number, user_id, product_id, package_id, item_type, item_title, amount, currency,
        payment_method, payment_status, status, details, customer_note, payment_reference, payment_proof_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'BDT', ?, 'unpaid', 'processing', ?, ?, ?, ?)`,
      [
        orderNumber,
        user.id,
        shopProductData?.id || null,
        packageData?.id || null,
        item_type,
        itemTitle,
        itemPrice,
        requestedPaymentMethod,
        JSON.stringify({
          ...(packageData || shopProductData || {}),
          ...(item_type === "package" && assigned_number_id
            ? { assigned_number_id: Number(assigned_number_id) }
            : {}),
        }),
        customer_note || null,
        payment_reference || null,
        payment_proof_url || null,
      ]
    );

    const manualTxnCode = payment_reference ? String(payment_reference).trim() : makeTransactionCode("MAN");
    const providerName = methodRecord?.provider || methodRecord?.name || requestedPaymentMethod;

    const [paymentResult] = await connection.query(
      `INSERT INTO payments
       (
         order_id,
         recharge_id,
         user_id,
         gateway,
         payment_method,
         provider_name,
         payer_phone,
         amount,
         currency,
         gateway_unique_txn_id,
         gateway_status,
         status,
         notes
       )
       VALUES
       (?, NULL, ?, 'manual', ?, ?, ?, ?, 'BDT', ?, 'pending', 'pending', ?)`,
      [
        orderResult.insertId,
        user.id,
        requestedPaymentMethod,
        providerName,
        payer_phone || user.phone || null,
        itemPrice,
        manualTxnCode,
        `Manual payment submitted (${providerName}) - TrxID/Ref: ${payment_reference || 'N/A'}${customer_note ? ' - Note: ' + customer_note : ''}`,
      ]
    );

    await connection.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES (?, 'Order Placed (Pending Verification)', ?, 'order', '/user/orders')`,
      [
        user.id,
        `Your order #${orderNumber} for "${itemTitle}" was placed via ${providerName}. It will be activated after admin verification.`,
      ]
    );

    await notifyAdmins(connection, {
      title: "New Manual Order Payment Pending",
      message: `${user.name} submitted manual payment (${providerName}, Ref: ${payment_reference || 'N/A'}) for ${itemTitle} (৳${itemPrice.toFixed(2)}). Verification required.`,
      type: "payment",
      link: "/admin/payments",
      entityType: "payment",
      entityId: paymentResult.insertId,
      dedupeKey: `payment:${paymentResult.insertId}:manual-order`,
    });

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: `🎉 Order placed successfully! Please wait while admin verifies your ${providerName} payment.`,
      order_id: orderResult.insertId,
      order_number: orderNumber,
      payment_id: paymentResult.insertId,
      payment_method: requestedPaymentMethod,
      is_manual: true,
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}
    console.error("CHECKOUT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error during checkout",
      order_id: pendingOrder?.id || null,
    });
  } finally {
    connection.release();
  }
};

const getMyOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(
      `
      SELECT
        o.id AS id,
        o.order_number AS order_number,
        o.item_title AS item_title,
        o.item_type AS item_type,
        o.amount AS amount,
        o.payment_method AS payment_method,
        o.payment_status AS payment_status,
        o.status AS status,
        o.created_at AS created_at,
        o.updated_at AS updated_at,
        o.currency AS currency,
        'order' AS history_source
      FROM orders o
      WHERE o.user_id = ?

      UNION ALL

      SELECT
        r.id AS id,
        r.transaction_id AS order_number,
        'Wallet Recharge' AS item_title,
        'recharge' AS item_type,
        r.amount AS amount,
        COALESCE(p.payment_method, r.payment_method) AS payment_method,
        CASE WHEN r.status='completed' THEN 'paid' ELSE 'unpaid' END AS payment_status,
        CASE
          WHEN r.status='completed' THEN 'completed'
          WHEN r.status='failed' THEN 'cancelled'
          ELSE 'pending'
        END AS status,
        r.created_at AS created_at,
        r.updated_at AS updated_at,
        'BDT' AS currency,
        'recharge' AS history_source
      FROM recharges r
      LEFT JOIN payments p
        ON p.id = (SELECT MAX(p2.id) FROM payments p2 WHERE p2.recharge_id = r.id)
      WHERE r.user_id = ?

      ORDER BY created_at DESC
    `,
      [req.user.id, req.user.id]
    );

    return res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("GET MY ORDERS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { status, item_type, search } = req.query;
    let query = `
      SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1`;
    const params = [];

    if (status) {
      query += " AND o.status = ?";
      params.push(status);
    }
    if (item_type) {
      query += " AND o.item_type = ?";
      params.push(item_type);
    }
    if (search) {
      query +=
        " AND (o.order_number LIKE ? OR o.item_title LIKE ? OR u.name LIKE ? OR u.email LIKE ?)";
      const q = `%${search}%`;
      params.push(q, q, q, q);
    }

    query += " ORDER BY o.created_at DESC";
    const [orders] = await pool.query(query, params);
    return res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("ADMIN ORDERS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;
    const allowed = [
      "pending",
      "processing",
      "active",
      "completed",
      "cancelled",
      "refunded",
    ];
    if (status && !allowed.includes(status))
      return res
        .status(400)
        .json({ success: false, message: "Invalid order status" });
    const [[order]] = await pool.query(
      "SELECT id,payment_status,status FROM orders WHERE id=? LIMIT 1",
      [id]
    );
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    if (status === "active" && order.payment_status !== "paid")
      return res
        .status(409)
        .json({
          success: false,
          message: "Payment must be verified before activating an order",
        });
    await pool.query(
      `UPDATE orders SET status=COALESCE(?,status), payment_status=COALESCE(?,payment_status) WHERE id=?`,
      [status, payment_status, id]
    );
    return res.json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("UPDATE ORDER ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// MANUAL / VOUCHER PACKAGE ORDER. Payment remains pending until an admin verifies it.
const manualCheckout = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      item_id,
      payment_method = "voucher",
      payment_reference,
      payer_phone,
      proof_url,
      customer_note,
    } = req.body || {};
    const uploadedProofUrl = req.file
      ? `/uploads/payment-proofs/${req.file.filename}`
      : proof_url?.trim() || null;
    const packageId = Number(item_id);
    if (!Number.isInteger(packageId) || packageId <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Valid package is required" });
    if (!String(payment_reference || "").trim())
      return res
        .status(400)
        .json({
          success: false,
          message: "Coupone code is required",
        });

    await connection.beginTransaction();
    const [[pkg]] = await connection.query(
      `SELECT * FROM packages WHERE id=? AND status='active' LIMIT 1 FOR UPDATE`,
      [packageId]
    );
    if (!pkg) {
      await connection.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Package not found or inactive" });
    }
    const [[method]] = await connection.query(
      `SELECT * FROM payment_methods WHERE code=? AND is_active=1 LIMIT 1`,
      [String(payment_method).toLowerCase()]
    );
    if (!method) {
      await connection.rollback();
      return res
        .status(400)
        .json({
          success: false,
          message: "Selected payment method is not active",
        });
    }
    const [[duplicateRef]] = await connection.query(
      `SELECT id,order_number FROM orders WHERE payment_reference=? AND payment_status <> 'refunded' LIMIT 1`,
      [String(payment_reference).trim()]
    );
    if (duplicateRef) {
      await connection.rollback();
      return res
        .status(409)
        .json({
          success: false,
          message:
            "This Coupone code has already been submitted",
        });
    }

    const orderNumber = makeOrderNumber();
    const [orderResult] = await connection.query(
      `
      INSERT INTO orders (order_number,user_id,package_id,item_type,item_title,amount,currency,payment_method,payment_status,status,details,customer_note,payment_reference,payment_proof_url)
      VALUES (?,?,?,?,?,?,'BDT',?,'unpaid','processing',?,?,?,?)`,
      [
        orderNumber,
        req.user.id,
        pkg.id,
        "package",
        pkg.name,
        Number(pkg.price),
        method.code,
        JSON.stringify(pkg),
        customer_note?.trim() || null,
        String(payment_reference).trim(),
        uploadedProofUrl,
      ]
    );

    const gatewayTxn = `MAN-${Date.now()}-${crypto
      .randomBytes(4)
      .toString("hex")}`;
    await connection.query(
      `
      INSERT INTO payments (order_id,user_id,gateway,payment_method,provider_name,payer_phone,amount,currency,gateway_unique_txn_id,gateway_order_id,gateway_status,proof_url,notes,status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        orderResult.insertId,
        req.user.id,
        "manual",
        method.code,
        method.provider || method.name,
        payer_phone?.trim() || req.user.phone || null,
        Number(pkg.price),
        "BDT",
        gatewayTxn,
        orderNumber,
        "submitted",
        uploadedProofUrl,
        customer_note?.trim() || null,
        "pending",
      ]
    );

    await connection.query(
      `INSERT INTO notifications (user_id,title,message,type,link) VALUES (?,?,?,?,?)`,
      [
        req.user.id,
        "Payment submitted",
        `Your payment for ${pkg.name} was submitted and is waiting for admin verification.`,
        "order",
        "/user/orders",
      ]
    );
    await notifyAdmins(connection, {
      title: "Payment Verification Required",
      message: `${req.user.name} submitted ${pkg.name} payment of ৳${Number(
        pkg.price
      ).toFixed(2)} via ${method.name}. Reference: ${String(
        payment_reference
      ).trim()}.`,
      type: "payment",
      link: "/admin/payments",
      entityType: "payment",
      entityId: orderResult.insertId,
      dedupeKey: `order:${orderResult.insertId}:manual-payment`,
    });
    await connection.commit();
    return res
      .status(201)
      .json({
        success: true,
        message:
          "Payment submitted. Your subscription will activate after admin verification.",
        order_id: orderResult.insertId,
        order_number: orderNumber,
      });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}
    console.error("MANUAL CHECKOUT ERROR:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Server error submitting manual payment",
      });
  } finally {
    connection.release();
  }
};
module.exports = {
  checkout,
  manualCheckout,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  activatePackage,
};
