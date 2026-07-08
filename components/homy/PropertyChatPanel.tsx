'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send } from 'lucide-react';
import { PropertyShowcase } from '@/lib/types';

interface Msg { role: 'user' | 'assistant'; content: string }

function getMainChatHistory(): string {
  if (typeof window === 'undefined') return '';
  try {
    const h = sessionStorage.getItem('homy_chat_history');
    if (!h) return '';
    const m = JSON.parse(h);
    return m.filter((x: any) => x.role === 'user').map((x: any) => x.content).slice(-10).join(' | ');
  } catch { return ''; }
}

const GREETING = 'Спросите что угодно об этой квартире — район, документы, торг, расходы. Отвечаю по фактам.';
const SUGGESTIONS = ['Что с парковкой?', 'Насколько тихо?', 'Какие документы?'];

/** Per-property AI chat, styled 1:1 with the Homy card mockup, wired to /api/properties/[id]/chat. */
export default function PropertyChatPanel({ property, onClose }: { property: PropertyShowcase; onClose?: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setInput('');
    setLoading(true);
    try {
      const chatHistory = messages.map((m) => `${m.role === 'user' ? 'Клиент' : 'AI'}: ${m.content}`).join('\n');
      const res = await fetch(`/api/properties/${property.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, conversationHistory: getMainChatHistory(), chatHistory }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response || 'Не удалось получить ответ.' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Ошибка соединения. Попробуйте ещё раз.' }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, property.id]);

  const showSuggestions = messages.filter((m) => m.role === 'user').length === 0 && !loading;

  return (
    <div className="cchat">
      <div className="ai-h">
        <div className="cav">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" /></svg>
        </div>
        <div>
          <div className="nm">Homy по объекту</div>
          <div className="st"><i />отвечает по этой квартире</div>
        </div>
        {onClose && <button className="cx" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>}
      </div>

      <div className="ai-body">
        {messages.map((m, i) => (
          <div key={i} className={`amsg ${m.role === 'user' ? 'u' : 'a'}`}>{m.content}</div>
        ))}
        {loading && <div className="amsg a">Думаю…</div>}
        {showSuggestions && (
          <div className="asug">
            {SUGGESTIONS.map((s) => (
              <span key={s} onClick={() => send(s)}>{s}</span>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="ai-comp" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input
          className="in"
          placeholder="Спросите об объекте…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button className="snd" type="submit" disabled={loading || !input.trim()} aria-label="Отправить">
          <Send size={17} color="#fff" />
        </button>
      </form>
    </div>
  );
}
