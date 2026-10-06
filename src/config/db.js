// const mysql = require("mysql2/promise");

// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT || 3306,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,

//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// module.exports = pool;


const path = require("path");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");

// Always load the server's own .env, regardless of the current working directory.
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const required = [
  "DB_HOST",
  "DB_USER",
  "DB_NAME",
];

const missing = required.filter((key) => {
  const value = process.env[key];
  return value === undefined || String(value).trim() === "";
});

if (missing.length) {
  throw new Error(
    `Database configuration missing: ${missing.join(", ")}. ` +
      `Expected values in ${path.resolve(__dirname, "../../.env")}`
  );
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log("[DB] Config loaded:", {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  passwordLoaded: Boolean(process.env.DB_PASSWORD),
});

module.exports = pool;

