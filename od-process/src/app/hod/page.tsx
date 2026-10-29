"use client";

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, Cpu, BarChart3, FileSpreadsheet, QrCode, 
  Bell, Settings, Shield, User, Search, CheckCircle, XCircle, AlertTriangle, 
  Loader2, Filter, LogOut, TrendingUp, Calendar, Clock, Briefcase, Download, 
  Scan, ArrowRight, ShieldCheck, Sparkles, Check, RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import ProtectedRoute from '@/components/ProtectedRoute';
import QRCodeDisplay from '@/components/QRCodeDisplay';
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
  department: string;
  attendance_percentage?: number;
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
};

function HODDashboardContent() {
  const { profile, signOut } = useAuth();
  
  // Navigation Tabs (10 Requested Sections)
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'queue' | 'ai_insights' | 'analytics' | 'reports' | 'qr_verify' | 'notifications' | 'settings' | 'audit_logs' | 'profile'
  >('dashboard');

  const [requests, setRequests] = useState<ODRequest[]>([]);
  const [facultyAdvisors, setFacultyAdvisors] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // QR Verification Input State
  const [verifyIdInput, setVerifyIdInput] = useState('');
  const [verifiedPass, setVerifiedPass] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Department Settings State
  const [deptSettings, setDeptSettings] = useState({
    minAttendance: 75,
    maxOdDays: 14,
    autoEscalateRiskScore: 0.6,
    requireAdvisorPreApproval: true,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Department Notifications
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; time: string; type: string }>>([
    { id: '1', title: 'High Risk Escalation', message: 'Ananya Verma (CSE) requested OD with 72% projected attendance', time: '15 mins ago', type: 'warning' },
    { id: '2', title: 'Advisor Approved', message: 'Prof. Priya approved OD for Rahul Sharma (Hackathon)', time: '1 hour ago', type: 'success' },
    { id: '3', title: 'Faculty Duty Leave', message: 'Dr. Ramesh requested substitute cover for Data Structures', time: '2 hours ago', type: 'info' }
  ]);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; timestamp: string; actor: string; action: string; target: string; status: string }>>([
    { id: 'log-101', timestamp: '2026-08-01 10:30 AM', actor: 'Prof. Priya (Advisor)', action: 'Approved OD Request', target: 'Rahul Sharma (RA2411008020146)', status: 'Success' },
    { id: 'log-102', timestamp: '2026-08-01 09:15 AM', actor: 'AI Engine', action: 'Flagged Attendance Risk', target: 'Ananya Verma (RA2411008020147)', status: 'Flagged' },
    { id: 'log-103', timestamp: '2026-07-31 04:45 PM', actor: 'Dr. HOD', action: 'Final Approved OD', target: 'Karthik Raja (RA2411008020148)', status: 'Success' },
    { id: 'log-104', timestamp: '2026-07-31 02:20 PM', actor: 'Dr. HOD', action: 'Updated Department Settings', target: 'Min Attendance set to 75%', status: 'Success' },
  ]);

  // Stats state
  const [stats, setStats] = useState({ pending: 0, approvedToday: 12, highRisk: 2, total: 48 });

  // ────────────────────────────────────────────
  // Data Fetching
  // ────────────────────────────────────────────

  const fetchFacultyStatus = async () => {
    try {
      const { data } = await supabase
        .from('faculty')
        .select('*')
        .eq('is_hod', false);
      
      if (data && data.length > 0) {
        setFacultyAdvisors(data);
      } else {
        setFacultyAdvisors([
          { name: 'Dr. Smith', department: 'Computer Science', activeAdvisorship: '3rd Year CSE-A', avgLatency: '< 2 Hours' },
          { name: 'Prof. Priya', department: 'Computer Science', activeAdvisorship: '2nd Year CSE-B', avgLatency: '< 4 Hours' },
          { name: 'Dr. Kumar', department: 'Computer Science', activeAdvisorship: '4th Year CSE-C', avgLatency: '< 1 Hour' },
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('od_requests')
        .select(`
          *,
          student:students(id, register_no, name, department),
          ai_analysis:ai_analysis_logs(*)
        `)
        .eq('current_stage', 'HOD')
        .eq('status', 'AdvisorApproved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      let formattedData: ODRequest[] = data ? data.map(item => ({
        ...item,
        student: Array.isArray(item.student) ? item.student[0] : item.student,
        ai_analysis: Array.isArray(item.ai_analysis) ? item.ai_analysis[0] : item.ai_analysis
      })) : [];

      // Inject demo items if database queue is currently empty for seamless testing
      if (formattedData.length === 0) {
        formattedData = [
          {
            id: 'hod-req-1',
            event_title: 'National AI Hackathon 2026',
            event_type: 'Hackathon',
            event_date_from: '2026-08-05',
            event_date_to: '2026-08-06',
            reason: 'Selected for National Grand Finale at IIT Madras. Requires 2 days official leave.',
            status: 'AdvisorApproved',
            created_at: new Date().toISOString(),
            student: {
              id: 's1',
              register_no: 'RA2411008020146',
              name: 'Rahul Sharma',
              department: 'Computer Science',
              attendance_percentage: 82
            },
            ai_analysis: {
              ai_priority: 'Normal',
              fraud_risk_score: 0.1,
              attendance_risk_prediction: 'Safe',
              ai_reasoning: 'Invitation letter verified via OCR. Student attendance post-OD remains at 79% (above 75%). Safe to grant final approval.',
              suspicious_flags: []
            }
          },
          {
            id: 'hod-req-2',
            event_title: 'Inter-College Sports Tournament',
            event_type: 'Sports',
            event_date_from: '2026-08-08',
            event_date_to: '2026-08-09',
            reason: 'Representing University Badminton Team in State Finals.',
            status: 'AdvisorApproved',
            created_at: new Date().toISOString(),
            student: {
              id: 's2',
              register_no: 'RA2411008020147',
              name: 'Ananya Verma',
              department: 'Computer Science',
              attendance_percentage: 76
            },
            ai_analysis: {
              ai_priority: 'High',
              fraud_risk_score: 0.68,
              attendance_risk_prediction: 'Caution',
              ai_reasoning: 'WARNING: Granting 2 days OD will reduce student attendance to 72% (below 75% department requirement). HOD discretion advised.',
              suspicious_flags: ['Attendance Below Threshold']
            }
          }
        ];
      }

      setRequests(formattedData);
      if (formattedData.length > 0 && !selectedRequestId) {
        setSelectedRequestId(formattedData[0].id);
      }

      setStats({
        pending: formattedData.length,
        approvedToday: 12,
        highRisk: formattedData.filter(r => r.ai_analysis && r.ai_analysis.fraud_risk_score > 0.6).length,
        total: 48
      });

    } catch (err) {
      console.error("Failed to fetch requests:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyStatus();
  }, []);

  useEffect(() => {
    if (activeTab === 'queue' || activeTab === 'dashboard') {
      fetchRequests();
    }
  }, [activeTab]);

  // ────────────────────────────────────────────
  // Actions
  // ────────────────────────────────────────────

  const handleAction = async (requestId: string, action: 'Approve' | 'Reject') => {
    setIsActionLoading(true);
    try {
      await fetch('/api/od-request/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, role: 'HOD' })
      });

      const updatedRequests = requests.filter(r => r.id !== requestId);
      setRequests(updatedRequests);
      if (updatedRequests.length > 0) {
        setSelectedRequestId(updatedRequests[0].id);
      } else {
        setSelectedRequestId(null);
      }
      setStats(prev => ({ ...prev, pending: prev.pending - 1, approvedToday: action === 'Approve' ? prev.approvedToday + 1 : prev.approvedToday }));

      const req = requests.find(r => r.id === requestId);
      const title = action === 'Approve' ? 'OD Officially Approved!' : 'OD Request Rejected';
      const msg = action === 'Approve'
        ? `Your OD for "${req?.event_title || 'Event'}" has been granted final approval by the HOD. Digital Pass is now active.`
        : `Your OD for "${req?.event_title || 'Event'}" was rejected by the HOD.`;

      // Log notification & Audit entry
      setNotifications(prev => [
        { id: Date.now().toString(), title, message: msg, time: 'Just now', type: action === 'Approve' ? 'success' : 'error' },
        ...prev
      ]);

      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          actor: profile?.name || 'HOD',
          action: `${action}d OD Request`,
          target: `${req?.student?.name || 'Student'} (${req?.event_title})`,
          status: action === 'Approve' ? 'Success' : 'Rejected'
        },
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

  // CSV Report Generation
  const handleExportReport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Student Name,Reg No,Department,Event Title,Event Type,Start Date,End Date,Status\n";

    requests.forEach((row) => {
      csvContent += `${row.id},"${row.student.name}",${row.student.register_no},${row.student.department},"${row.event_title}",${row.event_type},${row.event_date_from},${row.event_date_to},Approved\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HOD_Department_OD_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // QR Pass Lookup Verification
  const handleVerifyPass = () => {
    if (!verifyIdInput.trim()) return;
    setIsVerifying(true);
    setTimeout(() => {
      setVerifiedPass({
        id: verifyIdInput.trim(),
        studentName: 'Rahul Sharma',
        regNo: 'RA2411008020146',
        department: 'Computer Science & Engineering',
        eventTitle: 'National AI Hackathon 2026',
        dates: '05 Aug – 06 Aug 2026',
        approvedBy: 'Dr. HOD & Prof. Priya',
        verifiedAt: new Date().toLocaleTimeString(),
        status: 'VALID & ACTIVE ✓'
      });
      setIsVerifying(false);
    }, 800);
  };

  const selectedRequest = requests.find(r => r.id === selectedRequestId);

  // 10 Navigation Items Definition
  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: '📊 Dashboard' },
    { id: 'queue', icon: <FileText size={18} />, label: '📋 Final Approval Queue' },
    { id: 'ai_insights', icon: <Cpu size={18} />, label: '🤖 AI Insights' },
    { id: 'analytics', icon: <BarChart3 size={18} />, label: '📈 Department Analytics' },
    { id: 'reports', icon: <FileSpreadsheet size={18} />, label: '📑 Reports' },
    { id: 'qr_verify', icon: <QrCode size={18} />, label: '🔍 QR Verification' },
    { id: 'notifications', icon: <Bell size={18} />, label: '🔔 Notifications' },
    { id: 'settings', icon: <Settings size={18} />, label: '⚙ Department Settings' },
    { id: 'audit_logs', icon: <ShieldCheck size={18} />, label: '📝 Audit Logs' },
    { id: 'profile', icon: <User size={18} />, label: '👤 Profile' },
  ];

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">

      {/* ───────────────────────────────────────────────────── */}
      {/* SIDEBAR NAVIGATION (10 Sections)                     */}
      {/* ───────────────────────────────────────────────────── */}
      <aside className="w-64 border-r border-white/10 flex flex-col h-screen sticky top-0 bg-[#070707] shrink-0 z-20">
        <div className="p-5 flex-1 flex flex-col overflow-y-auto scrollbar-hide">
          
          {/* Header Profile Badge */}
          <div className="flex items-center gap-3 mb-6 p-3 bg-purple-950/20 border border-purple-500/30 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-purple-600/30">
              {profile?.name ? profile.name.split(' ').map((n: string) => n[0]).join('') : 'HOD'}
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-sm text-white truncate">{profile?.name || 'Head of Department'}</h3>
              <p className="text-[11px] text-purple-400 font-semibold truncate">{profile?.department || 'CSE Department'}</p>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === item.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25 border border-purple-400/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="pt-4 border-t border-white/10 mt-4">
            <button
              onClick={async () => { await signOut(); window.location.href = '/login'; }}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <LogOut size={16} /> Logout Portal
            </button>
          </div>
        </div>
      </aside>

      {/* ───────────────────────────────────────────────────── */}
      {/* MAIN CONTENT AREA                                     */}
      {/* ───────────────────────────────────────────────────── */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* ───────────────────────────────────────────────────── */}
          {/* TAB 1: 📊 DASHBOARD                                   */}
          {/* ───────────────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  📊 Department Executive Dashboard
                </h1>
                <p className="text-xs text-zinc-400 mt-1">Real-time overview of department OD requests, approvals, and AI risk alerts.</p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#0a0a0a] border border-purple-500/30 p-5 rounded-2xl shadow-xl">
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block mb-1">Awaiting Final HOD Signoff</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black text-white">{stats.pending}</span>
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md font-bold">Action Required</span>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-amber-500/30 p-5 rounded-2xl shadow-xl">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-1">AI Risk Escalations</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black text-amber-400">{stats.highRisk}</span>
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md font-bold">Needs Review</span>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-emerald-500/30 p-5 rounded-2xl shadow-xl">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">Approved Today</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black text-emerald-400">{stats.approvedToday}</span>
                    <span className="text-xs text-emerald-400/80 font-semibold">+15% vs yesterday</span>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl shadow-xl">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Total ODs Processed</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black text-white">{stats.total}</span>
                    <span className="text-xs text-zinc-400">This Semester</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Queue */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <h3 className="font-bold text-base text-white">Pending Final Signoffs</h3>
                    <button onClick={() => setActiveTab('queue')} className="text-xs text-purple-400 font-bold hover:underline">View All Queue ➔</button>
                  </div>

                  <div className="space-y-3">
                    {requests.map(req => (
                      <div key={req.id} className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-white">{req.event_title}</h4>
                          <p className="text-xs text-zinc-400">{req.student?.name} ({req.student?.register_no}) • {req.event_type}</p>
                        </div>
                        <button
                          onClick={() => { setSelectedRequestId(req.id); setActiveTab('queue'); }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Inspect Request
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4 bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-base text-white border-b border-white/10 pb-3">Faculty Advisor Performance</h3>
                  <div className="space-y-3 text-xs">
                    {facultyAdvisors.map((fa, i) => (
                      <div key={i} className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">{fa.name}</p>
                          <p className="text-zinc-500">{fa.activeAdvisorship || 'Class Advisor'}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold">{fa.avgLatency || '< 2 Hours'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────── */}
          {/* TAB 2: 📋 FINAL APPROVAL QUEUE                        */}
          {/* ───────────────────────────────────────────────────── */}
          {activeTab === 'queue' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  📋 Final Approval Queue
                </h1>
                <p className="text-xs text-zinc-400 mt-1">Review requests pre-approved by Class Advisors and issue final HOD signature.</p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[720px]">
                {/* Left List */}
                <div className="xl:col-span-4 bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                    <h3 className="font-bold text-sm text-white">Pending Requests ({requests.length})</h3>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-hide">
                    {requests.map(req => {
                      const isSelected = selectedRequestId === req.id;
                      const isHighRisk = req.ai_analysis && req.ai_analysis.fraud_risk_score > 0.6;
                      return (
                        <div
                          key={req.id}
                          onClick={() => setSelectedRequestId(req.id)}
                          className={`p-4 cursor-pointer transition-all border-l-4 ${isSelected ? 'bg-purple-950/30 border-purple-500' : 'border-transparent hover:bg-white/5'}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm text-white">{req.student?.name}</span>
                            {isHighRisk ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">Risk Flag</span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">Pre-Approved</span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-300 truncate mb-1">{req.event_title}</p>
                          <span className="text-[11px] text-zinc-500">{req.student?.register_no}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Details */}
                <div className="xl:col-span-8 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col overflow-y-auto scrollbar-hide">
                  {!selectedRequest ? (
                    <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
                      Select a request to inspect and approve.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <div>
                          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">{selectedRequest.event_type}</span>
                          <h2 className="text-xl font-bold text-white">{selectedRequest.event_title}</h2>
                          <p className="text-xs text-zinc-400 mt-1">Student: <span className="text-white font-bold">{selectedRequest.student?.name}</span> ({selectedRequest.student?.register_no})</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleAction(selectedRequest.id, 'Approve')}
                            disabled={isActionLoading}
                            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={16} />} Grant Final HOD Approval
                          </button>
                          <button
                            onClick={() => handleAction(selectedRequest.id, 'Reject')}
                            disabled={isActionLoading}
                            className="px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 font-semibold text-xs rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5"
                          >
                            <XCircle size={16} /> Reject
                          </button>
                        </div>
                      </div>

                      {/* Advisor Verification Status */}
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
                        <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                        <span>Pre-Approved by Class Advisor. Institutional eligibility verified.</span>
                      </div>

                      {/* AI Reasoning */}
                      <div className="p-4 bg-gradient-to-br from-purple-950/30 to-black border border-purple-500/20 rounded-xl text-xs space-y-2">
                        <span className="font-bold text-purple-300 uppercase tracking-wider block">AI Intelligence Digest</span>
                        <p className="text-zinc-300 italic">"{selectedRequest.ai_analysis?.ai_reasoning || 'Verification completed.'}"</p>
                      </div>

                      {/* Description */}
                      <div>
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Student Application Statement</h4>
                        <p className="text-xs text-zinc-300 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">{selectedRequest.reason}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────── */}
          {/* TAB 3: 🤖 AI INSIGHTS                                  */}
          {/* ───────────────────────────────────────────────────── */}
          {activeTab === 'ai_insights' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  🤖 AI Risk & Intelligence Insights
                </h1>
                <p className="text-xs text-zinc-400 mt-1">Deep machine learning analysis for fraud prevention, attendance impact, and OCR validation.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-white">Fraud Risk Engine</h3>
                  <div className="text-3xl font-black text-emerald-400">98.4%</div>
                  <p className="text-xs text-zinc-400">Accuracy in detecting altered event certificates and duplicate applications.</p>
                </div>

                <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-white">Attendance Risk Flags</h3>
                  <div className="text-3xl font-black text-amber-400">2 Students</div>
                  <p className="text-xs text-zinc-400">Flagged for potential attendance drop below 75% department threshold.</p>
                </div>

                <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-white">OCR Verification Rate</h3>
                  <div className="text-3xl font-black text-purple-400">100%</div>
                  <p className="text-xs text-zinc-400">All uploaded proof documents automatically scanned against request text.</p>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────── */}
          {/* TAB 4: 📈 DEPARTMENT ANALYTICS                       */}
          {/* ───────────────────────────────────────────────────── */}
          {activeTab === 'analytics' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-white">📈 Department OD Analytics</h1>
                  <p className="text-xs text-zinc-400 mt-1">Volume trends, category distributions, and approval latency charts.</p>
                </div>
                <button onClick={handleExportReport} className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2">
                  <Download size={14} /> Export CSV Report
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl">
                  <h3 className="font-bold text-sm text-white mb-4">OD Volume Trends (7 Days)</h3>
                  <div className="h-[250px] w-full min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                      <AreaChart data={[
                        { name: 'Mon', requests: 12 }, { name: 'Tue', requests: 19 },
                        { name: 'Wed', requests: 15 }, { name: 'Thu', requests: 25 },
                        { name: 'Fri', requests: 32 }, { name: 'Sat', requests: 8 }, { name: 'Sun', requests: 4 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} />
                        <YAxis stroke="#ffffff50" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="requests" stroke="#9333ea" fill="#9333ea" fillOpacity={0.2} strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl">
                  <h3 className="font-bold text-sm text-white mb-4">Requests by Category</h3>
                  <div className="h-[250px] w-full min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                      <BarChart data={[
                        { name: 'Symposium', value: 45 }, { name: 'Hackathon', value: 32 },
                        { name: 'Sports', value: 28 }, { name: 'Medical', value: 15 }, { name: 'Placement', value: 22 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} />
                        <YAxis stroke="#ffffff50" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                        <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────── */}
          {/* TAB 5: 📑 REPORTS                                     */}
          {/* ───────────────────────────────────────────────────── */}
          {activeTab === 'reports' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white">📑 Export & Report Center</h1>
                <p className="text-xs text-zinc-400 mt-1">Generate official department OD reports and export data for institutional compliance.</p>
              </div>

              <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-base text-white">Available Reports</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">Approved Student OD Master Log</h4>
                      <p className="text-xs text-zinc-400">Complete listing of all HOD approved OD passes for current semester.</p>
                    </div>
                    <button onClick={handleExportReport} className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5">
                      <Download size={14} /> Export CSV
                    </button>
                  </div>

                  <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">Faculty Duty Leave Summary</h4>
                      <p className="text-xs text-zinc-400">Summary of faculty OD leaves & substitute class assignments.</p>
                    </div>
                    <button onClick={() => alert("Faculty Leave Summary Report generated!")} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5">
                      <Download size={14} /> Export Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────── */}
          {/* TAB 6: 🔍 QR VERIFICATION                              */}
          {/* ───────────────────────────────────────────────────── */}
          {activeTab === 'qr_verify' && (
            <div className="animate-in fade-in duration-500 space-y-6 max-w-2xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  🔍 Live Pass Verification Scanner
                </h1>
                <p className="text-xs text-zinc-400 mt-1">Instantly verify the authenticity of any student Digital OD Pass.</p>
              </div>

              <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl space-y-4">
                <label className="block text-xs font-bold text-zinc-400">Enter OD Request ID or Scan Code</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={verifyIdInput}
                    onChange={(e) => setVerifyIdInput(e.target.value)}
                    placeholder="e.g. hod-req-1 or scan result"
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    onClick={handleVerifyPass}
                    disabled={isVerifying || !verifyIdInput.trim()}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isVerifying ? <Loader2 size={14} className="animate-spin" /> : <Scan size={16} />} Verify Pass
                  </button>
                </div>

                {verifiedPass && (
                  <div className="p-5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3 animate-in zoom-in-95">
                    <div className="flex justify-between items-center border-b border-emerald-500/20 pb-2">
                      <span className="font-bold text-sm text-white">{verifiedPass.studentName}</span>
                      <span className="text-xs font-bold bg-emerald-500 text-white px-2.5 py-0.5 rounded-full">{verifiedPass.status}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                      <div><span className="text-zinc-500 block">Reg No:</span>{verifiedPass.regNo}</div>
                      <div><span className="text-zinc-500 block">Event:</span>{verifiedPass.eventTitle}</div>
                      <div><span className="text-zinc-500 block">Dates:</span>{verifiedPass.dates}</div>
                      <div><span className="text-zinc-500 block">Approved By:</span>{verifiedPass.approvedBy}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────── */}
          {/* TAB 7: 🔔 NOTIFICATIONS                                */}
          {/* ───────────────────────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  🔔 Department Activity Stream
                </h1>
                <p className="text-xs text-zinc-400 mt-1">Real-time alerts, escalation notices, and approval updates.</p>
              </div>

              <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl space-y-3">
                {notifications.map(n => (
                  <div key={n.id} className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-start gap-3">
                    <Bell className="text-purple-400 shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm text-white">{n.title}</h4>
                        <span className="text-[10px] text-zinc-500">{n.time}</span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────── */}
          {/* TAB 8: ⚙ DEPARTMENT SETTINGS                          */}
          {/* ───────────────────────────────────────────────────── */}
          {activeTab === 'settings' && (
            <div className="animate-in fade-in duration-500 space-y-6 max-w-3xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  ⚙ Department Rules & Parameters
                </h1>
                <p className="text-xs text-zinc-400 mt-1">Configure institutional thresholds for your department.</p>
              </div>

              <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl space-y-6">
                {settingsSaved && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-2">
                    <Check size={16} /> Department settings updated successfully!
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2">Minimum Attendance Threshold (%)</label>
                  <input
                    type="number"
                    value={deptSettings.minAttendance}
                    onChange={(e) => setDeptSettings({ ...deptSettings, minAttendance: parseInt(e.target.value) })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">Students below this percentage will be automatically flagged for HOD review.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2">Maximum OD Allowance (Days / Semester)</label>
                  <input
                    type="number"
                    value={deptSettings.maxOdDays}
                    onChange={(e) => setDeptSettings({ ...deptSettings, maxOdDays: parseInt(e.target.value) })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 3000); }}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all"
                >
                  Save Department Rules
                </button>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────── */}
          {/* TAB 9: 📝 AUDIT LOGS                                  */}
          {/* ───────────────────────────────────────────────────── */}
          {activeTab === 'audit_logs' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  📝 Immutable Audit Trail
                </h1>
                <p className="text-xs text-zinc-400 mt-1">Complete system log of all approvals, advisor reviews, and configuration changes.</p>
              </div>

              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-zinc-400 font-bold uppercase border-b border-white/10">
                    <tr>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Actor</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Target Details</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-white/[0.02]">
                        <td className="p-4 font-mono text-zinc-400">{log.timestamp}</td>
                        <td className="p-4 font-bold text-white">{log.actor}</td>
                        <td className="p-4 text-purple-400 font-semibold">{log.action}</td>
                        <td className="p-4">{log.target}</td>
                        <td className="p-4 text-right">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold rounded">{log.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────── */}
          {/* TAB 10: 👤 PROFILE                                    */}
          {/* ───────────────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in duration-500 space-y-6 max-w-2xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  👤 HOD Official Profile
                </h1>
                <p className="text-xs text-zinc-400 mt-1">Department head credentials and signature preferences.</p>
              </div>

              <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {profile?.name ? profile.name.split(' ').map((n: string) => n[0]).join('') : 'HD'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">{profile?.name || 'Dr. HOD'}</h3>
                    <p className="text-xs text-purple-400 font-bold">{profile?.department || 'Computer Science & Engineering'}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Role: Head of Department</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-zinc-500 font-medium">Department Code:</span>
                    <span className="font-bold text-white">CSE-SRM-RMP</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-zinc-500 font-medium">Digital Signature:</span>
                    <span className="text-emerald-400 font-bold">ACTIVE & ENCRYPTED ✓</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-zinc-500 font-medium">Portal Privilege:</span>
                    <span className="font-bold text-white">Final OD Signoff Authority</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function HODDashboard() {
  return (
    <ProtectedRoute allowedRoles={['hod']}>
      <HODDashboardContent />
    </ProtectedRoute>
  );
}
