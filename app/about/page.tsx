'use client';

import React from 'react';
import ContentPage from '@/components/homy/ContentPage';

const FEATS = [
  {
    h: 'Честность', p: 'Показываем минусы, а не только плюсы. Данные не продаём.',
    ic: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 5v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V5z" /><path d="m9 12 2 2 4-4" /></svg>,
  },
  {
    h: 'ИИ-разбор', p: 'Застройщик, юр. чистота, район, инвестиция — по фактам.',
    ic: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>,
  },
  {
    h: 'Локально', p: 'Глубоко знаем Ереван: районы, маршруты, инфраструктуру.',
    ic: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3z" /><path d="M9 3v15M15 6v15" /></svg>,
  },
];
const TEAM = [
  { av: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=140&h=140&fit=crop', b: 'Давид Петросян', s: 'CEO' },
  { av: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=140&h=140&fit=crop', b: 'Анна Акопян', s: 'Head of Agents' },
  { av: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=140&h=140&fit=crop', b: 'Нарек Саркисян', s: 'ML Lead' },
];

export default function AboutPage() {
  return (
    <ContentPage active="about">
      <div className="chero">
        <div className="kick">О нас</div>
        <h1>Мы делаем рынок<br />недвижимости честным</h1>
        <p>Homy — ИИ-эксперт по недвижимости Армении. Мы не брокер и не доска объявлений, а слой доверия: проверяем факты и честно говорим о рисках.</p>
      </div>
      <div className="feats">
        {FEATS.map((f, i) => (
          <div className="feat" key={i}><div className="ic">{f.ic}</div><h3>{f.h}</h3><p>{f.p}</p></div>
        ))}
      </div>
      <div className="statrow">
        <div className="s"><b>2023</b><span>основана</span></div>
        <div className="s"><b>1 500+</b><span>объектов</span></div>
        <div className="s"><b>4 800</b><span>пользователей</span></div>
        <div className="s"><b>37</b><span>сделок/мес</span></div>
      </div>
      <h3 style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, marginTop: 30 }}>Команда</h3>
      <div className="team">
        {TEAM.map((t, i) => (
          <div className="tm" key={i}><div className="av" style={{ backgroundImage: `url('${t.av}')` }} /><b>{t.b}</b><span>{t.s}</span></div>
        ))}
      </div>
    </ContentPage>
  );
}
