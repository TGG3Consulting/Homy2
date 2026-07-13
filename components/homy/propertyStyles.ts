/** Full property detail (A4 + A5 + all legacy blocks) styles — 1:1 from
 *  Homy-Property-Card-Full mockup. Scoped under .homy-property. Light base + html.dark. */
export const PROPERTY_CSS = `
.homy-property{--bg:#EEF0F3;--surface:#FFFFFF;--surface2:#FAFAF8;--ink:#14181F;--muted:#6A7382;--soft:#39414D;--hair:rgba(20,24,31,.10);--em-hi:#26B083;--em:#0A6045;--amber:#B9822A;--danger:#D8434B;--card-shadow:0 4px 24px rgba(20,20,26,.08);
  min-height:100vh;background:var(--bg);color:var(--ink);font-family:'Montserrat',sans-serif;-webkit-font-smoothing:antialiased}
html.dark .homy-property{--bg:#080A0E;--surface:#0E1218;--surface2:#171C25;--ink:#F2F4F7;--muted:#8B93A3;--soft:#C5CAD3;--hair:rgba(255,255,255,.10);--em-hi:#2BC091;--em:#0B6E4F;--amber:#E0A83B;--danger:#F0616A;--card-shadow:inset 0 0 0 1px rgba(255,255,255,.06),0 24px 60px rgba(0,0,0,.45)}
.homy-property *{box-sizing:border-box}

/* page-mode nav */
.homy-property .wnav{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:16px;padding:13px 24px;background:color-mix(in srgb,var(--surface) 92%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--hair)}
.homy-property .wnav .bk{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--em);cursor:pointer;background:none;border:0;font-family:inherit}
.homy-property .wnav .sp{margin-left:auto}
.homy-property .wrap{max-width:1180px;margin:0 auto;padding:24px 24px 80px}

/* popup mode */
.homy-property.pop{position:fixed;inset:0;z-index:120;min-height:0;background:none}
.homy-property .pop-overlay{position:fixed;inset:0;background:rgba(8,10,14,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:24px 20px;overflow-y:auto}
.homy-property .pop-win{position:relative;width:100%;max-width:1180px;margin:auto}
/* bounded modal — each column scrolls internally so the chat stays compact */
.homy-property.pop .pgrid{height:min(88vh,760px)}
.homy-property.pop .pleft{overflow-y:auto;min-height:0}
.homy-property.pop .pleft::-webkit-scrollbar{width:7px}.homy-property.pop .pleft::-webkit-scrollbar-thumb{background:var(--hair);border-radius:4px}
.homy-property.pop .pright{min-height:0;overflow:hidden}
/* page mode — chat sticks while details scroll */
.homy-property:not(.pop) .pright{position:sticky;top:60px;align-self:flex-start;height:calc(100vh - 84px);overflow:hidden}

/* card shell */
.homy-property .pcard{position:relative;background:var(--surface);border:1px solid var(--hair);border-radius:24px;box-shadow:var(--card-shadow);overflow:hidden}
.homy-property .pclose{position:absolute;top:16px;right:16px;z-index:6;width:38px;height:38px;border-radius:50%;border:1px solid var(--hair);background:var(--surface);color:var(--ink);display:flex;align-items:center;justify-content:center;cursor:pointer}
.homy-property .pclose:hover{color:var(--em);border-color:var(--em)}
.homy-property .pgrid{display:grid;grid-template-columns:1fr 344px}
.homy-property .pleft{padding:24px;display:flex;flex-direction:column;gap:18px;min-width:0}
.homy-property .pright{border-left:1px solid var(--hair);background:var(--surface2);display:flex;flex-direction:column;min-height:0}
.homy-property .aicol{display:flex;flex-direction:column;height:100%;min-height:560px}
.homy-property .aicol>*{flex:1;min-height:0}
/* per-property AI chat (1:1) */
.homy-property .cchat{display:flex;flex-direction:column;height:100%;min-height:0}
.homy-property .ai-h{padding:16px 18px;border-bottom:1px solid var(--hair);display:flex;align-items:center;gap:11px;flex:none}
.homy-property .ai-h .cav{width:34px;height:34px;border-radius:10px;flex:none;display:flex;align-items:center;justify-content:center;background:radial-gradient(135deg,var(--em),#1c8f6b)}
.homy-property .ai-h .nm{font-size:13.5px;font-weight:700;color:var(--ink)}
.homy-property .ai-h .st{font-size:11px;color:var(--em);display:flex;align-items:center;gap:6px;margin-top:2px}
.homy-property .ai-h .st i{width:6px;height:6px;border-radius:50%;background:var(--em);box-shadow:0 0 8px var(--em)}
.homy-property .ai-h .cx{margin-left:auto;width:32px;height:32px;border-radius:50%;border:1px solid var(--hair);background:var(--surface);color:var(--muted);display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none}
.homy-property .ai-h .cx:hover{color:var(--em);border-color:var(--em)}
.homy-property .ai-body{flex:1;overflow:auto;padding:16px 18px;display:flex;flex-direction:column;gap:12px;min-height:0}
.homy-property .ai-body::-webkit-scrollbar{width:0}
.homy-property .amsg{max-width:90%;font-size:12.5px;line-height:1.5;padding:10px 12px;border-radius:13px}
.homy-property .amsg.a{align-self:flex-start;background:var(--surface);border:1px solid var(--hair);color:var(--soft);border-radius:4px 13px 13px 13px}
.homy-property .amsg.u{align-self:flex-end;background:color-mix(in srgb,var(--em) 14%,transparent);border:1px solid color-mix(in srgb,var(--em) 26%,transparent);color:var(--soft);border-radius:13px 13px 4px 13px}
.homy-property .asug{display:flex;flex-wrap:wrap;gap:7px}
.homy-property .asug span{font-size:11px;font-weight:600;color:var(--soft);background:var(--surface);border:1px solid var(--hair);border-radius:999px;padding:6px 11px;cursor:pointer}
.homy-property .asug span:hover{border-color:var(--em);color:var(--em)}
.homy-property .ai-comp{padding:14px 16px;border-top:1px solid var(--hair);display:flex;gap:9px;flex:none}
.homy-property .ai-comp .in{flex:1;background:var(--surface);border:1px solid var(--hair);border-radius:11px;padding:10px 12px;font-size:12.5px;color:var(--ink);font-family:inherit;outline:none}
.homy-property .ai-comp .in:focus{border-color:var(--em)}
.homy-property .ai-comp .in::placeholder{color:var(--muted)}
.homy-property .ai-comp .snd{width:38px;height:38px;border-radius:11px;flex:none;display:flex;align-items:center;justify-content:center;background:radial-gradient(135% 175% at 50% 14%,var(--em-hi),var(--em));border:0;cursor:pointer}
.homy-property .ai-comp .snd:disabled{opacity:.5;pointer-events:none}

/* gallery */
.homy-property .gal{position:relative}
.homy-property .gal .main{aspect-ratio:16/10;border-radius:16px;background-size:cover;background-position:center;background-color:var(--surface2);position:relative}
.homy-property .gal .badge{position:absolute;top:14px;left:14px;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#fff;padding:6px 11px;border-radius:999px;overflow:hidden;background:radial-gradient(135% 175% at 50% 14%,var(--em-hi),var(--em));box-shadow:0 2px 6px rgba(4,40,28,.2),inset 0 1px 0 rgba(255,255,255,.12),inset 0 -2px 5px rgba(3,28,20,.18)}
.homy-property .gal .vtour-btn{position:absolute;bottom:14px;right:14px;display:inline-flex;align-items:center;gap:7px;padding:8px 13px;border-radius:999px;font-size:11.5px;font-weight:700;color:#fff;background:rgba(11,110,79,.9);backdrop-filter:blur(6px);border:0;cursor:pointer;box-shadow:0 4px 12px rgba(4,40,28,.3)}
.homy-property .gal .thumbs{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.homy-property .gal .thumbs div{width:70px;height:52px;border-radius:9px;background-size:cover;background-position:center;border:1px solid var(--hair);cursor:pointer;background-color:var(--surface2)}
.homy-property .gal .thumbs div.on{border-color:var(--em);box-shadow:0 0 0 2px color-mix(in srgb,var(--em) 30%,transparent)}

/* header */
.homy-property .phead{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
.homy-property .kick{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}
.homy-property .price{font-size:32px;font-weight:700;letter-spacing:-.02em;margin-top:6px}.homy-property .price span{font-size:14px;color:var(--muted);font-weight:500;margin-left:8px}
.homy-property .matchwrap{display:flex;align-items:center;gap:12px;flex:none}
.homy-property .mring{position:relative;width:52px;height:52px}.homy-property .mring svg{transform:rotate(-90deg)}.homy-property .mring b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px}
.homy-property .matchpct{text-align:right}.homy-property .matchpct b{font-size:24px;font-weight:800;color:var(--em);letter-spacing:-.02em}.homy-property .matchpct span{display:block;font-size:9.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}

/* badges + title */
.homy-property .badges{display:flex;gap:8px;flex-wrap:wrap}
.homy-property .bdg{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;padding:6px 11px;border-radius:999px;background:color-mix(in srgb,var(--em) 10%,transparent);color:var(--em)}
.homy-property .bdg.n{background:color-mix(in srgb,var(--muted) 12%,transparent);color:var(--soft)}
.homy-property .bdg svg{flex:none}
.homy-property .dttl{font-size:20px;font-weight:600;line-height:1.25}
.homy-property .dloc{font-size:13px;color:var(--muted);margin-top:4px}

/* specs */
.homy-property .dspecs{display:flex;gap:20px;padding:14px 16px;border-radius:14px;background:var(--surface2);border:1px solid var(--hair);flex-wrap:wrap;align-items:center}
.homy-property .dspecs .s{display:flex;align-items:center;gap:8px}.homy-property .dspecs .s svg{color:var(--em);flex:none}
.homy-property .dspecs b{font-size:15px;font-weight:700}.homy-property .dspecs .s span{font-size:11px;color:var(--muted);margin-left:2px}
.homy-property .dspecs .bt{font-size:12px;color:var(--soft)}

/* generic section */
.homy-property .sec{border-radius:16px;padding:16px;background:var(--surface2);border:1px solid var(--hair)}
.homy-property .sec.em{background:color-mix(in srgb,var(--em) 5%,transparent);border-color:color-mix(in srgb,var(--em) 18%,transparent)}
.homy-property .sec.amber{background:color-mix(in srgb,var(--amber) 7%,transparent);border-color:color-mix(in srgb,var(--amber) 22%,transparent)}
.homy-property .sec.bare{background:none;border:0;padding:0}
.homy-property .sh{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--em);margin-bottom:9px;display:flex;align-items:center;gap:7px}
.homy-property .sh.a{color:var(--amber)}.homy-property .sh.mut{color:var(--muted)}
.homy-property .sec p{font-size:13px;line-height:1.6;color:var(--soft)}
.homy-property .sec .note{font-size:11px;color:var(--muted);margin-top:8px;display:flex;align-items:center;gap:6px}
.homy-property .sec .loadrow{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted)}
.homy-property .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.homy-property .adv{list-style:none;display:flex;flex-direction:column;gap:9px}
.homy-property .adv li{display:flex;align-items:flex-start;gap:8px;font-size:12.5px;line-height:1.4;color:var(--soft)}
.homy-property .adv li svg{color:var(--em);flex:none;margin-top:2px}
.homy-property .costs{display:flex;gap:26px;flex-wrap:wrap}
.homy-property .costs .c span{font-size:11px;color:var(--muted)}.homy-property .costs .c b{display:block;font-size:15px;font-weight:700;margin-top:3px}

/* intelligence */
.homy-property .intel-h{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:12px}
.homy-property .itabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.homy-property .itab{font-size:12.5px;font-weight:600;padding:8px 14px;border-radius:999px;border:1px solid var(--hair);background:var(--surface);color:var(--muted);cursor:pointer;font-family:inherit}
.homy-property .itab.on{color:var(--em);border:0;border-radius:0;background:none;box-shadow:inset 0 -2.5px 0 0 var(--em);font-weight:700;padding-left:4px;padding-right:4px}
.homy-property .ipanel{background:var(--surface);border:1px solid var(--hair);border-radius:12px;padding:6px 16px}
.homy-property .irow{display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:12px 0;gap:12px}
.homy-property .irow+.irow{border-top:1px solid var(--hair)}
.homy-property .irow .k{color:var(--soft);display:flex;align-items:center;gap:9px}.homy-property .irow .k svg{color:var(--muted);flex:none}
.homy-property .irow .v{font-weight:600;color:var(--em);text-align:right}.homy-property .irow .v.warn{color:var(--amber)}.homy-property .irow .v.mut{color:var(--muted)}
.homy-property .isrc{font-size:11px;color:var(--muted);margin-top:12px}

/* mini map container (wraps real PropertyMiniMap) */
.homy-property .mmapc{border-radius:14px;overflow:hidden;border:1px solid var(--hair);min-height:200px}
.homy-property .mmapc>*{width:100%}

/* agent + viewing */
.homy-property .agent{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
.homy-property .agent .who{display:flex;align-items:center;gap:11px}
.homy-property .agent .av{width:44px;height:44px;border-radius:50%;background:color-mix(in srgb,var(--em) 14%,transparent);display:flex;align-items:center;justify-content:center;color:var(--em);flex:none}
.homy-property .agent .nm{font-size:13.5px;font-weight:600}.homy-property .agent .rl{font-size:11px;color:var(--muted);margin-top:2px;display:flex;align-items:center;gap:5px}
.homy-property .agent .rl .vf{color:var(--em);font-weight:600}
.homy-property .abtns{display:flex;gap:10px;flex-wrap:wrap}
.homy-property .bwrite{display:inline-flex;align-items:center;gap:7px;padding:10px 16px;border-radius:999px;font-size:12.5px;font-weight:600;font-family:inherit;background:none;border:1px solid var(--em);color:var(--em);cursor:pointer}
.homy-property .bbook{display:inline-flex;align-items:center;gap:7px;padding:10px 18px;border-radius:999px;font-size:12.5px;font-weight:700;font-family:inherit;color:#fff;border:0;cursor:pointer;background:radial-gradient(135% 175% at 50% 14%,var(--em-hi),var(--em))}
.homy-property .bbook.done{background:var(--muted);cursor:not-allowed;opacity:.7}
.homy-property .vformwrap{margin-top:14px;padding-top:14px;border-top:1px solid var(--hair)}

/* states */
.homy-property .pstate{min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:var(--surface);border-radius:24px}
.homy-property .pspin{width:38px;height:38px;border-radius:50%;border:3px solid var(--hair);border-top-color:var(--em);animation:homypspin .9s linear infinite}
@keyframes homypspin{to{transform:rotate(360deg)}}

@media(max-width:900px){
  .homy-property .pgrid{grid-template-columns:1fr}
  .homy-property .pright{border-left:0;border-top:1px solid var(--hair)}
  .homy-property .two{grid-template-columns:1fr}
}

/* sticky mobile CTA bar — hidden on desktop */
.homy-property .mcta{display:none}

/* ============================================================
   MOBILE — карточка объекта, 1:1 с эскизом A4/A5 (верх),
   всё содержимое сохранено ниже
   ============================================================ */
@media(max-width:640px){
  /* full-screen popup */
  .homy-property.pop .pop-overlay{padding:0;align-items:stretch;overflow-y:auto}
  .homy-property .pop-win{max-width:100%;margin:0}
  .homy-property.pop .pgrid{height:auto}
  .homy-property.pop .pleft{overflow:visible}
  .homy-property .pcard{border-radius:0;border:0;min-height:100vh}
  .homy-property .pclose{top:12px;right:12px;width:38px;height:38px;background:rgba(10,13,18,.5);backdrop-filter:blur(8px);color:#fff;border:1px solid rgba(255,255,255,.18);z-index:8}
  .homy-property .pgrid{grid-template-columns:1fr}
  .homy-property .pright{border-left:0;border-top:1px solid var(--hair)}
  .homy-property .two{grid-template-columns:1fr}

  /* page-mode nav compact */
  .homy-property .wnav{padding:11px 16px}
  .homy-property .wrap{padding:0}

  /* hero (эскиз: фото сверху 4:3, full-bleed) */
  .homy-property .pleft{padding:0 16px 104px;gap:16px}
  .homy-property .gal{margin:0 -16px}
  .homy-property .gal .main{aspect-ratio:4/3;border-radius:0}
  .homy-property .gal .badge{top:14px;left:14px}
  .homy-property .gal .thumbs{margin-top:10px}
  .homy-property .gal .thumbs div{width:60px;height:46px}

  /* condensed header */
  .homy-property .phead{margin-top:16px}
  .homy-property .price{font-size:28px}
  .homy-property .price span{font-size:12px}
  .homy-property .dttl{font-size:18px}
  .homy-property .matchwrap{gap:8px}
  .homy-property .mring{width:46px;height:46px}
  .homy-property .matchpct b{font-size:20px}
  .homy-property .dspecs{gap:14px 16px;padding:12px 14px}

  /* intelligence tabs — горизонтальный скролл (эскиз) */
  .homy-property .itabs{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}
  .homy-property .itabs::-webkit-scrollbar{display:none}
  .homy-property .itab{flex:none}

  /* per-property chat (pright) — статично, фикс. высота (без sticky-дыры) */
  .homy-property:not(.pop) .pright{position:static;height:auto;top:auto;overflow:visible}
  .homy-property .pright{min-height:0}
  .homy-property .aicol{min-height:0;height:480px}

  /* sticky mobile CTA (эскиз: Позвонить + Записаться) */
  .homy-property .mcta{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;gap:10px;padding:12px 16px calc(12px + env(safe-area-inset-bottom));background:linear-gradient(to top,var(--bg) 72%,transparent)}
  .homy-property .mcta .call{width:52px;height:48px;border-radius:12px;border:1px solid var(--hair);background:var(--surface);color:var(--ink);display:flex;align-items:center;justify-content:center;flex:none;cursor:pointer;text-decoration:none}
  .homy-property .mcta .book{flex:1;height:48px;border-radius:12px;border:0;font-family:inherit;font-size:14px;font-weight:700;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;background:radial-gradient(135% 175% at 50% 14%,var(--em-hi),var(--em))}
  .homy-property .mcta .book.done{background:var(--muted);opacity:.7}
  .homy-property .homy-supportfab{display:none!important}

  /* запись на просмотр — bottom-sheet (эскиз A13) */
  .homy-property .vformwrap{position:fixed;inset:0;z-index:1200;margin:0;padding:0;border-top:0;display:flex;align-items:flex-end;background:rgba(8,10,14,.5);backdrop-filter:blur(2px)}
  .homy-property .vfsheet{width:100%;max-height:88vh;overflow:auto;background:var(--surface);border:1px solid var(--hair);border-bottom:0;border-radius:22px 22px 0 0;box-shadow:0 -18px 54px rgba(0,0,0,.5);padding-top:18px;position:relative;animation:homysheetup .34s cubic-bezier(.32,.8,.24,1)}
  .homy-property .vfsheet::-webkit-scrollbar{width:0}
  .homy-property .vfsheet::before{content:'';position:absolute;top:9px;left:50%;transform:translateX(-50%);width:40px;height:5px;border-radius:999px;background:var(--hair);z-index:2}
}
@keyframes homysheetup{from{transform:translateY(100%)}to{transform:translateY(0)}}
`
