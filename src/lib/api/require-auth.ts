import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';

export interface AuthenticatedUser {
  id: string;
  role: string;
}

export interface RouteIdParams {
  params: Promise<{ id: string }>;
}

type AuthResult =
  | { success: true; user: AuthenticatedUser }
  | { success: false; response: NextResponse };

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, response: NextResponse.json({ error: 'Non authentifie' }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user) {
    return { success: false, response: NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 401 }) };
  }

  return { success: true, user: { id: user.id, role: user.role } };
}

export async function requireCreatorAuth(): Promise<AuthResult> {
  const result = await requireAuth();
  if (!result.success) return result;

  if (result.user.role !== 'CREATOR') {
    return { success: false, response: NextResponse.json({ error: 'Acces reserve aux createurs' }, { status: 403 }) };
  }

  return result;
}

export function apiError(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
