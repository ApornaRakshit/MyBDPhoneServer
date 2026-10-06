require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("./config/db");

const createAdmin = async () => {
  try {
    const password = "admin@gmail.com";
    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      `
      UPDATE users
      SET
        name = 'Admin',
        password = ?,
        role = 'admin',
        status = 'active'
      WHERE email = 'admin@gmail.com'
      `,
      [hashedPassword]
    );

    console.log("Admin update result:", result);

    if (result.affectedRows === 0) {
      console.log("Admin email not found.");
    } else {
      console.log("Admin account updated successfully.");
    }

    process.exit(0);
  } catch (error) {
    console.error("CREATE ADMIN ERROR:", error);
    process.exit(1);
  }
};

createAdmin();