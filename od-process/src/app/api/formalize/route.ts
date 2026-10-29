import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { reason, eventType, eventTitle } = await req.json();

    if (!reason || !eventType || !eventTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that helps students write formal On Duty (OD) request letters for their university. You must rewrite the student\'s casual reason into a highly professional, polite, and well-structured formal letter. Include placeholders like [Your Name] and [Date] if necessary. DO NOT output anything other than the formalized letter itself.',
        },
        {
          role: 'user',
          content: `Event Type: ${eventType}\nEvent Title: ${eventTitle}\nStudent's Reason: ${reason}\n\nPlease formalize this into a professional OD request letter.`,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 500,
    });

    const formalizedText = completion.choices[0]?.message?.content || 'Failed to generate formalized text.';

    return NextResponse.json({ formalizedText });
  } catch (error) {
    console.error('Groq API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
