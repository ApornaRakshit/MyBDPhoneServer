const pool = require("../config/db");

// GET AVAILABLE 096 NUMBERS (Public search & selection)
const getAvailableNumbers = async (req, res) => {
  try {
    const { category, search } = req.query;

    let query =
      "SELECT id, number, category, price, max_devices, status FROM ip_numbers WHERE status = 'available'";
    const params = [];

    if (category) {
      query += " AND category = ?";
      params.push(category);
    }

    if (search) {
      query += " AND number LIKE ?";
      params.push(`%${search}%`);
    }

    query += " ORDER BY category DESC, number ASC LIMIT 50";

    const [numbers] = await pool.query(query, params);

    return res.json({
      success: true,
      count: numbers.length,
      numbers,
    });
  } catch (error) {
    console.error("GET AVAILABLE NUMBERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching numbers",
    });
  }
};

// GET USER'S ASSIGNED IP PHONE & SIP SETTINGS
const getMyIpPhone = async (req, res) => {
  try {
    const [numbers] = await pool.query(
      `
      SELECT n.*, s.status AS subscription_status, s.expires_at, s.started_at, p.name AS package_name, p.call_minutes, p.device_limit
      FROM ip_numbers n
      LEFT JOIN user_subscriptions s ON s.ip_number_id = n.id AND s.status = 'active'
      LEFT JOIN packages p ON s.package_id = p.id
      WHERE n.assigned_user_id = ?
      LIMIT 1
      `,
      [req.user.id]
    );

    if (numbers.length === 0) {
      return res.json({
        success: true,
        has_number: false,
        message:
          "No active 096 IP number assigned yet. Purchase an IP Phone package to get started.",
        details: null,
      });
    }

    const number = numbers[0];

    // Connected simulated devices
    const devices = [
      {
        id: "dev-1",
        name: "Grandstream GXP1625 / SIP Phone",
        type: "hardware",
        status: "online",
        ip: "103.145.12.4",
        last_seen: "Just now",
      },
      {
        id: "dev-2",
        name: "Windows PC (Zoiper Softphone)",
        type: "desktop",
        status: "online",
        ip: "103.145.12.5",
        last_seen: "2 mins ago",
      },
      {
        id: "dev-3",
        name: "Samsung Galaxy (Android Linphone)",
        type: "mobile",
        status: "offline",
        ip: "119.30.38.12",
        last_seen: "1 hour ago",
      },
    ];

    return res.json({
      success: true,
      has_number: true,
      details: {
        id: number.id,
        number: number.number,
        status: number.status,
        caller_tune: number.caller_tune,
        call_recording: Boolean(number.call_recording),
        device_count: number.device_count || devices.length,
        max_devices: number.max_devices,
        sip_server: number.sip_server || "sip.mybdphone.com:5060",
        sip_username: number.sip_username || `sip_${number.number}`,
        sip_password: number.sip_password || "••••••••••••",
        subscription: {
          package_name: number.package_name,
          status: number.subscription_status,
          expires_at: number.expires_at,
        },
        active_devices: devices,
      },
    });
  } catch (error) {
    console.error("GET MY IP PHONE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching IP phone details",
    });
  }
};

// UPDATE USER'S IP PHONE FEATURES (Caller Tune / Call Recording toggle)
const updateIpPhoneSettings = async (req, res) => {
  try {
    const { caller_tune, call_recording } = req.body;

    await pool.query(
      `
      UPDATE ip_numbers
      SET caller_tune = COALESCE(?, caller_tune),
          call_recording = COALESCE(?, call_recording)
      WHERE assigned_user_id = ?
      `,
      [
        caller_tune,
        call_recording !== undefined ? (call_recording ? 1 : 0) : null,
        req.user.id,
      ]
    );

    return res.json({
      success: true,
      message: "IP Phone configuration updated successfully",
    });
  } catch (error) {
    console.error("UPDATE IP PHONE SETTINGS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating settings",
    });
  }
};

// ADMIN: GET ALL IP NUMBERS
const getAllNumbers = async (req, res) => {
  try {
    const { status, category, search } = req.query;

    let query = `
      SELECT n.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
      FROM ip_numbers n
      LEFT JOIN users u ON n.assigned_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += " AND n.status = ?";
      params.push(status);
    }

    if (category) {
      query += " AND n.category = ?";
      params.push(category);
    }

    if (search) {
      query += " AND (n.number LIKE ? OR u.name LIKE ? OR u.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += " ORDER BY n.created_at DESC";

    const [numbers] = await pool.query(query, params);

    return res.json({
      success: true,
      count: numbers.length,
      numbers,
    });
  } catch (error) {
    console.error("GET ALL NUMBERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ADMIN: ADD NEW IP NUMBER TO INVENTORY
const addIpNumber = async (req, res) => {
  try {
    const {
      number,
      category = "regular",
      price = 0.0,
      max_devices = 5,
      sip_server = "sip.mybdphone.com:5060",
    } = req.body;

    if (!number) {
      return res.status(400).json({
        success: false,
        message: "Number is required (e.g. 096XXXXXXXX)",
      });
    }

    const sip_username = `sip_${number}`;
    const sip_password = `sip_pass_${Math.random()
      .toString(36)
      .substring(2, 10)}`;

    const [result] = await pool.query(
      `
      INSERT INTO ip_numbers (number, category, price, max_devices, sip_server, sip_username, sip_password, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'available')
      `,
      [
        number,
        category,
        price,
        max_devices,
        sip_server,
        sip_username,
        sip_password,
      ]
    );

    return res.status(201).json({
      success: true,
      message: `096 IP number ${number} added to inventory successfully!`,
      id: result.insertId,
    });
  } catch (error) {
    console.error("ADD NUMBER ERROR:", error);
    return res.status(500).json({
      success: false,
      message:
        error.code === "ER_DUP_ENTRY"
          ? "Number already exists in pool"
          : "Server error adding number",
    });
  }
};

// ADMIN: ASSIGN OR REVOKE NUMBER
const assignOrRevokeNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, user_id } = req.body; // action: 'assign' | 'revoke'

    if (action === "assign") {
      if (!user_id) {
        return res
          .status(400)
          .json({
            success: false,
            message: "User ID is required to assign number",
          });
      }

      await pool.query(
        "UPDATE ip_numbers SET assigned_user_id = ?, status = 'assigned' WHERE id = ?",
        [user_id, id]
      );

      return res.json({
        success: true,
        message: "Number assigned to user successfully",
      });
    } else if (action === "revoke") {
      await pool.query(
        "UPDATE ip_numbers SET assigned_user_id = NULL, status = 'available' WHERE id = ?",
        [id]
      );

      return res.json({
        success: true,
        message: "Number revoked and made available in inventory",
      });
    }

    return res.status(400).json({ success: false, message: "Invalid action" });
  } catch (error) {
    console.error("ASSIGN/REVOKE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getAvailableNumbers,
  getMyIpPhone,
  updateIpPhoneSettings,
  getAllNumbers,
  addIpNumber,
  assignOrRevokeNumber,
};
