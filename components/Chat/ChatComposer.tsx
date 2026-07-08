'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

interface ChatComposerProps {
  onSend: (content: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatComposer({
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'Введите сообщение...'
}: ChatComposerProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingRef = useRef<number>(0);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [content]);

  // Handle typing indicator with debounce
  const handleTyping = useCallback(() => {
    if (!onTyping) return;

    const now = Date.now();
    // Only send typing event every 500ms
    if (now - lastTypingRef.current > 500) {
      lastTypingRef.current = now;
      onTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to send typing again if user continues
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 1000);
  }, [onTyping]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    handleTyping();
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setContent('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter = send, Shift+Enter = new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const canSend = content.trim().length > 0 && !disabled;

  return (
    <div
      className="px-4 py-3 border-t"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(0, 0, 0, 0.06)'
      }}
    >
      <div
        className="flex items-end gap-2 rounded-2xl px-4 py-2"
        style={{
          backgroundColor: 'rgba(248, 248, 248, 0.8)',
          border: '1px solid rgba(0, 0, 0, 0.06)'
        }}
      >
        {/* Attachment button (placeholder) */}
        <button
          type="button"
          className="flex-shrink-0 p-1.5 rounded-full transition-colors hover:bg-gray-200 disabled:opacity-50"
          disabled={disabled}
          title="Прикрепить файл"
        >
          <Paperclip size={20} className="text-gray-400" />
        </button>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm placeholder-gray-400 py-1.5"
          style={{
            color: '#1A1A1A',
            maxHeight: '150px',
            minHeight: '24px'
          }}
        />

        {/* Emoji button (placeholder) */}
        <button
          type="button"
          className="flex-shrink-0 p-1.5 rounded-full transition-colors hover:bg-gray-200 disabled:opacity-50"
          disabled={disabled}
          title="Эмодзи"
        >
          <Smile size={20} className="text-gray-400" />
        </button>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="flex-shrink-0 p-2 rounded-full transition-all duration-200"
          style={{
            backgroundColor: canSend ? '#0A6045' : 'rgba(10, 96, 69, 0.3)',
            transform: canSend ? 'scale(1)' : 'scale(0.95)'
          }}
          title="Отправить"
        >
          <Send size={18} className="text-white" />
        </button>
      </div>

      {/* Character limit hint */}
      {content.length > 4500 && (
        <p className="text-xs text-right mt-1" style={{ color: content.length > 5000 ? '#EF4444' : '#F59E0B' }}>
          {content.length}/5000
        </p>
      )}
    </div>
  );
}
