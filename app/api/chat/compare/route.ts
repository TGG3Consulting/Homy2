import { NextRequest, NextResponse } from 'next/server';
import { simpleChat } from '@/lib/anthropicClient';

// Compare chat endpoint - provides AI comparison of selected properties
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, systemContext, properties, searchContext } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build system prompt with compare context
    let systemPrompt = systemContext || '';

    // Add property data to system prompt if available
    if (properties && properties.length > 0) {
      systemPrompt += '\n\n=== ДАННЫЕ ОБЪЕКТОВ ===\n';
      properties.forEach((p: any, i: number) => {
        const pricePerSqm = p.size_sqm ? Math.round(p.price / p.size_sqm) : 0;
        systemPrompt += `
ОБЪЕКТ ${i + 1}:
- ID: ${p.id}
- Адрес: ${p.address || 'не указан'}
- Район: ${p.district || p.neighborhood || 'не указан'}
- Цена: ${p.price?.toLocaleString()} ${p.currency || 'AMD'}/мес
- Площадь: ${p.size_sqm} м²
- Цена за м²: ${pricePerSqm.toLocaleString()} AMD
- Комнат: ${p.rooms}
- Этаж: ${p.floor || '?'}
- Парковка: ${p.hasParking ? 'есть' : 'нет'}
- Балкон: ${p.hasBalcony ? 'есть' : 'нет'}
- Животные: ${p.petsAllowed ? 'можно' : 'нельзя'}
- Match Score: ${p.match_score || 0}%
`;
      });
      systemPrompt += '========================\n';

      // Add AI match score calculation instructions
      if (searchContext) {
        systemPrompt += `
=== КОНТЕКСТ ПОИСКА КЛИЕНТА ===
${searchContext}
===============================

ВАЖНО: Пересчитай ai_match_scores для каждого объекта исходя из контекста поиска.
Оценивай по критериям (сумма = 100):
- Цена вписывается в бюджет: до 30 баллов
- Количество комнат соответствует: до 25 баллов
- Район соответствует запросу: до 20 баллов
- Особые требования: до 15 баллов
- Общее качество: до 10 баллов

В конце ответа добавь JSON блок:
\`\`\`json
{"ai_match_scores": {"id1": score1, "id2": score2, ...}}
\`\`\`
`;
      }
    }

    // Call Claude API
    const response = await simpleChat(message, systemPrompt);

    return NextResponse.json({
      message: response,
      success: true,
    });
  } catch (error) {
    console.error('[Compare API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process compare request' },
      { status: 500 }
    );
  }
}
