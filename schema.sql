-- WhisperWall Database Schema
-- Compatible with SQLite (local dev) and PostgreSQL (production / Supabase)
-- Created: 2026

-- ==========================================
-- TABLE: rooms
-- Stores shared wallpaper rooms
-- ==========================================
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('couple', 'family')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);

-- ==========================================
-- TABLE: members
-- Stores users who have joined a room
-- ==========================================
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  name TEXT NOT NULL,
  label TEXT,
  device_id TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_members_room_id ON members(room_id);
CREATE INDEX IF NOT EXISTS idx_members_device_id ON members(device_id);

-- ==========================================
-- TABLE: wallpapers
-- Stores the currently active wallpaper per room
-- Only one active wallpaper per room (room_id is UNIQUE)
-- ==========================================
CREATE TABLE IF NOT EXISTS wallpapers (
  id TEXT PRIMARY KEY,
  room_id TEXT UNIQUE NOT NULL,
  image_url TEXT,
  message TEXT,
  font TEXT DEFAULT 'Serif',
  color TEXT DEFAULT '#FFFFFF',
  position TEXT DEFAULT 'Center',
  set_by TEXT,
  set_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wallpapers_room_id ON wallpapers(room_id);
CREATE INDEX IF NOT EXISTS idx_wallpapers_expires_at ON wallpapers(expires_at);

-- ==========================================
-- PostgreSQL adaptation notes (for Supabase):
-- 1. Replace TEXT PRIMARY KEY with UUID DEFAULT gen_random_uuid()
-- 2. Replace TEXT NOT NULL for timestamps with TIMESTAMPTZ DEFAULT now()
-- 3. Add RLS policies per your auth strategy
-- ==========================================
