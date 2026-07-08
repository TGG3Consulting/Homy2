'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight, Sparkles, Building2, ShieldCheck, FileText,
  Users, MessageSquare, BarChart3, CheckCircle, AlertCircle,
  Home, Camera, Search, Eye, Heart, Calendar, TrendingUp,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import UserAuthButton from '@/components/UserAuthButton';

const BG = "#F3F2EF";

const featureIcons = [Building2, ShieldCheck, FileText, Users, MessageSquare, BarChart3];
const featureKeys = ["free", "verification", "aiDescription", "matching", "communication", "stats"];

const demoIconList = [Camera, FileText, ShieldCheck, Search, MessageSquare, Calendar];
const TOTAL_STEPS = 6;

// Dashboard stat icon list (order matters)
const dashIcons = [ShieldCheck, Eye, Heart, Users, Calendar, TrendingUp];
const dashColors = ["#22C55E", "#0A6045", "#0A6045", "#0A6045", "#0A6045", "#0A6045"];
const dashKeys = ["status", "views", "saves", "inquiries", "viewings", "matchQuality"];

export default function ForOwners() {
  const { t } = useT();
  const [activeDemoStep, setActiveDemoStep] = useState(0);

  const features = featureKeys.map((k, i) => ({
    icon: featureIcons[i],
    title: t(`forOwnersPage.features.${k}.title`),
    description: t(`forOwnersPage.features.${k}.desc`),
  }));
  const demoTitles = Array.from({ length: TOTAL_STEPS }, (_, i) => ({
    icon: demoIconList[i],
    label: t(`forOwnersPage.demoSteps.${i}`),
  }));
  const statValues = [t("forOwnersPage.dashboard.verified"), "247", "38", "12", "4", "87%"];
  const dashboardStats = dashKeys.map((k, i) => ({
    label: t(`forOwnersPage.dashboard.${k}`),
    value: statValues[i],
    icon: dashIcons[i],
    color: i === 0 ? dashColors[i] : undefined,
  }));
  const comparison = {
    traditional: t("forOwnersPage.traditionalItems"),
    homly: t("forOwnersPage.homlyItems"),
  };

  useEffect(() => {
    const timings = [2500, 3000, 2500, 3500, 3000, 4000];
    if (activeDemoStep >= TOTAL_STEPS - 1) {
      const reset = setTimeout(() => setActiveDemoStep(0), timings[TOTAL_STEPS - 1]);
      return () => clearTimeout(reset);
    }
    const timeout = setTimeout(() => setActiveDemoStep((prev) => prev + 1), timings[activeDemoStep]);
    return () => clearTimeout(timeout);
  }, [activeDemoStep]);

  return (
    <div
      className="relative w-full min-h-screen"
      style={{ background: `radial-gradient(ellipse at 50% 30%, #F8F7F5 0%, ${BG} 70%)` }}
    >
      <div className="absolute top-4 right-4 z-50">
        <UserAuthButton variant="light" />
      </div>
      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center justify-between px-4 md:px-7 pt-4 md:pt-5 pb-2 max-w-7xl mx-auto">
        <Link
          href="/"
          className="font-display font-semibold tracking-[0.15em] uppercase select-none"
          style={{ fontSize: "15px", color: "#242424" }}
        >
          Homy
        </Link>
        <div className="flex items-center gap-3 md:gap-4">
          <Link href="/for-buyers" className="hidden md:block text-[13px] font-body font-medium transition-opacity hover:opacity-60" style={{ color: "#666" }}>
            {t("common.buy")}
          </Link>
          <Link href="/for-renters" className="hidden md:block text-[13px] font-body font-medium transition-opacity hover:opacity-60" style={{ color: "#666" }}>
            {t("common.rent")}
          </Link>
          <Link href="/for-owners" className="hidden md:block text-[13px] font-body font-semibold transition-opacity hover:opacity-60" style={{ color: "#0A6045" }}>
            {t("common.owners")}
          </Link>
          <Link
            href="/list-property"
            className="inline-flex items-center gap-1.5 px-4 md:px-5 py-2 rounded-full text-[12px] md:text-[13px] font-body font-semibold transition-all duration-200 hover:shadow-md"
            style={{ backgroundColor: "#0A6045", color: "#FFF" }}
          >
            {t("common.listProperty")}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 pb-16 md:pb-20">
        {/* ── Hero ── */}
        <div className="text-center pt-10 md:pt-12 pb-8 md:pb-10">
          <h1
            className="font-heading font-extrabold tracking-tight"
            style={{ fontSize: "clamp(40px, 5.5vw, 64px)", color: "#242424", letterSpacing: "-0.03em" }}
          >
            {t("forOwnersPage.title")}
          </h1>
          <p
            className="mt-3 font-body max-w-[640px] mx-auto"
            style={{ fontSize: "clamp(14px, 1.2vw, 17px)", color: "#666666", lineHeight: "1.5" }}
          >
            {t("forOwnersPage.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Link
              href="/list-property"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[15px] font-body font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              style={{ backgroundColor: "#0A6045", color: "#FFF" }}
            >
              {t("forOwnersPage.cta")}
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[15px] font-body font-medium transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: "rgba(255,255,255,0.7)",
                color: "#666666",
                border: "1px solid rgba(36,36,36,0.08)",
              }}
            >
              {t("forOwnersPage.howItWorks")}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* ── Feature Cards ── */}
        <div className="mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: "rgba(255,255,255,0.5)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.7)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-3.5"
                  style={{ backgroundColor: "rgba(10, 96, 69,0.08)" }}
                >
                  <feature.icon size={20} style={{ color: "#0A6045" }} />
                </div>
                <h3 className="text-[14px] font-body font-semibold mb-2" style={{ color: "#242424" }}>
                  {feature.title}
                </h3>
                <p className="text-[12px] font-body leading-relaxed" style={{ color: "#757570" }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Animated Demo ── */}
        <div className="mb-16">
          <h2 className="text-center font-heading font-bold mb-6" style={{ fontSize: "22px", color: "#242424" }}>
            {t("forOwnersPage.sectionTitle")}
          </h2>
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              backgroundColor: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.7)",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.03), 0 12px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
          >
            {/* Demo header */}
            <div className="flex items-center gap-2 px-6 py-3.5 border-b" style={{ borderColor: "rgba(200,196,188,0.2)" }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(255,95,87,0.5)" }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(255,189,46,0.5)" }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(39,201,63,0.5)" }} />
              </div>
              <span className="text-[11px] font-body font-medium ml-3" style={{ color: "#A09D96" }}>
                {t("forOwnersPage.demoLabel")}
              </span>
            </div>

            {/* Demo body */}
            <div className="px-8 py-10">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {demoTitles.map((step, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 transition-all duration-500"
                    style={{
                      opacity: i <= activeDemoStep ? 1 : 0.3,
                      transform: i <= activeDemoStep ? "translateY(0)" : "translateY(4px)",
                      flex: "1 0 auto",
                      minWidth: "80px",
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500"
                      style={{
                        backgroundColor: i <= activeDemoStep ? "rgba(10, 96, 69,0.1)" : "rgba(36,36,36,0.04)",
                      }}
                    >
                      <step.icon
                        size={22}
                        style={{ color: i <= activeDemoStep ? "#0A6045" : "#BBBBBB" }}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      {i > 0 && (
                        <div
                          className="h-px w-6 transition-all duration-500"
                          style={{
                            backgroundColor: i <= activeDemoStep ? "rgba(10, 96, 69,0.3)" : "rgba(36,36,36,0.06)",
                            position: "absolute",
                            left: "-20px",
                            top: "50%",
                          }}
                        />
                      )}
                    </div>
                    <span
                      className="text-[10px] font-body font-medium text-center leading-tight transition-all duration-500"
                      style={{ color: i <= activeDemoStep ? "#242424" : "#BBBBBB", maxWidth: "80px" }}
                    >
                      {step.label}
                    </span>
                    {i <= activeDemoStep && i === activeDemoStep && (
                      <span className="text-[9px] font-body font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(10, 96, 69,0.1)", color: "#0A6045" }}>
                        {t("forOwnersPage.now")}
                        </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Connector line */}
              <div className="mt-4 mb-2 flex items-center px-6">
                <div className="flex-1 h-0.5 rounded-full" style={{ backgroundColor: "rgba(36,36,36,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${((activeDemoStep + 1) / TOTAL_STEPS) * 100}%`,
                      backgroundColor: "rgba(10, 96, 69,0.3)",
                    }}
                  />
                </div>
              </div>

              {/* Step indicator */}
              <div className="text-center mt-6">
                <div className="flex items-center justify-center gap-2">
                  {demoTitles.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveDemoStep(i)}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === activeDemoStep ? 22 : 5,
                        height: 5,
                        backgroundColor: i === activeDemoStep ? "#0A6045" : "rgba(36,36,36,0.12)",
                      }}
                    />
                  ))}
                </div>
                <p className="text-[11px] font-body mt-2" style={{ color: "#A09D96" }}>
                  {t("howItWorksPage.step")} {activeDemoStep + 1} {t("howItWorksPage.of")} {TOTAL_STEPS}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Dashboard Preview ── */}
        <div className="mb-16">
          <h2 className="text-center font-heading font-bold mb-6" style={{ fontSize: "22px", color: "#242424" }}>
            {t("forOwnersPage.dashboardTitle")}
          </h2>
          <div
            className="rounded-3xl overflow-hidden max-w-[600px] mx-auto"
            style={{
              backgroundColor: "rgba(255,255,255,0.5)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.7)",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.03), 0 12px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
          >
            <div className="px-6 py-5 border-b" style={{ borderColor: "rgba(200,196,188,0.2)" }}>
              <div className="flex items-center gap-2">
                <Home size={16} style={{ color: "#0A6045" }} />
                <span className="text-[14px] font-body font-semibold" style={{ color: "#242424" }}>
                  {t("forOwnersPage.dashboard.exampleProperty")}
                </span>
              </div>
            </div>
            <div className="p-6">
              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {dashboardStats.map((stat, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.6)",
                      border: "1px solid rgba(200,196,188,0.15)",
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <stat.icon size={12} style={{ color: stat.color || "#0A6045" }} />
                      <span className="text-[9px] font-body font-semibold uppercase tracking-wider" style={{ color: "#A09D96" }}>
                        {stat.label}
                      </span>
                    </div>
                    <p
                      className="text-[20px] font-body font-bold"
                      style={{ color: stat.color || "#242424" }}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* AI suggestion */}
              <div
                className="mt-4 rounded-xl p-4"
                style={{
                  backgroundColor: "rgba(10, 96, 69,0.04)",
                  border: "1px solid rgba(10, 96, 69,0.12)",
                }}
              >
                <div className="flex items-start gap-2">
                  <Sparkles size={14} style={{ color: "#0A6045", marginTop: 1 }} />
                  <div>
                    <p className="text-[10px] font-body font-semibold uppercase tracking-wider mb-1" style={{ color: "#0A6045" }}>
                      {t("forOwnersPage.dashboard.aiSuggestion")}
                      </p>
                      <p className="text-[12px] font-body leading-relaxed" style={{ color: "#3D3B37" }}>
                      {t("forOwnersPage.dashboard.suggestionText")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Comparison Block ── */}
        <div className="mb-16">
          <h2 className="text-center font-heading font-bold mb-8" style={{ fontSize: "22px", color: "#242424" }}>
            {t("forOwnersPage.comparisonTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-[720px] mx-auto">
            {/* Traditional */}
            <div
              className="rounded-2xl p-5 md:p-6"
              style={{
                backgroundColor: "rgba(255,255,255,0.45)",
                border: "1px solid rgba(200,196,188,0.3)",
              }}
            >
              <p className="text-[12px] font-body font-semibold uppercase tracking-wider mb-4" style={{ color: "#A09D96" }}>
                {t("forOwnersPage.traditionalLabel")}
              </p>
              <ul className="space-y-3">
                {(Array.isArray(comparison.traditional) ? comparison.traditional : []).map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertCircle size={13} className="flex-shrink-0 mt-[2px]" style={{ color: "#D4A54A" }} />
                    <span className="text-[13px] font-body leading-snug" style={{ color: "#757570" }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Homly */}
            <div
              className="rounded-2xl p-5 md:p-6"
              style={{
                backgroundColor: "rgba(10, 96, 69,0.04)",
                border: "1px solid rgba(10, 96, 69,0.15)",
                boxShadow: "0 0 0 2px rgba(10, 96, 69,0.03)",
              }}
            >
              <p className="text-[12px] font-body font-semibold uppercase tracking-wider mb-4" style={{ color: "#0A6045" }}>
                {t("forOwnersPage.homlyLabel")}
              </p>
              <ul className="space-y-3">
                {(Array.isArray(comparison.homly) ? comparison.homly : []).map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle size={13} className="flex-shrink-0 mt-[2px]" style={{ color: "#0A6045" }} />
                    <span className="text-[13px] font-body leading-snug" style={{ color: "#3D3B37" }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── Trust Section ── */}
        <div className="mb-12 text-center">
          <div
            className="inline-block max-w-[520px] rounded-2xl px-6 py-4"
            style={{
              backgroundColor: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(200,196,188,0.2)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <p className="text-[12px] font-body leading-relaxed" style={{ color: "#757570" }}>
              {t("forOwnersPage.trustText")}
              </p>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="text-center px-4">
          <Link
            href="/list-property"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-[16px] font-body font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            style={{ backgroundColor: "#0A6045", color: "#FFF" }}
          >
            {t("forOwnersPage.cta")}
            <ArrowRight size={18} />
          </Link>
          <p className="text-[13px] font-body mt-3" style={{ color: "#999999" }}>
            {t("forOwnersPage.ctaSub")}
          </p>
        </div>
      </div>
    </div>
  );
}
