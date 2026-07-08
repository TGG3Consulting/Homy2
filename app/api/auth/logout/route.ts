import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/cookies';

export async function POST() {
  const response = NextResponse.json({ success: true });
  return clearAuthCookies(response);
}

export async function GET() {
  const response = NextResponse.json({ success: true });
  return clearAuthCookies(response);
}
