'use client';

import React from "react";
import { useT } from "@/lib/i18n";

export default function WhatHomyDoes() {
  const { t } = useT();

  const blocks = [
    { title: t("whatHomyDoes.item1") },
    { title: t("whatHomyDoes.item2") },
    { title: t("whatHomyDoes.item3") },
    { title: t("whatHomyDoes.item4") },
    { title: t("whatHomyDoes.item5") },
  ];

  return (
    <div className="max-w-[780px] mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {blocks.map((block, i) => (
          <div
            key={i}
            className="rounded-xl px-3 py-3 transition-all duration-500 hover:-translate-y-0.5 text-center"
            style={{
              backgroundColor: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.8)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.9)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <p
              className="text-[11px] font-body font-medium leading-snug"
              style={{ color: "#242424" }}
            >
              {block.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
