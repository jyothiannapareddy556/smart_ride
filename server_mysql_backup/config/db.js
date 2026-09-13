/*const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "rideback",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err.message);
  } else {
    console.log("✅ Connected to MySQL Database (rideback) successfully!");
    connection.release();
  }
});

module.exports = db;*/
const mysql = require("mysql2");

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "rideback",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test MySQL connection
db.getConnection((err, connection) => {
    if (err) {
        console.error(
            "❌ MySQL connection failed:",
            err.message
        );
    } else {
        console.log(
            "✅ Connected to MySQL Database (rideback) successfully!"
        );

        connection.release();
    }
});

// IMPORTANT:
// Convert the pool into a Promise-compatible pool
// so controllers can use:
// await db.query(...)
const promiseDb = db.promise();

module.exports = promiseDb;