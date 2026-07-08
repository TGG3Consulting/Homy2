import React from "react";
import { useT } from "@/lib/i18n";

export default function TrustMetrics() {
  const { t } = useT();

  const metrics = [
    { value: "1,500", key: "propertiesAnalyzed" },
    { value: "15", key: "citiesCovered" },
    { value: "350+", key: "dealsAssisted" },
  ];
  return (
    <div className="flex items-center justify-center gap-8">
      {metrics.map((metric, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-0.5">
            <span
              className="text-[22px] font-heading font-bold tracking-tight"
              style={{ color: "#242424" }}
            >
              {metric.value}
            </span>
            <span
              className="text-[10px] font-body font-medium uppercase tracking-[0.12em]"
              style={{ color: "rgba(36,36,36,0.3)" }}
            >
              {t(`trustMetrics.${metric.key}`)}
            </span>
          </div>
          {i < metrics.length - 1 && (
            <div
              className="w-px h-6"
              style={{ backgroundColor: "rgba(36,36,36,0.08)" }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}