# Moneybag / MyBDPhone approval flow

1. User creates a recharge; local `recharges` and `payments` rows are pending.
2. Moneybag returns through `/api/moneybag/callback`. The local record is resolved using the MyBDPhone `order_ref` first; Moneybag `transaction_id` is only the provider transaction id.
3. `/api/moneybag/verify-result` is public because the hosted-checkout browser return cannot be assumed to have a JWT. It still requires both references and performs server-side Moneybag verification.
4. Successful gateway verification sets `gateway_status='approved'` but DOES NOT credit the wallet and DOES NOT change `payments.status` from pending.
5. Admin approves with `PUT /api/admin/payments/:id/verify` and status `approved`. The server re-verifies Moneybag immediately, checks transaction/order reference, amount and currency, then marks payment approved and credits the wallet exactly once.
6. `/api/orders/my` combines package/shop orders with wallet recharge receipts so recharge history appears in Order History.

The fixed output zips intentionally exclude `.env` and `node_modules`. Keep your existing production credentials locally.
