/** Shared 1:1 auth styles ported from the Homy mockups (Pack 4). Scoped under .homy-auth. */
export const AUTH_CSS = `
.homy-auth{--surface:#FFFFFF;--surface2:#F4F6F8;--ink:#14181F;--muted:#6A7382;--soft:#39414D;--hair:rgba(20,24,31,.10);--em:#0A6045;--em-hi:#12A574;--amber:#B9822A;--card-shadow:0 4px 24px rgba(20,20,26,.08);min-height:100vh;background:#EEF0F3;color:var(--ink)}
html.dark .homy-auth{--surface:#0E1218;--surface2:#171C25;--ink:#F2F4F7;--muted:#8B93A3;--soft:#C5CAD3;--hair:rgba(255,255,255,.10);--em:#0B6E4F;--em-hi:#2BC091;--amber:#E0A83B;--card-shadow:inset 0 0 0 1px rgba(255,255,255,.06),0 24px 60px rgba(0,0,0,.45);background:#080A0E}
.homy-auth *{box-sizing:border-box}
.homy-auth .authwrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:38px 20px;background:radial-gradient(120% 90% at 50% -10%,color-mix(in srgb,var(--em) 15%,transparent),transparent 55%)}
.homy-auth .acard{width:100%;max-width:392px;background:var(--surface);border:1px solid var(--hair);border-radius:20px;box-shadow:var(--card-shadow);padding:30px 30px 26px}
.homy-auth .lg{font-size:22px;font-weight:800;letter-spacing:-.02em;text-align:center;color:var(--ink)}
.homy-auth .lg .m{color:var(--em)}
.homy-auth h1{font-size:19px;font-weight:700;text-align:center;margin-top:16px;color:var(--ink)}
.homy-auth .sub{font-size:12.5px;color:var(--muted);text-align:center;margin-top:7px;line-height:1.5}
.homy-auth .field{margin-top:15px}
.homy-auth .field>label{font-size:11.5px;font-weight:600;color:var(--soft);display:block;margin-bottom:6px}
.homy-auth .inp{display:flex;align-items:center;gap:9px;background:var(--surface2);border:1px solid var(--hair);border-radius:12px;padding:11px 13px}
.homy-auth .inp:focus-within{border-color:var(--em);box-shadow:0 0 0 3px color-mix(in srgb,var(--em) 18%,transparent)}
.homy-auth .inp svg{color:var(--muted);flex:none}
.homy-auth .inp input{flex:1;background:none;border:0;outline:none;font-family:inherit;font-size:13.5px;color:var(--ink);min-width:0}
.homy-auth .inp .eye{color:var(--muted);cursor:pointer;background:none;border:0;display:flex;padding:0}
.homy-auth .arow{display:flex;align-items:center;justify-content:space-between;margin-top:13px;font-size:12px}
.homy-auth .alink{color:var(--em);font-weight:600;cursor:pointer;text-decoration:none}
.homy-auth .alink:hover{text-decoration:underline}
.homy-auth .adiv{display:flex;align-items:center;gap:12px;margin:19px 0;color:var(--muted);font-size:11px}
.homy-auth .adiv::before,.homy-auth .adiv::after{content:'';flex:1;height:1px;background:var(--hair)}
.homy-auth .altbtn{width:100%;padding:12px;border:1px solid var(--hair);border-radius:12px;background:var(--surface2);color:var(--ink);font-weight:600;font-size:13px;display:flex;align-items:center;justify-content:center;gap:9px;cursor:pointer;font-family:inherit;margin-top:12px}
.homy-auth .altbtn svg{color:var(--em)}
.homy-auth .afoot{text-align:center;font-size:12.5px;color:var(--muted);margin-top:20px}
.homy-auth .trust{margin-top:18px;display:flex;align-items:center;gap:7px;justify-content:center;font-size:11px;color:var(--muted);text-align:center}
.homy-auth .trust svg{color:var(--em);flex:none}
.homy-auth .err{margin-top:14px;background:color-mix(in srgb,#F0616A 12%,transparent);color:#D8434B;border-radius:12px;padding:10px 13px;font-size:12.5px;text-align:center}
/* OTP */
.homy-auth .otp{display:flex;gap:9px;justify-content:center;margin-top:22px}
.homy-auth .otp input{width:44px;height:54px;border-radius:12px;background:var(--surface2);border:1px solid var(--hair);text-align:center;font-size:22px;font-weight:700;color:var(--ink);outline:none;font-family:inherit}
.homy-auth .otp input:focus{border-color:var(--em);box-shadow:0 0 0 3px color-mix(in srgb,var(--em) 22%,transparent)}
.homy-auth .resend{text-align:center;font-size:12px;color:var(--muted);margin-top:18px}.homy-auth .resend b{color:var(--soft)}
/* password meter */
.homy-auth .pwmeter{display:flex;gap:5px;margin-top:9px}.homy-auth .pwmeter i{flex:1;height:4px;border-radius:2px;background:var(--surface2)}.homy-auth .pwmeter i.on{background:var(--em-hi)}.homy-auth .pwmeter i.mid{background:var(--amber)}
.homy-auth .pwhint{font-size:11px;color:var(--muted);margin-top:7px}
/* 20C primary CTA */
.homy-auth .abtn{background:none;border:0;box-shadow:none;color:var(--em);width:fit-content;margin:20px auto 0;padding:9px 3px;font-weight:700;font-size:15px;font-family:inherit;cursor:pointer;position:relative;display:flex;align-items:center;gap:8px;overflow:visible}
.homy-auth .abtn::before{content:'';position:absolute;left:3px;right:3px;bottom:1px;height:2px;border-radius:2px;background:var(--hair)}
.homy-auth .abtn::after{content:'';position:absolute;left:3px;bottom:1px;width:calc(100% - 6px);height:3px;border-radius:3px;background:linear-gradient(90deg,var(--em),var(--em-hi));transition:transform .28s cubic-bezier(.22,1,.36,1);transform-origin:left}
.homy-auth .abtn span{display:inline-block;transition:transform .28s cubic-bezier(.22,1,.36,1)}
.homy-auth .abtn:hover{color:var(--em-hi)}.homy-auth .abtn:hover span{transform:translateY(-2px)}
.homy-auth .abtn:disabled{opacity:.55;pointer-events:none}
`
