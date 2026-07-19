'use client';

import React from 'react';
import Image from 'next/image';
import { MessageSquare, Home, Headphones, Clock, CheckCircle } from 'lucide-react';

export interface ConversationPreview {
  id: string;
  type: 'property' | 'support';
  status: string;
  subject: string | null;
  created_at: string;
  updated_at: string;
  property?: {
    id: string;
    title: string;
    imageUrl: string | null;
  } | null;
  client: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    phone?: string | null;
  };
  consultant?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    phone?: string | null;
  } | null;
  lastMessage?: {
    id: string;
    content: string;
    sender_id: string;
    read: boolean;
    created_at: string;
  } | null;
  unreadCount: number;
  isClient: boolean;
}

interface ConversationListProps {
  conversations: ConversationPreview[];
  selectedId?: string | null;
  currentUserId: string;
  onSelect: (conversation: ConversationPreview) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Вчера';
  } else if (days < 7) {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }
}

function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export default function ConversationList({
  conversations,
  selectedId,
  currentUserId,
  onSelect,
  isLoading = false,
  emptyMessage = 'Нет диалогов'
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse flex gap-3 p-3">
            <div className="w-12 h-12 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'rgba(10, 96, 69, 0.1)' }}
        >
          <MessageSquare size={28} className="text-emerald-500" />
        </div>
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  // Sort conversations: active first, resolved last
  const sortedConversations = [...conversations].sort((a, b) => {
    const aResolved = a.status === 'resolved' || a.status === 'closed';
    const bResolved = b.status === 'resolved' || b.status === 'closed';
    if (aResolved && !bResolved) return 1;
    if (!aResolved && bResolved) return -1;
    // Within same status, sort by updated_at
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <div className="flex flex-col overflow-y-auto">
      {sortedConversations.map(conv => {
        const isSelected = conv.id === selectedId;
        const isResolved = conv.status === 'resolved' || conv.status === 'closed';
        const otherParty = conv.isClient ? conv.consultant : conv.client;
        const avatar = otherParty?.avatar_url;
        const name = otherParty
          ? `${otherParty.first_name} ${otherParty.last_name}`.trim()
          : conv.type === 'support' ? 'Поддержка' : 'Владелец';

        const lastMessagePreview = conv.lastMessage
          ? conv.lastMessage.sender_id === currentUserId
            ? `Вы: ${truncate(conv.lastMessage.content, 40)}`
            : truncate(conv.lastMessage.content, 50)
          : 'Нет сообщений';

        const time = conv.lastMessage
          ? formatTime(conv.lastMessage.created_at)
          : formatTime(conv.created_at);

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`flex items-start gap-3 p-4 text-left transition-colors border-b ${
              isSelected ? 'bg-emerald-50' : isResolved ? 'bg-gray-50' : 'hover:bg-gray-50'
            }`}
            style={{
              borderColor: 'rgba(0, 0, 0, 0.06)',
              opacity: isResolved ? 0.7 : 1
            }}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                  style={{
                    backgroundColor: conv.type === 'support' ? '#0A6045' : '#6B7280'
                  }}
                >
                  {conv.type === 'support' ? (
                    <Headphones size={20} />
                  ) : name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Type indicator */}
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
                style={{
                  backgroundColor: conv.type === 'property' ? '#10B981' : '#0A6045'
                }}
              >
                {conv.type === 'property' ? (
                  <Home size={10} className="text-white" />
                ) : (
                  <Headphones size={10} className="text-white" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm truncate" style={{ color: '#1A1A1A' }}>
                  {name}
                </h4>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                  {time}
                </span>
              </div>

              {/* Subject or property */}
              {conv.property && (
                <p className="text-xs text-emerald-600 truncate mb-0.5">
                  {truncate(conv.property.title, 35)}
                </p>
              )}

              {/* Last message */}
              <div className="flex items-center justify-between">
                <p
                  className={`text-sm truncate ${
                    conv.unreadCount > 0 ? 'font-medium' : ''
                  }`}
                  style={{ color: conv.unreadCount > 0 ? '#1A1A1A' : '#757575' }}
                >
                  {lastMessagePreview}
                </p>

                {/* Unread badge */}
                {conv.unreadCount > 0 && (
                  <span
                    className="flex-shrink-0 ml-2 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: '#0A6045' }}
                  >
                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                  </span>
                )}
              </div>

              {/* Status indicator */}
              {isResolved ? (
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-400">Завершён</span>
                </div>
              ) : conv.type === 'support' && conv.status === 'open' && !conv.consultant ? (
                <div className="flex items-center gap-1 mt-1">
                  <Clock size={12} className="text-amber-500" />
                  <span className="text-xs text-amber-500">Ожидает ответа</span>
                </div>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
