import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = process.env.VERCEL;
const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = Boolean(isVercel && redisUrl && redisToken);
const dbPath = isVercel ? '/tmp/whisperwall.db' : path.join(__dirname, 'whisperwall.db');

let db = null;

if (useRedis) {
  console.log('Using Vercel/Upstash Redis for persistent WhisperWall state.');
} else {
  if (isVercel) {
    console.warn('Redis env vars missing. Falling back to ephemeral SQLite at /tmp/whisperwall.db.');
  }

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
    } else {
      console.log('Connected to SQLite database at:', dbPath);
      initializeSchema();
    }
  });
}

const redisCommand = async (...command) => {
  const response = await fetch(redisUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Redis command failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Redis command failed: ${data.error}`);
  }

  return data.result;
};

const parseJson = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const roomKey = (roomId) => `ww:room:${roomId}`;
const roomCodeKey = (code) => `ww:room-code:${code}`;
const roomMembersKey = (roomId) => `ww:room:${roomId}:members`;
const memberKey = (memberId) => `ww:member:${memberId}`;
const wallpaperKey = (roomId) => `ww:wallpaper:${roomId}`;

export const store = useRedis
  ? {
      engine: 'redis',

      async getRoomByCode(code) {
        const roomId = await redisCommand('GET', roomCodeKey(code));
        if (!roomId) return null;
        return parseJson(await redisCommand('GET', roomKey(roomId)));
      },

      async createRoom(room) {
        await redisCommand('SET', roomKey(room.id), JSON.stringify(room));
        await redisCommand('SET', roomCodeKey(room.code), room.id);
        await redisCommand('EXPIRE', roomKey(room.id), 60 * 60 * 24 * 31);
        await redisCommand('EXPIRE', roomCodeKey(room.code), 60 * 60 * 24 * 31);
      },

      async getMembers(roomId) {
        const ids = await redisCommand('SMEMBERS', roomMembersKey(roomId));
        if (!Array.isArray(ids) || ids.length === 0) return [];
        const members = await Promise.all(ids.map(async (id) => parseJson(await redisCommand('GET', memberKey(id)))));
        return members.filter(Boolean).sort((a, b) => a.joined_at.localeCompare(b.joined_at));
      },

      async saveMember(member) {
        await redisCommand('SET', memberKey(member.id), JSON.stringify(member));
        await redisCommand('SADD', roomMembersKey(member.room_id), member.id);
        await redisCommand('EXPIRE', memberKey(member.id), 60 * 60 * 24 * 31);
        await redisCommand('EXPIRE', roomMembersKey(member.room_id), 60 * 60 * 24 * 31);
      },

      async updateMember(memberId, updates) {
        const current = parseJson(await redisCommand('GET', memberKey(memberId)));
        if (!current) return null;
        const updated = { ...current, ...updates };
        await redisCommand('SET', memberKey(memberId), JSON.stringify(updated));
        await redisCommand('EXPIRE', memberKey(memberId), 60 * 60 * 24 * 31);
        return updated;
      },

      async getWallpaper(roomId) {
        return parseJson(await redisCommand('GET', wallpaperKey(roomId)));
      },

      async setWallpaper(roomId, wallpaper) {
        const ttlSeconds = Math.max(1, Math.floor((new Date(wallpaper.expires_at).getTime() - Date.now()) / 1000));
        await redisCommand('SET', wallpaperKey(roomId), JSON.stringify(wallpaper), 'EX', ttlSeconds);
      },

      async deleteWallpaper(roomId) {
        await redisCommand('DEL', wallpaperKey(roomId));
      },

      async getExpiredWallpaperRoomIds() {
        return [];
      },

      async cleanupInactiveRooms() {
        return { changes: 0 };
      }
    }
  : {
      engine: 'sqlite',

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

export const query = {
  run(sql, params = []) {
    if (!db) {
      return Promise.reject(new Error('SQLite query called while Redis storage is active.'));
    }

    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },

  get(sql, params = []) {
    if (!db) {
      return Promise.reject(new Error('SQLite query called while Redis storage is active.'));
    }

    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  all(sql, params = []) {
    if (!db) {
      return Promise.reject(new Error('SQLite query called while Redis storage is active.'));
    }

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
    db.run(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code)`);

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

    console.log('Database schema checked/initialized successfully.');
  });
}

export default db;
