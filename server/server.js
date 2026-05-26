import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { query } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Allow CORS for development frontend on port 5173
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// Serve production frontend assets if they exist
const clientBuildDir = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientBuildDir)) {
  app.use(express.static(clientBuildDir));
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename preserving extension
    const ext = path.extname(file.originalname);
    const uniqueName = crypto.randomUUID() + ext;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpg, png, gif, webp) are allowed'));
    }
  }
});

// --- HELPER FUNCTIONS ---

// Generate a unique 6-character alphanumeric room code
async function generateUniqueRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid easily confused chars (I, O, 0, 1)
  let attempts = 0;
  while (attempts < 100) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await query.get('SELECT id FROM rooms WHERE code = ?', [code]);
    if (!existing) {
      return code;
    }
    attempts++;
  }
  throw new Error('Failed to generate unique room code');
}

// Helper to check and expire a wallpaper if its time is up
async function checkWallpaperExpiry(roomId) {
  const wallpaper = await query.get('SELECT * FROM wallpapers WHERE room_id = ?', [roomId]);
  if (!wallpaper) return null;

  const now = new Date();
  const expiresAt = new Date(wallpaper.expires_at);

  if (now > expiresAt) {
    // Expired! Delete wallpaper
    await query.run('DELETE FROM wallpapers WHERE room_id = ?', [roomId]);
    io.to(roomId).emit('wallpaper_wipe');
    return null;
  }
  return wallpaper;
}

// --- REST API ENDPOINTS ---

// Create Room
app.post('/api/rooms', async (req, res) => {
  try {
    const { type } = req.body; // 'couple' or 'family'
    if (!type || (type !== 'couple' && type !== 'family')) {
      return res.status(400).json({ error: 'Invalid room type' });
    }

    const roomId = crypto.randomUUID();
    const code = await generateUniqueRoomCode();
    const now = new Date().toISOString();

    await query.run(
      'INSERT INTO rooms (id, code, type, created_at) VALUES (?, ?, ?, ?)',
      [roomId, code, type, now]
    );

    res.status(201).json({ roomId, code, type });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join Room
app.post('/api/rooms/join', async (req, res) => {
  try {
    const { code, name, label, device_id } = req.body;
    if (!code || !name || !device_id) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const upperCode = code.trim().toUpperCase();
    const room = await query.get('SELECT * FROM rooms WHERE code = ?', [upperCode]);
    if (!room) {
      return res.status(404).json({ error: 'Room code not found' });
    }

    // Check member limits
    const members = await query.all('SELECT * FROM members WHERE room_id = ?', [room.id]);
    
    // Check if device is already registered in this room
    const existingMember = members.find(m => m.device_id === device_id);
    if (existingMember) {
      // Re-joining with existing device, update details
      await query.run(
        'UPDATE members SET name = ?, label = ? WHERE id = ?',
        [name, label || '', existingMember.id]
      );
      const updatedMembers = await query.all('SELECT * FROM members WHERE room_id = ?', [room.id]);
      io.to(room.id).emit('members_update', updatedMembers);
      return res.json({ room, member: { ...existingMember, name, label }, members: updatedMembers });
    }

    const maxMembers = room.type === 'couple' ? 2 : 5;
    if (members.length >= maxMembers) {
      return res.status(400).json({ error: `This ${room.type} room is full (${maxMembers} max members)` });
    }

    const memberId = crypto.randomUUID();
    const now = new Date().toISOString();

    await query.run(
      'INSERT INTO members (id, room_id, name, label, device_id, joined_at) VALUES (?, ?, ?, ?, ?, ?)',
      [memberId, room.id, name, label || '', device_id, now]
    );

    const newMember = { id: memberId, room_id: room.id, name, label, device_id, joined_at: now };
    const updatedMembers = [...members, newMember];

    io.to(room.id).emit('members_update', updatedMembers);

    res.json({ room, member: newMember, members: updatedMembers });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Current Wallpaper for Room
app.get('/api/rooms/:roomId/wallpaper', async (req, res) => {
  try {
    const { roomId } = req.params;
    const wallpaper = await checkWallpaperExpiry(roomId);
    res.json({ wallpaper });
  } catch (error) {
    console.error('Error getting wallpaper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set Wallpaper
app.post('/api/rooms/:roomId/wallpaper', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { image_url, message, font, color, position, set_by } = req.body;

    const now = new Date();
    // Message expires in exactly 2.5 hours (150 minutes)
    const expiresAt = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);

    const wallpaperId = crypto.randomUUID();
    const setAtStr = now.toISOString();
    const expiresAtStr = expiresAt.toISOString();

    // Use sqlite REPLACE INTO to upsert since room_id is unique
    await query.run(`
      INSERT OR REPLACE INTO wallpapers (id, room_id, image_url, message, font, color, position, set_by, set_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [wallpaperId, roomId, image_url || '', message || '', font || 'Serif', color || 'white', position || 'Center', set_by || 'Someone', setAtStr, expiresAtStr]);

    const updatedWallpaper = {
      id: wallpaperId,
      room_id: roomId,
      image_url,
      message,
      font,
      color,
      position,
      set_by,
      set_at: setAtStr,
      expires_at: expiresAtStr
    };

    // Sync via socket
    io.to(roomId).emit('wallpaper_update', updatedWallpaper);

    res.json({ wallpaper: updatedWallpaper });
  } catch (error) {
    console.error('Error setting wallpaper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Wipe Wallpaper
app.post('/api/rooms/:roomId/wipe', async (req, res) => {
  try {
    const { roomId } = req.params;
    await query.run('DELETE FROM wallpapers WHERE room_id = ?', [roomId]);

    // Notify all devices in room
    io.to(roomId).emit('wallpaper_wipe');

    res.json({ success: true });
  } catch (error) {
    console.error('Error wiping wallpaper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload User Image
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return relative URL that is served statically
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Fallback for PWA/SPA client routing in production
if (fs.existsSync(clientBuildDir)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildDir, 'index.html'));
  });
}

// --- SOCKET.IO REALTIME SYNC ---

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Client joining room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined Room ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// --- PERIODIC CLEANUPS ---

// Cleanup expired wallpapers every 5 minutes
setInterval(async () => {
  try {
    const nowStr = new Date().toISOString();
    const expiredWallpapers = await query.all('SELECT room_id FROM wallpapers WHERE expires_at < ?', [nowStr]);
    
    if (expiredWallpapers.length > 0) {
      console.log(`Found ${expiredWallpapers.length} expired wallpapers. Cleaning up...`);
      for (const wp of expiredWallpapers) {
        await query.run('DELETE FROM wallpapers WHERE room_id = ?', [wp.room_id]);
        io.to(wp.room_id).emit('wallpaper_wipe');
      }
    }
  } catch (error) {
    console.error('Error in periodic wallpaper cleanup:', error);
  }
}, 5 * 60 * 1000);

// Cleanup inactive rooms older than 30 days (based on created_at)
setInterval(async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    // Delete rooms created > 30 days ago that don't have active wallpapers (this counts as inactivity)
    const result = await query.run(`
      DELETE FROM rooms 
      WHERE created_at < ? 
      AND id NOT IN (SELECT room_id FROM wallpapers)
    `, [thirtyDaysAgo]);
    
    if (result.changes > 0) {
      console.log(`Cleaned up ${result.changes} inactive rooms.`);
    }
  } catch (error) {
    console.error('Error in periodic room cleanup:', error);
  }
}, 24 * 60 * 60 * 1000); // Once a day

// --- START SERVER ---

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`WhisperWall server running on port ${PORT}`);
});
