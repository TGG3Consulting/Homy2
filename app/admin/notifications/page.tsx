'use client';

import { useState } from 'react';
import { AlertCircle, Send, CheckCircle } from 'lucide-react';

const glassStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const TARGETS: { value: string; label: string }[] = [
  { value: 'all', label: 'Все пользователи' },
  { value: 'buyer', label: 'Покупатели' },
  { value: 'renter', label: 'Арендаторы' },
  { value: 'owner', label: 'Владельцы' },
  { value: 'agent', label: 'Агенты' },
  { value: 'consultant', label: 'Консультанты' },
];

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);

  const send = async () => {
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, body, target }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Не удалось отправить');
      setResult(d.sent ?? 0);
      setTitle('');
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">Уведомления</h1>
        <p className="text-sm text-gray-400">Рассылка системного уведомления пользователям</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {result !== null && (
        <div className="flex items-center gap-2 rounded-lg p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
          <CheckCircle size={16} />
          Отправлено получателям: {result}
        </div>
      )}

      <div className="rounded-xl p-6 space-y-4" style={glassStyle}>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Аудитория</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-700"
          >
            {TARGETS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Заголовок</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Плановые работы"
            className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045]"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Текст</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Текст уведомления…"
            className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045] resize-none"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={send}
            disabled={sending || !title.trim() || !body.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A6045] text-white hover:bg-[#0B6E4F] transition-colors disabled:opacity-50"
          >
            <Send size={16} />
            {sending ? 'Отправка…' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
}
