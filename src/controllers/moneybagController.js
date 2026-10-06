const crypto = require("crypto");
const pool = require("../config/db");
const { activatePackage } = require("./orderController");
const { notifyAdmins } = require("../services/adminNotificationService");
const {
  getConfig,
  assertConfig,
  createMoneybagCheckout,
  verifyMoneybagTransaction,
  normalizeMoneybagStatus,
  isMoneybagApproved,
  getMoneybagTransactionId,
  getMoneybagOrderRef,
  getMoneybagAmount,
  getMoneybagCurrency,
  verifyWebhookSignature,
  buildResultUrl,
} = require("../services/moneybagService");

function makeRef(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
}

function parseOrderDetails(details) {
  if (details == null || details === "") return null;
  if (typeof details === "object") return details;
  try {
    return JSON.parse(details);
  } catch (_) {
    return null;
  }
}

function safeJson(value) {
  try {
    return JSON.stringify(value ?? {});
  } catch (_) {
    return "{}";
  }
}

function approxEqual(a, b) {
  const x = Number(a);
  const y = Number(b);
  return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) <= 0.01;
}

function extractRequestValue(req, names) {
  for (const name of names) {
    const value = req.query?.[name] ?? req.body?.[name];
    if (value !== undefined && value !== null && String(value).trim() !== "")
      return value;
  }
  return null;
}

async function getPaymentByReference(
  connectionOrPool,
  { paymentId, orderRef, transactionId }
) {
  // MyBDPhone uses RCH-... as its local recharge reference, while Moneybag
  // returns txn_... as its provider transaction id. When both are present,
  // resolve the local payment using the order reference first.
  let sql = `
    SELECT p.*, o.order_number, o.item_title, o.amount AS order_amount, o.currency AS order_currency,
           o.status AS order_status, o.payment_status AS order_payment_status,
           r.transaction_id AS recharge_transaction_id, r.amount AS recharge_amount, r.status AS recharge_status
    FROM payments p
    LEFT JOIN orders o ON o.id = p.order_id
    LEFT JOIN recharges r ON r.id = p.recharge_id
    WHERE p.gateway = 'moneybag'`;
  const params = [];

  if (paymentId) {
    sql += " AND p.id = ?";
    params.push(Number(paymentId));
  } else if (orderRef && transactionId) {
    sql += ` AND (
      o.order_number = ?
      OR r.transaction_id = ?
      OR p.gateway_order_id = ?
      OR p.gateway_transaction_id = ?
      OR p.gateway_unique_txn_id = ?
    )`;
    params.push(
      String(orderRef),
      String(orderRef),
      String(orderRef),
      String(transactionId),
      String(transactionId)
    );
  } else if (orderRef) {
    sql +=
      " AND (o.order_number = ? OR r.transaction_id = ? OR p.gateway_order_id = ?)";
    params.push(String(orderRef), String(orderRef), String(orderRef));
  } else if (transactionId) {
    sql += " AND (p.gateway_transaction_id = ? OR p.gateway_unique_txn_id = ?)";
    params.push(String(transactionId), String(transactionId));
  } else {
    return null;
  }

  sql += " ORDER BY p.id DESC LIMIT 1";
  const [rows] = await connectionOrPool.query(sql, params);
  return rows[0] || null;
}

function expectedPaymentReference(payment) {
  return (
    payment.order_number ||
    payment.recharge_transaction_id ||
    payment.gateway_order_id ||
    null
  );
}

function expectedPaymentAmount(payment) {
  if (payment.order_id) return Number(payment.order_amount);
  if (payment.recharge_id) return Number(payment.recharge_amount);
  return Number(payment.amount);
}

async function captureMoneybagVerification(
  paymentId,
  gatewayData,
  { notify = true } = {}
) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [payments] = await connection.query(
      `SELECT p.*, o.order_number, o.item_title, o.amount AS order_amount, o.currency AS order_currency,
              o.status AS order_status, o.payment_status AS order_payment_status,
              r.transaction_id AS recharge_transaction_id, r.amount AS recharge_amount, r.status AS recharge_status,
              u.name AS user_name
       FROM payments p
       LEFT JOIN orders o ON o.id = p.order_id
       LEFT JOIN recharges r ON r.id = p.recharge_id
       INNER JOIN users u ON u.id = p.user_id
       WHERE p.id = ? AND p.gateway = 'moneybag'
       LIMIT 1 FOR UPDATE`,
      [paymentId]
    );

    if (!payments.length) throw new Error("Moneybag payment not found");
    const payment = payments[0];
    const gatewayStatus = normalizeMoneybagStatus(gatewayData);
    const gatewayTxnId = getMoneybagTransactionId(gatewayData);
    const gatewayOrderRef = getMoneybagOrderRef(gatewayData);
    const gatewayAmount = getMoneybagAmount(gatewayData);
    const gatewayCurrency = getMoneybagCurrency(gatewayData);
    const expectedRef = expectedPaymentReference(payment);
    const expectedAmount = expectedPaymentAmount(payment);

    if (isMoneybagApproved(gatewayData)) {
      if (!gatewayTxnId)
        throw new Error(
          "Moneybag verification did not return a transaction ID"
        );
      if (!gatewayOrderRef)
        throw new Error("Moneybag verification did not return an order ID");
      if (String(gatewayOrderRef) !== String(expectedRef)) {
        throw new Error(
          `Moneybag order mismatch: expected ${expectedRef}, received ${gatewayOrderRef}`
        );
      }
      if (!approxEqual(gatewayAmount, expectedAmount)) {
        throw new Error(
          `Moneybag amount mismatch: expected ${expectedAmount.toFixed(
            2
          )}, received ${Number(gatewayAmount).toFixed(2)}`
        );
      }
      if (
        gatewayCurrency &&
        String(gatewayCurrency).toUpperCase() !==
          String(payment.currency || "BDT").toUpperCase()
      ) {
        throw new Error(
          `Moneybag currency mismatch: expected ${
            payment.currency || "BDT"
          }, received ${gatewayCurrency}`
        );
      }

      const firstGatewayVerification = ![
        "approved",
        "verified",
        "success",
        "successful",
        "paid",
        "completed",
      ].includes(String(payment.gateway_status || "").toLowerCase());

      await connection.query(
        `UPDATE payments
         SET gateway_transaction_id=?, gateway_status='approved', gateway_response=?, status='approved', paid_at=COALESCE(paid_at, NOW())
         WHERE id=?`,
        [gatewayTxnId, safeJson(gatewayData), paymentId]
      );

      if (payment.order_id) {
        const [orders] = await connection.query(
          `SELECT * FROM orders WHERE id=? LIMIT 1 FOR UPDATE`,
          [payment.order_id]
        );
        if (orders.length) {
          const order = orders[0];
          if (order.payment_status !== "paid") {
            await connection.query(
              `UPDATE orders SET status=?, payment_status='paid' WHERE id=?`,
              [order.item_type === "package" ? "active" : "completed", order.id]
            );

            if (order.item_type === "package") {
              const snapshot = parseOrderDetails(order.details);
              const [pkgRows] = await connection.query(
                "SELECT * FROM packages WHERE id=? LIMIT 1",
                [order.package_id]
              );
              const pkg = snapshot && snapshot.id ? snapshot : pkgRows[0];
              if (pkg) {
                await activatePackage(
                  connection,
                  { id: order.user_id },
                  pkg,
                  null,
                  order.id
                );
              }
            }
          }
        }

        if (notify && firstGatewayVerification) {
          await connection.query(
            `INSERT INTO notifications (user_id,title,message,type,link)
             VALUES (?, 'Payment Successful — Service Activated', ?, 'order', '/user/orders')`,
            [
              payment.user_id,
              `Your Moneybag payment of ৳${Number(payment.amount).toFixed(
                2
              )} for ${payment.item_title} was successful. Your service is now active.`,
            ]
          );
          await notifyAdmins(connection, {
            title: "Moneybag Order Paid & Activated",
            message: `${
              payment.user_name
            } completed Moneybag payment of ৳${Number(payment.amount).toFixed(
              2
            )} for ${
              payment.item_title
            }. Order #${payment.order_number || payment.order_id} is now active.`,
            type: "order",
            link: "/admin/orders",
            entityType: "order",
            entityId: payment.order_id,
            dedupeKey: `payment:${payment.id}:moneybag-paid-auto`,
          });
        }
      } else if (payment.recharge_id) {
        const [recharges] = await connection.query(
          `SELECT * FROM recharges WHERE id=? LIMIT 1 FOR UPDATE`,
          [payment.recharge_id]
        );
        if (recharges.length) {
          const recharge = recharges[0];
          if (recharge.status !== "completed") {
            const [users] = await connection.query(
              `SELECT balance FROM users WHERE id=? LIMIT 1 FOR UPDATE`,
              [recharge.user_id]
            );
            if (users.length) {
              const next =
                Number(users[0].balance || 0) + Number(recharge.amount);
              await connection.query("UPDATE users SET balance=? WHERE id=?", [
                next,
                recharge.user_id,
              ]);
              await connection.query(
                `UPDATE recharges SET status='completed', notes=CONCAT(COALESCE(notes,''),' | Moneybag auto-credited') WHERE id=?`,
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
                  "Moneybag online wallet recharge",
                  "completed",
                ]
              );
            }
          }
        }

        if (notify && firstGatewayVerification) {
          await connection.query(
            `INSERT INTO notifications (user_id,title,message,type,link)
             VALUES (?, 'Recharge Successful', ?, 'recharge', '/user/transactions')`,
            [
              payment.user_id,
              `Your Moneybag recharge of ৳${Number(payment.amount).toFixed(
                2
              )} has been credited to your wallet.`,
            ]
          );
          await notifyAdmins(connection, {
            title: "Moneybag Recharge Completed",
            message: `${
              payment.user_name
            } completed a Moneybag recharge of ৳${Number(
              payment.amount
            ).toFixed(
              2
            )}. Wallet credited automatically.`,
            type: "recharge",
            link: "/admin/payments",
            entityType: "recharge",
            entityId: payment.recharge_id,
            dedupeKey: `payment:${payment.id}:moneybag-recharge-auto`,
          });
        }
      }
    } else if (gatewayStatus === "failed" || gatewayStatus === "cancelled") {
      await connection.query(
        `UPDATE payments SET gateway_status=?, gateway_transaction_id=COALESCE(?, gateway_transaction_id), gateway_response=?, status=? WHERE id=? AND status <> 'approved'`,
        [
          gatewayStatus,
          gatewayTxnId || null,
          safeJson(gatewayData),
          gatewayStatus,
          paymentId,
        ]
      );

      if (payment.order_id) {
        await connection.query(
          `UPDATE orders SET status='cancelled', payment_status='unpaid' WHERE id=? AND payment_status <> 'paid'`,
          [payment.order_id]
        );
      }
      if (payment.recharge_id) {
        await connection.query(
          `UPDATE recharges SET status='failed', notes=CONCAT(COALESCE(notes,''),' | Moneybag: ',?) WHERE id=? AND status <> 'completed'`,
          [gatewayStatus, payment.recharge_id]
        );
      }
    } else {
      await connection.query(
        `UPDATE payments SET gateway_status='pending', gateway_transaction_id=COALESCE(?, gateway_transaction_id), gateway_response=? WHERE id=? AND status='pending'`,
        [gatewayTxnId || null, safeJson(gatewayData), paymentId]
      );
    }

    await connection.commit();

    const [freshRows] = await pool.query(
      `SELECT p.*, o.order_number, o.status AS order_status, o.payment_status AS order_payment_status,
              r.transaction_id AS recharge_transaction_id, r.status AS recharge_status
       FROM payments p
       LEFT JOIN orders o ON o.id=p.order_id
       LEFT JOIN recharges r ON r.id=p.recharge_id
       WHERE p.id=? LIMIT 1`,
      [paymentId]
    );

    return freshRows[0] || payment;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}
    throw error;
  } finally {
    connection.release();
  }
}

async function createOrderCheckout(req, res) {
  const orderId = Number(req.body?.order_id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "A valid order_id is required" });
  }

  const [[order]] = await pool.query(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
     FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=? LIMIT 1`,
    [orderId]
  );
  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });

  if (
    order.user_id !== req.user.id &&
    req.user.role !== "admin" &&
    req.user.role !== "superadmin"
  ) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const customerPhone = String(order.customer_phone || "").trim();
  if (!customerPhone)
    return res
      .status(400)
      .json({
        success: false,
        message: "Please add your phone number before using Moneybag",
      });

  const result = await createMoneybagCheckout({
    orderRef: order.order_number,
    amount: order.amount,
    description: `MyBDPhone - ${order.item_title}`,
    customer: {
      name: order.customer_name,
      email: order.customer_email,
      phone: customerPhone,
    },
    item: {
      name: order.item_title,
      category:
        order.item_type === "package" ? "Subscription" : "Telecom Add-on",
      sku: `MYBD-${order.item_type}-${order.id}`,
    },
  });

  const localTxnRef = `MB-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
  const [paymentResult] = await pool.query(
    `INSERT INTO payments
     (order_id,recharge_id,user_id,gateway,payment_method,provider_name,payer_phone,amount,currency,
      gateway_unique_txn_id,gateway_order_id,gateway_transaction_id,gateway_status,gateway_response,status,notes)
     VALUES (?,NULL,?,'moneybag','moneybag','Moneybag',?,?,?,?,?,?,?,?,'pending',?)`,
    [
      order.id,
      order.user_id,
      customerPhone,
      Number(order.amount),
      order.currency || "BDT",
      localTxnRef,
      result.sessionId || order.order_number,
      result.transactionId || null,
      result.transactionId ? "pending" : "initiated",
      safeJson(result.raw),
      "Moneybag hosted checkout initialized",
    ]
  );

  await pool.query(
    `UPDATE orders SET status='processing', payment_status='unpaid', payment_method='moneybag' WHERE id=? AND payment_status <> 'paid'`,
    [order.id]
  );

  return res.status(201).json({
    success: true,
    message: "Moneybag payment initialized",
    data: {
      payment_id: paymentResult.insertId,
      order_id: order.id,
      order_number: order.order_number,
      amount: Number(order.amount),
      currency: order.currency || "BDT",
      checkout_url: result.checkoutUrl,
      session_id: result.sessionId,
      transaction_id: result.transactionId || null,
      status: "pending",
    },
  });
}

async function verifyResult(req, res) {
  try {
    const paymentId = Number(req.body?.payment_id || 0) || null;
    const orderRef = String(req.body?.order_ref || "").trim() || null;
    const transactionId = String(req.body?.transaction_id || "").trim() || null;
    const callbackResult =
      String(
        req.body?.callback_result || req.body?.result || req.body?.status || ""
      ).trim() || null;

    // The hosted checkout redirects a browser, so this endpoint must work even
    // when the browser has no JWT. For unauthenticated requests, either orderRef or transactionId is required.
    if (!req.user && !orderRef && !transactionId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Moneybag order reference or transaction ID is required",
        });
    }

    const payment = await getPaymentByReference(pool, {
      paymentId: req.user ? paymentId : null,
      orderRef,
      transactionId,
    });

    if (!payment) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "MyBDPhone payment record not found for this Moneybag order.",
        });
    }

    if (
      req.user &&
      payment.user_id !== req.user.id &&
      !["admin", "superadmin"].includes(req.user.role)
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const isExplicitCancel =
      String(callbackResult || "").toLowerCase() === "cancel" ||
      String(callbackResult || "").toLowerCase() === "cancelled" ||
      String(req.body?.result || "").toLowerCase() === "cancel" ||
      String(req.body?.status || "").toLowerCase() === "cancel";

    if (isExplicitCancel) {
      await pool.query(
        `UPDATE payments SET status = 'cancelled', gateway_status = 'cancelled' WHERE id = ? AND status <> 'approved'`,
        [payment.id]
      );
      if (payment.order_id) {
        await pool.query(
          `UPDATE orders SET status = 'cancelled', payment_status = 'unpaid' WHERE id = ? AND payment_status <> 'paid'`,
          [payment.order_id]
        );
      }
      if (payment.recharge_id) {
        await pool.query(
          `UPDATE recharges SET status = 'failed' WHERE id = ? AND status <> 'completed'`,
          [payment.recharge_id]
        );
      }

      return res.json({
        success: false,
        message: "Moneybag payment was cancelled by user.",
        data: {
          payment_id: payment.id,
          order_id: payment.order_id || null,
          recharge_id: payment.recharge_id || null,
          order_ref: expectedPaymentReference(payment),
          status: "cancelled",
          gateway_status: "cancelled",
          admin_verification_required: false,
          transaction_id: null,
          callback_result: callbackResult,
        },
      });
    }

    const txId = transactionId || payment.gateway_transaction_id;
    if (!txId) {
      return res.json({
        success: true,
        message:
          "Payment is in processing. Administrator approval will be required if paid manually or verified by gateway.",
        data: {
          payment_id: payment.id,
          order_id: payment.order_id || null,
          recharge_id: payment.recharge_id || null,
          order_ref: expectedPaymentReference(payment),
          status: "processing",
          gateway_status: payment.gateway_status || "initiated",
          admin_verification_required: false,
          transaction_id: null,
          callback_result: callbackResult,
        },
      });
    }

    let gatewayData;
    try {
      gatewayData = await verifyMoneybagTransaction(txId);
    } catch (providerError) {
      // No money is ever credited here. Keep the local payment pending so a
      // transient provider lookup problem does not show a false failure.
      console.warn(
        "[Moneybag] verify-result provider lookup failed:",
        providerError.message
      );
      return res.json({
        success: true,
        message:
          "Payment return received. Server-side verification is pending; administrator approval is still required.",
        data: {
          payment_id: payment.id,
          order_id: payment.order_id || null,
          recharge_id: payment.recharge_id || null,
          order_ref: expectedPaymentReference(payment),
          status: "pending",
          gateway_status: payment.gateway_status || "pending",
          admin_verification_required: false,
          transaction_id: txId,
          callback_result: callbackResult,
          verification_pending: true,
        },
      });
    }

    const fresh = await captureMoneybagVerification(payment.id, gatewayData);
    const paymentStatus = String(fresh.status || "").toLowerCase();
    const rechargeStatus = String(fresh.recharge_status || "").toLowerCase();
    const orderPaymentStatus = String(
      fresh.order_payment_status || ""
    ).toLowerCase();
    const gatewayStatus = String(
      fresh.gateway_status || normalizeMoneybagStatus(gatewayData)
    ).toLowerCase();
    const failed =
      ["failed", "cancelled", "refunded"].includes(paymentStatus) ||
      ["failed", "cancelled", "refunded"].includes(rechargeStatus);
    const approved =
      paymentStatus === "approved" ||
      rechargeStatus === "completed" ||
      orderPaymentStatus === "paid";

    return res.json({
      success: !failed,
      message: failed
        ? paymentStatus === "cancelled" || rechargeStatus === "cancelled"
          ? "Moneybag payment was cancelled."
          : "Moneybag payment failed."
        : approved
        ? "Moneybag payment is approved and the recharge/order is completed."
        : gatewayStatus === "approved"
        ? "Moneybag payment received and gateway-verified. Administrator approval is pending."
        : "Moneybag payment is still pending.",
      data: {
        payment_id: fresh.id,
        order_id: fresh.order_id || null,
        recharge_id: fresh.recharge_id || null,
        order_ref: fresh.order_number || fresh.recharge_transaction_id || null,
        status: failed
          ? rechargeStatus || paymentStatus
          : approved
          ? "approved"
          : "pending",
        gateway_status: fresh.gateway_status || gatewayStatus,
        admin_verification_required:
          gatewayStatus === "approved" && !approved && !failed,
        transaction_id: fresh.gateway_transaction_id || txId,
        callback_result: callbackResult,
        recharge_status: fresh.recharge_status || null,
        payment_status: fresh.status || null,
      },
    });
  } catch (error) {
    console.error("[Moneybag] verify-result failed:", error.message);
    return res
      .status(502)
      .json({
        success: false,
        message: error.message || "Moneybag payment verification failed",
      });
  }
}

async function callback(req, res) {
  const orderRef =
    String(
      extractRequestValue(req, [
        "order_ref",
        "order_id",
        "orderId",
        "merchant_order_id",
      ]) || ""
    ).trim() || null;
  const transactionId =
    String(
      extractRequestValue(req, [
        "transaction_id",
        "transactionId",
        "trx_id",
        "trxId",
        "txn_id",
        "txnId",
        "payment_reference_id",
      ]) || ""
    ).trim() || null;
  const result =
    String(
      extractRequestValue(req, ["result", "status", "payment_status", "callback_result"]) || ""
    )
      .toLowerCase()
      .trim() || "unknown";

  let payment = null;
  try {
    payment = await getPaymentByReference(pool, { orderRef, transactionId });
    if (payment) {
      const isExplicitCancel =
        result === "cancel" ||
        result === "cancelled" ||
        String(req.query?.callback_result || "").toLowerCase() === "cancel";

      if (isExplicitCancel) {
        await pool.query(
          `UPDATE payments SET status = 'cancelled', gateway_status = 'cancelled' WHERE id = ? AND status <> 'approved'`,
          [payment.id]
        );
        if (payment.order_id) {
          await pool.query(
            `UPDATE orders SET status = 'cancelled', payment_status = 'unpaid' WHERE id = ? AND payment_status <> 'paid'`,
            [payment.order_id]
          );
        }
        if (payment.recharge_id) {
          await pool.query(
            `UPDATE recharges SET status = 'failed' WHERE id = ? AND status <> 'completed'`,
            [payment.recharge_id]
          );
        }
      } else if (transactionId) {
        try {
          const gatewayData = await verifyMoneybagTransaction(transactionId);
          await captureMoneybagVerification(payment.id, gatewayData);
          payment = await getPaymentByReference(pool, { paymentId: payment.id });
        } catch (error) {
          console.warn("[Moneybag] callback verification failed:", error.message);
        }
      }
    }
  } catch (error) {
    console.error("[Moneybag] callback lookup failed:", error.message);
  }

  if (req.method === "GET") {
    const redirect = buildResultUrl({
      order_ref:
        payment?.order_number || payment?.recharge_transaction_id || orderRef,
      payment_id: payment?.id || undefined,
      transaction_id:
        payment?.gateway_transaction_id || transactionId || undefined,
      callback_result: result,
    });
    return res.redirect(redirect);
  }

  return res.json({
    success: true,
    message: "Moneybag callback received",
    data: {
      payment_id: payment?.id || null,
      order_ref:
        payment?.order_number || payment?.recharge_transaction_id || orderRef,
      transaction_id: payment?.gateway_transaction_id || transactionId || null,
    },
  });
}

async function webhook(req, res) {
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(String(req.body || ""), "utf8");
  const signature = req.get("X-Webhook-Signature");
  const timestamp = req.get("X-Webhook-Timestamp");
  const eventType = req.get("X-Webhook-Event-Type") || "unknown";
  const eventId = req.get("X-Webhook-Event-Id");

  try {
    const verification = verifyWebhookSignature(rawBody, signature, timestamp);
    if (!verification.valid)
      return res
        .status(401)
        .json({ success: false, message: verification.reason });
    if (!eventId)
      return res
        .status(400)
        .json({ success: false, message: "X-Webhook-Event-Id is required" });

    let payload;
    try {
      payload = JSON.parse(rawBody.toString("utf8") || "{}");
    } catch (_) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid webhook JSON" });
    }

    const existing = await pool.query(
      `SELECT id,status FROM moneybag_webhook_events WHERE event_id=? LIMIT 1`,
      [eventId]
    );
    if (existing[0].length && existing[0][0].status === "processed") {
      return res.json({ success: true, duplicate: true });
    }
    if (existing[0].length && existing[0][0].status === "processing") {
      return res.json({ success: true, duplicate: true, processing: true });
    }

    if (existing[0].length) {
      await pool.query(
        `UPDATE moneybag_webhook_events SET status='processing', event_type=?, payload=?, last_error=NULL WHERE event_id=?`,
        [eventType, safeJson(payload), eventId]
      );
    } else {
      await pool.query(
        `INSERT INTO moneybag_webhook_events (event_id,event_type,status,payload) VALUES (?,?, 'processing', ?)`,
        [eventId, eventType, safeJson(payload)]
      );
    }

    const transactionId = getMoneybagTransactionId(payload);
    const orderRef = getMoneybagOrderRef(payload);
    const payment = await getPaymentByReference(pool, {
      orderRef,
      transactionId,
    });

    if (!payment) {
      await pool.query(
        `UPDATE moneybag_webhook_events SET status='processed', processed_at=NOW(), last_error=? WHERE event_id=?`,
        [
          "No matching MyBDPhone payment was found; retained for reconciliation.",
          eventId,
        ]
      );
      return res.json({ success: true, matched: false });
    }

    if (transactionId) {
      const gatewayData = await verifyMoneybagTransaction(transactionId);
      await captureMoneybagVerification(payment.id, gatewayData);
    }

    await pool.query(
      `UPDATE moneybag_webhook_events SET status='processed', processed_at=NOW(), last_error=NULL WHERE event_id=?`,
      [eventId]
    );
    return res.json({ success: true, matched: true });
  } catch (error) {
    console.error("[Moneybag] webhook failed:", error.message);
    if (eventId) {
      await pool
        .query(
          `UPDATE moneybag_webhook_events SET status='failed', last_error=? WHERE event_id=?`,
          [String(error.message).slice(0, 1000), eventId]
        )
        .catch(() => {});
    }
    return res
      .status(500)
      .json({ success: false, message: "Moneybag webhook processing failed" });
  }
}

async function configStatus(req, res) {
  const cfg = getConfig();
  let error = null;
  try {
    assertConfig({ apiKey: true });
  } catch (e) {
    error = e.message;
  }
  return res.json({
    success: true,
    data: {
      environment: cfg.environment,
      base_url: cfg.baseUrl,
      merchant_api_key_loaded: Boolean(cfg.merchantApiKey),
      webhook_secret_loaded: Boolean(cfg.webhookSecret),
      callback_url: cfg.callbackUrl,
      webhook_url: cfg.webhookUrl,
      frontend_result_url: cfg.frontendResultUrl,
      checkout_path: cfg.checkoutPath,
      verify_path: cfg.verifyPath,
      configuration_error: error,
    },
  });
}

module.exports = {
  createOrderCheckout,
  verifyResult,
  callback,
  webhook,
  configStatus,
  captureMoneybagVerification,
};
