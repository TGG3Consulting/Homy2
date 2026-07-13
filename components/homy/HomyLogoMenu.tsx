'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown, Home, LayoutGrid, Heart, Bookmark, Calendar,
  MessageCircle, User, Settings, LogOut, LogIn,
  Building2, Users, Sparkles, Briefcase, ShieldCheck,
} from 'lucide-react';

const CSS = `
.homy-lmw{position:relative;display:inline-flex;font-family:'Montserrat',sans-serif}
.homy-lmw .lm-btn{background:none;border:0;font-family:inherit;font-weight:800;cursor:pointer;color:inherit;display:inline-flex;align-items:center;letter-spacing:-.02em;padding:0;font-size:inherit}
.homy-lmw .lm-btn .m{color:var(--accent,#0A6045)}
.homy-lmw .lm-btn>svg{opacity:.55;margin-left:5px}
.homy-lmw .lm-pop{--lm-surface:#fff;--lm-hair:rgba(20,24,31,.10);--lm-ink:#14181F;--lm-muted:#6A7382;--lm-em:#0A6045;
  position:absolute;top:calc(100% + 8px);left:0;z-index:200;min-width:236px;background:var(--lm-surface);border:1px solid var(--lm-hair);
  border-radius:14px;box-shadow:0 18px 46px rgba(20,24,31,.18);padding:8px}
html.dark .homy-lmw .lm-pop{--lm-surface:#0E1218;--lm-hair:rgba(255,255,255,.10);--lm-ink:#F2F4F7;--lm-muted:#8B93A3;--lm-em:#2BC091;box-shadow:0 18px 46px rgba(0,0,0,.55)}
.homy-lmw .lm-pop.right{left:auto;right:0}
.homy-lmw:not(.open) .lm-pop{display:none}
.homy-lmw .lm-head{font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--lm-muted);padding:8px 12px 4px}
.homy-lmw .lm-i{display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:10px;font-size:13.5px;font-weight:500;color:var(--lm-ink);cursor:pointer;text-decoration:none;background:none;border:0;width:100%;font-family:inherit;text-align:left}
.homy-lmw .lm-i:hover{background:color-mix(in srgb,var(--lm-muted) 14%,transparent)}
.homy-lmw .lm-i svg{color:var(--lm-muted);flex:none}
.homy-lmw .lm-i.acc{color:var(--lm-em)}.homy-lmw .lm-i.acc svg{color:var(--lm-em)}
.homy-lmw .lm-sep{height:1px;background:var(--lm-hair);margin:6px 4px}
`;

interface HomyLogoMenuProps {
  align?: 'left' | 'right';
  className?: string;
}

/** Brand wordmark + dropdown menu — global nav present on every screen. */
export default function HomyLogoMenu({ align = 'left', className = '' }: HomyLogoMenuProps) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [logged, setLogged] = useState<boolean | null>(null);
  const [role, setRole] = useState<string | null>(null);      // user_type
  const [sysRole, setSysRole] = useState<string | null>(null); // role: admin/moderator/user

  useEffect(() => {
    let alive = true;
    fetch('/api/users/me', { credentials: 'include' })
      .then(async (r) => {
        if (!alive) return;
        setLogged(r.ok);
        if (r.ok) { try { const d = await r.json(); setRole(d?.user_type || d?.user?.user_type || null); setSysRole(d?.role || d?.user?.role || null); } catch {} }
      })
      .catch(() => alive && setLogged(false));
    return () => {
      alive = false;
    };
  }, []);

  const isAdmin = sysRole === 'admin' || sysRole === 'moderator' || role === 'admin';
  const isBroker = role === 'agent' || role === 'owner';

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const logout = async () => {
    setOpen(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    router.push('/');
    router.refresh();
  };

  const item = (icon: React.ReactNode, label: string, onClick: () => void, acc = false) => (
    <button type="button" className={`lm-i${acc ? ' acc' : ''}`} onClick={onClick}>
      {icon}
      {label}
    </button>
  );

  return (
    <div ref={wrapRef} className={`homy-lmw${open ? ' open' : ''} ${className}`}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <button
        type="button"
        className="lm-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        Ho<span className="m">m</span>y
        <ChevronDown size={13} />
      </button>
      <div className={`lm-pop${align === 'right' ? ' right' : ''}`}>
        {logged !== false ? (
          isAdmin ? (
            <>
              <div className="lm-head">Администрирование</div>
              {item(<LayoutGrid size={16} />, 'Обзор', () => go('/dashboard'))}
              {item(<ShieldCheck size={16} />, 'Модерация', () => go('/dashboard?tab=moderation'))}
              {item(<Users size={16} />, 'Пользователи', () => go('/dashboard?tab=users'))}
              <div className="lm-sep" />
              {item(<Home size={16} />, 'Главная', () => go('/'))}
              {item(<LogOut size={16} />, 'Выйти', logout)}
            </>
          ) : isBroker ? (
            <>
              <div className="lm-head">Кабинет</div>
              {item(<LayoutGrid size={16} />, 'Дашборд', () => go('/dashboard'))}
              {item(<Building2 size={16} />, 'Объявления', () => go('/dashboard?tab=listings'))}
              {item(<Users size={16} />, 'Клиенты', () => go('/dashboard?tab=clients'))}
              {item(<Calendar size={16} />, 'Просмотры', () => go('/dashboard?tab=viewings'))}
              {item(<Briefcase size={16} />, 'Сделки', () => go('/dashboard?tab=deals'))}
              <div className="lm-sep" />
              {item(<Home size={16} />, 'Главная', () => go('/'))}
              {item(<Settings size={16} />, 'Настройки', () => go('/dashboard?tab=settings'))}
              {item(<LogOut size={16} />, 'Выйти', logout)}
            </>
          ) : (
            <>
              <div className="lm-head">Личный кабинет</div>
              {item(<LayoutGrid size={16} />, 'Обзор', () => go('/dashboard'))}
              {item(<Heart size={16} />, 'Избранное', () => go('/dashboard?tab=favorites'))}
              {item(<Bookmark size={16} />, 'Поиски', () => go('/dashboard?tab=searches'))}
              {item(<Calendar size={16} />, 'Просмотры', () => go('/dashboard?tab=viewings'))}
              {item(<Sparkles size={16} />, 'Рекомендации', () => go('/dashboard?tab=recommendations'))}
              {item(<MessageCircle size={16} />, 'Сообщения', () => go('/dashboard?tab=messages'))}
              {item(<User size={16} />, 'Профиль', () => go('/dashboard?tab=settings'))}
              {item(<Settings size={16} />, 'Настройки', () => go('/dashboard?tab=settings'))}
              <div className="lm-sep" />
              {item(<Home size={16} />, 'Главная', () => go('/'))}
              {item(<LogOut size={16} />, 'Выйти', logout)}
            </>
          )
        ) : (
          <>
            {item(<LogIn size={16} />, 'Войти', () => go('/login'), true)}
            {item(<Home size={16} />, 'Главная', () => go('/'))}
          </>
        )}
      </div>
    </div>
  );
}
