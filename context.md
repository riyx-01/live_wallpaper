# WhisperWall - Project Context

> Hand-off notes for future development. Last updated: 2026-05-27.

## Project Overview

WhisperWall is a shared live wallpaper app for couples and families. Users create or join a room with a 6-character code, then sync a wallpaper-style screen containing:

- A local background image
- A shared text message
- Font, color, and position settings
- Hand-drawn scribbles

The app is deployed at `dearscreen.vercel.app` and also runs locally with an Express/Socket.io backend and Vite frontend.

## Tech Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend | React 18 + Vite 5 | SPA |
| Styling | TailwindCSS 3 + custom CSS | Glass UI, wallpaper overlays |
| Backend | Express 4 + Node.js | REST API, Socket.io locally |
| Local database | SQLite 3 | `server/whisperwall.db` |
| Production storage | Vercel/Upstash Redis REST | Used when Redis env vars exist |
| Realtime local | Socket.io 4 | Works locally and on serverful hosts |
| Realtime Vercel | REST autosave + polling | Vercel Functions do not host Socket.io reliably |
| Deployment | Vercel | Static client + `api/index.js` serverless function |

## Directory Map

```text
E:\live_wallpaper\
├── api/
│   └── index.js
├── client/
│   ├── index.html
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       └── components/
│           ├── BubbleHearts.jsx
│           ├── CloudyBackground.jsx
│           ├── LandingPage.jsx
│           ├── Onboarding.jsx
│           ├── WallpaperCanvas.jsx
│           └── WallpaperStudio.jsx
├── server/
│   ├── database.js
│   ├── server.js
│   ├── test_api.js
│   └── uploads/
├── context.md
├── dev.js
├── package.json
├── schema.sql
└── vercel.json
```

## Current Architecture

### Local Development

- `npm run dev` starts Express on port `5000` and Vite on port `5173`.
- Vite proxies `/api`, `/uploads`, and `/socket.io` to Express.
- Socket.io provides immediate room updates for wallpaper saves, typing, drawing, wipes, and members.
- SQLite stores rooms, members, and wallpapers.

### Vercel Production

Vercel Functions should not be used as a persistent Socket.io/WebSocket server. The app now uses this production path:

1. Client writes text/style/wallpaper changes through REST (`POST /api/rooms/:roomId/wallpaper`).
2. Server stores the room/wallpaper state in Redis when Vercel Redis/Upstash env vars are configured.
3. Other clients poll `GET /api/rooms/:roomId/wallpaper` every 1.5 seconds when the socket is disconnected.
4. This gives deployed users real shared sync without localhost.

Supported Redis env var pairs:

- `KV_REST_API_URL` + `KV_REST_API_TOKEN`
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`

If those are missing on Vercel, `server/database.js` falls back to `/tmp/whisperwall.db`, which is ephemeral and not suitable for real users.

## Data Model

SQLite schema is initialized in `server/database.js`. Redis stores equivalent JSON records.

### Rooms

| Column | Type | Notes |
| --- | --- | --- |
| id | TEXT PK | UUID |
| code | TEXT UNIQUE | 6-character join code |
| type | TEXT | `couple` or `family` |
| created_at | TEXT | ISO timestamp |

### Members

| Column | Type | Notes |
| --- | --- | --- |
| id | TEXT PK | UUID |
| room_id | TEXT | Room UUID |
| name | TEXT | Display name |
| label | TEXT | Optional label |
| device_id | TEXT | Browser identity |
| joined_at | TEXT | ISO timestamp |

### Wallpapers

| Column | Type | Notes |
| --- | --- | --- |
| id | TEXT PK | UUID, changes on save/autosave |
| room_id | TEXT UNIQUE | One active wallpaper per room |
| image_url | TEXT | Local background reference/SVG fallback |
| message | TEXT | Shared message |
| font | TEXT | `Serif`, `Handwritten`, `Sans`, `Bold` |
| color | TEXT | Hex color |
| position | TEXT | `Top`, `Center`, `Bottom` |
| set_by | TEXT | Member name |
| set_at | TEXT | ISO timestamp |
| expires_at | TEXT | Usually 2.5 hours after save |
| scribbles | TEXT | JSON array of normalized strokes |

## API Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/rooms` | Create room |
| POST | `/api/rooms/join` | Join/rejoin room |
| GET | `/api/rooms/:roomId/wallpaper` | Fetch active wallpaper |
| POST | `/api/rooms/:roomId/wallpaper` | Save/autosave wallpaper state |
| POST | `/api/rooms/:roomId/wipe` | Clear wallpaper |
| GET | `/api/rooms/:roomId/wallpaper/image.svg` | Dynamic SVG for OS integrations |
| POST | `/api/upload` | Upload image locally |

## Socket Events

Socket.io is still used locally and on any future serverful deployment.

| Event | Direction | Payload | Purpose |
| --- | --- | --- | --- |
| `join_room` | client -> server | `roomId` | Join socket room |
| `wallpaper_update` | server -> client | wallpaper | Saved wallpaper changed |
| `wallpaper_wipe` | server -> client | none | Wallpaper cleared |
| `members_update` | server -> client | members array | Room membership changed |
| `draw_stroke` | both | stroke | Sync drawing stroke |
| `clear_scribbles` | both | none | Clear drawing layer |
| `typing_sync` | both | text/style patch | Sync live typing/style edits |

## Recent Changes

### Production Sync

- Replaced direct SQL usage in `server/server.js` with a `store` abstraction from `server/database.js`.
- Added Redis storage implementation using Vercel/Upstash REST env vars.
- Redis keys:
  - `ww:room:${roomId}`
  - `ww:room-code:${code}`
  - `ww:room:${roomId}:members`
  - `ww:member:${memberId}`
  - `ww:wallpaper:${roomId}`
- Wallpaper Redis records use TTL based on `expires_at`.
- SQLite remains the local/default fallback.

### Text Sync Fixes

- `client/src/components/WallpaperStudio.jsx` now emits `typing_sync` from the textarea.
- `WallpaperStudio` listens for incoming `typing_sync` and updates message/font/color/position.
- `WallpaperStudio` debounces REST autosave for message/font/color/position, so Vercel clients sync through polling.
- `client/src/App.jsx` listens for `typing_sync` and merges patches into `activeWallpaper`.

### Fullscreen Editing

- `client/src/components/WallpaperCanvas.jsx` now accepts `onSetWallpaper`.
- Added an edit button in fullscreen mode.
- Added double-click/double-tap entry to editing.
- Added fullscreen textarea overlay with save/cancel controls.
- Fullscreen saves call the same REST wallpaper endpoint, so changes sync to other devices.

### Drawing Sync

- Drawing still syncs instantly by Socket.io when available.
- Completed strokes are now autosaved, so polling-only Vercel clients can receive drawings.
- Drawing coordinates use normalized `0..1000` space.

## Important Behavior

### Background Images Are Local

Background selection is stored in localStorage under `local_bg_${roomId}`. This means every device can choose a different personal background while sharing the same text/style/scribbles.

The `image_url` field is still saved for SVG fallback and for devices that do not have a local background.

### Polling Fallback

`App.jsx` polls every 1.5 seconds only when `socketConnected === false`. This is the expected production behavior on Vercel.

### Autosave

Typing in Studio now saves after a short debounce. Pressing "Set as Wallpaper" still explicitly saves and opens the install/instructions modal.

## Deployment Notes

To make real-user sync work on Vercel:

1. Add a Redis integration from Vercel Marketplace, or attach an Upstash Redis database.
2. Ensure one supported env var pair is present in the Vercel project:
   - `KV_REST_API_URL` + `KV_REST_API_TOKEN`
   - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
3. Redeploy.

No localhost is involved for deployed users. Devices communicate with the Vercel deployment URL, and shared state is stored in Redis.

## Known Limitations

- Vercel still does not provide a persistent Socket.io server for this Express app. Current production sync is polling-based, with roughly 1.5 seconds of delay.
- Uploaded files still use Multer/local disk. This is not durable on Vercel. Move uploads to Vercel Blob, Cloudinary, S3, or similar before relying on custom uploaded photos in production.
- `schema.sql` is reference documentation and may lag behind `server/database.js`; it should be updated to include `scribbles`.
- Socket listener cleanup currently removes event handlers by event name. If multiple components listen to the same socket event at once, consider switching to named handler cleanup.

## Development Commands

```bash
npm run install-all
npm run dev
npm run build
```

Ports:

| Service | Port |
| --- | --- |
| Express + Socket.io | 5000 |
| Vite | 5173 |

## Verification

Latest verification run:

```bash
npm run build
```

Result: successful Vite production build. NPM audit warnings remain in dependencies.
