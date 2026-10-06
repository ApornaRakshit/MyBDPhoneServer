const pool = require("../config/db");

// Default navigation menu definition
const DEFAULT_MENU_STRUCTURE = [
  {
    title: "Home",
    path: "/",
    is_dropdown: 0,
    sort_order: 1,
    children: [],
  },
  {
    title: "Products",
    path: "#",
    is_dropdown: 1,
    sort_order: 2,
    children: [
      { title: "Cloud PBX", path: "/cloud-pbx", description: "Reliable cloud PBX phone system for business", icon: "Phone", column_number: 1, sort_order: 1 },
      { title: "Business IP Number", path: "/business-ip-number", description: "Official 096 IP numbers for companies", icon: "Phone", column_number: 1, sort_order: 2 },
      { title: "Virtual Number", path: "/virtual-number", description: "Local & international DID incoming numbers", icon: "Phone", column_number: 1, sort_order: 3 },
      { title: "Call Center", path: "/call-center", description: "Omnichannel contact center platform", icon: "Headphones", column_number: 2, sort_order: 1 },
      { title: "Auto Dialer", path: "/auto-dialer", description: "Automated high-speed outbound dialer", icon: "Bot", badge: "AI", column_number: 2, sort_order: 2 },
      { title: "Voice Broadcast", path: "/voice-broadcast", description: "Bulk voice message broadcast campaigns", icon: "Sparkles", column_number: 2, sort_order: 3 },
      { title: "IP Phone", path: "/ip-phone", description: "Desktop VoIP phones & SIP hardware devices", icon: "ShoppingBag", column_number: 3, sort_order: 1 },
    ],
  },
  {
    title: "Solutions",
    path: "#",
    is_dropdown: 1,
    sort_order: 3,
    children: [
      { title: "Startups & SMBs", path: "/packages", description: "Affordable calling & quick onboarding", icon: "Sparkles", column_number: 1, sort_order: 1 },
      { title: "Enterprise PBX", path: "/packages", description: "High-volume dedicated infrastructure", icon: "Server", column_number: 1, sort_order: 2 },
      { title: "E-Commerce Hotlines", path: "/features", description: "Customer care & order confirmations", icon: "ShoppingBag", column_number: 2, sort_order: 1 },
      { title: "Financial & FinTech", path: "/solutions/fintech", description: "Secure encrypted voice verifications", icon: "Shield", column_number: 2, sort_order: 2 },
      { title: "Remote Workforce", path: "/solutions/remote-workforce", description: "Softphone connectivity on PC & Mobile", icon: "Users", column_number: 3, sort_order: 1 },
    ],
  },
  {
    title: "Features",
    path: "#",
    is_dropdown: 1,
    sort_order: 4,
    children: [
      { title: "AI Bangla Voice TTS", path: "/ai-calling-automation", description: "Natural neural Bangla text-to-speech & AI agents", icon: "Bot", badge: "AI", column_number: 1, sort_order: 1 },
      { title: "Call Recording", path: "/features/call-recording", description: "Encrypted cloud audio recording archive", icon: "FileText", column_number: 1, sort_order: 2 },
      { title: "Multi-Device Ringing", path: "/features/multi-device-ringing", description: "Simultaneous ringing across 5 devices", icon: "Phone", column_number: 2, sort_order: 1 },
      { title: "Caller Tune Branding", path: "/shop", description: "Custom corporate greeting music", icon: "Sparkles", column_number: 2, sort_order: 2 },
      { title: "Smart IVR Routing", path: "/features/smart-ivr-routing", description: "Automated interactive voice menus", icon: "Zap", column_number: 3, sort_order: 1 },
    ],
  },
  {
    title: "Call Packages",
    path: "/packages",
    is_dropdown: 0,
    sort_order: 5,
    children: [],
  },
  {
    title: "Developers",
    path: "#",
    is_dropdown: 1,
    sort_order: 6,
    children: [
      { title: "REST & Voice APIs", path: "/contact", description: "Programmable telecom HTTP endpoints", icon: "Code", column_number: 1, sort_order: 1 },
      { title: "SIP Trunking Docs", path: "/contact", description: "Connect Asterisk, FreePBX & 3CX", icon: "Server", column_number: 1, sort_order: 2 },
      { title: "SDKs & Integration", path: "/contact", description: "Node.js, Python, PHP client libraries", icon: "FileText", column_number: 2, sort_order: 1 },
      { title: "Webhook Callbacks", path: "/contact", description: "Real-time CDR events and status hooks", icon: "Zap", column_number: 2, sort_order: 2 },
      { title: "API Status & SLA", path: "/contact", description: "99.98% telecom uptime and health status", icon: "Shield", column_number: 3, sort_order: 1 },
    ],
  },
  {
    title: "Resources",
    path: "#",
    is_dropdown: 1,
    sort_order: 7,
    children: [
      { title: "Product Guides", path: "/resources/product-guides", description: "Setup manuals and softphone tutorials", icon: "FileText", column_number: 1, sort_order: 1 },
      { title: "Hardware Catalog", path: "/shop", description: "Certified VoIP phones & headsets", icon: "ShoppingBag", column_number: 1, sort_order: 2 },
      { title: "FAQ & Helpdesk", path: "/resources/faq-helpdesk", description: "Frequently asked questions & guides", icon: "LifeBuoy", column_number: 2, sort_order: 1 },
      { title: "Support Tickets", path: "/contact", description: "24/7 technical customer support team", icon: "Headphones", column_number: 2, sort_order: 2 },
      { title: "Compliance & BTRC", path: "/resources/compliance-btrc", description: "Official IPTSP telecom license terms", icon: "Shield", column_number: 3, sort_order: 1 },
    ],
  },
  {
    title: "Company",
    path: "#",
    is_dropdown: 1,
    sort_order: 8,
    children: [
      { title: "About MyBDPhone", path: "/about", description: "Leading telecom AI pioneer in Bangladesh", icon: "Users", column_number: 1, sort_order: 1 },
      { title: "Why Choose Us", path: "/why-choose-us", description: "Enterprise reliability & lowest call rates", icon: "Sparkles", column_number: 1, sort_order: 2 },
      { title: "Support HQ", path: "/contact", description: "Gulshan Dhaka office and live support", icon: "MapPin", column_number: 2, sort_order: 1 },
      { title: "Instant Recharge", path: "/user/recharge", description: "Top up calling balance with bKash/Nagad", icon: "Wallet", column_number: 2, sort_order: 2 },
      { title: "Customer Portal", path: "/user/dashboard", description: "Manage CDR, billing & AI campaigns", icon: "LayoutDashboard", column_number: 3, sort_order: 1 },
    ],
  },
];

// Ensure navigation_items table exists
const ensureNavigationTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS navigation_items (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      path VARCHAR(255) NOT NULL DEFAULT '#',
      parent_id INT UNSIGNED NULL,
      column_number INT NOT NULL DEFAULT 1,
      is_dropdown BOOLEAN NOT NULL DEFAULT 0,
      icon VARCHAR(50) NULL,
      badge VARCHAR(50) NULL,
      description VARCHAR(255) NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_visible BOOLEAN NOT NULL DEFAULT 1,
      target VARCHAR(20) NOT NULL DEFAULT '_self',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES navigation_items(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Check if table is empty, if so seed default menu
  const [rows] = await pool.query("SELECT COUNT(*) as cnt FROM navigation_items");
  if (rows[0].cnt === 0) {
    await seedDefaultNavigation();
  } else {
    // Migrate any legacy support/knowledgebase links to contact
    try {
      await pool.query("UPDATE navigation_items SET path='/contact' WHERE path IN ('/support', '/knowledgebase', '/help')");
      await pool.query("UPDATE navigation_items SET path='/user/recharge' WHERE (title LIKE '%Instant Recharge%' OR title LIKE '%Recharge%') AND (path='/login' OR path='#')");
      await pool.query("UPDATE navigation_items SET path='/user/dashboard' WHERE (title LIKE '%Customer Portal%' OR title LIKE '%Portal%') AND (path='/login' OR path='#')");
    } catch (e) {}
  }

  await syncProductNavigationLinks();
};

// Seed default navigation items
const seedDefaultNavigation = async () => {
  for (const mainItem of DEFAULT_MENU_STRUCTURE) {
    const [res] = await pool.query(
      `INSERT INTO navigation_items (title, path, parent_id, column_number, is_dropdown, sort_order, is_visible)
       VALUES (?, ?, NULL, 1, ?, ?, 1)`,
      [mainItem.title, mainItem.path, mainItem.is_dropdown ? 1 : 0, mainItem.sort_order]
    );

    const parentId = res.insertId;

    if (mainItem.children && mainItem.children.length > 0) {
      for (const child of mainItem.children) {
        await pool.query(
          `INSERT INTO navigation_items (title, path, parent_id, column_number, is_dropdown, icon, badge, description, sort_order, is_visible)
           VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, 1)`,
          [
            child.title,
            child.path,
            parentId,
            child.column_number || 1,
            child.icon || null,
            child.badge || null,
            child.description || null,
            child.sort_order || 0,
          ]
        );
      }
    }
  }
};


// Keep the Product dropdown links aligned with the dedicated CMS landing pages.
// Existing databases are updated without changing their visibility/settings.
const syncProductNavigationLinks = async () => {
  const links = [
    ["Cloud PBX", "/cloud-pbx"],
    ["Business IP Number", "/business-ip-number"],
    ["Virtual Number", "/virtual-number"],
    ["Call Center", "/call-center"],
    ["Auto Dialer", "/auto-dialer"],
    ["Voice Broadcast", "/voice-broadcast"],
    ["IP Phone", "/ip-phone"],
    ["AI Bangla Voice TTS", "/ai-calling-automation"],
    ["AI Calling & Voice Automation", "/ai-calling-automation"],
    ["Call Recording", "/features/call-recording"],
    ["Call Recording & Audio Storage", "/features/call-recording"],
    ["Smart IVR Routing", "/features/smart-ivr-routing"],
    ["Why Choose Us", "/why-choose-us"],
    ["Financial & FinTech", "/solutions/fintech"],
    ["Financial & FinTech Solutions", "/solutions/fintech"],
    ["Remote Workforce", "/solutions/remote-workforce"],
    ["Remote Workforce Solutions", "/solutions/remote-workforce"],
  ];
  for (const [title, path] of links) {
    await pool.query(
      "UPDATE navigation_items SET path=? WHERE title=? AND parent_id IS NOT NULL",
      [path, title]
    );
  }
};

// GET PUBLIC NAVIGATION (For Header Navbar on Desktop & Mobile)
const getPublicNavigation = async (req, res) => {
  try {
    await ensureNavigationTable();

    const [rows] = await pool.query(
      `SELECT * FROM navigation_items WHERE is_visible = 1 ORDER BY sort_order ASC, id ASC`
    );

    // Build hierarchy
    const mainItems = rows.filter((item) => item.parent_id === null);
    const childItems = rows.filter((item) => item.parent_id !== null);

    const tree = mainItems.map((main) => {
      const children = childItems.filter((c) => c.parent_id === main.id);

      // Group children into columns 1, 2, 3
      const columns = {
        1: children.filter((c) => (c.column_number || 1) === 1).sort((a, b) => a.sort_order - b.sort_order),
        2: children.filter((c) => (c.column_number || 1) === 2).sort((a, b) => a.sort_order - b.sort_order),
        3: children.filter((c) => (c.column_number || 1) === 3).sort((a, b) => a.sort_order - b.sort_order),
      };

      return {
        ...main,
        columns,
        children,
        has_dropdown: main.is_dropdown === 1 || children.length > 0,
      };
    });

    return res.json({
      success: true,
      navigation: tree,
    });
  } catch (error) {
    console.error("GET PUBLIC NAVIGATION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching navigation menu",
    });
  }
};

// GET ALL NAVIGATION ITEMS (Admin Full Tree + Flat List)
const getAllNavigationAdmin = async (req, res) => {
  try {
    await ensureNavigationTable();

    const [rows] = await pool.query(
      `SELECT * FROM navigation_items ORDER BY sort_order ASC, id ASC`
    );

    const mainItems = rows.filter((item) => item.parent_id === null);
    const childItems = rows.filter((item) => item.parent_id !== null);

    const tree = mainItems.map((main) => {
      const children = childItems.filter((c) => c.parent_id === main.id);

      const columns = {
        1: children.filter((c) => (c.column_number || 1) === 1).sort((a, b) => a.sort_order - b.sort_order),
        2: children.filter((c) => (c.column_number || 1) === 2).sort((a, b) => a.sort_order - b.sort_order),
        3: children.filter((c) => (c.column_number || 1) === 3).sort((a, b) => a.sort_order - b.sort_order),
      };

      return {
        ...main,
        columns,
        children,
      };
    });

    // Extract all category options (for dropdown category selectors)
    const dropdownCategories = mainItems
      .filter((m) => m.is_dropdown === 1 || childItems.some((c) => c.parent_id === m.id))
      .map((m) => ({ id: m.id, title: m.title }));

    return res.json({
      success: true,
      tree,
      flatList: rows,
      dropdownCategories,
      mainItems,
    });
  } catch (error) {
    console.error("GET ALL NAVIGATION ADMIN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching navigation tree",
    });
  }
};

// CREATE NAVIGATION ITEM
const createNavigationItem = async (req, res) => {
  try {
    await ensureNavigationTable();

    const {
      title,
      path = "#",
      parent_id = null,
      column_number = 1,
      is_dropdown = false,
      icon = null,
      badge = null,
      description = null,
      sort_order = 0,
      is_visible = true,
      target = "_self",
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Menu item title is required",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO navigation_items 
       (title, path, parent_id, column_number, is_dropdown, icon, badge, description, sort_order, is_visible, target)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        path.trim() || "#",
        parent_id ? parseInt(parent_id, 10) : null,
        parseInt(column_number, 10) || 1,
        is_dropdown ? 1 : 0,
        icon ? icon.trim() : null,
        badge ? badge.trim() : null,
        description ? description.trim() : null,
        parseInt(sort_order, 10) || 0,
        is_visible ? 1 : 0,
        target || "_self",
      ]
    );

    const [created] = await pool.query("SELECT * FROM navigation_items WHERE id = ?", [result.insertId]);

    return res.status(201).json({
      success: true,
      message: "Navigation item added successfully!",
      item: created[0],
    });
  } catch (error) {
    console.error("CREATE NAVIGATION ITEM ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating menu item",
    });
  }
};

// UPDATE NAVIGATION ITEM
const updateNavigationItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      path,
      parent_id,
      column_number,
      is_dropdown,
      icon,
      badge,
      description,
      sort_order,
      is_visible,
      target,
    } = req.body;

    const [existing] = await pool.query("SELECT * FROM navigation_items WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    const current = existing[0];

    const updatedTitle = title !== undefined ? title.trim() : current.title;
    const updatedPath = path !== undefined ? path.trim() : current.path;
    const updatedParentId = parent_id !== undefined ? (parent_id ? parseInt(parent_id, 10) : null) : current.parent_id;
    const updatedColumn = column_number !== undefined ? parseInt(column_number, 10) : current.column_number;
    const updatedIsDropdown = is_dropdown !== undefined ? (is_dropdown ? 1 : 0) : current.is_dropdown;
    const updatedIcon = icon !== undefined ? (icon ? icon.trim() : null) : current.icon;
    const updatedBadge = badge !== undefined ? (badge ? badge.trim() : null) : current.badge;
    const updatedDescription = description !== undefined ? (description ? description.trim() : null) : current.description;
    const updatedSortOrder = sort_order !== undefined ? parseInt(sort_order, 10) : current.sort_order;
    const updatedIsVisible = is_visible !== undefined ? (is_visible ? 1 : 0) : current.is_visible;
    const updatedTarget = target !== undefined ? target : current.target;

    await pool.query(
      `UPDATE navigation_items 
       SET title = ?, path = ?, parent_id = ?, column_number = ?, is_dropdown = ?, icon = ?, badge = ?, description = ?, sort_order = ?, is_visible = ?, target = ?
       WHERE id = ?`,
      [
        updatedTitle,
        updatedPath,
        updatedParentId,
        updatedColumn,
        updatedIsDropdown,
        updatedIcon,
        updatedBadge,
        updatedDescription,
        updatedSortOrder,
        updatedIsVisible,
        updatedTarget,
        id,
      ]
    );

    const [updated] = await pool.query("SELECT * FROM navigation_items WHERE id = ?", [id]);

    return res.json({
      success: true,
      message: "Navigation item updated successfully!",
      item: updated[0],
    });
  } catch (error) {
    console.error("UPDATE NAVIGATION ITEM ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating menu item",
    });
  }
};

// TOGGLE ITEM VISIBILITY
const toggleItemVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query("SELECT id, is_visible FROM navigation_items WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    const newVisibility = existing[0].is_visible === 1 ? 0 : 1;
    await pool.query("UPDATE navigation_items SET is_visible = ? WHERE id = ?", [newVisibility, id]);

    return res.json({
      success: true,
      message: `Item visibility set to ${newVisibility === 1 ? "Visible" : "Hidden"}`,
      is_visible: newVisibility,
    });
  } catch (error) {
    console.error("TOGGLE VISIBILITY ERROR:", error);
    return res.status(500).json({ success: false, message: "Error toggling visibility" });
  }
};

// DELETE NAVIGATION ITEM
const deleteNavigationItem = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query("SELECT * FROM navigation_items WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    // Delete item and any children
    await pool.query("DELETE FROM navigation_items WHERE id = ? OR parent_id = ?", [id, id]);

    return res.json({
      success: true,
      message: "Menu item removed successfully!",
    });
  } catch (error) {
    console.error("DELETE NAVIGATION ITEM ERROR:", error);
    return res.status(500).json({ success: false, message: "Error deleting item" });
  }
};

// BULK REORDER / MOVE DRAG & DROP
const reorderNavigation = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { items } = req.body; // Array of { id, parent_id, column_number, sort_order, is_dropdown }

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: "Expected items array for reordering" });
    }

    await connection.beginTransaction();

    for (const item of items) {
      if (item.id) {
        await connection.query(
          `UPDATE navigation_items 
           SET parent_id = ?, column_number = ?, sort_order = ?, is_dropdown = COALESCE(?, is_dropdown)
           WHERE id = ?`,
          [
            item.parent_id ? parseInt(item.parent_id, 10) : null,
            item.column_number ? parseInt(item.column_number, 10) : 1,
            item.sort_order !== undefined ? parseInt(item.sort_order, 10) : 0,
            item.is_dropdown !== undefined ? (item.is_dropdown ? 1 : 0) : null,
            item.id,
          ]
        );
      }
    }

    await connection.commit();

    return res.json({
      success: true,
      message: "Navigation hierarchy and ordering saved to database successfully!",
    });
  } catch (error) {
    await connection.rollback();
    console.error("REORDER NAVIGATION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating menu ordering",
    });
  } finally {
    connection.release();
  }
};

// RESET DEFAULT NAVIGATION
const resetDefaultNavigation = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Remove all existing navigation items
    await connection.query("DELETE FROM navigation_items");

    // Insert defaults
    for (const mainItem of DEFAULT_MENU_STRUCTURE) {
      const [resMain] = await connection.query(
        `INSERT INTO navigation_items (title, path, parent_id, column_number, is_dropdown, sort_order, is_visible)
         VALUES (?, ?, NULL, 1, ?, ?, 1)`,
        [mainItem.title, mainItem.path, mainItem.is_dropdown ? 1 : 0, mainItem.sort_order]
      );

      const parentId = resMain.insertId;

      if (mainItem.children && mainItem.children.length > 0) {
        for (const child of mainItem.children) {
          await connection.query(
            `INSERT INTO navigation_items (title, path, parent_id, column_number, is_dropdown, icon, badge, description, sort_order, is_visible)
             VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, 1)`,
            [
              child.title,
              child.path,
              parentId,
              child.column_number || 1,
              child.icon || null,
              child.badge || null,
              child.description || null,
              child.sort_order || 0,
            ]
          );
        }
      }
    }

    await connection.commit();

    return res.json({
      success: true,
      message: "Navigation menu has been reset to default telecom structure!",
    });
  } catch (error) {
    await connection.rollback();
    console.error("RESET DEFAULT NAVIGATION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error resetting navigation menu",
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getPublicNavigation,
  getAllNavigationAdmin,
  createNavigationItem,
  updateNavigationItem,
  toggleItemVisibility,
  deleteNavigationItem,
  reorderNavigation,
  resetDefaultNavigation,
  ensureNavigationTable,
};

