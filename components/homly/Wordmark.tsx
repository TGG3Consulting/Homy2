'use client';

import React from "react";
import Image from "next/image";

export default function Wordmark() {
  return (
    <div className="flex items-center justify-center pt-10 pb-4 gap-3">
      <Image
        src="/logo/homy_brand_purple.svg"
        alt="Homy"
        width={32}
        height={32}
        className="select-none"
        priority
      />
      <span
        className="font-display font-medium tracking-[0.2em] uppercase select-none"
        style={{
          fontSize: "18px",
          color: "#1A1A1A",
          letterSpacing: "0.2em",
        }}
      >
        Homy
      </span>
    </div>
  );
}
