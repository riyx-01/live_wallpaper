import React, { useState } from 'react';
import { Heart, Users, Copy, Check, Share2, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

const Onboarding = ({ initialType, onBack, onCreateRoom, onJoinRoom, roomState, loading }) => {
  const [step, setStep] = useState('profile'); // 'profile' | 'create_code' | 'join_code'
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [roomType, setRoomType] = useState(initialType || 'couple');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Handle profile form submission
  const handleProfileSubmit = async (action) => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setError('');

    if (action === 'create') {
      try {
        await onCreateRoom({ name: name.trim(), label: label.trim() || getDefaultLabel(), type: roomType });
        setStep('create_code');
      } catch (err) {
        setError(err.message || 'Failed to create room. Please try again.');
      }
    } else {
      setStep('join_code');
    }
  };

  const getDefaultLabel = () => {
    return roomType === 'couple' ? 'To my love 🌙' : 'For the family 🌸';
  };

  const handleCopyCode = () => {
    if (!roomState?.room?.code) return;
    navigator.clipboard.writeText(roomState.room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!roomState?.room?.code) return;
    const text = `Join my WhisperWall wallpaper room! Pair with code: ${roomState.room.code}. Let's share notes on our screens: ${window.location.origin}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    const win = window.open(whatsappUrl, '_blank');
    if (!win) {
      window.location.href = whatsappUrl;
    }
  };

  const handleShareCode = () => {
    if (!roomState?.room?.code) return;
    const text = `Join my WhisperWall wallpaper room! Pair with code: ${roomState.room.code}. Let's share notes on our screens.`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join WhisperWall',
        text: text,
        url: window.location.origin
      }).catch(() => {
        handleWhatsAppShare();
      });
    } else {
      handleWhatsAppShare();
    }
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setError('Please enter the 6-character code');
      return;
    }
    if (joinCode.trim().length !== 6) {
      setError('Code must be exactly 6 characters');
      return;
    }
    setError('');
    onJoinRoom({
      code: joinCode.trim().toUpperCase(),
      name: name.trim(),
      label: label.trim() || getDefaultLabel()
    }).catch(err => {
      setError(err.message || 'Failed to join. Please check code.');
    });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center z-10 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back Button */}
        {step === 'profile' ? (
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-theme-dark/70 hover:text-theme-dark font-semibold text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        ) : (
          <button 
            onClick={() => {
              setError('');
              setStep('profile');
            }}
            className="flex items-center gap-1.5 text-theme-dark/70 hover:text-theme-dark font-semibold text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Profile
          </button>
        )}

        {/* Profile / Basic Settings Form */}
        {step === 'profile' && (
          <div className="glass-card rounded-[32px] p-8 shadow-soft border border-white/50 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-extrabold text-theme-dark flex items-center justify-center gap-2">
                Let's set you up {roomType === 'couple' ? '💕' : '👨👩👧'}
              </h2>
              <p className="text-xs text-theme-dark/70 mt-1">
                Customize how your notes will be signed on the screen
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-2xl mb-4 border border-red-100 text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-theme-dark mb-1.5 ml-1">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Liam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full glass-input px-4 py-3 rounded-2xl text-sm"
                  maxLength={15}
                  required
                />
              </div>

              {/* Custom Label */}
              <div>
                <label className="block text-xs font-bold text-theme-dark mb-1.5 ml-1">Display Label (e.g. signature overlay)</label>
                <input
                  type="text"
                  placeholder={`Default: ${roomType === 'couple' ? 'To my love 🌙' : 'For the family 🌸'}`}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full glass-input px-4 py-3 rounded-2xl text-sm"
                  maxLength={20}
                />
              </div>

              {/* Room Type Selector */}
              <div>
                <label className="block text-xs font-bold text-theme-dark mb-2 ml-1">Pairing Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRoomType('couple')}
                    className={`py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      roomType === 'couple'
                        ? 'bg-theme-primary text-white border border-transparent shadow-inner'
                        : 'bg-white/40 border border-theme-accent/40 text-theme-dark hover:bg-white/60'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${roomType === 'couple' ? 'fill-current' : ''}`} /> Couple
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomType('family')}
                    className={`py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      roomType === 'family'
                        ? 'bg-theme-primary text-white border border-transparent shadow-inner'
                        : 'bg-white/40 border border-theme-accent/40 text-theme-dark hover:bg-white/60'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" /> Family (up to 5)
                  </button>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => handleProfileSubmit('create')}
                  disabled={loading}
                  className="glass-button-primary w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create a Room 💌'}
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-theme-dark/10"></div>
                  <span className="flex-shrink mx-4 text-theme-dark/40 text-xs font-bold">OR</span>
                  <div className="flex-grow border-t border-theme-dark/10"></div>
                </div>

                <button
                  type="button"
                  onClick={() => handleProfileSubmit('join')}
                  className="glass-button w-full py-3.5 rounded-2xl font-bold text-sm border-theme-primary/30 flex items-center justify-center gap-2"
                >
                  Join with Code <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generate / Share Room Code screen */}
        {step === 'create_code' && (
          <div className="glass-card rounded-[32px] p-8 shadow-soft border border-white/50 animate-fade-in text-center">
            {loading ? (
              <div className="py-12 flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-theme-primary" />
                <p className="font-bold text-theme-dark text-sm">Generating your connection...</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h2 className="text-2xl font-extrabold text-theme-dark">Pair Your Wallpapers</h2>
                  <p className="text-xs text-theme-dark/75 mt-1">
                    Share this unique code with your partner or family member. Once they enter it, your screens will link!
                  </p>
                </div>

                {/* Secret Code Card */}
                <div className="my-6 glass-card-pink border border-theme-primary/30 rounded-3xl p-6 relative overflow-hidden">
                  <span className="block text-xs font-bold text-theme-dark/60 tracking-wider uppercase mb-1">
                    Your Pairing Code
                  </span>
                  <span className="block text-4xl md:text-5xl font-extrabold tracking-widest text-theme-dark font-mono select-all">
                    {roomState?.room?.code || '------'}
                  </span>

                  {/* Bubble hearts details inside card */}
                  <div className="absolute -bottom-6 -right-6 text-theme-primary/10 opacity-20 pointer-events-none">
                    <Heart className="w-24 h-24 fill-current" />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                  <button
                    onClick={handleCopyCode}
                    type="button"
                    className="glass-button px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border-theme-primary/20"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy Code
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleWhatsAppShare}
                    type="button"
                    className="px-4 py-3 bg-[#25D366] hover:bg-[#20BA56] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-11.597c-.059-.132-.218-.211-.456-.33-.238-.12-1.411-.696-1.63-.775-.219-.078-.379-.118-.539.12-.16.239-.619.776-.757.935-.138.159-.276.179-.515.059-.239-.12-.988-.364-1.882-1.161-.7-.624-1.171-1.396-1.309-1.635-.138-.238-.015-.367.105-.486.108-.107.239-.279.359-.418.12-.139.16-.239.239-.398.08-.159.04-.298-.02-.418-.06-.12-.539-1.3-.74-1.785-.195-.47-.393-.406-.54-.414-.137-.007-.294-.008-.452-.008-.157 0-.414.059-.63.297-.218.238-.83.812-.83 1.982 0 1.17.852 2.3 1.01 2.507.159.208 1.671 2.553 4.05 3.58.566.244 1.008.389 1.353.498.57.181 1.088.155 1.498.094.457-.069 1.41-.577 1.609-1.137.199-.56.199-1.042.139-1.137z"/>
                    </svg>
                    WhatsApp Share
                  </button>

                  <button
                    onClick={handleShareCode}
                    type="button"
                    className="glass-button px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border-theme-primary/20"
                  >
                    <Share2 className="w-4 h-4" /> System Share
                  </button>
                </div>

                {/* Waiting Animation and list */}
                <div className="border-t border-theme-dark/10 pt-6 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="w-5 h-5 text-theme-primary fill-current animate-ping" />
                    <span className="text-xs font-bold text-theme-dark">
                      Waiting for partner to join...
                    </span>
                  </div>

                  {/* Member Connections list */}
                  <div className="w-full bg-white/35 rounded-2xl p-4 border border-white/50 text-left">
                    <span className="block text-xs font-bold text-theme-dark/60 mb-2">
                      Members in Room ({roomState?.members?.length || 1}/
                      {roomState?.room?.type === 'couple' ? 2 : 5}):
                    </span>
                    <div className="space-y-2">
                      {roomState?.members?.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 text-xs font-semibold text-theme-dark">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span>
                            {m.name} <span className="text-theme-dark/60 font-normal">({m.label || 'no label'})</span>
                            {m.device_id === roomState?.member?.device_id && ' (You)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Enter Code to Join Room screen */}
        {step === 'join_code' && (
          <form 
            onSubmit={handleJoinSubmit}
            className="glass-card rounded-[32px] p-8 shadow-soft border border-white/50 animate-fade-in"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-extrabold text-theme-dark">Connect to Partner</h2>
              <p className="text-xs text-theme-dark/70 mt-1">
                Enter the 6-character secret pairing code shared with you
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-2xl mb-4 border border-red-100 text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-theme-dark mb-1.5 ml-1">Pairing Code</label>
                <input
                  type="text"
                  placeholder="e.g. AB4F92"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full glass-input px-4 py-3 rounded-2xl text-center font-mono text-xl tracking-widest uppercase"
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="glass-button-primary w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join Wallpaper Room 💌'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
