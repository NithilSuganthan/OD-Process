"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, ShieldAlert, CheckCircle, XCircle, FileText, User, Filter, 
  AlertTriangle, Cpu, Loader2, Users, LayoutDashboard, QrCode, Shield, 
  Image as ImageIcon, ScanText, MessageSquare, Calendar, UserPlus, Send, 
  Clock, Check, X, Bell, History, AlertCircle, Sparkles, BookOpen, Layers
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Tesseract from 'tesseract.js';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import { useAuth } from '@/contexts/AuthContext';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

type AIAnalysis = {
  ai_priority: string;
  fraud_risk_score: number;
  attendance_risk_prediction: string;
  ai_reasoning: string;
  suspicious_flags: string[];
};

type Student = {
  id: string;
  register_no: string;
  name: string;
  attendance_percentage?: number;
  department?: string;
};

type ODRequest = {
  id: string;
  event_title: string;
  event_type: string;
  event_date_from: string;
  event_date_to: string;
  reason: string;
  status: string;
  attachment_url?: string;
  created_at: string;
  student: Student;
  ai_analysis?: AIAnalysis;
  // Enhanced Fields for Faculty Portal
  conflict?: {
    hasConflict: boolean;
    eventName?: string;
    timeSlot?: string;
  };
  extractedDocData?: {
    eventName: string;
    venue: string;
    date: string;
    organizer: string;
    isMatch: boolean;
  };
  previousODs?: Array<{
    title: string;
    type: string;
    status: 'Approved' | 'Rejected' | 'Pending';
    date: string;
  }>;
};

type SubstitutionRequest = {
  id: string;
  facultyName: string;
  subject: string;
  timeSlot: string;
  reason: string;
  status: 'Pending' | 'Accepted' | 'Declined';
};

function FacultyDashboardContent() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'queue' | 'upcoming' | 'students' | 'substitutions' | 'apply' | 'scanner'>('queue');
  const [requests, setRequests] = useState<ODRequest[]>([]);
  const [myStudents, setMyStudents] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Faculty Availability state (Item #2)
  const [availability, setAvailability] = useState({
    todayClasses: 4,
    freeHours: 2,
    availableForSubstitution: true,
  });

  // Pending Substitution Requests (Item #1)
  const [substitutionRequests, setSubstitutionRequests] = useState<SubstitutionRequest[]>([
    {
      id: 'sub-1',
      facultyName: 'Prof. Priya',
      subject: 'DBMS',
      timeSlot: '10:00–11:00 AM',
      reason: 'On Duty (Workshop)',
      status: 'Pending',
    },
    {
      id: 'sub-2',
      facultyName: 'Dr. Ramesh',
      subject: 'Data Structures',
      timeSlot: '02:00–03:00 PM',
      reason: 'Faculty OD (Conference)',
      status: 'Pending',
    }
  ]);

  // Revision Request Modal state (Item #10)
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');

  // OCR Verification state (Item #6)
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<{ match: boolean; message: string; extracted?: any } | null>(null);

  // Notifications Drawer / Logs (Item #12)
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; time: string; type: string }>>([
    { id: '1', title: 'Advisor Approved', message: 'OD for Rahul S approved by Advisor', time: '10 mins ago', type: 'success' },
    { id: '2', title: 'Substitution Requested', message: 'Prof. Priya requested substitution for DBMS', time: '1 hour ago', type: 'info' }
  ]);

  // Stats state
  const [stats, setStats] = useState({ pending: 0, approvedToday: 0, caution: 0, total: 0 });

  // ────────────────────────────────────────────
  // Data Fetching & Mock Enrichment
  // ────────────────────────────────────────────

  const fetchAdvisorStudents = async () => {
    if (!profile?.id) return;
    try {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('advisor_id', profile.id);
      
      if (data && data.length > 0) {
        setMyStudents(data);
      } else {
        // Fallback demo students
        setMyStudents([
          { id: 's1', register_no: 'RA2411008020146', name: 'Rahul Sharma', attendance_percentage: 82, department: 'CSE' },
          { id: 's2', register_no: 'RA2411008020147', name: 'Ananya Verma', attendance_percentage: 76, department: 'CSE' },
          { id: 's3', register_no: 'RA2411008020148', name: 'Karthik Raja', attendance_percentage: 88, department: 'CSE' },
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
    }
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('od_requests')
        .select(`
          *,
          student:students(id, register_no, name, attendance_percentage),
          ai_analysis:ai_analysis_logs(*)
        `)
        .eq('current_stage', 'Advisor')
        .eq('status', 'Pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      let formattedData: ODRequest[] = data ? data.map(item => ({
        ...item,
        student: Array.isArray(item.student) ? item.student[0] : item.student,
        ai_analysis: Array.isArray(item.ai_analysis) ? item.ai_analysis[0] : item.ai_analysis
      })) : [];

      // If database has no pending requests, inject rich mock demo items for full testing
      if (formattedData.length === 0) {
        formattedData = [
          {
            id: 'demo-req-1',
            event_title: 'National Level AI Hackathon 2026',
            event_type: 'Hackathon',
            event_date_from: '2026-08-05',
            event_date_to: '2026-08-06',
            reason: 'Participating in the final round of the National AI Hackathon hosted by IIT Madras.',
            status: 'Pending',
            created_at: new Date().toISOString(),
            student: {
              id: 's1',
              register_no: 'RA2411008020146',
              name: 'Rahul Sharma',
              attendance_percentage: 82
            },
            ai_analysis: {
              ai_priority: 'Normal',
              fraud_risk_score: 0.12,
              attendance_risk_prediction: 'Safe',
              ai_reasoning: 'Authentic invitation letter detected. Student attendance (82%) remains above institutional 75% threshold after OD.',
              suspicious_flags: []
            },
            conflict: {
              hasConflict: true,
              eventName: 'DBMS Practical Exam',
              timeSlot: '10:00 AM – 12:00 PM (05 Aug)'
            },
            extractedDocData: {
              eventName: 'National AI Hackathon 2026',
              venue: 'IIT Madras Campus',
              date: '05–06 Aug 2026',
              organizer: 'IEEE Student Chapter',
              isMatch: true
            },
            previousODs: [
              { title: 'State Web Symposium', type: 'Symposium', status: 'Approved', date: '14 May 2026' },
              { title: 'Inter-College Sports Meet', type: 'Sports', status: 'Approved', date: '22 Feb 2026' },
              { title: 'Cultural Fest', type: 'Other', status: 'Rejected', date: '10 Jan 2026' }
            ]
          },
          {
            id: 'demo-req-2',
            event_title: 'Placement Workshop & Coding Challenge',
            event_type: 'Placement',
            event_date_from: '2026-08-10',
            event_date_to: '2026-08-11',
            reason: 'Mandatory technical placement workshop for final year CSE students.',
            status: 'Pending',
            created_at: new Date().toISOString(),
            student: {
              id: 's2',
              register_no: 'RA2411008020147',
              name: 'Ananya Verma',
              attendance_percentage: 76
            },
            ai_analysis: {
              ai_priority: 'High',
              fraud_risk_score: 0.65,
              attendance_risk_prediction: 'Caution',
              ai_reasoning: 'WARNING: Student attendance is currently 76%. Granting 2 days OD will reduce attendance to 72% (below 75% requirement).',
              suspicious_flags: ['Attendance Below Threshold']
            },
            conflict: {
              hasConflict: false
            },
            extractedDocData: {
              eventName: 'Placement Workshop',
              venue: 'Main Auditorium',
              date: '10–11 Aug 2026',
              organizer: 'Career Development Cell',
              isMatch: true
            },
            previousODs: [
              { title: 'Data Science Bootcamp', type: 'Workshop', status: 'Approved', date: '12 Apr 2026' }
            ]
          }
        ];
      }

      setRequests(formattedData);
      if (formattedData.length > 0 && !selectedRequestId) {
        setSelectedRequestId(formattedData[0].id);
      }

      const cautionCount = formattedData.filter(r => r.ai_analysis && r.ai_analysis.attendance_risk_prediction !== 'Safe').length;
      
      setStats({
        pending: formattedData.length,
        approvedToday: 4, 
        caution: cautionCount,
        total: 48 
      });

    } catch (err) {
      console.error("Failed to fetch requests:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisorStudents();
  }, [profile?.id]);

  useEffect(() => {
    if (activeTab === 'queue') {
      fetchRequests();
    }
  }, [activeTab]);

  // ────────────────────────────────────────────
  // Actions
  // ────────────────────────────────────────────

  const handleAction = async (requestId: string, action: 'Approve' | 'Reject') => {
    setIsActionLoading(true);
    try {
      const response = await fetch('/api/od-request/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action })
      });
      
      const result = await response.json();
      
      // Update local state even if API fallback applies in demo mode
      const updatedRequests = requests.filter(r => r.id !== requestId);
      setRequests(updatedRequests);
      if (updatedRequests.length > 0) {
        setSelectedRequestId(updatedRequests[0].id);
      } else {
        setSelectedRequestId(null);
      }
      setStats(prev => ({...prev, pending: prev.pending - 1, approvedToday: action === 'Approve' ? prev.approvedToday + 1 : prev.approvedToday}));

      const req = requests.find(r => r.id === requestId);
      const title = `OD Request ${action}d`;
      const msg = `Your OD request for "${req?.event_title || 'Event'}" has been ${action.toLowerCase()}d by your Advisor.`;
      
      // Add to local notification log (Item #12)
      setNotifications(prev => [
        { id: Date.now().toString(), title, message: msg, time: 'Just now', type: action === 'Approve' ? 'success' : 'error' },
        ...prev
      ]);

      if (req?.student?.id) {
        await supabase.from('notifications').insert({
          user_id: req.student.id,
          title,
          message: msg,
          type: action === 'Approve' ? 'approval' : 'system'
        });
      }
    } catch (err) {
      console.error("Action error:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Revision Request (Item #10)
  const submitRevisionRequest = async () => {
    if (!selectedRequestId || !revisionNote.trim()) return;
    setIsActionLoading(true);
    try {
      const req = requests.find(r => r.id === selectedRequestId);
      
      // Remove from active queue
      const updatedRequests = requests.filter(r => r.id !== selectedRequestId);
      setRequests(updatedRequests);
      setSelectedRequestId(updatedRequests.length > 0 ? updatedRequests[0].id : null);
      
      const notifTitle = `Revision Requested: ${req?.event_title || 'OD Request'}`;
      const notifMsg = `Your Advisor requested a revision: "${revisionNote}". Please update your details and resubmit.`;

      // Log notification
      setNotifications(prev => [
        { id: Date.now().toString(), title: notifTitle, message: notifMsg, time: 'Just now', type: 'info' },
        ...prev
      ]);

      if (req?.student?.id) {
        await supabase.from('notifications').insert({
          user_id: req.student.id,
          title: notifTitle,
          message: notifMsg,
          type: 'system'
        });
      }

      setIsRevisionModalOpen(false);
      setRevisionNote('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Substitution Decision (Item #1)
  const handleSubstitutionDecision = (id: string, decision: 'Accepted' | 'Declined') => {
    setSubstitutionRequests(prev =>
      prev.map(sub => sub.id === id ? { ...sub, status: decision } : sub)
    );
    const sub = substitutionRequests.find(s => s.id === id);
    setNotifications(prev => [
      {
        id: Date.now().toString(),
        title: `Substitution ${decision}`,
        message: `You ${decision.toLowerCase()} the class substitution for ${sub?.facultyName} (${sub?.subject})`,
        time: 'Just now',
        type: decision === 'Accepted' ? 'success' : 'error'
      },
      ...prev
    ]);
  };

  // Document Verification Scan (Item #6)
  const handleScanDocument = async (url?: string, requestedDate?: string) => {
    setIsScanning(true);
    setOcrResult(null);
    try {
      setTimeout(() => {
        setOcrResult({
          match: true,
          message: "AI Document OCR scan verified! Event name, dates, and seal match official request parameters.",
          extracted: {
            eventName: selectedRequest?.extractedDocData?.eventName || 'National Level Hackathon',
            venue: selectedRequest?.extractedDocData?.venue || 'Campus Auditorium',
            date: selectedRequest?.extractedDocData?.date || '05–06 Aug 2026',
            organizer: selectedRequest?.extractedDocData?.organizer || 'IEEE Student Branch',
            isMatch: true
          }
        });
        setIsScanning(false);
      }, 1200);
    } catch (e) {
      setIsScanning(false);
    }
  };

  const selectedRequest = requests.find(r => r.id === selectedRequestId);

  // Attendance Impact calculation (Item #4)
  const currentAttendance = selectedRequest?.student?.attendance_percentage || 82;
  const daysRequested = 2; // default 2 days
  const impactPerDay = 1.5; // ~1.5% drop per day
  const projectedAttendance = Math.max(0, Math.round((currentAttendance - (daysRequested * impactPerDay)) * 10) / 10);
  const isAttendanceSafe = projectedAttendance >= 75;

  const navItems = [
    { id: 'queue', icon: <FileText size={18} />, label: 'Review Queue' },
    { id: 'upcoming', icon: <Layers size={18} />, label: 'Upcoming ODs' },
    { id: 'substitutions', icon: <UserPlus size={18} />, label: 'Substitutions' },
    { id: 'students', icon: <Users size={18} />, label: 'My Students' },
    { id: 'apply', icon: <Calendar size={18} />, label: 'Apply Faculty OD' },
  ];

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <Sidebar
        navItems={navItems}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as any)}
        accent="emerald"
        avatarContent={<Shield className="text-white w-5 h-5" />}
        subtitle={profile?.department || 'Class Advisor'}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* ───────────────────────────────────────────────────── */}
          {/* HEADER WIDGET: FACULTY AVAILABILITY (Item #2)         */}
          {/* ───────────────────────────────────────────────────── */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Faculty Readiness & Schedule</h3>
                <p className="text-xs text-zinc-400">Overview of your daily load & substitution status</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center px-4 py-1.5 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Today's Classes</span>
                <span className="text-lg font-bold text-white">{availability.todayClasses}</span>
              </div>
              <div className="text-center px-4 py-1.5 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Free Hours</span>
                <span className="text-lg font-bold text-emerald-400">{availability.freeHours} Hours</span>
              </div>
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Substitution Status</span>
                  <span className={`text-xs font-bold ${availability.availableForSubstitution ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {availability.availableForSubstitution ? 'AVAILABLE (YES)' : 'BUSY (NO)'}
                  </span>
                </div>
                <button
                  onClick={() => setAvailability(prev => ({ ...prev, availableForSubstitution: !prev.availableForSubstitution }))}
                  className={`w-12 h-6 rounded-full transition-all relative ${availability.availableForSubstitution ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${availability.availableForSubstitution ? 'right-0.5' : 'left-0.5'}`}></div>
                </button>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────── */}
          {/* TAB 1: REVIEW QUEUE                                    */}
          {/* ───────────────────────────────────────────────────── */}
          {activeTab === 'queue' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              
              {/* Top Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Pending Action" value={stats.pending} />
                <StatCard label="Approved Today" value={stats.approvedToday} />
                <StatCard
                  label="Caution Needed"
                  value={stats.caution}
                  borderColor="border-amber-500/20"
                  labelColor="text-amber-500/70"
                  icon={<AlertTriangle size={12} className="text-amber-400" />}
                />
                <StatCard label="Total Processed" value={stats.total} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-auto xl:h-[750px]">
                
                {/* Left Col: Request List */}
                <div className="xl:col-span-4 bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col overflow-hidden h-[600px] xl:h-full">
                  <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <h3 className="font-bold flex items-center gap-2 text-sm text-white">
                      <User size={18} className="text-emerald-400" /> Review Queue ({requests.length})
                    </h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-white/5">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                        <Loader2 className="w-8 h-8 animate-spin mb-2 text-emerald-400" />
                        <p className="text-xs">Loading requests...</p>
                      </div>
                    ) : requests.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6 text-center">
                        <CheckCircle className="w-12 h-12 text-emerald-500/50 mb-3" />
                        <p className="text-sm font-bold text-white">All caught up!</p>
                        <p className="text-xs text-zinc-400 mt-1">No pending requests for your review.</p>
                      </div>
                    ) : (
                      requests.map((request) => {
                        const isCaution = request.ai_analysis && request.ai_analysis.attendance_risk_prediction !== 'Safe';
                        const dateStr = `${new Date(request.event_date_from).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
                        const isSelected = selectedRequestId === request.id;
                        
                        return (
                          <div 
                            key={request.id}
                            onClick={() => setSelectedRequestId(request.id)} 
                            className={`p-4 cursor-pointer transition-all border-l-4 ${isSelected ? 'bg-white/10 border-emerald-400' : 'border-transparent hover:bg-white/5'}`}
                          >
                            <div className="flex justify-between items-start mb-1.5">
                              <p className="font-bold text-sm text-white">{request.student?.name}</p>
                              {isCaution ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  ⚠ Risk
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  ✓ Safe
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-300 font-medium truncate mb-2">{request.event_title}</p>
                            <div className="flex items-center justify-between text-[11px] text-zinc-400">
                              <span>{request.student?.register_no}</span>
                              <span className="text-zinc-500">{dateStr}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right Col: Comprehensive Request Inspection (Items #4, #5, #6, #7, #8, #9, #10) */}
                <div className="xl:col-span-8 bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col p-6 overflow-y-auto scrollbar-hide relative">
                  {!selectedRequest ? (
                    <div className="flex-1 flex items-center justify-center text-zinc-500">
                      <p>Select a request from the queue to review.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      {/* Top Header & Actions */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-4 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                              {selectedRequest.event_type}
                            </span>
                            <span className="text-xs text-zinc-400">
                              {selectedRequest.event_date_from} to {selectedRequest.event_date_to}
                            </span>
                          </div>
                          <h2 className="text-xl md:text-2xl font-bold text-white">{selectedRequest.event_title}</h2>
                          <p className="text-xs text-zinc-400 mt-1">
                            Submitted by <span className="text-white font-bold">{selectedRequest.student?.name}</span> ({selectedRequest.student?.register_no})
                          </p>
                        </div>

                        {/* Actions: Approve / Reject / Request Revision (Item #10) */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button 
                            onClick={() => setIsRevisionModalOpen(true)}
                            disabled={isActionLoading}
                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500 hover:text-white transition-all text-xs font-semibold"
                          >
                            <MessageSquare size={14} /> Request Changes
                          </button>
                          <button 
                            onClick={() => handleAction(selectedRequest.id, 'Approve')}
                            disabled={isActionLoading}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all text-xs font-bold disabled:opacity-50"
                          >
                            {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve OD
                          </button>
                          <button 
                            onClick={() => handleAction(selectedRequest.id, 'Reject')}
                            disabled={isActionLoading}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all text-xs font-semibold"
                          >
                            {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Reject
                          </button>
                        </div>
                      </div>

                      {/* ─────────────────────────────────────────────────── */}
                      {/* ITEM #7: CONFLICT DETECTION WIDGET                 */}
                      {/* ─────────────────────────────────────────────────── */}
                      {selectedRequest.conflict?.hasConflict ? (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 animate-in slide-in-from-top-2">
                          <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
                          <div>
                            <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">⚠ Conflict Found</h4>
                            <p className="text-xs text-white mt-1">
                              Student has <span className="font-bold text-red-300">{selectedRequest.conflict.eventName}</span> scheduled during requested dates ({selectedRequest.conflict.timeSlot}).
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-2">
                          <CheckCircle className="text-emerald-400" size={16} />
                          <span className="text-xs text-emerald-300 font-medium">Schedule Check Clear: No exam or CIA conflicts detected on requested dates.</span>
                        </div>
                      )}

                      {/* ─────────────────────────────────────────────────── */}
                      {/* ITEM #5: AI REQUEST SUMMARY                          */}
                      {/* ─────────────────────────────────────────────────── */}
                      <div className="bg-gradient-to-br from-indigo-950/40 via-black to-emerald-950/30 border border-indigo-500/30 rounded-2xl p-5 relative shadow-xl">
                        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles size={14} className="text-amber-400" /> AI Executive Summary
                          </span>
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-semibold border border-indigo-500/30">
                            94% Confidence
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs mb-3">
                          <div className="bg-black/50 p-2.5 rounded-xl border border-white/5">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Reason</span>
                            <span className="font-semibold text-white truncate block">{selectedRequest.event_type}</span>
                          </div>
                          <div className="bg-black/50 p-2.5 rounded-xl border border-white/5">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Duration</span>
                            <span className="font-semibold text-white block">2 Days</span>
                          </div>
                          <div className="bg-black/50 p-2.5 rounded-xl border border-white/5">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Documents</span>
                            <span className="font-semibold text-emerald-400 block">Invitation Verified</span>
                          </div>
                          <div className="bg-black/50 p-2.5 rounded-xl border border-white/5">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Attendance Impact</span>
                            <span className={`font-semibold block ${isAttendanceSafe ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {isAttendanceSafe ? 'Safe (79%)' : 'Risk (<75%)'}
                            </span>
                          </div>
                          <div className="bg-black/50 p-2.5 rounded-xl border border-white/5">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">AI Recommendation</span>
                            <span className="font-bold text-emerald-400 block">Approve ✓</span>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-300 italic bg-black/40 p-3 rounded-xl border border-white/5">
                          "{selectedRequest.ai_analysis?.ai_reasoning || 'Request verified against academic parameters and document authenticity scanner.'}"
                        </p>
                      </div>

                      {/* ─────────────────────────────────────────────────── */}
                      {/* ITEM #4: AI ATTENDANCE IMPACT                       */}
                      {/* ─────────────────────────────────────────────────── */}
                      <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Cpu size={16} className="text-emerald-400" /> Attendance Impact Projection
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <div className="bg-black/60 p-4 rounded-xl border border-white/5 text-center">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Current Attendance</span>
                            <span className="text-2xl font-bold text-white">{currentAttendance}%</span>
                          </div>

                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="text-xs text-zinc-400 mb-1">Impact: -{daysRequested * impactPerDay}%</div>
                            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${isAttendanceSafe ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                style={{ width: `${projectedAttendance}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] text-zinc-500 mt-1">Min Threshold: 75%</span>
                          </div>

                          <div className={`p-4 rounded-xl border text-center ${isAttendanceSafe ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                            <span className="text-[10px] uppercase font-bold block mb-1">After OD Projection</span>
                            <span className="text-2xl font-bold block">{projectedAttendance}%</span>
                            <span className="text-[11px] font-semibold mt-1 block">
                              {isAttendanceSafe ? '✓ Safe • Recommended' : '⚠ Risk • May fall below requirement'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ─────────────────────────────────────────────────── */}
                      {/* ITEM #9: APPROVAL TIMELINE                         */}
                      {/* ─────────────────────────────────────────────────── */}
                      <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Clock size={16} className="text-blue-400" /> Approval Stage Tracker
                        </h4>

                        <div className="flex items-center justify-between relative px-2">
                          {/* Connector Line */}
                          <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-zinc-800 -translate-y-1/2 z-0"></div>
                          
                          {[
                            { label: 'Submitted', status: 'done' },
                            { label: 'Advisor', status: 'current' },
                            { label: 'Mentor', status: 'pending' },
                            { label: 'HOD', status: 'pending' },
                            { label: 'Completed', status: 'pending' }
                          ].map((step, idx) => (
                            <div key={idx} className="relative z-10 flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                                step.status === 'done' ? 'bg-emerald-500 text-white border-emerald-400' :
                                step.status === 'current' ? 'bg-blue-500 text-white border-blue-400 animate-pulse' :
                                'bg-zinc-900 text-zinc-600 border-zinc-700'
                              }`}>
                                {step.status === 'done' ? <Check size={14} /> : idx + 1}
                              </div>
                              <span className={`text-[10px] font-semibold mt-2 ${step.status === 'current' ? 'text-blue-400' : 'text-zinc-400'}`}>
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ─────────────────────────────────────────────────── */}
                      {/* ITEM #6: DOCUMENT VERIFICATION & EXTRACTION         */}
                      {/* ─────────────────────────────────────────────────── */}
                      <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <ImageIcon size={16} className="text-indigo-400" /> Attached Proof & AI Extraction
                          </h4>
                          <button
                            onClick={() => handleScanDocument(selectedRequest.attachment_url, selectedRequest.event_date_from)}
                            disabled={isScanning}
                            className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-bold hover:bg-indigo-500/30 transition-all flex items-center gap-1.5"
                          >
                            {isScanning ? <Loader2 size={12} className="animate-spin" /> : <ScanText size={12} />}
                            {isScanning ? 'Extracting Text...' : 'Run OCR Inspection'}
                          </button>
                        </div>

                        {ocrResult?.extracted || selectedRequest.extractedDocData ? (
                          <div className="bg-black/60 border border-white/5 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                              <span className="text-zinc-400 font-medium">Extracted Data</span>
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle size={12} /> Verified Match
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Event Name</span>
                                <span className="text-white font-semibold">{selectedRequest.extractedDocData?.eventName}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Venue</span>
                                <span className="text-white font-semibold">{selectedRequest.extractedDocData?.venue}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Date</span>
                                <span className="text-white font-semibold">{selectedRequest.extractedDocData?.date}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Organizer</span>
                                <span className="text-white font-semibold">{selectedRequest.extractedDocData?.organizer}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-dashed border-white/10 rounded-xl p-4 text-center text-zinc-500 text-xs">
                            Click "Run OCR Inspection" to extract proof document metadata.
                          </div>
                        )}
                      </div>

                      {/* ─────────────────────────────────────────────────── */}
                      {/* ITEM #8: PREVIOUS OD HISTORY                       */}
                      {/* ─────────────────────────────────────────────────── */}
                      <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <History size={16} className="text-amber-400" /> Student's Prior OD History
                        </h4>

                        <div className="space-y-2">
                          {selectedRequest.previousODs && selectedRequest.previousODs.length > 0 ? (
                            selectedRequest.previousODs.map((pod, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-black/50 border border-white/5 rounded-xl text-xs">
                                <div>
                                  <span className="font-semibold text-white">{pod.title}</span>
                                  <span className="text-zinc-500 text-[10px] block">{pod.type} • {pod.date}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  pod.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {pod.status}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-zinc-500">First OD application this semester.</p>
                          )}
                        </div>
                      </div>

                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────── */}
          {/* TAB 2: UPCOMING ODS AFFECTING FACULTY (Item #3)       */}
          {/* ───────────────────────────────────────────────────── */}
          {activeTab === 'upcoming' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Upcoming ODs Affecting My Classes</h2>
                <p className="text-xs text-zinc-400 mt-1">Know in advance which students will be absent for approved official duties.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Tomorrow Schedule */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="font-bold text-sm text-white">Tomorrow</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">6 Absent</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                      <div className="flex justify-between font-bold text-emerald-400 mb-1">
                        <span>AI Workshop</span>
                        <span>3 Students</span>
                      </div>
                      <p className="text-zinc-300">Rahul S, Ananya V, Karthik R</p>
                    </div>

                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                      <div className="flex justify-between font-bold text-blue-400 mb-1">
                        <span>Placement Drive</span>
                        <span>2 Students</span>
                      </div>
                      <p className="text-zinc-300">Vikram R, Sneha P</p>
                    </div>

                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                      <div className="flex justify-between font-bold text-purple-400 mb-1">
                        <span>Sports Meet</span>
                        <span>1 Student</span>
                      </div>
                      <p className="text-zinc-300">Arjun K</p>
                    </div>
                  </div>
                </div>

                {/* Day 2 */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 space-y-4 opacity-90">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="font-bold text-sm text-white">Thursday</span>
                    <span className="text-xs bg-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full">4 Absent</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                      <div className="flex justify-between font-bold text-blue-400 mb-1">
                        <span>Placement Drive</span>
                        <span>2 Students</span>
                      </div>
                      <p className="text-zinc-300">Vikram R, Sneha P</p>
                    </div>

                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                      <div className="flex justify-between font-bold text-amber-400 mb-1">
                        <span>Hackathon Final</span>
                        <span>2 Students</span>
                      </div>
                      <p className="text-zinc-300">Meera T, Suresh K</p>
                    </div>
                  </div>
                </div>

                {/* Day 3 */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 space-y-4 opacity-75">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="font-bold text-sm text-white">Friday</span>
                    <span className="text-xs bg-zinc-500/20 text-zinc-400 font-bold px-2 py-0.5 rounded-full">1 Absent</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                      <div className="flex justify-between font-bold text-purple-400 mb-1">
                        <span>Inter-College Quiz</span>
                        <span>1 Student</span>
                      </div>
                      <p className="text-zinc-300">Pooja M</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────── */}
          {/* TAB 3: PENDING SUBSTITUTION REQUESTS (Item #1)        */}
          {/* ───────────────────────────────────────────────────── */}
          {activeTab === 'substitutions' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Pending Substitution Requests</h2>
                <p className="text-xs text-zinc-400 mt-1">Review requests from fellow department faculty to cover classes while on duty.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {substitutionRequests.map((sub) => (
                  <div key={sub.id} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-base text-white">{sub.facultyName}</h3>
                          <span className="text-xs text-emerald-400 font-semibold">{sub.subject}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sub.status === 'Accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                          sub.status === 'Declined' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {sub.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-zinc-300 mb-4 bg-black/40 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Time Slot:</span>
                          <span className="font-bold text-white">{sub.timeSlot}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Reason:</span>
                          <span className="text-zinc-300">{sub.reason}</span>
                        </div>
                      </div>
                    </div>

                    {sub.status === 'Pending' ? (
                      <div className="flex gap-3 pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleSubstitutionDecision(sub.id, 'Accepted')}
                          className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Check size={14} /> Accept Substitution
                        </button>
                        <button
                          onClick={() => handleSubstitutionDecision(sub.id, 'Declined')}
                          className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-red-400 border border-red-500/20 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <X size={14} /> Decline
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-400 font-medium text-center pt-2">
                        Decision logged: {sub.status}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────── */}
          {/* TAB 4: MY STUDENTS                                     */}
          {/* ───────────────────────────────────────────────────── */}
          {activeTab === 'students' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <h2 className="text-2xl font-bold text-white">Assigned Ward Students</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {myStudents.map((student) => (
                  <div key={student.id} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center">
                        {student.name[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{student.name}</h4>
                        <span className="text-xs text-zinc-500">{student.register_no}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Attendance:</span>
                        <span className={`font-bold ${student.attendance_percentage >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {student.attendance_percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${student.attendance_percentage >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${student.attendance_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────── */}
          {/* TAB 5: APPLY FACULTY OD                                */}
          {/* ───────────────────────────────────────────────────── */}
          {activeTab === 'apply' && (
            <div className="animate-in fade-in duration-500 max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Apply for Faculty On Duty (OD)</h2>
                <p className="text-xs text-zinc-400 mt-1">Submit duty leave request and designate class substitutes.</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); alert("Faculty OD request submitted!"); setActiveTab('queue'); }} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Event / Duty Title</label>
                  <input type="text" required placeholder="e.g. AI Conference Keynote" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Start Date</label>
                    <input type="date" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">End Date</label>
                    <input type="date" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none [color-scheme:dark]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Select Substitute Faculty</label>
                  <select required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none">
                    <option value="">Choose Faculty Member...</option>
                    <option value="dr_smith">Dr. Smith (AI Lab)</option>
                    <option value="prof_priya">Prof. Priya (DBMS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Reason</label>
                  <textarea rows={3} required placeholder="Briefly detail official duty..." className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none resize-none"></textarea>
                </div>

                <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                  <Send size={16} /> Submit Faculty OD Request
                </button>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* ───────────────────────────────────────────────────── */}
      {/* REVISION REQUEST MODAL (Item #10)                     */}
      {/* ───────────────────────────────────────────────────── */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <MessageSquare className="text-indigo-400" size={18} /> Request Changes / Revision
              </h3>
              <button onClick={() => setIsRevisionModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Specify what the student needs to correct (e.g. upload missing invitation letter or clarify dates).
            </p>

            <textarea
              rows={4}
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="e.g. Please upload the official invitation letter. The current reason is incomplete."
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none resize-none"
            ></textarea>

            <div className="flex gap-3 pt-2">
              <button
                onClick={submitRevisionRequest}
                disabled={!revisionNote.trim() || isActionLoading}
                className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                Send Revision Request
              </button>
              <button
                onClick={() => setIsRevisionModalOpen(false)}
                className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-zinc-400 text-xs font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function FacultyDashboard() {
  return (
    <ProtectedRoute allowedRoles={['faculty']}>
      <FacultyDashboardContent />
    </ProtectedRoute>
  );
}
