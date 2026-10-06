const crypto = require("crypto");
const pool = require("../config/db");
const {
  authenticateDgePay,
  initiateDgePayPayment,
  checkDgePayTransaction,
  decryptDgePayPayload,
} = require("../services/dgepayService");
const { notifyAdmins } = require("../services/adminNotificationService");

function makeRef(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
}

function query(sql, params = []) {
  return pool.query(sql, params);
}

function parseJson(value, fallback = {}) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getNestedGatewayData(data) {
  let current = data;
  const seen = new Set();
  const candidates = [];

  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    candidates.push(current);

    if (typeof current.data === "string") {
      try {
        const parsed = JSON.parse(current.data);
        current = parsed;
        continue;
      } catch (_) {}
    }

    if (current.data && typeof current.data === "object") {
      current = current.data;
      continue;
    }

    if (current.result && typeof current.result === "object") {
      current = current.result;
      continue;
    }

    if (current.response && typeof current.response === "object") {
      current = current.response;
      continue;
    }

    break;
  }

  return candidates;
}

function findGatewayField(data, fieldNames) {
  for (const obj of getNestedGatewayData(data)) {
    for (const field of fieldNames) {
      if (
        obj?.[field] !== undefined &&
        obj?.[field] !== null &&
        obj?.[field] !== ""
      ) {
        return obj[field];
      }
    }
  }
  return null;
}

// DGePay wraps successful HTTP responses with an outer `status_code: 200`,
// while the actual transaction result is inside `data.status_code` (3/4/8).
// For status codes we therefore search the deepest object first.
function findGatewayStatusCode(data) {
  const candidates = getNestedGatewayData(data);
  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    for (const field of ["status_code", "statusCode"]) {
      const value = candidates[i]?.[field];
      if (value !== undefined && value !== null && value !== "")
        return String(value).trim();
    }
  }
  return "";
}

function normalizeGatewayStatus(data) {
  const statusCode = findGatewayStatusCode(data);

  // DGePay's official UAT SDK models use 3=success, 4=failed and 8=cancelled.
  if (statusCode === "3") return "approved";
  if (statusCode === "4") return "failed";
  if (statusCode === "8") return "cancelled";

  const value = String(
    findGatewayField(data, [
      "status",
      "payment_status",
      "transaction_status",
      "trx_status",
    ]) ?? ""
  )
    .toLowerCase()
    .trim();

  if (
    [
      "success",
      "successful",
      "paid",
      "completed",
      "complete",
      "approved",
      "succeeded",
    ].includes(value)
  ) {
    return "approved";
  }
  if (["failed", "failure", "rejected", "declined", "error"].includes(value)) {
    return "failed";
  }
  if (["cancelled", "canceled", "expired"].includes(value)) {
    return value === "expired" ? "failed" : "cancelled";
  }

  const message = String(
    findGatewayField(data, ["message", "error_msg", "error"]) ?? ""
  ).toLowerCase();
  if (
    message.includes("transaction success") ||
    message.includes("payment success")
  )
    return "approved";
  if (
    message.includes("transaction failed") ||
    message.includes("payment failed")
  )
    return "failed";
  if (message.includes("cancel")) return "cancelled";

  return "pending";
}

function isGatewayApproved(data) {
  const statusCode = findGatewayStatusCode(data);
  if (statusCode === "3") return true;
  return normalizeGatewayStatus(data) === "approved";
}

function isGatewayFailed(data) {
  const statusCode = findGatewayStatusCode(data);
  if (statusCode === "4" || statusCode === "8") return true;

  return ["failed", "cancelled"].includes(normalizeGatewayStatus(data));
}

function isGatewayCancelled(data) {
  const statusCode = findGatewayStatusCode(data);
  if (statusCode === "8") return true;
  return normalizeGatewayStatus(data) === "cancelled";
}

function getGatewayTxnId(data) {
  return findGatewayField(data, [
    "txn_number",
    "txn_id",
    "third_party_txn_number",
    "transaction_id",
    "gateway_transaction_id",
  ]);
}

function getGatewayMessage(data) {
  return findGatewayField(data, ["message", "error_msg", "error"]);
}

function getGatewayStatusCode(data) {
  return findGatewayStatusCode(data) || null;
}

async function verifyDgePayWithRetry(uniqueTxnId, options = {}) {
  const attempts = Math.max(1, Number(options.attempts || 5));
  const delays = Array.isArray(options.delaysMs)
    ? options.delaysMs
    : [0, 1500, 3000, 5000, 7000];

  let last = null;
  for (let i = 0; i < attempts; i += 1) {
    if (i > 0) {
      const delay = Number(delays[i] ?? delays[delays.length - 1] ?? 1500);
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const result = await checkDgePayTransaction(uniqueTxnId);
    last = result;

    if (isGatewayApproved(result) || isGatewayFailed(result)) return result;
  }

  return last;
}

async function testAuthentication(req, res) {
  try {
    const result = await authenticateDgePay();
    return res.json({
      success: true,
      message: "DGePay authentication successful",
      data: {
        authenticated: true,
        expiry_time: result.expiryTime || null,
        cached: Boolean(result.cached),
      },
    });
  } catch (error) {
    console.error("[DGePay] auth test failed:", error.message);
    return res.status(502).json({ success: false, message: error.message });
  }
}

async function getConfigStatus(req, res) {
  const cfg = require("../services/dgepayService").getConfig();
  return res.json({
    success: true,
    data: {
      environment: process.env.DGEPAY_ENV || process.env.DGEPAY_ENV || "uat",
      base_url: cfg.baseUrl,
      client_id_loaded: Boolean(cfg.clientId),
      client_secret_loaded: Boolean(cfg.clientSecret),
      api_key_loaded: Boolean(cfg.apiKey),
      callback_url_configured: Boolean(cfg.ipnRedirectUrl),
      redirect_url: cfg.redirectUrl,
      frontend_result_url: cfg.frontendResultUrl,
      initiate_path: cfg.initiatePath,
      verify_path: cfg.verifyPath,
    },
  });
}

async function createOrGetGatewayPayment(req, res, next) {
  try {
    const orderId = Number(req.body?.order_id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid numeric order_id is required",
      });
    }

    const [rows] = await query(
      `SELECT
         o.id,
         o.order_number,
         o.user_id,
         o.package_id,
         o.product_id,
         o.item_type,
         o.item_title,
         o.amount,
         o.currency,
         o.payment_method,
         o.payment_status,
         o.status,
         o.details,
         u.name AS customer_name,
         u.email AS customer_email,
         u.phone AS customer_phone
       FROM orders o
       INNER JOIN users u ON u.id = o.user_id
       WHERE o.id = ?
       LIMIT 1`,
      [orderId]
    );

    if (!rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    const order = rows[0];

    if (order.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (
      ["active", "completed"].includes(order.status) &&
      order.payment_status === "paid"
    ) {
      return res
        .status(409)
        .json({ success: false, message: "This order is already completed" });
    }

    const phone = String(
      order.customer_phone || req.user.phone || req.body?.customer_phone || ""
    ).trim();
    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Customer phone is required" });
    }

    const gateway = await initiateDgePayPayment({
      amount: order.amount,
      orderId: order.id,
      orderNumber: order.order_number,
      customer: {
        userId: order.user_id,
        name: order.customer_name || req.user.name,
        email: order.customer_email || req.user.email,
        phone,
      },
      note: `MyBDPhone - ${order.order_number}`,
    });

    if (!gateway.paymentUrl) {
      return res.status(502).json({
        success: false,
        message: "DGePay did not return a payment URL",
        data: gateway.raw,
      });
    }

    const [paymentResult] = await query(
      `INSERT INTO payments
       (order_id, recharge_id, user_id, gateway, payment_method, amount, currency,
        gateway_unique_txn_id, gateway_order_id, gateway_status, gateway_response, status)
       VALUES (?, NULL, ?, 'dgepay', 'dgepay', ?, ?, ?, ?, ?, 'initiated', ?, 'pending')`,
      [
        order.id,
        order.user_id,
        Number(order.amount),
        order.currency || "BDT",
        gateway.uniqueTxnId,
        gateway.gatewayOrderId || gateway.uniqueTxnId,
        JSON.stringify(gateway.raw || {}),
      ]
    );

    await query(
      `UPDATE orders
       SET status = 'processing', payment_status = 'unpaid'
       WHERE id = ? AND payment_status <> 'paid'`,
      [order.id]
    );

    return res.status(200).json({
      success: true,
      message: "DGePay payment initiated successfully",
      data: {
        payment_id: paymentResult.insertId,
        order_id: order.id,
        order_number: order.order_number,
        amount: Number(order.amount),
        currency: order.currency || "BDT",
        unique_txn_id: gateway.uniqueTxnId,
        payment_url: gateway.paymentUrl,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("[DGePay] create payment failed:", error);
    next(error);
  }
}

// Development-only direct gateway test. It does not create an order/payment row.
async function testInitiate(req, res) {
  if (
    process.env.NODE_ENV === "production" ||
    String(process.env.DGEPAY_TEST_MODE || "false").toLowerCase() !== "true"
  ) {
    return res
      .status(404)
      .json({ success: false, message: "Test payment endpoint is disabled" });
  }

  try {
    const amount = Number(req.body?.amount);
    const phone = String(
      req.body?.customer_phone || req.user?.phone || ""
    ).trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Valid amount is required" });
    }
    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Customer phone is required" });
    }

    const result = await initiateDgePayPayment({
      amount,
      orderId: `TEST-${Date.now()}`,
      orderNumber: `TEST-${Date.now()}`,
      customer: {
        userId: req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone,
      },
      note: String(req.body?.note || "MyBDPhone DGePay UAT Test"),
      redirectUrl: req.body?.redirect_url || undefined,
    });

    return res.json({
      success: true,
      message: "DGePay test payment initialized",
      data: result,
    });
  } catch (error) {
    console.error("[DGePay] test initiate failed:", error.message);
    return res.status(502).json({ success: false, message: error.message });
  }
}

async function checkOrderPaymentStatus(req, res, next) {
  try {
    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }

    const [payments] = await query(
      `SELECT p.*, o.order_number, o.amount AS order_amount, o.currency AS order_currency,
              o.status AS order_status, o.user_id AS order_user_id
       FROM payments p
       INNER JOIN orders o ON o.id = p.order_id
       WHERE p.order_id = ? AND p.gateway = 'dgepay'
       ORDER BY p.id DESC LIMIT 1`,
      [orderId]
    );

    if (!payments.length) {
      return res.status(404).json({
        success: false,
        message: "DGePay payment not found for this order",
      });
    }

    const payment = payments[0];
    if (payment.order_user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (payment.status === "approved") {
      return res.json({
        success: true,
        message: "Payment already approved",
        data: {
          order_id: orderId,
          payment_id: payment.id,
          status: "approved",
          transaction_id:
            payment.gateway_transaction_id || payment.gateway_unique_txn_id,
        },
      });
    }

    const gatewayData = await verifyDgePayWithRetry(
      payment.gateway_unique_txn_id
    );
    await applyGatewayResult(payment.id, gatewayData);

    const gatewayApproved = isGatewayApproved(gatewayData);
    const failed = isGatewayFailed(gatewayData);
    const localStatus = gatewayApproved
      ? "pending_verification"
      : failed
      ? isGatewayCancelled(gatewayData)
        ? "cancelled"
        : "failed"
      : "pending";

    return res.json({
      success: !failed,
      message: gatewayApproved
        ? "DGePay payment received. Administrator verification is pending."
        : failed
        ? "DGePay payment failed or was cancelled"
        : "DGePay payment is pending",
      data: {
        order_id: orderId,
        payment_id: payment.id,
        status: localStatus,
        admin_verification_required: gatewayApproved,
        gateway_status: normalizeGatewayStatus(gatewayData),
        transaction_id:
          getGatewayTxnId(gatewayData) || payment.gateway_unique_txn_id,
      },
    });
  } catch (error) {
    console.error("[DGePay] status check failed:", error);
    next(error);
  }
}

async function checkPaymentByTxnId(req, res, next) {
  try {
    const uniqueTxnId = String(req.params.uniqueTxnId || "").trim();
    if (!uniqueTxnId) {
      return res
        .status(400)
        .json({ success: false, message: "unique_txn_id is required" });
    }

    const [payments] = await query(
      `SELECT p.*, o.order_number, o.item_title, o.status AS order_status,
              o.payment_status AS order_payment_status
       FROM payments p
       LEFT JOIN orders o ON o.id = p.order_id
       WHERE p.gateway_unique_txn_id = ?
       ORDER BY p.id DESC LIMIT 1`,
      [uniqueTxnId]
    );

    if (!payments.length) {
      return res
        .status(404)
        .json({ success: false, message: "DGePay payment not found" });
    }

    const payment = payments[0];
    if (
      Number(payment.user_id) !== Number(req.user.id) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (payment.status !== "approved") {
      const gatewayData = await verifyDgePayWithRetry(uniqueTxnId);
      await applyGatewayResult(payment.id, gatewayData);
    }

    const [freshRows] = await query(
      `SELECT p.*, o.order_number, o.item_title, o.status AS order_status,
              o.payment_status AS order_payment_status
       FROM payments p
       LEFT JOIN orders o ON o.id = p.order_id
       WHERE p.id = ? LIMIT 1`,
      [payment.id]
    );

    const fresh = freshRows[0] || payment;
    const approved = fresh.status === "approved";
    const failed = ["failed", "cancelled", "refunded"].includes(fresh.status);

    return res.json({
      success: approved,
      message: approved
        ? "Payment verified successfully"
        : failed
        ? "Payment failed or was cancelled"
        : "Payment is pending",
      data: {
        payment_id: fresh.id,
        order_id: fresh.order_id || null,
        recharge_id: fresh.recharge_id || null,
        order_number: fresh.order_number || null,
        unique_txn_id: fresh.gateway_unique_txn_id,
        transaction_id:
          fresh.gateway_transaction_id || fresh.gateway_unique_txn_id,
        status: fresh.status,
        admin_verification_required:
          fresh.status === "pending" &&
          ["success", "approved", "paid", "3"].includes(
            String(fresh.gateway_status || "").toLowerCase()
          ),
        gateway_status: fresh.gateway_status,
        order_status: fresh.order_status || null,
        order_payment_status: fresh.order_payment_status || null,
      },
    });
  } catch (error) {
    console.error("[DGePay] generic payment status failed:", error);
    next(error);
  }
}

async function verifyCallbackResult(req, res, next) {
  try {
    const encryptedData = req.body?.data || null;
    const directTxnId = req.body?.unique_txn_id || null;
    const decrypted = encryptedData
      ? decryptDgePayPayload(encryptedData)
      : null;
    const uniqueTxnId = decrypted?.unique_txn_id || directTxnId;
    const callbackStatusCode =
      decrypted?.status_code ?? decrypted?.statusCode ?? null;
    const callbackStatus = normalizeGatewayStatus(decrypted);

    if (!uniqueTxnId) {
      return res
        .status(400)
        .json({ success: false, message: "unique_txn_id is required" });
    }

    const [payments] = await query(
      `SELECT p.*, o.user_id AS order_user_id
       FROM payments p
       LEFT JOIN orders o ON o.id = p.order_id
       WHERE p.gateway_unique_txn_id = ?
       ORDER BY p.id DESC LIMIT 1`,
      [uniqueTxnId]
    );

    if (!payments.length) {
      return res
        .status(404)
        .json({ success: false, message: "Payment transaction not found" });
    }

    const payment = payments[0];
    if (
      payment.order_user_id &&
      payment.order_user_id !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // DGePay sends an encrypted callback result. Prefer a definitive callback
    // result (status_code 3/4/8) when the status API is still settling, while
    // also checking the transaction-status endpoint when possible.
    let gatewayData = null;
    try {
      gatewayData = await verifyDgePayWithRetry(uniqueTxnId);
    } catch (verifyError) {
      console.warn(
        "[DGePay] status API check failed after callback:",
        verifyError.message
      );
    }

    const callbackIsTerminal =
      isGatewayApproved(decrypted) || isGatewayFailed(decrypted);
    const verifiedIsTerminal =
      gatewayData &&
      (isGatewayApproved(gatewayData) || isGatewayFailed(gatewayData));
    const effectiveGatewayData =
      callbackIsTerminal && !verifiedIsTerminal
        ? decrypted
        : verifiedIsTerminal
        ? gatewayData
        : callbackIsTerminal
        ? decrypted
        : gatewayData;

    if (!effectiveGatewayData) {
      throw new Error("DGePay did not return a transaction status");
    }

    if (getGatewayStatusCode(decrypted) === "3") {
      const callbackAmount = Number(findGatewayField(decrypted, ["amount"]));
      const paymentAmount = Number(payment.amount);
      if (
        Number.isFinite(callbackAmount) &&
        Number.isFinite(paymentAmount) &&
        Math.abs(callbackAmount - paymentAmount) > 0.01
      ) {
        throw new Error(
          `DGePay callback amount mismatch: expected ${paymentAmount}, received ${callbackAmount}`
        );
      }
    }

    await applyGatewayResult(payment.id, effectiveGatewayData);

    // Reload the local payment row after verification so the browser gets
    // the authoritative application status. Previously this response did
    // not include `data.status`, which made the React result page fall into
    // its pending branch even when DGePay returned success or failure.
    const [freshRows] = await query(
      `SELECT p.*, o.order_number, o.status AS order_status, o.payment_status AS order_payment_status
       FROM payments p
       LEFT JOIN orders o ON o.id = p.order_id
       WHERE p.id = ? LIMIT 1`,
      [payment.id]
    );
    const fresh = freshRows[0] || payment;
    const approved = fresh.status === "approved";
    const failed = ["failed", "cancelled", "refunded"].includes(fresh.status);

    return res.json({
      success: approved,
      message: approved
        ? "Payment verified successfully"
        : failed
        ? fresh.status === "cancelled"
          ? "Payment was cancelled"
          : "Payment failed"
        : "Payment pending",
      data: {
        payment_id: fresh.id,
        order_id: fresh.order_id || null,
        recharge_id: fresh.recharge_id || null,
        unique_txn_id: fresh.gateway_unique_txn_id,
        status: approved ? "approved" : failed ? fresh.status : "pending",
        gateway_status:
          fresh.gateway_status || normalizeGatewayStatus(gatewayData),
        callback_status: callbackStatus || "pending",
        callback_status_code: callbackStatusCode || null,
        gateway_status_code: getGatewayStatusCode(gatewayData),
        gateway_message: getGatewayMessage(gatewayData) || null,
        transaction_id:
          fresh.gateway_transaction_id ||
          getGatewayTxnId(gatewayData) ||
          fresh.gateway_unique_txn_id,
        order_status: fresh.order_status || null,
        order_payment_status: fresh.order_payment_status || null,
      },
    });
  } catch (error) {
    console.error("[DGePay] verify-result failed:", error);
    next(error);
  }
}

async function callback(req, res) {
  try {
    const encryptedData = req.query?.data || req.body?.data || null;
    const decrypted = encryptedData
      ? decryptDgePayPayload(encryptedData)
      : null;
    const uniqueTxnId =
      decrypted?.unique_txn_id ||
      req.query?.unique_txn_id ||
      req.body?.unique_txn_id ||
      null;
    const callbackStatus = normalizeGatewayStatus(decrypted);
    const callbackStatusCode = getGatewayStatusCode(decrypted);

    let payment = null;
    if (uniqueTxnId) {
      const [rows] = await query(
        `SELECT p.*, o.order_number
         FROM payments p
         LEFT JOIN orders o ON o.id = p.order_id
         WHERE p.gateway_unique_txn_id = ?
         LIMIT 1`,
        [uniqueTxnId]
      );
      payment = rows[0] || null;
    }

    if (payment && uniqueTxnId) {
      // The encrypted callback is a terminal gateway result when it carries
      // status_code 3/4/8. Do not turn a confirmed callback success back into
      // PENDING just because the status endpoint is temporarily delayed.
      let gatewayData = null;
      try {
        gatewayData = await verifyDgePayWithRetry(uniqueTxnId);
      } catch (verifyError) {
        console.warn(
          "[DGePay] callback verification retry failed:",
          verifyError.message
        );
      }

      const callbackIsTerminal =
        isGatewayApproved(decrypted) || isGatewayFailed(decrypted);
      const gatewayIsTerminal =
        gatewayData &&
        (isGatewayApproved(gatewayData) || isGatewayFailed(gatewayData));
      const effectiveGatewayData = gatewayIsTerminal
        ? gatewayData
        : callbackIsTerminal
        ? decrypted
        : gatewayData;

      if (!effectiveGatewayData) {
        throw new Error("DGePay did not return a transaction status");
      }

      if (getGatewayStatusCode(decrypted) === "3") {
        const callbackAmount = Number(findGatewayField(decrypted, ["amount"]));
        const paymentAmount = Number(payment.amount);
        if (
          Number.isFinite(callbackAmount) &&
          Number.isFinite(paymentAmount) &&
          Math.abs(callbackAmount - paymentAmount) > 0.01
        ) {
          throw new Error(
            `DGePay callback amount mismatch: expected ${paymentAmount}, received ${callbackAmount}`
          );
        }
      }

      await applyGatewayResult(payment.id, effectiveGatewayData);

      // Reload the payment so the browser receives the final local status.
      const [freshPaymentRows] = await query(
        `SELECT * FROM payments WHERE id = ? LIMIT 1`,
        [payment.id]
      );
      payment = freshPaymentRows[0] || payment;
    }

    const frontendUrl = require("../services/dgepayService").getConfig()
      .frontendResultUrl;
    if (req.method === "GET") {
      const redirect = new URL(frontendUrl);
      if (uniqueTxnId) redirect.searchParams.set("unique_txn_id", uniqueTxnId);
      if (payment?.order_id)
        redirect.searchParams.set("order_id", String(payment.order_id));
      if (payment?.recharge_id)
        redirect.searchParams.set("recharge_id", String(payment.recharge_id));
      if (payment?.status)
        redirect.searchParams.set("gateway_status", String(payment.status));
      if (callbackStatus)
        redirect.searchParams.set("callback_status", callbackStatus);
      if (callbackStatusCode)
        redirect.searchParams.set("callback_status_code", callbackStatusCode);
      if (encryptedData) redirect.searchParams.set("data", encryptedData);
      return res.redirect(redirect.toString());
    }

    return res.json({
      success: true,
      message: "DGePay callback processed",
      data: {
        order_id: payment?.order_id || null,
        unique_txn_id: uniqueTxnId,
      },
    });
  } catch (error) {
    console.error("[DGePay] callback failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "DGePay callback failed",
    });
  }
}

async function activatePackageForOrder(connection, order) {
  if (!order.package_id) return null;

  const [packages] = await connection.query(
    `SELECT id, name, service_type, billing_period, device_limit, call_minutes, ai_credits
     FROM packages WHERE id = ? LIMIT 1`,
    [order.package_id]
  );
  if (!packages.length)
    throw new Error("Package not found while finalizing payment");

  const pkg = packages[0];
  const details = parseJson(order.details, {});
  const requestedNumberId = Number(details?.assigned_number_id || 0) || null;

  const [activeSubs] = await connection.query(
    `SELECT * FROM user_subscriptions
     WHERE user_id = ? AND service_type = ? AND status = 'active'
     ORDER BY expires_at DESC LIMIT 1 FOR UPDATE`,
    [order.user_id, pkg.service_type]
  );

  let subscription = activeSubs[0] || null;
  let ipNumberId = subscription?.ip_number_id || null;
  let assignedNumber = subscription?.assigned_number || null;

  if (pkg.service_type === "ip_phone" && !ipNumberId) {
    let candidates = [];

    if (requestedNumberId) {
      const [requested] = await connection.query(
        `SELECT * FROM ip_numbers WHERE id = ? AND status = 'available' LIMIT 1 FOR UPDATE`,
        [requestedNumberId]
      );
      candidates = requested;
    }

    if (!candidates.length) {
      const [available] = await connection.query(
        `SELECT * FROM ip_numbers WHERE status = 'available' ORDER BY id LIMIT 1 FOR UPDATE`
      );
      candidates = available;
    }

    if (!candidates.length)
      throw new Error("No available 096 IP number is currently available");

    ipNumberId = candidates[0].id;
    assignedNumber = candidates[0].number;

    await connection.query(
      `UPDATE ip_numbers
       SET assigned_user_id = ?, status = 'assigned', max_devices = ?, device_count = 0
       WHERE id = ?`,
      [order.user_id, pkg.device_limit || 5, ipNumberId]
    );
  }

  if (pkg.service_type === "ip_phone" && ipNumberId) {
    await connection.query(
      `UPDATE ip_numbers SET assigned_user_id = ?, status = 'assigned', max_devices = ? WHERE id = ?`,
      [order.user_id, pkg.device_limit || 5, ipNumberId]
    );
  }

  const days =
    pkg.billing_period === "quarterly"
      ? 90
      : pkg.billing_period === "yearly"
      ? 365
      : 30;
  const now = new Date();
  const baseDate =
    subscription && new Date(subscription.expires_at) > now
      ? new Date(subscription.expires_at)
      : now;
  const expiresAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

  if (pkg.service_type === "ai_calling") {
    const minutes = Number(pkg.call_minutes || pkg.ai_credits || 0);
    if (minutes > 0) {
      await connection.query(
        `UPDATE users SET ai_minutes = ai_minutes + ? WHERE id = ?`,
        [minutes, order.user_id]
      );
    }
  }

  if (subscription) {
    await connection.query(
      `UPDATE user_subscriptions
       SET package_id = ?, ip_number_id = ?, assigned_number = ?, status = 'active',
           expires_at = ?, auto_renew = 1
       WHERE id = ?`,
      [pkg.id, ipNumberId, assignedNumber, expiresAt, subscription.id]
    );
    return subscription.id;
  }

  const [insertResult] = await connection.query(
    `INSERT INTO user_subscriptions
      (user_id, package_id, ip_number_id, assigned_number, service_type, status, started_at, expires_at, auto_renew)
     VALUES (?, ?, ?, ?, ?, 'active', NOW(), ?, 1)`,
    [
      order.user_id,
      pkg.id,
      ipNumberId,
      assignedNumber,
      pkg.service_type,
      expiresAt,
    ]
  );

  return insertResult.insertId;
}

async function applyGatewayResult(paymentId, gatewayData) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [payments] = await connection.query(
      `SELECT * FROM payments WHERE id = ? LIMIT 1 FOR UPDATE`,
      [paymentId]
    );
    if (!payments.length) throw new Error("Payment not found");

    const payment = payments[0];
    const previousGatewayStatus = String(
      payment.gateway_status || ""
    ).toLowerCase();
    const status = normalizeGatewayStatus(gatewayData);
    const gatewayTxnId = getGatewayTxnId(gatewayData);

    if (process.env.DGEPAY_DEBUG === "true") {
      console.log(
        "[DGePay] VERIFY RESULT",
        JSON.stringify({
          status,
          status_code: getGatewayStatusCode(gatewayData),
          message: getGatewayMessage(gatewayData),
          txn: gatewayTxnId,
          raw: gatewayData,
        })
      );
    }

    await connection.query(
      `UPDATE payments
       SET gateway_status = ?, gateway_transaction_id = COALESCE(?, gateway_transaction_id),
           gateway_response = ?, status = CASE
             WHEN ? THEN 'cancelled'
             WHEN ? THEN 'failed'
             WHEN ? THEN 'approved'
             ELSE status
           END,
           paid_at = CASE WHEN ? THEN COALESCE(paid_at, NOW()) ELSE paid_at END
       WHERE id = ?`,
      [
        status,
        gatewayTxnId,
        JSON.stringify(gatewayData || {}),
        isGatewayCancelled(gatewayData) ? 1 : 0,
        isGatewayFailed(gatewayData) && !isGatewayCancelled(gatewayData)
          ? 1
          : 0,
        isGatewayApproved(gatewayData) ? 1 : 0,
        isGatewayApproved(gatewayData) ? 1 : 0,
        paymentId,
      ]
    );

    if (isGatewayCancelled(gatewayData) || isGatewayFailed(gatewayData)) {
      const finalState = isGatewayCancelled(gatewayData) ? "cancelled" : "failed";
      if (payment.order_id) {
        await connection.query(
          `UPDATE orders SET status = ?, payment_status = 'unpaid' WHERE id = ? AND payment_status <> 'paid'`,
          [finalState, payment.order_id]
        );
      }
      if (payment.recharge_id) {
        await connection.query(
          `UPDATE recharges SET status = 'failed' WHERE id = ? AND status <> 'completed'`,
          [payment.recharge_id]
        );
      }
    } else if (isGatewayApproved(gatewayData)) {
      if (payment.order_id) {
        const [[orderInfo]] = await connection.query(
          `SELECT o.*, u.name AS user_name
           FROM orders o JOIN users u ON u.id=o.user_id
           WHERE o.id=? LIMIT 1 FOR UPDATE`,
          [payment.order_id]
        );
        if (orderInfo && orderInfo.payment_status !== "paid") {
          await connection.query(
            `UPDATE orders SET status=?, payment_status='paid' WHERE id=?`,
            [
              orderInfo.item_type === "package" ? "active" : "completed",
              orderInfo.id,
            ]
          );

          if (orderInfo.item_type === "package") {
            try {
              await activatePackageForOrder(connection, orderInfo);
            } catch (actErr) {
              console.error("[DGePay] Package activation warning:", actErr.message);
            }
          }

          if (
            !["success", "approved", "paid", "3"].includes(
              previousGatewayStatus
            )
          ) {
            await connection.query(
              `INSERT INTO notifications (user_id,title,message,type,link)
               VALUES (?, ?, ?, 'order', '/user/orders')`,
              [
                payment.user_id,
                "Payment Successful — Service Activated",
                `Your DGePay payment for ${orderInfo.item_title} was successful. Service is now active.`,
              ]
            );
          }
          await notifyAdmins(connection, {
            title: "DGePay Order Paid & Activated",
            message: `${
              orderInfo.user_name
            } completed DGePay payment of ৳${Number(
              orderInfo.amount || 0
            ).toFixed(2)} for ${
              orderInfo.item_title
            }. Order #${orderInfo.order_number} is now active.`,
            type: "order",
            link: "/admin/orders",
            entityType: "order",
            entityId: payment.order_id,
            dedupeKey: `payment:${payment.id}:dgepay-paid-auto`,
          });
        }
      } else if (payment.recharge_id) {
        const [[rechargeInfo]] = await connection.query(
          `SELECT r.*, u.name AS user_name
           FROM recharges r JOIN users u ON u.id=r.user_id
           WHERE r.id=? LIMIT 1 FOR UPDATE`,
          [payment.recharge_id]
        );
        if (rechargeInfo && rechargeInfo.status !== "completed") {
          const [users] = await connection.query(
            `SELECT balance FROM users WHERE id=? LIMIT 1 FOR UPDATE`,
            [rechargeInfo.user_id]
          );
          if (users.length) {
            const next =
              Number(users[0].balance || 0) + Number(rechargeInfo.amount);
            await connection.query("UPDATE users SET balance=? WHERE id=?", [
              next,
              rechargeInfo.user_id,
            ]);
            await connection.query(
              `UPDATE recharges SET status='completed', notes=CONCAT(COALESCE(notes,''),' | DGePay auto-credited') WHERE id=?`,
              [rechargeInfo.id]
            );
            await connection.query(
              `INSERT INTO transactions (transaction_code,user_id,type,direction,amount,balance_after,reference_id,description,status) VALUES (?,?,?,?,?,?,?,?,?)`,
              [
                makeRef("RCH"),
                rechargeInfo.user_id,
                "recharge",
                "credit",
                rechargeInfo.amount,
                next,
                rechargeInfo.transaction_id,
                "DGePay online wallet recharge",
                "completed",
              ]
            );
          }

          if (
            !["success", "approved", "paid", "3"].includes(
              previousGatewayStatus
            )
          ) {
            await connection.query(
              `INSERT INTO notifications (user_id,title,message,type,link)
               VALUES (?, 'Recharge Successful', ?, 'recharge', '/user/transactions')`,
              [
                payment.user_id,
                `Your DGePay recharge of ৳${Number(
                  rechargeInfo.amount || 0
                ).toFixed(
                  2
                )} has been credited to your wallet.`,
              ]
            );
          }
          await notifyAdmins(connection, {
            title: "DGePay Recharge Completed",
            message: `${
              rechargeInfo.user_name
            } completed a DGePay recharge of ৳${Number(
              rechargeInfo.amount || 0
            ).toFixed(
              2
            )}. Wallet credited automatically.`,
            type: "recharge",
            link: "/admin/payments",
            entityType: "recharge",
            entityId: payment.recharge_id,
            dedupeKey: `payment:${payment.id}:dgepay-recharge-auto`,
          });
        }
      }
    }

    await connection.commit();
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  testAuthentication,
  getConfigStatus,
  createOrGetGatewayPayment,
  testInitiate,
  checkOrderPaymentStatus,
  checkPaymentByTxnId,
  verifyCallbackResult,
  callback,
};
