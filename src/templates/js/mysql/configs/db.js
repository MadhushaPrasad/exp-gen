import mysql from "mysql2/promise";
import config from "../configs/config.js";

let pool;

export const connectDB = async () => {
  try {
    pool = mysql.createPool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: config.db.connectionLimit || 10,
      queueLimit: 0,
    });

    // Simple test query
    const [rows] = await pool.query("SELECT 1 + 1 AS solution");
    console.log("The solution is:", rows[0].solution);

    console.log(`✅ MysqlDB Connected: ${config.db.host}`);
  } catch (error) {
    console.error("❌ MysqlDB connection error:", error.message);
    process.exit(1);
  }
};

export const getPool = () => {
  if (!pool) {
    throw new Error("Pool not initialized. Call connectDB() first.");
  }
  return pool;
};

export const query = async (sql, params) => {
  const p = getPool();
  const [rows] = await p.query(sql, params);
  return rows;
};
