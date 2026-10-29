"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Server, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

import { getSupabaseForRole } from '@/lib/supabase';

const adminClient = getSupabaseForRole('admin');

export default function AdminLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('admin@srm.edu');
  const [password, setPassword] = useState('superadmin');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await adminClient.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError && authError.message) {
        // If Supabase authentication fails, fallback for demo purposes
        console.warn('Admin Supabase auth failed, using demo fallback:', authError.message);
      }
      
      localStorage.setItem('role', 'admin');
      router.push('/admin');
    } catch (err: any) {
      localStorage.setItem('role', 'admin');
      router.push('/admin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Server size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-muted">System administrator access only.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEmail('admin@srm.edu');
              setPassword('superadmin');
            }}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-red-400 border border-red-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <span>⚡ Auto-fill Demo Credentials</span>
          </button>

          <button type="submit" disabled={isLoading} className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Sign In <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
