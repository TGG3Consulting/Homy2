'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogIn, LogOut, Settings, Heart, Calendar, ChevronDown } from 'lucide-react';
import { useT } from '@/lib/i18n';

interface UserData {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  user_type?: string;
  avatar_url?: string | null;
}

interface UserAuthButtonProps {
  variant?: 'light' | 'dark';
  className?: string;
  compact?: boolean;
}

export default function UserAuthButton({ variant = 'light', className = '', compact = false }: UserAuthButtonProps) {
  const { t } = useT();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDark = variant === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#242424';
  const bgColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkAuth = async () => {
    try {
      // Use HttpOnly cookies for auth - no localStorage needed
      const res = await fetch('/api/users/me', {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user || data); // API returns {success, user} wrapper
      }
      // No need to clear anything on failure - cookies are HttpOnly
    } catch (err) {
      console.error('Auth check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear HttpOnly cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    setMenuOpen(false);
    router.push('/');
    router.refresh(); // Refresh to update auth state
  };

  if (loading) {
    return (
      <div
        className={`${compact ? 'w-7 h-7' : 'w-9 h-9'} rounded-full animate-pulse ${className}`}
        style={{ backgroundColor: bgColor }}
      />
    );
  }

  // Not logged in - show login button
  if (!user) {
    if (compact) {
      return (
        <Link
          href="/login"
          className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${className}`}
          style={{ backgroundColor: 'rgb(10, 96, 69)' }}
        >
          <LogIn size={14} className="text-white" />
        </Link>
      );
    }
    return (
      <Link
        href="/login"
        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 ${className}`}
        style={{
          backgroundColor: 'rgb(10, 96, 69)',
          color: '#FFFFFF',
        }}
      >
        <LogIn size={16} />
        <span>{t('auth.login')}</span>
      </Link>
    );
  }

  // Logged in - show user menu
  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className={`flex items-center ${compact ? 'p-0' : 'gap-2 px-3 py-2'} rounded-full transition-all duration-200`}
        style={{
          backgroundColor: compact ? 'transparent' : (menuOpen ? hoverBg : bgColor),
          color: textColor,
        }}
      >
        <div
          className={`${compact ? 'w-7 h-7' : 'w-7 h-7'} rounded-full flex items-center justify-center overflow-hidden`}
          style={{ backgroundColor: 'rgb(10, 96, 69)' }}
        >
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt="Avatar"
              width={28}
              height={28}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={compact ? 14 : 16} className="text-white" />
          )}
        </div>
        {!compact && (
          <ChevronDown
            size={14}
            style={{
              color: textColor,
              opacity: 0.6,
              transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        )}
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden z-50"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          }}
        >
          {/* User info */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            <p className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>
              {user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.email}
            </p>
            <p className="text-xs capitalize" style={{ color: '#757570' }}>
              {user.user_type || 'buyer'}
            </p>
          </div>

          {/* Menu items */}
          <div className="py-2">
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
              style={{ color: '#1A1A1A' }}
            >
              <User size={16} style={{ color: '#757570' }} />
              {t('dashboard.title') || 'Личный кабинет'}
            </Link>

            <Link
              href="/dashboard?tab=favorites"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
              style={{ color: '#1A1A1A' }}
            >
              <Heart size={16} style={{ color: '#757570' }} />
              {t('dashboard.nav.favorites') || 'Избранное'}
            </Link>

            <Link
              href="/dashboard?tab=viewings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
              style={{ color: '#1A1A1A' }}
            >
              <Calendar size={16} style={{ color: '#757570' }} />
              {t('dashboard.nav.viewings') || 'Просмотры'}
            </Link>

            <Link
              href="/dashboard?tab=settings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
              style={{ color: '#1A1A1A' }}
            >
              <Settings size={16} style={{ color: '#757570' }} />
              {t('dashboard.nav.settings') || 'Настройки'}
            </Link>
          </div>

          {/* Logout */}
          <div className="py-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors hover:bg-red-50"
              style={{ color: '#EF4444' }}
            >
              <LogOut size={16} />
              {t('auth.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
