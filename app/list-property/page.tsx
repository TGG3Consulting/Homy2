'use client';

/**
 * /list-property — публичная точка входа «Разместить объект» (кнопка на страницах
 * «Для кого»). Логика:
 *   - не залогинен            → /login?redirect=/list-property (после входа вернёт сюда)
 *   - залогинен owner/agent   → та же полная форма создания объявления, что в кабинете
 *                               (CreateListingModal из BrokerCabinet — единый источник)
 *   - залогинен с другой ролью → объяснение, что размещение доступно владельцам и агентам
 * Старая самодельная форма удалена: она слала `type` вместо `property_type` и никогда
 * не работала (см. SECURITY-VALIDATION-AUDIT / VULN-022).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';
import HomyLogoMenu from '@/components/homy/HomyLogoMenu';
import { CreateListingModal } from '@/components/homy/BrokerCabinet';
import { BROKER_CSS } from '@/components/homy/brokerStyles';

const ALLOWED_TYPES = ['owner', 'agent'];

const LP_CSS = `
.homy-broker .lpnav{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 18px;background:var(--surface);border-bottom:1px solid var(--hair)}
.homy-broker .lpback{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--hair);background:var(--surface2);color:var(--soft);border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer}
.homy-broker .lpwrap{display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 59px);padding:24px}
.homy-broker .lpcard{width:100%;max-width:460px;background:var(--surface);border:1px solid var(--hair);border-radius:18px;padding:28px;text-align:center}
.homy-broker .lpcard h2{margin:0 0 8px;font-size:20px}
.homy-broker .lpcard p{margin:0 0 18px;font-size:13.5px;color:var(--muted);line-height:1.55}
.homy-broker .lprow{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.homy-broker .lpspin{width:26px;height:26px;border:3px solid var(--hair);border-top-color:var(--em-hi);border-radius:50%;animation:lpspin .8s linear infinite}
@keyframes lpspin{to{transform:rotate(360deg)}}
`;

type PageState = 'loading' | 'form' | 'denied' | 'done' | 'error';

export default function ListPropertyPage() {
  const router = useRouter();
  const { lang } = useT();
  const [state, setState] = useState<PageState>('loading');
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const showToast = useCallback((ok: boolean, text: string) => {
    setToast({ ok, text });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const checkAccess = useCallback(() => {
    setState('loading');
    let alive = true;
    fetch('/api/users/me', { credentials: 'include' })
      .then(async (r) => {
        if (!alive) return;
        if (r.status === 401) {
          router.replace('/login?redirect=/list-property');
          return;
        }
        if (!r.ok) { setState('error'); return; }
        const d = await r.json().catch(() => null);
        const type = d?.user?.user_type;
        setState(ALLOWED_TYPES.includes(type) ? 'form' : 'denied');
      })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [router]);

  useEffect(() => checkAccess(), [checkAccess]);

  return (
    <div className="homy-broker">
      <style dangerouslySetInnerHTML={{ __html: BROKER_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: LP_CSS }} />

      <div className="lpnav">
        <HomyLogoMenu align="left" />
        <button className="lpback" onClick={() => router.back()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          Назад
        </button>
      </div>

      {state === 'loading' && (
        <div className="lpwrap"><div className="lpspin" /></div>
      )}

      {state === 'form' && (
        <CreateListingModal
          lang={lang}
          editing={null}
          showToast={showToast}
          onClose={() => router.back()}
          onDone={() => setState('done')}
        />
      )}

      {state === 'done' && (
        <div className="lpwrap">
          <div className="lpcard">
            <h2>Заявка отправлена</h2>
            <p>Объявление появится в каталоге после проверки модератором. Следить за статусом можно в личном кабинете.</p>
            <div className="lprow">
              <button className="cta" onClick={() => router.push('/dashboard')}>В кабинет</button>
              <button className="lpback" onClick={() => router.push('/')}>На главную</button>
            </div>
          </div>
        </div>
      )}

      {state === 'denied' && (
        <div className="lpwrap">
          <div className="lpcard">
            <h2>Размещение доступно владельцам и агентам</h2>
            <p>Ваш тип аккаунта не позволяет размещать объявления. Сменить тип аккаунта можно в настройках личного кабинета.</p>
            <div className="lprow">
              <button className="cta" onClick={() => router.push('/dashboard')}>В кабинет</button>
              <button className="lpback" onClick={() => router.back()}>Назад</button>
            </div>
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="lpwrap">
          <div className="lpcard">
            <h2>Не удалось проверить доступ</h2>
            <p>Проверьте соединение и попробуйте ещё раз.</p>
            <div className="lprow">
              <button className="cta" onClick={checkAccess}>Повторить</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.ok ? 'ok' : 'err'}`}>{toast.text}</div>}
    </div>
  );
}
