'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';
import { loc } from '@/lib/i18n';

const glassStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

interface Person {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
}
interface Viewing {
  id: string;
  scheduledAt: string;
  status: string;
  property: { id: string; title: string } | null;
  client: Person | null;
  agent: Person | null;
}

const fullName = (p: Person | null) =>
  p ? [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email : '—';

const STATUS: Record<string, { label: string; cls: string }> = {
  pending_client: { label: 'Ждёт клиента', cls: 'bg-amber-500/15 text-amber-300' },
  pending_agent: { label: 'Ждёт агента', cls: 'bg-amber-500/15 text-amber-300' },
  confirmed: { label: 'Подтверждён', cls: 'bg-blue-500/15 text-blue-300' },
  completed: { label: 'Завершён', cls: 'bg-emerald-500/15 text-emerald-300' },
  cancelled: { label: 'Отменён', cls: 'bg-red-500/15 text-red-300' },
};

export default function AdminViewingsPage() {
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const fetchViewings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/viewings?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Не удалось загрузить просмотры');
      const d = await res.json();
      setViewings(d.viewings || []);
      setTotal(d.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchViewings();
  }, [fetchViewings]);

  const act = async (id: string, action: 'complete' | 'cancel') => {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch('/api/admin/viewings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ viewing_id: id, action }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Не удалось выполнить действие');
      }
      fetchViewings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setBusy(null);
    }
  };

  const fmtDate = (s: string) => {
    const d = new Date(s);
    return isNaN(d.getTime())
      ? '—'
      : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) +
          ' ' +
          d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Просмотры</h1>
        <p className="text-sm text-gray-400">Все запросы на просмотр · всего {total}</p>
      </div>

      <div className="rounded-xl p-4" style={glassStyle}>
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 text-gray-200 text-sm rounded px-3 py-2 border border-gray-700"
          >
            <option value="">Все статусы</option>
            <option value="pending_agent">Ждёт агента</option>
            <option value="pending_client">Ждёт клиента</option>
            <option value="confirmed">Подтверждён</option>
            <option value="completed">Завершён</option>
            <option value="cancelled">Отменён</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={glassStyle}>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Загрузка…</div>
        ) : viewings.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Просмотров нет.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 border-b border-white/10">
                <th className="px-4 py-3">Объект</th>
                <th className="px-4 py-3">Клиент</th>
                <th className="px-4 py-3">Агент</th>
                <th className="px-4 py-3">Время</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {viewings.map((v) => {
                const st = STATUS[v.status] || { label: v.status, cls: 'bg-gray-500/15 text-gray-300' };
                const closed = v.status === 'completed' || v.status === 'cancelled';
                return (
                  <tr key={v.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-sm text-gray-200 max-w-xs truncate">{loc(v.property?.title, 'ru') || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{fullName(v.client)}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{fullName(v.agent)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{fmtDate(v.scheduledAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!closed && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => act(v.id, 'complete')}
                            disabled={busy === v.id}
                            className="p-2 rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                            title="Отметить завершённым"
                          >
                            <CheckCircle size={16} className="text-emerald-400" />
                          </button>
                          <button
                            onClick={() => act(v.id, 'cancel')}
                            disabled={busy === v.id}
                            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            title="Отменить"
                          >
                            <XCircle size={16} className="text-red-400" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
