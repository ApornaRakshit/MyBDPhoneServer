const crypto = require("crypto");
const axios = require("axios");

function env(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined && String(value).trim() !== "")
      return String(value).trim();
  }
  return undefined;
}

const DEFAULT_BASE_URLS = Object.freeze({
  production: "https://api.moneybag.com.bd/api/v2",
});

function getConfig() {
  const environment =
    String(env("MONEYBAG_ENV") || "sandbox").toLowerCase() === "production"
      ? "production"
      : "sandbox";

  const baseUrl = String(
    env("MONEYBAG_BASE_URL") || DEFAULT_BASE_URLS[environment]
  ).replace(/\/$/, "");

  return {
    environment,
    baseUrl,
    merchantApiKey: env("MONEYBAG_MERCHANT_API_KEY", "MONEYBAG_API_KEY"),
    // webhookSecret: env('MONEYBAG_WEBHOOK_SECRET'),
    // webhookToleranceSec: Number(env('MONEYBAG_WEBHOOK_TOLERANCE_SEC') || 300),
    checkoutPath: env("MONEYBAG_CHECKOUT_PATH") || "/payments/checkout",
    verifyPath: env("MONEYBAG_VERIFY_PATH") || "/payments/verify",
    // callbackUrl: env('MONEYBAG_CALLBACK_URL') || 'http://localhost:5000/api/moneybag/callback',
    // callbackUrl: env('MONEYBAG_CALLBACK_URL') || 'https://api.mybdphone.com/api/moneybag/callback',
    // webhookUrl: env('MONEYBAG_WEBHOOK_URL') || 'http://localhost:5000/api/moneybag/webhook',
    // webhookSecret: env("MONEYBAG_WEBHOOK_SECRET"),

    // webhookToleranceSec: Number(
    //   env("MONEYBAG_WEBHOOK_TOLERANCE_SEC") || 300
    // ),
    
    // webhookUrl:
    //   env("MONEYBAG_WEBHOOK_URL") ||
    //   "https://api.mybdphone.com/api/moneybag/webhook",
    
    callbackUrl:
      env("MONEYBAG_CALLBACK_URL") ||
      "https://api.mybdphone.com/api/moneybag/callback",

    frontendResultUrl:
      env("MONEYBAG_FRONTEND_RESULT_URL") ||
      "https://mybdphone.com/payment/moneybag/result",

    failUrl:
      env("MONEYBAG_FAIL_URL") ||
      "https://mybdphone.com/payment/moneybag/result?result=fail",

    cancelUrl:
      env("MONEYBAG_CANCEL_URL") ||
      "https://mybdphone.com/payment/moneybag/result?result=cancel",

    successUrl:
      env("MONEYBAG_SUCCESS_URL") ||
      "https://mybdphone.com/payment/moneybag/result?result=success",
    timeoutMs: Number(env("MONEYBAG_TIMEOUT_MS") || 30000),
    debug: String(env("MONEYBAG_DEBUG") || "false").toLowerCase() === "true",
  };
}

function assertConfig(requirement = {}) {
  const cfg = getConfig();
  const missing = [];

  if (requirement.apiKey !== false && !cfg.merchantApiKey) {
    missing.push("MONEYBAG_MERCHANT_API_KEY");
  }
  if (requirement.webhookSecret && !cfg.webhookSecret) {
    missing.push("MONEYBAG_WEBHOOK_SECRET");
  }

  if (missing.length) {
    throw new Error(`Missing Moneybag configuration: ${missing.join(", ")}`);
  }

  return cfg;
}

function sanitizeErrorBody(body) {
  if (body == null) return null;
  if (typeof body === "string") return body.slice(0, 1000);
  try {
    return JSON.stringify(body).slice(0, 2000);
  } catch (_) {
    return "[unserializable response]";
  }
}

async function moneybagRequest(method, path, options = {}) {
  const cfg = assertConfig({ apiKey: true });
  const url = `${cfg.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Merchant-API-Key": cfg.merchantApiKey,
    ...(options.headers || {}),
  };

  try {
    const response = await axios({
      method,
      url,
      headers,
      data: options.data,
      timeout: cfg.timeoutMs,
      validateStatus: () => true,
    });

    if (cfg.debug) {
      console.log("[Moneybag]", method, path, "HTTP", response.status);
      console.log("[Moneybag] response:", sanitizeErrorBody(response.data));
    }

    if (response.status < 200 || response.status >= 300) {
      const apiMessage =
        response.data?.message ||
        response.data?.detail?.[0]?.msg ||
        response.data?.detail?.msg ||
        response.data?.error ||
        `HTTP ${response.status}`;
      throw new Error(`Moneybag API error: ${apiMessage}`);
    }

    return response.data;
  } catch (error) {
    if (error.response) {
      const apiMessage =
        error.response.data?.message ||
        error.response.data?.detail?.[0]?.msg ||
        error.response.data?.detail?.msg ||
        error.response.data?.error ||
        `HTTP ${error.response.status}`;
      throw new Error(`Moneybag API error: ${apiMessage}`);
    }

    throw error;
  }
}

function makeMoneybagCallbackUrl(result, orderRef) {
  const cfg = getConfig();
  const url = new URL(cfg.callbackUrl);
  url.searchParams.set("result", result);
  url.searchParams.set("order_ref", String(orderRef));
  return url.toString();
}

function makeMoneybagCheckoutBody({
  orderRef,
  amount,
  description,
  customer,
  item,
}) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid Moneybag payment amount");
  }

  const phone = String(customer?.phone || "").trim();
  if (!phone)
    throw new Error("Customer phone is required for Moneybag payment");

  const name = String(customer?.name || "").trim();
  const email = String(customer?.email || "").trim();
  if (!name || !email) {
    throw new Error(
      "Customer name and email are required for Moneybag payment"
    );
  }

  const orderItems = item
    ? [
        {
          product_name: String(
            item.name || description || "MyBDPhone Purchase"
          ).slice(0, 255),
          product_category: String(item.category || "Telecom Service").slice(
            0,
            100
          ),
          quantity: 1,
          unit_price: numericAmount.toFixed(2),
          net_amount: numericAmount.toFixed(2),
          sku: item.sku ? String(item.sku) : undefined,
        },
      ]
    : undefined;

  const body = {
    order_id: String(orderRef),
    order_amount: numericAmount.toFixed(2),
    currency: "BDT",
    order_description: String(description || "MyBDPhone Payment").slice(0, 255),
    success_url: makeMoneybagCallbackUrl("success", orderRef),
    cancel_url: makeMoneybagCallbackUrl("cancel", orderRef),
    fail_url: makeMoneybagCallbackUrl("fail", orderRef),
    ipn_url: getConfig().webhookUrl,
    metadata: {
      source: "mybdphone",
      order_ref: String(orderRef),
    },
    customer: {
      name,
      email,
      phone,
      address: customer?.address
        ? String(customer.address).slice(0, 255)
        : null,
      city: customer?.city ? String(customer.city).slice(0, 100) : "Dhaka",
      postcode: customer?.postcode
        ? String(customer.postcode).slice(0, 20)
        : null,
      country: customer?.country
        ? String(customer.country).slice(0, 80)
        : "Bangladesh",
    },
  };

  if (orderItems) body.order_items = orderItems;

  return body;
}

async function createMoneybagCheckout({
  orderRef,
  amount,
  description,
  customer,
  item,
}) {
  const cfg = assertConfig({ apiKey: true });
  const body = makeMoneybagCheckoutBody({
    orderRef,
    amount,
    description,
    customer,
    item,
  });

  const raw = await moneybagRequest("POST", cfg.checkoutPath, { data: body });
  const data = raw?.data || raw;

  const checkoutUrl =
    data?.checkout_url ||
    data?.redirect_url ||
    data?.payment_url ||
    raw?.checkout_url ||
    raw?.redirect_url ||
    raw?.payment_url ||
    null;

  if (!checkoutUrl) {
    throw new Error("Moneybag did not return a checkout URL");
  }

  return {
    checkoutUrl,
    sessionId: data?.session_id || raw?.session_id || null,
    transactionId: data?.transaction_id || raw?.transaction_id || null,
    expiresAt: data?.expires_at || raw?.expires_at || null,
    orderRef: String(orderRef),
    request: body,
    raw,
  };
}

async function verifyMoneybagTransaction(transactionId) {
  const cfg = assertConfig({ apiKey: true });
  const cleanId = String(transactionId || "").trim();
  if (!cleanId) throw new Error("Moneybag transaction ID is required");

  return moneybagRequest(
    "GET",
    `${cfg.verifyPath.replace(/\/$/, "")}/${encodeURIComponent(cleanId)}`
  );
}

function walkObjects(value, output = []) {
  if (!value || typeof value !== "object") return output;
  output.push(value);
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") walkObjects(child, output);
  }
  return output;
}

function findMoneybagField(payload, fieldNames) {
  const objects = walkObjects(payload, []);
  for (const object of objects) {
    for (const field of fieldNames) {
      const value = object?.[field];
      if (value !== undefined && value !== null && value !== "") return value;
    }
  }
  return null;
}

function getMoneybagData(payload) {
  return payload?.data && typeof payload.data === "object"
    ? payload.data
    : payload;
}

function getMoneybagTransactionId(payload) {
  return findMoneybagField(payload, [
    "transaction_id",
    "transactionId",
    "trx_id",
    "trxId",
    "transaction",
    "txn_id",
    "txnId",
    "payment_reference_id",
  ]);
}

function getMoneybagOrderRef(payload) {
  return findMoneybagField(payload, [
    "order_id",
    "orderId",
    "merchant_order_id",
    "merchantOrderId",
    "order_ref",
    "orderRef",
    "mybdphone_order_ref",
  ]);
}

function getMoneybagAmount(payload) {
  return findMoneybagField(payload, [
    "amount",
    "order_amount",
    "orderAmount",
    "paid_amount",
    "total_amount",
  ]);
}

function getMoneybagCurrency(payload) {
  return findMoneybagField(payload, [
    "currency",
    "currency_code",
    "currencyCode",
  ]);
}

function normalizeMoneybagStatus(payload) {
  const data = getMoneybagData(payload) || {};
  if (data.verified === true || data.verified === 1 || data.verified === "1")
    return "approved";

  const value = String(
    findMoneybagField(payload, [
      "status",
      "payment_status",
      "paymentStatus",
      "transaction_status",
      "transactionStatus",
      "state",
    ]) || ""
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
      "verified",
      "succeeded",
    ].includes(value)
  )
    return "approved";
  if (["failed", "failure", "rejected", "declined", "error"].includes(value))
    return "failed";
  if (["cancelled", "canceled", "expired", "void"].includes(value))
    return "cancelled";

  const message = String(
    findMoneybagField(payload, ["message", "detail", "error"]) || ""
  ).toLowerCase();
  if (message.includes("success") || message.includes("paid"))
    return "approved";
  if (message.includes("cancel")) return "cancelled";
  if (
    message.includes("fail") ||
    message.includes("reject") ||
    message.includes("declin")
  )
    return "failed";

  return "pending";
}

function isMoneybagApproved(payload) {
  return normalizeMoneybagStatus(payload) === "approved";
}

function isMoneybagFailed(payload) {
  return ["failed", "cancelled"].includes(normalizeMoneybagStatus(payload));
}

function verifyWebhookSignature(rawBody, signature, timestamp) {
  const cfg = assertConfig({ apiKey: false, webhookSecret: true });
  const raw = Buffer.isBuffer(rawBody)
    ? rawBody
    : Buffer.from(String(rawBody || ""), "utf8");
  const ts = String(timestamp || "").trim();
  const received = String(signature || "").trim();

  if (!ts || !received)
    return { valid: false, reason: "Missing webhook signature headers" };
  if (!/^\d+$/.test(ts))
    return { valid: false, reason: "Invalid webhook timestamp" };

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(ts));
  if (
    Number.isFinite(cfg.webhookToleranceSec) &&
    cfg.webhookToleranceSec > 0 &&
    age > cfg.webhookToleranceSec
  ) {
    return {
      valid: false,
      reason: "Webhook timestamp is outside the allowed tolerance window",
    };
  }

  const expected = `sha256=${crypto
    .createHmac("sha256", cfg.webhookSecret)
    .update(`${ts}.${raw.toString("utf8")}`, "utf8")
    .digest("hex")}`;

  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  return { valid, reason: valid ? null : "Invalid webhook signature" };
}

function buildResultUrl(params = {}) {
  const cfg = getConfig();
  const url = new URL(cfg.frontendResultUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

module.exports = {
  getConfig,
  assertConfig,
  createMoneybagCheckout,
  verifyMoneybagTransaction,
  normalizeMoneybagStatus,
  isMoneybagApproved,
  isMoneybagFailed,
  getMoneybagTransactionId,
  getMoneybagOrderRef,
  getMoneybagAmount,
  getMoneybagCurrency,
  verifyWebhookSignature,
  buildResultUrl,
  makeMoneybagCheckoutBody,
};
