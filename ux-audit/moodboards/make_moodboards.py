#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw, ImageFont

FONTS = "/sessions/eloquent-practical-dijkstra/mnt/.claude/skills/canvas-design/canvas-fonts"
OUT = "/sessions/eloquent-practical-dijkstra/mnt/HomLy/ux-audit/moodboards"
os.makedirs(OUT, exist_ok=True)

def F(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)

W, H = 1600, 2020
M = 130

# Montserrat proxy = Jura (geometric sans WITH Cyrillic). Real Montserrat used in HTML mockups.
SANS_B = "Jura-Medium.ttf"
SANS_R = "Jura-Medium.ttf"

directions = [
  dict(
    key="A", idx="01",
    bg="#F4F1E9", ink="#14203A", sub="#46505F", rule="#14203A",
    name=["Тихий", "авторитет"], name_font="IBMPlexSerif-Bold.ttf",
    en="QUIET AUTHORITY · EDITORIAL TRUST",
    char="Спокойный, точный, доказательный. Как частный советник: доверие через сдержанность, а не через громкость.",
    palette=[("#14203A","чернила"),("#F4F1E9","бумага"),("#4E7A5B","проверка"),("#B0843A","внимание"),("#46505F","текст")],
    heading_font="IBMPlexSerif-Bold.ttf", mono="IBMPlexMono-Regular.ttf",
    pair="Заголовки — IBM Plex Serif · Интерфейс — Montserrat · Цифры — Plex Mono",
    verify="#4E7A5B", amber="#B0843A", dot="#14203A",
  ),
  dict(
    key="B", idx="02",
    bg="#FBF5EC", ink="#3A2E28", sub="#6b5a4e", rule="#C56A4B",
    name=["Тёплый", "локальный дом"], name_font="Lora-Bold.ttf",
    en="WARM LOCAL · HUMAN & ROOTED IN ARMENIA",
    char="Человечный, гостеприимный, укоренённый в Армении — но взрослый. Доверенный местный, который знает город.",
    palette=[("#C56A4B","глина"),("#FBF5EC","крем"),("#6E7A4F","олива"),("#E8A15A","абрикос"),("#3A2E28","кофе")],
    heading_font="Lora-Bold.ttf", mono="IBMPlexMono-Regular.ttf",
    pair="Заголовки — Lora · Интерфейс — Montserrat · Цифры — Plex Mono",
    verify="#6E7A4F", amber="#C98A2E", dot="#C56A4B",
  ),
  dict(
    key="C", idx="03",
    bg="#0E1116", ink="#E7EAF0", sub="#9aa3b2", rule="#3B6EF6",
    name=["Интеллект", "и ясность"], name_font="Tektur-Medium.ttf",
    en="CLARITY INTELLIGENCE · A DASHBOARD FOR HOMES",
    char="Умный, аналитичный, уверенный. Данные — герой; спокойный тёмный интерфейс с высоким сигналом.",
    palette=[("#0E1116","графит"),("#171C25","поверхность"),("#3B6EF6","кобальт"),("#29A56C","сигнал"),("#E0A83B","янтарь")],
    heading_font="Tektur-Medium.ttf", mono="JetBrainsMono-Bold.ttf",
    pair="Заголовки — Montserrat · Данные — JetBrains Mono (табличные цифры)",
    verify="#29A56C", amber="#E0A83B", dot="#2b3242",
  ),
]

def hex2rgb(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))

def draw_tile(d):
    img = Image.new("RGB", (W, H), hex2rgb(d["bg"]))
    dr = ImageDraw.Draw(img)
    ink = hex2rgb(d["ink"]); sub = hex2rgb(d["sub"])

    # subtle dot grid (systematic observation texture)
    dot = hex2rgb(d["dot"])
    step = 46
    for yy in range(M, H-M, step):
        for xx in range(M, W-M, step):
            dr.ellipse([xx-1,yy-1,xx+1,yy+1], fill=dot)
    # fade grid by compositing a translucent bg wash
    wash = Image.new("RGBA",(W,H),(*hex2rgb(d["bg"]),205))
    img = Image.alpha_composite(img.convert("RGBA"), wash).convert("RGB")
    dr = ImageDraw.Draw(img)

    # top label
    dr.text((M, M), f"HOMY  ·  EVIDENCE MINIMALISM", font=F(d["mono"],26), fill=ink)
    dr.text((W-M, M), f"DIRECTION {d['key']} / {d['idx']}", font=F(d["mono"],26), fill=ink, anchor="ra")
    dr.line([M, M+52, W-M, M+52], fill=ink, width=2)

    # name (two lines)
    nf = F(d["name_font"], 118)
    y = M+110
    for line in d["name"]:
        dr.text((M, y), line, font=nf, fill=ink)
        y += 128

    # EN tag
    y += 20
    dr.text((M, y), d["en"], font=F(d["mono"],28), fill=hex2rgb(d["rule"]))
    y += 60

    # character sentence (wrap)
    cf = F(SANS_R, 40)
    words = d["char"].split(); line=""; lines=[]
    for w in words:
        t=(line+" "+w).strip()
        if dr.textlength(t, font=cf) > W-2*M: lines.append(line); line=w
        else: line=t
    lines.append(line)
    for ln in lines:
        dr.text((M, y), ln, font=cf, fill=sub); y += 52

    # rule
    y += 40
    dr.line([M, y, W-M, y], fill=ink, width=2); y += 44

    # palette
    dr.text((M, y), "ПАЛИТРА / PALETTE", font=F(d["mono"],26), fill=ink); y += 50
    n=5; gap=28; sw=(W-2*M-(n-1)*gap)//n; sh=210
    for i,(hexc,role) in enumerate(d["palette"]):
        x=M+i*(sw+gap)
        dr.rounded_rectangle([x,y,x+sw,y+sh], radius=18, fill=hex2rgb(hexc),
                             outline=ink if hexc.lower() in ("#fbf5ec","#f4f1e9") else None, width=1)
        dr.text((x, y+sh+16), hexc.upper(), font=F(d["mono"],24), fill=ink)
        dr.text((x, y+sh+48), role, font=F(SANS_R,26), fill=sub)
    y += sh + 110

    # rule
    dr.line([M, y, W-M, y], fill=ink, width=2); y += 44

    # typography
    dr.text((M, y), "ТИПОГРАФИКА / TYPOGRAPHY — база Montserrat", font=F(d["mono"],26), fill=ink); y += 60
    dr.text((M, y), "Дом · 280 000", font=F(d["heading_font"],132), fill=ink); y += 150
    dr.text((M, y), d["pair"], font=F(SANS_R,30), fill=sub); y += 66

    # rule
    dr.line([M, y, W-M, y], fill=ink, width=2); y += 44

    # signals
    dr.text((M, y), "СИГНАЛЫ / BALANCED SIGNALS", font=F(d["mono"],26), fill=ink); y += 54
    # chip 1: verify (check)
    c1=hex2rgb(d["verify"]); c2=hex2rgb(d["amber"])
    def chip(x, color, label):
        pad=24; tf=F(SANS_B,30)
        tw=dr.textlength(label,font=tf)
        w_=int(tw)+pad*2+54
        dr.rounded_rectangle([x,y,x+w_,y+66], radius=33, fill=color)
        # icon area
        return x, w_
    # verify chip with checkmark
    x1, w1 = chip(M, c1, "проверено")
    dr.line([M+26,y+34,M+38,y+46], fill=(255,255,255), width=5)
    dr.line([M+38,y+46,M+58,y+22], fill=(255,255,255), width=5)
    dr.text((M+70, y+18), "проверено", font=F(SANS_B,30), fill=(255,255,255))
    # amber chip with triangle
    x2 = M + w1 + 30
    tf=F(SANS_B,30); tw=dr.textlength("обрати внимание",font=tf); w2=int(tw)+48+54
    dr.rounded_rectangle([x2,y,x2+w2,y+66], radius=33, fill=c2)
    dr.polygon([(x2+40,y+22),(x2+26,y+48),(x2+54,y+48)], fill=(255,255,255))
    dr.rectangle([x2+39,y+32,x2+41,y+42], fill=c2)
    dr.text((x2+70, y+18), "обрати внимание", font=F(SANS_B,30), fill=(255,255,255))

    # footer markers (Yerevan coordinates as a quiet reference)
    dr.line([M, H-M-40, W-M, H-M-40], fill=ink, width=2)
    dr.text((M, H-M), f"PHASE 1 · MOODBOARD {d['key']}", font=F(d["mono"],24), fill=sub)
    dr.text((W-M, H-M), "YEREVAN · 40.1792°N 44.4991°E", font=F(d["mono"],24), fill=sub, anchor="ra")

    path=os.path.join(OUT, f"Homy-Moodboard-{d['key']}.png")
    img.save(path, "PNG")
    print("saved", path)

for d in directions:
    draw_tile(d)
print("done")
