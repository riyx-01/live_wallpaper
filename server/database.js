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
    console.log('Connected to local SQLite database at:', dbPath);
    initializeSchema();
  }
});

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

export const store = {
  engine: 'sqlite-local',

  async getRoomByCode(code) {
    return query.get('SELECT * FROM rooms WHERE code = ?', [code]);
  },

  async createRoom(room) {
    await query.run(
      'INSERT INTO rooms (id, code, type, created_at) VALUES (?, ?, ?, ?)',
      [room.id, room.code, room.type, room.created_at]
    );
  },

  async getMembers(roomId) {
    return query.all('SELECT * FROM members WHERE room_id = ?', [roomId]);
  },

  async saveMember(member) {
    await query.run(
      'INSERT INTO members (id, room_id, name, label, device_id, joined_at) VALUES (?, ?, ?, ?, ?, ?)',
      [member.id, member.room_id, member.name, member.label || '', member.device_id, member.joined_at]
    );
  },

  async updateMember(memberId, updates) {
    await query.run('UPDATE members SET name = ?, label = ? WHERE id = ?', [updates.name, updates.label || '', memberId]);
    return null;
  },

  async getWallpaper(roomId) {
    return query.get('SELECT * FROM wallpapers WHERE room_id = ?', [roomId]);
  },

  async setWallpaper(roomId, wallpaper) {
    await query.run(`
      INSERT OR REPLACE INTO wallpapers (id, room_id, image_url, message, font, color, position, set_by, set_at, expires_at, scribbles)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      wallpaper.id,
      roomId,
      wallpaper.image_url || '',
      wallpaper.message || '',
      wallpaper.font || 'Serif',
      wallpaper.color || '#FFFFFF',
      wallpaper.position || 'Center',
      wallpaper.set_by || 'Someone',
      wallpaper.set_at,
      wallpaper.expires_at,
      wallpaper.scribbles || ''
    ]);
  },

  async deleteWallpaper(roomId) {
    await query.run('DELETE FROM wallpapers WHERE room_id = ?', [roomId]);
  },

  async getExpiredWallpaperRoomIds(nowStr) {
    const rows = await query.all('SELECT room_id FROM wallpapers WHERE expires_at < ?', [nowStr]);
    return rows.map(row => row.room_id);
  },

  async cleanupInactiveRooms(thirtyDaysAgo) {
    return query.run(`
      DELETE FROM rooms
      WHERE created_at < ?
      AND id NOT IN (SELECT room_id FROM wallpapers)
    `, [thirtyDaysAgo]);
  }
};

function initializeSchema() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    db.run('CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code)');

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
        scribbles TEXT,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      )
    `);

    db.run('ALTER TABLE wallpapers ADD COLUMN scribbles TEXT', () => {});

    console.log('Local database schema checked/initialized successfully.');
  });
}

export default db;
