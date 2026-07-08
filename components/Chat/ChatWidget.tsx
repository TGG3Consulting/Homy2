'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import Image from 'next/image';
import { MessageSquare, X, Minus } from 'lucide-react';
import ChatThread from './ChatThread';
import ChatComposer from './ChatComposer';
import { ChatMessage } from './ChatBubble';
import { useT } from '@/lib/i18n';
import { useChatWidget } from '@/contexts/ChatWidgetContext';
import { socketClient, ChatMessage as SocketMessage, ConversationClosedEvent } from '@/lib/socketClient';

// ============================================
// Types
// ============================================

interface Consultant {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  is_online?: boolean;
}

interface Conversation {
  id: string;
  type: 'property' | 'support';
  status: 'open' | 'assigned' | 'resolved' | 'closed';
  subject: string;
  consultant: Consultant | null;
  property?: {
    id: string;
    title: string;
    imageUrl: string | null;
  } | null;
}

// ============================================
// LocalStorage helpers
// ============================================

const STORAGE_KEY = 'homy_chat_conversation_id';

function getStoredConversationId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredConversationId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage not available
  }
}

// ============================================
// ChatWidget Component
// ============================================

export default function ChatWidget() {
  const { t } = useT();
  const { isOpen, chatType, propertyId, closeChat, setConversationId: setContextConversationId } = useChatWidget();

  // State
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConversationClosed, setIsConversationClosed] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Socket.io event subscriptions
  useEffect(() => {
    const unsubMessage = socketClient.onMessage((msg: SocketMessage) => {
      if (msg.conversationId === conversationId) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, {
            id: msg.id,
            senderId: msg.senderId,
            senderName: msg.senderName,
            senderAvatar: msg.senderAvatar,
            content: msg.content,
            read: msg.read,
            createdAt: msg.createdAt
          }];
        });

        // Update unread count if widget is closed or minimized
        if ((!isOpen || isMinimized) && msg.senderId !== currentUserId) {
          setUnreadCount(prev => prev + 1);
        }
      }
    });

    const unsubTyping = socketClient.onTyping((event) => {
      if (event.conversationId === conversationId && event.userId !== currentUserId) {
        setTypingUserId(event.userId);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUserId(null);
        }, 3000);
      }
    });

    const unsubReadReceipt = socketClient.onReadReceipt((event) => {
      if (event.conversationId === conversationId && event.userId !== currentUserId) {
        setMessages(prev =>
          prev.map(m =>
            m.senderId === currentUserId && !m.read
              ? { ...m, read: true }
              : m
          )
        );
      }
    });

    const unsubConnection = socketClient.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        setError(null);
      }
    });

    const unsubError = socketClient.onError((err) => {
      console.error('[ChatWidget] Socket error:', err);
      setError(err);
    });

    const unsubConversationClosed = socketClient.onConversationClosed((event: ConversationClosedEvent) => {
      if (event.conversationId === conversationId) {
        setIsConversationClosed(true);
        // Add system message
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          senderId: 'system',
          senderName: 'Система',
          senderAvatar: null,
          content: event.message,
          read: true,
          createdAt: new Date().toISOString()
        }]);
      }
    });

    // Set initial connection state
    setIsConnected(socketClient.connected);

    return () => {
      unsubMessage();
      unsubTyping();
      unsubReadReceipt();
      unsubConnection();
      unsubError();
      unsubConversationClosed();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, isOpen, isMinimized, currentUserId]);

  // Reset to fresh state (ready for new conversation)
  const resetToFreshState = useCallback(() => {
    setStoredConversationId(null);
    setConversationId(null);
    setConversation(null);
    setMessages([]);
    setIsConversationClosed(false);
    setError(null);
  }, []);

  // Load existing conversation
  const loadConversation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/chats/${id}`, { credentials: 'include' });

      // Handle 404 and 403 silently - conversation doesn't exist or user has no access
      if (response.status === 404 || response.status === 403) {
        console.log(`[ChatWidget] Conversation ${id} not accessible (${response.status}), resetting`);
        resetToFreshState();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }

      const data = await response.json();
      if (data.success) {
        // Check if conversation is already resolved/closed
        if (data.conversation.status === 'resolved' || data.conversation.status === 'closed') {
          console.log(`[ChatWidget] Conversation ${id} is ${data.conversation.status}, resetting`);
          resetToFreshState();
          return;
        }

        setConversation(data.conversation);
        setMessages(data.messages || []);

        // Join Socket.io room
        socketClient.joinWhenReady(id);
      }
    } catch (err) {
      console.error('[ChatWidget] Load conversation error:', err);
      // On any error, silently reset to fresh state instead of showing error
      resetToFreshState();
    } finally {
      setIsLoading(false);
    }
  }, [resetToFreshState]);

  // Create new conversation
  const createConversation = useCallback(async (
    type: 'support' | 'property',
    propId?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      // Check auth first
      const authRes = await fetch('/api/users/me', { credentials: 'include' });
      if (!authRes.ok) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        closeChat();
        return;
      }

      const userData = await authRes.json();
      if (userData.user?.id) {
        setCurrentUserId(userData.user.id);
      }

      const body: Record<string, string> = { type };
      if (type === 'property' && propId) {
        body.property_id = propId;
      }

      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create conversation');
      }

      const data = await response.json();
      if (data.success && data.conversation) {
        const newConversation = data.conversation;
        setConversationId(newConversation.id);
        setConversation(newConversation);
        setStoredConversationId(newConversation.id);
        setContextConversationId(newConversation.id);

        // Join Socket.io room
        socketClient.joinWhenReady(newConversation.id);

        // If it was an existing conversation, load messages
        if (data.existing) {
          await loadConversation(newConversation.id);
        }
      }
    } catch (err) {
      console.error('[ChatWidget] Create conversation error:', err);
      setError(
        err instanceof Error
          ? err.message
          : (t('chat.errorCreatingConversation') || 'Failed to create conversation')
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadConversation, t, closeChat, setContextConversationId]);

  // Handle widget open from context
  useEffect(() => {
    if (!isOpen) {
      setIsMinimized(false);
      return;
    }

    setUnreadCount(0);

    if (chatType === 'property' && propertyId) {
      createConversation('property', propertyId);
    } else if (chatType === 'support') {
      const storedId = getStoredConversationId();
      if (storedId) {
        setConversationId(storedId);
        loadConversation(storedId);
      } else {
        createConversation('support');
      }
    }
  }, [isOpen, chatType, propertyId, createConversation, loadConversation]);

  // Mark messages as read when widget opens
  useEffect(() => {
    if (isOpen && !isMinimized && conversationId) {
      socketClient.sendRead(conversationId);
    }
  }, [isOpen, isMinimized, conversationId]);

  // Handle send message (Socket.io with REST fallback)
  const handleSend = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // If no conversation exists, create one first
    let targetConversationId = conversationId;
    if (!targetConversationId) {
      setIsLoading(true);
      try {
        // Check auth first
        const authRes = await fetch('/api/users/me', { credentials: 'include' });
        if (!authRes.ok) {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
          closeChat();
          return;
        }

        const userData = await authRes.json();
        if (userData.user?.id) {
          setCurrentUserId(userData.user.id);
        }

        // Create new support conversation
        const response = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ type: 'support' })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to create conversation');
        }

        const data = await response.json();
        if (data.success && data.conversation) {
          const newConvId: string = data.conversation.id;
          targetConversationId = newConvId;
          setConversationId(newConvId);
          setConversation(data.conversation);
          setStoredConversationId(newConvId);
          setContextConversationId(newConvId);
          socketClient.joinWhenReady(newConvId);
        } else {
          throw new Error('Failed to create conversation');
        }
      } catch (err) {
        console.error('[ChatWidget] Create conversation error:', err);
        setError(t('chat.errorCreatingConversation') || 'Failed to create conversation');
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }

    // Safety check - should never happen but TypeScript needs it
    if (!targetConversationId) {
      console.error('[ChatWidget] No conversation ID after creation');
      return;
    }

    // Now send the message
    // Try Socket.io first
    if (isConnected) {
      socketClient.sendMessage(targetConversationId, content);
    } else {
      // REST fallback with auto token refresh
      const sendWithRetry = async (retry = false): Promise<void> => {
        const res = await fetch(`/api/chats/${targetConversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content: content.trim() })
        });

        if (res.status === 401 && !retry) {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include'
          });
          if (refreshRes.ok) {
            return sendWithRetry(true);
          }
          throw new Error('Session expired');
        }

        if (!res.ok) throw new Error('Failed to send message');

        const data = await res.json();
        if (data.success && data.message) {
          setMessages(prev => [...prev, {
            id: data.message.id,
            senderId: data.message.sender_id,
            senderName: '',
            senderAvatar: null,
            content: data.message.content,
            read: false,
            createdAt: data.message.created_at || new Date().toISOString()
          }]);
        }
      };

      try {
        await sendWithRetry();
      } catch (err) {
        console.error('[ChatWidget] REST send failed:', err);
        setError(t('chat.sendFailed') || 'Failed to send message');
      }
    }
  }, [conversationId, isConnected, t, closeChat, setContextConversationId]);

  // Handle typing
  const handleTyping = useCallback(() => {
    if (!conversationId) return;
    socketClient.sendTyping(conversationId);
  }, [conversationId]);

  // Handle close
  const handleClose = useCallback(() => {
    if (conversationId) {
      socketClient.leave(conversationId);
      // If conversation is still active, client leaves it
      if (!isConversationClosed) {
        socketClient.clientLeave(conversationId);
      }
    }
    // If conversation was closed, clear stored ID so next open creates new conversation
    if (isConversationClosed) {
      setStoredConversationId(null);
      setConversationId(null);
      setConversation(null);
      setMessages([]);
      setIsConversationClosed(false);
    }
    closeChat();
  }, [conversationId, closeChat, isConversationClosed]);

  // Handle minimize
  const handleMinimize = () => {
    setIsMinimized(true);
  };

  // Handle restore
  const handleRestore = () => {
    setIsMinimized(false);
    setUnreadCount(0);
  };

  // Get consultant display name
  const consultantName = conversation?.consultant
    ? `${conversation.consultant.first_name} ${conversation.consultant.last_name}`.trim()
    : null;

  const isConsultantOnline = conversation?.consultant?.is_online ?? false;

  // Don't render anything if not open
  if (!isOpen) {
    return null;
  }

  // Show minimized state
  if (isMinimized) {
    return (
      <button
        onClick={handleRestore}
        className="fixed z-50 flex items-center gap-3 px-4 py-3 transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          bottom: '72px',
          right: '16px',
          backgroundColor: '#0A6045',
          borderRadius: '28px',
          boxShadow: '0 4px 20px rgba(10, 96, 69, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <MessageSquare size={20} className="text-white" />
        <span className="text-white text-sm font-medium">
          {t('chat.homySupportShort') || 'Homy Support'}
        </span>
        {unreadCount > 0 && (
          <span
            className="flex items-center justify-center text-xs font-bold text-white"
            style={{
              minWidth: '20px',
              height: '20px',
              backgroundColor: '#EF4444',
              borderRadius: '9999px',
              padding: '0 6px'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  // Full chat window - full-screen on mobile, positioned modal on desktop
  return (
    <div
      className="fixed z-50 flex flex-col overflow-hidden inset-0 md:inset-auto md:bottom-5 md:right-5 md:w-[380px] md:h-[520px] md:rounded-2xl"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(10, 96, 69, 0.1)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          backgroundColor: 'rgba(10, 96, 69, 0.1)',
          borderBottom: '1px solid rgba(10, 96, 69, 0.1)'
        }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar or icon */}
          <div
            className="flex items-center justify-center"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#0A6045',
              borderRadius: '12px'
            }}
          >
            {conversation?.consultant?.avatar_url ? (
              <img
                src={conversation.consultant.avatar_url}
                alt={consultantName || 'Consultant'}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Image
                src="/logo/homy_mono_white.svg"
                alt="Homy"
                width={24}
                height={24}
                className="select-none"
              />
            )}
          </div>

          {/* Title and status */}
          <div>
            <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
              {t('chat.homySupport') || 'Homy Support'}
            </h3>
            <div className="flex items-center gap-1.5">
              {consultantName && (
                <span className="text-xs" style={{ color: '#6B7280' }}>
                  {consultantName}
                </span>
              )}
              {isConnected && (
                <span
                  className="flex items-center gap-1 text-xs"
                  style={{ color: isConsultantOnline ? '#10B981' : '#6B7280' }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: isConsultantOnline ? '#10B981' : '#9CA3AF'
                    }}
                  />
                  {isConsultantOnline
                    ? (t('chat.online') || 'Online')
                    : (t('chat.offline') || 'Offline')}
                </span>
              )}
              {!isConnected && (
                <span className="text-xs" style={{ color: '#F59E0B' }}>
                  {t('chat.connecting') || 'Connecting...'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100"
            aria-label={t('chat.minimize') || 'Minimize'}
          >
            <Minus size={18} className="text-gray-500" />
          </button>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100"
            aria-label={t('chat.close') || 'Close'}
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Property info banner (for property chats) */}
      {conversation?.type === 'property' && conversation.property && (
        <div
          className="flex items-center gap-3 px-4 py-2"
          style={{
            backgroundColor: 'rgba(10, 96, 69, 0.05)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
          }}
        >
          {conversation.property.imageUrl && (
            <img
              src={conversation.property.imageUrl}
              alt={conversation.property.title || 'Property'}
              className="w-10 h-10 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: '#1A1A1A' }}>
              {conversation.property.title}
            </p>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              {t('chat.propertyInquiry') || 'Property inquiry'}
            </p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          className="px-4 py-2 text-sm text-center"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#DC2626'
          }}
        >
          {error}
        </div>
      )}

      {/* Chat body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isLoading && messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#0A6045', borderTopColor: 'transparent' }}
              />
              <p className="text-sm text-gray-500">
                {t('chat.loading') || 'Loading...'}
              </p>
            </div>
          </div>
        ) : (
          <ChatThread
            messages={messages}
            currentUserId={currentUserId || ''}
            isLoading={isLoading}
            typingUserId={typingUserId}
            typingUserName={consultantName || undefined}
          />
        )}
      </div>

      {/* Footer / Composer */}
      <ChatComposer
        onSend={handleSend}
        onTyping={handleTyping}
        disabled={isLoading || isConversationClosed}
        placeholder={isConversationClosed ? (t('chat.conversationClosed') || 'Диалог завершён') : (t('chat.typeMessage') || 'Type a message...')}
      />
    </div>
  );
}
