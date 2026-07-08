'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, MoreVertical, Phone, X, CheckCircle, AlertCircle } from 'lucide-react';
import ConversationList, { ConversationPreview } from './ConversationList';
import ChatThread from './ChatThread';
import ChatComposer from './ChatComposer';
import { ChatMessage } from './ChatBubble';
import { socketClient, ChatMessage as SocketMessage, ConversationClosedEvent } from '@/lib/socketClient';

interface ChatPanelProps {
  mode?: 'property' | 'support' | 'all';
  initialConversationId?: string | null;
  onClose?: () => void;
  showHeader?: boolean;
  className?: string;
}

export default function ChatPanel({
  mode = 'all',
  initialConversationId = null,
  onClose,
  showHeader = true,
  className = ''
}: ChatPanelProps) {
  // State
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationPreview | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialConvSelectedRef = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Socket.io event subscriptions
  useEffect(() => {
    const unsubMessage = socketClient.onMessage((msg: SocketMessage) => {
      // Add message if it's for current conversation
      if (selectedConversation?.id === msg.conversationId) {
        setMessages(prev => {
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

        // Mark as read since we're viewing
        socketClient.sendRead(msg.conversationId);
      } else {
        // Update unread count for other conversations
        setConversations(prev =>
          prev.map(c =>
            c.id === msg.conversationId
              ? { ...c, unreadCount: c.unreadCount + 1, lastMessage: {
                  id: msg.id,
                  content: msg.content,
                  sender_id: msg.senderId,
                  read: msg.read,
                  created_at: msg.createdAt
                }}
              : c
          )
        );
      }
    });

    const unsubTyping = socketClient.onTyping((event) => {
      if (selectedConversation?.id === event.conversationId && event.userId !== currentUserId) {
        setTypingUserId(event.userId);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUserId(null);
        }, 2000);
      }
    });

    const unsubReadReceipt = socketClient.onReadReceipt((event) => {
      if (selectedConversation?.id === event.conversationId && event.userId !== currentUserId) {
        setMessages(prev =>
          prev.map(m =>
            m.senderId === currentUserId ? { ...m, read: true } : m
          )
        );
      }
    });

    const unsubConnection = socketClient.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        setError(prev => prev === 'Connection lost. Please refresh the page.' ? null : prev);
      }
    });

    const unsubError = socketClient.onError((err) => {
      console.error('[ChatPanel] Socket error:', err);
      setError(err);
    });

    const unsubConversationClosed = socketClient.onConversationClosed((event: ConversationClosedEvent) => {
      if (selectedConversation?.id === event.conversationId) {
        // Update selected conversation status
        setSelectedConversation(prev => prev ? { ...prev, status: 'resolved' } : null);
        // Add system message to chat
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
      // Update conversation in list
      setConversations(prev =>
        prev.map(c =>
          c.id === event.conversationId ? { ...c, status: 'resolved' } : c
        )
      );
      // Refresh conversations list
      fetchConversations();
    });

    // Set initial connection state
    setIsConnected(socketClient.connected);

    return () => {
      unsubMessage();
      unsubConversationClosed();
      unsubTyping();
      unsubReadReceipt();
      unsubConnection();
      unsubError();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [selectedConversation?.id, currentUserId]);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.user?.id) {
            setCurrentUserId(data.user.id);
          }
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    fetchUser();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingList(true);
      const typeParam = mode !== 'all' ? `?type=${mode}` : '';
      const res = await fetch(`/api/chats${typeParam}`, {
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to fetch conversations');

      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Не удалось загрузить диалоги');
    } finally {
      setIsLoadingList(false);
    }
  }, [mode]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      const res = await fetch(`/api/chats/${conversationId}`, {
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to fetch messages');

      const data = await res.json();
      setMessages(data.messages || []);

      // Mark as read
      await fetch(`/api/chats/${conversationId}/read`, {
        method: 'PATCH',
        credentials: 'include'
      });

      // Update unread count in list
      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Не удалось загрузить сообщения');
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle initial conversation (with guard to prevent infinite loop)
  useEffect(() => {
    if (initialConversationId && conversations.length > 0 && !initialConvSelectedRef.current) {
      const conv = conversations.find(c => c.id === initialConversationId);
      if (conv) {
        initialConvSelectedRef.current = true;
        handleSelectConversation(conv);
      }
    }
  }, [initialConversationId, conversations]);

  // Select conversation
  const handleSelectConversation = useCallback((conv: ConversationPreview) => {
    // Leave previous room if any
    if (selectedConversation) {
      socketClient.leave(selectedConversation.id);
    }

    setSelectedConversation(conv);
    setMessages([]);
    setTypingUserId(null);

    // Fetch messages
    fetchMessages(conv.id);

    // Join Socket.io room
    if (isConnected) {
      socketClient.joinWhenReady(conv.id);
    }
  }, [fetchMessages, isConnected, selectedConversation]);

  // Send message (Socket.io with REST fallback)
  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedConversation || !content.trim()) return;

    // Try Socket.io first
    if (isConnected) {
      socketClient.sendMessage(selectedConversation.id, content);
    } else {
      // REST fallback with auto token refresh
      const sendWithRetry = async (retry = false): Promise<void> => {
        const res = await fetch(`/api/chats/${selectedConversation.id}/messages`, {
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
        console.error('[ChatPanel] REST send failed:', err);
        setError('Не удалось отправить сообщение');
      }
    }
  }, [selectedConversation, isConnected]);

  // Send typing indicator
  const handleTyping = useCallback(() => {
    if (!selectedConversation || !isConnected) return;
    socketClient.sendTyping(selectedConversation.id);
  }, [selectedConversation, isConnected]);

  // Back to list (mobile)
  const handleBack = () => {
    if (selectedConversation) {
      socketClient.leave(selectedConversation.id);
    }
    setSelectedConversation(null);
    setMessages([]);
  };

  // Get other party info
  const getOtherParty = () => {
    if (!selectedConversation) return null;
    return selectedConversation.isClient
      ? selectedConversation.consultant
      : selectedConversation.client;
  };

  const otherParty = getOtherParty();
  const otherPartyName = otherParty
    ? `${otherParty.first_name} ${otherParty.last_name}`.trim()
    : selectedConversation?.type === 'support' ? 'Поддержка HomLy' : 'Собеседник';

  return (
    <div
      className={`flex h-full rounded-2xl overflow-hidden ${className}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
      }}
    >
      {/* Conversation List (left panel) */}
      <div
        className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r flex flex-col ${
          selectedConversation ? 'hidden md:flex' : 'flex'
        }`}
        style={{ borderColor: 'rgba(0, 0, 0, 0.06)' }}
      >
        {/* List header */}
        {showHeader && (
          <div
            className="px-4 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'rgba(0, 0, 0, 0.06)' }}
          >
            <h2 className="font-semibold text-lg" style={{ color: '#1A1A1A' }}>
              {mode === 'property' ? 'Сообщения' : mode === 'support' ? 'Поддержка' : 'Чаты'}
            </h2>
            {/* Connection status */}
            <div className="flex items-center gap-1">
              {isConnected ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <AlertCircle size={16} className="text-amber-500" />
              )}
            </div>
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-hidden">
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation?.id}
            currentUserId={currentUserId || ''}
            onSelect={handleSelectConversation}
            isLoading={isLoadingList}
            emptyMessage={
              mode === 'property'
                ? 'Нет сообщений по объектам'
                : mode === 'support'
                ? 'Нет обращений в поддержку'
                : 'Нет диалогов'
            }
          />
        </div>
      </div>

      {/* Chat area (right panel) */}
      <div
        className={`flex-1 flex flex-col ${
          selectedConversation ? 'flex' : 'hidden md:flex'
        }`}
      >
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div
              className="px-4 py-3 border-b flex items-center gap-3"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: 'rgba(0, 0, 0, 0.06)'
              }}
            >
              {/* Back button (mobile) */}
              <button
                onClick={handleBack}
                className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft size={20} style={{ color: '#1A1A1A' }} />
              </button>

              {/* Avatar */}
              {otherParty?.avatar_url ? (
                <img
                  src={otherParty.avatar_url}
                  alt={otherPartyName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: '#0A6045' }}
                >
                  {otherPartyName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate" style={{ color: '#1A1A1A' }}>
                  {otherPartyName}
                </h3>
                {selectedConversation.property && (
                  <p className="text-xs text-gray-500 truncate">
                    {selectedConversation.property.title}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {otherParty && 'phone' in otherParty && otherParty.phone && (
                  <a
                    href={`tel:${otherParty.phone}`}
                    className="p-2 rounded-full hover:bg-gray-100"
                    title="Позвонить"
                  >
                    <Phone size={18} style={{ color: '#757575' }} />
                  </a>
                )}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 rounded-full hover:bg-gray-100"
                    title="Ещё"
                  >
                    <MoreVertical size={18} style={{ color: '#757575' }} />
                  </button>
                  {showMenu && (
                    <div
                      className="absolute right-0 top-full mt-1 py-1 bg-white rounded-lg shadow-lg border z-50"
                      style={{ minWidth: '180px', borderColor: 'rgba(0,0,0,0.1)' }}
                    >
                      {currentUserId === selectedConversation.consultant?.id && selectedConversation.status !== 'resolved' && selectedConversation.status !== 'closed' && (
                        <button
                          onClick={() => {
                            socketClient.closeConversation(selectedConversation.id);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600"
                        >
                          Завершить диалог
                        </button>
                      )}
                      {(currentUserId !== selectedConversation.consultant?.id || selectedConversation.status === 'resolved' || selectedConversation.status === 'closed') && (
                        <div className="px-4 py-2 text-sm text-gray-400">
                          Нет доступных действий
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100"
                    title="Закрыть"
                  >
                    <X size={18} style={{ color: '#757575' }} />
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <ChatThread
              messages={messages}
              currentUserId={currentUserId || ''}
              isLoading={isLoadingMessages}
              typingUserId={typingUserId}
              typingUserName={otherPartyName}
            />

            {/* Composer */}
            <ChatComposer
              onSend={handleSendMessage}
              onTyping={handleTyping}
              disabled={selectedConversation.status === 'closed'}
              placeholder={
                selectedConversation.status === 'closed'
                  ? 'Диалог закрыт'
                  : 'Введите сообщение...'
              }
            />
          </>
        ) : (
          /* Empty state when no conversation selected */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: 'rgba(10, 96, 69, 0.1)' }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0A6045" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="font-medium text-lg mb-2" style={{ color: '#1A1A1A' }}>
              Выберите диалог
            </h3>
            <p className="text-sm text-gray-500">
              Выберите диалог из списка слева, чтобы начать общение
            </p>
          </div>
        )}
      </div>

      {/* Error toast */}
      {error && (
        <div
          className="fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2"
          style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5'
          }}
        >
          <AlertCircle size={18} className="text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
