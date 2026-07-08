import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        virtual_tour_rooms: {
          orderBy: { order_index: 'asc' }
        }
      }
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (!property.virtual_tour_enabled || property.virtual_tour_rooms.length === 0) {
      return NextResponse.json({
        enabled: false,
        message: 'Virtual tour not available for this property'
      });
    }

    return NextResponse.json({
      enabled: true,
      start_room_id: property.virtual_tour_rooms[0].id,
      rooms: property.virtual_tour_rooms.map(room => ({
        id: room.id,
        name: {
          en: room.name_en,
          ru: room.name_ru,
          hy: room.name_hy
        },
        panorama_url: room.panorama_url,
        hotspots: room.hotspots || []
      }))
    });
  } catch (error) {
    console.error('Virtual tour error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
