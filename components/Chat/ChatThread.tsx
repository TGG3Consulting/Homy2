'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import ChatBubble, { ChatMessage } from './ChatBubble';
import { Loader2 } from 'lucide-react';

interface ChatThreadProps {
  messages: ChatMessage[];
  currentUserId: string;
  isLoading?: boolean;
  typingUserId?: string | null;
  typingUserName?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

interface DateGroup {
  date: string;
  label: string;
  messages: ChatMessage[];
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Сегодня';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Вчера';
  } else {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
}

export default function ChatThread({
  messages,
  currentUserId,
  isLoading = false,
  typingUserId,
  typingUserName,
  onLoadMore,
  hasMore = false
}: ChatThreadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageCount = useRef(messages.length);

  // Group messages by date
  const dateGroups = useMemo(() => {
    const groups: DateGroup[] = [];
    let currentDate = '';

    messages.forEach(message => {
      const messageDate = new Date(message.createdAt).toDateString();

      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({
          date: messageDate,
          label: formatDateLabel(message.createdAt),
          messages: [message]
        });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    lastMessageCount.current = messages.length;
  }, [messages.length]);

  // Initial scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, []);

  // Handle scroll for load more
  const handleScroll = () => {
    if (!containerRef.current || !onLoadMore || !hasMore || isLoading) return;

    const { scrollTop } = containerRef.current;
    if (scrollTop < 100) {
      onLoadMore();
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-4"
      onScroll={handleScroll}
      style={{
        backgroundColor: 'rgba(248, 248, 248, 0.5)'
      }}
    >
      {/* Loading indicator at top */}
      {isLoading && hasMore && (
        <div className="flex justify-center py-4">
          <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty state */}
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(10, 96, 69, 0.1)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A6045" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">
            Начните диалог
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Отправьте первое сообщение
          </p>
        </div>
      )}

      {/* Messages grouped by date */}
      {dateGroups.map((group) => (
        <div key={group.date}>
          {/* Date separator */}
          <div className="flex items-center justify-center my-4">
            <div
              className="px-3 py-1 rounded-full text-xs"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                color: '#757575'
              }}
            >
              {group.label}
            </div>
          </div>

          {/* Messages for this date */}
          {group.messages.map((message, index) => {
            const isOwn = message.senderId === currentUserId;
            const prevMessage = group.messages[index - 1];
            const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;

            return (
              <ChatBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                showName={showAvatar && !isOwn}
              />
            );
          })}
        </div>
      ))}

      {/* Typing indicator */}
      {typingUserId && typingUserId !== currentUserId && (
        <div className="flex items-center gap-2 ml-10 mb-3">
          <div
            className="px-4 py-2 rounded-2xl rounded-bl-md"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(0, 0, 0, 0.06)'
            }}
          >
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
          <span className="text-xs text-gray-400">
            {typingUserName || 'Печатает'}...
          </span>
        </div>
      )}

      {/* Bottom anchor for auto-scroll */}
      <div ref={bottomRef} />
    </div>
  );
}
