'use client';

import React from 'react';
import Image from 'next/image';
import { Check, CheckCheck } from 'lucide-react';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  read: boolean;
  createdAt: string;
}

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  showName?: boolean;
}

export default function ChatBubble({
  message,
  isOwn,
  showAvatar = true,
  showName = false
}: ChatBubbleProps) {
  // Safe date formatting with fallback
  const formatTime = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };
  const time = formatTime(message.createdAt);

  return (
    <div className={`flex gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0">
          {message.senderAvatar ? (
            <Image
              src={message.senderAvatar}
              alt={message.senderName}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: isOwn ? '#0A6045' : '#6B7280' }}
            >
              {message.senderName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Message bubble */}
      <div className={`max-w-[70%] ${!showAvatar ? (isOwn ? 'mr-10' : 'ml-10') : ''}`}>
        {/* Sender name */}
        {showName && !isOwn && (
          <p className="text-xs text-gray-500 mb-1 ml-1">
            {message.senderName}
          </p>
        )}

        {/* Bubble */}
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isOwn
              ? 'rounded-br-md'
              : 'rounded-bl-md'
          }`}
          style={{
            backgroundColor: isOwn
              ? 'rgba(10, 96, 69, 0.15)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: isOwn
              ? '1px solid rgba(10, 96, 69, 0.2)'
              : '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <p
            className="text-sm whitespace-pre-wrap break-words"
            style={{ color: '#1A1A1A' }}
          >
            {message.content}
          </p>
        </div>

        {/* Time and read status */}
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-400">
            {time}
          </span>
          {isOwn && (
            message.read ? (
              <CheckCheck size={14} className="text-blue-500" />
            ) : (
              <Check size={14} className="text-gray-400" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
