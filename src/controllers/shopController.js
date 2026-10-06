const pool = require("../config/db");

// VALID BILLING TYPES
const VALID_BILLING_TYPES = ['ONE_TIME', 'MONTHLY', 'YEARLY'];

const normalizeBillingType = (type, defaultType = 'MONTHLY') => {
  if (!type) return defaultType;
  const upper = String(type).trim().toUpperCase();
  if (VALID_BILLING_TYPES.includes(upper)) return upper;
  if (upper === 'ONETIME' || upper === 'ONE-TIME' || upper === 'LIFETIME' || upper === 'ONE TIME') return 'ONE_TIME';
  if (upper === 'MONTH' || upper === 'PER_MONTH' || upper === 'MONTHLY') return 'MONTHLY';
  if (upper === 'YEAR' || upper === 'ANNUAL' || upper === 'ANNUALLY' || upper === 'YEARLY') return 'YEARLY';
  return defaultType;
};

/**
 * Bootstrap and ensure shop_products table schema is up to date
 */
const ensureShopTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shop_products (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(180) NOT NULL UNIQUE,
        category VARCHAR(100) NOT NULL DEFAULT 'caller_tune',
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        billing_type VARCHAR(50) NOT NULL DEFAULT 'MONTHLY',
        description TEXT NULL,
        features JSON NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        badge VARCHAR(100) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_shop_products_active (is_active),
        INDEX idx_shop_products_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Safe alterations in case of existing table
    const safeAlter = async (sql) => {
      try {
        await pool.query(sql);
      } catch (e) {
        if (!["ER_DUP_FIELDNAME", "ER_DUP_KEYNAME", "ER_CANT_DROP_FIELD_OR_KEY"].includes(e.code)) {
          // ignore duplicate columns
        }
      }
    };

    await safeAlter(`ALTER TABLE shop_products ADD COLUMN billing_type VARCHAR(50) NOT NULL DEFAULT 'MONTHLY' AFTER price;`);
    await safeAlter(`ALTER TABLE shop_products MODIFY COLUMN category VARCHAR(100) NOT NULL DEFAULT 'caller_tune';`);
    await safeAlter(`ALTER TABLE shop_products MODIFY COLUMN description TEXT NULL;`);
    await safeAlter(`ALTER TABLE shop_products MODIFY COLUMN badge VARCHAR(100) NULL;`);
    await safeAlter(`ALTER TABLE shop_products ADD COLUMN payment_methods JSON NULL AFTER badge;`);
    await safeAlter(`ALTER TABLE shop_products ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER payment_methods;`);

    // Check if initial seeding is needed
    const [[countRow]] = await pool.query("SELECT COUNT(*) AS count FROM shop_products");
    if (Number(countRow?.count || 0) === 0) {
      const defaultProducts = [
        {
          name: "Caller Tune Subscription",
          slug: "caller-tune-subscription",
          category: "caller_tune",
          price: 99.00,
          billing_type: "MONTHLY",
          description: "Set customized corporate greeting or brand music for all inbound callers on your 096 number.",
          features: JSON.stringify(["Custom Audio File Upload", "MP3 / WAV Support", "Schedule Business Hours Jingle", "Instant Audio Live Preview"]),
          badge: "Popular Add-on",
          is_active: 1
        },
        {
          name: "Call Recording Cloud Archive",
          slug: "call-recording-cloud-archive",
          category: "recording",
          price: 199.00,
          billing_type: "MONTHLY",
          description: "Secure, encrypted cloud storage for 90 days of all inbound and outbound call audio recordings with instant playback.",
          features: JSON.stringify(["90-Day Cloud Storage", "In-Browser Audio Player", "Downloadable MP3 Files", "GDPR / BTRC Compliant Encryption"]),
          badge: "Essential for Business",
          is_active: 1
        },
        {
          name: "Additional 5 Device Licenses",
          slug: "additional-5-device-licenses",
          category: "device_addon",
          price: 300.00,
          billing_type: "MONTHLY",
          description: "Expand your PBX capacity by connecting 5 additional PC, Android, or hardware IP phones to your 096 number.",
          features: JSON.stringify(["5 Additional Concurrent Device Logins", "SIP Authentication Tokens", "Multi-Seat Ring Group Support"]),
          badge: "Scale Your Team",
          is_active: 1
        },
        {
          name: "VIP Golden 096 IP Number",
          slug: "vip-golden-096-ip-number",
          category: "vip_number",
          price: 999.00,
          billing_type: "YEARLY",
          description: "Memorable repeating digit premium 096 business phone number that establishes immediate enterprise authority.",
          features: JSON.stringify(["Exclusive Golden Digit Sequence", "Lifetime Number Ownership", "Free Number Portability Guidance"]),
          badge: "Exclusive",
          is_active: 1
        }
      ];

      for (const prod of defaultProducts) {
        await pool.query(
          `INSERT INTO shop_products (name, slug, category, price, billing_type, description, features, badge, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name)`,
          [prod.name, prod.slug, prod.category, prod.price, prod.billing_type, prod.description, prod.features, prod.badge, prod.is_active]
        );
      }
    }
  } catch (error) {
    console.error("ensureShopTables Error:", error.message);
  }
};

// GET ALL SHOP PRODUCTS (Public / User / Admin)
const getShopProducts = async (req, res) => {
  try {
    await ensureShopTables();

    const { category, include_inactive, search } = req.query;

    let query = "SELECT * FROM shop_products WHERE 1=1";
    const params = [];

    if (!include_inactive || include_inactive !== "true") {
      query += " AND is_active = 1";
    }

    if (category && category !== "all") {
      query += " AND category = ?";
      params.push(category);
    }

    if (search && search.trim()) {
      query += " AND (name LIKE ? OR description LIKE ? OR badge LIKE ?)";
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    query += " ORDER BY sort_order ASC, price ASC, id ASC";

    const [products] = await pool.query(query, params);

    const formatted = products.map((p) => {
      let parsedFeatures = [];
      try {
        parsedFeatures = typeof p.features === "string" ? JSON.parse(p.features) : (p.features || []);
      } catch (e) {
        parsedFeatures = [];
      }

      let parsedMethods = null;
      try {
        if (p.payment_methods) {
          parsedMethods = typeof p.payment_methods === "string" ? JSON.parse(p.payment_methods) : p.payment_methods;
        }
      } catch (e) {
        parsedMethods = null;
      }

      return {
        ...p,
        price: parseFloat(p.price) || 0,
        billing_type: normalizeBillingType(p.billing_type, 'MONTHLY'),
        features: Array.isArray(parsedFeatures) ? parsedFeatures : [],
        payment_methods: Array.isArray(parsedMethods) ? parsedMethods : null,
      };
    });

    return res.json({
      success: true,
      count: formatted.length,
      products: formatted,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching shop products",
      error: error.message,
    });
  }
};

// GET SINGLE SHOP PRODUCT
const getShopProductById = async (req, res) => {
  try {
    await ensureShopTables();
    const id = Number(req.params.id);

    const [rows] = await pool.query("SELECT * FROM shop_products WHERE id = ? LIMIT 1", [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const p = rows[0];
    let parsedFeatures = [];
    try {
      parsedFeatures = typeof p.features === "string" ? JSON.parse(p.features) : (p.features || []);
    } catch (e) {
      parsedFeatures = [];
    }

    let parsedMethods = null;
    try {
      if (p.payment_methods) {
        parsedMethods = typeof p.payment_methods === "string" ? JSON.parse(p.payment_methods) : p.payment_methods;
      }
    } catch (e) {
      parsedMethods = null;
    }

    return res.json({
      success: true,
      product: {
        ...p,
        price: parseFloat(p.price) || 0,
        billing_type: normalizeBillingType(p.billing_type, 'MONTHLY'),
        features: Array.isArray(parsedFeatures) ? parsedFeatures : [],
        payment_methods: Array.isArray(parsedMethods) ? parsedMethods : null,
      }
    });
  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);
    return res.status(500).json({ success: false, message: "Error fetching product" });
  }
};

// ADMIN: ADD SHOP PRODUCT
const createShopProduct = async (req, res) => {
  try {
    await ensureShopTables();

    const {
      name,
      category = 'caller_tune',
      price,
      billing_type = 'MONTHLY',
      description = '',
      features = [],
      badge = null,
      is_active = 1,
      sort_order = 0,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product title is required",
      });
    }

    if (price === undefined || price === null || isNaN(parseFloat(price))) {
      return res.status(400).json({
        success: false,
        message: "A valid price is required",
      });
    }

    const cleanName = name.trim();
    const cleanCategory = (category || 'caller_tune').trim();
    const cleanPrice = parseFloat(price);
    const normalizedBilling = normalizeBillingType(billing_type, 'MONTHLY');
    const cleanDescription = (description || '').trim();
    const cleanBadge = badge && badge.trim() ? badge.trim() : null;
    const cleanActive = (is_active === 0 || is_active === false || is_active === '0') ? 0 : 1;
    const cleanSort = parseInt(sort_order, 10) || 0;

    let featureArray = [];
    if (Array.isArray(features)) {
      featureArray = features.filter((f) => f && String(f).trim().length > 0).map((f) => String(f).trim());
    } else if (typeof features === "string") {
      try {
        const parsed = JSON.parse(features);
        featureArray = Array.isArray(parsed) ? parsed : [features];
      } catch (e) {
        featureArray = features.split("\n").map((f) => f.trim()).filter(Boolean);
      }
    }

    const baseSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "service";
    let slug = baseSlug;

    // Check if slug exists, if so append random suffix
    const [existing] = await pool.query("SELECT id FROM shop_products WHERE slug = ? LIMIT 1", [slug]);
    if (existing.length > 0) {
      slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    let paymentMethodsArray = null;
    if (req.body.payment_methods !== undefined && req.body.payment_methods !== null) {
      if (Array.isArray(req.body.payment_methods)) {
        paymentMethodsArray = req.body.payment_methods.filter(Boolean);
      } else if (typeof req.body.payment_methods === 'string') {
        try {
          const parsed = JSON.parse(req.body.payment_methods);
          paymentMethodsArray = Array.isArray(parsed) ? parsed : null;
        } catch (e) {
          paymentMethodsArray = req.body.payment_methods.split(',').map((m) => m.trim()).filter(Boolean);
        }
      }
    }

    const [result] = await pool.query(
      `
      INSERT INTO shop_products (name, slug, category, price, billing_type, description, features, badge, payment_methods, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        cleanName,
        slug,
        cleanCategory,
        cleanPrice,
        normalizedBilling,
        cleanDescription,
        JSON.stringify(featureArray),
        cleanBadge,
        paymentMethodsArray && paymentMethodsArray.length > 0 ? JSON.stringify(paymentMethodsArray) : null,
        cleanActive,
        cleanSort,
      ]
    );

    const [newProd] = await pool.query("SELECT * FROM shop_products WHERE id = ?", [result.insertId]);

    return res.status(201).json({
      success: true,
      message: "Marketplace service added successfully!",
      product: {
        ...newProd[0],
        price: parseFloat(newProd[0].price),
        billing_type: normalizeBillingType(newProd[0].billing_type, 'MONTHLY'),
        features: featureArray,
        payment_methods: paymentMethodsArray,
      },
    });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create product",
    });
  }
};

// ADMIN: UPDATE SHOP PRODUCT
const updateShopProduct = async (req, res) => {
  try {
    await ensureShopTables();
    const id = Number(req.params.id);

    const [existing] = await pool.query("SELECT * FROM shop_products WHERE id = ? LIMIT 1", [id]);
    if (!existing.length) {
      return res.status(404).json({
        success: false,
        message: "Product not found in marketplace",
      });
    }

    const {
      name,
      category,
      price,
      billing_type,
      description,
      features,
      badge,
      payment_methods,
      is_active,
      sort_order,
    } = req.body;

    const fields = [];
    const params = [];

    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (!cleanName) {
        return res.status(400).json({ success: false, message: "Product title cannot be empty" });
      }
      fields.push("name = ?");
      params.push(cleanName);
    }

    if (category !== undefined) {
      fields.push("category = ?");
      params.push(String(category).trim());
    }

    if (price !== undefined) {
      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ success: false, message: "Price must be a valid non-negative number" });
      }
      fields.push("price = ?");
      params.push(numPrice);
    }

    if (billing_type !== undefined) {
      fields.push("billing_type = ?");
      params.push(normalizeBillingType(billing_type, 'MONTHLY'));
    }

    if (description !== undefined) {
      fields.push("description = ?");
      params.push(String(description || '').trim());
    }

    if (features !== undefined) {
      let featureArray = [];
      if (Array.isArray(features)) {
        featureArray = features.filter((f) => f && String(f).trim().length > 0).map((f) => String(f).trim());
      } else if (typeof features === "string") {
        try {
          const parsed = JSON.parse(features);
          featureArray = Array.isArray(parsed) ? parsed : [features];
        } catch (e) {
          featureArray = features.split("\n").map((f) => f.trim()).filter(Boolean);
        }
      }
      fields.push("features = ?");
      params.push(JSON.stringify(featureArray));
    }

    if (badge !== undefined) {
      fields.push("badge = ?");
      params.push(badge && String(badge).trim() ? String(badge).trim() : null);
    }

    if (payment_methods !== undefined) {
      let paymentMethodsArray = null;
      if (payment_methods !== null) {
        if (Array.isArray(payment_methods)) {
          paymentMethodsArray = payment_methods.filter(Boolean);
        } else if (typeof payment_methods === 'string') {
          try {
            const parsed = JSON.parse(payment_methods);
            paymentMethodsArray = Array.isArray(parsed) ? parsed : null;
          } catch (e) {
            paymentMethodsArray = payment_methods.split(',').map((m) => m.trim()).filter(Boolean);
          }
        }
      }
      fields.push("payment_methods = ?");
      params.push(paymentMethodsArray && paymentMethodsArray.length > 0 ? JSON.stringify(paymentMethodsArray) : null);
    }

    if (is_active !== undefined) {
      fields.push("is_active = ?");
      params.push((is_active === 0 || is_active === false || is_active === '0') ? 0 : 1);
    }

    if (sort_order !== undefined) {
      fields.push("sort_order = ?");
      params.push(parseInt(sort_order, 10) || 0);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided to update",
      });
    }

    params.push(id);

    await pool.query(
      `UPDATE shop_products SET ${fields.join(", ")} WHERE id = ?`,
      params
    );

    const [updated] = await pool.query("SELECT * FROM shop_products WHERE id = ?", [id]);

    let parsedFeatures = [];
    try {
      parsedFeatures = typeof updated[0].features === "string" ? JSON.parse(updated[0].features) : (updated[0].features || []);
    } catch (e) {
      parsedFeatures = [];
    }

    let parsedMethods = null;
    try {
      if (updated[0].payment_methods) {
        parsedMethods = typeof updated[0].payment_methods === "string" ? JSON.parse(updated[0].payment_methods) : updated[0].payment_methods;
      }
    } catch (e) {
      parsedMethods = null;
    }

    return res.json({
      success: true,
      message: "Marketplace service updated successfully!",
      product: {
        ...updated[0],
        price: parseFloat(updated[0].price),
        billing_type: normalizeBillingType(updated[0].billing_type, 'MONTHLY'),
        features: Array.isArray(parsedFeatures) ? parsedFeatures : [],
        payment_methods: Array.isArray(parsedMethods) ? parsedMethods : null,
      },
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update product",
    });
  }
};

// ADMIN: TOGGLE PRODUCT ACTIVE STATUS
const toggleShopProduct = async (req, res) => {
  try {
    await ensureShopTables();
    const id = Number(req.params.id);

    const [existing] = await pool.query("SELECT is_active FROM shop_products WHERE id = ? LIMIT 1", [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const nextState = existing[0].is_active ? 0 : 1;
    await pool.query("UPDATE shop_products SET is_active = ? WHERE id = ?", [nextState, id]);

    return res.json({
      success: true,
      message: nextState ? "Product is now Active and visible to users." : "Product is now Hidden from marketplace.",
      is_active: nextState,
    });
  } catch (error) {
    console.error("TOGGLE PRODUCT ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to toggle status" });
  }
};

// ADMIN: DELETE SHOP PRODUCT
const deleteShopProduct = async (req, res) => {
  try {
    await ensureShopTables();
    const id = Number(req.params.id);

    const [result] = await pool.query("DELETE FROM shop_products WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.json({
      success: true,
      message: "Product removed from marketplace successfully",
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete product",
    });
  }
};

module.exports = {
  ensureShopTables,
  getShopProducts,
  getShopProductById,
  createShopProduct,
  updateShopProduct,
  toggleShopProduct,
  deleteShopProduct,
};
