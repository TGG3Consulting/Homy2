'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { loc } from '@/lib/i18n';

const glassStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

interface Person { id: string; first_name: string | null; last_name: string | null; email: string; }
const fullName = (p: Person | null) => (p ? [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email : '—');
const money = (n: number | null) => (n != null ? `${Number(n).toLocaleString('ru-RU').replace(/,/g, ' ')} ֏` : '—');

const LEAD_STAGE: Record<string, { label: string; cls: string }> = {
  new: { label: 'Новый', cls: 'bg-blue-500/15 text-blue-300' },
  warm: { label: 'Тёплый', cls: 'bg-amber-500/15 text-amber-300' },
  cold: { label: 'Холодный', cls: 'bg-gray-500/15 text-gray-300' },
};
const DEAL_STAGE: Record<string, string> = { negotiation: 'Переговоры', offer: 'Оферта', contract: 'Договор', closed: 'Закрыта', lost: 'Потеряна' };
const DEAL_STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: 'В работе', cls: 'bg-blue-500/15 text-blue-300' },
  won: { label: 'Выиграна', cls: 'bg-emerald-500/15 text-emerald-300' },
  lost: { label: 'Проиграна', cls: 'bg-red-500/15 text-red-300' },
};

export default function AdminCrmPage() {
  const [tab, setTab] = useState<'leads' | 'deals'>('leads');
  const [leads, setLeads] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [agents, setAgents] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'leads') {
        const [lr, ar] = await Promise.all([
          fetch('/api/admin/leads', { credentials: 'include' }),
          fetch('/api/admin/users?user_type=agent&limit=100', { credentials: 'include' }),
        ]);
        if (!lr.ok) throw new Error('Не удалось загрузить лиды');
        const ld = await lr.json();
        setLeads(ld.leads || []);
        if (ar.ok) {
          const ad = await ar.json();
          setAgents((ad.data?.users || ad.users || []).map((u: any) => ({ id: u.id, first_name: u.first_name, last_name: u.last_name, email: u.email })));
        }
      } else {
        const dr = await fetch('/api/admin/deals', { credentials: 'include' });
        if (!dr.ok) throw new Error('Не удалось загрузить сделки');
        const dd = await dr.json();
        setDeals(dd.deals || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const reassign = async (leadId: string, agentId: string) => {
    if (!agentId) return;
    setError(null);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ lead_id: leadId, action: 'reassign', agent_id: agentId }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Не удалось переназначить'); }
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const removeLead = async (leadId: string, who: string) => {
    if (!confirm(`Удалить лид «${who}»? Действие необратимо.`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads?lead_id=${encodeURIComponent(leadId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Не удалось удалить лид'); }
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">CRM</h1>
        <p className="text-sm text-gray-400">Лиды и сделки по всем агентам</p>
      </div>

      <div className="flex gap-2">
        {(['leads', 'deals'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-[#0A6045] text-white' : 'text-gray-400 hover:bg-white/10'}`}
          >
            {t === 'leads' ? 'Лиды' : 'Сделки'}
          </button>
        ))}
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
        ) : tab === 'leads' ? (
          leads.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Лидов нет.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500 border-b border-white/10">
                  <th className="px-4 py-3">Клиент</th>
                  <th className="px-4 py-3">Объект</th>
                  <th className="px-4 py-3">Интерес</th>
                  <th className="px-4 py-3">Стадия</th>
                  <th className="px-4 py-3">Агент</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => {
                  const st = LEAD_STAGE[l.stage] || { label: l.stage, cls: 'bg-gray-500/15 text-gray-300' };
                  return (
                    <tr key={l.id} className="border-b border-white/5">
                      <td className="px-4 py-3 text-sm text-gray-200 whitespace-nowrap">{fullName(l.client) !== '—' ? fullName(l.client) : (l.client_name || '—')}</td>
                      <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">{loc(l.property?.title, 'ru') || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">{l.interest || '—'}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded ${st.cls}`}>{st.label}</span></td>
                      <td className="px-4 py-3">
                        <select
                          value=""
                          onChange={(e) => reassign(l.id, e.target.value)}
                          className="bg-gray-800 text-gray-200 text-sm rounded px-2 py-1 border border-gray-700"
                          title="Переназначить агента"
                        >
                          <option value="">{fullName(l.agent)} ↺</option>
                          {agents.filter((a) => a.id !== l.agent?.id).map((a) => (
                            <option key={a.id} value={a.id}>→ {fullName(a)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeLead(l.id, fullName(l.client) !== '—' ? fullName(l.client) : (l.client_name || l.interest || 'без имени'))}
                          className="text-gray-500 hover:text-red-400 transition-colors"
                          title="Удалить лид"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : deals.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Сделок нет.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 border-b border-white/10">
                <th className="px-4 py-3">Клиент</th>
                <th className="px-4 py-3">Объект</th>
                <th className="px-4 py-3">Стадия</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Сумма</th>
                <th className="px-4 py-3">Агент</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => {
                const stt = DEAL_STATUS[d.status] || { label: d.status, cls: 'bg-gray-500/15 text-gray-300' };
                return (
                  <tr key={d.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-sm text-gray-200 whitespace-nowrap">{fullName(d.client) !== '—' ? fullName(d.client) : (d.client_name || '—')}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">{loc(d.property?.title, 'ru') || d.title || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{DEAL_STAGE[d.stage] || d.stage}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded ${stt.cls}`}>{stt.label}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{money(d.value)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{fullName(d.agent)}</td>
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
