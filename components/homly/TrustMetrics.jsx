"use client";

import React from "react";

const metrics = [
  { value: "1,500", label: "объектов в базе" },
  { value: "15", label: "городов" },
  { value: "350+", label: "сделок" },
];

export default function TrustMetrics({ accentColor = { r: 139, g: 108, b: 255 }, isLightBg = false }) {
  return (
    <div className="flex items-center justify-center gap-10">
      {metrics.map((metric, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-1.5">
            <span
              className="text-[30px] font-heading font-bold tracking-tight"
              style={{ color: isLightBg ? "#1A1A1A" : "#F7F7F5" }}
            >
              {metric.value}
            </span>
            <span
              className="text-[12px] font-body font-medium uppercase tracking-widest"
              style={{ color: isLightBg ? "rgba(26, 26, 26, 0.3)" : "rgba(255, 255, 255, 0.25)" }}
            >
              {metric.label}
            </span>
          </div>
          {i < metrics.length - 1 && (
            <div
              className="w-px h-8"
              style={{ backgroundColor: isLightBg ? "rgba(26, 26, 26, 0.08)" : "rgba(255, 255, 255, 0.08)" }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
