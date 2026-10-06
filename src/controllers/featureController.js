const pool = require("../config/db");

// DEFAULT SEED FOR MULTI-DEVICE RINGING
const DEFAULT_MULTI_DEVICE_RINGING = {
  slug: "multi-device-ringing",
  title: "Multi-Device Ringing",
  subtitle: "Simultaneous & Intelligent Call Routing Across 5 Devices",
  hero_description:
    "Never miss a critical client inquiry. When customers call your 096 IP number, ring your IP desk phone, laptop browser, PC softphone, and mobile devices concurrently. The first answered device connects the call with zero delay.",
  is_active: 1,
  sections: [
    {
      section_key: "overview_stats",
      title: "Enterprise Concurrency Standards",
      display_order: 1,
      content: {
        eyebrow: "UNIFIED TELEPHONY PRESENCE",
        stats: [
          { label: "Max Devices Per Line", value: "5 Endpoints", icon: "Smartphone" },
          { label: "SIP Ringing Latency", value: "< 120ms", icon: "Zap" },
          { label: "Call Capture Rate", value: "99.8%", icon: "ShieldCheck" },
          { label: "Device Compatibility", value: "SIP / WebRTC", icon: "Globe2" },
        ],
      },
    },
    {
      section_key: "device_manager",
      title: "Interactive Connected Devices Manager",
      display_order: 2,
      content: {
        eyebrow: "SIMULATE LIVE ENDPOINTS",
        description:
          "Simulate and test how inbound calls ring across your active hardware and softphone terminals in real-time.",
        primary_number: "096490123756",
        extensions: [
          { id: "101", name: "Executive Office Line (Primary)", number: "096490123756" },
          { id: "102", name: "Sales Hotdesk Ring Group", number: "096490123757" },
          { id: "103", name: "Support Escalation Queue", number: "096490123758" },
        ],
        devices: [
          {
            id: "d1",
            name: "Office Desk Phone",
            type: "Grandstream GXP1625",
            platform: "Hardware SIP",
            icon: "PhoneCall",
            status: "Registered",
            is_active: true,
            extension: "101-A",
            ring_delay: "0s",
          },
          {
            id: "d2",
            name: "Work Laptop (WebRTC)",
            type: "Chrome / Edge Browser",
            platform: "WebRTC Portal",
            icon: "Laptop",
            status: "Online",
            is_active: true,
            extension: "101-B",
            ring_delay: "0s",
          },
          {
            id: "d3",
            name: "Executive Android App",
            type: "GS Wave / Linphone",
            platform: "Android SIP",
            icon: "Smartphone",
            status: "Online (4G)",
            is_active: true,
            extension: "101-C",
            ring_delay: "0s",
          },
          {
            id: "d4",
            name: "Home Desktop Softphone",
            type: "MicroSIP Windows",
            platform: "Windows App",
            icon: "Monitor",
            status: "Registered",
            is_active: true,
            extension: "101-D",
            ring_delay: "0s",
          },
          {
            id: "d5",
            name: "Manager iPhone Softphone",
            type: "iOS SIP Client",
            platform: "Apple iOS",
            icon: "Smartphone",
            status: "Standby (Push)",
            is_active: false,
            extension: "101-E",
            ring_delay: "5s",
          },
        ],
      },
    },
    {
      section_key: "ringing_strategies",
      title: "Flexible Ringing Strategies & Routing Modes",
      display_order: 3,
      content: {
        eyebrow: "DISPATCH LOGIC",
        description:
          "Tailor how incoming voice traffic is distributed to match your workflow and team availability.",
        modes: [
          {
            id: "simultaneous",
            name: "Simultaneous Ringing (Forking)",
            badge: "RECOMMENDED",
            description:
              "All 5 connected devices ring immediately at the exact same moment. The first device to answer connects the call while the other devices stop ringing cleanly.",
            icon: "Radio",
            benefits: [
              "Fastest response time",
              "Zero missed calls",
              "Best for urgent sales inquiries",
            ],
          },
          {
            id: "sequential",
            name: "Sequential / Cascade Ringing",
            badge: "HIERARCHY",
            description:
              "Rings your primary desk phone for 10 seconds. If unanswered, it cascades to your mobile app for 15 seconds, then routes to an escalation teammate.",
            icon: "Layers",
            benefits: [
              "Priority-based routing",
              "Reduces mobile interruptions",
              "Great for solo executives",
            ],
          },
          {
            id: "hunt_group",
            name: "Hunt Group & Round Robin",
            badge: "TEAM QUEUE",
            description:
              "Distributes incoming calls evenly across team member endpoints to prevent agent burnout and maintain optimal talk workloads.",
            icon: "Users",
            benefits: [
              "Fair load balancing",
              "Reduces caller wait time",
              "Ideal for support helpdesks",
            ],
          },
        ],
      },
    },
    {
      section_key: "timeout_fallback",
      title: "Smart Timeout & Failover Fallback Rules",
      display_order: 4,
      content: {
        eyebrow: "FAILSAFE AUTOMATION",
        description:
          "Define automated actions if all connected endpoints are busy, offline, or unanswered.",
        default_timeout: 25,
        fallbacks: [
          {
            id: "voicemail",
            title: "Corporate Voicemail to Email",
            description:
              "Callers record high-definition voice messages sent immediately to your email inbox with MP3 audio attachment.",
            icon: "FileAudio",
          },
          {
            id: "forward_pstn",
            title: "Emergency GSM / Mobile Forwarding",
            description:
              "Instantly forward the call over Bangladesh mobile network (Grameenphone, Banglalink, Robi, Teletalk) if internet is disconnected.",
            icon: "PhoneForwarded",
          },
          {
            id: "ivr_overflow",
            title: "Interactive IVR Routing Menu",
            description:
              "Redirect caller to an automated voice menu to press 1 for Support, 2 for Sales, or leave a callback request.",
            icon: "Route",
          },
        ],
      },
    },
    {
      section_key: "technical_flow",
      title: "Technical Call Flow & Architecture",
      display_order: 5,
      content: {
        eyebrow: "CARRIER-GRADE TELECOM ENGINE",
        description:
          "How MyBDPhone Cloud PBX manages multi-device SIP registration and parallel dispatch in milliseconds.",
        steps: [
          {
            step: "01",
            title: "SIP Registration & Keep-Alive",
            tag: "PRESENCE SYNC",
            description:
              "All 5 user terminals establish persistent TLS/UDP SIP registration with the MyBDPhone carrier core using NAT traversal keep-alive pings.",
            icon: "Cpu",
          },
          {
            step: "02",
            title: "096 Inbound Call Ingestion",
            tag: "CARRIER INGESTION",
            description:
              "When a customer dials your 096 IP number, the Bangladeshi PSTN/IPTSP trunk directs the call to our ultra-low latency routing switch.",
            icon: "PhoneIncoming",
          },
          {
            step: "03",
            title: "Parallel Multi-Endpoint Dispatch",
            tag: "SIMULTANEOUS FORK",
            description:
              "The routing engine queries active presence states and simultaneously broadcasts SIP INVITE packets to all 5 connected endpoints.",
            icon: "Radio",
          },
          {
            step: "04",
            title: "First-Answer Bridging & Auto Cancel",
            tag: "MEDIA ESTABLISHMENT",
            description:
              "The first device answering sends a 200 OK signal. Audio media (RTP) bridges instantly and SIP CANCEL terminates ringing on all other devices.",
            icon: "CheckCircle2",
          },
        ],
      },
    },
    {
      section_key: "faq",
      title: "Frequently Asked Questions",
      display_order: 6,
      content: {
        eyebrow: "COMMON INQUIRIES",
        items: [
          {
            q: "Do all 5 devices need to be on the same WiFi network?",
            a: "No. Your devices can be anywhere in the world on different internet connections — 4G/5G mobile data, office broadband, or home WiFi. As long as they are connected to the internet, they will ring simultaneously.",
          },
          {
            q: "Will multiple devices answering cause duplicate charges?",
            a: "No. Only the device that answers first establishes the call. Inbound calls to your 096 IP number are always completely free with unlimited incoming minutes.",
          },
          {
            q: "Can I transfer the call to another device after answering?",
            a: "Yes! You can perform seamless attended or blind transfers to any extension or external mobile number directly using in-call shortcodes (e.g. *2) or our softphone UI.",
          },
          {
            q: "What happens if my phone battery dies or internet drops?",
            a: "Our automated failover routing immediately kicks in and forwards the call to your configured fallback destination, such as voicemail or regular mobile GSM forwarding.",
          },
        ],
      },
    },
    {
      section_key: "cta",
      title: "Ready to Enable Multi-Device Ringing for Your Business?",
      display_order: 7,
      content: {
        eyebrow: "GET CONNECTED TODAY",
        subtitle:
          "Activate an official 096 IP Phone number with full multi-device ringing support in under 10 minutes.",
        primary_text: "Get 096 IP Phone",
        primary_url: "/ip-phone",
        secondary_text: "View All Packages",
        secondary_url: "/packages",
      },
    },
  ],
};

const DEFAULT_SMART_IVR_ROUTING = {
  slug: "smart-ivr-routing",
  title: "Smart IVR Routing",
  subtitle: "Intelligent Voice Response & Dynamic Call Distribution Engine",
  hero_description:
    "Route incoming calls intelligently with our AI-powered IVR system. Automatically identify VIP callers, check business hours, match skill-based agents, and deliver every call to the right destination — in milliseconds.",
  is_active: 1,
  sections: [
    {
      section_key: "overview_stats",
      title: "Enterprise IVR Performance Metrics",
      display_order: 1,
      content: {
        eyebrow: "INTELLIGENT CALL ROUTING",
        stats: [
          { label: "Average Route Time", value: "< 200ms", icon: "Zap" },
          { label: "Routing Accuracy", value: "99.9%", icon: "ShieldCheck" },
          { label: "Availability", value: "24/7 Automated", icon: "Clock" },
          { label: "Routing Rules", value: "Unlimited", icon: "Layers" },
        ],
      },
    },
    {
      section_key: "key_features",
      title: "Core IVR Capabilities",
      display_order: 2,
      content: {
        eyebrow: "FEATURE HIGHLIGHTS",
        features: [
          {
            id: "crm_caller_id",
            title: "CRM-Integrated Caller ID",
            description:
              "Instantly identify callers from your CRM database and route VIP clients to priority agents with personalized greetings.",
            icon: "Users",
          },
          {
            id: "time_routing",
            title: "Time-Based Routing",
            description:
              "Automatically adjust routing rules based on business hours, holidays, and regional time zones across Bangladesh.",
            icon: "Clock",
          },
          {
            id: "skill_matching",
            title: "Skill-Based Agent Matching",
            description:
              "Match callers to the most qualified available agent based on language preference, department, and expertise level.",
            icon: "Sliders",
          },
          {
            id: "dtmf_menus",
            title: "Multi-Level DTMF Menus",
            description:
              "Create unlimited nested IVR menus with professional voice prompts in both Bangla and English languages.",
            icon: "PhoneCall",
          },
        ],
      },
    },
    {
      section_key: "how_it_works",
      title: "How Smart IVR Routing Works",
      display_order: 3,
      content: {
        eyebrow: "STEP-BY-STEP FLOW",
        steps: [
          {
            step: "01",
            title: "Customer Dials Your 096 Number",
            description:
              "The call enters MyBDPhone's carrier-grade SIP trunk via Bangladesh PSTN/IPTSP interconnect.",
            icon: "PhoneIncoming",
          },
          {
            step: "02",
            title: "IVR Engine Processes Call",
            description:
              "Caller ID lookup, CRM database match, time-zone check, and routing rule evaluation happen in under 200 milliseconds.",
            icon: "Cpu",
          },
          {
            step: "03",
            title: "Smart Routing Decision",
            description:
              "Based on matched rules, the call is routed to the optimal destination — VIP direct line, skill-matched agent, or IVR menu.",
            icon: "Route",
          },
          {
            step: "04",
            title: "Agent Connection",
            description:
              "The selected agent's device rings and the call connects seamlessly with full context passed to the agent's screen.",
            icon: "Headphones",
          },
        ],
      },
    },
    {
      section_key: "use_cases",
      title: "Industry Use Cases",
      display_order: 4,
      content: {
        eyebrow: "REAL-WORLD APPLICATIONS",
        cases: [
          {
            title: "Enterprise Call Center",
            description:
              "Route thousands of daily calls to skill-matched agents with zero manual intervention and optimal load distribution.",
            icon: "Headphones",
          },
          {
            title: "Medical Clinic Reception",
            description:
              "After-hours calls routed to on-call doctor's mobile, daytime calls to reception desk with appointment prompts.",
            icon: "ShieldCheck",
          },
          {
            title: "E-commerce Support",
            description:
              "VIP customers bypass queue entirely, order-related calls go to logistics, returns routed to support specialists.",
            icon: "Globe2",
          },
        ],
      },
    },
    {
      section_key: "benefits",
      title: "Why Choose Smart IVR Routing",
      display_order: 5,
      content: {
        eyebrow: "BUSINESS IMPACT",
        items: [
          { title: "Reduce Wait Times", description: "Callers reach the right agent on the first try, eliminating transfers and hold music.", icon: "Zap" },
          { title: "Increase First-Call Resolution", description: "Skill-based matching ensures the most qualified agent handles each inquiry.", icon: "CheckCircle2" },
          { title: "24/7 Automated Routing", description: "IVR runs continuously without human operators, handling calls during holidays and off-hours.", icon: "Clock" },
          { title: "CRM Integration", description: "Pull caller history, purchase records, and VIP status automatically from your business database.", icon: "Users" },
          { title: "Multi-Language Support", description: "Serve callers in Bangla, English, or any configured language with professional voice prompts.", icon: "Globe2" },
          { title: "Detailed Analytics", description: "Track routing decisions, call volumes, agent performance, and abandonment rates in real-time.", icon: "Layers" },
        ],
      },
    },
    {
      section_key: "faq",
      title: "Frequently Asked Questions",
      display_order: 6,
      content: {
        eyebrow: "COMMON INQUIRIES",
        items: [
          {
            q: "What is Smart IVR Routing?",
            a: "Smart IVR Routing is an intelligent call distribution system that automatically analyzes incoming calls and routes them to the best available agent or department based on caller identity, business hours, skill requirements, and custom rules — all in under 200 milliseconds.",
          },
          {
            q: "Can I customize IVR menus in Bangla?",
            a: "Yes! You can create unlimited multi-level IVR menus with professional voice prompts in both Bangla and English. Our AI Bangla Voice TTS engine can also generate natural-sounding prompts automatically.",
          },
          {
            q: "How does skill-based routing work?",
            a: "Each agent is tagged with skills (language proficiency, department expertise, product knowledge). When a call arrives, the IVR engine matches the caller's needs with available agents' skill tags and routes to the best match.",
          },
          {
            q: "What happens during after-hours?",
            a: "You can configure time-based rules to automatically route calls to voicemail, on-call staff mobile numbers, or a customized after-hours IVR menu. Different rules can apply to weekends, holidays, and specific time zones.",
          },
          {
            q: "Is there a limit on routing rules?",
            a: "No! You can create unlimited routing rules with multiple conditions, priorities, and fallback chains. Rules can be based on caller ID, time of day, geographic region, DTMF input, CRM data, and more.",
          },
        ],
      },
    },
    {
      section_key: "cta",
      title: "Ready to Automate Your Call Routing?",
      display_order: 7,
      content: {
        eyebrow: "GET STARTED TODAY",
        subtitle:
          "Set up Smart IVR Routing for your 096 IP Phone number in minutes. No hardware required.",
        primary_text: "Get 096 IP Phone",
        primary_url: "/ip-phone",
        secondary_text: "View All Packages",
        secondary_url: "/packages",
      },
    },
  ],
};

const parseJson = (val, fallback = {}) => {
  if (!val) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
};

// Ensure tables exist & seed default page
async function ensureFeatureTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feature_pages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(100) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        subtitle TEXT,
        hero_description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS feature_sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_id INT NOT NULL,
        section_key VARCHAR(100) NOT NULL,
        title VARCHAR(255),
        content JSON,
        display_order INT DEFAULT 0,
        FOREIGN KEY (page_id) REFERENCES feature_pages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check if multi-device-ringing exists
    const [rows] = await pool.query(
      "SELECT id FROM feature_pages WHERE slug = ? LIMIT 1",
      [DEFAULT_MULTI_DEVICE_RINGING.slug]
    );

    let pageId;
    if (!rows.length) {
      const [res] = await pool.query(
        `INSERT INTO feature_pages (slug, title, subtitle, hero_description, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        [
          DEFAULT_MULTI_DEVICE_RINGING.slug,
          DEFAULT_MULTI_DEVICE_RINGING.title,
          DEFAULT_MULTI_DEVICE_RINGING.subtitle,
          DEFAULT_MULTI_DEVICE_RINGING.hero_description,
          1,
        ]
      );
      pageId = res.insertId;

      // Insert default sections
      for (const s of DEFAULT_MULTI_DEVICE_RINGING.sections) {
        await pool.query(
          `INSERT INTO feature_sections (page_id, section_key, title, content, display_order)
           VALUES (?, ?, ?, ?, ?)`,
          [pageId, s.section_key, s.title, JSON.stringify(s.content), s.display_order]
        );
      }
      console.log("✓ Created default feature page: multi-device-ringing");
    }

    // Seed smart-ivr-routing if it doesn't exist
    const [ivrRows] = await pool.query(
      "SELECT id FROM feature_pages WHERE slug = ? LIMIT 1",
      [DEFAULT_SMART_IVR_ROUTING.slug]
    );

    if (!ivrRows.length) {
      const [ivrRes] = await pool.query(
        `INSERT INTO feature_pages (slug, title, subtitle, hero_description, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        [
          DEFAULT_SMART_IVR_ROUTING.slug,
          DEFAULT_SMART_IVR_ROUTING.title,
          DEFAULT_SMART_IVR_ROUTING.subtitle,
          DEFAULT_SMART_IVR_ROUTING.hero_description,
          1,
        ]
      );
      const ivrPageId = ivrRes.insertId;

      for (const s of DEFAULT_SMART_IVR_ROUTING.sections) {
        await pool.query(
          `INSERT INTO feature_sections (page_id, section_key, title, content, display_order)
           VALUES (?, ?, ?, ?, ?)`,
          [ivrPageId, s.section_key, s.title, JSON.stringify(s.content), s.display_order]
        );
      }
      console.log("✓ Created default feature page: smart-ivr-routing");
    }
  } catch (err) {
    console.error("ensureFeatureTables error:", err);
  }
}

// PUBLIC: GET FEATURE PAGE BY SLUG
const getPublicFeaturePage = async (req, res) => {
  try {
    const slug = String(req.params.slug || "").trim().toLowerCase();
    if (!slug) {
      return res.status(400).json({ success: false, message: "Slug is required" });
    }

    // Ensure tables & seed defaults exist
    await ensureFeatureTables();

    const [pageRows] = await pool.query(
      "SELECT * FROM feature_pages WHERE slug = ? AND is_active = 1 LIMIT 1",
      [slug]
    );

    if (!pageRows.length) {
      return res.status(404).json({ success: false, message: "Feature page not found" });
    }

    const page = pageRows[0];
    const [sectionRows] = await pool.query(
      "SELECT * FROM feature_sections WHERE page_id = ? ORDER BY display_order ASC, id ASC",
      [page.id]
    );

    const sections = sectionRows.map((s) => ({
      ...s,
      content: parseJson(s.content, {}),
    }));

    return res.json({
      success: true,
      page,
      sections,
    });
  } catch (err) {
    console.error("GET FEATURE PAGE ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error fetching feature page" });
  }
};

// ADMIN: GET ALL FEATURE PAGES
const getAdminFeaturePages = async (req, res) => {
  try {
    await ensureFeatureTables();
    const [pages] = await pool.query(
      "SELECT * FROM feature_pages ORDER BY created_at DESC"
    );

    const fullPages = [];
    for (const page of pages) {
      const [sections] = await pool.query(
        "SELECT * FROM feature_sections WHERE page_id = ? ORDER BY display_order ASC, id ASC",
        [page.id]
      );
      fullPages.push({
        ...page,
        sections: sections.map((s) => ({ ...s, content: parseJson(s.content, {}) })),
      });
    }

    return res.json({ success: true, pages: fullPages });
  } catch (err) {
    console.error("ADMIN GET FEATURE PAGES ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ADMIN: CREATE FEATURE PAGE
const createAdminFeaturePage = async (req, res) => {
  try {
    const { slug, title, subtitle, hero_description, is_active = 1, sections = [] } = req.body;
    if (!slug || !title) {
      return res.status(400).json({ success: false, message: "Slug and title are required" });
    }

    const cleanSlug = String(slug).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const [result] = await pool.query(
      `INSERT INTO feature_pages (slug, title, subtitle, hero_description, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [cleanSlug, title, subtitle || "", hero_description || "", is_active ? 1 : 0]
    );

    const pageId = result.insertId;

    if (Array.isArray(sections) && sections.length > 0) {
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        await pool.query(
          `INSERT INTO feature_sections (page_id, section_key, title, content, display_order)
           VALUES (?, ?, ?, ?, ?)`,
          [pageId, s.section_key || `section_${i + 1}`, s.title || "", JSON.stringify(s.content || {}), s.display_order || i + 1]
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: "Feature page created successfully",
      id: pageId,
    });
  } catch (err) {
    console.error("CREATE FEATURE PAGE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.code === "ER_DUP_ENTRY" ? "Slug already exists" : "Server error",
    });
  }
};

// ADMIN: UPDATE FEATURE PAGE
const updateAdminFeaturePage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, hero_description, is_active, sections } = req.body;

    await pool.query(
      `UPDATE feature_pages
       SET
         title = COALESCE(?, title),
         subtitle = COALESCE(?, subtitle),
         hero_description = COALESCE(?, hero_description),
         is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [title, subtitle, hero_description, is_active, id]
    );

    // If sections array is provided, update or replace sections
    if (Array.isArray(sections)) {
      await pool.query("DELETE FROM feature_sections WHERE page_id = ?", [id]);
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        await pool.query(
          `INSERT INTO feature_sections (page_id, section_key, title, content, display_order)
           VALUES (?, ?, ?, ?, ?)`,
          [id, s.section_key || `section_${i + 1}`, s.title || "", JSON.stringify(s.content || {}), s.display_order || i + 1]
        );
      }
    }

    return res.json({
      success: true,
      message: "Feature page updated successfully!",
    });
  } catch (err) {
    console.error("UPDATE FEATURE PAGE ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ADMIN: DELETE FEATURE PAGE
const deleteAdminFeaturePage = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM feature_pages WHERE id = ?", [id]);
    return res.json({ success: true, message: "Feature page deleted successfully" });
  } catch (err) {
    console.error("DELETE FEATURE PAGE ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  ensureFeatureTables,
  getPublicFeaturePage,
  getAdminFeaturePages,
  createAdminFeaturePage,
  updateAdminFeaturePage,
  deleteAdminFeaturePage,
};
