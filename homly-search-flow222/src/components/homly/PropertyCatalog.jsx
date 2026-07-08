import React from "react";
import PropertyCard from "./PropertyCard";
import { useT } from "@/lib/i18n";

export default function PropertyCatalog({ properties, selectedId, onSelectProperty, onViewDetails }) {
  const { t } = useT();
  return (
    <div className="min-w-0">
      <div className="p-6">
        {/* Section label */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-body font-semibold tracking-tight" style={{ color: "#1A1A1A" }}>
              {t("resultsPage.curatedForYou")}
            </h2>
            <p className="text-[12px] font-body mt-0.5" style={{ color: "#A09D96" }}>
              {t("resultsPage.curatedSubtitle", { count: properties.length })}
            </p>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isSelected={selectedId === property.id}
              onSelect={onSelectProperty}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      </div>
    </div>
  );
}