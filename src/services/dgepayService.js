const crypto = require("crypto");

// DGePay v3 integration for MyBDPhone.
// IMPORTANT: the gateway signs/encrypts the exact same canonical JSON string.
// The request amount is kept as a JSON number with a decimal representation
// (e.g. 15.0) because that is how the DGePay specification's reference
// signature is generated.

function env(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined && value !== "") return value;
  }
  return undefined;
}

function isPlaceholderSecret(value) {
  if (!value) return true;
  return /^(YOUR_|CHANGE_ME|REPLACE_ME|<[^>]+>)/i.test(String(value).trim());
}

function resolveEncryptionSecretKey() {
  // Official DGePay SDK configuration has clientID, clientSecretKey and
  // clientAPIKey only. The AES helper receives that clientSecretKey.
  // A separate DGEPAY_SECRET_KEY is accepted only when it is a real value.
  const explicit = env("DGEPAY_SECRET_KEY");
  if (!isPlaceholderSecret(explicit)) return explicit;
  const clientSecret = env("DGEPAY_CLIENT_SECRET");
  if (!isPlaceholderSecret(clientSecret)) return clientSecret;
  return undefined;
}

function getConfig() {
  const baseUrl = String(
    env("DGEPAY_BASE_URL") || "https://api-uat.dgepay.net/dipon/v3"
  ).replace(/\/$/, "");

  const frontendResultUrl =
    env("DGEPAY_FRONTEND_RESULT_URL") ||
    // "http://localhost:5173/payment/dgepay/result";
    "https://mybdphone.com/payment/dgepay/result"

  // DGePay v1.0.0/v1.9 uses redirect_url in the payment request as the
  // callback URL that receives the encrypted `data` result. Keep that URL on
  // the backend so we can verify the transaction before sending the browser
  // to React. Older .env files in this project used the React result page in
  // DGEPAY_REDIRECT_URL; detect that legacy value and fall back to the backend
  // callback automatically.
  const configuredRedirectUrl = env("DGEPAY_REDIRECT_URL");
  const backendCallbackUrl =
    env("DGEPAY_CALLBACK_URL") ||
    env("DGEPAY_IPN_REDIRECT_URL", "DGEPAY_CALLBACK_URL") ||
    // "http://localhost:5000/api/dgepay/callback";
    "https://api.mybdphone.com/api/dgepay/callback"

  const redirectUrl =
    configuredRedirectUrl &&
    !/\/payment\/dgepay\/result(?:[/?#]|$)/i.test(configuredRedirectUrl)
      ? configuredRedirectUrl
      : backendCallbackUrl;

  return {
    baseUrl,
    authPath:
      env("DGEPAY_AUTH_PATH", "DGEPAY_TOKEN_PATH") ||
      "/payment_gateway/authenticate",
    initiatePath:
      env("DGEPAY_INITIATE_PATH", "DGEPAY_INITIALIZE_PATH") ||
      "/payment_gateway/initiate_payment",
    verifyPath:
      env("DGEPAY_VERIFY_PATH") ||
      "/payment_gateway/check_transaction_status",
    clientId: env("DGEPAY_CLIENT_ID"),
    clientSecret: env("DGEPAY_CLIENT_SECRET"),
    secretKey: resolveEncryptionSecretKey(),
    apiKey: env("DGEPAY_API_KEY"),
    frontendResultUrl,
    redirectUrl,
    // Kept for backward compatibility/config visibility. DGePay v3 initiate
    // requests sent by this integration intentionally do NOT add a separate
    // ipn_redirect_url field because that field is not part of the documented
    // PaymentReqModel and can cause REQUESTED_PARAMETERS_ARE_MISMATCHED.
    ipnRedirectUrl: backendCallbackUrl,
    centerEmail: env("DGEPAY_CENTER_EMAIL") || "",
    centerPhone: env("DGEPAY_CENTER_PHONE") || "",
    timeoutMs: Number(env("DGEPAY_TIMEOUT_MS") || 30000),
    debug: String(env("DGEPAY_DEBUG") || "false").toLowerCase() === "true",
  };
}

function validateConfig({ requireApiKey = true, requireSecretKey = false } = {}) {
  const cfg = getConfig();
  const missing = [];

  if (!cfg.clientId) missing.push("DGEPAY_CLIENT_ID");
  if (!cfg.clientSecret) missing.push("DGEPAY_CLIENT_SECRET");
  if (requireApiKey && !cfg.apiKey) missing.push("DGEPAY_API_KEY");
  if (requireSecretKey && !cfg.secretKey) missing.push("DGEPAY_SECRET_KEY");

  if (missing.length) {
    throw new Error(`Missing DGePay configuration: ${missing.join(", ")}`);
  }

  return cfg;
}

function getBasicAuth() {
  const cfg = validateConfig({ requireApiKey: false });
  return Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`, "utf8").toString("base64");
}

async function requestWithTimeout(url, options = {}) {
  const { timeoutMs } = getConfig();
  const controller = new AbortController();
  const timeout = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 30000;
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`DGePay request timed out after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function readResponse(response) {
  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`DGePay returned invalid JSON (HTTP ${response.status})`);
    }
  }

  return { text, data };
}

function isSuccessfulGatewayResponse(data) {
  return (
    data?.success === true ||
    data?.success === 1 ||
    data?.success === "1" ||
    String(data?.status_code || "") === "200"
  );
}

// =====================================================
// AUTHENTICATION
// =====================================================

let tokenCache = null;

function parseExpiryToMs(expiryTime) {
  if (!expiryTime) return 0;
  const parsed = Date.parse(String(expiryTime).replace(" ", "T"));
  return Number.isFinite(parsed) ? parsed : 0;
}

async function authenticateDgePay() {
  const cfg = validateConfig({ requireApiKey: false });
  const now = Date.now();

  if (tokenCache && tokenCache.token && tokenCache.expiresAt > now + 30000) {
    return {
      accessToken: tokenCache.token,
      expiryTime: tokenCache.expiryTime,
      cached: true,
    };
  }

  const response = await requestWithTimeout(`${cfg.baseUrl}${cfg.authPath}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getBasicAuth()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    // DGePay's authentication documentation shows these mandatory body fields.
    body: JSON.stringify({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
    }),
  });

  const { data } = await readResponse(response);
  const accessToken = data?.data?.access_token || data?.access_token;

  if (!response.ok || !accessToken) {
    const message =
      (Array.isArray(data?.error) ? data.error[0] : data?.error) ||
      data?.error_msg ||
      data?.message ||
      `Authentication failed with HTTP ${response.status}`;
    throw new Error(`DGePay Authentication Error: ${message}`);
  }

  const expiryTime = data?.data?.expiry_time || data?.expiry_time || null;
  const parsedExpiry = parseExpiryToMs(expiryTime);

  tokenCache = {
    token: accessToken,
    expiryTime,
    expiresAt: parsedExpiry || now + 10 * 60 * 1000,
  };

  return { accessToken, expiryTime, cached: false };
}

function clearTokenCache() {
  tokenCache = null;
}

// =====================================================
// DGePay SIGNATURE / CANONICAL JSON
// =====================================================

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((out, key) => {
        out[key] = sortValue(value[key]);
        return out;
      }, {});
  }

  return value;
}

// DGePay's reference examples serialize amount 15 as JSON number 15.0.
// JavaScript's JSON.stringify(15) produces "15", so a small deterministic
// serializer is used to preserve the gateway-required decimal representation.
function stringifyDgePayValue(value, keyName = "") {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";

  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("DGePay payload contains a non-finite number");
    if (keyName === "amount") return Number(value).toFixed(1);
    return String(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stringifyDgePayValue(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stringifyDgePayValue(value[key], key)}`)
      .join(",")}}`;
  }

  return "null";
}

function sortJsonRecursively(payload) {
  // Backward-compatible helper. DGePay's official SDK sorts ONLY the
  // top-level JSON keys before signing/encrypting; it does not recursively
  // sort nested objects.
  return sortJsonTopLevel(payload);
}

function sortJsonTopLevel(payload) {
  const source = { ...payload };
  const keys = Object.keys(source).sort();
  const ordered = {};
  for (const key of keys) ordered[key] = source[key];

  // Preserve the gateway's documented 15.0-style numeric representation.
  // For nested values, normal JSON.stringify ordering is preserved.
  return JSON.stringify(ordered, (key, value) => {
    if (typeof value === "number" && Number.isFinite(value) && key === "amount") {
      // JSON.stringify cannot emit a trailing .0 for a Number. Replace the
      // top-level amount token after serialization below.
      return value;
    }
    return value;
  }).replace(/("amount":)(-?\d+)([,}])/g, "$1$2.0$3");
}

function removeSignatureCharacters(jsonString) {
  // Per DGePay documentation: remove braces, quotes, colon, comma and spaces.
  return String(jsonString).replace(/[{}": ,]/g, "");
}

function canonicalStringForSignature(payload) {
  return removeSignatureCharacters(sortJsonRecursively(payload));
}

function createDgePaySignature(payload) {
  const cfg = validateConfig({ requireApiKey: true });
  const canonical = canonicalStringForSignature(payload);

  return crypto
    .createHmac("sha256", Buffer.from(cfg.apiKey, "utf8"))
    .update(canonical, "utf8")
    .digest("base64");
}

// =====================================================
// AES-128-ECB PAYLOAD ENCRYPTION
// DGePay reference: secretKey UTF-8 bytes, copy first 16 bytes.
// =====================================================

function getAesKey() {
  const cfg = validateConfig({ requireApiKey: false, requireSecretKey: true });
  // Match the official DGePay Flutter SDK exactly:
  // secretKey.padRight(16, '0').substring(0, 16)
  // i.e. UTF-8 key text, ASCII '0' padding, then truncate to 16 bytes.
  // This is important: zero-byte padding is NOT the same key.
  return Buffer.from(String(cfg.secretKey).padEnd(16, "0").slice(0, 16), "utf8");
}

function encryptDgePayPayload(payload, { preSortedJson = null } = {}) {
  const jsonString = preSortedJson || sortJsonTopLevel(payload);
  const cipher = crypto.createCipheriv("aes-128-ecb", getAesKey(), null);
  cipher.setAutoPadding(true);

  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(jsonString, "utf8")),
    cipher.final(),
  ]);

  return encrypted.toString("base64");
}

function decryptDgePayPayload(encryptedBase64) {
  if (!encryptedBase64) return null;

  try {
    const clean = String(encryptedBase64).replace(/ /g, "+");
    const decipher = crypto.createDecipheriv("aes-128-ecb", getAesKey(), null);
    decipher.setAutoPadding(true);

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(clean, "base64")),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString("utf8"));
  } catch (error) {
    if (getConfig().debug) console.error("[DGePay] decrypt failed:", error.message);
    return null;
  }
}

function generateUniqueTxnId() {
  return crypto.randomBytes(16).toString("hex");
}

function normalizePhone(phone) {
  const value = String(phone || "").replace(/\s+/g, "");
  if (!value) return null;
  if (value.startsWith("+880")) return value.slice(4);
  if (value.startsWith("880")) return value.slice(3);
  if (value.startsWith("+88")) return value.slice(3);
  return value;
}

function normalizeAmount(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error("Invalid payment amount");
  return Number(value.toFixed(2));
}

const PAYMENT_METHODS = Object.freeze({
  bkash: "2002",
  nagad: "2013",
  upay: "2005",
  pubali_bank: "0175",
  dbbl_nexus: "6002",
  dbbl_master_card: "6004",
  dbbl_rocket: "2001",
  dbbl_visa_card: "6005",
  ucb_card: "6001",
  cellfin: "6006",
  meghna_pay: "6007",
});

function normalizePaymentMethod(value) {
  if (value === null || value === undefined || value === "") return "";
  const raw = String(value).trim().toLowerCase();
  if (PAYMENT_METHODS[raw]) return PAYMENT_METHODS[raw];
  if (/^\d{4}$/.test(raw)) return raw;
  throw new Error(`Unsupported DGePay payment method: ${value}`);
}

function buildDgePayInitiatePayload({
  amount,
  uniqueTxnId,
  phone,
  note,
  paymentMethod = null,
  redirectUrl,
}) {
  // This is intentionally the same seven-field shape as DGePay's documented
  // PaymentReqModel. Do not add application-only metadata here.
  return {
    customer_token: null,
    note: String(note || `MyBDPhone - ${uniqueTxnId}`),
    amount: normalizeAmount(amount),
    payment_method: normalizePaymentMethod(paymentMethod),
    unique_txn_id: String(uniqueTxnId),
    payee_information: {
      dial_code: "+88",
      phone_number: String(phone),
    },
    redirect_url: String(redirectUrl),
  };
}

// =====================================================
// INITIATE PAYMENT
// =====================================================

async function initiateDgePayPayment({
  amount,
  orderId,
  orderNumber,
  customer,
  note,
  redirectUrl,
  paymentMethod = null,
}) {
  const cfg = validateConfig({ requireApiKey: true, requireSecretKey: true });
  if (!customer) throw new Error("Customer information is required");

  const phone = normalizePhone(customer.phone);
  if (!phone) throw new Error("Customer phone is required");

  const numericAmount = normalizeAmount(amount);
  const uniqueTxnId = generateUniqueTxnId();
  const selectedPaymentMethod = normalizePaymentMethod(paymentMethod);

  const itemReference = String(orderNumber || orderId || uniqueTxnId);

  // IMPORTANT: Keep the encrypted initiate request exactly aligned with the
  // DGePay PaymentReqModel. Extra fields such as ipn_redirect_url and
  // product_list are NOT sent here because DGePay can reject them with
  // REQUESTED_PARAMETERS_ARE_MISMATCHED.
  //
  // The application still tracks recharge/order identity in our own DB using
  // unique_txn_id and note, so no gateway metadata is required for fulfillment.
  const payload = buildDgePayInitiatePayload({
    amount: numericAmount,
    uniqueTxnId,
    phone,
    note: note || `MyBDPhone - ${itemReference}`,
    paymentMethod: selectedPaymentMethod,
    redirectUrl: redirectUrl || cfg.redirectUrl,
  });

  // DGePay's official sample signature is generated from the exact same
  // request object. The helper sorts the top-level keys deterministically and
  // preserves the required `amount: 15.0` representation.
  const sortedJson = sortJsonTopLevel(payload);
  const signature = createDgePaySignature(payload);
  const encryptedBody = encryptDgePayPayload(payload, {
    preSortedJson: sortedJson,
  });
  const auth = await authenticateDgePay();

  const makeRequest = (accessToken) =>
    requestWithTimeout(`${cfg.baseUrl}${cfg.initiatePath}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        Signature: signature,
      },
      body: encryptedBody,
    });

  let response = await makeRequest(auth.accessToken);
  let { data } = await readResponse(response);

  if ((response.status === 401 || response.status === 403) && auth.cached) {
    clearTokenCache();
    const freshAuth = await authenticateDgePay();
    response = await makeRequest(freshAuth.accessToken);
    ({ data } = await readResponse(response));
  }

  if (!isSuccessfulGatewayResponse(data)) {
    const message =
      (Array.isArray(data?.error) ? data.error[0] : data?.error) ||
      data?.error_msg ||
      data?.message ||
      `Payment initiation failed with HTTP ${response.status}`;

    if (cfg.debug) {
      console.error("[DGePay] initiate failed:", message);
      console.error("[DGePay] sorted JSON:", sortedJson);
      console.error("[DGePay] canonical:", removeSignatureCharacters(sortedJson));
      console.error("[DGePay] signature:", signature);
      console.error("[DGePay] response:", JSON.stringify(data));
    }

    throw new Error(`DGePay payment initiation failed: ${message}`);
  }

  const paymentUrl =
    data?.data?.webview_url ||
    data?.data?.payment_url ||
    data?.webview_url ||
    data?.payment_url ||
    null;

  return {
    uniqueTxnId,
    paymentUrl,
    gatewayOrderId:
      data?.data?.unique_txn_id || data?.data?.order_id || uniqueTxnId,
    paymentMethod: selectedPaymentMethod,
    raw: data,
  };
}

// =====================================================
// CHECK TRANSACTION STATUS
// =====================================================

async function checkDgePayTransaction(uniqueTxnId) {
  if (!uniqueTxnId) throw new Error("unique_txn_id is required");

  const cfg = validateConfig({ requireApiKey: true, requireSecretKey: true });
  const payload = { unique_txn_id: String(uniqueTxnId) };
  const bodyJson = sortJsonTopLevel(payload);
  const signature = createDgePaySignature(payload);
  const encryptedBody = encryptDgePayPayload(payload, { preSortedJson: bodyJson });

  const auth = await authenticateDgePay();
  const response = await requestWithTimeout(`${cfg.baseUrl}${cfg.verifyPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      Signature: signature,
    },
    body: encryptedBody,
  });

  const { data } = await readResponse(response);
  if (!response.ok) {
    const message =
      (Array.isArray(data?.error) ? data.error[0] : data?.error) ||
      data?.message ||
      `Transaction status request failed with HTTP ${response.status}`;
    throw new Error(`DGePay transaction status error: ${message}`);
  }

  return data;
}

module.exports = {
  getConfig,
  authenticateDgePay,
  clearTokenCache,
  sortJsonTopLevel,
  sortJsonRecursively,
  canonicalStringForSignature,
  createDgePaySignature,
  buildDgePayInitiatePayload,
  encryptDgePayPayload,
  decryptDgePayPayload,
  generateUniqueTxnId,
  normalizePaymentMethod,
  PAYMENT_METHODS,
  initiateDgePayPayment,
  checkDgePayTransaction,
};
