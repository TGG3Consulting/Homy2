import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { jwtService } from '@/lib/services/jwtService';
import { getAccessTokenFromRequest } from '@/lib/cookies';

// Session must still be valid: token_version match + not blocked (VULN-004).
function authSession(req: Request): { userId: string; tokenVersion: number } | null {
  const token = getAccessTokenFromRequest(req);
  if (!token) return null;
  const p = jwtService.verifyAccessToken(token);
  if (!p?.userId) return null;
  return { userId: p.userId, tokenVersion: p.tokenVersion ?? 0 };
}
async function canManage(auth: { userId: string; tokenVersion: number } | null, propertyId: string): Promise<boolean> {
  if (!auth) return false;
  const [prop, user] = await Promise.all([
    prisma.property.findUnique({ where: { id: propertyId }, select: { owner_id: true } }),
    prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true, token_version: true, is_blocked: true } }),
  ]);
  if (!prop || !user) return false;
  if (user.is_blocked || auth.tokenVersion !== user.token_version) return false;
  return prop.owner_id === auth.userId || user.role === 'admin' || user.role === 'moderator';
}

// PATCH — update a room (name/panorama/order/hotspots).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; roomId: string }> }) {
  try {
    const { id, roomId } = await params;
    if (!(await canManage(authSession(req), id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const room = await prisma.virtualTourRoom.findUnique({ where: { id: roomId }, select: { property_id: true } });
    if (!room || room.property_id !== id) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const b = await req.json().catch(() => ({} as any));
    const data: Record<string, unknown> = {};
    if (typeof b.name_ru === 'string') data.name_ru = b.name_ru.trim();
    if (typeof b.name_en === 'string') data.name_en = b.name_en.trim();
    if (typeof b.name_hy === 'string') data.name_hy = b.name_hy.trim();
    if (typeof b.panorama_url === 'string') data.panorama_url = b.panorama_url.trim();
    if (b.order_index !== undefined) data.order_index = Number(b.order_index);
    if (Array.isArray(b.hotspots)) {
      // Sanitize hotspots: { target_room_id, x, y } with x/y in 0..1.
      data.hotspots = b.hotspots
        .filter((h: any) => h && h.target_room_id)
        .map((h: any) => ({
          target_room_id: String(h.target_room_id),
          x: Math.max(0, Math.min(1, Number(h.x) || 0)),
          y: Math.max(0, Math.min(1, Number(h.y) || 0)),
        }));
    }

    const updated = await prisma.virtualTourRoom.update({ where: { id: roomId }, data });
    return NextResponse.json({
      success: true,
      room: {
        id: updated.id,
        name: { en: updated.name_en, ru: updated.name_ru, hy: updated.name_hy },
        panorama_url: updated.panorama_url,
        hotspots: updated.hotspots || [],
        order_index: updated.order_index,
      },
    });
  } catch (error) {
    console.error('Update tour room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — remove a room.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; roomId: string }> }) {
  try {
    const { id, roomId } = await params;
    if (!(await canManage(authSession(req), id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const room = await prisma.virtualTourRoom.findUnique({ where: { id: roomId }, select: { property_id: true } });
    if (!room || room.property_id !== id) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    await prisma.virtualTourRoom.delete({ where: { id: roomId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete tour room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
