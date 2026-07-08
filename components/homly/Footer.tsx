'use client';

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useT } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface CompanyLink {
  key: string;
  path: string;
  labelKey?: string;
}

export default function Footer() {
  const { t } = useT();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const companyLinks: CompanyLink[] = [
    { key: "aboutUs", path: "/about-us" },
    { key: "howItWorks", path: "/how-it-works", labelKey: "howItWorks" },
    { key: "forBuyers", path: "/for-buyers" },
    { key: "forRenters", path: "/for-renters" },
    { key: "forOwners", path: "/for-owners" },
    { key: "forAgencies", path: "#" },
    { key: "partners", path: "#" },
    { key: "careers", path: "#" },
  ];
  const legalLinks = ["publicOffer", "termsOfService", "privacyPolicy", "realEstateLegislation", "cookies"];
  const contactLinks = ["contacts", "support", "telegram", "whatsApp", "email", "officeAddress"];
  return (
    <footer
      className="relative z-10 w-full px-6 py-4"
      style={{
        background: "rgba(0, 0, 0, 0.35)",
        backdropFilter: "blur(30px) saturate(180%)",
        WebkitBackdropFilter: "blur(30px) saturate(180%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>

          {/* COLUMN 1 — Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <Image
                src="/logo/homy_mono_white.svg"
                alt="Homy"
                width={24}
                height={24}
                className="select-none"
              />
              <span className="font-display font-semibold tracking-[0.12em] uppercase text-white" style={{ fontSize: "16px" }}>
                Homy
              </span>
            </div>
            <p className="text-[11px] font-body leading-relaxed mt-1" style={{ color: "rgba(255,255,255,0.50)" }}>
              {t("footer.brandDescription")}
            </p>
            <p className="text-[10px] font-body mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              {t("footer.stats")}
            </p>
            <div className="mt-2">
              <LanguageSwitcher variant="dark" />
            </div>
          </div>

          {/* COLUMN 2 — Company */}
          <div>
            {/* Mobile accordion */}
            <button
              onClick={() => toggleSection('company')}
              className="md:hidden w-full flex items-center justify-between py-2"
            >
              <h4 className="text-[11px] font-semibold font-body uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.50)" }}>
                {t("footer.company")}
              </h4>
              <ChevronDown
                size={14}
                style={{ color: "rgba(255,255,255,0.40)" }}
                className={`transition-transform duration-200 ${expandedSection === 'company' ? 'rotate-180' : ''}`}
              />
            </button>
            {/* Desktop title */}
            <h4 className="hidden md:block text-[10px] font-semibold font-body uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.50)" }}>
              {t("footer.company")}
            </h4>
            {/* Links - always visible on desktop, expandable on mobile */}
            <ul className={`space-y-0.5 overflow-hidden transition-all duration-200 md:block ${expandedSection === 'company' ? 'max-h-96 pb-2' : 'max-h-0 md:max-h-none'}`}>
              {companyLinks.map((link) => {
                const label = t(`footer.${link.labelKey || link.key}`);
                return (
                  <li key={link.key}>
                    {link.path !== "#" ? (
                      <Link
                        href={link.path}
                        className="text-[11px] font-body transition-colors duration-200"
                        style={{ color: "rgba(255,255,255,0.40)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#0A6045"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.40)"; }}
                      >
                        {label}
                      </Link>
                    ) : (
                      <a
                        href="#"
                        className="text-[11px] font-body transition-colors duration-200"
                        style={{ color: "rgba(255,255,255,0.40)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#0A6045"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.40)"; }}
                      >
                        {label}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* COLUMN 3 — Legal */}
          <div>
            {/* Mobile accordion */}
            <button
              onClick={() => toggleSection('legal')}
              className="md:hidden w-full flex items-center justify-between py-2"
            >
              <h4 className="text-[11px] font-semibold font-body uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.50)" }}>
                {t("footer.legal")}
              </h4>
              <ChevronDown
                size={14}
                style={{ color: "rgba(255,255,255,0.40)" }}
                className={`transition-transform duration-200 ${expandedSection === 'legal' ? 'rotate-180' : ''}`}
              />
            </button>
            {/* Desktop title */}
            <h4 className="hidden md:block text-[10px] font-semibold font-body uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.50)" }}>
              {t("footer.legal")}
            </h4>
            {/* Links */}
            <ul className={`space-y-0.5 overflow-hidden transition-all duration-200 md:block ${expandedSection === 'legal' ? 'max-h-96 pb-2' : 'max-h-0 md:max-h-none'}`}>
              {legalLinks.map((key) => (
                <li key={key}>
                  <a
                    href="#"
                    className="text-[11px] font-body transition-colors duration-200"
                    style={{ color: "rgba(255,255,255,0.40)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#0A6045"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.40)"; }}
                  >
                    {t(`footer.${key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 4 — Contacts */}
          <div>
            {/* Mobile accordion */}
            <button
              onClick={() => toggleSection('contacts')}
              className="md:hidden w-full flex items-center justify-between py-2"
            >
              <h4 className="text-[11px] font-semibold font-body uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.50)" }}>
                {t("footer.contacts")}
              </h4>
              <ChevronDown
                size={14}
                style={{ color: "rgba(255,255,255,0.40)" }}
                className={`transition-transform duration-200 ${expandedSection === 'contacts' ? 'rotate-180' : ''}`}
              />
            </button>
            {/* Desktop title */}
            <h4 className="hidden md:block text-[10px] font-semibold font-body uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.50)" }}>
              {t("footer.contacts")}
            </h4>
            {/* Links */}
            <ul className={`space-y-0.5 overflow-hidden transition-all duration-200 md:block ${expandedSection === 'contacts' ? 'max-h-96 pb-2' : 'max-h-0 md:max-h-none'}`}>
              {contactLinks.map((key) => (
                <li key={key}>
                  <a
                    href="#"
                    className="text-[11px] font-body transition-colors duration-200"
                    style={{ color: "rgba(255,255,255,0.40)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#0A6045"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.40)"; }}
                  >
                    {t(`footer.${key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom line */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-1.5">
          <p className="text-[10px] font-body" style={{ color: "rgba(255,255,255,0.30)" }}>
            {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
