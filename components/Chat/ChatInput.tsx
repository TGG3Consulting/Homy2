import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { t, Language } from '@/lib/i18n';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  compact?: boolean;
  lang?: Language;
}

export default function ChatInput({ onSendMessage, disabled = false, compact = false, lang = 'ru' }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmedInput = input.trim();
    if (trimmedInput && !disabled) {
      onSendMessage(trimmedInput);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`border-t border-gray-200 bg-white ${compact ? 'p-2' : 'p-4'}`}>
      <div className={`flex items-end space-x-2 ${compact ? '' : 'max-w-4xl mx-auto'}`}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('placeholder', lang)}
          disabled={disabled}
          rows={1}
          className={`flex-1 resize-none rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed overflow-y-auto ${
            compact ? 'px-3 py-2 text-sm max-h-20' : 'px-4 py-3 max-h-32'
          }`}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          className={`bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 flex-shrink-0 ${
            compact ? 'px-3 py-2 text-sm' : 'px-6 py-3'
          }`}
        >
          {compact ? 'OK' : t('send', lang)}
        </button>
      </div>
      {!compact && (
        <p className="text-xs text-gray-500 text-center mt-2">
          {t('sendHint', lang)}
        </p>
      )}
    </div>
  );
}
