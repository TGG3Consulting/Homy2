import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, MapPin, Star, Bed, Maximize2,
  CheckCircle, Clock, ShieldCheck, AlertTriangle,
} from "lucide-react";
import { useT } from "@/lib/i18n";

const buyProperties = [
  {
    id: "b1",
    title: "Spacious 3-bedroom near School #55",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=260&fit=crop",
    price: "$78,000",
    neighborhood: "Arabkir",
    rooms: 3,
    area: 85,
    score: 94,
    isBest: true,
  },
  {
    id: "b2",
    title: "Modern apartment with city view",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=260&fit=crop",
    price: "$92,000",
    neighborhood: "Kentron",
    rooms: 2,
    area: 72,
    score: 88,
    isBest: false,
  },
  {
    id: "b3",
    title: "Bright 3-room with garden access",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=260&fit=crop",
    price: "$71,000",
    neighborhood: "Davtashen",
    rooms: 3,
    area: 91,
    score: 86,
    isBest: false,
  },
];

const TOTAL = 7;

function useCounter(target, active) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let cur = 0;
    const step = Math.ceil(target / 50);
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(cur);
      if (cur >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [target, active]);
  return val;
}

function MiniCard({ p, visible, best, counting, idx }) {
  const score = useCounter(p.score, counting);
  return (
    <div
      className="rounded-lg overflow-hidden flex transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        backgroundColor: "rgba(255,255,255,0.7)",
        border: best ? "1px solid rgba(139,108,255,0.3)" : "1px solid rgba(200,196,188,0.2)",
        boxShadow: best ? "0 0 0 3px rgba(139,108,255,0.08)" : "0 2px 6px rgba(0,0,0,0.03)",
        transitionDelay: `${idx * 500}ms`,
      }}
    >
      <div className="w-[110px] h-[82px] flex-shrink-0 overflow-hidden">
        <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0 px-3 py-2">
        <div className="flex items-start justify-between gap-1">
          <p className="text-[11px] font-body font-semibold truncate" style={{ color: "#242424" }}>{p.title}</p>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {best && <Star size={9} fill="#8B6CFF" style={{ color: "#8B6CFF" }} />}
            <span className="text-[11px] font-body font-bold" style={{ color: best ? "#8B6CFF" : "#999" }}>{score}%</span>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin size={8} style={{ color: "#B5B3AD" }} />
          <span className="text-[10px] font-body" style={{ color: "#757570" }}>{p.neighborhood}</span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-[10px] font-body" style={{ color: "#999" }}>
          <span><Bed size={8} style={{ display: "inline", marginRight: 2, color: "#8B6CFF" }} />{p.rooms} rooms</span>
          <span><Maximize2 size={8} style={{ display: "inline", marginRight: 2, color: "#8B6CFF" }} />{p.area} m²</span>
        </div>
        <p className="text-[11px] font-body font-semibold mt-0.5" style={{ color: "#242424" }}>{p.price}</p>
      </div>
    </div>
  );
}

export default function BuyerDemo() {
  const { t } = useT();
  const [step, setStep] = useState(0);
  const [cards, setCards] = useState(0);
  const [counting, setCounting] = useState(false);
  const sidebarLabels = t("buyerDemo.sidebarLabels");
  const criteriaChips = t("buyerDemo.criteriaChips");
  const risks = t("buyerDemo.risks");

  useEffect(() => {
    const timings = [3200, 2800, 4000, 3500, 3000, 3500, 5000];
    if (step >= TOTAL - 1) {
      const t = setTimeout(() => { setStep(0); setCards(0); setCounting(false); }, timings[TOTAL - 1]);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), timings[step]);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (step === 2) {
      setCards(0); setCounting(false);
      const t1 = setTimeout(() => setCards(1), 300);
      const t2 = setTimeout(() => setCards(2), 900);
      const t3 = setTimeout(() => { setCards(3); setCounting(true); }, 1500);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [step]);

  const renderContent = () => {
    if (step === 0) {
      return (
        <div className="flex justify-end">
          <div className="max-w-[78%] rounded-2xl rounded-br-md px-4 py-3" style={{ backgroundColor: "rgba(139,108,255,0.08)", border: "1px solid rgba(139,108,255,0.1)" }}>
            <p className="text-[13px] font-body leading-relaxed" style={{ color: "#242424" }}>
              {t("buyerDemo.userMessage")}
            </p>
          </div>
        </div>
      );
    }
    if (step === 1) {
      return (
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(139,108,255,0.1)" }}>
            <Sparkles size={10} style={{ color: "#8B6CFF" }} />
          </div>
          <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "rgba(255,255,255,0.6)", border: "1px solid rgba(200,196,188,0.3)" }}>
            <p className="text-[12px] font-body font-medium mb-1.5" style={{ color: "#242424" }}>{t("buyerDemo.extractingCriteria")}</p>
            <div className="flex flex-wrap gap-1.5">
              {(Array.isArray(criteriaChips) ? criteriaChips : ["Budget: $85k", "3 bedrooms", "Yerevan", "Near school", "Buy"]).map((c) => (
                <span key={c} className="px-2 py-0.5 rounded-full text-[9px] font-body font-medium" style={{ backgroundColor: "rgba(139,108,255,0.08)", color: "#8B6CFF" }}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      );
    }
    if (step >= 2) {
      return (
        <div className="space-y-2">
          {buyProperties.map((p, i) => (
            <MiniCard key={p.id} p={p} visible={cards > i} best={p.isBest && step >= 3} counting={counting && cards > i} idx={i} />
          ))}

          {/* Step 3 — District comparison */}
          {step >= 3 && (
            <div className="rounded-lg px-3.5 py-2.5 mt-2" style={{ backgroundColor: "rgba(139,108,255,0.04)", border: "1px solid rgba(139,108,255,0.12)" }}>
              <p className="text-[9px] font-body font-semibold uppercase tracking-wider mb-1" style={{ color: "#8B6CFF" }}>{t("buyerDemo.districtsCompared")}</p>
              <div className="flex gap-4 text-[10px] font-body" style={{ color: "#3D3B37" }}>
                <div>
                  <span className="font-semibold">Arabkir</span>
                  <span className="ml-1" style={{ color: "#999" }}>{t("buyerDemo.arabkirSchools")}</span>
                </div>
                <div>
                  <span className="font-semibold">Kentron</span>
                  <span className="ml-1" style={{ color: "#999" }}>{t("buyerDemo.kentronTransit")}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Price check */}
          {step >= 4 && (
            <div className="rounded-lg px-3.5 py-2.5 flex items-center gap-2" style={{ backgroundColor: "rgba(255,255,255,0.6)", border: "1px solid rgba(200,196,188,0.2)" }}>
              <CheckCircle size={12} style={{ color: "#22C55E" }} />
              <p className="text-[11px] font-body" style={{ color: "#3D3B37" }}>
                <span className="font-semibold">{t("buyerDemo.priceCheck")}:</span> {t("buyerDemo.priceCheckText")}
              </p>
            </div>
          )}

          {/* Step 5 — Risk checklist */}
          {step >= 5 && (
            <div className="rounded-lg px-3.5 py-2.5" style={{ backgroundColor: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)" }}>
              <p className="text-[9px] font-body font-semibold uppercase tracking-wider mb-1" style={{ color: "#D4A54A" }}>{t("buyerDemo.riskAnalysis")}</p>
              <div className="space-y-1">
                {(Array.isArray(risks) ? risks : ["Building year: 1985 — check structural report", "Ownership: 1 owner — clean title"]).map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <AlertTriangle size={9} style={{ color: i === 0 ? "#D4A54A" : "#22C55E" }} />
                    <span className="text-[10px] font-body" style={{ color: "#3D3B37" }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 6 — Schedule viewing */}
          {step >= 6 && (
            <div className="rounded-lg p-3.5 mt-1" style={{ backgroundColor: "rgba(255,255,255,0.7)", border: "1px solid rgba(200,196,188,0.3)", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} style={{ color: "#8B6CFF" }} />
                  <span className="text-[12px] font-body font-semibold" style={{ color: "#242424" }}>{t("buyerDemo.viewingAvailable")}</span>
                </div>
                <span className="text-[9px] font-body font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(139,108,255,0.1)", color: "#8B6CFF" }}>{t("buyerDemo.new")}</span>
              </div>
              <p className="text-[18px] font-body font-bold mb-0.5" style={{ color: "#242424" }}>Tomorrow at 15:30</p>
              <div className="flex items-center gap-1.5 text-[10px] font-body mb-2.5" style={{ color: "#999" }}>
                <MapPin size={9} /><span>Arabkir, Yerevan</span>
              </div>
              <button className="w-full py-2 rounded-lg text-[12px] font-body font-semibold" style={{ backgroundColor: "#8B6CFF", color: "#FFF" }}>
                {t("buyerDemo.scheduleViewing")}
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
      className="rounded-3xl overflow-hidden"
      style={{
        backgroundColor: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 12px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      <div className="flex items-center gap-2 px-5 py-3.5 border-b" style={{ borderColor: "rgba(200,196,188,0.2)" }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "rgba(255,95,87,0.5)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "rgba(255,189,46,0.5)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "rgba(39,201,63,0.5)" }} />
        </div>
        <span className="text-[10px] font-body font-medium ml-2" style={{ color: "#A09D96" }}>{t("buyerDemo.assistant")}</span>
      </div>

      <div className="flex" style={{ minHeight: "380px" }}>
        {/* Sidebar */}
        <div className="w-[200px] flex-shrink-0 border-r p-3.5 space-y-0.5" style={{ borderColor: "rgba(200,196,188,0.15)", backgroundColor: "rgba(255,255,255,0.3)" }}>
          {(Array.isArray(sidebarLabels) ? sidebarLabels : ["You describe your need","Criteria extracted","Properties found","Districts compared","Price check","Risks analyzed","Schedule viewing"]).map((label, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-500"
              style={{
                backgroundColor: i === step ? "rgba(139,108,255,0.06)" : "transparent",
                border: i === step ? "1px solid rgba(139,108,255,0.15)" : "1px solid transparent",
              }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-body font-semibold transition-all duration-500"
                style={{
                  backgroundColor: i === step ? "#8B6CFF" : i < step ? "rgba(139,108,255,0.2)" : "rgba(36,36,36,0.05)",
                  color: i === step ? "#FFF" : i < step ? "#8B6CFF" : "#BBB",
                }}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <p className="text-[10px] font-body font-medium truncate" style={{ color: i === step ? "#242424" : i < step ? "#666" : "#BBB" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col justify-center overflow-hidden" style={{ backgroundColor: "rgba(249,249,247,0.5)" }}>
          <p className="text-[9px] font-body font-semibold uppercase tracking-wider mb-3" style={{ color: "#A09D96" }}>{t("buyerDemo.step")} {step + 1} {t("buyerDemo.of")} {TOTAL}</p>
          <div className="transition-all duration-500">{renderContent()}</div>
          <div className="flex items-center gap-1.5 mt-5 justify-center">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <button key={i} onClick={() => setStep(i)} className="rounded-full transition-all duration-300" style={{ width: i === step ? 20 : 4, height: 4, backgroundColor: i === step ? "#8B6CFF" : "rgba(36,36,36,0.12)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}