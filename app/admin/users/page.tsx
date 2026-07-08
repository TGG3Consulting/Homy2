'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  phone: string | null;
  user_type: string | null;
  role: string | null;
  is_blocked: boolean;
  blocked_at: string | null;
  block_reason: string | null;
  emailVerified: boolean;
  createdAt: string;
  _count: {
    favorites: number;
    viewings: number;
    property_listings: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

const glassStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [blockedFilter, setBlockedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionModal, setActionModal] = useState<{ user: User; action: string } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (blockedFilter) params.set('is_blocked', blockedFilter);

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleFilter, blockedFilter]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [fetchUsers]);

  const handleAction = async () => {
    if (!actionModal) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_id: actionModal.user.id,
          action: actionModal.action,
          reason: actionReason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Action failed');
      }

      setActionModal(null);
      setActionReason('');
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'admin': return 'bg-emerald-500/20 text-emerald-400';
      case 'moderator': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-white">Users</h1>
          <p className="text-gray-400 mt-1">Manage platform users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl p-4" style={glassStyle}>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or phone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045]"
              />
            </div>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#0A6045] cursor-pointer"
          >
            <option value="" className="bg-gray-900">All Roles</option>
            <option value="user" className="bg-gray-900">User</option>
            <option value="moderator" className="bg-gray-900">Moderator</option>
            <option value="admin" className="bg-gray-900">Admin</option>
          </select>
          <select
            value={blockedFilter}
            onChange={(e) => { setBlockedFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#0A6045] cursor-pointer"
          >
            <option value="" className="bg-gray-900">All Status</option>
            <option value="false" className="bg-gray-900">Active</option>
            <option value="true" className="bg-gray-900">Blocked</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <span className="text-red-200 flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-xl overflow-hidden" style={glassStyle}>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-2 border-[#0A6045] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-gray-400">
            No users found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Activity</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Joined</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white text-sm">{user.email}</p>
                        {user.phone && <p className="text-gray-500 text-xs">{user.phone}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-300 text-sm capitalize">{user.user_type || 'buyer'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${getRoleBadgeColor(user.role)}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.is_blocked ? (
                        <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">
                          Blocked
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-400 whitespace-nowrap">
                        <span>{user._count?.favorites || 0} fav</span>
                        <span className="mx-1">|</span>
                        <span>{user._count?.viewings || 0} view</span>
                        <span className="mx-1">|</span>
                        <span>{user._count?.property_listings || 0} list</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400 text-sm whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.role !== 'admin' && (
                        <div className="flex items-center justify-end gap-2">
                          {user.is_blocked ? (
                            <button
                              onClick={() => setActionModal({ user, action: 'unblock' })}
                              className="p-2 rounded-lg hover:bg-green-500/20 transition-colors"
                              title="Unblock user"
                            >
                              <UserCheck size={16} className="text-green-400" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setActionModal({ user, action: 'block' })}
                              className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                              title="Block user"
                            >
                              <UserX size={16} className="text-red-400" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <span className="text-sm text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} className="text-gray-400" />
              </button>
              <span className="text-sm text-gray-400 px-2">
                {pagination.page} / {pagination.total_pages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.total_pages}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-xl p-6 w-full max-w-md mx-4" style={glassStyle}>
            <h3 className="text-lg font-semibold text-white mb-4">
              {actionModal.action === 'block' ? 'Block User' : 'Unblock User'}
            </h3>
            <p className="text-gray-400 mb-4">
              {actionModal.action === 'block'
                ? `Are you sure you want to block ${actionModal.user.email}?`
                : `Are you sure you want to unblock ${actionModal.user.email}?`}
            </p>
            {actionModal.action === 'block' && (
              <textarea
                placeholder="Reason for blocking (optional)"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045] mb-4 resize-none"
                rows={3}
              />
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setActionModal(null); setActionReason(''); }}
                className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg text-white transition-colors ${
                  actionModal.action === 'block'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                } disabled:opacity-50`}
              >
                {isSubmitting ? 'Processing...' : actionModal.action === 'block' ? 'Block' : 'Unblock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
