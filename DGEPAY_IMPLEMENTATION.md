# CRITICAL FIX FOR REQUESTED_PARAMETERS_ARE_MISMATCHED

This project uses the official DGePay SDK-compatible request shape: the encrypted initiate request contains only the gateway payment fields used by `DGePayPaymentReqModel`; application-only `meta_data`, `product_list`, and `ipn_redirect_url` are not added. The implementation also uses `DGEPAY_CLIENT_SECRET` for AES when `DGEPAY_SECRET_KEY` is empty or a placeholder such as `YOUR_DGEPAY_SECRET_KEY`.

Before running the server, restart Node after editing `.env`.

# MyBDPhone — DGePay UAT Payment Implementation

The server supports two complete DGePay payment flows:

1. Wallet recharge: user pays through DGePay -> payment is server-verified -> wallet balance is credited.
2. Package/shop purchase: user can pay directly through DGePay, or recharge first and purchase using wallet balance.

## Important UAT configuration

Keep your existing `.env` private. Do not commit it.

Set these values:

```env
DGEPAY_BASE_URL=https://api-uat.dgepay.net/dipon/v3
DGEPAY_CLIENT_ID=YOUR_CLIENT_ID
DGEPAY_CLIENT_SECRET=YOUR_CLIENT_SECRET
DGEPAY_API_KEY=YOUR_API_KEY
DGEPAY_SECRET_KEY=YOUR_SECRET_KEY

DGEPAY_AUTH_PATH=/payment_gateway/authenticate
DGEPAY_INITIATE_PATH=/payment_gateway/initiate_payment
DGEPAY_VERIFY_PATH=/payment_gateway/check_transaction_status

# DGePay redirects the browser to this BACKEND callback.
DGEPAY_REDIRECT_URL=http://localhost:5000/api/dgepay/callback
DGEPAY_CALLBACK_URL=http://localhost:5000/api/dgepay/callback
DGEPAY_IPN_REDIRECT_URL=http://localhost:5000/api/dgepay/callback

# Backend callback verifies the payment, then redirects here.
DGEPAY_FRONTEND_RESULT_URL=http://localhost:5173/payment/dgepay/result
```

If DGePay has issued a separate `secretKey`, use it in `DGEPAY_SECRET_KEY`. If their UAT credentials intentionally use the client secret as the AES secret, the service also supports that configuration.

For production, `DGEPAY_REDIRECT_URL` must be a public HTTPS backend URL, for example:

```text
https://api.example.com/api/dgepay/callback
```

## Signature fix

The DGePay documentation example uses `amount: 15.0`. JavaScript normally serializes `15` as `15`, which changes the HMAC input. The implementation serializes the numeric amount in the required decimal form and uses the same sorted request JSON for both HMAC and AES.

The initiate body is intentionally restricted to the documented PaymentReqModel fields: `customer_token`, `note`, `amount`, `payment_method`, `unique_txn_id`, `payee_information`, and `redirect_url`. The previous implementation added `ipn_redirect_url` and `product_list`, which can trigger `REQUESTED_PARAMETERS_ARE_MISMATCHED`.

The included tests reproduce the DGePay documentation signature sample and verify the production initiate payload shape without calling the gateway, printing:

```text
Signature match: true
DGePay payload shape: OK
AES round-trip: true
```

Run:

```bash
npm run test:dgepay
```

## Authentication

The authentication request sends both:

- Basic Authorization: `base64(client_id:client_secret)`
- JSON body: `client_id`, `client_secret`

The returned access token is cached until shortly before expiry.

## Wallet recharge API

```http
POST /api/recharge/process
Authorization: Bearer USER_JWT
Content-Type: application/json
```

Example:

```json
{
  "amount": 500,
  "sender_phone": "017XXXXXXXX"
}
```

Response contains:

```json
{
  "success": true,
  "data": {
    "recharge_id": 12,
    "payment_id": 25,
    "transaction_id": "RCH-...",
    "unique_txn_id": "...",
    "payment_url": "...",
    "status": "pending"
  }
}
```

Redirect the browser to `payment_url`.

After DGePay returns to the backend callback, the server checks the transaction with DGePay. Only a verified successful transaction credits `users.balance` and marks the recharge as `completed`.

## Package purchase API

Wallet purchase:

```http
POST /api/orders/checkout
Authorization: Bearer USER_JWT
Content-Type: application/json
```

```json
{
  "item_type": "package",
  "item_id": 2,
  "payment_method": "wallet_balance"
}
```

Direct DGePay package purchase:

```json
{
  "item_type": "package",
  "item_id": 2,
  "payment_method": "dgepay"
}
```

Optional DGePay channel code:

```json
{
  "item_type": "package",
  "item_id": 2,
  "payment_method": "dgepay",
  "gateway_payment_method": "2002"
}
```

If `gateway_payment_method` is omitted/null, DGePay can present the available payment methods on its payment page.

## DGePay channel codes

```text
bKash          2002
Nagad          2013
Upay           2005
Pubali Bank    0175
DBBL Nexus     6002
DBBL Master    6004
DBBL Rocket    2001
DBBL Visa      6005
UCB Card       6001
Cellfin        6006
Meghna Pay     6007
```

## Payment result page

React route:

```text
/payment/dgepay/result
```

DGePay redirects to the backend callback first. The backend verifies the transaction and then redirects the browser to the React result page with `unique_txn_id`, and `order_id` or `recharge_id` when available.

The React result page should call:

```http
GET /api/dgepay/status/transaction/:uniqueTxnId
Authorization: Bearer USER_JWT
```

Example:

```js
const response = await fetch(
  `${API_URL}/api/dgepay/status/transaction/${uniqueTxnId}`,
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  }
);

const result = await response.json();
```

For an approved payment:

```json
{
  "success": true,
  "data": {
    "status": "approved"
  }
}
```

## Security rule

Do not mark an order/recharge as paid from the React redirect parameters alone. The backend always calls DGePay transaction-status verification before crediting wallet balance or activating a package.

## Payment result/status fix

DGePay's published transaction response model contains the actual transaction result inside `data.status_code`; its public model example shows `status_code: "4"` with message `TnxSACTION FAILED`. The application now maps code 3 to `approved`, code 4 to `failed`, and code 8 to `cancelled`.

The React result page previously expected `data.status`, but `/api/dgepay/verify-result` did not return that field, so the page always rendered the `Payment Processing` state after verification. The endpoint now returns the authoritative local `status`, and the React page handles `approved`, `failed`, and `cancelled` explicitly.
