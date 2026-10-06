
const nodemailer = require("nodemailer");

const isConfigured = Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure:
        String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const sendMail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    throw new Error("SMTP is not configured");
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;

  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
};

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const safeName = escapeHtml(name || "there");

  return sendMail({
    to,
    subject: "Reset your MyBDPhone password",
    text: `Hello ${name || "there"},

We received a request to reset your MyBDPhone password.

Open this link to create a new password:
${resetUrl}

This link will expire in 15 minutes and can only be used once.

If you did not request this, you can safely ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f4f8f6;padding:32px;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;border:1px solid #e2e8f0;">
          <h2 style="margin:0 0 12px;color:#092328;">Reset your MyBDPhone password</h2>
          <p style="color:#475569;line-height:1.7;">Hello ${safeName},</p>
          <p style="color:#475569;line-height:1.7;">
            We received a request to reset your MyBDPhone password.
            Click the button below to create a new password.
          </p>
          <p style="margin:28px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:#12544F;color:#fff;text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:700;">
              Reset Password
            </a>
          </p>
          <p style="color:#64748b;font-size:13px;line-height:1.7;">
            This link expires in 15 minutes and can only be used once.
          </p>
          <p style="color:#64748b;font-size:13px;line-height:1.7;">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  });
};

const sendEmailVerificationEmail = async ({
  to,
  name,
  verificationUrl,
  purpose = "registration",
}) => {
  const safeName = escapeHtml(name || "there");
  const isChange = purpose === "email_change";

  return sendMail({
    to,
    subject: isChange
      ? "Confirm your new MyBDPhone email address"
      : "Verify your MyBDPhone email address",
    text: `Hello ${name || "there"},

${isChange
  ? "You requested to change the email address on your MyBDPhone account."
  : "Welcome to MyBDPhone. Please verify your email address to activate your account."}

Open this link:
${verificationUrl}

This link will expire in 30 minutes and can only be used once.

If you did not request this, you can safely ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f4f8f6;padding:32px;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;border:1px solid #e2e8f0;">
          <h2 style="margin:0 0 12px;color:#092328;">
            ${isChange ? "Confirm your new email" : "Verify your MyBDPhone email"}
          </h2>
          <p style="color:#475569;line-height:1.7;">Hello ${safeName},</p>
          <p style="color:#475569;line-height:1.7;">
            ${
              isChange
                ? "Click the button below to confirm your new email address."
                : "Click the button below to verify your email address and activate your account."
            }
          </p>
          <p style="margin:28px 0;">
            <a href="${verificationUrl}" style="display:inline-block;background:#12544F;color:#fff;text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:700;">
              ${isChange ? "Confirm New Email" : "Verify Email"}
            </a>
          </p>
          <p style="color:#64748b;font-size:13px;line-height:1.7;">
            This link expires in 30 minutes and can only be used once.
          </p>
          <p style="color:#64748b;font-size:13px;line-height:1.7;">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  });
};

module.exports = {
  isConfigured,
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
};
