'use client';

import React from "react";
import Link from "next/link";
import { ArrowRight, Linkedin, Mail } from "lucide-react";
import { useT } from "@/lib/i18n";
import UserAuthButton from '@/components/UserAuthButton';

const violet = "#0A6045";
const BG = "#F3F2EF";

function FounderAvatar({ gradient }: { gradient: string }) {
  return (
    <div
      className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{
        background: gradient,
        boxShadow: "0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.4)",
      }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}

function FounderCard({ avatarGradient, name, role, bio, linkedinUrl, emailUrl }: {
  avatarGradient: string;
  name: string;
  role: string;
  bio: string;
  linkedinUrl?: string;
  emailUrl?: string;
}) {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col sm:flex-row gap-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        backgroundColor: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(24px) saturate(140%)",
        WebkitBackdropFilter: "blur(24px) saturate(140%)",
        border: "1px solid rgba(255,255,255,0.65)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      <FounderAvatar gradient={avatarGradient} />
      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] font-heading font-bold mb-0.5" style={{ color: "#242424" }}>{name}</h3>
        <p className="text-[11px] font-body font-medium uppercase tracking-wider mb-2" style={{ color: violet }}>{role}</p>
        <p className="text-[12px] font-body leading-relaxed mb-3" style={{ color: "#555" }}>{bio}</p>
        <div className="flex items-center gap-2">
          <a
            href={linkedinUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{ backgroundColor: "rgba(10, 96, 69,0.08)", color: violet, border: "1px solid rgba(10, 96, 69,0.15)" }}
          >
            <Linkedin size={14} />
          </a>
          <a
            href={emailUrl || "#"}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{ backgroundColor: "rgba(0,0,0,0.03)", color: "#555", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <Mail size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

function DifferentItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="flex-shrink-0 mt-[3px] w-1.5 h-1.5 rounded-full" style={{ backgroundColor: violet }} />
      <span className="text-[13px] font-body" style={{ color: "#444" }}>{children}</span>
    </li>
  );
}

function MissionCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col transition-all duration-300 hover:-translate-y-0.5"
      style={{
        backgroundColor: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(24px) saturate(140%)",
        WebkitBackdropFilter: "blur(24px) saturate(140%)",
        border: "1px solid rgba(255,255,255,0.65)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      <span className="text-[32px] font-heading font-bold mb-2" style={{ color: violet, lineHeight: 1 }}>{number}</span>
      <h4 className="text-[14px] font-heading font-semibold mb-1.5" style={{ color: "#242424" }}>{title}</h4>
      <p className="text-[12px] font-body leading-relaxed" style={{ color: "#666" }}>{description}</p>
    </div>
  );
}

// Armenia outline SVG component (inline to avoid missing import)
function ArmeniaOutline() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ opacity: 0.03 }}
    >
      <svg
        viewBox="0 0 800 600"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: "140%", height: "140%" }}
      >
        <path
          d="M400 100 L500 150 L600 200 L650 300 L600 400 L500 450 L400 500 L300 450 L200 400 L150 300 L200 200 L300 150 Z"
          fill="none"
          stroke="#242424"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

export default function AboutUs() {
  const { t } = useT();

  return (
    <div className="relative w-full min-h-screen" style={{ background: `radial-gradient(ellipse at 50% 20%, #F8F7F5 0%, ${BG} 70%)` }}>
      <div className="absolute top-4 right-4 z-50">
        <UserAuthButton variant="light" />
      </div>
      <ArmeniaOutline />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-16 space-y-16">
        {/* HERO */}
        <section className="text-center space-y-5">
          <h1
            className="font-heading font-extrabold tracking-tight leading-tight"
            style={{ fontSize: "clamp(28px, 4vw, 42px)", color: "#242424", letterSpacing: "-0.03em" }}
          >
            {t("aboutUsPage.heroTitle")}
          </h1>
          <p
            className="font-body max-w-[640px] mx-auto"
            style={{ fontSize: "clamp(13px, 1.1vw, 15px)", color: "#666", lineHeight: "1.6" }}
          >
            {t("aboutUsPage.heroSubtitle")}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-body font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{ backgroundColor: violet, color: "#FFF", boxShadow: "0 4px 16px rgba(10, 96, 69,0.3)" }}
            >
              {t("aboutUsPage.ctaStartSearch")}
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-body font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: "rgba(255,255,255,0.85)",
                color: "#242424",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              {t("aboutUsPage.ctaHowItWorks")}
            </Link>
          </div>
        </section>

        {/* OUR STORY */}
        <section
          className="rounded-3xl p-8 md:p-10"
          style={{
            backgroundColor: "rgba(255,255,255,0.78)",
            backdropFilter: "blur(36px) saturate(160%)",
            WebkitBackdropFilter: "blur(36px) saturate(160%)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "0 12px 60px rgba(0,0,0,0.05), 0 3px 12px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.95)",
          }}
        >
          <h2 className="text-[11px] font-body font-semibold uppercase tracking-wider mb-3" style={{ color: violet }}>
            {t("aboutUsPage.storyTitle")}
          </h2>
          <p
            className="font-body leading-relaxed"
            style={{ fontSize: "clamp(13px, 1.1vw, 15px)", color: "#444", lineHeight: "1.75" }}
          >
            {t("aboutUsPage.storyText")}
          </p>
        </section>

        {/* MISSION */}
        <section className="text-center space-y-7">
          <div>
            <h2 className="font-heading font-bold mb-2" style={{ fontSize: "clamp(20px, 2.5vw, 28px)", color: "#242424", letterSpacing: "-0.02em" }}>
              {t("aboutUsPage.missionTitle")}
            </h2>
            <p className="font-body max-w-[500px] mx-auto" style={{ fontSize: "14px", color: "#666", lineHeight: "1.6" }}>
              {t("aboutUsPage.missionText")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MissionCard number="01" title={t("aboutUsPage.mission1Title")} description={t("aboutUsPage.mission1Text")} />
            <MissionCard number="02" title={t("aboutUsPage.mission2Title")} description={t("aboutUsPage.mission2Text")} />
            <MissionCard number="03" title={t("aboutUsPage.mission3Title")} description={t("aboutUsPage.mission3Text")} />
          </div>
        </section>

        {/* WHAT MAKES HOMLY DIFFERENT */}
        <section
          className="rounded-3xl p-8 md:p-10"
          style={{
            backgroundColor: "rgba(255,255,255,0.78)",
            backdropFilter: "blur(36px) saturate(160%)",
            WebkitBackdropFilter: "blur(36px) saturate(160%)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "0 12px 60px rgba(0,0,0,0.05), 0 3px 12px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.95)",
          }}
        >
          <h2 className="text-[11px] font-body font-semibold uppercase tracking-wider mb-4" style={{ color: violet }}>
            {t("aboutUsPage.differentTitle")}
          </h2>
          <ul className="space-y-2.5 mb-5">
            <DifferentItem>{t("aboutUsPage.different1")}</DifferentItem>
            <DifferentItem>{t("aboutUsPage.different2")}</DifferentItem>
            <DifferentItem>{t("aboutUsPage.different3")}</DifferentItem>
            <DifferentItem>{t("aboutUsPage.different4")}</DifferentItem>
            <DifferentItem>{t("aboutUsPage.different5")}</DifferentItem>
            <DifferentItem>{t("aboutUsPage.different6")}</DifferentItem>
            <DifferentItem>{t("aboutUsPage.different7")}</DifferentItem>
          </ul>
          <div
            className="rounded-xl px-4 py-3"
            style={{
              backgroundColor: "rgba(10, 96, 69,0.04)",
              border: "1px solid rgba(10, 96, 69,0.1)",
            }}
          >
            <p className="text-[12px] font-body italic" style={{ color: "#555", lineHeight: "1.6" }}>
              {t("aboutUsPage.differentStatement")}
            </p>
          </div>
        </section>

        {/* TEAM */}
        <section className="space-y-7">
          <div className="text-center">
            <h2 className="font-heading font-bold" style={{ fontSize: "clamp(20px, 2.5vw, 28px)", color: "#242424", letterSpacing: "-0.02em" }}>
              {t("aboutUsPage.teamTitle")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FounderCard
              avatarGradient="linear-gradient(135deg, #0A6045 0%, #12A574 100%)"
              name={t("aboutUsPage.founder1Name")}
              role={t("aboutUsPage.founder1Role")}
              bio={t("aboutUsPage.founder1Bio")}
            />
            <FounderCard
              avatarGradient="linear-gradient(135deg, #D4A54A 0%, #E8C97A 100%)"
              name={t("aboutUsPage.founder2Name")}
              role={t("aboutUsPage.founder2Role")}
              bio={t("aboutUsPage.founder2Bio")}
            />
          </div>
        </section>
      </div>

      {/* Simple Footer */}
      <footer className="relative z-10 py-8 border-t" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[12px] font-body" style={{ color: "#999" }}>
            Homy - AI-powered real estate search
          </p>
        </div>
      </footer>
    </div>
  );
}
