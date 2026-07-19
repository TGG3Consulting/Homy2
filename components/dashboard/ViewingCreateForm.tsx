'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar,
  Clock,
  Home,
  User,
  Mail,
  Phone,
  MessageSquare,
  Search,
  X,
  Check,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Plus,
} from 'lucide-react';
import { useT, getLocalized } from '@/lib/i18n';

// Types
interface Property {
  id: string;
  title: string;
  address: string | null;
  district: string | null;
  imageUrl: string | null;
  images: string[];
  price: number | null;
  currency: string;
}

interface UserSuggestion {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
}

type UserType = 'buyer' | 'renter' | 'owner' | 'agent' | 'consultant';

interface ViewingCreateFormProps {
  onSuccess?: (viewing: CreatedViewing) => void;
  onCancel?: () => void;
  preselectedPropertyId?: string;
  className?: string;
  userType?: UserType;
  lockSelection?: boolean; // Lock property and client fields (non-editable)
}

interface CreatedViewing {
  id: string;
  propertyId: string;
  scheduledAt: string;
  status: string;
  message: string | null;
  createdById?: string;
  property: {
    id: string;
    title: string;
    address: string | null;
  };
  client: {
    id: string;
    email: string;
    name: string | null;
  };
}

// Glass morphism styles
const glassStyles = {
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
  } as React.CSSProperties,
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
  } as React.CSSProperties,
  inputFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(10, 96, 69, 0.3)',
    boxShadow: '0 0 0 3px rgba(10, 96, 69, 0.1)',
  } as React.CSSProperties,
  dropdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
  } as React.CSSProperties,
};

// Time slots for the day
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00',
];

// Helper functions
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getMonthDays(year: number, month: number): { date: Date; isCurrentMonth: boolean }[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Add days from previous month to fill the first week
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({ date, isCurrentMonth: false });
  }

  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i);
    days.push({ date, isCurrentMonth: true });
  }

  // Add days from next month to fill the last week
  const remainingDays = 42 - days.length; // 6 weeks * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push({ date, isCurrentMonth: false });
  }

  return days;
}

// Translation keys
const translations = {
  en: {
    title: 'Schedule Viewing',
    titleClient: 'Request Viewing',
    subtitle: 'Create a viewing appointment for a client',
    subtitleClient: 'Request a property viewing',
    selectProperty: 'Select Property',
    searchProperties: 'Search properties...',
    noProperties: 'No properties found',
    loadingProperties: 'Loading properties...',
    clientInfo: 'Client Information',
    clientEmail: 'Client Email',
    clientEmailPlaceholder: 'Enter client email address',
    searchingUsers: 'Searching...',
    noUsersFound: 'No users found with this email',
    selectDate: 'Select Date',
    selectTime: 'Select Time',
    message: 'Message (Optional)',
    messagePlaceholder: 'Add a note for the client about this viewing...',
    messagePlaceholderClient: 'Add a note for the agent about this viewing...',
    createViewing: 'Create Viewing',
    requestViewing: 'Request Viewing',
    creating: 'Creating...',
    requesting: 'Requesting...',
    cancel: 'Cancel',
    success: 'Viewing created successfully!',
    successAgentCreated: 'Viewing created. Awaiting client confirmation.',
    successClientCreated: 'Viewing request sent. Awaiting confirmation.',
    error: 'Failed to create viewing',
    requiredField: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    pastDate: 'Cannot select a past date',
    today: 'Today',
    weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
  ru: {
    title: 'Назначить просмотр',
    titleClient: 'Запросить просмотр',
    subtitle: 'Создать запись на просмотр для клиента',
    subtitleClient: 'Запросить просмотр объекта',
    selectProperty: 'Выберите объект',
    searchProperties: 'Поиск объектов...',
    noProperties: 'Объекты не найдены',
    loadingProperties: 'Загрузка объектов...',
    clientInfo: 'Информация о клиенте',
    clientEmail: 'Email клиента',
    clientEmailPlaceholder: 'Введите email адрес клиента',
    searchingUsers: 'Поиск...',
    noUsersFound: 'Пользователь с таким email не найден',
    selectDate: 'Выберите дату',
    selectTime: 'Выберите время',
    message: 'Сообщение (необязательно)',
    messagePlaceholder: 'Добавьте заметку для клиента о просмотре...',
    messagePlaceholderClient: 'Добавьте заметку для агента о просмотре...',
    createViewing: 'Создать просмотр',
    requestViewing: 'Запросить просмотр',
    creating: 'Создание...',
    requesting: 'Отправка...',
    cancel: 'Отмена',
    success: 'Просмотр успешно создан!',
    successAgentCreated: 'Просмотр создан. Ожидает подтверждения клиента.',
    successClientCreated: 'Запрос на просмотр отправлен. Ожидает подтверждения.',
    error: 'Не удалось создать просмотр',
    requiredField: 'Это поле обязательно',
    invalidEmail: 'Введите корректный email адрес',
    pastDate: 'Нельзя выбрать прошедшую дату',
    today: 'Сегодня',
    weekDays: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  },
  hy: {
    title: 'Schedule Viewing',
    titleClient: 'Request Viewing',
    subtitle: 'Create a viewing appointment for a client',
    subtitleClient: 'Request a property viewing',
    selectProperty: 'Select Property',
    searchProperties: 'Search properties...',
    noProperties: 'No properties found',
    loadingProperties: 'Loading properties...',
    clientInfo: 'Client Information',
    clientEmail: 'Client Email',
    clientEmailPlaceholder: 'Enter client email address',
    searchingUsers: 'Searching...',
    noUsersFound: 'No users found with this email',
    selectDate: 'Select Date',
    selectTime: 'Select Time',
    message: 'Message (Optional)',
    messagePlaceholder: 'Add a note for the client about this viewing...',
    messagePlaceholderClient: 'Add a note for the agent about this viewing...',
    createViewing: 'Create Viewing',
    requestViewing: 'Request Viewing',
    creating: 'Creating...',
    requesting: 'Requesting...',
    cancel: 'Cancel',
    success: 'Viewing created successfully!',
    successAgentCreated: 'Viewing created. Awaiting client confirmation.',
    successClientCreated: 'Viewing request sent. Awaiting confirmation.',
    error: 'Failed to create viewing',
    requiredField: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    pastDate: 'Cannot select a past date',
    today: 'Today',
    weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
};

export default function ViewingCreateForm({
  onSuccess,
  onCancel,
  preselectedPropertyId,
  className = '',
  userType,
  lockSelection = false,
}: ViewingCreateFormProps) {
  const { lang } = useT();
  const t = translations[lang] || translations.en;

  // Determine if user is a client (buyer/renter) or agent/owner
  const isClient = userType === 'buyer' || userType === 'renter';
  const isAgentOrOwner = userType === 'owner' || userType === 'agent';

  // Form state
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [clientEmail, setClientEmail] = useState('');
  const [selectedClient, setSelectedClient] = useState<UserSuggestion | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // UI state
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertySearchQuery, setPropertySearchQuery] = useState('');
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Refs
  const propertyDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const userSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch properties on mount
  useEffect(() => {
    const fetchProperties = async () => {
      setPropertiesLoading(true);
      try {
        // For clients (buyers/renters): fetch all properties from /api/properties
        // For agents/owners: fetch their own properties from /api/users/me/properties
        const apiUrl = isClient ? '/api/properties?limit=100' : '/api/users/me/properties';
        const response = await fetch(apiUrl, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          // Handle different response structures
          const props = isClient
            ? (data.properties || data.listings || [])
            : (data.properties || []);

          setProperties(props.map((p: Record<string, unknown>) => ({
            id: p.id as string,
            title: p.title as string || 'Untitled Property',
            address: p.address as string || null,
            district: p.district as string || null,
            imageUrl: p.imageUrl as string || (p.images as string[])?.[0] || null,
            images: (p.images as string[]) || [],
            price: p.price as number || null,
            currency: p.currency as string || 'AMD',
          })));

          // If preselected property ID is provided, select it
          if (preselectedPropertyId && props.length > 0) {
            const preselected = props.find((p: Record<string, unknown>) => p.id === preselectedPropertyId);
            if (preselected) {
              setSelectedProperty({
                id: preselected.id as string,
                title: preselected.title as string || 'Untitled Property',
                address: preselected.address as string || null,
                district: preselected.district as string || null,
                imageUrl: preselected.imageUrl as string || (preselected.images as string[])?.[0] || null,
                images: (preselected.images as string[]) || [],
                price: preselected.price as number || null,
                currency: preselected.currency as string || 'AMD',
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch properties:', error);
      } finally {
        setPropertiesLoading(false);
      }
    };

    fetchProperties();
  }, [preselectedPropertyId, isClient]);

  // Search users by email
  const searchUsers = useCallback(async (email: string) => {
    if (email.length < 3) {
      setUserSuggestions([]);
      return;
    }

    setUserSearchLoading(true);
    try {
      // Search for users by email (you may need to create this endpoint)
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(email)}&limit=5`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const users = data.users || data || [];
        setUserSuggestions(users.map((u: Record<string, unknown>) => ({
          id: u.id as string,
          email: u.email as string,
          name: u.name as string || null,
          phone: u.phone as string || null,
        })));
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setUserSearchLoading(false);
    }
  }, []);

  // Debounced user search
  useEffect(() => {
    if (userSearchTimeoutRef.current) {
      clearTimeout(userSearchTimeoutRef.current);
    }

    if (clientEmail && !selectedClient) {
      userSearchTimeoutRef.current = setTimeout(() => {
        searchUsers(clientEmail);
      }, 300);
    }

    return () => {
      if (userSearchTimeoutRef.current) {
        clearTimeout(userSearchTimeoutRef.current);
      }
    };
  }, [clientEmail, selectedClient, searchUsers]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (propertyDropdownRef.current && !propertyDropdownRef.current.contains(event.target as Node)) {
        setShowPropertyDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter properties based on search query
  const filteredProperties = properties.filter(p =>
    p.title.toLowerCase().includes(propertySearchQuery.toLowerCase()) ||
    (p.address && p.address.toLowerCase().includes(propertySearchQuery.toLowerCase())) ||
    (p.district && p.district.toLowerCase().includes(propertySearchQuery.toLowerCase()))
  );

  // Generate calendar days
  const calendarDays = getMonthDays(calendarYear, calendarMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Navigation handlers
  const goToPreviousMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  // State for success message customization
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validation
    if (!selectedProperty) {
      setSubmitError(t.requiredField);
      return;
    }

    // For agents/owners: require client email
    // For clients: they are the client themselves, no email needed
    if (isAgentOrOwner && !selectedClient && !clientEmail) {
      setSubmitError(t.requiredField);
      return;
    }

    if (!selectedDate || !selectedTime) {
      setSubmitError(t.requiredField);
      return;
    }

    // Build scheduled datetime
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(hours, minutes, 0, 0);

    setIsSubmitting(true);

    try {
      // Build request body based on user type
      const requestBody: Record<string, unknown> = {
        propertyId: selectedProperty.id,
        scheduledAt: scheduledAt.toISOString(),
        message: message || null,
      };

      // For agents/owners: include client information
      // For clients: backend will use the authenticated user as the client
      if (isAgentOrOwner) {
        requestBody.clientEmail = selectedClient?.email || clientEmail;
        if (selectedClient?.id) {
          // The API expects `clientId` (direct user lookup, faster than the
          // email fallback). Historically this was sent as `clientUserId`
          // and silently ignored.
          requestBody.clientId = selectedClient.id;
        }
      }

      const response = await fetch('/api/viewings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error || t.error);
        return;
      }

      // Set appropriate success message based on who created
      if (isAgentOrOwner) {
        setSuccessMessage(t.successAgentCreated);
      } else {
        setSuccessMessage(t.successClientCreated);
      }

      setSubmitSuccess(true);

      if (onSuccess) {
        onSuccess(data.viewing);
      }

      // Reset form after short delay
      setTimeout(() => {
        setSelectedProperty(null);
        setClientEmail('');
        setSelectedClient(null);
        setSelectedDate(null);
        setSelectedTime(null);
        setMessage('');
        setSubmitSuccess(false);
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      console.error('Failed to create viewing:', error);
      setSubmitError(t.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (submitSuccess) {
    return (
      <div className={`rounded-2xl p-8 text-center ${className}`} style={glassStyles.card}>
        <div
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}
        >
          <CheckCircle size={32} style={{ color: '#22C55E' }} />
        </div>
        <h3 className="text-lg font-semibold font-body mb-2" style={{ color: '#1A1A1A' }}>
          {successMessage || t.success}
        </h3>
        <p className="text-sm font-body" style={{ color: '#757570' }}>
          {selectedProperty ? getLocalized(selectedProperty.title, lang) : ''}
        </p>
        {selectedDate && selectedTime && (
          <p className="text-sm font-body mt-1" style={{ color: '#0A6045' }}>
            {formatDate(selectedDate)} at {selectedTime}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold font-body" style={{ color: '#1A1A1A' }}>
            {isClient ? t.titleClient : t.title}
          </h2>
          <p className="text-sm font-body mt-0.5" style={{ color: '#757570' }}>
            {isClient ? t.subtitleClient : t.subtitle}
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
          >
            <X size={18} style={{ color: '#757570' }} />
          </button>
        )}
      </div>

      {/* Property Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium font-body" style={{ color: '#3D3B37' }}>
          {t.selectProperty} <span style={{ color: '#DC2626' }}>*</span>
        </label>
        <div className="relative" ref={propertyDropdownRef}>
          <div
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${lockSelection ? '' : 'cursor-pointer'}`}
            onClick={() => !lockSelection && setShowPropertyDropdown(!showPropertyDropdown)}
            style={{
              ...(focusedField === 'property' ? glassStyles.inputFocused : glassStyles.input),
              ...(lockSelection ? { opacity: 0.8, cursor: 'default' } : {}),
            }}
          >
            {selectedProperty ? (
              <>
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${selectedProperty.imageUrl || selectedProperty.images?.[0] || '/placeholder-property.jpg'})`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium font-body truncate" style={{ color: '#1A1A1A' }}>
                    {getLocalized(selectedProperty.title, lang)}
                  </p>
                  {selectedProperty.address && (
                    <p className="text-xs font-body truncate" style={{ color: '#757570' }}>
                      {selectedProperty.address}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(10, 96, 69, 0.1)' }}
                >
                  <Home size={18} style={{ color: '#0A6045' }} />
                </div>
                <span className="text-sm font-body" style={{ color: '#757570' }}>
                  {t.selectProperty}
                </span>
              </>
            )}
            {!lockSelection && (
              <ChevronDown
                size={16}
                style={{ color: '#757570' }}
                className={`flex-shrink-0 transition-transform duration-200 ${showPropertyDropdown ? 'rotate-180' : ''}`}
              />
            )}
          </div>

          {/* Property Dropdown */}
          {showPropertyDropdown && !lockSelection && (
            <div
              className="absolute top-full left-0 right-0 mt-2 rounded-xl z-50 overflow-hidden"
              style={glassStyles.dropdown}
            >
              {/* Search input */}
              <div className="p-3 border-b" style={{ borderColor: 'rgba(0, 0, 0, 0.06)' }}>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#757570' }} />
                  <input
                    type="text"
                    value={propertySearchQuery}
                    onChange={(e) => setPropertySearchQuery(e.target.value)}
                    placeholder={t.searchProperties}
                    className="w-full pl-9 pr-3 py-2 rounded-lg text-sm font-body outline-none"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.03)',
                      color: '#1A1A1A',
                    }}
                  />
                </div>
              </div>

              {/* Property list */}
              <div className="max-h-60 overflow-y-auto">
                {propertiesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin" style={{ color: '#0A6045' }} />
                    <span className="ml-2 text-sm font-body" style={{ color: '#757570' }}>
                      {t.loadingProperties}
                    </span>
                  </div>
                ) : filteredProperties.length === 0 ? (
                  <div className="py-8 text-center">
                    <Home size={24} className="mx-auto mb-2" style={{ color: '#B5B3AD' }} />
                    <p className="text-sm font-body" style={{ color: '#757570' }}>
                      {t.noProperties}
                    </p>
                  </div>
                ) : (
                  filteredProperties.map((property) => (
                    <button
                      key={property.id}
                      type="button"
                      onClick={() => {
                        setSelectedProperty(property);
                        setShowPropertyDropdown(false);
                        setPropertySearchQuery('');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/3 text-left"
                    >
                      <div
                        className="w-12 h-12 rounded-lg flex-shrink-0 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${property.imageUrl || property.images?.[0] || '/placeholder-property.jpg'})`,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium font-body truncate" style={{ color: '#1A1A1A' }}>
                          {getLocalized(property.title, lang)}
                        </p>
                        {property.address && (
                          <p className="text-xs font-body truncate" style={{ color: '#757570' }}>
                            {getLocalized(property.address, lang)}
                          </p>
                        )}
                        {property.price && (
                          <p className="text-xs font-body mt-0.5" style={{ color: '#0A6045' }}>
                            {property.price.toLocaleString()} {property.currency}
                          </p>
                        )}
                      </div>
                      {selectedProperty?.id === property.id && (
                        <Check size={16} style={{ color: '#0A6045' }} />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client Information - Only show for agents/owners */}
      {isAgentOrOwner && (
        <div className="space-y-2">
          <label className="text-sm font-medium font-body" style={{ color: '#3D3B37' }}>
            {t.clientEmail} <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <div className="relative" ref={userDropdownRef}>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#757570' }} />
              <input
                ref={emailInputRef}
                type="email"
                value={selectedClient ? selectedClient.email : clientEmail}
                onChange={(e) => {
                  setClientEmail(e.target.value);
                  setSelectedClient(null);
                  setShowUserSuggestions(true);
                }}
                onFocus={() => {
                  setFocusedField('email');
                  if (clientEmail.length >= 3) {
                    setShowUserSuggestions(true);
                  }
                }}
                onBlur={() => setFocusedField(null)}
                placeholder={t.clientEmailPlaceholder}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm font-body outline-none transition-all duration-200"
                style={focusedField === 'email' ? glassStyles.inputFocused : glassStyles.input}
              />
              {selectedClient && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(null);
                    setClientEmail('');
                    emailInputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/5"
                >
                  <X size={14} style={{ color: '#757570' }} />
                </button>
              )}
            </div>

            {/* User Suggestions Dropdown */}
            {showUserSuggestions && (userSearchLoading || userSuggestions.length > 0 || clientEmail.length >= 3) && (
              <div
                className="absolute top-full left-0 right-0 mt-2 rounded-xl z-50 overflow-hidden"
                style={glassStyles.dropdown}
              >
                {userSearchLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={16} className="animate-spin" style={{ color: '#0A6045' }} />
                    <span className="ml-2 text-sm font-body" style={{ color: '#757570' }}>
                      {t.searchingUsers}
                    </span>
                  </div>
                ) : userSuggestions.length === 0 ? (
                  <div className="py-4 px-4 text-center">
                    <p className="text-sm font-body" style={{ color: '#757570' }}>
                      {t.noUsersFound}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto">
                    {userSuggestions.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedClient(user);
                          setShowUserSuggestions(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/3 text-left"
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'rgba(10, 96, 69, 0.1)' }}
                        >
                          <User size={16} style={{ color: '#0A6045' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium font-body truncate" style={{ color: '#1A1A1A' }}>
                            {user.name || user.email}
                          </p>
                          {user.name && (
                            <p className="text-xs font-body truncate" style={{ color: '#757570' }}>
                              {user.email}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected client info */}
          {selectedClient && (
            <div
              className="flex items-center gap-3 px-4 py-2 rounded-lg mt-2"
              style={{ backgroundColor: 'rgba(10, 96, 69, 0.06)' }}
            >
              <CheckCircle size={14} style={{ color: '#0A6045' }} />
              <span className="text-xs font-body" style={{ color: '#0A6045' }}>
                {selectedClient.name || selectedClient.email}
                {selectedClient.phone && ` - ${selectedClient.phone}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Date & Time Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Calendar */}
        <div className="space-y-2">
          <label className="text-sm font-medium font-body" style={{ color: '#3D3B37' }}>
            {t.selectDate} <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <div className="rounded-xl p-4" style={glassStyles.input}>
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors"
              >
                <ChevronLeft size={16} style={{ color: '#757570' }} />
              </button>
              <span className="text-sm font-semibold font-body" style={{ color: '#1A1A1A' }}>
                {t.months[calendarMonth]} {calendarYear}
              </span>
              <button
                type="button"
                onClick={goToNextMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors"
              >
                <ChevronRight size={16} style={{ color: '#757570' }} />
              </button>
            </div>

            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {t.weekDays.map((day, i) => (
                <div
                  key={i}
                  className="text-center text-xs font-body py-1"
                  style={{ color: '#757570' }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const isToday = day.date.toDateString() === today.toDateString();
                const isPast = day.date < today;
                const isSelected = selectedDate?.toDateString() === day.date.toDateString();

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => !isPast && day.isCurrentMonth && setSelectedDate(day.date)}
                    disabled={isPast || !day.isCurrentMonth}
                    className={`
                      aspect-square rounded-lg text-xs font-body font-medium
                      transition-all duration-200 flex items-center justify-center
                      ${isSelected ? 'scale-105' : ''}
                      ${!day.isCurrentMonth ? 'opacity-30' : ''}
                      ${isPast ? 'cursor-not-allowed opacity-40' : 'hover:scale-105'}
                    `}
                    style={{
                      backgroundColor: isSelected
                        ? '#0A6045'
                        : isToday
                          ? 'rgba(10, 96, 69, 0.15)'
                          : 'transparent',
                      color: isSelected
                        ? '#FFF'
                        : isToday
                          ? '#0A6045'
                          : isPast
                            ? '#B5B3AD'
                            : '#3D3B37',
                    }}
                  >
                    {day.date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Selected date display */}
            {selectedDate && (
              <div
                className="mt-3 pt-3 border-t text-center"
                style={{ borderColor: 'rgba(0, 0, 0, 0.06)' }}
              >
                <p className="text-sm font-medium font-body" style={{ color: '#0A6045' }}>
                  {formatDate(selectedDate)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Time slots */}
        <div className="space-y-2">
          <label className="text-sm font-medium font-body" style={{ color: '#3D3B37' }}>
            {t.selectTime} <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <div
            className="rounded-xl p-4 max-h-[300px] overflow-y-auto"
            style={glassStyles.input}
          >
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((time) => {
                const isSelected = selectedTime === time;
                const [hours] = time.split(':').map(Number);
                const isPastTime = selectedDate?.toDateString() === today.toDateString() && hours <= new Date().getHours();

                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => !isPastTime && setSelectedTime(time)}
                    disabled={isPastTime}
                    className={`
                      py-2 px-3 rounded-lg text-sm font-body font-medium
                      transition-all duration-200
                      ${isSelected ? 'scale-105' : ''}
                      ${isPastTime ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'}
                    `}
                    style={{
                      backgroundColor: isSelected
                        ? '#0A6045'
                        : 'rgba(0, 0, 0, 0.03)',
                      color: isSelected
                        ? '#FFF'
                        : isPastTime
                          ? '#B5B3AD'
                          : '#3D3B37',
                    }}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="space-y-2">
        <label className="text-sm font-medium font-body" style={{ color: '#3D3B37' }}>
          {t.message}
        </label>
        <div className="relative">
          <MessageSquare size={16} className="absolute left-4 top-4" style={{ color: '#757570' }} />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setFocusedField('message')}
            onBlur={() => setFocusedField(null)}
            placeholder={isClient ? t.messagePlaceholderClient : t.messagePlaceholder}
            rows={3}
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm font-body outline-none resize-none transition-all duration-200"
            style={focusedField === 'message' ? glassStyles.inputFocused : glassStyles.input}
          />
        </div>
      </div>

      {/* Error message */}
      {submitError && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <AlertCircle size={18} style={{ color: '#DC2626' }} />
          <p className="text-sm font-body" style={{ color: '#DC2626' }}>
            {submitError}
          </p>
        </div>
      )}

      {/* Submit buttons */}
      <div className="flex items-center gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-6 rounded-xl text-sm font-medium font-body transition-all duration-200 hover:bg-black/5"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.03)',
              color: '#757570',
              border: '1px solid rgba(0, 0, 0, 0.06)',
            }}
          >
            {t.cancel}
          </button>
        )}
        <button
          type="submit"
          disabled={
            isSubmitting ||
            !selectedProperty ||
            (isAgentOrOwner && !selectedClient && !clientEmail) ||
            !selectedDate ||
            !selectedTime
          }
          className="flex-1 py-3 px-6 rounded-xl text-sm font-semibold font-body transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            backgroundColor: '#0A6045',
            color: '#FFF',
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {isClient ? t.requesting : t.creating}
            </>
          ) : (
            <>
              <Plus size={16} />
              {isClient ? t.requestViewing : t.createViewing}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
