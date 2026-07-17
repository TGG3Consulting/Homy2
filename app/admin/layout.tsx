'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Star,
  CalendarCheck,
  Briefcase,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';

interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'moderator';
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  requiredRole?: 'admin' | 'moderator';
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={20} /> },
  { id: 'users', label: 'Users', href: '/admin/users', icon: <Users size={20} />, requiredRole: 'admin' },
  { id: 'moderation', label: 'Moderation', href: '/admin/moderation', icon: <FileText size={20} /> },
  { id: 'reviews', label: 'Reviews', href: '/admin/reviews', icon: <Star size={20} /> },
  { id: 'viewings', label: 'Viewings', href: '/admin/viewings', icon: <CalendarCheck size={20} /> },
  { id: 'crm', label: 'CRM', href: '/admin/crm', icon: <Briefcase size={20} /> },
  { id: 'settings', label: 'Settings', href: '/admin/settings', icon: <Settings size={20} />, requiredRole: 'admin' },
];

// Dark glass morphism style for admin panel
const darkGlassStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check admin access on mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/users/me', {
          credentials: 'include',
        });

        const data = await response.json();
        const userData = data.user || data;

        // Check role
        if (!['admin', 'moderator'].includes(userData.role)) {
          router.push('/dashboard');
          return;
        }

        setUser({
          id: userData.id,
          email: userData.email,
          role: userData.role,
        });
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/admin');
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [router]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    router.push('/');
    router.refresh();
  }, [router]);

  // Filter nav items based on role
  const visibleNavItems = navItems.filter(item => {
    if (!item.requiredRole) return true;
    if (item.requiredRole === 'admin') return user?.role === 'admin';
    return true;
  });

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(165deg, #1a1a2e 0%, #16213e 100%)' }}
      >
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#0A6045] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-body">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(165deg, #1a1a2e 0%, #16213e 100%)' }}>
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen p-4 border-r border-gray-800" style={darkGlassStyle}>
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <Image
              src="/logo/homy_brand_purple.svg"
              alt="Homy"
              width={28}
              height={28}
              className="select-none"
            />
            <span className="font-display font-semibold tracking-wider uppercase text-white text-lg">
              Homy Admin
            </span>
          </div>

          {/* User Info */}
          <div className="mb-6 p-3 rounded-xl bg-white/5">
            <p className="text-sm font-body font-medium text-white truncate">
              {user.email}
            </p>
            <p className="text-xs font-body mt-1 text-gray-400 capitalize">
              {user.role}
            </p>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${isActive ? 'bg-[#0A6045]/20' : 'hover:bg-white/5'}
                  `}
                >
                  <div className={isActive ? 'text-[#0A6045]' : 'text-gray-400'}>
                    {item.icon}
                  </div>
                  <span className={`text-sm font-body font-medium ${isActive ? 'text-[#0A6045]' : 'text-gray-300'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-red-500/10 mt-4"
            >
              <LogOut size={20} className="text-red-400" />
              <span className="text-sm font-body font-medium text-red-400">Logout</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 px-4 py-3 border-b border-gray-800 flex items-center justify-between" style={darkGlassStyle}>
          <div className="flex items-center gap-2">
            <Image
              src="/logo/homy_brand_purple.svg"
              alt="Homy"
              width={24}
              height={24}
              className="select-none"
            />
            <span className="font-display font-semibold tracking-wider uppercase text-white">
              Admin
            </span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-white/10"
          >
            {isMobileMenuOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
          </button>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 pt-16" style={darkGlassStyle}>
            <div className="p-4">
              {/* User Info */}
              <div className="mb-6 p-4 rounded-xl bg-white/5">
                <p className="text-sm font-body font-medium text-white truncate">
                  {user.email}
                </p>
                <p className="text-xs font-body mt-1 text-gray-400 capitalize">
                  {user.role}
                </p>
              </div>

              <nav className="space-y-2">
                {visibleNavItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5"
                  >
                    <div className="text-gray-400">{item.icon}</div>
                    <span className="text-sm font-body font-medium text-gray-300">{item.label}</span>
                    <ChevronRight size={16} className="ml-auto text-gray-600" />
                  </Link>
                ))}

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 mt-4"
                >
                  <LogOut size={20} className="text-red-400" />
                  <span className="text-sm font-body font-medium text-red-400">Logout</span>
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Mobile Content */}
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
