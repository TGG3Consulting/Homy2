import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Camera, CheckCircle } from "lucide-react";
import { useT } from "@/lib/i18n";

const BG = "#F3F2EF";

export default function ListProperty() {
  const { t } = useT();
  const propertyTypes = t("listPropertyPage.types");
  const [form, setForm] = useState({
    type: "",
    location: "",
    price: "",
    area: "",
    rooms: "",
    contact: "",
    description: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        className="w-full min-h-screen flex items-center justify-center px-6"
        style={{ background: `radial-gradient(ellipse at 50% 30%, #F8F7F5 0%, ${BG} 70%)` }}
      >
        <div className="text-center max-w-[420px]">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(34,197,94,0.1)" }}>
            <CheckCircle size={32} style={{ color: "#22C55E" }} />
          </div>
          <h2 className="text-[24px] font-heading font-bold mb-2" style={{ color: "#242424" }}>
            {t("listPropertyPage.successTitle")}
          </h2>
          <p className="text-[14px] font-body leading-relaxed mb-6" style={{ color: "#666666" }}>
            {t("listPropertyPage.successText")}
          </p>
          <Link
            to="/for-owners"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[15px] font-body font-semibold transition-all duration-200 hover:shadow-lg"
            style={{ backgroundColor: "#8B6CFF", color: "#FFF" }}
          >
            {t("listPropertyPage.backToOwners")}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full min-h-screen"
      style={{ background: `radial-gradient(ellipse at 50% 30%, #F8F7F5 0%, ${BG} 70%)` }}
    >
      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center justify-between px-7 pt-5 pb-2 max-w-4xl mx-auto">
        <Link
          to="/"
          className="font-display font-semibold tracking-[0.15em] uppercase select-none"
          style={{ fontSize: "15px", color: "#242424" }}
        >
          Homly
        </Link>
        <Link
          to="/for-owners"
          className="inline-flex items-center gap-1.5 text-[13px] font-body font-medium transition-opacity hover:opacity-60"
          style={{ color: "#666666" }}
        >
          <ArrowLeft size={14} />
          {t("common.back")}
        </Link>
      </div>

      <div className="max-w-[580px] mx-auto px-6 pb-20">
        <div className="text-center pt-10 pb-8">
          <h1
            className="font-heading font-extrabold tracking-tight"
            style={{ fontSize: "clamp(32px, 4.5vw, 48px)", color: "#242424", letterSpacing: "-0.03em" }}
          >
            {t("listPropertyPage.title")}
          </h1>
          <p className="mt-2 font-body text-[14px]" style={{ color: "#666666" }}>
            {t("listPropertyPage.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className="rounded-3xl p-6 space-y-5"
            style={{
              backgroundColor: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.7)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 12px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
          >
            {/* Property type */}
            <div>
              <label className="block text-[12px] font-body font-semibold mb-2" style={{ color: "#242424" }}>
                {t("listPropertyPage.propertyType")}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {propertyTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, type }))}
                    className="py-2.5 px-3 rounded-xl text-[12px] font-body font-medium transition-all duration-200"
                    style={{
                      backgroundColor: form.type === type ? "rgba(139,108,255,0.08)" : "rgba(255,255,255,0.6)",
                      color: form.type === type ? "#8B6CFF" : "#757570",
                      border: form.type === type
                        ? "1px solid rgba(139,108,255,0.25)"
                        : "1px solid rgba(200,196,188,0.25)",
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-[12px] font-body font-semibold mb-2" style={{ color: "#242424" }}>
                {t("listPropertyPage.location")}
              </label>
              <input
                type="text"
                value={form.location}
                onChange={handleChange("location")}
                placeholder={t("listPropertyPage.locationPlaceholder")}
                className="w-full py-2.5 px-4 rounded-xl text-[13px] font-body outline-none transition-all duration-200"
                style={{
                  backgroundColor: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(200,196,188,0.25)",
                  color: "#242424",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(139,108,255,0.3)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,108,255,0.04)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(200,196,188,0.25)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Price + Area row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-body font-semibold mb-2" style={{ color: "#242424" }}>
                  {t("listPropertyPage.price")}
                </label>
                <input
                  type="text"
                  value={form.price}
                  onChange={handleChange("price")}
                  placeholder={t("listPropertyPage.pricePlaceholder")}
                  className="w-full py-2.5 px-4 rounded-xl text-[13px] font-body outline-none transition-all duration-200"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(200,196,188,0.25)",
                    color: "#242424",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(139,108,255,0.3)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,108,255,0.04)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(200,196,188,0.25)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              <div>
                <label className="block text-[12px] font-body font-semibold mb-2" style={{ color: "#242424" }}>
                  {t("listPropertyPage.area")}
                </label>
                <input
                  type="text"
                  value={form.area}
                  onChange={handleChange("area")}
                  placeholder={t("listPropertyPage.areaPlaceholder")}
                  className="w-full py-2.5 px-4 rounded-xl text-[13px] font-body outline-none transition-all duration-200"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(200,196,188,0.25)",
                    color: "#242424",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(139,108,255,0.3)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,108,255,0.04)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(200,196,188,0.25)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Rooms */}
            <div>
              <label className="block text-[12px] font-body font-semibold mb-2" style={{ color: "#242424" }}>
                {t("listPropertyPage.rooms")}
              </label>
              <input
                type="text"
                value={form.rooms}
                onChange={handleChange("rooms")}
                placeholder={t("listPropertyPage.roomsPlaceholder")}
                className="w-full py-2.5 px-4 rounded-xl text-[13px] font-body outline-none transition-all duration-200"
                style={{
                  backgroundColor: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(200,196,188,0.25)",
                  color: "#242424",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(139,108,255,0.3)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,108,255,0.04)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(200,196,188,0.25)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[12px] font-body font-semibold mb-2" style={{ color: "#242424" }}>
                {t("listPropertyPage.description")}
              </label>
              <textarea
                value={form.description}
                onChange={handleChange("description")}
                placeholder={t("listPropertyPage.descriptionPlaceholder")}
                rows={3}
                className="w-full py-2.5 px-4 rounded-xl text-[13px] font-body outline-none transition-all duration-200 resize-none"
                style={{
                  backgroundColor: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(200,196,188,0.25)",
                  color: "#242424",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(139,108,255,0.3)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,108,255,0.04)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(200,196,188,0.25)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Photos upload */}
            <div>
              <label className="block text-[12px] font-body font-semibold mb-2" style={{ color: "#242424" }}>
                {t("listPropertyPage.photos")}
              </label>
              <div
                className="rounded-xl p-6 text-center cursor-pointer transition-all duration-200 hover:border-[#8B6CFF]"
                style={{
                  backgroundColor: "rgba(255,255,255,0.6)",
                  border: "2px dashed rgba(200,196,188,0.3)",
                }}
              >
                <Camera size={24} style={{ color: "#A09D96", margin: "0 auto" }} />
                <p className="text-[12px] font-body mt-2" style={{ color: "#A09D96" }}>
                  {t("listPropertyPage.photosDrag")}
                </p>
                <p className="text-[10px] font-body mt-0.5" style={{ color: "#BBBBBB" }}>
                  {t("listPropertyPage.photosHint")}
                </p>
              </div>
            </div>

            {/* Contact */}
            <div>
              <label className="block text-[12px] font-body font-semibold mb-2" style={{ color: "#242424" }}>
                {t("listPropertyPage.contact")}
              </label>
              <input
                type="text"
                value={form.contact}
                onChange={handleChange("contact")}
                placeholder={t("listPropertyPage.contactPlaceholder")}
                className="w-full py-2.5 px-4 rounded-xl text-[13px] font-body outline-none transition-all duration-200"
                style={{
                  backgroundColor: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(200,196,188,0.25)",
                  color: "#242424",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(139,108,255,0.3)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,108,255,0.04)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(200,196,188,0.25)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 rounded-full text-[14px] font-body font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              style={{ backgroundColor: "#8B6CFF", color: "#FFF" }}
            >
              {t("listPropertyPage.submitListing")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}