const pool = require("../config/db");

// =========================================================================
// TABLE CREATION & INITIAL SEEDING
// =========================================================================

const ensureResourceTables = async () => {
  try {
    // 1. Resource Pages Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resource_pages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        subtitle TEXT NULL,
        meta_title VARCHAR(255) NULL,
        meta_desc TEXT NULL,
        status ENUM('published', 'draft', 'inactive') NOT NULL DEFAULT 'published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Resource Sections Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resource_sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_id INT NOT NULL,
        section_key VARCHAR(100) NULL,
        section_type VARCHAR(100) NOT NULL DEFAULT 'HERO',
        title VARCHAR(255) NULL,
        subtitle VARCHAR(255) NULL,
        content LONGTEXT NULL,
        content_json JSON NULL,
        image_url VARCHAR(1000) NULL,
        align ENUM('left', 'center', 'right') NOT NULL DEFAULT 'left',
        sort_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Product Guides Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_guides (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        category VARCHAR(100) NOT NULL DEFAULT 'General',
        short_desc TEXT NULL,
        full_content LONGTEXT NULL,
        featured_image VARCHAR(1000) NULL,
        icon VARCHAR(100) NULL DEFAULT 'FileText',
        read_time VARCHAR(50) DEFAULT '5 min read',
        is_popular BOOLEAN NOT NULL DEFAULT 0,
        is_published BOOLEAN NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Resource FAQs Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resource_faqs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(100) NOT NULL DEFAULT 'General',
        question VARCHAR(500) NOT NULL,
        answer LONGTEXT NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Hardware Products Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hardware_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        model_name VARCHAR(255) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        brand VARCHAR(100) NOT NULL DEFAULT 'Grandstream',
        device_type VARCHAR(100) NOT NULL DEFAULT 'IP Phone',
        short_desc TEXT NULL,
        key_specs_json JSON NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        is_available BOOLEAN NOT NULL DEFAULT 1,
        main_image VARCHAR(1000) NULL,
        gallery_json JSON NULL,
        features_json JSON NULL,
        warranty VARCHAR(100) DEFAULT '1 Year Official Warranty',
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check & Add missing columns on existing tables
    try {
      const [pCols] = await pool.query("DESCRIBE resource_pages");
      const pColNames = pCols.map(c => c.Field);
      if (!pColNames.includes("subtitle")) {
        await pool.query("ALTER TABLE resource_pages ADD COLUMN subtitle TEXT NULL AFTER title");
      }
      if (!pColNames.includes("meta_title")) {
        await pool.query("ALTER TABLE resource_pages ADD COLUMN meta_title VARCHAR(255) NULL");
      }
      if (!pColNames.includes("meta_desc")) {
        await pool.query("ALTER TABLE resource_pages ADD COLUMN meta_desc TEXT NULL");
      }

      const [gCols] = await pool.query("DESCRIBE product_guides");
      const gColNames = gCols.map(c => c.Field);
      if (!gColNames.includes("icon")) {
        await pool.query("ALTER TABLE product_guides ADD COLUMN icon VARCHAR(100) NULL DEFAULT 'FileText'");
      }
      if (!gColNames.includes("sort_order")) {
        await pool.query("ALTER TABLE product_guides ADD COLUMN sort_order INT NOT NULL DEFAULT 0");
      }
    } catch (migErr) {
      console.warn("Resource columns check notice:", migErr.message);
    }

    // Check and seed initial default data
    await seedInitialResourceData();
  } catch (error) {
    console.error("ensureResourceTables Error:", error.message);
  }
};

const seedInitialResourceData = async () => {
  try {
    // -------------------------------------------------------------
    // 1. Seed or Upsert Standard Resource Pages
    // -------------------------------------------------------------
    // Cleanup removed support/knowledgebase resource pages
    try {
      await pool.query("DELETE FROM resource_sections WHERE page_id IN (SELECT id FROM resource_pages WHERE slug IN ('support', 'knowledgebase', 'help'))");
      await pool.query("DELETE FROM resource_pages WHERE slug IN ('support', 'knowledgebase', 'help')");
    } catch (e) {}

    const defaultPages = [
      {
        slug: "product-guides",
        title: "MyBDPhone Product & User Guides",
        subtitle: "Learn how to configure, set up, and manage your IP Phone, Cloud PBX, and Calling Apps step-by-step.",
        meta_title: "Product & User Guides - MyBDPhone",
        meta_desc: "Step-by-step documentation for IP Phone setup, Cloud PBX routing, Virtual Numbers, Auto Dialer, and Softphone configuration.",
      },
      {
        slug: "faq-helpdesk",
        title: "Frequently Asked Questions & Support",
        subtitle: "Find instant answers to common questions about your account, packages, IP phone, and billing.",
        meta_title: "FAQ & Helpdesk Support - MyBDPhone",
        meta_desc: "Instant answers for account activation, recharge methods, calling packages, IP phone hardware, and Cloud PBX features.",
      },
      {
        slug: "compliance-btrc",
        title: "Telecom Compliance, Privacy & BTRC Guidelines",
        subtitle: "Official regulatory information, user verification (KYC), privacy, and security commitments.",
        meta_title: "BTRC Telecom Compliance & KYC Framework - MyBDPhone",
        meta_desc: "Official BTRC IPTSP licensing compliance, mandatory KYC verification, anti-spam policies, and data privacy safeguards.",
      },
      {
        slug: "resources",
        title: "MyBDPhone Knowledge Base & Resources Hub",
        subtitle: "Everything you need to configure, deploy, and scale enterprise telephony in Bangladesh.",
        meta_title: "Resources & Knowledge Base - MyBDPhone",
        meta_desc: "Explore product manuals, softphone guides, SIP trunking tutorials, hardware catalog, and 24/7 technical support documentation.",
      },
      {
        slug: "compliance",
        title: "BTRC Compliance, Licensing & Regulatory Framework",
        subtitle: "Full regulatory compliance with Bangladesh Telecommunication Regulatory Commission standards.",
        meta_title: "BTRC Compliance & Telecommunications Regulations - MyBDPhone",
        meta_desc: "Official BTRC licensing compliance, IPTSP service standards, KYC requirements, and telecom regulatory documentation.",
      }
    ];

    for (const page of defaultPages) {
      await pool.query(
        `INSERT INTO resource_pages (slug, title, subtitle, meta_title, meta_desc, status)
         VALUES (?, ?, ?, ?, ?, 'published')
         ON DUPLICATE KEY UPDATE 
           title=VALUES(title),
           subtitle=VALUES(subtitle),
           meta_title=VALUES(meta_title),
           meta_desc=VALUES(meta_desc)`,
        [page.slug, page.title, page.subtitle, page.meta_title, page.meta_desc]
      );

      // Also ensure cms_pages has this page synced
      await pool.query(
        `INSERT INTO cms_pages (title, slug, template, content_html, featured_image, seo_title, seo_description, meta_title, meta_description, status, sort_order)
         VALUES (?, ?, 'landing', '', '', ?, ?, ?, ?, 'published', 20)
         ON DUPLICATE KEY UPDATE
           title=VALUES(title),
           seo_title=VALUES(seo_title),
           seo_description=VALUES(seo_description),
           meta_title=VALUES(meta_title),
           meta_description=VALUES(meta_description)`,
        [page.title, page.slug, page.meta_title || page.title, page.meta_desc || page.subtitle || '', page.meta_title || page.title, page.meta_desc || page.subtitle || '']
      );
    }

    // -------------------------------------------------------------
    // 2. Seed Compliance & BTRC Sections
    // -------------------------------------------------------------
    const [compPageRows] = await pool.query("SELECT id FROM resource_pages WHERE slug IN ('compliance-btrc', 'compliance')");
    for (const compRow of compPageRows) {
      const pId = compRow.id;
      const [secCount] = await pool.query("SELECT COUNT(*) as count FROM resource_sections WHERE page_id = ?", [pId]);
      if (secCount[0].count === 0) {
        await pool.query(`
          INSERT INTO resource_sections (page_id, section_key, section_type, title, subtitle, content, content_json, align, sort_order, is_active)
          VALUES
          (?, 'btrc_info', 'BTRC_INFO', 'BTRC Licensing & Official Telecom Directives', 'Approved IP-TSP operations and nationwide interconnectivity standards.', 'MyBDPhone operates strictly under valid IPTSP licenses issued by the Bangladesh Telecommunication Regulatory Commission (BTRC). All 096 number allocations, white-listed CLI routing, and SIP trunk interconnections adhere to national telecommunications laws.', '{"eyebrow":"OFFICIAL REGULATORY APPROVAL","license_number":"BTRC/LL/IPTSP/2023-096","interconnect_operators":["Grameenphone","Banglalink","Robi Axiata","Teletalk","BTCL Landline"],"badges":["BTRC Licensed IPTSP Operator","White-Listed 096 Calling Lines","End-to-End Telecom Compliance"]}', 'left', 1, 1),
          (?, 'kyc_verification', 'KYC_REQUIREMENTS', 'Number Registration & User Verification (KYC)', 'Mandatory subscriber verification requirements for corporate and individual lines.', 'To prevent unauthorized telecommunication misuse and satisfy national security regulations, every 096 subscriber must complete identity verification before activation.', '{"eyebrow":"MANDATORY SUBSCRIBER ONBOARDING","documents":[{"type":"Corporate Subscriber","requirements":["Valid Trade License Copy","Company TIN / BIN Certificate","National ID (NID) of Authorized Managing Director","Formal Authorization Letter on Company Letterhead","Passport Size Color Photograph"]},{"type":"Individual / Freelancer Subscriber","requirements":["Clear Scanned Copy of Bangladeshi National ID (Smart Card / NID)","Recent Passport Size Photograph","Valid Mobile Number for OTP Verification","Personal Address Verification Document"]}]}', 'left', 2, 1),
          (?, 'responsible_usage', 'USAGE_POLICIES', 'Responsible Telephony & Anti-Spam Guidelines', 'Zero-tolerance policy against illegal VoIP termination and automated spam.', 'Our platform implements automated fraud detection algorithms and real-time CDR analytics to guarantee ethical enterprise calling.', '{"eyebrow":"SAFE & COMPLIANT TELEPHONY","rules":[{"title":"Anti-Spam & Robocall Restrictions","desc":"Automated calling campaigns must adhere to permissible calling hours (9 AM - 8 PM) and respect Do-Not-Disturb (DND) registries."},{"title":"CLI Masking & Spoofing Prohibition","desc":"Originating caller IDs must strictly match registered 096 numbers assigned to the verified entity. Spoofing is illegal under Bangladesh law."},{"title":"Illegal Call Termination & Bypass Prevention","desc":"Bypassing official international gateways (IGW) or unauthorized grey routing results in immediate line termination and regulatory reporting."},{"title":"Call Recording Consent","desc":"Businesses deploying call recording must notify callers via automated IVR disclaimers for transparency and legal validity."}]}', 'left', 3, 1),
          (?, 'privacy_security', 'SECURITY_STANDARDS', 'Data Privacy, Encryption & Security Standards', 'Military-grade encryption and secure telecom infrastructure in tier-3 Dhaka data centers.', 'All customer call data records, customer CRM metadata, and audio archives are safeguarded with multi-layered bank-grade security.', '{"eyebrow":"ENTERPRISE DATA PROTECTION","features":[{"title":"AES-256 Cloud Encryption","desc":"Rest and in-transit encryption for all voice streams and recorded MP3/WAV audio files."},{"title":"Lawful Interception & Audit Trails","desc":"Immutable CDR logs and tamper-proof access audit trails compliant with regulatory mandates."},{"title":"Multi-Factor Authentication","desc":"Strict MFA enforcement and IP white-listing for admin and agent SIP dashboards."},{"title":"99.98% High Availability SLA","desc":"Redundant SIP switches across dual Dhaka data centers with automatic carrier failover."}]}', 'left', 4, 1),
          (?, 'legal_policies', 'LEGAL_DOCS_ACCORDION', 'Official Terms, Privacy Policy & Refund Policy', 'Detailed legal agreements governing service delivery and subscription usage.', '', '{"eyebrow":"LEGAL DISCLOSURES","policies":[{"id":"terms","title":"Terms & Conditions of Telecom Service","last_updated":"October 2026","content":"These Terms and Conditions govern the provision of IP Telephony, Cloud PBX, and AI Calling Services by MyBDPhone. By activating an account, the subscriber agrees to comply with all BTRC regulations, timely subscription renewals, and ethical usage standards. Unauthorized reselling of calling lines or CLI manipulation is strictly prohibited."},{"id":"privacy","title":"Subscriber Privacy & Data Protection Policy","last_updated":"October 2026","content":"MyBDPhone respects subscriber confidentiality. We collect personal and corporate documentation solely for regulatory KYC compliance and billing verification. Call recordings are stored in encrypted vaults and are never accessed by third parties without lawful judicial warrant."},{"id":"refund","title":"Wallet Balance & Subscription Refund Policy","last_updated":"October 2026","content":"Unused calling wallet balances remain valid for 365 days from the last recharge. Hardware devices returned within 7 days in original packaging with intact warranty seals are eligible for replacement or credit note. Monthly PBX package fees are non-refundable once the billing cycle begins."}]}', 'left', 5, 1)
        `, [pId, pId, pId, pId, pId]);
      }
    }

    // Also sync cms_sections for cms_pages with slug compliance-btrc
    const [cmsCompRows] = await pool.query("SELECT id FROM cms_pages WHERE slug IN ('compliance-btrc', 'compliance')");
    for (const cmsCompRow of cmsCompRows) {
      const cId = cmsCompRow.id;
      const [cSecCount] = await pool.query("SELECT COUNT(*) as count FROM cms_sections WHERE page_id = ?", [cId]);
      if (cSecCount[0].count === 0) {
        await pool.query(`
          INSERT INTO cms_sections (page_id, section_key, section_type, title, subtitle, content_body, content_html, settings, display_order, sort_order, status)
          VALUES
          (?, 'btrc_info', 'btrc_info', 'BTRC Licensing & Official Telecom Directives', 'Approved IP-TSP operations and nationwide interconnectivity standards.', 'MyBDPhone operates strictly under valid IPTSP licenses issued by BTRC.', '', '{"license_number":"BTRC/LL/IPTSP/2023-096"}', 1, 1, 'active'),
          (?, 'kyc_verification', 'kyc_requirements', 'Number Registration & User Verification (KYC)', 'Mandatory subscriber verification requirements for corporate and individual lines.', 'Every 096 subscriber must complete identity verification before activation.', '', '{}', 2, 2, 'active'),
          (?, 'responsible_usage', 'usage_policies', 'Responsible Telephony & Anti-Spam Guidelines', 'Zero-tolerance policy against illegal VoIP termination and automated spam.', 'Our platform implements automated fraud detection algorithms.', '', '{}', 3, 3, 'active'),
          (?, 'privacy_security', 'security_standards', 'Data Privacy, Encryption & Security Standards', 'Military-grade encryption and secure telecom infrastructure in tier-3 Dhaka data centers.', 'All call data records are safeguarded with multi-layered bank-grade security.', '', '{}', 4, 4, 'active'),
          (?, 'legal_policies', 'legal_docs_accordion', 'Official Terms, Privacy Policy & Refund Policy', 'Detailed legal agreements governing service delivery and subscription usage.', '', '', '{}', 5, 5, 'active')
        `, [cId, cId, cId, cId, cId]);
      }
    }

    // -------------------------------------------------------------
    // 3. Seed 6 Core Popular Knowledgebase Guides
    // -------------------------------------------------------------
    const seedGuides = [
      {
        slug: "how-to-recharge-your-account",
        title: "How to Recharge Your Account",
        category: "Billing & Recharge",
        icon: "ReceiptText",
        read_time: "3 min read",
        is_popular: 1,
        short_desc: "Learn how to add balance to your MyBDPhone account.",
        full_content: `
### 1. Adding Balance to Calling Wallet
- Open User Portal &gt; **Billing & Top-up** (or Recharge).
- Enter your desired recharge amount (Minimum ৳100 up to ৳25,000).
- Select your preferred payment method: **bKash, Nagad, Rocket, DGePay, Moneybag**, or **Manual Payment**.

### 2. Instant Payment Gateway vs Manual Payment
- **Instant Gateway:** Pay via bKash/Nagad/Rocket/Cards on the secure gateway. Your account wallet is credited immediately.
- **Manual Payment:** Send money to our official Merchant / Agent number, enter your Transaction ID and attach the payment screenshot.

### 3. Verification & Balance Confirmation
- Instant payments automatically generate a Mushak-6.3 VAT receipt and update your dashboard balance.
- Manual payment submissions are verified by admin within 10 to 30 minutes.
        `
      },
      {
        slug: "how-to-set-up-your-ip-phone",
        title: "How to Set Up Your IP Phone",
        category: "IP Phone & Number",
        icon: "PhoneCall",
        read_time: "5 min read",
        is_popular: 1,
        short_desc: "Follow the basic steps to configure your IP phone.",
        full_content: `
### 1. Hardware Connection
- Connect the Ethernet network cable from your router or switch to the **LAN/Internet** port of your IP Phone.
- Connect the handset coil cord and plug in the power adapter (or use PoE).

### 2. Accessing the Web Configuration Interface
- Check your phone screen to find its local IP address (e.g. \`192.168.1.150\`).
- Open your computer browser and enter the IP address. Log in with admin credentials.

### 3. Configuring SIP Account
Navigate to **Account** &gt; **Account 1** &gt; **General Settings**:
- **SIP Server:** \`sip.mybdphone.com\` (Port: 5060)
- **SIP User ID / Extension:** Your 096 line number (e.g., \`09649012375\`)
- **Authentication ID:** Same as your 096 extension
- **SIP Password:** Your secret SIP password from User Dashboard &gt; My IP Phone

### 4. Codecs & Audio Settings
- Set audio codec preference to **G.711u** and **G.729** for HD Bangla voice clarity.
- Click **Save & Apply**.
        `
      },
      {
        slug: "how-to-use-mybdphone-on-android",
        title: "How to Use MyBDPhone on Android",
        category: "Apps & Devices",
        icon: "Smartphone",
        read_time: "4 min read",
        is_popular: 1,
        short_desc: "Learn how to connect and use your IP number on Android.",
        full_content: `
### 1. Download Softphone App
- Open Google Play Store on your Android device.
- Search and install **Grandstream Wave (GS Wave)**, **Linphone**, or **Zoiper**.

### 2. Enter SIP Credentials
- Open the app &gt; **Settings** &gt; **Account Settings** &gt; **Add Account (+)**.
- **Account Name:** MyBDPhone Line
- **SIP Server:** \`sip.mybdphone.com:5060\`
- **SIP User ID:** Your 096 extension number
- **Password:** Your SIP password from User Portal

### 3. Background Push Notifications
- Enable **Keep Alive in Background / Push Notifications** in the app settings so incoming calls ring your mobile even when the phone is locked.
- Allow Microphone and Notification permissions when prompted.
        `
      },
      {
        slug: "how-to-check-your-call-history",
        title: "How to Check Your Call History",
        category: "IP Phone & Number",
        icon: "Layers",
        read_time: "2 min read",
        is_popular: 1,
        short_desc: "View your recent calls and call details.",
        full_content: `
### 1. Navigate to Call History
- Log in to your MyBDPhone User Portal.
- From the sidebar, click on **Call History** or **Financial Ledger**.

### 2. Filtering Calls & Logs
- Filter calls by **Incoming**, **Outgoing**, or **Missed**.
- Select custom date ranges to audit daily or monthly calling volumes.

### 3. Call Details & Recordings
- View detailed call metadata including duration (seconds/minutes), destination operator, and exact balance deduction.
- For packages with call recording enabled, click the **Play** button to listen to crystal-clear call audio or download MP3 archives.
        `
      },
      {
        slug: "how-to-activate-a-monthly-package",
        title: "How to Activate a Monthly Package",
        category: "Packages & Subscription",
        icon: "Bot",
        read_time: "3 min read",
        is_popular: 1,
        short_desc: "Learn how to select and activate a monthly package.",
        full_content: `
### 1. Browse Available Packages
- Visit the **Services & Packages** section from your User Dashboard or top navigation bar.
- Compare Starter, Business, and Enterprise IP Phone and Cloud PBX monthly plans.

### 2. Choose Subscription & Payment Method
- Click **Activate Package** or **Subscribe**.
- Choose your preferred payment option:
  - **Wallet Balance Deduction:** Instantly activates using your available account balance.
  - **Online Gateway Checkout:** Pay securely via DGePay, Moneybag, bKash, or Card.

### 3. Automated Activation
- Your package benefits (channels, extension limits, free minutes, and PBX features) are unlocked immediately upon payment confirmation.
        `
      },
      {
        slug: "why-is-my-payment-pending",
        title: "Why Is My Payment Pending?",
        category: "Troubleshooting",
        icon: "ShieldCheck",
        read_time: "3 min read",
        is_popular: 1,
        short_desc: "Understand payment status and approval process.",
        full_content: `
### 1. Manual Payments Require Verification
- When you make a **Manual Payment** (sending money to our bKash/Nagad/Bank merchant number manually), your transaction status is set to **Pending**.
- Our billing operations team inspects your submitted Transaction ID, amount, and receipt document to prevent fraud before approving.

### 2. Automated Gateway Payments
- If you pay via **DGePay** or **Moneybag** gateway, payments that complete successfully are marked **Completed** immediately without needing admin approval.
- If you cancel or close the gateway window, the transaction status becomes **Canceled** or **Processing**.

### 3. How to Expedite Approval
- Ensure the Transaction ID you submitted matches your SMS receipt exactly.
- If your pending payment takes longer than 30 minutes, create a **Support Ticket** with your Transaction ID for high-priority review.
        `
      }
    ];

    for (const guide of seedGuides) {
      await pool.query(
        `INSERT INTO product_guides (slug, title, category, icon, read_time, is_popular, is_published, short_desc, full_content)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
         ON DUPLICATE KEY UPDATE 
           title=VALUES(title),
           category=VALUES(category),
           icon=VALUES(icon),
           read_time=VALUES(read_time),
           is_popular=VALUES(is_popular),
           short_desc=VALUES(short_desc),
           full_content=VALUES(full_content)`,
        [guide.slug, guide.title, guide.category, guide.icon, guide.read_time, guide.is_popular, guide.short_desc, guide.full_content]
      );
    }

    // -------------------------------------------------------------
    // 4. Seed FAQs across all required 7 categories
    // -------------------------------------------------------------
    const seedFaqs = [
      // 6 Core Knowledgebase FAQs
      {
        category: "Billing & Recharge",
        question: "How can I recharge my account?",
        answer: "Open your User Dashboard → Billing & Top-up (Recharge), enter the amount you wish to add (from ৳100 to ৳25,000), select your preferred payment method (bKash, Nagad, Rocket, DGePay, Moneybag, or Manual payment), and complete the payment. Your wallet balance is updated instantly for automated gateway payments or upon quick admin review for manual payments.",
        sort_order: 1
      },
      {
        category: "Packages & Subscription",
        question: "How can I activate a package?",
        answer: "Navigate to Services & Packages from your dashboard or top navigation bar, select the IP Phone or Cloud PBX package that fits your business needs, and click 'Get Started' or 'Subscribe'. You can pay using your wallet balance or complete instant checkout via DGePay/bKash. Features activate immediately upon payment.",
        sort_order: 2
      },
      {
        category: "Apps & Devices",
        question: "How can I use my IP number on mobile?",
        answer: "Download a recommended softphone app such as Grandstream Wave (GS Wave), Linphone, or Zoiper from Google Play Store or Apple App Store. Open the app, go to Settings → Add SIP Account, and enter your SIP Domain (sip.mybdphone.com:5060), Extension ID (e.g. 09649012375), and SIP Password from your User Dashboard.",
        sort_order: 3
      },
      {
        category: "Account & Security",
        question: "Where can I find my SIP password?",
        answer: "Log in to your User Portal and click on 'My 096 IP Phone' or 'Account details'. Under your Active SIP Account card, you will find your SIP Server Host, Extension ID, and a secure password box with a reveal/copy button.",
        sort_order: 4
      },
      // Packages
      {
        category: "Troubleshooting",
        question: "Why is my payment pending?",
        answer: "If you made a manual payment (sending money directly to our merchant number or bank account), your transaction status remains 'Pending' while our admin team verifies your Transaction ID and proof document. If you pay via automated gateways (DGePay/Moneybag), your payment completes instantly. If a gateway payment is canceled or closed midway, it will show Canceled or Processing.",
        sort_order: 5
      },
      {
        category: "Account & Security",
        question: "How can I change my password?",
        answer: "Go to User Dashboard → Security & Password (or Profile). In the Security tab, enter your current password, type your new secure password, confirm it, and click 'Save Changes'. You will receive an instant confirmation notification.",
        sort_order: 6
      },
      // IP Phone
      {
        category: "IP Phone",
        question: "How can I configure my IP Phone?",
        answer: "Connect your IP desk phone (Yealink, Grandstream, Fanvil, or Cisco) to your local network router. Access the phone's web GUI using its IP address, enter your SIP Server (`sip.mybdphone.com`), Extension User ID, and SIP Password found under User Portal → My IP Phone.",
        sort_order: 7
      },
      {
        category: "IP Phone",
        question: "Why is my number not working or showing unregistered?",
        answer: "Common causes include: 1) Expired account wallet balance; 2) Pending KYC document verification; 3) SIP ALG enabled on your internet router (please disable SIP ALG); 4) Incorrect SIP password. Check your User Dashboard status or contact support.",
        sort_order: 8
      },
      // Virtual Number
      {
        category: "Virtual Number",
        question: "Can I receive calls from any mobile operator across Bangladesh?",
        answer: "Yes. Official 096 IP numbers are fully interconnected across all Bangladesh mobile operators (Grameenphone, Banglalink, Robi Axiata, Teletalk), BTCL landlines, and international telecom carriers with crystal-clear HD audio.",
        sort_order: 9
      },
      {
        category: "Virtual Number",
        question: "How long does virtual number provisioning take?",
        answer: "Once your KYC documentation is submitted and approved by our compliance desk, your 096 Virtual Number and SIP credentials are provisioned automatically within 10 to 30 minutes.",
        sort_order: 10
      },
      // Cloud PBX
      {
        category: "Cloud PBX",
        question: "How do I configure IVR menus and dynamic call routing?",
        answer: "Navigate to Cloud PBX → IVR Settings in your portal. Upload custom audio greetings or use our Bangla Neural TTS engine. You can map keypad buttons (e.g. 1 for Sales, 2 for Support) and define after-hours schedules in minutes.",
        sort_order: 11
      },
      {
        category: "Cloud PBX",
        question: "Does Cloud PBX include cloud call recording?",
        answer: "Yes! Dual-channel stereo call recording is included. Audio files are encrypted at rest with AES-256 and stored in your cloud archive for 90 days with in-browser playback, waveform scrubbers, and MP3 download options.",
        sort_order: 12
      },
      // Calls & Caller Tune
      {
        category: "Calls & Caller Tune",
        question: "How can I check my call history?",
        answer: "Log in to your User Portal and navigate to Call History. You can filter incoming, outgoing, and missed calls, view exact call durations and tariff deductions, and listen to or download call recordings.",
        sort_order: 13
      },
      {
        category: "Calls & Caller Tune",
        question: "How do I set up a custom corporate Caller Tune?",
        answer: "You can activate the Caller Tune add-on for only ৳99/month from our Digital Services Shop. Upload your custom company audio greeting or promotional jingle (MP3 format) from User Portal → Caller Tune Settings.",
        sort_order: 14
      },
      {
        category: "Account & Login",
        question: "How can I contact support?",
        answer: "You can reach our Dhaka technical support desk 24/7 via: 1) Hotline: 096490123756; 2) Email: support@mybdphone.com; 3) Creating a Priority Support Ticket directly from User Portal → Support Tickets.",
        sort_order: 15
      }
    ];

    for (const faq of seedFaqs) {
      const [existing] = await pool.query(
        "SELECT id FROM resource_faqs WHERE question = ? LIMIT 1",
        [faq.question]
      );
      if (!existing.length) {
        await pool.query(
          `INSERT INTO resource_faqs (category, question, answer, sort_order, is_active)
           VALUES (?, ?, ?, ?, 1)`,
          [faq.category, faq.question, faq.answer, faq.sort_order]
        );
      } else {
        await pool.query(
          `UPDATE resource_faqs SET category=?, answer=?, sort_order=? WHERE id=?`,
          [faq.category, faq.answer, faq.sort_order, existing[0].id]
        );
      }
    }

    console.log("✓ Dynamic Resources (Product Guides, FAQ & Helpdesk, Compliance & BTRC) successfully seeded/verified.");
  } catch (error) {
    console.error("seedInitialResourceData Error:", error.message);
  }
};

// =========================================================================
// PUBLIC API CONTROLLERS
// =========================================================================

// 1. GET PUBLIC RESOURCE PAGE BY SLUG (Supports product-guides, faq-helpdesk, compliance-btrc, resources, compliance)
const getPublicResourcePage = async (req, res) => {
  try {
    await ensureResourceTables();
    const { slug } = req.params;
    const cleanSlug = String(slug || "").trim().toLowerCase();

    // Map common slug aliases
    const slugMap = {
      "guides": "product-guides",
      "product-guide": "product-guides",
      "faq": "faq-helpdesk",
      "faqs": "faq-helpdesk",
      "helpdesk": "faq-helpdesk",
      "compliance": "compliance-btrc",
      "btrc": "compliance-btrc",
      "btrc-compliance": "compliance-btrc",
    };

    const targetSlug = slugMap[cleanSlug] || cleanSlug;

    // Fetch page details
    const [pages] = await pool.query(
      "SELECT * FROM resource_pages WHERE slug = ? OR slug = ? LIMIT 1",
      [targetSlug, cleanSlug]
    );

    let page = pages[0];
    if (!page) {
      // Fallback virtual page if not found in db
      page = {
        title: targetSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        slug: targetSlug,
        subtitle: "Comprehensive resources, guides, and documentation from MyBDPhone.",
        status: "published"
      };
    }

    // Fetch page sections
    const [sections] = await pool.query(
      `SELECT * FROM resource_sections 
       WHERE page_id = ? AND is_active = 1 
       ORDER BY sort_order ASC, id ASC`,
      [page.id || 0]
    );

    const parsedSections = sections.map(s => ({
      ...s,
      content_json: typeof s.content_json === 'string' ? JSON.parse(s.content_json || '{}') : (s.content_json || {})
    }));

    // Fetch additional entity collections depending on page
    let guides = [];
    let faqs = [];
    let categories = [];

    if (targetSlug === "product-guides" || targetSlug === "resources") {
      const [guideRows] = await pool.query(
        "SELECT * FROM product_guides WHERE is_published = 1 ORDER BY is_popular DESC, sort_order ASC, id DESC"
      );
      guides = guideRows;
    }

    if (targetSlug === "faq-helpdesk" || targetSlug === "resources") {
      const [faqRows] = await pool.query(
        "SELECT * FROM resource_faqs WHERE is_active = 1 ORDER BY category ASC, sort_order ASC, id ASC"
      );
      faqs = faqRows;
      const [catRows] = await pool.query(
        "SELECT DISTINCT category FROM resource_faqs WHERE is_active = 1 ORDER BY category ASC"
      );
      categories = ["All", ...catRows.map(c => c.category)];
    }

    return res.json({
      success: true,
      page,
      sections: parsedSections,
      guides,
      faqs,
      categories,
    });
  } catch (error) {
    console.error("GET RESOURCE PAGE ERROR:", error);
    return res.status(500).json({ success: false, message: "Error fetching resource page" });
  }
};

// 2. GET PRODUCT GUIDES (filter by category, search, popular)
const getProductGuides = async (req, res) => {
  try {
    await ensureResourceTables();
    const { category, search, popular, limit = 50 } = req.query;

    let query = "SELECT * FROM product_guides WHERE is_published = 1";
    const params = [];

    if (category && category !== 'All' && category !== 'all') {
      query += " AND category = ?";
      params.push(category);
    }

    if (popular === 'true' || popular === '1') {
      query += " AND is_popular = 1";
    }

    if (search && search.trim()) {
      query += " AND (title LIKE ? OR short_desc LIKE ? OR category LIKE ?)";
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += " ORDER BY is_popular DESC, sort_order ASC, id DESC LIMIT ?";
    params.push(parseInt(limit, 10));

    const [guides] = await pool.query(query, params);

    const [categories] = await pool.query(
      "SELECT DISTINCT category FROM product_guides WHERE is_published = 1 ORDER BY category ASC"
    );

    return res.json({
      success: true,
      count: guides.length,
      categories: ["All", ...categories.map(c => c.category)],
      guides,
    });
  } catch (error) {
    console.error("GET PRODUCT GUIDES ERROR:", error);
    return res.status(500).json({ success: false, message: "Error fetching product guides" });
  }
};

// 3. GET SINGLE PRODUCT GUIDE BY SLUG
const getProductGuideBySlug = async (req, res) => {
  try {
    await ensureResourceTables();
    const { slug } = req.params;

    const [guides] = await pool.query(
      "SELECT * FROM product_guides WHERE slug = ? AND is_published = 1 LIMIT 1",
      [slug]
    );

    if (guides.length === 0) {
      return res.status(404).json({ success: false, message: "Product guide not found" });
    }

    const guide = guides[0];

    // Fetch related guides in same category
    const [related] = await pool.query(
      "SELECT id, title, slug, category, icon, short_desc, featured_image, read_time FROM product_guides WHERE category = ? AND id != ? AND is_published = 1 LIMIT 3",
      [guide.category, guide.id]
    );

    return res.json({
      success: true,
      guide,
      related,
    });
  } catch (error) {
    console.error("GET GUIDE DETAILS ERROR:", error);
    return res.status(500).json({ success: false, message: "Error fetching guide details" });
  }
};

// 4. GET FAQS (filter by category, search)
const getResourceFaqs = async (req, res) => {
  try {
    await ensureResourceTables();
    const { category, search } = req.query;

    let query = "SELECT * FROM resource_faqs WHERE is_active = 1";
    const params = [];

    if (category && category !== 'All' && category !== 'all') {
      query += " AND category = ?";
      params.push(category);
    }

    if (search && search.trim()) {
      query += " AND (question LIKE ? OR answer LIKE ? OR category LIKE ?)";
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += " ORDER BY category ASC, sort_order ASC, id ASC";

    const [faqs] = await pool.query(query, params);

    const [categories] = await pool.query(
      "SELECT DISTINCT category FROM resource_faqs WHERE is_active = 1 ORDER BY category ASC"
    );

    return res.json({
      success: true,
      count: faqs.length,
      categories: ["All", ...categories.map(c => c.category)],
      faqs,
    });
  } catch (error) {
    console.error("GET FAQS ERROR:", error);
    return res.status(500).json({ success: false, message: "Error fetching FAQs" });
  }
};

// 5. GET HARDWARE PRODUCTS
const getHardwareProducts = async (req, res) => {
  try {
    await ensureResourceTables();
    const { brand, type, search, limit = 50 } = req.query;

    let query = "SELECT * FROM hardware_products WHERE status = 'Active'";
    const params = [];

    if (brand && brand !== 'All' && brand !== 'all') {
      query += " AND brand = ?";
      params.push(brand);
    }

    if (type && type !== 'All' && type !== 'all') {
      query += " AND device_type = ?";
      params.push(type);
    }

    if (search && search.trim()) {
      query += " AND (model_name LIKE ? OR brand LIKE ? OR device_type LIKE ? OR short_desc LIKE ?)";
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += " ORDER BY is_available DESC, price ASC LIMIT ?";
    params.push(parseInt(limit, 10));

    const [products] = await pool.query(query, params);

    const parsedProducts = products.map(p => ({
      ...p,
      key_specs_json: typeof p.key_specs_json === 'string' ? JSON.parse(p.key_specs_json || '[]') : (p.key_specs_json || []),
      gallery_json: typeof p.gallery_json === 'string' ? JSON.parse(p.gallery_json || '[]') : (p.gallery_json || []),
      features_json: typeof p.features_json === 'string' ? JSON.parse(p.features_json || '[]') : (p.features_json || []),
    }));

    const [brands] = await pool.query("SELECT DISTINCT brand FROM hardware_products WHERE status = 'Active' ORDER BY brand ASC");
    const [types] = await pool.query("SELECT DISTINCT device_type FROM hardware_products WHERE status = 'Active' ORDER BY device_type ASC");

    return res.json({
      success: true,
      count: parsedProducts.length,
      brands: ["All", ...brands.map(b => b.brand)],
      types: ["All", ...types.map(t => t.device_type)],
      products: parsedProducts,
    });
  } catch (error) {
    console.error("GET HARDWARE PRODUCTS ERROR:", error);
    return res.status(500).json({ success: false, message: "Error fetching hardware products" });
  }
};

// 6. GET HARDWARE PRODUCT DETAILS BY SLUG
const getHardwareProductBySlug = async (req, res) => {
  try {
    await ensureResourceTables();
    const { slug } = req.params;

    const [products] = await pool.query(
      "SELECT * FROM hardware_products WHERE slug = ? LIMIT 1",
      [slug]
    );

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "Hardware product not found" });
    }

    const product = products[0];
    const parsedProduct = {
      ...product,
      key_specs_json: typeof product.key_specs_json === 'string' ? JSON.parse(product.key_specs_json || '[]') : (product.key_specs_json || []),
      gallery_json: typeof product.gallery_json === 'string' ? JSON.parse(product.gallery_json || '[]') : (product.gallery_json || []),
      features_json: typeof product.features_json === 'string' ? JSON.parse(product.features_json || '[]') : (product.features_json || []),
    };

    const [related] = await pool.query(
      "SELECT id, model_name, slug, brand, device_type, price, is_available, main_image, warranty FROM hardware_products WHERE (device_type = ? OR brand = ?) AND id != ? AND status = 'Active' LIMIT 3",
      [product.device_type, product.brand, product.id]
    );

    return res.json({
      success: true,
      product: parsedProduct,
      related,
    });
  } catch (error) {
    console.error("GET HARDWARE DETAILS ERROR:", error);
    return res.status(500).json({ success: false, message: "Error fetching hardware details" });
  }
};

// =========================================================================
// ADMIN CMS CRUD CONTROLLERS
// =========================================================================

// --- ADMIN UPDATE RESOURCE PAGE BY SLUG ---
// PUT /api/admin/cms/resources/:slug
const updateAdminResourcePage = async (req, res) => {
  try {
    await ensureResourceTables();
    const { slug } = req.params;
    const { title, subtitle, meta_title, meta_desc, status, sections } = req.body;

    const [existing] = await pool.query("SELECT id FROM resource_pages WHERE slug = ? LIMIT 1", [slug]);
    let pageId;

    if (!existing.length) {
      const [created] = await pool.query(
        `INSERT INTO resource_pages (slug, title, subtitle, meta_title, meta_desc, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [slug, title || slug, subtitle || '', meta_title || '', meta_desc || '', status || 'published']
      );
      pageId = created.insertId;
    } else {
      pageId = existing[0].id;
      await pool.query(
        `UPDATE resource_pages SET
           title = COALESCE(?, title),
           subtitle = COALESCE(?, subtitle),
           meta_title = COALESCE(?, meta_title),
           meta_desc = COALESCE(?, meta_desc),
           status = COALESCE(?, status)
         WHERE id = ?`,
        [title, subtitle, meta_title, meta_desc, status, pageId]
      );
    }

    // Also keep cms_pages synchronized
    await pool.query(
      `INSERT INTO cms_pages (title, slug, template, content_html, featured_image, seo_title, seo_description, meta_title, meta_description, status, sort_order)
       VALUES (?, ?, 'landing', '', '', ?, ?, ?, ?, COALESCE(?, 'published'), 20)
       ON DUPLICATE KEY UPDATE
         title=COALESCE(?, title),
         seo_title=COALESCE(?, seo_title),
         seo_description=COALESCE(?, seo_description),
         meta_title=COALESCE(?, meta_title),
         meta_description=COALESCE(?, meta_description),
         status=COALESCE(?, status)`,
      [
        title || slug, slug, meta_title || title || '', meta_desc || subtitle || '', meta_title || title || '', meta_desc || subtitle || '', status,
        title, meta_title, meta_desc, meta_title, meta_desc, status
      ]
    );

    // If sections array is provided, batch update or insert
    if (Array.isArray(sections)) {
      for (const sec of sections) {
        if (sec.id) {
          await pool.query(
            `UPDATE resource_sections SET
               title = COALESCE(?, title),
               subtitle = COALESCE(?, subtitle),
               content = COALESCE(?, content),
               content_json = COALESCE(?, content_json),
               align = COALESCE(?, align),
               sort_order = COALESCE(?, sort_order),
               is_active = COALESCE(?, is_active),
               section_type = COALESCE(?, section_type)
             WHERE id = ? AND page_id = ?`,
            [
              sec.title,
              sec.subtitle,
              sec.content,
              sec.content_json !== undefined ? (typeof sec.content_json === 'string' ? sec.content_json : JSON.stringify(sec.content_json)) : null,
              sec.align,
              sec.sort_order,
              sec.is_active !== undefined ? (sec.is_active ? 1 : 0) : null,
              sec.section_type,
              sec.id,
              pageId
            ]
          );
        } else if (sec.section_key) {
          await pool.query(
            `INSERT INTO resource_sections 
             (page_id, section_key, section_type, title, subtitle, content, content_json, align, sort_order, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pageId,
              sec.section_key,
              sec.section_type || 'RICH_TEXT',
              sec.title || '',
              sec.subtitle || '',
              sec.content || '',
              JSON.stringify(sec.content_json || {}),
              sec.align || 'left',
              sec.sort_order || 0,
              sec.is_active !== undefined ? (sec.is_active ? 1 : 0) : 1
            ]
          );
        }
      }
    }

    // If guides array is provided, update or insert guides
    if (Array.isArray(req.body.guides)) {
      for (const g of req.body.guides) {
        if (g.id) {
          await pool.query(
            `UPDATE product_guides SET
               title = COALESCE(?, title),
               slug = COALESCE(?, slug),
               category = COALESCE(?, category),
               icon = COALESCE(?, icon),
               short_desc = COALESCE(?, short_desc),
               full_content = COALESCE(?, full_content),
               read_time = COALESCE(?, read_time),
               is_popular = COALESCE(?, is_popular),
               is_published = COALESCE(?, is_published),
               sort_order = COALESCE(?, sort_order)
             WHERE id = ?`,
            [
              g.title, g.slug, g.category, g.icon, g.short_desc, g.full_content,
              g.read_time, g.is_popular !== undefined ? (g.is_popular ? 1 : 0) : null,
              g.is_published !== undefined ? (g.is_published ? 1 : 0) : null,
              g.sort_order, g.id
            ]
          );
        }
      }
    }

    // If faqs array is provided, update or insert faqs
    if (Array.isArray(req.body.faqs)) {
      for (const f of req.body.faqs) {
        if (f.id) {
          await pool.query(
            `UPDATE resource_faqs SET
               category = COALESCE(?, category),
               question = COALESCE(?, question),
               answer = COALESCE(?, answer),
               sort_order = COALESCE(?, sort_order),
               is_active = COALESCE(?, is_active)
             WHERE id = ?`,
            [
              f.category, f.question, f.answer, f.sort_order,
              f.is_active !== undefined ? (f.is_active ? 1 : 0) : null,
              f.id
            ]
          );
        }
      }
    }

    return res.json({ success: true, message: `Resource page '${slug}' updated successfully`, pageId });
  } catch (error) {
    console.error("UPDATE ADMIN RESOURCE PAGE ERROR:", error);
    return res.status(500).json({ success: false, message: "Error updating resource page" });
  }
};

// --- ADMIN SECTIONS CRUD ---
const adminGetSections = async (req, res) => {
  try {
    await ensureResourceTables();
    const { page_slug } = req.query;

    let query = `
      SELECT s.*, p.title as page_title, p.slug as page_slug 
      FROM resource_sections s 
      JOIN resource_pages p ON s.page_id = p.id
    `;
    const params = [];

    if (page_slug) {
      query += " WHERE p.slug = ?";
      params.push(page_slug);
    }

    query += " ORDER BY s.page_id ASC, s.sort_order ASC";
    const [sections] = await pool.query(query, params);

    return res.json({
      success: true,
      sections: sections.map(s => ({
        ...s,
        content_json: typeof s.content_json === 'string' ? JSON.parse(s.content_json || '{}') : (s.content_json || {})
      }))
    });
  } catch (error) {
    console.error("ADMIN GET SECTIONS ERROR:", error);
    return res.status(500).json({ success: false, message: "Error fetching sections" });
  }
};

const adminCreateSection = async (req, res) => {
  try {
    const { page_id, section_key, section_type, title, subtitle, content, content_json, image_url, align, sort_order, is_active } = req.body;
    
    const [result] = await pool.query(`
      INSERT INTO resource_sections 
      (page_id, section_key, section_type, title, subtitle, content, content_json, image_url, align, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      page_id || 1,
      section_key || 'custom_section',
      section_type || 'RICH_TEXT',
      title || '',
      subtitle || '',
      content || '',
      JSON.stringify(content_json || {}),
      image_url || '',
      align || 'left',
      sort_order || 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1
    ]);

    return res.status(201).json({ success: true, message: "Section created successfully", id: result.insertId });
  } catch (error) {
    console.error("ADMIN CREATE SECTION ERROR:", error);
    return res.status(500).json({ success: false, message: "Error creating section" });
  }
};

const adminUpdateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, content, content_json, image_url, align, sort_order, is_active, section_type, section_key } = req.body;

    await pool.query(`
      UPDATE resource_sections SET
        title = COALESCE(?, title),
        subtitle = COALESCE(?, subtitle),
        content = COALESCE(?, content),
        content_json = COALESCE(?, content_json),
        image_url = COALESCE(?, image_url),
        align = COALESCE(?, align),
        sort_order = COALESCE(?, sort_order),
        is_active = COALESCE(?, is_active),
        section_type = COALESCE(?, section_type),
        section_key = COALESCE(?, section_key)
      WHERE id = ?
    `, [
      title,
      subtitle,
      content,
      content_json !== undefined ? JSON.stringify(content_json) : null,
      image_url,
      align,
      sort_order,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      section_type,
      section_key,
      id
    ]);

    return res.json({ success: true, message: "Section updated successfully" });
  } catch (error) {
    console.error("ADMIN UPDATE SECTION ERROR:", error);
    return res.status(500).json({ success: false, message: "Error updating section" });
  }
};

const adminDeleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM resource_sections WHERE id = ?", [id]);
    return res.json({ success: true, message: "Section deleted successfully" });
  } catch (error) {
    console.error("ADMIN DELETE SECTION ERROR:", error);
    return res.status(500).json({ success: false, message: "Error deleting section" });
  }
};

// --- ADMIN GUIDES CRUD ---
const adminGetGuides = async (req, res) => {
  try {
    await ensureResourceTables();
    const [guides] = await pool.query("SELECT * FROM product_guides ORDER BY sort_order ASC, id DESC");
    return res.json({ success: true, guides });
  } catch (error) {
    console.error("ADMIN GET GUIDES ERROR:", error);
    return res.status(500).json({ success: false, message: "Error fetching guides" });
  }
};

const adminCreateGuide = async (req, res) => {
  try {
    const { title, slug, category, icon, short_desc, full_content, featured_image, read_time, is_popular, is_published, sort_order } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, message: "Guide title is required" });
    }

    const cleanSlug = (slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) + (slug ? '' : '-' + Date.now().toString().slice(-4));

    const [result] = await pool.query(`
      INSERT INTO product_guides 
      (title, slug, category, icon, short_desc, full_content, featured_image, read_time, is_popular, is_published, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      cleanSlug,
      category || 'General',
      icon || 'FileText',
      short_desc || '',
      full_content || '',
      featured_image || '',
      read_time || '5 min read',
      is_popular ? 1 : 0,
      is_published !== undefined ? (is_published ? 1 : 0) : 1,
      sort_order || 0
    ]);

    return res.status(201).json({ success: true, message: "Guide published successfully", id: result.insertId });
  } catch (error) {
    console.error("ADMIN CREATE GUIDE ERROR:", error);
    return res.status(500).json({ success: false, message: "Error creating guide" });
  }
};

const adminUpdateGuide = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, category, icon, short_desc, full_content, featured_image, read_time, is_popular, is_published, sort_order } = req.body;

    await pool.query(`
      UPDATE product_guides SET
        title = COALESCE(?, title),
        slug = COALESCE(?, slug),
        category = COALESCE(?, category),
        icon = COALESCE(?, icon),
        short_desc = COALESCE(?, short_desc),
        full_content = COALESCE(?, full_content),
        featured_image = COALESCE(?, featured_image),
        read_time = COALESCE(?, read_time),
        is_popular = COALESCE(?, is_popular),
        is_published = COALESCE(?, is_published),
        sort_order = COALESCE(?, sort_order)
      WHERE id = ?
    `, [
      title,
      slug,
      category,
      icon,
      short_desc,
      full_content,
      featured_image,
      read_time,
      is_popular !== undefined ? (is_popular ? 1 : 0) : null,
      is_published !== undefined ? (is_published ? 1 : 0) : null,
      sort_order,
      id
    ]);

    return res.json({ success: true, message: "Guide updated successfully" });
  } catch (error) {
    console.error("ADMIN UPDATE GUIDE ERROR:", error);
    return res.status(500).json({ success: false, message: "Error updating guide" });
  }
};

const adminDeleteGuide = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM product_guides WHERE id = ?", [id]);
    return res.json({ success: true, message: "Guide deleted successfully" });
  } catch (error) {
    console.error("ADMIN DELETE GUIDE ERROR:", error);
    return res.status(500).json({ success: false, message: "Error deleting guide" });
  }
};

// --- ADMIN FAQS CRUD ---
const adminGetFaqs = async (req, res) => {
  try {
    await ensureResourceTables();
    const [faqs] = await pool.query("SELECT * FROM resource_faqs ORDER BY category ASC, sort_order ASC, id ASC");
    return res.json({ success: true, faqs });
  } catch (error) {
    console.error("ADMIN GET FAQS ERROR:", error);
    return res.status(500).json({ success: false, message: "Error fetching FAQs" });
  }
};

const adminCreateFaq = async (req, res) => {
  try {
    const { category, question, answer, sort_order, is_active } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({ success: false, message: "Question and answer are required" });
    }

    const [result] = await pool.query(`
      INSERT INTO resource_faqs (category, question, answer, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?)
    `, [
      category || 'General',
      question,
      answer,
      sort_order || 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1
    ]);

    return res.status(201).json({ success: true, message: "FAQ created successfully", id: result.insertId });
  } catch (error) {
    console.error("ADMIN CREATE FAQ ERROR:", error);
    return res.status(500).json({ success: false, message: "Error creating FAQ" });
  }
};

const adminUpdateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, question, answer, sort_order, is_active } = req.body;

    await pool.query(`
      UPDATE resource_faqs SET
        category = COALESCE(?, category),
        question = COALESCE(?, question),
        answer = COALESCE(?, answer),
        sort_order = COALESCE(?, sort_order),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `, [
      category,
      question,
      answer,
      sort_order,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      id
    ]);

    return res.json({ success: true, message: "FAQ updated successfully" });
  } catch (error) {
    console.error("ADMIN UPDATE FAQ ERROR:", error);
    return res.status(500).json({ success: false, message: "Error updating FAQ" });
  }
};

const adminDeleteFaq = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM resource_faqs WHERE id = ?", [id]);
    return res.json({ success: true, message: "FAQ deleted successfully" });
  } catch (error) {
    console.error("ADMIN DELETE FAQ ERROR:", error);
    return res.status(500).json({ success: false, message: "Error deleting FAQ" });
  }
};

// --- ADMIN HARDWARE CRUD ---
const adminGetHardware = async (req, res) => {
  try {
    await ensureResourceTables();
    const [products] = await pool.query("SELECT * FROM hardware_products ORDER BY id DESC");
    const parsedProducts = products.map(p => ({
      ...p,
      key_specs_json: typeof p.key_specs_json === 'string' ? JSON.parse(p.key_specs_json || '[]') : (p.key_specs_json || []),
      gallery_json: typeof p.gallery_json === 'string' ? JSON.parse(p.gallery_json || '[]') : (p.gallery_json || []),
      features_json: typeof p.features_json === 'string' ? JSON.parse(p.features_json || '[]') : (p.features_json || []),
    }));
    return res.json({ success: true, products: parsedProducts });
  } catch (error) {
    console.error("ADMIN GET HARDWARE ERROR:", error);
    return res.status(500).json({ success: false, message: "Error fetching hardware" });
  }
};

const adminCreateHardware = async (req, res) => {
  try {
    const { model_name, slug, brand, device_type, short_desc, key_specs_json, price, is_available, main_image, gallery_json, features_json, warranty, status } = req.body;
    
    if (!model_name) {
      return res.status(400).json({ success: false, message: "Model name is required" });
    }

    const cleanSlug = (slug || model_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) + (Date.now().toString().slice(-4));

    const [result] = await pool.query(`
      INSERT INTO hardware_products 
      (model_name, slug, brand, device_type, short_desc, key_specs_json, price, is_available, main_image, gallery_json, features_json, warranty, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      model_name,
      cleanSlug,
      brand || 'Grandstream',
      device_type || 'IP Phone',
      short_desc || '',
      JSON.stringify(key_specs_json || []),
      price || 0.00,
      is_available !== undefined ? (is_available ? 1 : 0) : 1,
      main_image || '',
      JSON.stringify(gallery_json || []),
      JSON.stringify(features_json || []),
      warranty || '1 Year Official Warranty',
      status || 'Active'
    ]);

    return res.status(201).json({ success: true, message: "Hardware device added successfully", id: result.insertId });
  } catch (error) {
    console.error("ADMIN CREATE HARDWARE ERROR:", error);
    return res.status(500).json({ success: false, message: "Error creating hardware device" });
  }
};

const adminUpdateHardware = async (req, res) => {
  try {
    const { id } = req.params;
    const { model_name, slug, brand, device_type, short_desc, key_specs_json, price, is_available, main_image, gallery_json, features_json, warranty, status } = req.body;

    await pool.query(`
      UPDATE hardware_products SET
        model_name = COALESCE(?, model_name),
        slug = COALESCE(?, slug),
        brand = COALESCE(?, brand),
        device_type = COALESCE(?, device_type),
        short_desc = COALESCE(?, short_desc),
        key_specs_json = COALESCE(?, key_specs_json),
        price = COALESCE(?, price),
        is_available = COALESCE(?, is_available),
        main_image = COALESCE(?, main_image),
        gallery_json = COALESCE(?, gallery_json),
        features_json = COALESCE(?, features_json),
        warranty = COALESCE(?, warranty),
        status = COALESCE(?, status)
      WHERE id = ?
    `, [
      model_name,
      slug,
      brand,
      device_type,
      short_desc,
      key_specs_json !== undefined ? JSON.stringify(key_specs_json) : null,
      price,
      is_available !== undefined ? (is_available ? 1 : 0) : null,
      main_image,
      gallery_json !== undefined ? JSON.stringify(gallery_json) : null,
      features_json !== undefined ? JSON.stringify(features_json) : null,
      warranty,
      status,
      id
    ]);

    return res.json({ success: true, message: "Hardware device updated successfully" });
  } catch (error) {
    console.error("ADMIN UPDATE HARDWARE ERROR:", error);
    return res.status(500).json({ success: false, message: "Error updating hardware device" });
  }
};

const adminDeleteHardware = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM hardware_products WHERE id = ?", [id]);
    return res.json({ success: true, message: "Hardware device deleted successfully" });
  } catch (error) {
    console.error("ADMIN DELETE HARDWARE ERROR:", error);
    return res.status(500).json({ success: false, message: "Error deleting hardware device" });
  }
};

module.exports = {
  ensureResourceTables,
  // Public
  getPublicResourcePage,
  getResourcePage: getPublicResourcePage,
  getProductGuides,
  getProductGuideBySlug,
  getResourceFaqs,
  getHardwareProducts,
  getHardwareProductBySlug,
  // Admin Page
  updateAdminResourcePage,
  // Admin Sections
  adminGetSections,
  adminCreateSection,
  adminUpdateSection,
  adminDeleteSection,
  // Admin Guides
  adminGetGuides,
  adminCreateGuide,
  adminUpdateGuide,
  adminDeleteGuide,
  // Admin FAQs
  adminGetFaqs,
  adminCreateFaq,
  adminUpdateFaq,
  adminDeleteFaq,
  // Admin Hardware
  adminGetHardware,
  adminCreateHardware,
  adminUpdateHardware,
  adminDeleteHardware,
};
