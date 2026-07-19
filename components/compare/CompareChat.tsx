'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Scale, Loader2 } from 'lucide-react';
import { PropertyShowcase, ChatMessage } from '@/lib/types';

const glassStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.45)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 2px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.80)',
};

// System prompt for compare context
const COMPARE_SYSTEM_CONTEXT = `Ты на странице сравнения объектов недвижимости. У тебя есть полные данные по выбранным объектам.

ПЕРВЫЙ ЗАПРОС — это детальное сравнение объектов. Ты должен:
1. Сравнить цену за квадратный метр
2. Сравнить расположение и инфраструктуру
3. Сравнить состояние и особенности
4. Дать рекомендацию какой объект лучше и почему

ПОСЛЕДУЮЩИЕ ВОПРОСЫ клиента — отвечай как обычный консультант, у тебя есть контекст по этим объектам.

Отвечай на языке клиента. Без смайликов. Без markdown заголовков ###. Живой разговорный тон.`;

interface CompareChatProps {
  properties: PropertyShowcase[];
  onCompareResult: (result: string) => void;
  onCompareStart: () => void;
}

export default function CompareChat({ properties, onCompareResult, onCompareStart }: CompareChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoCompared, setHasAutoCompared] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build compare prompt with property data
  const buildComparePrompt = useCallback(() => {
    const searchContext = typeof window !== 'undefined'
      ? sessionStorage.getItem('homy_search_context') || ''
      : '';

    const propertyDescriptions = properties.map((p, i) => {
      const pricePerSqm = p.size_sqm ? Math.round(p.price / p.size_sqm) : 0;
      return `
ОБЪЕКТ ${i + 1}:
- Адрес: ${p.address || 'не указан'}
- Район: ${p.district || p.neighborhood || 'не указан'}
- Цена: ${p.price?.toLocaleString()} ${p.currency || 'AMD'}/мес
- Площадь: ${p.size_sqm || p.area} м²
- Цена за м²: ${pricePerSqm.toLocaleString()} AMD
- Комнат: ${p.bedrooms || p.rooms}
- Этаж: ${p.floor || '?'}
- Парковка: ${p.has_parking ? 'есть' : 'нет'}
- Балкон: ${p.has_balcony ? 'есть' : 'нет'}
- Животные: ${p.pets_allowed ? 'можно' : 'нельзя'}
- Match Score: ${p.match_score || 0}%
`;
    }).join('\n');

    let prompt = `Сравни эти ${properties.length} объекта недвижимости:\n${propertyDescriptions}`;

    if (searchContext) {
      prompt += `\n\nКонтекст запроса клиента: "${searchContext}"`;
    }

    prompt += '\n\nДай детальное сравнение и рекомендацию.';

    return prompt;
  }, [properties]);

  // Send compare request
  const sendCompareRequest = useCallback(async (prompt: string, isAutoCompare: boolean = false) => {
    if (isLoading) return;

    setIsLoading(true);
    if (isAutoCompare) {
      onCompareStart();
    }

    // Add user message to chat (only for manual messages)
    if (!isAutoCompare) {
      setMessages(prev => [...prev, {
        id: `user-${Date.now()}`,
        role: 'user',
        content: prompt,
        timestamp: Date.now(),
      }]);
    }

    try {
      const response = await fetch('/api/chat/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: prompt,
          systemContext: COMPARE_SYSTEM_CONTEXT,
          properties: properties.map(p => ({
            id: p.id,
            address: p.address,
            district: p.district,
            neighborhood: p.neighborhood,
            price: p.price,
            currency: p.currency,
            size_sqm: p.size_sqm || p.area,
            rooms: p.bedrooms || p.rooms,
            floor: p.floor,
            hasParking: p.has_parking,
            hasBalcony: p.has_balcony,
            petsAllowed: p.pets_allowed,
            match_score: p.match_score,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get compare response');
      }

      const data = await response.json();
      const assistantMessage = data.message || data.content || '';

      // For auto-compare, send result to parent (renders in CompareResultBlock)
      if (isAutoCompare) {
        onCompareResult(assistantMessage);
      } else {
        // For follow-up questions, add to chat
        setMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: assistantMessage,
          timestamp: Date.now(),
        }]);
      }
    } catch (err) {
      console.error('Compare request error:', err);
      const errorMessage = 'Ошибка при получении анализа. Попробуйте ещё раз.';

      if (isAutoCompare) {
        onCompareResult(errorMessage);
      } else {
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: errorMessage,
          timestamp: Date.now(),
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, properties, onCompareStart, onCompareResult]);

  // Auto-compare on load when properties are available
  useEffect(() => {
    if (properties.length >= 2 && !hasAutoCompared && !isLoading) {
      setHasAutoCompared(true);
      const prompt = buildComparePrompt();
      sendCompareRequest(prompt, true);
    }
  }, [properties, hasAutoCompared, isLoading, buildComparePrompt, sendCompareRequest]);

  // Handle send
  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    setInputValue('');
    sendCompareRequest(trimmed);
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden" style={glassStyle}>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(0,0,0,0.06)' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(123,97,255,0.12)' }}
        >
          <Scale size={16} style={{ color: '#7B61FF' }} />
        </div>
        <div>
          <h3 className="text-[14px] font-body font-semibold" style={{ color: '#1A1A1A' }}>
            Чат с Homy
          </h3>
          <p className="text-[11px] font-body" style={{ color: '#757570' }}>
            Задайте вопросы по объектам
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-6">
            <p className="text-[12px] font-body" style={{ color: '#A09D96' }}>
              Сравнение выполняется автоматически.
              <br />
              Задайте дополнительные вопросы здесь.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[85%] rounded-2xl px-3 py-2 text-[13px] font-body leading-relaxed"
              style={{
                backgroundColor: msg.role === 'user'
                  ? 'rgba(123,97,255,0.12)'
                  : 'rgba(255,255,255,0.7)',
                color: '#3D3B37',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-3 py-2 flex items-center gap-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
            >
              <Loader2 size={14} className="animate-spin" style={{ color: '#7B61FF' }} />
              <span className="text-[12px] font-body" style={{ color: '#757570' }}>
                Homy думает...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 border-t flex-shrink-0"
        style={{ borderColor: 'rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Задайте вопрос по объектам..."
            rows={1}
            className="flex-1 resize-none rounded-xl px-3 py-2 text-[13px] font-body focus:outline-none"
            style={{
              backgroundColor: 'rgba(0,0,0,0.03)',
              border: '1px solid rgba(0,0,0,0.08)',
              color: '#3D3B37',
              maxHeight: '80px',
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{
              backgroundColor: inputValue.trim() && !isLoading
                ? '#7B61FF'
                : 'rgba(0,0,0,0.08)',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
            }}
          >
            <Send
              size={16}
              style={{ color: inputValue.trim() && !isLoading ? '#FFF' : '#999' }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
