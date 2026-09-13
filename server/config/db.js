require("dotenv").config();

const { Pool } = require("pg");
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "rideback",
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (error) => {
  console.error("❌ Unexpected PostgreSQL pool error:", error);
});

(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Connected to PostgreSQL Database (rideback) successfully!");
    client.release();
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error.message);
  }
})();

module.exports = pool;
