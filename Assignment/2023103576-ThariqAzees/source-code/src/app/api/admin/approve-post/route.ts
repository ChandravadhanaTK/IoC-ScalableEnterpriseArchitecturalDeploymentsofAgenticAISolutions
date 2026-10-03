import { NextResponse } from 'next/server';
import { requireAdminServer } from '@/lib/auth-server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { authorized } = await requireAdminServer();
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    const { postId } = await req.json();
    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    await db.posts.updateModeration(postId, 'PUBLISHED', 'SAFE', 'Approved by Admin');
    const posts = await db.posts.listAllForAdmin();

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error('Approve post error:', error);
    return NextResponse.json({ error: 'Failed to approve post' }, { status: 500 });
  }
}
