'use client';

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, Maximize2 } from "lucide-react";

const categories = [
  "All",
  "Living room",
  "Bedrooms",
  "Kitchen",
  "Bathroom",
  "Building",
  "Yard",
  "View",
];

interface Photo {
  url: string;
  category: string;
}

const allPhotos: Photo[] = [
  { url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=700&fit=crop", category: "Living room" },
  { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=700&fit=crop", category: "Bedrooms" },
  { url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&h=700&fit=crop", category: "Kitchen" },
  { url: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200&h=700&fit=crop", category: "Bathroom" },
  { url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=700&fit=crop", category: "Building" },
  { url: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&h=700&fit=crop", category: "Living room" },
  { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=700&fit=crop", category: "Bedrooms" },
  { url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=700&fit=crop", category: "View" },
  { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=700&fit=crop", category: "Kitchen" },
  { url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&h=700&fit=crop", category: "Yard" },
  { url: "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=1200&h=700&fit=crop", category: "Building" },
  { url: "https://images.unsplash.com/photo-1502005097973-6a708ba8e243?w=1200&h=700&fit=crop", category: "Bathroom" },
  { url: "https://images.unsplash.com/photo-1600585154080-551ced5c6f6f?w=1200&h=700&fit=crop", category: "Living room" },
  { url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200&h=700&fit=crop", category: "Bedrooms" },
  { url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=700&fit=crop", category: "View" },
  { url: "https://images.unsplash.com/photo-1600566753086-cc00a9982490?w=1200&h=700&fit=crop", category: "Yard" },
  { url: "https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=1200&h=700&fit=crop", category: "Kitchen" },
  { url: "https://images.unsplash.com/photo-1598928506311-c55defb0ee88?w=1200&h=700&fit=crop", category: "Building" },
];

interface PropertyPhotoGalleryProps {
  mainImageUrl: string;
  onClose: () => void;
}

export default function PropertyPhotoGallery({ mainImageUrl, onClose }: PropertyPhotoGalleryProps) {
  const photos: Photo[] = [{ url: mainImageUrl, category: "Living room" }, ...allPhotos];

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const filteredPhotos = activeCategory === "All"
    ? photos
    : photos.filter((p) => p.category === activeCategory);

  useEffect(() => {
    setActiveIndex(0);
  }, [activeCategory]);

  const currentPhoto = filteredPhotos[activeIndex];

  const prev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((v) => (v === 0 ? filteredPhotos.length - 1 : v - 1));
  }, [filteredPhotos.length]);

  const next = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((v) => (v === filteredPhotos.length - 1 ? 0 : v + 1));
  }, [filteredPhotos.length]);

  // Keyboard nav
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) setIsFullscreen(false);
        else onClose();
      }
      if (e.key === "ArrowLeft") setActiveIndex((v) => (v === 0 ? filteredPhotos.length - 1 : v - 1));
      if (e.key === "ArrowRight") setActiveIndex((v) => (v === filteredPhotos.length - 1 ? 0 : v + 1));
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, isFullscreen, filteredPhotos.length]);

  const gallery = (
    <div
      className="rounded-[24px] overflow-hidden flex flex-col"
      style={{
        width: isFullscreen ? "100%" : "100%",
        height: isFullscreen ? "100%" : "auto",
        maxHeight: isFullscreen ? "none" : "78vh",
        backgroundColor: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(36px) saturate(180%)",
        WebkitBackdropFilter: "blur(36px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.75)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.14), 0 10px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 0 0 1px rgba(255,255,255,0.30)",
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
        <div className="flex items-center gap-3">
          <ImageIcon size={16} style={{ color: "#7B61FF" }} />
          <span className="text-[13px] font-body font-semibold" style={{ color: "#242424" }}>
            See all photos
          </span>
          <span className="text-[12px] font-body" style={{ color: "#999999" }}>
            {activeIndex + 1} of {filteredPhotos.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{ backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            <Maximize2 size={13} style={{ color: "#666666" }} />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{ backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <X size={14} style={{ color: "#242424" }} />
          </button>
        </div>
      </div>

      {/* Main viewer */}
      <div className="relative flex-shrink-0" style={{ height: isFullscreen ? "55%" : "380px", backgroundColor: "rgba(0,0,0,0.02)" }}>
        {currentPhoto && (
          <Image
            src={currentPhoto.url}
            alt={currentPhoto.category}
            fill
            sizes="(max-width: 1100px) 100vw, 1100px"
            className="object-contain"
          />
        )}
        {/* Category badge */}
        {currentPhoto && (
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1.5 rounded-full text-[10px] font-body font-medium"
              style={{ backgroundColor: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", color: "#1A1A1A" }}>
              {currentPhoto.category}
            </span>
          </div>
        )}
        {/* Counter */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1.5 rounded-full text-[10px] font-body font-semibold"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", color: "#FFF" }}>
            {activeIndex + 1} / {filteredPhotos.length}
          </span>
        </div>
        {/* Nav arrows */}
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{ backgroundColor: "rgba(255,255,255,0.90)", backdropFilter: "blur(8px)", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}
        >
          <ChevronLeft size={20} style={{ color: "#242424" }} />
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{ backgroundColor: "rgba(255,255,255,0.90)", backdropFilter: "blur(8px)", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}
        >
          <ChevronRight size={20} style={{ color: "#242424" }} />
        </button>
      </div>

      {/* Category tabs */}
      <div className="px-5 pt-4 flex-shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-body font-medium transition-all duration-200"
              style={{
                backgroundColor: activeCategory === cat ? "rgba(123,97,255,0.08)" : "rgba(0,0,0,0.03)",
                color: activeCategory === cat ? "#7B61FF" : "#666666",
                border: activeCategory === cat ? "1px solid rgba(123,97,255,0.20)" : "1px solid rgba(0,0,0,0.04)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Photo grid */}
      <div className="flex-1 overflow-y-auto px-5 py-3" style={{ minHeight: 0 }}>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {filteredPhotos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="relative rounded-xl overflow-hidden aspect-[4/3] transition-all duration-200 hover:scale-[1.02] group"
              style={{
                outline: i === activeIndex ? "2px solid #7B61FF" : "1px solid rgba(0,0,0,0.06)",
                outlineOffset: "2px",
                opacity: i === activeIndex ? 1 : 0.7,
              }}
            >
              <Image src={photo.url} alt={photo.category} fill sizes="(max-width: 640px) 33vw, 260px" className="object-cover" />
              <div
                className="absolute inset-0 transition-opacity duration-200 pointer-events-none"
                style={{ opacity: i === activeIndex ? 0 : 0, backgroundColor: "rgba(123,97,255,0.06)" }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.4))" }}>
                <span className="text-[9px] font-body font-medium text-white">{photo.category}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Wrap in overlay if not fullscreen
  if (!isFullscreen) return gallery;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(20,20,20,0.85)" }}
      onClick={onClose}
    >
      <div className="w-full h-full max-w-[1100px]" onClick={(e) => e.stopPropagation()}>
        {gallery}
      </div>
    </div>
  );
}
