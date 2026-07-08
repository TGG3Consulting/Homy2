import React from "react";
import { Link } from "react-router-dom";
import { useT } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Footer() {
  const { t } = useT();

  const companyLinks = [
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
            <span className="font-display font-semibold tracking-[0.12em] uppercase text-white" style={{ fontSize: "16px" }}>
              Homly
            </span>
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
            <h4 className="text-[10px] font-semibold font-body uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.50)" }}>
              {t("footer.company")}
            </h4>
            <ul className="space-y-0.5">
              {companyLinks.map((link) => {
                const label = t(`footer.${link.labelKey || link.key}`);
                return (
                  <li key={link.key}>
                    {link.path !== "#" ? (
                      <Link
                        to={link.path}
                        className="text-[11px] font-body transition-colors duration-200"
                        style={{ color: "rgba(255,255,255,0.40)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#8B6CFF"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.40)"; }}
                      >
                        {label}
                      </Link>
                    ) : (
                      <a
                        href="#"
                        className="text-[11px] font-body transition-colors duration-200"
                        style={{ color: "rgba(255,255,255,0.40)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#8B6CFF"; }}
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
            <h4 className="text-[10px] font-semibold font-body uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.50)" }}>
              {t("footer.legal")}
            </h4>
            <ul className="space-y-0.5">
              {legalLinks.map((key) => (
                <li key={key}>
                  <a
                    href="#"
                    className="text-[11px] font-body transition-colors duration-200"
                    style={{ color: "rgba(255,255,255,0.40)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#8B6CFF"; }}
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
            <h4 className="text-[10px] font-semibold font-body uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.50)" }}>
              {t("footer.contacts")}
            </h4>
            <ul className="space-y-0.5">
              {contactLinks.map((key) => (
                <li key={key}>
                  <a
                    href="#"
                    className="text-[11px] font-body transition-colors duration-200"
                    style={{ color: "rgba(255,255,255,0.40)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#8B6CFF"; }}
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