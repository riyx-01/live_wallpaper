import React from 'react';

const CloudyBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-gradient-to-b from-[#FFF5F7] via-[#FFEBEF] to-[#FFF0F4]">
      {/* Cloud Group 1 - Slow */}
      <div className="absolute top-[10%] left-0 w-[450px] h-[180px] opacity-40 animate-cloud-slow">
        <div className="absolute w-[200px] h-[120px] bg-white cloud-shape rounded-full top-0 left-0"></div>
        <div className="absolute w-[250px] h-[150px] bg-white cloud-shape rounded-full top-[10px] left-[100px]"></div>
        <div className="absolute w-[180px] h-[110px] bg-white cloud-shape rounded-full top-[30px] left-[250px]"></div>
      </div>

      {/* Cloud Group 2 - Medium */}
      <div className="absolute top-[45%] left-0 w-[380px] h-[140px] opacity-30 animate-cloud-medium" style={{ animationDelay: '-15s' }}>
        <div className="absolute w-[150px] h-[100px] bg-white cloud-shape rounded-full top-[20px] left-0"></div>
        <div className="absolute w-[200px] h-[130px] bg-white cloud-shape rounded-full top-0 left-[80px]"></div>
        <div className="absolute w-[160px] h-[90px] bg-white cloud-shape rounded-full top-[15px] left-[200px]"></div>
      </div>

      {/* Cloud Group 3 - Fast */}
      <div className="absolute top-[75%] left-0 w-[500px] h-[200px] opacity-35 animate-cloud-fast" style={{ animationDelay: '-8s' }}>
        <div className="absolute w-[180px] h-[110px] bg-white cloud-shape rounded-full top-[40px] left-0"></div>
        <div className="absolute w-[280px] h-[160px] bg-white cloud-shape rounded-full top-0 left-[110px]"></div>
        <div className="absolute w-[210px] h-[130px] bg-white cloud-shape rounded-full top-[30px] left-[280px]"></div>
      </div>

      {/* Soft Ambient Bubbles */}
      <div className="absolute top-[20%] right-[15%] w-72 h-72 rounded-full bg-gradient-to-tr from-[#FFF0F4] to-[#FFE3E8] filter blur-3xl opacity-60 animate-pulse-soft"></div>
      <div className="absolute bottom-[15%] left-[10%] w-96 h-96 rounded-full bg-gradient-to-bl from-[#FFE6EB] to-[#FFF0F4] filter blur-3xl opacity-50 animate-pulse-soft" style={{ animationDelay: '-1.5s' }}></div>
    </div>
  );
};

export default CloudyBackground;
