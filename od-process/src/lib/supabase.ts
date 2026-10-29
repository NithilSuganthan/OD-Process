import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check for missing env variables in non-build environments
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.warn('Supabase URL or Anon Key is missing. Check your .env.local file.');
  }
}

// Bypass Web Locks API in dev mode to prevent 5000ms lock timeouts from React Strict Mode
const bypassLock = async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
  return await fn();
};

// ─────────────────────────────────────────────────────
// Role-scoped Supabase client factory
// ─────────────────────────────────────────────────────
// Each role gets its own Supabase client instance with a separate storage key.
// This prevents one login from overwriting another role's session,
// allowing simultaneous logins in different browser tabs.

const STORAGE_KEY_PREFIX = 'sb-smartod';

/**
 * Custom storage adapter that namespaces keys per role.
 * This keeps each role's auth tokens in separate localStorage keys,
 * so logging in as "faculty" doesn't overwrite the "student" session.
 */
function createRoleStorage(role: string) {
  const prefix = `${STORAGE_KEY_PREFIX}-${role}-`;
  return {
    getItem: (key: string) => {
      if (typeof window === 'undefined') return null;
      return globalThis.localStorage.getItem(`${prefix}${key}`);
    },
    setItem: (key: string, value: string) => {
      if (typeof window === 'undefined') return;
      globalThis.localStorage.setItem(`${prefix}${key}`, value);
    },
    removeItem: (key: string) => {
      if (typeof window === 'undefined') return;
      globalThis.localStorage.removeItem(`${prefix}${key}`);
    },
  };
}

// Cache of role-scoped clients to avoid re-creating them
const clientCache = new Map<string, SupabaseClient>();

/**
 * Get a Supabase client scoped to a specific role.
 * Each role gets its own session storage namespace,
 * so multiple roles can be logged in simultaneously in different tabs.
 */
export function getSupabaseForRole(role: string): SupabaseClient {
  if (clientCache.has(role)) {
    return clientCache.get(role)!;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: `${STORAGE_KEY_PREFIX}-${role}`,
      storage: createRoleStorage(role),
      lock: bypassLock as any,
    },
  });

  clientCache.set(role, client);
  return client;
}

/**
 * Determine the current role from the URL pathname.
 * Falls back to 'default' on the server or for unrecognized paths.
 */
export function getRoleFromPath(pathname?: string): string {
  if (typeof window === 'undefined' && !pathname) return 'default';
  
  const path = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  
  if (path.includes('/student') || path.includes('/login/student') || path.includes('/signup')) return 'student';
  if (path.includes('/hod') || path.includes('/login/hod')) return 'hod';
  if (path.includes('/faculty') || path.includes('/login/faculty')) return 'faculty';
  if (path.includes('/admin') || path.includes('/login/admin')) return 'admin';
  
  return 'default';
}

// ─────────────────────────────────────────────────────
// Default (backwards-compatible) client
// ─────────────────────────────────────────────────────
// Used by server-side code, API routes, and any code that doesn't
// need role-scoped sessions (e.g., data queries that don't need auth).
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    lock: bypassLock as any,
  },
});
