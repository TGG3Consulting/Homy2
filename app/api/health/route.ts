import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
  const health = {
    status: 'ok' as 'ok' | 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown' as 'ok' | 'error' | 'unknown',
      memory: process.memoryUsage(),
    }
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'ok';
  } catch (e) {
    health.status = 'degraded';
    health.checks.database = 'error';
  }

  return NextResponse.json(health, {
    status: health.status === 'ok' ? 200 : 503
  });
}
