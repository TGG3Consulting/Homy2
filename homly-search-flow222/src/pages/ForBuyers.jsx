import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Search, BarChart3, ShieldCheck, Calendar,
  FileText, DollarSign, MapPin, AlertTriangle,
  CheckCircle, AlertCircle, Building2, Scale, Car,
  TreePine, TrendingUp, Landmark,
} from "lucide-react";
import BuyerDemo from "@/components/homly/BuyerDemo";
import { useT } from "@/lib/i18n";

const BG = "#F3F2EF";

const featureKeys = ["matching", "district", "price", "mortgage", "documents", "risk", "support"];
const deepFeatureKeys = ["developer", "legal", "commute", "location", "investment", "cadastre"];

const F_ICONS = [Search, MapPin, DollarSign, BarChart3, FileText, AlertTriangle, ShieldCheck];
const DF_ICONS = [Building2, Scale, Car, TreePine, TrendingUp, Landmark];

export default function ForBuyers() {
  const { t } = useT();

  const features = featureKeys.map((k, i) => ({
    icon: F_ICONS[i],
    title: t(`forBuyersPage.features.${k}.title`),
    description: t(`forBuyersPage.features.${k}.desc`),
  }));

  const deepFeatures = deepFeatureKeys.map((k, i) => ({
    icon: DF_ICONS[i],
    title: t(`forBuyersPage.deepFeatures.${k}.title`),
    description: t(`forBuyersPage.deepFeatures.${k}.desc`),
  }));

  const compTraditional = t("forBuyersPage.traditionalItems");
  const compHomly = t("forBuyersPage.homlyItems");
  return (
    <div
      className="w-full min-h-screen"
      style={{ background: `radial-gradient(ellipse at 50% 30%, #F8F7F5 0%, ${BG} 70%)` }}
    >
      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center justify-between px-7 pt-5 pb-2 max-w-7xl mx-auto">
        <Link
          to="/"
          className="font-display font-semibold tracking-[0.15em] uppercase select-none"
          style={{ fontSize: "15px", color: "#242424" }}
        >
          Homly
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/how-it-works" className="text-[13px] font-body font-medium transition-opacity hover:opacity-60" style={{ color: "#666" }}>
            {t("common.howItWorks")}
          </Link>
          <Link to="/for-owners" className="text-[13px] font-body font-medium transition-opacity hover:opacity-60" style={{ color: "#666" }}>
            {t("common.owners")}
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-[13px] font-body font-semibold transition-all duration-200 hover:shadow-md"
            style={{ backgroundColor: "#8B6CFF", color: "#FFF" }}
          >
            {t("common.startSearch")}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        {/* ── Hero ── */}
        <div className="text-center pt-14 pb-12">
          <h1
            className="font-heading font-extrabold tracking-tight"
            style={{ fontSize: "clamp(36px, 5vw, 58px)", color: "#242424", letterSpacing: "-0.03em" }}
          >
            {t("forBuyersPage.title")}
          </h1>
          <p
            className="mt-3 font-body max-w-[620px] mx-auto"
            style={{ fontSize: "clamp(14px, 1.2vw, 17px)", color: "#666666", lineHeight: "1.55" }}
          >
            {t("forBuyersPage.subtitle")}
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-[14px] font-body font-semibold transition-all duration-200 hover:shadow-md"
              style={{ backgroundColor: "#8B6CFF", color: "#FFF" }}
            >
              {t("forBuyersPage.cta")}
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-[14px] font-body font-semibold transition-all duration-200 hover:opacity-70"
              style={{
                backgroundColor: "rgba(255,255,255,0.6)",
                color: "#666",
                border: "1px solid rgba(200,196,188,0.3)",
              }}
            >
              {t("forBuyersPage.howHomlyWorks")}
            </Link>
          </div>
        </div>

        {/* ── 7 Feature Cards ── */}
        <div className="mb-16">
          <h2 className="text-center font-heading font-bold mb-10" style={{ fontSize: "26px", color: "#242424" }}>
            {t("forBuyersPage.sectionTitle")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: "rgba(255,255,255,0.5)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.7)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)",
                  gridColumn: i >= 4 ? undefined : undefined,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: "rgba(139,108,255,0.08)" }}
                >
                  <f.icon size={18} style={{ color: "#8B6CFF" }} />
                </div>
                <h3 className="text-[14px] font-body font-semibold mb-1.5" style={{ color: "#242424" }}>
                  {f.title}
                </h3>
                <p className="text-[12px] font-body leading-relaxed" style={{ color: "#757570" }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Deep Analysis Cards ── */}
        <div className="mb-16">
          <h2 className="text-center font-heading font-bold mb-3" style={{ fontSize: "24px", color: "#242424" }}>
            {t("forBuyersPage.deepTitle")}
          </h2>
          <p className="text-center font-body mb-8 max-w-[540px] mx-auto" style={{ fontSize: "13px", color: "#999" }}>
            {t("forBuyersPage.deepSubtitle")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {deepFeatures.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: "rgba(139,108,255,0.03)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(139,108,255,0.1)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "rgba(139,108,255,0.08)" }}>
                  <f.icon size={18} style={{ color: "#8B6CFF" }} />
                </div>
                <h3 className="text-[14px] font-body font-semibold mb-1.5" style={{ color: "#242424" }}>{f.title}</h3>
                <p className="text-[12px] font-body leading-relaxed" style={{ color: "#757570" }}>{f.description}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] font-body mt-4" style={{ color: "#B5B3AD" }}>
            {t("forBuyersPage.disclaimer")}
          </p>
        </div>

        {/* ── Animated Demo ── */}
        <div className="mb-16">
          <h2 className="text-center font-heading font-bold mb-8" style={{ fontSize: "24px", color: "#242424" }}>
            {t("forBuyersPage.demoTitle")}
          </h2>
          <BuyerDemo />
        </div>

        {/* ── Comparison ── */}
        <div className="mb-16">
          <h2 className="text-center font-heading font-bold mb-8" style={{ fontSize: "22px", color: "#242424" }}>
            {t("forBuyersPage.comparisonTitle")}
          </h2>
          <div className="grid grid-cols-2 gap-6 max-w-[720px] mx-auto">
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: "rgba(255,255,255,0.45)", border: "1px solid rgba(200,196,188,0.3)" }}
            >
              <p className="text-[12px] font-body font-semibold uppercase tracking-wider mb-4" style={{ color: "#A09D96" }}>{t("forBuyersPage.traditionalLabel")}</p>
              <ul className="space-y-3">
                {(Array.isArray(compTraditional) ? compTraditional : ["Too many listings","Unclear prices","Hard to compare districts","Buyer checks everything alone"]).map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertCircle size={13} className="flex-shrink-0 mt-[2px]" style={{ color: "#D4A54A" }} />
                    <span className="text-[13px] font-body leading-snug" style={{ color: "#757570" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: "rgba(139,108,255,0.04)", border: "1px solid rgba(139,108,255,0.15)", boxShadow: "0 0 0 2px rgba(139,108,255,0.03)" }}
            >
              <p className="text-[12px] font-body font-semibold uppercase tracking-wider mb-4" style={{ color: "#8B6CFF" }}>{t("forBuyersPage.homlyLabel")}</p>
              <ul className="space-y-3">
                {(Array.isArray(compHomly) ? compHomly : ["AI narrows the search","Explains recommendations","Compares districts and prices","Highlights risks","Helps move toward the deal"]).map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle size={13} className="flex-shrink-0 mt-[2px]" style={{ color: "#8B6CFF" }} />
                    <span className="text-[13px] font-body leading-snug" style={{ color: "#3D3B37" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[16px] font-body font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            style={{ backgroundColor: "#8B6CFF", color: "#FFF" }}
          >
            {t("forBuyersPage.cta")}
            <ArrowRight size={18} />
            </Link>
            <p className="text-[13px] font-body mt-3" style={{ color: "#999999" }}>
            {t("forBuyersPage.ctaSub")}
          </p>
        </div>
      </div>
    </div>
  );
}