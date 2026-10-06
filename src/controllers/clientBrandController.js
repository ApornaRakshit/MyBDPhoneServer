const pool = require("../config/db");
const path = require("path");
const fs = require("fs");

/**
 * Ensure the client_brands table exists and is populated with initial seed data.
 */
async function ensureClientBrandTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_brands (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      logo_url VARCHAR(1000) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_visible BOOLEAN NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_client_brands_visible (is_visible),
      INDEX idx_client_brands_order (sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Check if there is existing data
  const [rows] = await pool.query(`SELECT COUNT(*) as cnt FROM client_brands`);
  if (rows[0]?.cnt === 0) {
    console.log("🌱 Seeding initial client brands / PBX trusted companies...");
    const seedBrands = [
      { title: "Karim Motors", logo_url: "/uploads/brands/imgi_170_karim-motors.png", sort_order: 1 },
      { title: "Skybuy BD", logo_url: "/uploads/brands/imgi_172_Skybuybd.png", sort_order: 2 },
      { title: "Ovijat Group", logo_url: "/uploads/brands/imgi_174_Ovijat-Group.png", sort_order: 3 },
      { title: "Boddibari", logo_url: "/uploads/brands/imgi_176_boddibari.png", sort_order: 4 },
      { title: "QH Ltd", logo_url: "/uploads/brands/imgi_179_QHLtd.png", sort_order: 5 },
      { title: "Banglay IELTS", logo_url: "/uploads/brands/imgi_180_Banglay-IELTS.png", sort_order: 6 },
      { title: "SB Super Deluxe", logo_url: "/uploads/brands/imgi_181_SB-Super-Deluxe.png", sort_order: 7 },
      { title: "Prostut Bangladesh", logo_url: "/uploads/brands/imgi_182_Prostut-Banglades.png", sort_order: 8 },
      { title: "MS Prangon Enterprise", logo_url: "/uploads/brands/imgi_183_MSPrangon-Enterprise.png", sort_order: 9 },
      { title: "Computer Village", logo_url: "/uploads/brands/imgi_184_computer-village.png", sort_order: 10 },
      { title: "Munshe Industries", logo_url: "/uploads/brands/imgi_186_Munshe-Industries.png", sort_order: 11 },
      { title: "Morning Agro", logo_url: "/uploads/brands/imgi_187_Morning-Agro.png", sort_order: 12 },
      { title: "Kids Gallery Shop", logo_url: "/uploads/brands/imgi_188_kids-gallery-shop.png", sort_order: 13 },
      { title: "Boiyer Chowa", logo_url: "/uploads/brands/imgi_189_BoiyerChowa-ezgif.png", sort_order: 14 },
      { title: "Tuition BD", logo_url: "/uploads/brands/imgi_190_Tuition-BD.png", sort_order: 15 },
      { title: "Mega Deals", logo_url: "/uploads/brands/imgi_191_Mega-Deals.png", sort_order: 16 },
      { title: "ShopBase", logo_url: "/uploads/brands/imgi_192_ShopBase.png", sort_order: 17 },
      { title: "Tropos Tours", logo_url: "/uploads/brands/imgi_193_Tropos-Tours.png", sort_order: 18 },
      { title: "Owais Development", logo_url: "/uploads/brands/imgi_194_OWAIS_DEVELOPMENT_AND_CONSULTANCY.png", sort_order: 19 },
      { title: "Oren Mart", logo_url: "/uploads/brands/imgi_195_Oren-Mart.png", sort_order: 20 },
      { title: "OffTech IT", logo_url: "/uploads/brands/imgi_199_OffTechIT.png", sort_order: 21 },
      { title: "Crown Shop", logo_url: "/uploads/brands/imgi_203_crownshop.png", sort_order: 22 },
      { title: "Green Kitchen", logo_url: "/uploads/brands/imgi_204_green-kitchen.png", sort_order: 23 },
      { title: "HM Enterprise", logo_url: "/uploads/brands/imgi_207_HM-Enterprise.png", sort_order: 24 },
      { title: "Eco Travels", logo_url: "/uploads/brands/imgi_208_Eco-Travels.png", sort_order: 25 },
      { title: "Hamesha Food", logo_url: "/uploads/brands/imgi_209_HAMESHA-FOOD.png", sort_order: 26 },
      { title: "Amanot Foods", logo_url: "/uploads/brands/imgi_211_Amanot-Foods.png", sort_order: 27 },
      { title: "Shadamon Shop", logo_url: "/uploads/brands/imgi_217_Shadamon-Shop.png", sort_order: 28 },
      { title: "Bobbin", logo_url: "/uploads/brands/imgi_219_Bobbin.png", sort_order: 29 },
      { title: "Sensible Match", logo_url: "/uploads/brands/imgi_21_sensiblematch.png", sort_order: 30 },
      { title: "Ketteys BD", logo_url: "/uploads/brands/imgi_220_Ketteys-BD.png", sort_order: 31 },
      { title: "Tawhid Food", logo_url: "/uploads/brands/imgi_222_Tawhid-Food.png", sort_order: 32 },
      { title: "Mini Mart BD", logo_url: "/uploads/brands/imgi_225_minimartbd.png", sort_order: 33 },
      { title: "Soft Coder BD", logo_url: "/uploads/brands/imgi_227_Soft-Coder-BD.png", sort_order: 34 },
      { title: "Organic Desi Food", logo_url: "/uploads/brands/imgi_231_Organic-Desi-Food.png", sort_order: 35 },
      { title: "Edu Poribar", logo_url: "/uploads/brands/imgi_232_Edu-Poribar.png", sort_order: 36 },
      { title: "BSK Network", logo_url: "/uploads/brands/imgi_236_BSK-network.png", sort_order: 37 },
      { title: "Best Sheba", logo_url: "/uploads/brands/imgi_23_best-sheba-logo.png", sort_order: 38 },
      { title: "Anan Group", logo_url: "/uploads/brands/imgi_24_anan-group.png", sort_order: 39 },
      { title: "Kitabghor", logo_url: "/uploads/brands/imgi_27_Kitabghor.png", sort_order: 40 },
    ];

    for (const b of seedBrands) {
      await pool.query(
        `INSERT INTO client_brands (title, logo_url, sort_order, is_visible) VALUES (?, ?, ?, 1)`,
        [b.title, b.logo_url, b.sort_order]
      );
    }
    console.log("✅ Seeded 40 client brand logos.");
  }
}

/**
 * Normalizes brand row into both camelCase and snake_case properties
 */
function formatBrand(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    logoUrl: row.logo_url,
    logo_url: row.logo_url,
    order: row.sort_order,
    sort_order: row.sort_order,
    isVisible: Boolean(row.is_visible),
    is_visible: Boolean(row.is_visible),
    status: row.is_visible ? "active" : "inactive",
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
  };
}

/**
 * Public GET: Fetch all visible brands
 * GET /api/v1/client-brands
 */
async function getPublicBrands(req, res) {
  try {
    await ensureClientBrandTables();
    const [rows] = await pool.query(
      `SELECT * FROM client_brands WHERE is_visible = 1 ORDER BY sort_order ASC, id ASC`
    );
    const brands = rows.map(formatBrand);
    return res.json({
      success: true,
      data: brands,
      brands: brands,
      count: brands.length,
    });
  } catch (err) {
    console.error("GET PUBLIC CLIENT BRANDS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch client brand logos",
      error: err.message,
    });
  }
}

/**
 * Admin GET: Fetch all brands (including hidden)
 * GET /api/v1/client-brands/admin
 */
async function getAdminBrands(req, res) {
  try {
    await ensureClientBrandTables();
    const [rows] = await pool.query(
      `SELECT * FROM client_brands ORDER BY sort_order ASC, id ASC`
    );
    const brands = rows.map(formatBrand);
    return res.json({
      success: true,
      data: brands,
      brands: brands,
      count: brands.length,
    });
  } catch (err) {
    console.error("GET ADMIN CLIENT BRANDS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch client brand list for admin",
      error: err.message,
    });
  }
}

/**
 * Admin GET by ID
 * GET /api/v1/client-brands/:id
 */
async function getBrandById(req, res) {
  try {
    await ensureClientBrandTables();
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT * FROM client_brands WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Client brand not found",
      });
    }
    return res.json({
      success: true,
      data: formatBrand(rows[0]),
    });
  } catch (err) {
    console.error("GET CLIENT BRAND BY ID ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch client brand",
      error: err.message,
    });
  }
}

/**
 * Admin POST: Create a new brand logo
 * POST /api/v1/client-brands
 */
async function createBrand(req, res) {
  try {
    await ensureClientBrandTables();
    const { title, logoUrl, logo_url, order, sort_order, isVisible, is_visible, status } = req.body;

    let finalLogoUrl = logoUrl || logo_url || "";
    if (req.file) {
      finalLogoUrl = `/uploads/brands/${req.file.filename}`;
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Brand title is required",
      });
    }

    if (!finalLogoUrl) {
      return res.status(400).json({
        success: false,
        message: "Brand logo image URL or uploaded file is required",
      });
    }

    const finalOrder = Number(order ?? sort_order ?? 0);
    const finalVisible = isVisible !== undefined
      ? (Boolean(isVisible) ? 1 : 0)
      : is_visible !== undefined
      ? (Boolean(is_visible) ? 1 : 0)
      : status === "inactive"
      ? 0
      : 1;

    const [result] = await pool.query(
      `INSERT INTO client_brands (title, logo_url, sort_order, is_visible) VALUES (?, ?, ?, ?)`,
      [title.trim(), finalLogoUrl.trim(), finalOrder, finalVisible]
    );

    const [newRow] = await pool.query(
      `SELECT * FROM client_brands WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: "Client brand created successfully",
      data: formatBrand(newRow[0]),
    });
  } catch (err) {
    console.error("CREATE CLIENT BRAND ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create client brand",
      error: err.message,
    });
  }
}

/**
 * Admin PUT: Update an existing brand logo
 * PUT /api/v1/client-brands/:id
 */
async function updateBrand(req, res) {
  try {
    await ensureClientBrandTables();
    const { id } = req.params;
    const { title, logoUrl, logo_url, order, sort_order, isVisible, is_visible, status } = req.body;

    const [existing] = await pool.query(
      `SELECT * FROM client_brands WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!existing.length) {
      return res.status(404).json({
        success: false,
        message: "Client brand not found",
      });
    }

    let finalLogoUrl = existing[0].logo_url;
    if (req.file) {
      finalLogoUrl = `/uploads/brands/${req.file.filename}`;
    } else if (logoUrl !== undefined || logo_url !== undefined) {
      finalLogoUrl = logoUrl || logo_url || finalLogoUrl;
    }

    const finalTitle = title !== undefined ? title.trim() : existing[0].title;
    const finalOrder = (order !== undefined || sort_order !== undefined)
      ? Number(order ?? sort_order ?? existing[0].sort_order)
      : existing[0].sort_order;

    let finalVisible = existing[0].is_visible;
    if (isVisible !== undefined) {
      finalVisible = Boolean(isVisible) ? 1 : 0;
    } else if (is_visible !== undefined) {
      finalVisible = Boolean(is_visible) ? 1 : 0;
    } else if (status !== undefined) {
      finalVisible = status === "active" ? 1 : 0;
    }

    await pool.query(
      `UPDATE client_brands SET title = ?, logo_url = ?, sort_order = ?, is_visible = ? WHERE id = ?`,
      [finalTitle, finalLogoUrl, finalOrder, finalVisible, id]
    );

    const [updatedRow] = await pool.query(
      `SELECT * FROM client_brands WHERE id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: "Client brand updated successfully",
      data: formatBrand(updatedRow[0]),
    });
  } catch (err) {
    console.error("UPDATE CLIENT BRAND ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update client brand",
      error: err.message,
    });
  }
}

/**
 * Admin PUT: Toggle visibility
 * PUT /api/v1/client-brands/:id/toggle
 */
async function toggleBrandVisibility(req, res) {
  try {
    await ensureClientBrandTables();
    const { id } = req.params;

    const [existing] = await pool.query(
      `SELECT is_visible FROM client_brands WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!existing.length) {
      return res.status(404).json({
        success: false,
        message: "Client brand not found",
      });
    }

    const nextVisible = existing[0].is_visible ? 0 : 1;
    await pool.query(
      `UPDATE client_brands SET is_visible = ? WHERE id = ?`,
      [nextVisible, id]
    );

    return res.json({
      success: true,
      message: `Client brand marked as ${nextVisible ? "visible" : "hidden"}`,
      isVisible: Boolean(nextVisible),
      is_visible: Boolean(nextVisible),
    });
  } catch (err) {
    console.error("TOGGLE CLIENT BRAND ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle client brand visibility",
      error: err.message,
    });
  }
}

/**
 * Admin DELETE: Remove a brand logo
 * DELETE /api/v1/client-brands/:id
 */
async function deleteBrand(req, res) {
  try {
    await ensureClientBrandTables();
    const { id } = req.params;

    const [result] = await pool.query(
      `DELETE FROM client_brands WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Client brand not found",
      });
    }

    return res.json({
      success: true,
      message: "Client brand deleted successfully",
    });
  } catch (err) {
    console.error("DELETE CLIENT BRAND ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete client brand",
      error: err.message,
    });
  }
}

/**
 * Admin PUT: Reorder multiple brands
 * PUT /api/v1/client-brands/reorder
 */
async function reorderBrands(req, res) {
  try {
    await ensureClientBrandTables();
    const { items } = req.body;

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({
        success: false,
        message: "Items array is required for reordering",
      });
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const id = item.id;
      const order = item.order !== undefined ? item.order : (item.sort_order !== undefined ? item.sort_order : i + 1);
      if (id) {
        await pool.query(
          `UPDATE client_brands SET sort_order = ? WHERE id = ?`,
          [order, id]
        );
      }
    }

    return res.json({
      success: true,
      message: "Client brands reordered successfully",
    });
  } catch (err) {
    console.error("REORDER CLIENT BRANDS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to reorder client brands",
      error: err.message,
    });
  }
}

/**
 * Admin POST: Upload a brand logo file
 * POST /api/v1/client-brands/upload
 */
async function uploadBrandLogo(req, res) {
  try {
    const file = req.file || (req.files && (req.files.logo?.[0] || req.files.file?.[0] || req.files.image?.[0] || req.files[0]));
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required (multipart field 'logo', 'file', or 'image')",
      });
    }
    const relativeUrl = `/uploads/brands/${file.filename}`;
    return res.json({
      success: true,
      url: relativeUrl,
      logoUrl: relativeUrl,
      logo_url: relativeUrl,
      filename: file.filename,
      message: "Brand logo uploaded successfully",
    });
  } catch (err) {
    console.error("UPLOAD BRAND LOGO ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to upload brand logo image",
      error: err.message,
    });
  }
}

module.exports = {
  ensureClientBrandTables,
  getPublicBrands,
  getAdminBrands,
  getBrandById,
  createBrand,
  updateBrand,
  toggleBrandVisibility,
  deleteBrand,
  reorderBrands,
  uploadBrandLogo,
};
