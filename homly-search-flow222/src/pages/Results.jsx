import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/lib/i18n";
import AIPanel from "@/components/homly/AIPanel";
import InsightPanel from "@/components/homly/InsightPanel";
import PropertyCatalog from "@/components/homly/PropertyCatalog";
import ResultsMap from "@/components/homly/ResultsMap";
import PropertyDetailModal from "@/components/homly/PropertyDetailModal";
import Footer from "@/components/homly/Footer";
import mockProperties from "@/data/mockProperties";

const propertiesData = [
  {
    id: "1",
    title: "Spacious family apartment near School #55",
    price: 195000,
    bedrooms: 3,
    size_sqm: 85,
    floor: 4,
    neighborhood: "Arabkir",
    image_url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop",
    latitude: 40.205,
    longitude: 44.505,
    match_score: 94,
    is_top_choice: true,
    recommendation_reasons: [
      "8-minute walk to a highly rated school",
      "Quiet residential street with playground",
      "Separate bedrooms for both children",
    ],
    warning: "Older building, renovated in 2019",
    virtual_tour: {
      enabled: true,
      start_room_id: "living-room",
      rooms: [
        { id: "living-room", name: { en: "Living room", ru: "Гостиная", hy: "Հյուրասենյակ" }, panorama_url: "https://media.base44.com/images/public/6a3414a8bdccd8048b972934/1fa7dc336_generated_image.png", hotspots: [{ target_room_id: "kitchen", x: 0.62, y: 0.48 }, { target_room_id: "hallway", x: 0.38, y: 0.48 }, { target_room_id: "balcony", x: 0.15, y: 0.50 }] },
        { id: "kitchen", name: { en: "Kitchen", ru: "Кухня", hy: "Խոհանոց" }, panorama_url: "https://media.base44.com/images/public/6a3414a8bdccd8048b972934/72577ee00_generated_image.png", hotspots: [{ target_room_id: "living-room", x: 0.38, y: 0.48 }] },
        { id: "bedroom-1", name: { en: "Master bedroom", ru: "Главная спальня", hy: "Գլխավոր ննջասենյակ" }, panorama_url: "https://media.base44.com/images/public/6a3414a8bdccd8048b972934/7a8e5b5ba_generated_image.png", hotspots: [{ target_room_id: "hallway", x: 0.25, y: 0.50 }] },
        { id: "bedroom-2", name: { en: "Bedroom 2", ru: "Спальня 2", hy: "Ննջասենյակ 2" }, panorama_url: "https://media.base44.com/images/public/6a3414a8bdccd8048b972934/7a8e2d670_generated_image.png", hotspots: [{ target_room_id: "hallway", x: 0.75, y: 0.50 }, { target_room_id: "bedroom-3", x: 0.50, y: 0.40 }] },
        { id: "bedroom-3", name: { en: "Bedroom 3", ru: "Спальня 3", hy: "Ննջասենյակ 3" }, panorama_url: "https://media.base44.com/images/public/6a3414a8bdccd8048b972934/dcbd533ec_generated_image.png", hotspots: [{ target_room_id: "bedroom-2", x: 0.50, y: 0.60 }] },
        { id: "bathroom", name: { en: "Bathroom", ru: "Ванная", hy: "Լոգարան" }, panorama_url: "https://media.base44.com/images/public/6a3414a8bdccd8048b972934/d7354a693_generated_image.png", hotspots: [{ target_room_id: "hallway", x: 0.80, y: 0.50 }] },
        { id: "hallway", name: { en: "Hallway", ru: "Коридор", hy: "Միջանցք" }, panorama_url: "https://media.base44.com/images/public/6a3414a8bdccd8048b972934/b098e99b6_generated_image.png", hotspots: [{ target_room_id: "living-room", x: 0.50, y: 0.45 }, { target_room_id: "bedroom-1", x: 0.30, y: 0.50 }, { target_room_id: "bedroom-2", x: 0.70, y: 0.50 }, { target_room_id: "bathroom", x: 0.85, y: 0.55 }] },
        { id: "balcony", name: { en: "Balcony", ru: "Балкон", hy: "Պատշգամբ" }, panorama_url: "https://media.base44.com/images/public/6a3414a8bdccd8048b972934/453e67566_generated_image.png", hotspots: [{ target_room_id: "living-room", x: 0.80, y: 0.50 }] },
        { id: "exterior", name: { en: "Exterior", ru: "Снаружи", hy: "Արտաքին" }, panorama_url: "https://media.base44.com/images/public/6a3414a8bdccd8048b972934/7fb6ae871_generated_image.png", hotspots: [{ target_room_id: "living-room", x: 0.50, y: 0.50 }] }
      ]
    },
  },
  {
    id: "2",
    title: "Modern 3-room apartment with park view",
    price: 200000,
    bedrooms: 3,
    size_sqm: 78,
    floor: 7,
    neighborhood: "Arabkir",
    image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop",
    latitude: 40.210,
    longitude: 44.500,
    match_score: 91,
    is_top_choice: false,
    recommendation_reasons: [
      "New building with elevator and parking",
      "Next to Arabkir Park",
      "At the top of your budget but excellent value",
    ],
    warning: null,
  },
  {
    id: "3",
    title: "Cozy 2-bedroom near metro station",
    price: 170000,
    bedrooms: 2,
    size_sqm: 68,
    floor: 3,
    neighborhood: "Kentron",
    image_url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop",
    latitude: 40.179,
    longitude: 44.515,
    match_score: 87,
    is_top_choice: false,
    recommendation_reasons: [
      "Within your monthly budget with room to spare",
      "5-minute walk to metro and shops",
      "Recently renovated kitchen and bathroom",
    ],
    warning: "One bedroom is smaller — better as a nursery",
  },
  {
    id: "4",
    title: "Bright 4-room apartment with garden access",
    price: 210000,
    bedrooms: 3,
    size_sqm: 95,
    floor: 1,
    neighborhood: "Kanaker-Zeytun",
    image_url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=500&fit=crop",
    latitude: 40.215,
    longitude: 44.535,
    match_score: 85,
    is_top_choice: false,
    recommendation_reasons: [
      "Shared garden ideal for children to play",
      "Spacious living room for family gatherings",
      "Two schools within 12-minute walk",
    ],
    warning: "Slightly over budget — 210,000 AMD / month",
  },
  {
    id: "5",
    title: "Elegant apartment in gated community",
    price: 188000,
    bedrooms: 2,
    size_sqm: 72,
    floor: 5,
    neighborhood: "Arabkir",
    image_url: "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800&h=500&fit=crop",
    latitude: 40.200,
    longitude: 44.510,
    match_score: 82,
    is_top_choice: false,
    recommendation_reasons: [
      "Gated complex with 24/7 security",
      "Well within your monthly budget",
      "Modern playground in the courtyard",
    ],
    warning: "12 minutes farther from the city center",
  },
  {
    id: "6",
    title: "Renovated 2-bedroom in Arabkir center",
    price: 178000,
    bedrooms: 2,
    size_sqm: 65,
    floor: 2,
    neighborhood: "Arabkir",
    image_url: "https://images.unsplash.com/photo-1502005097973-6a708ba8e243?w=800&h=500&fit=crop",
    latitude: 40.202,
    longitude: 44.508,
    match_score: 80,
    is_top_choice: false,
    recommendation_reasons: ["Freshly renovated with modern finishes", "Walking distance to shops and cafes", "Great natural light throughout"],
    warning: null,
  },
  {
    id: "7",
    title: "Penthouse with panoramic city views",
    price: 250000,
    bedrooms: 3,
    size_sqm: 110,
    floor: 14,
    neighborhood: "Kentron",
    image_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop",
    latitude: 40.177,
    longitude: 44.512,
    match_score: 76,
    is_top_choice: false,
    recommendation_reasons: ["Stunning panoramic views of Ararat", "Top-floor privacy and quiet", "Premium building with concierge"],
    warning: "Above your budget — 250,000 AMD / month",
  },
  {
    id: "8",
    title: "Family-friendly apartment with yard",
    price: 165000,
    bedrooms: 3,
    size_sqm: 80,
    floor: 1,
    neighborhood: "Kanaker-Zeytun",
    image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=500&fit=crop",
    latitude: 40.218,
    longitude: 44.538,
    match_score: 79,
    is_top_choice: false,
    recommendation_reasons: ["Private yard for children to play", "Under budget with room for savings", "Quiet, family-oriented neighborhood"],
    warning: "Farther from metro — 18-minute walk",
  },
  {
    id: "9",
    title: "Newly built studio near Opera",
    price: 155000,
    bedrooms: 1,
    size_sqm: 42,
    floor: 6,
    neighborhood: "Kentron",
    image_url: "https://images.unsplash.com/photo-1529408630018-3b4d17a7b5e2?w=800&h=500&fit=crop",
    latitude: 40.185,
    longitude: 44.520,
    match_score: 65,
    is_top_choice: false,
    recommendation_reasons: ["Prime central location", "Brand new construction", "Within budget"],
    warning: "Only one bedroom — not enough space for a family of four",
  },
  {
    id: "10",
    title: "Charming 3-bedroom with terrace",
    price: 192000,
    bedrooms: 3,
    size_sqm: 88,
    floor: 5,
    neighborhood: "Arabkir",
    image_url: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=500&fit=crop",
    latitude: 40.208,
    longitude: 44.502,
    match_score: 88,
    is_top_choice: false,
    recommendation_reasons: ["Large terrace for family gatherings", "Close to School #119", "Well-maintained Soviet-era building"],
    warning: null,
  },
  {
    id: "11",
    title: "Minimalist loft in creative district",
    price: 175000,
    bedrooms: 2,
    size_sqm: 70,
    floor: 8,
    neighborhood: "Kentron",
    image_url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop",
    latitude: 40.181,
    longitude: 44.518,
    match_score: 72,
    is_top_choice: false,
    recommendation_reasons: ["Trendy neighborhood with cafes", "Modern open-plan layout", "Good natural light"],
    warning: "Open-plan layout — less privacy for children",
  },
  {
    id: "12",
    title: "Spacious apartment in green district",
    price: 180000,
    bedrooms: 3,
    size_sqm: 90,
    floor: 3,
    neighborhood: "Kanaker-Zeytun",
    image_url: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=500&fit=crop",
    latitude: 40.212,
    longitude: 44.540,
    match_score: 81,
    is_top_choice: false,
    recommendation_reasons: ["Surrounded by parks and greenery", "Affordable for the size", "Three full bedrooms"],
    warning: "Older plumbing — may need attention",
  },
  {
    id: "13",
    title: "Bright corner apartment with balcony",
    price: 198000,
    bedrooms: 2,
    size_sqm: 75,
    floor: 4,
    neighborhood: "Arabkir",
    image_url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop",
    latitude: 40.204,
    longitude: 44.507,
    match_score: 83,
    is_top_choice: false,
    recommendation_reasons: ["Corner unit — extra windows and light", "Nice balcony with mountain view", "Close to bus stops"],
    warning: null,
  },
  {
    id: "14",
    title: "Affordable 2-bedroom near university",
    price: 148000,
    bedrooms: 2,
    size_sqm: 60,
    floor: 2,
    neighborhood: "Kentron",
    image_url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=500&fit=crop",
    latitude: 40.183,
    longitude: 44.525,
    match_score: 70,
    is_top_choice: false,
    recommendation_reasons: ["Most affordable central option", "Near Yerevan State University", "Freshly painted and clean"],
    warning: "Smaller living room — tight for four people",
  },
  {
    id: "15",
    title: "Premium apartment with parking spot",
    price: 205000,
    bedrooms: 3,
    size_sqm: 92,
    floor: 9,
    neighborhood: "Arabkir",
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",
    latitude: 40.207,
    longitude: 44.503,
    match_score: 86,
    is_top_choice: false,
    recommendation_reasons: ["Includes dedicated parking", "Modern elevator building", "Near Arabkir shopping center"],
    warning: "Slightly above your 200,000 AMD budget",
  },
];

export default function Results() {
  const { t } = useT();
  const [selectedId, setSelectedId] = useState(null);
  const [modalProperty, setModalProperty] = useState(null);
  const [properties] = useState(propertiesData);

  useEffect(() => {
    const topChoice = propertiesData.find((p) => p.is_top_choice);
    if (topChoice) setSelectedId(topChoice.id);
  }, []);

  const handleSelectProperty = (id) => {
    setSelectedId(id);
  };

  const handleViewDetails = (property) => {
    setModalProperty(property);
    setSelectedId(property.id);
  };

  return (
    <div className="w-full">
      <div
        className="w-full"
        style={{
          display: "grid",
          gridTemplateColumns: "426px 1fr 352px",
          height: "100vh",
          background: "linear-gradient(165deg, #F6F5F3 0%, #F2F2EF 30%, #F9F9F7 60%, #F0F0EC 100%)",
        }}
      >
        {/* LEFT — Map column */}
        <div className="sticky top-0 h-screen overflow-hidden" style={{ backgroundColor: "#EDE9E1" }}>
          <ResultsMap properties={properties} selectedId={selectedId} />
        </div>

        {/* CENTER — Catalog */}
        <div className="overflow-y-auto h-screen">
          {/* Back link */}
          <div className="px-6 pt-5 pb-1">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[13px] font-body font-medium transition-colors duration-200 hover:opacity-70"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <ArrowLeft size={14} />
              {t("common.newSearch")}
            </Link>
          </div>

          {/* Insight panel */}
          <div className="px-6 pt-2 pb-1">
            <InsightPanel />
          </div>

          {/* Catalog */}
          <PropertyCatalog
            properties={properties}
            selectedId={selectedId}
            onSelectProperty={handleSelectProperty}
            onViewDetails={handleViewDetails}
          />
        </div>

        {/* RIGHT — AI Chat Panel (fixed) */}
        <div className="sticky top-0 h-screen">
          <AIPanel />
        </div>

        {/* Property Detail Modal */}
        {modalProperty && (
          <PropertyDetailModal
            property={modalProperty}
            onClose={() => setModalProperty(null)}
          />
        )}
      </div>

      {/* Footer — full width, after all content */}
      <Footer />
    </div>
  );
}