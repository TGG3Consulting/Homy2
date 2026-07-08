"use client";

import React from "react";

const COLORS = [
  { id: "violet", r: 139, g: 108, b: 255, label: "Violet" },
  { id: "terracotta", r: 198, g: 108, b: 78, label: "Terracotta" },
  { id: "coral", r: 255, g: 138, b: 101, label: "Coral" },
  { id: "amber", r: 212, g: 148, b: 72, label: "Amber" },
  { id: "peach", r: 215, g: 150, b: 120, label: "Peach" },
  { id: "rose", r: 210, g: 120, b: 150, label: "Rose" },
  { id: "mint", r: 130, g: 200, b: 170, label: "Mint" },
  { id: "honey", r: 200, g: 155, b: 80, label: "Honey" },
];

export default function ColorSelector({ selected, onSelect, isLightBg = false }) {
  return (
    <div className="flex items-center gap-2.5">
      {COLORS.map((color) => (
        <button
          key={color.id}
          onClick={() => onSelect(color)}
          className="relative w-3.5 h-3.5 rounded-full transition-all duration-300"
          style={{
            backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
            opacity: selected.id === color.id ? 1 : 0.3,
            transform: selected.id === color.id ? "scale(1.35)" : "scale(1)",
            boxShadow: selected.id === color.id
              ? `0 0 0 2px ${isLightBg ? "#FAF5EF" : "#111827"}, 0 0 0 3px rgba(${color.r},${color.g},${color.b},0.5)`
              : "none",
          }}
          title={color.label}
        />
      ))}
    </div>
  );
}

export { COLORS };
