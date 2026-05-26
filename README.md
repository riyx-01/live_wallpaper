# 💌 WhisperWall

**A shared live wallpaper experience for couples and families.**

Whatever you type appears on their wallpaper in real time. Like a note left on the fridge, but sweeter.

---

## ✨ Features

- **Real-time Sync** — Messages, fonts, colors, and wallpaper images sync instantly via Socket.io
- **Couple & Family Modes** — Pair 1-on-1 or create a family room for up to 5 members
- **Curated Gallery** — 50 handpicked romantic/aesthetic wallpaper images
- **Custom Uploads** — Upload up to 10 personal photos per room
- **Message Composer** — 4 font styles, 6 color swatches, 3 text positions
- **Auto-Expiry** — Messages persist for exactly 2.5 hours, then auto-clear
- **Instant Wipe** — Clear the wallpaper note for everyone with one tap
- **PWA Installable** — Add to homescreen for a full-bleed widget experience
- **Offline Support** — Service worker caches the last wallpaper state
- **Haptic & Notifications** — Vibration feedback + Web Notifications on new messages
- **Bubble Hearts** — Floating heart particle animations on message arrival

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite 5, Tailwind CSS 3   |
| Backend    | Node.js, Express 4                  |
| Realtime   | Socket.io 4                         |
| Database   | SQLite 3 (local) / PostgreSQL-ready |
| Storage    | Local filesystem (server/uploads/)  |
| PWA        | Web App Manifest + Service Worker   |
| Icons      | Lucide React                        |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ and **npm** v9+

### 1. Install all dependencies

```bash
cd live_wallpaper
npm run install-all
```

This runs `npm install` in the root, `server/`, and `client/` directories.

### 2. Start the development servers

```bash
npm run dev
```

This starts **both** servers concurrently:
- **Backend** → `http://localhost:5000` (Express + Socket.io)
- **Frontend** → `http://localhost:5173` (Vite dev server, proxies API calls to backend)

### 3. Open the app

Open **http://localhost:5173** in your browser.

---

## 📱 How to Use

1. **Open the app** on two separate browser tabs (or two devices on the same network)
2. **Choose a mode** — "For Couples" or "For Families"
3. **Create a room** — Enter your name, get a 6-character pairing code
4. **Share the code** — Copy or share via WhatsApp/text to your partner
5. **Partner joins** — They enter the code on their device
6. **Compose** — Pick a wallpaper image, type a sweet message, choose font/color/position
7. **Set as Wallpaper** — Hit the button — it syncs instantly to the other device!
8. **Full-screen view** — Click "Fullscreen Wallpaper" button to see the full-bleed canvas

---

## 📂 Project Structure

```
live_wallpaper/
├── package.json              # Root scripts (concurrently runs both servers)
├── schema.sql                # Database migration/schema file
├── README.md
│
├── server/
│   ├── package.json          # Server dependencies
│   ├── server.js             # Express + Socket.io server
│   ├── database.js           # SQLite wrapper with schema init
│   ├── uploads/              # User-uploaded images (gitignored)
│   └── whisperwall.db        # SQLite database file (auto-created)
│
└── client/
    ├── package.json          # Frontend dependencies
    ├── vite.config.js        # Vite config with API proxy
    ├── tailwind.config.js    # Custom theme colors, fonts, animations
    ├── postcss.config.js
    ├── index.html            # Entry HTML with Google Fonts + PWA meta
    │
    ├── public/
    │   ├── manifest.json     # PWA Web App Manifest
    │   ├── sw.js             # Service Worker
    │   └── icons/
    │       └── icon.svg      # App icon (vector)
    │
    └── src/
        ├── main.jsx          # React entry + SW registration
        ├── App.jsx           # Root component, state, socket, routing
        ├── index.css         # Tailwind + glassmorphism styles
        │
        └── components/
            ├── CloudyBackground.jsx   # Animated cloud layers
            ├── BubbleHearts.jsx       # Floating heart particles
            ├── LandingPage.jsx        # Welcome screen + CTAs
            ├── Onboarding.jsx         # Room creation & code pairing
            ├── WallpaperStudio.jsx    # Image gallery + composer
            └── WallpaperCanvas.jsx    # Full-bleed PWA wallpaper view
```

---

## 🗃️ Database Schema

| Table        | Description                                    |
|-------------|------------------------------------------------|
| `rooms`      | Stores room ID, unique code, type, created_at |
| `members`    | Users linked to a room by device ID           |
| `wallpapers` | Active wallpaper per room (one per room)       |

See [schema.sql](./schema.sql) for the full migration script.

---

## 🔧 Configuration

| Variable | Default | Description                |
|----------|---------|----------------------------|
| `PORT`   | `5000`  | Backend server port        |

Set environment variables in a `.env` file in the `server/` directory if needed.

---

## 🌐 Production Build

```bash
# Build the frontend
cd client
npm run build

# The built assets go to client/dist/
# The Express server automatically serves them in production
cd ..
npm start
```

---

## 📄 License

MIT — Built with 💕
