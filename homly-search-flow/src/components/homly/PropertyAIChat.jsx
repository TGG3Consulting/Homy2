import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, Sparkles, MessageCircle, Scale, Calendar, Phone, User } from "lucide-react";

const initialMessages = [
  {
    role: "assistant",
    content:
      "This apartment in Arabkir is my top recommendation for your family. It's a 3-bedroom unit just an 8-minute walk from School #55, on a quiet residential street with a playground nearby. At 195,000 AMD/month, it fits your budget perfectly.",
  },
];

const quickActions = [
  { icon: MessageCircle, label: "Ask about price", action: "Is the price negotiable?" },
  { icon: Scale, label: "Compare", action: "How does it compare to option #2?" },
  { icon: Phone, label: "Contact agent", action: null },
  { icon: Calendar, label: "Schedule viewing", action: null },
];

export default function PropertyAIChat({ property }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text) => {
    const content = text || input.trim();
    if (!content) return;

    const userMsg = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiReplies = [
        "Based on the listing data, the owner is open to reasonable offers. The current price of 195,000 AMD is already competitive for Arabkir, but I'd suggest offering 185,000 AMD as a starting point for negotiation.",
        "Comparing with option #2 (the modern 3-room on Arabkir Park): this apartment has more square meters (85 vs 78) and is closer to schools, but option #2 is in a newer building. For a family with children, I'd lean toward this one for the school proximity.",
        "I can help with that. The owner's contact details are available once you confirm interest. Would you like me to prepare a pre-viewing checklist for this property?",
        "Heating costs in Arabkir average around 18,000–22,000 AMD per month during winter. This building was renovated in 2019, so the insulation is better than average. Utilities including water and electricity typically add another 12,000–15,000 AMD monthly.",
        "The street noise level is low — it's a residential side street with mostly local traffic. Three previous tenants confirmed the area is quiet, especially in the evenings. Would you like me to check recent noise complaint data for this block?",
      ];
      const reply =
        aiReplies[Math.floor(Math.random() * aiReplies.length)];
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 pb-4 border-b" style={{ borderColor: "rgba(200,196,188,0.25)" }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(139,108,255,0.1)" }}>
          <Sparkles size={13} style={{ color: "#8B6CFF" }} />
        </div>
        <span className="text-[13px] font-semibold font-body tracking-tight" style={{ color: "#1A1A1A" }}>
          Conversation about this property
        </span>
      </div>

      {/* Consultant */}
      <div
        className="flex items-center gap-3 py-3 px-3 -mx-3 rounded-xl"
        style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "rgba(139,108,255,0.1)" }}
        >
          <User size={18} style={{ color: "#8B6CFF" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold font-body" style={{ color: "#1A1A1A" }}>Anna Hakobyan</p>
          <p className="text-[10px] font-body" style={{ color: "#A09D96" }}>Personal consultant</p>
        </div>
        <button
          className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold font-body transition-all duration-200 hover:shadow-sm"
          style={{ backgroundColor: "#8B6CFF", color: "#FFF" }}
        >
          <Phone size={10} />
          Contact
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div
                className="max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5"
                style={{ backgroundColor: "rgba(139,108,255,0.08)" }}
              >
                <p className="text-[12px] leading-relaxed font-body" style={{ color: "#1A1A1A" }}>
                  {msg.content}
                </p>
              </div>
            </div>
          ) : (
            <div key={i} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#8B6CFF" }}>
                <Sparkles size={10} className="text-white" />
              </div>
              <p className="text-[12px] leading-relaxed font-body flex-1" style={{ color: "#3D3B37" }}>
                {msg.content}
              </p>
            </div>
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      <div className="py-2 border-t" style={{ borderColor: "rgba(200,196,188,0.2)" }}>
        <div className="flex gap-1.5 flex-wrap">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => action.action && handleSend(action.action)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-body font-medium transition-all duration-200 hover:-translate-y-px"
              style={{
                backgroundColor: "rgba(139,108,255,0.06)",
                color: "#8B6CFF",
              }}
            >
              <action.icon size={11} />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="pt-2 border-t" style={{ borderColor: "rgba(200,196,188,0.2)" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Homly about this property…"
            className="w-full bg-transparent border rounded-full py-2 pl-3.5 pr-9 text-[12px] font-body outline-none transition-all duration-300"
            style={{
              borderColor: "rgba(200,196,188,0.4)",
              color: "#1A1A1A",
              backgroundColor: "rgba(255,255,255,0.4)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(139,108,255,0.3)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,108,255,0.05)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(200,196,188,0.4)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              backgroundColor: input.trim() ? "#8B6CFF" : "transparent",
              opacity: input.trim() ? 1 : 0.3,
            }}
          >
            <ArrowRight size={12} strokeWidth={2.5} className="text-white" />
          </button>
        </form>
      </div>

      {/* Contact footer */}
      <div className="pt-3 mt-2 border-t flex items-center gap-2.5" style={{ borderColor: "rgba(200,196,188,0.2)" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(139,108,255,0.1)" }}>
          <User size={14} style={{ color: "#8B6CFF" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold font-body" style={{ color: "#1A1A1A" }}>Anna Hakobyan</p>
          <p className="text-[9px] font-body" style={{ color: "#A09D96" }}>Personal consultant</p>
        </div>
        <button className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-semibold font-body" style={{ backgroundColor: "#8B6CFF", color: "#FFF" }}>
          <Phone size={9} />
          Contact
        </button>
      </div>
    </div>
  );
}