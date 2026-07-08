'use client';

import React from "react";
import Link from "next/link";
import { Lightbulb, BarChart3 } from "lucide-react";
import { useT, getLocalized } from "@/lib/i18n";

interface InsightPanelProps {
  bestNeighborhood?: string;
  description?: string;
  analyzedCount?: number;
  suitableCount?: number;
  recommendedCount?: number;
  neighborhoodCount?: number;
}

export default function InsightPanel({
  bestNeighborhood = "Arabkir",
  description,
  analyzedCount = 286,
  suitableCount = 18,
  recommendedCount = 5,
  neighborhoodCount = 3,
}: InsightPanelProps) {
  const { t, lang } = useT();
  const localizedNeighborhood = getLocalized(bestNeighborhood, lang);
  return (
    <div
      className="rounded-2xl border p-3 md:p-5 overflow-hidden"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.45)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderColor: "rgba(255, 255, 255, 0.6)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      <div className="flex items-start gap-2 md:gap-3">
        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "rgba(10, 96, 69, 0.1)" }}>
          <Lightbulb size={12} className="md:hidden" style={{ color: "#0A6045" }} />
          <Lightbulb size={14} className="hidden md:block" style={{ color: "#0A6045" }} />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <p
            className="text-[12px] md:text-[14px] leading-relaxed font-body font-medium truncate"
            style={{ color: "#1A1A1A" }}
          >
            {t("resultsPage.bestOverallFit")} <span style={{ color: "#0A6045" }}>{localizedNeighborhood}</span>
          </p>
          <p
            className="text-[11px] md:text-[13px] leading-relaxed font-body mt-1 line-clamp-2 md:line-clamp-none"
            style={{ color: "#757570" }}
          >
            {description}
          </p>
        </div>
      </div>

      {/* Stats row - wrap on mobile, show only key metrics */}
      <div className="flex items-center gap-2 md:gap-5 mt-3 md:mt-4 pt-3 md:pt-4 border-t flex-wrap" style={{ borderColor: "rgba(200, 196, 188, 0.3)" }}>
        <div className="flex items-center gap-1.5 md:gap-2">
          <BarChart3 size={12} className="md:hidden" style={{ color: "#B5B3AD" }} />
          <BarChart3 size={13} className="hidden md:block" style={{ color: "#B5B3AD" }} />
          <div className="flex items-baseline gap-1">
            <span className="text-[14px] md:text-[18px] font-semibold font-body" style={{ color: "#1A1A1A" }}>{analyzedCount}</span>
            <span className="text-[9px] md:text-[11px] font-body" style={{ color: "#A09D96" }}>{t("resultsPage.analyzed")}</span>
          </div>
        </div>
        <span className="text-[12px] md:text-[15px] font-light" style={{ color: "#C8C4BC" }}>·</span>
        <div className="flex items-baseline gap-1">
          <span className="text-[14px] md:text-[18px] font-semibold font-body" style={{ color: "#0A6045" }}>{recommendedCount}</span>
          <span className="text-[9px] md:text-[11px] font-body" style={{ color: "#A09D96" }}>{t("resultsPage.recommended")}</span>
        </div>
        {/* Hide these on mobile */}
        <span className="hidden md:inline text-[15px] font-light" style={{ color: "#C8C4BC" }}>·</span>
        <div className="hidden md:flex items-baseline gap-1.5">
          <span className="text-[18px] font-semibold font-body" style={{ color: "#1A1A1A" }}>{suitableCount}</span>
          <span className="text-[11px] font-body" style={{ color: "#A09D96" }}>{t("resultsPage.suitable")}</span>
        </div>
        <span className="hidden md:inline text-[15px] font-light" style={{ color: "#C8C4BC" }}>·</span>
        <div className="hidden md:flex items-baseline gap-1.5">
          <span className="text-[18px] font-semibold font-body" style={{ color: "#1A1A1A" }}>{neighborhoodCount}</span>
          <span className="text-[11px] font-body" style={{ color: "#A09D96" }}>{t("resultsPage.neighborhoods")}</span>
        </div>
      </div>

      {/* Bottom row - hidden on mobile */}
      <div className="hidden md:block mt-3 pt-3 border-t" style={{ borderColor: "rgba(200, 196, 188, 0.2)" }}>
        <div className="flex items-center justify-between">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-1 text-[11px] font-body font-medium transition-opacity duration-200 hover:opacity-60"
            style={{ color: "#0A6045" }}
          >
            {t("common.howItWorks")}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
          <span className="text-[9px] font-body" style={{ color: "#B5B3AD" }}>
            {t("resultsPage.verifiedBadge")}
          </span>
        </div>
      </div>
    </div>
  );
}
