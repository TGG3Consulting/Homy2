'use client';

import React from 'react';
import {
  Heart,
  Eye,
  Calendar,
  Home,
  TrendingUp,
  Users,
  ShieldCheck,
  CheckCircle,
  Clock,
  LucideIcon,
} from 'lucide-react';
import { useT } from '@/lib/i18n';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Stats for buyer/renter user type
 */
export interface BuyerRenterStats {
  favorites_count: number;
  viewings_scheduled: number;
  viewings_completed: number;
  properties_viewed: number;
  recommended_count: number;
}

/**
 * Stats for property owner user type
 */
export interface OwnerStats {
  listings_count: number;
  listings_pending: number;
  listings_approved: number;
  total_views: number;
  total_inquiries: number;
  upcoming_viewings: number;
}

/**
 * Configuration for a single stat card
 */
interface StatConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  value: number | string;
  color?: string;
}

/**
 * Props for BuyerRenter stats display
 */
interface BuyerRenterStatsProps {
  userType: 'buyer' | 'renter';
  stats: BuyerRenterStats;
  className?: string;
}

/**
 * Props for Owner stats display
 */
interface OwnerStatsProps {
  userType: 'owner';
  stats: OwnerStats;
  className?: string;
}

/**
 * Union type for all possible props
 */
export type DashboardStatsProps = BuyerRenterStatsProps | OwnerStatsProps;

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  color?: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const iconColor = color || '#0A6045';
  const valueColor = color || '#242424';

  return (
    <div
      className="rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(200, 196, 188, 0.15)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={14} style={{ color: iconColor }} />
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: '#A09D96' }}
        >
          {label}
        </span>
      </div>
      <p
        className="text-[22px] font-bold"
        style={{ color: valueColor }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * DashboardStats - A responsive stats grid component with glass morphism styling
 *
 * Displays different stats based on user type:
 * - buyer/renter: favorites, viewings, properties viewed, recommendations
 * - owner: listings, views, inquiries, upcoming viewings
 */
export default function DashboardStats(props: DashboardStatsProps) {
  const { userType, stats, className = '' } = props;
  const { t } = useT();

  // Build stat configurations based on user type
  const statConfigs: StatConfig[] = React.useMemo(() => {
    if (userType === 'owner') {
      const ownerStats = stats as OwnerStats;
      return [
        {
          key: 'listings_count',
          label: t('dashboard.stats.totalListings') || 'Listings',
          icon: Home,
          value: ownerStats.listings_count,
        },
        {
          key: 'listings_pending',
          label: t('dashboard.stats.pending') || 'Pending',
          icon: Clock,
          value: ownerStats.listings_pending,
          color: '#D4A54A',
        },
        {
          key: 'listings_approved',
          label: t('dashboard.stats.approved') || 'Approved',
          icon: ShieldCheck,
          value: ownerStats.listings_approved,
          color: '#22C55E',
        },
        {
          key: 'total_views',
          label: t('dashboard.stats.totalViews') || 'Total Views',
          icon: Eye,
          value: ownerStats.total_views,
        },
        {
          key: 'total_inquiries',
          label: t('dashboard.stats.inquiries') || 'Inquiries',
          icon: Users,
          value: ownerStats.total_inquiries,
        },
        {
          key: 'upcoming_viewings',
          label: t('dashboard.stats.upcomingViewings') || 'Upcoming Viewings',
          icon: Calendar,
          value: ownerStats.upcoming_viewings,
        },
      ];
    }

    // Buyer/Renter stats
    const buyerStats = stats as BuyerRenterStats;
    return [
      {
        key: 'favorites_count',
        label: t('dashboard.stats.favorites') || 'Favorites',
        icon: Heart,
        value: buyerStats.favorites_count,
        color: '#EF4444',
      },
      {
        key: 'viewings_scheduled',
        label: t('dashboard.stats.scheduledViewings') || 'Scheduled',
        icon: Calendar,
        value: buyerStats.viewings_scheduled,
      },
      {
        key: 'viewings_completed',
        label: t('dashboard.stats.completedViewings') || 'Completed',
        icon: CheckCircle,
        value: buyerStats.viewings_completed,
        color: '#22C55E',
      },
      {
        key: 'properties_viewed',
        label: t('dashboard.stats.propertiesViewed') || 'Viewed',
        icon: Eye,
        value: buyerStats.properties_viewed,
      },
      {
        key: 'recommended_count',
        label: t('dashboard.stats.recommended') || 'Recommended',
        icon: TrendingUp,
        value: buyerStats.recommended_count,
      },
    ];
  }, [userType, stats, t]);

  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.7)',
        boxShadow:
          '0 1px 3px rgba(0, 0, 0, 0.03), 0 8px 32px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      }}
    >
      {/* Responsive grid: 2 cols on mobile, 3 cols on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {statConfigs.map((stat) => (
          <StatCard
            key={stat.key}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            color={stat.color}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Named Exports for Convenience
// ============================================================================

export { StatCard };
