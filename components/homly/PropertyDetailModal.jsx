"use client";

import React, { useEffect } from "react";
import { X, MapPin, Bed, Maximize2, Home, CheckCircle, Star, ShieldCheck, User } from "lucide-react";
import PropertyGallery from "./PropertyGallery";
import PropertyMiniMap from "./PropertyMiniMap";
import PropertyAIChat from "./PropertyAIChat";

function Badge({ icon: Icon, label, color, bgColor }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold font-body"
      style={{ backgroundColor: bgColor || "rgba(10, 96, 69,0.08)", color: color || "#0A6045" }}
    >
      {Icon && <Icon size={11} strokeWidth={2.5} />}
      {label}
    </span>
  );
}

export default function PropertyDetailModal({ property, onClose }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!property) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ backgroundColor: "rgba(15,15,13,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center p-6">
        <div
          className="relative w-full max-w-[910px] rounded-[28px] overflow-hidden shadow-2xl"
          style={{
            maxHeight: "90vh",
            display: "grid",
            gridTemplateColumns: "1fr 270px",
            gridTemplateRows: "minmax(0, 1fr)",
            backgroundColor: "rgba(249,249,247,0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "0 0 0 1px rgba(200,196,188,0.2), 0 25px 80px rgba(0,0,0,0.12), 0 8px 30px rgba(0,0,0,0.06)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{ backgroundColor: "rgba(255,255,255,0.7)", backdropFilter: "blur(10px)", border: "1px solid rgba(200,196,188,0.3)" }}
          >
            <X size={16} style={{ color: "#1A1A1A" }} />
          </button>

          {/* LEFT — Property Details */}
          <div className="overflow-y-auto px-7 py-7 space-y-5 min-w-0" style={{ minHeight: 0 }}>
            {/* Gallery */}
            <PropertyGallery mainImageUrl={property.image_url} />

            {/* Header row */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[26px] font-body font-bold tracking-tight" style={{ color: "#1A1A1A" }}>
                    {property.price.toLocaleString()} AMD
                  </span>
                  <span className="text-[13px] font-body mt-1.5" style={{ color: "#A09D96" }}>
                    / month
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} style={{ color: "#B5B3AD" }} />
                  <span className="text-[14px] font-body font-medium" style={{ color: "#757570" }}>
                    {property.neighborhood} — {property.title.split(" in ")[1] || property.title}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[28px] font-body font-bold tracking-tight" style={{ color: "#0A6045" }}>
                  {property.match_score}%
                </span>
                <span className="text-[10px] font-body uppercase tracking-wider" style={{ color: "#A09D96" }}>
                  match score
                </span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {property.is_top_choice && <Badge icon={Star} label="Homly's top choice" color="#0A6045" bgColor="rgba(10, 96, 69,0.08)" />}
              <Badge icon={ShieldCheck} label="Verified listing" />
              <Badge icon={Home} label={property.neighborhood} color="#757570" bgColor="rgba(117,117,112,0.06)" />
            </div>

            {/* Property specs */}
            <div
              className="flex items-center gap-6 py-3 px-4 rounded-2xl"
              style={{ backgroundColor: "rgba(255,255,255,0.5)", border: "1px solid rgba(200,196,188,0.25)" }}
            >
              <div className="flex items-center gap-2">
                <Bed size={15} style={{ color: "#0A6045" }} />
                <div>
                  <span className="text-[14px] font-semibold font-body" style={{ color: "#1A1A1A" }}>{property.bedrooms}</span>
                  <span className="text-[11px] font-body ml-1" style={{ color: "#A09D96" }}>{property.bedrooms === 1 ? "bedroom" : "bedrooms"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Maximize2 size={15} style={{ color: "#0A6045" }} />
                <div>
                  <span className="text-[14px] font-semibold font-body" style={{ color: "#1A1A1A" }}>{property.size_sqm} m²</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Home size={15} style={{ color: "#0A6045" }} />
                <div>
                  <span className="text-[14px] font-semibold font-body" style={{ color: "#1A1A1A" }}>Floor {property.floor}</span>
                </div>
              </div>
              <span className="text-[12px] font-body" style={{ color: "#757570" }}>
                · Brick building
              </span>
            </div>

            {/* AI Summary */}
            <div>
              <p className="text-[13px] leading-relaxed font-body" style={{ color: "#3D3B37" }}>
                <span className="font-semibold" style={{ color: "#1A1A1A" }}>Homly&apos;s take: </span>
                {property.is_top_choice
                  ? "This is our strongest recommendation for your family. It hits every criterion — budget, bedrooms, school proximity, and neighborhood safety. The 3-bedroom layout means each child gets their own room, and the playground across the street is a rare bonus in Yerevan rentals."
                  : `This ${property.bedrooms}-bedroom apartment in ${property.neighborhood} matches ${property.match_score}% of your criteria. It's a solid option worth considering for your family's needs.`
                }
              </p>
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(10, 96, 69,0.04)", border: "1px solid rgba(10, 96, 69,0.1)" }}>
                <h4 className="text-[11px] font-semibold font-body uppercase tracking-wider mb-2.5" style={{ color: "#0A6045" }}>Advantages</h4>
                <ul className="space-y-2">
                  {property.recommendation_reasons?.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle size={12} className="flex-shrink-0 mt-[2px]" style={{ color: "#0A6045" }} />
                      <span className="text-[12px] font-body leading-snug" style={{ color: "#3D3B37" }}>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {property.warning && (
                <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)" }}>
                  <h4 className="text-[11px] font-semibold font-body uppercase tracking-wider mb-2.5" style={{ color: "#D4A54A" }}>Consideration</h4>
                  <p className="text-[12px] font-body leading-relaxed" style={{ color: "#5C5A55" }}>{property.warning}</p>
                </div>
              )}
            </div>

            {/* Costs breakdown */}
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: "rgba(255,255,255,0.5)", border: "1px solid rgba(200,196,188,0.25)" }}
            >
              <h4 className="text-[11px] font-semibold font-body uppercase tracking-wider mb-3" style={{ color: "#A09D96" }}>Monthly costs</h4>
              <div className="flex items-center gap-6 text-[13px] font-body">
                <div>
                  <span style={{ color: "#A09D96" }}>Rent </span>
                  <span className="font-semibold" style={{ color: "#1A1A1A" }}>{property.price.toLocaleString()} AMD</span>
                </div>
                <div>
                  <span style={{ color: "#A09D96" }}>Utilities </span>
                  <span className="font-semibold" style={{ color: "#1A1A1A" }}>~18,000 AMD</span>
                </div>
                <div>
                  <span style={{ color: "#A09D96" }}>Deposit </span>
                  <span className="font-semibold" style={{ color: "#1A1A1A" }}>1 month</span>
                </div>
              </div>
            </div>

            {/* Mini Map */}
            <div>
              <h4 className="text-[11px] font-semibold font-body uppercase tracking-wider mb-2" style={{ color: "#A09D96" }}>
                Nearby — schools, parks & transit
              </h4>
              <PropertyMiniMap property={property} />
            </div>

            {/* Agent / Owner */}
            <div
              className="rounded-2xl p-4 flex items-center justify-between"
              style={{ backgroundColor: "rgba(255,255,255,0.5)", border: "1px solid rgba(200,196,188,0.25)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(10, 96, 69,0.1)" }}>
                  <User size={18} style={{ color: "#0A6045" }} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold font-body" style={{ color: "#1A1A1A" }}>Anna Hakobyan</p>
                  <p className="text-[11px] font-body" style={{ color: "#A09D96" }}>Verified owner</p>
                </div>
              </div>
              <button
                className="px-4 py-2 rounded-full text-[12px] font-semibold font-body transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: "#0A6045", color: "#FFF" }}
              >
                Contact
              </button>
            </div>

            <div className="h-4" />
          </div>

          {/* RIGHT — AI Chat */}
          <div
            className="flex flex-col px-5 py-7 overflow-hidden border-l"
            style={{ minHeight: 0, borderColor: "rgba(200,196,188,0.25)", backgroundColor: "rgba(255,255,255,0.3)" }}
          >
            <PropertyAIChat property={property} />
          </div>
        </div>
      </div>
    </div>
  );
}
