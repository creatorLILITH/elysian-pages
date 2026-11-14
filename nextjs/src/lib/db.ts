// SERVER ONLY — Postgres connection pool used by the legacy
// auth/books route handlers. Import it only from src/app/api/**.
import { Pool } from "pg";

const dbPort = process.env.DB_PORT;

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: dbPort ? Number(dbPort) : undefined,
  ssl: {
    rejectUnauthorized: false,
  },
});
