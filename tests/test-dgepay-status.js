const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(
  path.join(__dirname, '../src/controllers/dgepayController.js'),
  'utf8'
);

// DGePay's published transaction-status model includes nested
// data.status_code=4 with the message "TnxSACTION FAILED".
assert(
  source.includes('if (statusCode === "4") return "failed";'),
  'status_code=4 must map to failed'
);
assert(
  source.includes('status: approved ? "approved" : failed ? fresh.status : "pending"'),
  'verify-result must expose data.status'
);
assert(
  source.includes("WHEN ? THEN 'failed'"),
  'failed gateway results must be stored as failed'
);
assert(
  source.includes('isGatewayCancelled(gatewayData) ? 1 : 0'),
  'cancelled gateway results must remain distinguishable'
);

console.log('DGePay status mapping contract: OK');
