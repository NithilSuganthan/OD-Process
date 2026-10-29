"use client";

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, FileText, Send, CheckCircle, Clock, AlertCircle, Loader2, QrCode, Upload, User, LayoutDashboard, Inbox, Image as ImageIcon, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentProfile, useRequests, useNotifications } from '@/hooks/useData';

// Define types
type ODRequest = {
  id: string;
  event_title: string;
  event_type: string;
  event_date_from: string;
  event_date_to: string;
  reason: string;
  status: string;
  current_stage: string;
  created_at: string;
};

function StudentPortalContent() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'apply' | 'status' | 'timetable' | 'inbox'>('dashboard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Custom hooks for data fetching
  const { studentInfo, refetch: refetchProfile } = useStudentProfile(profile?.id);
  const { requests, isLoading: isLoadingRequests, refetch: refetchRequests } = useRequests({
    studentId: studentInfo?.id,
    autoFetch: !!studentInfo?.id,
  });
  const { notifications, unreadCount, refetch: refetchNotifications } = useNotifications(studentInfo?.id);
  
  // Timetable state
  const [timetable, setTimetable] = useState<any[]>([
    { day: 'Monday', periods: ['', '', '', '', '', ''] },
    { day: 'Tuesday', periods: ['', '', '', '', '', ''] },
    { day: 'Wednesday', periods: ['', '', '', '', '', ''] },
    { day: 'Thursday', periods: ['', '', '', '', '', ''] },
    { day: 'Friday', periods: ['', '', '', '', '', ''] },
  ]);

  // Form State
  const [formData, setFormData] = useState({
    eventTitle: '',
    eventType: 'Symposium',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Sync timetable from fetched profile
  useEffect(() => {
    if (studentInfo?.timetable) setTimetable(studentInfo.timetable);
  }, [studentInfo, activeTab]);

  const handleTimetableChange = (dayIndex: number, periodIndex: number, value: string) => {
    const newTimetable = [...timetable];
    newTimetable[dayIndex].periods[periodIndex] = value;
    setTimetable(newTimetable);
  };

  const saveTimetable = async () => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ timetable })
        .eq('id', studentInfo.id);
      if (error) throw error;
      alert("Timetable updated successfully!");
    } catch (err) {
      alert("Failed to save timetable.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEnhance = async () => {
    if (!formData.reason || !studentInfo) {
      alert("Please write a short reason first to let the AI know what to expand!");
      return;
    }
    
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/ai-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: studentInfo.name,
          regNo: studentInfo.register_no,
          eventTitle: formData.eventTitle,
          eventType: formData.eventType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          shortReason: formData.reason
        })
      });
      
      const result = await res.json();
      if (res.ok && result.success) {
        setFormData(prev => ({ ...prev, reason: result.formalLetter }));
      } else {
        alert("Failed to enhance text: " + result.error);
      }
    } catch (err: any) {
      alert("Something went wrong with AI: " + err.message);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!studentInfo) {
        alert("Student profile not loaded. Please try again.");
        return;
      }
      let attachmentUrl = '';
      
      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${studentInfo.register_no}_${Date.now()}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage
          .from('od-attachments')
          .upload(fileName, uploadedFile);
        
        if (uploadError) throw uploadError;
        attachmentUrl = fileName;
      }
      
      const res = await fetch('/api/od-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          studentId: studentInfo.id,
          attachmentUrl
        })
      });
      
      const result = await res.json();
      if (res.ok && result.success) {
        alert("OD Request submitted successfully!");
        setFormData({ eventTitle: '', eventType: 'Symposium', startDate: '', endDate: '', reason: '' });
        setUploadedFile(null);
        setActiveTab('status'); 
      } else {
        alert("Failed to submit: " + result.error);
      }
    } catch (err: any) {
      alert("Something went wrong: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sidebar nav items
  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { id: 'apply', icon: <FileText size={18} />, label: 'Apply OD' },
    { id: 'status', icon: <Clock size={18} />, label: 'My Requests' },
    { id: 'timetable', icon: <CalendarIcon size={18} />, label: 'Timetable' },
    { id: 'inbox', icon: <Inbox size={18} />, label: `Inbox (${unreadCount})` },
  ];

  return (
    <div className="flex min-h-screen bg-[#050505]">
      <Sidebar
        navItems={navItems}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as any)}
        accent="indigo"
        displayName={studentInfo?.name}
        subtitle={studentInfo ? `${studentInfo.register_no} • ${studentInfo.department}` : '---'}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto mt-8">
        {activeTab === 'dashboard' && (
           <div className="animate-in fade-in duration-500 bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 shadow-2xl">
             <h2 className="text-xl font-bold text-white mb-8">Student Profile</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
               <div className="bg-black/40 p-5 rounded-xl border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.03)]">
                 <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-2">Faculty Advisor</p>
                 <p className="text-[15px] font-bold text-white">{studentInfo?.advisor?.name || '---'}</p>
               </div>
               <div className="bg-black/40 p-5 rounded-xl border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.03)]">
                 <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-2">Head of Department</p>
                 <p className="text-[15px] font-bold text-white">{studentInfo?.hod?.name || '---'}</p>
               </div>
               <div className="bg-black/40 p-5 rounded-xl border border-white/5">
                 <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-2">Current Attendance</p>
                 <div className="flex items-baseline gap-2">
                   <p className={`text-3xl font-bold ${studentInfo?.attendance_percentage >= 75 ? 'text-[#00e676]' : 'text-red-500'}`}>
                     {studentInfo?.attendance_percentage || 0}%
                   </p>
                   <p className={`text-sm font-medium ${studentInfo?.attendance_percentage >= 75 ? 'text-[#00e676]' : 'text-red-500'}`}>
                     {studentInfo?.attendance_percentage >= 75 ? 'Safe' : 'Critical'}
                   </p>
                 </div>
               </div>
               <div className="bg-black/40 p-5 rounded-xl border border-white/5">
                 <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-2">Year & Section</p>
                 <p className="text-3xl font-bold text-[#29b6f6]">{studentInfo?.year_of_study || '-'} <span className="text-sm text-zinc-400 font-medium">Year, Section {studentInfo?.section || '-'}</span></p>
               </div>
             </div>
           </div>
        )}

        {activeTab === 'timetable' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Academic Timetable</h2>
                <button onClick={saveTimetable} className="btn btn-primary text-sm">Save Changes</button>
             </div>
             <div className="bg-black/30 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-white/5">
                     <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5">Day</th>
                     {[1, 2, 3, 4, 5, 6].map(p => (
                       <th key={p} className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5 text-center">Period {p}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {timetable.map((row, dIdx) => (
                     <tr key={row.day} className="hover:bg-white/[0.02] transition-colors">
                       <td className="p-4 text-sm font-bold text-indigo-400 border-r border-white/5">{row.day}</td>
                       {row.periods.map((p: string, pIdx: number) => (
                         <td key={pIdx} className="p-2 border-r border-white/5 last:border-r-0">
                           <input 
                              type="text" 
                              value={p} 
                              onChange={(e) => handleTimetableChange(dIdx, pIdx, e.target.value)}
                              placeholder="---"
                              className="w-full bg-transparent border-none text-white text-xs text-center focus:ring-1 focus:ring-indigo-500/50 rounded p-1 placeholder:text-zinc-700"
                           />
                         </td>
                       ))}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {activeTab === 'inbox' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h2 className="text-2xl font-bold text-white mb-6">Notifications Inbox</h2>
             <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-20 text-muted bg-white/5 rounded-xl border border-dashed border-white/10">
                    <Inbox className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No new notifications.</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-4 rounded-xl border flex gap-4 transition-all ${n.is_read ? 'bg-white/5 border-white/10 opacity-70' : 'bg-indigo-500/5 border-indigo-500/20'}`}>
                       <div className="mt-1">
                          {n.type === 'approval' ? <CheckCircle className="text-emerald-400 w-5 h-5" /> : <Clock className="text-blue-400 w-5 h-5" />}
                       </div>
                       <div>
                         <h4 className={`font-bold ${n.type === 'approval' ? 'text-emerald-400' : 'text-white'}`}>{n.title}</h4>
                         <p className="text-sm text-white/70 mt-1">{n.message}</p>
                         <p className="text-xs text-muted mt-2">{new Date(n.created_at).toLocaleString()}</p>
                       </div>
                    </div>
                  ))
                )}
             </div>
           </div>
        )}

        {activeTab === 'apply' && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="text-accent-primary" /> New OD Request
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Event Title</label>
                <input type="text" name="eventTitle" value={formData.eventTitle} onChange={handleInputChange} required placeholder="e.g. National Level Hackathon at MIT" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Event Type</label>
                  <select name="eventType" value={formData.eventType} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary transition-all appearance-none">
                    <option value="Symposium">Symposium</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Internship">Internship</option>
                    <option value="Placement">Placement</option>
                    <option value="Sports">Sports</option>
                    <option value="Medical">Medical</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Proof Document (PDF/Image)</label>
                  <label className="flex items-center justify-center w-full bg-black/50 border border-dashed border-white/20 hover:border-accent-primary rounded-xl px-4 py-2.5 cursor-pointer transition-all">
                     <span className="flex items-center gap-2 text-sm text-muted">
                        <ImageIcon size={16} /> {uploadedFile ? uploadedFile.name : 'Upload File'}
                     </span>
                     <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Start Date</label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary transition-all [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">End Date</label>
                  <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary transition-all [color-scheme:dark]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-white/80">Detailed Reason / Formal Letter</label>
                  <button 
                    type="button" 
                    onClick={handleEnhance}
                    disabled={isEnhancing || !formData.reason}
                    className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all disabled:opacity-50"
                  >
                    {isEnhancing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} 
                    {isEnhancing ? 'Writing...' : 'AI Enhance Letter'}
                  </button>
                </div>
                <textarea name="reason" value={formData.reason} onChange={handleInputChange} required rows={6} placeholder="Type a short reason here (e.g. going to a hackathon in Bangalore) and click 'AI Enhance' to generate a formal letter." className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-accent-primary transition-all resize-none" />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button type="submit" disabled={isSubmitting} className="btn btn-primary flex items-center gap-2 !px-8 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} Submit Request
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <CalendarIcon className="text-accent-secondary" /> Request History
            </h2>
            
            {isLoadingRequests ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted">
                 <Loader2 className="w-8 h-8 animate-spin mb-4 text-accent-primary" />
                 <p>Loading your requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted border border-dashed border-white/10 rounded-2xl">
                 <FileText className="w-12 h-12 text-white/20 mb-4" />
                 <p>You haven't submitted any OD requests yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => {
                  const isApproved = req.status === 'HODApproved';
                  const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
                  const createdDate = new Date(req.created_at).toLocaleDateString(undefined, dateOptions);
                  
                  return (
                    <div key={req.id} className="bg-black/40 border border-white/10 rounded-xl p-5 hover:bg-black/60 transition-all hover:border-white/20">
                      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4">
                         <div>
                            <h3 className="text-lg font-bold text-white mb-1">{req.event_title}</h3>
                            <p className="text-sm text-muted">{req.event_type} • {req.event_date_from} to {req.event_date_to}</p>
                         </div>
                         <div className="flex flex-col items-end gap-2">
                           <StatusBadge status={req.status} />
                         </div>
                      </div>
                      
                      {isApproved && (
                        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col md:flex-row items-center gap-6">
                           <div className="flex-1 text-center md:text-left">
                             <h4 className="font-bold text-white mb-1 flex items-center justify-center md:justify-start gap-2">
                               <QrCode size={18} className="text-emerald-400" /> Digital OD Pass Ready
                             </h4>
                             <p className="text-sm text-muted mb-3">Scan this code to verify your OD permission.</p>
                             <button onClick={() => window.open(`/verify/${req.id}`, '_blank')} className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-md hover:bg-emerald-500/30 transition-colors">View Proof Page</button>
                           </div>
                           <div className="bg-white p-2 rounded-lg shrink-0">
                             <QRCodeDisplay requestId={req.id} />
                           </div>
                        </div>
                      )}
                      
                      {/* Progress Stepper */}
                      <div className="mt-4 pt-4 border-t border-white/5 relative">
                         <div className="flex justify-between mb-2">
                            <span className="text-[10px] text-muted uppercase tracking-wider">Submitted</span>
                            <span className="text-[10px] text-muted uppercase tracking-wider">Advisor</span>
                            <span className="text-[10px] text-muted uppercase tracking-wider">HOD</span>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${
                              req.status === 'Rejected' ? 'bg-red-500 w-full' :
                              req.status === 'HODApproved' ? 'bg-emerald-500 w-full' :
                              req.status === 'AdvisorApproved' ? 'bg-blue-500 w-[66%]' :
                              'bg-amber-500 w-[33%]'
                            }`}></div>
                         </div>
                         <p className="text-xs text-muted mt-3">Applied on: {createdDate}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

// Wrap with ProtectedRoute for access control
export default function StudentPortal() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <StudentPortalContent />
    </ProtectedRoute>
  );
}
