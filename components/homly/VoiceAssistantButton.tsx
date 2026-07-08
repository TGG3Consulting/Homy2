'use client';

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Volume2, Pause, Play, Square, X } from "lucide-react";
import { useT } from "@/lib/i18n";

/* ── Language map for Web Speech API ── */
const LANG_MAP: Record<string, string> = {
  en: "en-US",
  ru: "ru-RU",
  hy: "hy-AM",
};

const violet = "#7B61FF";

/* ── TypeScript Interfaces ── */
interface VoiceSearchCriteria {
  [key: string]: unknown;
}

interface VoiceSearchProperty {
  [key: string]: unknown;
}

interface VoiceAssistantButtonProps {
  onTranscript?: (text: string) => void;
  speakText?: string;
  onInterrupt?: () => void;
  onClearSpeakText?: () => void;
  lang?: "en" | "ru" | "hy";
  inputRef?: React.RefObject<HTMLInputElement | null>;
  /** Optional: Called with extracted search criteria and properties from voice search API */
  onVoiceSearchResult?: (criteria: VoiceSearchCriteria, properties: VoiceSearchProperty[]) => void;
  /** Enable voice search API integration (POST /api/search/voice) */
  enableVoiceSearch?: boolean;
}

type VoiceState = "idle" | "listening" | "processing" | "speaking";

type VoiceError = "denied" | "unsupported" | "no-speech" | "network" | "recognition-failed" | null;

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInterface {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInterface;
}

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

/**
 * VoiceAssistantButton — a reusable, premium voice UI for Homy chats.
 *
 * Props:
 *   onTranscript(text)   – called when speech is captured and user finalises
 *   speakText            – pass AI response text here; component reads it aloud
 *   onInterrupt()        – called when the user interrupts AI speech
 *   onClearSpeakText()   – called after TTS finishes (so parent clears speakText)
 *   lang                 – current UI language code ("en"|"ru"|"hy")
 *   inputRef             – optional ref to a text input (shows live transcript there)
 *   onVoiceSearchResult  – optional callback for voice search API results
 *   enableVoiceSearch    – enable voice search API integration
 */
export default function VoiceAssistantButton({
  onTranscript,
  speakText,
  onInterrupt,
  onClearSpeakText,
  lang = "en",
  inputRef,
  onVoiceSearchResult,
  enableVoiceSearch = false,
}: VoiceAssistantButtonProps) {
  const { t } = useT();

  /* ── State machine ── */
  const STATE = { IDLE: "idle", LISTENING: "listening", PROCESSING: "processing", SPEAKING: "speaking" } as const;
  const [state, setState] = useState<VoiceState>(STATE.IDLE);
  const [error, setError] = useState<VoiceError>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const finalTranscriptRef = useRef("");
  const stateRef = useRef<VoiceState>(STATE.IDLE);
  stateRef.current = state;

  /* ── Voice Search API Integration ── */
  const callVoiceSearchAPI = useCallback(async (transcript: string) => {
    if (!enableVoiceSearch || !onVoiceSearchResult) return;

    try {
      const response = await fetch('/api/search/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, lang })
      });
      const { criteria_extracted, properties } = await response.json();
      onVoiceSearchResult?.(criteria_extracted, properties);
    } catch (err) {
      console.error('Voice search API error:', err);
    }
  }, [enableVoiceSearch, onVoiceSearchResult, lang]);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      stopRecognition();
      stopSpeaking();
    };
  }, []);

  /* ── Speak AI response ── */
  useEffect(() => {
    if (speakText && stateRef.current === STATE.PROCESSING) {
      speak(speakText);
    }
  }, [speakText]);

  /* ── Keyboard: Enter / Space to toggle mic ── */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }, [state]);

  /* ── Speech Recognition ── */
  const startRecognition = useCallback(() => {
    setError(null);
    setLiveTranscript("");
    finalTranscriptRef.current = "";

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("unsupported");
      setState(STATE.IDLE);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = LANG_MAP[lang] || "en-US";
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscriptRef.current += result[0].transcript + " ";
          } else {
            interim += result[0].transcript;
          }
        }
        const full = (finalTranscriptRef.current + interim).trim();
        setLiveTranscript(full);

        // Update input if ref provided
        if (inputRef?.current) {
          inputRef.current.value = full;
          // trigger React onChange
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
          nativeInputValueSetter?.call(inputRef.current, full);
          inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
        }
      };

      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (e.error === "not-allowed") setError("denied");
        else if (e.error === "no-speech") setError("no-speech");
        else if (e.error === "network") setError("network");
        else setError("recognition-failed");
        setState(STATE.IDLE);
      };

      recognition.onend = () => {
        const final = finalTranscriptRef.current.trim();
        if (final && stateRef.current === STATE.LISTENING) {
          setState(STATE.PROCESSING);
          onTranscript?.(final);
          // Call voice search API if enabled
          callVoiceSearchAPI(final);
          setLiveTranscript("");
          finalTranscriptRef.current = "";
        } else if (stateRef.current === STATE.LISTENING) {
          setError("no-speech");
          setState(STATE.IDLE);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setState(STATE.LISTENING);
    } catch (_) {
      setError("recognition-failed");
      setState(STATE.IDLE);
    }
  }, [lang, onTranscript, inputRef, callVoiceSearchAPI]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
  }, []);

  /* ── Speech Synthesis ── */
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_MAP[lang] || "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utteranceRef.current = utterance;

    utterance.onstart = () => {
      setState(STATE.SPEAKING);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setState(STATE.IDLE);
      setIsPaused(false);
      utteranceRef.current = null;
      onClearSpeakText?.();
    };

    utterance.onerror = () => {
      setState(STATE.IDLE);
      setIsPaused(false);
      utteranceRef.current = null;
      onClearSpeakText?.();
    };

    window.speechSynthesis.speak(utterance);
  }, [lang, onClearSpeakText]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setIsPaused(false);
  }, []);

  const pauseSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resumeSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  /* ── Click handler ── */
  const handleClick = useCallback(() => {
    setError(null);
    if (state === STATE.IDLE) {
      startRecognition();
    } else if (state === STATE.LISTENING) {
      stopRecognition();
      setState(STATE.IDLE);
    } else if (state === STATE.SPEAKING) {
      onInterrupt?.();
      stopSpeaking();
      setState(STATE.IDLE);
    } else if (state === STATE.PROCESSING) {
      // Allow cancel during processing
      setState(STATE.IDLE);
    }
  }, [state, startRecognition, stopRecognition, stopSpeaking, onInterrupt]);

  /* ── Dismiss error ── */
  const dismissError = () => setError(null);

  /* ── Label ── */
  const getLabel = (): string => {
    if (error) {
      if (error === "denied") return t("voiceAssistant.error.denied");
      if (error === "unsupported") return t("voiceAssistant.error.unsupported");
      if (error === "no-speech") return t("voiceAssistant.error.noSpeech");
      if (error === "network") return t("voiceAssistant.error.network");
      return t("voiceAssistant.error.recognitionFailed");
    }
    if (state === STATE.LISTENING) return t("voiceAssistant.listening");
    if (state === STATE.PROCESSING) return t("voiceAssistant.thinking");
    if (state === STATE.SPEAKING) return t("voiceAssistant.speaking");
    return t("voiceAssistant.talkToHomy");
  };

  const label = getLabel();

  return (
    <div className="relative inline-flex items-center group">
      {/* Tooltip */}
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg text-[10px] font-body font-medium whitespace-nowrap pointer-events-none transition-all duration-200 opacity-0 group-hover:opacity-100"
        style={{
          backgroundColor: "rgba(30,30,30,0.85)",
          color: "#FFF",
          backdropFilter: "blur(12px)",
        }}
      >
        {label}
      </div>


      {/* Speaking controls (below the button) */}
      {state === STATE.SPEAKING && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex items-center gap-1.5 z-20"
        >
          <div
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl"
            style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <span className="text-[10px] font-body font-medium mr-1" style={{ color: "#242424" }}>
              {t("voiceAssistant.homlyIsSpeaking")}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); isPaused ? resumeSpeaking() : pauseSpeaking(); }}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ backgroundColor: "rgba(123,97,255,0.1)", color: violet }}
              aria-label={isPaused ? t("voiceAssistant.resume") : t("voiceAssistant.pause")}
            >
              {isPaused ? <Play size={11} /> : <Pause size={11} />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onInterrupt?.(); stopSpeaking(); setState(STATE.IDLE); }}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ backgroundColor: "rgba(0,0,0,0.06)", color: "#555" }}
              aria-label={t("voiceAssistant.stop")}
            >
              <Square size={10} />
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN BUTTON ── */}
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="relative flex items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{
          width: "38px",
          height: "38px",
          cursor: "pointer",
          outline: "none",
          backgroundColor:
            state === STATE.LISTENING ? "rgba(123,97,255,0.12)"
            : state === STATE.PROCESSING ? "rgba(123,97,255,0.08)"
            : state === STATE.SPEAKING ? "rgba(123,97,255,0.06)"
            : "rgba(123,97,255,0.06)",
          border:
            state === STATE.LISTENING ? "1.5px solid rgba(123,97,255,0.4)"
            : state === STATE.PROCESSING ? "1.5px solid rgba(123,97,255,0.25)"
            : "1px solid rgba(123,97,255,0.15)",
          boxShadow:
            state === STATE.LISTENING
              ? "0 0 0 6px rgba(123,97,255,0.1), 0 0 20px rgba(123,97,255,0.15), inset 0 1px 0 rgba(255,255,255,0.6)"
              : state === STATE.PROCESSING
              ? "0 0 0 3px rgba(123,97,255,0.06), inset 0 1px 0 rgba(255,255,255,0.4)"
              : "inset 0 1px 0 rgba(255,255,255,0.5), 0 1px 3px rgba(0,0,0,0.04)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        aria-label={label}
        role="button"
        tabIndex={0}
      >
        {/* Glass shimmer */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.3) 100%)",
            opacity: state === STATE.IDLE ? 1 : 0.5,
          }}
        />

        {/* Listening — pulsing rings */}
        {state === STATE.LISTENING && (
          <>
            <div
              className="absolute inset-0 rounded-full"
              style={{
                animation: "voice-pulse-ring 1.8s ease-out infinite",
                border: "2px solid rgba(123,97,255,0.3)",
              }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                animation: "voice-pulse-ring 1.8s ease-out 0.5s infinite",
                border: "2px solid rgba(123,97,255,0.15)",
              }}
            />
          </>
        )}

        {/* Processing — rotating ring */}
        {state === STATE.PROCESSING && (
          <div
            className="absolute -inset-[3px] rounded-full pointer-events-none"
            style={{
              background: `conic-gradient(from 0deg, transparent 0%, ${violet} 25%, transparent 50%, transparent 100%)`,
              animation: "voice-spin 1.2s linear infinite",
              mask: "radial-gradient(circle, transparent 60%, black 61%, black 90%, transparent 91%)",
              WebkitMask: "radial-gradient(circle, transparent 60%, black 61%, black 90%, transparent 91%)",
            }}
          />
        )}

        {/* Speaking — waveform bars */}
        {state === STATE.SPEAKING && (
          <div className="absolute inset-0 flex items-center justify-center gap-[2px] pointer-events-none">
            {[0,1,2,3,4].map((i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: "2px",
                  height: "8px",
                  backgroundColor: violet,
                  opacity: 0.5,
                  animation: `voice-wave 0.6s ease-in-out ${i * 0.12}s infinite alternate`,
                }}
              />
            ))}
          </div>
        )}

        {/* Icon */}
        {state === STATE.LISTENING ? (
          <Mic size={16} style={{ color: violet, position: "relative", zIndex: 1 }} strokeWidth={2} />
        ) : state === STATE.PROCESSING ? (
          <div className="relative z-10 flex items-center gap-[2px]">
            <span className="w-[2px] h-[8px] rounded-full animate-pulse" style={{ backgroundColor: violet, animationDelay: "0ms" }} />
            <span className="w-[2px] h-[8px] rounded-full animate-pulse" style={{ backgroundColor: violet, animationDelay: "150ms" }} />
            <span className="w-[2px] h-[8px] rounded-full animate-pulse" style={{ backgroundColor: violet, animationDelay: "300ms" }} />
          </div>
        ) : state === STATE.SPEAKING ? (
          <Volume2 size={15} style={{ color: violet, position: "relative", zIndex: 1 }} strokeWidth={2} />
        ) : (
          <Mic size={15} style={{ color: violet, position: "relative", zIndex: 1, opacity: 0.65 }} strokeWidth={1.75} />
        )}
      </button>

      {/* CSS animations injected once */}
      <style>{`
        @keyframes voice-pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes voice-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes voice-wave {
          0% { height: 3px; }
          100% { height: 10px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .voice-pulse-ring, .voice-spin, .voice-wave {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
