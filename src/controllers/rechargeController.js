const crypto = require('crypto');
const pool = require('../config/db');
const { initiateDgePayPayment } = require('../services/dgepayService');
const { createMoneybagCheckout } = require('../services/moneybagService');
const { notifyAdmins } = require('../services/adminNotificationService');

function makeRechargeTxnId() {
  return `RCH-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

const processRecharge = async (req, res) => {
  let rechargeId = null;

  const connection =
    await pool.getConnection();

  try {
    // ==========================================================
    // GET DYNAMIC RECHARGE LIMITS FROM DATABASE
    // ==========================================================
    const [settingRows] =
      await connection.query(
        `
          SELECT setting_key, setting_value
          FROM site_settings
          WHERE setting_key IN (
            'min_recharge',
            'max_recharge'
          )
        `
      );

    const settings = {};

    settingRows.forEach((row) => {
      settings[row.setting_key] =
        row.setting_value;
    });

    const minRecharge = Number(
      settings.min_recharge
    );

    const maxRecharge = Number(
      settings.max_recharge
    );

    /*
     * Safe defaults.
     *
     * Admin can change these from:
     * Admin Panel → Payment Settings
     */
    const minimumAmount =
      Number.isFinite(minRecharge) &&
      minRecharge >= 1
        ? minRecharge
        : 1;

    const maximumAmount =
      Number.isFinite(maxRecharge) &&
      maxRecharge >= minimumAmount
        ? maxRecharge
        : 10000;

    // ==========================================================
    // REQUEST DATA
    // ==========================================================
    const amount = Number(
      req.body?.amount
    );

    const senderPhone = String(
      req.body?.sender_phone ||
        req.user?.phone ||
        ''
    ).trim();

    // ==========================================================
    // SERVER-SIDE AMOUNT VALIDATION
    // ==========================================================
    if (!Number.isFinite(amount)) {
      return res.status(400).json({
        success: false,
        message:
          'Please enter a valid recharge amount.',
      });
    }


    if (!senderPhone) {
      return res.status(400).json({
        success: false,
        message:
          'Account phone number is required for payment.',
      });
    }

    // ==========================================================
    // PAYMENT METHOD
    // ==========================================================
    const paymentMethod = String(
      req.body?.payment_method ||
        'dgepay'
    )
      .trim()
      .toLowerCase();

    const gatewayPaymentMethod =
      req.body?.gateway_payment_method ||
      req.body?.payment_method_code ||
      null;

    // Moneybag has a gateway-level limit independent of the
    // admin-configured global recharge minimum/maximum.
    // Moneybag accepts BDT 10.00 - 1,000,000.00 only.
    const gatewayMinimumAmount =
      paymentMethod === 'moneybag' ? 10 : minimumAmount;

    const gatewayMaximumAmount =
      paymentMethod === 'moneybag'
        ? Math.min(maximumAmount, 1000000)
        : maximumAmount;

    if (amount < gatewayMinimumAmount) {
      return res.status(400).json({
        success: false,
        message:
          `Minimum ${paymentMethod === 'moneybag' ? 'Moneybag ' : ''}recharge amount is ৳${gatewayMinimumAmount.toLocaleString()}.`,
      });
    }

    if (amount > gatewayMaximumAmount) {
      return res.status(400).json({
        success: false,
        message:
          `Maximum ${paymentMethod === 'moneybag' ? 'Moneybag ' : ''}recharge amount is ৳${gatewayMaximumAmount.toLocaleString()}.`,
      });
    }

    if (
      ![
        'dgepay',
        'moneybag',
      ].includes(paymentMethod)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Selected recharge gateway is not supported.',
      });
    }

    const providerName =
      paymentMethod === 'moneybag'
        ? 'Moneybag'
        : 'DGePay';

    const transactionId =
      makeRechargeTxnId();

    // ==========================================================
    // START TRANSACTION
    // ==========================================================
    await connection.beginTransaction();

    // ==========================================================
    // CHECK GATEWAY ACTIVE STATUS
    // ==========================================================
    const [activeMethods] =
      await connection.query(
        `
          SELECT id
          FROM payment_methods
          WHERE code = ?
            AND method_type = 'gateway'
            AND is_active = 1
          LIMIT 1
        `,
        [paymentMethod]
      );

    if (!activeMethods.length) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          `${providerName} payment gateway is currently unavailable.`,
      });
    }

    // ==========================================================
    // CREATE PENDING RECHARGE
    // ==========================================================
    const [result] =
      await connection.query(
        `
          INSERT INTO recharges
          (
            user_id,
            amount,
            payment_method,
            transaction_id,
            sender_phone,
            status,
            notes
          )
          VALUES
          (
            ?,
            ?,
            ?,
            ?,
            ?,
            'pending',
            ?
          )
        `,
        [
          req.user.id,
          amount,
          paymentMethod,
          transactionId,
          senderPhone,
          `${providerName} payment pending verification`,
        ]
      );

    rechargeId =
      result.insertId;

    await connection.commit();

    // ==========================================================
    // INITIALIZE PAYMENT GATEWAY
    // ==========================================================
    let gateway;

    // ----------------------------------------------------------
    // DGePay
    // ----------------------------------------------------------
    if (
      paymentMethod === 'dgepay'
    ) {
      gateway =
        await initiateDgePayPayment({
          amount,

          note:
            `MyBDPhone Wallet Recharge - ${transactionId}`,

          orderId: null,

          orderNumber:
            transactionId,

          customer: {
            userId:
              req.user.id,

            name:
              req.user.name,

            email:
              req.user.email,

            phone:
              senderPhone,
          },

          paymentMethod:
            gatewayPaymentMethod,
        });
    }

    // ----------------------------------------------------------
    // Moneybag
    // ----------------------------------------------------------
    if (
      paymentMethod === 'moneybag'
    ) {
      const mb =
        await createMoneybagCheckout({
          orderRef:
            transactionId,

          amount,

          description:
            'MyBDPhone Wallet Recharge',

          customer: {
            name:
              req.user.name,

            email:
              req.user.email,

            phone:
              senderPhone,
          },

          item: {
            name:
              'Wallet Recharge',

            category:
              'Wallet Top-up',

            sku:
              'MYBD-RECHARGE',
          },
        });

      gateway = {
        paymentUrl:
          mb.checkoutUrl,

        uniqueTxnId:
          mb.transactionId ||
          `MB-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}`,

        gatewayOrderId:
          mb.sessionId ||
          transactionId,

        gatewayTransactionId:
          mb.transactionId ||
          null,

        gatewayStatus:
          mb.transactionId
            ? 'pending'
            : 'initiated',

        raw:
          mb.raw || {},
      };
    }

    // ==========================================================
    // CHECK PAYMENT URL
    // ==========================================================
    if (!gateway?.paymentUrl) {
      throw new Error(
        `${providerName} did not return a payment URL`
      );
    }

    // ==========================================================
    // CREATE PAYMENT RECORD
    // ==========================================================
    const [
      paymentResult,
    ] = await pool.query(
      `
        INSERT INTO payments
        (
          order_id,
          recharge_id,
          user_id,
          gateway,
          payment_method,
          provider_name,
          payer_phone,
          amount,
          currency,
          gateway_unique_txn_id,
          gateway_order_id,
          gateway_transaction_id,
          gateway_status,
          gateway_response,
          status,
          notes
        )
        VALUES
        (
          NULL,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          'BDT',
          ?,
          ?,
          ?,
          ?,
          ?,
          'pending',
          ?
        )
      `,
      [
        rechargeId,

        req.user.id,

        // gateway
        paymentMethod,

        // payment_method
        paymentMethod,

        // provider_name
        providerName,

        // payer_phone
        senderPhone,

        // amount
        amount,

        // unique transaction
        gateway.uniqueTxnId,

        // gateway order
        gateway.gatewayOrderId ||
          transactionId,

        // gateway transaction
        gateway.gatewayTransactionId ||
          null,

        // gateway status
        gateway.gatewayStatus ||
          'initiated',

        // gateway response
        JSON.stringify(
          gateway.raw || {}
        ),

        // notes
        `${providerName} hosted checkout initialized`,
      ]
    );

    // ==========================================================
    // ADMIN NOTIFICATION
    // ==========================================================
    await notifyAdmins(null, {
      title:
        'Wallet Recharge Started',

      message:
        `${req.user.name} initiated a ৳${amount.toFixed(
          2
        )} ${providerName} wallet recharge. Payment is awaiting verification.`,

      type:
        'recharge',

      link:
        '/admin/payments',

      entityType:
        'payment',

      entityId:
        paymentResult.insertId,

      dedupeKey:
        `payment:${paymentResult.insertId}:recharge-created`,
    });

    // ==========================================================
    // RESPONSE
    // ==========================================================
    return res.status(201).json({
      success: true,

      message:
        `${providerName} recharge payment initialized`,

      data: {
        recharge_id:
          rechargeId,

        payment_id:
          paymentResult.insertId,

        transaction_id:
          transactionId,

        unique_txn_id:
          gateway.uniqueTxnId,

        payment_url:
          gateway.paymentUrl,

        status:
          'pending',

        min_recharge:
          minimumAmount,

        max_recharge:
          maximumAmount,
      },
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}

    console.error(
      'RECHARGE ERROR:',
      error
    );

    if (rechargeId) {
      await pool
        .query(
          `
            UPDATE recharges
            SET
              status = 'failed',
              notes = CONCAT(
                COALESCE(notes, ''),
                ' | Gateway initialization failed'
              )
            WHERE id = ?
              AND status = 'pending'
          `,
          [rechargeId]
        )
        .catch(() => {});
    }

    return res.status(502).json({
      success: false,
      message:
        error.message ||
        'Recharge gateway initialization failed',
    });
  } finally {
    connection.release();
  }
};

const getMyRecharges = async (req, res) => {
  try {
    const [recharges] = await pool.query(
      `
        SELECT *
        FROM recharges
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `,
      [req.user.id]
    );

    return res.json({
      success: true,
      count: recharges.length,
      recharges,
    });
  } catch (error) {
    console.error('GET RECHARGES ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const getAllRecharges = async (req, res) => {
  try {
    const {
      status,
      payment_method,
      search,
    } = req.query;

    let query = `
      SELECT
        r.*,
        u.name AS user_name,
        u.email AS user_email,
        u.phone AS user_phone
      FROM recharges r
      JOIN users u
        ON r.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    if (payment_method) {
      query += ' AND r.payment_method = ?';
      params.push(payment_method);
    }

    if (search) {
      query += `
        AND (
          r.transaction_id LIKE ?
          OR u.name LIKE ?
          OR u.email LIKE ?
        )
      `;

      const q = `%${search}%`;

      params.push(q, q, q);
    }

    query += `
      ORDER BY r.created_at DESC
    `;

    const [recharges] = await pool.query(
      query,
      params
    );

    return res.json({
      success: true,
      count: recharges.length,
      recharges,
    });
  } catch (error) {
    console.error(
      'ADMIN RECHARGES ERROR:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const manualBalanceAdjustment = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const userId = Number(req.body?.user_id);

    const amount = Math.abs(
      Number(req.body?.amount)
    );

    const direction = String(
      req.body?.direction || ''
    ).toLowerCase();

    const reason = String(
      req.body?.reason ||
        'Admin balance adjustment'
    );

    if (
      !userId ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !['credit', 'debit'].includes(direction)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'User ID, valid amount, and direction are required',
      });
    }

    await connection.beginTransaction();

    const [users] = await connection.query(
      `
        SELECT
          id,
          role,
          balance
        FROM users
        WHERE id = ?
        FOR UPDATE
      `,
      [userId]
    );

    if (!users.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (users[0].role === 'admin') {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          'Admin accounts cannot receive subscriber wallet adjustments',
      });
    }

    const current = Number(
      users[0].balance || 0
    );

    const next =
      direction === 'credit'
        ? current + amount
        : current - amount;

    if (next < 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          'Adjustment would create a negative balance',
      });
    }

    await connection.query(
      `
        UPDATE users
        SET balance = ?
        WHERE id = ?
      `,
      [next, userId]
    );

    const transactionCode =
      `ADJ-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    await connection.query(
      `
        INSERT INTO transactions
        (
          transaction_code,
          user_id,
          type,
          direction,
          amount,
          balance_after,
          reference_id,
          description,
          status
        )
        VALUES
        (
          ?,
          ?,
          'adjustment',
          ?,
          ?,
          ?,
          'ADMIN-MANUAL',
          ?,
          'completed'
        )
      `,
      [
        transactionCode,
        userId,
        direction,
        amount,
        next,
        reason,
      ]
    );

    await connection.query(
      `
        INSERT INTO user_admin_activity
        (
          admin_id,
          user_id,
          action,
          description,
          metadata
        )
        VALUES (?, ?, 'wallet_adjusted', ?, ?)
      `,
      [
        req.user.id,
        userId,
        `Admin ${direction}ed wallet by ৳${amount.toFixed(2)}`,
        JSON.stringify({
          direction,
          amount,
          previous_balance: current,
          new_balance: next,
          reason,
          transaction_code: transactionCode,
        }),
      ]
    );

    await connection.query(
      `
        INSERT INTO notifications
        (
          user_id,
          title,
          message,
          type,
          link
        )
        VALUES
        (
          ?,
          'Wallet balance updated',
          ?,
          'recharge',
          '/user/transactions'
        )
      `,
      [
        userId,
        `Your wallet was ${
          direction === 'credit'
            ? 'credited'
            : 'debited'
        } by ৳${amount.toFixed(
          2
        )}. New balance: ৳${next.toFixed(2)}.`,
      ]
    );

    await connection.commit();

    return res.json({
      success: true,
      message: 'Balance adjusted successfully',
      new_balance: next,
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}

    console.error(
      'MANUAL BALANCE ADJUSTMENT ERROR:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  processRecharge,
  getMyRecharges,
  getAllRecharges,
  manualBalanceAdjustment,
};