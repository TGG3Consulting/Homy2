'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Circle } from 'lucide-react';

const glassStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

interface Person { id: string; first_name: string | null; last_name: string | null; email: string; }
interface Consultant extends Person { is_online: boolean; assigned: number; }
interface Conversation {
  id: string;
  subject: string | null;
  status: string;
  client: Person | null;
  consultant: Person | null;
  _count?: { messages: number };
}

const fullName = (p: Person | null) => (p ? [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email : '—');
const STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: 'Открыт', cls: 'bg-amber-500/15 text-amber-300' },
  assigned: { label: 'Назначен', cls: 'bg-blue-500/15 text-blue-300' },
  resolved: { label: 'Решён', cls: 'bg-emerald-500/15 text-emerald-300' },
  closed: { label: 'Закрыт', cls: 'bg-gray-500/15 text-gray-400' },
};

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/support', { credentials: 'include' });
      if (!res.ok) throw new Error('Не удалось загрузить поддержку');
      const d = await res.json();
      setConversations(d.conversations || []);
      setConsultants(d.consultants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const assign = async (conversationId: string, consultantId: string) => {
    setError(null);
    try {
      const res = await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversation_id: conversationId, consultant_id: consultantId || null }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Не удалось назначить'); }
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Поддержка</h1>
        <p className="text-sm text-gray-400">Диалоги поддержки и нагрузка консультантов</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Consultant roster */}
      <div className="rounded-xl p-4" style={glassStyle}>
        <h2 className="text-sm uppercase text-gray-500 mb-3">Консультанты</h2>
        {consultants.length === 0 ? (
          <p className="text-sm text-gray-400">Консультантов нет. Назначьте роль в разделе «Пользователи».</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {consultants.map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/5 border border-white/10">
                <Circle size={9} className={c.is_online ? 'text-emerald-400 fill-emerald-400' : 'text-gray-600 fill-gray-600'} />
                <span className="text-sm text-gray-200">{fullName(c)}</span>
                <span className="text-xs text-gray-500">· {c.assigned} в работе</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conversations */}
      <div className="rounded-xl overflow-hidden" style={glassStyle}>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Загрузка…</div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Диалогов поддержки нет.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 border-b border-white/10">
                <th className="px-4 py-3">Клиент</th>
                <th className="px-4 py-3">Тема</th>
                <th className="px-4 py-3">Сообщений</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Консультант</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((cv) => {
                const st = STATUS[cv.status] || { label: cv.status, cls: 'bg-gray-500/15 text-gray-300' };
                return (
                  <tr key={cv.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-sm text-gray-200 whitespace-nowrap">{fullName(cv.client)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">{cv.subject || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{cv._count?.messages ?? 0}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded ${st.cls}`}>{st.label}</span></td>
                    <td className="px-4 py-3">
                      <select
                        value={cv.consultant?.id || ''}
                        onChange={(e) => assign(cv.id, e.target.value)}
                        className="bg-gray-800 text-gray-200 text-sm rounded px-2 py-1 border border-gray-700"
                        title="Назначить консультанта"
                      >
                        <option value="">— не назначен —</option>
                        {consultants.map((c) => (
                          <option key={c.id} value={c.id}>{fullName(c)}{c.is_online ? ' ●' : ''}</option>
                        ))}
                      </select>
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
