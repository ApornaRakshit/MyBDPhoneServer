// No-network DGePay request-shape regression test.
process.env.DGEPAY_CLIENT_SECRET = "96f1f52c12c7tce4";
process.env.DGEPAY_SECRET_KEY = "96f1f52c12c7tce4";
process.env.DGEPAY_API_KEY = "dce9ac492a3f480bbc525522ba72d422";
process.env.DGEPAY_CLIENT_ID = "sample-client";

const {
  buildDgePayInitiatePayload,
  sortJsonTopLevel,
  canonicalStringForSignature,
  createDgePaySignature,
  encryptDgePayPayload,
  decryptDgePayPayload,
} = require("../src/services/dgepayService");

const payload = buildDgePayInitiatePayload({
  amount: 100,
  uniqueTxnId: "RCH-TEST-100",
  phone: "01711000001",
  note: "MyBDPhone Wallet Recharge - RCH-TEST-100",
  paymentMethod: null,
  // redirectUrl: "http://localhost:5000/api/dgepay/callback",
  redirectUrl: "https://api.mybdphone.com/api/dgepay/callback",
});

const expectedKeys = [
  "amount",
  "customer_token",
  "note",
  "payee_information",
  "payment_method",
  "redirect_url",
  "unique_txn_id",
];
const actualKeys = Object.keys(payload).sort();

if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
  throw new Error(`Unexpected DGePay payload keys: ${actualKeys.join(",")}`);
}

if ("ipn_redirect_url" in payload || "product_list" in payload || "meta_data" in payload) {
  throw new Error("Unsupported extra fields found in DGePay initiate payload");
}

const sorted = sortJsonTopLevel(payload);
const signature = createDgePaySignature(payload);
const decrypted = decryptDgePayPayload(encryptDgePayPayload(payload, { preSortedJson: sorted }));

if (!signature) throw new Error("Signature was not generated");
if (JSON.stringify(decrypted) !== JSON.stringify(JSON.parse(sorted))) {
  throw new Error("DGePay AES round-trip failed");
}

console.log("DGePay payload shape: OK");
console.log("Amount serialization:", /"amount":100\.0/.test(sorted) ? "OK" : "FAILED");
console.log("Unsupported fields: none");
console.log("AES round-trip: OK");
