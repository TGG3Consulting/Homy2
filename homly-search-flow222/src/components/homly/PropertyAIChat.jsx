import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, MessageCircle, Scale, Calendar, Phone } from "lucide-react";
import { useT } from "@/lib/i18n";
import VoiceAssistantButton from "@/components/homly/VoiceAssistantButton";

const violet = "#7B61FF";
const textMain = "#242424";
const textBody = "#555555";
const textMuted = "#666666";
const textLight = "#999999";

export default function PropertyAIChat({ property }) {
  const { t, lang } = useT();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [voiceSpeakText, setVoiceSpeakText] = useState("");
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize with translated message
  useEffect(() => {
    setMessages([{ role: "assistant", content: t("aiChat.initialMessage") }]);
  }, [t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const quickActions = [
    { icon: MessageCircle, label: t("aiChat.askPrice"), action: null },
    { icon: Scale, label: t("aiChat.compare"), action: null },
    { icon: Phone, label: t("aiChat.contactAgent"), action: null },
    { icon: Calendar, label: t("aiChat.scheduleViewing"), action: null, navigateTo: true },
  ];

  const handleSend = useCallback((text) => {
    const content = text || input.trim();
    if (!content) return;
    const userMsg = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setVoiceSpeakText("");
    setTimeout(() => {
      const replies = t("aiChat.replies", { returnArray: true });
      const replyArray = Array.isArray(replies) ? replies : [
        t("aiChat.replies.0", { default: "Based on the listing data, the owner is open to reasonable offers." }),
        t("aiChat.replies.1", { default: "Comparing with option #2: this apartment has more square meters." }),
        t("aiChat.replies.2", { default: "I can help with that. The owner's contact details are available." }),
        t("aiChat.replies.3", { default: "Heating costs in Arabkir average around 18,000–22,000 AMD per month." }),
        t("aiChat.replies.4", { default: "The street noise level is low — it's a residential side street." }),
      ];
      const reply = replyArray[Math.floor(Math.random() * replyArray.length)];
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setVoiceSpeakText(reply);
    }, 1000);
  }, [input, t]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-2 space-y-4">
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div
                className="max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5"
                style={{ backgroundColor: "rgba(123,97,255,0.08)" }}
              >
                <p className="text-[12px] leading-relaxed font-body" style={{ color: textMain }}>
                  {msg.content}
                </p>
              </div>
            </div>
          ) : (
            <div key={i} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: violet }}>
                <Sparkles size={10} className="text-white" />
              </div>
              <p className="text-[12px] leading-relaxed font-body flex-1" style={{ color: textBody }}>
                {msg.content}
              </p>
            </div>
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      <div className="py-2 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <div className="flex gap-1.5 flex-wrap">
          {quickActions.map((Action, i) => (
            <button
              key={i}
              onClick={() => {
                if (Action.navigateTo) navigate(`/schedule?propertyId=${property.id}`);
                else handleSend(Action.label);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium font-body transition-all duration-200 hover:-translate-y-px"
              style={{
                backgroundColor: "rgba(123,97,255,0.06)",
                color: violet,
                border: "1px solid rgba(123,97,255,0.10)",
              }}
            >
              <Action.icon size={11} />
              {Action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Consultant */}
      <div className="py-2.5 border-t space-y-2.5" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face" alt="Anna Hakobyan" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <p className="text-[13px] font-semibold font-body" style={{ color: textMain }}>{t("aiChat.consultantName")}</p>
            <p className="text-[11px] font-body" style={{ color: textLight }}>{t("aiChat.consultantRole")}</p>
            <p className="text-[12px] font-body" style={{ color: textMuted }}>+374 77 201 086</p>
          </div>
        </div>
        <button
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-full text-[12px] font-semibold font-body transition-all duration-200"
          style={{
            background: `linear-gradient(135deg, ${violet} 0%, #6A4FEF 100%)`,
            color: "#FFF",
            boxShadow: "0 2px 12px rgba(123,97,255,0.25)",
          }}
        >
          <Phone size={12} />
          {t("aiChat.contact")}
        </button>
      </div>

      {/* Input */}
      <div className="pt-2 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("aiChat.placeholder")}
            className="w-full bg-transparent border rounded-full py-2 pl-3.5 pr-9 text-[12px] font-body outline-none transition-all duration-300"
            style={{
              borderColor: "rgba(0,0,0,0.10)",
              color: textMain,
              backgroundColor: "rgba(255,255,255,0.50)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(123,97,255,0.30)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(123,97,255,0.05)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.10)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <VoiceAssistantButton
              onTranscript={(text) => { setInput(text); handleSend(text); }}
              speakText={voiceSpeakText}
              onClearSpeakText={() => setVoiceSpeakText("")}
              lang={lang}
              inputRef={inputRef}
            />
            <button
              type="submit"
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                background: input.trim() ? `linear-gradient(135deg, ${violet} 0%, #6A4FEF 100%)` : "transparent",
                opacity: input.trim() ? 1 : 0.3,
              }}
            >
              <ArrowRight size={12} strokeWidth={2.5} className="text-white" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}