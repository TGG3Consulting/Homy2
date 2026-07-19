'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  MapPin,
  Bed,
  Maximize2,
  Home,
  CheckCircle,
  Star,
  ShieldCheck,
  User,
  Video,
  Loader2,
  Sparkles,
  CalendarPlus,
  MessageSquare,
} from 'lucide-react';
import PropertyGallery from './PropertyGallery';
import PropertyMiniMap from './PropertyMiniMap';
import PropertyAIChat from './PropertyAIChat';
import PropertyIntelligence from './PropertyIntelligence';
import VirtualTour from './VirtualTour';
import ViewingRequestForm from './ViewingRequestForm';
import { PropertyShowcase } from '@/lib/types';
import { useT, getLocalized } from '@/lib/i18n';
import { useChatWidget } from '@/contexts/ChatWidgetContext';

// Get conversation history from sessionStorage
function getConversationHistory(): string {
  if (typeof window === 'undefined') return '';
  try {
    const history = sessionStorage.getItem('homy_chat_history');
    console.log('[Homy Opinion] Raw sessionStorage:', history);
    if (!history) {
      console.log('[Homy Opinion] No history in sessionStorage!');
      return '';
    }
    const messages = JSON.parse(history);
    console.log('[Homy Opinion] Parsed messages count:', messages.length);
    const userMessages = messages
      .filter((m: any) => m.role === 'user')
      .map((m: any) => m.content)
      .slice(-20)
      .join('\n');
    console.log('[Homy Opinion] User messages:', userMessages);
    return userMessages;
  } catch (e) {
    console.error('[Homy Opinion] Error parsing history:', e);
    return '';
  }
}

interface BadgeProps {
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  color?: string;
  bgColor?: string;
}

function Badge({ icon: Icon, label, color, bgColor }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold font-body"
      style={{
        backgroundColor: bgColor || 'rgba(10, 96, 69,0.08)',
        color: color || '#0A6045',
      }}
    >
      {Icon && <Icon size={11} strokeWidth={2.5} />}
      {label}
    </span>
  );
}

interface PropertyDetailModalProps {
  property: PropertyShowcase | null;
  onClose: () => void;
}

export default function PropertyDetailModal({ property, onClose }: PropertyDetailModalProps) {
  const [showVirtualTour, setShowVirtualTour] = useState(false);
  const [showViewingForm, setShowViewingForm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [aiOpinion, setAiOpinion] = useState<{ summary: string; reasons: string[]; warning: string | null } | null>(null);
  const [opinionLoading, setOpinionLoading] = useState(false);
  const [hasExistingViewing, setHasExistingViewing] = useState(false);
  const { t, lang } = useT();
  const { openPropertyChat } = useChatWidget();
  const propertyId = property?.id;

  // Handle opening chat with property owner
  const handleWriteToOwner = () => {
    if (property?.id) {
      openPropertyChat(property.id);
    }
  };

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' });
        setIsLoggedIn(res.ok);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  // Check if user already has a viewing for this property
  useEffect(() => {
    if (!isLoggedIn || !propertyId) {
      setHasExistingViewing(false);
      return;
    }

    const checkExistingViewing = async () => {
      try {
        const res = await fetch('/api/viewings', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const viewings = data.viewings || [];
          // Only block scheduling for active viewings (not completed/cancelled)
          const hasActiveViewing = viewings.some((v: any) =>
            v.propertyId === propertyId && v.status !== 'completed' && v.status !== 'cancelled'
          );
          setHasExistingViewing(hasActiveViewing);
        }
      } catch {
        // ignore
      }
    };
    checkExistingViewing();
  }, [isLoggedIn, propertyId]);

  // Localize property fields
  const title = property ? getLocalized(property.title, lang) : '';
  const neighborhood = property ? getLocalized(property.neighborhood, lang) : '';
  const district = property ? getLocalized(property.district, lang) : '';
  const displayLocation = neighborhood || district;

  // Fetch AI opinion when modal opens
  useEffect(() => {
    if (!propertyId) return;

    const fetchOpinion = async () => {
      setOpinionLoading(true);
      try {
        const conversationHistory = getConversationHistory();
        const res = await fetch(`/api/properties/${propertyId}/opinion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationHistory }),
        });
        const data = await res.json();
        if (data.summary || (data.reasons && data.reasons.length > 0)) {
          setAiOpinion(data);
        }
      } catch (err) {
        console.error('Failed to fetch AI opinion:', err);
      } finally {
        setOpinionLoading(false);
      }
    };

    fetchOpinion();
  }, [propertyId]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showVirtualTour) {
          setShowVirtualTour(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, showVirtualTour]);

  if (!property) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ backgroundColor: 'rgba(15,15,13,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      {/* Mobile: full-screen, Desktop: centered modal */}
      <div className="min-h-full flex items-center justify-center p-0 md:p-6">
        <div
          className="relative w-full h-full md:h-auto md:max-w-[910px] md:rounded-[28px] overflow-y-auto md:overflow-hidden shadow-2xl"
          style={{
            maxHeight: '100vh',
            backgroundColor: 'rgba(249,249,247,0.95)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow:
              '0 0 0 1px rgba(200,196,188,0.2), 0 25px 80px rgba(0,0,0,0.12), 0 8px 30px rgba(0,0,0,0.06)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Grid layout - only on desktop */}
          <div className="md:grid md:max-h-[90vh]" style={{ gridTemplateColumns: '1fr 270px', gridTemplateRows: 'minmax(0, 1fr)' }}>
          {/* Close button - fixed on mobile */}
          <button
            onClick={onClose}
            className="fixed md:absolute top-4 right-4 z-50 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              backgroundColor: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(200,196,188,0.3)',
            }}
          >
            <X size={16} style={{ color: '#1A1A1A' }} />
          </button>

          {/* LEFT - Property Details */}
          <div
            className="overflow-y-auto px-4 md:px-7 py-6 md:py-7 space-y-4 md:space-y-5 min-w-0"
            style={{ minHeight: 0 }}
          >
            {/* Gallery */}
            <div className="relative">
              <PropertyGallery mainImageUrl={property.image_url} images={property.images} />
              {/* Virtual Tour Button - only show if property has virtual tour */}
              {property.has_virtual_tour && (
                <button
                  onClick={() => setShowVirtualTour(true)}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold font-body transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: 'rgba(10, 96, 69,0.9)',
                    color: '#FFF',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 12px rgba(10, 96, 69,0.3)',
                  }}
                >
                  <Video size={13} />
                  {t('propertyDetail.virtualTour')}
                </button>
              )}
            </div>

            {/* Header row */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[26px] font-body font-bold tracking-tight"
                    style={{ color: '#1A1A1A' }}
                  >
                    {property.price.toLocaleString()} AMD
                  </span>
                  <span className="text-[13px] font-body mt-1.5" style={{ color: '#A09D96' }}>
                    {t('propertyDetail.month')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} style={{ color: '#B5B3AD' }} />
                  <span
                    className="text-[14px] font-body font-medium"
                    style={{ color: '#757570' }}
                  >
                    {displayLocation} - {title}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span
                  className="text-[28px] font-body font-bold tracking-tight"
                  style={{ color: '#0A6045' }}
                >
                  {property.match_score}%
                </span>
                <span
                  className="text-[10px] font-body uppercase tracking-wider"
                  style={{ color: '#A09D96' }}
                >
                  {t('propertyDetail.matchScore')}
                </span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {property.is_top_choice && (
                <Badge
                  icon={Star}
                  label={t('propertyDetail.homlyTopChoice')}
                  color="#0A6045"
                  bgColor="rgba(10, 96, 69,0.08)"
                />
              )}
              <Badge icon={ShieldCheck} label={t('propertyDetail.verifiedListing')} />
              <Badge
                icon={Home}
                label={displayLocation}
                color="#757570"
                bgColor="rgba(117,117,112,0.06)"
              />
            </div>

            {/* Property specs */}
            <div
              className="flex items-center gap-6 py-3 px-4 rounded-2xl"
              style={{
                backgroundColor: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(200,196,188,0.25)',
              }}
            >
              <div className="flex items-center gap-2">
                <Bed size={15} style={{ color: '#0A6045' }} />
                <div>
                  <span
                    className="text-[14px] font-semibold font-body"
                    style={{ color: '#1A1A1A' }}
                  >
                    {property.bedrooms || property.rooms}
                  </span>
                  <span className="text-[11px] font-body ml-1" style={{ color: '#A09D96' }}>
                    {(property.bedrooms || property.rooms) === 1 ? t('propertyDetail.bedroom') : t('propertyDetail.bedrooms')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Maximize2 size={15} style={{ color: '#0A6045' }} />
                <div>
                  <span
                    className="text-[14px] font-semibold font-body"
                    style={{ color: '#1A1A1A' }}
                  >
                    {property.size_sqm || property.area} m²
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Home size={15} style={{ color: '#0A6045' }} />
                <div>
                  <span
                    className="text-[14px] font-semibold font-body"
                    style={{ color: '#1A1A1A' }}
                  >
                    {t('propertyDetail.floor', { floor: String(property.floor) })}
                  </span>
                </div>
              </div>
              <span className="text-[12px] font-body" style={{ color: '#757570' }}>
                · {t('propertyDetail.brickBuilding')}
              </span>
            </div>

            {/* Мнение Homy */}
            <div
              className="rounded-2xl p-4"
              style={{
                backgroundColor: 'rgba(10, 96, 69,0.04)',
                border: '1px solid rgba(10, 96, 69,0.1)',
              }}
            >
              <h4
                className="text-[11px] font-semibold font-body uppercase tracking-wider mb-2 flex items-center gap-1.5"
                style={{ color: '#0A6045' }}
              >
                <Sparkles size={12} />
                Мнение Homy
              </h4>
              {opinionLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" style={{ color: '#0A6045' }} />
                  <span className="text-[12px] font-body" style={{ color: '#A09D96' }}>
                    Анализирую вашу переписку...
                  </span>
                </div>
              ) : aiOpinion?.summary ? (
                <p className="text-[13px] font-body leading-relaxed" style={{ color: '#3D3B37' }}>
                  {aiOpinion.summary}
                </p>
              ) : (
                <p className="text-[12px] font-body" style={{ color: '#A09D96' }}>
                  Откройте чат и расскажите что ищете — я дам персональную оценку
                </p>
              )}
            </div>

            {/* AI Opinion - Мнение Homy (генерируется Claude) */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: 'rgba(10, 96, 69,0.04)',
                  border: '1px solid rgba(10, 96, 69,0.1)',
                }}
              >
                <h4
                  className="text-[11px] font-semibold font-body uppercase tracking-wider mb-2.5 flex items-center gap-1.5"
                  style={{ color: '#0A6045' }}
                >
                  <Sparkles size={12} />
                  {t('propertyDetail.advantages')}
                </h4>
                {opinionLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 size={14} className="animate-spin" style={{ color: '#0A6045' }} />
                    <span className="text-[12px] font-body" style={{ color: '#A09D96' }}>
                      AI анализирует...
                    </span>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {(aiOpinion?.reasons || property.recommendation_reasons)?.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle
                          size={12}
                          className="flex-shrink-0 mt-[2px]"
                          style={{ color: '#0A6045' }}
                        />
                        <span
                          className="text-[12px] font-body leading-snug"
                          style={{ color: '#3D3B37' }}
                        >
                          {typeof r === 'string' ? r : getLocalized(r, lang)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {(aiOpinion?.warning || property.warning) && (
                <div
                  className="rounded-2xl p-4"
                  style={{
                    backgroundColor: 'rgba(245,158,11,0.04)',
                    border: '1px solid rgba(245,158,11,0.1)',
                  }}
                >
                  <h4
                    className="text-[11px] font-semibold font-body uppercase tracking-wider mb-2.5"
                    style={{ color: '#D4A54A' }}
                  >
                    {t('propertyDetail.consideration')}
                  </h4>
                  <p
                    className="text-[12px] font-body leading-relaxed"
                    style={{ color: '#5C5A55' }}
                  >
                    {aiOpinion?.warning || getLocalized(property.warning, lang)}
                  </p>
                </div>
              )}
            </div>

            {/* Costs breakdown */}
            <div
              className="rounded-2xl p-4"
              style={{
                backgroundColor: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(200,196,188,0.25)',
              }}
            >
              <h4
                className="text-[11px] font-semibold font-body uppercase tracking-wider mb-3"
                style={{ color: '#A09D96' }}
              >
                {t('propertyDetail.monthlyCosts')}
              </h4>
              <div className="flex items-center gap-6 text-[13px] font-body">
                <div>
                  <span style={{ color: '#A09D96' }}>{t('propertyDetail.rent')} </span>
                  <span className="font-semibold" style={{ color: '#1A1A1A' }}>
                    {property.price.toLocaleString()} AMD
                  </span>
                </div>
                <div>
                  <span style={{ color: '#A09D96' }}>{t('propertyDetail.utilities')} </span>
                  <span className="font-semibold" style={{ color: '#1A1A1A' }}>
                    ~{property.utilities_estimate?.toLocaleString() || '18,000'} AMD
                  </span>
                </div>
                <div>
                  <span style={{ color: '#A09D96' }}>{t('propertyDetail.deposit')} </span>
                  <span className="font-semibold" style={{ color: '#1A1A1A' }}>
                    {property.deposit_months || 1} {t('propertyDetail.depositMonth')}
                  </span>
                </div>
              </div>
            </div>

            {/* Property Intelligence */}
            <PropertyIntelligence property={{ id: property.id, is_top_choice: property.is_top_choice }} />

            {/* Mini Map */}
            <div>
              <h4
                className="text-[11px] font-semibold font-body uppercase tracking-wider mb-2"
                style={{ color: '#A09D96' }}
              >
                {t('propertyDetail.nearby')}
              </h4>
              <PropertyMiniMap property={property} propertyId={property.id} />
            </div>

            {/* Agent / Owner + Viewing Request */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(200,196,188,0.25)',
              }}
            >
              {/* Agent Info */}
              <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(10, 96, 69,0.1)' }}
                  >
                    <User size={18} style={{ color: '#0A6045' }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold font-body" style={{ color: '#1A1A1A' }}>
                      {property.owner ? `${property.owner.first_name} ${property.owner.last_name}` : t('propertyDetail.unknownOwner')}
                    </p>
                    <p className="text-[11px] font-body" style={{ color: '#A09D96' }}>
                      {property.contact?.verified ? t('propertyDetail.verified') + ' ' : ''}
                      {property.owner?.user_type === 'agent' ? t('propertyDetail.agent') : t('propertyDetail.owner')}
                    </p>
                  </div>
                </div>
                {/* Action buttons - grid on mobile */}
                {!showViewingForm && (
                  <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto mt-3 md:mt-0">
                    {/* Write to owner button */}
                    <button
                      onClick={handleWriteToOwner}
                      className="px-3 md:px-4 py-2.5 md:py-2 rounded-full text-[11px] md:text-[12px] font-semibold font-body transition-all duration-200 flex items-center justify-center gap-1.5 border"
                      style={{
                        backgroundColor: 'transparent',
                        borderColor: '#0A6045',
                        color: '#0A6045',
                      }}
                    >
                      <MessageSquare size={14} />
                      <span className="hidden md:inline">{t('propertyDetail.writeToOwner') || 'Написать'}</span>
                      <span className="md:hidden">Написать</span>
                    </button>

                    {/* Schedule viewing button */}
                    <button
                      onClick={() => {
                        if (hasExistingViewing) return;
                        if (isLoggedIn) {
                          setShowViewingForm(true);
                        } else {
                          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                        }
                      }}
                      disabled={hasExistingViewing}
                      className="px-3 md:px-4 py-2.5 md:py-2 rounded-full text-[11px] md:text-[12px] font-semibold font-body transition-all duration-200 flex items-center justify-center gap-1.5"
                      style={{
                        backgroundColor: hasExistingViewing ? '#9CA3AF' : '#0A6045',
                        color: '#FFF',
                        cursor: hasExistingViewing ? 'not-allowed' : 'pointer',
                        opacity: hasExistingViewing ? 0.6 : 1
                      }}
                    >
                      <CalendarPlus size={14} />
                      <span className="hidden md:inline">{hasExistingViewing ? 'Просмотр запланирован' : (t('requestViewing') || 'Запросить просмотр')}</span>
                      <span className="md:hidden">{hasExistingViewing ? 'Запланировано' : 'Просмотр'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Viewing Request Form */}
              {showViewingForm && property && (
                <div style={{ borderTop: '1px solid rgba(200,196,188,0.25)' }}>
                  <ViewingRequestForm
                    property={property}
                    onSuccess={() => setShowViewingForm(false)}
                    onCancel={() => setShowViewingForm(false)}
                  />
                </div>
              )}
            </div>

            <div className="h-4" />
          </div>

          {/* RIGHT - AI Chat (hidden on mobile) */}
          <div
            className="hidden md:flex flex-col px-5 py-7 overflow-hidden border-l"
            style={{
              minHeight: 0,
              borderColor: 'rgba(200,196,188,0.25)',
              backgroundColor: 'rgba(255,255,255,0.3)',
            }}
          >
            <PropertyAIChat property={property} />
          </div>
          </div>

          {/* Virtual Tour Overlay */}
          {showVirtualTour && (
            <VirtualTour
              propertyId={String(property.id)}
              onClose={() => setShowVirtualTour(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
