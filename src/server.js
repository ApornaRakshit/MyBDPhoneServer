const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
// dotenv.config({
//   path: path.resolve(__dirname, "../.env"),
// });
// require("dotenv").config();

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

console.log(
  'Moneybag config:',
  {
    baseUrl: process.env.MONEYBAG_BASE_URL,
    keyLoaded: Boolean(
      process.env.MONEYBAG_MERCHANT_API_KEY
    ),
    keyLength:
      process.env.MONEYBAG_MERCHANT_API_KEY?.length || 0
  }
);

require("./controllers/adminCommerceController");
const { ensureAuthSecurityTables } = require("./config/authSecurity");


// ===============================
// ROUTES
// ===============================
const authRoutes = require("./routes/authRoutes");
const packageRoutes = require("./routes/packageRoutes");
const ipPhoneRoutes = require("./routes/ipPhoneRoutes");
const aiCallingRoutes = require("./routes/aiCallingRoutes");
const rechargeRoutes = require("./routes/rechargeRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const shopRoutes = require("./routes/shopRoutes");
const orderRoutes = require("./routes/orderRoutes");
const callRoutes = require("./routes/callRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const adminRoutes = require("./routes/adminRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const navigationRoutes = require("./routes/navigationRoutes");
const dgepayRoutes = require("./routes/dgepayRoutes");
const moneybagRoutes = require("./routes/moneybagRoutes");
const cmsRoutes = require("./routes/cmsRoutes");
const featureRoutes = require("./routes/featureRoutes");
const paymentMethodRoutes = require("./routes/paymentMethodRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const clientBrandRoutes = require("./routes/clientBrandRoutes");
const contactRoutes = require("./routes/contactRoutes");
const { webhook: moneybagWebhook } = require("./controllers/moneybagController");
const { 
  ensureResourceTables, 
  getPublicResourcePage, 
  updateAdminResourcePage 
} = require("./controllers/resourceController");
const { ensureClientBrandTables } = require("./controllers/clientBrandController");
const { ensureContactTables, submitContactInquiry } = require("./controllers/contactController");
const { ensureShopTables } = require("./controllers/shopController");
const { protect } = require("./middleware/authMiddleware");
const { adminOnly } = require("./middleware/adminMiddleware");


// ===============================
// CONTROLLERS
// ===============================
const {
  ensureCmsTables,
  getPublicHeader,
  getPublicFooter,
  getPublicContact,
  getPublicHome,
  getPublicPage,
  getPublicCollection,
} = require("./controllers/cmsController");
const {
  ensureCommerceTables,
} = require("./controllers/adminCommerceController");
const {
  ensureFeatureTables,
} = require("./controllers/featureController");

// ===============================
// APP
// ===============================
const app = express();

const PORT = process.env.PORT || 5000;

// Needed when Node/Express is behind cPanel/Apache/Passenger.
app.set("trust proxy", 1);

// ===============================
// ALLOWED FRONTEND ORIGINS
// ===============================
// Both domains use the SAME backend and SAME database.

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",

  "https://mybdphone.com",
  "https://www.mybdphone.com",
];

// ===============================
// SECURITY
// ===============================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ===============================
// CORS
// ===============================
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without Origin header
      // Example: Postman / server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      // Remove trailing slash if any
      const cleanOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      console.log("❌ CORS BLOCKED:", origin);

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);

// Moneybag webhook must receive the raw request body for HMAC verification.
// Mount it before express.json() so the signature can be verified against exact bytes.
app.post(
  "/api/moneybag/webhook",
  express.raw({ type: "application/json", limit: "2mb" }),
  moneybagWebhook
);

// ===============================
// BODY PARSERS
// ===============================
app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// ===============================
// UPLOADS
// ===============================
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

console.log("Uploads directory:", UPLOADS_DIR);

app.use(
  "/uploads",
  express.static(UPLOADS_DIR)
);

// ===============================
// UPLOAD DIAGNOSTIC
// ===============================
app.get("/api/health/uploads", (req, res) => {
  const fs = require("fs");

  const sample = path.join(
    UPLOADS_DIR,
    "cms",
    "banner1.png"
  );

  res.json({
    success: true,
    uploadsDir: UPLOADS_DIR,
    uploadsExists: fs.existsSync(UPLOADS_DIR),
    sampleImageExists: fs.existsSync(sample),
  });
});

// ===============================
// HEALTH CHECK
// ===============================
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message:
      "MyBDPhone Unified Telecom & AI API is running healthy",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "production",
    time: new Date().toISOString(),
  });
});

// ===============================
// API ROUTES
// ===============================

app.use("/api/auth", authRoutes);

app.use("/api/packages", packageRoutes);

app.use("/api/ip-phone", ipPhoneRoutes);

app.use("/api/ai-calling", aiCallingRoutes);

app.use("/api/recharge", rechargeRoutes);

app.use("/api/dgepay", dgepayRoutes);

app.use("/api/transactions", transactionRoutes);

app.use("/api/shop", shopRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/calls", callRoutes);

app.use("/api/tickets", ticketRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/settings", settingsRoutes);

app.use("/api/navigation", navigationRoutes);

app.use("/api/cms", cmsRoutes);

const PUBLIC_AUDIO_DIR = path.join(__dirname, "..", "public", "audio");
app.use("/audio", express.static(PUBLIC_AUDIO_DIR));

// Backward-compatible public CMS aliases.
//
// Older production frontend builds used /api/public/* while the current
// frontend uses /api/cms/public/*. Keeping these read-only aliases prevents
// an old cached/deployed bundle from producing 404s during a deployment.
//
// IMPORTANT: Only the public CMS endpoints are aliased here. Admin CMS
// endpoints remain protected under /api/cms/admin.
app.get("/api/public/header", getPublicHeader);
app.get("/api/public/footer", getPublicFooter);
app.get("/api/public/contact", getPublicContact);
app.get("/api/public/home", getPublicHome);
app.get("/api/public/page", getPublicPage);
app.get("/api/public/page/{*slug}", getPublicPage);
app.get("/api/public/cms-page", getPublicPage);
app.get("/api/public/cms-page/{*slug}", getPublicPage);
app.get("/api/public/collection/:collection", getPublicCollection);
app.get("/api/public/resources/:slug", getPublicResourcePage);
app.put("/api/admin/cms/resources/:slug", protect, adminOnly, updateAdminResourcePage);

const voicePersonaRoutes = require("./routes/voicePersonaRoutes");
const { getVoicePersonas, generateTts } = require("./controllers/voicePersonaController");

app.use("/api/public", voicePersonaRoutes);
app.use("/api", voicePersonaRoutes);
app.get("/api/public/voice-personas", getVoicePersonas);
app.post("/api/public/generate-tts", generateTts);

app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/moneybag", moneybagRoutes);
app.use("/api/features", featureRoutes);
app.use("/api/admin/features", featureRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/admin/resources", resourceRoutes);
app.use("/api/v1/client-brands", clientBrandRoutes);
app.use("/api/client-brands", clientBrandRoutes);
app.use("/v1/client-brands", clientBrandRoutes);
app.use("/client-brands", clientBrandRoutes);
app.use("/api/contact", contactRoutes);
app.post("/api/public/contact", submitContactInquiry);

// ===============================
// ROOT
// ===============================
app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "MyBDPhone API",
    tagline: "Your Phone. Your Business. Powered by AI.",
  });
});

// ===============================
// 404 HANDLER
// ===============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found`,
  });
});

// ===============================
// GLOBAL ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
  console.error("GLOBAL SERVER ERROR:", err);

  // CORS error
  if (
    err.message &&
    err.message.startsWith("CORS blocked")
  ) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  res.status(500).json({
    success: false,
    message:
      err.message || "Internal Server Error",
  });
});

// ===============================
// DATABASE + SERVER START
// ===============================
(async () => {
  try {
    const db = require("./config/db");
    await db.query("SELECT 1 AS ok");
    console.log("Database connection OK.");

    console.log("Checking authentication security tables...");
    await ensureAuthSecurityTables();
    console.log("Authentication security tables ready.");

    console.log("Checking CMS tables...");

    await ensureCmsTables();

    console.log("CMS tables ready.");

    console.log("Checking Commerce tables...");

    await ensureCommerceTables();

    console.log("Commerce tables ready.");

    console.log("Checking Feature Pages tables...");

    await ensureFeatureTables();

    console.log("Feature Pages tables ready.");

    console.log("Checking Resources Platform tables...");

    await ensureResourceTables();

    console.log("Resources Platform tables ready.");

    console.log("Checking Client Brands tables...");

    await ensureClientBrandTables();

    console.log("Client Brands tables ready.");

    console.log("Checking Contact Inquiries tables...");

    await ensureContactTables();

    console.log("Contact Inquiries tables ready.");

    console.log("Checking Shop Marketplace tables...");

    await ensureShopTables();

    console.log("Shop Marketplace tables ready.");
  } catch (error) {
    console.error(
      "CMS / Commerce / Feature / Brand bootstrap failed:",
      error.message
    );
  }

  // ===============================
  // START SERVER
  // ===============================
  app.listen(PORT, "0.0.0.0", () => {
    console.log("======================================");
    console.log("🚀 MyBDPhone API Server Started");
    console.log("======================================");
    console.log(`PORT: ${PORT}`);
     console.log(
      `API: https://api.mybdphone.com`
    );
    console.log(
      `Frontend: https://mybdphone.com`
    );
    console.log(
      `Frontend WWW: https://www.mybdphone.com`
    );
    console.log("======================================");
  });
})();