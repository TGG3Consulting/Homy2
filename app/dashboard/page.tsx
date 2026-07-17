'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Home,
  Heart,
  Calendar,
  Eye,
  Search,
  Star,
  Building,
  Clock,
  CheckCircle,
  MessageSquare,
  Users,
  Briefcase,
  TrendingUp,
  Plus,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import { Footer } from '@/components/homly';
import UserSettings from '@/components/dashboard/UserSettings';
import RecommendedProperties from '@/components/dashboard/RecommendedProperties';
import SupportInbox from '@/components/dashboard/SupportInbox';
import { ChatPanel } from '@/components/Chat';
import { Headphones } from 'lucide-react';
import BuyerDashboard from '@/components/homy/BuyerDashboard';
import BrokerCabinet from '@/components/homy/BrokerCabinet';

// Type definitions
type UserType = 'buyer' | 'renter' | 'owner' | 'agent' | 'consultant';

interface User {
  id: string;
  email: string;
  user_type: UserType;
  language_preference?: string;
}

interface BuyerRenterDashboard {
  favorites_count: number;
  viewings_scheduled: number;
  viewings_completed: number;
  properties_viewed: number;
  search_history_count: number;
  recommended_count: number;
}

interface OwnerDashboard {
  listings_count: number;
  listings_pending: number;
  listings_approved: number;
  total_views: number;
  total_inquiries: number;
  upcoming_viewings: number;
}

interface AgentDashboard {
  clients_count: number;
  properties_managed: number;
  viewings_conducted: number;
  deals_closed: number;
}

type DashboardData = BuyerRenterDashboard | OwnerDashboard | AgentDashboard;

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  href?: string;
  tab?: string;
  color: string;
}

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}

// Type guards
function isBuyerRenterDashboard(data: DashboardData): data is BuyerRenterDashboard {
  return 'favorites_count' in data;
}

function isOwnerDashboard(data: DashboardData): data is OwnerDashboard {
  return 'listings_count' in data;
}

function isAgentDashboard(data: DashboardData): data is AgentDashboard {
  return 'clients_count' in data;
}

// Glass morphism styles
const glassStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.45)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  borderColor: 'rgba(255, 255, 255, 0.6)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
};

const darkGlassStyle = {
  background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 50%, #141414 100%)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  borderColor: 'rgba(255, 255, 255, 0.08)',
  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 12px 24px -8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.3)',
};

// Internal tabs that should use query params (no separate routes)
const INTERNAL_TABS = ['overview', 'favorites', 'viewings', 'settings', 'recommendations', 'searches', 'messages', 'support'];

function DashboardContent() {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [user, setUser] = useState<User | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isMounted, setIsMounted] = useState(false);

  // 3.1: admins/moderators use the single full admin UI at /admin/* — send them there.
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'moderator' || user.user_type === 'admin')) {
      router.replace('/admin');
    }
  }, [user, router]);

  // Sync activeTab with URL search params (considering user type for default)
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab) {
      setActiveTab(urlTab);
    } else if (user?.user_type === 'consultant') {
      // Default tab for consultant is 'support'
      setActiveTab('support');
    } else {
      setActiveTab('overview');
    }
  }, [searchParams, user?.user_type]);

  // Track client-side mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch user data using HttpOnly cookies
  const fetchUserData = useCallback(async () => {
    // Skip during SSR - wait for client-side hydration
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const response = await fetch('/api/users/me', {
        credentials: 'include', // Use HttpOnly cookies
      });

      if (response.status === 401) {
        router.push('/login');
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      const user = data.user || data; // API returns {success, user} or direct user object
      return {
        id: user.id || '',
        email: user.email || '',
        user_type: (user.user_type || 'buyer') as UserType,
        language_preference: user.language_preference,
      };
    } catch (err) {
      console.error('Error fetching user:', err);
      return null;
    }
  }, [router]);

  // Fetch dashboard data using HttpOnly cookies
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/users/me/dashboard', {
        credentials: 'include', // Use HttpOnly cookies
      });

      if (response.status === 401) {
        router.push('/login');
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      return await response.json();
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      throw err;
    }
  }, [router]);

  // Load data on mount - only after client hydration
  useEffect(() => {
    if (!isMounted) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const userData = await fetchUserData();
        if (!userData) {
          setIsLoading(false);
          return;
        }
        setUser(userData);

        const dashboard = await fetchDashboardData();
        setDashboardData(dashboard);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isMounted, fetchUserData, fetchDashboardData]);

  // Handle logout - clear HttpOnly cookies via API
  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    router.push('/');
    router.refresh();
  }, [router]);

  // Handle navigation click
  const handleNavClick = useCallback((item: NavItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      // External link (like /results) - use regular navigation
      router.push(item.href);
    } else if (INTERNAL_TABS.includes(item.id)) {
      // Internal tab - use query params
      if (item.id === 'overview') {
        router.push('/dashboard');
      } else {
        router.push(`/dashboard?tab=${item.id}`);
      }
    }
  }, [router]);

  // Get navigation items based on user type
  const getNavItems = useCallback((): NavItem[] => {
    const userType = user?.user_type || 'buyer';

    const commonItems: NavItem[] = [
      { id: 'overview', icon: <Home size={20} />, label: t('dashboard.nav.overview') || 'Overview' },
      { id: 'settings', icon: <Settings size={20} />, label: t('dashboard.nav.settings') || 'Settings' },
    ];

    const buyerRenterItems: NavItem[] = [
      { id: 'favorites', icon: <Heart size={20} />, label: t('dashboard.nav.favorites') || 'Favorites' },
      { id: 'viewings', icon: <Calendar size={20} />, label: t('dashboard.nav.viewings') || 'Viewings' },
      { id: 'searches', icon: <Search size={20} />, label: t('dashboard.nav.searches') || 'Saved Searches' },
      { id: 'recommendations', icon: <Star size={20} />, label: t('dashboard.nav.recommendations') || 'Recommendations' },
    ];

    const ownerItems: NavItem[] = [
      { id: 'listings', icon: <Building size={20} />, label: t('dashboard.nav.listings') || 'My Listings', href: '/dashboard/listings' },
      { id: 'messages', icon: <MessageSquare size={20} />, label: t('dashboard.nav.messages') || 'Messages' },
      { id: 'viewings', icon: <Calendar size={20} />, label: t('dashboard.nav.viewings') || 'Viewings' },
      { id: 'add-listing', icon: <Plus size={20} />, label: t('dashboard.nav.addListing') || 'Add Listing', href: '/dashboard/listings/new' },
    ];

    const agentItems: NavItem[] = [
      { id: 'clients', icon: <Users size={20} />, label: t('dashboard.nav.clients') || 'Clients', href: '/dashboard/clients' },
      { id: 'properties', icon: <Building size={20} />, label: t('dashboard.nav.properties') || 'Properties', href: '/dashboard/properties' },
      { id: 'messages', icon: <MessageSquare size={20} />, label: t('dashboard.nav.messages') || 'Messages' },
      { id: 'viewings', icon: <Calendar size={20} />, label: t('dashboard.nav.viewings') || 'Viewings' },
      { id: 'deals', icon: <Briefcase size={20} />, label: t('dashboard.nav.deals') || 'Deals', href: '/dashboard/deals' },
    ];

    const consultantItems: NavItem[] = [
      { id: 'support', icon: <Headphones size={20} />, label: t('dashboard.nav.support') || 'Support' },
    ];

    let typeSpecificItems: NavItem[] = [];
    switch (userType) {
      case 'owner':
        typeSpecificItems = ownerItems;
        break;
      case 'agent':
        typeSpecificItems = agentItems;
        break;
      case 'consultant':
        typeSpecificItems = consultantItems;
        break;
      case 'buyer':
      case 'renter':
      default:
        typeSpecificItems = buyerRenterItems;
    }

    // Consultant gets a simplified navigation: support, settings, logout only
    if (userType === 'consultant') {
      return [
        ...consultantItems,
        commonItems[1], // settings
        { id: 'logout', icon: <LogOut size={20} />, label: t('dashboard.nav.logout') || 'Logout', onClick: handleLogout },
      ];
    }

    return [
      commonItems[0],
      ...typeSpecificItems,
      commonItems[1],
      { id: 'logout', icon: <LogOut size={20} />, label: t('dashboard.nav.logout') || 'Logout', onClick: handleLogout },
    ];
  }, [user, t, handleLogout]);

  // Get quick actions based on user type
  const getQuickActions = useCallback((): QuickAction[] => {
    const userType = user?.user_type || 'buyer';

    const buyerRenterActions: QuickAction[] = [
      { id: 'search', icon: <Search size={18} />, label: t('dashboard.actions.newSearch') || 'New Search', href: '/', color: '#0A6045' },
      { id: 'favorites', icon: <Heart size={18} />, label: t('dashboard.actions.viewFavorites') || 'View Favorites', tab: 'favorites', color: '#FF6B8A' },
      { id: 'viewings', icon: <Calendar size={18} />, label: t('dashboard.actions.scheduleViewing') || 'Schedule Viewing', tab: 'viewings', color: '#4CAF50' },
      { id: 'recommendations', icon: <Star size={18} />, label: t('dashboard.actions.getRecommendations') || 'Get Recommendations', href: '/dashboard?tab=recommendations', color: '#FF9800' },
    ];

    const ownerActions: QuickAction[] = [
      { id: 'add-listing', icon: <Plus size={18} />, label: t('dashboard.actions.addListing') || 'Add Listing', href: '/dashboard/listings/new', color: '#0A6045' },
      { id: 'listings', icon: <Building size={18} />, label: t('dashboard.actions.manageListings') || 'Manage Listings', href: '/dashboard/listings', color: '#4CAF50' },
      { id: 'inquiries', icon: <MessageSquare size={18} />, label: t('dashboard.actions.viewInquiries') || 'View Inquiries', href: '/dashboard/inquiries', color: '#FF9800' },
      { id: 'calendar', icon: <Calendar size={18} />, label: t('dashboard.actions.viewCalendar') || 'View Calendar', tab: 'viewings', color: '#2196F3' },
    ];

    const agentActions: QuickAction[] = [
      { id: 'add-client', icon: <Users size={18} />, label: t('dashboard.actions.addClient') || 'Add Client', href: '/dashboard/clients/new', color: '#0A6045' },
      { id: 'search', icon: <Search size={18} />, label: t('dashboard.actions.searchProperties') || 'Search Properties', href: '/', color: '#4CAF50' },
      { id: 'viewings', icon: <Calendar size={18} />, label: t('dashboard.actions.scheduleViewing') || 'Schedule Viewing', tab: 'viewings', color: '#FF9800' },
      { id: 'deals', icon: <TrendingUp size={18} />, label: t('dashboard.actions.trackDeals') || 'Track Deals', href: '/dashboard/deals', color: '#2196F3' },
    ];

    switch (userType) {
      case 'owner':
        return ownerActions;
      case 'agent':
        return agentActions;
      case 'buyer':
      case 'renter':
      default:
        return buyerRenterActions;
    }
  }, [user, t]);

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return <UserSettings />;
      case 'recommendations':
        return <RecommendedProperties />;
      case 'messages':
        return (
          <div className="h-[calc(100vh-200px)] min-h-[500px]">
            <ChatPanel mode="property" showHeader={false} />
          </div>
        );
      case 'support':
        return <SupportInbox />;
      default:
        return null;
    }
  };

  // Render stats for buyer/renter
  const renderBuyerRenterStats = (data: BuyerRenterDashboard) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        icon={<Heart size={20} />}
        value={data.favorites_count}
        label={t('dashboard.stats.favorites') || 'Favorites'}
        color="#FF6B8A"
      />
      <StatCard
        icon={<Calendar size={20} />}
        value={data.viewings_scheduled}
        label={t('dashboard.stats.scheduledViewings') || 'Scheduled'}
        color="#0A6045"
      />
      <StatCard
        icon={<CheckCircle size={20} />}
        value={data.viewings_completed}
        label={t('dashboard.stats.completedViewings') || 'Completed'}
        color="#4CAF50"
      />
      <StatCard
        icon={<Eye size={20} />}
        value={data.properties_viewed}
        label={t('dashboard.stats.propertiesViewed') || 'Viewed'}
        color="#2196F3"
      />
      <StatCard
        icon={<Search size={20} />}
        value={data.search_history_count}
        label={t('dashboard.stats.searches') || 'Searches'}
        color="#FF9800"
      />
      <StatCard
        icon={<Star size={20} />}
        value={data.recommended_count}
        label={t('dashboard.stats.recommended') || 'Recommended'}
        color="#9C27B0"
      />
    </div>
  );

  // Render stats for owner
  const renderOwnerStats = (data: OwnerDashboard) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        icon={<Building size={20} />}
        value={data.listings_count}
        label={t('dashboard.stats.totalListings') || 'Total Listings'}
        color="#0A6045"
      />
      <StatCard
        icon={<Clock size={20} />}
        value={data.listings_pending}
        label={t('dashboard.stats.pending') || 'Pending'}
        color="#FF9800"
      />
      <StatCard
        icon={<CheckCircle size={20} />}
        value={data.listings_approved}
        label={t('dashboard.stats.approved') || 'Approved'}
        color="#4CAF50"
      />
      <StatCard
        icon={<Eye size={20} />}
        value={data.total_views}
        label={t('dashboard.stats.totalViews') || 'Total Views'}
        color="#2196F3"
      />
      <StatCard
        icon={<MessageSquare size={20} />}
        value={data.total_inquiries}
        label={t('dashboard.stats.inquiries') || 'Inquiries'}
        color="#FF6B8A"
      />
      <StatCard
        icon={<Calendar size={20} />}
        value={data.upcoming_viewings}
        label={t('dashboard.stats.upcomingViewings') || 'Upcoming'}
        color="#9C27B0"
      />
    </div>
  );

  // Render stats for agent
  const renderAgentStats = (data: AgentDashboard) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={<Users size={20} />}
        value={data.clients_count}
        label={t('dashboard.stats.clients') || 'Clients'}
        color="#0A6045"
      />
      <StatCard
        icon={<Building size={20} />}
        value={data.properties_managed}
        label={t('dashboard.stats.propertiesManaged') || 'Properties'}
        color="#4CAF50"
      />
      <StatCard
        icon={<Calendar size={20} />}
        value={data.viewings_conducted}
        label={t('dashboard.stats.viewingsConducted') || 'Viewings'}
        color="#2196F3"
      />
      <StatCard
        icon={<Briefcase size={20} />}
        value={data.deals_closed}
        label={t('dashboard.stats.dealsClosed') || 'Deals Closed'}
        color="#FF9800"
      />
    </div>
  );

  // Render dashboard stats based on user type
  const renderDashboardStats = () => {
    if (!dashboardData) return null;

    if (isBuyerRenterDashboard(dashboardData)) {
      return renderBuyerRenterStats(dashboardData);
    }
    if (isOwnerDashboard(dashboardData)) {
      return renderOwnerStats(dashboardData);
    }
    if (isAgentDashboard(dashboardData)) {
      return renderAgentStats(dashboardData);
    }

    return null;
  };

  // Get user type display name
  const getUserTypeLabel = () => {
    const userType = user?.user_type || 'buyer';
    const labels: Record<UserType, string> = {
      buyer: t('dashboard.userType.buyer') || 'Buyer',
      renter: t('dashboard.userType.renter') || 'Renter',
      owner: t('dashboard.userType.owner') || 'Property Owner',
      agent: t('dashboard.userType.agent') || 'Real Estate Agent',
      consultant: t('dashboard.userType.consultant') || 'Consultant',
    };
    return labels[userType];
  };

  // Navigation items
  const navItems = getNavItems();
  const quickActions = getQuickActions();

  // Loading state
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(165deg, #F6F5F3 0%, #F2F2EF 30%, #F9F9F7 60%, #F0F0EC 100%)',
        }}
      >
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#0A6045] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-body">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          background: 'linear-gradient(165deg, #F6F5F3 0%, #F2F2EF 30%, #F9F9F7 60%, #F0F0EC 100%)',
        }}
      >
        <div
          className="rounded-2xl border p-8 max-w-md w-full text-center"
          style={glassStyle}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <X size={24} style={{ color: '#EF4444' }} />
          </div>
          <h2 className="text-lg font-semibold font-body mb-2" style={{ color: '#1A1A1A' }}>
            {t('dashboard.error.title') || 'Something went wrong'}
          </h2>
          <p className="text-sm font-body mb-4" style={{ color: '#757570' }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-full text-sm font-medium font-body transition-colors"
            style={{ backgroundColor: '#0A6045', color: 'white' }}
          >
            {t('common.tryAgain') || 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  // Authorization axis is `role` (admin/moderator/user) — check it FIRST so an admin
  // with a default/unset product persona (user_type) never falls through into the buyer
  // cabinet (B1/B2). The full admin UI lives at /admin/* (single source — 3.1); send them there.
  if (user && (user.role === 'admin' || user.role === 'moderator' || user.user_type === 'admin')) {
    return null; // redirecting to /admin (see effect above)
  }

  // Product persona (user_type): agent/owner get the 1:1 broker cabinet (D1–D5).
  if (user && (user.user_type === 'agent' || user.user_type === 'owner')) {
    return <BrokerCabinet user={user} />;
  }

  // Everyone else (buyer/renter, or unset persona) gets the 1:1 buyer dashboard (C1).
  if (user && (user.user_type === 'buyer' || user.user_type === 'renter' || !user.user_type)) {
    return <BuyerDashboard user={user} />;
  }

  // Render overview content (default tab)
  const renderOverviewContent = () => (
    <>
      {/* Stats Overview */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold font-body mb-4" style={{ color: '#1A1A1A' }}>
          {t('dashboard.sections.overview') || 'Overview'}
        </h2>
        {renderDashboardStats()}
      </section>

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold font-body mb-4" style={{ color: '#1A1A1A' }}>
          {t('dashboard.sections.quickActions') || 'Quick Actions'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <QuickActionCard key={action.id} action={action} router={router} />
          ))}
        </div>
      </section>

      {/* Main Content Area - Placeholder for overview */}
      <section
        className="rounded-2xl border p-6 min-h-[300px]"
        style={glassStyle}
      >
        <div className="flex items-center justify-center h-full text-center">
          <div>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(10, 96, 69, 0.1)' }}>
              <Home size={28} style={{ color: '#0A6045' }} />
            </div>
            <h3 className="text-lg font-semibold font-body mb-2" style={{ color: '#1A1A1A' }}>
              {t('dashboard.mainContent.title') || 'Your Dashboard'}
            </h3>
            <p className="text-sm font-body max-w-md" style={{ color: '#757570' }}>
              {t('dashboard.mainContent.description') || 'Select an option from the sidebar to view more details, or use quick actions to get started.'}
            </p>
          </div>
        </div>
      </section>
    </>
  );

  return (
    <div className="min-h-screen w-full">
      {/* Main Layout */}
      <div
        className="min-h-screen"
        style={{
          background: 'linear-gradient(165deg, #F6F5F3 0%, #F2F2EF 30%, #F9F9F7 60%, #F0F0EC 100%)',
        }}
      >
        {/* Desktop Layout */}
        <div className="hidden lg:flex">
          {/* Sidebar */}
          <aside
            className="w-64 min-h-screen p-4 border-r sticky top-0"
            style={{
              ...darkGlassStyle,
              borderRight: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Logo */}
            <Link href="/" className="block mb-8">
              <span className="font-display font-semibold tracking-[0.12em] uppercase text-white text-lg">
                Homy
              </span>
            </Link>

            {/* User Info */}
            <div className="mb-6 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <p className="text-sm font-body font-medium text-white truncate">
                {user?.email}
              </p>
              <p className="text-xs font-body mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {getUserTypeLabel()}
              </p>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  onClick={() => handleNavClick(item)}
                />
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8">
            {/* Header */}
            <header className="mb-8">
              <h1 className="text-2xl font-display font-semibold" style={{ color: '#1A1A1A' }}>
                {t('dashboard.welcome') || 'Welcome back'}
              </h1>
              <p className="text-sm font-body mt-1" style={{ color: '#757570' }}>
                {t('dashboard.subtitle') || 'Here is an overview of your activity'}
              </p>
            </header>

            {/* Render content based on active tab */}
            {activeTab === 'overview' && user?.user_type !== 'consultant' ? renderOverviewContent() : (
              <section
                className="rounded-2xl border p-6 min-h-[400px]"
                style={glassStyle}
              >
                {renderTabContent()}
              </section>
            )}
          </main>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden">
          {/* Mobile Header */}
          <header
            className="sticky top-0 z-50 px-4 py-3 border-b flex items-center justify-between"
            style={{
              ...glassStyle,
              borderBottom: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            <Link href="/" className="block">
              <span className="font-display font-semibold tracking-[0.12em] uppercase text-lg" style={{ color: '#1A1A1A' }}>
                Homy
              </span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'rgba(10, 96, 69, 0.1)' }}
            >
              {isMobileMenuOpen ? (
                <X size={20} style={{ color: '#0A6045' }} />
              ) : (
                <Menu size={20} style={{ color: '#0A6045' }} />
              )}
            </button>
          </header>

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 z-40 pt-16"
              style={darkGlassStyle}
            >
              <div className="p-4">
                {/* User Info */}
                <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <p className="text-sm font-body font-medium text-white truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs font-body mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {getUserTypeLabel()}
                  </p>
                </div>

                {/* Navigation */}
                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <NavButton
                      key={item.id}
                      item={item}
                      isActive={activeTab === item.id}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleNavClick(item);
                      }}
                    />
                  ))}
                </nav>
              </div>
            </div>
          )}

          {/* Mobile Content */}
          <main className="p-4 pb-24">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-xl font-display font-semibold" style={{ color: '#1A1A1A' }}>
                {t('dashboard.welcome') || 'Welcome back'}
              </h1>
              <p className="text-sm font-body mt-1" style={{ color: '#757570' }}>
                {t('dashboard.subtitle') || 'Here is an overview of your activity'}
              </p>
            </div>

            {/* Render content based on active tab */}
            {activeTab === 'overview' && user?.user_type !== 'consultant' ? (
              <>
                {/* Stats Overview */}
                <section className="mb-6">
                  {renderDashboardStats()}
                </section>

                {/* Quick Actions */}
                <section className="mb-6">
                  <h2 className="text-base font-semibold font-body mb-3" style={{ color: '#1A1A1A' }}>
                    {t('dashboard.sections.quickActions') || 'Quick Actions'}
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action) => (
                      <QuickActionCard key={action.id} action={action} router={router} />
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <section
                className="rounded-2xl border p-4 min-h-[300px]"
                style={glassStyle}
              >
                {renderTabContent()}
              </section>
            )}

            {/* Mobile Tabs Navigation */}
            <div
              className="fixed bottom-0 left-0 right-0 z-40 px-2 py-2 border-t"
              style={{
                ...glassStyle,
                borderTop: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <div className="flex items-center justify-around">
                {navItems.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    className="flex flex-col items-center p-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: activeTab === item.id ? 'rgba(10, 96, 69, 0.15)' : 'transparent',
                    }}
                  >
                    <div style={{ color: activeTab === item.id ? '#0A6045' : '#757570' }}>
                      {item.icon}
                    </div>
                    <span
                      className="text-[10px] font-body mt-1"
                      style={{ color: activeTab === item.id ? '#0A6045' : '#757570' }}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Footer - only on desktop */}
      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(165deg, #F6F5F3 0%, #F2F2EF 30%, #F9F9F7 60%, #F0F0EC 100%)',
        }}
      >
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#0A6045] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-body">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={glassStyle}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className="text-xl font-semibold font-body" style={{ color: '#1A1A1A' }}>
            {value}
          </p>
          <p className="text-xs font-body truncate" style={{ color: '#757570' }}>
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

// Quick Action Card Component
interface QuickActionCardProps {
  action: QuickAction;
  router: ReturnType<typeof useRouter>;
}

function QuickActionCard({ action, router }: QuickActionCardProps) {
  const handleClick = () => {
    if (action.href) {
      router.push(action.href);
    } else if (action.tab) {
      router.push(`/dashboard?tab=${action.tab}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="rounded-2xl border p-4 transition-all duration-200 hover:scale-[1.02] group text-left w-full"
      style={glassStyle}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${action.color}15` }}
        >
          <div style={{ color: action.color }}>{action.icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium font-body truncate" style={{ color: '#1A1A1A' }}>
            {action.label}
          </p>
        </div>
        <ChevronRight size={16} style={{ color: '#B5B3AD' }} className="flex-shrink-0 transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  );
}

// Navigation Button Component
function NavButton({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left"
      style={{
        backgroundColor: isActive ? 'rgba(10, 96, 69, 0.2)' : 'transparent',
      }}
    >
      <div style={{ color: isActive ? '#0A6045' : 'rgba(255,255,255,0.6)' }}>
        {item.icon}
      </div>
      <span
        className="text-sm font-body font-medium"
        style={{ color: isActive ? '#0A6045' : 'rgba(255,255,255,0.8)' }}
      >
        {item.label}
      </span>
    </button>
  );
}
