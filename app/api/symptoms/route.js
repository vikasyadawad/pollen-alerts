import { NextResponse } from 'next/server';
import { getSymptoms, logSymptom } from '@/lib/db';

export async function GET() {
  try {
    const symptoms = getSymptoms();
    return NextResponse.json(symptoms);
  } catch (error) {
    console.error('Failed to get symptoms:', error);
    return NextResponse.json({ error: 'Failed to get symptoms' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { date, score } = await request.json();
    if (!date || typeof score !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    
    logSymptom(date, score);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log symptom:', error);
    return NextResponse.json({ error: 'Failed to log symptom' }, { status: 500 });
  }
}
