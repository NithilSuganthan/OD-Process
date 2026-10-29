"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabaseForRole, getRoleFromPath, supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';
import type { User, Session, SupabaseClient } from '@supabase/supabase-js';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export type UserRole = 'student' | 'faculty' | 'hod' | 'admin';

export interface UserProfile {
  id: string;               // Internal DB id (students.id or faculty.id)
  name: string;
  department: string;
  role: UserRole;
  // Student-specific
  register_no?: string;
  year_of_study?: number;
  section?: string;
  attendance_percentage?: number;
  advisor_id?: string;
  hod_id?: string;
  timetable?: any;
  // Faculty-specific
  employee_id?: string;
  is_hod?: boolean;
}

interface AuthContextType {
  /** The raw Supabase Auth user (null if not logged in) */
  user: User | null;
  /** The resolved profile from students/faculty table (null until loaded) */
  profile: UserProfile | null;
  /** Convenience: the user's role (student / faculty / hod) */
  role: UserRole | null;
  /** True while the initial session check is happening */
  isLoading: boolean;
  /** Sign out and clear state */
  signOut: () => Promise<void>;
  /** Force re-fetch the profile from the DB */
  refreshProfile: () => Promise<void>;
  /** The role-scoped Supabase client for the current tab */
  roleClient: SupabaseClient;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  roleClient: supabase,
});

// ────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────

export function useAuth() {
  return useContext(AuthContext);
}

// ────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Determine which role-scoped client to use based on the current URL
  const currentRoleKey = getRoleFromPath(pathname);
  const roleClient = getSupabaseForRole(currentRoleKey);

  // ── Fetch the profile row from the correct table ──
  // Uses the default (non-scoped) supabase client for data queries
  const fetchProfile = useCallback(async (authUser: User) => {
    try {
      const meta = authUser.user_metadata;
      const role: string = meta?.role || 'student';
      const internalId: string = meta?.internal_id;

      if (role === 'admin') {
        setProfile({
          id: authUser.id,
          name: meta?.full_name || 'System Admin',
          department: 'Administration',
          role: 'admin',
        });
        return;
      }

      if (!internalId) {
        console.warn('AuthContext: No internal_id found in user_metadata');
        return;
      }

      if (role === 'student') {
        const { data, error } = await supabase
          .from('students')
          .select(`
            *,
            advisor:faculty!advisor_id(name),
            hod:faculty!hod_id(name)
          `)
          .eq('id', internalId)
          .single();

        if (error) {
          console.error('AuthContext: Failed to fetch student profile', error);
          return;
        }

        setProfile({
          id: data.id,
          name: data.name,
          department: data.department,
          role: 'student',
          register_no: data.register_no,
          year_of_study: data.year_of_study,
          section: data.section,
          attendance_percentage: data.attendance_percentage,
          advisor_id: data.advisor_id,
          hod_id: data.hod_id,
          timetable: data.timetable,
        });
      } else {
        // faculty or hod
        const { data, error } = await supabase
          .from('faculty')
          .select('*')
          .eq('id', internalId)
          .single();

        if (error) {
          console.error('AuthContext: Failed to fetch faculty profile', error);
          return;
        }

        const isHod = Boolean(data.is_hod || role === 'hod');
        const resolvedRole: UserRole = isHod ? 'hod' : 'faculty';

        setProfile({
          id: data.id,
          name: data.name,
          department: data.department,
          role: resolvedRole,
          is_hod: isHod,
        });
      }
    } catch (err) {
      console.error('AuthContext: Unexpected error fetching profile', err);
    }
  }, []);

  // ── Re-initialize session when the role-scoped client changes (route change) ──
  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session }, error: sessionError } = await roleClient.auth.getSession();

        if (sessionError) {
          if (sessionError.message?.includes('Refresh Token') || sessionError.message?.includes('invalid')) {
            console.warn('AuthContext: Stale or invalid refresh token cleared.');
            await roleClient.auth.signOut().catch(() => {});
          }
          if (isMounted) {
            setUser(null);
            setProfile(null);
          }
        } else if (session?.user && isMounted) {
          setUser(session.user);
          await fetchProfile(session.user);
        } else if (isMounted) {
          // No session for this role's client — clear state
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('AuthContext: Session init error', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initSession();

    // ── Listen for auth state changes on the ROLE-SCOPED client ──
    const { data: { subscription } } = roleClient.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await fetchProfile(session.user);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [roleClient, fetchProfile]);

  // ── Sign out (only for the current role's client) ──
  const signOut = useCallback(async () => {
    await roleClient.auth.signOut();
    setUser(null);
    setProfile(null);
    // Clean up any stale localStorage keys from the old system
    if (typeof window !== 'undefined') {
      localStorage.removeItem('student_reg_no');
      localStorage.removeItem('student_id');
      localStorage.removeItem('faculty_id');
      localStorage.removeItem('hod_id');
    }
  }, [roleClient]);

  // ── Refresh profile on demand ──
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user);
    }
  }, [user, fetchProfile]);

  const role = profile?.role ?? null;

  return (
    <AuthContext.Provider value={{ user, profile, role, isLoading, signOut, refreshProfile, roleClient }}>
      {children}
    </AuthContext.Provider>
  );
}
