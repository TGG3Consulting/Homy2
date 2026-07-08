import React from "react";

export default function WhyDifferent() {
  return (
    <div className="max-w-[600px] mx-auto px-6 text-center">
      <div
        className="rounded-2xl px-6 py-5"
        style={{
          backgroundColor: "rgba(139,108,255,0.04)",
          border: "1px solid rgba(139,108,255,0.08)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <p
          className="text-[14px] font-body leading-relaxed"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          Homly — это не сайт с объявлениями. Это AI-слой, который помогает искать,
          сравнивать, проверять и организовывать просмотры.
        </p>
      </div>
    </div>
  );
}