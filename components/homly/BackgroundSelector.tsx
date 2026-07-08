'use client';

import React from "react";
import { Palette } from "lucide-react";

export interface BackgroundOption {
  id: string;
  name: string;
  gradient: string;
}

export const BACKGROUNDS: BackgroundOption[] = [
  { id: "frosted", name: "Frosted Glass", gradient: "linear-gradient(165deg, #EEEDEA 0%, #E8E7E3 30%, #F2F1EE 60%, #E5E4E0 100%)" },
  { id: "ivory", name: "Ivory", gradient: "linear-gradient(160deg, #FDFBF7 0%, #F7F2E8 50%, #FDFBF7 100%)" },
  { id: "cream", name: "Cream", gradient: "linear-gradient(160deg, #FFF8F0 0%, #FEF0E0 50%, #FFF8F0 100%)" },
  { id: "warm-beige", name: "Warm Beige", gradient: "linear-gradient(160deg, #FAF5EF 0%, #F2E8DC 50%, #FAF5EF 100%)" },
  { id: "sand", name: "Sand", gradient: "linear-gradient(160deg, #F9F6F0 0%, #F0EBDF 50%, #F9F6F0 100%)" },
  { id: "peach-blush", name: "Peach Blush", gradient: "linear-gradient(160deg, #FEF7F3 0%, #FCE8DA 50%, #FEF7F3 100%)" },
  { id: "honey-warm", name: "Honey", gradient: "linear-gradient(160deg, #FDF9F0 0%, #F8EDD5 50%, #FDF9F0 100%)" },
];

interface BackgroundSelectorProps {
  selected: BackgroundOption;
  onSelect: (bg: BackgroundOption) => void;
  isLightBg?: boolean;
}

export default function BackgroundSelector({ selected, onSelect, isLightBg = false }: BackgroundSelectorProps) {
  const ringColor = isLightBg ? "rgba(26,26,26,0.12)" : "rgba(255,255,255,0.12)";
  const borderSelected = isLightBg ? "1.5px solid rgba(26,26,26,0.35)" : "1.5px solid rgba(255,255,255,0.4)";

  return (
    <div className="flex items-center gap-2">
      <Palette size={11} style={{ color: isLightBg ? "rgba(26,26,26,0.3)" : "rgba(255,255,255,0.3)" }} />
      {BACKGROUNDS.map((bg) => (
        <button
          key={bg.id}
          onClick={() => onSelect(bg)}
          className="relative w-4 h-4 rounded-full transition-all duration-300"
          style={{
            background: bg.gradient,
            opacity: selected.id === bg.id ? 1 : 0.4,
            transform: selected.id === bg.id ? "scale(1.25)" : "scale(1)",
            border: selected.id === bg.id ? borderSelected : `1px solid ${ringColor}`,
            boxShadow: selected.id === bg.id
              ? "0 0 0 3px rgba(10, 96, 69,0.15)"
              : "none",
          }}
          title={bg.name}
        />
      ))}
    </div>
  );
}
