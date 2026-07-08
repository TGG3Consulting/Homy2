import React from "react";
import { useT } from "@/lib/i18n";

export default function FilterChips() {
  const { t } = useT();
  const criteria = t("resultsPage.filterCriteria");
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.isArray(criteria) ? criteria.map((criterion, i) => (
        <span
          key={i}
          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-body font-normal transition-colors duration-200 cursor-default"
          style={{
            color: "#5C5A55",
            backgroundColor: "rgba(232, 230, 225, 0.5)",
            border: "1px solid rgba(200, 196, 188, 0.4)",
          }}
        >
          {criterion}
        </span>
      )) : null}
    </div>
  );
}