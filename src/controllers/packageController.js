const pool = require("../config/db");

// GET ALL PACKAGES (Public & User filterable)
const getAllPackages = async (req, res) => {
  try {
    const { service_type, include_inactive } = req.query;

    let query = "SELECT * FROM packages WHERE 1=1";
    const params = [];

    if (!include_inactive || include_inactive !== "true") {
      query += " AND status = 'active'";
    }

    if (service_type && (service_type === "ip_phone" || service_type === "ai_calling")) {
      query += " AND service_type = ?";
      params.push(service_type);
    }

    query += " ORDER BY sort_order ASC, price ASC";

    const [packages] = await pool.query(query, params);

    // Format features if string
    const formatted = packages.map((pkg) => ({
      ...pkg,
      features: typeof pkg.features === "string" ? JSON.parse(pkg.features) : pkg.features,
    }));

    return res.json({
      success: true,
      count: formatted.length,
      packages: formatted,
    });
  } catch (error) {
    console.error("GET PACKAGES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching packages",
    });
  }
};

// GET PACKAGE BY ID OR SLUG
const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;

    const [packages] = await pool.query(
      "SELECT * FROM packages WHERE id = ? OR slug = ? LIMIT 1",
      [id, id]
    );

    if (packages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    const pkg = packages[0];
    pkg.features = typeof pkg.features === "string" ? JSON.parse(pkg.features) : pkg.features;

    return res.json({
      success: true,
      package: pkg,
    });
  } catch (error) {
    console.error("GET PACKAGE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ADMIN: CREATE PACKAGE (NO CODE REQUIRED)
const createPackage = async (req, res) => {
  try {
    const {
      name,
      slug,
      service_type,
      price,
      billing_period = "monthly",
      description,
      features = [],
      call_minutes = 0,
      device_limit = 1,
      ai_credits = 0,
      concurrent_calls = 1,
      recording_enabled = 0,
      caller_tune_enabled = 0,
      is_recommended = 0,
      status = "active",
      badge_text,
      sort_order = 0,
    } = req.body;

    if (!name || !service_type || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, service type, and price are required",
      });
    }

    const packageSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const featureJson = Array.isArray(features) ? JSON.stringify(features) : (typeof features === "string" ? features : JSON.stringify([]));

    const [result] = await pool.query(
      `
      INSERT INTO packages 
      (name, slug, service_type, price, billing_period, description, features, call_minutes, device_limit, ai_credits, concurrent_calls, recording_enabled, caller_tune_enabled, is_recommended, status, badge_text, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        packageSlug,
        service_type,
        price,
        billing_period,
        description || "",
        featureJson,
        Number(call_minutes) || 0,
        Number(device_limit) || 1,
        Number(ai_credits) || 0,
        Number(concurrent_calls) || 1,
        recording_enabled ? 1 : 0,
        caller_tune_enabled ? 1 : 0,
        is_recommended ? 1 : 0,
        status,
        badge_text || null,
        Number(sort_order) || 0,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Package created successfully and is now live!",
      packageId: result.insertId,
    });
  } catch (error) {
    console.error("CREATE PACKAGE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.code === "ER_DUP_ENTRY" ? "Package with this slug already exists" : "Server error creating package",
    });
  }
};

// ADMIN: UPDATE PACKAGE
const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      service_type,
      price,
      billing_period,
      description,
      features,
      call_minutes,
      device_limit,
      ai_credits,
      concurrent_calls,
      recording_enabled,
      caller_tune_enabled,
      is_recommended,
      status,
      badge_text,
      sort_order,
    } = req.body;

    const featureJson = features ? (Array.isArray(features) ? JSON.stringify(features) : features) : undefined;

    await pool.query(
      `
      UPDATE packages
      SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        service_type = COALESCE(?, service_type),
        price = COALESCE(?, price),
        billing_period = COALESCE(?, billing_period),
        description = COALESCE(?, description),
        features = COALESCE(?, features),
        call_minutes = COALESCE(?, call_minutes),
        device_limit = COALESCE(?, device_limit),
        ai_credits = COALESCE(?, ai_credits),
        concurrent_calls = COALESCE(?, concurrent_calls),
        recording_enabled = COALESCE(?, recording_enabled),
        caller_tune_enabled = COALESCE(?, caller_tune_enabled),
        is_recommended = COALESCE(?, is_recommended),
        status = COALESCE(?, status),
        badge_text = COALESCE(?, badge_text),
        sort_order = COALESCE(?, sort_order)
      WHERE id = ?
      `,
      [
        name,
        slug,
        service_type,
        price,
        billing_period,
        description,
        featureJson,
        call_minutes,
        device_limit,
        ai_credits,
        concurrent_calls,
        recording_enabled !== undefined ? (recording_enabled ? 1 : 0) : null,
        caller_tune_enabled !== undefined ? (caller_tune_enabled ? 1 : 0) : null,
        is_recommended !== undefined ? (is_recommended ? 1 : 0) : null,
        status,
        badge_text,
        sort_order,
        id,
      ]
    );

    return res.json({
      success: true,
      message: "Package updated successfully without touching source code!",
    });
  } catch (error) {
    console.error("UPDATE PACKAGE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating package",
    });
  }
};

// ADMIN: DELETE PACKAGE
const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if subscriptions exist
    const [subs] = await pool.query("SELECT id FROM user_subscriptions WHERE package_id = ? LIMIT 1", [id]);
    if (subs.length > 0) {
      // Soft deactivate instead
      await pool.query("UPDATE packages SET status = 'inactive' WHERE id = ?", [id]);
      return res.json({
        success: true,
        message: "Package has active subscribers so it was marked as Inactive.",
      });
    }

    await pool.query("DELETE FROM packages WHERE id = ?", [id]);

    return res.json({
      success: true,
      message: "Package deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PACKAGE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error deleting package",
    });
  }
};

module.exports = {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
};

