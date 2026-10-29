"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { getSupabaseForRole } from '@/lib/supabase';

const facultyClient = getSupabaseForRole('faculty');

export default function FacultyLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await facultyClient.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (authError || !data.user) {
        throw new Error("Invalid Faculty credentials.");
      }
      
      // AuthContext will automatically pick up the session via onAuthStateChange
      router.push('/faculty');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Faculty Login</h1>
          <p className="text-muted">Faculty & Class Advisors portal.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Faculty Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
            </div>
          </div>
          
          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-white/20" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEmail('demo.faculty@smartod.dev');
              setPassword('demo1234');
            }}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-emerald-400 border border-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <span>⚡ Auto-fill Demo Credentials</span>
          </button>

          <button type="submit" disabled={isLoading} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Sign In <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
