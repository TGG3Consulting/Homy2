'use client';

import React from "react";

export default function ArmeniaOutline() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ opacity: 0.04 }}>
      <svg
        viewBox="0 0 800 900"
        className="absolute w-[700px] h-[787px] animate-breathe"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fill: "none",
          stroke: "#242424",
          strokeWidth: "1.2",
          strokeLinejoin: "round",
          strokeLinecap: "round",
        }}
      >
        {/* Armenia simplified outline */}
        <path d="M250 180 L320 160 L400 140 L480 120 L560 130 L620 160 L660 200 L690 250 L700 320 L690 390 L660 450 L620 500 L570 540 L510 570 L450 590 L390 600 L330 590 L280 560 L240 520 L210 470 L195 410 L200 350 L215 290 L230 240 Z" />
        {/* Inner contour lines */}
        <path d="M270 220 L330 200 L400 185 L470 170 L540 180 L590 210 L625 250 L650 300 L660 370 L645 430 L620 480 L575 520 L520 550 L460 570 L395 575 L335 560 L290 530 L255 490 L228 435 L218 370 L228 310 L245 260" strokeWidth="0.6" opacity="0.7" />
        <path d="M290 260 L340 245 L395 230 L450 220 L510 230 L560 260 L590 300 L610 350 L615 400 L600 450 L570 490 L525 520 L470 540 L410 545 L355 530 L315 500 L285 460 L265 410 L260 355 L270 310 L285 280" strokeWidth="0.4" opacity="0.5" />
        {/* Yerevan dot */}
        <circle cx="395" cy="475" r="2.5" fill="#0A6045" stroke="none" opacity="0.6" />
        {/* Subtle grid lines */}
        {[...Array(8)].map((_, i) => (
          <line key={`h${i}`} x1="160" y1={240 + i * 75} x2="720" y2={240 + i * 75} strokeWidth="0.3" opacity="0.3" />
        ))}
        {[...Array(10)].map((_, i) => (
          <line key={`v${i}`} x1={200 + i * 55} y1="140" x2={200 + i * 55} y2="780" strokeWidth="0.3" opacity="0.3" />
        ))}
      </svg>
    </div>
  );
}
