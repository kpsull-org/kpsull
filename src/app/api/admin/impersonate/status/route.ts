import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const IMPERSONATION_COOKIE = 'kpsull-admin-impersonating';

export async function GET() {
  const cookieStore = await cookies();
  const isImpersonating = !!cookieStore.get(IMPERSONATION_COOKIE)?.value;
  return NextResponse.json({ isImpersonating });
}
