/** 1:1 schedule (A13) styles from Homy-Batch2 mockup. Scoped under .homy-schedule. Light base + html.dark. */
export const SCHEDULE_CSS = `
.homy-schedule{--bg:#EEF0F3;--surface:#FFFFFF;--surface2:#FAFAF8;--ink:#14181F;--muted:#6A7382;--soft:#39414D;--hair:rgba(20,24,31,.10);--em-hi:#26B083;--em:#0A6045;--amber:#B9822A;--card-shadow:0 4px 24px rgba(20,20,26,.08);
  min-height:100vh;background:var(--bg);color:var(--ink);font-family:'Montserrat',sans-serif;-webkit-font-smoothing:antialiased}
html.dark .homy-schedule{--bg:#080A0E;--surface:#0E1218;--surface2:#171C25;--ink:#F2F4F7;--muted:#8B93A3;--soft:#C5CAD3;--hair:rgba(255,255,255,.10);--em-hi:#2BC091;--em:#0B6E4F;--amber:#E0A83B;--card-shadow:inset 0 0 0 1px rgba(255,255,255,.06),0 24px 60px rgba(0,0,0,.45)}
.homy-schedule *{box-sizing:border-box}

.homy-schedule .wnav{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:16px;padding:13px 24px;background:color-mix(in srgb,var(--surface) 92%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--hair)}
.homy-schedule .wnav .bk{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--em);cursor:pointer;background:none;border:0;font-family:inherit}
.homy-schedule .wnav .sp{margin-left:auto}
.homy-schedule .wrap{max-width:940px;margin:0 auto;padding:26px 24px 90px;display:flex;gap:20px;align-items:flex-start}
.homy-schedule .left{flex:1;max-width:560px;min-width:0}
.homy-schedule h2{font-size:18px;font-weight:700}
.homy-schedule .sub{font-size:13px;color:var(--muted);margin-top:6px}
.homy-schedule .row{display:flex;gap:16px;margin-top:16px;flex-wrap:wrap}
.homy-schedule .col{flex:1;min-width:200px}
.homy-schedule .tlabel{font-size:12px;color:var(--muted);margin-bottom:8px}

.homy-schedule .cal{background:var(--surface);border:1px solid var(--hair);border-radius:14px;padding:16px}
.homy-schedule .cal .cm{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;font-size:13px;font-weight:600}
.homy-schedule .cal .cm button{background:none;border:0;color:var(--muted);cursor:pointer;font-size:16px;padding:0 6px;line-height:1;font-family:inherit}
.homy-schedule .cal .cm button:hover{color:var(--em)}
.homy-schedule .cal .grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}
.homy-schedule .cal .dow{font-size:10px;color:var(--muted);padding:4px 0}
.homy-schedule .cal .d{font-size:12px;padding:8px 0;border-radius:8px;cursor:pointer;border:0;background:none;color:var(--ink);font-family:inherit}
.homy-schedule .cal .d:hover:not(.mut):not(.sel){background:color-mix(in srgb,var(--em) 10%,transparent)}
.homy-schedule .cal .d.mut{color:var(--muted);opacity:.35;cursor:default}
.homy-schedule .cal .d.sel{color:#fff;background:radial-gradient(120% 160% at 50% 18%,var(--em-hi),var(--em))}

.homy-schedule .slots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:2px}
.homy-schedule .slot{font-size:12.5px;font-weight:600;text-align:center;padding:9px 0;border-radius:9px;border:1px solid var(--hair);background:var(--surface);color:var(--soft);cursor:pointer;font-family:inherit}
.homy-schedule .slot.sel{background:none;border:0;border-radius:0;color:var(--em);box-shadow:inset 0 -2.5px 0 0 var(--em);font-weight:700;padding-left:4px;padding-right:4px}

/* 20C primary CTA */
.homy-schedule .book{margin:16px auto 0;display:flex;background:none;border:0;color:var(--em);font-weight:700;font-size:15px;font-family:inherit;cursor:pointer;position:relative;padding:11px 4px;align-items:center;gap:8px;overflow:visible;width:fit-content}
.homy-schedule .book::before{content:'';position:absolute;left:3px;right:3px;bottom:1px;height:2px;border-radius:2px;background:var(--hair)}
.homy-schedule .book::after{content:'';position:absolute;left:3px;bottom:1px;width:calc(100% - 6px);height:3px;border-radius:3px;background:linear-gradient(90deg,var(--em),var(--em-hi));transition:transform .28s cubic-bezier(.22,1,.36,1);transform-origin:left}
.homy-schedule .book span{display:inline-block;transition:transform .28s cubic-bezier(.22,1,.36,1)}
.homy-schedule .book:hover{color:var(--em-hi)}.homy-schedule .book:hover span{transform:translateY(-2px)}
.homy-schedule .book:disabled{opacity:.5;pointer-events:none}
.homy-schedule .hint{text-align:center;font-size:11px;color:var(--muted);margin-top:10px}

/* right panel */
.homy-schedule .side{width:280px;flex:none}
.homy-schedule .panel{background:var(--surface);border:1px solid var(--hair);border-radius:14px;padding:16px}
.homy-schedule .success{text-align:center;padding:8px}
.homy-schedule .success .ic{width:56px;height:56px;border-radius:16px;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;background:radial-gradient(135% 175% at 50% 14%,var(--em-hi),var(--em));box-shadow:0 2px 6px rgba(4,40,28,.2),inset 0 1px 0 rgba(255,255,255,.12),inset 0 -2px 5px rgba(3,28,20,.18)}
.homy-schedule .success h3{font-size:17px;font-weight:700}
.homy-schedule .success p{font-size:13px;color:var(--muted);margin-top:8px;line-height:1.6}
.homy-schedule .btn-sec{margin-top:14px;width:100%;background:none;border:1px solid var(--hair);border-radius:11px;color:var(--ink);font-weight:600;font-size:12.5px;padding:10px;cursor:pointer;font-family:inherit}
.homy-schedule .btn-sec:hover{border-color:var(--em);color:var(--em)}
/* summary card (before booking) */
.homy-schedule .sumph{height:150px;border-radius:11px;background-size:cover;background-position:center;background-color:var(--surface2)}
.homy-schedule .sump{font-size:18px;font-weight:700;margin-top:12px}.homy-schedule .sump span{font-size:11px;color:var(--muted);font-weight:500;margin-left:5px}
.homy-schedule .sumt{font-size:14px;font-weight:600;margin-top:6px;line-height:1.3}
.homy-schedule .suml{font-size:12px;color:var(--muted);margin-top:3px}
.homy-schedule .sumv{font-size:11.5px;color:var(--em);font-weight:600;margin-top:10px;display:flex;align-items:center;gap:6px}

.homy-schedule .sstate{min-height:55vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;width:100%}
.homy-schedule .sspin{width:36px;height:36px;border-radius:50%;border:3px solid var(--hair);border-top-color:var(--em);animation:homysspin .9s linear infinite}
@keyframes homysspin{to{transform:rotate(360deg)}}
.homy-schedule .sstate .cbtn{font-size:13px;font-weight:700;color:var(--em);background:none;border:0;cursor:pointer;font-family:inherit}

@media(max-width:760px){.homy-schedule .wrap{flex-direction:column}.homy-schedule .side{width:100%}}
`
