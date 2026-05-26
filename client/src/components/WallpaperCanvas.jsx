import React, { useState, useEffect, useRef } from 'react';
import { Settings, AlertCircle, Heart, Edit3, Save, X, Loader2 } from 'lucide-react';
import BubbleHearts from './BubbleHearts.jsx';

const FONTS = {
  Serif: 'font-wallpaperSerif',
  Handwritten: 'font-wallpaperHandwritten',
  Sans: 'font-wallpaperSans',
  Bold: 'font-wallpaperBold'
};

const POSITIONS = {
  Top: 'justify-start pt-20',
  Center: 'justify-center',
  Bottom: 'justify-end pb-20'
};

const WallpaperCanvas = ({ roomState, onBackToStudio, onSetWallpaper, socket }) => {
  const { room, member, activeWallpaper } = roomState;
  const [wallpaper, setWallpaper] = useState(null);
  
  // Decoupled drawing state
  const [strokes, setStrokes] = useState([]);
  const canvasRef = useRef(null);

  // Local storage caching for offline support
  const cacheKey = `cached_wallpaper_${room?.id || 'offline'}`;

  // Heart particle trigger
  const [bubbleTrigger, setBubbleTrigger] = useState(0);

  // Floating settings UI toggle (fades out)
  const [showSettingsBtn, setShowSettingsBtn] = useState(true);
  const settingsTimerRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const editOriginalMessageRef = useRef('');

  // Load cached wallpaper on mount
  useEffect(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      setWallpaper(parsed);
      if (parsed.scribbles) {
        try {
          setStrokes(JSON.parse(parsed.scribbles));
        } catch (e) {}
      }
    }
  }, [cacheKey]);

  // Request notifications permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Update wallpaper state and trigger reactions when activeWallpaper changes
  useEffect(() => {
    if (activeWallpaper) {
      const isNewMessage = !wallpaper || 
                           wallpaper.id !== activeWallpaper.id || 
                           wallpaper.message !== activeWallpaper.message || 
                           wallpaper.image_url !== activeWallpaper.image_url;

      setWallpaper(activeWallpaper);
      setDraftMessage(activeWallpaper.message || '');
      localStorage.setItem(cacheKey, JSON.stringify(activeWallpaper));

      // Parse activeWallpaper scribbles
      if (activeWallpaper.scribbles) {
        try {
          setStrokes(JSON.parse(activeWallpaper.scribbles));
        } catch (e) {
          console.error(e);
        }
      } else {
        setStrokes([]);
      }

      if (isNewMessage) {
        // Trigger bubble heart burst
        setBubbleTrigger(prev => prev + 1);

        // Haptic feedback
        if ('vibrate' in navigator) {
          try {
            navigator.vibrate([200]);
          } catch (e) {
            console.log('Vibrate failed:', e);
          }
        }

        // Push Web Notification (if permission granted and page not active/focused)
        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          try {
            new Notification('WhisperWall 💌', {
              body: `A new message on your wallpaper from ${activeWallpaper.set_by || 'someone'}!`,
              icon: '/icons/icon-192.png'
            });
          } catch (e) {
            console.log('Notification failed:', e);
          }
        }
      }
    } else {
      setWallpaper(null);
      setDraftMessage('');
      setStrokes([]);
      localStorage.removeItem(cacheKey);
    }
  }, [activeWallpaper, cacheKey]);

  // Resizing and redrawing fullscreen canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      redrawCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [strokes]);

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

  // Real-time socket events for drawing and wipes
  useEffect(() => {
    if (!socket) return;

    socket.on('draw_stroke', (stroke) => {
      setStrokes(prev => [...prev, stroke]);
    });

    socket.on('clear_scribbles', () => {
      setStrokes([]);
    });

    socket.on('typing_sync', (data) => {
      if (typeof data.message !== 'string') return;
      setDraftMessage(data.message);
      setWallpaper(prev => prev ? { ...prev, ...data } : prev);
    });

    return () => {
      socket.off('draw_stroke');
      socket.off('clear_scribbles');
      socket.off('typing_sync');
    };
  }, [socket]);

  // Floating controls auto-hide logic
  useEffect(() => {
    resetSettingsTimer();
    return () => {
      if (settingsTimerRef.current) clearTimeout(settingsTimerRef.current);
    };
  }, []);

  const resetSettingsTimer = () => {
    setShowSettingsBtn(true);
    if (settingsTimerRef.current) clearTimeout(settingsTimerRef.current);
    settingsTimerRef.current = setTimeout(() => {
      setShowSettingsBtn(false);
    }, 3000); // hide after 3 seconds
  };

  const handleScreenInteraction = () => {
    resetSettingsTimer();
  };

  const openEditor = () => {
    const currentMessage = wallpaper?.message || '';
    editOriginalMessageRef.current = currentMessage;
    setDraftMessage(currentMessage);
    setIsEditing(true);
    resetSettingsTimer();
  };

  const handleDraftChange = (value) => {
    setDraftMessage(value);
    setWallpaper(prev => prev ? { ...prev, message: value } : prev);

    if (socket && room?.id) {
      socket.emit('typing_sync', {
        roomId: room.id,
        data: { message: value }
      });
    }
  };

  const saveFullscreenMessage = async () => {
    if (!onSetWallpaper || !room) return;

    setIsSaving(true);
    try {
      const current = wallpaper || activeWallpaper || {};
      const saved = await onSetWallpaper({
        image_url: localStorage.getItem(`local_bg_${room.id}`) || current.image_url || '',
        message: draftMessage.trim(),
        font: current.font || 'Serif',
        color: current.color || '#FFFFFF',
        position: current.position || 'Center',
        set_by: member?.name || current.set_by || 'Someone',
        scribbles: JSON.stringify(strokes)
      });

      setWallpaper(saved);
      localStorage.setItem(cacheKey, JSON.stringify(saved));
      setIsEditing(false);
    } catch (error) {
      console.error('Fullscreen message save failed:', error);
      alert('Failed to update the wallpaper text.');
    } finally {
      setIsSaving(false);
    }
  };

  const getPositionClass = (pos) => {
    return POSITIONS[pos] || 'justify-center';
  };

  const getFontFamilyClass = (f) => {
    return FONTS[f] || 'font-wallpaperSerif';
  };

  return (
    <div 
      className="fixed inset-0 w-screen h-screen z-20 bg-black overflow-hidden select-none"
      onMouseMove={handleScreenInteraction}
      onClick={handleScreenInteraction}
      onTouchStart={handleScreenInteraction}
      onDoubleClick={openEditor}
    >
      {/* Decoupled Background Image */}
      <img
        src={localStorage.getItem(`local_bg_${room?.id}`) || wallpaper?.image_url || 'https://images.unsplash.com/photo-1531265726475-52ad60219627?auto=format&fit=crop&w=1200&q=80'}
        alt="Wallpaper background"
        className="absolute inset-0 w-full h-full object-cover animate-fade-in"
      />

      {/* Synced Drawing Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* If empty of both notes & drawings, show a gentle overlay helper */}
      {!wallpaper?.message && strokes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white/50 pointer-events-none z-10">
          <Heart className="w-12 h-12 fill-white/10 text-white/30 animate-pulse mb-3" />
          <p className="font-bold text-xs">Waiting for a note or drawing...</p>
          <p className="text-[10px] text-white/40 mt-1 max-w-xs leading-relaxed font-semibold">
            Open the studio to write a message or draw!
          </p>
        </div>
      )}

      {/* Dark Vignette Overlay for Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/30 pointer-events-none z-5"></div>

      {/* Live Text Overlay Layer */}
      {wallpaper?.message && (
        <div className={`absolute inset-0 flex flex-col p-8 md:p-16 text-center select-none pointer-events-none break-words z-10 ${getPositionClass(wallpaper.position)}`}>
          <p 
            key={wallpaper.message} // trigger fade-in animation on text change
            className={`whitespace-pre-wrap select-none animate-fade-in ${getFontFamilyClass(wallpaper.font)} ${
              wallpaper.color === '#FFFFFF' || wallpaper.color === '#FDF0DC' || wallpaper.color === '#FFB7C5' || wallpaper.color === '#D4A96A'
                ? 'text-stroke-subtle' 
                : 'text-stroke-subtle-light'
            }`}
            style={{ color: wallpaper.color, fontSize: 'clamp(1.8rem, 4.5vw, 5.5rem)', lineHeight: '1.4' }}
          >
            {wallpaper.message}
          </p>
        </div>
      )}

      {/* Fullscreen Text Editor */}
      {isEditing && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center p-5 bg-black/35 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-md rounded-[28px] border border-white/25 bg-black/55 p-4 shadow-2xl backdrop-blur-xl">
            <textarea
              autoFocus
              value={draftMessage}
              maxLength={150}
              rows={4}
              onChange={(e) => handleDraftChange(e.target.value)}
              className="w-full resize-none rounded-2xl border border-white/20 bg-white/90 px-4 py-3 text-sm font-semibold text-theme-dark outline-none focus:border-theme-primary"
              placeholder="Update the wallpaper text..."
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold text-white/70">{draftMessage.length}/150</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraftMessage(editOriginalMessageRef.current);
                    setWallpaper(prev => prev ? { ...prev, message: editOriginalMessageRef.current } : prev);
                    setIsEditing(false);
                  }}
                  className="h-10 w-10 rounded-full border border-white/20 bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={saveFullscreenMessage}
                  disabled={isSaving}
                  className="h-10 w-10 rounded-full bg-theme-primary text-white flex items-center justify-center shadow-lg hover:bg-theme-primary/90 disabled:opacity-60"
                  title="Save"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallpaper Footer Info */}
      {wallpaper && (
        <div className="absolute bottom-6 inset-x-0 text-center text-white/55 text-[10px] font-semibold tracking-widest pointer-events-none uppercase z-10">
          {wallpaper.set_by ? `From ${wallpaper.set_by}` : `WhisperWall`}
        </div>
      )}

      {/* Interactive bubble hearts */}
      <BubbleHearts trigger={bubbleTrigger} />

      {/* Floating Gear Settings Toggle */}
      <div
        className={`absolute top-6 right-6 z-30 flex gap-2 transition-opacity duration-500 ${
          showSettingsBtn ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            openEditor();
          }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:bg-black/60 transition-colors shadow-lg"
          title="Edit Text"
        >
          <Edit3 className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBackToStudio();
          }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:bg-black/60 transition-colors shadow-lg"
          title="Back to Studio"
        >
          <Settings className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
        </button>
      </div>

      {/* Offline Alert Indicator */}
      {!navigator.onLine && (
        <div className="absolute bottom-6 left-6 z-30 flex items-center gap-1.5 bg-yellow-500/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md border border-yellow-400/30">
          <AlertCircle className="w-3.5 h-3.5" /> Offline Mode
        </div>
      )}
    </div>
  );
};

export default WallpaperCanvas;
