import mysql from "mysql2/promise";
import { env } from "./env.js";

export const db = mysql.createPool({
  uri: env.mysqlUrl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function testDbConnection() {
  const conn = await db.getConnection();
  try {
    await conn.query("SELECT 1");
    console.log("✅ MySQL connected");
  } finally {
    conn.release();
  }
}
