import React, { useState, useMemo } from "react";
import NetworkBackground from "@/components/homly/NetworkBackground";
import SearchField from "@/components/homly/SearchField";
import TrustMetrics from "@/components/homly/TrustMetrics";
import ColorSelector, { COLORS } from "@/components/homly/ColorSelector";
import BackgroundSelector, { BACKGROUNDS } from "@/components/homly/BackgroundSelector";

const LIGHT_BG_IDS = ["frosted", "ivory", "cream", "warm-beige", "sand", "peach-blush", "honey-warm"];

export default function Home() {
  const [isTyping, setIsTyping] = useState(false);
  const [accent, setAccent] = useState(COLORS[0]);
  const [bg, setBg] = useState(BACKGROUNDS[0]);

  const isLightBg = useMemo(() => LIGHT_BG_IDS.includes(bg.id), [bg.id]);

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex flex-col"
      style={{ background: bg.gradient }}
    >
      <NetworkBackground isTyping={isTyping} accentColor={accent} isLightBg={isLightBg} />

      {/* Main content — vertically centered */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Glass card backdrop */}
        <div
          className="absolute inset-x-4 top-[15%] bottom-[15%] rounded-[40px] pointer-events-none"
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "0 25px 80px rgba(0,0,0,0.04), 0 8px 30px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        />

        {/* Wordmark */}
        <h1
          className="font-heading select-none leading-none mb-4 relative"
          style={{
            fontSize: "clamp(72px, 11vw, 140px)",
            fontWeight: 800,
            color: isLightBg ? "#1A1A1A" : "#FFFFFF",
            letterSpacing: "-0.035em",
          }}
        >
          Homly
        </h1>

        {/* Slogan */}
        <p
          className="font-body font-medium text-center mb-14 relative"
          style={{
            fontSize: "clamp(16px, 1.8vw, 21px)",
            color: isLightBg ? "rgba(26, 26, 26, 0.55)" : "rgba(255, 255, 255, 0.55)",
            letterSpacing: "0.01em",
          }}
        >
          Поговори со своим будущим домом
        </p>

        {/* Search */}
        <div className="relative">
          <SearchField onTypingChange={setIsTyping} accentColor={accent} isLightBg={isLightBg} />
        </div>

        {/* Trust Metrics */}
        <div className="mt-20 relative">
          <TrustMetrics accentColor={accent} isLightBg={isLightBg} />
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pb-8 flex items-center justify-center gap-6">
        <p
          className="text-[11px] font-body font-medium tracking-widest uppercase"
          style={{ color: isLightBg ? "rgba(26, 26, 26, 0.22)" : "rgba(255, 255, 255, 0.18)" }}
        >
          AI-поиск недвижимости
        </p>
        <div
          className="w-px h-4"
          style={{ backgroundColor: isLightBg ? "rgba(26, 26, 26, 0.1)" : "rgba(255,255,255,0.1)" }}
        />
        <BackgroundSelector selected={bg} onSelect={setBg} isLightBg={isLightBg} />
        <div
          className="w-px h-4"
          style={{ backgroundColor: isLightBg ? "rgba(26, 26, 26, 0.1)" : "rgba(255,255,255,0.1)" }}
        />
        <ColorSelector selected={accent} onSelect={setAccent} isLightBg={isLightBg} />
      </div>
    </div>
  );
}