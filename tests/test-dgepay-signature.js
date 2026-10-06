// DGePay documentation compatibility test.
// This uses ONLY the public sample values shown in the DGePay docs.
// It does not call the gateway.
process.env.DGEPAY_CLIENT_ID = "sample-client";
process.env.DGEPAY_CLIENT_SECRET = "96f1f52c12c7tce4";
process.env.DGEPAY_SECRET_KEY = "YOUR_DGEPAY_SECRET_KEY";
process.env.DGEPAY_API_KEY = "dce9ac492a3f480bbc525522ba72d422";

const {
  sortJsonRecursively,
  canonicalStringForSignature,
  createDgePaySignature,
  encryptDgePayPayload,
  decryptDgePayPayload,
} = require("../src/services/dgepayService");

const payload = {
  customer_token: null,
  note: "Testing open api",
  amount: 15,
  payment_method: null,
  unique_txn_id: "5419465db471443081017c3f07c1ddbe",
  payee_information: {
    dial_code: "+88",
    phone_number: "45124565633",
  },
  redirect_url: "https://www.facebook.com/",
};

const expectedSignature = "qDboW1qTkGBsFrNnsppLzn93Lf8Y3eAvPViWld2ITik=";
const signature = createDgePaySignature(payload);
const sortedJson = sortJsonRecursively(payload);
const encrypted = encryptDgePayPayload(payload, { preSortedJson: sortedJson });
const decrypted = decryptDgePayPayload(encrypted);

console.log("Sorted JSON:", sortedJson);
console.log("Canonical:", canonicalStringForSignature(payload));
console.log("Signature:", signature);
console.log("Expected:", expectedSignature);
console.log("Signature match:", signature === expectedSignature);
console.log("AES round-trip:", JSON.stringify(decrypted) === JSON.stringify({
  amount: 15,
  customer_token: null,
  note: "Testing open api",
  payee_information: { dial_code: "+88", phone_number: "45124565633" },
  payment_method: null,
  redirect_url: "https://www.facebook.com/",
  unique_txn_id: "5419465db471443081017c3f07c1ddbe",
}));

if (signature !== expectedSignature || !decrypted) {
  process.exit(1);
}

// Verify the real-world .env placeholder case: a placeholder DGEPAY_SECRET_KEY
// must fall back to DGEPAY_CLIENT_SECRET (the key exposed by the official SDK).
const service = require("../src/services/dgepayService");
if (service.getConfig().secretKey !== process.env.DGEPAY_CLIENT_SECRET) {
  console.error("Placeholder secret fallback: FAILED");
  process.exit(1);
}
console.log("Placeholder secret fallback: OK");
