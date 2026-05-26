import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import CloudyBackground from './components/CloudyBackground.jsx';
import LandingPage from './components/LandingPage.jsx';
import Onboarding from './components/Onboarding.jsx';
import WallpaperStudio from './components/WallpaperStudio.jsx';
import WallpaperCanvas from './components/WallpaperCanvas.jsx';
import BubbleHearts from './components/BubbleHearts.jsx';

const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const App = () => {
  const [view, setView] = useState('landing'); // 'landing' | 'onboarding' | 'studio' | 'wallpaper'
  const [roomType, setRoomType] = useState('couple');
  const [loading, setLoading] = useState(false);
  const [roomState, setRoomState] = useState({
    room: null,
    member: null,
    members: [],
    activeWallpaper: null
  });

  const socketRef = useRef(null);

  // Parse path for PWA standalone route support
  useEffect(() => {
    const path = window.location.pathname;
    const savedRoom = localStorage.getItem('ww_room');
    const savedMember = localStorage.getItem('ww_member');

    if (savedRoom && savedMember) {
      const room = JSON.parse(savedRoom);
      const member = JSON.parse(savedMember);
      
      // Auto reconnect
      reconnectToRoom(room, member, path === '/wallpaper' ? 'wallpaper' : 'studio');
    } else if (path === '/wallpaper') {
      // If /wallpaper is accessed but not logged in, go to landing with instructions
      setView('landing');
    }
  }, []);

  // Sync with Socket.io server on room pair/load
  const connectSocket = (roomId) => {
    // In production, Vite proxies /socket.io, or we connect to the same origin
    const socketUrl = window.location.origin;
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to realtime sync server');
      socket.emit('join_room', roomId);
    });

    socket.on('wallpaper_update', (wallpaper) => {
      setRoomState(prev => ({ ...prev, activeWallpaper: wallpaper }));
    });

    socket.on('wallpaper_wipe', () => {
      setRoomState(prev => ({ ...prev, activeWallpaper: null }));
    });

    socket.on('members_update', (membersList) => {
      setRoomState(prev => ({ ...prev, members: membersList }));
    });

    socket.on('disconnect', () => {
      console.log('Realtime sync server disconnected');
    });
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const reconnectToRoom = async (room, member, targetView = 'studio') => {
    setLoading(true);
    try {
      // Fetch latest wallpaper and members
      const wallpaperRes = await fetch(`/api/rooms/${room.id}/wallpaper`);
      const wallpaperData = await wallpaperRes.json();

      // Retrieve all members in room
      const membersRes = await fetch(`/api/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: room.code,
          name: member.name,
          label: member.label,
          device_id: member.device_id
        })
      });
      
      if (!membersRes.ok) {
        throw new Error('Failed to rejoin room');
      }

      const joinData = await membersRes.json();

      setRoomState({
        room: joinData.room,
        member: joinData.member,
        members: joinData.members,
        activeWallpaper: wallpaperData.wallpaper
      });

      connectSocket(room.id);
      setView(targetView);
    } catch (e) {
      console.error('Reconnection failed:', e);
      // Clear invalid credentials
      localStorage.removeItem('ww_room');
      localStorage.removeItem('ww_member');
      setView('landing');
    } finally {
      setLoading(false);
    }
  };

  // 1. Create Room Flow
  const handleCreateRoom = async ({ name, label, type }) => {
    setLoading(true);
    try {
      // Create room record
      const roomRes = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const roomData = await roomRes.json();

      // Join room as creator
      // Generate device ID
      let deviceId = localStorage.getItem('ww_device_id');
      if (!deviceId) {
        deviceId = generateUUID();
        localStorage.setItem('ww_device_id', deviceId);
      }

      const joinRes = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: roomData.code,
          name,
          label,
          device_id: deviceId
        })
      });
      const joinData = await joinRes.json();

      // Save credentials
      localStorage.setItem('ww_room', JSON.stringify(joinData.room));
      localStorage.setItem('ww_member', JSON.stringify(joinData.member));

      setRoomState({
        room: joinData.room,
        member: joinData.member,
        members: joinData.members,
        activeWallpaper: null
      });

      connectSocket(joinData.room.id);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create wallpaper room');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 2. Join Room Flow
  const handleJoinRoom = async ({ code, name, label }) => {
    setLoading(true);
    try {
      let deviceId = localStorage.getItem('ww_device_id');
      if (!deviceId) {
        deviceId = generateUUID();
        localStorage.setItem('ww_device_id', deviceId);
      }

      const joinRes = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          name,
          label,
          device_id: deviceId
        })
      });

      if (!joinRes.ok) {
        const err = await joinRes.json();
        throw new Error(err.error || 'Failed to join room');
      }

      const joinData = await joinRes.json();

      // Fetch active wallpaper state
      const wpRes = await fetch(`/api/rooms/${joinData.room.id}/wallpaper`);
      const wpData = await wpRes.json();

      localStorage.setItem('ww_room', JSON.stringify(joinData.room));
      localStorage.setItem('ww_member', JSON.stringify(joinData.member));

      setRoomState({
        room: joinData.room,
        member: joinData.member,
        members: joinData.members,
        activeWallpaper: wpData.wallpaper
      });

      connectSocket(joinData.room.id);
      setView('studio');
      return joinData;
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 3. Set Wallpaper Flow
  const handleSetWallpaper = async (payload) => {
    try {
      const response = await fetch(`/api/rooms/${roomState.room.id}/wallpaper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      setRoomState(prev => ({ ...prev, activeWallpaper: data.wallpaper }));
      return data.wallpaper;
    } catch (error) {
      console.error('Error setting wallpaper:', error);
      throw error;
    }
  };

  // 4. Wipe Wallpaper Flow
  const handleWipeWallpaper = async () => {
    try {
      await fetch(`/api/rooms/${roomState.room.id}/wipe`, {
        method: 'POST'
      });
      setRoomState(prev => ({ ...prev, activeWallpaper: null }));
    } catch (error) {
      console.error('Error wiping wallpaper:', error);
      throw error;
    }
  };

  // 5. Leave Room Flow
  const handleLeaveRoom = () => {
    if (confirm('Are you sure you want to disconnect from this wallpaper room?')) {
      disconnectSocket();
      localStorage.removeItem('ww_room');
      localStorage.removeItem('ww_member');
      setRoomState({
        room: null,
        member: null,
        members: [],
        activeWallpaper: null
      });
      setView('landing');
    }
  };

  // Monitor membership to auto-transition creators to studio once partner joins
  useEffect(() => {
    // If we're on the onboarding create_code screen and we see another member join,
    // and it's a couple room, auto transition to studio!
    if (view === 'onboarding' && roomState.room && roomState.members.length >= 2) {
      setView('studio');
    }
  }, [roomState.members, view]);

  return (
    <div className="relative min-h-screen w-full flex flex-col font-ui text-[#6B3A4D]">
      {/* Background Graphic Layers */}
      {view !== 'wallpaper' && (
        <>
          <CloudyBackground />
          <BubbleHearts interactive={false} />
        </>
      )}

      {/* Primary Route Views */}
      <main className="relative flex-1 w-full flex flex-col items-center">
        {view === 'landing' && (
          <LandingPage
            onStart={(type) => {
              setRoomType(type);
              setView('onboarding');
            }}
          />
        )}

        {view === 'onboarding' && (
          <Onboarding
            initialType={roomType}
            onBack={() => setView('landing')}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            roomState={roomState}
            loading={loading}
          />
        )}

        {view === 'studio' && (
          <WallpaperStudio
            roomState={roomState}
            onSetWallpaper={handleSetWallpaper}
            onWipeWallpaper={handleWipeWallpaper}
            onLeaveRoom={handleLeaveRoom}
            onEnterWallpaperCanvas={() => setView('wallpaper')}
          />
        )}

        {view === 'wallpaper' && (
          <WallpaperCanvas
            roomState={roomState}
            onBackToStudio={() => setView('studio')}
          />
        )}
      </main>

      {/* Floating Canvas Quick View Nudge */}
      {view === 'studio' && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setView('wallpaper')}
            className="glass-button-primary px-5 py-3 rounded-full font-bold text-xs shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Smartphone className="w-4 h-4" /> Fullscreen Wallpaper
          </button>
        </div>
      )}
    </div>
  );
};

// Simple inline SVG helper for Smartphone (replaces lucide import to avoid compiler edge-cases)
const Smartphone = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

export default App;
