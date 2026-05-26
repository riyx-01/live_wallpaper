import React, { useState, useEffect, useRef } from 'react';
import { Settings, RefreshCw, AlertCircle, Heart } from 'lucide-react';
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

const WallpaperCanvas = ({ roomState, onBackToStudio }) => {
  const { room, activeWallpaper } = roomState;
  const [wallpaper, setWallpaper] = useState(null);
  
  // Local storage caching for offline support
  const cacheKey = `cached_wallpaper_${room?.id || 'offline'}`;

  // Heart particle trigger
  const [bubbleTrigger, setBubbleTrigger] = useState(0);

  // Floating settings UI toggle (fades out)
  const [showSettingsBtn, setShowSettingsBtn] = useState(true);
  const settingsTimerRef = useRef(null);

  // Load cached wallpaper on mount
  useEffect(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setWallpaper(JSON.parse(cached));
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
      localStorage.setItem(cacheKey, JSON.stringify(activeWallpaper));

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
      localStorage.removeItem(cacheKey);
    }
  }, [activeWallpaper, cacheKey]);

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
    >
      {/* Background Image / Placeholder */}
      {wallpaper?.image_url ? (
        <img
          key={wallpaper.id} // reset transition on image change
          src={wallpaper.image_url}
          alt="Wallpaper background"
          className="absolute inset-0 w-full h-full object-cover animate-fade-in"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFF5F7] via-[#FFEBEF] to-[#FFF0F4] flex flex-col items-center justify-center text-center p-6 text-theme-dark/40">
          <Heart className="w-16 h-16 fill-theme-accent/20 text-theme-accent/50 animate-pulse mb-3" />
          <p className="font-bold text-sm">Waiting for a note...</p>
          <p className="text-xs text-theme-dark/50 mt-1 max-w-xs leading-relaxed">
            Open the studio on another device or write a note to set it here!
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
        className={`absolute top-6 right-6 z-30 transition-opacity duration-500 ${
          showSettingsBtn ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
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
