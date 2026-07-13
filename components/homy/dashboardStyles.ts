/** 1:1 buyer dashboard (C1) styles from Homy-Batch3 mockup. Scoped under .homy-dash. Light base + html.dark. */
export const DASHBOARD_CSS = `
.homy-dash{--bg:#EEF0F3;--surface:#FFFFFF;--surface2:#FAFAF8;--ink:#14181F;--muted:#6A7382;--soft:#39414D;--hair:rgba(20,24,31,.10);--em-hi:#26B083;--em:#0A6045;--amber:#B9822A;--card-shadow:0 4px 24px rgba(20,20,26,.08);
  min-height:100vh;background:var(--bg);color:var(--ink);font-family:'Montserrat',sans-serif;-webkit-font-smoothing:antialiased}
html.dark .homy-dash{--bg:#080A0E;--surface:#0E1218;--surface2:#171C25;--ink:#F2F4F7;--muted:#8B93A3;--soft:#C5CAD3;--hair:rgba(255,255,255,.10);--em-hi:#2BC091;--em:#0B6E4F;--amber:#E0A83B;--card-shadow:inset 0 0 0 1px rgba(255,255,255,.06),0 24px 60px rgba(0,0,0,.45)}
.homy-dash *{box-sizing:border-box}

/* top nav */
.homy-dash .wnav{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:16px;padding:13px 24px;background:color-mix(in srgb,var(--surface) 92%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--hair)}
.homy-dash .wnav .sp{margin-left:auto}
.homy-dash .themebtn{display:flex;gap:2px;background:var(--surface);border:1px solid var(--hair);border-radius:999px;padding:4px}
.homy-dash .themebtn .o{width:32px;height:28px;border-radius:999px;display:flex;align-items:center;justify-content:center;color:var(--muted);cursor:pointer;border:0;background:none}
.homy-dash .themebtn .o.on{background:radial-gradient(120% 160% at 50% 18%,var(--em-hi),var(--em));color:#fff}

/* tab strip */
.homy-dash .tabs{display:flex;gap:6px;padding:0 24px;border-bottom:1px solid var(--hair);background:color-mix(in srgb,var(--surface) 92%,transparent);overflow-x:auto;scrollbar-width:none}
.homy-dash .tabs::-webkit-scrollbar{display:none}
.homy-dash .tabs .tb{flex:none;padding:13px 6px;margin:0 8px;font-size:13px;font-weight:600;color:var(--muted);cursor:pointer;background:none;border:0;font-family:inherit;border-bottom:2px solid transparent;white-space:nowrap;display:inline-flex;align-items:center;gap:7px}
.homy-dash .tabs .tb.on{color:var(--em);border-bottom-color:var(--em);font-weight:700}
.homy-dash .tabs .tb .cnt{font-size:10.5px;font-weight:700;background:color-mix(in srgb,var(--em) 12%,transparent);color:var(--em);border-radius:999px;padding:1px 6px}
/* mobile: current-section label (навигация — через меню Homy) */
.homy-dash .dcur{display:none;font-size:14px;font-weight:600;color:var(--muted);white-space:nowrap}
@media(max-width:640px){
  .homy-dash .tabs{display:none}
  .homy-dash .dcur{display:inline}
  .homy-dash .wnav{gap:10px;padding:12px 16px}
}

/* dashboard overview (C1) */
.homy-dash .dash{max-width:1080px;margin:0 auto;padding:26px 24px 80px}
.homy-dash .dash h2{font-size:22px;font-weight:800;letter-spacing:-.02em}
.homy-dash .dash .lead{font-size:13px;color:var(--muted);margin-top:4px}
.homy-dash .dstats{display:flex;gap:12px;margin-top:18px;flex-wrap:wrap}
.homy-dash .dstat{flex:1;min-width:140px;background:var(--surface);border:1px solid var(--hair);border-radius:14px;padding:14px}
.homy-dash .dstat b{font-size:22px;font-weight:800;letter-spacing:-.02em}
.homy-dash .dstat span{font-size:11px;color:var(--muted);display:block;margin-top:2px}
.homy-dash .dsec{margin-top:24px}
.homy-dash .dsec .sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.homy-dash .dsec .sh h3{font-size:15px;font-weight:700}
.homy-dash .dsec .sh a{font-size:12px;color:var(--em);font-weight:600;cursor:pointer}
.homy-dash .resume{display:flex;align-items:center;gap:14px;background:var(--surface);border:1px solid var(--hair);border-radius:14px;padding:16px}
.homy-dash .resume .ava{width:44px;height:44px;border-radius:12px;flex:none;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;background:radial-gradient(135% 175% at 50% 14%,var(--em-hi),var(--em));box-shadow:0 2px 6px rgba(4,40,28,.2),inset 0 1px 0 rgba(255,255,255,.12),inset 0 -2px 5px rgba(3,28,20,.18)}
.homy-dash .resume .rinfo{flex:1;min-width:0}
.homy-dash .resume b{font-size:14px;display:block}
.homy-dash .resume span{font-size:12px;color:var(--muted)}
.homy-dash .resume .open{background:none;border:0;color:var(--em);font-weight:700;font-size:14px;font-family:inherit;cursor:pointer;position:relative;padding:9px 3px;flex:none;overflow:visible}
.homy-dash .resume .open::before{content:'';position:absolute;left:3px;right:3px;bottom:1px;height:2px;border-radius:2px;background:var(--hair)}
.homy-dash .resume .open::after{content:'';position:absolute;left:3px;bottom:1px;width:calc(100% - 6px);height:3px;border-radius:3px;background:linear-gradient(90deg,var(--em),var(--em-hi));transition:transform .28s ease}
.homy-dash .resume .open:hover{color:var(--em-hi)}

/* recommendation grid + cards */
.homy-dash .dgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
@media(max-width:820px){.homy-dash .dgrid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.homy-dash .dgrid{grid-template-columns:1fr}}
.homy-dash .card{background:var(--surface);border:1px solid var(--hair);border-radius:16px;overflow:hidden;cursor:pointer;transition:transform .18s}
.homy-dash .card:hover{transform:translateY(-3px)}
.homy-dash .card .ph{position:relative;aspect-ratio:16/11;background-size:cover;background-position:center;background-color:var(--surface2)}
.homy-dash .card .ph .mr{position:absolute;top:12px;left:12px;width:36px;height:36px}
.homy-dash .card .ph .mr svg{transform:rotate(-90deg)}
.homy-dash .card .ph .mr b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700}
.homy-dash .card .b{padding:13px}
.homy-dash .card .cp{font-size:18px;font-weight:700;letter-spacing:-.02em}.homy-dash .card .cp span{font-size:10px;color:var(--muted);font-weight:500;margin-left:4px}
.homy-dash .card .ct{font-size:13px;font-weight:600;margin-top:5px}
.homy-dash .card .cl{font-size:11px;color:var(--muted);margin-top:3px}

/* tab content wrapper (reused real components) */
.homy-dash .tabwrap{max-width:1080px;margin:0 auto;padding:22px 24px 80px}

/* states */
.homy-dash .dstate{min-height:40vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center}
.homy-dash .dspin{width:36px;height:36px;border-radius:50%;border:3px solid var(--hair);border-top-color:var(--em);animation:homydspin .9s linear infinite}
@keyframes homydspin{to{transform:rotate(360deg)}}
.homy-dash .dstate .cbtn{font-size:13px;font-weight:700;color:var(--em);background:none;border:0;cursor:pointer;font-family:inherit}
`
