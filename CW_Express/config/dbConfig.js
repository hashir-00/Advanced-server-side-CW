const config = require("./config");
const mysql = require("mysql2/promise");

// Create connection pool for better performance and connection management
const pool = mysql.createPool(config.db);

// Test the connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✓ Database connected successfully");
    connection.release();
  } catch (err) {
    console.error("✗ Error connecting to the database:", err.message);
    process.exit(1);
  }
})();

module.exports = pool;
