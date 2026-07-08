import React from "react";
import { Link } from "react-router-dom";
import { Lightbulb, BarChart3 } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function InsightPanel() {
  const { t } = useT();
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.45)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderColor: "rgba(255, 255, 255, 0.6)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "rgba(139, 108, 255, 0.1)" }}>
          <Lightbulb size={14} style={{ color: "#8B6CFF" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] leading-relaxed font-body font-medium"
            style={{ color: "#1A1A1A" }}
          >
            {t("resultsPage.bestOverallFit")} <span style={{ color: "#8B6CFF" }}>Arabkir</span>
          </p>
          <p
            className="text-[13px] leading-relaxed font-body mt-1"
            style={{ color: "#757570" }}
          >
            {t("resultsPage.insightText")}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-5 mt-4 pt-4 border-t" style={{ borderColor: "rgba(200, 196, 188, 0.3)" }}>
        <div className="flex items-center gap-2">
          <BarChart3 size={13} style={{ color: "#B5B3AD" }} />
          <div className="flex items-baseline gap-1.5">
            <span className="text-[18px] font-semibold font-body" style={{ color: "#1A1A1A" }}>286</span>
            <span className="text-[11px] font-body" style={{ color: "#A09D96" }}>{t("resultsPage.analyzed")}</span>
          </div>
        </div>
        <span className="text-[15px] font-light" style={{ color: "#C8C4BC" }}>·</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[18px] font-semibold font-body" style={{ color: "#1A1A1A" }}>18</span>
          <span className="text-[11px] font-body" style={{ color: "#A09D96" }}>{t("resultsPage.suitable")}</span>
        </div>
        <span className="text-[15px] font-light" style={{ color: "#C8C4BC" }}>·</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[18px] font-semibold font-body" style={{ color: "#8B6CFF" }}>5</span>
          <span className="text-[11px] font-body" style={{ color: "#A09D96" }}>{t("resultsPage.recommended")}</span>
        </div>
        <span className="text-[15px] font-light" style={{ color: "#C8C4BC" }}>·</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[18px] font-semibold font-body" style={{ color: "#1A1A1A" }}>3</span>
          <span className="text-[11px] font-body" style={{ color: "#A09D96" }}>{t("resultsPage.neighborhoods")}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(200, 196, 188, 0.2)" }}>
        <div className="flex items-center justify-between">
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-1 text-[11px] font-body font-medium transition-opacity duration-200 hover:opacity-60"
            style={{ color: "#8B6CFF" }}
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