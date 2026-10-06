const pool = require('./src/config/db');

async function seed() {
  console.log('Starting seed for solutions/fintech...');
  
  // 1. Create Page
  await pool.query(`
    INSERT INTO cms_pages (slug, title, meta_title, meta_description, status)
    VALUES (
      'solutions/fintech', 
      'Financial & FinTech Communication Solutions', 
      'Financial & FinTech Voice & Calling Solutions | MyBDPhone', 
      'Secure, compliant, and automated IP communication solutions designed for banks, MFS, fintech, and microfinance institutions.', 
      'published'
    )
    ON DUPLICATE KEY UPDATE 
      title = VALUES(title),
      meta_title = VALUES(meta_title),
      meta_description = VALUES(meta_description),
      status = 'published'
  `);

  const [pages] = await pool.query(`SELECT id FROM cms_pages WHERE slug = 'solutions/fintech' LIMIT 1`);
  if (!pages.length) {
    throw new Error('Could not find or create page solutions/fintech');
  }
  const pageId = pages[0].id;
  console.log('Page ID:', pageId);

  // Clear existing sections for this page to avoid duplicates
  await pool.query(`DELETE FROM cms_sections WHERE page_id = ?`, [pageId]);

  // 2. Hero Section
  await pool.query(`
    INSERT INTO cms_sections (page_id, section_key, section_type, title, subtitle, content_body, image_url, layout_orientation, display_order, is_visible)
    VALUES (?, 'hero', 'HERO', 
      'Financial & FinTech Communication Solutions', 
      'FINTECH & BANKING TELECOM ENGINE', 
      'Automate verification, loan collection reminders, customer support, and secure transaction alerts with high-reliability IP voice infrastructure.', 
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44', 
      'IMAGE_RIGHT', 0, TRUE
    )
  `, [pageId]);

  // 3. Solutions Grid
  await pool.query(`
    INSERT INTO cms_sections (page_id, section_key, section_type, title, subtitle, custom_settings, display_order, is_visible)
    VALUES (?, 'solutions_grid', 'SOLUTIONS_GRID', 
      'Core Financial Voice Solutions', 
      'Tailored voice communication channels for high-security fintech environments.', 
      ?, 1, TRUE
    )
  `, [pageId, JSON.stringify({
    solutions: [
      { title: "Business IP Number", desc: "Official corporate numbers for bank trust and brand consistency.", icon: "Building2" },
      { title: "Cloud PBX", desc: "Multi-department call routing for main offices and field branches.", icon: "Server" },
      { title: "IVR & Call Routing", desc: "Automated self-service menu for account balance, queries, and support.", icon: "PhoneCall" },
      { title: "Customer Support Calling", desc: "Centralized helpdesk engine for agent management and call queueing.", icon: "Headphones" },
      { title: "Payment & Collection Calls", desc: "Automated AI reminder calls for EMI, loan dues, and bill payments.", icon: "CreditCard" },
      { title: "Verification Calls", desc: "Secure OTP voice delivery and account verification systems.", icon: "ShieldCheck" }
    ]
  })]);

  // 4. Key Features
  await pool.query(`
    INSERT INTO cms_sections (page_id, section_key, section_type, title, subtitle, custom_settings, display_order, is_visible)
    VALUES (?, 'key_features', 'KEY_FEATURES', 
      'Built for High-Compliance Security', 
      'Essential call features for compliance, quality control, and automation.', 
      ?, 2, TRUE
    )
  `, [pageId, JSON.stringify({
    features: [
      { title: "Call Recording", desc: "Encrypted cloud voice recording for security and audit requirements.", icon: "Mic" },
      { title: "Call History & Logs", desc: "Real-time call logs and downloadable reports.", icon: "FileText" },
      { title: "Multi-Agent & Extensions", desc: "Assign extensions to agents, branch managers, and field staff.", icon: "Users" },
      { title: "AI Calling Engine", desc: "Localized Bangla AI voice assistant for smart customer outreach.", icon: "Bot" },
      { title: "Auto Dialer", desc: "Broadcast payment reminders and campaign notices automatically.", icon: "Zap" },
      { title: "Call Monitoring", desc: "Live agent call listening, whisper, and barging features.", icon: "Eye" }
    ]
  })]);

  // 5. Packages
  await pool.query(`
    INSERT INTO cms_sections (page_id, section_key, section_type, title, subtitle, custom_settings, display_order, is_visible)
    VALUES (?, 'packages', 'PACKAGES', 
      'FinTech Tailored Packages', 
      'Choose the right plan designed for your financial operation size.', 
      ?, 3, TRUE
    )
  `, [pageId, JSON.stringify({
    packages: [
      {
        name: "FinTech Starter",
        price: "৳2,999",
        period: "/month",
        features: ["1 Virtual/IP Number", "Up to 5 Agent Extensions", "Basic IVR Routing", "Call Recording (30 Days)", "Standard Email Support"],
        cta: "Choose Starter",
        popular: false
      },
      {
        name: "FinTech Growth",
        price: "৳6,999",
        period: "/month",
        features: ["2 Official IP Numbers", "Up to 20 Agent Extensions", "Smart Multi-Level IVR", "Auto Dialer & Payment Reminders", "Call Recording (90 Days)", "24/7 Support"],
        cta: "Choose Growth",
        popular: true
      },
      {
        name: "Enterprise Banking",
        price: "Custom",
        period: "",
        features: ["Unlimited Extensions", "Dedicated SIP Trunking", "Custom AI Voice Agent Integration", "On-Premise / Cloud Deployment", "BTRC Compliance SLA", "Dedicated Account Manager"],
        cta: "Contact Enterprise",
        popular: false
      }
    ]
  })]);

  // 6. Why Choose
  await pool.query(`
    INSERT INTO cms_sections (page_id, section_key, section_type, title, subtitle, custom_settings, display_order, is_visible)
    VALUES (?, 'why_choose', 'WHY_CHOOSE', 
      'Why FinTechs Trust MyBDPhone', 
      'Engineered for reliability, enterprise security, and compliance.', 
      ?, 4, TRUE
    )
  `, [pageId, JSON.stringify({
    points: [
      { title: "Centralized Communication", desc: "Manage multi-branch banking and online customer support from one dashboard." },
      { title: "Easy Management", desc: "Instant agent provisioning, live monitoring, and automated reports." },
      { title: "High Scalability", desc: "Handle spikes in verification calls and payment campaign volumes effortlessly." },
      { title: "Reliable Support", desc: "Dedicated 24/7 local support and regulatory compliance backing." }
    ]
  })]);

  // 7. Final CTA
  await pool.query(`
    INSERT INTO cms_sections (page_id, section_key, section_type, title, subtitle, custom_settings, display_order, is_visible)
    VALUES (?, 'final_cta', 'FINAL_CTA', 
      'Ready to upgrade your financial communication?', 
      'Empower your financial institution with secure, automated IP voice solutions.', 
      ?, 5, TRUE
    )
  `, [pageId, JSON.stringify({
    primary_btn: { text: "Get Started", url: "/packages" },
    secondary_btn: { text: "Talk to Specialist", url: "/contact" }
  })]);

  // Update navigation items path for Financial & FinTech
  await pool.query(`UPDATE navigation_items SET path = '/solutions/fintech', is_visible = 1 WHERE title LIKE '%FinTech%' OR title LIKE '%Financial%'`);

  console.log('Seeding completed successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
