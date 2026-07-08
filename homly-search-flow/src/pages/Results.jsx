import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AIPanel from "@/components/homly/AIPanel";
import InsightPanel from "@/components/homly/InsightPanel";
import PropertyCatalog from "@/components/homly/PropertyCatalog";
import ResultsMap from "@/components/homly/ResultsMap";
import PropertyDetailModal from "@/components/homly/PropertyDetailModal";

const mockProperties = [
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
];

export default function Results() {
  const [selectedId, setSelectedId] = useState(null);
  const [modalProperty, setModalProperty] = useState(null);
  const [properties] = useState(mockProperties);

  useEffect(() => {
    const topChoice = mockProperties.find((p) => p.is_top_choice);
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
    <div
      className="h-screen w-full overflow-hidden"
      style={{
        display: "grid",
        gridTemplateColumns: "426px 1fr 352px",
        background: "linear-gradient(165deg, #F6F5F3 0%, #F2F2EF 30%, #F9F9F7 60%, #F0F0EC 100%)",
      }}
    >
      {/* LEFT — Map column */}
      <div className="h-full relative overflow-hidden" style={{ backgroundColor: "#EDE9E1" }}>
        <ResultsMap properties={properties} selectedId={selectedId} />
      </div>

      {/* CENTER — Catalog */}
      <div className="overflow-y-auto min-w-0">
        {/* Back link */}
        <div className="px-6 pt-5 pb-1">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-body font-medium transition-colors duration-200 hover:opacity-70"
            style={{ color: "#757570" }}
          >
            <ArrowLeft size={14} />
            New search
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

      {/* RIGHT — AI Chat Panel */}
      <AIPanel />

      {/* Property Detail Modal */}
      {modalProperty && (
        <PropertyDetailModal
          property={modalProperty}
          onClose={() => setModalProperty(null)}
        />
      )}
    </div>
  );
}