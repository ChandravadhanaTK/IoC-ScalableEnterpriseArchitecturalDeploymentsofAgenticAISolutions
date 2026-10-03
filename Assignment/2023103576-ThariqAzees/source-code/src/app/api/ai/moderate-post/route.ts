import { NextResponse } from 'next/server';
import { moderatePostWithAI } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const { body, category } = await req.json();
    const result = await moderatePostWithAI(body, category);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error moderating post:', error);
    return NextResponse.json({ verdict: 'SAFE', reason: 'Fallback moderation' });
  }
}
