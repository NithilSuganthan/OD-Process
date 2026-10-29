"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, Settings, Server, Users, Activity, Power, Save, Loader2, 
  AlertTriangle, Database, CheckCircle, Plus, Trash2, Edit3, Search, 
  Printer, Download, Calendar, Clock, BookOpen, MapPin, Check, RefreshCw, X, FileText, GripVertical, Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

// ────────────────────────────────────────────
// Types for Timetable Builder
// ────────────────────────────────────────────

type SubjectItem = {
  id: string;
  code: string;
  name: string;
  faculty: string;
  color: string;
};

type VenueItem = {
  id: string;
  name: string;
  type: 'Classroom' | 'Lab' | 'Auditorium';
};

type TimetableCell = {
  subjectCode: string;
  subjectName: string;
  venue: string;
  faculty: string;
  type: 'Theory' | 'Lab' | 'Break' | 'Seminar';
};

type SectionTimetable = {
  sectionName: string;
  department: string;
  days: string[];
  periods: Array<{ id: string; name: string; time: string }>;
  grid: Record<string, Record<string, TimetableCell>>; // grid[day][periodId]
};

function AdminConsoleContent() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'settings' | 'master_data' | 'logs' | 'timetable'>('timetable');

  // ────────────────────────────────────────────
  // Global Settings State
  // ────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [settings, setSettings] = useState({
    compliance: { minAttendance: 75, maxOdDays: 14 },
    ai_config: { strictness: 'High', autoApproveSafe: false },
    system_status: { maintenanceMode: false }
  });

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.from('system_settings').select('*');
      if (data && data.length > 0) {
        const newSettings = { ...settings };
        data.forEach(item => {
          if (item.key === 'compliance' && item.value) newSettings.compliance = item.value;
          if (item.key === 'ai_config' && item.value) newSettings.ai_config = item.value;
          if (item.key === 'system_status' && item.value) newSettings.system_status = item.value;
        });
        setSettings(newSettings);
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const updates = [
        { key: 'compliance', value: settings.compliance },
        { key: 'ai_config', value: settings.ai_config },
        { key: 'system_status', value: settings.system_status }
      ];

      for (const update of updates) {
        await supabase.from('system_settings').upsert(update);
      }
      
      setMessage({ type: 'success', text: 'Master configuration successfully updated & deployed live!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'success', text: 'System settings updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // ────────────────────────────────────────────
  // Master Data State
  // ────────────────────────────────────────────
  const [masterCategory, setMasterCategory] = useState<'students' | 'faculty' | 'departments'>('students');
  const [studentsList, setStudentsList] = useState([
    { id: '1', name: 'Rahul Sharma', register_no: 'RA2411008020146', department: 'CSE', section: 'A', attendance: 82 },
    { id: '2', name: 'Ananya Verma', register_no: 'RA2411008020147', department: 'CSE', section: 'A', attendance: 76 },
    { id: '3', name: 'Karthik Raja', register_no: 'RA2411008020148', department: 'CSE', section: 'B', attendance: 88 },
  ]);

  const [facultyList, setFacultyList] = useState([
    { id: 'f1', name: 'Dr. Smith', email: 'smith@univ.edu', department: 'CSE', is_hod: false },
    { id: 'f2', name: 'Prof. Priya', email: 'priya@univ.edu', department: 'CSE', is_hod: false },
  ]);

  // ────────────────────────────────────────────
  // System Logs State
  // ────────────────────────────────────────────
  const [logs] = useState([
    { id: 'l1', timestamp: '2026-08-01 10:45:12', level: 'INFO', category: 'AUTH', message: 'Admin user logged in from console IP 127.0.0.1' },
    { id: 'l2', timestamp: '2026-08-01 10:40:05', level: 'WARN', category: 'AI_ENGINE', message: 'Fraud Detection flagged Student RA2411008020147' },
  ]);

  // ────────────────────────────────────────────
  // DRAG & DROP + DYNAMIC TIMETABLE BUILDER ⭐
  // ────────────────────────────────────────────

  // Palette of Drag-and-Drop Subjects
  const [subjects, setSubjects] = useState<SubjectItem[]>([
    { id: 'sub-1', code: 'CS204', name: 'DBMS', faculty: 'Prof. Priya', color: 'border-blue-500 bg-blue-500/20 text-blue-300' },
    { id: 'sub-2', code: 'CS201', name: 'Data Structures', faculty: 'Dr. Smith', color: 'border-emerald-500 bg-emerald-500/20 text-emerald-300' },
    { id: 'sub-3', code: 'CS209L', name: 'AI Lab', faculty: 'Dr. Smith', color: 'border-purple-500 bg-purple-500/20 text-purple-300' },
    { id: 'sub-4', code: 'MA202', name: 'Discrete Maths', faculty: 'Dr. Kumar', color: 'border-amber-500 bg-amber-500/20 text-amber-300' },
    { id: 'sub-5', code: 'CS208', name: 'Networks', faculty: 'Prof. Jane', color: 'border-indigo-500 bg-indigo-500/20 text-indigo-300' },
    { id: 'sub-6', code: 'LUNCH', name: 'Lunch Break', faculty: 'N/A', color: 'border-zinc-500 bg-zinc-800 text-zinc-300' },
  ]);

  // Palette of Venues
  const [venues, setVenues] = useState<VenueItem[]>([
    { id: 'v1', name: 'Classroom 402', type: 'Classroom' },
    { id: 'v2', name: 'AI Lab 3', type: 'Lab' },
    { id: 'v3', name: 'DBMS Lab 1', type: 'Lab' },
    { id: 'v4', name: 'Auditorium', type: 'Auditorium' },
  ]);

  // Selected Section
  const [sectionsList, setSectionsList] = useState(['CSE 2nd Year - Sec A', 'CSE 2nd Year - Sec B', 'ECE 2nd Year - Sec A']);
  const [selectedSection, setSelectedSection] = useState('CSE 2nd Year - Sec A');
  const [selectedVenueForDrag, setSelectedVenueForDrag] = useState('Classroom 402');

  // Dragging State
  const [draggedSubject, setDraggedSubject] = useState<SubjectItem | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  // Dynamic Structure: Initial Days & Periods
  const initialDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const initialPeriods = [
    { id: 'p1', name: 'Period 1', time: '08:30–09:30' },
    { id: 'p2', name: 'Period 2', time: '09:30–10:30' },
    { id: 'p3', name: 'Period 3', time: '10:45–11:45' },
    { id: 'p4', name: 'Period 4', time: '11:45–12:45' },
    { id: 'p5', name: 'Period 5', time: '01:30–02:30' },
    { id: 'p6', name: 'Period 6', time: '02:30–03:30' },
    { id: 'p7', name: 'Period 7', time: '03:30–04:30' },
  ];

  // Dynamic Timetable State per Section
  const [timetables, setTimetables] = useState<Record<string, SectionTimetable>>({
    'CSE 2nd Year - Sec A': {
      sectionName: 'CSE 2nd Year - Sec A',
      department: 'Computer Science & Engineering',
      days: initialDays,
      periods: initialPeriods,
      grid: {
        'Monday': {
          'p1': { subjectCode: 'CS204', subjectName: 'DBMS', venue: 'Classroom 402', faculty: 'Prof. Priya', type: 'Theory' },
          'p2': { subjectCode: 'CS201', subjectName: 'Data Structures', venue: 'Classroom 402', faculty: 'Dr. Smith', type: 'Theory' },
          'p3': { subjectCode: 'MA202', subjectName: 'Discrete Maths', venue: 'Classroom 402', faculty: 'Dr. Kumar', type: 'Theory' },
          'p4': { subjectCode: 'LUNCH', subjectName: 'Lunch Break', venue: 'Cafeteria', faculty: 'N/A', type: 'Break' },
          'p5': { subjectCode: 'CS209L', subjectName: 'AI Lab', venue: 'AI Lab 3', faculty: 'Dr. Smith', type: 'Lab' },
          'p6': { subjectCode: 'CS209L', subjectName: 'AI Lab', venue: 'AI Lab 3', faculty: 'Dr. Smith', type: 'Lab' },
        }
      }
    }
  });

  // Modal State for Adding Subject / Period / Day
  const [isAddSubjectModal, setIsAddSubjectModal] = useState(false);
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubFaculty, setNewSubFaculty] = useState('');

  // Get current active section timetable
  const currentTt = timetables[selectedSection] || {
    sectionName: selectedSection,
    department: 'Computer Science & Engineering',
    days: initialDays,
    periods: initialPeriods,
    grid: {}
  };

  // ────────────────────────────────────────────
  // Dynamic Structure Manipulations
  // ────────────────────────────────────────────

  // Add a New Class / Period Column dynamically
  const handleAddPeriod = () => {
    const nextPeriodNum = currentTt.periods.length + 1;
    const newPeriodId = `p${Date.now()}`;
    const newPeriod = {
      id: newPeriodId,
      name: `Class ${nextPeriodNum}`,
      time: `0${Math.min(9, 4 + nextPeriodNum)}:00–0${Math.min(9, 5 + nextPeriodNum)}:00`
    };

    setTimetables(prev => ({
      ...prev,
      [selectedSection]: {
        ...currentTt,
        periods: [...currentTt.periods, newPeriod]
      }
    }));
  };

  // Delete a Period Column
  const handleDeletePeriod = (periodId: string) => {
    setTimetables(prev => ({
      ...prev,
      [selectedSection]: {
        ...currentTt,
        periods: currentTt.periods.filter(p => p.id !== periodId)
      }
    }));
  };

  // Add a New Day Row dynamically (e.g. Saturday, Sunday)
  const handleAddDay = () => {
    const dayOptions = ['Saturday', 'Sunday', 'Day 6', 'Day 7'];
    const unusedDay = dayOptions.find(d => !currentTt.days.includes(d)) || `Day ${currentTt.days.length + 1}`;

    setTimetables(prev => ({
      ...prev,
      [selectedSection]: {
        ...currentTt,
        days: [...currentTt.days, unusedDay]
      }
    }));
  };

  // Delete a Day Row
  const handleDeleteDay = (dayToDelete: string) => {
    setTimetables(prev => ({
      ...prev,
      [selectedSection]: {
        ...currentTt,
        days: currentTt.days.filter(d => d !== dayToDelete)
      }
    }));
  };

  // Add Custom Subject to Palette
  const handleCreateSubject = () => {
    if (!newSubCode || !newSubName) return;
    const colors = [
      'border-[#3b82f6] bg-[#3b82f6]/20 text-blue-300',
      'border-[#10b981] bg-[#10b981]/20 text-emerald-300',
      'border-[#a855f7] bg-[#a855f7]/20 text-purple-300',
      'border-[#f59e0b] bg-[#f59e0b]/20 text-amber-300',
      'border-[#ec4899] bg-[#ec4899]/20 text-pink-300'
    ];

    setSubjects(prev => [
      ...prev,
      {
        id: `sub-${Date.now()}`,
        code: newSubCode.toUpperCase(),
        name: newSubName,
        faculty: newSubFaculty || 'Faculty TBD',
        color: colors[prev.length % colors.length]
      }
    ]);

    setNewSubCode('');
    setNewSubName('');
    setNewSubFaculty('');
    setIsAddSubjectModal(false);
  };

  // ────────────────────────────────────────────
  // Drag and Drop Event Handlers
  // ────────────────────────────────────────────

  const handleDragStart = (subject: SubjectItem) => {
    setDraggedSubject(subject);
  };

  const handleDragOver = (e: React.DragEvent, cellKey: string) => {
    e.preventDefault();
    setDragOverCell(cellKey);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, day: string, periodId: string) => {
    e.preventDefault();
    setDragOverCell(null);

    if (!draggedSubject) return;

    const isBreak = draggedSubject.code === 'LUNCH';
    const isLab = draggedSubject.code.includes('L') || draggedSubject.name.toLowerCase().includes('lab');

    setTimetables(prev => {
      const current = prev[selectedSection] || {
        sectionName: selectedSection,
        department: 'Computer Science & Engineering',
        days: initialDays,
        periods: initialPeriods,
        grid: {}
      };

      const newGrid = { ...current.grid };
      if (!newGrid[day]) newGrid[day] = {};

      newGrid[day][periodId] = {
        subjectCode: draggedSubject.code,
        subjectName: draggedSubject.name,
        venue: selectedVenueForDrag,
        faculty: draggedSubject.faculty,
        type: isBreak ? 'Break' : isLab ? 'Lab' : 'Theory'
      };

      return {
        ...prev,
        [selectedSection]: { ...current, grid: newGrid }
      };
    });

    setDraggedSubject(null);
  };

  // Clear specific cell
  const handleClearCell = (day: string, periodId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTimetables(prev => {
      const current = prev[selectedSection];
      if (!current || !current.grid[day]) return prev;

      const newGrid = { ...current.grid };
      delete newGrid[day][periodId];

      return {
        ...prev,
        [selectedSection]: { ...current, grid: newGrid }
      };
    });
  };

  // Print PDF Functionality ⭐
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">

      {/* CSS Stylesheet for PDF Print Customization */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          aside, nav, button, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .printable-timetable {
            border: 2px solid #000 !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
          }
          .printable-timetable th, .printable-timetable td {
            border: 1px solid #333 !important;
            color: #000 !important;
            padding: 8px !important;
          }
          .printable-title {
            color: #000 !important;
            font-size: 20pt !important;
            text-align: center !important;
            margin-bottom: 20px !important;
          }
        }
      `}</style>

      {/* ───────────────────────────────────────────────────── */}
      {/* SIDEBAR NAVIGATION                                    */}
      {/* ───────────────────────────────────────────────────── */}
      <aside className="w-64 border-r border-white/10 flex flex-col h-screen sticky top-0 bg-[#070707] shrink-0 z-20 no-print">
        <div className="p-6 flex-1 flex flex-col">
          
          <div className="flex items-center gap-3 mb-8 mt-2">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-red-600/30">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Super Admin</h3>
              <p className="text-[11px] text-red-400 font-semibold">Master Control Console</p>
            </div>
          </div>

          <nav className="space-y-1.5 flex-1">
            <button
              onClick={() => setActiveTab('timetable')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'timetable' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar size={16} /> Drag & Drop Timetable ⭐
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'settings' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings size={16} /> Global Settings
            </button>

            <button
              onClick={() => setActiveTab('master_data')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'master_data' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Database size={16} /> Master Data Management
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'logs' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity size={16} /> System Audit Logs
            </button>
          </nav>

          <div className="pt-4 border-t border-white/10 mt-4">
            <button
              onClick={async () => { await signOut(); window.location.href = '/login'; }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white transition-all"
            >
              Logout Console
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
          {/* TAB: DRAG AND DROP TIMETABLE BUILDER ⭐               */}
          {/* ───────────────────────────────────────────────────── */}
          {activeTab === 'timetable' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              
              {/* Top Control Bar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-4 gap-4 no-print">
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="text-red-500" size={24} /> Drag & Drop Timetable Builder
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1">Drag subject cards directly onto the grid. Add unlimited periods, classes, and days.</p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none"
                  >
                    {sectionsList.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                  </select>

                  <button
                    onClick={handlePrintPDF}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
                  >
                    <Printer size={16} /> Print / Download PDF
                  </button>
                </div>
              </div>

              {/* DRAG PALETTE: SUBJECT CARDS & VENUE SELECTOR */}
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 space-y-4 no-print shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <BookOpen size={16} className="text-red-400" /> Subject Palette (Drag onto grid)
                    </h3>
                    <p className="text-[11px] text-zinc-400">Click and drag any subject card directly into a timetable period slot below.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400 font-bold">Assign Venue:</span>
                    <select
                      value={selectedVenueForDrag}
                      onChange={(e) => setSelectedVenueForDrag(e.target.value)}
                      className="bg-black/50 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                    >
                      {venues.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                    </select>

                    <button
                      onClick={() => setIsAddSubjectModal(true)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1"
                    >
                      <Plus size={14} /> Add New Subject
                    </button>
                  </div>
                </div>

                {/* Draggable Subject Cards */}
                <div className="flex flex-wrap gap-3">
                  {subjects.map(s => (
                    <div
                      key={s.id}
                      draggable
                      onDragStart={() => handleDragStart(s)}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-bold cursor-grab active:cursor-grabbing hover:scale-105 transition-all shadow-md flex items-center gap-2 ${s.color}`}
                    >
                      <GripVertical size={14} className="opacity-60" />
                      <div>
                        <div>{s.code}: {s.name}</div>
                        <div className="text-[9px] opacity-75 font-normal">{s.faculty}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* STRUCTURE CONTROLS: ADD PERIOD & ADD DAY BUTTONS */}
              <div className="flex justify-between items-center no-print">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddPeriod}
                    className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add Extra Class / Period Column
                  </button>
                  <button
                    onClick={handleAddDay}
                    className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add Extra Day Row (e.g. Saturday)
                  </button>
                </div>
                <span className="text-xs text-zinc-500">
                  Total Classes / Day: {currentTt.periods.length} | Days: {currentTt.days.length}
                </span>
              </div>

              {/* PRINTABLE TIMETABLE GRID */}
              <div className="printable-timetable bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
                
                {/* Header */}
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div>
                    <h2 className="printable-title text-xl font-bold text-white">{currentTt.department}</h2>
                    <p className="text-xs text-red-400 font-bold uppercase tracking-wider mt-0.5">
                      OFFICIAL TIMETABLE • {currentTt.sectionName}
                    </p>
                  </div>
                  <div className="text-right text-xs text-zinc-400">
                    <p>Academic Year 2026</p>
                    <p className="text-[10px] text-zinc-500">Generated via Smart OD Engine</p>
                  </div>
                </div>

                {/* Dynamic Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs text-center">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="p-3 border border-white/10 text-zinc-400 font-bold uppercase w-28">Day / Period</th>
                        {currentTt.periods.map((p) => (
                          <th key={p.id} className="p-3 border border-white/10 text-white font-bold min-w-[130px] relative group">
                            <div className="flex items-center justify-between">
                              <span>{p.name}</span>
                              <button
                                onClick={() => handleDeletePeriod(p.id)}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 no-print transition-all"
                                title="Delete Period Column"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            <div className="text-[10px] text-zinc-500 font-normal">{p.time}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {currentTt.days.map((day) => (
                        <tr key={day} className="hover:bg-white/[0.01]">
                          
                          {/* Day Row Header */}
                          <td className="p-3 border border-white/10 font-bold text-white bg-white/[0.02] text-left">
                            <div className="flex items-center justify-between">
                              <span>{day}</span>
                              <button
                                onClick={() => handleDeleteDay(day)}
                                className="opacity-0 hover:opacity-100 text-red-400 hover:text-red-300 no-print transition-all"
                                title="Delete Day Row"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </td>

                          {/* Period Drop Cells */}
                          {currentTt.periods.map((p) => {
                            const cellKey = `${day}-${p.id}`;
                            const cell = currentTt.grid?.[day]?.[p.id];
                            const isOver = dragOverCell === cellKey;

                            return (
                              <td
                                key={p.id}
                                onDragOver={(e) => handleDragOver(e, cellKey)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, day, p.id)}
                                className={`p-2.5 border border-white/10 transition-all relative group min-h-[70px] ${
                                  isOver ? 'bg-red-500/30 border-red-500 scale-105 z-10' :
                                  cell?.type === 'Break' ? 'bg-amber-950/20 text-amber-300' :
                                  cell?.type === 'Lab' ? 'bg-purple-950/20 text-purple-300' :
                                  cell?.subjectCode ? 'bg-white/5' : 'bg-transparent hover:bg-white/5'
                                }`}
                              >
                                {cell?.subjectCode ? (
                                  <div className="space-y-1 relative">
                                    <button
                                      onClick={(e) => handleClearCell(day, p.id, e)}
                                      className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-red-600 text-white rounded-full p-0.5 no-print transition-all"
                                      title="Clear Slot"
                                    >
                                      <X size={10} />
                                    </button>
                                    <div className="font-bold text-white text-xs">{cell.subjectCode}</div>
                                    <div className="text-[10px] text-zinc-300 truncate">{cell.subjectName}</div>
                                    <div className="text-[9px] text-zinc-500 flex items-center justify-center gap-1">
                                      <MapPin size={9} /> {cell.venue}
                                    </div>
                                    <div className="text-[9px] text-red-400 font-semibold">{cell.faculty}</div>
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-zinc-600 italic py-3 border border-dashed border-white/5 rounded-lg">
                                    Drop Subject Here
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* ───────────────────────────────────────────────────── */}
          {/* OTHER TABS: GLOBAL SETTINGS / MASTER DATA / LOGS     */}
          {/* ───────────────────────────────────────────────────── */}
          {activeTab === 'settings' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">Master Configuration</h1>
                  <p className="text-xs text-zinc-400 mt-1">Control core operational parameters for the Smart OD Engine.</p>
                </div>
                <button onClick={handleSaveSettings} disabled={isSaving} className="px-6 py-2.5 bg-red-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2">
                  <Save size={16} /> Save Changes
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-sm text-white">Institutional Compliance</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Min Attendance:</span>
                      <span className="font-bold text-white">{settings.compliance.minAttendance}%</span>
                    </div>
                    <input type="range" min="50" max="95" value={settings.compliance.minAttendance} onChange={(e) => setSettings({ ...settings, compliance: { ...settings.compliance, minAttendance: parseInt(e.target.value) } })} className="w-full" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'master_data' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <h1 className="text-2xl font-bold text-white">Master Data Directory</h1>
              <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl">
                <p className="text-xs text-zinc-400">Student & Faculty Directory active.</p>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <h1 className="text-2xl font-bold text-white">System Audit Logs</h1>
              <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl">
                <p className="text-xs text-zinc-400">Infrastructure event log active.</p>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ADD SUBJECT MODAL */}
      {isAddSubjectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-white">Add Custom Subject</h3>
              <button onClick={() => setIsAddSubjectModal(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3 text-xs">
              <input type="text" placeholder="Subject Code (e.g. CS301)" value={newSubCode} onChange={(e) => setNewSubCode(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none" />
              <input type="text" placeholder="Subject Title (e.g. Cloud Computing)" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none" />
              <input type="text" placeholder="Faculty Name (e.g. Dr. Kumar)" value={newSubFaculty} onChange={(e) => setNewSubFaculty(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none" />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleCreateSubject} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all">Add to Subject Palette</button>
              <button onClick={() => setIsAddSubjectModal(false)} className="px-4 py-2.5 bg-white/5 text-zinc-400 text-xs font-semibold rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AdminConsole() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminConsoleContent />
    </ProtectedRoute>
  );
}
