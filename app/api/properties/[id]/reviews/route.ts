import { NextResponse } from 'next/server';

/**
 * Отзывы объекта УДАЛЕНЫ: в Homy отзывы/рейтинг относятся к БРОКЕРУ, не к недвижимости.
 * Используйте /api/agents/[id]/reviews.
 */
const gone = () =>
  NextResponse.json(
    { error: 'Отзывы объекта не поддерживаются. Отзывы относятся к брокеру: /api/agents/[id]/reviews' },
    { status: 410 }
  );

export async function GET() { return gone(); }
export async function POST() { return gone(); }
