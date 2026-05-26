import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'whisperwall.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeSchema();
  }
});

// Helper functions wrapped in Promises
export const query = {
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

function initializeSchema() {
  db.serialize(() => {
    // 1. Rooms Table
    db.run(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    // Create Index on room code for fast lookup
    db.run(`CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code)`);

    // 2. Members Table
    db.run(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        name TEXT NOT NULL,
        label TEXT,
        device_id TEXT NOT NULL,
        joined_at TEXT NOT NULL,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      )
    `);

    // 3. Wallpapers Table
    db.run(`
      CREATE TABLE IF NOT EXISTS wallpapers (
        id TEXT PRIMARY KEY,
        room_id TEXT UNIQUE NOT NULL,
        image_url TEXT,
        message TEXT,
        font TEXT,
        color TEXT,
        position TEXT,
        set_by TEXT,
        set_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      )
    `);
    
    console.log('Database schema checked/initialized successfully.');
  });
}

export default db;
