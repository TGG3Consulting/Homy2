'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  Headphones,
  Clock,
  User,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import { ChatPanel } from '@/components/Chat';

interface ConversationItem {
  id: string;
  type: string;
  status: string;
  subject: string | null;
  created_at: string;
  updated_at: string;
  client: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    email: string;
    phone: string | null;
    memberSince: string;
  };
  lastMessage: {
    id: string;
    content: string;
    created_at: string;
  } | null;
  unreadCount: number;
  isAssignedToMe: boolean;
}

type FilterType = 'new' | 'mine' | 'resolved';

export default function SupportInbox() {
  const { t } = useT();

  // State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [counts, setCounts] = useState({ new: 0, mine: 0, resolved: 0 });
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('mine');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initialFetchDoneRef = useRef(false);

  // Fetch inbox data
  const fetchInbox = useCallback(async () => {
    console.log('[SupportInbox] fetchInbox called, filter:', activeFilter);
    try {
      setIsLoading(true);
      const res = await fetch(`/api/support/inbox?filter=${activeFilter}`, {
        credentials: 'include'
      });

      if (!res.ok) {
        if (res.status === 403) {
          setError('Доступ только для консультантов');
          return;
        }
        throw new Error('Failed to fetch inbox');
      }

      const data = await res.json();
      setConversations(data.conversations || []);
      setCounts(data.counts || { new: 0, mine: 0, resolved: 0 });
      setIsOnline(data.isOnline || false);
    } catch (err) {
      console.error('Error fetching inbox:', err);
      setError('Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  // Initial fetch (with guard to prevent multiple calls)
  useEffect(() => {
    if (initialFetchDoneRef.current) {
      console.log('[SupportInbox] Skipping fetch - already done');
      return;
    }
    initialFetchDoneRef.current = true;
    fetchInbox();
  }, [fetchInbox]);

  // Toggle online status
  const toggleOnlineStatus = async () => {
    try {
      setIsTogglingStatus(true);
      const res = await fetch('/api/support/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_online: !isOnline })
      });

      if (!res.ok) throw new Error('Failed to update status');

      const data = await res.json();
      setIsOnline(data.is_online);
    } catch (err) {
      console.error('Error toggling status:', err);
      setError('Не удалось изменить статус');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Assign conversation to self
  const handleAssign = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/support/assign/${conversationId}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to assign');

      // Refresh inbox
      fetchInbox();

      // Open conversation
      setSelectedConversationId(conversationId);
    } catch (err) {
      console.error('Error assigning:', err);
      setError('Не удалось взять диалог');
    }
  };

  // Format time
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Только что';
    if (minutes < 60) return `${minutes} мин. назад`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} ч. назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  // If selected conversation, show chat
  if (selectedConversationId) {
    return (
      <div className="h-[calc(100vh-200px)] min-h-[500px]">
        <ChatPanel
          mode="all"
          initialConversationId={selectedConversationId}
          onClose={() => {
            setSelectedConversationId(null);
            fetchInbox();
          }}
          showHeader={true}
        />
      </div>
    );
  }

  // Filter tabs config
  const filterTabs: { id: FilterType; label: string; count: number; color: string }[] = [
    { id: 'new', label: 'Новые', count: counts.new, color: '#F59E0B' },
    { id: 'mine', label: 'Мои', count: counts.mine, color: '#0A6045' },
    { id: 'resolved', label: 'Закрытые', count: counts.resolved, color: '#10B981' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with online toggle */}
      <div
        className="rounded-2xl p-6 border"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(0, 0, 0, 0.06)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(10, 96, 69, 0.1)' }}
            >
              <Headphones size={24} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>
                Поддержка
              </h1>
              <p className="text-sm text-gray-500">
                Управление обращениями клиентов
              </p>
            </div>
          </div>

          {/* Online toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: isOnline ? '#10B981' : '#6B7280' }}>
              {isOnline ? 'На линии' : 'Не на линии'}
            </span>
            <button
              onClick={toggleOnlineStatus}
              disabled={isTogglingStatus}
              className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                isTogglingStatus ? 'opacity-50' : ''
              }`}
              style={{
                backgroundColor: isOnline ? '#10B981' : '#D1D5DB'
              }}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ${
                  isOnline ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {filterTabs.map(tab => (
            <div
              key={tab.id}
              className="p-4 rounded-xl text-center"
              style={{ backgroundColor: `${tab.color}10` }}
            >
              <p className="text-2xl font-bold" style={{ color: tab.color }}>
                {tab.count}
              </p>
              <p className="text-sm text-gray-500">{tab.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === tab.id
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{
              backgroundColor: activeFilter === tab.id ? tab.color : 'transparent'
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeFilter === tab.id ? 'bg-white/20' : 'bg-gray-200'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}

        <button
          onClick={fetchInbox}
          className="ml-auto p-2 rounded-full hover:bg-gray-100"
          title="Обновить"
        >
          <RefreshCw size={18} className={`text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="px-4 py-3 rounded-xl flex items-center gap-2"
          style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }}
        >
          <AlertCircle size={18} className="text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Conversations list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="animate-pulse rounded-2xl p-4 border"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.06)' }}
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center border"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(0, 0, 0, 0.06)'
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(10, 96, 69, 0.1)' }}
          >
            <MessageSquare size={28} className="text-emerald-500" />
          </div>
          <p className="text-gray-500">
            {activeFilter === 'new'
              ? 'Нет новых обращений'
              : activeFilter === 'mine'
              ? 'У вас нет активных диалогов'
              : 'Нет закрытых диалогов'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className="rounded-2xl p-4 border transition-shadow hover:shadow-md cursor-pointer"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderColor: conv.unreadCount > 0 ? 'rgba(10, 96, 69, 0.3)' : 'rgba(0, 0, 0, 0.06)'
              }}
              onClick={() => conv.isAssignedToMe && setSelectedConversationId(conv.id)}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                {conv.client.avatar_url ? (
                  <Image
                    src={conv.client.avatar_url}
                    alt={conv.client.first_name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: '#0A6045' }}
                  >
                    {conv.client.first_name.charAt(0)}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium" style={{ color: '#1A1A1A' }}>
                      {conv.client.first_name} {conv.client.last_name}
                    </h3>
                    <span className="text-xs text-gray-400">
                      {formatTime(conv.updated_at)}
                    </span>
                  </div>

                  <p className="text-sm text-emerald-600 mb-1">
                    {conv.subject || 'Обращение в поддержку'}
                  </p>

                  {conv.lastMessage && (
                    <p className="text-sm text-gray-500 truncate">
                      {conv.lastMessage.content}
                    </p>
                  )}

                  {/* Client info */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{conv.client.email}</span>
                    {conv.client.phone && <span>{conv.client.phone}</span>}
                  </div>
                </div>

                {/* Action */}
                <div className="flex-shrink-0">
                  {conv.isAssignedToMe ? (
                    <div className="flex items-center gap-2">
                      {conv.unreadCount > 0 && (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: '#0A6045' }}
                        >
                          {conv.unreadCount}
                        </span>
                      )}
                      <ArrowRight size={20} className="text-gray-400" />
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssign(conv.id);
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-transform hover:scale-105"
                      style={{ backgroundColor: '#0A6045' }}
                    >
                      Взять
                    </button>
                  )}
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'rgba(0, 0, 0, 0.06)' }}>
                {conv.status === 'open' && !conv.isAssignedToMe && (
                  <>
                    <Clock size={14} className="text-amber-500" />
                    <span className="text-xs text-amber-500">Ожидает назначения</span>
                  </>
                )}
                {conv.status === 'assigned' && conv.isAssignedToMe && (
                  <>
                    <User size={14} className="text-emerald-500" />
                    <span className="text-xs text-emerald-500">Назначен вам</span>
                  </>
                )}
                {conv.status === 'resolved' && (
                  <>
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="text-xs text-green-500">Решён</span>
                  </>
                )}
                {conv.status === 'closed' && (
                  <>
                    <XCircle size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-400">Закрыт</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
