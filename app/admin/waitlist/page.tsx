'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Download } from 'lucide-react';

const glassStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

interface Entry { id: string; email: string; created_at: string; }

export default function AdminWaitlistPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/waitlist?limit=500', { credentials: 'include' });
      if (!res.ok) throw new Error('Не удалось загрузить waitlist');
      const d = await res.json();
      setEntries(d.entries || []);
      setTotal(d.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const exportCsv = () => {
    const rows = [['email', 'created_at'], ...entries.map((e) => [e.email, new Date(e.created_at).toISOString()])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waitlist_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Waitlist</h1>
          <p className="text-sm text-gray-400">Записи с coming-soon · всего {total}</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={entries.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A6045] text-white hover:bg-[#0B6E4F] transition-colors disabled:opacity-50"
        >
          <Download size={16} />
          Экспорт CSV
        </button>
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
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Записей нет.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 border-b border-white/10">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Дата</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-white/5">
                  <td className="px-4 py-3 text-sm text-gray-200">{e.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{new Date(e.created_at).toLocaleString('ru-RU')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
