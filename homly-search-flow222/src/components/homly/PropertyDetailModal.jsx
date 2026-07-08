import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, MapPin, Bed, Maximize2, Home, CheckCircle, Star, ShieldCheck, ArrowLeft } from "lucide-react";
import { useT, getLocalized } from "@/lib/i18n";
import PropertyGallery from "./PropertyGallery";
import PropertyPhotoGallery from "./PropertyPhotoGallery";
import PropertyMiniMap from "./PropertyMiniMap";
import PropertyAIChat from "./PropertyAIChat";
import PropertyIntelligence from "./PropertyIntelligence";
import VirtualTour from "./VirtualTour";
import PropertyActionBar from "./PropertyActionBar";

const violet = "#7B61FF";
const textMain = "#242424";
const textBody = "#555555";
const textMuted = "#666666";
const textLight = "#999999";
const textFaded = "#AAAAAA";

const badgeVariants = {
  violet: {
    color: "#7B61FF",
    borderColor: "rgba(123,97,255,0.35)",
    bg: "rgba(123,97,255,0.06)",
    hoverBg: "rgba(123,97,255,0.12)",
    hoverBorder: "rgba(123,97,255,0.50)",
  },
  graphite: {
    color: "#242424",
    borderColor: "rgba(36,36,36,0.18)",
    bg: "rgba(255,255,255,0.25)",
    hoverBg: "rgba(255,255,255,0.45)",
    hoverBorder: "rgba(36,36,36,0.28)",
  },
  neutral: {
    color: "#555555",
    borderColor: "rgba(36,36,36,0.12)",
    bg: "rgba(255,255,255,0.25)",
    hoverBg: "rgba(255,255,255,0.45)",
    hoverBorder: "rgba(36,36,36,0.20)",
  },
};

function Badge({ icon: Icon, label, variant = "neutral" }) {
  const [isHovered, setIsHovered] = useState(false);
  const s = badgeVariants[variant];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-full text-[12px] font-medium font-body transition-all duration-200 cursor-default select-none"
      style={{
        backgroundColor: isHovered ? s.hoverBg : s.bg,
        border: `1px solid ${isHovered ? s.hoverBorder : s.borderColor}`,
        color: s.color,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: isHovered
          ? "0 2px 10px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.55)"
          : "inset 0 1px 0 rgba(255,255,255,0.40)",
        transform: isHovered ? "translateY(-1px)" : "none",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {Icon && <Icon size={14} strokeWidth={1.75} />}
      {label}
    </span>
  );
}

export default function PropertyDetailModal({ property, onClose }) {
  const { t, lang } = useT();
  const [showGallery, setShowGallery] = useState(false);
  const [showVirtualTour, setShowVirtualTour] = useState(false);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        if (showVirtualTour) setShowVirtualTour(false);
        else if (showGallery) setShowGallery(false);
        else onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, showGallery, showVirtualTour]);

  if (!property) return null;

  const locTitle = getLocalized(property.title, lang);
  const locNeighborhood = getLocalized(property.neighborhood, lang);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{
        background: "radial-gradient(ellipse at 50% 5%, rgba(123,97,255,0.05) 0%, transparent 55%), radial-gradient(ellipse at 85% 95%, rgba(223,163,110,0.08) 0%, transparent 50%), rgba(30,30,30,0.14)",
        backdropFilter: "blur(20px) saturate(120%)",
        WebkitBackdropFilter: "blur(20px) saturate(120%)",
      }}
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center p-6">
        <div
          className="relative w-full max-w-[910px] rounded-[28px] overflow-hidden"
          style={{
            maxHeight: "90vh",
            display: "grid",
            gridTemplateColumns: "1fr 272px",
            gridTemplateRows: "1fr",
            backgroundColor: "rgba(255,255,255,0.68)",
            backdropFilter: "blur(36px) saturate(180%)",
            WebkitBackdropFilter: "blur(36px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.70)",
            boxShadow:
              "0 25px 80px rgba(30,30,30,0.10), 0 8px 24px rgba(30,30,30,0.05), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 0 0 1px rgba(255,255,255,0.30)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* LEFT — Property Details */}
          <div className="overflow-y-auto px-7 py-7 space-y-4 min-w-0" style={{ minHeight: 0 }}>
            {/* Header bar — inside left column only */}
            <div className="flex items-center justify-between">
              <Link
                to="/results"
                className="inline-flex items-center gap-1.5 text-[12px] font-body font-medium transition-all duration-200 hover:opacity-70"
                style={{ color: "#757570" }}
              >
                <ArrowLeft size={14} />
                {t("common.backToSearch")}
              </Link>
              <PropertyActionBar property={property} />
            </div>
            {/* Gallery */}
            <PropertyGallery
              mainImageUrl={property.image_url}
              onSeeAll={() => setShowGallery(true)}
              hasVirtualTour={property.virtual_tour?.enabled}
              onStartTour={() => setShowVirtualTour(true)}
            />

            {/* Header row */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[26px] font-bold font-body tracking-tight" style={{ color: textMain }}>
                    {property.price.toLocaleString()} AMD
                  </span>
                  <span className="text-[13px] font-body mt-1.5" style={{ color: textLight }}>
                    {t("propertyDetail.month")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} style={{ color: textFaded }} />
                  <span className="text-[14px] font-body font-medium" style={{ color: textMuted }}>
                    {locNeighborhood} — {locTitle}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[28px] font-bold font-body tracking-tight" style={{ color: violet }}>
                  {property.match_score}%
                </span>
                <span className="text-[10px] font-body font-medium uppercase tracking-wider" style={{ color: textLight }}>
                  {t("propertyDetail.matchScore")}
                </span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {property.is_top_choice && (
                <Badge icon={Star} label={t("propertyDetail.homlyTopChoice")} variant="violet" />
              )}
              <Badge icon={ShieldCheck} label={t("propertyDetail.verifiedListing")} variant="graphite" />
              <Badge icon={MapPin} label={locNeighborhood} variant="neutral" />
            </div>

            {/* Property specs */}
            <div
              className="flex items-center gap-6 py-3.5 px-5 rounded-2xl"
              style={{
                backgroundColor: "rgba(0,0,0,0.02)",
                border: "1px solid rgba(0,0,0,0.05)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-center gap-2">
                <Bed size={15} style={{ color: textMain }} />
                <div>
                  <span className="text-[14px] font-semibold font-body" style={{ color: textMain }}>{property.bedrooms}</span>
                  <span className="text-[11px] font-body ml-1" style={{ color: textLight }}>{property.bedrooms === 1 ? t("propertyDetail.bedroom") : t("propertyDetail.bedrooms")}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Maximize2 size={15} style={{ color: textMain }} />
                <div>
                  <span className="text-[14px] font-semibold font-body" style={{ color: textMain }}>{property.size_sqm} m²</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Home size={15} style={{ color: textMain }} />
                <div>
                  <span className="text-[14px] font-semibold font-body" style={{ color: textMain }}>{t("propertyCard.floor")} {property.floor}</span>
                </div>
              </div>
              <span className="text-[12px] font-body" style={{ color: textLight }}>
                · {t("propertyDetail.brickBuilding")}
              </span>
            </div>

            {/* AI Summary */}
            <div>
              <p className="text-[13px] leading-relaxed font-body" style={{ color: textBody }}>
                <span className="font-semibold" style={{ color: textMain }}>{t("propertyDetail.homlyTake")}: </span>
                {t("propertyDetail.bestTake")}
              </p>
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
                <h4 className="text-[11px] font-semibold font-body uppercase tracking-wider mb-2.5" style={{ color: textMuted }}>{t("propertyDetail.advantages")}</h4>
                <ul className="space-y-2">
                  {property.recommendation_reasons?.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle size={12} className="flex-shrink-0 mt-[2px]" style={{ color: "#22C55E" }} />
                      <span className="text-[12px] font-body leading-snug" style={{ color: "#444444" }}>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {property.warning && (
                <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(223,163,110,0.18)", border: "1px solid rgba(223,163,110,0.30)" }}>
                  <h4 className="text-[11px] font-semibold font-body uppercase tracking-wider mb-2.5" style={{ color: "#B87333" }}>{t("propertyDetail.consideration")}</h4>
                  <p className="text-[12px] font-body leading-relaxed" style={{ color: textBody }}>{property.warning}</p>
                </div>
              )}
            </div>

            {/* Costs breakdown */}
            <div
              className="rounded-2xl p-4"
              style={{
                backgroundColor: "rgba(0,0,0,0.02)",
                border: "1px solid rgba(0,0,0,0.05)",
                backdropFilter: "blur(12px)",
              }}
            >
              <h4 className="text-[11px] font-semibold font-body uppercase tracking-wider mb-3" style={{ color: textLight }}>{t("propertyDetail.monthlyCosts")}</h4>
              <div className="flex items-center gap-6 text-[13px] font-body">
                <div>
                  <span style={{ color: textLight }}>{t("propertyDetail.rent")} </span>
                  <span className="font-semibold" style={{ color: textMain }}>{property.price.toLocaleString()} AMD</span>
                </div>
                <div>
                  <span style={{ color: textLight }}>{t("propertyDetail.utilities")} </span>
                  <span className="font-semibold" style={{ color: textMain }}>~18,000 AMD</span>
                </div>
                <div>
                  <span style={{ color: textLight }}>{t("propertyDetail.deposit")} </span>
                  <span className="font-semibold" style={{ color: textMain }}>1 {t("propertyDetail.month")}</span>
                </div>
              </div>
            </div>

            {/* Property Intelligence */}
            <PropertyIntelligence property={property} />

            {/* Mini Map */}
            <div>
              <h4 className="text-[11px] font-semibold font-body uppercase tracking-wider mb-2" style={{ color: textLight }}>
                {t("propertyDetail.nearby")}
              </h4>
              <PropertyMiniMap property={property} />
            </div>
          </div>

          {/* RIGHT — AI Chat */}
          <div
            className="flex flex-col overflow-hidden border-l"
            style={{
              minHeight: 0,
              borderColor: "rgba(0,0,0,0.06)",
              backgroundColor: "rgba(255,255,255,0.72)",
              boxShadow: "inset 1px 0 0 rgba(255,255,255,0.50)",
            }}
          >
            {/* Chat header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
              <span className="text-[13px] font-semibold font-body" style={{ color: textMain }}>
                {t("aiChat.chatTitle")}
              </span>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 flex-shrink-0"
                style={{
                  backgroundColor: "rgba(255,255,255,0.90)",
                  backdropFilter: "blur(14px)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <X size={13} style={{ color: textMain }} />
              </button>
            </div>
            <div className="flex-1 px-5 pb-5 overflow-hidden" style={{ minHeight: 0 }}>
              <PropertyAIChat property={property} />
            </div>
          </div>

          {/* Virtual Tour Modal */}
          {showVirtualTour && (
            <VirtualTour
              property={property}
              onClose={() => setShowVirtualTour(false)}
            />
          )}

          {/* Inner Photo Gallery Modal */}
          {showGallery && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center p-4 rounded-[28px] overflow-hidden"
              onClick={() => setShowGallery(false)}
            >
              {/* Dim backdrop */}
              <div className="absolute inset-0"
                style={{
                  backgroundColor: "rgba(30,30,30,0.35)",
                  backdropFilter: "blur(12px) saturate(80%)",
                  WebkitBackdropFilter: "blur(12px) saturate(80%)",
                }}
              />
              {/* Gallery panel */}
              <div className="relative z-10 w-[95%] max-h-[92%]" onClick={(e) => e.stopPropagation()}>
                <PropertyPhotoGallery
                  mainImageUrl={property.image_url}
                  onClose={() => setShowGallery(false)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}