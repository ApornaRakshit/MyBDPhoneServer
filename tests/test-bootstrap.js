const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

(async () => {
  try {
    const pool = require("../src/config/db");
    const { ensureAuthSecurityTables } = require("../src/config/authSecurity");
    const { ensureCmsTables } = require("../src/controllers/cmsController");
    const { ensureCommerceTables } = require("../src/controllers/adminCommerceController");

    await pool.query("SELECT 1 AS ok");
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

    console.log("Bootstrap test passed.");
  } catch (error) {
    console.error("Bootstrap test failed:", error.code || "", error.message);
    process.exitCode = 1;
  }
})();
