# WhisperWall - Local Realtime Context

Last updated: 2026-05-27.

## Current Direction

WhisperWall is now set up as a localhost/LAN-first realtime app. The main development target is:

- Express + Socket.io on `http://localhost:5000`
- Vite React app on `http://localhost:5173`
- SQLite local database at `server/whisperwall.db`
- Real-time sync through Socket.io
- REST endpoints used for persistence and fallback

The previous Vercel/Redis storage branch was removed from `server/database.js` so local realtime work is simpler and more predictable.

## How To Run

```bash
npm run dev
```

This starts:

| Service | URL |
| --- | --- |
| React/Vite app | `http://localhost:5173` |
| Express API + Socket.io | `http://localhost:5000` |

`dev.js` also prints LAN URLs like `http://192.168.x.x:5173`. Another device on the same Wi-Fi can open that URL and use the same local realtime server.

## Local Network Setup

Both local servers are arranged for LAN testing:

- `server/server.js` listens on `0.0.0.0:5000`
- `client/vite.config.js` uses `host: '0.0.0.0'`
- `dev.js` starts Vite with `--host 0.0.0.0`
- Vite proxies `/api`, `/uploads`, and `/socket.io` to `http://localhost:5000`

If another device cannot open the app, check Windows Firewall and allow Node.js/private-network access.

## Data Storage

`server/database.js` is SQLite-only now.

Tables:

- `rooms`
- `members`
- `wallpapers`

The `wallpapers` table includes `scribbles TEXT` for synced drawing strokes.

## API Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/rooms` | Create a room |
| POST | `/api/rooms/join` | Join/rejoin a room |
| GET | `/api/rooms/:roomId/wallpaper` | Fetch active wallpaper |
| POST | `/api/rooms/:roomId/wallpaper` | Save/autosave wallpaper |
| POST | `/api/rooms/:roomId/wipe` | Clear wallpaper |
| GET | `/api/rooms/:roomId/wallpaper/image.svg` | Dynamic SVG output |
| POST | `/api/upload` | Local file upload |

## Socket Events

| Event | Direction | Purpose |
| --- | --- | --- |
| `join_room` | client -> server | Join room channel |
| `wallpaper_update` | server -> client | Broadcast saved wallpaper |
| `wallpaper_wipe` | server -> client | Broadcast clear |
| `members_update` | server -> client | Broadcast room members |
| `draw_stroke` | both | Sync completed drawing stroke |
| `clear_scribbles` | both | Clear drawing layer |
| `typing_sync` | both | Live text/style updates |

## Recent Fixes

- Text sync is wired from the Studio textarea through `typing_sync`.
- Studio listens for incoming `typing_sync` updates.
- Fullscreen canvas has a text editor with edit/save/cancel controls.
- Fullscreen edits save through the same wallpaper endpoint.
- `client/src/App.jsx` now uses `apiJson()` so plain-text server errors do not cause `Unexpected token ... is not valid JSON`.
- Local database/storage is simplified back to SQLite.
- Local dev server is LAN-accessible for testing with another real device.

## Verification

Latest checks:

```bash
npm run build
Invoke-RestMethod -Uri http://localhost:5000/api/rooms -Method Post -ContentType 'application/json' -Body '{"type":"couple"}'
Invoke-WebRequest -Uri http://localhost:5173 -UseBasicParsing
node -e "connect to Socket.io"
```

Results:

- Production build passed.
- `POST /api/rooms` returned valid JSON.
- Vite returned HTTP 200.
- Socket.io connected successfully.

## Notes

- This setup is for local/LAN realtime use, not Vercel-hosted realtime.
- For real internet production realtime later, use a serverful host such as Railway/Render/Fly for Socket.io, or add a managed realtime service.
- Uploaded images are stored under `server/uploads` locally.
