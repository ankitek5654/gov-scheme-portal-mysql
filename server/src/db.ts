import mysql from "mysql2/promise";

let pool: mysql.Pool;

export function getPool(): mysql.Pool {
  if (pool) return pool;
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "gov_scheme_portal",
    waitForConnections: true,
    connectionLimit: 10,
  });
  return pool;
}

export async function initDb(): Promise<mysql.Pool> {
  const p = getPool();
  // Test connection
  const conn = await p.getConnection();
  console.log("[DB] MySQL connected");
  conn.release();
  return p;
}
