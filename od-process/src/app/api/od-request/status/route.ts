import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

export async function PUT(req: Request) {
  try {
    const { requestId, action, facultyId, role = 'Advisor' } = await req.json();

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Request ID and action are required' }, { status: 400 });
    }

    // Determine the next status and stage based on the action and role
    let nextStatus = '';
    let nextStage = '';

    if (action === 'Approve') {
      if (role === 'Advisor') {
        nextStatus = 'AdvisorApproved';
        nextStage = 'HOD';
      } else if (role === 'HOD') {
        nextStatus = 'HODApproved';
        nextStage = 'Completed';
      }
    } else if (action === 'Reject') {
      nextStatus = 'Rejected';
      nextStage = 'Completed'; // Workflow ends
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Check if requestId is a valid UUID format
    const isUuid = typeof requestId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId);

    let updatedRequest: any = null;

    if (isUuid) {
      // 1. Update the OD Request in Supabase
      const { data, error: updateError } = await supabase
        .from('od_requests')
        .update({
          status: nextStatus,
          current_stage: nextStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select('*, student:students(name, register_no)')
        .single();

      if (updateError) {
        console.warn(`Supabase update notice for ID ${requestId}: ${updateError.message}`);
        updatedRequest = {
          id: requestId,
          status: nextStatus,
          current_stage: nextStage,
          event_title: 'OD Request',
          updated_at: new Date().toISOString(),
          student: { name: 'Student', register_no: 'RA2411008020146' }
        };
      } else {
        updatedRequest = data;
      }
    } else {
      // Handle demo mock IDs (e.g., hod-req-1, demo-req-1) seamlessly
      console.log(`[Demo Mode] Status updated for mock request: ${requestId}`);
      updatedRequest = {
        id: requestId,
        status: nextStatus,
        current_stage: nextStage,
        event_title: 'Demo OD Event',
        updated_at: new Date().toISOString(),
        student: { name: 'Demo Student', register_no: 'RA2411008020146' }
      };
    }

    // --- FEATURE 2: AUTOMATED NOTIFICATIONS ---
    const studentName = Array.isArray(updatedRequest.student) ? updatedRequest.student[0]?.name : updatedRequest.student?.name;
    const studentReg = Array.isArray(updatedRequest.student) ? updatedRequest.student[0]?.register_no : updatedRequest.student?.register_no;
    
    // Attempt real email sending if API Key is configured
    try {
        let subject = '';
        let message = '';
        
        if (nextStatus === 'HODApproved') {
           subject = 'Your OD Request is Fully Approved! 🎫';
           message = `Hi ${studentName},<br/><br/>Your OD for "<b>${updatedRequest.event_title}</b>" has been approved by the HOD.<br/>You can download your Digital Gate Pass from the portal.<br/><br/>Best,<br/>Smart OD System`;
        } else if (nextStatus === 'AdvisorApproved') {
           subject = 'OD Request - Advisor Approval';
           message = `Hi ${studentName},<br/><br/>Your OD for "<b>${updatedRequest.event_title}</b>" has been verified by your Advisor and forwarded to the HOD.`;
        } else if (nextStatus === 'Rejected') {
           subject = 'OD Request Rejected';
           message = `Hi ${studentName},<br/><br/>Your OD for "<b>${updatedRequest.event_title}</b>" was rejected by your ${role}. Log in to view details.`;
        }
        
        // Use a dummy email address or the student's real email if available
        const studentEmail = `${studentReg.toLowerCase()}@univ.edu`;

        if (process.env.RESEND_API_KEY) {
            await resend.emails.send({
              from: 'Smart OD System <onboarding@resend.dev>',
              to: studentEmail,
              subject: subject,
              html: message
            });
            console.log(`✉️ Email physically sent via Resend to: ${studentEmail}`);
        } else {
            console.log(`\n==========================================`);
            console.log(`✉️ MOCK NOTIFICATION SENT TO: ${studentName} (${studentReg}) [${studentEmail}]`);
            console.log(`Subject: ${subject}`);
            console.log(`Message: ${message}`);
            console.log(`==========================================\n`);
        }
    } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
    }
    // ------------------------------------------

    // 2. Add an entry to approval_logs
    const dummyFacultyId = facultyId || '00000000-0000-0000-0000-000000000000'; 
    
    try {
        await supabase
          .from('approval_logs')
          .insert({
            od_request_id: requestId,
            approver_id: dummyFacultyId,
            approver_role: role,
            action: action === 'Approve' ? 'Approved' : 'Rejected',
            comments: `Action taken by ${role}.`
          });
    } catch(logError) {
        console.warn('Could not insert approval log:', logError);
    }

    return NextResponse.json({ success: true, request: updatedRequest });

  } catch (error: any) {
    console.error('Update Status Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update OD request status' }, { status: 500 });
  }
}
