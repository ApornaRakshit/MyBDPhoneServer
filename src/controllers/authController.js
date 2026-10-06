const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../config/db");
const {
  isConfigured: isSmtpConfigured,
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
} = require("../config/mailer");

const PASSWORD_RESET_EXPIRES_MINUTES = Number(
  process.env.PASSWORD_RESET_EXPIRES_MINUTES || 15
);
const EMAIL_VERIFY_EXPIRES_MINUTES = Number(
  process.env.EMAIL_VERIFY_EXPIRES_MINUTES || 30
);
const PASSWORD_MIN_LENGTH = 8;

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();
const normalizePhone = (phone) =>
  String(phone || "")
    .trim()
    .replace(/[\s-]/g, "");
const isValidBangladeshPhone = (phone) => /^01[3-9]\d{8}$/.test(phone);
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isPasswordValid = (password) => {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    return false;
  }
  return (
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
};

const createSecureToken = () => crypto.randomBytes(32).toString("hex");
const hashToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

const isDevMode = () => process.env.NODE_ENV !== "production";

const isDevPasswordResetMode = () =>
  isDevMode() &&
  String(process.env.PASSWORD_RESET_DEV_MODE || "false").toLowerCase() ===
    "true";

const getClientUrl = () =>
  String(process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

const generateToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      token_version: Number(user.token_version || 0),
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

const publicUserFields = (user) => {
  if (!user) return user;
  const copy = { ...user };
  delete copy.password;
  return copy;
};

/* -----------------------------------------------------
   Registration email verification
----------------------------------------------------- */
const createEmailVerification = async ({
  userId,
  email,
  purpose = "registration",
}) => {
  const rawToken = createSecureToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + EMAIL_VERIFY_EXPIRES_MINUTES * 60 * 1000
  );

  await pool.query(
    `DELETE FROM email_verification_tokens WHERE user_id = ? AND purpose = ?`,
    [userId, purpose]
  );

  await pool.query(
    `INSERT INTO email_verification_tokens
      (user_id, email, purpose, token_hash, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, email, purpose, tokenHash, expiresAt]
  );

  const verificationUrl = `${getClientUrl()}/verify-email?token=${encodeURIComponent(
    rawToken
  )}`;

  if (isSmtpConfigured) {
    await sendEmailVerificationEmail({
      to: email,
      name: "",
      verificationUrl,
      purpose,
    });
  } else if (isDevMode()) {
    // Local fallback: never return the URL to the browser.
    console.log("\n==================================================");
    console.log(`EMAIL VERIFICATION LINK [DEV ONLY]`);
    console.log(`Email: ${email}`);
    console.log(`Purpose: ${purpose}`);
    console.log(`URL: ${verificationUrl}`);
    console.log(`Expires: ${expiresAt.toISOString()}`);
    console.log("==================================================\n");
  } else {
    throw new Error("Email service is not configured");
  }

  return { verificationUrl, expiresAt };
};

/* -----------------------------------------------------
   Password reset token
----------------------------------------------------- */
const createPasswordResetToken = () => createSecureToken();
const hashResetToken = (token) => hashToken(token);

const issuePasswordReset = async (user) => {
  const rawToken = createPasswordResetToken();
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_EXPIRES_MINUTES * 60 * 1000
  );

  await pool.query(`DELETE FROM password_reset_tokens WHERE user_id = ?`, [
    user.id,
  ]);

  await pool.query(
    `INSERT INTO password_reset_tokens
      (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [user.id, tokenHash, expiresAt]
  );

  const resetUrl = `${getClientUrl()}/reset-password?token=${encodeURIComponent(
    rawToken
  )}`;

  if (isSmtpConfigured) {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });
  } else if (isDevPasswordResetMode()) {
    // Local fallback: URL is printed only to the backend terminal.
    console.log("\n==================================================");
    console.log("PASSWORD RESET LINK [DEV ONLY]");
    console.log(`Email: ${user.email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Expires: ${expiresAt.toISOString()}`);
    console.log("==================================================\n");
  } else {
    await pool.query(`DELETE FROM password_reset_tokens WHERE token_hash = ?`, [
      tokenHash,
    ]);
    throw new Error("SMTP is not configured");
  }

  return { resetUrl, expiresAt };
};

/* =====================================================
   REGISTER
===================================================== */
const register = async (req, res) => {
  try {
    const { name, email, phone, password, confirm_password, company_name } =
      req.body || {};

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, and password are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (!isValidBangladeshPhone(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 11-digit Bangladesh mobile number",
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (!isPasswordValid(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      });
    }

    const [existing] = await pool.query(
      `SELECT id, email, phone FROM users WHERE email = ? OR phone = ? LIMIT 2`,
      [normalizedEmail, normalizedPhone]
    );

    if (
      existing.some((u) => String(u.email).toLowerCase() === normalizedEmail)
    ) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    if (existing.some((u) => String(u.phone) === normalizedPhone)) {
      return res.status(409).json({
        success: false,
        message: "An account with this phone number already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Local development has no SMTP, so the account is immediately usable.
    // Production requires email verification.
    const emailVerifiedAt = isDevMode() ? new Date() : null;

    const [result] = await pool.query(
      `INSERT INTO users
        (name, email, phone, password, company_name, role, status,
         balance, ai_minutes, email_verified_at, token_version)
       VALUES (?, ?, ?, ?, ?, 'user', 'active', 0.00, 0, ?, 0)`,
      [
        String(name).trim(),
        normalizedEmail,
        normalizedPhone,
        hashedPassword,
        company_name ? String(company_name).trim() : null,
        emailVerifiedAt,
      ]
    );

    try {
      await pool.query(
        `INSERT INTO notifications
          (user_id, title, message, type, link)
         VALUES (?, 'Welcome to MyBDPhone',
                 'Your account has been created. Welcome to MyBDPhone.',
                 'system', '/user/dashboard')`,
        [result.insertId]
      );
    } catch (e) {
      console.error("WELCOME NOTIFICATION ERROR:", e.message);
    }

    if (!emailVerifiedAt) {
      try {
        await createEmailVerification({
          userId: result.insertId,
          email: normalizedEmail,
          purpose: "registration",
        });
      } catch (mailError) {
        console.error("REGISTRATION VERIFICATION EMAIL ERROR:", mailError);
        // Do not delete the account. User can request verification again later.
      }
    }

    const [users] = await pool.query(
      `SELECT id, name, email, phone, role, status, balance, ai_minutes,
              company_name, kyc_status, token_version, email_verified_at, created_at
       FROM users WHERE id = ?`,
      [result.insertId]
    );

    const user = users[0];

    return res.status(201).json({
      success: true,
      message: emailVerifiedAt
        ? "Registration successful. Your account is ready to use."
        : "Registration successful. Please verify your email before signing in.",
      token: emailVerifiedAt ? generateToken(user) : undefined,
      user: emailVerifiedAt ? publicUserFields(user) : undefined,
      email_verification_required: !emailVerifiedAt,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "An account with this email or phone number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

/* =====================================================
   LOGIN
===================================================== */
const login = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email);
    const password = req.body?.password;

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const [users] = await pool.query(
      `SELECT * FROM users WHERE email = ? LIMIT 1`,
      [normalizedEmail]
    );

    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message:
          "Your account is suspended or inactive. Please contact support.",
      });
    }

    if (!user.email_verified_at) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address before logging in.",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    try {
      await pool.query(`UPDATE users SET last_login = NOW() WHERE id = ?`, [
        user.id,
      ]);
    } catch (e) {
      console.error("LAST LOGIN UPDATE ERROR:", e.message);
    }

    const safeUser = publicUserFields(user);

    return res.json({
      success: true,
      message: "Login successful",
      token: generateToken(safeUser),
      user: safeUser,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

/* =====================================================
   VERIFY EMAIL
===================================================== */
const verifyEmail = async (req, res) => {
  const token = String(req.query?.token || "").trim();

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Verification token is required",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const tokenHash = hashToken(token);

    const [rows] = await connection.query(
      `SELECT evt.id, evt.user_id, evt.email, evt.purpose, evt.expires_at,
              evt.used_at, u.role, u.status
       FROM email_verification_tokens evt
       JOIN users u ON u.id = evt.user_id
       WHERE evt.token_hash = ?
       LIMIT 1
       FOR UPDATE`,
      [tokenHash]
    );

    if (!rows.length) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link",
      });
    }

    const item = rows[0];

    if (item.used_at) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "This verification link has already been used",
      });
    }

    if (new Date(item.expires_at).getTime() < Date.now()) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "This verification link has expired",
      });
    }

    if (item.purpose === "email_change") {
      const [duplicate] = await connection.query(
        `SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1`,
        [item.email, item.user_id]
      );

      if (duplicate.length) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: "This email address is already in use",
        });
      }

      await connection.query(
        `UPDATE users
         SET email = ?, email_verified_at = NOW(), token_version = token_version + 1
         WHERE id = ?`,
        [item.email, item.user_id]
      );
    } else {
      await connection.query(
        `UPDATE users SET email_verified_at = NOW() WHERE id = ?`,
        [item.user_id]
      );
    }

    await connection.query(
      `UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ?`,
      [item.id]
    );

    await connection.query(
      `DELETE FROM email_verification_tokens
       WHERE user_id = ? AND id <> ?`,
      [item.user_id, item.id]
    );

    await connection.commit();

    return res.json({
      success: true,
      message:
        item.purpose === "email_change"
          ? "Your new email address has been verified successfully."
          : "Email verified successfully. You can now sign in.",
      role: item.role,
    });
  } catch (error) {
    await connection.rollback();
    console.error("VERIFY EMAIL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while verifying email",
    });
  } finally {
    connection.release();
  }
};

/* =====================================================
   RESEND EMAIL VERIFICATION
===================================================== */
const resendVerification = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const [users] = await pool.query(
      `SELECT id, name, email, email_verified_at, status
       FROM users WHERE email = ? LIMIT 1`,
      [email]
    );

    const generic = {
      success: true,
      message:
        "If the account exists and needs verification, a verification link has been sent.",
    };

    if (!users.length || users[0].status !== "active") {
      return res.json(generic);
    }

    const user = users[0];

    if (user.email_verified_at) {
      return res.json(generic);
    }

    if (!isSmtpConfigured && !isDevMode()) {
      return res.status(500).json({
        success: false,
        message: "Email service is not configured.",
      });
    }

    await createEmailVerification({
      userId: user.id,
      email: user.email,
      purpose: "registration",
    });

    return res.json(generic);
  } catch (error) {
    console.error("RESEND VERIFICATION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to process the verification request.",
    });
  }
};

/* =====================================================
   FORGOT PASSWORD / DIRECT PASSWORD RESET
===================================================== */
const forgotPassword = async (req, res) => {
  const emailInput = String(req.body?.email || req.body?.identifier || req.body?.phone || "").trim();
  const email = normalizeEmail(emailInput);
  const { new_password, password, confirm_password } = req.body || {};
  const newPass = new_password || password;
  const confirmPass = confirm_password;

  if (!emailInput) {
    return res.status(400).json({
      success: false,
      message: "Email address or phone number is required",
    });
  }

  // Direct password reset without email verification
  if (newPass !== undefined || confirmPass !== undefined) {
    if (!newPass || !confirmPass) {
      return res.status(400).json({
        success: false,
        message: "Both new password and confirm password are required",
      });
    }

    if (newPass !== confirmPass) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    if (newPass.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    try {
      const [users] = await pool.query(
        `SELECT id, name, email, phone, role, status
         FROM users
         WHERE LOWER(email) = LOWER(?) OR phone = ? OR phone = ?
         LIMIT 1`,
        [emailInput, emailInput, normalizePhone(emailInput)]
      );

      if (!users.length) {
        return res.status(404).json({
          success: false,
          message: "No registered account found with this email address or phone number.",
        });
      }

      const user = users[0];

      if (user.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "This account is inactive or suspended. Please contact support.",
        });
      }

      const hashedPassword = await bcrypt.hash(newPass, 12);

      await pool.query(
        `UPDATE users
         SET password = ?,
             token_version = token_version + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [hashedPassword, user.id]
      );

      try {
        await pool.query(
          `DELETE FROM password_reset_tokens WHERE user_id = ?`,
          [user.id]
        );
      } catch (e) {}

      return res.json({
        success: true,
        message: "Password has been successfully updated! You can now log in with your new password.",
      });
    } catch (error) {
      console.error("DIRECT PASSWORD RESET ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to update password. Please try again.",
      });
    }
  }

  const generic = {
    success: true,
    message:
      "If an account exists for this email, a password recovery link has been sent.",
  };

  try {
    const [users] = await pool.query(
      `SELECT id, name, email, role, status
       FROM users WHERE email = ? LIMIT 1`,
      [email]
    );

    if (!users.length || users[0].status !== "active") {
      return res.json(generic);
    }

    const user = users[0];

    // Normal user and admin can use the same secure reset-link mechanism.
    if (!isSmtpConfigured && !isDevPasswordResetMode()) {
      return res.status(500).json({
        success: false,
        message:
          "Password reset email service is not configured. Please contact support.",
      });
    }

    await issuePasswordReset(user);

    return res.json(generic);
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to process password recovery request.",
    });
  }
};

/* =====================================================
   RESET PASSWORD
===================================================== */
const resetPassword = async (req, res) => {
  const { token, new_password, confirm_password } = req.body || {};

  if (!token || !new_password || !confirm_password) {
    return res.status(400).json({
      success: false,
      message: "Reset token, new password, and confirm password are required",
    });
  }

  if (new_password !== confirm_password) {
    return res.status(400).json({
      success: false,
      message: "Passwords do not match",
    });
  }

  if (!isPasswordValid(new_password)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const tokenHash = hashResetToken(token);

    const [rows] = await connection.query(
      `SELECT prt.id, prt.user_id, prt.expires_at, prt.used_at,
              u.role, u.status
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = ?
       LIMIT 1
       FOR UPDATE`,
      [tokenHash]
    );

    if (!rows.length) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link",
      });
    }

    const item = rows[0];

    if (item.used_at) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "This password reset link has already been used",
      });
    }

    if (new Date(item.expires_at).getTime() < Date.now()) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message:
          "This password reset link has expired. Please request a new one.",
      });
    }

    if (item.status !== "active") {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: "This account is not active",
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 12);

    await connection.query(
      `UPDATE users
       SET password = ?,
           token_version = token_version + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [hashedPassword, item.user_id]
    );

    await connection.query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?`,
      [item.id]
    );

    await connection.query(
      `DELETE FROM password_reset_tokens
       WHERE user_id = ? AND id <> ?`,
      [item.user_id, item.id]
    );

    await connection.commit();

    return res.json({
      success: true,
      message:
        "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    await connection.rollback();
    console.error("RESET PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while resetting password",
    });
  } finally {
    connection.release();
  }
};

/* =====================================================
   CURRENT USER
===================================================== */
const me = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, name, email, phone, role, status, balance, ai_minutes,
              avatar, nid_number, kyc_status, company_name, address,
              last_login, token_version, email_verified_at, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let activeSubscription = null;
    try {
      const [rows] = await pool.query(
        `SELECT s.*, p.name AS package_name, p.slug AS package_slug,
                p.call_minutes, p.device_limit, p.features, p.price, p.service_type
         FROM user_subscriptions s
         JOIN packages p ON s.package_id = p.id
         WHERE s.user_id = ? AND s.status = 'active'
         ORDER BY s.expires_at DESC LIMIT 1`,
        [req.user.id]
      );
      activeSubscription = rows[0] || null;
    } catch (e) {
      console.error("ME SUBSCRIPTION ERROR:", e.message);
    }

    let unreadNotifications = 0;
    try {
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS count FROM notifications
         WHERE user_id = ? AND is_read = 0`,
        [req.user.id]
      );
      unreadNotifications = Number(rows[0]?.count || 0);
    } catch (e) {
      console.error("ME NOTIFICATION COUNT ERROR:", e.message);
    }

    return res.json({
      success: true,
      user: {
        ...users[0],
        active_subscription: activeSubscription,
        unread_notifications: unreadNotifications,
      },
    });
  } catch (error) {
    console.error("ME ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   UPDATE PROFILE
===================================================== */
const updateProfile = async (req, res) => {
  try {
    const { name, company_name, address } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    await pool.query(
      `UPDATE users
       SET name = ?, company_name = ?, address = ?
       WHERE id = ?`,
      [
        String(name).trim(),
        company_name ? String(company_name).trim() : null,
        address ? String(address).trim() : null,
        req.user.id,
      ]
    );

    const [users] = await pool.query(
      `SELECT id, name, email, phone, role, status, balance, ai_minutes,
              company_name, address, nid_number, kyc_status,
              token_version, email_verified_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: users[0],
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating profile",
    });
  }
};

/* =====================================================
   CHANGE PHONE
===================================================== */
const changePhone = async (req, res) => {
  try {
    const newPhone = normalizePhone(req.body?.new_phone);
    const currentPassword = req.body?.current_password;

    if (!isValidBangladeshPhone(newPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 11-digit Bangladesh mobile number",
      });
    }

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is required",
      });
    }

    const [users] = await pool.query(
      `SELECT id, password FROM users WHERE id = ? LIMIT 1`,
      [req.user.id]
    );

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!(await bcrypt.compare(currentPassword, users[0].password))) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const [duplicate] = await pool.query(
      `SELECT id FROM users WHERE phone = ? AND id <> ? LIMIT 1`,
      [newPhone, req.user.id]
    );

    if (duplicate.length) {
      return res.status(409).json({
        success: false,
        message: "This phone number is already in use",
      });
    }

    await pool.query(
      `UPDATE users
       SET phone = ?, token_version = token_version + 1
       WHERE id = ?`,
      [newPhone, req.user.id]
    );

    return res.json({
      success: true,
      message: "Phone number changed successfully. Please login again.",
    });
  } catch (error) {
    console.error("CHANGE PHONE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error changing phone number",
    });
  }
};

/* =====================================================
   REQUEST EMAIL CHANGE
===================================================== */
const requestEmailChange = async (req, res) => {
  try {
    const newEmail = normalizeEmail(req.body?.new_email);
    const currentPassword = req.body?.current_password;

    if (!isValidEmail(newEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is required",
      });
    }

    const [users] = await pool.query(
      `SELECT id, name, email, password
       FROM users WHERE id = ? LIMIT 1`,
      [req.user.id]
    );

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    if (newEmail === String(user.email).toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "New email must be different from your current email",
      });
    }

    const [duplicate] = await pool.query(
      `SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1`,
      [newEmail, req.user.id]
    );

    if (duplicate.length) {
      return res.status(409).json({
        success: false,
        message: "This email address is already in use",
      });
    }

    // If an email-change token is created, the current email remains unchanged
    // until the new address is verified.
    const rawToken = createSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + EMAIL_VERIFY_EXPIRES_MINUTES * 60 * 1000
    );

    await pool.query(
      `DELETE FROM email_verification_tokens
       WHERE user_id = ? AND purpose = 'email_change'`,
      [req.user.id]
    );

    await pool.query(
      `INSERT INTO email_verification_tokens
       (user_id, email, purpose, token_hash, expires_at)
       VALUES (?, ?, 'email_change', ?, ?)`,
      [req.user.id, newEmail, tokenHash, expiresAt]
    );

    const verificationUrl = `${getClientUrl()}/verify-email?token=${encodeURIComponent(
      rawToken
    )}`;

    if (isSmtpConfigured) {
      await sendEmailVerificationEmail({
        to: newEmail,
        name: user.name,
        verificationUrl,
        purpose: "email_change",
      });
    } else if (isDevMode()) {
      console.log("\n==================================================");
      console.log("EMAIL CHANGE VERIFICATION LINK [DEV ONLY]");
      console.log(`New email: ${newEmail}`);
      console.log(`URL: ${verificationUrl}`);
      console.log(`Expires: ${expiresAt.toISOString()}`);
      console.log("==================================================\n");
    } else {
      await pool.query(
        `DELETE FROM email_verification_tokens
         WHERE token_hash = ?`,
        [tokenHash]
      );
      return res.status(500).json({
        success: false,
        message: "Email service is not configured",
      });
    }

    return res.json({
      success: true,
      message:
        "Verification instructions have been prepared for your new email address.",
    });
  } catch (error) {
    console.error("REQUEST EMAIL CHANGE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to process email change",
    });
  }
};

/* =====================================================
   CHANGE PASSWORD
===================================================== */
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body || {};

    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message:
          "Current password, new password, and confirm password are required",
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    if (!isPasswordValid(new_password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      });
    }

    const [users] = await pool.query(
      `SELECT password FROM users WHERE id = ? LIMIT 1`,
      [req.user.id]
    );

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!(await bcrypt.compare(current_password, users[0].password))) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashed = await bcrypt.hash(new_password, 12);

    await pool.query(
      `UPDATE users
       SET password = ?, token_version = token_version + 1
       WHERE id = ?`,
      [hashed, req.user.id]
    );

    return res.json({
      success: true,
      message: "Password changed successfully. Please login again.",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error changing password",
    });
  }
};

/* =====================================================
   KYC
===================================================== */
const submitKYC = async (req, res) => {
  try {
    const { nid_number, address, company_name } = req.body || {};

    if (!nid_number) {
      return res.status(400).json({
        success: false,
        message: "NID / Passport number is required",
      });
    }

    await pool.query(
      `UPDATE users
       SET nid_number = ?, address = COALESCE(?, address),
           company_name = COALESCE(?, company_name),
           kyc_status = 'pending'
       WHERE id = ?`,
      [nid_number, address || null, company_name || null, req.user.id]
    );

    return res.json({
      success: true,
      message:
        "KYC details submitted successfully and are pending admin review.",
    });
  } catch (error) {
    console.error("SUBMIT KYC ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error submitting KYC",
    });
  }
};

/* =====================================================
   NOTIFICATIONS
===================================================== */
const getNotifications = async (req, res) => {
  try {
    const [notifications] = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 30`,
      [req.user.id]
    );

    return res.json({ success: true, notifications });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching notifications",
    });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === "all") {
      await pool.query(
        `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
        [req.user.id]
      );
    } else {
      await pool.query(
        `UPDATE notifications SET is_read = 1
         WHERE id = ? AND user_id = ?`,
        [id, req.user.id]
      );
    }

    return res.json({
      success: true,
      message: "Notifications updated",
    });
  } catch (error) {
    console.error("MARK NOTIFICATION READ ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   ADMIN PASSWORD RECOVERY
   Uses the same secure single-use reset link.
===================================================== */
const adminForgotPassword = async (req, res) => {
  const emailInput = String(req.body?.email || req.body?.identifier || "").trim();
  const email = normalizeEmail(emailInput);
  const { new_password, password, confirm_password } = req.body || {};
  const newPass = new_password || password;
  const confirmPass = confirm_password;

  if (!emailInput) {
    return res.status(400).json({
      success: false,
      message: "Admin email address is required",
    });
  }

  // Direct reset for admin without email link
  if (newPass !== undefined || confirmPass !== undefined) {
    if (!newPass || !confirmPass) {
      return res.status(400).json({
        success: false,
        message: "Both new password and confirm password are required",
      });
    }

    if (newPass !== confirmPass) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    if (newPass.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    try {
      const [users] = await pool.query(
        `SELECT id, name, email, role, status
         FROM users
         WHERE LOWER(email) = LOWER(?) AND role = 'admin'
         LIMIT 1`,
        [emailInput]
      );

      if (!users.length) {
        return res.status(404).json({
          success: false,
          message: "No administrator account found with this email address.",
        });
      }

      const user = users[0];

      if (user.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "This administrator account is inactive.",
        });
      }

      const hashedPassword = await bcrypt.hash(newPass, 12);

      await pool.query(
        `UPDATE users
         SET password = ?,
             token_version = token_version + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [hashedPassword, user.id]
      );

      try {
        await pool.query(
          `DELETE FROM password_reset_tokens WHERE user_id = ?`,
          [user.id]
        );
      } catch (e) {}

      return res.json({
        success: true,
        message: "Administrator password updated successfully! You can now log in.",
      });
    } catch (error) {
      console.error("ADMIN DIRECT PASSWORD RESET ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to update administrator password. Please try again.",
      });
    }
  }

  try {
    const [users] = await pool.query(
      `SELECT id, name, email, role, status
       FROM users WHERE email = ? LIMIT 1`,
      [email]
    );

    const generic = {
      success: true,
      message:
        "If an administrator account exists for this email, a password recovery link has been prepared.",
    };

    if (
      !users.length ||
      users[0].role !== "admin" ||
      users[0].status !== "active"
    ) {
      return res.json(generic);
    }

    if (!isSmtpConfigured && !isDevPasswordResetMode()) {
      return res.status(500).json({
        success: false,
        message: "Password reset email service is not configured.",
      });
    }

    await issuePasswordReset(users[0]);
    return res.json(generic);
  } catch (error) {
    console.error("ADMIN FORGOT PASSWORD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to process admin password recovery",
    });
  }
};

// Compatibility endpoint. New reset UI uses /auth/reset-password.
const adminResetPassword = resetPassword;

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  me,
  updateProfile,
  changePhone,
  requestEmailChange,
  changePassword,
  submitKYC,
  getNotifications,
  markNotificationRead,
  adminForgotPassword,
  adminResetPassword,
};
