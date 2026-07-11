/** 1:1 catalog grid (A8) styles from Homy-Batch1 mockup. Scoped under .homy-catalog. Light base + html.dark. */
export const CATALOG_CSS = `
.homy-catalog{--bg:#EEF0F3;--surface:#FFFFFF;--surface2:#FAFAF8;--ink:#14181F;--muted:#6A7382;--soft:#39414D;--hair:rgba(20,24,31,.10);--em-hi:#26B083;--em:#0A6045;--amber:#B9822A;--card-shadow:0 4px 24px rgba(20,20,26,.08);
  min-height:100vh;background:var(--bg);color:var(--ink);font-family:'Montserrat',sans-serif;-webkit-font-smoothing:antialiased}
html.dark .homy-catalog{--bg:#080A0E;--surface:#0E1218;--surface2:#171C25;--ink:#F2F4F7;--muted:#8B93A3;--soft:#C5CAD3;--hair:rgba(255,255,255,.10);--em-hi:#2BC091;--em:#0B6E4F;--amber:#E0A83B;--card-shadow:inset 0 0 0 1px rgba(255,255,255,.06),0 24px 60px rgba(0,0,0,.45)}
.homy-catalog *{box-sizing:border-box}

/* top nav */
.homy-catalog .wnav{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:16px;padding:13px 24px;background:color-mix(in srgb,var(--surface) 92%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--hair)}
.homy-catalog .wnav .bk{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--em);cursor:pointer;background:none;border:0;font-family:inherit}
.homy-catalog .wnav .sp{margin-left:auto}

.homy-catalog .wrap{max-width:1300px;margin:0 auto;padding:22px 24px 90px}

/* filter chips row */
.homy-catalog .filters{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px}
.homy-catalog .chip{font-size:12.5px;font-weight:600;padding:7px 13px;border-radius:999px;border:1px solid var(--hair);background:var(--surface);color:var(--soft);cursor:pointer;font-family:inherit}
.homy-catalog .chip.active{background:none;border:0;border-radius:0;color:var(--em);box-shadow:inset 0 -2.5px 0 0 var(--em);font-weight:700;padding-left:4px;padding-right:4px}
.homy-catalog .count{margin-left:auto;font-size:12px;color:var(--muted);display:flex;align-items:center;gap:7px}
.homy-catalog .count svg{color:var(--em)}

/* grid */
.homy-catalog .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
@media(max-width:1000px){.homy-catalog .grid3{grid-template-columns:repeat(2,1fr)}}
@media(max-width:640px){.homy-catalog .grid3{grid-template-columns:1fr}}

/* card */
.homy-catalog .card{background:var(--surface);border-radius:18px;overflow:hidden;box-shadow:var(--card-shadow);border:1px solid var(--hair);cursor:pointer;transition:transform .18s,box-shadow .18s}
.homy-catalog .card:hover{transform:translateY(-3px)}
.homy-catalog .card .ph{position:relative;aspect-ratio:4/5;background-size:cover;background-position:center;background-color:var(--surface2)}
.homy-catalog .card .ph .mr{position:absolute;top:14px;right:14px;width:40px;height:40px}
.homy-catalog .card .ph .mr svg{transform:rotate(-90deg)}
.homy-catalog .card .ph .mr b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff}
.homy-catalog .card .ph .badge{position:absolute;top:14px;left:14px;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#fff;padding:5px 10px;border-radius:999px;overflow:hidden;background:radial-gradient(135% 175% at 50% 14%,var(--em-hi),var(--em));box-shadow:0 2px 6px rgba(4,40,28,.2),inset 0 1px 0 rgba(255,255,255,.12),inset 0 -2px 5px rgba(3,28,20,.18)}
.homy-catalog .card .b{padding:16px}
.homy-catalog .card .cp{font-size:20px;font-weight:700;letter-spacing:-.02em}.homy-catalog .card .cp span{font-size:11px;color:var(--muted);font-weight:500;margin-left:5px}
.homy-catalog .card .ct{font-size:15px;font-weight:600;margin-top:8px;line-height:1.3}
.homy-catalog .card .cl{font-size:12px;color:var(--muted);margin-top:4px}
.homy-catalog .card .cs{font-size:12.5px;color:var(--soft);margin-top:10px}

/* hover actions on photo */
.homy-catalog .cardacts{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(.9);z-index:4;display:flex;gap:10px;opacity:0;transition:opacity .18s,transform .18s;pointer-events:none}
.homy-catalog .card:hover .cardacts{opacity:1;transform:translate(-50%,-50%) scale(1);pointer-events:auto}
.homy-catalog .cardacts button{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.94);border:0;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.3);transition:transform .15s}
.homy-catalog .cardacts button:hover{transform:translateY(-2px)}

/* states */
.homy-catalog .cstate{min-height:50vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
.homy-catalog .cspin{width:36px;height:36px;border-radius:50%;border:3px solid var(--hair);border-top-color:var(--em);animation:homycspin .9s linear infinite}
@keyframes homycspin{to{transform:rotate(360deg)}}
.homy-catalog .cstate .ct2{font-size:14px;color:var(--muted)}
.homy-catalog .cstate .cbtn{font-size:13px;font-weight:700;color:var(--em);background:none;border:0;cursor:pointer;font-family:inherit}
/* skeleton */
.homy-catalog .sk{border-radius:18px;overflow:hidden;background:var(--surface);border:1px solid var(--hair)}
.homy-catalog .sk .skph{aspect-ratio:4/5;background:var(--surface2);animation:homypulse 1.2s ease-in-out infinite}
.homy-catalog .sk .skb{padding:16px}
.homy-catalog .sk .skl{height:12px;border-radius:6px;background:var(--surface2);margin-top:8px;animation:homypulse 1.2s ease-in-out infinite}
@keyframes homypulse{0%,100%{opacity:1}50%{opacity:.5}}
`
