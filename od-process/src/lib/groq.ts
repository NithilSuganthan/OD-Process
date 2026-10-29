import Groq from 'groq-sdk';

// Ensure the API key exists
const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
    console.warn("GROQ_API_KEY is missing in your environment variables. AI Features will not work.");
}

export const groqClient = new Groq({
    apiKey: apiKey || 'dummy-key-to-prevent-crash', // Default for build-time safety
});

/**
 * Common AI Wrapper for formatting requests and analyzing risk
 */
export async function analyzeODRequestAI(requestText: string, attendanceRisk: boolean, timetableStr: string = "[]") {
    if (!apiKey) return null;
    
    // We will build specific intelligent prompts for smart validation
    const completion = await groqClient.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: `You are an AI decision engine for a Department-level On Duty (OD) Management Portal. 
                Task: Analyze the student's request text and their timetable.
                Calculate which faculty members they will miss during the requested dates based on the provided timetable.
                Return your analysis in valid JSON with these exact keys:
                - "ai_priority": "High Priority", "Medium Priority", "Low Priority", or "Suspicious Request"
                - "fraud_risk_score": float between 0.0 and 1.0
                - "suspicious_flags": array of strings (empty if none)
                - "attendance_risk_prediction": "Safe", "Warning", or "Critical" (use ${attendanceRisk} to inform this)
                - "ai_reasoning": brief summary text. (MUST INCLUDE which faculties the student will miss classes for based on their timetable.)`
            },
            {
                role: 'user',
                content: `Student Request Details: ${requestText}\n\nStudent Timetable:\n${timetableStr}`
            }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        response_format: { type: 'json_object' }
    });

    try {
        return JSON.parse(completion.choices[0]?.message?.content || '{}');
    } catch (e) {
        console.error("AI parsing failed:", e);
        return null;
    }
}

/**
 * AI function to expand a short student reason into a formal OD request letter
 */
export async function generateFormalODLetter(studentName: string, regNo: string, eventDetails: string, shortReason: string) {
    if (!apiKey) return shortReason; // fallback

    try {
        const completion = await groqClient.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are a professional assistant helping a college student write a formal On-Duty (OD) request letter.
                    The student has provided some basic details. Expand them into a polite, formal, and persuasive paragraph addressed to the "Respected Class Advisor and Head of the Department".
                    Do not include placeholders like [Date] or signature blocks, just provide the main body paragraph(s) of the letter.`
                },
                {
                    role: 'user',
                    content: `Student Name: ${studentName}\nRegister No: ${regNo}\nEvent Details: ${eventDetails}\nShort Reason: ${shortReason}\n\nPlease write the formal OD request body.`
                }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.5,
        });

        return completion.choices[0]?.message?.content?.trim() || shortReason;
    } catch (e) {
        console.error("AI Letter Generation failed:", e);
        return shortReason;
    }
}
