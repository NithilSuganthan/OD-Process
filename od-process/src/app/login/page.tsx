"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, BookOpen, Shield, GraduationCap, ArrowRight, Loader2, Server, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function LoginPortal() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleLogin = (role: string, path: string) => {
    setLoadingRole(role);
    setTimeout(() => {
      router.push(path);
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#050505] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl w-full relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Welcome to SmartOD
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Select your portal to securely access the AI-powered On-Duty Management System.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Student Login */}
          <div 
            className="bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:-translate-y-2 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] hover:border-blue-500/30"
            onClick={() => handleLogin('student', '/login/student')}
          >
            <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-500">
              <GraduationCap size={40} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Student Portal</h2>
            <p className="text-sm text-zinc-500 mb-8 flex-1">Apply for ODs and track approvals.</p>
            <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold flex items-center justify-center gap-2 group-hover:bg-blue-600 transition-all">
              {loadingRole === 'student' ? <Loader2 size={16} className="animate-spin" /> : <>Login <ArrowRight size={14} /></>}
            </button>
          </div>

          {/* Faculty Login */}
          <div 
            className="bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:-translate-y-2 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:border-emerald-500/30"
            onClick={() => handleLogin('faculty', '/login/faculty')}
          >
            <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-500">
              <BookOpen size={40} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Faculty Portal</h2>
            <p className="text-sm text-zinc-500 mb-8 flex-1">Review requests and track attendance.</p>
            <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold flex items-center justify-center gap-2 group-hover:bg-emerald-600 transition-all">
              {loadingRole === 'faculty' ? <Loader2 size={16} className="animate-spin" /> : <>Login <ArrowRight size={14} /></>}
            </button>
          </div>

          {/* HOD Login */}
          <div 
            className="bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:-translate-y-2 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] hover:border-purple-500/30"
            onClick={() => handleLogin('hod', '/login/hod')}
          >
            <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all duration-500">
              <Shield size={40} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">HOD Dashboard</h2>
            <p className="text-sm text-zinc-500 mb-8 flex-1">Final authorization and escalations.</p>
            <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold flex items-center justify-center gap-2 group-hover:bg-purple-600 transition-all">
              {loadingRole === 'hod' ? <Loader2 size={16} className="animate-spin" /> : <>Login <ArrowRight size={14} /></>}
            </button>
          </div>

          {/* Admin Login */}
          <div 
            className="bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:-translate-y-2 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(239,68,68,0.1)] hover:border-red-500/30"
            onClick={() => handleLogin('admin', '/login/admin')}
          >
            <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 text-red-400 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all duration-500">
              <Server size={40} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Admin Console</h2>
            <p className="text-sm text-zinc-500 mb-8 flex-1">System settings and analytics.</p>
            <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold flex items-center justify-center gap-2 group-hover:bg-red-600 transition-all">
              {loadingRole === 'admin' ? <Loader2 size={16} className="animate-spin" /> : <>Login <ArrowRight size={14} /></>}
            </button>
          </div>
        </div>

        <div className="mt-12 text-center animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500">
           <p className="text-zinc-500 mb-4">New to the system?</p>
           <Link 
            href="/signup" 
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 hover:border-blue-500/50 transition-all group"
           >
             <UserPlus size={20} className="text-blue-400 group-hover:scale-110 transition-transform" /> 
             Create Official Account
             <ArrowRight size={18} className="text-zinc-500 group-hover:translate-x-1 transition-transform" />
           </Link>
        </div>
      </div>
    </div>
  );
}
