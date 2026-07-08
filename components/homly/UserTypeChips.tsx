'use client';

import React from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";

export default function UserTypeChips() {
  const { t } = useT();
  const router = useRouter();

  const chips = [
    { id: "buy", label: t("userTypeChips.buy"), path: "/for-buyers" },
    { id: "rent", label: t("userTypeChips.rent"), path: "/for-renters" },
    { id: "sell", label: t("userTypeChips.sell"), path: "/for-owners" },
    { id: "list", label: t("userTypeChips.listProperty"), path: "/for-owners" },
    { id: "agencies", label: t("userTypeChips.forAgencies"), path: null as string | null },
  ];

  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap">
      {chips.map((chip) => (
        <button
          key={chip.id}
          onClick={() => chip.path && router.push(chip.path)}
          className="
            px-3.5 py-1.5 rounded-full
            text-[12px] font-body font-medium
            transition-all duration-300
          "
          style={{
            backgroundColor: "rgba(255,255,255,0.5)",
            color: "rgba(36,36,36,0.45)",
            border: "1px solid rgba(36,36,36,0.06)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
