import { NextResponse } from 'next/server';
import { generateProposalWithAI } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await generateProposalWithAI(body);
    return NextResponse.json({ proposal: result });
  } catch (error) {
    console.error('Error generating proposal:', error);
    return NextResponse.json({ error: 'Failed to generate proposal' }, { status: 500 });
  }
}
