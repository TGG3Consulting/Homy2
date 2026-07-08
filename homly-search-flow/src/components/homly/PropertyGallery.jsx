import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const galleryImages = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=700&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=700&fit=crop",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&h=700&fit=crop",
  "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200&h=700&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=700&fit=crop",
];

export default function PropertyGallery({ mainImageUrl }) {
  const images = [mainImageUrl, ...galleryImages.slice(1)];
  const [activeIndex, setActiveIndex] = useState(0);

  const prev = () => setActiveIndex((v) => (v === 0 ? images.length - 1 : v - 1));
  const next = () => setActiveIndex((v) => (v === images.length - 1 ? 0 : v + 1));

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative rounded-2xl overflow-hidden aspect-[16/9] group">
        <img
          src={images[activeIndex]}
          alt="Property"
          className="w-full h-full object-cover transition-all duration-500"
        />
        {/* Nav arrows */}
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
          style={{ backgroundColor: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)" }}
        >
          <ChevronLeft size={18} style={{ color: "#1A1A1A" }} />
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
          style={{ backgroundColor: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)" }}
        >
          <ChevronRight size={18} style={{ color: "#1A1A1A" }} />
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
              outline: i === activeIndex ? "2px solid #8B7CF6" : "2px solid transparent",
              outlineOffset: "2px",
            }}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}