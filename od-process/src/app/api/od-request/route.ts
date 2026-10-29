import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { analyzeODRequestAI } from '@/lib/groq';

export async function POST(req: Request) {
  try {
    const { eventTitle, eventType, startDate, endDate, reason, studentId, attachmentUrl } = await req.json();

    // Require a valid studentId from the authenticated client
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student identity is required. Please log in again.' },
        { status: 400 }
      );
    }

    // Resolve the student record
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found. Your account may not be properly linked.' },
        { status: 404 }
      );
    }

    // 2. Insert the OD Request
    const { data: odRequest, error: insertError } = await supabase
      .from('od_requests')
      .insert({
        student_id: student.id,
        event_title: eventTitle,
        event_type: eventType,
        event_date_from: startDate,
        event_date_to: endDate,
        reason: reason,
        attachment_url: attachmentUrl,
        status: 'Pending',
        current_stage: 'Advisor'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 3. AI Analysis logic remains the same...

    // 3. AI Fraud Analysis (Background processing)
    try {
      const combinedReason = `Event: ${eventTitle} (${eventType})\nDates: ${startDate} to ${endDate}\nReason: ${reason}`;
      const isLongOD = (new Date(endDate).getTime() - new Date(startDate).getTime()) > (3 * 24 * 60 * 60 * 1000);
      const timetableStr = student.timetable ? JSON.stringify(student.timetable, null, 2) : "[]";
      
      const aiResponse = await analyzeODRequestAI(combinedReason, isLongOD, timetableStr);

      // 4. Save AI Analysis to DB
      if (aiResponse) {
        await supabase.from('ai_analysis_logs').insert({
          od_request_id: odRequest.id,
          ai_priority: aiResponse.ai_priority || 'Medium Priority',
          fraud_risk_score: aiResponse.fraud_risk_score || 0.1,
          attendance_risk_prediction: aiResponse.attendance_risk_prediction || 'Safe',
          ai_reasoning: aiResponse.ai_reasoning || 'Standard request.',
          suspicious_flags: aiResponse.suspicious_flags || []
        });
      }
      
    } catch (aiError) {
      console.error("AI Analysis Failed (Non-blocking):", aiError);
    }

    // 5. Return success
    return NextResponse.json({ success: true, request: odRequest });

  } catch (error: any) {
    console.error('Supabase Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create OD request' }, { status: 500 });
  }
}
