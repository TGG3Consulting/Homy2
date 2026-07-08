import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n";
import VoiceAssistantButton from "@/components/homly/VoiceAssistantButton";

export default function SearchField({ onTypingChange, accentColor = { r: 139, g: 108, b: 255 }, isLightBg = false }) {
  const { t, lang } = useT();
  const ac = `rgb(${accentColor.r}, ${accentColor.g}, ${accentColor.b})`;
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const examplePrompts = [
    t("searchField.examples.family"),
    t("searchField.examples.quiet"),
    t("searchField.examples.budget"),
  ];

  const handleChange = (e) => {
    setValue(e.target.value);
    onTypingChange?.(e.target.value.length > 0);
  };

  const handleSubmit = (e, promptValue) => {
    e?.preventDefault();
    const query = promptValue || value.trim();
    if (!query) return;
    navigate("/results?query=" + encodeURIComponent(query));
  };

  const hasValue = value.trim().length > 0;
  const textColor = isLightBg ? "#242424" : "#F7F7F5";
  const borderIdle = isLightBg ? "rgba(36,36,36,0.07)" : "rgba(255,255,255,0.08)";
  const bgColor = isLightBg ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.06)";
  const glowAlpha = isLightBg ? 0.04 : 0.12;
  const shadowIdle = isLightBg ? "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" : "0 2px 16px rgba(0,0,0,0.15)";
  const shadowFocus = isLightBg
    ? `0 0 0 3px rgba(${accentColor.r},${accentColor.g},${accentColor.b},0.07), 0 8px 32px rgba(0,0,0,0.05)`
    : `0 0 0 3px rgba(${accentColor.r},${accentColor.g},${accentColor.b},0.1), 0 8px 40px rgba(0,0,0,0.3)`;

  return (
    <div className="w-full max-w-[600px] mx-auto space-y-4">
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
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={t("searchField.placeholder")}
            className="
              relative w-full
              rounded-[20px]
              py-4 pl-6 pr-14
              text-[15px] font-body font-normal
              placeholder:font-light
              outline-none
              transition-all duration-500
            "
            style={{
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: isFocused
                ? `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, 0.4)`
                : borderIdle,
              color: textColor,
              backgroundColor: bgColor,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: isFocused ? shadowFocus : shadowIdle,
            }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <VoiceAssistantButton
              onTranscript={(text) => { setValue(text); handleSubmit(null, text); }}
              lang={lang}
              inputRef={inputRef}
            />
            <button
              type="submit"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                backgroundColor: hasValue ? ac : "transparent",
                opacity: hasValue ? 1 : 0.2,
                transform: `scale(${hasValue ? 1 : 0.85})`,
              }}
            >
              <ArrowRight size={16} strokeWidth={2.5} style={{ color: hasValue ? "#FFF" : ac }} />
            </button>
          </div>
        </div>
      </form>

      {/* Example prompts */}
      <div className="flex items-center gap-2 justify-center flex-wrap">
        {examplePrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSubmit(null, prompt)}
            className="
              px-3.5 py-1.5 rounded-full
              text-[11.5px] font-body font-medium
              transition-all duration-300
              hover:-translate-y-0.5
            "
            style={{
              backgroundColor: `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, ${isLightBg ? "0.05" : "0.08"})`,
              color: `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, ${isLightBg ? "0.8" : "0.9"})`,
              border: `1px solid rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, 0.1)`,
            }}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}