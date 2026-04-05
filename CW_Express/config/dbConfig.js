const config = require("./config");
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// Ensure multipleStatements is enabled to run the entire schema file
const dbOptions = { ...config.db, multipleStatements: true };
const pool = mysql.createPool(dbOptions);

// Test the connection and initialize schema gracefully
const initDB = async (retries = 5, delay = 5000) => {
  while (retries > 0) {
    try {
      const connection = await pool.getConnection();
      console.log("✓ Database connected successfully");
      
      try {
        // Disabled auto-running schema to prevent data deletion
        // const schemaPath = path.join(__dirname, '../database/schema.sql');
        // const schemaStr = fs.readFileSync(schemaPath, 'utf8');
        // console.log("⏳ Creating tables from schema...");
        // await connection.query(schemaStr);
        // console.log("✓ Database tables verified");
      } catch (schemaErr) {
        console.error("✗ Error executing schema:", schemaErr.message);
      } finally {
        connection.release();
      }
      return; // Exit the loop on success
    } catch (err) {
      retries -= 1;
      console.error(`✗ Error connecting to the database. Retries left: ${retries}`);
      console.error(`  Reason: ${err.message}`);
      if (retries === 0) {
        console.error("✗ Exhausted all database connection retries. Continuing without DB, but expect errors.");
      } else {
        console.log(`⏳ Waiting ${delay / 1000}s before retrying...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
};

initDB();

module.exports = pool;
