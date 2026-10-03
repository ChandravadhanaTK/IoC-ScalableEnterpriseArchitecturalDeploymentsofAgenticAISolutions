import { NextResponse } from 'next/server';
import { askFreelancingAssistant } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const reply = await askFreelancingAssistant(messages);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Error in assistant API:', error);
    return NextResponse.json({ reply: 'Sorry, I am having trouble connecting right now.' }, { status: 500 });
  }
}
