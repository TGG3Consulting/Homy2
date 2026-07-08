'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight, Search, SlidersHorizontal, FileText, Calculator,
  Heart, Calendar, CheckCircle, AlertCircle, Sparkles,
  MapPin, Bed, Maximize2, Star, Clock, ShieldCheck,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import UserAuthButton from '@/components/UserAuthButton';

const BG = "#F3F2EF";

const demoProperties = [
  {
    id: "r1",
    title: "Spacious family apartment near School #55",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=260&fit=crop",
    price: "195,000",
    neighborhood: "Arabkir",
    rooms: 3,
    area: 85,
    score: 94,
    isBest: true,
  },
  {
    id: "r2",
    title: "Modern apartment with park view",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=260&fit=crop",
    price: "200,000",
    neighborhood: "Kentron",
    rooms: 2,
    area: 72,
    score: 88,
    isBest: false,
  },
  {
    id: "r3",
    title: "Bright 3-room with garden access",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=260&fit=crop",
    price: "188,000",
    neighborhood: "Davtashen",
    rooms: 3,
    area: 91,
    score: 86,
    isBest: false,
  },
];

const featureIcons = [Search, SlidersHorizontal, FileText, Calculator, Heart, Calendar];
const featureKeys = ["matching", "filters", "terms", "cost", "lifestyle", "viewing"];

function AnimatedCounter({ target, active }: { target: number; active: boolean }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = Math.ceil(target / 50);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setDisplay(start);
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, active]);
  return display;
}

function DemoPropertyCard({ property, visible, isBest, index }: { property: typeof demoProperties[0]; visible: boolean; isBest: boolean; index: number }) {
  const scoreDisplay = AnimatedCounter({ target: property.score, active: visible });

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        backgroundColor: "rgba(255,255,255,0.7)",
        border: isBest
          ? "1px solid rgba(10, 96, 69,0.3)"
          : "1px solid rgba(200,196,188,0.2)",
        boxShadow: isBest
          ? "0 0 0 3px rgba(10, 96, 69,0.08), 0 4px 20px rgba(10, 96, 69,0.06)"
          : "0 2px 8px rgba(0,0,0,0.03)",
        transitionDelay: `${index * 500}ms`,
      }}
    >
      <div className="flex">
        <div className="w-[120px] h-[90px] flex-shrink-0 overflow-hidden">
          <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0 px-3.5 py-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-1.5">
              <p className="text-[12px] font-body font-semibold truncate" style={{ color: "#242424" }}>
                {property.title}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isBest && <Star size={10} fill="#0A6045" style={{ color: "#0A6045" }} />}
                <span className="text-[12px] font-body font-bold" style={{ color: isBest ? "#0A6045" : "#999999" }}>
                  {scoreDisplay}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={9} style={{ color: "#B5B3AD" }} />
              <span className="text-[10px] font-body" style={{ color: "#757570" }}>{property.neighborhood}</span>
            </div>
            <div className="flex items-center gap-2.5 mt-1 text-[10px] font-body" style={{ color: "#999999" }}>
              <span className="flex items-center gap-1"><Bed size={9} style={{ color: "#0A6045" }} />{property.rooms} rooms</span>
              <span className="flex items-center gap-1"><Maximize2 size={9} style={{ color: "#0A6045" }} />{property.area} m²</span>
            </div>
          </div>
          <p className="text-[11px] font-body font-semibold mt-0.5" style={{ color: "#242424" }}>
            {property.price} AMD / month
          </p>
        </div>
      </div>
    </div>
  );
}

const TOTAL_STEPS = 7;

export default function ForRenters() {
  const { t, tArray } = useT();
  const [activeStep, setActiveStep] = useState(0);
  const [visibleCards, setVisibleCards] = useState(0);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const leftSteps = Array.from({ length: TOTAL_STEPS }, (_, i) => t(`forRentersPage.steps.${i}`));
  const features = featureKeys.map((k, i) => ({
    icon: featureIcons[i],
    title: t(`forRentersPage.features.${k}.title`),
    description: t(`forRentersPage.features.${k}.desc`),
  }));
  const costBreakdown = [
    { label: t("forRentersPage.costBreakdown.rent"), value: "195,000 AMD" },
    { label: t("forRentersPage.costBreakdown.utilities"), value: "~18,000 AMD" },
    { label: t("forRentersPage.costBreakdown.heating"), value: "~12,000 AMD" },
    { label: t("forRentersPage.costBreakdown.deposit"), value: "1 month" },
    { label: t("forRentersPage.costBreakdown.total"), value: "~225,000 AMD", highlight: true },
  ];
  const comparison = {
    traditional: t("forRentersPage.traditionalItems"),
    homly: t("forRentersPage.homlyItems"),
  };
  const checklistItems = t("forRentersPage.checklist");

  useEffect(() => {
    const timings = [3500, 3000, 2500, 4000, 3000, 4000, 5000];
    if (activeStep >= TOTAL_STEPS - 1) {
      const reset = setTimeout(() => {
        setActiveStep(0);
        setVisibleCards(0);
        setShowCostBreakdown(false);
        setShowSchedule(false);
      }, timings[TOTAL_STEPS - 1]);
      return () => clearTimeout(reset);
    }
    const timeout = setTimeout(() => {
      setActiveStep((prev) => prev + 1);
    }, timings[activeStep]);
    return () => clearTimeout(timeout);
  }, [activeStep]);

  useEffect(() => {
    if (activeStep === 2) {
      setVisibleCards(0);
      setShowCostBreakdown(false);
      setShowSchedule(false);
    }
    if (activeStep === 3) {
      const t1 = setTimeout(() => setVisibleCards(1), 300);
      const t2 = setTimeout(() => setVisibleCards(2), 900);
      const t3 = setTimeout(() => setVisibleCards(3), 1500);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
    if (activeStep === 5) {
      setShowCostBreakdown(true);
    }
    if (activeStep === 6) {
      setShowSchedule(true);
    }
  }, [activeStep]);

  const renderDemoContent = () => {
    if (activeStep === 0) {
      return (
        <div className="flex justify-end">
          <div
            className="max-w-[75%] rounded-2xl rounded-br-md px-5 py-3.5"
            style={{ backgroundColor: "rgba(10, 96, 69,0.08)", border: "1px solid rgba(10, 96, 69,0.1)" }}
          >
            <p className="text-[15px] font-body leading-relaxed" style={{ color: "#242424" }}>
              {t("forRentersPage.demoQuery")}
            </p>
          </div>
        </div>
      );
    }

    if (activeStep === 1) {
      return (
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(10, 96, 69,0.1)" }}>
            <Sparkles size={12} style={{ color: "#0A6045" }} />
          </div>
          <div className="rounded-2xl px-5 py-3.5" style={{ backgroundColor: "rgba(255,255,255,0.6)", border: "1px solid rgba(200,196,188,0.3)" }}>
            <p className="text-[14px] font-body font-medium mb-2" style={{ color: "#242424" }}>{t("howItWorksPage.extractingCriteria")}</p>
            <div className="flex flex-wrap gap-1.5">
              {(tArray("forRentersPage.demoChips") || ["Budget", "District", "Children", "Pets", "School", "Commute"]).map((chip: string) => (
                <span key={chip} className="px-2.5 py-1 rounded-full text-[10px] font-body font-medium"
                  style={{ backgroundColor: "rgba(10, 96, 69,0.08)", color: "#0A6045" }}>
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeStep === 2) {
      return (
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(10, 96, 69,0.1)" }}>
            <Sparkles size={12} style={{ color: "#0A6045" }} />
          </div>
          <div className="rounded-2xl px-5 py-3.5 flex items-center gap-3"
            style={{ backgroundColor: "rgba(255,255,255,0.6)", border: "1px solid rgba(200,196,188,0.3)" }}>
            <div className="w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0"
              style={{ borderColor: "rgba(10, 96, 69,0.2)", borderTopColor: "#0A6045" }} />
            <p className="text-[14px] font-body" style={{ color: "#666666" }}>
              {t("forRentersPage.analyzing")}
            </p>
          </div>
        </div>
      );
    }

    if (activeStep >= 3) {
      return (
        <div className="space-y-2">
          {demoProperties.map((prop, i) => (
            <DemoPropertyCard
              key={prop.id}
              property={prop}
              visible={visibleCards > i}
              isBest={prop.isBest && activeStep >= 4}
              index={i}
            />
          ))}

          {showCostBreakdown && (
            <div
              className="rounded-xl p-4 mt-3 transition-all duration-500"
              style={{
                opacity: showCostBreakdown ? 1 : 0,
                backgroundColor: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(200,196,188,0.3)",
              }}
            >
              <p className="text-[10px] font-body font-semibold uppercase tracking-wider mb-2.5" style={{ color: "#0A6045" }}>
                {t("forRentersPage.costBreakdown.title")}
              </p>
              <div className="space-y-1.5">
                {costBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[12px] font-body" style={{ color: item.highlight ? "#242424" : "#757570" }}>
                      {item.label}
                    </span>
                    <span className="text-[12px] font-body font-semibold" style={{ color: item.highlight ? "#0A6045" : "#242424" }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showSchedule && (
            <div
              className="rounded-xl p-4 mt-3 transition-all duration-500"
              style={{
                opacity: showSchedule ? 1 : 0,
                backgroundColor: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(200,196,188,0.3)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock size={14} style={{ color: "#0A6045" }} />
                  <span className="text-[13px] font-body font-semibold" style={{ color: "#242424" }}>{t("forRentersPage.viewingAvailable")}</span>
                </div>
              </div>
              <p className="text-[22px] font-body font-bold mb-1" style={{ color: "#242424" }}>{t("forRentersPage.tomorrowViewing")}</p>
              <div className="flex items-center gap-2 text-[12px] font-body mb-3" style={{ color: "#999999" }}>
                <MapPin size={11} />
                <span>{t("forRentersPage.arabkirYerevan")}</span>
              </div>
              <button
                className="w-full py-2.5 rounded-xl text-[13px] font-body font-semibold transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: "#0A6045", color: "#FFF" }}
              >
                {t("forRentersPage.scheduleViewing")}
              </button>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="relative w-full min-h-screen" style={{ background: `radial-gradient(ellipse at 50% 30%, #F8F7F5 0%, ${BG} 70%)` }}>
      <div className="absolute top-4 right-4 z-50">
        <UserAuthButton variant="light" />
      </div>
      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center justify-between px-4 md:px-7 pt-4 md:pt-5 pb-2 max-w-7xl mx-auto">
        <Link href="/" className="font-display font-semibold tracking-[0.15em] uppercase select-none"
          style={{ fontSize: "15px", color: "#242424" }}>
          Homy
        </Link>
        <div className="flex items-center gap-3 md:gap-4">
          <Link href="/for-buyers" className="hidden md:block text-[13px] font-body font-medium transition-opacity hover:opacity-60" style={{ color: "#666" }}>
            {t("common.buy")}
          </Link>
          <Link href="/for-owners" className="hidden md:block text-[13px] font-body font-medium transition-opacity hover:opacity-60" style={{ color: "#666" }}>
            {t("common.owners")}
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 px-4 md:px-5 py-2 rounded-full text-[12px] md:text-[13px] font-body font-semibold transition-all duration-200 hover:shadow-md"
            style={{ backgroundColor: "#0A6045", color: "#FFF" }}>
            {t("common.startSearch")}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 pb-16 md:pb-20">
        {/* ── Hero ── */}
        <div className="text-center pt-10 md:pt-12 pb-8 md:pb-10">
          <h1 className="font-heading font-extrabold tracking-tight"
            style={{ fontSize: "clamp(40px, 5.5vw, 64px)", color: "#242424", letterSpacing: "-0.03em" }}>
            {t("forRentersPage.title")}
          </h1>
          <p className="mt-3 font-body max-w-[620px] mx-auto"
            style={{ fontSize: "clamp(14px, 1.2vw, 17px)", color: "#666666", lineHeight: "1.5" }}>
            {t("forRentersPage.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Link href="/" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[14px] font-body font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              style={{ backgroundColor: "#0A6045", color: "#FFF" }}>
              {t("forRentersPage.cta")}
              <ArrowRight size={16} />
            </Link>
            <Link href="/how-it-works" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[14px] font-body font-medium transition-all duration-200 hover:shadow-sm"
              style={{ backgroundColor: "rgba(255,255,255,0.5)", color: "#0A6045", border: "1px solid rgba(10, 96, 69,0.15)" }}>
              {t("forRentersPage.howHomlyWorks")}
            </Link>
          </div>
          <p className="mt-4 inline-block px-5 py-2 rounded-full font-body font-medium"
            style={{ fontSize: "13px", color: "#0A6045", backgroundColor: "rgba(10, 96, 69,0.06)", border: "1px solid rgba(10, 96, 69,0.12)" }}>
            {t("forRentersPage.badge")}
          </p>
        </div>

        {/* ── Animated Demo ── */}
        <div className="mb-16">
          <div className="rounded-3xl overflow-hidden"
            style={{
              backgroundColor: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.7)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 12px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}>
            <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ borderColor: "rgba(200,196,188,0.2)" }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(255,95,87,0.5)" }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(255,189,46,0.5)" }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(39,201,63,0.5)" }} />
              </div>
              <span className="text-[11px] font-body font-medium ml-3" style={{ color: "#A09D96" }}>{t("forRentersPage.demoLabel")}</span>
            </div>
            <div className="flex" style={{ minHeight: "400px" }}>
              <div className="w-[210px] flex-shrink-0 border-r p-4 space-y-0.5" style={{ borderColor: "rgba(200,196,188,0.15)", backgroundColor: "rgba(255,255,255,0.3)" }}>
                {leftSteps.map((label, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-500"
                    style={{
                      backgroundColor: i === activeStep ? "rgba(10, 96, 69,0.06)" : "transparent",
                      border: i === activeStep ? "1px solid rgba(10, 96, 69,0.15)" : "1px solid transparent",
                    }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-body font-semibold transition-all duration-500"
                      style={{
                        backgroundColor: i === activeStep ? "#0A6045" : i < activeStep ? "rgba(10, 96, 69,0.2)" : "rgba(36,36,36,0.05)",
                        color: i === activeStep ? "#FFF" : i < activeStep ? "#0A6045" : "#BBBBBB",
                      }}>
                      {i < activeStep ? "✓" : i + 1}
                    </div>
                    <p className="text-[10px] font-body font-medium truncate transition-all duration-500"
                      style={{ color: i === activeStep ? "#242424" : i < activeStep ? "#666666" : "#BBBBBB" }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex-1 p-6 flex flex-col justify-center overflow-hidden" style={{ backgroundColor: "rgba(249,249,247,0.5)" }}>
                <div className="mb-4">
                  <p className="text-[10px] font-body font-semibold uppercase tracking-wider mb-1" style={{ color: "#A09D96" }}>
                    {t("howItWorksPage.step")} {activeStep + 1} {t("howItWorksPage.of")} {TOTAL_STEPS}
                  </p>
                </div>
                <div className="transition-all duration-500">
                  {renderDemoContent()}
                </div>
                <div className="flex items-center gap-2 mt-5 justify-center">
                  {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                    <button key={i} onClick={() => setActiveStep(i)} className="rounded-full transition-all duration-300"
                      style={{ width: i === activeStep ? 22 : 5, height: 5, backgroundColor: i === activeStep ? "#0A6045" : "rgba(36,36,36,0.12)" }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature Cards ── */}
        <div className="mb-16">
          <h2 className="text-center font-heading font-bold mb-10" style={{ fontSize: "28px", color: "#242424" }}>
            {t("forRentersPage.sectionTitle")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <div key={i} className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: "rgba(255,255,255,0.5)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.7)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)",
                }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3.5"
                  style={{ backgroundColor: "rgba(10, 96, 69,0.08)" }}>
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

        {/* ── Comparison Block ── */}
        <div className="mb-16">
          <h2 className="text-center font-heading font-bold mb-8" style={{ fontSize: "22px", color: "#242424" }}>
            {t("forRentersPage.comparisonTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-[720px] mx-auto">
            <div className="rounded-2xl p-5 md:p-6"
              style={{ backgroundColor: "rgba(255,255,255,0.45)", border: "1px solid rgba(200,196,188,0.3)" }}>
              <p className="text-[12px] font-body font-semibold uppercase tracking-wider mb-4" style={{ color: "#A09D96" }}>
                {t("forRentersPage.traditionalLabel")}
              </p>
              <ul className="space-y-3">
                {(Array.isArray(comparison.traditional) ? comparison.traditional : []).map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertCircle size={13} className="flex-shrink-0 mt-[2px]" style={{ color: "#D4A54A" }} />
                    <span className="text-[13px] font-body leading-snug" style={{ color: "#757570" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-5 md:p-6"
              style={{
                backgroundColor: "rgba(10, 96, 69,0.04)",
                border: "1px solid rgba(10, 96, 69,0.15)",
                boxShadow: "0 0 0 2px rgba(10, 96, 69,0.03)",
              }}>
              <p className="text-[12px] font-body font-semibold uppercase tracking-wider mb-4" style={{ color: "#0A6045" }}>
                {t("forRentersPage.homlyLabel")}
              </p>
              <ul className="space-y-3">
                {(Array.isArray(comparison.homly) ? comparison.homly : []).map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle size={13} className="flex-shrink-0 mt-[2px]" style={{ color: "#0A6045" }} />
                    <span className="text-[13px] font-body leading-snug" style={{ color: "#3D3B37" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── Rental Checklist ── */}
        <div className="mb-16">
          <h2 className="text-center font-heading font-bold mb-8" style={{ fontSize: "22px", color: "#242424" }}>
            {t("forRentersPage.checklistTitle")}
          </h2>
          <div className="max-w-[620px] mx-auto">
            <div className="rounded-2xl p-6"
              style={{
                backgroundColor: "rgba(255,255,255,0.45)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.7)",
                boxShadow: "0 2px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
              }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {(Array.isArray(checklistItems) ? checklistItems : []).map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-[1px]"
                      style={{ backgroundColor: "rgba(10, 96, 69,0.1)" }}>
                      <ShieldCheck size={10} style={{ color: "#0A6045" }} />
                    </div>
                    <span className="text-[13px] font-body leading-snug" style={{ color: "#3D3B37" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="text-center px-4">
          <Link href="/" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-[16px] font-body font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            style={{ backgroundColor: "#0A6045", color: "#FFF" }}>
            {t("forRentersPage.cta")}
            <ArrowRight size={18} />
          </Link>
          <p className="text-[13px] font-body mt-3" style={{ color: "#999999" }}>
            {t("forRentersPage.ctaSub")}
          </p>
        </div>
      </div>
    </div>
  );
}
