import { NextResponse } from 'next/server';
import { generateFormalODLetter } from '@/lib/groq';

export async function POST(req: Request) {
  try {
    const { studentName, regNo, eventTitle, eventType, startDate, endDate, shortReason } = await req.json();

    if (!shortReason) {
      return NextResponse.json({ error: 'Short reason is required' }, { status: 400 });
    }

    const eventDetails = `Event: ${eventTitle} (${eventType}) from ${startDate} to ${endDate}`;
    
    const formalLetter = await generateFormalODLetter(studentName || 'Student', regNo || 'N/A', eventDetails, shortReason);

    return NextResponse.json({ success: true, formalLetter });
  } catch (error: any) {
    console.error('AI Enhance Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to enhance text' }, { status: 500 });
  }
}
