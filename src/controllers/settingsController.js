const pool = require("../config/db");
const crypto = require("crypto");

const ensurePrimaryNumberInventory = async (value) => {
  try {
    const number = String(value || "").replace(/[^0-9+]/g, "").trim();
    if (!number) return;
    
    // Clean to local 096 format if possible
    let cleanNumber = number;
    if (cleanNumber.startsWith("+88096")) cleanNumber = cleanNumber.slice(3);
    if (cleanNumber.startsWith("88096")) cleanNumber = cleanNumber.slice(2);

    await pool.query(
      `INSERT INTO ip_numbers
        (number,status,assigned_user_id,category,price,device_count,max_devices,sip_username,sip_password)
       VALUES (?, 'available', NULL, 'regular', 0, 0, 5, ?, ?)
       ON DUPLICATE KEY UPDATE number=number`,
      [cleanNumber, `sip_${cleanNumber}`, `sip_${crypto.randomBytes(8).toString("hex")}`]
    );
  } catch (err) {
    console.warn("ensurePrimaryNumberInventory notice:", err.message);
  }
};

// GET ALL PUBLIC SETTINGS (For Homepage & App)
const getPublicSettings = async (req, res) => {
  try {
    const [settings] = await pool.query("SELECT setting_key, setting_value, setting_group FROM site_settings");

    const mapped = {};
    settings.forEach((s) => {
      mapped[s.setting_key] = s.setting_value;
    });

    return res.json({
      success: true,
      settings: mapped,
    });
  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching site settings",
      error: error.message,
    });
  }
};

// GET ALL SETTINGS BY GROUP (Admin)
const getAllSettings = async (req, res) => {
  try {
    const [settings] = await pool.query("SELECT * FROM site_settings ORDER BY setting_group, setting_key");

    return res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("GET ALL SETTINGS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ADMIN: BULK UPDATE SETTINGS
const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body; // array of { key, value, group } or object map

    if (!settings) {
      return res.status(400).json({ success: false, message: "No settings provided" });
    }

    if (Array.isArray(settings)) {
      for (const item of settings) {
        if (item.key) {
          await pool.query(
            `
            INSERT INTO site_settings (setting_key, setting_value, setting_group)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), setting_group = VALUES(setting_group)
            `,
            [item.key, item.value !== undefined ? String(item.value) : "", item.group || "general"]
          );
          if (item.key === 'primary_096_number') await ensurePrimaryNumberInventory(item.value);
        }
      }
    } else if (typeof settings === "object") {
      for (const [key, value] of Object.entries(settings)) {
        await pool.query(
          `
          INSERT INTO site_settings (setting_key, setting_value)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
          `,
          [key, value !== undefined && value !== null ? String(value) : ""]
        );
        if (key === 'primary_096_number') await ensurePrimaryNumberInventory(value);
      }
    }

    return res.json({
      success: true,
      message: "Website settings & CMS content updated successfully!",
    });
  } catch (error) {
    console.error("UPDATE SETTINGS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error updating settings",
    });
  }
};

module.exports = {
  getPublicSettings,
  getAllSettings,
  updateSettings,
};
