'use client';

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, Rotate3D } from "lucide-react";
import { useT } from "@/lib/i18n";

const galleryImages = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=700&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=700&fit=crop",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&h=700&fit=crop",
  "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200&h=700&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=700&fit=crop",
];

interface PropertyGalleryProps {
  mainImageUrl?: string;
  images?: string[];
  onSeeAll?: () => void;
  hasVirtualTour?: boolean;
  onStartTour?: () => void;
}

export default function PropertyGallery({ mainImageUrl, images: providedImages, onSeeAll, hasVirtualTour, onStartTour }: PropertyGalleryProps) {
  const { t } = useT();
  const images = providedImages?.length
    ? providedImages
    : mainImageUrl
      ? [mainImageUrl, ...galleryImages.slice(1)]
      : galleryImages;
  const [activeIndex, setActiveIndex] = useState(0);

  const prev = () => setActiveIndex((v) => (v === 0 ? images.length - 1 : v - 1));
  const next = () => setActiveIndex((v) => (v === images.length - 1 ? 0 : v + 1));

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative rounded-2xl overflow-hidden aspect-[16/9] group" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
        <Image
          src={images[activeIndex]}
          alt="Property"
          fill
          sizes="(max-width: 1024px) 100vw, 800px"
          className="object-cover transition-all duration-500"
        />
        {/* Nav arrows */}
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
          style={{ backgroundColor: "rgba(255,255,255,0.90)", backdropFilter: "blur(8px)", boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}
        >
          <ChevronLeft size={18} style={{ color: "#242424" }} />
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
          style={{ backgroundColor: "rgba(255,255,255,0.90)", backdropFilter: "blur(8px)", boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}
        >
          <ChevronRight size={18} style={{ color: "#242424" }} />
        </button>
        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? 20 : 6,
                height: 6,
                backgroundColor: i === activeIndex ? "#fff" : "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className="flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden transition-all duration-200"
            style={{
              opacity: i === activeIndex ? 1 : 0.55,
              outline: i === activeIndex ? "2px solid #7B61FF" : "2px solid transparent",
              outlineOffset: "2px",
            }}
          >
            <Image src={img} alt="" width={80} height={56} className="w-full h-full object-cover" />
          </button>
        ))}
        {/* See all photos button */}
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="flex-shrink-0 w-20 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 hover:scale-[1.03]"
            style={{
              backgroundColor: "rgba(123,97,255,0.06)",
              border: "1px dashed rgba(123,97,255,0.25)",
            }}
          >
            <Images size={16} style={{ color: "#7B61FF" }} />
            <span className="text-[8px] font-body font-semibold" style={{ color: "#7B61FF" }}>
              {t("propertyGallery.seeAll")}
            </span>
          </button>
        )}
        {/* Start virtual tour button */}
        {hasVirtualTour && onStartTour && (
          <button
            onClick={onStartTour}
            className="flex-shrink-0 w-20 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 hover:scale-[1.03]"
            style={{
              backgroundColor: "rgba(123,97,255,0.1)",
              border: "1px solid rgba(123,97,255,0.2)",
            }}
          >
            <Rotate3D size={16} style={{ color: "#7B61FF" }} />
            <span className="text-[8px] font-body font-semibold" style={{ color: "#7B61FF" }}>
              {t("virtualTour.startTour")}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
