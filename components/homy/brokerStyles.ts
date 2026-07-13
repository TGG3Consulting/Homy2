/** 1:1 broker cabinet (D1–D5) styles from Homy-Batch5 mockup. Scoped under .homy-broker. */
export const BROKER_CSS = `
.homy-broker{--bg:#EEF0F3;--surface:#FFFFFF;--surface2:#F4F6F8;--ink:#14181F;--muted:#6A7382;--soft:#39414D;--hair:rgba(20,24,31,.10);--em-hi:#26B083;--em:#0A6045;--amber:#B9822A;--danger:#D8434B;
  min-height:100vh;background:var(--bg);color:var(--ink);font-family:'Montserrat',sans-serif;-webkit-font-smoothing:antialiased}
html.dark .homy-broker{--bg:#080A0E;--surface:#0E1218;--surface2:#171C25;--ink:#F2F4F7;--muted:#8B93A3;--soft:#C5CAD3;--hair:rgba(255,255,255,.10);--em-hi:#2BC091;--em:#0B6E4F;--amber:#E0A83B;--danger:#F0616A}
.homy-broker *{box-sizing:border-box}

/* top nav */
.homy-broker .bnav{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:14px;padding:11px 18px;background:color-mix(in srgb,var(--surface) 93%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--hair)}
.homy-broker .btabs{display:flex;gap:2px;margin-left:6px;overflow-x:auto;scrollbar-width:none}
.homy-broker .btabs::-webkit-scrollbar{display:none}
.homy-broker .btab{font-size:12.5px;font-weight:600;color:var(--muted);padding:7px 11px;border-radius:9px;cursor:pointer;white-space:nowrap;border:0;background:none;font-family:inherit}
.homy-broker .btab.on{color:var(--em);box-shadow:inset 0 -2.5px 0 0 var(--em);border-radius:0;font-weight:700}
/* mobile section dropdown (replaces scroll-tabs) */
.homy-broker .btabsel{display:none;position:relative}
.homy-broker .btabsel-btn{display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:700;color:var(--ink);background:none;border:0;font-family:inherit;cursor:pointer;padding:4px 2px}
.homy-broker .btabsel-btn svg{color:var(--muted)}
.homy-broker .btabsel-back{position:fixed;inset:0;z-index:40}
.homy-broker .btabsel-pop{position:absolute;top:calc(100% + 8px);left:0;z-index:50;min-width:190px;background:var(--surface);border:1px solid var(--hair);border-radius:14px;box-shadow:0 18px 46px rgba(0,0,0,.28);padding:8px}
html.dark .homy-broker .btabsel-pop{box-shadow:0 18px 46px rgba(0,0,0,.55)}
.homy-broker .btabsel-i{display:block;width:100%;text-align:left;font-size:13.5px;font-weight:500;color:var(--ink);background:none;border:0;font-family:inherit;padding:10px 12px;border-radius:10px;cursor:pointer}
.homy-broker .btabsel-i:hover{background:color-mix(in srgb,var(--muted) 14%,transparent)}
.homy-broker .btabsel-i.on{color:var(--em);font-weight:700;background:color-mix(in srgb,var(--em) 10%,transparent)}
.homy-broker .bnav .right{margin-left:auto;display:flex;align-items:center;gap:12px}
.homy-broker .bell{width:34px;height:34px;border-radius:10px;border:1px solid var(--hair);display:flex;align-items:center;justify-content:center;color:var(--muted);position:relative;background:none;cursor:pointer}
.homy-broker .bell.dot::after{content:'';position:absolute;top:8px;right:9px;width:6px;height:6px;border-radius:50%;background:var(--danger)}
.homy-broker .themebtn{display:flex;gap:2px;background:var(--surface);border:1px solid var(--hair);border-radius:999px;padding:4px}
.homy-broker .themebtn .o{width:30px;height:26px;border-radius:999px;display:flex;align-items:center;justify-content:center;color:var(--muted);cursor:pointer;border:0;background:none}
.homy-broker .themebtn .o.on{background:radial-gradient(120% 160% at 50% 18%,var(--em-hi),var(--em));color:#fff}

/* header */
.homy-broker .bwrap{max-width:1160px;margin:0 auto;padding:20px 24px 60px}
.homy-broker .bhd{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:16px}
.homy-broker .bhd h1{font-size:20px;font-weight:800;letter-spacing:-.02em}
.homy-broker .bhd .sub{font-size:12.5px;color:var(--muted);margin-top:3px}

/* primary 20C-style CTA */
.homy-broker .cta{position:relative;margin-left:auto;background:none;border:0;color:var(--em);font-weight:700;font-size:13px;padding:9px 4px;cursor:pointer;font-family:inherit;overflow:visible}
.homy-broker .cta::before{content:'';position:absolute;left:3px;right:3px;bottom:1px;height:2px;border-radius:2px;background:var(--hair)}
.homy-broker .cta::after{content:'';position:absolute;left:3px;bottom:1px;width:calc(100% - 6px);height:3px;border-radius:3px;background:linear-gradient(90deg,var(--em),var(--em-hi));transition:transform .28s ease;transform-origin:left}
.homy-broker .cta:hover{color:var(--em-hi)}

/* metric tiles */
.homy-broker .mrow{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-bottom:22px}
@media(max-width:820px){.homy-broker .mrow{grid-template-columns:1fr 1fr}}
.homy-broker .mtile{background:var(--surface);border:1px solid var(--hair);border-radius:14px;padding:15px 16px}
.homy-broker .mtile b{font-size:25px;font-weight:800;letter-spacing:-.02em;display:block}
.homy-broker .mtile .lbl{font-size:11.5px;color:var(--muted);margin-top:3px}
.homy-broker .mtile .delta{font-size:11px;font-weight:700;margin-top:7px;display:inline-flex;align-items:center;gap:3px}
.homy-broker .delta.up{color:var(--em)}.homy-broker .delta.down{color:var(--danger)}

/* sections */
.homy-broker .bsec{margin-bottom:22px}
.homy-broker .bsec .sh{display:flex;align-items:center;margin-bottom:11px}
.homy-broker .bsec .sh h3{font-size:15px;font-weight:700}
.homy-broker .bsec .sh .a{margin-left:auto;font-size:12px;font-weight:600;color:var(--em);cursor:pointer;background:none;border:0;font-family:inherit}

/* chips */
.homy-broker .chips{display:flex;gap:9px;margin-bottom:14px;flex-wrap:wrap}
.homy-broker .chip{font-size:12px;font-weight:600;padding:6px 12px;border-radius:999px;border:1px solid var(--hair);background:var(--surface);color:var(--soft);cursor:pointer;font-family:inherit}
.homy-broker .chip.active{color:#fff;border-color:transparent;background:radial-gradient(120% 160% at 50% 18%,var(--em-hi),var(--em))}

/* listing rows */
.homy-broker .lrow{display:flex;align-items:center;gap:13px;padding:11px;border:1px solid var(--hair);border-radius:13px;background:var(--surface);margin-bottom:9px}
.homy-broker .lrow .th{width:66px;height:50px;border-radius:10px;background-size:cover;background-position:center;flex:none;background-color:var(--surface2);cursor:pointer}
.homy-broker .lrow .av{width:40px;height:40px;border-radius:50%;background-size:cover;background-position:center;flex:none;background-color:var(--surface2)}
.homy-broker .lrow .ti{flex:1;min-width:0}
.homy-broker .lrow .ti b{font-size:13.5px;font-weight:600;display:block}
.homy-broker .lrow .ti .mt{font-size:11.5px;color:var(--muted);margin-top:3px}
.homy-broker .lrow .pr{font-size:14px;font-weight:700;white-space:nowrap}
.homy-broker .lrow .kv{display:flex;gap:14px;font-size:11px;color:var(--muted);flex:none}
.homy-broker .lrow .kv b{color:var(--soft);font-size:12px}
.homy-broker .stat{font-size:10.5px;font-weight:700;padding:4px 9px;border-radius:999px;white-space:nowrap}
.homy-broker .stat.ok{color:var(--em);background:color-mix(in srgb,var(--em) 15%,transparent)}
.homy-broker .stat.pend{color:var(--amber);background:color-mix(in srgb,var(--amber) 16%,transparent)}
.homy-broker .stat.rej{color:var(--danger);background:color-mix(in srgb,var(--danger) 15%,transparent)}
.homy-broker .stat.mut{color:var(--muted);background:color-mix(in srgb,var(--muted) 14%,transparent)}
.homy-broker .lact{display:flex;gap:10px;flex:none;align-items:center}

/* lead rows */
.homy-broker .lead{display:flex;align-items:center;gap:13px;padding:12px;border:1px solid var(--hair);border-radius:13px;background:var(--surface);margin-bottom:9px}
.homy-broker .lead .av{width:40px;height:40px;border-radius:50%;background-size:cover;background-position:center;flex:none;background:radial-gradient(135% 175% at 50% 14%,var(--em-hi),var(--em));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px}
.homy-broker .lead .ti{flex:1;min-width:0}
.homy-broker .lead .nm{font-size:13.5px;font-weight:600}
.homy-broker .lead .mt{font-size:11.5px;color:var(--muted);margin-top:2px}
.homy-broker .stage{font-size:10.5px;font-weight:700;padding:4px 10px;border-radius:999px;white-space:nowrap}
.homy-broker .stage.new{color:var(--em);background:color-mix(in srgb,var(--em) 15%,transparent)}
.homy-broker .stage.warm{color:var(--amber);background:color-mix(in srgb,var(--amber) 16%,transparent)}
.homy-broker .stage.cold{color:var(--muted);background:color-mix(in srgb,var(--muted) 14%,transparent)}

/* secondary link button (20C underline) */
.homy-broker .sec{position:relative;background:none;border:0;color:var(--soft);font-weight:600;font-size:12px;padding:7px 4px;cursor:pointer;font-family:inherit;white-space:nowrap;overflow:visible}
.homy-broker .sec::after{content:'';position:absolute;left:3px;bottom:1px;width:0;height:2px;border-radius:2px;background:var(--em);transition:width .28s cubic-bezier(.22,1,.36,1)}
.homy-broker .sec:hover{color:var(--em)}.homy-broker .sec:hover::after{width:calc(100% - 6px)}
.homy-broker .sec.danger:hover{color:var(--danger)}.homy-broker .sec.danger::after{background:var(--danger)}
.homy-broker .em3d{position:relative;overflow:hidden;color:#fff;border:0;background:radial-gradient(135% 175% at 50% 14%,var(--em-hi),var(--em));box-shadow:0 2px 6px rgba(4,40,28,.25),inset 0 1px 0 rgba(255,255,255,.2);font-weight:700;font-size:12px;padding:8px 15px;border-radius:10px;cursor:pointer;font-family:inherit;white-space:nowrap}
.homy-broker .em3d:disabled{opacity:.55;pointer-events:none}

/* create-listing form */
.homy-broker .field{margin-top:15px}
.homy-broker .field>label{font-size:11.5px;font-weight:600;color:var(--soft);display:block;margin-bottom:6px}
.homy-broker .inp{display:flex;align-items:center;gap:9px;background:var(--surface2);border:1px solid var(--hair);border-radius:12px;padding:11px 13px}
.homy-broker .inp:focus-within{border-color:var(--em);box-shadow:0 0 0 3px color-mix(in srgb,var(--em) 18%,transparent)}
.homy-broker .inp input,.homy-broker .inp textarea,.homy-broker .inp select{flex:1;background:none;border:0;outline:none;font-family:inherit;font-size:13.5px;color:var(--ink);min-width:0}
.homy-broker .frm2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:640px){
  .homy-broker .frm2{grid-template-columns:1fr}
  /* nav: скролл-табы → дропдаун-меню */
  .homy-broker .btabs{display:none}
  .homy-broker .btabsel{display:block;margin-left:2px}
  .homy-broker .bnav{gap:8px;padding:11px 14px}
  .homy-broker .bnav .right{gap:8px}
  .homy-broker .bhd{margin-bottom:14px}
  .homy-broker .bhd h1{font-size:18px}
  .homy-broker .bwrap{padding:16px 14px 72px}
  /* карточка объявления: ряд1 миниатюра+заголовок+статус, ряд2 статы, ряд3 действия/цена */
  .homy-broker .lrow{flex-wrap:wrap;align-items:center;gap:8px 10px;padding:11px}
  .homy-broker .lrow .th{width:52px;height:52px}
  .homy-broker .lrow .ti{flex:1 1 40%;min-width:0}
  .homy-broker .lrow .ti b{font-size:13px}
  .homy-broker .lrow .stat{order:3}
  .homy-broker .lrow .kv{order:5;flex:1 1 100%;gap:18px;margin-top:2px}
  .homy-broker .lrow .pr{order:6;margin-left:auto}
  .homy-broker .lrow .lact{order:7;flex:1 1 100%;justify-content:flex-start;gap:16px;margin-top:6px;padding-top:9px;border-top:1px solid var(--hair)}
  /* лид-строки тоже аккуратно */
  .homy-broker .lead{flex-wrap:wrap;gap:8px 10px}
  .homy-broker .lead .ti{flex:1 1 40%}
  .homy-broker .lead .stage{order:3}
}
.homy-broker .drop{border:1.5px dashed var(--hair);border-radius:14px;padding:20px;text-align:center;color:var(--muted);font-size:12.5px;background:var(--surface2);cursor:pointer}
.homy-broker .drop:hover{border-color:var(--em)}
.homy-broker .drop .ic{width:40px;height:40px;border-radius:12px;background:color-mix(in srgb,var(--em) 14%,transparent);color:var(--em);display:flex;align-items:center;justify-content:center;margin:0 auto 10px}
.homy-broker .thumbs{display:flex;gap:9px;margin-top:12px;flex-wrap:wrap;justify-content:center}
.homy-broker .thumbs .t{width:76px;height:58px;border-radius:9px;background-size:cover;background-position:center;position:relative}
.homy-broker .thumbs .t .x{position:absolute;top:3px;right:3px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;cursor:pointer}
.homy-broker .thumbs .add{width:76px;height:58px;border-radius:9px;border:1.5px dashed var(--hair);display:flex;align-items:center;justify-content:center;color:var(--muted);cursor:pointer}

/* states */
.homy-broker .empty{text-align:center;padding:54px 20px;border:1px dashed var(--hair);border-radius:14px}
.homy-broker .empty h3{font-size:15px;font-weight:700}.homy-broker .empty p{font-size:12.5px;color:var(--muted);margin-top:6px}
.homy-broker .fspin{width:34px;height:34px;border-radius:50%;border:3px solid var(--hair);border-top-color:var(--em);animation:homybspin .9s linear infinite;margin:56px auto}
@keyframes homybspin{to{transform:rotate(360deg)}}
.homy-broker .toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:130;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;color:#fff;box-shadow:0 14px 40px rgba(0,0,0,.3)}
.homy-broker .toast.ok{background:radial-gradient(120% 160% at 50% 18%,var(--em-hi),var(--em))}
.homy-broker .toast.err{background:var(--danger)}

/* modal */
.homy-broker .mback{position:fixed;inset:0;z-index:120;background:rgba(18,22,30,.4);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;padding:20px}
.homy-broker .modal{width:100%;max-width:460px;background:var(--surface);border:1px solid var(--hair);border-radius:18px;padding:22px;box-shadow:0 24px 64px rgba(20,24,31,.22);max-height:88vh;overflow:auto}
.homy-broker .modal h3{font-size:17px;font-weight:800;letter-spacing:-.02em}
.homy-broker .mact{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}

/* agent↔client chat thread */
.homy-broker .chatbox{display:flex;flex-direction:column;height:min(66vh,500px);margin-top:8px}
.homy-broker .chatmsgs{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:6px 2px}
.homy-broker .cmsg{max-width:78%;padding:9px 12px;border-radius:13px;font-size:13px;line-height:1.45;background:var(--surface2);align-self:flex-start;border:1px solid var(--hair)}
.homy-broker .cmsg.me{align-self:flex-end;color:#fff;border:0;background:radial-gradient(135% 175% at 50% 14%,var(--em-hi),var(--em))}
.homy-broker .cmsg .tm{font-size:9.5px;opacity:.6;margin-top:3px;display:block}
.homy-broker .cempty{flex:1;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:12.5px;text-align:center;padding:20px}
.homy-broker .ccomposer{display:flex;gap:8px;margin-top:12px}
.homy-broker .ccomposer input{flex:1;background:var(--surface2);border:1px solid var(--hair);border-radius:11px;padding:11px 13px;font-size:13px;color:var(--ink);font-family:inherit;outline:none}
.homy-broker .ccomposer input:focus{border-color:var(--em)}
`;
