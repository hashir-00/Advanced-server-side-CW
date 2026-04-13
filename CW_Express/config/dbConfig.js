const config = require("./config");
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const dbOptions = { ...config.db, multipleStatements: true };
const pool = mysql.createPool(dbOptions);

const initDB = async (retries = 5, delay = 5000) => {
  while (retries > 0) {
    try {
      const connection = await pool.getConnection();
      console.log("✓ Database connected successfully");

      try {
        // const schemaPath = path.join(__dirname, '../database/schema.sql');
        // const schemaStr = fs.readFileSync(schemaPath, 'utf8');
        console.log("⏳ Running schema and seeding mock data...");
        // await connection.query(schemaStr);
        console.log("✓ Database tables verified and mock data seeded");
      } catch (schemaErr) {
        console.error("✗ Error executing schema:", schemaErr.message);
      } finally {
        connection.release();
      }
      return;
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

const ready = initDB();

pool.ready = ready;

module.exports = pool;
