"use client";

import React, { useState } from "react";
import { ArrowRight, Sparkles, User, Phone } from "lucide-react";
import FilterChips from "./FilterChips";

const userMessage =
  "We are a family of four with two children. We are looking for a long-term rental apartment in Yerevan for up to 200,000 AMD per month. We need at least two bedrooms, a safe neighborhood and a good school nearby.";

const aiResponse =
  "I analyzed 286 available listings. 18 match your main criteria, and these 5 are the strongest options for your family.";

export default function AIPanel() {
  const [chatValue, setChatValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!chatValue.trim()) return;
    setChatValue("");
  };

  return (
    <div
      className="w-[352px] min-w-[352px] flex flex-col border-l h-full overflow-hidden"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.55)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "rgba(200, 196, 188, 0.3)",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-7 pb-3">
        <span
          className="font-display font-medium tracking-[0.2em] uppercase"
          style={{ fontSize: "18px", color: "#1A1A1A", letterSpacing: "0.2em" }}
        >
          Homy
        </span>
      </div>

      {/* Consultant */}
      <div className="mx-5 mt-3 mb-1 flex items-center gap-3 py-3 px-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.4)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(10, 96, 69,0.1)" }}>
          <User size={18} style={{ color: "#0A6045" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold font-body" style={{ color: "#1A1A1A" }}>Anna Hakobyan</p>
          <p className="text-[10px] font-body" style={{ color: "#A09D96" }}>Personal consultant</p>
        </div>
        <button className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold font-body transition-all duration-200 hover:shadow-sm" style={{ backgroundColor: "#0A6045", color: "#FFF" }}>
          <Phone size={10} />
          Contact
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-5">
        {/* User message */}
        <div className="flex justify-end">
          <div
            className="max-w-[90%] rounded-2xl rounded-br-md px-4 py-3"
            style={{ backgroundColor: "rgba(10, 96, 69, 0.08)" }}
          >
            <p
              className="text-[13px] leading-relaxed font-body"
              style={{ color: "#1A1A1A" }}
            >
              {userMessage}
            </p>
          </div>
        </div>

        {/* AI response */}
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#0A6045" }}>
            <Sparkles size={12} className="text-white" />
          </div>
          <div className="flex-1">
            <p
              className="text-[13px] leading-relaxed font-body font-normal"
              style={{ color: "#3D3B37" }}
            >
              {aiResponse}
            </p>
          </div>
        </div>

        {/* Extracted criteria */}
        <div className="pl-8">
          <p
            className="text-[11px] uppercase tracking-wider font-body font-medium mb-2"
            style={{ color: "#A09D96" }}
          >
            Extracted criteria
          </p>
          <FilterChips />
        </div>
      </div>

      {/* Chat input */}
      <div className="px-5 py-4 border-t" style={{ borderColor: "rgba(200, 196, 188, 0.3)" }}>
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={chatValue}
            onChange={(e) => setChatValue(e.target.value)}
            placeholder="Ask Homy to refine…"
            className="
              w-full bg-transparent border rounded-full
              py-2.5 pl-4 pr-10
              text-[13px] font-body font-normal
              placeholder:font-light outline-none
              transition-all duration-300
            "
            style={{
              borderColor: "rgba(200, 196, 188, 0.5)",
              color: "#1A1A1A",
              backgroundColor: "rgba(255, 255, 255, 0.5)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(10, 96, 69, 0.4)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(10, 96, 69, 0.06)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(200, 196, 188, 0.5)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-opacity duration-200"
            style={{
              opacity: chatValue.trim() ? 1 : 0.3,
              backgroundColor: chatValue.trim() ? "#0A6045" : "transparent",
            }}
          >
            <ArrowRight size={13} strokeWidth={2.5} className="text-white" />
          </button>
        </form>
      </div>

      {/* Contact footer */}
      <div className="px-5 pb-4 border-t pt-3 flex items-center gap-2.5" style={{ borderColor: "rgba(200, 196, 188, 0.3)" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(10, 96, 69,0.1)" }}>
          <User size={14} style={{ color: "#0A6045" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold font-body" style={{ color: "#1A1A1A" }}>Anna Hakobyan</p>
          <p className="text-[9px] font-body" style={{ color: "#A09D96" }}>Personal consultant</p>
        </div>
        <button className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-semibold font-body" style={{ backgroundColor: "#0A6045", color: "#FFF" }}>
          <Phone size={9} />
          Contact
        </button>
      </div>
    </div>
  );
}
