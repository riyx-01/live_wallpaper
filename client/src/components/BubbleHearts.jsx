import React, { useState, useEffect, useCallback } from 'react';

const BubbleHearts = ({ trigger, interactive = true }) => {
  const [hearts, setHearts] = useState([]);

  // Helper to create a single heart object
  const createHeart = useCallback((x = null, y = null, isLarge = false) => {
    const id = Math.random().toString(36).substring(2, 9);
    const size = isLarge 
      ? Math.floor(Math.random() * 20) + 30  // 30px to 50px
      : Math.floor(Math.random() * 15) + 15; // 15px to 30px
    const startX = x !== null ? x : Math.floor(Math.random() * 90) + 5; // 5% to 95%
    const duration = Math.floor(Math.random() * 3) + 3; // 3s to 6s
    const delay = Math.random() * 0.5; // 0s to 0.5s delay
    const rotation = Math.floor(Math.random() * 40) - 20; // -20deg to 20deg
    
    // Bubble gradients
    const colors = [
      'from-pink-300/60 to-pink-500/70 border-pink-400/80',
      'from-rose-200/60 to-rose-400/70 border-rose-300/80',
      'from-[#FFD2DB]/60 to-[#E88FA0]/70 border-[#F9C6D0]/80',
    ];
    const colorClass = colors[Math.floor(Math.random() * colors.length)];

    return {
      id,
      x: startX,
      y: y !== null ? y : '100%',
      size,
      duration,
      delay,
      rotation,
      colorClass
    };
  }, []);

  // Trigger heart burst
  useEffect(() => {
    if (trigger) {
      const burstCount = 15;
      const newHearts = [];
      for (let i = 0; i < burstCount; i++) {
        // Spread the burst across the bottom
        const x = 10 + (i * 80) / burstCount + (Math.random() * 6 - 3);
        newHearts.push(createHeart(x, '100%', Math.random() > 0.6));
      }
      setHearts(prev => [...prev, ...newHearts]);

      // Soft cleanup
      const maxDuration = 6.5;
      const timer = setTimeout(() => {
        setHearts(prev => prev.filter(h => !newHearts.some(nh => nh.id === h.id)));
      }, maxDuration * 1000);

      return () => clearTimeout(timer);
    }
  }, [trigger, createHeart]);

  // Ambient hearts generator
  useEffect(() => {
    const interval = setInterval(() => {
      // Spawn 1-2 ambient hearts
      const count = Math.random() > 0.5 ? 2 : 1;
      const ambient = [];
      for (let i = 0; i < count; i++) {
        ambient.push(createHeart());
      }
      setHearts(prev => [...prev, ...ambient]);

      // Cleanup individual heart after its duration
      ambient.forEach(h => {
        setTimeout(() => {
          setHearts(prev => prev.filter(item => item.id !== h.id));
        }, (h.duration + h.delay) * 1000);
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [createHeart]);

  // Click handler to manually spawn hearts on the wallpaper canvas
  const handleCanvasClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100; // x as percentage
    const y = ((e.clientY - rect.top) / rect.height) * 100; // y as percentage
    
    const clickHeart = createHeart(x, `${y}%`, true);
    setHearts(prev => [...prev, clickHeart]);

    setTimeout(() => {
      setHearts(prev => prev.filter(item => item.id !== clickHeart.id));
    }, (clickHeart.duration + clickHeart.delay) * 1000);
  };

  return (
    <div 
      className={`absolute inset-0 z-0 overflow-hidden select-none ${interactive ? 'cursor-pointer' : 'pointer-events-none'}`}
      onClick={interactive ? handleCanvasClick : undefined}
    >
      {hearts.map(heart => (
        <div
          key={heart.id}
          className={`absolute animate-heart-rise pointer-events-none`}
          style={{
            left: `${heart.x}%`,
            top: heart.y,
            width: `${heart.size}px`,
            height: `${heart.size}px`,
            animationDuration: `${heart.duration}s`,
            animationDelay: `${heart.delay}s`,
            transform: `rotate(${heart.rotation}deg)`,
          }}
        >
          {/* Bubble Heart Container */}
          <div className={`relative w-full h-full rounded-full border bg-gradient-to-br ${heart.colorClass} shadow-inner backdrop-blur-[1px]`}>
            {/* Bubble Gloss Highlight */}
            <div className="absolute top-[15%] left-[15%] w-[30%] h-[30%] bg-white/60 rounded-full filter blur-[0.5px]"></div>
            
            {/* Inner Heart SVG */}
            <svg 
              className="absolute inset-0 m-auto w-[60%] h-[60%] text-white fill-current opacity-85" 
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BubbleHearts;
