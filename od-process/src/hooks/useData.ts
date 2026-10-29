"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// ────────────────────────────────────────────
// useRequests — Fetches OD requests with joins
// ────────────────────────────────────────────

interface UseRequestsOptions {
  /** Filter by current_stage (e.g. 'Advisor', 'HOD') */
  stage?: string;
  /** Filter by status (e.g. 'Pending', 'AdvisorApproved') */
  status?: string;
  /** Filter by student_id (for student's own requests) */
  studentId?: string;
  /** Include AI analysis join */
  includeAI?: boolean;
  /** Include student join */
  includeStudent?: boolean;
  /** Auto-fetch on mount */
  autoFetch?: boolean;
}

export function useRequests(options: UseRequestsOptions = {}) {
  const {
    stage,
    status,
    studentId,
    includeAI = false,
    includeStudent = false,
    autoFetch = true,
  } = options;

  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Build select string
      let selectStr = '*';
      if (includeStudent && includeAI) {
        selectStr = '*, student:students(id, register_no, name, department), ai_analysis:ai_analysis_logs(*)';
      } else if (includeStudent) {
        selectStr = '*, student:students(id, register_no, name, department)';
      } else if (includeAI) {
        selectStr = '*, ai_analysis:ai_analysis_logs(*)';
      }

      let query = supabase
        .from('od_requests')
        .select(selectStr)
        .order('created_at', { ascending: false });

      if (stage) query = query.eq('current_stage', stage);
      if (status) query = query.eq('status', status);
      if (studentId) query = query.eq('student_id', studentId);

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Normalize array joins to single objects
      const rawData = (data as any[]) ?? [];
      const formatted = rawData.map((item: any) => ({
        ...item,
        student: Array.isArray(item.student) ? item.student[0] : item.student,
        ai_analysis: Array.isArray(item.ai_analysis) ? item.ai_analysis[0] : item.ai_analysis,
      }));

      setRequests(formatted);
      return formatted;
    } catch (err: any) {
      console.error('useRequests: fetch error', err);
      setError(err.message || 'Failed to fetch requests');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [stage, status, studentId, includeAI, includeStudent]);

  useEffect(() => {
    if (autoFetch) {
      fetchRequests();
    }
  }, [autoFetch, fetchRequests]);

  return { requests, setRequests, isLoading, error, refetch: fetchRequests };
}

// ────────────────────────────────────────────
// useNotifications — Fetches user notifications
// ────────────────────────────────────────────

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (data) setNotifications(data);
    } catch (err) {
      console.error('useNotifications: fetch error', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return { notifications, unreadCount, isLoading, refetch: fetchNotifications };
}

// ────────────────────────────────────────────
// useStudentProfile — Fetches full student record with joins
// ────────────────────────────────────────────

export function useStudentProfile(studentId?: string) {
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!studentId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          advisor:faculty!advisor_id(name),
          hod:faculty!hod_id(name)
        `)
        .eq('id', studentId)
        .single();

      if (error) {
        console.error('useStudentProfile: fetch error', error);
        return;
      }

      setStudentInfo(data);
    } catch (err) {
      console.error('useStudentProfile: unexpected error', err);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { studentInfo, isLoading, refetch: fetchProfile };
}
