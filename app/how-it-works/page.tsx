'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ContentPage from '@/components/homy/ContentPage';

const STEPS = [
  { n: 1, h: 'Опишите запрос', p: 'Обычными словами: «2-комн, тихий район, рядом школа, до 350 000».' },
  { n: 2, h: 'Homy разбирает', p: 'ИИ проверяет застройщика, юр. чистоту, район, маршрут, инвестицию.' },
  { n: 3, h: 'Честный отчёт', p: 'Плюсы и минусы без прикрас — совпадение с запросом и риски.' },
  { n: 4, h: 'Просмотр и сделка', p: 'Запись к агенту, сопровождение до ключей.' },
];

export default function HowItWorksPage() {
  const router = useRouter();
  return (
    <ContentPage active="how">
      <div className="chero">
        <div className="kick">Как это работает</div>
        <h1>Не доска объявлений.<br />Слой доверия.</h1>
        <p>Homy разбирает каждый объект по фактам и честно показывает и плюсы, и риски — чтобы вы решали с открытыми глазами.</p>
      </div>
      <div className="steps">
        {STEPS.map((s) => (
          <div className="step" key={s.n}>
            <div className="n">{s.n}</div>
            <h3>{s.h}</h3>
            <p>{s.p}</p>
          </div>
        ))}
      </div>
      <div className="statrow">
        <div className="s"><b>1 500</b><span>объектов проверено</span></div>
        <div className="s"><b>98%</b><span>точность подбора</span></div>
        <div className="s"><b>9</b><span>районов Еревана</span></div>
      </div>
      <div className="center">
        <button className="em3d" onClick={() => router.push('/results')}>Начать поиск</button>
      </div>
    </ContentPage>
  );
}
