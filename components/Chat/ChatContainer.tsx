'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, PropertyShowcase } from '@/lib/types';
import { ChatServiceWs } from '@/lib/chatServiceWs';
import { parsePropertiesFromResponse, hasProperties, removePropertiesBlock } from '@/lib/parseProperties';
import { detectLanguage, t, Language } from '@/lib/i18n';
import ChatMessageComponent from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';

interface ChatContainerProps {
  /** Callback when properties are found in Homy response */
  onPropertiesFound?: (properties: PropertyShowcase[]) => void;
  /** Callback when language changes */
  onLanguageChange?: (lang: Language) => void;
  /** Compact mode for sidebar layout */
  compact?: boolean;
}

export default function ChatContainer({ onPropertiesFound, onLanguageChange, compact = false }: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lang, setLang] = useState<Language>('ru');
  const chatServiceRef = useRef<ChatServiceWs | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const assistantMessageIdRef = useRef<string | null>(null);
  const assistantContentRef = useRef<string>('');
  const lastUserMessageRef = useRef<string>('');
  const onPropertiesFoundRef = useRef(onPropertiesFound);
  const onLanguageChangeRef = useRef(onLanguageChange);

  // Keep refs updated
  useEffect(() => {
    onPropertiesFoundRef.current = onPropertiesFound;
  }, [onPropertiesFound]);

  useEffect(() => {
    onLanguageChangeRef.current = onLanguageChange;
  }, [onLanguageChange]);

  const parseResponse = (text: string) => {
    // Удаляем JSON-блок с объектами из отображаемого текста
    const cleanContent = removePropertiesBlock(text);
    return { content: cleanContent };
  };

  useEffect(() => {
    // Update welcome message when language changes, preserve other messages
    setMessages((prev) => {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: t('welcome', lang),
        timestamp: Date.now(),
      };
      const otherMessages = prev.filter(m => m.id !== 'welcome');
      return [welcomeMessage, ...otherMessages];
    });
    // Notify parent about language change
    onLanguageChangeRef.current?.(lang);
  }, [lang]);

  useEffect(() => {
    const chatService = new ChatServiceWs();
    chatServiceRef.current = chatService;

    chatService.setCallbacks({
      onReady: () => {
        setConnectionState('connected');
      },
      onPropertiesUpdate: (data) => {
        // Handle properties_update event from server
        // show_properties tool already returns full property objects - no fetch needed
        console.log('[ChatContainer] Received properties_update:', data.properties.length, 'properties');

        // Save search context for Compare page
        if (typeof window !== 'undefined' && lastUserMessageRef.current) {
          sessionStorage.setItem('homly_search_context', lastUserMessageRef.current);
          console.log('[ChatContainer] Saved search context:', lastUserMessageRef.current);
        }

        if (onPropertiesFoundRef.current && data.properties.length > 0) {
          // Map to PropertyShowcase format directly from tool result
          const showcaseProperties = data.properties.map((p: any) => ({
            id: p.id,
            name: p.title || p.name || p.address,
            title: p.title,
            address: p.address,
            district: p.district || '',
            neighborhood: p.neighborhood || p.district || '',
            latitude: typeof p.latitude === 'number' ? p.latitude : parseFloat(p.latitude) || 0,
            longitude: typeof p.longitude === 'number' ? p.longitude : parseFloat(p.longitude) || 0,
            price: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0,
            currency: p.currency || 'AMD',
            area: p.area || p.size_sqm || 0,
            size_sqm: p.size_sqm || p.area || 0,
            rooms: p.rooms || 0,
            bedrooms: p.bedrooms || p.rooms || 0,
            bathrooms: p.bathrooms,
            floor: p.floor,
            totalFloors: p.totalFloors,
            images: p.images || [],
            image_url: p.image_url || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '/placeholder.jpg'),
            match_score: p.match_score || 85,
            recommendation_reasons: p.recommendation_reasons || [],
            is_top_choice: p.id === data.top_choice,
            hasParking: p.hasParking,
            hasBalcony: p.hasBalcony,
            petsAllowed: p.petsAllowed,
          }));
          onPropertiesFoundRef.current!(showcaseProperties);
        }
      },
      onMessage: (content: string) => {
        // Accumulate streaming content to current assistant message
        assistantContentRef.current += content;
        const parsed = parseResponse(assistantContentRef.current);

        setMessages((prev) => {
          const messageId = assistantMessageIdRef.current;
          if (!messageId) return prev;

          const existingIndex = prev.findIndex((m) => m.id === messageId);
          const newMessage: ChatMessage = {
            id: messageId,
            role: 'assistant',
            content: parsed.content,
            timestamp: Date.now(),
          };

          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = newMessage;
            return updated;
          } else {
            return [...prev, newMessage];
          }
        });
      },
      onComplete: () => {
        // Mark message complete
        const parsed = parseResponse(assistantContentRef.current);
        const messageId = assistantMessageIdRef.current;

        if (messageId) {
          setMessages((prev) => {
            const existingIndex = prev.findIndex((m) => m.id === messageId);
            const finalMessage: ChatMessage = {
              id: messageId,
              role: 'assistant',
              content: parsed.content,
              timestamp: Date.now(),
            };

            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = finalMessage;
              return updated;
            } else {
              return [...prev, finalMessage];
            }
          });

          // Notify parent about properties if callback provided
          if (onPropertiesFoundRef.current && hasProperties(assistantContentRef.current)) {
            const showcaseProperties = parsePropertiesFromResponse(assistantContentRef.current);
            if (showcaseProperties.length > 0) {
              onPropertiesFoundRef.current(showcaseProperties);
            }
          }
        }

        setIsLoading(false);
        assistantMessageIdRef.current = null;
        assistantContentRef.current = '';
      },
      onError: (errorMessage: string) => {
        setError(errorMessage);
        setIsLoading(false);

        const messageId = assistantMessageIdRef.current;
        if (messageId) {
          const errorMessageObj: ChatMessage = {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
            timestamp: Date.now(),
          };

          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== messageId);
            return [...filtered, errorMessageObj];
          });
        }

        assistantMessageIdRef.current = null;
        assistantContentRef.current = '';
      },
      onConnectionChange: (state: 'connecting' | 'connected' | 'disconnected') => {
        if (state === 'disconnected') setConnectionState('disconnected');
        if (state === 'connecting') setConnectionState('connecting');
        if (state === 'connected') setConnectionState('connected');
      },
    });

    chatService.connect().catch((err) => {
      console.error('WebSocket connection error:', err);
      setError('Failed to connect');
      setConnectionState('disconnected');
    });

    return () => {
      chatService.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Save conversation history to sessionStorage for AI opinion
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      sessionStorage.setItem('homly_chat_history', JSON.stringify(history));
      console.log('[ChatContainer] Saved to sessionStorage:', messages.length, 'messages');
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string) => {
    // Check connection state before sending
    if (connectionState !== 'connected') {
      setError('Cannot send message: not connected');
      return;
    }

    // Detect language from user message
    const detectedLang = detectLanguage(content);
    if (detectedLang !== lang) {
      setLang(detectedLang);
    }

    setError(null);

    // Track last user message for search context
    lastUserMessageRef.current = content;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Set up assistant message tracking
    const assistantMessageId = `assistant-${Date.now()}`;
    assistantMessageIdRef.current = assistantMessageId;
    assistantContentRef.current = '';

    // Send message via WebSocket
    if (chatServiceRef.current) {
      chatServiceRef.current.sendMessage(content);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-gradient-to-br from-emerald-50 to-white ${compact ? '' : 'h-screen'}`}>
      {/* Header */}
      <div className={`bg-white border-b border-emerald-200 ${compact ? '' : 'shadow-sm'}`}>
        <div className={compact ? 'px-3 py-2' : 'max-w-4xl mx-auto px-4 py-4'}>
          <div className="flex items-center space-x-2">
            <div className={`bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center ${compact ? 'w-7 h-7' : 'w-10 h-10'}`}>
              <span className={`text-white font-bold ${compact ? 'text-sm' : 'text-xl'}`}>H</span>
            </div>
            <div>
              {compact ? (
                <h2 className="text-base font-semibold text-gray-900">{t('homlyChat', lang)}</h2>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">{t('homly', lang)}</h1>
                  <p className="text-sm text-gray-600">{t('aiAssistant', lang)}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status Indicator */}
      {connectionState === 'connecting' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-yellow-600">{t('connecting', lang)}</p>
          </div>
        </div>
      )}
      {connectionState === 'disconnected' && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-red-600">{t('disconnected', lang)}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className={`flex-1 overflow-y-auto py-6 ${compact ? 'px-2' : 'px-4'}`}
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className={compact ? 'max-w-full' : 'max-w-4xl mx-auto'}>
          {messages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <TypingIndicator />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-red-600">
              <span className="font-semibold">Error:</span> {error}
            </p>
          </div>
        </div>
      )}

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading || connectionState !== 'connected'} compact={compact} lang={lang} />
    </div>
  );
}
