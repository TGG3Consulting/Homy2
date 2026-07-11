'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { ThemeToggle } from '@/components/homy/ThemeToggle'

const LANDING_CSS = `
.homy-landing{
  --bg:#EEF0F3;--surface:#FFFFFF;--surface2:#FAFAF8;--ink:#14181F;--muted:#6A7382;--soft:#39414D;
  --hair:rgba(20,24,31,.10);--em-hi:#26B083;--em:#0A6045;--em-lo:#04281C;--amber:#B9822A;
  --card-shadow:0 4px 24px rgba(20,20,26,.08);
  background:var(--bg);color:var(--ink);min-height:100vh;
}
html.dark .homy-landing{
  --bg:#080A0E;--surface:#0E1218;--surface2:#171C25;--ink:#F2F4F7;--muted:#8B93A3;--soft:#C5CAD3;
  --hair:rgba(255,255,255,.10);--em-hi:#2BC091;--em:#0B6E4F;--em-lo:#052A1D;--amber:#E0A83B;
  --card-shadow:inset 0 0 0 1px rgba(255,255,255,.06),0 24px 60px rgba(0,0,0,.45);
}
.homy-landing *{box-sizing:border-box}
.homy-landing .em3d{position:relative;overflow:hidden;color:#fff;border:0;background:radial-gradient(135% 175% at 50% 14%,var(--em-hi),var(--em));box-shadow:0 2px 6px rgba(4,40,28,.20),inset 0 1px 0 rgba(255,255,255,.10),inset 0 -2px 5px rgba(3,28,20,.16)}
.homy-landing .em3d>*{position:relative;z-index:2}
.homy-landing .chip{font-size:12px;font-weight:600;padding:6px 12px;border-radius:999px;border:1px solid var(--hair);background:var(--surface);color:var(--soft);cursor:pointer}
.homy-landing .chip:hover{color:var(--em);border-color:color-mix(in srgb,var(--em) 45%,transparent)}
.homy-landing .nav{display:flex;align-items:center;gap:20px;padding:15px 28px;border-bottom:1px solid var(--hair);max-width:1280px;margin:0 auto}
.homy-landing .nav .brand{font-size:17px;font-weight:800;letter-spacing:-.02em;text-decoration:none;color:var(--ink)}
.homy-landing .nav .brand .m{color:var(--em)}
.homy-landing .nav a{font-size:13px;color:var(--muted);text-decoration:none}
.homy-landing .nav a:hover{color:var(--em)}
.homy-landing .btn-sec{background:none;border:0;box-shadow:none;color:var(--soft);font-size:13px;font-weight:600;padding:9px 3px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;position:relative;overflow:visible}
.homy-landing .btn-sec::after{content:'';position:absolute;left:3px;bottom:1px;width:0;height:2px;border-radius:2px;background:var(--em);transition:width .28s cubic-bezier(.22,1,.36,1)}
.homy-landing .btn-sec:hover{color:var(--em)}
.homy-landing .btn-sec:hover::after{width:calc(100% - 6px)}
.homy-landing .split{display:grid;grid-template-columns:1.02fr 1fr;max-width:1280px;margin:0 auto;min-height:calc(100vh - 66px)}
.homy-landing .left{padding:52px 46px;display:flex;flex-direction:column;justify-content:center}
.homy-landing .kick{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--em)}
.homy-landing .left h1{font-size:38px;font-weight:800;letter-spacing:-.02em;line-height:1.08;margin-top:14px}
.homy-landing .left h1 em{font-style:normal;color:var(--em)}
.homy-landing .left p{font-size:14.5px;color:var(--muted);margin-top:16px;line-height:1.6;max-width:400px}
.homy-landing .input{margin-top:24px;display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--hair);border-radius:14px;padding:13px 15px;max-width:440px;box-shadow:var(--card-shadow)}
.homy-landing .input .sp{width:26px;height:26px;border-radius:8px;flex:none;display:flex;align-items:center;justify-content:center}
.homy-landing .input input.txt{flex:1;font-size:14px;color:var(--ink);background:none;border:0;outline:none;font-family:inherit;min-width:0}
.homy-landing .input input.txt::placeholder{color:var(--muted)}
.homy-landing .input .go{width:40px;height:40px;border-radius:11px;flex:none;display:flex;align-items:center;justify-content:center;cursor:pointer}
.homy-landing .exq{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}
.homy-landing .trust{display:flex;gap:8px;align-items:center;margin-top:28px;font-size:12px;color:var(--muted)}
.homy-landing .trust svg{color:var(--em)}
.homy-landing .right{position:relative;overflow:hidden;border-left:1px solid var(--hair);background:var(--surface2)}
.homy-landing .right .photo{position:absolute;inset:0;background-size:cover;background-position:center;background-image:url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&h=820&fit=crop&q=80')}
.homy-landing .right .scrim{position:absolute;inset:0;background:linear-gradient(120deg,color-mix(in srgb,var(--surface2) 78%,transparent),color-mix(in srgb,var(--surface2) 30%,transparent))}
.homy-landing .stack{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;gap:12px;padding:40px}
.homy-landing .badge{align-self:flex-start;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#fff;padding:5px 11px;border-radius:999px}
.homy-landing .ev{background:color-mix(in srgb,var(--surface) 86%,transparent);backdrop-filter:blur(10px);border:1px solid var(--hair);border-radius:14px;padding:13px 15px;display:flex;align-items:center;gap:12px;box-shadow:var(--card-shadow)}
.homy-landing .ev .ic{width:34px;height:34px;border-radius:10px;flex:none;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--em) 16%,transparent);color:var(--em)}
.homy-landing .ev .tx{flex:1}.homy-landing .ev .tx b{font-size:13px;font-weight:600;display:block}.homy-landing .ev .tx span{font-size:11px;color:var(--muted)}
.homy-landing .ev .val{font-size:12px;font-weight:700;color:var(--em)}
.homy-landing .ev.amber .ic{background:color-mix(in srgb,var(--amber) 18%,transparent);color:var(--amber)}.homy-landing .ev.amber .val{color:var(--amber)}
.homy-landing .ev.match{padding:12px 15px}
.homy-landing .ev.match .mr{position:relative;width:36px;height:36px;flex:none}
.homy-landing .ev.match .mr b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
@media(max-width:900px){
  .homy-landing .split{grid-template-columns:1fr}
  .homy-landing .left{padding:34px 22px}
  .homy-landing .left h1{font-size:30px}
  .homy-landing .right{min-height:360px}
  .homy-landing .nav{gap:12px;padding:13px 18px;flex-wrap:wrap}
  .homy-landing .nav a{display:none}
}
`

export default function Home() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [authed, setAuthed] = useState<boolean | null>(null)

  // Reflect auth state in the nav (landing previously always showed "Войти").
  useEffect(() => {
    let alive = true
    fetch('/api/users/me', { credentials: 'include' })
      .then((r) => { if (alive) setAuthed(r.ok) })
      .catch(() => { if (alive) setAuthed(false) })
    return () => { alive = false }
  }, [])

  const go = (text?: string) => {
    const v = (text ?? q).trim()
    router.push(v ? `/results?query=${encodeURIComponent(v)}` : '/results')
  }

  return (
    <div className="homy-landing">
      <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />

      {/* nav */}
      <div className="nav">
        <Link href="/" className="brand">
          Ho<span className="m">m</span>y
        </Link>
        <Link href="/results">Купить</Link>
        <Link href="/results">Снять</Link>
        <Link href="/for-owners">Владельцам</Link>
        <Link href="/how-it-works">Как это работает</Link>
        <span style={{ marginLeft: 'auto' }} />
        <LanguageSwitcher variant="light" />
        <ThemeToggle />
        {authed ? (
          <Link href="/dashboard" className="btn-sec">Личный кабинет</Link>
        ) : (
          <Link href="/login" className="btn-sec">Войти</Link>
        )}
      </div>

      {/* split hero */}
      <div className="split">
        <div className="left">
          <div className="kick">AI real estate · Armenia</div>
          <h1>
            Не доска объявлений.
            <br />
            <em>Слой доверия.</em>
          </h1>
          <p>
            Homy разбирает каждый объект по фактам — застройщик, юридическая чистота, район,
            маршрут, инвестиция — и честно показывает и плюсы, и риски.
          </p>

          <form
            className="input"
            onSubmit={(e) => {
              e.preventDefault()
              go()
            }}
          >
            <span className="sp em3d">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
              </svg>
            </span>
            <input
              className="txt"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Опишите, какой дом ищете…"
            />
            <button type="submit" className="go em3d" aria-label="Искать">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>

          <div className="exq">
            {['Семья, рядом школа', 'Тихая 2-комн в Кентроне', 'До 200 000, Арабкир'].map((c) => (
              <span key={c} className="chip" onClick={() => go(c)}>
                {c}
              </span>
            ))}
          </div>

          <div className="trust">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12.5l5 5 11-11" />
            </svg>
            1 500 объектов проверено · честно о плюсах и минусах
          </div>
        </div>

        <div className="right">
          <div className="photo" />
          <div className="scrim" />
          <div className="stack">
            <span className="badge em3d">
              <span>Пример разбора Homy</span>
            </span>

            <div className="ev match">
              <div className="mr">
                <svg width="36" height="36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="var(--hair)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="var(--em)" strokeWidth="3" strokeLinecap="round" strokeDasharray="94.2" strokeDashoffset="1.9" transform="rotate(-90 18 18)" />
                </svg>
                <b>98</b>
              </div>
              <div className="tx">
                <b>Совпадение с запросом</b>
                <span>Северный проспект · 2-комн · 350 000 AMD</span>
              </div>
            </div>

            <div className="ev">
              <div className="ic">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
                </svg>
              </div>
              <div className="tx">
                <b>Застройщик и юр. чистота</b>
                <span>репутация, споры, собственность</span>
              </div>
              <div className="val">проверено</div>
            </div>

            <div className="ev">
              <div className="ic">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 21h18M5 21V7l7-4 7 4v14" />
                </svg>
              </div>
              <div className="tx">
                <b>Район и маршрут</b>
                <span>школа 6 мин · метро 10 мин</span>
              </div>
              <div className="val">рядом</div>
            </div>

            <div className="ev amber">
              <div className="ic">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 3L2 20h20L12 3z" />
                </svg>
              </div>
              <div className="tx">
                <b>Парковка</b>
                <span>Homy честно о минусах</span>
              </div>
              <div className="val">уточняется</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
