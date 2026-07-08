"use client";

import React, { useState } from "react";
import { Star, MapPin, Bed, Maximize2, ChevronUp, Heart, Scale, Calendar, MessageCircle } from "lucide-react";

const ACCENT = { r: 139, g: 108, b: 255 };
const accent = "rgb(10, 96, 69)";
const accentLight = "rgba(10, 96, 69, 0.08)";

export default function PropertyCard({ property, isSelected, onSelect, onViewDetails, hasExistingViewing = false }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const isTop = property.is_top_choice;

  return (
    <div
      className="relative rounded-2xl border transition-all duration-400 cursor-pointer overflow-hidden group"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(10px)",
        borderColor: isSelected
          ? "rgba(10, 96, 69, 0.4)"
          : isTop
            ? "rgba(10, 96, 69, 0.2)"
            : "rgba(200, 196, 188, 0.35)",
        boxShadow: isSelected
          ? "0 8px 32px rgba(10, 96, 69, 0.08), 0 0 0 1px rgba(10, 96, 69, 0.12)"
          : isTop
            ? "0 4px 20px rgba(10, 96, 69, 0.04)"
            : "0 2px 8px rgba(0,0,0,0.02)",
        transform: isSelected ? "scale(1.01)" : "scale(1)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(property.id)}
    >
      {isTop && (
        <div
          className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-medium font-body uppercase tracking-wider flex items-center gap-1"
          style={{ backgroundColor: accent, color: "#FFF" }}
        >
          <Star size={10} fill="white" />
          Top choice
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={property.image_url}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />

        {/* Price overlay */}
        <div className="absolute bottom-3 left-3">
          <span className="text-white text-[15px] font-semibold font-body tracking-tight">
            {property.price.toLocaleString()} AMD
          </span>
          <span className="text-white/70 text-[11px] font-body ml-1">/month</span>
        </div>

        {/* Match score badge */}
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold font-body"
          style={{
            backgroundColor: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(8px)",
            color: property.match_score >= 90 ? accent : "#3D3B37",
          }}
        >
          {property.match_score}% match
        </div>

        {/* Hover actions */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 transition-all duration-300"
          style={{ opacity: isHovered ? 1 : 0, transform: `translate(-50%, -50%) translateY(${isHovered ? 0 : 8}px)` }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails?.(property); }}
            className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            style={{ backgroundColor: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)" }}
            title="View details"
          >
            <ChevronUp size={16} style={{ color: "#1A1A1A" }} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsSaved(!isSaved); }}
            className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            style={{ backgroundColor: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)" }}
            title="Save"
          >
            <Heart size={15} fill={isSaved ? accent : "none"} style={{ color: isSaved ? accent : "#1A1A1A" }} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            style={{ backgroundColor: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)" }}
            title="Compare"
          >
            <Scale size={15} style={{ color: "#1A1A1A" }} />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin size={12} style={{ color: "#B5B3AD" }} />
          <span className="text-[12px] font-body font-medium" style={{ color: "#757570" }}>
            {property.neighborhood}
          </span>
        </div>

        <h3
          className="text-[15px] font-body font-semibold leading-snug mb-3"
          style={{ color: "#1A1A1A" }}
        >
          {property.title}
        </h3>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <Bed size={13} style={{ color: "#B5B3AD" }} />
            <span className="text-[12px] font-body" style={{ color: "#3D3B37" }}>
              {property.bedrooms} {property.bedrooms === 1 ? "bed" : "beds"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Maximize2 size={13} style={{ color: "#B5B3AD" }} />
            <span className="text-[12px] font-body" style={{ color: "#3D3B37" }}>
              {property.size_sqm} m²
            </span>
          </div>
          <span className="text-[12px] font-body" style={{ color: "#A09D96" }}>
            Floor {property.floor}
          </span>
        </div>

        {/* Recommendation reasons */}
        <div className="space-y-1.5 mb-2">
          {property.recommendation_reasons?.map((reason, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[10px] mt-[3px] flex-shrink-0" style={{ color: accent }}>+</span>
              <span className="text-[12px] font-body leading-relaxed" style={{ color: "#5C5A55" }}>
                {reason}
              </span>
            </div>
          ))}
        </div>

        {/* Warning */}
        {property.warning && (
          <div className="flex items-start gap-1.5">
            <span className="text-[10px] mt-[3px] flex-shrink-0" style={{ color: "#D4A54A" }}>!</span>
            <span className="text-[11px] font-body leading-relaxed" style={{ color: "#9E8E6E" }}>
              {property.warning}
            </span>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div
        className="px-4 pb-3 flex items-center gap-2"
        style={{ opacity: isHovered || isSelected ? 1 : 0.5 }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); }}
          disabled={hasExistingViewing}
          className="flex-1 py-2 rounded-full text-[11px] font-body font-medium transition-all duration-200 flex items-center justify-center gap-1.5"
          style={{
            backgroundColor: hasExistingViewing ? "#9CA3AF" : (isTop ? accent : accentLight),
            color: hasExistingViewing ? "#FFF" : (isTop ? "#FFF" : accent),
            cursor: hasExistingViewing ? "not-allowed" : "pointer",
            opacity: hasExistingViewing ? 0.6 : 1,
          }}
        >
          <Calendar size={12} />
          {hasExistingViewing ? "Просмотр запланирован" : "Schedule viewing"}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); }}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:shadow-sm"
          style={{ backgroundColor: "rgba(232, 230, 225, 0.5)" }}
          title="Ask Homly"
        >
          <MessageCircle size={13} style={{ color: "#757570" }} />
        </button>
      </div>
    </div>
  );
}
