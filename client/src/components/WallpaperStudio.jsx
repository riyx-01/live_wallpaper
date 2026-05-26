import React, { useState, useEffect, useRef } from 'react';
import { Heart, Upload, Trash2, Check, HelpCircle, Loader2, Sparkles, Smartphone, LogOut } from 'lucide-react';

// Swatches matching the tailwind theme and custom colors
const TEXT_COLORS = [
  { name: 'White', value: '#FFFFFF', class: 'bg-white border-gray-200' },
  { name: 'Cream', value: '#FDF0DC', class: 'bg-[#FDF0DC] border-amber-100' },
  { name: 'Soft Pink', value: '#FFB7C5', class: 'bg-[#FFB7C5] border-pink-200' },
  { name: 'Gold', value: '#D4A96A', class: 'bg-[#D4A96A] border-amber-600/30' },
  { name: 'Deep Rose', value: '#6B3A4D', class: 'bg-[#6B3A4D] border-rose-900/30' },
  { name: 'Black', value: '#1A1A1A', class: 'bg-black border-gray-900' }
];

const FONTS = [
  { id: 'Serif', name: 'Elegant Serif', family: 'font-wallpaperSerif' },
  { id: 'Handwritten', name: 'Dancing Script', family: 'font-wallpaperHandwritten' },
  { id: 'Sans', name: 'Modern Sans', family: 'font-wallpaperSans' },
  { id: 'Bold', name: 'Outfit Bold', family: 'font-wallpaperBold' }
];

const POSITIONS = [
  { id: 'Top', name: 'Top', class: 'justify-start pt-16' },
  { id: 'Center', name: 'Center', class: 'justify-center' },
  { id: 'Bottom', name: 'Bottom', class: 'justify-end pb-16' }
];

// Helper list of Unsplash IDs of aesthetic, romantic, and cozy images (50 total)
const CURATED_IMAGES = [
  // Cloudy & Pink (Theme 1)
  { id: 'cloud-1', label: 'Cotton Candy Sky', url: 'https://images.unsplash.com/photo-1531265726475-52ad60219627?auto=format&fit=crop&w=600&q=80', theme: 'Cloudy' },
  { id: 'cloud-2', label: 'Pink Horizon', url: 'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=600&q=80', theme: 'Cloudy' },
  { id: 'cloud-3', label: 'Sunset Cloudscape', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', theme: 'Cloudy' },
  { id: 'cloud-4', label: 'Dreamy Vibe', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80', theme: 'Cloudy' },
  { id: 'cloud-5', label: 'Pastel Sunrise', url: 'https://images.unsplash.com/photo-1529429617329-84d1004b5748?auto=format&fit=crop&w=600&q=80', theme: 'Cloudy' },
  { id: 'cloud-6', label: 'Soft Evening', url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e968ab?auto=format&fit=crop&w=600&q=80', theme: 'Cloudy' },
  { id: 'cloud-7', label: 'Whisper Clouds', url: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=600&q=80', theme: 'Cloudy' },
  { id: 'cloud-8', label: 'Lilac Skies', url: 'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?auto=format&fit=crop&w=600&q=80', theme: 'Cloudy' },
  { id: 'cloud-9', label: 'Rose Gold Glow', url: 'https://images.unsplash.com/photo-1483702721041-58c7353457e4?auto=format&fit=crop&w=600&q=80', theme: 'Cloudy' },
  { id: 'cloud-10', label: 'Heavenly Peach', url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&q=80', theme: 'Cloudy' },

  // Cozy & Romance (Theme 2)
  { id: 'cozy-1', label: 'Holding Hands', url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80', theme: 'Cozy' },
  { id: 'cozy-2', label: 'Warm Fireplace', url: 'https://images.unsplash.com/photo-1545048702-79362596cdc9?auto=format&fit=crop&w=600&q=80', theme: 'Cozy' },
  { id: 'cozy-3', label: 'Shared Coffee', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80', theme: 'Cozy' },
  { id: 'cozy-4', label: 'Fairy Lights', url: 'https://images.unsplash.com/photo-1511225010778-1f55bacb823b?auto=format&fit=crop&w=600&q=80', theme: 'Cozy' },
  { id: 'cozy-5', label: 'Interlaced Fingers', url: 'https://images.unsplash.com/photo-1494515426402-f1980ac7a41d?auto=format&fit=crop&w=600&q=80', theme: 'Cozy' },
  { id: 'cozy-6', label: 'Cozy Picnic', url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80', theme: 'Cozy' },
  { id: 'cozy-7', label: 'Cottage Window', url: 'https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?auto=format&fit=crop&w=600&q=80', theme: 'Cozy' },
  { id: 'cozy-8', label: 'Book & Tea', url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80', theme: 'Cozy' },
  { id: 'cozy-9', label: 'Blanket Snuggle', url: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=600&q=80', theme: 'Cozy' },
  { id: 'cozy-10', label: 'Vinyl Records', url: 'https://images.unsplash.com/photo-1539628399283-a66922573242?auto=format&fit=crop&w=600&q=80', theme: 'Cozy' },

  // Nature & Flowers (Theme 3)
  { id: 'nat-1', label: 'Pink Roses', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80', theme: 'Nature' },
  { id: 'nat-2', label: 'Cherry Blossoms', url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=600&q=80', theme: 'Nature' },
  { id: 'nat-3', label: 'Wild Lavender', url: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=600&q=80', theme: 'Nature' },
  { id: 'nat-4', label: 'Misty Mountains', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80', theme: 'Nature' },
  { id: 'nat-5', label: 'Dappled Sunlight', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80', theme: 'Nature' },
  { id: 'nat-6', label: 'Tulip Field', url: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=600&q=80', theme: 'Nature' },
  { id: 'nat-7', label: 'Golden Field', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80', theme: 'Nature' },
  { id: 'nat-8', label: 'Eucalyptus Leaves', url: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=600&q=80', theme: 'Nature' },
  { id: 'nat-9', label: 'Pampas Grass', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', theme: 'Nature' },
  { id: 'nat-10', label: 'Ocean Waves', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=600&q=80', theme: 'Nature' },

  // Minimalist & Pastel (Theme 4)
  { id: 'min-1', label: 'Abstract Pastel Art', url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=600&q=80', theme: 'Minimal' },
  { id: 'min-2', label: 'Simple Pink Wall', url: 'https://images.unsplash.com/photo-1501183007986-d0d080b147f9?auto=format&fit=crop&w=600&q=80', theme: 'Minimal' },
  { id: 'min-3', label: 'Cream Archway', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80', theme: 'Minimal' },
  { id: 'min-4', label: 'Shadow Leaves', url: 'https://images.unsplash.com/photo-1515549833447-2473361df28a?auto=format&fit=crop&w=600&q=80', theme: 'Minimal' },
  { id: 'min-5', label: 'Sand Ripples', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80', theme: 'Minimal' },
  { id: 'min-6', label: 'Pink Velvet', url: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=600&q=80', theme: 'Minimal' },
  { id: 'min-7', label: 'Geometric Lines', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80', theme: 'Minimal' },
  { id: 'min-8', label: 'Neutral Swirls', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80', theme: 'Minimal' },
  { id: 'min-9', label: 'White Silk', url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=600&q=80', theme: 'Minimal' },
  { id: 'min-10', label: 'Soft Terracotta', url: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=600&q=80', theme: 'Minimal' },

  // Celestial & Dreamy (Theme 5)
  { id: 'dream-1', label: 'Starry Night', url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=600&q=80', theme: 'Dreamy' },
  { id: 'dream-2', label: 'Crescent Moon Sky', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80', theme: 'Dreamy' },
  { id: 'dream-3', label: 'Aurora Lights', url: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=600&q=80', theme: 'Dreamy' },
  { id: 'dream-4', label: 'Magical Galaxy', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=600&q=80', theme: 'Dreamy' },
  { id: 'dream-5', label: 'Pink Sparkle', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80', theme: 'Dreamy' },
  { id: 'dream-6', label: 'Sunset Sparkle', url: 'https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?auto=format&fit=crop&w=600&q=80', theme: 'Dreamy' },
  { id: 'dream-7', label: 'Purple Nebula', url: 'https://images.unsplash.com/photo-1516339901601-2e1d62dc0c45?auto=format&fit=crop&w=600&q=80', theme: 'Dreamy' },
  { id: 'dream-8', label: 'Night Sea Moon', url: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&w=600&q=80', theme: 'Dreamy' },
  { id: 'dream-9', label: 'Shooting Star Sky', url: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?auto=format&fit=crop&w=600&q=80', theme: 'Dreamy' },
  { id: 'dream-10', label: 'Cloud Castles', url: 'https://images.unsplash.com/photo-1525083830203-05a543e5c1d9?auto=format&fit=crop&w=600&q=80', theme: 'Dreamy' }
];

const WallpaperStudio = ({ roomState, onSetWallpaper, onWipeWallpaper, onLeaveRoom, socket }) => {
  const { room, member, members, activeWallpaper } = roomState;
  
  // Local state for Composer
  const [activeTab, setActiveTab] = useState('curated'); // 'curated' | 'gallery'
  const [selectedTheme, setSelectedTheme] = useState('All');
  
  // Decoupled Background: Initialize background locally
  const [selectedImage, setSelectedImage] = useState(() => {
    return localStorage.getItem(`local_bg_${room.id}`) || activeWallpaper?.image_url || CURATED_IMAGES[0].url;
  });

  const [message, setMessage] = useState(activeWallpaper?.message || '');
  const [font, setFont] = useState(activeWallpaper?.font || 'Serif');
  const [color, setColor] = useState(activeWallpaper?.color || '#FFFFFF');
  const [position, setPosition] = useState(activeWallpaper?.position || 'Center');
  const [previewFormat, setPreviewFormat] = useState('mobile'); // 'mobile' | 'laptop'

  // Drawing Canvas States
  const [strokes, setStrokes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const currentPointsRef = useRef([]);
  const autosaveTimerRef = useRef(null);
  const lastPersistedSignatureRef = useRef('');

  // File Upload State
  const [uploading, setUploading] = useState(false);
  const [userUploadedPhotos, setUserUploadedPhotos] = useState(() => {
    // Load local uploads from localStorage per room ID
    const saved = localStorage.getItem(`uploads_${room.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const fileInputRef = useRef(null);

  // PWA Install Prompt Modal
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  const getWallpaperSignature = (payload) => JSON.stringify({
    image_url: payload.image_url || '',
    message: payload.message || '',
    font: payload.font || 'Serif',
    color: payload.color || '#FFFFFF',
    position: payload.position || 'Center',
    scribbles: payload.scribbles || ''
  });

  const buildWallpaperPayload = (overrides = {}) => ({
    image_url: selectedImage,
    message: message.trim(),
    font,
    color,
    position,
    set_by: member.name,
    scribbles: JSON.stringify(strokes),
    ...overrides
  });

  const persistWallpaper = async ({ showModal = false, overrides = {} } = {}) => {
    const payload = buildWallpaperPayload(overrides);
    const signature = getWallpaperSignature(payload);

    if (!showModal && signature === lastPersistedSignatureRef.current) {
      return null;
    }

    const saved = await onSetWallpaper(payload);
    lastPersistedSignatureRef.current = signature;

    if (showModal) {
      setShowPwaModal(true);
    }

    return saved;
  };

  // Local BG update wrapper
  const updateLocalBg = (url) => {
    setSelectedImage(url);
    localStorage.setItem(`local_bg_${room.id}`, url);
  };

  // Sync state if activeWallpaper changes externally
  useEffect(() => {
    if (activeWallpaper) {
      // NOTE: We DO NOT sync background image (activeWallpaper.image_url) anymore. Background is local!
      setMessage(activeWallpaper.message || '');
      setFont(activeWallpaper.font || 'Serif');
      setColor(activeWallpaper.color || '#FFFFFF');
      setPosition(activeWallpaper.position || 'Center');
      
      // Load saved scribbles
      if (activeWallpaper.scribbles) {
        try {
          const parsed = JSON.parse(activeWallpaper.scribbles);
          setStrokes(parsed);
        } catch (e) {
          console.error('Failed to parse activeWallpaper scribbles:', e);
        }
      } else {
        setStrokes([]);
      }

      lastPersistedSignatureRef.current = getWallpaperSignature({
        image_url: activeWallpaper.image_url,
        message: activeWallpaper.message,
        font: activeWallpaper.font,
        color: activeWallpaper.color,
        position: activeWallpaper.position,
        scribbles: activeWallpaper.scribbles
      });
    } else {
      // Clear composer if wiped
      setMessage('');
      setStrokes([]);
      lastPersistedSignatureRef.current = '';
    }
  }, [activeWallpaper]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!message.trim() && strokes.length === 0 && !activeWallpaper) return;

    const payload = buildWallpaperPayload();
    const signature = getWallpaperSignature(payload);
    if (signature === lastPersistedSignatureRef.current) return;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      persistWallpaper().catch((error) => {
        console.error('Autosave failed:', error);
      });
    }, 650);
  }, [message, font, color, position]);

  // Categories/Themes lists
  const themes = ['All', 'Cloudy', 'Cozy', 'Nature', 'Minimal', 'Dreamy'];
  
  const filteredCurated = selectedTheme === 'All'
    ? CURATED_IMAGES
    : CURATED_IMAGES.filter(img => img.theme === selectedTheme);

  // Canvas drawing & scaling functions
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      redrawCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [strokes, previewFormat]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    strokes.forEach(stroke => {
      if (!stroke.points || stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color || '#FFFFFF';
      ctx.lineWidth = (stroke.width || 4) * (canvas.width / 1000);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      stroke.points.forEach((pt, idx) => {
        const sx = (pt.x / 1000) * canvas.width;
        const sy = (pt.y / 1000) * canvas.height;
        if (idx === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.stroke();
    });
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    return {
      x: (x / rect.width) * 1000,
      y: (y / rect.height) * 1000
    };
  };

  const startDrawing = (e) => {
    const coords = getCoordinates(e);
    if (!coords) return;
    setIsDrawing(true);
    currentPointsRef.current = [coords];
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    if (!coords) return;
    
    currentPointsRef.current.push(coords);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = color; // match composer color
    ctx.lineWidth = 4 * (canvas.width / 1000);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const pts = currentPointsRef.current;
    const prevPt = pts[pts.length - 2];
    const currPt = pts[pts.length - 1];
    
    if (prevPt && currPt) {
      ctx.moveTo((prevPt.x / 1000) * canvas.width, (prevPt.y / 1000) * canvas.height);
      ctx.lineTo((currPt.x / 1000) * canvas.width, (currPt.y / 1000) * canvas.height);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (currentPointsRef.current.length > 1) {
      const newStroke = {
        points: currentPointsRef.current,
        color: color,
        width: 4
      };
      
      const updatedStrokes = [...strokes, newStroke];
      setStrokes(updatedStrokes);
      
      if (socket) {
        socket.emit('draw_stroke', { roomId: room.id, stroke: newStroke });
      }

      persistWallpaper({
        overrides: { scribbles: JSON.stringify(updatedStrokes) }
      }).catch((error) => {
        console.error('Drawing autosave failed:', error);
      });
    }
    currentPointsRef.current = [];
  };

  const handleMessageChange = (value) => {
    setMessage(value);
    if (socket) {
      socket.emit('typing_sync', {
        roomId: room.id,
        data: {
          message: value,
          font,
          color,
          position
        }
      });
    }
  };

  // Real-time socket events for drawing, typing, and wipes
  useEffect(() => {
    if (!socket) return;

    socket.on('draw_stroke', (stroke) => {
      setStrokes(prev => [...prev, stroke]);
    });

    socket.on('clear_scribbles', () => {
      setStrokes([]);
    });

    socket.on('typing_sync', (data) => {
      if (typeof data.message === 'string') setMessage(data.message);
      if (data.font) setFont(data.font);
      if (data.color) setColor(data.color);
      if (data.position) setPosition(data.position);
    });

    return () => {
      socket.off('draw_stroke');
      socket.off('clear_scribbles');
      socket.off('typing_sync');
    };
  }, [socket]);

  // Handle image upload to Express server
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (userUploadedPhotos.length >= 10) {
      alert('You can upload up to 10 photos in your shared gallery. Delete some to add more.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Upload failed');
      }

      const data = await response.json();
      const newPhoto = { id: Math.random().toString(36).substring(2, 9), url: data.url };
      const updatedPhotos = [newPhoto, ...userUploadedPhotos];
      
      setUserUploadedPhotos(updatedPhotos);
      localStorage.setItem(`uploads_${room.id}`, JSON.stringify(updatedPhotos));
      
      // Auto select and save the newly uploaded image locally
      updateLocalBg(data.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error.message || 'Failed to upload photo. Only JPG/PNG/GIF/WEBP allowed under 5MB.');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete uploaded photo
  const handleDeletePhoto = (id, e) => {
    e.stopPropagation();
    const updated = userUploadedPhotos.filter(p => p.id !== id);
    setUserUploadedPhotos(updated);
    localStorage.setItem(`uploads_${room.id}`, JSON.stringify(updated));
    // Fallback if deleted image was selected
    const photoToDelete = userUploadedPhotos.find(p => p.id === id);
    if (photoToDelete && selectedImage === photoToDelete.url) {
      updateLocalBg(CURATED_IMAGES[0].url);
    }
  };

  // Set Wallpaper Action (Saves text and drawing scribbles)
  const handleSetWallpaperSubmit = async () => {
    setIsUpdating(true);
    try {
      await persistWallpaper({ showModal: true });
    } catch (error) {
      console.error(error);
      alert('Failed to set wallpaper.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Wipe Wallpaper Action
  const handleWipeClick = async () => {
    if (confirm('Clear the wallpaper note and scribbles for everyone in the room?')) {
      setIsWiping(true);
      try {
        await onWipeWallpaper();
        setMessage('');
        setStrokes([]);
        if (socket) {
          socket.emit('clear_scribbles', { roomId: room.id });
        }
      } catch (error) {
        console.error(error);
        alert('Failed to clear wallpaper.');
      } finally {
        setIsWiping(false);
      }
    }
  };

  const getPositionClass = (pos) => {
    const found = POSITIONS.find(p => p.id === pos);
    return found ? found.class : 'justify-center';
  };

  const getFontFamilyClass = (f) => {
    const found = FONTS.find(fontOpt => fontOpt.id === f);
    return found ? found.family : 'font-wallpaperSerif';
  };

  const isAndroid = () => /android/i.test(navigator.userAgent);
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  return (
    <div className="relative min-h-screen w-full flex flex-col z-10 px-4 py-6 max-w-7xl mx-auto">
      {/* Studio Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 mb-6 border-b border-theme-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FFB7C5] to-[#E88FA0] flex items-center justify-center shadow-soft">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-theme-dark tracking-tight">WhisperWall Studio</h1>
            <p className="text-xs text-theme-dark/70">
              Code: <span className="font-mono font-bold text-theme-primary tracking-wider bg-white/60 px-2 py-0.5 rounded border border-theme-accent/20 select-all">{room.code}</span>
              <span className="mx-2">•</span>
              Mode: <span className="capitalize font-bold text-theme-dark/80">{room.type}</span>
            </p>
          </div>
        </div>

        {/* Connected Members */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-white/40 border border-theme-accent/30 rounded-2xl px-3 py-1.5 flex items-center gap-2 max-w-xs overflow-hidden">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
            <span className="text-[11px] font-bold text-theme-dark truncate">
              {members.map(m => m.name).join(', ')}
            </span>
          </div>

          <button
            onClick={onLeaveRoom}
            className="glass-button text-xs font-bold px-3 py-1.5 rounded-xl border-rose-300/30 text-rose-700/80 hover:bg-rose-50 flex items-center gap-1 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" /> Leave
          </button>
        </div>
      </header>

      {/* Main Studio Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: IMAGE PICKER (Size: 5/12 on Desktop) */}
        <section className="lg:col-span-5 flex flex-col gap-4 w-full h-full lg:max-h-[750px]">
          <div className="glass-card rounded-3xl p-5 shadow-soft border border-white/50 flex flex-col h-full overflow-hidden">
            
            {/* Tabs */}
            <div className="flex border-b border-theme-dark/10 pb-3 mb-4">
              <button
                onClick={() => setActiveTab('curated')}
                className={`flex-1 py-2 font-bold text-sm text-center border-b-2 transition-all ${
                  activeTab === 'curated'
                    ? 'border-theme-primary text-theme-primary'
                    : 'border-transparent text-theme-dark/60 hover:text-theme-dark'
                }`}
              >
                Curated ✨
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`flex-1 py-2 font-bold text-sm text-center border-b-2 transition-all ${
                  activeTab === 'gallery'
                    ? 'border-theme-primary text-theme-primary'
                    : 'border-transparent text-theme-dark/60 hover:text-theme-dark'
                }`}
              >
                Our Gallery ({userUploadedPhotos.length}/10)
              </button>
            </div>

            {/* Curated Tab View */}
            {activeTab === 'curated' && (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Horizontal Theme Filter */}
                <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-none snap-x">
                  {themes.map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTheme(t)}
                      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap snap-start transition-all ${
                        selectedTheme === t
                          ? 'bg-theme-primary text-white'
                          : 'bg-white/40 text-theme-dark/70 hover:bg-white/70'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Images Grid */}
                <div className="grid grid-cols-3 gap-2 overflow-y-auto pr-1 flex-1 max-h-[350px] lg:max-h-none">
                  {filteredCurated.map(img => (
                    <button
                      key={img.id}
                      onClick={() => updateLocalBg(img.url)}
                      className={`relative aspect-[9/16] rounded-xl overflow-hidden group border-2 transition-all ${
                        selectedImage === img.url
                          ? 'border-theme-primary scale-95 shadow-inner'
                          : 'border-transparent hover:border-theme-accent/60'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.label}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 text-left">
                        <span className="block text-[8px] font-bold text-white leading-tight truncate">
                          {img.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Gallery Tab View */}
            {activeTab === 'gallery' && (
              <div className="flex flex-col h-full overflow-hidden flex-1">
                {/* Upload Action Card */}
                <div className="mb-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || userUploadedPhotos.length >= 10}
                    className="w-full py-6 bg-dashed border-2 border-dashed border-theme-primary/30 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-theme-bg/30 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin text-theme-primary" />
                        <span className="text-xs font-bold text-theme-dark/70">Uploading to server...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-theme-primary" />
                        <span className="text-xs font-bold text-theme-dark">Upload Custom Photo (Max 5MB)</span>
                        <span className="text-[10px] text-theme-dark/60">Limit: 10 images per room</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Uploaded Gallery Grid */}
                {userUploadedPhotos.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/20 rounded-2xl border border-white/40">
                    <Smartphone className="w-10 h-10 text-theme-dark/40 mb-2" />
                    <p className="font-bold text-xs text-theme-dark/80">No custom photos yet</p>
                    <p className="text-[10px] text-theme-dark/60 mt-1 max-w-xs">
                      Upload photos from your device to share in this room.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 overflow-y-auto pr-1 flex-1 max-h-[350px] lg:max-h-none">
                    {userUploadedPhotos.map(photo => (
                      <div
                        key={photo.id}
                        onClick={() => updateLocalBg(photo.url)}
                        className={`relative aspect-[9/16] rounded-xl overflow-hidden group cursor-pointer border-2 transition-all ${
                          selectedImage === photo.url
                            ? 'border-theme-primary scale-95'
                            : 'border-transparent hover:border-theme-accent/60'
                        }`}
                      >
                        <img
                          src={photo.url}
                          alt="User upload"
                          className="w-full h-full object-cover"
                        />
                        {/* Delete action overlay */}
                        <button
                          onClick={(e) => handleDeletePhoto(photo.id, e)}
                          className="absolute top-1 right-1 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </section>

        {/* RIGHT COLUMN: PREVIEW & COMPOSER (Size: 7/12 on Desktop) */}
        <section className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-6 w-full items-stretch">
          
          {/* Live Wallpaper Preview Card (5/12 of right column) */}
          <div className="md:col-span-5 flex flex-col justify-center gap-3">
            {/* Format toggle controls */}
            <div className="flex bg-white/40 border border-theme-accent/20 rounded-2xl p-1 shrink-0 self-center">
              <button
                type="button"
                onClick={() => setPreviewFormat('mobile')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                  previewFormat === 'mobile'
                    ? 'bg-theme-primary text-white shadow-sm'
                    : 'text-theme-dark/70 hover:text-theme-dark'
                }`}
              >
                📱 Mobile
              </button>
              <button
                type="button"
                onClick={() => setPreviewFormat('laptop')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                  previewFormat === 'laptop'
                    ? 'bg-theme-primary text-white shadow-sm'
                    : 'text-theme-dark/70 hover:text-theme-dark'
                }`}
              >
                💻 Laptop / Mac
              </button>
            </div>

            <div className="glass-card rounded-[32px] p-3 shadow-soft border border-white/50 relative overflow-hidden">
              <span className="block text-[10px] font-bold text-center text-theme-dark/60 mb-2">
                Live Preview ({previewFormat === 'mobile' ? 'Portrait' : 'Landscape'})
              </span>

              {/* Dynamic Aspect Ratio Mockup Canvas */}
              <div className={`relative w-full rounded-[24px] overflow-hidden bg-theme-bg shadow-inner border border-theme-accent/20 select-none transition-all duration-300 ${
                previewFormat === 'mobile' ? 'aspect-[9/16]' : 'aspect-[16/10]'
              }`}>
                {/* Image */}
                <img
                  src={selectedImage}
                  alt="Wallpaper preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Synced Drawing Canvas Layer */}
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="absolute inset-0 w-full h-full cursor-crosshair z-10 touch-none"
                />

                {/* Soft Vignette Overlay */}
                <div className="absolute inset-0 wallpaper-vignette pointer-events-none"></div>

                {/* Overlay Text */}
                {message && (
                  <div className={`absolute inset-0 flex flex-col p-6 text-center select-none pointer-events-none break-words ${getPositionClass(position)}`}>
                    <p 
                      className={`leading-relaxed whitespace-pre-wrap font-bold select-none ${getFontFamilyClass(font)} ${
                        color === '#FFFFFF' || color === '#FDF0DC' || color === '#FFB7C5' || color === '#D4A96A'
                          ? 'text-stroke-subtle' 
                          : 'text-stroke-subtle-light'
                      }`}
                      style={{ color: color, fontSize: previewFormat === 'mobile' ? '1.2rem' : '1.6rem', lineHeight: '1.4' }}
                    >
                      {message}
                    </p>
                  </div>
                )}

                {/* Mockup Screen Accents */}
                {previewFormat === 'mobile' ? (
                  <div className="absolute top-2 inset-x-0 px-4 flex justify-between items-center text-white/80 text-[8px] font-bold pointer-events-none drop-shadow-sm">
                    <span>9:41 🌙</span>
                    <div className="flex items-center gap-1">
                      <span>LTE</span>
                      <div className="w-4 h-2 border border-white/60 rounded-[2px] p-[1px] flex items-center">
                        <div className="w-full h-full bg-white rounded-[1px]"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute top-2 inset-x-0 px-4 flex justify-between items-center text-white/80 text-[8px] font-bold pointer-events-none drop-shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400/80"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/80"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400/80"></span>
                    </div>
                    <span>MacBook Desktop Mockup 🌸</span>
                  </div>
                )}

                {/* Mockup Lock Screen Signature */}
                {message && (
                  <div className="absolute bottom-4 inset-x-0 text-center text-white/60 text-[8px] font-semibold tracking-wider pointer-events-none uppercase">
                    {activeWallpaper?.set_by ? `From ${activeWallpaper.set_by}` : `By ${member.name}`}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Composer Controls Card (7/12 of right column) */}
          <div className="md:col-span-7 flex flex-col justify-between glass-card rounded-[32px] p-6 shadow-soft border border-white/50">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-theme-dark flex items-center gap-1.5">
                Composer <Sparkles className="w-4.5 h-4.5 text-theme-primary animate-pulse" />
              </h2>

              {/* Text Area */}
              <div>
                <label className="block text-xs font-bold text-theme-dark mb-1.5 ml-1">Your Message</label>
                <textarea
                  placeholder="Type something sweet..."
                  value={message}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  rows={3}
                  maxLength={150}
                  className="w-full glass-input px-4 py-3 rounded-2xl text-sm resize-none"
                ></textarea>
                <div className="flex justify-between items-center text-[10px] text-theme-dark/60 mt-1 px-1">
                  <span>Press enter for new lines</span>
                  <span>{message.length}/150</span>
                </div>
              </div>

              {/* Font Picker */}
              <div>
                <label className="block text-xs font-bold text-theme-dark mb-1.5 ml-1">Font Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {FONTS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFont(f.id)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        font === f.id
                          ? 'bg-theme-accent/20 border-theme-primary text-theme-dark font-extrabold'
                          : 'bg-white/40 border-transparent text-theme-dark/70 hover:bg-white/60'
                      }`}
                    >
                      <span className={f.family}>{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Color Picker */}
              <div>
                <label className="block text-xs font-bold text-theme-dark mb-1.5 ml-1">Text Color</label>
                <div className="flex gap-2.5 items-center flex-wrap px-1">
                  {TEXT_COLORS.map(c => (
                    <button
                      key={c.name}
                      onClick={() => setColor(c.value)}
                      title={c.name}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${c.class} ${
                        color === c.value
                          ? 'scale-125 border-theme-primary ring-2 ring-theme-accent/50'
                          : 'hover:scale-110'
                      }`}
                    ></button>
                  ))}
                </div>
              </div>

              {/* Text Position Selector */}
              <div>
                <label className="block text-xs font-bold text-theme-dark mb-1.5 ml-1">Alignment</label>
                <div className="grid grid-cols-3 gap-2">
                  {POSITIONS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPosition(p.id)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        position === p.id
                          ? 'bg-theme-accent/20 border-theme-primary text-theme-dark font-extrabold'
                          : 'bg-white/40 border-transparent text-theme-dark/70 hover:bg-white/60'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Composer Footer Actions */}
            <div className="pt-6 border-t border-theme-dark/10 flex flex-col gap-3">
              <button
                onClick={handleSetWallpaperSubmit}
                disabled={isUpdating || !selectedImage}
                className="glass-button-primary w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Set as Wallpaper 💌
                  </>
                )}
              </button>

              <button
                onClick={handleWipeClick}
                disabled={isWiping}
                className="glass-button w-full py-3 rounded-2xl font-bold text-xs border-rose-300/30 text-rose-700/80 hover:bg-rose-50/50 flex items-center justify-center gap-2"
              >
                {isWiping ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                ) : (
                  <>
                    Wipe Note ✕
                  </>
                )}
              </button>
            </div>
          </div>

        </section>

        {/* PWA INSTALL AND INSTRUCTIONS MODAL */}
        {showPwaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="glass-card-pink max-w-lg w-full rounded-[32px] p-6 border border-theme-primary/30 shadow-2xl relative my-8">
              <h3 className="text-xl font-extrabold text-theme-dark mb-2 text-center flex items-center justify-center gap-1.5">
                Wallpaper Updated! 💕
              </h3>
              
              <p className="text-xs text-theme-dark/80 mb-4 text-center leading-relaxed">
                Your message has been updated and synced. Choose your platform below to set this as your actual background:
              </p>

              {/* Dynamic Link Copy Section */}
              <div className="mb-6 p-4 bg-white/50 border border-theme-accent/30 rounded-2xl">
                <span className="block text-[10px] font-bold text-theme-dark/60 uppercase tracking-wider mb-1.5">
                  Your Dynamic Image Link (for iPhone / OS integrations)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/api/rooms/${room.id}/wallpaper/image.svg`}
                    className="flex-1 text-[11px] font-mono bg-white/80 border border-theme-accent/40 rounded-xl px-3 py-2 text-theme-dark select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/rooms/${room.id}/wallpaper/image.svg`);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="glass-button-primary px-3.5 rounded-xl font-bold text-xs shrink-0"
                  >
                    {copiedLink ? 'Copied! ✨' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                
                {/* iPhone / iOS Guide */}
                <div className="bg-white/40 border border-theme-accent/20 rounded-2xl p-4">
                  <h4 className="font-extrabold text-xs text-theme-dark flex items-center gap-1.5 mb-2">
                    <span>🍎</span> iPhone / iOS (Automated Lockscreen)
                  </h4>
                  <ol className="text-[10px] text-theme-dark/80 space-y-1.5 list-decimal pl-4 leading-normal">
                    <li>Copy the <b>Dynamic Image Link</b> above.</li>
                    <li>Open the built-in <b>Shortcuts</b> app on your iPhone.</li>
                    <li>Create a new shortcut, add the action <b>Get Contents of URL</b>, and paste the link.</li>
                    <li>Add the action <b>Set Wallpaper</b> and configure it to use the URL contents.</li>
                    <li>Go to the <b>Automation</b> tab in Shortcuts, and set it to run automatically (e.g. at a specific time, on App Open, or when Sleep mode changes) so it updates silently in the background!</li>
                  </ol>
                </div>

                {/* Mac / macOS Guide */}
                <div className="bg-white/40 border border-theme-accent/20 rounded-2xl p-4">
                  <h4 className="font-extrabold text-xs text-theme-dark flex items-center gap-1.5 mb-2">
                    <span>💻</span> Mac / macOS (Live Active Wallpaper)
                  </h4>
                  <ol className="text-[10px] text-theme-dark/80 space-y-1.5 list-decimal pl-4 leading-normal">
                    <li>Install the free open-source app <b>Plash</b> (available on the Mac App Store).</li>
                    <li>Open Plash and set the Website URL to your live canvas link:<br/>
                      <span className="font-mono font-bold select-all bg-white/50 px-1 py-0.5 rounded">{window.location.origin}/wallpaper</span>
                    </li>
                    <li>Plash will run in the background, rendering the webpage directly on your desktop! Floating hearts and sync will update interactively in real time.</li>
                  </ol>
                </div>

                {/* Windows Guide */}
                <div className="bg-white/40 border border-theme-accent/20 rounded-2xl p-4">
                  <h4 className="font-extrabold text-xs text-theme-dark flex items-center gap-1.5 mb-2">
                    <span>🪟</span> Windows (Live Wallpaper)
                  </h4>
                  <ol className="text-[10px] text-theme-dark/80 space-y-1.5 list-decimal pl-4 leading-normal">
                    <li>Download the free open-source app <b>Lively Wallpaper</b> (from Microsoft Store or GitHub).</li>
                    <li>Click <b>Add Wallpaper</b>, select **URL**, and enter:<br/>
                      <span className="font-mono font-bold select-all bg-white/50 px-1 py-0.5 rounded">{window.location.origin}/wallpaper</span>
                    </li>
                    <li>It will render WhisperWall live on your desktop, automatically syncing whenever a new message is sent.</li>
                  </ol>
                </div>

                {/* Android Guide */}
                <div className="bg-white/40 border border-theme-accent/20 rounded-2xl p-4">
                  <h4 className="font-extrabold text-xs text-theme-dark flex items-center gap-1.5 mb-2">
                    <span>🤖</span> Android
                  </h4>
                  <ol className="text-[10px] text-theme-dark/80 space-y-1.5 list-decimal pl-4 leading-normal">
                    <li>Use a free app like <b>Web Live Wallpaper</b> from the Play Store.</li>
                    <li>Set the wallpaper URL to: <span className="font-mono font-bold select-all bg-white/50 px-1 py-0.5 rounded">{window.location.origin}/wallpaper</span></li>
                    <li>Confirm and set as active lockscreen/homescreen.</li>
                  </ol>
                </div>

              </div>

              <button
                onClick={() => setShowPwaModal(false)}
                className="glass-button-primary w-full py-3 rounded-2xl font-bold text-sm mt-6"
              >
                Got it, let's connect! 💌
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WallpaperStudio;
