import React, { useState, useRef } from "react";
import {
  MapPin, Bed, Maximize2, Home, CheckCircle, Star, ShieldCheck,
  Clock, Calendar, MapPinned, ChevronRight, Send,
  Check, Sparkles, ArrowLeft, Phone, Search,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import mockProperties from "@/data/mockProperties";
import { useT, getLocalized } from "@/lib/i18n";
import VoiceAssistantButton from "@/components/homly/VoiceAssistantButton";

const BG = "#F3F2EF";

const timeSlots = [
  { label: "Today", time: "18:30", date: "18 Jun" },
  { label: "Tomorrow", time: "12:00", date: "19 Jun" },
  { label: "Tomorrow", time: "15:30", date: "19 Jun" },
  { label: "Saturday", time: "14:00", date: "20 Jun" },
];

const monthDays = [
  { day: 16, active: false },
  { day: 17, active: false },
  { day: 18, active: true },
  { day: 19, active: true },
  { day: 20, active: true },
  { day: 21, active: false },
  { day: 22, active: false },
];

function Badge({ icon: Icon, label, color, bgColor }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold font-body"
      style={{ backgroundColor: bgColor || "rgba(139,108,255,0.08)", color: color || "#8B6CFF" }}
    >
      {Icon && <Icon size={11} strokeWidth={2.5} />}
      {label}
    </span>
  );
}

const glassPanel = {
  backgroundColor: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.7)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 6px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
};

const innerGlass = {
  backgroundColor: "rgba(255,255,255,0.45)",
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow: "0 1px 2px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.7)",
};

export default function ScheduleViewing() {
  const { t, lang } = useT();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get("propertyId");
  const property = mockProperties.find((p) => p.id === propertyId);

  const checklistItems = t("schedulePage.checklist");
  const weekDays = t("schedulePage.days");
  const chatMessages = [
    { role: "user", content: t("schedulePage.chatMessages.user1") },
    { role: "assistant", content: t("schedulePage.chatMessages.assistant1") },
    { role: "agent", content: t("schedulePage.chatMessages.agent1"), name: t("schedulePage.chatMessages.agentName") },
  ];
  const quickActions = t("schedulePage.quickActions");
  const trustLabels = t("schedulePage.trustLabels");

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [checkedItems, setCheckedItems] = useState([]);
  const [chatValue, setChatValue] = useState("");
  const [voiceSpeakText, setVoiceSpeakText] = useState("");
  const chatInputRef = useRef(null);

  const toggleCheck = (item) => {
    setCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleChatSubmit = (e) => {
    e?.preventDefault();
    if (!chatValue.trim()) return;
    setVoiceSpeakText("");
    setChatValue("");
    setTimeout(() => setVoiceSpeakText(t("schedulePage.chatMessages.assistant1")), 1200);
  };

  const selected = timeSlots.find((s) => s.time === selectedSlot);

  if (!propertyId) {
    return (
      <div
        className="w-full h-screen overflow-hidden flex flex-col items-center justify-center gap-5"
        style={{ background: `radial-gradient(ellipse at 50% 40%, #F8F7F5 0%, ${BG} 70%)` }}
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(139,108,255,0.06)" }}>
          <Search size={24} style={{ color: "#8B6CFF" }} />
        </div>
        <p className="text-[18px] font-heading font-semibold" style={{ color: "#242424" }}>
          {t("schedulePage.noProperty")}
        </p>
        <p className="text-[14px] font-body -mt-3" style={{ color: "#999999" }}>
          {t("schedulePage.noPropertyDesc")}
        </p>
        <Link
          to="/results"
          className="px-6 py-2.5 rounded-full text-[14px] font-body font-semibold transition-all duration-200 hover:shadow-md"
          style={{ backgroundColor: "#8B6CFF", color: "#FFF" }}
        >
          {t("schedulePage.backToResults")}
        </Link>
      </div>
    );
  }

  if (!property) {
    return (
      <div
        className="w-full h-screen overflow-hidden flex flex-col items-center justify-center gap-5"
        style={{ background: `radial-gradient(ellipse at 50% 40%, #F8F7F5 0%, ${BG} 70%)` }}
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(139,108,255,0.06)" }}>
          <Search size={24} style={{ color: "#8B6CFF" }} />
        </div>
        <p className="text-[18px] font-heading font-semibold" style={{ color: "#242424" }}>
          {t("schedulePage.propertyNotFound")}
        </p>
        <p className="text-[14px] font-body -mt-3" style={{ color: "#999999" }}>
          {t("schedulePage.propertyNotFoundDesc")}
        </p>
        <Link
          to="/results"
          className="px-6 py-2.5 rounded-full text-[14px] font-body font-semibold transition-all duration-200 hover:shadow-md"
          style={{ backgroundColor: "#8B6CFF", color: "#FFF" }}
        >
          {t("schedulePage.backToResults")}
        </Link>
      </div>
    );
  }

  return (
    <div
      className="w-full h-screen overflow-hidden flex flex-col"
      style={{ background: `radial-gradient(ellipse at 50% 40%, #F8F7F5 0%, ${BG} 70%)` }}
    >
      {/* Top bar */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-7 pt-5 pb-2">
        <Link
          to="/results"
          className="inline-flex items-center gap-1.5 text-[13px] font-body font-medium transition-opacity duration-200 hover:opacity-60"
          style={{ color: "#757570" }}
        >
          <ArrowLeft size={14} />
          {t("schedulePage.backToResults")}
        </Link>
        <span
          className="font-display font-semibold tracking-[0.15em] uppercase select-none"
          style={{ fontSize: "15px", color: "#242424" }}
        >
          Homly
        </span>
        <div className="w-[100px]" />
      </div>

      {/* Main 3-column grid */}
      <div
        className="relative z-10 flex-1 min-h-0 grid gap-4 px-6 pb-5"
        style={{ gridTemplateColumns: "300px 1fr 300px" }}
      >
        {/* ── LEFT — Property Summary ── */}
        <div
        className="rounded-2xl flex flex-col overflow-hidden"
        style={glassPanel}
        >
        {/* Photo */}
        <div className="h-[150px] flex-shrink-0 overflow-hidden">
          <img
            src={property.image_url}
            alt={getLocalized(property.title, lang)}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3.5">
          {/* Price + Score */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[20px] font-body font-bold" style={{ color: "#242424" }}>
                  {property.price?.toLocaleString()} AMD
                </span>
                <span className="text-[11px] font-body" style={{ color: "#999999" }}>
                  {t("propertyCard.month")}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={11} style={{ color: "#B5B3AD" }} />
                <span className="text-[12px] font-body font-medium" style={{ color: "#757570" }}>
                  {getLocalized(property.neighborhood, lang)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[24px] font-body font-bold" style={{ color: "#8B6CFF" }}>
                {property.match_score}%
              </span>
              <p className="text-[9px] font-body uppercase tracking-wider" style={{ color: "#A09D96" }}>
                {t("propertyCard.match")}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {property.is_top_choice && (
              <Badge icon={Star} label={t("propertyDetail.homlyTopChoice")} color="#8B6CFF" bgColor="rgba(139,108,255,0.08)" />
            )}
            <Badge icon={ShieldCheck} label={t("propertyDetail.verifiedListing")} />
          </div>

          {/* Specs */}
          <div className="flex items-center gap-4" style={{ color: "#757570" }}>
            <span className="text-[12px] font-body font-medium">
              <Bed size={12} style={{ display: "inline", marginRight: 3, color: "#8B6CFF" }} />
              {property.bedrooms} {property.bedrooms === 1 ? t("propertyCard.bed") : t("propertyCard.beds")}
            </span>
            <span className="text-[12px] font-body font-medium">
              <Maximize2 size={12} style={{ display: "inline", marginRight: 3, color: "#8B6CFF" }} />
              {property.size_sqm} m²
            </span>
            <span className="text-[12px] font-body font-medium">
              <Home size={12} style={{ display: "inline", marginRight: 3, color: "#8B6CFF" }} />
              {t("propertyCard.floor")} {property.floor}
            </span>
          </div>

          {/* Reasons */}
          <div>
            <p className="text-[10px] font-body font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#A09D96" }}>
              {t("schedulePage.whyHomlyRecommends")}
            </p>
            {property.recommendation_reasons?.map((r, i) => (
              <div key={i} className="flex items-start gap-1.5 mb-1">
                <CheckCircle size={10} className="flex-shrink-0 mt-[3px]" style={{ color: "#8B6CFF" }} />
                <span className="text-[11px] font-body leading-snug" style={{ color: "#3D3B37" }}>{r}</span>
              </div>
            ))}
          </div>

            {/* Checklist */}
            <div>
              <p className="text-[10px] font-body font-semibold uppercase tracking-wider mb-2" style={{ color: "#A09D96" }}>
                {t("schedulePage.previewChecklist")}
              </p>
              {checklistItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => toggleCheck(item)}
                  className="flex items-center gap-2 w-full text-left mb-1 group"
                >
                  <div
                    className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all duration-200"
                    style={{
                      border: checkedItems.includes(item)
                        ? "1px solid #8B6CFF"
                        : "1px solid rgba(36,36,36,0.12)",
                      backgroundColor: checkedItems.includes(item)
                        ? "rgba(139,108,255,0.1)"
                        : "transparent",
                    }}
                  >
                    {checkedItems.includes(item) && <Check size={10} style={{ color: "#8B6CFF" }} />}
                  </div>
                  <span
                    className="text-[11px] font-body transition-colors duration-200"
                    style={{
                      color: checkedItems.includes(item) ? "#242424" : "#999999",
                      textDecoration: checkedItems.includes(item) ? "line-through" : "none",
                    }}
                  >
                    {item}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CENTER — Viewing Scheduler ── */}
        <div
          className="rounded-2xl flex flex-col overflow-hidden min-h-0"
          style={glassPanel}
        >
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
            <div>
              <h2 className="text-[22px] font-heading font-bold tracking-tight" style={{ color: "#242424" }}>
                {t("schedulePage.title")}
              </h2>
              <p className="text-[12px] font-body mt-0.5" style={{ color: "#999999" }}>
                {selected
                  ? `${t("schedulePage.viewingSet")} — ${selected.label}, ${selected.date} at ${selected.time}`
                  : t("schedulePage.selectTimeHint")}
              </p>
            </div>

            {/* Time slots */}
            <div className="space-y-2">
              {timeSlots.map((slot) => {
                const isSelected = selectedSlot === slot.time;
                return (
                  <button
                    key={slot.time}
                    onClick={() => setSelectedSlot(slot.time)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300"
                    style={{
                      backgroundColor: isSelected
                        ? "rgba(139,108,255,0.06)"
                        : "rgba(255,255,255,0.4)",
                      border: isSelected
                        ? "1px solid rgba(139,108,255,0.25)"
                        : "1px solid rgba(36,36,36,0.06)",
                      boxShadow: isSelected
                        ? "0 0 0 2px rgba(139,108,255,0.04)"
                        : "none",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: isSelected
                            ? "rgba(139,108,255,0.12)"
                            : "rgba(36,36,36,0.04)",
                        }}
                      >
                        <Clock
                          size={15}
                          style={{ color: isSelected ? "#8B6CFF" : "#999999" }}
                        />
                      </div>
                      <div className="text-left">
                        <p className="text-[13px] font-body font-semibold" style={{ color: "#242424" }}>
                          {slot.label}
                        </p>
                        <p className="text-[11px] font-body" style={{ color: "#999999" }}>
                          {slot.date} · {slot.time}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <span
                        className="text-[10px] font-body font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "rgba(139,108,255,0.1)",
                          color: "#8B6CFF",
                        }}
                      >
                        {t("schedulePage.selected")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar mini */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[12px] font-body font-semibold" style={{ color: "#666666" }}>
                  June 2026
                </span>
                <div className="flex items-center gap-1.5">
                  <button className="w-5 h-5 rounded flex items-center justify-center" style={{ color: "#999999" }}>
                    <ChevronRight size={12} style={{ transform: "rotate(180deg)" }} />
                  </button>
                  <button className="w-5 h-5 rounded flex items-center justify-center" style={{ color: "#999999" }}>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekDays.map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-body font-medium" style={{ color: "#A09D96" }}>
                    {d}
                  </div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((d, i) => (
                  <button
                    key={i}
                    className="w-full aspect-square rounded-lg flex items-center justify-center text-[12px] font-body font-medium transition-all duration-200"
                    style={{
                      backgroundColor: d.active
                        ? "rgba(139,108,255,0.08)"
                        : "transparent",
                      color: d.active ? "#8B6CFF" : "#BBBBBB",
                      cursor: d.active ? "pointer" : "default",
                    }}
                  >
                    {d.day}
                  </button>
                ))}
              </div>
            </div>

            {/* Confirmation card */}
            {selected && (
              <div
                className="rounded-xl p-4"
                style={innerGlass}
              >
                <p className="text-[10px] font-body font-semibold uppercase tracking-wider mb-2" style={{ color: "#8B6CFF" }}>
                  {t("schedulePage.viewingReady")}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[14px] font-body font-semibold" style={{ color: "#242424" }}>
                      {property.neighborhood}, Yerevan
                    </p>
                    <p className="text-[12px] font-body" style={{ color: "#666666" }}>
                      Saturday, 20 June · {selected.time}
                    </p>
                  </div>
                  <Calendar size={18} style={{ color: "#8B6CFF" }} />
                </div>
                <button
                  className="w-full py-2.5 rounded-xl text-[14px] font-body font-semibold transition-all duration-200 hover:shadow-md"
                  style={{ backgroundColor: "#8B6CFF", color: "#FFF" }}
                >
                  {t("schedulePage.confirmViewing")}
                </button>
              </div>
            )}

            {/* Secondary actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: t("schedulePage.reschedule"), icon: Clock },
                { label: t("schedulePage.addToCalendar"), icon: Calendar },
                { label: t("schedulePage.getDirections"), icon: MapPinned },
              ].map((action) => (
                <button
                  key={action.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-body font-medium transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    backgroundColor: "rgba(36,36,36,0.03)",
                    color: "#666666",
                    border: "1px solid rgba(36,36,36,0.06)",
                  }}
                >
                  <action.icon size={12} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT — AI Chat ── */}
        <div
          className="rounded-2xl flex flex-col overflow-hidden min-h-0"
          style={glassPanel}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-4 pt-4 pb-2 flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(139,108,255,0.1)" }}
            >
              <Sparkles size={13} style={{ color: "#8B6CFF" }} />
            </div>
            <span className="text-[13px] font-body font-semibold" style={{ color: "#242424" }}>
              {t("schedulePage.viewingAssistant")}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className="max-w-[85%] rounded-xl px-3 py-2"
                  style={{
                    backgroundColor:
                      msg.role === "user"
                        ? "rgba(139,108,255,0.07)"
                        : msg.role === "agent"
                          ? "rgba(36,36,36,0.03)"
                          : "transparent",
                    border:
                      msg.role === "agent"
                        ? "1px solid rgba(36,36,36,0.05)"
                        : "none",
                  }}
                >
                  {msg.name && (
                    <p className="text-[10px] font-body font-semibold mb-0.5" style={{ color: "#A09D96" }}>
                      {msg.name}
                    </p>
                  )}
                  <p className="text-[12px] font-body leading-relaxed" style={{ color: "#3D3B37" }}>
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex-shrink-0 px-4 py-2 flex flex-wrap gap-1.5">
            {quickActions.map((action) => (
              <button
                key={action}
                className="px-2.5 py-1 rounded-full text-[10px] font-body font-medium transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  backgroundColor: "rgba(139,108,255,0.04)",
                  color: "#8B6CFF",
                  border: "1px solid rgba(139,108,255,0.1)",
                }}
              >
                {action}
              </button>
            ))}
          </div>

          {/* Consultant */}
          <div className="flex-shrink-0 px-4 py-3 border-t space-y-3" style={{ borderColor: "rgba(36,36,36,0.06)" }}>
            <div className="flex items-center gap-3">
              <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face" alt="Anna Hakobyan" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 leading-tight">
                <p className="text-[14px] font-semibold font-body" style={{ color: "#242424" }}>{t("schedulePage.consultant.name")}</p>
                <p className="text-[11px] font-body" style={{ color: "#999999" }}>{t("schedulePage.consultant.role")}</p>
                <p className="text-[11px] font-body" style={{ color: "#757570" }}>+374 77 201 086</p>
              </div>
            </div>
            <button className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[14px] font-semibold font-body transition-all duration-200 hover:shadow-md" style={{ backgroundColor: "#8B6CFF", color: "#FFF" }}>
              <Phone size={14} />
              {t("schedulePage.contact")}
            </button>
          </div>

          {/* Chat input */}
          <div className="flex-shrink-0 px-4 py-3">
            <form onSubmit={handleChatSubmit} className="relative">
              <input
                ref={chatInputRef}
                type="text"
                value={chatValue}
                onChange={(e) => setChatValue(e.target.value)}
                placeholder={t("schedulePage.chatPlaceholderViewing")}
                className="
                  w-full bg-transparent border rounded-xl
                  py-2.5 pl-3.5 pr-10
                  text-[12px] font-body font-normal
                  placeholder:font-light outline-none
                  transition-all duration-300
                "
                style={{
                  borderColor: "rgba(36,36,36,0.08)",
                  color: "#242424",
                  backgroundColor: "rgba(255,255,255,0.4)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(139,108,255,0.3)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(36,36,36,0.08)";
                }}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <VoiceAssistantButton
                  onTranscript={(text) => { setChatValue(text); handleChatSubmit({ preventDefault: () => {} }); }}
                  speakText={voiceSpeakText}
                  onClearSpeakText={() => setVoiceSpeakText("")}
                  lang={lang}
                  inputRef={chatInputRef}
                />
                <button
                  type="submit"
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity"
                  style={{
                    opacity: chatValue.trim() ? 1 : 0.2,
                    backgroundColor: chatValue.trim() ? "#8B6CFF" : "transparent",
                  }}
                >
                  <Send size={11} className="text-white" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── Trust block ── */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-center gap-8 pb-4">
        {(Array.isArray(trustLabels) ? trustLabels : [
          "No payment before viewing",
          "Developer background checked",
          "Legal signals reviewed",
          "Reminder will be sent",
        ]).map((label, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <ShieldCheck size={11} style={{ color: "#8B6CFF" }} />
            <span className="text-[10px] font-body" style={{ color: "rgba(36,36,36,0.3)" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}