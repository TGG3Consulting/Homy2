'use client';

import React, { useState } from 'react';
import { Calendar, Clock, MessageSquare, Send, X, Loader2, CheckCircle, User } from 'lucide-react';
import { useT, getLocalized } from '@/lib/i18n';
import { PropertyShowcase } from '@/lib/types';

interface ViewingRequestFormProps {
  property: PropertyShowcase;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ViewingRequestForm({ property, onSuccess, onCancel }: ViewingRequestFormProps) {
  const { t, lang } = useT();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get localized property title
  const propertyTitle = getLocalized(property.title || property.name, lang);
  const propertyAddress = getLocalized(property.address, lang);
  const agentName = property.owner ? `${property.owner.first_name} ${property.owner.last_name}` : (t('viewingRequest.defaultAgent') || 'Property Agent');

  // Generate time slots
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedDate || !selectedTime) {
      setError(t('viewingRequest.selectDateTime') || 'Please select date and time');
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`);

      const response = await fetch('/api/viewings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          propertyId: property.id,
          scheduledAt: scheduledAt.toISOString(),
          message: message || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request viewing');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request viewing');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
             style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
          <CheckCircle size={32} style={{ color: '#22c55e' }} />
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: '#1A1A1A' }}>
          {t('viewingRequest.success') || 'Viewing Request Sent!'}
        </h3>
        <p className="text-sm" style={{ color: '#757570' }}>
          {t('viewingRequest.successMessage') || 'The property owner will review your request and respond soon.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[15px] font-semibold" style={{ color: '#1A1A1A' }}>
          {t('viewingRequest.title') || 'Request a Viewing'}
        </h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} style={{ color: '#757570' }} />
          </button>
        )}
      </div>

      {/* Property Info (readonly) */}
      <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(10, 96, 69, 0.04)', border: '1px solid rgba(10, 96, 69, 0.1)' }}>
        <p className="text-[13px] font-medium" style={{ color: '#1A1A1A' }}>{propertyTitle}</p>
        <p className="text-[11px]" style={{ color: '#757570' }}>{propertyAddress}</p>
      </div>

      {/* Agent Info (readonly) */}
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(200, 196, 188, 0.25)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(10, 96, 69, 0.1)' }}>
          <User size={14} style={{ color: '#0A6045' }} />
        </div>
        <div>
          <p className="text-[12px] font-medium" style={{ color: '#1A1A1A' }}>{agentName}</p>
          <p className="text-[10px]" style={{ color: '#A09D96' }}>
            {property.owner?.user_type === 'agent' ? t('propertyDetail.agent') || 'Agent' : t('propertyDetail.owner') || 'Owner'}
          </p>
        </div>
      </div>

      {/* Date & Time Selection */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-medium mb-1.5 block" style={{ color: '#757570' }}>
            <Calendar size={12} className="inline mr-1" />
            {t('viewingRequest.date') || 'Date'}
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={getMinDate()}
            className="w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              border: '1px solid rgba(200, 196, 188, 0.4)',
              color: '#1A1A1A',
            }}
            required
          />
        </div>
        <div>
          <label className="text-[11px] font-medium mb-1.5 block" style={{ color: '#757570' }}>
            <Clock size={12} className="inline mr-1" />
            {t('viewingRequest.time') || 'Time'}
          </label>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              border: '1px solid rgba(200, 196, 188, 0.4)',
              color: '#1A1A1A',
            }}
            required
          >
            <option value="">{t('viewingRequest.selectTime') || 'Select time'}</option>
            {timeSlots.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Message (optional) */}
      <div>
        <label className="text-[11px] font-medium mb-1.5 block" style={{ color: '#757570' }}>
          <MessageSquare size={12} className="inline mr-1" />
          {t('viewingRequest.message') || 'Message (optional)'}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('viewingRequest.messagePlaceholder') || 'Any special requests or questions...'}
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-[13px] outline-none resize-none transition-all"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            border: '1px solid rgba(200, 196, 188, 0.4)',
            color: '#1A1A1A',
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg text-[12px]" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !selectedDate || !selectedTime}
        className="w-full py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ backgroundColor: '#0A6045', color: '#FFF' }}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {t('viewingRequest.sending') || 'Sending...'}
          </>
        ) : (
          <>
            <Send size={14} />
            {t('viewingRequest.send') || 'Send Request'}
          </>
        )}
      </button>
    </form>
  );
}
