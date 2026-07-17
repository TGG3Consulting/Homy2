'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Pencil, Trash2, Eye, EyeOff, Filter } from 'lucide-react';
import { loc } from '@/lib/i18n';

const glassStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

interface Person { id: string; first_name: string | null; last_name: string | null; email: string; }
interface Property {
  id: string;
  title: string;
  address: string | null;
  district: string | null;
  city: string | null;
  price: number | null;
  currency: string | null;
  available: boolean;
  verified: boolean;
  owner: Person | null;
}

const fullName = (p: Person | null) => (p ? [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email : '—');
const money = (n: number | null, c: string | null) => (n != null ? `${Number(n).toLocaleString('ru-RU').replace(/,/g, ' ')} ${c || 'AMD'}` : '—');

export default function AdminPropertiesPage() {
  const [items, setItems] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avail, setAvail] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [edit, setEdit] = useState<Property | null>(null);
  const [editForm, setEditForm] = useState({ address: '', price: '' });
  const [confirmDel, setConfirmDel] = useState<Property | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (avail) params.set('available', avail);
      const res = await fetch(`/api/admin/properties?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Не удалось загрузить объекты');
      const d = await res.json();
      setItems(d.properties || []);
      setTotal(d.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [avail]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/properties/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || 'Не удалось сохранить');
    }
  };

  const toggleAvailable = async (p: Property) => {
    setBusy(p.id);
    setError(null);
    try {
      await patch(p.id, { available: !p.available });
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setBusy(null);
    }
  };

  const openEdit = (p: Property) => {
    setEditForm({ address: p.address || '', price: p.price != null ? String(p.price) : '' });
    setEdit(p);
  };

  const saveEdit = async () => {
    if (!edit) return;
    setBusy(edit.id);
    setError(null);
    try {
      await patch(edit.id, { address: editForm.address, price: editForm.price === '' ? null : Number(editForm.price) });
      setEdit(null);
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!confirmDel) return;
    setBusy(confirmDel.id);
    setError(null);
    try {
      const res = await fetch(`/api/properties/${confirmDel.id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Не удалось удалить'); }
      setConfirmDel(null);
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Объекты</h1>
        <p className="text-sm text-gray-400">Управление опубликованными объектами · всего {total}</p>
      </div>

      <div className="rounded-xl p-4" style={glassStyle}>
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-gray-400" />
          <select value={avail} onChange={(e) => setAvail(e.target.value)} className="bg-gray-800 text-gray-200 text-sm rounded px-3 py-2 border border-gray-700">
            <option value="">Все</option>
            <option value="true">Опубликованные</option>
            <option value="false">Снятые</option>
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
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Объектов нет.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 border-b border-white/10">
                <th className="px-4 py-3">Объект</th>
                <th className="px-4 py-3">Адрес</th>
                <th className="px-4 py-3">Цена</th>
                <th className="px-4 py-3">Владелец</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-4 py-3 text-sm text-gray-200 max-w-xs truncate">{loc(p.title, 'ru') || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">{[p.address, loc(p.district, 'ru')].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{money(p.price, p.currency)}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{fullName(p.owner)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${p.available ? 'bg-emerald-500/15 text-emerald-300' : 'bg-gray-500/15 text-gray-400'}`}>
                      {p.available ? 'Опубликован' : 'Снят'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} disabled={busy === p.id} className="p-2 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50" title="Редактировать">
                        <Pencil size={16} className="text-blue-400" />
                      </button>
                      <button onClick={() => toggleAvailable(p)} disabled={busy === p.id} className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50" title={p.available ? 'Снять с публикации' : 'Опубликовать'}>
                        {p.available ? <EyeOff size={16} className="text-amber-400" /> : <Eye size={16} className="text-emerald-400" />}
                      </button>
                      <button onClick={() => setConfirmDel(p)} disabled={busy === p.id} className="p-2 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50" title="Удалить">
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-xl p-6 w-full max-w-md mx-4" style={glassStyle}>
            <h3 className="text-lg font-semibold text-white mb-1">Редактировать объект</h3>
            <p className="text-gray-400 text-sm mb-4 truncate">{loc(edit.title, 'ru')}</p>
            <div className="space-y-3">
              <input placeholder="Адрес" value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045]" />
              <input placeholder="Цена" type="number" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045]" />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setEdit(null)} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors">Отмена</button>
              <button onClick={saveEdit} disabled={busy === edit.id} className="px-4 py-2 rounded-lg text-white bg-[#0A6045] hover:bg-[#0B6E4F] disabled:opacity-50 transition-colors">{busy === edit.id ? 'Сохраняем…' : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-xl p-6 w-full max-w-md mx-4" style={glassStyle}>
            <h3 className="text-lg font-semibold text-white mb-2">Удалить объект?</h3>
            <p className="text-gray-400 text-sm mb-4">«{loc(confirmDel.title, 'ru')}» будет удалён без возможности восстановления.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDel(null)} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors">Отмена</button>
              <button onClick={remove} disabled={busy === confirmDel.id} className="px-4 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors">{busy === confirmDel.id ? 'Удаляем…' : 'Удалить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
