'use client';

import React, { useState, useEffect } from "react";
import {
  Building2, Scale, Car, TreePine, TrendingUp, MapPin,
  ShieldCheck, AlertTriangle, CheckCircle, Clock,
  ShoppingCart, GraduationCap, Bus, Dumbbell, Landmark,
  ParkingCircle, Baby, Leaf, Volume2, Pill,
  LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n";

// TypeScript interfaces for API response
interface LegalIntelligence {
  developer_verified: boolean;
  developer_name: string;
  claims_count: number;
  double_sale_risk: boolean;
  ownership_status: string;
  title_status: string;
}

interface LocationIntelligence {
  commute_am: number;
  commute_pm: number;
  highway_distance: number;
  noise_level: string;
  ecology_index: string;
  parking_available: string;
  playgrounds_nearby: string;
  parks_nearby: string;
}

interface InfrastructureIntelligence {
  supermarkets: number;
  pharmacies: number;
  banks: number;
  schools: string;
  transport: string;
}

interface InvestmentIntelligence {
  score: number;
  price_vs_market: number;
  demand_signals: number;
  roi_estimate: number;
  appreciation_forecast: number;
}

interface PropertyIntelligenceData {
  legal: LegalIntelligence;
  location: LocationIntelligence;
  infrastructure: InfrastructureIntelligence;
  investment: InvestmentIntelligence;
}

interface PropertyIntelligenceProps {
  property: {
    id: string | number;
    is_top_choice?: boolean;
  };
}

interface ScoreBarProps {
  label: string;
  score: number;
  color?: string;
}

interface InfoRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
  status: "good" | "caution" | "info";
}

const accentNeutral = "#555555";
const stone = "#B87333";
const green = "#22C55E";
const blue = "#3B82F6";
const textMain = "#242424";
const textBody = "#555555";
const textMuted = "#666666";
const textLight = "#999999";
const textFaded = "#AAAAAA";

export default function PropertyIntelligence({ property }: PropertyIntelligenceProps) {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState("legal");
  const [data, setData] = useState<PropertyIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIntelligence() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/properties/${property.id}/intelligence`);
        if (!response.ok) {
          throw new Error(`Failed to fetch intelligence data: ${response.status}`);
        }
        const intelligenceData: PropertyIntelligenceData = await response.json();
        setData(intelligenceData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (property?.id) {
      fetchIntelligence();
    }
  }, [property?.id]);

const tabs = [
  { id: "legal", label: t("propertyIntelligence.tabs.legal") },
  { id: "location", label: t("propertyIntelligence.tabs.location") },
  { id: "infra", label: t("propertyIntelligence.tabs.infrastructure") },
  { id: "invest", label: t("propertyIntelligence.tabs.investment") },
];

function ScoreBar({ label, score, color }: ScoreBarProps) {
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

function InfoRow({ icon: Icon, label, value, status }: InfoRowProps) {
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
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-4">
          <p className="text-[11px] font-body" style={{ color: stone }}>{error}</p>
        </div>
      );
    }

    if (!data) {
      return null;
    }

    switch (activeTab) {
      case "legal":
        return (
          <div className="space-y-2">
            <InfoRow icon={Building2} label={t("propertyIntelligence.legal.developerBackground")} value={data.legal.developer_verified ? t("propertyIntelligence.legal.verified") : t("propertyIntelligence.legal.unverified")} status={data.legal.developer_verified ? "good" : "caution"} />
            <InfoRow icon={Scale} label={t("propertyIntelligence.legal.activeLegalClaims")} value={data.legal.claims_count === 0 ? t("propertyIntelligence.legal.noneFound") : `${data.legal.claims_count} found`} status={data.legal.claims_count === 0 ? "good" : "caution"} />
            <InfoRow icon={AlertTriangle} label={t("propertyIntelligence.legal.doubleSaleRisk")} value={data.legal.double_sale_risk ? t("propertyIntelligence.legal.riskDetected") : t("propertyIntelligence.legal.noSignals")} status={data.legal.double_sale_risk ? "caution" : "good"} />
            <InfoRow icon={ShieldCheck} label={t("propertyIntelligence.legal.ownershipRegistration")} value={t(`propertyIntelligence.legal.${data.legal.ownership_status}`) || data.legal.ownership_status} status={data.legal.ownership_status === "single_owner" ? "good" : "caution"} />
            <InfoRow icon={CheckCircle} label={t("propertyIntelligence.legal.titleDocumentation")} value={data.legal.title_status === "complete" ? t("propertyIntelligence.legal.complete") : t("propertyIntelligence.legal.reviewRecommended")} status={data.legal.title_status === "complete" ? "good" : "caution"} />
            <p className="text-[9px] font-body mt-2 pt-2 border-t" style={{ color: textFaded, borderColor: "rgba(0,0,0,0.06)" }}>
              {t("propertyIntelligence.sourcesText")}
            </p>
          </div>
        );
      case "location":
        return (
          <div className="space-y-2">
            <InfoRow icon={Car} label={t("propertyIntelligence.location.commuteAM")} value={`${data.location.commute_am} min`} status={data.location.commute_am <= 20 ? "good" : "caution"} />
            <InfoRow icon={Car} label={t("propertyIntelligence.location.commutePM")} value={`${data.location.commute_pm} min`} status={data.location.commute_pm <= 20 ? "good" : "caution"} />
            <InfoRow icon={MapPin} label={t("propertyIntelligence.location.distanceHighway")} value={`${data.location.highway_distance}m`} status="good" />
            <InfoRow icon={Volume2} label={t("propertyIntelligence.location.noiseEstimate")} value={data.location.noise_level} status={data.location.noise_level === "low" ? "good" : "caution"} />
            <InfoRow icon={Leaf} label={t("propertyIntelligence.location.ecologyIndex")} value={data.location.ecology_index} status={data.location.ecology_index === "good" ? "good" : "caution"} />
            <InfoRow icon={ParkingCircle} label={t("propertyIntelligence.location.parkingAvailability")} value={data.location.parking_available} status="good" />
            <InfoRow icon={Baby} label={t("propertyIntelligence.location.playgroundsNearby")} value={data.location.playgrounds_nearby} status="good" />
            <InfoRow icon={TreePine} label={t("propertyIntelligence.location.parksGreen")} value={data.location.parks_nearby} status="good" />
          </div>
        );
      case "infra":
        return (
          <div className="space-y-2">
            <InfoRow icon={ShoppingCart} label={t("propertyIntelligence.infra.supermarkets")} value={`${data.infrastructure.supermarkets} nearby`} status="good" />
            <InfoRow icon={Pill} label={t("propertyIntelligence.infra.pharmacies")} value={`${data.infrastructure.pharmacies} nearby`} status="good" />
            <InfoRow icon={Landmark} label={t("propertyIntelligence.infra.banks")} value={`${data.infrastructure.banks} nearby`} status="good" />
            <InfoRow icon={GraduationCap} label={t("propertyIntelligence.infra.schools")} value={data.infrastructure.schools} status="good" />
            <InfoRow icon={Baby} label={t("propertyIntelligence.infra.kindergartens")} value={t("propertyIntelligence.infra.within500m")} status="good" />
            <InfoRow icon={Bus} label={t("propertyIntelligence.infra.publicTransport")} value={data.infrastructure.transport} status="good" />
            <InfoRow icon={Dumbbell} label={t("propertyIntelligence.infra.gyms")} value={t("propertyIntelligence.infra.nearby4")} status="good" />
          </div>
        );
      case "invest":
        return (
          <div className="space-y-3">
            <ScoreBar label={t("propertyIntelligence.invest.investmentScore")} score={data.investment.score} color={blue} />
            <ScoreBar label={t("propertyIntelligence.invest.priceVsMarket")} score={data.investment.price_vs_market} color={green} />
            <ScoreBar label={t("propertyIntelligence.invest.constructionPace")} score={data.investment.roi_estimate} color={stone} />
            <ScoreBar label={t("propertyIntelligence.invest.transactionPace")} score={data.investment.appreciation_forecast} color={blue} />
            <ScoreBar label={t("propertyIntelligence.invest.demandSignals")} score={data.investment.demand_signals} color={green} />
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

      {/* Disclaimer */}
      <p className="text-[9px] font-body mt-2.5 leading-relaxed" style={{ color: textFaded }}>
        {t("propertyIntelligence.aiDisclaimer")}
      </p>
    </div>
  );
}
