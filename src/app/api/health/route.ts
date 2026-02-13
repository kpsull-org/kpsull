import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  const healthy = Object.values(checks).every((v) => v === 'ok');

  return NextResponse.json(
    { status: healthy ? 'healthy' : 'degraded', checks },
    { status: healthy ? 200 : 503 }
  );
}
