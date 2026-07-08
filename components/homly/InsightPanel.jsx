"use client";

import React from "react";
import { Lightbulb, BarChart3 } from "lucide-react";

export default function InsightPanel() {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.65)",
        backdropFilter: "blur(12px)",
        borderColor: "rgba(200, 196, 188, 0.3)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "rgba(10, 96, 69, 0.1)" }}>
          <Lightbulb size={14} style={{ color: "#0A6045" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] leading-relaxed font-body font-medium"
            style={{ color: "#1A1A1A" }}
          >
            Best overall fit: <span style={{ color: "#0A6045" }}>Arabkir</span>
          </p>
          <p
            className="text-[13px] leading-relaxed font-body mt-1"
            style={{ color: "#757570" }}
          >
            It offers the strongest balance of schools, safety, apartment size and commute time within your budget.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-5 mt-4 pt-4 border-t" style={{ borderColor: "rgba(200, 196, 188, 0.3)" }}>
        <div className="flex items-center gap-2">
          <BarChart3 size={13} style={{ color: "#B5B3AD" }} />
          <div className="flex items-baseline gap-1.5">
            <span className="text-[18px] font-semibold font-body" style={{ color: "#1A1A1A" }}>286</span>
            <span className="text-[11px] font-body" style={{ color: "#A09D96" }}>analyzed</span>
          </div>
        </div>
        <span className="text-[15px] font-light" style={{ color: "#C8C4BC" }}>·</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[18px] font-semibold font-body" style={{ color: "#1A1A1A" }}>18</span>
          <span className="text-[11px] font-body" style={{ color: "#A09D96" }}>suitable</span>
        </div>
        <span className="text-[15px] font-light" style={{ color: "#C8C4BC" }}>·</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[18px] font-semibold font-body" style={{ color: "#0A6045" }}>5</span>
          <span className="text-[11px] font-body" style={{ color: "#A09D96" }}>recommended</span>
        </div>
        <span className="text-[15px] font-light" style={{ color: "#C8C4BC" }}>·</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[18px] font-semibold font-body" style={{ color: "#1A1A1A" }}>3</span>
          <span className="text-[11px] font-body" style={{ color: "#A09D96" }}>neighborhoods</span>
        </div>
      </div>
    </div>
  );
}
