'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ContentPage from '@/components/homy/ContentPage';

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
);

const BUYER = [
  'Честный разбор: плюсы и минусы каждого объекта',
  'Проверка застройщика и юридической чистоты',
  'Маршрут, инфраструктура, парковка — без сюрпризов',
  'Запись на просмотр и сопровождение',
];
const OWNER = [
  'Кабинет: объявления, статусы, статистика',
  'Лиды и клиенты в одном месте',
  'Согласование просмотров с покупателями',
  'Честное объявление = больше доверия',
];

export default function ForWhom() {
  const router = useRouter();
  return (
    <ContentPage active="who">
      <div className="chero">
        <div className="kick">Для кого Homy</div>
        <h1>Одна платформа —<br />две стороны сделки</h1>
        <p>Покупателям — уверенность в выборе. Владельцам и брокерам — инструменты и доверие клиентов.</p>
      </div>
      <div className="aud">
        <div className="audc">
          <div className="ph" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=300&fit=crop')" }} />
          <h3>Покупателям и арендаторам</h3>
          <ul>{BUYER.map((t, i) => <li key={i}><Check />{t}</li>)}</ul>
          <button className="em3d" style={{ marginTop: 16 }} onClick={() => router.push('/results')}>Найти жильё</button>
        </div>
        <div className="audc">
          <div className="ph" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop')" }} />
          <h3>Владельцам и брокерам</h3>
          <ul>{OWNER.map((t, i) => <li key={i}><Check />{t}</li>)}</ul>
          <button className="em3d" style={{ marginTop: 16 }} onClick={() => router.push('/list-property')}>Разместить объект</button>
        </div>
      </div>
    </ContentPage>
  );
}
