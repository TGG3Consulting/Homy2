"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

const examplePrompts = [
  "Семейная квартира в Арабкире до $80,000",
  "Дом с садом рядом с хорошей школой",
  "Студия в центре с современным ремонтом",
];

export default function SearchField({ onTypingChange, accentColor = { r: 139, g: 108, b: 255 }, isLightBg = false }) {
  const ac = `rgb(${accentColor.r}, ${accentColor.g}, ${accentColor.b})`;
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setValue(e.target.value);
    onTypingChange?.(e.target.value.length > 0);
  };

  const handleSubmit = (e, promptValue) => {
    e?.preventDefault();
    const query = promptValue || value.trim();
    if (!query) return;
    router.push("/results?query=" + encodeURIComponent(query));
  };

  const hasValue = value.trim().length > 0;
  const textColor = isLightBg ? "#1A1A1A" : "#F7F7F5";
  const borderIdle = isLightBg ? "rgba(26, 26, 26, 0.08)" : "rgba(255, 255, 255, 0.08)";
  const bgColor = isLightBg ? "rgba(255, 255, 255, 0.55)" : "rgba(255, 255, 255, 0.06)";
  const glowAlpha = isLightBg ? 0.05 : 0.12;
  const shadowIdle = isLightBg ? "0 2px 16px rgba(0,0,0,0.05)" : "0 2px 16px rgba(0,0,0,0.15)";
  const shadowFocus = isLightBg
    ? `0 0 0 3px rgba(${accentColor.r},${accentColor.g},${accentColor.b},0.08), 0 8px 40px rgba(0,0,0,0.06)`
    : `0 0 0 3px rgba(${accentColor.r},${accentColor.g},${accentColor.b},0.1), 0 8px 40px rgba(0,0,0,0.3)`;

  return (
    <div className="w-full max-w-[660px] mx-auto space-y-5">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {/* Glow layer */}
          <div
            className="absolute -inset-2 rounded-[24px] transition-opacity duration-700 pointer-events-none"
            style={{
              opacity: isFocused ? 1 : 0,
              background: `radial-gradient(ellipse at center, rgba(${accentColor.r},${accentColor.g},${accentColor.b},${glowAlpha}) 0%, transparent 70%)`,
            }}
          />
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Расскажите, какой дом вы ищете…"
            className="
              relative w-full
              rounded-[22px]
              py-5 pl-7 pr-16
              text-[16px] font-body font-normal
              placeholder:font-light
              outline-none
              transition-all duration-500
            "
            style={{
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: isFocused
                ? `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, 0.5)`
                : borderIdle,
              color: textColor,
              backgroundColor: bgColor,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: isFocused ? shadowFocus : shadowIdle,
            }}
          />
          <button
            type="submit"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              backgroundColor: hasValue ? ac : "transparent",
              opacity: hasValue ? 1 : 0.25,
              transform: `translateY(-50%) scale(${hasValue ? 1 : 0.85})`,
            }}
          >
            <ArrowRight size={18} strokeWidth={2.5} style={{ color: hasValue ? "#FFF" : ac }} />
          </button>
        </div>
      </form>

      {/* Example prompts */}
      <div className="flex items-center gap-2.5 justify-center flex-wrap">
        {examplePrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSubmit(null, prompt)}
            className="
              px-4 py-2 rounded-full
              text-[12.5px] font-body font-medium
              transition-all duration-300
              hover:-translate-y-0.5
            "
            style={{
              backgroundColor: `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, ${isLightBg ? "0.07" : "0.08"})`,
              color: `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, 0.9)`,
              border: `1px solid rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, 0.15)`,
            }}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
