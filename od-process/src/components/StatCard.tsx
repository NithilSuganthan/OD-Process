import React from 'react';
import type { LucideIcon } from 'lucide-react';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface StatCardProps {
  /** Small uppercase label at the top */
  label: string;
  /** The large metric value */
  value: string | number;
  /** Optional description text below the value */
  description?: string;
  /** Optional icon component displayed in the top-right corner */
  icon?: React.ReactNode;
  /** Optional border accent color class (e.g. 'border-amber-500/20') */
  borderColor?: string;
  /** Optional label text color class */
  labelColor?: string;
  /** Optional description text color class */
  descriptionColor?: string;
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export default function StatCard({
  label,
  value,
  description,
  icon,
  borderColor = 'border-white/5',
  labelColor = 'text-zinc-500',
  descriptionColor = 'text-zinc-400',
}: StatCardProps) {
  return (
    <div className={`bg-black/40 border ${borderColor} rounded-xl p-5 relative overflow-hidden`}>
      {icon && (
        <div className="absolute top-3 right-3 opacity-60">
          {icon}
        </div>
      )}
      <h4 className={`text-[10px] ${labelColor} font-semibold uppercase tracking-wider mb-2`}>
        {label}
      </h4>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      {description && (
        <p className={`text-[10px] ${descriptionColor} font-medium`}>{description}</p>
      )}
    </div>
  );
}
