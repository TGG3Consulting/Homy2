import React, { useState } from "react";
import {
  Building2, Scale, Car, TreePine, TrendingUp, MapPin,
  ShieldCheck, AlertTriangle, CheckCircle, Clock,
  ShoppingCart, GraduationCap, Bus, Dumbbell, Landmark,
  ParkingCircle, Baby, Leaf, Volume2, Pill,
} from "lucide-react";
import { useT } from "@/lib/i18n";

const accentNeutral = "#555555";
const stone = "#B87333";
const green = "#22C55E";
const blue = "#3B82F6";
const textMain = "#242424";
const textBody = "#555555";
const textMuted = "#666666";
const textLight = "#999999";
const textFaded = "#AAAAAA";

export default function PropertyIntelligence({ property }) {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState("legal");

const tabs = [
  { id: "legal", label: t("propertyIntelligence.tabs.legal") },
  { id: "location", label: t("propertyIntelligence.tabs.location") },
  { id: "infra", label: t("propertyIntelligence.tabs.infrastructure") },
  { id: "invest", label: t("propertyIntelligence.tabs.investment") },
];

function ScoreBar({ label, score, color }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] font-body w-[100px] flex-shrink-0" style={{ color: textMuted }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color || accentNeutral }} />
      </div>
      <span className="text-[11px] font-body font-semibold w-[28px] text-right" style={{ color: color || accentNeutral }}>{score}</span>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, status }) {
  const statusColor = status === "good" ? green : status === "caution" ? stone : blue;
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Icon size={12} style={{ color: statusColor }} />
      <span className="text-[11px] font-body flex-1" style={{ color: textBody }}>{label}</span>
      <span className="text-[11px] font-body font-medium" style={{ color: statusColor }}>{value}</span>
    </div>
  );
}

  const renderTab = () => {
    switch (activeTab) {
      case "legal":
        return (
          <div className="space-y-2">
            <InfoRow icon={Building2} label={t("propertyIntelligence.legal.developerBackground")} value={t("propertyIntelligence.legal.verified")} status="good" />
            <InfoRow icon={Scale} label={t("propertyIntelligence.legal.activeLegalClaims")} value={t("propertyIntelligence.legal.noneFound")} status="good" />
            <InfoRow icon={AlertTriangle} label={t("propertyIntelligence.legal.doubleSaleRisk")} value={t("propertyIntelligence.legal.noSignals")} status="good" />
            <InfoRow icon={ShieldCheck} label={t("propertyIntelligence.legal.ownershipRegistration")} value={t("propertyIntelligence.legal.singleOwner")} status="good" />
            <InfoRow icon={CheckCircle} label={t("propertyIntelligence.legal.titleDocumentation")} value={t("propertyIntelligence.legal.reviewRecommended")} status="caution" />
            <p className="text-[9px] font-body mt-2 pt-2 border-t" style={{ color: textFaded, borderColor: "rgba(0,0,0,0.06)" }}>
              {t("propertyIntelligence.sourcesText")}
            </p>
          </div>
        );
      case "location":
        return (
          <div className="space-y-2">
            <InfoRow icon={Car} label={t("propertyIntelligence.location.commuteAM")} value={t("propertyIntelligence.location.min18")} status="good" />
            <InfoRow icon={Car} label={t("propertyIntelligence.location.commutePM")} value={t("propertyIntelligence.location.min24")} status="caution" />
            <InfoRow icon={MapPin} label={t("propertyIntelligence.location.distanceHighway")} value={t("propertyIntelligence.location.m350")} status="good" />
            <InfoRow icon={Volume2} label={t("propertyIntelligence.location.noiseEstimate")} value={t("propertyIntelligence.location.low")} status="good" />
            <InfoRow icon={Leaf} label={t("propertyIntelligence.location.ecologyIndex")} value={t("propertyIntelligence.location.good")} status="good" />
            <InfoRow icon={ParkingCircle} label={t("propertyIntelligence.location.parkingAvailability")} value={t("propertyIntelligence.location.streetLot")} status="good" />
            <InfoRow icon={Baby} label={t("propertyIntelligence.location.playgroundsNearby")} value={t("propertyIntelligence.location.within300m")} status="good" />
            <InfoRow icon={TreePine} label={t("propertyIntelligence.location.parksGreen")} value={t("propertyIntelligence.location.arabkirPark")} status="good" />
          </div>
        );
      case "infra":
        return (
          <div className="space-y-2">
            <InfoRow icon={ShoppingCart} label={t("propertyIntelligence.infra.supermarkets")} value={t("propertyIntelligence.infra.nearby3")} status="good" />
            <InfoRow icon={Pill} label={t("propertyIntelligence.infra.pharmacies")} value={t("propertyIntelligence.infra.nearby2")} status="good" />
            <InfoRow icon={Landmark} label={t("propertyIntelligence.infra.banks")} value={t("propertyIntelligence.infra.nearby4")} status="good" />
            <InfoRow icon={GraduationCap} label={t("propertyIntelligence.infra.schools")} value={t("propertyIntelligence.infra.school55")} status="good" />
            <InfoRow icon={Baby} label={t("propertyIntelligence.infra.kindergartens")} value={t("propertyIntelligence.infra.within500m")} status="good" />
            <InfoRow icon={Bus} label={t("propertyIntelligence.infra.publicTransport")} value={t("propertyIntelligence.infra.busStop")} status="good" />
            <InfoRow icon={Dumbbell} label={t("propertyIntelligence.infra.gyms")} value={t("propertyIntelligence.infra.nearby4")} status="good" />
          </div>
        );
      case "invest":
        return (
          <div className="space-y-3">
            <ScoreBar label={t("propertyIntelligence.invest.investmentScore")} score={72} color={blue} />
            <ScoreBar label={t("propertyIntelligence.invest.priceVsMarket")} score={88} color={green} />
            <ScoreBar label={t("propertyIntelligence.invest.constructionPace")} score={65} color={stone} />
            <ScoreBar label={t("propertyIntelligence.invest.transactionPace")} score={71} color={blue} />
            <ScoreBar label={t("propertyIntelligence.invest.demandSignals")} score={79} color={green} />
            <div className="flex items-center gap-1.5 pt-1">
              <Landmark size={10} style={{ color: textFaded }} />
              <span className="text-[10px] font-body" style={{ color: textFaded }}>{t("propertyIntelligence.cadastreText")}</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <h4 className="text-[11px] font-semibold font-body uppercase tracking-wider mb-3" style={{ color: textMuted }}>
        {t("propertyIntelligence.title")}
      </h4>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-2.5 py-1 rounded-full text-[10px] font-medium font-body transition-all duration-200"
            style={{
              backgroundColor: activeTab === tab.id ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.02)",
              color: activeTab === tab.id ? textMain : textLight,
              border: activeTab === tab.id ? "1px solid rgba(0,0,0,0.12)" : "1px solid rgba(0,0,0,0.06)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "rgba(255,255,255,0.50)", border: "1px solid rgba(0,0,0,0.06)" }}
      >
        {renderTab()}
      </div>

      {/* AI summary */}
      <div
        className="rounded-xl p-3.5 mt-3"
        style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)" }}
      >
        <p className="text-[12px] font-body leading-relaxed" style={{ color: textBody }}>
          <span className="font-semibold" style={{ color: textMain }}>{t("propertyIntelligence.homlyView")}: </span>
          {property.is_top_choice
            ? t("propertyIntelligence.viewBest")
            : t("propertyIntelligence.viewOther")
          }
        </p>
      </div>

      {/* Disclaimer */}
      <p className="text-[9px] font-body mt-2.5 leading-relaxed" style={{ color: textFaded }}>
        {t("propertyIntelligence.aiDisclaimer")}
      </p>
    </div>
  );
}