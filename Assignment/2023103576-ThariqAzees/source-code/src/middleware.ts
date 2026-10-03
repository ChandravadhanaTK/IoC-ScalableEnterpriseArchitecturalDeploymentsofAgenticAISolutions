import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifySignedSessionToken } from '@/lib/session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const token = req.cookies.get('sb_session_id')?.value;

    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized. Authentication required.' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const payload = verifySignedSessionToken(token);
    if (!payload) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized. Invalid or forged session.' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const user = await db.users.findById(payload.userId);
    if (!user || user.role !== 'ADMIN' || user.suspended) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
