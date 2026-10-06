const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const pool = require("../src/config/db");

(async () => {
  try {
    const [rows] = await pool.query("SELECT DATABASE() AS database_name, USER() AS db_user");
    console.log("Database connection successful:");
    console.log({
      database: rows[0].database_name,
      user: rows[0].db_user,
    });
  } catch (error) {
    console.error("Database connection failed:", error.code, error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
