'use client';

import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, Sparkles, Phone, Loader2, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import FilterChips from "./FilterChips";
import { useT } from "@/lib/i18n";
import VoiceAssistantButton from "@/components/homly/VoiceAssistantButton";
import { useChatWidget } from "@/contexts/ChatWidgetContext";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIPanelProps {
  userQuery?: string;
  aiResponse?: string;
  criteria?: string[];
  onSendMessage?: (message: string) => void;
  messages?: ChatMessage[];
  isLoading?: boolean;
  isMobile?: boolean;
}

export default function AIPanel({
  userQuery,
  aiResponse,
  criteria,
  onSendMessage,
  messages = [],
  isLoading = false,
  isMobile = false,
}: AIPanelProps) {
  const { t, lang } = useT();
  const router = useRouter();
  const [chatValue, setChatValue] = useState("");
  const [voiceSpeakText, setVoiceSpeakText] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { openSupportChat } = useChatWidget();

  // Handle opening support chat
  const handleContactConsultant = () => {
    openSupportChat();
  };

  // Save conversation history to sessionStorage for AI opinion
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      sessionStorage.setItem('homy_chat_history', JSON.stringify(history));
      console.log('[AIPanel] Saved to sessionStorage:', messages.length, 'messages');
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatValue.trim()) return;
    if (onSendMessage) {
      onSendMessage(chatValue);
    }
    setChatValue("");
  };

  // Use provided messages or fall back to default display
  const displayMessages = messages.length > 0 ? messages : [
    { role: 'user' as const, content: userQuery || t("resultsPage.userMessage1") },
    { role: 'assistant' as const, content: aiResponse || t("resultsPage.aiResponse1") },
  ];

  return (
    <div
      className={`flex flex-col ${isMobile ? 'w-full' : 'w-full md:w-[352px] md:min-w-[352px] md:border-l'}`}
      style={{
        height: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.55)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "rgba(200, 196, 188, 0.3)",
      }}
    >
      {/* Header - hidden on mobile */}
      {!isMobile && (
        <div className="px-5 pt-5 pb-2 text-center flex-shrink-0">
          <span
            className="font-display font-medium tracking-[0.2em] uppercase"
            style={{ fontSize: "18px", color: "#1A1A1A", letterSpacing: "0.2em" }}
          >
            Homy
          </span>
        </div>
      )}

      {/* Chat area — scrollable, fills space between header and bottom */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-2 space-y-4">
        {displayMessages.map((msg, idx) => (
          msg.role === 'user' ? (
            <div key={idx} className="flex justify-end">
              <div
                className="max-w-[90%] rounded-2xl rounded-br-md px-4 py-3"
                style={{ backgroundColor: "rgba(10, 96, 69, 0.08)" }}
              >
                <p
                  className="text-[13px] leading-relaxed font-body"
                  style={{ color: "#1A1A1A" }}
                >
                  {msg.content}
                </p>
              </div>
            </div>
          ) : (
            <div key={idx} className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#0A6045" }}>
                <Sparkles size={12} className="text-white" />
              </div>
              <div className="flex-1">
                <p
                  className="text-[13px] leading-relaxed font-body font-normal"
                  style={{ color: "#3D3B37" }}
                >
                  {msg.content}
                </p>
              </div>
            </div>
          )
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#0A6045" }}>
              <Loader2 size={12} className="text-white animate-spin" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] leading-relaxed font-body font-normal" style={{ color: "#A09D96" }}>
                {t("resultsPage.thinking") || "Thinking..."}
              </p>
            </div>
          </div>
        )}

        {/* Extracted criteria */}
        {criteria && criteria.length > 0 && (
          <div className="pl-8">
            <p
              className="text-[11px] uppercase tracking-wider font-body font-medium mb-2"
              style={{ color: "#A09D96" }}
            >
              {t("resultsPage.extractedCriteria")}
            </p>
            <FilterChips chips={criteria} />
          </div>
        )}
      </div>

      {/* Consultant — hidden on mobile chat mode, shown on desktop */}
      {!isMobile && (
        <div className="flex-shrink-0 px-5 py-3.5 border-t space-y-3" style={{ borderColor: "rgba(200, 196, 188, 0.3)" }}>
          <div className="flex items-center gap-4">
            <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face" alt="Anna Hakobyan" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 leading-tight">
              <p className="text-[17px] font-semibold font-body" style={{ color: "#1A1A1A" }}>{t("schedulePage.consultant.name")}</p>
              <p className="text-[14px] font-body" style={{ color: "#A09D96" }}>{t("resultsPage.personalConsultant")}</p>
              <p className="text-[14px] font-body" style={{ color: "#757570" }}>+374 77 201 086</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleContactConsultant}
              className="flex-1 inline-flex items-center justify-center gap-1 md:gap-1.5 py-2 md:py-2.5 px-3 md:px-4 rounded-full text-[12px] md:text-[14px] font-semibold font-body transition-all duration-200 hover:shadow-md"
              style={{ backgroundColor: "#0A6045", color: "#FFF" }}
            >
              <MessageSquare size={14} className="md:hidden" />
              <MessageSquare size={16} className="hidden md:block" />
              {t("resultsPage.chat") || "Написать"}
            </button>
            <a
              href="tel:+37477201086"
              className="flex-1 inline-flex items-center justify-center gap-1 md:gap-1.5 py-2 md:py-2.5 px-3 md:px-4 rounded-full text-[12px] md:text-[14px] font-semibold font-body transition-all duration-200 border"
              style={{ borderColor: "#0A6045", color: "#0A6045" }}
            >
              <Phone size={14} className="md:hidden" />
              <Phone size={16} className="hidden md:block" />
              {t("resultsPage.call") || "Позвонить"}
            </a>
          </div>
        </div>
      )}

      {/* Chat input — always visible */}
      <div className="flex-shrink-0 px-5 py-2.5 border-t" style={{ borderColor: "rgba(200, 196, 188, 0.3)" }}>
        <form onSubmit={handleSubmit} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={chatValue}
            onChange={(e) => setChatValue(e.target.value)}
            placeholder={t("resultsPage.chatPlaceholderRefine")}
            className="
              w-full bg-transparent border rounded-full
              py-2.5 pl-4 pr-10
              text-[13px] font-body font-normal
              placeholder:font-light outline-none
              transition-all duration-300
            "
            style={{
              borderColor: "rgba(200, 196, 188, 0.5)",
              color: "#1A1A1A",
              backgroundColor: "rgba(255, 255, 255, 0.5)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(10, 96, 69, 0.4)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(10, 96, 69, 0.06)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(200, 196, 188, 0.5)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <VoiceAssistantButton
              onTranscript={(text) => { setChatValue(text); if (onSendMessage) onSendMessage(text); }}
              speakText={voiceSpeakText}
              onClearSpeakText={() => setVoiceSpeakText("")}
              lang={lang}
              inputRef={inputRef}
            />
            <button
              type="submit"
              className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity duration-200"
              style={{
                opacity: chatValue.trim() ? 1 : 0.3,
                backgroundColor: chatValue.trim() ? "#0A6045" : "transparent",
              }}
            >
              <ArrowRight size={13} strokeWidth={2.5} className="text-white" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
