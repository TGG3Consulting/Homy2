'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  User,
  Mail,
  Phone,
  Globe,
  Bell,
  MapPin,
  DollarSign,
  Home,
  Lock,
  Trash2,
  Save,
  X,
  Edit2,
  Check,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Camera,
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// Types
interface UserData {
  id: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  patronymic: string | null;
  user_type: string | null;
  language_preference: string | null;
  notifications_enabled: boolean;
  email_verified: boolean;
  created_at: string;
  search_preferences: {
    preferred_districts: string[];
    budget_min: number | null;
    budget_max: number | null;
    room_count_min: number | null;
    room_count_max: number | null;
  };
}

interface FormErrors {
  [key: string]: string;
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

// Glass morphism styles
const glassCard: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.45)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.6)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
};

const glassInput: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(0, 0, 0, 0.08)',
};

// Toast component
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-right-5 fade-in duration-300',
            toast.type === 'success' && 'bg-green-50 border border-green-200 text-green-800',
            toast.type === 'error' && 'bg-red-50 border border-red-200 text-red-800'
          )}
          style={{ backdropFilter: 'blur(8px)' }}
        >
          {toast.type === 'success' ? (
            <Check size={18} className="text-green-600" />
          ) : (
            <AlertTriangle size={18} className="text-red-600" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-2 p-1 rounded-full hover:bg-black/5 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// Section header component
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: 'rgba(10, 96, 69, 0.1)' }}
      >
        <Icon size={16} style={{ color: 'rgb(10, 96, 69)' }} />
      </div>
      <h3 className="text-[15px] font-semibold" style={{ color: '#1A1A1A' }}>
        {title}
      </h3>
    </div>
  );
}

// Form field component
function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  disabled,
  icon: Icon,
  options,
  showPasswordToggle,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'password' | 'select' | 'number';
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  icon?: React.ElementType;
  options?: { value: string; label: string }[];
  showPasswordToggle?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-medium" style={{ color: '#5C5A55' }}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: '#A09D96' }}
          />
        )}
        {type === 'select' && options ? (
          <select
            name={name}
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            disabled={disabled}
            className={cn(
              'w-full h-10 rounded-lg text-[13px] transition-all outline-none',
              Icon ? 'pl-10 pr-4' : 'px-4',
              disabled && 'opacity-60 cursor-not-allowed',
              error && 'ring-2 ring-red-500/30'
            )}
            style={glassInput}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input
              type={showPasswordToggle && showPassword ? 'text' : type}
              name={name}
              value={value}
              onChange={(e) => onChange(name, e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                'w-full h-10 rounded-lg text-[13px] transition-all outline-none focus:ring-2 focus:ring-emerald-500/30',
                Icon ? 'pl-10' : 'pl-4',
                showPasswordToggle ? 'pr-10' : 'pr-4',
                disabled && 'opacity-60 cursor-not-allowed',
                error && 'ring-2 ring-red-500/30'
              )}
              style={glassInput}
            />
            {showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/5 transition-colors"
              >
                {showPassword ? (
                  <EyeOff size={16} style={{ color: '#A09D96' }} />
                ) : (
                  <Eye size={16} style={{ color: '#A09D96' }} />
                )}
              </button>
            )}
          </>
        )}
      </div>
      {error && (
        <p className="text-[11px] text-red-600 flex items-center gap-1">
          <AlertTriangle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}

// District chip component
function DistrictChip({
  district,
  selected,
  onClick,
  disabled,
}: {
  district: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-3 py-1.5 rounded-full text-[12px] font-medium transition-all',
        selected
          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
          : 'bg-white/50 text-gray-600 border border-gray-200 hover:border-emerald-300',
        disabled && 'opacity-60 cursor-not-allowed'
      )}
    >
      {district}
    </button>
  );
}

// Main component
export default function UserSettings() {
  const { t, lang } = useT();

  // State
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    patronymic: '',
    phone: '',
    user_type: 'buyer',
    language_preference: 'en',
    notifications_enabled: true,
    preferred_districts: [] as string[],
    budget_min: '',
    budget_max: '',
    room_count_min: '',
    room_count_max: '',
  });

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteData, setDeleteData] = useState({
    password: '',
    confirmation: '',
  });

  // Armenian districts
  const armenianDistricts = [
    'Kentron',
    'Arabkir',
    'Davtashen',
    'Ajapnyak',
    'Avan',
    'Erebuni',
    'Malatia-Sebastia',
    'Nor Nork',
    'Nork-Marash',
    'Nubarashen',
    'Shengavit',
    'Kanaker-Zeytun',
  ];

  // Toast helpers
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch('/api/users/me', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      if (data.success && data.user) {
        setUserData(data.user);
        setFormData({
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          patronymic: data.user.patronymic || '',
          phone: data.user.phone || '',
          user_type: data.user.user_type || 'buyer',
          language_preference: data.user.language_preference || 'en',
          notifications_enabled: data.user.notifications_enabled ?? true,
          preferred_districts: data.user.search_preferences?.preferred_districts || [],
          budget_min: data.user.search_preferences?.budget_min?.toString() || '',
          budget_max: data.user.search_preferences?.budget_max?.toString() || '',
          room_count_min: data.user.search_preferences?.room_count_min?.toString() || '',
          room_count_max: data.user.search_preferences?.room_count_max?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      showToast('error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Handle form field change
  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle district toggle
  const handleDistrictToggle = (district: string) => {
    setFormData((prev) => ({
      ...prev,
      preferred_districts: prev.preferred_districts.includes(district)
        ? prev.preferred_districts.filter((d) => d !== district)
        : [...prev.preferred_districts, district],
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (formData.phone && !/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (formData.budget_min && formData.budget_max) {
      const min = parseInt(formData.budget_min);
      const max = parseInt(formData.budget_max);
      if (min > max) {
        newErrors.budget_min = 'Minimum budget cannot exceed maximum';
      }
    }

    if (formData.room_count_min && formData.room_count_max) {
      const min = parseInt(formData.room_count_min);
      const max = parseInt(formData.room_count_max);
      if (min > max) {
        newErrors.room_count_min = 'Minimum rooms cannot exceed maximum';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save changes
  const handleSave = async () => {
    if (!validateForm()) {
      showToast('error', 'Please fix the errors before saving');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          patronymic: formData.patronymic || null,
          phone: formData.phone || null,
          user_type: formData.user_type,
          language_preference: formData.language_preference,
          notifications_enabled: formData.notifications_enabled,
          search_preferences: {
            preferred_districts: formData.preferred_districts || [],
            budget_min: formData.budget_min ? parseInt(formData.budget_min) : null,
            budget_max: formData.budget_max ? parseInt(formData.budget_max) : null,
            room_count_min: formData.room_count_min ? parseInt(formData.room_count_min) : null,
            room_count_max: formData.room_count_max ? parseInt(formData.room_count_max) : null,
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
          showToast('error', 'Please fix the validation errors');
        } else {
          showToast('error', data.error || 'Failed to save changes');
        }
        return;
      }

      setUserData(data.user);
      setIsEditing(false);
      showToast('success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving user data:', error);
      showToast('error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Upload avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('/api/users/me/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        showToast('error', data.error || 'Failed to upload avatar');
        return;
      }

      setUserData((prev) => prev ? { ...prev, avatar_url: data.avatar_url } : null);
      showToast('success', t('userSettings.avatarUpdated') || 'Avatar updated');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showToast('error', 'Failed to upload avatar');
    }
  };

  // Change password
  const handlePasswordChange = async () => {
    const newErrors: FormErrors = {};

    if (!passwordData.current_password) {
      newErrors.current_password = 'Current password is required';
    }
    if (!passwordData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (passwordData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(passwordData.new_password)) {
      newErrors.new_password = 'Password must contain an uppercase letter';
    } else if (!/[0-9]/.test(passwordData.new_password)) {
      newErrors.new_password = 'Password must contain a number';
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          showToast('error', data.error || 'Failed to change password');
        }
        return;
      }

      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setShowPasswordChange(false);
      showToast('success', 'Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      showToast('error', 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteData.confirmation !== 'DELETE MY ACCOUNT') {
      setErrors({ confirmation: 'Please type "DELETE MY ACCOUNT" to confirm' });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/users/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          password: deleteData.password,
          confirmation: deleteData.confirmation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast('error', data.error || 'Failed to delete account');
        return;
      }

      // Clear cookies via logout API and redirect
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      showToast('success', 'Account deleted successfully');

      // Redirect to home after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast('error', 'Failed to delete account');
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    if (userData) {
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        patronymic: userData.patronymic || '',
        phone: userData.phone || '',
        user_type: userData.user_type || 'buyer',
        language_preference: userData.language_preference || 'en',
        notifications_enabled: userData.notifications_enabled ?? true,
        preferred_districts: userData.search_preferences?.preferred_districts || [],
        budget_min: userData.search_preferences?.budget_min?.toString() || '',
        budget_max: userData.search_preferences?.budget_max?.toString() || '',
        room_count_min: userData.search_preferences?.room_count_min?.toString() || '',
        room_count_max: userData.search_preferences?.room_count_max?.toString() || '',
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  // User type options
  const userTypeOptions = [
    { value: 'buyer', label: t('userSettings.userTypes.buyer') || 'Buyer' },
    { value: 'renter', label: t('userSettings.userTypes.renter') || 'Renter' },
    { value: 'owner', label: t('userSettings.userTypes.owner') || 'Property Owner' },
    { value: 'agent', label: t('userSettings.userTypes.agent') || 'Agent' },
  ];

  // Language options
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'ru', label: 'Russian' },
    { value: 'hy', label: 'Armenian' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin" style={{ color: 'rgb(10, 96, 69)' }} />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle size={48} style={{ color: '#A09D96' }} />
        <p className="text-[14px]" style={{ color: '#5C5A55' }}>
          {t('userSettings.notLoggedIn') || 'Please log in to view your settings'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-semibold" style={{ color: '#1A1A1A' }}>
          {t('userSettings.title') || 'Account Settings'}
        </h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all hover:shadow-md"
            style={{
              backgroundColor: 'rgb(10, 96, 69)',
              color: '#FFF',
            }}
          >
            <Edit2 size={14} />
            {t('userSettings.edit') || 'Edit'}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all border hover:bg-gray-50"
              style={{ borderColor: 'rgba(0, 0, 0, 0.1)', color: '#5C5A55' }}
            >
              <X size={14} />
              {t('userSettings.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all hover:shadow-md disabled:opacity-60"
              style={{
                backgroundColor: 'rgb(10, 96, 69)',
                color: '#FFF',
              }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {t('userSettings.save') || 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="rounded-2xl p-6" style={glassCard}>
        <SectionHeader icon={User} title={t('userSettings.profile') || 'Profile Information'} />

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center relative group"
            style={{ backgroundColor: 'rgba(10, 96, 69, 0.1)' }}
          >
            {userData.avatar_url ? (
              <Image
                src={userData.avatar_url}
                alt="Avatar"
                width={80}
                height={80}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User size={32} style={{ color: 'rgb(10, 96, 69)' }} />
            )}
            {isEditing && (
              <div
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera size={20} className="text-white" />
              </div>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div>
            <p className="text-[16px] font-semibold" style={{ color: '#1A1A1A' }}>
              {userData.first_name && userData.last_name
                ? `${userData.first_name} ${userData.last_name}`
                : userData.name || userData.email.split('@')[0]}
            </p>
            <p className="text-[13px]" style={{ color: '#757570' }}>
              {userData.email}
            </p>
            {userData.email_verified && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                <Check size={10} />
                {t('userSettings.verified') || 'Verified'}
              </span>
            )}
          </div>
        </div>

        {/* Profile Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label={t('auth.firstName') || 'First Name'}
            name="first_name"
            value={formData.first_name}
            onChange={handleFieldChange}
            type="text"
            placeholder={t('auth.firstName') || 'First Name'}
            icon={User}
            error={errors.first_name}
            disabled={!isEditing}
          />
          <FormField
            label={t('auth.lastName') || 'Last Name'}
            name="last_name"
            value={formData.last_name}
            onChange={handleFieldChange}
            type="text"
            placeholder={t('auth.lastName') || 'Last Name'}
            icon={User}
            error={errors.last_name}
            disabled={!isEditing}
          />
          <FormField
            label={t('auth.patronymic') || 'Patronymic'}
            name="patronymic"
            value={formData.patronymic}
            onChange={handleFieldChange}
            type="text"
            placeholder={t('auth.patronymic') || 'Patronymic'}
            icon={User}
            disabled={!isEditing}
          />
          <FormField
            label={t('userSettings.email') || 'Email'}
            name="email"
            value={userData.email}
            onChange={() => {}}
            type="email"
            icon={Mail}
            disabled
          />
          <FormField
            label={t('userSettings.phone') || 'Phone'}
            name="phone"
            value={formData.phone}
            onChange={handleFieldChange}
            type="tel"
            placeholder="+374 XX XXX XXX"
            icon={Phone}
            error={errors.phone}
            disabled={!isEditing}
          />
        </div>
      </div>

      {/* Preferences Section */}
      <div className="rounded-2xl p-6" style={glassCard}>
        <SectionHeader icon={Globe} title={t('userSettings.preferences') || 'Preferences'} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label={t('userSettings.language') || 'Language'}
            name="language_preference"
            value={formData.language_preference}
            onChange={handleFieldChange}
            type="select"
            options={languageOptions}
            icon={Globe}
            disabled={!isEditing}
          />
          <FormField
            label={t('userSettings.userType') || 'User Type'}
            name="user_type"
            value={formData.user_type}
            onChange={handleFieldChange}
            type="select"
            options={userTypeOptions}
            icon={User}
            disabled={!isEditing}
          />
        </div>

        {/* Notifications Toggle */}
        <div className="mt-4 flex items-center justify-between p-4 rounded-lg" style={glassInput}>
          <div className="flex items-center gap-3">
            <Bell size={16} style={{ color: '#A09D96' }} />
            <div>
              <p className="text-[13px] font-medium" style={{ color: '#1A1A1A' }}>
                {t('userSettings.notifications') || 'Email Notifications'}
              </p>
              <p className="text-[11px]" style={{ color: '#757570' }}>
                {t('userSettings.notificationsDesc') || 'Receive updates about new properties'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => isEditing && setFormData((prev) => ({
              ...prev,
              notifications_enabled: !prev.notifications_enabled,
            }))}
            disabled={!isEditing}
            className={cn(
              'w-11 h-6 rounded-full transition-colors relative',
              formData.notifications_enabled ? 'bg-emerald-500' : 'bg-gray-300',
              !isEditing && 'opacity-60 cursor-not-allowed'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                formData.notifications_enabled ? 'left-5' : 'left-0.5'
              )}
            />
          </button>
        </div>
      </div>

      {/* Search Preferences Section */}
      <div className="rounded-2xl p-6" style={glassCard}>
        <SectionHeader icon={MapPin} title={t('userSettings.searchPreferences') || 'Search Preferences'} />

        {/* Preferred Districts */}
        <div className="mb-6">
          <label className="text-[12px] font-medium mb-2 block" style={{ color: '#5C5A55' }}>
            {t('userSettings.preferredDistricts') || 'Preferred Districts'}
          </label>
          <div className="flex flex-wrap gap-2">
            {armenianDistricts.map((district) => (
              <DistrictChip
                key={district}
                district={district}
                selected={formData.preferred_districts.includes(district)}
                onClick={() => handleDistrictToggle(district)}
                disabled={!isEditing}
              />
            ))}
          </div>
        </div>

        {/* Budget Range */}
        <div className="mb-4">
          <label className="text-[12px] font-medium mb-2 block" style={{ color: '#5C5A55' }}>
            {t('userSettings.budgetRange') || 'Budget Range (USD)'}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t('userSettings.minimum') || 'Minimum'}
              name="budget_min"
              value={formData.budget_min}
              onChange={handleFieldChange}
              type="number"
              placeholder="0"
              icon={DollarSign}
              error={errors.budget_min}
              disabled={!isEditing}
            />
            <FormField
              label={t('userSettings.maximum') || 'Maximum'}
              name="budget_max"
              value={formData.budget_max}
              onChange={handleFieldChange}
              type="number"
              placeholder="1,000,000"
              icon={DollarSign}
              error={errors.budget_max}
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* Room Count */}
        <div>
          <label className="text-[12px] font-medium mb-2 block" style={{ color: '#5C5A55' }}>
            {t('userSettings.roomCount') || 'Room Count'}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t('userSettings.minimum') || 'Minimum'}
              name="room_count_min"
              value={formData.room_count_min}
              onChange={handleFieldChange}
              type="number"
              placeholder="1"
              icon={Home}
              error={errors.room_count_min}
              disabled={!isEditing}
            />
            <FormField
              label={t('userSettings.maximum') || 'Maximum'}
              name="room_count_max"
              value={formData.room_count_max}
              onChange={handleFieldChange}
              type="number"
              placeholder="5+"
              icon={Home}
              error={errors.room_count_max}
              disabled={!isEditing}
            />
          </div>
        </div>
      </div>

      {/* Account Actions Section */}
      <div className="rounded-2xl p-6" style={glassCard}>
        <SectionHeader icon={Lock} title={t('userSettings.accountActions') || 'Account Actions'} />

        {/* Change Password */}
        <div className="mb-4">
          {!showPasswordChange ? (
            <button
              onClick={() => setShowPasswordChange(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all w-full justify-center border hover:bg-gray-50"
              style={{ borderColor: 'rgba(0, 0, 0, 0.1)', color: '#5C5A55' }}
            >
              <Lock size={14} />
              {t('userSettings.changePassword') || 'Change Password'}
            </button>
          ) : (
            <div className="space-y-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
              <FormField
                label={t('userSettings.currentPassword') || 'Current Password'}
                name="current_password"
                value={passwordData.current_password}
                onChange={(name, value) => setPasswordData((prev) => ({ ...prev, [name]: value }))}
                type="password"
                icon={Lock}
                error={errors.current_password}
                showPasswordToggle
              />
              <FormField
                label={t('userSettings.newPassword') || 'New Password'}
                name="new_password"
                value={passwordData.new_password}
                onChange={(name, value) => setPasswordData((prev) => ({ ...prev, [name]: value }))}
                type="password"
                icon={Lock}
                error={errors.new_password}
                showPasswordToggle
              />
              <FormField
                label={t('userSettings.confirmPassword') || 'Confirm New Password'}
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={(name, value) => setPasswordData((prev) => ({ ...prev, [name]: value }))}
                type="password"
                icon={Lock}
                error={errors.confirm_password}
                showPasswordToggle
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                    setErrors({});
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-[13px] font-medium border transition-all hover:bg-gray-50"
                  style={{ borderColor: 'rgba(0, 0, 0, 0.1)', color: '#5C5A55' }}
                >
                  {t('userSettings.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all hover:shadow-md disabled:opacity-60"
                  style={{ backgroundColor: 'rgb(10, 96, 69)', color: '#FFF' }}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {t('userSettings.updatePassword') || 'Update Password'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Account */}
        <div className="pt-4 border-t" style={{ borderColor: 'rgba(0, 0, 0, 0.06)' }}>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all w-full justify-center border hover:bg-red-50"
              style={{ borderColor: 'rgba(220, 38, 38, 0.3)', color: '#DC2626' }}
            >
              <Trash2 size={14} />
              {t('userSettings.deleteAccount') || 'Delete Account'}
            </button>
          ) : (
            <div className="space-y-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(220, 38, 38, 0.05)' }}>
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-medium text-red-800">
                    {t('userSettings.deleteWarningTitle') || 'This action cannot be undone'}
                  </p>
                  <p className="text-[12px] text-red-700 mt-1">
                    {t('userSettings.deleteWarningDesc') || 'All your data, favorites, and viewing history will be permanently deleted.'}
                  </p>
                </div>
              </div>
              <FormField
                label={t('userSettings.password') || 'Password'}
                name="password"
                value={deleteData.password}
                onChange={(name, value) => setDeleteData((prev) => ({ ...prev, [name]: value }))}
                type="password"
                icon={Lock}
                error={errors.password}
                showPasswordToggle
              />
              <div>
                <label className="text-[12px] font-medium mb-1.5 block" style={{ color: '#5C5A55' }}>
                  {t('userSettings.typeToConfirm') || 'Type "DELETE MY ACCOUNT" to confirm'}
                </label>
                <input
                  type="text"
                  value={deleteData.confirmation}
                  onChange={(e) => setDeleteData((prev) => ({ ...prev, confirmation: e.target.value }))}
                  placeholder="DELETE MY ACCOUNT"
                  className="w-full h-10 px-4 rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-red-500/30"
                  style={glassInput}
                />
                {errors.confirmation && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {errors.confirmation}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteData({ password: '', confirmation: '' });
                    setErrors({});
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-[13px] font-medium border transition-all hover:bg-gray-50"
                  style={{ borderColor: 'rgba(0, 0, 0, 0.1)', color: '#5C5A55' }}
                >
                  {t('userSettings.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={saving || deleteData.confirmation !== 'DELETE MY ACCOUNT'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all hover:shadow-md disabled:opacity-60"
                  style={{ backgroundColor: '#DC2626', color: '#FFF' }}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {t('userSettings.confirmDelete') || 'Delete My Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Member Since */}
      <div className="text-center pb-4">
        <p className="text-[12px]" style={{ color: '#A09D96' }}>
          {t('userSettings.memberSince') || 'Member since'}{' '}
          {new Date(userData.created_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'hy' ? 'hy-AM' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
