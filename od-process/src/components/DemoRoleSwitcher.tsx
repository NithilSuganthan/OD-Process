"use client";

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Sparkles, GraduationCap, BookOpen, Shield, Server, Loader2, ChevronUp } from 'lucide-react';

const demoCredentials: Record<UserRole, { email: string; pass: string; path: string; label: string; icon: any; color: string }> = {
  student: {
    email: 'demo.student@smartod.dev',
    pass: 'demo1234',
    path: '/student',
    label: 'Student Portal',
    icon: GraduationCap,
    color: 'from-blue-500 to-indigo-500',
  },
  faculty: {
    email: 'demo.faculty@smartod.dev',
    pass: 'demo1234',
    path: '/faculty',
    label: 'Faculty Advisor',
    icon: BookOpen,
    color: 'from-emerald-500 to-teal-500',
  },
  hod: {
    email: 'demo.hod@smartod.dev',
    pass: 'demo1234',
    path: '/hod',
    label: 'Head of Dept (HOD)',
    icon: Shield,
    color: 'from-purple-500 to-pink-500',
  },
  admin: {
    email: 'admin@srm.edu',
    pass: 'superadmin',
    path: '/admin',
    label: 'System Admin',
    icon: Server,
    color: 'from-red-500 to-orange-500',
  },
};

export default function DemoRoleSwitcher() {
  const { role, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);

  // Hide on public landing or login pages if needed, or keep accessible everywhere for quick testing
  const handleSwitch = async (targetRole: UserRole) => {
    const creds = demoCredentials[targetRole];
    setSwitchingRole(targetRole);
    try {
      await supabase.auth.signOut();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.pass,
      });

      if (error && targetRole === 'admin') {
        localStorage.setItem('role', 'admin');
      }

      setIsOpen(false);
      router.push(creds.path);
    } catch (err) {
      console.error('Role switch failed:', err);
    } finally {
      setSwitchingRole(null);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isOpen && (
        <div className="mb-3 w-64 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl space-y-1.5 animate-in zoom-in-95 duration-200">
          <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-400" /> Switch Demo Role
            </span>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-zinc-400 capitalize">
              Active: {role || 'Guest'}
            </span>
          </div>

          {(Object.keys(demoCredentials) as UserRole[]).map((r) => {
            const item = demoCredentials[r];
            const Icon = item.icon;
            const isActive = role === r;
            const isSwitching = switchingRole === r;

            return (
              <button
                key={r}
                onClick={() => handleSwitch(r)}
                disabled={Boolean(switchingRole)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-lg bg-gradient-to-r ${item.color} flex items-center justify-center text-white shrink-0`}>
                    <Icon size={13} />
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>
                {isSwitching ? (
                  <Loader2 size={13} className="animate-spin text-white/70" />
                ) : isActive ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0a0a0a]/90 backdrop-blur-md border border-white/15 text-xs font-bold text-white hover:border-white/30 shadow-lg hover:shadow-xl transition-all group"
      >
        <Sparkles size={14} className="text-amber-400 animate-pulse" />
        <span>⚡ Switch Role</span>
        <ChevronUp size={14} className={`text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
}
