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
  Pencil,
  MailCheck,
  KeyRound,
  Trash2,
  UserPlus,
  Copy,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
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
  const [editModal, setEditModal] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', first_name: '', last_name: '', phone: '', user_type: 'buyer', role: 'user' });
  const [linkModal, setLinkModal] = useState<{ title: string; url: string; emailed: boolean } | null>(null);

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

  // Change a user's product persona (buyer/renter/owner/agent/consultant) through the panel.
  const changeUserType = async (userId: string, userType: string) => {
    setError(null);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId, action: 'set_user_type', user_type: userType }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Не удалось изменить тип пользователя');
      }
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось изменить тип пользователя');
    }
  };

  const openEdit = (user: User) => {
    setEditForm({ first_name: user.first_name || '', last_name: user.last_name || '', phone: user.phone || '' });
    setEditModal(user);
  };

  const saveProfile = async () => {
    if (!editModal) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_id: editModal.id,
          action: 'update_profile',
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          phone: editForm.phone,
        }),
      });
      if (!response.ok) {
        const d = await response.json();
        throw new Error(d.error || 'Не удалось сохранить профиль');
      }
      setEditModal(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить профиль');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyEmail = async (userId: string) => {
    setError(null);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId, action: 'verify_email' }),
      });
      if (!response.ok) {
        const d = await response.json();
        throw new Error(d.error || 'Не удалось подтвердить email');
      }
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось подтвердить email');
    }
  };

  // Force password reset + logout everywhere; surfaces the reset link (email may be off).
  const forceReset = async (user: User) => {
    if (!confirm(`Сбросить пароль и завершить ВСЕ сессии ${user.email}?`)) return;
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ user_id: user.id, action: 'force_reset' }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Не удалось сбросить');
      setLinkModal({ title: 'Пароль сброшен · все сессии завершены', url: d.reset_url, emailed: d.emailed });
    } catch (err) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  // Hard delete (regular users only) — irreversible, wipes their content.
  const removeUser = async (user: User) => {
    if (!confirm(`СТЕРЕТЬ НАВСЕГДА ${user.email} и все его данные (объекты, заявки, лиды)?\nОтменить нельзя.`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?user_id=${encodeURIComponent(user.id)}`, { method: 'DELETE', credentials: 'include' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Не удалось удалить');
      fetchUsers();
    } catch (err) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const submitCreate = async () => {
    setIsSubmitting(true); setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(createForm),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Не удалось создать');
      setCreateModal(false);
      setCreateForm({ email: '', first_name: '', last_name: '', phone: '', user_type: 'buyer', role: 'user' });
      fetchUsers();
      setLinkModal({ title: 'Пользователь создан', url: d.set_password_url, emailed: d.emailed });
    } catch (err) { setError(err instanceof Error ? err.message : 'Ошибка'); }
    finally { setIsSubmitting(false); }
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
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-[#0A6045] hover:bg-[#0B6E4F] transition-colors text-sm font-medium"
        >
          <UserPlus size={16} /> Создать пользователя
        </button>
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
                      <select
                        value={user.user_type || 'buyer'}
                        onChange={(e) => changeUserType(user.id, e.target.value)}
                        className="bg-gray-800 text-gray-200 text-sm rounded px-2 py-1 border border-gray-700 capitalize"
                        title="Тип пользователя (персона)"
                      >
                        {['buyer', 'renter', 'owner', 'agent', 'consultant'].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-2 rounded-lg hover:bg-blue-500/20 transition-colors"
                          title="Редактировать профиль"
                        >
                          <Pencil size={16} className="text-blue-400" />
                        </button>
                        {!user.emailVerified && (
                          <button
                            onClick={() => verifyEmail(user.id)}
                            className="p-2 rounded-lg hover:bg-green-500/20 transition-colors"
                            title="Подтвердить email"
                          >
                            <MailCheck size={16} className="text-green-400" />
                          </button>
                        )}
                        {user.role !== 'admin' && (user.is_blocked ? (
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
                        ))}
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => forceReset(user)}
                            className="p-2 rounded-lg hover:bg-amber-500/20 transition-colors"
                            title="Сбросить пароль + выйти со всех устройств"
                          >
                            <KeyRound size={16} className="text-amber-400" />
                          </button>
                        )}
                        {user.role === 'user' && (
                          <button
                            onClick={() => removeUser(user)}
                            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                            title="Стереть навсегда"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        )}
                      </div>
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

      {/* Edit Profile Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-xl p-6 w-full max-w-md mx-4" style={glassStyle}>
            <h3 className="text-lg font-semibold text-white mb-1">Редактировать профиль</h3>
            <p className="text-gray-400 text-sm mb-4">{editModal.email}</p>
            <div className="space-y-3">
              <input
                placeholder="Имя"
                value={editForm.first_name}
                onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))}
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045]"
              />
              <input
                placeholder="Фамилия"
                value={editForm.last_name}
                onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))}
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045]"
              />
              <input
                placeholder="Телефон"
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045]"
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setEditModal(null)}
                className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={saveProfile}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-white bg-[#0A6045] hover:bg-[#0B6E4F] disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Сохраняем…' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-xl p-6 w-full max-w-md mx-4" style={glassStyle}>
            <h3 className="text-lg font-semibold text-white mb-1">Новый пользователь</h3>
            <p className="text-gray-400 text-sm mb-4">Пароль пользователь задаёт сам по ссылке сброса.</p>
            <div className="space-y-3">
              <input
                placeholder="Email *"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045]"
              />
              <div className="flex gap-3">
                <input
                  placeholder="Имя"
                  value={createForm.first_name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, first_name: e.target.value }))}
                  className="w-1/2 p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045]"
                />
                <input
                  placeholder="Фамилия"
                  value={createForm.last_name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, last_name: e.target.value }))}
                  className="w-1/2 p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045]"
                />
              </div>
              <input
                placeholder="Телефон"
                value={createForm.phone}
                onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045]"
              />
              <div className="flex gap-3">
                <select
                  value={createForm.user_type}
                  onChange={(e) => setCreateForm((f) => ({ ...f, user_type: e.target.value }))}
                  className="w-1/2 p-3 rounded-lg bg-gray-800 border border-white/10 text-white focus:outline-none focus:border-[#0A6045] capitalize"
                >
                  {['buyer', 'renter', 'owner', 'agent', 'consultant'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-1/2 p-3 rounded-lg bg-gray-800 border border-white/10 text-white focus:outline-none focus:border-[#0A6045]"
                >
                  {['user', 'moderator', 'admin'].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setCreateModal(false)} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors">Отмена</button>
              <button
                onClick={submitCreate}
                disabled={isSubmitting || !createForm.email.trim()}
                className="px-4 py-2 rounded-lg text-white bg-[#0A6045] hover:bg-[#0B6E4F] disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Создаём…' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset / set-password link Modal */}
      {linkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-xl p-6 w-full max-w-lg mx-4" style={glassStyle}>
            <h3 className="text-lg font-semibold text-white mb-2">{linkModal.title}</h3>
            <p className="text-gray-400 text-sm mb-3">
              {linkModal.emailed
                ? 'Ссылка отправлена на email пользователя. Можно также передать её вручную:'
                : 'Письмо не отправлено (email не настроен). Передайте ссылку пользователю вручную:'}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <input
                readOnly
                value={typeof window !== 'undefined' ? window.location.origin + linkModal.url : linkModal.url}
                className="flex-1 p-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 text-sm"
              />
              <button
                onClick={() => navigator.clipboard?.writeText((typeof window !== 'undefined' ? window.location.origin : '') + linkModal.url)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Скопировать"
              >
                <Copy size={16} className="text-gray-300" />
              </button>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setLinkModal(null)} className="px-4 py-2 rounded-lg text-white bg-[#0A6045] hover:bg-[#0B6E4F] transition-colors">Готово</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
