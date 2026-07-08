'use client';

import React from 'react';
import { Scale, Loader2, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const glassStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.55)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.65)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.85)',
};

interface CompareResultBlockProps {
  result: string | null;
  isLoading: boolean;
}

export default function CompareResultBlock({ result, isLoading }: CompareResultBlockProps) {
  return (
    <div className="rounded-2xl overflow-hidden" style={glassStyle}>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2 border-b"
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
            Результат сравнения
          </h3>
          <p className="text-[11px] font-body" style={{ color: '#757570' }}>
            {isLoading
              ? 'Анализируем объекты...'
              : result
                ? 'Анализ завершён'
                : 'Ожидание анализа'}
          </p>
        </div>
        {result && !isLoading && (
          <CheckCircle2 size={16} style={{ color: '#16A34A', marginLeft: 'auto' }} />
        )}
      </div>

      {/* Content */}
      <div className="p-4 min-h-[120px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin" style={{ color: '#7B61FF' }} />
            <span className="ml-3 text-[13px] font-body" style={{ color: '#5C5A55' }}>
              Homy анализирует выбранные объекты...
            </span>
          </div>
        ) : result ? (
          <div
            className="prose prose-sm max-w-none text-[13px] font-body leading-relaxed"
            style={{ color: '#3D3B37' }}
          >
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="mb-3 ml-4 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => (
                  <strong style={{ color: '#1A1A1A', fontWeight: 600 }}>{children}</strong>
                ),
                h3: ({ children }) => (
                  <h3 className="text-[14px] font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-[13px] font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>
                    {children}
                  </h4>
                ),
              }}
            >
              {result}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}
            >
              <Scale size={20} style={{ color: '#999' }} />
            </div>
            <p className="text-[13px] font-body" style={{ color: '#757570' }}>
              Сравнение начнётся автоматически
            </p>
            <p className="text-[11px] font-body mt-1" style={{ color: '#A09D96' }}>
              Или задайте вопрос в чате справа
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
