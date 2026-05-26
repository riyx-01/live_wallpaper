import React, { useState, useEffect } from 'react';
import { Heart, Users, Share2, Palette, Sparkles, Download } from 'lucide-react';

const LandingPage = ({ onStart }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later.
      setDeferredPrompt(e);
      // Automatically show our custom install banner
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If app is already installed, check and hide
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // We've used the prompt, clear it
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between z-10 px-4 py-8">
      {/* PWA Install Nudge Banner */}
      {showInstallBanner && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-bounce duration-1000 max-w-md mx-auto">
          <div className="glass-card-pink rounded-2xl p-4 flex items-center justify-between gap-4 border border-theme-primary/30 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-theme-primary/20 rounded-xl text-theme-dark">
                <Download className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-sm text-theme-dark">Install WhisperWall widget</p>
                <p className="text-xs text-theme-dark/80">Add to home screen for real-time live wallpaper updates!</p>
              </div>
            </div>
            <button
              onClick={handleInstallClick}
              className="glass-button-primary px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              Add 💌
            </button>
          </div>
        </div>
      )}

      {/* Main Content Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mt-12 mb-16">
        {/* Cute Floating Heart Logo Accent */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#FFB7C5] to-[#E88FA0] flex items-center justify-center shadow-lg transform rotate-12 relative">
            <Heart className="w-10 h-10 text-white fill-white absolute transform -rotate-12" />
          </div>
          {/* Sparkles */}
          <Sparkles className="w-6 h-6 text-theme-gold absolute -top-2 -right-2 animate-pulse" />
          <div className="absolute -bottom-1 -left-2 w-3 h-3 rounded-full bg-theme-accent animate-ping"></div>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-theme-dark tracking-tight mb-4 drop-shadow-sm font-ui">
          your heart on <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-theme-primary to-[#7D4156] font-wallpaperHandwritten text-5xl md:text-7xl normal-case">
            their screen
          </span>
        </h1>

        <p className="text-base md:text-lg text-theme-dark/80 font-medium leading-relaxed max-w-md mb-10 px-2">
          Whatever you type appears on their wallpaper in real time. Like a note left on the fridge, but sweeter.
        </p>

        {/* CTA Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md px-2">
          {/* Couple Mode Button */}
          <button
            onClick={() => onStart('couple')}
            className="group glass-card hover:glass-card-pink rounded-3xl p-6 flex flex-col items-center text-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-glass"
          >
            <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-theme-primary group-hover:bg-theme-primary group-hover:text-white transition-all duration-300">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <div>
              <span className="block font-bold text-lg text-theme-dark">For Couples</span>
              <span className="block text-xs text-theme-dark/70 mt-1">Pair 1-on-1 with your special person 💕</span>
            </div>
          </button>

          {/* Family Mode Button */}
          <button
            onClick={() => onStart('family')}
            className="group glass-card hover:glass-card-pink rounded-3xl p-6 flex flex-col items-center text-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-glass"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-theme-primary group-hover:bg-theme-primary group-hover:text-white transition-all duration-300">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="block font-bold text-lg text-theme-dark">For Families</span>
              <span className="block text-xs text-theme-dark/70 mt-1">Join up to 5 members in a group room 👨👩👧</span>
            </div>
          </button>
        </div>
      </div>

      {/* Explainer / Below Fold */}
      <div className="w-full max-w-4xl mt-6">
        <div className="glass-card rounded-[32px] p-8 md:p-10 shadow-soft">
          <h2 className="text-2xl font-extrabold text-theme-dark text-center mb-8 font-ui">
            How WhisperWall Works ✨
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF0F3] border border-[#FFD9E2] flex items-center justify-center text-theme-primary font-bold text-lg shadow-inner">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-theme-dark">1. Pair Devices</h3>
              <p className="text-xs text-theme-dark/75 leading-relaxed max-w-xs">
                Create a room and share your unique 6-character secret code with your partner or family.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF0F3] border border-[#FFD9E2] flex items-center justify-center text-theme-primary font-bold text-lg shadow-inner">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-theme-dark">2. Pick a Backdrop</h3>
              <p className="text-xs text-theme-dark/75 leading-relaxed max-w-xs">
                Select from our curated romantic themes or upload your own photos directly into the shared room gallery.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF0F3] border border-[#FFD9E2] flex items-center justify-center text-theme-primary font-bold text-lg shadow-inner animate-pulse">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <h3 className="font-bold text-theme-dark">3. Whisper & Sync</h3>
              <p className="text-xs text-theme-dark/75 leading-relaxed max-w-xs">
                Write a sweet message, adjust fonts & positions, then set it! It syncs immediately and persists for 2.5 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-theme-dark/50 mt-8 mb-2">
          WhisperWall © 2026. Made with love for couples and families.
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
