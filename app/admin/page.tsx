'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  FileText,
  Building,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    blocked: number;
    new_today: number;
    new_this_week: number;
    by_role: { user: number; moderator: number; admin: number };
  };
  listings: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    new_today: number;
  };
  properties: {
    total: number;
    available: number;
    verified: number;
  };
  viewings: {
    total: number;
    pending: number;
    completed: number;
    this_week: number;
  };
  recent_actions: Array<{
    id: string;
    admin_email: string;
    action_type: string;
    target_type: string;
    created_at: string;
  }>;
}

const glassStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard', {
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch stats');

        const data = await response.json();
        setStats(data.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#0A6045] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl p-6" style={glassStyle}>
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle size={24} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Platform overview and quick actions</p>
      </div>

      {/* Alert: Pending Moderation */}
      {stats.listings.pending > 0 && (
        <Link
          href="/admin/moderation"
          className="block rounded-xl p-4 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/15 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-yellow-500" />
              <span className="text-yellow-200 font-medium">
                {stats.listings.pending} listings pending moderation
              </span>
            </div>
            <ArrowUpRight size={18} className="text-yellow-500" />
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users Card */}
        <div className="rounded-xl p-5" style={glassStyle}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users size={20} className="text-blue-400" />
            </div>
            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
              +{stats.users.new_today} today
            </span>
          </div>
          <p className="text-2xl font-semibold text-white">{stats.users.total}</p>
          <p className="text-sm text-gray-400">Total Users</p>
          <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs">
            <span className="text-green-400">{stats.users.active} active</span>
            <span className="text-red-400">{stats.users.blocked} blocked</span>
          </div>
        </div>

        {/* Listings Card */}
        <div className="rounded-xl p-5" style={glassStyle}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <FileText size={20} className="text-emerald-400" />
            </div>
            <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
              {stats.listings.pending} pending
            </span>
          </div>
          <p className="text-2xl font-semibold text-white">{stats.listings.total}</p>
          <p className="text-sm text-gray-400">Listings</p>
          <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs">
            <span className="text-green-400">{stats.listings.approved} approved</span>
            <span className="text-red-400">{stats.listings.rejected} rejected</span>
          </div>
        </div>

        {/* Properties Card */}
        <div className="rounded-xl p-5" style={glassStyle}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Building size={20} className="text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-white">{stats.properties.total}</p>
          <p className="text-sm text-gray-400">Properties</p>
          <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs">
            <span className="text-green-400">{stats.properties.available} available</span>
            <span className="text-blue-400">{stats.properties.verified} verified</span>
          </div>
        </div>

        {/* Viewings Card */}
        <div className="rounded-xl p-5" style={glassStyle}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Calendar size={20} className="text-orange-400" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-white">{stats.viewings.total}</p>
          <p className="text-sm text-gray-400">Viewings</p>
          <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs">
            <span className="text-yellow-400">{stats.viewings.pending} pending</span>
            <span className="text-green-400">{stats.viewings.completed} completed</span>
          </div>
        </div>
      </div>

      {/* Recent Actions */}
      <div className="rounded-xl p-6" style={glassStyle}>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Admin Actions</h2>
        {stats.recent_actions.length === 0 ? (
          <p className="text-gray-400 text-sm">No recent actions</p>
        ) : (
          <div className="space-y-3">
            {stats.recent_actions.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    action.action_type.includes('approve') ? 'bg-green-500/20' :
                    action.action_type.includes('reject') || action.action_type.includes('block') ? 'bg-red-500/20' :
                    'bg-blue-500/20'
                  }`}>
                    {action.action_type.includes('approve') ? (
                      <CheckCircle size={16} className="text-green-400" />
                    ) : action.action_type.includes('reject') || action.action_type.includes('block') ? (
                      <AlertCircle size={16} className="text-red-400" />
                    ) : (
                      <TrendingUp size={16} className="text-blue-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-white">
                      {action.action_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500">{action.admin_email}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(action.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
