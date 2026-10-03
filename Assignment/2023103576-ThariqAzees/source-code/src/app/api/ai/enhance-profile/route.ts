import { NextResponse } from 'next/server';
import { enhanceProfileWithAI } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await enhanceProfileWithAI(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error enhancing profile:', error);
    return NextResponse.json({ error: 'Failed to enhance profile' }, { status: 500 });
  }
}
