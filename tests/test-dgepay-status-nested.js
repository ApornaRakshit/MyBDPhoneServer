const assert = require('assert');

function getNestedGatewayData(data) {
  let current = data;
  const seen = new Set();
  const candidates = [];
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);
    candidates.push(current);
    if (current.data && typeof current.data === 'object') { current = current.data; continue; }
    break;
  }
  return candidates;
}
function findGatewayField(data, fieldNames) {
  for (const obj of getNestedGatewayData(data)) {
    for (const field of fieldNames) {
      if (obj?.[field] !== undefined && obj?.[field] !== null && obj?.[field] !== '') return obj[field];
    }
  }
  return null;
}
function findGatewayStatusCode(data) {
  const candidates = getNestedGatewayData(data);
  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    for (const field of ['status_code', 'statusCode']) {
      const value = candidates[i]?.[field];
      if (value !== undefined && value !== null && value !== '') return String(value).trim();
    }
  }
  return '';
}
function normalizeGatewayStatus(data) {
  const code = findGatewayStatusCode(data);
  if (code === '3') return 'approved';
  if (code === '4') return 'failed';
  if (code === '8') return 'cancelled';
  return 'pending';
}

const successResponse = {
  status_code: 200,
  data: {
    status_code: '3',
    message: 'TRANSACTION SUCCESS',
    amount: 100,
    unique_txn_id: 'abc123'
  }
};
const failedResponse = { status_code: 200, data: { status_code: '4', message: 'TRANSACTION FAILED' } };
const cancelledResponse = { status_code: 200, data: { status_code: '8', message: 'TRANSACTION CANCELLED' } };
const pendingWrapper = { status_code: 200, data: { status_code: '2', message: 'PENDING' } };

assert.strictEqual(normalizeGatewayStatus(successResponse), 'approved');
assert.strictEqual(normalizeGatewayStatus(failedResponse), 'failed');
assert.strictEqual(normalizeGatewayStatus(cancelledResponse), 'cancelled');
assert.strictEqual(normalizeGatewayStatus(pendingWrapper), 'pending');
console.log('DGePay nested status regression: PASS');
