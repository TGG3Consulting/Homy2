'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Home,
  CalendarX,
  Plus,
  MessageSquare,
} from 'lucide-react';
import { useT, getLocalized, Language } from '@/lib/i18n';
import ViewingCreateForm from './ViewingCreateForm';

// Types for the negotiation workflow
export type ViewingStatus = 'pending_client' | 'pending_agent' | 'confirmed' | 'completed' | 'cancelled';

export interface ViewingProperty {
  id: string;
  title: string;
  address: string | null;
  district: string | null;
  imageUrl: string | null;
  images: string[];
  price: number | null;
  currency: string;
}

export interface ViewingParty {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
}

export interface Viewing {
  id: string;
  propertyId: string;
  clientId: string;
  agentId: string;
  createdById: string;
  lastProposedById: string;
  cancelledById: string | null;
  scheduledAt: string;
  status: ViewingStatus;
  comment: string | null;
  message: string | null;
  createdAt: string;
  property: ViewingProperty;
  client: ViewingParty;
  agent: ViewingParty;
  lastProposedBy: ViewingParty;
  // Computed on frontend or backend
  isMyTurnToRespond?: boolean;
  myRole?: 'client' | 'agent';
}

export interface ViewingsApiResponse {
  success: boolean;
  viewings: Viewing[];
  upcoming: {
    count: number;
    viewings: Viewing[];
  };
  past: {
    count: number;
    viewings: Viewing[];
  };
  total: number;
  hasMore: boolean;
}

// Glass morphism styles
const glassStyles = {
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
  } as React.CSSProperties,
  tab: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  } as React.CSSProperties,
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  } as React.CSSProperties,
  modal: {
    backgroundColor: 'rgba(249, 249, 247, 0.95)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    boxShadow: '0 0 0 1px rgba(200, 196, 188, 0.2), 0 25px 80px rgba(0, 0, 0, 0.12), 0 8px 30px rgba(0, 0, 0, 0.06)',
  } as React.CSSProperties,
};

// Status color configurations
interface StatusConfig {
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ size?: number }>;
}

const statusColors: Record<ViewingStatus, StatusConfig> = {
  pending_client: {
    color: '#D97706',
    bgColor: 'rgba(251, 191, 36, 0.15)',
    icon: Clock,
  },
  pending_agent: {
    color: '#D97706',
    bgColor: 'rgba(251, 191, 36, 0.15)',
    icon: Clock,
  },
  confirmed: {
    color: '#059669',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    icon: CheckCircle,
  },
  completed: {
    color: '#6B7280',
    bgColor: 'rgba(107, 114, 128, 0.15)',
    icon: CheckCircle,
  },
  cancelled: {
    color: '#DC2626',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    icon: X,
  },
};

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format time for display
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// Format price for display
function formatPrice(price: number | null, currency: string, priceOnRequestText: string): string {
  if (price === null) return priceOnRequestText;
  return `${price.toLocaleString()} ${currency}`;
}

// Get status label based on role and who should respond
function getStatusLabel(
  viewing: Viewing,
  currentUserId: string,
  t: (key: string) => string
): { label: string; isMyTurn: boolean } {
  const isClient = viewing.clientId === currentUserId;
  const isAgent = viewing.agentId === currentUserId;

  switch (viewing.status) {
    case 'pending_client':
      if (isClient) {
        return { label: t('viewings.awaitingYourResponse') || 'Требует вашего ответа', isMyTurn: true };
      }
      return { label: t('viewings.awaitingClientResponse') || 'Ожидает ответа клиента', isMyTurn: false };

    case 'pending_agent':
      if (isAgent) {
        return { label: t('viewings.awaitingYourResponse') || 'Требует вашего ответа', isMyTurn: true };
      }
      return { label: t('viewings.awaitingAgentResponse') || 'Ожидает ответа агента', isMyTurn: false };

    case 'confirmed':
      return { label: t('viewings.status.confirmed') || 'Подтверждено', isMyTurn: false };

    case 'cancelled':
      if (viewing.cancelledById === currentUserId) {
        return { label: t('viewings.cancelledByYou') || 'Отменено вами', isMyTurn: false };
      }
      return { label: t('viewings.cancelledByOther') || 'Отменено другой стороной', isMyTurn: false };

    case 'completed':
      return { label: t('viewings.status.completed') || 'Завершено', isMyTurn: false };

    default:
      return { label: viewing.status, isMyTurn: false };
  }
}

// Get badge color based on whether it's my turn
function getBadgeColor(status: ViewingStatus, isMyTurn: boolean): { color: string; bgColor: string } {
  if (status === 'confirmed') {
    return { color: '#059669', bgColor: 'rgba(16, 185, 129, 0.15)' };
  }
  if (status === 'cancelled') {
    return { color: '#DC2626', bgColor: 'rgba(239, 68, 68, 0.15)' };
  }
  if (status === 'completed') {
    return { color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.15)' };
  }
  // pending_client or pending_agent
  if (isMyTurn) {
    return { color: '#D97706', bgColor: 'rgba(251, 191, 36, 0.15)' };
  }
  return { color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.15)' };
}

// Loading skeleton component
function ViewingCardSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={glassStyles.card}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-40 h-32 sm:h-auto bg-gray-200/50" />
        <div className="flex-1 p-4 space-y-3">
          <div className="h-4 bg-gray-200/50 rounded w-3/4" />
          <div className="h-3 bg-gray-200/50 rounded w-1/2" />
          <div className="flex gap-4 mt-4">
            <div className="h-3 bg-gray-200/50 rounded w-24" />
            <div className="h-3 bg-gray-200/50 rounded w-24" />
          </div>
          <div className="flex gap-2 mt-4">
            <div className="h-6 bg-gray-200/50 rounded-full w-20" />
            <div className="h-6 bg-gray-200/50 rounded-full w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty state component
interface EmptyStateProps {
  type: 'upcoming' | 'completed';
  t: (key: string) => string;
}

function EmptyState({ type, t }: EmptyStateProps) {
  const isUpcoming = type === 'upcoming';

  return (
    <div
      className="rounded-2xl p-8 text-center"
      style={glassStyles.card}
    >
      <div
        className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}
      >
        {isUpcoming ? (
          <Calendar size={28} style={{ color: '#757570' }} />
        ) : (
          <CalendarX size={28} style={{ color: '#757570' }} />
        )}
      </div>
      <h3
        className="text-lg font-semibold font-body mb-2"
        style={{ color: '#1A1A1A' }}
      >
        {isUpcoming ? t('viewings.noUpcoming') : t('viewings.noCompleted')}
      </h3>
      <p
        className="text-sm font-body max-w-sm mx-auto"
        style={{ color: '#757570' }}
      >
        {isUpcoming
          ? t('viewings.noUpcomingDesc')
          : t('viewings.noCompletedDesc')}
      </p>
      {isUpcoming && (
        <Link
          href="/properties"
          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-full text-sm font-medium font-body transition-all duration-200 hover:shadow-md"
          style={{
            backgroundColor: 'rgb(10, 96, 69)',
            color: '#FFF',
          }}
        >
          <Home size={16} />
          {t('viewings.browseProperties')}
        </Link>
      )}
    </div>
  );
}

// Status badge component
interface StatusBadgeProps {
  viewing: Viewing;
  currentUserId: string;
  t: (key: string) => string;
}

function StatusBadge({ viewing, currentUserId, t }: StatusBadgeProps) {
  const { label, isMyTurn } = getStatusLabel(viewing, currentUserId, t);
  const colors = getBadgeColor(viewing.status, isMyTurn);
  const config = statusColors[viewing.status];
  const IconComponent = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-body"
      style={{
        backgroundColor: colors.bgColor,
        color: colors.color,
      }}
    >
      <IconComponent size={12} />
      {label}
    </span>
  );
}

// Propose Time Modal Component
interface ProposeTimeModalProps {
  viewing: Viewing;
  onClose: () => void;
  onSubmit: (viewingId: string, scheduledAt: string, comment: string) => Promise<void>;
  isSubmitting: boolean;
  t: (key: string) => string;
  lang: Language;
}

function ProposeTimeModal({ viewing, onClose, onSubmit, isSubmitting, t, lang }: ProposeTimeModalProps) {
  const propertyTitle = getLocalized(viewing.property.title, lang);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [comment, setComment] = useState<string>('');

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 9; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 20) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  }, []);

  // Get minimum date (tomorrow)
  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;

    const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
    await onSubmit(viewing.id, scheduledAt, comment);
  };

  const canSubmit = selectedDate && selectedTime && !isSubmitting;

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ backgroundColor: 'rgba(15, 15, 13, 0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center p-6">
        <div
          className="relative w-full max-w-md rounded-[28px] p-6"
          style={glassStyles.modal}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3
                className="text-lg font-semibold font-body"
                style={{ color: '#1A1A1A' }}
              >
                {t('viewings.proposeTimeTitle') || 'Предложить другое время'}
              </h3>
              <p
                className="text-sm font-body mt-1"
                style={{ color: '#757570' }}
              >
                {t('viewings.proposeTimeSubtitle') || 'Выберите новую дату и время'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full transition-colors hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={20} style={{ color: '#757570' }} />
            </button>
          </div>

          {/* Property info */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl mb-6"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}
          >
            <img
              src={viewing.property.imageUrl || viewing.property.images?.[0] || '/placeholder-property.jpg'}
              alt={propertyTitle}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium font-body truncate"
                style={{ color: '#1A1A1A' }}
              >
                {propertyTitle}
              </p>
              {viewing.property.address && (
                <p
                  className="text-xs font-body truncate"
                  style={{ color: '#757570' }}
                >
                  {getLocalized(viewing.property.address, lang)}
                </p>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date picker */}
            <div>
              <label
                className="block text-sm font-medium font-body mb-2"
                style={{ color: '#3D3B37' }}
              >
                {t('schedulePage.selectTime') || 'Выберите дату'}
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={minDate}
                className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none transition-all"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  color: '#1A1A1A',
                }}
              />
            </div>

            {/* Time slots */}
            <div>
              <label
                className="block text-sm font-medium font-body mb-2"
                style={{ color: '#3D3B37' }}
              >
                {t('schedulePage.selectTime') || 'Выберите время'}
              </label>
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className="px-3 py-2 rounded-lg text-xs font-medium font-body transition-all"
                    style={{
                      backgroundColor: selectedTime === time
                        ? 'rgb(10, 96, 69)'
                        : 'rgba(255, 255, 255, 0.6)',
                      color: selectedTime === time ? '#FFF' : '#3D3B37',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment textarea */}
            <div>
              <label
                className="block text-sm font-medium font-body mb-2"
                style={{ color: '#3D3B37' }}
              >
                {t('viewings.commentLabel') || 'Комментарий'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('viewings.commentPlaceholder') || 'Добавьте комментарий (опционально)...'}
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none transition-all resize-none"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  color: '#1A1A1A',
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-full text-sm font-medium font-body transition-all"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  color: '#3D3B37',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                }}
              >
                {t('common.cancel') || 'Отмена'}
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 py-3 px-4 rounded-full text-sm font-medium font-body transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'rgb(10, 96, 69)',
                  color: '#FFF',
                }}
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin mx-auto" />
                ) : (
                  t('viewings.send') || 'Отправить'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Viewing card component
interface ViewingCardProps {
  viewing: Viewing;
  currentUserId: string;
  isUpcoming: boolean;
  onApprove: (viewingId: string) => Promise<void>;
  onCancel: (viewingId: string) => Promise<void>;
  onProposeTime: (viewing: Viewing) => void;
  isApproving: boolean;
  isCancelling: boolean;
  t: (key: string) => string;
  lang: Language;
}

function ViewingCard({
  viewing,
  currentUserId,
  isUpcoming,
  onApprove,
  onCancel,
  onProposeTime,
  isApproving,
  isCancelling,
  t,
  lang,
}: ViewingCardProps) {
  const { property } = viewing;
  const imageUrl = property.imageUrl || property.images?.[0] || '/placeholder-property.jpg';
  const propertyTitle = getLocalized(property.title, lang);

  // Determine role and other party
  const isClient = viewing.clientId === currentUserId;
  const otherParty = isClient ? viewing.agent : viewing.client;
  const otherPartyLabel = isClient
    ? (t('viewings.agentOwner') || 'Агент/Владелец')
    : (t('viewings.client') || 'Клиент');

  // Determine if it's my turn to respond
  const isPending = viewing.status === 'pending_client' || viewing.status === 'pending_agent';
  const isMyTurnToRespond =
    (viewing.status === 'pending_client' && isClient) ||
    (viewing.status === 'pending_agent' && !isClient);

  // Can cancel any active viewing (pending or confirmed, not completed/cancelled)
  const canCancel = ['pending_client', 'pending_agent', 'confirmed'].includes(viewing.status) && isUpcoming;

  // Show action buttons if it's my turn and viewing is pending
  const showActionButtons = isMyTurnToRespond && isPending;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg group"
      style={glassStyles.card}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Property image */}
        <div className="relative w-full sm:w-40 h-40 sm:h-auto flex-shrink-0 overflow-hidden">
          <img
            src={imageUrl}
            alt={propertyTitle}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none sm:hidden" />

          {/* Price overlay on mobile */}
          <div className="absolute bottom-3 left-3 sm:hidden">
            <span className="text-white text-sm font-semibold font-body">
              {formatPrice(property.price, property.currency, t('viewings.priceOnRequest'))}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3
                className="text-base font-semibold font-body leading-snug truncate"
                style={{ color: '#1A1A1A' }}
              >
                {propertyTitle}
              </h3>
              {property.address && (
                <div className="flex items-center gap-1.5 mt-1">
                  <MapPin size={12} style={{ color: '#757570' }} />
                  <span
                    className="text-xs font-body truncate"
                    style={{ color: '#757570' }}
                  >
                    {getLocalized(property.address, lang)}
                    {property.district && `, ${getLocalized(property.district, lang)}`}
                  </span>
                </div>
              )}
            </div>
            <StatusBadge viewing={viewing} currentUserId={currentUserId} t={t} />
          </div>

          {/* Date and time */}
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} style={{ color: '#5C5A55' }} />
              <span
                className="text-sm font-body"
                style={{ color: '#3D3B37' }}
              >
                {formatDate(viewing.scheduledAt)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} style={{ color: '#5C5A55' }} />
              <span
                className="text-sm font-body"
                style={{ color: '#3D3B37' }}
              >
                {formatTime(viewing.scheduledAt)}
              </span>
            </div>
          </div>

          {/* Price (desktop) */}
          <div className="hidden sm:block mb-3">
            <span
              className="text-sm font-semibold font-body"
              style={{ color: '#1A1A1A' }}
            >
              {formatPrice(property.price, property.currency, t('viewings.priceOnRequest'))}
            </span>
          </div>

          {/* Other party contact info */}
          {otherParty && (
            <div
              className="flex items-center gap-3 px-3 py-2 rounded-xl mb-3"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(10, 96, 69, 0.1)' }}
              >
                <User size={14} style={{ color: 'rgb(10, 96, 69)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-body"
                  style={{ color: '#757570' }}
                >
                  {otherPartyLabel}
                </p>
                <p
                  className="text-sm font-medium font-body truncate"
                  style={{ color: '#1A1A1A' }}
                >
                  {otherParty.name || otherParty.email}
                </p>
              </div>
              {otherParty.phone && (
                <a
                  href={`tel:${otherParty.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium font-body transition-all duration-200 hover:shadow-sm"
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    color: '#16A34A',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone size={12} />
                  {t('viewings.call')}
                </a>
              )}
            </div>
          )}

          {/* Comment/Message from negotiation */}
          {viewing.comment && (
            <div
              className="flex items-start gap-2 px-3 py-2 rounded-xl mb-3"
              style={{ backgroundColor: 'rgba(10, 96, 69, 0.05)' }}
            >
              <MessageSquare size={14} style={{ color: 'rgb(10, 96, 69)', marginTop: 2 }} />
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-body mb-1"
                  style={{ color: '#757570' }}
                >
                  {t('viewings.proposedBy') || 'Предложено'}{' '}
                  {viewing.lastProposedBy?.name || viewing.lastProposedBy?.email || t('viewings.from')}:
                </p>
                <p
                  className="text-sm font-body"
                  style={{ color: '#3D3B37' }}
                >
                  {viewing.comment}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-auto pt-2">
            <a
              href={`/properties/${property.id}`}
              className="flex-1 py-2 px-4 rounded-full text-xs font-medium font-body text-center transition-all duration-200 hover:shadow-sm"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                color: '#3D3B37',
                border: '1px solid rgba(0, 0, 0, 0.06)',
              }}
            >
              {t('viewings.viewProperty')}
            </a>

            {/* Action buttons when it's my turn */}
            {showActionButtons && (
              <>
                {/* Approve button */}
                <button
                  onClick={() => onApprove(viewing.id)}
                  disabled={isApproving}
                  className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-full text-xs font-medium font-body transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#059669',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  {isApproving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <CheckCircle size={12} />
                  )}
                  {t('viewings.approve') || 'Подтвердить'}
                </button>

                {/* Propose different time button */}
                <button
                  onClick={() => onProposeTime(viewing)}
                  className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-full text-xs font-medium font-body transition-all duration-200 hover:shadow-sm"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    color: '#3D3B37',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <Calendar size={12} />
                  {t('viewings.proposeOtherTime') || 'Предложить другое время'}
                </button>
              </>
            )}

            {/* Cancel button for confirmed viewings */}
            {canCancel && (
              <button
                onClick={() => onCancel(viewing.id)}
                disabled={isCancelling}
                className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-full text-xs font-medium font-body transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'transparent',
                  color: '#DC2626',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                {isCancelling ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <X size={12} />
                )}
                {t('viewings.cancelViewing') || 'Отменить просмотр'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Toast notification component
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-slide-up"
      style={{
        backgroundColor: type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
        color: '#FFF',
      }}
    >
      {type === 'success' ? (
        <CheckCircle size={18} />
      ) : (
        <AlertCircle size={18} />
      )}
      <span className="text-sm font-medium font-body">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
      >
        <X size={14} />
      </button>
    </div>,
    document.body
  );
}

// Main ViewingsList component
interface ViewingsListProps {
  className?: string;
  userType?: 'buyer' | 'renter' | 'owner' | 'agent' | 'consultant';
}

export default function ViewingsList({ className = '', userType }: ViewingsListProps) {
  const { t, lang } = useT();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [proposeModalViewing, setProposeModalViewing] = useState<Viewing | null>(null);
  const [isProposing, setIsProposing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // All users can create viewings:
  // - Owners/Agents: Create viewings for clients on their properties
  // - Buyers/Renters: Request viewings for themselves on any property
  const canCreateViewing = Boolean(userType);

  // Show toast notification
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  // Fetch viewings from API
  const fetchViewings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/viewings', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError(t('viewings.sessionExpired'));
        } else {
          const data = await response.json();
          setError(data.error || 'Failed to fetch viewings');
        }
        setIsLoading(false);
        return;
      }

      const data: ViewingsApiResponse = await response.json();
      setViewings(data.viewings || []);
      setUpcomingCount(data.upcoming?.count || 0);
      setCompletedCount(data.past?.count || 0);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch viewings:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Fetch current user ID
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch('/api/users/me', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.id || data.user?.id || '');
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  }, []);

  // Approve a viewing
  const handleApprove = useCallback(async (viewingId: string) => {
    setActionInProgress(viewingId);
    setError(null);

    try {
      const response = await fetch(`/api/viewings/${viewingId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        showToast(data.error || 'Failed to approve viewing', 'error');
        return;
      }

      showToast(t('viewings.viewingApproved') || 'Просмотр подтвержден!', 'success');
      await fetchViewings();
    } catch (err) {
      console.error('Failed to approve viewing:', err);
      showToast('Failed to approve viewing', 'error');
    } finally {
      setActionInProgress(null);
    }
  }, [fetchViewings, showToast, t]);

  // Cancel a viewing
  const handleCancel = useCallback(async (viewingId: string) => {
    setActionInProgress(viewingId);
    setError(null);

    try {
      const response = await fetch(`/api/viewings/${viewingId}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        showToast(data.error || 'Failed to cancel viewing', 'error');
        return;
      }

      showToast(t('viewings.viewingCancelled') || 'Просмотр отменен', 'success');
      await fetchViewings();
    } catch (err) {
      console.error('Failed to cancel viewing:', err);
      showToast('Failed to cancel viewing', 'error');
    } finally {
      setActionInProgress(null);
    }
  }, [fetchViewings, showToast, t]);

  // Propose a new time
  const handleProposeTime = useCallback(async (viewingId: string, scheduledAt: string, comment: string) => {
    setIsProposing(true);
    setError(null);

    try {
      const response = await fetch(`/api/viewings/${viewingId}/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ scheduledAt, comment }),
      });

      if (!response.ok) {
        const data = await response.json();
        showToast(data.error || 'Failed to propose new time', 'error');
        return;
      }

      showToast(t('viewings.viewingProposed') || 'Новое время предложено', 'success');
      setProposeModalViewing(null);
      await fetchViewings();
    } catch (err) {
      console.error('Failed to propose new time:', err);
      showToast('Failed to propose new time', 'error');
    } finally {
      setIsProposing(false);
    }
  }, [fetchViewings, showToast, t]);

  // Fetch data on mount
  useEffect(() => {
    fetchCurrentUser();
    fetchViewings();
  }, [fetchCurrentUser, fetchViewings]);

  // Separate viewings into upcoming and completed/cancelled
  const now = new Date();
  const upcomingViewings = useMemo(() =>
    viewings.filter(v =>
      new Date(v.scheduledAt) >= now &&
      v.status !== 'completed' &&
      v.status !== 'cancelled'
    ),
    [viewings, now]
  );
  const completedViewings = useMemo(() =>
    viewings.filter(v =>
      new Date(v.scheduledAt) < now ||
      v.status === 'completed' ||
      v.status === 'cancelled'
    ),
    [viewings, now]
  );
  const currentViewings = activeTab === 'upcoming' ? upcomingViewings : completedViewings;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2
            className="text-xl font-semibold font-body"
            style={{ color: '#1A1A1A' }}
          >
            {t('viewings.title')}
          </h2>
          {totalCount > 0 && (
            <span
              className="text-sm font-body"
              style={{ color: '#757570' }}
            >
              {totalCount} {t('viewings.total')}
            </span>
          )}
        </div>
        {canCreateViewing && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium font-body transition-all duration-200 hover:shadow-md"
            style={{
              backgroundColor: 'rgb(10, 96, 69)',
              color: '#FFF',
            }}
          >
            <Plus size={16} />
            {t('viewings.addViewing') || 'Add Viewing'}
          </button>
        )}
      </div>

      {/* Create Viewing Form Modal */}
      {showCreateForm && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{ backgroundColor: 'rgba(15,15,13,0.55)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowCreateForm(false)}
        >
          <div className="min-h-full flex items-center justify-center p-6">
            <div
              className="relative w-full max-w-2xl rounded-[28px] p-6"
              style={glassStyles.modal}
              onClick={(e) => e.stopPropagation()}
            >
              <ViewingCreateForm
                userType={userType}
                onSuccess={() => {
                  setShowCreateForm(false);
                  fetchViewings();
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Propose Time Modal */}
      {proposeModalViewing && typeof document !== 'undefined' && (
        <ProposeTimeModal
          viewing={proposeModalViewing}
          onClose={() => setProposeModalViewing(null)}
          onSubmit={handleProposeTime}
          isSubmitting={isProposing}
          t={t}
          lang={lang}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Tabs */}
      <div
        className="inline-flex p-1 rounded-xl"
        style={glassStyles.tab}
      >
        <button
          onClick={() => setActiveTab('upcoming')}
          className="relative px-4 py-2 rounded-lg text-sm font-medium font-body transition-all duration-200"
          style={activeTab === 'upcoming' ? glassStyles.activeTab : { backgroundColor: 'transparent' }}
        >
          <span style={{ color: activeTab === 'upcoming' ? '#1A1A1A' : '#757570' }}>
            {t('viewings.upcoming')}
          </span>
          {upcomingViewings.length > 0 && (
            <span
              className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: activeTab === 'upcoming' ? 'rgb(10, 96, 69)' : 'rgba(0, 0, 0, 0.1)',
                color: activeTab === 'upcoming' ? '#FFF' : '#757570',
              }}
            >
              {upcomingViewings.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className="relative px-4 py-2 rounded-lg text-sm font-medium font-body transition-all duration-200"
          style={activeTab === 'completed' ? glassStyles.activeTab : { backgroundColor: 'transparent' }}
        >
          <span style={{ color: activeTab === 'completed' ? '#1A1A1A' : '#757570' }}>
            {t('viewings.completed')}
          </span>
          {completedViewings.length > 0 && (
            <span
              className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: activeTab === 'completed' ? 'rgb(10, 96, 69)' : 'rgba(0, 0, 0, 0.1)',
                color: activeTab === 'completed' ? '#FFF' : '#757570',
              }}
            >
              {completedViewings.length}
            </span>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <AlertCircle size={20} style={{ color: '#DC2626' }} />
          <p
            className="text-sm font-body flex-1"
            style={{ color: '#DC2626' }}
          >
            {error}
          </p>
          <button
            onClick={fetchViewings}
            className="text-sm font-medium font-body underline"
            style={{ color: '#DC2626' }}
          >
            {t('viewings.tryAgain')}
          </button>
        </div>
      )}

      {/* Content */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          <>
            <ViewingCardSkeleton />
            <ViewingCardSkeleton />
            <ViewingCardSkeleton />
          </>
        ) : currentViewings.length === 0 ? (
          // Empty state
          <EmptyState type={activeTab} t={t} />
        ) : (
          // Viewings list
          currentViewings.map((viewing) => (
            <ViewingCard
              key={viewing.id}
              viewing={viewing}
              currentUserId={currentUserId}
              isUpcoming={activeTab === 'upcoming'}
              onApprove={handleApprove}
              onCancel={handleCancel}
              onProposeTime={(v) => setProposeModalViewing(v)}
              isApproving={actionInProgress === viewing.id}
              isCancelling={actionInProgress === viewing.id}
              t={t}
              lang={lang}
            />
          ))
        )}
      </div>

      {/* CSS for toast animation */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
