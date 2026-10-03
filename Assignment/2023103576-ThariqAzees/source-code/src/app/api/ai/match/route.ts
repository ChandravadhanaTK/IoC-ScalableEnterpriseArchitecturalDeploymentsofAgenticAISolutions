import { NextResponse } from 'next/server';
import { calculateProjectMatch } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = calculateProjectMatch(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating match:', error);
    return NextResponse.json({ error: 'Failed to calculate match' }, { status: 500 });
  }
}
