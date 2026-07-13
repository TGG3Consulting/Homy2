/** 1:1 compare (A11) styles from Homy-Batch2 mockup. Scoped under .homy-compare. Light base + html.dark. */
export const COMPARE_CSS = `
.homy-compare{--bg:#EEF0F3;--surface:#FFFFFF;--surface2:#FAFAF8;--ink:#14181F;--muted:#6A7382;--soft:#39414D;--hair:rgba(20,24,31,.10);--em-hi:#26B083;--em:#0A6045;--amber:#B9822A;--card-shadow:0 4px 24px rgba(20,20,26,.08);
  min-height:100vh;background:var(--bg);color:var(--ink);font-family:'Montserrat',sans-serif;-webkit-font-smoothing:antialiased}
html.dark .homy-compare{--bg:#080A0E;--surface:#0E1218;--surface2:#171C25;--ink:#F2F4F7;--muted:#8B93A3;--soft:#C5CAD3;--hair:rgba(255,255,255,.10);--em-hi:#2BC091;--em:#0B6E4F;--amber:#E0A83B;--card-shadow:inset 0 0 0 1px rgba(255,255,255,.06),0 24px 60px rgba(0,0,0,.45)}
.homy-compare *{box-sizing:border-box}

.homy-compare .wnav{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:16px;padding:13px 24px;background:color-mix(in srgb,var(--surface) 92%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--hair)}
.homy-compare .wnav .bk{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--em);cursor:pointer;background:none;border:0;font-family:inherit}
.homy-compare .wnav .sp{margin-left:auto}
.homy-compare .wrap{max-width:1200px;margin:0 auto;padding:22px 24px 90px}
.homy-compare .hd{display:flex;align-items:baseline;gap:12px;margin-bottom:16px}
.homy-compare .hd h2{font-size:20px;font-weight:700}
.homy-compare .hd .n{font-size:12px;color:var(--muted)}

.homy-compare .cmpscroll{overflow-x:auto;padding-bottom:8px;scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--em) 50%,transparent) transparent}
.homy-compare .cmpscroll::-webkit-scrollbar{height:8px}
.homy-compare .cmpscroll::-webkit-scrollbar-track{background:transparent}
.homy-compare .cmpscroll::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--em) 40%,transparent);border-radius:99px}
.homy-compare .cmpscroll::-webkit-scrollbar-thumb:hover{background:var(--em)}
.homy-compare .cmp2{display:flex;gap:14px;align-items:stretch}
.homy-compare .cmp2 .labels{position:sticky;left:0;z-index:5;width:150px;flex:none;display:flex;flex-direction:column;padding-top:170px;background:var(--bg);box-shadow:1px 0 0 var(--hair)}
.homy-compare .cmp2 .labels .rl{height:48px;display:flex;align-items:center;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
.homy-compare .cmp2 .ocard{flex:1 0 200px;min-width:200px;background:var(--surface);border:1px solid var(--hair);border-radius:18px;overflow:hidden;position:relative}
.homy-compare .cmp2 .ocard.best{border:2px solid var(--em);box-shadow:0 14px 34px rgba(4,40,28,.3)}
.homy-compare .cmp2 .ocard .badge2{position:absolute;top:12px;left:12px;z-index:2;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;color:#fff;overflow:hidden;background:radial-gradient(135% 175% at 50% 14%,var(--em-hi),var(--em));box-shadow:0 2px 6px rgba(4,40,28,.2),inset 0 1px 0 rgba(255,255,255,.12),inset 0 -2px 5px rgba(3,28,20,.18)}
.homy-compare .cmp2 .ocard .rm{position:absolute;top:12px;right:12px;z-index:2;width:26px;height:26px;border-radius:50%;border:0;background:rgba(255,255,255,.9);color:#14181F;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25)}
.homy-compare .cmp2 .ocard .photo{height:120px;background-size:cover;background-position:center;background-color:var(--surface2)}
.homy-compare .cmp2 .ocard .head{padding:12px 16px 10px}
.homy-compare .cmp2 .ocard .head b{font-size:14px;font-weight:600;display:block;line-height:1.3}
.homy-compare .cmp2 .ocard .head span{font-size:11px;color:var(--muted)}
.homy-compare .cmp2 .ocard .r{height:48px;display:flex;align-items:center;padding:0 16px;border-top:1px solid var(--hair);font-size:13.5px;font-weight:500}
.homy-compare .cmp2 .ocard .r.price{font-size:18px;font-weight:700;letter-spacing:-.01em}
.homy-compare .cmp2 .ocard .r.price span{font-size:11px;color:var(--muted);font-weight:500;margin-left:5px}
.homy-compare .cmp2 .v-ok{color:var(--em);font-weight:600}
.homy-compare .cmp2 .v-amber{color:var(--amber);font-weight:600}
.homy-compare .cmp2 .v-mut{color:var(--muted)}

.homy-compare .verdict{margin-top:18px;padding-left:14px;border-left:2px solid var(--em)}
.homy-compare .verdict .h{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.homy-compare .verdict p{font-size:13px;line-height:1.6;color:var(--soft)}
.homy-compare .verdict b{color:var(--em)}

/* states */
.homy-compare .cstate{min-height:55vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center}
.homy-compare .cspin{width:36px;height:36px;border-radius:50%;border:3px solid var(--hair);border-top-color:var(--em);animation:homycmpspin .9s linear infinite}
@keyframes homycmpspin{to{transform:rotate(360deg)}}
.homy-compare .cstate .t{font-size:15px;font-weight:600}
.homy-compare .cstate .s{font-size:13px;color:var(--muted);max-width:360px}
.homy-compare .cstate .cbtn{margin-top:4px;font-size:13px;font-weight:700;color:var(--em);background:none;border:0;cursor:pointer;font-family:inherit}

/* hint — только на мобиле */
.homy-compare .cmphint{display:none}

/* ============================================================
   MOBILE — сравнение (A11): горизонтальный скролл + sticky-метки
   ============================================================ */
@media(max-width:640px){
  .homy-compare .wnav{padding:11px 16px}
  .homy-compare .wrap{padding:16px 14px 80px}
  .homy-compare .hd{margin-bottom:10px}
  .homy-compare .hd h2{font-size:17px}
  .homy-compare .cmphint{display:flex;align-items:center;gap:7px;font-size:11.5px;color:var(--muted);background:var(--surface2);border:1px solid var(--hair);border-radius:10px;padding:9px 11px;margin-bottom:12px}
  .homy-compare .cmphint svg{flex:none;color:var(--em)}
  .homy-compare .homy-supportfab{display:none!important}
}
`
