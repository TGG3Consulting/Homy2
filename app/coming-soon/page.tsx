'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export default function ComingSoon() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#0a0a0f] flex items-center justify-center">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-[800px] h-[800px] rounded-full blur-[120px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(10, 96, 69,0.3) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'pulse 4s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(108,156,255,0.2) 0%, transparent 70%)',
            top: '30%',
            left: '30%',
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[80px]"
          style={{
            background: 'radial-gradient(circle, rgba(255,108,208,0.15) 0%, transparent 70%)',
            top: '60%',
            right: '20%',
            animation: 'float 6s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `particle ${5 + Math.random() * 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div
        className="relative z-10 text-center px-6"
        style={{
          transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        {/* Logo container with glow */}
        <div
          className={`relative mb-8 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          style={{
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
            transition: 'transform 0.2s ease-out, opacity 1s ease-out',
          }}
        >
          {/* Logo glow effect */}
          <div
            className="absolute inset-0 blur-[60px] opacity-60"
            style={{
              background: 'radial-gradient(circle, rgba(10, 96, 69,0.8) 0%, transparent 70%)',
              animation: 'glow 3s ease-in-out infinite',
            }}
          />

          {/* Logo with ring animation */}
          <div className="relative">
            {/* Outer ring */}
            <div
              className="absolute inset-[-40px] rounded-full border border-[#0A6045]/20"
              style={{ animation: 'spin 20s linear infinite' }}
            />
            {/* Middle ring */}
            <div
              className="absolute inset-[-25px] rounded-full border border-[#0A6045]/30"
              style={{ animation: 'spin 15s linear infinite reverse' }}
            />
            {/* Inner ring with dots */}
            <div
              className="absolute inset-[-10px] rounded-full border border-[#0A6045]/40"
              style={{ animation: 'spin 10s linear infinite' }}
            >
              <div className="absolute w-2 h-2 bg-[#0A6045] rounded-full -top-1 left-1/2 -translate-x-1/2" />
              <div className="absolute w-2 h-2 bg-[#0A6045] rounded-full -bottom-1 left-1/2 -translate-x-1/2" />
            </div>

            {/* Main logo */}
            <div
              className="relative w-32 h-32 mx-auto flex items-center justify-center"
              style={{ animation: 'float 4s ease-in-out infinite' }}
            >
              <Image
                src="/logo/homy_brand_purple.svg"
                alt="Homy"
                width={120}
                height={120}
                className="drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>

        {/* Coming Soon text */}
        <div
          className={`transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <h1
            className="text-5xl md:text-7xl font-bold tracking-tight mb-4"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #0A6045 50%, #ffffff 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradient 5s ease infinite',
            }}
          >
            Coming Soon
          </h1>

          <p className="text-lg md:text-xl text-white/50 font-light mb-8 max-w-md mx-auto">
            We&apos;re building something amazing. Stay tuned for the future of real estate.
          </p>
        </div>

        {/* Animated line */}
        <div
          className={`mt-16 h-px w-48 mx-auto transition-all duration-1000 delay-900 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
          style={{
            background: 'linear-gradient(90deg, transparent, #0A6045, transparent)',
          }}
        />

        {/* G3 Consulting - Parent Company */}
        <div
          className={`mt-8 flex flex-col items-center gap-2 transition-all duration-1000 delay-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
        >
          <p className="text-white/30 text-xs">A project by</p>
          <Image
            src="/logo/g3_logo.png"
            alt="G3 Consulting"
            width={300}
            height={140}
            className="opacity-90 hover:opacity-100 transition-opacity duration-300"
          />
        </div>

        <p
          className={`mt-6 text-white/20 text-xs transition-all duration-1000 delay-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          Homy &copy; 2026. All rights reserved.
        </p>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        @keyframes glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes particle {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
        }

        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
