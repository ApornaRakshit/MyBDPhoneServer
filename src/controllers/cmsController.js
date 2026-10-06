const pool = require("../config/db");

const DEFAULT_SITE_CONFIG = {
  header_config: {
    announcement_enabled: true,

    show_search: true,
    sticky_header: true,
    login_text: "Login",
    login_url: "/login",
    primary_text: "Get Started",
    primary_url: "/packages",
    logo_url: "",
  },
  footer_config: {
    description:
      "Bangladesh’s premier unified telecommunications & voice AI platform. Equipping startups, enterprises, and contact centers with official 096 IP numbers, cloud PBX, and programmable AI voice automation.",
    logo_url: "/uploads/cms/footer-logo.png",
    payment_image_url: "/uploads/cms/payment.png",
    footer_note: "Designed with modern telecom precision for Bangladesh.",
    columns: [
      {
        title: "IP TELEPHONY",
        links: [
          { label: "096 Number Registration", url: "/ip-phone", active: true },
          { label: "StartUp Monthly (৳500)", url: "/packages", active: true },
          { label: "Pro Monthly (৳1,000)", url: "/packages", active: true },
          { label: "Caller Tune Add-on", url: "/shop", active: true },
          { label: "Cloud Call Recording", url: "/shop", active: true },
          { label: "Multi-Device SIP Support", url: "/ip-phone", active: true },
        ],
      },
      {
        title: "AI VOICE STUDIO",
        links: [
          {
            label: "Automated Outbound Calls",
            url: "/ai-calling",
            active: true,
          },
          {
            label: "Bangla Natural Neural TTS",
            url: "/ai-calling",
            active: true,
          },
          { label: "AI Calling Packages", url: "/packages", active: true },
          {
            label: "Voice Campaign Analytics",
            url: "/ai-calling",
            active: true,
          },
          { label: "VIP Golden 096 Numbers", url: "/shop", active: true },
          { label: "SIP & Webhook APIs", url: "/features", active: true },
        ],
      },
      { title: "DHAKA SUPPORT HQ", links: [] },
    ],
    social: [
      { label: "Facebook", url: "", active: true },
      { label: "LinkedIn", url: "", active: true },
      { label: "YouTube", url: "", active: true },
    ],
    newsletter_enabled: true,
    newsletter_title: "Stay connected with MyBDPhone",
    copyright: "© 2026 MyBDPhone. All rights reserved.",
  },
  global_config: {
    site_name: "MyBDPhone",
    tagline: "Your Phone. Your Business. Powered by AI.",
    logo_url: "",
    favicon_url: "",
    hotline_phone: "096490123756",
    support_email: "support@mybdphone.com",
    sales_email: "sales@mybdphone.com",
    office_address:
      "Wakil Tower (8th Floor), Gulshan-1, Dhaka 1212, Bangladesh",
    facebook_url: "",
    linkedin_url: "",
    youtube_url: "",
    instagram_url: "",
    seo_title: "MyBDPhone — IP Phone & AI Calling Services",
    seo_description:
      "MyBDPhone provides IP phone, 096 numbers, AI calling and digital telecom services.",
  },
  home_config: {
    hero_badge: "Unified Telecom + AI Calling Platform",
    hero_title: "Smart Business Calling, Simplified.",
    hero_subtitle:
      "Get your dedicated 096 IP phone number, recharge your wallet, manage monthly plans, and run AI voice campaigns from one modern platform.",
    hero_primary_text: "Explore Packages",
    hero_primary_url: "/packages",
    hero_secondary_text: "Explore AI Calling",
    hero_secondary_url: "/ai-calling",
    hero_image_url: "",
    section_titles: {
      features: "Everything Your Business Needs",
      testimonials: "Trusted by Growing Teams",
      service_cards: "Two Powerful Telecom Services. One Seamless Platform.",
      offerings: "Two Powerful Telecom Services. One Seamless Platform.",
      advantages: "Why Businesses Across Bangladesh Trust Us",
      packages: "Choose the Perfect Package for Your Business",
      addons: "Digital Phone Services Marketplace",
      clients: "Clients We Have Helped with PBX",
      faq: "Frequently Asked Questions",
      cta: "Ready to Upgrade Your Business Telephony?",
      offerings_subtitle:
        "Choose between dedicated corporate IP telephony and automated AI voice campaigns — or leverage both under a single dashboard.",
      advantages_subtitle:
        "Engineered for low latency, maximum telecom compliance, and intelligent voice scalability.",
      packages_subtitle:
        "All prices and features are dynamically managed. No hidden fees.",
      addons_subtitle:
        "Enhance your 096 line with caller tunes, extra device licenses, VIP numbers, and recording storage.",
      clients_subtitle:
        "Teams and businesses across Bangladesh manage their calls with MyBDPhone.",
      cta_subtitle:
        "Get your 096 IP number within 5 minutes or launch your first automated AI voice campaign today.",
    },
    section_visibility: {
      hero: true,
      service_cards: true,
      offerings: true,
      clients: true,
      features: true,
      packages: true,
      testimonials: true,
      faq: true,
      cta: true,
    },
  },
  contact_config: {
    enabled: true,
    eyebrow: "DIRECT CHANNELS",
    title: "Our Dhaka Offices",
    description:
      "Feel free to contact us through phone, email, or visit our headquarters in Karwan Bazar.",
    office_cards: [
      {
        icon: "MapPin",
        title: "Head Office",
        lines: [
          "Wakil Tower (8th Floor)",
          "Ta-131, Gulshan-1 Badda Link Road",
          "Gulshan, Dhaka 1212",
        ],
        active: true,
      },
      {
        icon: "Phone",
        title: "Telecom Hotline",
        lines: ["096490123756"],
        meta: "Sat - Thu: 9:00 AM - 8:00 PM",
        active: true,
      },
      {
        icon: "Mail",
        title: "Email Contacts",
        lines: ["support@mybdphone.com", "sales@mybdphone.com"],
        active: true,
      },
    ],
    form: {
      title: "Send Us an Inquiry",
      subtitle:
        "Fill out the form below and our account managers will contact you within 2 hours.",
      name_label: "Your Full Name *",
      name_placeholder: "e.g. Enter Your Name",
      phone_label: "Phone Number *",
      phone_placeholder: "01XXXXXXXXX",
      email_label: "Email Address *",
      email_placeholder: "name@company.com",
      service_label: "Service Interest",
      service_placeholder: "Select Service Interest",
      message_label: "Message Description *",
      message_placeholder:
        "Tell us about your team size, expected call minutes, or requirements...",
      button_text: "Submit Inquiry",
      success_title: "Inquiry Submitted Successfully!",
      success_text:
        "Thank you for contacting MyBDPhone. A telecom specialist will call you shortly.",
    },
    services: [
      { value: "096 IP Phone", label: "096 IP Phone (PBX)", active: true },
      {
        value: "AI Voice Automation",
        label: "AI Voice Automation & Campaigns",
        active: true,
      },
      {
        value: "Enterprise Trunk",
        label: "Enterprise SIP Trunking",
        active: true,
      },
      {
        value: "Shop Addons",
        label: "Digital Add-ons & Numbers",
        active: true,
      },
    ],
  },
};

const DEFAULT_COLLECTIONS = {
  home_hero_slides: [
    {
      title: "Smart Business Calling, Simplified.",
      description:
        "Get your dedicated 096 IP phone number, recharge your wallet, manage monthly plans, and run AI voice campaigns from one modern platform.",
      image_url: "/uploads/cms/banner1.png",
      meta: "UNIFIED TELECOM + AI CALLING PLATFORM",
      sort_order: 1,
      payload: {
        eyebrow: "UNIFIED TELECOM + AI CALLING PLATFORM",
        primary_text: "Explore Packages",
        primary_url: "/packages",
        secondary_text: "Explore AI Calling",
        secondary_url: "/ai-calling",
        badges: ["Verified 096 IP services", "DGePay online payments"],
      },
    },
    {
      title: "Keep Your Team Connected Everywhere.",
      description:
        "Connect employees, customers, and teams through a unified business communication platform built for seamless collaboration.",
      image_url: "/uploads/cms/banner2.png",
      meta: "TEAM COLLABORATION & MULTI-DEVICE",
      sort_order: 2,
      payload: {
        eyebrow: "TEAM COLLABORATION & MULTI-DEVICE",
        primary_text: "Get Started",
        primary_url: "/register",
        secondary_text: "Explore Packages",
        secondary_url: "/packages",
        badges: ["Multi-device support", "096 IP services"],
      },
    },
    {
      title: "Power Smarter Customer Conversations.",
      description:
        "Bring IP calling, cloud PBX and AI voice campaigns together with a polished experience your whole team can use.",
      image_url: "/uploads/cms/banner3.png",
      meta: "BUSINESS COMMUNICATION PLATFORM",
      sort_order: 3,
      payload: {
        eyebrow: "BUSINESS COMMUNICATION PLATFORM",
        primary_text: "Explore Solutions",
        primary_url: "/features",
        secondary_text: "Contact Sales",
        secondary_url: "/contact",
        badges: ["Cloud PBX", "AI Calling"],
      },
    },
  ],
  home_service_cards: [
    {
      title: "Cloud PBX",
      description:
        "Manage your business calls with a powerful cloud-based PBX system.",
      image_url: "/uploads/cms/cloud-pbx-icon.png",
      link_url: "/features",
      meta: "Manage extensions, routing and call flows",
      sort_order: 1,
      payload: { label: "Learn More" },
    },
    {
      title: "AI Calling",
      description:
        "Automate customer conversations with intelligent voice campaigns.",
      image_url: "/uploads/cms/ai-calling-icon.png",
      link_url: "/ai-calling",
      meta: "Natural voice automation and campaigns",
      sort_order: 2,
      payload: { label: "Learn More" },
    },
    {
      title: "096 IP Number",
      description:
        "Get your dedicated 096 IP number for professional business communication.",
      image_url: "/uploads/cms/096-ip-number-icon.png",
      link_url: "/ip-phone",
      meta: "Easy activation, calling and reliability",
      sort_order: 3,
      payload: { label: "Learn More" },
    },
    {
      title: "IP Phone",
      description:
        "Stay connected with reliable IP phone devices for teams and business.",
      image_url: "/uploads/cms/ip-phone-icon.png",
      link_url: "/shop",
      meta: "Hardware, calling and business connectivity",
      sort_order: 4,
      payload: { label: "Learn More" },
    },
  ],
  home_offerings: [
    {
      title: "IP Phone Service",
      description:
        "Professional IP phone services with a dedicated 096 number, multi-device support and call recording.",
      image_url: "/uploads/cms/ip-phone-icon.png",
      meta: "CATEGORY A",
      sort_order: 1,
      payload: {
        features: [
          "Dedicated 096 number",
          "Multi-device support (Android, PC, laptop)",
          "Custom caller tune",
          "Automated call recording",
        ],
        button_text: "Explore IP Phone",
        button_url: "/ip-phone",
      },
    },
    {
      title: "AI Calling Service",
      description:
        "Automate business calls with intelligent voice automation, customizable campaigns, Bangla & multilingual voices, contact uploads, and deep call analytics.",
      image_url: "/uploads/cms/ai-calling-icon.png",
      meta: "CATEGORY B",
      sort_order: 2,
      payload: {
        features: [
          "Natural Bangla & English voice",
          "Interactive voice response",
          "Automated outbound campaigns",
          "Bulk contact CSV upload & management",
        ],
        button_text: "Explore AI Calling",
        button_url: "/ai-calling",
      },
    },
  ],
  features: [
    {
      title: "096 Dedicated IP Number",
      description:
        "Get a professional Bangladeshi 096 number for business communications.",
      icon: "Phone",
      image_url: "",
      link_url: "/ip-phone",
      sort_order: 1,
    },
    {
      title: "Multi-Device Calling",
      description:
        "Connect PC, laptop, Android and IP phones with flexible device limits.",
      icon: "Smartphone",
      image_url: "",
      link_url: "/ip-phone",
      sort_order: 2,
    },
    {
      title: "Cloud Call Recording",
      description:
        "Keep secure cloud recordings available to authorized users.",
      icon: "FileAudio",
      image_url: "",
      link_url: "/features",
      sort_order: 3,
    },
    {
      title: "AI Voice Campaigns",
      description:
        "Automate outbound calls with natural Bangla and multilingual voices.",
      icon: "Bot",
      image_url: "",
      link_url: "/ai-calling",
      sort_order: 4,
    },
    {
      title: "Smart IVR & Routing",
      description:
        "Build professional IVR and routing flows for customer calls.",
      icon: "Zap",
      image_url: "",
      link_url: "/features",
      sort_order: 5,
    },
    {
      title: "Instant Wallet Recharge",
      description:
        "Recharge from ৳100 to ৳10,000 and keep your calling balance ready.",
      icon: "Wallet",
      image_url: "",
      link_url: "/login",
      sort_order: 6,
    },
  ],
  home_advantages: [
    {
      title: "Unified Platform",
      description:
        "Manage IP Phone extensions and automated AI Calling campaigns under one unified dashboard.",
      icon: "Layers",
      sort_order: 1,
    },
    {
      title: "Easy Online Recharge",
      description:
        "Instant top-ups from ৳100 up to ৳10,000 using bKash, Nagad, Rocket, or Visa/Mastercard.",
      icon: "CreditCard",
      sort_order: 2,
    },
    {
      title: "Multi-Device Access",
      description:
        "Connect seamlessly across Android apps, Windows PCs, laptops, and hardware SIP phones.",
      icon: "Smartphone",
      sort_order: 3,
    },
    {
      title: "Cloud Call Recording",
      description:
        "Secure, encrypted call archives with in-browser playback for compliance and training.",
      icon: "Headphones",
      sort_order: 4,
    },
    {
      title: "AI Bangla Voice Bot",
      description:
        "Natural neural text-to-speech engine delivering human-like Bangla outbound call campaigns.",
      icon: "Bot",
      sort_order: 5,
    },
    {
      title: "24/7 Ticketing Helpdesk",
      description:
        "Dedicated Bangladeshi telecom engineers ready to assist with SIP setup and routing.",
      icon: "Clock3",
      sort_order: 6,
    },
    {
      title: "Zero Hardcoded Limits",
      description:
        "100% scalable cloud architecture with flexible add-ons in our digital service marketplace.",
      icon: "Zap",
      sort_order: 7,
    },
    {
      title: "BTRC Telecom Grade",
      description:
        "Official licensed IPTSP routing ensuring crystal-clear audio and 99.9% uptime reliability.",
      icon: "ShieldCheck",
      sort_order: 8,
    },
  ],
  home_addons: [
    {
      title: "Caller Tune",
      description:
        "Play custom corporate brand greeting audio to incoming callers.",
      meta: "৳99/mo",
      icon: "Radio",
      sort_order: 1,
    },
    {
      title: "Cloud Recording",
      description: "Encrypted 90-day archive with web playback & MP3 download.",
      meta: "৳199/mo",
      icon: "FileAudio",
      sort_order: 2,
    },
    {
      title: "5 Extra Devices",
      description:
        "Connect 5 additional Android or PC SIP softphones to your line.",
      meta: "৳300/mo",
      icon: "Smartphone",
      sort_order: 3,
    },
    {
      title: "VIP 096 Number",
      description: "Memorable repeating digit premium business hotline number.",
      meta: "৳999 one-time",
      icon: "Sparkles",
      sort_order: 4,
    },
  ],
  faq: [
    {
      title: "How do I recharge my account?",
      description:
        "Open User Panel → Recharge, enter an amount between the configured minimum and maximum, then continue with DGePay.",
      sort_order: 1,
    },
    {
      title: "Can I buy a package with DGePay if my wallet balance is low?",
      description:
        "Yes. DGePay package payments are separate from your wallet balance. Wallet payment requires sufficient balance.",
      sort_order: 2,
    },
    {
      title: "How do I get a 096 number?",
      description:
        "Subscribe to an IP Phone plan and complete the onboarding/assignment workflow from your user panel.",
      sort_order: 3,
    },
    {
      title: "Can admin add more packages?",
      description:
        "Yes. Packages are managed from the no-code Package Manager and can be activated or deactivated.",
      sort_order: 4,
    },
  ],
  testimonials: [
    {
      title: "Growing e-commerce team",
      description:
        "We moved customer support to a centralized 096 IP number and connected multiple devices.",
      image_url: "",
      meta: "Dhaka, Bangladesh",
      sort_order: 1,
    },
    {
      title: "Sales operations",
      description:
        "The combination of wallet recharge and monthly plans keeps our communications simple.",
      image_url: "",
      meta: "SMB Customer",
      sort_order: 2,
    },
    {
      title: "AI campaign team",
      description:
        "Campaign analytics and automated voice calls help us keep outreach organized.",
      image_url: "",
      meta: "Business Customer",
      sort_order: 3,
    },
  ],
  blog: [
    {
      title: "Why businesses are adopting cloud IP phones",
      description:
        "A practical guide to moving from traditional desk lines to hosted IP communications.",
      content_html:
        "<p>Cloud IP communication helps distributed teams stay connected across devices.</p>",
      image_url: "",
      meta: "Telecom Guide",
      sort_order: 1,
    },
    {
      title: "How to design a useful AI voice campaign",
      description:
        "A simple planning framework for scripts, contact lists, schedules and verification.",
      content_html:
        "<p>Start with a concise script and clear call outcome.</p>",
      image_url: "",
      meta: "AI Calling",
      sort_order: 2,
    },
  ],
  cloud_pbx_packages: [
    {
      title: "Starter",
      description: "Hosted Cloud PBX for small teams with essential call handling tools.",
      meta: "৳995 / month",
      sort_order: 1,
      payload: {
        price: 995,
        billing: "Per Month",
        features: [
          "1 Free IP Number", "5 Extensions", "2 Call Channels", "1 IVR",
          "No Call Monitoring", "One-time setup charge excluded",
          "Call charge: ৳0.50 / minute (VAT excluded)",
        ],
        button_text: "Purchase Now",
        button_url: "/packages",
      },
    },
    {
      title: "Business",
      description: "Cloud PBX capacity for growing teams and multi-agent calling.",
      meta: "৳1,495 / month",
      sort_order: 2,
      payload: {
        price: 1495,
        billing: "Per Month",
        features: [
          "1 Free IP Number", "10 Extensions", "4 Call Channels", "2 IVR",
          "No Call Monitoring", "One-time setup charge excluded",
          "Call charge: ৳0.45 / minute (VAT excluded)",
        ],
        button_text: "Purchase Now",
        button_url: "/packages",
        popular: true,
      },
    },
    {
      title: "Corporate",
      description: "Advanced PBX controls for established support, sales and operations teams.",
      meta: "৳2,995 / month",
      sort_order: 3,
      payload: {
        price: 2995,
        billing: "Per Month",
        features: [
          "1 Free IP Number", "30 Extensions", "6 Call Channels", "10 IVR",
          "Call Monitoring", "One-time setup charge excluded",
          "Call charge: ৳0.45 / minute (VAT excluded)",
        ],
        button_text: "Purchase Now",
        button_url: "/packages",
      },
    },
    {
      title: "Enterprise",
      description: "High-capacity Cloud PBX for larger organizations with distributed teams.",
      meta: "৳4,995 / month",
      sort_order: 4,
      payload: {
        price: 4995,
        billing: "Per Month",
        features: [
          "1 Free IP Number", "200 Extensions", "10 Call Channels", "Unlimited IVR",
          "Call Monitoring", "One-time setup charge excluded",
          "Call charge: ৳0.40 / minute (VAT excluded)",
        ],
        button_text: "Purchase Now",
        button_url: "/packages",
      },
    },
  ],
  cloud_pbx_features: [
    { title: "Virtual Receptionist", description: "Automate greetings and guide callers to the right team without a full-time receptionist.", icon: "Headphones", sort_order: 1 },
    { title: "Call Forwarding", description: "Forward calls to another extension, mobile or home phone when the primary destination is unavailable.", icon: "PhoneForwarded", sort_order: 2 },
    { title: "Smart Call Routing", description: "Route incoming calls by extension, schedule or business rule so callers reach the right destination.", icon: "Route", sort_order: 3 },
    { title: "Call Conferencing", description: "Bring multiple team members into the same secure voice conversation from anywhere.", icon: "Users", sort_order: 4 },
    { title: "Call Transferring", description: "Transfer live calls between agents or departments without forcing the caller to start again.", icon: "ArrowLeftRight", sort_order: 5 },
    { title: "Voice Messages", description: "Let callers leave messages after hours and surface them in your dashboard or inbox.", icon: "Voicemail", sort_order: 6 },
    { title: "Multiple IVR", description: "Run multiple IVR trees for greetings, off-days, promotions and department-specific flows.", icon: "GitBranch", sort_order: 7 },
    { title: "Call Recording", description: "Record business calls for quality, training, compliance and later review.", icon: "FileAudio", sort_order: 8 },
    { title: "Multiple Call Attending", description: "Handle concurrent incoming or outgoing calls and scale channels as your workload grows.", icon: "PhoneCall", sort_order: 9 },
    { title: "CRM Support", description: "Connect the phone system with CRM workflows for better call context and team productivity.", icon: "Database", sort_order: 10 },
    { title: "Call Monitoring", description: "Review calling activity and monitor authorized inbound and outbound call records from the dashboard.", icon: "MonitorCheck", sort_order: 11 },
    { title: "Unlimited Extensions", description: "Create as many internal extensions as your business needs and keep teams reachable.", icon: "Network", sort_order: 12 },
  ],
  cloud_pbx_benefits: [
    { title: "Secure & Fast", description: "Designed for reliable business calling with security controls and responsive call handling.", icon: "ShieldCheck", sort_order: 1 },
    { title: "Dedicated Infrastructure", description: "Dedicated hosting keeps PBX workloads isolated for more predictable performance.", icon: "Server", sort_order: 2 },
    { title: "Reliable", description: "A business-focused hosted PBX experience built for day-to-day customer communication.", icon: "BadgeCheck", sort_order: 3 },
    { title: "Easy to Use", description: "Access your PBX over the internet without maintaining a traditional on-premise telephone system.", icon: "MousePointerClick", sort_order: 4 },
    { title: "Single Dashboard", description: "Manage extensions, calling activity and PBX operations from one control surface.", icon: "LayoutDashboard", sort_order: 5 },
    { title: "Expert Technical Support", description: "Get onboarding and technical guidance for SIP, routing and PBX configuration.", icon: "LifeBuoy", sort_order: 6 },
  ],
  cloud_pbx_documents: [
    { title: "NID Card Copy", description: "Clear copies of both sides of the national identity card.", icon: "IdCard", sort_order: 1 },
    { title: "Passport Size Photo", description: "A recent passport-size photograph with a clearly visible face.", icon: "Image", sort_order: 2 },
    { title: "Trade License Copy", description: "Company trade license copy, when applicable.", icon: "FileText", sort_order: 3 },
  ],
  cloud_pbx_clients: [
    { title: "Banglalink", image_url: "/assets/brands/banglalink.webp", sort_order: 1 },
    { title: "bKash", image_url: "/assets/brands/bkash.png", sort_order: 2 },
    { title: "Nagad", image_url: "/assets/brands/nagad.webp", sort_order: 3 },
    { title: "JTI", image_url: "/assets/brands/jti.png", sort_order: 4 },
    { title: "BDJobs", image_url: "/assets/brands/bdjobs.jpg", sort_order: 5 },
    { title: "Fingerprint Tech", image_url: "/assets/brands/fingerprinttech.jpg", sort_order: 6 },
  ],
  home_clients: [
    { title: "OTHORBD", image_url: "/assets/clients/imgi_100_my_buy_bd.jpg", sort_order: 1 },
    { title: "Inotech", image_url: "/assets/clients/imgi_102_rtpu.png", sort_order: 2 },
    { title: "Zirconia Shop", image_url: "/assets/clients/imgi_104_esodai-dot-com.png", sort_order: 3 },
    { title: "Bd Marriage", image_url: "/assets/clients/imgi_113_bahok-courier-Limited.png", sort_order: 4 },
    { title: "Rokomary Shop", image_url: "/assets/clients/imgi_143_kids-gallery-shop.png", sort_order: 5 },
    { title: "TOP N SHOP BD", image_url: "/assets/clients/imgi_152_dhaka-web-host.png", sort_order: 6 },
    { title: "Kids Gallery Shop", image_url: "/assets/clients/imgi_188_kids-gallery-shop.png", sort_order: 7 },
    { title: "Chorki", image_url: "/assets/clients/imgi_154_Staller-Digital-Limited.jpg", sort_order: 8 },
  ],
  cloud_pbx_faq: [
    { title: "What is a PBX phone system?", description: "PBX is a private business telephone system that lets teams share external lines while using internal extensions and call controls.", sort_order: 1 },
    { title: "What is a hosted Cloud PBX?", description: "A hosted Cloud PBX is operated by the service provider, so the business can use PBX capabilities without running and maintaining on-premise PBX hardware.", sort_order: 2 },
    { title: "How much does Cloud PBX cost?", description: "Pricing depends on the number of extensions, call channels, IVR requirements and other configuration choices. MyBDPhone packages can be changed from the admin panel.", sort_order: 3 },
    { title: "Why does a business need PBX?", description: "PBX centralizes business calling with extensions, routing, IVR, conferencing, recording and monitoring features that help teams manage customer communication.", sort_order: 4 },
    { title: "Can the same number receive multiple calls?", description: "Yes. Concurrent call capacity depends on the selected package and configured call channels.", sort_order: 5 },
  ],

};

// Built-in product pages are managed through the same Pages / Landing CMS.
// They use the same CMS engine as every other landing page.
const PRODUCT_CMS_DEFAULTS = {
  "ip-phone": {
    title: "IP Phone",
    template: "product_landing",
    featured_image: "/uploads/cms/ip-phone-icon.png",
    seo_title: "IP Phone | MyBDPhone",
    seo_description: "Clear, reliable and business-ready IP phones for modern communication.",
    sort_order: 10,
    sections: [
      ["hero", "hero", "IP Phone", "Clear, reliable and business-ready IP phones for modern communication.", 1, {
        eyebrow: "MODERN · SMART · SEAMLESS",
        image_url: "/uploads/cms/ip-phone-icon.png",
        primary_text: "Explore IP Phones",
        primary_url: "/shop",
        secondary_text: "Contact Sales",
        secondary_url: "/contact",
        badges: ["HD voice quality", "Plug & play setup", "Business ready"],
      }],
      ["features", "feature_grid", "IP Phone Features", "Everything you need for professional everyday calling.", 2, {
        collection_key: "ip_phone_features",
        columns: 4,
      }],
      ["overview", "image_text", "Simple, Reliable Business Communication", "MyBDPhone IP Phones are designed for clear conversations and easy business use.", 3, {
        image_url: "/uploads/cms/ip-phone-icon.png",
        image_position: "right",
        eyebrow: "WHY MYBDPHONE IP PHONE?",
      }],
      ["steps", "steps", "Easy Setup", "Connect, configure and start calling.", 4, {
        collection_key: "ip_phone_steps",
        columns: 3,
      }],
      ["use_cases", "use_cases", "Perfect For", "Suitable for teams that depend on reliable business communication.", 5, {
        collection_key: "ip_phone_use_cases",
        columns: 4,
      }],
      ["cta", "cta", "Upgrade Your Business Communication", "Experience clear and reliable communication with MyBDPhone IP Phones.", 6, {
        primary_text: "Explore IP Phones",
        primary_url: "/shop",
        secondary_text: "Contact Us",
        secondary_url: "/contact",
      }],
    ],
    collections: {
      ip_phone_features: [
        ["HD Voice Quality", "Enjoy clear and reliable business conversations.", "AudioWaveform", "", 1],
        ["Plug & Play Setup", "Easy to install and configure for everyday business use.", "PlugZap", "", 2],
        ["Call Management", "Use caller ID, hold, transfer and call history features.", "PhoneCall", "", 3],
        ["Reliable Connectivity", "Connect your phone to your supported business calling service.", "Wifi", "", 4],
      ],
      ip_phone_steps: [
        ["Connect Your IP Phone", "Connect the phone to your network.", "PlugZap", "", 1, "01"],
        ["Configure Your Service", "Add the supported MyBDPhone calling account.", "Layers", "", 2, "02"],
        ["Start Calling", "Make and receive clear business calls.", "PhoneCall", "", 3, "03"],
      ],
      ip_phone_use_cases: [
        ["Corporate Offices", "Reliable communication for employees and departments.", "Building2", 1],
        ["Call Centers", "Equip customer support teams with dependable calling devices.", "Headphones", 2],
        ["Reception Desks", "Handle incoming business calls professionally.", "PhoneIncoming", 3],
        ["Small Businesses", "A practical communication setup for growing teams.", "Store", 4],
      ],
    },
  },

  "virtual-number": {
    title: "Virtual Number",
    template: "product_landing",
    featured_image: "/uploads/cms/096-ip-number-icon.png",
    seo_title: "Virtual Number | MyBDPhone",
    seo_description: "Stay connected with customers from anywhere with a professional virtual number.",
    sort_order: 11,
    sections: [
      ["hero", "hero", "Virtual Number", "Stay connected with your customers from anywhere with a professional virtual number.", 1, {
        eyebrow: "FLEXIBLE · NATIONWIDE · EASY TO USE",
        image_url: "/uploads/cms/096-ip-number-icon.png",
        primary_text: "Get Virtual Number",
        primary_url: "/contact",
        secondary_text: "Contact Sales",
        secondary_url: "/contact",
        badges: ["Use from anywhere", "Call forwarding", "Professional business number"],
      }],
      ["features", "feature_grid", "Virtual Number Features", "Flexible tools for modern business communication.", 2, {
        collection_key: "virtual_number_features",
        columns: 4,
      }],
      ["overview", "image_text", "Your Business Number Without Location Limits", "Work from the office, home or anywhere else while keeping one professional business number.", 3, {
        image_url: "/uploads/cms/096-ip-number-icon.png",
        image_position: "left",
        eyebrow: "WHY VIRTUAL NUMBER?",
      }],
      ["steps", "steps", "How It Works", "Get connected in three simple steps.", 4, {
        collection_key: "virtual_number_steps",
        columns: 3,
      }],
      ["use_cases", "use_cases", "Perfect For", "A practical communication option for modern teams and businesses.", 5, {
        collection_key: "virtual_number_use_cases",
        columns: 4,
      }],
      ["cta", "cta", "Stay Connected Wherever Your Business Takes You", "Get your MyBDPhone Virtual Number and keep your customer communication moving.", 6, {
        primary_text: "Get Virtual Number",
        primary_url: "/contact",
        secondary_text: "Contact Sales",
        secondary_url: "/contact",
      }],
    ],
    collections: {
      virtual_number_features: [
        ["Professional Number", "Give your business a dedicated and trusted contact number.", "PhoneCall", "", 1],
        ["Use From Anywhere", "Manage your business calls from the office, home or another location.", "Globe2", "", 2],
        ["Call Forwarding", "Forward incoming calls to your preferred destination or device.", "PhoneForwarded", "", 3],
        ["IVR Support", "Create professional automated call menus for your customers.", "ListTree", "", 4],
      ],
      virtual_number_steps: [
        ["Choose Your Number", "Select the virtual number that fits your business.", "PhoneCall", "", 1, "01"],
        ["Configure Your Calls", "Set call forwarding and your preferred call flow.", "Route", "", 2, "02"],
        ["Receive Calls Anywhere", "Stay available to your customers from anywhere.", "Globe2", "", 3, "03"],
      ],
      virtual_number_use_cases: [
        ["Remote Businesses", "Keep a consistent business identity while working remotely.", "Globe2", 1],
        ["E-commerce", "Stay available for customer calls and service requests.", "ShoppingCart", 2],
        ["Sales Teams", "Give sales staff a professional business calling number.", "Users", 3],
        ["Customer Support", "Route and manage incoming customer communication.", "Headphones", 4],
      ],
    },
  },

  "business-ip-number": {
    title: "Business IP Number",
    template: "product_landing",
    featured_image: "/uploads/cms/096-ip-number-icon.png",
    seo_title: "Business IP Number | MyBDPhone",
    seo_description: "Give your business a professional identity with a dedicated business IP number.",
    sort_order: 12,
    sections: [
      ["hero", "hero", "Business IP Number", "Give your business a professional identity with a dedicated business number.", 1, {
        eyebrow: "PROFESSIONAL · SCALABLE · RELIABLE",
        image_url: "/uploads/cms/096-ip-number-icon.png",
        primary_text: "Get Business IP Number",
        primary_url: "/contact",
        secondary_text: "Talk to Sales",
        secondary_url: "/contact",
        badges: ["Dedicated business number", "Multi-device support", "Call history"],
      }],
      ["features", "feature_grid", "Business IP Number Features", "Core tools for professional business communication.", 2, {
        collection_key: "business_ip_number_features",
        columns: 4,
      }],
      ["overview", "image_text", "Everything Your Business Needs to Stay Connected", "Use one professional business identity across supported devices without relying on traditional telephone systems.", 3, {
        image_url: "/uploads/cms/096-ip-number-icon.png",
        image_position: "right",
        eyebrow: "WHY BUSINESS IP NUMBER?",
      }],
      ["steps", "steps", "How It Works", "Get your business number ready in three simple steps.", 4, {
        collection_key: "business_ip_number_steps",
        columns: 3,
      }],
      ["benefits", "feature_grid", "Business Benefits", "A simple communication foundation for growing teams.", 5, {
        collection_key: "business_ip_number_benefits",
        columns: 3,
      }],
      ["cta", "cta", "Give Your Business a Professional Voice", "Get your MyBDPhone Business IP Number today.", 6, {
        primary_text: "Get Started",
        primary_url: "/contact",
        secondary_text: "Contact Us",
        secondary_url: "/contact",
      }],
    ],
    collections: {
      business_ip_number_features: [
        ["Professional Business Identity", "Build a trusted business identity with a dedicated number.", "Globe2", "", 1],
        ["Multi-Device Calling", "Use your business number from supported IP phone, mobile or computer devices.", "Smartphone", "", 2],
        ["Call History", "Keep track of incoming and outgoing business calls.", "History", "", 3],
        ["Customer Communication", "Stay available for customers and respond faster.", "Users", "", 4],
      ],
      business_ip_number_steps: [
        ["Get Your Number", "Choose your business IP number.", "PhoneCall", "", 1, "01"],
        ["Connect Your Devices", "Connect supported IP phone, mobile or computer devices.", "Smartphone", "", 2, "02"],
        ["Start Calling", "Make and receive business calls from anywhere.", "PhoneOutgoing", "", 3, "03"],
      ],
      business_ip_number_benefits: [
        ["Professional Image", "Give customers a dedicated business contact number.", "Building2", "", 1],
        ["Lower Communication Cost", "Reduce traditional business calling expenses.", "ReceiptText", "", 2],
        ["Flexible Communication", "Stay connected whether you are in the office or working remotely.", "Globe2", "", 3],
      ],
    },
  },

  "auto-dialer": {
    title: "Auto Dialer",
    template: "product_landing",
    featured_image: "/uploads/cms/ai-calling-icon.png",
    seo_title: "Auto Dialer & Outbound Call Automation | MyBDPhone",
    seo_description: "Triple your outbound sales reach with MyBDPhone intelligent Auto Dialer, predictive routing and live agent bridging.",
    sort_order: 13,
    sections: [
      ["hero", "hero", "Next-Gen Auto Dialer & High-Volume Call Automation", "Supercharge your sales team and contact center with automated outbound dialing, predictive algorithms, real-time live transfer, and crystal-clear 096 IP connectivity.", 1, {
        eyebrow: "OUTBOUND SALES AUTOMATION · PREDICTIVE AUTO DIALER",
        image_url: "/uploads/cms/ai-calling-icon.png",
        primary_text: "Start Auto Dialing",
        primary_url: "/packages",
        secondary_text: "Book a Demo",
        secondary_url: "/contact",
        badges: ["300% Higher Talk Time", "Smart Answering Machine Filter", "Official 096 IP Telephony"],
      }],
      ["features", "feature_grid", "Core Auto Dialer Capabilities", "Intelligent dialing tools engineered to eliminate agent idle time and boost live call connections.", 2, {
        collection_key: "auto_dialer_features",
        columns: 4,
      }],
      ["why_choose_us", "image_text", "Why High-Growth Sales Teams Choose MyBDPhone", "Manual dialing wastes over 60% of agent time listening to busy tones, unanswered rings, and voicemails. MyBDPhone Auto Dialer automates the repetitive work so your agents focus 100% on closing deals.", 3, {
        image_url: "/uploads/cms/ai-calling-icon.png",
        image_position: "right",
        eyebrow: "MAXIMIZE OUTBOUND ROI",
        primary_text: "Explore Packages",
        primary_url: "/packages",
        secondary_text: "Talk to Sales Team",
        secondary_url: "/contact",
      }],
      ["steps", "steps", "How It Works in 3 Simple Steps", "Launch your high-volume outbound calling campaigns in under 5 minutes with our intuitive cloud portal.", 4, {
        collection_key: "auto_dialer_steps",
        columns: 3,
      }],
      ["use_cases", "use_cases", "Tailored for Diverse Outbound Operations", "Explore how growing businesses and contact centers across Bangladesh leverage MyBDPhone Auto Dialer.", 5, {
        collection_key: "auto_dialer_use_cases",
        columns: 4,
      }],
      ["benefits", "feature_grid", "Unmatched Business Benefits", "Built from the ground up for telecom compliance, high concurrency, and measurable team productivity.", 6, {
        collection_key: "auto_dialer_benefits",
        columns: 4,
      }],
      ["pricing", "pricing", "Flexible Auto Dialer Packages", "Transparent pricing designed to scale with your sales team and call volume. No hidden telecom fees.", 7, {
        collection_key: "auto_dialer_packages",
        package_service_type: "",
      }],
      ["faq", "faq", "Frequently Asked Questions", "Everything you need to know about MyBDPhone Auto Dialer system and implementation.", 8, {
        collection_key: "auto_dialer_faq",
      }],
      ["cta", "cta", "Ready to Triple Your Outbound Sales Reach?", "Join hundreds of fast-growing Bangladeshi companies automating their calling workflows with MyBDPhone Auto Dialer.", 9, {
        primary_text: "Get Started Today",
        primary_url: "/packages",
        secondary_text: "Schedule Live Demo",
        secondary_url: "/contact",
      }],
    ],
    collections: {
      auto_dialer_features: [
        ["Predictive & Power Dialing", "Automatically dials contact numbers at scale and instantly connects answered calls to ready agents with zero latency.", "Zap", "", 1],
        ["Smart Contact List Manager", "Upload bulk CSV leads, filter duplicates or invalid numbers, and automate customized dialing shifts effortlessly.", "ListChecks", "", 2],
        ["Live Agent Transfer & IVR", "Play interactive audio prompts, gather DTMF keypress responses, and warm-transfer hot prospects to agents.", "PhoneForwarded", "", 3],
        ["Real-time Campaign Analytics", "Track connect rates, agent talk durations, disposition tags, and campaign ROI live from a single screen.", "ChartNoAxesCombined", "", 4],
      ],
      auto_dialer_steps: [
        ["Upload Lead Database", "Import customer CSV or Excel lists with custom tags such as customer name, product, or billing amount.", "ListTree", "", 1, "01"],
        ["Configure Rules & Schedule", "Select dialing mode (Predictive, Progressive, or Broadcast), set working hours, and assign agent queues.", "CalendarClock", "", 2, "02"],
        ["Connect & Close Deals", "The dialer places calls, filters out dead lines, and connects live prospects directly to your sales team.", "PhoneCall", "", 3, "03"],
      ],
      auto_dialer_use_cases: [
        ["Telesales & Telemarketing", "Triple outbound reach and close more subscriptions, loans, and software sales per agent shift.", "Megaphone", 1],
        ["Payment & EMI Collections", "Automate payment reminders, loan installment notices, and invoice due calls with personalized audio.", "ReceiptText", 2],
        ["E-commerce Verification", "Confirm Cash-On-Delivery orders automatically before dispatching to dramatically slash return rates.", "ShoppingCart", 3],
        ["Customer Feedback Surveys", "Run automated voice satisfaction surveys with DTMF keypress rating to measure customer satisfaction.", "ClipboardCheck", 4],
      ],
      auto_dialer_benefits: [
        ["3x Agent Productivity", "Eliminate manual dialing delays and keep your sales reps engaged in meaningful customer conversations.", "TrendingUp", "", 1],
        ["Zero Dropped Calls", "Low-latency carrier switching guarantees crystal-clear voice and instant agent bridging upon answer.", "ShieldCheck", "", 2],
        ["Multi-Device WebRTC & SIP", "Agents can place calls directly from their browser dashboard or via Android and Windows softphones.", "Smartphone", "", 3],
        ["100% Call Recording & Audit", "Encrypted cloud audio recordings available for training, performance audits, and regulatory compliance.", "FileAudio", "", 4],
      ],
      auto_dialer_packages: [
        ["Starter Dialer", "Ideal for small outbound sales teams launching automated calling.", "Zap", "", 1, "৳1,495/mo", {
          price: 1495,
          billing: "month",
          description: "Ideal for small outbound sales teams launching automated calling.",
          features: [
            "Up to 3 Agent Seats",
            "10,000 Outbound Minutes Capacity",
            "Progressive & Preview Dialing",
            "Bulk Contact CSV Upload",
            "Basic Call Recording (30 Days)",
            "Standard 096 IP Caller ID",
          ],
          button_text: "Choose Starter Dialer",
          button_url: "/packages",
        }],
        ["Business Predictive", "Predictive AI dialing for growing contact centers and telesales teams.", "Sparkles", "", 2, "৳3,495/mo", {
          price: 3495,
          billing: "month",
          description: "Predictive AI dialing for growing contact centers and telesales teams.",
          popular: true,
          badge_text: "MOST POPULAR",
          features: [
            "Up to 10 Agent Seats",
            "50,000 Outbound Minutes Capacity",
            "Predictive & Power AI Dialing",
            "Smart Answering Machine Detection",
            "Live Call Monitoring & Whispering",
            "Cloud Call Recording (90 Days)",
            "Priority 24/7 Support",
          ],
          button_text: "Choose Business Predictive",
          button_url: "/packages",
        }],
        ["Enterprise Pro", "High-capacity multi-campaign dialer for large organizations.", "Building2", "", 3, "৳7,995/mo", {
          price: 7995,
          billing: "month",
          description: "High-capacity multi-campaign dialer for large organizations.",
          badge_text: "HIGH VOLUME",
          features: [
            "Unlimited Agent Seats",
            "Custom Call Minutes Quota",
            "Multi-Campaign Simultaneous Dialing",
            "Custom CRM & Webhook API Integration",
            "Dedicated Account Manager & SLA",
            "Unlimited Call Recording Storage",
            "Dedicated Carrier SIP Trunk",
          ],
          button_text: "Contact Enterprise",
          button_url: "/contact",
        }],
      ],
      auto_dialer_faq: [
        ["What is an Auto Dialer and how does it benefit my business?", "An Auto Dialer is an automated telephony software that dials a list of phone numbers automatically. Once a live person answers, it immediately connects the call to a live agent or plays an automated interactive message, saving hours of manual dialing time.", "HelpCircle", "", 1],
        ["Do I need special hardware to use MyBDPhone Auto Dialer?", "No specialized hardware is required. Your agents can use any computer with a headset via our web dialer, or use our mobile and desktop SIP applications with standard internet connectivity.", "HelpCircle", "", 2],
        ["Does it support official Bangladeshi 096 IP numbers?", "Yes, MyBDPhone is a licensed telecom service provider in Bangladesh. All outbound calls display your official, verified 096 business IP number as Caller ID.", "HelpCircle", "", 3],
        ["Can I integrate Auto Dialer with my existing CRM?", "Yes. We provide webhook endpoints and REST APIs to sync contact lists, trigger automated calls from CRM events, and log call recordings back into your system.", "HelpCircle", "", 4],
        ["How quickly can our team get started?", "You can be up and running within 15 minutes. Sign up, upload your contact list, configure your campaign settings, and launch your first outbound dialer batch.", "HelpCircle", "", 5],
      ],
    },
  },

  "voice-broadcast": {
    title: "Voice Broadcast",
    template: "product_landing",
    featured_image: "/uploads/cms/ai-calling-icon.png",
    seo_title: "Voice Broadcast & Automated Voice Messaging | MyBDPhone",
    seo_description: "Send personalized voice messages to thousands of customers simultaneously with MyBDPhone Voice Broadcast.",
    sort_order: 14,
    sections: [
      ["hero", "hero", "Bulk Voice Broadcast & Automated Voice Messaging", "Reach thousands of customers instantly with high-speed automated voice broadcasts, Bangla text-to-speech, and interactive DTMF response collection.", 1, {
        eyebrow: "MASS VOICE BROADCAST · INSTANT OUTREACH",
        image_url: "/uploads/cms/ai-calling-icon.png",
        primary_text: "Launch Broadcast",
        primary_url: "/packages",
        secondary_text: "Contact Sales",
        secondary_url: "/contact",
        badges: ["10,000+ Calls Per Minute", "Bangla & English Neural Voice", "DTMF Keypress Capture"],
      }],
      ["features", "feature_grid", "Voice Broadcast Features", "Everything you need to deliver high-impact voice announcements across Bangladesh.", 2, {
        collection_key: "voice_broadcast_features",
        columns: 4,
      }],
      ["why_choose_us", "image_text", "Higher Engagement Than Traditional SMS", "Voice broadcasts deliver 5x higher engagement and response rates compared to text SMS, allowing you to connect with both literate and non-literate audiences effectively.", 3, {
        image_url: "/uploads/cms/ai-calling-icon.png",
        image_position: "right",
        eyebrow: "WHY VOICE BROADCAST?",
        primary_text: "Explore Packages",
        primary_url: "/packages",
        secondary_text: "Contact Sales",
        secondary_url: "/contact",
      }],
      ["steps", "steps", "How Voice Broadcast Works", "Broadcast your audio message in three simple steps.", 4, {
        collection_key: "voice_broadcast_steps",
        columns: 3,
      }],
      ["use_cases", "use_cases", "Ideal Use Cases", "Powerful mass communication for commercial, promotional, and emergency scenarios.", 5, {
        collection_key: "voice_broadcast_use_cases",
        columns: 4,
      }],
      ["cta", "cta", "Broadcast Your Message to Millions Today", "Get started with MyBDPhone Voice Broadcast for instant customer communication.", 6, {
        primary_text: "Start Broadcasting",
        primary_url: "/packages",
        secondary_text: "Talk to Expert",
        secondary_url: "/contact",
      }],
    ],
    collections: {
      voice_broadcast_features: [
        ["Bangla Neural TTS", "Convert Bangla & English scripts into natural human-sounding voice broadcasts automatically.", "AudioWaveform", "", 1],
        ["Mass Call Concurrency", "Deliver thousands of simultaneous voice calls with our high-capacity carrier lines.", "Zap", "", 2],
        ["Interactive DTMF Input", "Collect keypress feedback (e.g., Press 1 to confirm, 2 to talk with an agent).", "PhoneForwarded", "", 3],
        ["Instant Delivery Analytics", "Track answered calls, listening duration, retry attempts, and export detailed CSV reports.", "ChartNoAxesCombined", "", 4],
      ],
      voice_broadcast_steps: [
        ["Record or Type Script", "Upload an MP3 audio file or enter text to convert using Bangla Neural TTS.", "FileAudio", "", 1, "01"],
        ["Upload Contact List", "Import recipient phone numbers in bulk via simple CSV file.", "ListTree", "", 2, "02"],
        ["Schedule & Broadcast", "Set broadcast start time and concurrency rate to launch your voice campaign.", "Play", "", 3, "03"],
      ],
      voice_broadcast_use_cases: [
        ["Promotional Offers", "Send voice marketing alerts for seasonal discounts and new product launches.", "Megaphone", 1],
        ["Emergency Alerts", "Broadcast urgent community notifications, service downtimes, or weather warnings.", "BellRing", 2],
        ["Payment Reminders", "Notify customers regarding upcoming loan installments and utility bill dues.", "ReceiptText", 3],
        ["Event Invitations", "Deliver personalized voice invitations for corporate events, webinars, and expos.", "CalendarDays", 4],
      ],
    },
  },
};

const FEATURE_CMS_DEFAULTS = {
  "smart-ivr-routing": {
    title: "Smart IVR Routing",
    meta_title: "Smart IVR Routing - MyBDPhone",
    meta_description: "AI & CRM-driven intelligent IVR call routing system.",
    template: "landing",
    featured_image: "/uploads/cms/cloud-pbx-icon.png",
    sort_order: 51,
    sections: [
      {
        section_key: "hero",
        section_type: "HERO",
        title: "Smart IVR Routing",
        subtitle: "AI & CRM-Driven Dynamic Call Distribution Engine",
        content_body: "Route incoming calls intelligently with our dynamic IVR engine. Automatically identify VIP callers, check business hours, match skill-based agents, and deliver every call to the right destination in milliseconds.",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 1,
        image_url: "/uploads/cms/cloud-pbx-icon.png",
        custom_settings: {
          eyebrow: "INTELLIGENT CALL DISTRIBUTION",
          primary_text: "Get 096 IP Phone",
          primary_url: "/ip-phone",
          secondary_text: "View All Packages",
          secondary_url: "/packages",
          badges: ["< 200ms Routing Decision", "CRM Database Sync", "Multi-Level Bangla/English DTMF"]
        }
      },
      {
        section_key: "animated_flow",
        section_type: "ANIMATED_FLOW",
        title: "How Smart IVR Routing Works",
        subtitle: "Intelligent routing based on CRM history, caller location, time, and skills.",
        content_body: "Our Dynamic IVR Engine processes incoming calls in real-time to route customers to the right agent instantly.",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 2,
        custom_settings: {
          eyebrow: "INTERACTIVE ARCHITECTURE SIMULATOR",
          scenarios: [
            {
              id: "vip",
              label: "VIP Customer Priority Route",
              branch: "vip",
              badge: "PRIORITY 1",
              description: "High-value VIP callers bypass general wait queues and connect directly to Senior Account Managers with personalized greeting."
            },
            {
              id: "time",
              label: "After-Hours & Holiday Time Route",
              branch: "time",
              badge: "SCHEDULE",
              description: "Calls outside 9am-6pm redirect automatically to on-call emergency mobile or voicemail with email MP3 delivery."
            },
            {
              id: "skill",
              label: "DTMF Skill & Language Matching",
              branch: "skill",
              badge: "INTELLIGENT",
              description: "Caller selects Bangla/English and Support/Sales to reach the most qualified active agent."
            }
          ],
          steps: [
            { id: 1, title: "Customer Call Received", desc: "Incoming call hits IP Phone network trunk (096)", icon: "PhoneIncoming" },
            { id: 2, title: "Dynamic IVR Engine", desc: "Fetches Caller ID & checks CRM / database in <120ms", icon: "Cpu" },
            { id: 3, title: "Condition Logic Check", desc: "Evaluates VIP Priority, Time/Region, & DTMF Skill Menu", icon: "GitBranch" },
            { id: 4, title: "Route to Exact Agent", desc: "Connects call to the most qualified available agent / extension", icon: "UserCheck" }
          ]
        }
      },
      {
        section_key: "crm_integration",
        section_type: "TEXT_IMAGE_SPLIT",
        title: "Deep CRM & Telephony Integration",
        subtitle: "Instant caller identification and automated screen popups.",
        content_body: "When an incoming call arrives, our IVR queries your CRM via REST API or webhook. Customer identity, purchase history, and priority score are immediately extracted to guide routing decisions with zero manual intervention.",
        layout_orientation: "IMAGE_LEFT",
        display_order: 3,
        image_url: "/uploads/cms/cloud-pbx-icon.png",
        custom_settings: {
          eyebrow: "ENTERPRISE TELEPHONY",
          badges: ["Zero Manual Routing", "REST & Webhook APIs", "Live Agent Screen Pop"],
          primary_text: "Explore Cloud PBX",
          primary_url: "/cloud-pbx"
        }
      },
      {
        section_key: "core_features",
        section_type: "FEATURE_GRID",
        title: "Core IVR Capabilities & Modules",
        subtitle: "Everything you need to orchestrate complex corporate call journeys.",
        content_body: "",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 4,
        custom_settings: {
          eyebrow: "FEATURE HIGHLIGHTS",
          columns: 4,
          items: [
            { title: "CRM-Integrated Caller ID", description: "Instantly identify callers from your CRM database and route VIP clients to priority agents with personalized greetings.", icon: "Users" },
            { title: "Time-Based Routing", description: "Automatically adjust routing rules based on business hours, holidays, and regional time zones across Bangladesh.", icon: "Clock" },
            { title: "Skill-Based Agent Matching", description: "Match callers to the most qualified available agent based on language preference, department, and expertise level.", icon: "Sliders" },
            { title: "Multi-Level DTMF Menus", description: "Create unlimited nested IVR menus with professional voice prompts in both Bangla and English languages.", icon: "PhoneCall" }
          ]
        }
      },
      {
        section_key: "neural_voice",
        section_type: "TEXT_IMAGE_SPLIT",
        title: "Bangla & English Neural Voice Menus",
        subtitle: "Natural-sounding AI prompts that elevate your brand reputation.",
        content_body: "Deliver a flawless first impression with studio-quality audio in both standard Bangla and English. Integrate with our AI Bangla Voice TTS engine to generate dynamic personalized voice greetings on the fly.",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 5,
        image_url: "/uploads/cms/ai-calling-icon.png",
        custom_settings: {
          eyebrow: "LOCALIZED VOICE AI",
          badges: ["Natural Neural Voice", "Dynamic Name Greeting", "Bilingual Support"],
          primary_text: "Explore AI Calling",
          primary_url: "/ai-calling"
        }
      },
      {
        section_key: "cta_banner",
        section_type: "CTA_BANNER",
        title: "Ready to Automate Your Call Routing with Smart IVR?",
        subtitle: "Set up intelligent IVR routing for your 096 IP Phone number in under 10 minutes. No expensive PBX hardware required.",
        content_body: "",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 6,
        custom_settings: {
          eyebrow: "START IN MINUTES",
          primary_text: "Get 096 IP Phone",
          primary_url: "/ip-phone",
          secondary_text: "View All Packages",
          secondary_url: "/packages"
        }
      }
    ]
  },
  "multi-device-ringing": {
    title: "Multi-Device Ringing",
    meta_title: "Multi-Device Ringing - MyBDPhone",
    meta_description: "Simultaneous call ringing across IP phones, web, and mobile apps.",
    template: "landing",
    featured_image: "/uploads/cms/ip-phone-icon.png",
    sort_order: 52,
    sections: [
      {
        section_key: "hero",
        section_type: "HERO",
        title: "Multi-Device Ringing",
        subtitle: "Simultaneous & Cascade Call Routing Across 5 Devices",
        content_body: "Never miss a critical client inquiry. When customers call your 096 IP number, ring your IP desk phone, laptop browser, PC softphone, and mobile devices concurrently. The first answered device connects the call with zero delay.",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 1,
        image_url: "/uploads/cms/ip-phone-icon.png",
        custom_settings: {
          eyebrow: "UNIFIED TELEPHONY PRESENCE",
          primary_text: "Get 096 IP Phone",
          primary_url: "/ip-phone",
          secondary_text: "View All Packages",
          secondary_url: "/packages",
          badges: ["Up to 5 Endpoints Concurrently", "< 120ms Ringing Latency", "WebRTC + SIP Support"]
        }
      },
      {
        section_key: "animated_flow",
        section_type: "ANIMATED_FLOW",
        title: "Simultaneous Multi-Device Ringing Flow",
        subtitle: "How MyBDPhone Cloud PBX manages multi-device SIP registration and parallel dispatch in milliseconds.",
        content_body: "When an inbound 096 call arrives, our switch instantly forks the call to all active registered devices simultaneously and cleanly cancels ringing on others when answered.",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 2,
        custom_settings: {
          eyebrow: "CARRIER-GRADE TELECOM SWITCHING",
          scenarios: [
            {
              id: "simultaneous",
              label: "Simultaneous Forking (All 5 Devices)",
              branch: "vip",
              badge: "RECOMMENDED",
              description: "All 5 connected hardware and mobile devices ring concurrently; first pickup answers cleanly with zero audio lag."
            },
            {
              id: "sequential",
              label: "Sequential Cascade (Desk -> Mobile)",
              branch: "time",
              badge: "HIERARCHY",
              description: "Rings office desk phone first; if unanswered for 10s, cascades to mobile app then backup teammate."
            },
            {
              id: "hunt_group",
              label: "Hunt Group & Round Robin",
              branch: "skill",
              badge: "QUEUE",
              description: "Evenly distributes calls across available team member devices for fair workload balancing."
            }
          ],
          steps: [
            { id: 1, title: "SIP Registration Sync", desc: "Hardware desk phone, WebRTC browser, and mobile apps maintain active presence pings", icon: "Cpu" },
            { id: 2, title: "Inbound 096 Call Ingestion", desc: "Customer dials your 096 number via Bangladesh PSTN / IPTSP interconnect", icon: "PhoneIncoming" },
            { id: 3, title: "Parallel Multi-Endpoint Fork", desc: "Routing core broadcasts SIP INVITE packets to all 5 registered endpoints simultaneously", icon: "Radio" },
            { id: 4, title: "First-Answer Bridging", desc: "First answered device connects RTP audio while cancel signal terminates ringing on others", icon: "CheckCircle2" }
          ]
        }
      },
      {
        section_key: "failover_split",
        section_type: "TEXT_IMAGE_SPLIT",
        title: "Flexible Ringing Strategies & Failover Rules",
        subtitle: "Choose simultaneous forking, cascade hierarchy, or hunt group queues.",
        content_body: "Customize how your incoming calls are distributed. If your phone battery runs out or internet drops, our automated failover routing immediately forwards the call to GSM mobile or voicemail with email notification.",
        layout_orientation: "IMAGE_LEFT",
        display_order: 3,
        image_url: "/uploads/cms/cloud-pbx-icon.png",
        custom_settings: {
          eyebrow: "FAILSAFE AUTOMATION",
          badges: ["Simultaneous Forking", "Automated GSM Fallback", "Voicemail to Email"],
          primary_text: "Explore Packages",
          primary_url: "/packages"
        }
      },
      {
        section_key: "devices_grid",
        section_type: "FEATURE_GRID",
        title: "Connected Device Ecosystem",
        subtitle: "Run your corporate number on any device from anywhere in the world.",
        content_body: "",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 4,
        custom_settings: {
          eyebrow: "HARDWARE & SOFTWARE COMPATIBILITY",
          columns: 4,
          items: [
            { title: "IP Desk Phones", description: "Plug & Play support for Grandstream, Yealink, Cisco and Fanvil SIP phones.", icon: "PhoneCall" },
            { title: "WebRTC Web Portal", description: "Make and receive calls directly inside Google Chrome or Microsoft Edge browser.", icon: "Laptop" },
            { title: "Mobile Apps (Android & iOS)", description: "Grandstream Wave, Linphone, Zoiper with push notification background wake-up.", icon: "Smartphone" },
            { title: "Desktop Softphones", description: "MicroSIP and native desktop apps for Windows and macOS workstations.", icon: "Monitor" }
          ]
        }
      },
      {
        section_key: "cta_banner",
        section_type: "CTA_BANNER",
        title: "Ready to Enable Multi-Device Ringing for Your Business?",
        subtitle: "Activate an official 096 IP Phone number with full multi-device ringing support in under 10 minutes.",
        content_body: "",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 5,
        custom_settings: {
          eyebrow: "GET CONNECTED TODAY",
          primary_text: "Get 096 IP Phone",
          primary_url: "/ip-phone",
          secondary_text: "View All Packages",
          secondary_url: "/packages"
        }
      }
    ]
  },
  "call-recording": {
    title: "Call Recording & Audio Storage",
    meta_title: "Call Recording & Audio Storage - MyBDPhone",
    meta_description: "Secure, encrypted cloud call recording and dual-channel audio storage archive for compliance and quality assurance.",
    template: "landing",
    featured_image: "/uploads/cms/1791029023414-Mint-Voice-Recording-Workspace.png",
    sort_order: 53,
    sections: [
      {
        section_key: "hero",
        section_type: "HERO",
        title: "Enterprise Cloud Call Recording & Audio Storage",
        subtitle: "Automated Dual-Channel High-Definition Voice Audio Archiving",
        content_body: "Capture, encrypt, and securely index every inbound and outbound business conversation. Comply with BTRC regulatory requirements, evaluate agent performance, and resolve customer disputes in seconds with instant search and crystal-clear audio playback.",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 1,
        image_url: "/uploads/cms/1791029023414-Mint-Voice-Recording-Workspace.png",
        custom_settings: {
          eyebrow: "COMPLIANCE & QUALITY ASSURANCE",
          primary_text: "View Calling Packages",
          primary_url: "/packages",
          secondary_text: "Contact Telecom Sales",
          secondary_url: "/contact",
          badges: ["Dual-Channel Stereo Audio", "AES-256 Military Encryption", "90-Day Instant Playback", "BTRC Telecom Compliant"]
        }
      },
      {
        section_key: "core_features",
        section_type: "FEATURE_GRID",
        title: "Carrier-Grade Recording & Archiving Features",
        subtitle: "Built for enterprise contact centers, compliance audits, quality monitoring, and agent training.",
        content_body: "",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 2,
        custom_settings: {
          eyebrow: "CARRIER-GRADE CAPABILITIES",
          columns: 4,
          items: [
            {
              title: "Dual-Channel Stereo Audio",
              description: "Separates customer audio and agent audio onto discrete channels for crisp playback and 100% accurate AI speech recognition.",
              icon: "AudioWaveform"
            },
            {
              title: "AES-256 Bank-Grade Encryption",
              description: "Every audio file is encrypted at rest and in transit with SHA-256 integrity checksums to prevent any unauthorized tampering.",
              icon: "ShieldCheck"
            },
            {
              title: "Instant In-Browser Web Player",
              description: "Preview recordings in real-time with waveform scrubbers, 5s skip, variable speed playback (1x, 1.5x, 2x), and speaker isolation.",
              icon: "Play"
            },
            {
              title: "Automated Retention & Export",
              description: "Define custom retention schedules with 1-click batch download in high-bitrate MP3 or uncompressed studio WAV format.",
              icon: "Clock"
            }
          ]
        }
      },
      {
        section_key: "live_audio_player",
        section_type: "CALL_RECORDING_PLAYER",
        title: "Live Call Recording & Audio Storage Console",
        subtitle: "Experience dual-channel crystal-clear playback with real-time waveform visualization, speaker separation, and synchronized dialogue transcript.",
        content_body: "",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 3,
        custom_settings: {
          eyebrow: "INTERACTIVE AUDIO ARCHIVE",
          samples: [
            {
              id: "rec_001",
              title: "Order Confirmation & Payment Verification",
              agent: "Tanvir Ahmed (Senior Account Rep)",
              caller_id: "+880 1712-345678",
              call_type: "Inbound Call",
              channel: "Dual-Channel Stereo (Agent: Left / Caller: Right)",
              duration: "0:12",
              audio_url: "/uploads/audio/tanvir.mp3",
              date: "Today, 10:45 AM",
              status: "AES-256 Encrypted",
              department: "Sales & Billing",
              transcript: [
                { speaker: "Agent (Tanvir)", text: "আসসালামু আলাইকুম। মাই বিডি ফোন থেকে বলছি। আপনার অর্ডারের নিরাপত্তা নিশ্চিত করতে তথ্যটি কনফার্ম করছি।", time: "0:02" },
                { speaker: "Customer", text: "ওয়ালাইকুম আসসালাম। হ্যাঁ, আমি কনফার্মেশন কোড পেয়েছি।", time: "0:06" },
                { speaker: "Agent (Tanvir)", text: "ধন্যবাদ স্যার, আপনার অর্ডার সফলভাবে প্রসেস করা হয়েছে।", time: "0:10" }
              ]
            },
            {
              id: "rec_002",
              title: "Customer Support & Service Activation",
              agent: "Nusrat Jahan (Customer Success)",
              caller_id: "+880 1987-654321",
              call_type: "Inbound Call",
              channel: "Dual-Channel Stereo (Agent: Left / Caller: Right)",
              duration: "0:15",
              audio_url: "/uploads/audio/nusrat.mp3",
              date: "Today, 09:30 AM",
              status: "AES-256 Encrypted",
              department: "Technical Support",
              transcript: [
                { speaker: "Agent (Nusrat)", text: "শুভ সকাল! মাই বিডি ফোন কাস্টমার কেয়ারে স্বাগতম। আমি কীভাবে সহায়তা করতে পারি?", time: "0:03" },
                { speaker: "Customer", text: "আমার নতুন আইপি ফোন লাইন অ্যাক্টিভেশনের স্ট্যাটাস জানতে চাচ্ছিলাম।", time: "0:08" },
                { speaker: "Agent (Nusrat)", text: "অবশ্যই স্যার, আপনার সার্ভিসটি আজ দুপুর ২টার মধ্যেই সম্পূর্ণ অ্যাক্টিভ হয়ে যাবে।", time: "0:13" }
              ]
            },
            {
              id: "rec_003",
              title: "Doctor Appointment & Clinic Hotline",
              agent: "Sabbir Hossain (Medical Coordinator)",
              caller_id: "+880 1823-456789",
              call_type: "Outbound Automated Follow-up",
              channel: "Dual-Channel Stereo (Agent: Left / Caller: Right)",
              duration: "0:14",
              audio_url: "/uploads/audio/sabbir.mp3",
              date: "Yesterday, 04:15 PM",
              status: "AES-256 Encrypted",
              department: "Healthcare Telephony",
              transcript: [
                { speaker: "Agent (Sabbir)", text: "নমস্কার, আগামীকাল বিকাল ৪টায় আপনার বিশেষজ্ঞ ডাক্তারের অ্যাপয়েন্টমেন্ট নির্ধারিত রয়েছে।", time: "0:04" },
                { speaker: "Customer", text: "জি, আমি সময়মতো উপস্থিত থাকব। ধন্যবাদ।", time: "0:09" },
                { speaker: "Agent (Sabbir)", text: "ধন্যবাদ। কোনো পরিবর্তন প্রয়োজন হলে আমাদের হটলাইনে কল করতে পারেন।", time: "0:13" }
              ]
            },
            {
              id: "rec_004",
              title: "Corporate Billing & Subscription Renewal",
              agent: "Ayesha Siddiqua (Billing Specialist)",
              caller_id: "+880 1611-223344",
              call_type: "Inbound Billing Helpdesk",
              channel: "Dual-Channel Stereo (Agent: Left / Caller: Right)",
              duration: "0:16",
              audio_url: "/uploads/audio/ayesha.mp3",
              date: "Yesterday, 02:00 PM",
              status: "AES-256 Encrypted",
              department: "Accounts & Finance",
              transcript: [
                { speaker: "Agent (Ayesha)", text: "প্রিয় গ্রাহক, আপনার কর্পোরেট আইপিবিএক্স সার্ভিসের মাসিক বিল সফলভাবে গৃহীত হয়েছে।", time: "0:04" },
                { speaker: "Customer", text: "ই-ইনভয়েস কপি কি ইমেইলে পাঠিয়ে দেওয়া হয়েছে?", time: "0:09" },
                { speaker: "Agent (Ayesha)", text: "জি স্যার, আপনার রেজিস্টার্ড ইমেইলে পিডিএফ ইনভয়েস পাঠিয়ে দেওয়া হয়েছে।", time: "0:14" }
              ]
            }
          ]
        }
      },
      {
        section_key: "cta_banner",
        section_type: "CTA_BANNER",
        title: "Ready to Enable Cloud Call Recording for Your Business?",
        subtitle: "Activate automated dual-channel call recording on your official 096 IP number with unlimited secure storage.",
        content_body: "",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 4,
        custom_settings: {
          eyebrow: "INSTANT SETUP & ZERO HARDWARE",
          primary_text: "View Calling Packages",
          primary_url: "/packages",
          secondary_text: "Contact Telecom Sales",
          secondary_url: "/contact"
        }
      }
    ]
  },
  "ai-calling-automation": {
    title: "AI Calling & Voice Automation",
    meta_title: "AI Calling & Voice Automation - MyBDPhone",
    meta_description: "Autonomous Conversational Voice AI & Neural Bangla TTS for Bangladesh Enterprises.",
    template: "landing",
    featured_image: "/uploads/cms/ai-calling-icon.png",
    sort_order: 53,
    sections: [
      {
        section_key: "hero",
        section_type: "HERO",
        title: "AI Calling & Voice Automation",
        subtitle: "Next-Gen Autonomous Voice AI for Inbound Support & High-Impact Outbound Campaigns",
        content_body: "Equip your business with conversational AI voice agents capable of conducting dynamic outbound broadcasts, customer support, OTP verifications, and order follow-ups with fluent, human-like Bangla and English speech.",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 1,
        image_url: "/uploads/cms/ai-calling-icon.png",
        custom_settings: {
          eyebrow: "NEURAL TELEPHONY AI",
          primary_text: "Talk to Telecom Specialist",
          primary_url: "/contact",
          secondary_text: "View Voice Packages",
          secondary_url: "/packages",
          badges: ["Bangla Neural Voice Engine", "Real-Time <450ms ASR Latency", "10,000+ Concurrent Calls", "Official BTRC 096 Telephony"]
        }
      },
      {
        section_key: "pipeline_flow",
        section_type: "HOW_IT_WORKS",
        title: "How Our Real-Time Voice AI Pipeline Works",
        subtitle: "Ultra-low latency architecture bridging official 096 SIP trunks with state-of-the-art Neural Bangla LLMs.",
        content_body: "From the moment the caller speaks to the instant our neural model responds, our 4-stage processing engine handles transcription, intent reasoning, and voice generation in under 450 milliseconds.",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 2,
        custom_settings: {
          eyebrow: "ARCHITECTURE & WORKFLOW",
          steps: [
            {
              step: "01",
              title: "Audio Ingest & SIP Stream",
              desc: "High-definition telephony audio captured directly from 096 IPTSP network trunk with bi-directional echo cancellation.",
              icon: "PhoneIncoming"
            },
            {
              step: "02",
              title: "Speech-to-Text (ASR)",
              desc: "Bangla & English speech instantly transcribed to text within 120ms with regional dialect and accent recognition.",
              icon: "AudioWaveform"
            },
            {
              step: "03",
              title: "LLM Decision & Intent Processing",
              desc: "Intelligent business workflow evaluates caller intent, queries CRM/Database in real-time, and formulates response.",
              icon: "Cpu"
            },
            {
              step: "04",
              title: "Neural Text-to-Speech Output",
              desc: "Fluid, natural Bangla voice synthesized and streamed back to the caller in real-time with zero robotic artifacts.",
              icon: "Sparkles"
            }
          ]
        }
      },
      {
        section_key: "comparison_matrix",
        section_type: "COMPARISON",
        title: "Traditional Keypad IVR vs. MyBDPhone AI Voice Agents",
        subtitle: "See why modern Bangladeshi enterprises are upgrading from robotic 'Press 1' menus to autonomous conversational voice AI.",
        content_body: "Traditional DTMF menus frustrate customers with endless sub-menus. MyBDPhone AI voice agents hold natural dialogues, resolve requests instantly, and escalate intelligently.",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 3,
        custom_settings: {
          eyebrow: "WHY UPGRADE TO VOICE AI",
          col_traditional: "Traditional Keypad IVR",
          col_ai: "MyBDPhone AI Voice Automation",
          rows: [
            {
              metric: "Caller Interface & Experience",
              traditional: "Rigid DTMF keypad menus ('Press 1 for Sales, 2 for Support')",
              ai: "Natural conversational spoken Bangla & English dialogue",
              winner: "ai"
            },
            {
              metric: "Understanding & Dialects",
              traditional: "Zero language comprehension; easily confused by caller miskeys",
              ai: "Deep comprehension of Bangladeshi regional dialects & colloquial context",
              winner: "ai"
            },
            {
              metric: "Database & CRM Actions",
              traditional: "Static pre-recorded messages; requires manual human transfer for details",
              ai: "Real-time instant CRM lookup, balance checks, order confirmation, & DB writes",
              winner: "ai"
            },
            {
              metric: "Response Latency & Flow",
              traditional: "Frustrating multi-level tree delays (averaging 90+ seconds)",
              ai: "Sub-500ms real-time conversational responses with smooth interruptions",
              winner: "ai"
            },
            {
              metric: "First Call Resolution (FCR)",
              traditional: "Low (30%–40% resolution without human intervention)",
              ai: "High (80%+ autonomous query resolution without agent transfer)",
              winner: "ai"
            },
            {
              metric: "Scalability & Concurrency",
              traditional: "Limited by physical agent headcount & PRI lines",
              ai: "Instant cloud scale up to 10,000+ concurrent active calls simultaneously",
              winner: "ai"
            }
          ]
        }
      },
      {
        section_key: "core_capabilities",
        section_type: "FEATURE_GRID",
        title: "Enterprise Voice AI Capabilities",
        subtitle: "Built to handle mission-critical telecom workloads with carrier-grade reliability.",
        content_body: "",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 4,
        custom_settings: {
          eyebrow: "ENTERPRISE READY",
          columns: 3,
          items: [
            {
              title: "Dynamic Variable Insertion",
              description: "Inject customer names, due dates, billing amounts, and order items into live spoken Bangla sentences dynamically.",
              icon: "Sparkles"
            },
            {
              title: "Sub-Second Response Latency",
              description: "Full round-trip audio streaming, speech recognition, and synthesis in under 450 milliseconds for natural conversation.",
              icon: "Zap"
            },
            {
              title: "CRM & Webhook Integration",
              description: "Connect your ERP, WooCommerce, Shopify, or custom CRM to trigger calls and log real-time dispositions automatically.",
              icon: "PlugZap"
            },
            {
              title: "Sentiment & Intent Analytics",
              description: "Analyze caller tone, sentiment score, and keyword triggers with instant call transcriptions saved to your dashboard.",
              icon: "Activity"
            },
            {
              title: "Multi-Channel Fallback",
              description: "Automatically send SMS follow-ups or WhatsApp confirmations if a call is unanswered or requires written confirmation.",
              icon: "PhoneForwarded"
            },
            {
              title: "Official 096 Telecom IPTSP",
              description: "Full regulatory compliance with Bangladesh Telecommunication Regulatory Commission (BTRC) white-listed CLI routing.",
              icon: "ShieldCheck"
            }
          ]
        }
      },
      {
        section_key: "faq_section",
        section_type: "FAQ",
        title: "Frequently Asked Questions",
        subtitle: "Everything you need to know about implementing Voice AI in your business.",
        content_body: "",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 5,
        custom_settings: {
          items: [
            {
              q: "How natural does the Bangla voice sound?",
              a: "Our neural Bangla models are trained on hundreds of hours of high-fidelity Bangladeshi voice recordings with natural prosody, breathing pauses, and proper regional inflection. Most callers cannot distinguish our voice agents from human call center representatives."
            },
            {
              q: "Can the AI agent understand English and Banglish during the call?",
              a: "Yes. Our speech recognition engine is bilingual and understands pure Bangla, English, and code-switched 'Banglish' commonly spoken in Bangladesh."
            },
            {
              q: "How many simultaneous calls can the system make?",
              a: "Our cloud telephony infrastructure scales dynamically from 10 to over 10,000+ concurrent channels without busy signals or degradation in audio quality."
            },
            {
              q: "Can we transfer the call to a human agent if needed?",
              a: "Yes. The AI agent can perform a warm or cold transfer to any internal extension, softphone, or mobile number whenever a complex query or caller request arises."
            }
          ]
        }
      },
      {
        section_key: "cta_banner",
        section_type: "CTA_BANNER",
        title: "Ready to Automate Your Voice Communication with AI?",
        subtitle: "Launch high-converting outbound voice broadcasts or handle incoming customer support with autonomous AI agents.",
        content_body: "",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 6,
        custom_settings: {
          eyebrow: "GET STARTED TODAY",
          primary_text: "Talk to Telecom Specialist",
          primary_url: "/contact",
          secondary_text: "View Voice Packages",
          secondary_url: "/packages"
        }
      }
    ]
  },
  "ai-bangla-voice-tts": {
    title: "AI Bangla Voice TTS",
    meta_title: "AI Bangla Voice TTS - MyBDPhone",
    meta_description: "Natural neural Bangla text-to-speech for interactive voice applications.",
    template: "landing",
    featured_image: "/uploads/cms/ai-calling-icon.png",
    sort_order: 54,
    sections: [
      {
        section_key: "hero",
        section_type: "HERO",
        title: "Bangla Neural Voice Text-to-Speech",
        subtitle: "Human-Quality Bangla Speech Synthesis for Automated Voice Campaigns",
        content_body: "Transform written text into natural, expressive Bangla audio with realistic intonation and regional fluency. Ideal for automated announcements, IVR greetings, and dynamic voice campaigns.",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 1,
        image_url: "/uploads/cms/ai-calling-icon.png",
        custom_settings: {
          eyebrow: "NEXT-GEN BANGLA AI",
          primary_text: "Talk to Specialist",
          primary_url: "/contact",
          secondary_text: "View Packages",
          secondary_url: "/packages",
          badges: ["Natural Intonation", "Male & Female Voice Personas", "Zero Robotic Artifacts"]
        }
      },
      {
        section_key: "pipeline_flow",
        section_type: "HOW_IT_WORKS",
        title: "4-Stage Bangla Neural Voice Pipeline",
        subtitle: "Ultra-low latency architecture from audio ingest to neural synthesis.",
        content_body: "",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 2,
        custom_settings: {
          eyebrow: "WORKFLOW",
          steps: [
            { step: "01", title: "Audio Ingest", desc: "Telephony audio captured from 096 IPTSP network trunk.", icon: "PhoneIncoming" },
            { step: "02", title: "Speech-to-Text", desc: "Bangla & English speech transcribed to text within 120ms.", icon: "AudioWaveform" },
            { step: "03", title: "LLM Decision", desc: "Contextual business logic evaluates caller intent & CRM data.", icon: "Cpu" },
            { step: "04", title: "Neural Voice Output", desc: "Natural Bangla voice synthesized and streamed back in real-time.", icon: "Sparkles" }
          ]
        }
      },
      {
        section_key: "comparison_matrix",
        section_type: "COMPARISON",
        title: "Traditional IVR vs. AI Voice Agents",
        subtitle: "Why businesses are transitioning to intelligent conversational voice.",
        content_body: "",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 3,
        custom_settings: {
          eyebrow: "COMPARISON",
          col_traditional: "Traditional Keypad IVR",
          col_ai: "AI Voice Automation",
          rows: [
            { metric: "Interface", traditional: "Rigid DTMF keypad menus (Press 1, Press 2)", ai: "Natural spoken voice conversation", winner: "ai" },
            { metric: "Comprehension", traditional: "None (DTMF tones only)", ai: "Native Bangla, English & Banglish NLP", winner: "ai" },
            { metric: "FCR Resolution", traditional: "30% - 40%", ai: "80%+ autonomous resolution", winner: "ai" },
            { metric: "Concurrency", traditional: "Limited by human staff", ai: "10,000+ simultaneous AI streams", winner: "ai" }
          ]
        }
      },
      {
        section_key: "core_features",
        section_type: "FEATURE_GRID",
        title: "Bangla TTS Studio Features",
        subtitle: "Professional speech generation tailored for Bangladeshi businesses.",
        content_body: "",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 4,
        custom_settings: {
          eyebrow: "VOICE SYNTHESIS",
          columns: 3,
          items: [
            { title: "Dynamic Variable Insertion", description: "Personalize names, due dates, and billing amounts directly into spoken Bangla sentences.", icon: "Sparkles" },
            { title: "High-Volume Call Delivery", description: "Broadcast thousands of concurrent personalized voice calls across Bangladesh carriers.", icon: "Zap" },
            { title: "Real-time Voice Preview", description: "Test and tune scripts with instant in-browser voice sample generation.", icon: "Play" }
          ]
        }
      },
      {
        section_key: "cta_banner",
        section_type: "CTA_BANNER",
        title: "Power Your Customer Outreach with Bangla AI Voice",
        subtitle: "Start launching intelligent automated voice campaigns in minutes.",
        content_body: "",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 5,
        custom_settings: {
          eyebrow: "LAUNCH CAMPAIGN",
          primary_text: "Talk to Specialist",
          primary_url: "/contact",
          secondary_text: "View Packages",
          secondary_url: "/packages"
        }
      }
    ]
  },
  "caller-tune-branding": {
    title: "Caller Tune Branding",
    meta_title: "Caller Tune Branding - MyBDPhone",
    meta_description: "Custom corporate greeting audio and brand caller tunes for 096 numbers.",
    template: "landing",
    featured_image: "/uploads/cms/banner1.png",
    sort_order: 55,
    sections: [
      {
        section_key: "hero",
        section_type: "HERO",
        title: "Corporate Caller Tune & Brand Audio",
        subtitle: "Play Professional Brand Greeting Audio to Every Incoming Caller",
        content_body: "Replace boring dial tones with your company slogan, promotional jingle, or custom corporate announcement while customers wait to be connected.",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 1,
        image_url: "/uploads/cms/banner1.png",
        custom_settings: {
          eyebrow: "BRAND TELEPHONY IDENTITY",
          primary_text: "Add Caller Tune",
          primary_url: "/shop",
          secondary_text: "View Packages",
          secondary_url: "/packages",
          badges: ["Instant Line Activation", "Studio Audio Upload", "Only ৳99/month"]
        }
      },
      {
        section_key: "core_features",
        section_type: "FEATURE_GRID",
        title: "Caller Tune Advantages",
        subtitle: "Make every incoming call a memorable branding opportunity.",
        content_body: "",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 2,
        custom_settings: {
          eyebrow: "AUDIO BRANDING",
          columns: 3,
          items: [
            { title: "100% Caller Reach", description: "Every caller hears your message before an agent picks up, maximizing marketing impact.", icon: "Radio" },
            { title: "Easy MP3 Audio Upload", description: "Upload standard MP3 / WAV recordings directly from your user dashboard anytime.", icon: "FileAudio" },
            { title: "Affordable Monthly Plan", description: "Enjoy uninterrupted brand tunes for only ৳99 per month per 096 number.", icon: "Sparkles" }
          ]
        }
      },
      {
        section_key: "cta_banner",
        section_type: "CTA_BANNER",
        title: "Add Corporate Caller Tune to Your 096 Line",
        subtitle: "Activate in under 2 minutes from our Digital Services Shop.",
        content_body: "",
        layout_orientation: "IMAGE_RIGHT",
        display_order: 3,
        custom_settings: {
          eyebrow: "ACTIVATE TODAY",
          primary_text: "Activate Caller Tune",
          primary_url: "/shop",
          secondary_text: "Get 096 IP Phone",
          secondary_url: "/ip-phone"
        }
      }
    ]
  }
};

async function alterCmsColumns() {
  try {
    const [cols] = await pool.query("DESCRIBE cms_pages");
    const pageColNames = cols.map(c => c.Field);
    if (!pageColNames.includes("meta_title")) {
      await pool.query("ALTER TABLE cms_pages ADD COLUMN meta_title VARCHAR(255) NULL");
    }
    if (!pageColNames.includes("meta_description")) {
      await pool.query("ALTER TABLE cms_pages ADD COLUMN meta_description TEXT NULL");
    }

    const [secCols] = await pool.query("DESCRIBE cms_sections");
    const secColNames = secCols.map(c => c.Field);
    if (!secColNames.includes("content_body")) {
      await pool.query("ALTER TABLE cms_sections ADD COLUMN content_body LONGTEXT NULL");
    }
    if (!secColNames.includes("layout_orientation")) {
      await pool.query("ALTER TABLE cms_sections ADD COLUMN layout_orientation VARCHAR(50) DEFAULT 'IMAGE_RIGHT'");
    }
    if (!secColNames.includes("custom_settings")) {
      await pool.query("ALTER TABLE cms_sections ADD COLUMN custom_settings JSON NULL");
    }
    if (!secColNames.includes("display_order")) {
      await pool.query("ALTER TABLE cms_sections ADD COLUMN display_order INT DEFAULT 0");
    }
    if (!secColNames.includes("is_visible")) {
      await pool.query("ALTER TABLE cms_sections ADD COLUMN is_visible BOOLEAN DEFAULT TRUE");
    }
    if (!secColNames.includes("image_url")) {
      await pool.query("ALTER TABLE cms_sections ADD COLUMN image_url VARCHAR(1000) NULL");
    }
  } catch (err) {
    console.error("alterCmsColumns notice:", err?.message);
  }
}

async function ensureFeatureCmsPages() {
  await alterCmsColumns();
  try {
    await pool.query("DELETE FROM cms_sections WHERE section_key LIKE '%voice_demo%' OR section_type IN ('AUDIO_DEMO', 'VOICE_DEMO', 'VOICE_STUDIO')");
  } catch (e) {}
  for (const [slug, def] of Object.entries(FEATURE_CMS_DEFAULTS)) {
    const [rows] = await pool.query(
      "SELECT id, status, template FROM cms_pages WHERE slug=? LIMIT 1",
      [slug]
    );

    let pageId;
    let status = rows[0]?.status;

    if (!rows.length) {
      const [result] = await pool.query(
        `INSERT INTO cms_pages
          (title, slug, template, content_html, featured_image, seo_title, seo_description, meta_title, meta_description, status, sort_order)
         VALUES (?, ?, ?, '', ?, ?, ?, ?, ?, 'published', ?)`,
        [
          def.title,
          slug,
          def.template || "landing",
          def.featured_image || "",
          def.meta_title || def.title,
          def.meta_description || "",
          def.meta_title || def.title,
          def.meta_description || "",
          def.sort_order || 0,
        ]
      );
      pageId = result.insertId;
      status = "published";
    } else {
      pageId = rows[0].id;
      if (status === "draft") {
        await pool.query(
          `UPDATE cms_pages
             SET status='published',
                 meta_title=COALESCE(meta_title, seo_title, ?),
                 meta_description=COALESCE(meta_description, seo_description, ?)
           WHERE id=?`,
          [def.meta_title || def.title, def.meta_description || "", pageId]
        );
      }
    }

    // Seed or update sections
    for (const s of def.sections || []) {
      const [sectionRows] = await pool.query(
        "SELECT id, custom_settings, section_type FROM cms_sections WHERE page_id=? AND section_key=? LIMIT 1",
        [pageId, s.section_key]
      );
      const customSettings = s.custom_settings || {};
      const content = s.content_body || s.content_html || "";

      if (!sectionRows.length) {
        await pool.query(
          `INSERT INTO cms_sections
            (page_id, section_key, section_type, title, subtitle, content_html, content_body, layout_orientation, image_url, custom_settings, settings, sort_order, display_order, status, is_visible)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1)`,
          [
            pageId,
            s.section_key,
            s.section_type,
            s.title || "",
            s.subtitle || "",
            content,
            content,
            s.layout_orientation || "IMAGE_RIGHT",
            s.image_url || "",
            JSON.stringify(customSettings),
            JSON.stringify(customSettings),
            s.display_order || 1,
            s.display_order || 1,
          ]
        );
      } else if (slug === "call-recording") {
        // Ensure call-recording sections keep the latest rich 4-column items, correct ordering, and audio player
        const existingSettings = typeof sectionRows[0].custom_settings === 'string'
          ? JSON.parse(sectionRows[0].custom_settings || '{}')
          : (sectionRows[0].custom_settings || {});

        const shouldSync =
          (s.section_key === "core_features" && (!existingSettings.items || existingSettings.items.length < 4)) ||
          (s.section_key === "live_audio_player" && !existingSettings.samples) ||
          (s.section_key === "hero" && !sectionRows[0].image_url) ||
          (s.section_key === "cta_banner" && s.display_order === 4);

        if (shouldSync) {
          await pool.query(
            `UPDATE cms_sections
             SET section_type=?, title=?, subtitle=?, content_body=?, content_html=?, image_url=?, custom_settings=?, settings=?, display_order=?, sort_order=?
             WHERE id=?`,
            [
              s.section_type,
              s.title || "",
              s.subtitle || "",
              content,
              content,
              s.image_url || "",
              JSON.stringify(customSettings),
              JSON.stringify(customSettings),
              s.display_order || 1,
              s.display_order || 1,
              sectionRows[0].id
            ]
          );
        }
      }
    }
  }
}

async function ensureBuiltinProductCmsPages() {
  for (const [slug, def] of Object.entries(PRODUCT_CMS_DEFAULTS)) {
    const [rows] = await pool.query(
      "SELECT id, status, template FROM cms_pages WHERE slug=? LIMIT 1",
      [slug]
    );

    let pageId;
    let status = rows[0]?.status;

    if (!rows.length) {
      const [result] = await pool.query(
        `INSERT INTO cms_pages
          (title, slug, template, content_html, featured_image, seo_title, seo_description, status, sort_order)
         VALUES (?, ?, ?, '', ?, ?, ?, 'published', ?)`,
        [
          def.title,
          slug,
          def.template,
          def.featured_image || "",
          def.seo_title || "",
          def.seo_description || "",
          def.sort_order || 0,
        ]
      );
      pageId = result.insertId;
      status = "published";
    } else {
      pageId = rows[0].id;

      // Keep an intentionally inactive page inactive. A previous draft or standard
      // template built for these built-in product pages is promoted so the frontend
      // renders with rich product sections.
      if (status === "draft" || rows[0].template !== "product_landing") {
        await pool.query(
          `UPDATE cms_pages
             SET template='product_landing',
                 title=CASE WHEN title IS NULL OR title='' THEN ? ELSE title END,
                 featured_image=CASE WHEN featured_image IS NULL OR featured_image='' THEN ? ELSE featured_image END,
                 seo_title=CASE WHEN seo_title IS NULL OR seo_title='' THEN ? ELSE seo_title END,
                 seo_description=CASE WHEN seo_description IS NULL OR seo_description='' THEN ? ELSE seo_description END,
                 status=CASE WHEN status='draft' THEN 'published' ELSE status END
           WHERE id=?`,
          [
            def.title,
            def.featured_image || "",
            def.seo_title || "",
            def.seo_description || "",
            pageId,
          ]
        );
        status = status === "draft" ? "published" : status;
      }
    }

    // Seed only missing sections. Existing admin-edited rows are preserved.
    for (const [sectionKey, sectionType, title, subtitle, sortOrder, settings] of def.sections) {
      const [sectionRows] = await pool.query(
        "SELECT id FROM cms_sections WHERE page_id=? AND section_key=? LIMIT 1",
        [pageId, sectionKey]
      );
      if (!sectionRows.length) {
        await pool.query(
          `INSERT INTO cms_sections
            (page_id, section_key, section_type, title, subtitle, content_html, settings, sort_order, status)
           VALUES (?, ?, ?, ?, ?, '', ?, ?, 'active')`,
          [
            pageId,
            sectionKey,
            sectionType,
            title,
            subtitle,
            JSON.stringify(settings || {}),
            sortOrder,
          ]
        );
      }
    }

    // Seed starter cards only when a collection has no rows at all.
    for (const [collectionKey, tuples] of Object.entries(def.collections || {})) {
      const [countRows] = await pool.query(
        "SELECT COUNT(*) AS count FROM cms_items WHERE collection_key=?",
        [collectionKey]
      );
      if (Number(countRows[0]?.count || 0) > 0) continue;

      for (const tuple of tuples) {
        const [title, description, icon = "", image_url = "", sort_order = 0, meta = "", payload = {}] = tuple;
        await pool.query(
          `INSERT INTO cms_items
            (collection_key,title,slug,description,content_html,image_url,icon,link_url,meta,payload,sort_order,status,published_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,'active',NOW())`,
          [
            collectionKey,
            title,
            String(title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
            description || "",
            "",
            image_url || "",
            icon || "",
            "",
            meta || "",
            JSON.stringify(payload || {}),
            Number(sort_order) || 0,
          ]
        );
      }
    }
  }
}


async function ensureCmsTables() {
  await pool.query(`CREATE TABLE IF NOT EXISTS site_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_group VARCHAR(50) NOT NULL DEFAULT 'general',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await pool.query(`CREATE TABLE IF NOT EXISTS cms_pages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    template VARCHAR(80) NOT NULL DEFAULT 'standard',
    content_html LONGTEXT NULL,
    featured_image VARCHAR(1000) NULL,
    seo_title VARCHAR(255) NULL,
    seo_description TEXT NULL,
    status ENUM('draft','published','inactive') NOT NULL DEFAULT 'draft',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await pool.query(`CREATE TABLE IF NOT EXISTS cms_sections (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id INT UNSIGNED NOT NULL,
    section_key VARCHAR(100) NOT NULL,
    section_type VARCHAR(60) NOT NULL DEFAULT 'rich_text',
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    content_html LONGTEXT NULL,
    settings JSON NULL,
    sort_order INT NOT NULL DEFAULT 0,
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_page_section_key (page_id, section_key),
    FOREIGN KEY (page_id) REFERENCES cms_pages(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await pool.query(`CREATE TABLE IF NOT EXISTS cms_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    collection_key VARCHAR(80) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NULL,
    description TEXT NULL,
    content_html LONGTEXT NULL,
    image_url VARCHAR(1000) NULL,
    icon VARCHAR(80) NULL,
    link_url VARCHAR(500) NULL,
    meta VARCHAR(255) NULL,
    payload JSON NULL,
    sort_order INT NOT NULL DEFAULT 0,
    status ENUM('active','inactive','draft','published') NOT NULL DEFAULT 'active',
    published_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_collection_status (collection_key, status),
    INDEX idx_collection_order (collection_key, sort_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await pool.query(`CREATE TABLE IF NOT EXISTS cms_media (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(1200) NOT NULL,
    media_type VARCHAR(60) NOT NULL DEFAULT 'image',
    alt_text VARCHAR(255) NULL,
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await pool.query(`INSERT INTO cms_pages (title, slug, template, content_html, seo_title, seo_description, status, sort_order)
    VALUES ('Home', 'home', 'home', '', 'MyBDPhone — IP Phone & AI Calling Services', 'MyBDPhone provides IP phone, 096 numbers, AI calling and digital telecom services.', 'published', 1)
    ON DUPLICATE KEY UPDATE title=VALUES(title);`);

  const [pageRows] = await pool.query(
    `SELECT id FROM cms_pages WHERE slug='home' LIMIT 1`
  );
  const homeId = pageRows[0]?.id;
  if (homeId) {
    const sections = [
      ["hero", "hero", "Main Hero Carousel", "home_hero_slides", 1],
      [
        "service_cards",
        "home_service_cards",
        "Service Cards",
        "home_service_cards",
        2,
      ],
      ["offerings", "home_offerings", "Core Offerings", "home_offerings", 3],
      [
        "advantages",
        "collection",
        "Why Businesses Across Bangladesh Trust Us",
        "THE MYBDPHONE ADVANTAGE",
        4,
      ],
      [
        "packages",
        "packages",
        "Choose the Perfect Package for Your Business",
        "TRANSPARENT PRICING",
        5,
      ],
      [
        "clients",
        "clients",
        "Clients We Have Helped with PBX",
        "Trusted by companies across Bangladesh",
        6,
      ],
      [
        "addons",
        "collection",
        "Digital Phone Services Marketplace",
        "ADD-ONS & UPGRADES",
        7,
      ],
      ["faq", "collection", "Frequently Asked Questions", "HELP CENTER", 8],
      [
        "cta",
        "cta",
        "Ready to Upgrade Your Business Telephony?",
        "Get your 096 IP number within 5 minutes or launch your first automated AI voice campaign today.",
        9,
      ],
    ];
    for (const [key, type, title, subtitle, order] of sections) {
      await pool.query(
        `INSERT INTO cms_sections (page_id, section_key, section_type, title, subtitle, settings, sort_order, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
        ON DUPLICATE KEY UPDATE section_key=section_key`,
        [
          homeId,
          key,
          type,
          title,
          subtitle,
          JSON.stringify({ source: subtitle }),
          order,
        ]
      );
    }

    // Link the built-in Home sections to their CMS collections without
    // overwriting any settings an administrator may already have changed.
    const homeCollectionBindings = {
      hero: 'home_hero_slides',
      service_cards: 'home_service_cards',
      offerings: 'home_offerings',
      clients: 'home_clients',
      advantages: 'home_advantages',
      addons: 'home_addons',
      faq: 'faq',
    };
    for (const [sectionKey, collectionKey] of Object.entries(homeCollectionBindings)) {
      await pool.query(
        `UPDATE cms_sections
         SET settings=JSON_SET(COALESCE(settings, JSON_OBJECT()), '$.collection_key', ?)
         WHERE page_id=? AND section_key=? AND JSON_EXTRACT(COALESCE(settings, JSON_OBJECT()), '$.collection_key') IS NULL`,
        [collectionKey, homeId, sectionKey]
      );
    }
    await pool.query(
      `UPDATE cms_sections
       SET settings=JSON_SET(COALESCE(settings, JSON_OBJECT()), '$.admin_path', '/admin/packages')
       WHERE page_id=? AND section_key='packages' AND JSON_EXTRACT(COALESCE(settings, JSON_OBJECT()), '$.admin_path') IS NULL`,
      [homeId]
    );
  }


  // Keep the standard public/navigation routes CMS-ready from a fresh install.
  // Existing rows are never overwritten, so administrators retain all edits.
  const builtinPages = [
    ["IP Phone", "ip-phone", "product_landing", 10, "IP Phone | MyBDPhone", "Clear, reliable and business-ready IP phones for modern communication."],
    ["Virtual Number", "virtual-number", "product_landing", 11, "Virtual Number | MyBDPhone", "Stay connected with customers from anywhere with a professional virtual number."],
    ["Business IP Number", "business-ip-number", "product_landing", 12, "Business IP Number | MyBDPhone", "Give your business a professional identity with a dedicated business IP number."],
    ["AI Calling", "ai-calling", "landing", 20, "AI Calling | MyBDPhone", "AI voice calling and automated business campaigns from MyBDPhone."],
    ["Call Packages", "packages", "packages", 30, "Call Packages | MyBDPhone", "MyBDPhone IP telephony and AI calling packages."],
    ["Digital Services Shop", "shop", "shop", 40, "Shop | MyBDPhone", "Caller tune, call recording, device add-ons and telecom services."],
    ["Features", "features", "features", 50, "Features | MyBDPhone", "MyBDPhone telecom and voice AI platform features."],
    ["About MyBDPhone", "about", "standard", 60, "About MyBDPhone", "Learn about MyBDPhone."],
    ["Contact", "contact", "contact", 80, "Contact MyBDPhone", "Contact MyBDPhone sales and support."],
    ["Products", "products", "landing", 90, "Products | MyBDPhone", "Explore MyBDPhone products and telecom services."],
    ["Solutions", "solutions", "landing", 100, "Solutions | MyBDPhone", "Explore MyBDPhone business solutions."],
    ["Resources", "resources", "landing", 110, "Resources | MyBDPhone", "Guides, FAQs and resources from MyBDPhone."],
    ["Developers", "developers", "landing", 115, "Developers | MyBDPhone", "Developer APIs, SIP integrations and technical resources."],
    ["Company", "company", "landing", 120, "Company | MyBDPhone", "Company information and support details."],
    ["Cloud PBX", "cloud-pbx", "landing", 130, "Cloud PBX | MyBDPhone", "Cloud PBX and business call routing solutions."]
  ];

  // Cleanup removed support and knowledgebase pages from DB
  try {
    await pool.query("DELETE FROM cms_sections WHERE page_id IN (SELECT id FROM cms_pages WHERE slug IN ('support', 'knowledgebase', 'help'))");
    await pool.query("DELETE FROM cms_pages WHERE slug IN ('support', 'knowledgebase', 'help')");
  } catch (e) {}

  for (const [title, slug, template, sortOrder, seoTitle, seoDescription] of builtinPages) {
    await pool.query(
      `INSERT INTO cms_pages
       (title, slug, template, content_html, featured_image, seo_title, seo_description, status, sort_order)
       VALUES (?, ?, ?, '', '', ?, ?, 'draft', ?)
       ON DUPLICATE KEY UPDATE id=id`,
      [title, slug, template, seoTitle, seoDescription, sortOrder]
    );
  }

  // Cloud PBX is a first-class CMS landing page. Keep this repair-safe and
  // idempotent so an existing installation with the page already created but
  // missing sections/items can be repaired automatically without overwriting
  // administrator edits.
  await ensureCloudPbxCms();

  // Built-in product pages are part of Pages / Landing CMS. This seeds only missing
  // structure and preserves administrator edits.
  await ensureBuiltinProductCmsPages();

  // Feature pages (Smart IVR, Multi-Device Ringing, Call Recording, etc.)
  await ensureFeatureCmsPages();

  for (const [collection, items] of Object.entries(DEFAULT_COLLECTIONS)) {
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS count FROM cms_items WHERE collection_key=?`,
      [collection]
    );
    if (Number(countRows[0].count) === 0) {
      for (const item of items) {
        await pool.query(
          `INSERT INTO cms_items (collection_key,title,slug,description,content_html,image_url,icon,link_url,meta,payload,sort_order,status,published_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,'active',NOW())`,
          [
            collection,
            item.title,
            item.slug ||
              item.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, ""),
            item.description || "",
            item.content_html || "",
            item.image_url || "",
            item.icon || "",
            item.link_url || "",
            item.meta || "",
            JSON.stringify(item.payload || {}),
            item.sort_order || 0,
          ]
        );
      }
    }
  }

  for (const [key, value] of Object.entries(DEFAULT_SITE_CONFIG)) {
    await pool.query(
      `INSERT INTO site_settings (setting_key, setting_value, setting_group)
      VALUES (?, ?, 'cms') ON DUPLICATE KEY UPDATE setting_group='cms'`,
      [key, JSON.stringify(value)]
    );
  }

  await ensureAboutCmsPage();
  await ensureWhyChooseUsCmsPage();
  await ensureFintechCmsPage();
  await ensureRemoteWorkforceCmsPage();
}

async function ensureCloudPbxCms() {
  // The base CMS tables are created by ensureCmsTables before this helper is
  // called. Keep the helper safe to call from admin/public read endpoints too.
  const [pageRows] = await pool.query(
    `SELECT id, status FROM cms_pages WHERE slug='cloud-pbx' LIMIT 1`
  );

  let cloudPageId = pageRows[0]?.id;
  let cloudStatus = pageRows[0]?.status;

  if (!cloudPageId) {
    const [result] = await pool.query(
      `INSERT INTO cms_pages
       (title, slug, template, content_html, featured_image, seo_title, seo_description, status, sort_order)
       VALUES (?, 'cloud-pbx', 'landing', '', '', ?, ?, 'published', ?)
       ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
      [
        'Cloud PBX',
        'Cloud PBX | MyBDPhone',
        'Cloud PBX and business call routing solutions from MyBDPhone.',
        130,
      ]
    );
    cloudPageId = result.insertId;
    cloudStatus = 'published';
  }

  // Publish only a fresh draft. Preserve an intentional inactive state.
  if (cloudPageId && cloudStatus === 'draft') {
    await pool.query(
      `UPDATE cms_pages SET status='published', template='landing' WHERE id=?`,
      [cloudPageId]
    );
  }

  const cloudSections = [
    ['hero', 'hero', 'Cloud PBX for Modern Business', 'Connect your teams with a scalable hosted phone system.', 1, {
      image_url: '/uploads/cms/cloud-pbx-icon.png',
      eyebrow: 'CLOUD BUSINESS TELEPHONY',
      primary_text: 'View Packages',
      primary_url: '/packages',
      secondary_text: 'Contact Sales',
      secondary_url: '/contact',
      badges: ['096 IP number', 'Flexible extensions', 'Hosted PBX'],
    }],
    ['pricing', 'pricing', 'Cloud PBX Packages', 'Choose a plan based on extensions, IVR and concurrent call needs.', 2, { collection_key: 'cloud_pbx_packages' }],
    ['comparison', 'comparison', 'PBX Package Comparison', 'Compare the included calling capacity and controls at a glance.', 3, { collection_key: 'cloud_pbx_packages' }],
    ['overview', 'image_text', 'Cloud PBX for Your Business', 'A flexible hosted phone system for professional customer communication.', 4, {
      image_url: '/uploads/cms/cloud-pbx-icon.png',
      image_position: 'left',
      eyebrow: 'CLOUD PBX',
    }],
    ['features', 'feature_grid', 'Features & Benefits of Cloud PBX', 'Professional call controls that help teams answer, route and manage conversations.', 5, { collection_key: 'cloud_pbx_features', columns: 3 }],
    ['benefits', 'benefits', 'Why Choose MyBDPhone Cloud PBX', 'Built for secure, dependable and easy-to-manage business telephony.', 6, { collection_key: 'cloud_pbx_benefits', columns: 3 }],
    ['consultation', 'consultation', 'Get a Free Consultation', 'Talk to our team about the right Cloud PBX setup for your business.', 7, {
      phone: '096490123756',
      hours: '9:00 AM – 9:00 PM',
      chat_url: '/contact',
      chat_text: 'Start Live Chat',
      button_text: 'Call Us',
    }],
    ['documents', 'documents', 'Required Documents to Purchase PBX Package', 'Keep these documents ready for onboarding.', 8, { collection_key: 'cloud_pbx_documents', columns: 3 }],
    ['clients', 'clients', 'Clients We Have Helped with PBX', 'Teams across Bangladesh can manage their business calls from one platform.', 9, { collection_key: 'cloud_pbx_clients', columns: 6 }],
    ['faq', 'faq', 'Frequently Asked Questions', 'Common questions about hosted Cloud PBX.', 10, { collection_key: 'cloud_pbx_faq' }],
    ['cta', 'cta', 'Ready to Upgrade Your Business Telephony?', 'Get help selecting a Cloud PBX package or request a tailored setup.', 11, {
      primary_text: 'Explore Packages',
      primary_url: '/packages',
      secondary_text: 'Talk to Sales',
      secondary_url: '/contact',
    }],
  ];

  for (const [key, type, title, subtitle, order, settings] of cloudSections) {
    await pool.query(
      `INSERT INTO cms_sections
       (page_id, section_key, section_type, title, subtitle, content_html, settings, sort_order, status)
       VALUES (?, ?, ?, ?, ?, '', ?, ?, 'active')
       ON DUPLICATE KEY UPDATE id=id`,
      [cloudPageId, key, type, title, subtitle, JSON.stringify(settings), order]
    );
  }

  // Only fill a collection when it is completely absent. Existing admin
  // content is never replaced by bootstrap defaults.
  for (const collectionKey of [
    'cloud_pbx_packages',
    'cloud_pbx_features',
    'cloud_pbx_benefits',
    'cloud_pbx_documents',
    'cloud_pbx_clients',
    'cloud_pbx_faq',
  ]) {
    const items = DEFAULT_COLLECTIONS[collectionKey] || [];
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS count FROM cms_items WHERE collection_key=?`,
      [collectionKey]
    );
    if (Number(countRows[0]?.count || 0) === 0) {
      for (const item of items) {
        await pool.query(
          `INSERT INTO cms_items
           (collection_key,title,slug,description,content_html,image_url,icon,link_url,meta,payload,sort_order,status,published_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,'active',NOW())`,
          [
            collectionKey,
            item.title,
            item.slug || String(item.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            item.description || '',
            item.content_html || '',
            item.image_url || '',
            item.icon || '',
            item.link_url || '',
            item.meta || '',
            JSON.stringify(item.payload || {}),
            item.sort_order || 0,
          ]
        );
      }
    }
  }

  return cloudPageId;
}

async function ensureAboutCmsPage() {
  try {
    const [pageRows] = await pool.query(
      `SELECT id, status FROM cms_pages WHERE slug='about' LIMIT 1`
    );

    let aboutPageId = pageRows[0]?.id;
    let aboutStatus = pageRows[0]?.status;

    if (!aboutPageId) {
      const [result] = await pool.query(
        `INSERT INTO cms_pages
         (title, slug, template, content_html, featured_image, seo_title, seo_description, meta_title, meta_description, status, sort_order)
         VALUES (?, 'about', 'about', '', ?, ?, ?, ?, ?, 'published', ?)
         ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
        [
          'About MyBDPhone',
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
          'About MyBDPhone - Unified Business Communication Platform',
          'Learn about MyBDPhone, our mission, vision, and how we empower modern businesses with IP PBX, Virtual Numbers, and AI Calling.',
          'About MyBDPhone - Unified Business Communication Platform',
          'Learn about MyBDPhone, our mission, vision, and how we empower modern businesses with IP PBX, Virtual Numbers, and AI Calling.',
          140,
        ]
      );
      aboutPageId = result.insertId;
      aboutStatus = 'published';
    } else {
      if (aboutStatus === 'draft') {
        await pool.query(
          `UPDATE cms_pages SET status='published' WHERE id=?`,
          [aboutPageId]
        );
      }
      await pool.query(
        `UPDATE cms_pages SET 
           meta_title=COALESCE(NULLIF(meta_title, ''), ?),
           meta_description=COALESCE(NULLIF(meta_description, ''), ?),
           seo_title=COALESCE(NULLIF(seo_title, ''), ?),
           seo_description=COALESCE(NULLIF(seo_description, ''), ?)
         WHERE id=?`,
        [
          'About MyBDPhone - Unified Business Communication Platform',
          'Learn about MyBDPhone, our mission, vision, and how we empower modern businesses with IP PBX, Virtual Numbers, and AI Calling.',
          'About MyBDPhone - Unified Business Communication Platform',
          'Learn about MyBDPhone, our mission, vision, and how we empower modern businesses with IP PBX, Virtual Numbers, and AI Calling.',
          aboutPageId
        ]
      );
    }

    const aboutSections = [
      {
        key: 'hero',
        type: 'HERO',
        title: 'About MyBDPhone',
        subtitle: 'A unified business communication platform powering modern enterprises and growing businesses across Bangladesh.',
        content_body: '',
        image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
        layout_orientation: 'IMAGE_RIGHT',
        order: 0,
        settings: {
          eyebrow: 'WHO WE ARE & OUR MISSION',
          primary_btn: { text: 'Explore Solutions', url: '/packages' },
          secondary_btn: { text: 'Contact Us', url: '/contact' },
        }
      },
      {
        key: 'who_we_are',
        type: 'WHO_WE_ARE',
        title: 'Who We Are',
        subtitle: 'Simplifying Business Telecommunications',
        content_body: 'MyBDPhone is a next-generation IP telecom and communication engine built to bridge the gap between traditional telephone systems and modern cloud technology. We serve enterprises, call centers, e-commerce, and startups with scalable, reliable voice and AI solutions.',
        image_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7',
        layout_orientation: 'IMAGE_RIGHT',
        order: 1,
        settings: {
          badge: 'OUR IDENTITY',
          stats: [
            { label: 'Uptime SLA', value: '99.98%' },
            { label: 'Active Extensions', value: '50,000+' },
            { label: 'Dhaka NOC Support', value: '24/7' }
          ]
        }
      },
      {
        key: 'what_we_offer',
        type: 'WHAT_WE_OFFER',
        title: 'What We Offer',
        subtitle: 'Comprehensive communication tools designed for modern workforce requirements.',
        content_body: '',
        image_url: '',
        layout_orientation: 'IMAGE_RIGHT',
        order: 2,
        settings: {
          services: [
            { title: 'IP Phone', desc: 'Crystal clear hardware and softphone VoIP connectivity.', icon: 'Phone' },
            { title: 'Business IP Number', desc: 'Official corporate identity for customer trust.', icon: 'Building2' },
            { title: 'Virtual Number', desc: 'Instant multi-channel virtual phone routing.', icon: 'Globe' },
            { title: 'Cloud PBX', desc: 'Smart extensions, call queues, and intelligent routing.', icon: 'Server' },
            { title: 'AI Calling', desc: 'Automated AI voice calls with localized Bangla support.', icon: 'Bot' },
            { title: 'Auto Dialer', desc: 'Broadcast campaigns and automated customer outreach.', icon: 'Zap' },
            { title: 'Call Recording', desc: 'Secure cloud storage for call logs and quality audit.', icon: 'Mic' },
            { title: 'Caller Tune', desc: 'Custom corporate branding tune for incoming callers.', icon: 'Music' }
          ]
        }
      },
      {
        key: 'mission_vision',
        type: 'MISSION_VISION',
        title: 'Our Mission & Vision',
        subtitle: 'Guiding principles driving our technological innovations.',
        content_body: '',
        image_url: '',
        layout_orientation: 'IMAGE_RIGHT',
        order: 3,
        settings: {
          mission: {
            title: 'Our Mission',
            desc: 'To empower every business in Bangladesh with modern, accessible, and high-quality cloud communication solutions that replace rigid traditional hardware.'
          },
          vision: {
            title: 'Our Vision',
            desc: 'To lead the AI and IP telecommunication transformation, becoming the most trusted business voice platform across South Asia.'
          }
        }
      },
      {
        key: 'why_we_built',
        type: 'WHY_WE_BUILT',
        title: 'Why We Built MyBDPhone',
        subtitle: 'Solving modern business communication challenges.',
        content_body: 'Traditional telecom setups are expensive, inflexible, and difficult to manage across remote teams. We built MyBDPhone as a unified, cloud-first platform that lets companies set up call centers, PBX extensions, dynamic IVRs, and AI voice agents in minutes without heavy hardware investments.',
        image_url: '',
        layout_orientation: 'IMAGE_RIGHT',
        order: 4,
        settings: {
          problem_title: 'The Traditional Problem',
          problem_desc: 'High upfront PBX hardware costs, fixed landline wires, inflexible vendor contracts, and no remote agent flexibility.',
          solution_title: 'The MyBDPhone Solution',
          solution_desc: '100% cloud-hosted IP telephony, instant 096 activation, self-service web portals, and integrated Bangla AI voice bots.'
        }
      },
      {
        key: 'our_commitment',
        type: 'OUR_COMMITMENT',
        title: 'Our Commitment',
        subtitle: 'What you can always expect from our service and support team.',
        content_body: '',
        image_url: '',
        layout_orientation: 'IMAGE_RIGHT',
        order: 5,
        settings: {
          commitments: [
            { title: 'Reliable Service', desc: 'High-uptime infrastructure ensuring continuous call availability.', icon: 'ShieldCheck' },
            { title: 'Simple Experience', desc: 'Intuitive admin dashboard and instant activation workflows.', icon: 'CheckCircle2' },
            { title: 'Secure Communication', desc: 'Encrypted VoIP protocols and compliance with BTRC regulations.', icon: 'Lock' },
            { title: 'Customer Support', desc: 'Dedicated 24/7 technical assistance for smooth operation.', icon: 'Headphones' }
          ]
        }
      },
      {
        key: 'final_cta',
        type: 'FINAL_CTA',
        title: 'Ready for smarter communication?',
        subtitle: 'Transform your enterprise telecommunications with MyBDPhone today.',
        content_body: '',
        image_url: '',
        layout_orientation: 'IMAGE_RIGHT',
        order: 6,
        settings: {
          primary_btn: { text: 'Get Started', url: '/packages' },
          secondary_btn: { text: 'Talk to Specialist', url: '/contact' }
        }
      }
    ];

    for (const sec of aboutSections) {
      const [existingSec] = await pool.query(
        "SELECT id, section_type, title, subtitle, content_body, image_url, settings, custom_settings FROM cms_sections WHERE page_id=? AND (section_key=? OR section_type=?) LIMIT 1",
        [aboutPageId, sec.key, sec.type]
      );

      const jsonStr = JSON.stringify(sec.settings);

      if (!existingSec.length) {
        await pool.query(
          `INSERT INTO cms_sections
           (page_id, section_key, section_type, title, subtitle, content_body, content_html, image_url, layout_orientation, custom_settings, settings, display_order, sort_order, is_visible, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')`,
          [
            aboutPageId,
            sec.key,
            sec.type,
            sec.title,
            sec.subtitle,
            sec.content_body,
            sec.content_body,
            sec.image_url,
            sec.layout_orientation,
            jsonStr,
            jsonStr,
            sec.order,
            sec.order
          ]
        );
      } else {
        await pool.query(
          `UPDATE cms_sections SET
             section_key = ?,
             section_type = ?,
             title = COALESCE(NULLIF(title, ''), ?),
             subtitle = COALESCE(NULLIF(subtitle, ''), ?),
             content_body = COALESCE(NULLIF(content_body, ''), ?),
             content_html = COALESCE(NULLIF(content_html, ''), ?),
             image_url = COALESCE(NULLIF(image_url, ''), ?),
             layout_orientation = COALESCE(NULLIF(layout_orientation, ''), ?),
             custom_settings = COALESCE(custom_settings, ?),
             settings = COALESCE(settings, ?),
             display_order = COALESCE(display_order, ?),
             sort_order = COALESCE(sort_order, ?)
           WHERE id = ?`,
          [
            sec.key,
            sec.type,
            sec.title,
            sec.subtitle,
            sec.content_body,
            sec.content_body,
            sec.image_url,
            sec.layout_orientation,
            jsonStr,
            jsonStr,
            sec.order,
            sec.order,
            existingSec[0].id
          ]
        );
      }
    }
  } catch (err) {
    console.error("ensureAboutCmsPage error:", err.message);
  }
}

async function ensureWhyChooseUsCmsPage() {
  try {
    const [pageRows] = await pool.query(
      `SELECT id, status FROM cms_pages WHERE slug='why-choose-us' LIMIT 1`
    );

    let pageId = pageRows[0]?.id;
    let pageStatus = pageRows[0]?.status;

    if (!pageId) {
      const [result] = await pool.query(
        `INSERT INTO cms_pages
         (title, slug, template, content_html, featured_image, seo_title, seo_description, meta_title, meta_description, status, sort_order)
         VALUES (?, 'why-choose-us', 'why_choose_us', '', '', ?, ?, ?, ?, 'published', ?)
         ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
        [
          'Why Choose MyBDPhone',
          'Why Choose MyBDPhone - Powerful Business Communication Platform',
          'Discover why modern businesses choose MyBDPhone for all-in-one IP telephony, PBX, and AI communication tools.',
          'Why Choose MyBDPhone - Powerful Business Communication Platform',
          'Discover why modern businesses choose MyBDPhone for all-in-one IP telephony, PBX, and AI communication tools.',
          135,
        ]
      );
      pageId = result.insertId;
      pageStatus = 'published';
    } else {
      if (pageStatus === 'draft') {
        await pool.query(
          `UPDATE cms_pages SET status='published' WHERE id=?`,
          [pageId]
        );
      }
    }

    const sections = [
      {
        key: 'hero',
        type: 'HERO',
        title: 'Powerful Communication. Simple Experience.',
        subtitle: 'WHY CHOOSE MYBDPHONE?',
        content_body: 'Everything your business needs to stay connected without complex setups or hardware bloat.',
        display_order: 0,
        settings: {
          floating_cards: [
            '✓ Easy to Manage',
            '✓ Scalable',
            '✓ Business Ready'
          ],
          primary_btn: { text: 'Get Started', url: '/packages' },
          secondary_btn: { text: 'Talk to Specialist', url: '/contact' }
        }
      },
      {
        key: 'main_benefits',
        type: 'MAIN_BENEFITS',
        title: 'Key Platform Benefits',
        subtitle: 'Designed for efficiency, clarity, and growth.',
        content_body: '',
        display_order: 1,
        settings: {
          benefits: [
            {
              num: '01',
              title: 'All-in-One Platform',
              desc: 'IP Phone, PBX, AI Calling, and Auto Dialer in one central system.',
              icon: 'Layers'
            },
            {
              num: '02',
              title: 'Easy to Use',
              desc: 'Simple dashboard management with no steep learning curve.',
              icon: 'Smile'
            },
            {
              num: '03',
              title: 'Flexible & Scalable',
              desc: 'Instantly scale extensions and channels as your business grows.',
              icon: 'TrendingUp'
            },
            {
              num: '04',
              title: 'Multi-Device Sync',
              desc: 'Seamless call handling across Android, iOS, Desktop, and Hardware IP Phones.',
              icon: 'Smartphone'
            },
            {
              num: '05',
              title: 'Reliable Uptime',
              desc: 'High-availability telecom network ensuring uninterrupted calling.',
              icon: 'ShieldCheck'
            },
            {
              num: '06',
              title: 'Local 24/7 Support',
              desc: 'Dedicated support team in Bangladesh ready to assist anytime.',
              icon: 'Headphones'
            }
          ]
        }
      },
      {
        key: 'comparison',
        type: 'COMPARISON',
        title: 'Traditional Systems vs MyBDPhone',
        subtitle: 'See how MyBDPhone modernizes your entire business telecommunication setup.',
        content_body: '',
        display_order: 2,
        settings: {
          comparison_table: [
            { traditional: 'Multiple fragmented tools', mybdphone: 'One unified platform' },
            { traditional: 'Complex hardware setup', mybdphone: 'Easy cloud-based setup' },
            { traditional: 'Limited flexibility & rigid plans', mybdphone: 'Flexible custom packages' },
            { traditional: 'Hard to manage across locations', mybdphone: 'Centralized online dashboard' },
            { traditional: 'Basic calling features only', mybdphone: 'Advanced AI & Call Automation' }
          ]
        }
      },
      {
        key: 'target_audience',
        type: 'TARGET_AUDIENCE',
        title: 'Built for Every Business',
        subtitle: 'Tailored solutions for teams of all sizes.',
        content_body: '',
        display_order: 3,
        settings: {
          audiences: [
            { title: 'Startup', desc: 'Quick setup, low cost, and professional caller ID.', tag: 'Perfect for small teams' },
            { title: 'Small Business', desc: 'Manage client calls smoothly with smart routing.', tag: 'Perfect for growing teams' },
            { title: 'Corporate Team', desc: 'Multi-department PBX extensions and analytics.', tag: 'Perfect for enterprises' },
            { title: 'Call Center', desc: 'High-volume auto dialer, recording, and agent monitoring.', tag: 'Perfect for support & sales' }
          ]
        }
      },
      {
        key: 'trust_numbers',
        type: 'TRUST_NUMBERS',
        title: 'Trusted by Growing Companies',
        subtitle: 'Proven stats backing our service reliability.',
        content_body: '',
        display_order: 4,
        settings: {
          stats: [
            { value: '10K+', label: 'Active Users' },
            { value: '24/7', label: 'Dedicated Support' },
            { value: '99.9%', label: 'Service Availability' },
            { value: '1', label: 'Unified Platform' }
          ]
        }
      },
      {
        key: 'final_cta',
        type: 'FINAL_CTA',
        title: 'Choose a smarter way to communicate.',
        subtitle: 'Upgrade your business calling infrastructure today.',
        content_body: '',
        display_order: 5,
        settings: {
          primary_btn: { text: 'Get Started', url: '/packages' },
          secondary_btn: { text: 'Talk to Specialist', url: '/contact' }
        }
      }
    ];

    for (const sec of sections) {
      const [existing] = await pool.query(
        `SELECT id FROM cms_sections WHERE page_id=? AND (section_key=? OR section_type=?) LIMIT 1`,
        [pageId, sec.key, sec.type]
      );
      const jsonStr = JSON.stringify(sec.settings);
      if (!existing.length) {
        await pool.query(
          `INSERT INTO cms_sections
           (page_id, section_key, section_type, title, subtitle, content_body, content_html, custom_settings, settings, display_order, sort_order, is_visible, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')`,
          [
            pageId,
            sec.key,
            sec.type,
            sec.title,
            sec.subtitle,
            sec.content_body,
            sec.content_body,
            jsonStr,
            jsonStr,
            sec.display_order,
            sec.display_order
          ]
        );
      }
    }
  } catch (err) {
    console.error('ensureWhyChooseUsCmsPage error:', err.message);
  }
}

async function ensureFintechCmsPage() {
  try {
    const [pageRows] = await pool.query(
      `SELECT id, status FROM cms_pages WHERE slug='solutions/fintech' OR slug='fintech' LIMIT 1`
    );

    let pageId = pageRows[0]?.id;
    let pageStatus = pageRows[0]?.status;

    if (!pageId) {
      const [result] = await pool.query(
        `INSERT INTO cms_pages
         (title, slug, template, content_html, featured_image, seo_title, seo_description, meta_title, meta_description, status, sort_order)
         VALUES (?, 'solutions/fintech', 'solutions', '', ?, ?, ?, ?, ?, 'published', ?)
         ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
        [
          'Financial & FinTech Communication Solutions',
          'https://images.unsplash.com/photo-1559526324-4b87b5e36e44',
          'Financial & FinTech Voice & Calling Solutions | MyBDPhone',
          'Secure, compliant, and automated IP communication solutions designed for banks, MFS, fintech, and microfinance institutions.',
          'Financial & FinTech Voice & Calling Solutions | MyBDPhone',
          'Secure, compliant, and automated IP communication solutions designed for banks, MFS, fintech, and microfinance institutions.',
          150,
        ]
      );
      pageId = result.insertId;
      pageStatus = 'published';
    } else {
      if (pageStatus === 'draft') {
        await pool.query(
          `UPDATE cms_pages SET status='published' WHERE id=?`,
          [pageId]
        );
      }
    }

    const [existingSecs] = await pool.query(
      `SELECT COUNT(*) AS count FROM cms_sections WHERE page_id=?`,
      [pageId]
    );

    if (Number(existingSecs[0]?.count || 0) === 0) {
      const fintechSections = [
        {
          key: 'hero',
          type: 'HERO',
          title: 'Financial & FinTech Communication Solutions',
          subtitle: 'FINTECH & BANKING TELECOM ENGINE',
          content_body: 'Automate verification, loan collection reminders, customer support, and secure transaction alerts with high-reliability IP voice infrastructure.',
          image_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44',
          layout_orientation: 'IMAGE_RIGHT',
          order: 0,
          settings: {
            eyebrow: 'FINTECH & BANKING TELECOM ENGINE',
            primary_btn: { text: 'Get Started', url: '/packages' },
            secondary_btn: { text: 'Talk to Specialist', url: '/contact' }
          }
        },
        {
          key: 'solutions_grid',
          type: 'SOLUTIONS_GRID',
          title: 'Core Financial Voice Solutions',
          subtitle: 'Tailored voice communication channels for high-security fintech environments.',
          content_body: '',
          image_url: '',
          layout_orientation: 'IMAGE_RIGHT',
          order: 1,
          settings: {
            solutions: [
              { title: "Business IP Number", desc: "Official corporate numbers for bank trust and brand consistency.", icon: "Building2" },
              { title: "Cloud PBX", desc: "Multi-department call routing for main offices and field branches.", icon: "Server" },
              { title: "IVR & Call Routing", desc: "Automated self-service menu for account balance, queries, and support.", icon: "PhoneCall" },
              { title: "Customer Support Calling", desc: "Centralized helpdesk engine for agent management and call queueing.", icon: "Headphones" },
              { title: "Payment & Collection Calls", desc: "Automated AI reminder calls for EMI, loan dues, and bill payments.", icon: "CreditCard" },
              { title: "Verification Calls", desc: "Secure OTP voice delivery and account verification systems.", icon: "ShieldCheck" }
            ]
          }
        },
        {
          key: 'key_features',
          type: 'KEY_FEATURES',
          title: 'Built for High-Compliance Security',
          subtitle: 'Essential call features for compliance, quality control, and automation.',
          content_body: '',
          image_url: '',
          layout_orientation: 'IMAGE_RIGHT',
          order: 2,
          settings: {
            features: [
              { title: "Call Recording", desc: "Encrypted cloud voice recording for security and audit requirements.", icon: "Mic" },
              { title: "Call History & Logs", desc: "Real-time call logs and downloadable reports.", icon: "FileText" },
              { title: "Multi-Agent & Extensions", desc: "Assign extensions to agents, branch managers, and field staff.", icon: "Users" },
              { title: "AI Calling Engine", desc: "Localized Bangla AI voice assistant for smart customer outreach.", icon: "Bot" },
              { title: "Auto Dialer", desc: "Broadcast payment reminders and campaign notices automatically.", icon: "Zap" },
              { title: "Call Monitoring", desc: "Live agent call listening, whisper, and barging features.", icon: "Eye" }
            ]
          }
        },
        {
          key: 'packages',
          type: 'PACKAGES',
          title: 'FinTech Tailored Packages',
          subtitle: 'Choose the right plan designed for your financial operation size.',
          content_body: '',
          image_url: '',
          layout_orientation: 'IMAGE_RIGHT',
          order: 3,
          settings: {
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
          }
        },
        {
          key: 'why_choose',
          type: 'WHY_CHOOSE',
          title: 'Why FinTechs Trust MyBDPhone',
          subtitle: 'Engineered for reliability, enterprise security, and compliance.',
          content_body: '',
          image_url: '',
          layout_orientation: 'IMAGE_RIGHT',
          order: 4,
          settings: {
            points: [
              { title: "Centralized Communication", desc: "Manage multi-branch banking and online customer support from one dashboard." },
              { title: "Easy Management", desc: "Instant agent provisioning, live monitoring, and automated reports." },
              { title: "High Scalability", desc: "Handle spikes in verification calls and payment campaign volumes effortlessly." },
              { title: "Reliable Support", desc: "Dedicated 24/7 local support and regulatory compliance backing." }
            ]
          }
        },
        {
          key: 'final_cta',
          type: 'FINAL_CTA',
          title: 'Ready to upgrade your financial communication?',
          subtitle: 'Empower your financial institution with secure, automated IP voice solutions.',
          content_body: '',
          image_url: '',
          layout_orientation: 'IMAGE_RIGHT',
          order: 5,
          settings: {
            primary_btn: { text: "Get Started", url: "/packages" },
            secondary_btn: { text: "Talk to Specialist", url: "/contact" }
          }
        }
      ];

      for (const sec of fintechSections) {
        const jsonStr = JSON.stringify(sec.settings);
        await pool.query(
          `INSERT INTO cms_sections
           (page_id, section_key, section_type, title, subtitle, content_body, content_html, image_url, layout_orientation, custom_settings, settings, display_order, sort_order, is_visible, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')`,
          [
            pageId,
            sec.key,
            sec.type,
            sec.title,
            sec.subtitle,
            sec.content_body,
            sec.content_body,
            sec.image_url,
            sec.layout_orientation,
            jsonStr,
            jsonStr,
            sec.order,
            sec.order
          ]
        );
      }
    }
  } catch (err) {
    console.error('ensureFintechCmsPage error:', err.message);
  }
}

async function ensureRemoteWorkforceCmsPage() {
  try {
    const [pageRows] = await pool.query(
      `SELECT id, status FROM cms_pages WHERE slug='solutions/remote-workforce' OR slug='remote-workforce' LIMIT 1`
    );

    let pageId = pageRows[0]?.id;
    let pageStatus = pageRows[0]?.status;

    if (!pageId) {
      const [result] = await pool.query(
        `INSERT INTO cms_pages
         (title, slug, template, content_html, featured_image, seo_title, seo_description, meta_title, meta_description, status, sort_order)
         VALUES (?, 'solutions/remote-workforce', 'solutions', '', ?, ?, ?, ?, ?, 'published', ?)
         ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
        [
          'Remote Workforce',
          'https://images.unsplash.com/photo-1593642532400-2682810df593',
          'Remote Workforce Communication & Cloud IP Telephony | MyBDPhone',
          'Empower remote teams and distributed workforces across Bangladesh with Cloud PBX, softphone extensions, central calling, IVR, and call recording.',
          'Remote Workforce Communication & Cloud IP Telephony | MyBDPhone',
          'Empower remote teams and distributed workforces across Bangladesh with Cloud PBX, softphone extensions, central calling, IVR, and call recording.',
          160,
        ]
      );
      pageId = result.insertId;
      pageStatus = 'published';
    } else {
      if (pageStatus === 'draft') {
        await pool.query(
          `UPDATE cms_pages SET status='published' WHERE id=?`,
          [pageId]
        );
      }
    }

    const [existingSecs] = await pool.query(
      `SELECT COUNT(*) AS count FROM cms_sections WHERE page_id=?`,
      [pageId]
    );

    if (Number(existingSecs[0]?.count || 0) === 0) {
      const remoteWorkforceSections = [
        {
          key: 'hero',
          type: 'HERO',
          title: 'Unified Cloud Telephony for Remote & Hybrid Teams',
          subtitle: 'REMOTE WORKFORCE SOLUTIONS',
          content_body: 'Keep your distributed teams seamlessly connected with official business phone numbers, softphones, intelligent call routing, and centralized monitoring from anywhere.',
          image_url: 'https://images.unsplash.com/photo-1593642532400-2682810df593',
          layout_orientation: 'IMAGE_RIGHT',
          order: 0,
          settings: {
            eyebrow: 'REMOTE WORKFORCE SOLUTIONS',
            primary_btn: { text: 'Get Started', url: '/packages' },
            primary_text: 'Get Started',
            primary_url: '/packages',
            secondary_btn: { text: 'Request Demo', url: '/contact' },
            secondary_text: 'Request Demo',
            secondary_url: '/contact',
            badges: ['Work from Any Device', 'Zero Hardware Setup', '99.9% Uptime Guarantee']
          }
        },
        {
          key: 'overview',
          type: 'IMAGE_TEXT',
          title: 'Empower Your Distributed Workforce Without Physical Boundaries',
          subtitle: 'MODERN VIRTUAL TELECOM INFRASTRUCTURE',
          content_body: 'Eliminate the need for expensive on-premise PBX hardware. MyBDPhone enables remote employees, branch staff, and work-from-home agents to make and receive calls on laptops, desktops, and mobile devices using a single unified corporate number.',
          image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
          layout_orientation: 'IMAGE_LEFT',
          order: 1,
          settings: {
            eyebrow: 'MODERN VIRTUAL TELECOM INFRASTRUCTURE',
            image_position: 'left',
            layout_orientation: 'IMAGE_LEFT',
            primary_text: 'Explore Remote Setup',
            primary_url: '/packages',
            badges: ['Web & Mobile Softphone Apps', 'Instant Multi-Agent Onboarding', 'Encrypted HD Voice Channels']
          }
        },
        {
          key: 'core_features',
          type: 'KEY_FEATURES',
          title: 'Core Features for Remote Team Connectivity',
          subtitle: 'Enterprise-grade telephony tools engineered for distributed operations.',
          content_body: '',
          image_url: '',
          layout_orientation: 'IMAGE_RIGHT',
          order: 2,
          settings: {
            eyebrow: 'POWERFUL COLLABORATION TOOLS',
            columns: 3,
            features: [
              { title: 'Multi-Device Softphone', desc: 'Turn any smartphone, laptop, or PC into a fully functional business IP phone.', icon: 'Smartphone' },
              { title: 'Cloud PBX & Extensions', desc: 'Assign internal extensions to remote team members for free branch-to-branch calls.', icon: 'Users' },
              { title: 'Smart IVR & Call Queuing', desc: 'Automatically direct incoming customer calls to available remote agents based on shift.', icon: 'Route' },
              { title: 'Secure Call Recording', desc: 'Automatically record and store inbound and outbound calls in the cloud for quality audit.', icon: 'Mic' },
              { title: 'Live Supervisor Monitoring', desc: 'Monitor remote agent call activity, whisper assistance, and inspect live analytics.', icon: 'Eye' },
              { title: 'Simultaneous Ringing', desc: 'Ring multiple remote team devices at once so no crucial business lead is missed.', icon: 'PhoneIncoming' }
            ]
          }
        },
        {
          key: 'how_it_works',
          type: 'HOW_IT_WORKS',
          title: 'How Remote Workforce Telephony Works',
          subtitle: 'Go live with your entire remote team in 4 simple steps.',
          content_body: '',
          image_url: '',
          layout_orientation: 'IMAGE_RIGHT',
          order: 3,
          settings: {
            eyebrow: 'EASY ONBOARDING',
            steps: [
              { step: '01', title: 'Choose Number & Package', desc: 'Select an official 096 IP number and choose the extension package matching your remote team size.', icon: 'Building2' },
              { step: '02', title: 'Provision Agent Extensions', desc: 'Set up extensions, assign credentials, and configure IVR call routing rules via the admin dashboard.', icon: 'Users' },
              { step: '03', title: 'Install Softphone App', desc: 'Remote employees download the softphone on their phone or PC and log in instantly with zero configuration.', icon: 'Smartphone' },
              { step: '04', title: 'Start Calling & Tracking', desc: 'Make HD calls, answer incoming inquiries, and review centralized live call analytics and recordings.', icon: 'Zap' }
            ]
          }
        },
        {
          key: 'benefits',
          type: 'BENEFITS',
          title: 'Key Benefits for Modern Organizations',
          subtitle: 'Maximize remote employee productivity while cutting corporate telecom costs.',
          content_body: '',
          image_url: '',
          layout_orientation: 'IMAGE_RIGHT',
          order: 4,
          settings: {
            eyebrow: 'PROVEN VALUE',
            benefits: [
              { num: '01', title: 'Up to 60% Cost Savings', desc: 'Eliminate expensive on-site PBX hardware, maintenance contracts, and dedicated line rentals.', icon: 'BadgePercent' },
              { num: '02', title: 'Work From Anywhere', desc: 'Allow employees to operate from home, regional hubs, or on the move with full office phone connectivity.', icon: 'Globe2' },
              { num: '03', title: 'Centralized Quality Control', desc: 'Supervisors maintain full visibility into remote staff call volumes, talk time, and service quality.', icon: 'ShieldCheck' },
              { num: '04', title: 'Effortless Scalability', desc: 'Add or remove remote agent extensions in seconds as your team grows without hardware constraints.', icon: 'TrendingUp' }
            ]
          }
        },
        {
          key: 'who_its_for',
          type: 'WHO_ITS_FOR',
          title: "Who Remote Workforce Telephony is Built For",
          subtitle: 'Tailored communication infrastructure for diverse distributed business models.',
          content_body: '',
          image_url: '',
          layout_orientation: 'IMAGE_RIGHT',
          order: 5,
          settings: {
            eyebrow: 'DESIGNED FOR HYBRID TEAMS',
            audiences: [
              { title: 'Distributed Sales Teams', desc: 'Empower outbound sales reps to call prospects with official caller ID from home or field locations.', tag: 'Sales & BD' },
              { title: 'Remote Support & Helpdesks', desc: 'Route customer inquiries to home-based support agents with intelligent queues and call transfers.', tag: 'Customer Care' },
              { title: 'Multi-Branch & Regional Offices', desc: 'Connect headquarters and branch locations nationwide under one centralized dial plan.', tag: 'Enterprise' },
              { title: 'Startups & Digital Agencies', desc: 'Equip freelance, hybrid, and remote teams with professional enterprise telephony from day one.', tag: 'Startups' }
            ]
          }
        },
        {
          key: 'cta',
          type: 'CTA',
          title: 'Ready to Empower Your Remote Workforce?',
          subtitle: 'Deploy enterprise cloud telephony for your distributed team in minutes with zero setup hassle.',
          content_body: '',
          image_url: '',
          layout_orientation: 'IMAGE_RIGHT',
          order: 6,
          settings: {
            eyebrow: 'GET STARTED TODAY',
            primary_btn: { text: 'Explore Packages', url: '/packages' },
            primary_text: 'Explore Packages',
            primary_url: '/packages',
            secondary_btn: { text: 'Speak to an Expert', url: '/contact' },
            secondary_text: 'Speak to an Expert',
            secondary_url: '/contact'
          }
        }
      ];

      for (const sec of remoteWorkforceSections) {
        const jsonStr = JSON.stringify(sec.settings);
        await pool.query(
          `INSERT INTO cms_sections
           (page_id, section_key, section_type, title, subtitle, content_body, content_html, image_url, layout_orientation, custom_settings, settings, display_order, sort_order, is_visible, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')`,
          [
            pageId,
            sec.key,
            sec.type,
            sec.title,
            sec.subtitle,
            sec.content_body,
            sec.content_body,
            sec.image_url,
            sec.layout_orientation,
            jsonStr,
            jsonStr,
            sec.order,
            sec.order
          ]
        );
      }
    }
  } catch (err) {
    console.error('ensureRemoteWorkforceCmsPage error:', err.message);
  }
}

function parseMaybeJson(value, fallback = {}) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function getConfigMap(keys = null) {
  const [rows] = await pool.query(
    `SELECT setting_key, setting_value FROM site_settings WHERE setting_group IN ('cms','general','contact','homepage') ORDER BY setting_key`
  );
  const wanted = keys ? new Set(keys) : null;
  const result = {};
  for (const row of rows) {
    if (wanted && !wanted.has(row.setting_key)) continue;
    if (
      [
        "header_config",
        "footer_config",
        "global_config",
        "home_config",
        "contact_config",
      ].includes(row.setting_key)
    ) {
      result[row.setting_key] = parseMaybeJson(row.setting_value, {});
    } else {
      result[row.setting_key] = row.setting_value;
    }
  }
  return result;
}

async function getPublicHeader(req, res) {
  try {
    await ensureCmsTables();
    return res.json({
      success: true,
      config:
        (await getConfigMap(["header_config"])).header_config ||
        DEFAULT_SITE_CONFIG.header_config,
    });
  } catch (e) {
    console.error("CMS HEADER ERROR", e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load header configuration" });
  }
}

async function getPublicFooter(req, res) {
  try {
    await ensureCmsTables();
    const map = await getConfigMap(["footer_config", "global_config"]);
    return res.json({
      success: true,
      config: map.footer_config || DEFAULT_SITE_CONFIG.footer_config,
      global: map.global_config || DEFAULT_SITE_CONFIG.global_config,
    });
  } catch (e) {
    console.error("CMS FOOTER ERROR", e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load footer configuration" });
  }
}

async function getPublicContact(req, res) {
  try {
    await ensureCmsTables();
    const map = await getConfigMap(["contact_config"]);
    return res.json({
      success: true,
      config: map.contact_config || DEFAULT_SITE_CONFIG.contact_config,
    });
  } catch (e) {
    console.error("CMS CONTACT ERROR", e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load contact configuration" });
  }
}

async function getPublicHome(req, res) {
  try {
    await ensureCmsTables();
    const config = await getConfigMap(["home_config", "global_config"]);
    const [pages] = await pool.query(
      `SELECT * FROM cms_pages WHERE slug='home' AND status='published' LIMIT 1`
    );
    const page = pages[0] || null;
    const sections = page ? await getSectionsForPage(page.id, false) : [];
    const collections = {};
    const keys = [
      "home_hero_slides",
      "home_service_cards",
      "home_offerings",
      "home_clients",
      "cloud_pbx_clients",
      "home_advantages",
      "home_addons",
      "features",
      "testimonials",
      "faq",
    ];
    for (const key of keys) {
      const [rows] = await pool.query(
        `SELECT * FROM cms_items WHERE collection_key=? AND status IN ('active','published') ORDER BY sort_order,id`,
        [key]
      );
      collections[key] = rows.map((row) => ({
        ...row,
        payload: parseMaybeJson(row.payload, {}),
      }));
    }
    return res.json({ success: true, page, sections, config, collections });
  } catch (e) {
    console.error("CMS HOME ERROR", e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load home CMS" });
  }
}

async function getPublicPage(req, res) {
  try {
    await ensureCmsTables();

    let rawSlug = "";
    if (Array.isArray(req.params.slug)) {
      rawSlug = req.params.slug.join('/');
    } else if (req.params.slug) {
      rawSlug = String(req.params.slug);
    } else if (req.params[0]) {
      rawSlug = String(req.params[0]);
    }
    rawSlug = rawSlug.trim().replace(/^\/+|\/+$/g, "");
    
    // Also check if path had prefix after /public/cms-page/ or /public/page/ or req.query.slug
    if (!rawSlug && req.query?.slug) {
      rawSlug = String(req.query.slug).trim().replace(/^\/+|\/+$/g, "");
    }
    if (!rawSlug && req.originalUrl) {
      const match = req.originalUrl.match(/\/public\/(?:cms-page|page)\/(.+)$/);
      if (match) rawSlug = decodeURIComponent(match[1].split('?')[0]).trim().replace(/^\/+|\/+$/g, '');
    }
    
    // Normalize slugs like "features/smart-ivr-routing" or "/features/smart-ivr-routing" or "solutions/fintech"
    const slug = rawSlug.replace(/^(?:features|solutions|products)\//, "");

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug required",
      });
    }

    // Keep the navbar and product pages available through the same Pages /
    // Landing CMS even on an older database that has not been restarted yet.
    if (["ip-phone", "virtual-number", "business-ip-number", "auto-dialer", "voice-broadcast"].includes(slug)) {
      await ensureBuiltinProductCmsPages();
    }
    if (["ai-calling-automation", "smart-ivr-routing", "multi-device-ringing", "call-recording", "ai-bangla-voice-tts", "caller-tune-branding"].includes(slug)) {
      await ensureFeatureCmsPages();
    }
    if (slug === "about") {
      await ensureAboutCmsPage();
    }
    if (slug === "why-choose-us") {
      await ensureWhyChooseUsCmsPage();
    }
    if (slug === "fintech" || slug === "solutions/fintech" || rawSlug === "solutions/fintech" || rawSlug === "fintech") {
      await ensureFintechCmsPage();
    }
    if (slug === "remote-workforce" || slug === "solutions/remote-workforce" || rawSlug === "solutions/remote-workforce" || rawSlug === "remote-workforce") {
      await ensureRemoteWorkforceCmsPage();
    }

    // Fetch the row first so an intentionally inactive CMS page can be
    // distinguished from a page that has never been published.
    const cleanRaw = rawSlug.replace(/^\/+|\/+$/g, "");
    const cleanSlug = slug.replace(/^\/+|\/+$/g, "");
    const possibleSlugs = Array.from(new Set([
      cleanRaw,
      cleanSlug,
      `/${cleanRaw}`,
      `/${cleanSlug}`,
      `features/${cleanSlug}`,
      `/features/${cleanSlug}`,
      `solutions/${cleanSlug}`,
      `/solutions/${cleanSlug}`,
      `products/${cleanSlug}`,
      `/products/${cleanSlug}`,
    ]));

    let [rows] = await pool.query(
      `SELECT * FROM cms_pages WHERE slug IN (?) LIMIT 1`,
      [possibleSlugs]
    );

    // If alias fallback needed between ai-calling-automation and ai-bangla-voice-tts
    if (!rows.length && (slug === 'ai-calling-automation' || slug === 'ai-bangla-voice-tts')) {
      const aliasSlug = slug === 'ai-calling-automation' ? 'ai-bangla-voice-tts' : 'ai-calling-automation';
      [rows] = await pool.query(
        `SELECT * FROM cms_pages WHERE slug IN (?) LIMIT 1`,
        [[aliasSlug, `/${aliasSlug}`, `features/${aliasSlug}`, `/features/${aliasSlug}`]]
      );
    }

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "CMS page not found",
      });
    }

    const rawPage = rows[0];

    if (rawPage.status === "inactive") {
      return res.status(410).json({
        success: false,
        message: "CMS page is inactive",
      });
    }

    if (rawPage.status !== "published") {
      return res.status(404).json({
        success: false,
        message: "CMS page is not published",
      });
    }

    const page = {
      ...rawPage,
      meta_title: rawPage.meta_title || rawPage.seo_title || `${rawPage.title} - MyBDPhone`,
      meta_description: rawPage.meta_description || rawPage.seo_description || '',
    };

    if (slug === 'cloud-pbx') await ensureCloudPbxCms();
    const sections = await getSectionsForPage(page.id, true);
    const collectionKeys = new Set();
    for (const section of sections) {
      const settings = parseMaybeJson(section.settings || section.custom_settings, {});
      const cKey = settings.collection_key || settings.collection;
      if (cKey) collectionKeys.add(String(cKey));
      if (section.section_type === 'faq' || section.section_key === 'faq') collectionKeys.add('faq');
    }
    if (slug === 'cloud-pbx') {
      ['cloud_pbx_packages','cloud_pbx_features','cloud_pbx_benefits','cloud_pbx_documents','cloud_pbx_clients','cloud_pbx_faq']
        .forEach((key) => collectionKeys.add(key));
    }
    const collections = {};
    for (const key of collectionKeys) {
      const [items] = await pool.query(
        `SELECT * FROM cms_items WHERE collection_key=? AND status IN ('active','published') ORDER BY sort_order,id`,
        [key]
      );
      collections[key] = items.map((row) => ({ ...row, payload: parseMaybeJson(row.payload, {}) }));
    }

    return res.json({
      success: true,
      page,
      sections,
      collections,
    });
  } catch (e) {
    console.error("CMS PAGE ERROR", e);
    return res.status(500).json({
      success: false,
      message: "Failed to load CMS page",
    });
  }
}

async function getPublicCollection(req, res) {
  try {
    await ensureCmsTables();
    const key = String(req.params.collection || "").trim();
    const [rows] = await pool.query(
      `SELECT * FROM cms_items WHERE collection_key=? AND status IN ('active','published') ORDER BY sort_order,id`,
      [key]
    );
    return res.json({ success: true, collection: key, items: rows });
  } catch (e) {
    console.error("CMS COLLECTION ERROR", e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load CMS collection" });
  }
}

async function getSectionsForPage(pageId, publicOnly = false) {
  const where = publicOnly ? " AND (status='active' OR is_visible=1 OR is_visible IS NULL)" : "";
  const [rows] = await pool.query(
    `SELECT * FROM cms_sections WHERE page_id=?${where} ORDER BY COALESCE(display_order, sort_order) ASC, sort_order ASC, id ASC`,
    [pageId]
  );
  return rows.map((row) => {
    const customSettings = parseMaybeJson(row.custom_settings || row.settings, {});
    const settings = parseMaybeJson(row.settings || row.custom_settings, {});
    const content = row.content_body || row.content_html || "";
    return {
      ...row,
      content_body: content,
      content_html: row.content_html || content,
      layout_orientation: row.layout_orientation || settings.layout_orientation || (settings.image_position === 'left' ? 'IMAGE_LEFT' : 'IMAGE_RIGHT'),
      image_url: row.image_url || settings.image_url || settings.image || '',
      display_order: row.display_order !== undefined && row.display_order !== null ? row.display_order : (row.sort_order || 0),
      sort_order: row.sort_order !== undefined && row.sort_order !== null ? row.sort_order : (row.display_order || 0),
      custom_settings: customSettings,
      settings: settings,
      is_visible: row.is_visible !== undefined && row.is_visible !== null ? Boolean(row.is_visible) : row.status === 'active',
      status: row.status || (row.is_visible ? 'active' : 'inactive'),
    };
  });
}

async function adminOverview(req, res) {
  try {
    await ensureCmsTables();
    const [pages] = await pool.query(
      `SELECT status, COUNT(*) count FROM cms_pages GROUP BY status`
    );
    const [items] = await pool.query(
      `SELECT collection_key, status, COUNT(*) count FROM cms_items GROUP BY collection_key,status`
    );
    const [media] = await pool.query(
      `SELECT status, COUNT(*) count FROM cms_media GROUP BY status`
    );
    return res.json({ success: true, stats: { pages, items, media } });
  } catch (e) {
    console.error("CMS OVERVIEW ERROR", e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load CMS overview" });
  }
}

async function listPages(req, res) {
  try {
    await ensureCmsTables();
    const [rows] = await pool.query(
      `SELECT * FROM cms_pages ORDER BY sort_order,id`
    );
    return res.json({ success: true, pages: rows });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load pages" });
  }
}
async function createPage(req, res) {
  try {
    await ensureCmsTables();
    const {
      title,
      slug,
      template = "standard",
      content_html = "",
      featured_image = "",
      seo_title = "",
      seo_description = "",
      meta_title = "",
      meta_description = "",
      status = "draft",
      sort_order = 0,
    } = req.body;
    if (!title || !slug)
      return res
        .status(400)
        .json({ success: false, message: "Title and slug are required" });
    const cleanSlug = String(slug).toLowerCase().replace(/\s+/g, "-");
    const [r] = await pool.query(
      `INSERT INTO cms_pages(title,slug,template,content_html,featured_image,seo_title,seo_description,meta_title,meta_description,status,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        title,
        cleanSlug,
        template,
        content_html,
        featured_image,
        seo_title || meta_title || title,
        seo_description || meta_description || "",
        meta_title || seo_title || title,
        meta_description || seo_description || "",
        status,
        Number(sort_order) || 0,
      ]
    );
    return res
      .status(201)
      .json({ success: true, id: r.insertId, message: "Page created" });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({
        success: false,
        message:
          e.code === "ER_DUP_ENTRY"
            ? "Slug already exists"
            : "Failed to create page",
      });
  }
}
async function updatePage(req, res) {
  try {
    await ensureCmsTables();
    const { id } = req.params;
    const {
      title,
      slug,
      template,
      content_html,
      featured_image,
      seo_title,
      seo_description,
      meta_title,
      meta_description,
      status,
      sort_order,
    } = req.body;
    await pool.query(
      `UPDATE cms_pages SET title=COALESCE(?,title),slug=COALESCE(?,slug),template=COALESCE(?,template),content_html=COALESCE(?,content_html),featured_image=COALESCE(?,featured_image),seo_title=COALESCE(?,seo_title),seo_description=COALESCE(?,seo_description),meta_title=COALESCE(?,meta_title),meta_description=COALESCE(?,meta_description),status=COALESCE(?,status),sort_order=COALESCE(?,sort_order) WHERE id=?`,
      [
        title,
        slug,
        template,
        content_html,
        featured_image,
        seo_title,
        seo_description,
        meta_title,
        meta_description,
        status,
        sort_order,
        id,
      ]
    );
    return res.json({ success: true, message: "Page updated" });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update page" });
  }
}
async function deletePage(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`SELECT slug FROM cms_pages WHERE id=?`, [
      id,
    ]);
    if (rows[0]?.slug === "home")
      return res
        .status(400)
        .json({ success: false, message: "Home page cannot be deleted" });
    await pool.query(`DELETE FROM cms_pages WHERE id=?`, [id]);
    return res.json({ success: true, message: "Page deleted" });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete page" });
  }
}
async function togglePage(req, res) {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE cms_pages SET status=IF(status='published','inactive','published') WHERE id=? AND slug<>'home'`,
      [id]
    );
    return res.json({ success: true, message: "Page status updated" });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to toggle page" });
  }
}

async function listSections(req, res) {
  try {
    await ensureCmsTables();
    const { pageId } = req.params;
    const [pageRows] = await pool.query(`SELECT slug FROM cms_pages WHERE id=? LIMIT 1`, [pageId]);
    if (pageRows[0]?.slug === 'cloud-pbx') await ensureCloudPbxCms();
    if (pageRows[0]?.slug === 'solutions/fintech' || pageRows[0]?.slug === 'fintech') await ensureFintechCmsPage();
    if (pageRows[0]?.slug === 'solutions/remote-workforce' || pageRows[0]?.slug === 'remote-workforce') await ensureRemoteWorkforceCmsPage();
    if (["smart-ivr-routing", "multi-device-ringing", "call-recording", "ai-bangla-voice-tts", "caller-tune-branding"].includes(pageRows[0]?.slug)) {
      await ensureFeatureCmsPages();
    }
    return res.json({
      success: true,
      sections: await getSectionsForPage(pageId, false),
    });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load sections" });
  }
}

async function getSection(req, res) {
  try {
    await ensureCmsTables();
    const { id } = req.params;
    const [rows] = await pool.query(`SELECT * FROM cms_sections WHERE id=? LIMIT 1`, [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }
    const row = rows[0];
    const customSettings = parseMaybeJson(row.custom_settings || row.settings, {});
    const settings = parseMaybeJson(row.settings || row.custom_settings, {});
    const content = row.content_body || row.content_html || "";
    return res.json({
      success: true,
      section: {
        ...row,
        content_body: content,
        content_html: row.content_html || content,
        layout_orientation: row.layout_orientation || settings.layout_orientation || (settings.image_position === 'left' ? 'IMAGE_LEFT' : 'IMAGE_RIGHT'),
        image_url: row.image_url || settings.image_url || settings.image || '',
        display_order: row.display_order !== undefined && row.display_order !== null ? row.display_order : (row.sort_order || 0),
        sort_order: row.sort_order !== undefined && row.sort_order !== null ? row.sort_order : (row.display_order || 0),
        custom_settings: customSettings,
        settings: settings,
        is_visible: row.is_visible !== undefined && row.is_visible !== null ? Boolean(row.is_visible) : row.status === 'active',
        status: row.status || (row.is_visible ? 'active' : 'inactive'),
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Failed to get section" });
  }
}

async function createSection(req, res) {
  try {
    await ensureCmsTables();
    const { pageId } = req.params;
    const {
      section_key,
      section_type = "rich_text",
      title = "",
      subtitle = "",
      content_body = "",
      content_html = "",
      layout_orientation = "IMAGE_RIGHT",
      image_url = "",
      custom_settings,
      settings,
      sort_order = 0,
      display_order,
      status = "active",
      is_visible = true,
    } = req.body;

    if (!section_key)
      return res
        .status(400)
        .json({ success: false, message: "section_key required" });

    const mergedSettings = custom_settings !== undefined ? custom_settings : (settings || {});
    const order = display_order !== undefined ? Number(display_order) : (Number(sort_order) || 0);
    const bodyContent = content_body || content_html || "";
    const visible = is_visible !== undefined ? (is_visible ? 1 : 0) : (status === 'active' ? 1 : 0);

    const [r] = await pool.query(
      `INSERT INTO cms_sections(page_id,section_key,section_type,title,subtitle,content_html,content_body,layout_orientation,image_url,custom_settings,settings,sort_order,display_order,status,is_visible) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        pageId,
        section_key,
        section_type,
        title,
        subtitle,
        bodyContent,
        bodyContent,
        layout_orientation,
        image_url,
        JSON.stringify(mergedSettings || {}),
        JSON.stringify(mergedSettings || {}),
        order,
        order,
        visible ? 'active' : 'inactive',
        visible,
      ]
    );
    return res
      .status(201)
      .json({ success: true, id: r.insertId, message: "Section created" });
  } catch (e) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          e.code === "ER_DUP_ENTRY"
            ? "Section key already exists"
            : "Failed to create section",
      });
  }
}

async function updateSection(req, res) {
  try {
    await ensureCmsTables();
    const { id } = req.params;
    const {
      section_key,
      section_type,
      title,
      subtitle,
      content_body,
      content_html,
      layout_orientation,
      image_url,
      custom_settings,
      settings,
      sort_order,
      display_order,
      status,
      is_visible,
    } = req.body;

    const mergedSettings = custom_settings !== undefined ? custom_settings : settings;
    const order = display_order !== undefined ? display_order : sort_order;
    const bodyContent = content_body !== undefined ? content_body : content_html;
    const visible = is_visible !== undefined ? (is_visible ? 1 : 0) : (status !== undefined ? (status === 'active' ? 1 : 0) : undefined);

    await pool.query(
      `UPDATE cms_sections
       SET section_key=COALESCE(?,section_key),
           section_type=COALESCE(?,section_type),
           title=COALESCE(?,title),
           subtitle=COALESCE(?,subtitle),
           content_html=COALESCE(?,content_html),
           content_body=COALESCE(?,content_body),
           layout_orientation=COALESCE(?,layout_orientation),
           image_url=COALESCE(?,image_url),
           custom_settings=COALESCE(?,custom_settings),
           settings=COALESCE(?,settings),
           sort_order=COALESCE(?,sort_order),
           display_order=COALESCE(?,display_order),
           status=COALESCE(?,status),
           is_visible=COALESCE(?,is_visible)
       WHERE id=?`,
      [
        section_key,
        section_type,
        title,
        subtitle,
        bodyContent,
        bodyContent,
        layout_orientation,
        image_url,
        mergedSettings === undefined ? null : JSON.stringify(mergedSettings),
        mergedSettings === undefined ? null : JSON.stringify(mergedSettings),
        order,
        order,
        status !== undefined ? status : (visible !== undefined ? (visible ? 'active' : 'inactive') : null),
        visible,
        id,
      ]
    );
    return res.json({ success: true, message: "Section updated" });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update section" });
  }
}

async function toggleSection(req, res) {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE cms_sections SET status=IF(status='active','inactive','active'), is_visible=IF(status='active',0,1) WHERE id=?`,
      [id]
    );
    return res.json({ success: true, message: "Section status updated" });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to toggle section" });
  }
}

async function deleteSection(req, res) {
  try {
    await pool.query(`DELETE FROM cms_sections WHERE id=?`, [req.params.id]);
    return res.json({ success: true, message: "Section deleted" });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete section" });
  }
}

async function reorderSections(req, res) {
  try {
    const { items = [] } = req.body;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const item of items) {
        const order = Number(item.display_order ?? item.sort_order ?? 0);
        await conn.query(`UPDATE cms_sections SET sort_order=?, display_order=? WHERE id=?`, [
          order,
          order,
          item.id,
        ]);
      }
      await conn.commit();
      return res.json({ success: true, message: "Sections reordered" });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to reorder sections" });
  }
}

async function listItems(req, res) {
  try {
    await ensureCmsTables();
    const key = String(req.params.collection || "");
    const [rows] = await pool.query(
      `SELECT * FROM cms_items WHERE collection_key=? ORDER BY sort_order,id`,
      [key]
    );
    return res.json({ success: true, items: rows });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load CMS items" });
  }
}
async function createItem(req, res) {
  try {
    await ensureCmsTables();
    const {
      collection_key,
      title,
      slug = "",
      description = "",
      content_html = "",
      image_url = "",
      icon = "",
      link_url = "",
      meta = "",
      payload = {},
      sort_order = 0,
      status = "active",
    } = req.body;
    if (!collection_key || !title)
      return res
        .status(400)
        .json({ success: false, message: "Collection and title are required" });
    const [r] = await pool.query(
      `INSERT INTO cms_items(collection_key,title,slug,description,content_html,image_url,icon,link_url,meta,payload,sort_order,status,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,IF(? IN ('active','published'),NOW(),NULL))`,
      [
        collection_key,
        title,
        slug ||
          title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
        description,
        content_html,
        image_url,
        icon,
        link_url,
        meta,
        JSON.stringify(payload || {}),
        Number(sort_order) || 0,
        status,
        status,
      ]
    );
    return res
      .status(201)
      .json({ success: true, id: r.insertId, message: "CMS item created" });
  } catch (e) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          e.code === "ER_DUP_ENTRY"
            ? "Item already exists"
            : "Failed to create item",
      });
  }
}
async function updateItem(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      description,
      content_html,
      image_url,
      icon,
      link_url,
      meta,
      payload,
      sort_order,
      status,
    } = req.body;
    await pool.query(
      `UPDATE cms_items SET title=COALESCE(?,title),slug=COALESCE(?,slug),description=COALESCE(?,description),content_html=COALESCE(?,content_html),image_url=COALESCE(?,image_url),icon=COALESCE(?,icon),link_url=COALESCE(?,link_url),meta=COALESCE(?,meta),payload=COALESCE(?,payload),sort_order=COALESCE(?,sort_order),status=COALESCE(?,status),published_at=IF(?,NOW(),published_at) WHERE id=?`,
      [
        title,
        slug,
        description,
        content_html,
        image_url,
        icon,
        link_url,
        meta,
        payload === undefined ? null : JSON.stringify(payload || {}),
        sort_order,
        status,
        ["active", "published"].includes(status),
        id,
      ]
    );
    return res.json({ success: true, message: "CMS item updated" });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update item" });
  }
}
async function deleteItem(req, res) {
  try {
    await pool.query(`DELETE FROM cms_items WHERE id=?`, [req.params.id]);
    return res.json({ success: true, message: "CMS item deleted" });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete item" });
  }
}
async function toggleItem(req, res) {
  try {
    await pool.query(
      `UPDATE cms_items SET status=IF(status='active','inactive','active') WHERE id=?`,
      [req.params.id]
    );
    return res.json({ success: true, message: "CMS item status updated" });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to toggle item" });
  }
}
async function reorderItems(req, res) {
  try {
    const { items = [] } = req.body;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const item of items) {
        await conn.query(`UPDATE cms_items SET sort_order=? WHERE id=?`, [
          Number(item.sort_order) || 0,
          item.id,
        ]);
      }
      await conn.commit();
      return res.json({ success: true, message: "Items reordered" });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to reorder items" });
  }
}

async function getAdminConfigs(req, res) {
  try {
    await ensureCmsTables();
    const config = await getConfigMap();
    return res.json({ success: true, config });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load CMS configuration" });
  }
}
async function updateAdminConfig(req, res) {
  try {
    await ensureCmsTables();
    const { key } = req.params;
    const { value } = req.body;
    if (
      ![
        "header_config",
        "footer_config",
        "global_config",
        "home_config",
        "contact_config",
      ].includes(key)
    )
      return res
        .status(400)
        .json({ success: false, message: "Unsupported config key" });
    const finalValue =
      typeof value === "string" ? value : JSON.stringify(value || {});
    await pool.query(
      `INSERT INTO site_settings(setting_key,setting_value,setting_group) VALUES(?,?, 'cms') ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value),setting_group='cms'`,
      [key, finalValue]
    );
    return res.json({ success: true, message: "Configuration saved" });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to save configuration" });
  }
}

async function uploadMedia(req, res) {
  try {
    await ensureCmsTables();
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Image file is required" });
    }
    const relativeUrl = `/uploads/cms/${req.file.filename}`;
    const name = String(
      req.body?.name || req.file.originalname || req.file.filename
    ).slice(0, 255);
    const altText = String(req.body?.alt_text || name).slice(0, 255);
    const [result] = await pool.query(
      `INSERT INTO cms_media(name,url,media_type,alt_text,status) VALUES(?,?,?,?, 'active')`,
      [name, relativeUrl, "image", altText]
    );
    return res
      .status(201)
      .json({
        success: true,
        id: result.insertId,
        url: relativeUrl,
        name,
        alt_text: altText,
        message: "Image uploaded",
      });
  } catch (e) {
    console.error("CMS MEDIA UPLOAD ERROR", e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to upload image" });
  }
}

async function listMedia(req, res) {
  try {
    await ensureCmsTables();
    const [rows] = await pool.query(`SELECT * FROM cms_media ORDER BY id DESC`);
    return res.json({ success: true, media: rows });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load media" });
  }
}
async function createMedia(req, res) {
  try {
    await ensureCmsTables();
    const {
      name,
      url,
      media_type = "image",
      alt_text = "",
      status = "active",
    } = req.body;
    if (!name || !url)
      return res
        .status(400)
        .json({ success: false, message: "Name and URL are required" });
    const [r] = await pool.query(
      `INSERT INTO cms_media(name,url,media_type,alt_text,status) VALUES(?,?,?,?,?)`,
      [name, url, media_type, alt_text, status]
    );
    return res
      .status(201)
      .json({ success: true, id: r.insertId, message: "Media saved" });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to save media" });
  }
}
async function updateMedia(req, res) {
  try {
    const { id } = req.params;
    const { name, url, media_type, alt_text, status } = req.body;
    await pool.query(
      `UPDATE cms_media SET name=COALESCE(?,name),url=COALESCE(?,url),media_type=COALESCE(?,media_type),alt_text=COALESCE(?,alt_text),status=COALESCE(?,status) WHERE id=?`,
      [name, url, media_type, alt_text, status, id]
    );
    return res.json({ success: true, message: "Media updated" });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update media" });
  }
}
async function toggleMedia(req, res) {
  try {
    await pool.query(
      `UPDATE cms_media SET status=IF(status='active','inactive','active') WHERE id=?`,
      [req.params.id]
    );
    return res.json({ success: true, message: "Media status updated" });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to toggle media" });
  }
}
async function deleteMedia(req, res) {
  try {
    await pool.query(`DELETE FROM cms_media WHERE id=?`, [req.params.id]);
    return res.json({ success: true, message: "Media deleted" });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete media" });
  }
}

module.exports = {
  ensureCmsTables,
  ensureFeatureCmsPages,
  getPublicHeader,
  getPublicFooter,
  getPublicContact,
  getPublicHome,
  getPublicPage,
  getPublicCollection,
  ensureBuiltinProductCmsPages,
  adminOverview,
  listPages,
  createPage,
  updatePage,
  deletePage,
  togglePage,
  listSections,
  getSection,
  createSection,
  updateSection,
  toggleSection,
  deleteSection,
  reorderSections,
  listItems,
  createItem,
  updateItem,
  deleteItem,
  toggleItem,
  reorderItems,
  getAdminConfigs,
  updateAdminConfig,
  listMedia,
  createMedia,
  updateMedia,
  toggleMedia,
  uploadMedia,
  deleteMedia,
};
