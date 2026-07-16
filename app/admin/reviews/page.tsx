'use client';

import { useCallback, useEffect, useState } from 'react';
import { Star, Trash2, AlertCircle, Filter } from 'lucide-react';

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
interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  agent: Person | null;
  user: Person | null;
}

const fullName = (p: Person | null) =>
  p ? [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email : '—';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxRating, setMaxRating] = useState('');
  const [confirm, setConfirm] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (maxRating) params.set('max_rating', maxRating);
      const res = await fetch(`/api/admin/reviews?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Не удалось загрузить отзывы');
      const d = await res.json();
      setReviews(d.reviews || []);
      setTotal(d.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [maxRating]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const remove = async () => {
    if (!confirm) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ review_id: confirm.id }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Не удалось удалить');
      }
      setConfirm(null);
      fetchReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить');
    } finally {
      setBusy(false);
    }
  };

  const stars = (n: number) => (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={13} className={i <= n ? 'text-amber-400 fill-amber-400' : 'text-gray-600'} />
      ))}
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Отзывы о брокерах</h1>
          <p className="text-sm text-gray-400">Модерация отзывов и оценок агентов · всего {total}</p>
        </div>
      </div>

      <div className="rounded-xl p-4" style={glassStyle}>
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-gray-400" />
          <select
            value={maxRating}
            onChange={(e) => setMaxRating(e.target.value)}
            className="bg-gray-800 text-gray-200 text-sm rounded px-3 py-2 border border-gray-700"
          >
            <option value="">Все оценки</option>
            <option value="2">Только низкие (≤ 2★)</option>
            <option value="3">≤ 3★</option>
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
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Отзывов нет.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 border-b border-white/10">
                <th className="px-4 py-3">Брокер</th>
                <th className="px-4 py-3">Автор</th>
                <th className="px-4 py-3">Оценка</th>
                <th className="px-4 py-3">Комментарий</th>
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((rv) => (
                <tr key={rv.id} className="border-b border-white/5">
                  <td className="px-4 py-3 text-sm text-gray-200 whitespace-nowrap">{fullName(rv.agent)}</td>
                  <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{fullName(rv.user)}</td>
                  <td className="px-4 py-3">{stars(rv.rating)}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 max-w-md">{rv.comment || <span className="text-gray-600">—</span>}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{new Date(rv.created_at).toLocaleDateString('ru-RU')}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setConfirm(rv)}
                      className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                      title="Удалить отзыв"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-xl p-6 w-full max-w-md mx-4" style={glassStyle}>
            <h3 className="text-lg font-semibold text-white mb-2">Удалить отзыв?</h3>
            <p className="text-gray-400 text-sm mb-4">
              Отзыв о брокере <b className="text-gray-200">{fullName(confirm.agent)}</b> от {fullName(confirm.user)} ({confirm.rating}★) будет удалён без возможности восстановления.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors">Отмена</button>
              <button onClick={remove} disabled={busy} className="px-4 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors">
                {busy ? 'Удаляем…' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
