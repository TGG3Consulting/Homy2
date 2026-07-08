import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, MapPin, Bed, Maximize2, ChevronUp, Heart, Scale, Calendar, MessageCircle, ShieldCheck, Car, Leaf } from "lucide-react";
import { useT, getLocalized } from "@/lib/i18n";

export default function PropertyCard({ property, isSelected, onSelect, onViewDetails }) {
  const { t, lang } = useT();
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();

  const isTop = property.is_top_choice;
  const title = getLocalized(property.title, lang);
  const neighborhood = getLocalized(property.neighborhood, lang);

  const glassStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
  };

  return (
    <div
      className="relative rounded-2xl border transition-all duration-400 cursor-pointer overflow-hidden group flex flex-col"
      style={{
        ...glassStyle,
        borderColor: isSelected
          ? "rgba(0, 0, 0, 0.25)"
          : isTop
            ? "rgba(0, 0, 0, 0.15)"
            : "rgba(255, 255, 255, 0.5)",
        boxShadow: isSelected
          ? "0 8px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)"
          : isTop
            ? "0 4px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.7)"
            : "0 2px 8px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.7)",
        transform: isSelected ? "scale(1.01)" : "scale(1)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(property.id)}
    >
      {isTop && (
        <div
          className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-medium font-body uppercase tracking-wider flex items-center gap-1"
          style={{ backgroundColor: "#1A1A1A", color: "#FFF" }}
        >
          <Star size={10} fill="white" />
          {t("propertyCard.topChoice")}
          </div>
          )}

          {/* Image */}
          <div className="relative aspect-[16/10] overflow-hidden">
          <img
          src={property.image_url}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />

        {/* Price overlay */}
        <div className="absolute bottom-3 left-3">
          <span className="text-white text-[15px] font-semibold font-body tracking-tight">
            {property.price.toLocaleString()} AMD
          </span>
          <span className="text-white/70 text-[11px] font-body ml-1">{t("propertyCard.month")}</span>
        </div>

        {/* Match score badge */}
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold font-body"
          style={{
            backgroundColor: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(8px)",
            color: property.match_score >= 90 ? "#1A1A1A" : "#3D3B37",
          }}
        >
          {property.match_score}% {t("propertyCard.match")}
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
            title={t("propertyCard.viewDetails")}
          >
            <ChevronUp size={16} style={{ color: "#1A1A1A" }} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsSaved(!isSaved); }}
            className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            style={{ backgroundColor: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)" }}
            title={t("propertyCard.save")}
          >
            <Heart size={15} fill={isSaved ? "#1A1A1A" : "none"} style={{ color: isSaved ? "#1A1A1A" : "#1A1A1A" }} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            style={{ backgroundColor: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)" }}
            title={t("propertyCard.compare")}
          >
            <Scale size={15} style={{ color: "#1A1A1A" }} />
          </button>
        </div>
      </div>

      {/* Details — Liquid Glass content area */}
      <div className="p-4 flex-1">
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin size={12} style={{ color: "#757570" }} />
          <span className="text-[12px] font-body font-medium" style={{ color: "#757570" }}>
            {neighborhood}
          </span>
        </div>

        <h3
          className="text-[15px] font-body font-semibold leading-snug mb-3"
          style={{ color: "#1A1A1A" }}
        >
          {title}
        </h3>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <Bed size={13} style={{ color: "#757570" }} />
            <span className="text-[12px] font-body" style={{ color: "#3D3B37" }}>
              {property.bedrooms} {property.bedrooms === 1 ? t("propertyCard.bed") : t("propertyCard.beds")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Maximize2 size={13} style={{ color: "#757570" }} />
            <span className="text-[12px] font-body" style={{ color: "#3D3B37" }}>
              {property.size_sqm} m²
            </span>
          </div>
          <span className="text-[12px] font-body" style={{ color: "#A09D96" }}>
            {t("propertyCard.floor")} {property.floor}
          </span>
        </div>

        {/* AI insight badges */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-body font-medium" style={{ backgroundColor: "rgba(34,197,94,0.10)", color: "#16A34A", border: "1px solid rgba(34,197,94,0.18)" }}>
            <ShieldCheck size={9} />{t("propertyCard.badges.developerChecked")}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-body font-medium" style={{ backgroundColor: "rgba(59,130,246,0.10)", color: "#2563EB", border: "1px solid rgba(59,130,246,0.18)" }}>
            <Car size={9} />{t("propertyCard.badges.commuteAnalyzed")}
          </span>
          {property.match_score >= 85 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-body font-medium" style={{ backgroundColor: "rgba(34,197,94,0.10)", color: "#16A34A", border: "1px solid rgba(34,197,94,0.18)" }}>
              <Leaf size={9} />{t("propertyCard.badges.goodEcology")}
            </span>
          )}
        </div>

        {/* Recommendation reasons */}
        <div className="space-y-1.5 mb-2">
          {property.recommendation_reasons?.map((reason, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[10px] mt-[3px] flex-shrink-0" style={{ color: "#1A1A1A" }}>+</span>
              <span className="text-[12px] font-body leading-relaxed" style={{ color: "#5C5A55" }}>
                {reason}
              </span>
            </div>
          ))}
        </div>

        {/* Warning */}
        {property.warning && (
          <div className="flex items-start gap-1.5">
            <span className="text-[10px] mt-[3px] flex-shrink-0" style={{ color: "#5C5A55" }}>!</span>
            <span className="text-[11px] font-body leading-relaxed" style={{ color: "#757570" }}>
              {property.warning}
            </span>
          </div>
        )}
      </div>

      {/* Bottom actions — always visible, fixed at bottom */}
      <div className="px-4 pb-3 flex items-center gap-2 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/schedule?propertyId=${property.id}`); }}
          className="flex-1 py-2 rounded-full text-[11px] font-body font-medium transition-all duration-200 flex items-center justify-center gap-1.5 hover:shadow-sm"
          style={{
            backgroundColor: "rgb(139, 108, 255)",
            color: "#FFF",
          }}
        >
          <Calendar size={12} />
          {t("propertyCard.scheduleViewing")}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); }}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:shadow-sm"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.04)", border: "1px solid rgba(0,0,0,0.06)" }}
          title={t("propertyCard.askHomly")}
        >
          <MessageCircle size={13} style={{ color: "#757570" }} />
        </button>
      </div>
    </div>
  );
}