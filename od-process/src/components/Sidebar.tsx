"use client";

import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
}

export type AccentColor = 'indigo' | 'emerald' | 'purple' | 'blue' | 'red';

interface SidebarProps {
  /** The navigation items to render */
  navItems: NavItem[];
  /** Currently active tab id */
  activeTab: string;
  /** Callback when a nav item is clicked */
  onTabChange: (tabId: string) => void;
  /** Accent color theme for the active state */
  accent?: AccentColor;
  /** Override avatar content (defaults to profile initials) */
  avatarContent?: React.ReactNode;
  /** Override display name */
  displayName?: string;
  /** Override subtitle text */
  subtitle?: string;
}

// ────────────────────────────────────────────
// Color Maps
// ────────────────────────────────────────────

const accentMap: Record<AccentColor, {
  avatarBg: string;
  avatarShadow: string;
  subtitleText: string;
  activeBg: string;
  activeBorder: string;
  activeShadow: string;
}> = {
  indigo: {
    avatarBg: 'bg-blue-600',
    avatarShadow: 'shadow-[0_0_20px_rgba(37,99,235,0.4)]',
    subtitleText: 'text-indigo-400',
    activeBg: 'bg-indigo-500/10',
    activeBorder: 'border-indigo-500/30',
    activeShadow: 'shadow-[0_0_15px_rgba(99,102,241,0.05)]',
  },
  emerald: {
    avatarBg: 'bg-emerald-600',
    avatarShadow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    subtitleText: 'text-emerald-400',
    activeBg: 'bg-emerald-500/10',
    activeBorder: 'border-emerald-500/30',
    activeShadow: 'shadow-[0_0_15px_rgba(16,185,129,0.05)]',
  },
  purple: {
    avatarBg: 'bg-purple-600',
    avatarShadow: 'shadow-[0_0_20px_rgba(147,51,234,0.3)]',
    subtitleText: 'text-purple-400',
    activeBg: 'bg-purple-500/10',
    activeBorder: 'border-purple-500/30',
    activeShadow: 'shadow-[0_0_15px_rgba(168,85,247,0.05)]',
  },
  blue: {
    avatarBg: 'bg-blue-600',
    avatarShadow: 'shadow-[0_0_20px_rgba(37,99,235,0.4)]',
    subtitleText: 'text-blue-400',
    activeBg: 'bg-blue-500/10',
    activeBorder: 'border-blue-500/30',
    activeShadow: 'shadow-[0_0_15px_rgba(59,130,246,0.05)]',
  },
  red: {
    avatarBg: 'bg-red-600',
    avatarShadow: 'shadow-[0_0_20px_rgba(220,38,38,0.3)]',
    subtitleText: 'text-red-400',
    activeBg: 'bg-red-500/10',
    activeBorder: 'border-red-500/30',
    activeShadow: 'shadow-[0_0_15px_rgba(239,68,68,0.05)]',
  },
};

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export default function Sidebar({
  navItems,
  activeTab,
  onTabChange,
  accent = 'indigo',
  avatarContent,
  displayName,
  subtitle,
}: SidebarProps) {
  const { profile, signOut } = useAuth();
  const colors = accentMap[accent];

  // Default initials from profile
  const initials = profile?.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('')
    : '??';

  const name = displayName ?? profile?.name ?? 'Loading...';
  const sub = subtitle ?? profile?.department ?? '---';

  return (
    <aside className="w-64 border-r border-white/5 flex flex-col h-screen sticky top-0 bg-[#050505] shrink-0">
      <div className="p-6 flex-1 flex flex-col">
        {/* User Info */}
        <div className="flex items-center gap-4 mb-10 mt-4">
          <div className={`w-11 h-11 rounded-full ${colors.avatarBg} flex items-center justify-center shrink-0 ${colors.avatarShadow}`}>
            {avatarContent ?? (
              <span className="text-sm font-bold text-white">{initials}</span>
            )}
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-white text-sm truncate">{name}</h3>
            <p className={`text-[11px] ${colors.subtitleText} truncate`}>{sub}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all ${
                activeTab === item.id
                  ? `${colors.activeBg} text-white border ${colors.activeBorder} ${colors.activeShadow}`
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="mt-auto pt-6 border-t border-white/5">
          <button
            onClick={async () => { await signOut(); window.location.href = '/login'; }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
