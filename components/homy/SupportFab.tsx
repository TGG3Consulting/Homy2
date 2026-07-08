'use client';

import React from 'react';
import { useChatWidget } from '@/contexts/ChatWidgetContext';

const CSS = `
.homy-supportfab{position:fixed;right:22px;bottom:22px;z-index:45;width:56px;height:56px;border-radius:50%;border:0;cursor:pointer;
  display:flex;align-items:center;justify-content:center;background:radial-gradient(135% 170% at 50% 16%,#2BC091,#0A6045);
  box-shadow:0 12px 30px rgba(4,40,28,.45),inset 0 1px 0 rgba(255,255,255,.35),inset 0 -6px 12px rgba(3,28,20,.4);
  transition:transform .18s ease}
.homy-supportfab:hover{transform:translateY(-2px) scale(1.04)}
.homy-supportfab:active{transform:scale(.96)}
.homy-supportfab svg{color:#fff}
.homy-supportfab .dot{position:absolute;top:5px;right:5px;width:12px;height:12px;border-radius:50%;background:#2BC091;border:2px solid #0A6045;box-shadow:0 0 0 2px rgba(255,255,255,.25)}
@media (max-width:900px){.homy-supportfab{right:16px;bottom:74px;width:52px;height:52px}}
`;

/** Floating support-chat launcher (bottom-right). Opens the global live ChatWidget. */
export default function SupportFab() {
  const { openSupportChat, isOpen } = useChatWidget();
  if (isOpen) return null;
  return (
    <button className="homy-supportfab" onClick={openSupportChat} aria-label="Чат с поддержкой" title="Чат с поддержкой">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <span className="dot" />
    </button>
  );
}
