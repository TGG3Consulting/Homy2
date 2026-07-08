'use client';

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight, Sparkles, BarChart3, ShieldCheck,
  Calendar, MessageSquare, CheckCircle, AlertCircle,
  MapPin, Clock, Star, Bed, Maximize2,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import UserAuthButton from '@/components/UserAuthButton';

const BG = "#F3F2EF";

const criteriaChips = ["Budget", "Location", "Family needs", "Schools", "Safety"];
const demoUserMessage = "\"Family apartment near a good school in Yerevan\"";

const demoProperties = [
  {
    id: "demo-1",
    title: "Spacious family apartment near School #55",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=260&fit=crop",
    price: "195,000",
    neighborhood: "Arabkir",
    rooms: 3,
    area: 85,
    score: 94,
    reasons: ["8-min walk to school", "Quiet street with playground"],
    isBest: true,
  },
  {
    id: "demo-2",
    title: "Modern apartment with park view",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=260&fit=crop",
    price: "200,000",
    neighborhood: "Kentron",
    rooms: 2,
    area: 72,
    score: 88,
    reasons: ["New building", "Next to Arabkir Park"],
    isBest: false,
  },
  {
    id: "demo-3",
    title: "Bright 3-room with garden access",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=260&fit=crop",
    price: "188,000",
    neighborhood: "Davtashen",
    rooms: 3,
    area: 91,
    score: 86,
    reasons: ["Shared garden", "Two schools nearby"],
    isBest: false,
  },
];

// ── Demo steps (logical phases of the animation) ──
const TOTAL_STEPS = 7; // 0..6

const stepIcons = [MessageSquare, BarChart3, ShieldCheck, MapPin, Sparkles];

// ── Score counter hook ──
function useAnimatedScore(target: number, active: boolean) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const duration = 800;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setDisplay(start);
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, active]);
  return display;
}

// ── Property card for the demo ──
function DemoPropertyCard({ property, visible, isBest, showReason, scoreActive, index }: {
  property: typeof demoProperties[0];
  visible: boolean;
  isBest: boolean;
  showReason: boolean;
  scoreActive: boolean;
  index: number;
}) {
  const displayScore = useAnimatedScore(property.score, scoreActive);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        backgroundColor: "rgba(255,255,255,0.7)",
        border: isBest
          ? "1px solid rgba(10, 96, 69,0.3)"
          : "1px solid rgba(200,196,188,0.2)",
        boxShadow: isBest
          ? "0 0 0 3px rgba(10, 96, 69,0.08), 0 4px 20px rgba(10, 96, 69,0.06)"
          : "0 2px 8px rgba(0,0,0,0.03)",
        transitionDelay: `${index * 600}ms`,
      }}
    >
      <div className="flex">
        {/* Photo */}
        <div className="w-[130px] h-[100px] flex-shrink-0 overflow-hidden">
          <img
            src={property.image}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13px] font-body font-semibold truncate" style={{ color: "#242424" }}>
                {property.title}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isBest && <Star size={11} fill="#0A6045" style={{ color: "#0A6045" }} />}
                <span
                  className="text-[13px] font-body font-bold"
                  style={{ color: isBest ? "#0A6045" : "#999999" }}
                >
                  {displayScore}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} style={{ color: "#B5B3AD" }} />
              <span className="text-[11px] font-body" style={{ color: "#757570" }}>
                {property.neighborhood}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] font-body" style={{ color: "#999999" }}>
              <span className="flex items-center gap-1">
                <Bed size={10} style={{ color: "#0A6045" }} />
                {property.rooms} rooms
              </span>
              <span className="flex items-center gap-1">
                <Maximize2 size={10} style={{ color: "#0A6045" }} />
                {property.area} m²
              </span>
            </div>
          </div>
          <p className="text-[12px] font-body font-semibold mt-1" style={{ color: "#242424" }}>
            {property.price} AMD / month
          </p>
        </div>
      </div>
      {/* Reason chips */}
      {showReason && (
        <div
          className="px-4 pb-2.5 flex items-center gap-1.5 flex-wrap transition-all duration-500"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {property.reasons.map((r, ri) => (
            <span
              key={ri}
              className="px-2 py-0.5 rounded-full text-[9px] font-body font-medium"
              style={{
                backgroundColor: "rgba(10, 96, 69,0.06)",
                color: "#0A6045",
              }}
            >
              <CheckCircle size={8} style={{ display: "inline", marginRight: 3, color: "#0A6045" }} />
              {r}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Left step list (sidebar) ──
export default function HowItWorks() {
  const { t, tArray } = useT();
  const [activeStep, setActiveStep] = useState(0);
  const [visibleCards, setVisibleCards] = useState(0);
  const [scoreActive, setScoreActive] = useState(false);
  const [showReasons, setShowReasons] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const leftSteps = Array.from({ length: TOTAL_STEPS }, (_, i) => t(`howItWorksPage.steps.${i}.label`));
  const steps = Array.from({ length: 5 }, (_, i) => ({
    icon: stepIcons[i],
    title: t(`howItWorksPage.steps.${i}.title`),
    description: t(`howItWorksPage.steps.${i}.desc`),
  }));
  const comparison = {
    traditional: t("howItWorksPage.traditionalItems"),
    homly: t("howItWorksPage.homlyItems"),
  };

  // Auto-advance through steps
  useEffect(() => {
    const timings = [3500, 3000, 2500, 4500, 3000, 4000, 5000]; // ms per step
    if (activeStep >= TOTAL_STEPS - 1) {
      const reset = setTimeout(() => {
        setActiveStep(0);
        setVisibleCards(0);
        setScoreActive(false);
        setShowReasons(false);
        setShowAnalysis(false);
        setShowExplanation(false);
        setShowSchedule(false);
      }, timings[TOTAL_STEPS - 1]);
      return () => clearTimeout(reset);
    }
    const timeout = setTimeout(() => {
      setActiveStep((prev) => prev + 1);
    }, timings[activeStep]);
    return () => clearTimeout(timeout);
  }, [activeStep]);

  // Sub-animations within steps
  useEffect(() => {
    if (activeStep === 2) {
      // Analyzing — prepare for cards
      setVisibleCards(0);
      setShowReasons(false);
      setShowAnalysis(false);
      setShowExplanation(false);
      setShowSchedule(false);
      setScoreActive(false);
    }
    if (activeStep === 3) {
      // Cards appear one by one
      const t1 = setTimeout(() => setVisibleCards(1), 300);
      const t2 = setTimeout(() => setVisibleCards(2), 1000);
      const t3 = setTimeout(() => { setVisibleCards(3); setScoreActive(true); }, 1700);
      const t4 = setTimeout(() => setShowReasons(true), 2400);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
    if (activeStep === 4) {
      setShowReasons(true);
      setShowAnalysis(false);
      setShowExplanation(false);
      setShowSchedule(false);
    }
    if (activeStep === 5) {
      setShowAnalysis(true);
      setShowExplanation(true);
    }
    if (activeStep === 6) {
      setShowSchedule(true);
    }
  }, [activeStep]);

  // ── Render the right-side demo content per step ──
  const renderDemoContent = () => {
    // Step 0 — User types
    if (activeStep === 0) {
      return (
        <div className="flex justify-end">
          <div
            className="max-w-[75%] rounded-2xl rounded-br-md px-5 py-3.5"
            style={{
              backgroundColor: "rgba(10, 96, 69,0.08)",
              border: "1px solid rgba(10, 96, 69,0.1)",
            }}
          >
            <p className="text-[15px] font-body leading-relaxed" style={{ color: "#242424" }}>
              {t("howItWorksPage.demoQuery")}
            </p>
          </div>
        </div>
      );
    }

    // Step 1 — Criteria chips appear
    if (activeStep === 1) {
      return (
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(10, 96, 69,0.1)" }}>
            <Sparkles size={12} style={{ color: "#0A6045" }} />
          </div>
          <div>
            <div
              className="rounded-2xl px-5 py-3.5 mb-3"
              style={{ backgroundColor: "rgba(255,255,255,0.6)", border: "1px solid rgba(200,196,188,0.3)" }}
            >
              <p className="text-[14px] font-body font-medium mb-2" style={{ color: "#242424" }}>
                {t("howItWorksPage.extractingCriteria")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(tArray("howItWorksPage.criteriaChips") || criteriaChips).map((chip: string, i: number) => (
                  <span
                    key={chip}
                    className="px-2.5 py-1 rounded-full text-[10px] font-body font-medium transition-all duration-500"
                    style={{
                      backgroundColor: "rgba(10, 96, 69,0.08)",
                      color: "#0A6045",
                      opacity: 1,
                      transform: "scale(1)",
                    }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Step 2 — Analyzing
    if (activeStep === 2) {
      return (
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(10, 96, 69,0.1)" }}>
            <Sparkles size={12} style={{ color: "#0A6045" }} />
          </div>
          <div
            className="rounded-2xl px-5 py-3.5 flex items-center gap-3"
            style={{ backgroundColor: "rgba(255,255,255,0.6)", border: "1px solid rgba(200,196,188,0.3)" }}
          >
            <div className="w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0" style={{ borderColor: "rgba(10, 96, 69,0.2)", borderTopColor: "#0A6045" }} />
            <p className="text-[14px] font-body" style={{ color: "#666666" }}>
              {t("howItWorksPage.analyzing")}
              </p>
          </div>
        </div>
      );
    }

    // Step 3 — Property cards appear
    if (activeStep >= 3) {
      return (
        <div className="space-y-2.5">
          {demoProperties.map((prop, i) => (
            <DemoPropertyCard
              key={prop.id}
              property={prop}
              visible={visibleCards > i}
              isBest={prop.isBest && activeStep >= 4}
              showReason={showReasons && visibleCards > i}
              scoreActive={scoreActive && visibleCards > i}
              index={i}
            />
          ))}

          {/* Step 5 — AI explanation */}
          {showExplanation && (
            <div
              className="rounded-xl px-4 py-3 mt-3 transition-all duration-500"
              style={{
                opacity: showExplanation ? 1 : 0,
                backgroundColor: "rgba(10, 96, 69,0.04)",
                border: "1px solid rgba(10, 96, 69,0.12)",
              }}
            >
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#0A6045" }}>
                  <Sparkles size={9} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-body font-semibold uppercase tracking-wider mb-1" style={{ color: "#0A6045" }}>
                    {t("howItWorksPage.homlyReasoning")}
                  </p>
                  <p className="text-[12px] font-body leading-relaxed" style={{ color: "#3D3B37" }}>
                    {t("howItWorksPage.reasoningText")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 6 — Scheduling card */}
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
                  <span className="text-[13px] font-body font-semibold" style={{ color: "#242424" }}>
                    {t("howItWorksPage.viewingAvailable")}
                    </span>
                    </div>
                    <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(10, 96, 69,0.1)", color: "#0A6045" }}>
                    {t("howItWorksPage.new")}
                </span>
              </div>
              <p className="text-[22px] font-body font-bold mb-1" style={{ color: "#242424" }}>
                {t("howItWorksPage.tomorrowViewing")}
              </p>
              <div className="flex items-center gap-2 text-[12px] font-body mb-3" style={{ color: "#999999" }}>
                <MapPin size={11} />
                <span>{t("howItWorksPage.arabkirYerevan")}</span>
              </div>
              <button
                className="w-full py-2.5 rounded-xl text-[13px] font-body font-semibold transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: "#0A6045", color: "#FFF" }}
              >
                {t("howItWorksPage.scheduleViewing")}
                </button>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

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
          <Link href="/for-owners" className="hidden md:block text-[13px] font-body font-medium transition-opacity hover:opacity-60" style={{ color: "#666" }}>
            {t("common.owners")}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 md:px-5 py-2 rounded-full text-[12px] md:text-[13px] font-body font-semibold transition-all duration-200 hover:shadow-md"
            style={{ backgroundColor: "#0A6045", color: "#FFF" }}
          >
            {t("common.startSearch")}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 pb-16 md:pb-20">
        {/* ── Hero ── */}
        <div className="text-center pt-8 md:pt-12 pb-8 md:pb-10">
          <h1
            className="font-heading font-extrabold tracking-tight"
            style={{ fontSize: "clamp(40px, 5.5vw, 64px)", color: "#242424", letterSpacing: "-0.03em" }}
          >
            {t("howItWorksPage.title")}
          </h1>
          <p
            className="mt-3 font-body max-w-[640px] mx-auto"
            style={{ fontSize: "clamp(14px, 1.2vw, 17px)", color: "#666666", lineHeight: "1.5" }}
          >
            {t("howItWorksPage.subtitle")}
          </p>
          <p
            className="mt-4 inline-block px-5 py-2 rounded-full font-body font-medium"
            style={{
              fontSize: "clamp(12px, 1vw, 14px)",
              color: "#0A6045",
              backgroundColor: "rgba(10, 96, 69,0.06)",
              border: "1px solid rgba(10, 96, 69,0.12)",
            }}
          >
            {t("howItWorksPage.badge")}
          </p>
        </div>

        {/* ── Animated Demo ── */}
        <div className="mb-16">
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
            <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ borderColor: "rgba(200,196,188,0.2)" }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(255,95,87,0.5)" }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(255,189,46,0.5)" }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(39,201,63,0.5)" }} />
              </div>
              <span className="text-[11px] font-body font-medium ml-3" style={{ color: "#A09D96" }}>
                {t("howItWorksPage.demo")}
              </span>
            </div>

            {/* Demo body — two columns */}
            <div className="flex flex-col md:flex-row" style={{ minHeight: "320px" }}>
              {/* Left — Step progression (hidden on mobile) */}
              <div className="hidden md:block w-[230px] flex-shrink-0 border-r p-4 space-y-0.5" style={{ borderColor: "rgba(200,196,188,0.15)", backgroundColor: "rgba(255,255,255,0.3)" }}>
                {leftSteps.map((label, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-500"
                    style={{
                      backgroundColor: i === activeStep ? "rgba(10, 96, 69,0.06)" : "transparent",
                      border: i === activeStep ? "1px solid rgba(10, 96, 69,0.15)" : "1px solid transparent",
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-body font-semibold transition-all duration-500"
                      style={{
                        backgroundColor: i === activeStep
                          ? "#0A6045"
                          : i < activeStep
                            ? "rgba(10, 96, 69,0.2)"
                            : "rgba(36,36,36,0.05)",
                        color: i === activeStep ? "#FFF" : i < activeStep ? "#0A6045" : "#BBBBBB",
                      }}
                    >
                      {i < activeStep ? "✓" : i + 1}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-[11px] font-body font-medium truncate transition-all duration-500"
                        style={{ color: i === activeStep ? "#242424" : i < activeStep ? "#666666" : "#BBBBBB" }}
                      >
                        {label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right — Animated content */}
              <div className="flex-1 p-6 flex flex-col justify-center overflow-hidden" style={{ backgroundColor: "rgba(249,249,247,0.5)" }}>
                <div className="mb-4">
                  <p className="text-[10px] font-body font-semibold uppercase tracking-wider mb-1" style={{ color: "#A09D96" }}>
                    {t("howItWorksPage.step")} {activeStep + 1} {t("howItWorksPage.of")} {TOTAL_STEPS}
                  </p>
                </div>

                {/* Dynamic content */}
                <div className="transition-all duration-500">
                  {renderDemoContent()}
                </div>

                {/* Step dots */}
                <div className="flex items-center gap-2 mt-6 justify-center">
                  {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveStep(i)}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === activeStep ? 22 : 5,
                        height: 5,
                        backgroundColor: i === activeStep ? "#0A6045" : "rgba(36,36,36,0.12)",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5 Step Cards ── */}
        <div className="mb-16">
          <h2 className="text-center font-heading font-bold mb-10" style={{ fontSize: "28px", color: "#242424" }}>
            {t("howItWorksPage.sectionTitle")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {steps.map((step, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 text-center transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: "rgba(255,255,255,0.5)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.7)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3.5"
                  style={{ backgroundColor: "rgba(10, 96, 69,0.08)" }}
                >
                  <step.icon size={20} style={{ color: "#0A6045" }} />
                </div>
                <p className="text-[10px] font-body font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#A09D96" }}>
                  Step {i + 1}
                </p>
                <h3 className="text-[14px] font-body font-semibold mb-2" style={{ color: "#242424" }}>
                  {step.title}
                </h3>
                <p className="text-[12px] font-body leading-relaxed" style={{ color: "#757570" }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Comparison Block ── */}
        <div className="mb-16">
          <h2 className="text-center font-heading font-bold mb-8" style={{ fontSize: "22px", color: "#242424" }}>
            {t("howItWorksPage.comparisonTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-[720px] mx-auto">
            {/* Traditional */}
            <div
              className="rounded-2xl p-6"
              style={{
                backgroundColor: "rgba(255,255,255,0.45)",
                border: "1px solid rgba(200,196,188,0.3)",
              }}
            >
              <p className="text-[12px] font-body font-semibold uppercase tracking-wider mb-4" style={{ color: "#A09D96" }}>
                {t("howItWorksPage.traditionalLabel")}
              </p>
              <ul className="space-y-3">
                {(tArray("howItWorksPage.traditionalItems") || comparison.traditional).map((item: string, i: number) => (
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
              className="rounded-2xl p-6"
              style={{
                backgroundColor: "rgba(10, 96, 69,0.04)",
                border: "1px solid rgba(10, 96, 69,0.15)",
                boxShadow: "0 0 0 2px rgba(10, 96, 69,0.03)",
              }}
            >
              <p className="text-[12px] font-body font-semibold uppercase tracking-wider mb-4" style={{ color: "#0A6045" }}>
                {t("howItWorksPage.homlyLabel")}
              </p>
              <ul className="space-y-3">
                {(tArray("howItWorksPage.homlyItems") || comparison.homly).map((item: string, i: number) => (
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

        {/* ── CTA ── */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[16px] font-body font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            style={{ backgroundColor: "#0A6045", color: "#FFF" }}
          >
            {t("howItWorksPage.cta")}
            <ArrowRight size={18} />
          </Link>
          <p className="text-[13px] font-body mt-3" style={{ color: "#999999" }}>
            {t("howItWorksPage.ctaSub")}
          </p>
        </div>
      </div>
    </div>
  );
}
