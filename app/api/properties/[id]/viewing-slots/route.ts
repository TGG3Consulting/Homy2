import { NextRequest, NextResponse } from 'next/server';
import { viewingSlotService } from '@/lib/services/viewingSlot';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // Next.js 15!
) {
  const { id } = await params;

  const url = new URL(req.url);
  const daysAhead = parseInt(url.searchParams.get('days') || '14');

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysAhead);

  const slots = await viewingSlotService.getAvailableSlots(id, startDate, endDate);

  return NextResponse.json({
    property_id: id,
    slots: slots.map(s => ({
      id: s.id,
      date: s.date.toISOString().split('T')[0],
      time: s.time,
      available: s.available
    })),
    next_available: slots.find(s => s.available)?.date || null
  });
}
