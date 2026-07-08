import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "@/lib/i18n";
import NetworkBackground from "@/components/homly/NetworkBackground";
import SearchField from "@/components/homly/SearchField";
import TrustMetrics from "@/components/homly/TrustMetrics";
import WhatHomlyDoes from "@/components/homly/WhatHomlyDoes";
import UserTypeChips from "@/components/homly/UserTypeChips";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const BG = "#F3F2EF";

export default function Home() {
  const { t } = useT();
  const [isTyping, setIsTyping] = useState(false);

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center px-6"
      style={{
        background: `radial-gradient(ellipse at 50% 35%, #F8F7F5 0%, ${BG} 70%)`,
      }}
    >
      <NetworkBackground isTyping={isTyping} accentColor={{ r: 139, g: 108, b: 255 }} isLightBg />

      {/* Language switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher variant="light" />
      </div>

      {/* Wordmark */}
      <h1
        className="relative z-10 font-heading select-none leading-none tracking-tight flex-shrink-0"
        style={{
          fontSize: "clamp(56px, 8.5vw, 110px)",
          fontWeight: 800,
          color: "#242424",
          letterSpacing: "-0.04em",
        }}
      >
        Homly
      </h1>

      {/* Slogan */}
      <p
        className="relative z-10 font-body font-medium text-center mt-1 flex-shrink-0"
        style={{
          fontSize: "clamp(14px, 1.3vw, 17px)",
          color: "#666666",
          letterSpacing: "0.01em",
        }}
      >
        {t("common.tagline")}
      </p>

      {/* Product statement */}
      <p
        className="relative z-10 font-body font-normal text-center mt-2.5 max-w-[580px] flex-shrink-0"
        style={{
          fontSize: "clamp(12px, 1vw, 13.5px)",
          color: "rgba(36,36,36,0.38)",
          lineHeight: "1.55",
        }}
      >
        {t("common.description")}
      </p>

      {/* Search */}
      <div className="relative z-10 mt-4 w-full flex-shrink-0">
        <SearchField onTypingChange={setIsTyping} isLightBg />
      </div>

      {/* Analysis statement */}
      <p
        className="relative z-10 font-body font-normal text-center mt-4 max-w-[560px] flex-shrink-0"
        style={{
          fontSize: "clamp(10px, 0.85vw, 11.5px)",
          color: "rgba(36,36,36,0.32)",
          lineHeight: "1.6",
        }}
      >
        {t("common.analysisStatement")}
      </p>

      {/* How it works link */}
      <Link
        to="/how-it-works"
        className="relative z-10 inline-flex items-center gap-1.5 mt-3 text-[13px] font-body font-medium transition-all duration-200 hover:opacity-60 flex-shrink-0"
        style={{ color: "#8B6CFF" }}
      >
        {t("common.howItWorks")}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </Link>

      {/* Info section */}
      <div className="relative z-10 flex flex-col items-center flex-shrink-0 mt-7 gap-3.5">
        <TrustMetrics />
        <WhatHomlyDoes />
        <UserTypeChips />
      </div>
    </div>
  );
}