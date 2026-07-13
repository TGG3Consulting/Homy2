/** 1:1 immersive search (Focus) styles ported from Homy-Focus-Experience mockup.
 *  Scoped under .homy-results. Light theme is the base; dark under html.dark. */
export const RESULTS_CSS = `
.homy-results{--bg:#EEF0F3;--surface:#FFFFFF;--surface2:#F4F6F8;--glass:rgba(255,255,255,.82);--glass2:rgba(255,255,255,.9);--ink:#14181F;--muted:#6a7382;--soft:#39414d;--hair:rgba(20,24,31,.10);--accent:#0A6045;--accent2:#0c8f6a;--em:#0A6045;--em-hi:#26B083;--em-lo:#04281C;--num:'Montserrat',sans-serif;position:relative;width:100%;height:100vh;background:var(--bg);color:var(--ink);font-family:'Montserrat',sans-serif;overflow:hidden;-webkit-font-smoothing:antialiased}
html.dark .homy-results{--bg:#080A0E;--surface:#0E1218;--surface2:#171C25;--glass:rgba(16,20,28,.72);--glass2:rgba(24,29,40,.78);--ink:#F2F4F7;--muted:#8B93A3;--soft:#c5cad3;--hair:rgba(255,255,255,.09);--accent:#0B6E4F;--accent2:#2BC091;--em:#0B6E4F;--em-hi:#2BC091;--em-lo:#052A1D}
.homy-results *{box-sizing:border-box}

/* map */
.homy-results .fmap{position:absolute;inset:0;z-index:0;background:#E8EAED}
html.dark .homy-results .fmap{background:#0A0D12}
.homy-results .leaflet-container{background:#E8EAED}
html.dark .homy-results .leaflet-container{background:#0A0D12}
.homy-results .glow{position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(720px 460px at 58% 44%,rgba(10,96,69,.10),transparent 62%)}
html.dark .homy-results .glow{background:radial-gradient(720px 460px at 58% 44%,rgba(11,110,79,.12),transparent 62%),radial-gradient(60% 60% at 50% 50%,transparent 55%,rgba(6,8,12,.55))}
.homy-results .leaflet-control-attribution{background:rgba(255,255,255,.7)!important;color:#66707e!important;font-size:9px!important}
html.dark .homy-results .leaflet-control-attribution{background:rgba(8,10,14,.7)!important}
.homy-results .leaflet-control-attribution a{color:#8a93a3!important}

/* price markers */
.homy-results .mk{display:inline-flex;align-items:center;font-family:var(--num);font-size:12px;font-weight:700;padding:6px 10px;border-radius:999px;background:#fff;border:1px solid var(--hair);color:#14181F;white-space:nowrap;box-shadow:0 5px 14px rgba(20,24,31,.2);transition:transform .18s,background .18s;cursor:pointer;backdrop-filter:blur(4px)}
html.dark .homy-results .mk{background:rgba(10,13,18,.85);color:var(--ink);box-shadow:0 6px 18px rgba(0,0,0,.45)}
.homy-results .mk:hover{transform:translateY(-2px);border-color:rgba(11,110,79,.5)}
.homy-results .mk.dim{opacity:.72;font-weight:600}
.homy-results .mk.top{position:relative;background:radial-gradient(120% 170% at 50% 16%,var(--em-hi),var(--em));color:#fff;border:0;font-weight:800;box-shadow:0 10px 26px rgba(4,40,28,.55),inset 0 1px 0 rgba(255,255,255,.4)}
.homy-results .mk.top::before{content:'';position:absolute;left:50%;top:50%;width:100%;height:100%;transform:translate(-50%,-50%);border-radius:999px;border:2px solid var(--accent);animation:homyring 2.4s ease-out infinite}
@keyframes homyring{0%{transform:translate(-50%,-50%) scale(.85);opacity:.85}100%{transform:translate(-50%,-50%) scale(2.1);opacity:0}}

/* top command bar */
.homy-results .topbar{position:absolute;top:22px;left:0;right:0;display:flex;justify-content:center;z-index:40;pointer-events:none}
.homy-results .cmd{pointer-events:auto;display:flex;align-items:center;gap:14px;background:var(--glass);backdrop-filter:blur(18px);border:1px solid var(--hair);border-radius:16px;padding:12px 16px;min-width:620px;max-width:min(760px,calc(100vw - 720px));box-shadow:0 18px 50px rgba(20,24,31,.14)}
html.dark .homy-results .cmd{box-shadow:0 12px 40px rgba(0,0,0,.5)}
.homy-results .cmd .brand{font-size:19px;font-weight:800;letter-spacing:-.02em;padding-right:14px;border-right:1px solid var(--hair);color:var(--ink);background:none;border-top:0;border-bottom:0;border-left:0;cursor:pointer;font-family:inherit}
.homy-results .cmd .brand .m{color:var(--accent)}
.homy-results .cmd .q{flex:1;font-size:14px;font-weight:500;color:var(--soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.homy-results .cmd .kbd{font-family:var(--num);font-size:11px;color:var(--muted);border:1px solid var(--hair);border-radius:6px;padding:3px 7px}

/* left AI panel */
.homy-results .ai{position:absolute;top:92px;left:22px;bottom:22px;width:392px;z-index:35;background:var(--glass);backdrop-filter:blur(22px);border:1px solid var(--hair);border-radius:22px;box-shadow:0 18px 50px rgba(20,24,31,.14);display:flex;flex-direction:column;overflow:hidden}
html.dark .homy-results .ai{box-shadow:0 24px 70px rgba(0,0,0,.55)}
.homy-results .ai-h{padding:20px 22px;border-bottom:1px solid var(--hair);display:flex;align-items:center;gap:12px}
.homy-results .ava{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;background:radial-gradient(135% 170% at 50% 16%,var(--em-hi),var(--em));color:#fff;box-shadow:0 9px 20px rgba(4,40,28,.5),inset 0 1px 0 rgba(255,255,255,.35),inset 0 -6px 12px rgba(3,28,20,.42)}
.homy-results .ava svg{fill:#fff}
.homy-results .ai-h .nm{font-size:14px;font-weight:700;color:var(--ink)}
.homy-results .ai-h .st{font-size:11.5px;font-weight:500;color:var(--accent);display:flex;align-items:center;gap:6px;margin-top:2px}
.homy-results .ai-h .st i{width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 8px var(--accent)}
.homy-results .stream{flex:1;overflow:auto;padding:20px 22px;display:flex;flex-direction:column;gap:16px;scrollbar-width:none;-ms-overflow-style:none}
.homy-results .stream::-webkit-scrollbar{width:0;height:0;display:none}
.homy-results .msg{max-width:88%;font-size:13.5px;font-weight:500;line-height:1.55}
.homy-results .msg.u{align-self:flex-end;background:rgba(10,96,69,.12);border:1px solid rgba(10,96,69,.30);color:var(--soft);padding:12px 14px;border-radius:14px 14px 4px 14px}
html.dark .homy-results .msg.u{background:rgba(11,110,79,.12);border-color:rgba(11,110,79,.22)}
.homy-results .msg.a{align-self:flex-start;color:var(--soft)}
.homy-results .msg.a .lead{color:var(--ink);font-weight:600}
.homy-results .reason{align-self:flex-start;width:100%;background:var(--glass2);border:1px solid var(--hair);border-radius:14px;padding:14px}
.homy-results .reason .rt{font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
.homy-results .rrow{display:flex;align-items:center;justify-content:space-between;font-size:12.5px;padding:6px 0}
.homy-results .rrow+.rrow{border-top:1px solid var(--hair)}
.homy-results .rrow .k{color:var(--muted);display:flex;align-items:center;gap:8px}
.homy-results .rrow .v{font-family:var(--num);color:var(--accent2);font-weight:600}
.homy-results .chipset{display:flex;flex-wrap:wrap;gap:8px}
.homy-results .rchip{font-size:12px;font-weight:600;color:var(--soft);background:rgba(20,24,31,.05);border:1px solid var(--hair);border-radius:999px;padding:7px 12px;cursor:pointer;transition:.2s;font-family:inherit}
html.dark .homy-results .rchip{background:rgba(255,255,255,.05)}
.homy-results .rchip:hover{border-color:var(--accent);color:var(--ink)}
.homy-results .composer{padding:16px 18px;border-top:1px solid var(--hair);display:flex;align-items:center;gap:10px}
.homy-results .composer .in{flex:1;background:rgba(20,24,31,.05);border:1px solid var(--hair);border-radius:12px;padding:12px 14px;font-size:13px;color:var(--ink);font-family:inherit;outline:none}
html.dark .homy-results .composer .in{background:rgba(255,255,255,.05)}
.homy-results .composer .in::placeholder{color:var(--muted)}
.homy-results .composer .mic{width:40px;height:40px;border-radius:12px;flex:none;display:flex;align-items:center;justify-content:center;cursor:pointer;border:0;position:relative;overflow:hidden;background:radial-gradient(135% 170% at 50% 16%,var(--em-hi),var(--em));box-shadow:0 9px 20px rgba(4,40,28,.5),inset 0 1px 0 rgba(255,255,255,.35),inset 0 -6px 12px rgba(3,28,20,.42)}
.homy-results .composer .mic svg{stroke:#fff}
.homy-results .composer .mic:disabled{opacity:.55;pointer-events:none}

/* floating feature card */
.homy-results .feature{position:absolute;z-index:36;width:316px;left:auto;right:338px;top:121px;background:var(--glass2);backdrop-filter:blur(22px);border:1px solid var(--hair);border-radius:20px;overflow:hidden;box-shadow:0 18px 50px rgba(20,24,31,.16)}
html.dark .homy-results .feature{box-shadow:0 30px 80px rgba(0,0,0,.65)}
.homy-results .feature .ph{height:164px;position:relative;background-size:cover;background-position:center}
.homy-results .feature .ph::after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(255,255,255,.92),transparent 55%)}
html.dark .homy-results .feature .ph::after{background:linear-gradient(to top,rgba(18,22,30,.92),transparent 55%)}
.homy-results .tag{position:absolute;top:14px;left:14px;z-index:2;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#fff;padding:5px 10px;border-radius:999px;overflow:hidden;background:radial-gradient(135% 175% at 50% 14%,var(--em-hi),var(--em));box-shadow:0 2px 6px rgba(4,40,28,.2),inset 0 1px 0 rgba(255,255,255,.12),inset 0 -2px 5px rgba(3,28,20,.18)}
.homy-results .feature .mr{position:absolute;top:14px;right:14px;z-index:2;width:44px;height:44px}
.homy-results .feature .mr svg{transform:rotate(-90deg)}
.homy-results .feature .mr b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--num);font-size:12px;font-weight:700;color:#fff}
.homy-results .feature .pr{position:absolute;left:16px;bottom:12px;z-index:2}
.homy-results .feature .pr b{font-family:var(--num);font-size:22px;font-weight:700;letter-spacing:-.01em;color:var(--ink)}
.homy-results .feature .pr span{font-size:11px;color:var(--muted);margin-left:6px}
.homy-results .feature .fb{padding:16px}
.homy-results .feature .fb .i6{margin-bottom:14px}
.homy-results .feature .cta{margin-top:2px;background:none;color:var(--em);border:0;border-radius:0;padding:9px 3px;width:fit-content;min-width:0;overflow:visible;position:relative;display:inline-flex;align-items:center;gap:8px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer}
.homy-results .feature .cta::before{content:'';position:absolute;left:3px;right:3px;bottom:1px;height:2px;border-radius:2px;background:var(--hair)}
.homy-results .feature .cta::after{content:'';position:absolute;left:3px;bottom:1px;width:calc(100% - 6px);height:3px;border-radius:3px;background:linear-gradient(90deg,var(--em),var(--em-hi));transition:transform .28s ease}
.homy-results .feature .cta:hover{color:var(--em-hi)}

/* hover actions on card photo (favorite + compare) */
.homy-results .cardacts{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(.9);z-index:6;display:flex;gap:10px;opacity:0;transition:opacity .18s,transform .18s;pointer-events:none}
.homy-results .feature:hover .cardacts,.homy-results .gcard:hover .cardacts,.homy-results .mini:hover .cardacts{opacity:1;transform:translate(-50%,-50%) scale(1);pointer-events:auto}
.homy-results .cardacts button{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.94);border:0;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.32);transition:transform .15s}
.homy-results .cardacts button:hover{transform:translateY(-2px)}
.homy-results .mini .cardacts button{width:32px;height:32px}

/* info rows (shared feature + rail) */
.homy-results .i6{display:flex;flex-direction:column;gap:5px;margin-top:2px}
.homy-results .i6 .l{font-size:11.5px;line-height:1.3;color:var(--soft)}
.homy-results .i6 .l.tt{font-size:13.5px;font-weight:600;color:var(--ink);line-height:1.3}
.homy-results .i6 .l.mut{color:var(--muted);font-size:11px}
.homy-results .i6 .l.ok{color:var(--accent2);font-weight:600}
.homy-results .i6 .l.pr{font-family:var(--num);font-size:13px;font-weight:700;color:var(--ink)}
.homy-results .i6 .l.pr span{font-size:10.5px;color:var(--muted);font-weight:500}
.homy-results .i6 .l .warn{color:#E0A83B}

/* right match rail */
.homy-results .rail{position:absolute;right:16px;top:92px;bottom:22px;width:312px;padding:0 6px;z-index:35;display:flex;flex-direction:column;gap:12px;overflow-y:auto;scrollbar-width:none;-ms-overflow-style:none}
.homy-results .rail::-webkit-scrollbar{width:0;height:0;display:none}
.homy-results .rail-h{font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding:2px 4px;flex:none}
.homy-results .mini{position:relative;background:var(--glass);backdrop-filter:blur(16px);border:1px solid var(--hair);border-radius:14px;padding:12px;display:flex;gap:12px;align-items:flex-start;cursor:pointer;transition:.2s;flex:none;box-shadow:0 12px 30px rgba(20,24,31,.1)}
html.dark .homy-results .mini{box-shadow:none}
.homy-results .mini:hover{border-color:rgba(11,110,79,.45);transform:translateX(-3px)}
.homy-results .mini.sel{border-color:var(--accent)}
.homy-results .mini .th{width:56px;height:56px;border-radius:10px;background-size:cover;background-position:center;flex:none}
.homy-results .mini .i6{flex:1;min-width:0;gap:3px}
.homy-results .mini .i6 .l{font-size:10.5px;line-height:1.25}
.homy-results .mini .i6 .l.tt{font-size:12px}
.homy-results .mini .mm{font-family:var(--num);font-size:11px;font-weight:700;color:var(--accent);margin-left:auto;align-self:flex-start}

/* bottom stat strip */
.homy-results .stat{position:absolute;left:calc(50% + 120px);bottom:20px;transform:translateX(-50%);z-index:34;display:flex;gap:24px;background:var(--glass);backdrop-filter:blur(16px);border:1px solid var(--hair);border-radius:14px;padding:12px 22px;box-shadow:0 12px 30px rgba(20,24,31,.12)}
html.dark .homy-results .stat{box-shadow:none}
.homy-results .stat div{text-align:center}
.homy-results .stat b{font-family:var(--num);font-size:16px;font-weight:700;color:var(--ink)}
.homy-results .stat span{display:block;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:3px}

/* corner logo (far top-left) */
.homy-results .cornerlogo{position:absolute;top:24px;left:22px;z-index:46;display:inline-flex;align-items:center;color:var(--ink);font-size:16px;background:var(--glass);backdrop-filter:blur(18px);border:1px solid var(--hair);border-radius:12px;padding:10px 15px;box-shadow:0 10px 30px rgba(20,24,31,.12)}
html.dark .homy-results .cornerlogo{box-shadow:0 10px 30px rgba(0,0,0,.4)}

/* view switch (map/grid) — centered where the search bar used to be */
.homy-results .viewsw{position:absolute;top:24px;left:50%;transform:translateX(-50%);z-index:45;display:flex;gap:2px;background:var(--glass);backdrop-filter:blur(18px);border:1px solid var(--hair);border-radius:12px;padding:4px;pointer-events:auto;box-shadow:0 10px 30px rgba(20,24,31,.12)}
.homy-results .viewsw .o{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--muted);padding:7px 12px;border-radius:9px;cursor:pointer}
.homy-results .viewsw .o.on{color:#fff;background:radial-gradient(120% 160% at 50% 18%,var(--em-hi),var(--em))}

/* top-right: actions cluster + theme toggle (cluster sits between view switch and theme) */
.homy-results .topright{position:absolute;top:24px;right:22px;z-index:46;display:flex;align-items:center;gap:10px}
.homy-results .acts{display:flex;gap:2px;background:var(--glass);backdrop-filter:blur(18px);border:1px solid var(--hair);border-radius:999px;padding:5px;box-shadow:0 10px 30px rgba(20,24,31,.12)}
html.dark .homy-results .acts{box-shadow:0 10px 30px rgba(0,0,0,.4)}
.homy-results .acts .ab{width:34px;height:30px;border-radius:999px;display:flex;align-items:center;justify-content:center;color:var(--muted);cursor:pointer;transition:.18s;border:0;background:none}
.homy-results .acts .ab:hover:not(:disabled){color:var(--em);background:color-mix(in srgb,var(--em) 12%,transparent)}
.homy-results .acts .ab:disabled{opacity:.4;cursor:default}
.homy-results .themebtn{display:flex;gap:2px;background:var(--glass);backdrop-filter:blur(18px);border:1px solid var(--hair);border-radius:999px;padding:5px;box-shadow:0 10px 30px rgba(20,24,31,.12)}
html.dark .homy-results .themebtn{box-shadow:0 10px 30px rgba(0,0,0,.4)}
.homy-results .themebtn .opt{width:36px;height:30px;border-radius:999px;display:flex;align-items:center;justify-content:center;color:var(--muted);cursor:pointer;transition:.2s;border:0;background:none}
.homy-results .themebtn .opt.on{background:radial-gradient(120% 160% at 50% 18%,var(--em-hi),var(--em));color:#fff}

/* save-search modal + toast */
.homy-results .smback{position:fixed;inset:0;z-index:120;background:rgba(18,22,30,.34);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;padding:20px}
.homy-results .smodal{width:100%;max-width:440px;background:var(--surface);border:1px solid var(--hair);border-radius:18px;padding:22px;box-shadow:0 24px 64px rgba(20,24,31,.22)}
html.dark .homy-results .smodal{box-shadow:0 30px 80px rgba(0,0,0,.55)}
.homy-results .smh{display:flex;align-items:center;justify-content:space-between}
.homy-results .smh h3{font-size:17px;font-weight:800;letter-spacing:-.02em;color:var(--ink)}
.homy-results .smx{width:30px;height:30px;border-radius:9px;border:0;background:none;color:var(--soft);cursor:pointer;font-size:15px}
.homy-results .smx:hover{background:color-mix(in srgb,var(--ink) 8%,transparent)}
.homy-results .smsub{font-size:12.5px;color:var(--soft);margin-top:4px}
.homy-results .smopts{display:flex;gap:8px;margin-top:16px}
.homy-results .smopt{flex:1;text-align:left;background:var(--surface2);border:1px solid var(--hair);border-radius:12px;padding:12px;cursor:pointer;font-family:inherit;transition:.15s}
.homy-results .smopt b{display:block;font-size:12.5px;font-weight:700;color:var(--ink)}
.homy-results .smopt span{display:block;font-size:11px;color:var(--soft);margin-top:3px;line-height:1.35}
.homy-results .smopt.on{border-color:var(--em);box-shadow:inset 0 0 0 1px var(--em);background:color-mix(in srgb,var(--em) 8%,var(--surface))}
.homy-results .smfield{margin-top:14px}
.homy-results .smfield label{display:block;font-size:11.5px;font-weight:600;color:var(--soft);margin-bottom:6px}
.homy-results .smin,.homy-results .smsel{width:100%;background:var(--surface2);border:1px solid var(--hair);border-radius:11px;padding:11px 12px;font-size:13px;color:var(--ink);font-family:inherit;outline:none}
.homy-results .smin:focus,.homy-results .smsel:focus{border-color:var(--em)}
.homy-results .smact{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}
.homy-results .smcancel{background:none;border:1px solid var(--hair);border-radius:11px;color:var(--soft);font-weight:600;font-size:13px;padding:10px 16px;cursor:pointer;font-family:inherit}
.homy-results .smcancel:hover{border-color:var(--muted)}
.homy-results .smsave{border:0;border-radius:11px;color:#fff;font-weight:700;font-size:13px;padding:10px 18px;cursor:pointer;font-family:inherit;background:radial-gradient(120% 160% at 50% 18%,var(--em-hi),var(--em));box-shadow:0 8px 20px rgba(4,40,28,.3)}
.homy-results .smsave:disabled{opacity:.5;pointer-events:none}
.homy-results .smtoast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:130;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;color:#fff;box-shadow:0 14px 40px rgba(0,0,0,.3);animation:smtin .25s ease}
.homy-results .smtoast.ok{background:radial-gradient(120% 160% at 50% 18%,var(--em-hi),var(--em))}
.homy-results .smtoast.err{background:#D8434B}
@keyframes smtin{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}

/* grid mode */
.homy-results.gridmode .feature,.homy-results.gridmode .rail,.homy-results.gridmode .stat{display:none}
.homy-results .gridwrap{display:none}
.homy-results.gridmode .gridwrap{display:grid;position:absolute;left:434px;right:22px;top:92px;bottom:22px;z-index:35;overflow-y:auto;grid-template-columns:repeat(auto-fill,316px);grid-auto-rows:max-content;justify-content:start;align-content:start;gap:16px;padding:2px 4px}
.homy-results.gridmode .gridwrap::-webkit-scrollbar{width:7px}.homy-results.gridmode .gridwrap::-webkit-scrollbar-thumb{background:var(--hair);border-radius:4px}
.homy-results .gcard{background:var(--glass2);backdrop-filter:blur(22px);border:1px solid var(--hair);border-radius:20px;overflow:hidden;box-shadow:0 18px 44px rgba(20,24,31,.14)}
html.dark .homy-results .gcard{box-shadow:0 24px 60px rgba(0,0,0,.55)}
.homy-results .gcard .gph{height:164px;position:relative;background-size:cover;background-position:center}
.homy-results .gcard .gph::after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.55),transparent 42%);pointer-events:none}
.homy-results .gcard .gph .tag{top:14px;left:14px;z-index:3}
.homy-results .gcard .gph .mr{position:absolute;top:14px;right:14px;z-index:3;width:44px;height:44px}
.homy-results .gcard .gph .mr svg{transform:rotate(-90deg)}
.homy-results .gcard .gph .mr b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--num);font-size:12px;font-weight:700;color:#fff}
.homy-results .gcard .gph .pr{position:absolute;left:16px;bottom:12px;z-index:3}
.homy-results .gcard .gph .pr b{font-family:var(--num);font-size:20px;font-weight:800;color:#fff}
.homy-results .gcard .gph .pr span{font-size:10.5px;color:rgba(255,255,255,.8);margin-left:5px}
.homy-results .gcard .gb{padding:16px}
.homy-results .gcard .cta{margin-top:2px;background:none;color:var(--em);border:0;padding:9px 3px;width:fit-content;overflow:visible;position:relative;display:inline-flex;align-items:center;gap:8px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer}
.homy-results .gcard .cta::before{content:'';position:absolute;left:3px;right:3px;bottom:1px;height:2px;border-radius:2px;background:var(--hair)}
.homy-results .gcard .cta::after{content:'';position:absolute;left:3px;bottom:1px;width:calc(100% - 6px);height:3px;border-radius:3px;background:linear-gradient(90deg,var(--em),var(--em-hi));transition:transform .28s ease}
.homy-results .gcard .cta:hover{color:var(--em-hi)}

/* loading / empty overlays */
.homy-results .fstate{position:absolute;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;background:color-mix(in srgb,var(--bg) 70%,transparent);backdrop-filter:blur(3px)}
.homy-results .fspin{width:38px;height:38px;border-radius:50%;border:3px solid var(--hair);border-top-color:var(--accent);animation:homyspin .9s linear infinite}
@keyframes homyspin{to{transform:rotate(360deg)}}
.homy-results .fstate .ft{font-size:13px;color:var(--muted)}

@media (max-width:900px) and (min-width:641px){
  .homy-results .cmd{min-width:0;max-width:calc(100vw - 44px)}
  .homy-results .ai{left:12px;right:12px;width:auto;top:86px;bottom:auto;max-height:44vh}
  .homy-results .feature{right:12px;left:12px;width:auto;top:auto;bottom:78px}
  .homy-results .rail,.homy-results .stat{display:none}
  .homy-results.gridmode .gridwrap{left:12px;right:12px;grid-template-columns:1fr}
}

/* ============================================================
   MOBILE — stack-sheets, 1:1 с Homy-Prototype-Mobile.html
   ============================================================ */
.homy-results .mroot{display:none}
@media (max-width:640px){
  /* прячем десктопный хром */
  .homy-results .topbar,.homy-results .cmd,.homy-results .ai,.homy-results .feature,
  .homy-results .rail,.homy-results .stat,.homy-results .viewsw,.homy-results .topright,
  .homy-results .cornerlogo,.homy-results .gridwrap,.homy-results .homy-supportfab{display:none!important}
  .homy-results .mroot{display:block}

  /* top command bar */
  .homy-results .m-top{position:fixed;top:16px;left:14px;right:14px;z-index:30;display:flex;align-items:center;gap:8px}
  .homy-results .m-op{position:relative;flex:none;width:40px;height:40px;border-radius:50%;padding:0;border:1px solid var(--hair);background:var(--glass);backdrop-filter:blur(16px);box-shadow:0 8px 20px rgba(0,0,0,.4);cursor:pointer;display:flex;align-items:center;justify-content:center}
  .homy-results .m-op .av{width:30px;height:30px;border-radius:50%;background-size:cover;background-position:center}
  .homy-results .m-op .dot{position:absolute;right:2px;bottom:2px;width:9px;height:9px;border-radius:50%;background:var(--em-hi);border:2px solid var(--glass)}
  .homy-results .m-right{margin-left:auto;display:flex;align-items:center;gap:6px;background:var(--glass);backdrop-filter:blur(16px);border:1px solid var(--hair);border-radius:12px;padding:5px 7px;box-shadow:0 10px 24px rgba(0,0,0,.35)}
  .homy-results .m-right .homy-lmw{font-size:13px}
  .homy-results .m-tgl{display:flex;gap:2px;background:rgba(127,127,140,.16);border-radius:999px;padding:3px;flex:none}
  .homy-results .m-tgl .o{width:28px;height:24px;border-radius:999px;display:flex;align-items:center;justify-content:center;color:var(--muted);cursor:pointer}
  .homy-results .m-tgl .o.on{color:#fff;background:radial-gradient(120% 160% at 50% 18%,var(--em-hi),var(--em-lo));box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 2px 6px rgba(4,40,28,.5)}

  /* stacked sheets */
  .homy-results .mstack{position:fixed;inset:0;z-index:10;pointer-events:none}
  .homy-results .msheet{position:absolute;left:0;right:0;bottom:0;pointer-events:auto;background:var(--surface);border:1px solid var(--hair);border-bottom:0;border-radius:24px 24px 0 0;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 -18px 54px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.07);transition:transform .44s cubic-bezier(.32,.8,.24,1),height .44s cubic-bezier(.32,.8,.24,1)}
  .homy-results .ms1{height:300px;z-index:11}
  .homy-results .ms2{height:86vh;z-index:12;box-shadow:0 -22px 60px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.08);transform:translateY(110%)}
  .homy-results .mroot[data-mstate="results"] .ms1{height:88vh}
  .homy-results .mroot[data-mstate="chat"] .ms1{height:88vh}
  .homy-results .mroot[data-mstate="chat"] .ms2{transform:translateY(0)}

  .homy-results .mgrab{padding:11px 0 8px;display:flex;justify-content:center;flex:none;cursor:pointer}
  .homy-results .mgrab i{width:40px;height:5px;border-radius:999px;background:var(--hair)}
  .homy-results .mbody{padding:2px 18px 18px;overflow:auto;flex:1;min-height:0;scrollbar-width:none}
  .homy-results .mbody::-webkit-scrollbar{width:0}

  .homy-results .mava{width:30px;height:30px;border-radius:9px;flex:none;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;background:radial-gradient(135% 160% at 50% 18%,var(--em-hi),var(--em-lo));box-shadow:0 6px 14px rgba(4,40,28,.5),inset 0 1px 0 rgba(255,255,255,.42),inset 0 -5px 10px rgba(3,28,20,.45)}
  .homy-results .mava svg{fill:#fff;position:relative;z-index:2}

  .homy-results .mshead{display:flex;align-items:center;gap:10px;padding:2px 0 12px;cursor:pointer}
  .homy-results .mshead .mnm{font-size:13px;font-weight:700;color:var(--ink)}
  .homy-results .mshead .mst{font-size:11px;font-weight:500;color:var(--em-hi);display:flex;align-items:center;gap:5px;margin-top:1px}
  .homy-results .mshead .mst i{width:5px;height:5px;border-radius:50%;background:var(--em-hi)}
  .homy-results .mshead .mup{margin-left:auto;font-size:11px;font-weight:600;color:var(--muted);display:flex;align-items:center;gap:5px}
  .homy-results .mchead .mmin{margin-left:auto;width:34px;height:34px;border-radius:10px;background:rgba(127,127,140,.14);display:flex;align-items:center;justify-content:center;color:var(--muted);cursor:pointer}

  .homy-results .mpeek{display:flex;gap:12px;align-items:center;background:var(--glass2);border:1px solid var(--hair);border-radius:14px;padding:10px;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.05)}
  .homy-results .mpeek .mth{width:52px;height:52px;border-radius:10px;background-size:cover;background-position:center;flex:none;background-color:var(--surface2)}
  .homy-results .mpeek .mpt{font-size:12.5px;font-weight:600;color:var(--ink);line-height:1.25}
  .homy-results .mpeek .mpl{font-size:11px;color:var(--muted);margin-top:2px}
  .homy-results .mpeek .mpp{font-family:var(--num);font-size:13px;font-weight:700;color:var(--ink);margin-top:4px}
  .homy-results .mpeek .mpp span{font-weight:500;color:var(--muted)}
  .homy-results .mpeek .mmm{margin-left:auto;font-family:var(--num);font-size:11px;font-weight:700;color:var(--em-hi);align-self:flex-start}

  .homy-results .mlh{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:16px 0 10px}
  .homy-results .mmini{display:flex;gap:10px;align-items:center;padding:9px 0;cursor:pointer}
  .homy-results .mmini+.mmini{border-top:1px solid var(--hair)}
  .homy-results .mmini .mth{width:46px;height:46px;border-radius:9px;background-size:cover;background-position:center;flex:none;background-color:var(--surface2)}
  .homy-results .mmini .mmt{font-size:12px;font-weight:600;color:var(--ink);line-height:1.25}
  .homy-results .mmini .mml{font-size:10.5px;color:var(--muted);margin-top:2px}
  .homy-results .mmini .mmp{font-family:var(--num);font-size:12px;font-weight:700;color:var(--ink);margin-top:3px}
  .homy-results .mmini .mmm{margin-left:auto;font-family:var(--num);font-size:10.5px;font-weight:700;color:var(--em-hi);align-self:flex-start}

  .homy-results .maskrow{flex:none;display:flex;align-items:center;gap:9px;padding:12px 16px;border-top:1px solid var(--hair);background:var(--surface);cursor:text}
  .homy-results .maskrow span{flex:1;font-size:13px;color:var(--muted)}
  .homy-results .maskrow .mmic{width:34px;height:34px;border-radius:10px;flex:none;display:flex;align-items:center;justify-content:center;background:radial-gradient(135% 160% at 50% 18%,var(--em-hi),var(--em-lo));box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 4px 10px rgba(4,40,28,.5)}
  .homy-results .maskrow .mmic svg{stroke:#fff}

  .homy-results .mstream{display:flex;flex-direction:column;gap:14px;padding-top:2px}
  .homy-results .mmsg{max-width:86%;font-size:13px;font-weight:500;line-height:1.5}
  .homy-results .mmsg.u{align-self:flex-end;background:rgba(11,110,79,.16);border:1px solid rgba(11,110,79,.32);color:var(--soft);padding:11px 13px;border-radius:14px 14px 4px 14px}
  .homy-results .mmsg.a{align-self:flex-start;color:var(--soft)}
  .homy-results .mmsg.a .lead{color:var(--ink);font-weight:600}
  .homy-results .mreason{align-self:flex-start;width:100%;background:var(--glass2);border:1px solid var(--hair);border-radius:13px;padding:12px;box-shadow:0 8px 20px rgba(0,0,0,.26),inset 0 1px 0 rgba(255,255,255,.05)}
  .homy-results .mreason .rt{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:9px}
  .homy-results .mrr{display:flex;justify-content:space-between;font-size:12px;padding:5px 0;gap:10px}
  .homy-results .mrr+.mrr{border-top:1px solid var(--hair)}
  .homy-results .mrr .k{color:var(--muted);display:flex;align-items:center;gap:7px}
  .homy-results .mchips{display:flex;flex-wrap:wrap;gap:7px}
  .homy-results .mchips .rchip{font-size:12px;font-weight:600;color:var(--soft);background:rgba(127,127,140,.12);border:1px solid var(--hair);border-radius:999px;padding:7px 11px;cursor:pointer}
  .homy-results .mcomposer{flex:none;padding:12px 16px;border-top:1px solid var(--hair);display:flex;align-items:center;gap:9px}
  .homy-results .mcomposer input{flex:1;background:rgba(127,127,140,.1);border:1px solid var(--hair);border-radius:12px;padding:11px 13px;font-size:13px;color:var(--ink);font-family:inherit;outline:none}
  .homy-results .mcomposer input::placeholder{color:var(--muted)}
  .homy-results .mcomposer .msend{width:40px;height:40px;border-radius:12px;flex:none;display:flex;align-items:center;justify-content:center;cursor:pointer;border:0;background:radial-gradient(135% 160% at 50% 18%,var(--em-hi),var(--em-lo));box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 5px 12px rgba(4,40,28,.5)}
  .homy-results .mcomposer .msend:disabled{opacity:.55}
  .homy-results .mcomposer .msend svg{stroke:#fff}
}
`
