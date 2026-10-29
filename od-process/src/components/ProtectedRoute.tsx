"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Which roles are allowed to see this page */
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until loading is complete before checking
    if (isLoading) return;

    // Not authenticated → redirect to login portal
    if (!user) {
      router.replace('/login');
      return;
    }

    // Authenticated but role not allowed for this page
    if (role && !allowedRoles.includes(role)) {
      // Redirect to their correct dashboard
      const redirectMap: Record<UserRole, string> = {
        student: '/student',
        faculty: '/faculty',
        hod: '/hod',
        admin: '/admin',
      };
      router.replace(redirectMap[role] || '/login');
    }
  }, [user, role, isLoading, allowedRoles, router]);

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-sm">Verifying session...</p>
          <p className="text-zinc-500 text-xs mt-1">Please wait while we authenticate you.</p>
        </div>
      </div>
    );
  }

  // ── Not authenticated ──
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-4">
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
        <p className="text-zinc-400 text-sm">Redirecting to login...</p>
      </div>
    );
  }

  // ── Wrong role ──
  if (role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold">Access Denied</p>
          <p className="text-zinc-500 text-xs mt-1">You don't have permission to view this page. Redirecting...</p>
        </div>
      </div>
    );
  }

  // ── Profile still loading (user exists but profile not fetched yet) ──
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-4">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-zinc-400 text-sm">Loading your profile...</p>
      </div>
    );
  }

  // ── Authorized ──
  return <>{children}</>;
}
