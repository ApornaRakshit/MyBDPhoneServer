
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await pool.query(
      `SELECT
         id, name, email, phone, role, status, balance, ai_minutes,
         avatar, nid_number, kyc_status, company_name, address,
         email_verified_at, token_version, last_login, created_at, updated_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [decoded.id]
    );

    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists",
      });
    }

    const user = users[0];

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.status}. Please contact support.`,
        account_status: user.status,
      });
    }

    // New tokens contain token_version. Old tokens remain compatible until
    // the user performs a security-sensitive change.
    if (
      decoded.token_version !== undefined &&
      Number(decoded.token_version) !== Number(user.token_version || 0)
    ) {
      return res.status(401).json({
        success: false,
        message: "Your security session has changed. Please login again.",
        code: "SESSION_INVALIDATED",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    console.error("AUTH MIDDLEWARE ERROR:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = { protect };
