import pg from "pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Initialize PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Initializes the database tables if they do not already exist.
 */
export async function initDb() {
  const query = `
    CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  try {
    await pool.query(query);
    console.log("Database initialized: 'rooms' table is ready.");
  } catch (err) {
    console.error("Failed to initialize database table:", err.message);
    throw err;
  }
}

/**
 * Creates a new room with a hashed password.
 * @param {string} name
 * @param {string} plainPassword
 * @returns {Promise<{id: number, name: string, created_at: Date}>}
 */
export async function createRoom(name, plainPassword) {
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

  const query = `
    INSERT INTO rooms (name, password_hash)
    VALUES ($1, $2)
    RETURNING id, name, created_at;
  `;
  const values = [name.trim(), passwordHash];
  const res = await pool.query(query, values);
  return res.rows[0];
}

/**
 * Finds a room by name (case-insensitive).
 * @param {string} name
 * @returns {Promise<{id: number, name: string, password_hash: string, created_at: Date} | null>}
 */
export async function findRoom(name) {
  const query = `
    SELECT id, name, password_hash, created_at
    FROM rooms
    WHERE LOWER(name) = LOWER($1)
    LIMIT 1;
  `;
  const res = await pool.query(query, [name.trim()]);
  return res.rows[0] || null;
}

/**
 * Verifies a plain password against the stored bcrypt hash.
 * @param {string} plainPassword
 * @param {string} passwordHash
 * @returns {Promise<boolean>}
 */
export async function verifyRoomPassword(plainPassword, passwordHash) {
  return await bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Lists all available room names.
 * @returns {Promise<string[]>}
 */
export async function listRooms() {
  const query = `
    SELECT name
    FROM rooms
    ORDER BY created_at DESC;
  `;
  const res = await pool.query(query);
  return res.rows.map((row) => row.name);
}
