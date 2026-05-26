import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { store } from './database.js';

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
    const existing = await store.getRoomByCode(code);
    if (!existing) {
      return code;
    }
    attempts++;
  }
  throw new Error('Failed to generate unique room code');
}

// Helper to check and expire a wallpaper if its time is up
async function checkWallpaperExpiry(roomId) {
  const wallpaper = await store.getWallpaper(roomId);
  if (!wallpaper) return null;

  const now = new Date();
  const expiresAt = new Date(wallpaper.expires_at);

  if (now > expiresAt) {
    // Expired! Delete wallpaper
    await store.deleteWallpaper(roomId);
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

    await store.createRoom({ id: roomId, code, type, created_at: now });

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
    const room = await store.getRoomByCode(upperCode);
    if (!room) {
      return res.status(404).json({ error: 'Room code not found' });
    }

    // Check member limits
    const members = await store.getMembers(room.id);
    
    // Check if device is already registered in this room
    const existingMember = members.find(m => m.device_id === device_id);
    if (existingMember) {
      // Re-joining with existing device, update details
      const updatedMember = await store.updateMember(existingMember.id, { name, label: label || '' });
      const updatedMembers = await store.getMembers(room.id);
      io.to(room.id).emit('members_update', updatedMembers);
      return res.json({ room, member: updatedMember || { ...existingMember, name, label }, members: updatedMembers });
    }

    const maxMembers = room.type === 'couple' ? 2 : 5;
    if (members.length >= maxMembers) {
      return res.status(400).json({ error: `This ${room.type} room is full (${maxMembers} max members)` });
    }

    const memberId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newMember = { id: memberId, room_id: room.id, name, label, device_id, joined_at: now };
    await store.saveMember(newMember);
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

// Dynamic SVG image for lockscreen wallpapers (e.g. iOS Shortcuts)
app.get('/api/rooms/:roomId/wallpaper/image.svg', async (req, res) => {
  try {
    const { roomId } = req.params;
    const wallpaper = await checkWallpaperExpiry(roomId);
    
    // Default dimensions (suitable for phone lockscreens)
    const width = 1200;
    const height = 1920;
    
    let imageUrl = '';
    let message = 'Waiting for a note...';
    let fontClass = 'font-Serif';
    let color = '#E88FA0';
    let position = 'Center';
    let setBy = 'WhisperWall';
    
    if (wallpaper) {
      const rawImgUrl = wallpaper.image_url || '';
      imageUrl = rawImgUrl.startsWith('http') 
        ? rawImgUrl 
        : `${req.protocol}://${req.get('host')}${rawImgUrl}`;
      message = wallpaper.message || '';
      fontClass = `font-${wallpaper.font || 'Serif'}`;
      color = wallpaper.color || '#FFFFFF';
      position = wallpaper.position || 'Center';
      setBy = wallpaper.set_by ? `From ${wallpaper.set_by}` : 'WhisperWall';
    } else {
      // Soft default background if empty
      imageUrl = `https://images.unsplash.com/photo-1531265726475-52ad60219627?auto=format&fit=crop&w=1200&q=80`;
    }
    
    // Escape HTML text helper
    const escapeHtml = (str) => {
      if (!str) return '';
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    };
    
    // Split lines for SVG tspan rendering
    const lines = message.split('\n');
    let startY = 960; // Center
    if (position === 'Top') {
      startY = 350;
    } else if (position === 'Bottom') {
      startY = 1500;
    }
    
    // Adjust startY for multi-line vertical alignment centering
    if (position === 'Center') {
      const fontSizeEst = 64; // average font size
      const totalTextHeight = lines.length * fontSizeEst * 1.3;
      startY = (height / 2) - (totalTextHeight / 2) + (fontSizeEst / 2);
    }
    
    const tspans = lines.map((line, idx) => {
      return `<tspan x="600" ${idx === 0 ? `y="${startY}"` : 'dy="1.4em"'}>${escapeHtml(line)}</tspan>`;
    }).join('');

    // Render hand-drawn scribbles (if any)
    let scribblePaths = '';
    if (wallpaper && wallpaper.scribbles) {
      try {
        const strokes = JSON.parse(wallpaper.scribbles);
        if (Array.isArray(strokes)) {
          scribblePaths = strokes.map(stroke => {
            if (!stroke.points || stroke.points.length < 2) return '';
            const d = stroke.points.map((pt, i) => {
              // Convert from 0-1000 coordinate grid to SVG layout (1200x1920)
              const sx = (pt.x / 1000) * width;
              const sy = (pt.y / 1000) * height;
              return `${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
            }).join(' ');

            const strokeColor = stroke.color || '#FFFFFF';
            const strokeWidth = stroke.width || 4;

            return `<path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="shadow-effect" />`;
          }).join('\n');
        }
      } catch (err) {
        console.error('Failed to parse scribbles for SVG:', err);
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bottomGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="black" stop-opacity="0" />
          <stop offset="100%" stop-color="black" stop-opacity="0.45" />
        </linearGradient>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Inter:wght@400;700&family=Outfit:wght@600;800&family=Playfair+Display:ital,wght@0,600;1,600&display=swap');
          .font-Serif { font-family: 'Playfair Display', serif; font-size: 64px; }
          .font-Handwritten { font-family: 'Dancing Script', cursive; font-size: 84px; }
          .font-Sans { font-family: 'Inter', sans-serif; font-weight: bold; font-size: 60px; }
          .font-Bold { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 72px; }
          .shadow-effect {
            filter: drop-shadow(2px 4px 8px rgba(0, 0, 0, 0.45)) drop-shadow(0px 1px 3px rgba(0, 0, 0, 0.2));
          }
          .signature {
            font-family: 'Outfit', sans-serif;
            font-size: 24px;
            font-weight: 600;
            letter-spacing: 4px;
            fill: rgba(255, 255, 255, 0.7);
          }
        </style>
      </defs>
      
      <!-- Background Image -->
      <image href="${imageUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />
      
      <!-- Dark Vignette Overlay -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="black" opacity="0.25" />
      <rect x="0" y="${height - 200}" width="${width}" height="200" fill="url(#bottomGrad)" />

      <!-- Synced Scribbles Layer -->
      <g id="scribbles">
        ${scribblePaths}
      </g>

      <!-- Message Text -->
      <text class="${fontClass} shadow-effect" text-anchor="middle" fill="${color}">
        ${tspans}
      </text>
      
      <!-- Signature / From Info at bottom -->
      <text class="signature shadow-effect" x="600" y="${height - 80}" text-anchor="middle">
        ${escapeHtml(setBy).toUpperCase()}
      </text>
    </svg>`;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (error) {
    console.error('Error generating wallpaper image:', error);
    res.status(500).send('Internal server error');
  }
});

// Set Wallpaper
app.post('/api/rooms/:roomId/wallpaper', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { image_url, message, font, color, position, set_by, scribbles } = req.body;

    const now = new Date();
    // Message expires in exactly 2.5 hours (150 minutes)
    const expiresAt = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);

    const wallpaperId = crypto.randomUUID();
    const setAtStr = now.toISOString();
    const expiresAtStr = expiresAt.toISOString();

    const updatedWallpaper = {
      id: wallpaperId,
      room_id: roomId,
      image_url: image_url || '',
      message: message || '',
      font: font || 'Serif',
      color: color || '#FFFFFF',
      position: position || 'Center',
      set_by: set_by || 'Someone',
      set_at: setAtStr,
      expires_at: expiresAtStr,
      scribbles: scribbles || ''
    };

    await store.setWallpaper(roomId, updatedWallpaper);

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
    await store.deleteWallpaper(roomId);

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

  // Broadcast real-time drawing strokes to room members
  socket.on('draw_stroke', ({ roomId, stroke }) => {
    socket.to(roomId).emit('draw_stroke', stroke);
  });

  // Broadcast real-time typing sync (keystrokes)
  socket.on('typing_sync', ({ roomId, data }) => {
    socket.to(roomId).emit('typing_sync', data);
  });

  // Broadcast real-time canvas clear to room members
  socket.on('clear_scribbles', ({ roomId }) => {
    socket.to(roomId).emit('clear_scribbles');
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
    const expiredRoomIds = await store.getExpiredWallpaperRoomIds(nowStr);
    
    if (expiredRoomIds.length > 0) {
      console.log(`Found ${expiredRoomIds.length} expired wallpapers. Cleaning up...`);
      for (const roomId of expiredRoomIds) {
        await store.deleteWallpaper(roomId);
        io.to(roomId).emit('wallpaper_wipe');
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
    const result = await store.cleanupInactiveRooms(thirtyDaysAgo);
    
    if (result.changes > 0) {
      console.log(`Cleaned up ${result.changes} inactive rooms.`);
    }
  } catch (error) {
    console.error('Error in periodic room cleanup:', error);
  }
}, 24 * 60 * 60 * 1000); // Once a day

// --- START SERVER ---

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`WhisperWall server running on port ${PORT}`);
  });
}

export default app;
