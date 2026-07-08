import React, { useState, useRef, useEffect } from "react";
import {
  Heart,
  Share2,
  EyeOff,
  MoreHorizontal,
  Copy,
  Check,
  AlertTriangle,
  X,
  Send,
} from "lucide-react";

const glassBase = {
  backgroundColor: "rgba(255, 255, 255, 0.45)",
  backdropFilter: "blur(20px) saturate(160%)",
  WebkitBackdropFilter: "blur(20px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.55)",
  boxShadow: "0 2px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.80)",
};

function SharePopover({ isOpen, onClose, property }) {
  const [copied, setCopied] = useState(false);
  const link = `https://homly.am/property/${property.id}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div
        className="absolute right-0 top-full mt-2 z-20 rounded-2xl p-3 w-52"
        style={glassBase}
      >
        <div className="space-y-0.5">
          <button
            onClick={copyLink}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-body font-medium transition-all duration-200 hover:bg-white/40"
            style={{ color: "#3D3B37" }}
          >
            {copied ? <Check size={14} style={{ color: "#22C55E" }} /> : <Copy size={14} style={{ color: "#757570" }} />}
            {copied ? "Copied!" : "Copy link"}
          </button>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(property.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-body font-medium transition-all duration-200 hover:bg-white/40"
            style={{ color: "#3D3B37" }}
          >
            <Send size={14} style={{ color: "#24A1DE" }} />
            Telegram
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(property.title + " — " + link)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-body font-medium transition-all duration-200 hover:bg-white/40"
            style={{ color: "#3D3B37" }}
          >
            <Send size={14} style={{ color: "#25D366" }} />
            WhatsApp
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(property.title)}&body=${encodeURIComponent(link)}`}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-body font-medium transition-all duration-200 hover:bg-white/40"
            style={{ color: "#3D3B37" }}
          >
            <Send size={14} style={{ color: "#757570" }} />
            Email
          </a>
        </div>
      </div>
    </>
  );
}

const reportReasons = [
  "Incorrect price",
  "Wrong photos",
  "Property unavailable",
  "Fake or suspicious listing",
  "Wrong address",
  "Other problem",
];

function ReportModal({ isOpen, onClose }) {
  const [selectedReason, setSelectedReason] = useState(null);
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedReason(null);
      setDescription("");
      setSubmitted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(onClose, 1800);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: "rgba(20,20,20,0.35)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-[380px] rounded-[22px] p-6 mx-4"
          style={{
            backgroundColor: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.75)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.12), 0 6px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.90)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(34,197,94,0.10)" }}>
                <Check size={24} style={{ color: "#22C55E" }} />
              </div>
              <h3 className="text-[16px] font-semibold font-body mb-1" style={{ color: "#242424" }}>Report submitted</h3>
              <p className="text-[13px] font-body" style={{ color: "#999999" }}>Thank you for helping keep Homly accurate.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle size={16} style={{ color: "#DFA36E" }} />
                  <h3 className="text-[16px] font-semibold font-body" style={{ color: "#242424" }}>Report issue</h3>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
                  style={{ backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <X size={14} style={{ color: "#666666" }} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {reportReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className="text-left px-3 py-2.5 rounded-xl text-[12px] font-body font-medium transition-all duration-200"
                    style={{
                      backgroundColor: selectedReason === reason ? "rgba(123,97,255,0.07)" : "rgba(0,0,0,0.03)",
                      color: selectedReason === reason ? "#7B61FF" : "#555555",
                      border: selectedReason === reason ? "1px solid rgba(123,97,255,0.20)" : "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Describe the issue…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl p-3 text-[12px] font-body resize-none transition-all duration-200 focus:outline-none mb-4"
                style={{
                  backgroundColor: "rgba(0,0,0,0.025)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  color: "#3D3B37",
                  placeholder: { color: "#AAAAAA" },
                }}
              />

              <div className="flex gap-2.5">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-[12px] font-body font-medium transition-all duration-200"
                  style={{ backgroundColor: "rgba(0,0,0,0.04)", color: "#666666", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedReason}
                  className="flex-1 py-2.5 rounded-xl text-[12px] font-body font-medium transition-all duration-200"
                  style={{
                    backgroundColor: selectedReason ? "#7B61FF" : "rgba(123,97,255,0.20)",
                    color: selectedReason ? "#FFF" : "rgba(123,97,255,0.40)",
                    cursor: selectedReason ? "pointer" : "default",
                  }}
                >
                  Submit report
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function PropertyActionBar({ property }) {
  const [isSaved, setIsSaved] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showHideConfirm, setShowHideConfirm] = useState(false);
  const moreRef = useRef(null);
  const shareRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setShowMore(false);
      if (shareRef.current && !shareRef.current.contains(e.target)) setShowShare(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleHide = () => {
    setIsHidden(true);
    setShowHideConfirm(false);
    setShowMore(false);
  };

  const handleReport = () => {
    setShowMore(false);
    setShowReport(true);
  };

  const actionBtnStyle = (active) => ({
    color: active ? "#7B61FF" : "#555555",
    backgroundColor: active ? "rgba(123,97,255,0.07)" : "transparent",
    border: active ? "1px solid rgba(123,97,255,0.12)" : "1px solid transparent",
  });

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Save */}
        <button
          onClick={() => setIsSaved(!isSaved)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-body font-medium transition-all duration-200 hover:bg-black/[0.03]"
          style={actionBtnStyle(isSaved)}
        >
          <Heart size={14} fill={isSaved ? "#7B61FF" : "none"} />
          <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
        </button>

        {/* Share */}
        <div className="relative" ref={shareRef}>
          <button
            onClick={() => { setShowShare(!showShare); setShowMore(false); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-body font-medium transition-all duration-200 hover:bg-black/[0.03]"
            style={{ color: "#555555" }}
          >
            <Share2 size={14} />
            <span className="hidden sm:inline">Share</span>
          </button>
          <SharePopover isOpen={showShare} onClose={() => setShowShare(false)} property={property} />
        </div>

        {/* Hide */}
        <div className="relative">
          <button
            onClick={() => setShowHideConfirm(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-body font-medium transition-all duration-200 hover:bg-black/[0.03]"
            style={isHidden ? { color: "#999999", textDecoration: "line-through" } : { color: "#555555" }}
          >
            <EyeOff size={14} />
            <span className="hidden sm:inline">{isHidden ? "Hidden" : "Hide"}</span>
          </button>

          {showHideConfirm && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowHideConfirm(false)} />
              <div className="absolute right-0 top-full mt-2 z-20 rounded-2xl p-4 w-64"
                style={glassBase}>
                <p className="text-[12px] font-body mb-3" style={{ color: "#3D3B37" }}>
                  Hide this property from your recommendations?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowHideConfirm(false)}
                    className="flex-1 py-2 rounded-xl text-[12px] font-body font-medium transition-all duration-200"
                    style={{ backgroundColor: "rgba(0,0,0,0.04)", color: "#666666", border: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleHide}
                    className="flex-1 py-2 rounded-xl text-[12px] font-body font-medium transition-all duration-200"
                    style={{ backgroundColor: "rgba(0,0,0,0.80)", color: "#FFF" }}
                  >
                    Hide
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* More */}
        <div className="relative" ref={moreRef}>
          <button
            onClick={() => { setShowMore(!showMore); setShowShare(false); }}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[12px] font-body font-medium transition-all duration-200 hover:bg-black/[0.03]"
            style={{ color: "#555555" }}
          >
            <MoreHorizontal size={14} />
          </button>

          {showMore && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMore(false)} />
              <div className="absolute right-0 top-full mt-2 z-20 rounded-2xl p-2 w-52"
                style={glassBase}>
                <button
                  onClick={handleReport}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-body font-medium transition-all duration-200 hover:bg-white/40"
                  style={{ color: "#3D3B37" }}
                >
                  <AlertTriangle size={14} style={{ color: "#DFA36E" }} />
                  Report problem with listing
                </button>
              </div>
            </>
          )}
        </div>

        {isHidden && (
          <span
            className="text-[10px] font-body font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "rgba(0,0,0,0.04)",
              color: "#999999",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            Hidden
          </span>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
    </>
  );
}