import { NextResponse } from 'next/server';
import { requireAdminServer } from '@/lib/auth-server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { authorized } = await requireAdminServer();
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    const users = await db.users.list();
    const projects = await db.projects.list();
    const posts = await db.posts.listAllForAdmin();

    return NextResponse.json({ users, projects, posts });
  } catch (error) {
    console.error('Admin data fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 });
  }
}
