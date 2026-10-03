import { NextResponse } from 'next/server';
import { requireAdminServer } from '@/lib/auth-server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { authorized } = await requireAdminServer();
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    const { userId, suspended } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await db.users.setSuspended(userId, Boolean(suspended));
    const users = await db.users.list();

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Toggle suspend error:', error);
    return NextResponse.json({ error: 'Failed to update user suspension' }, { status: 500 });
  }
}
