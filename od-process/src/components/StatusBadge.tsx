import React from 'react';
import { CheckCircle, Clock, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';

// ────────────────────────────────────────────
// Status Badge (for request status)
// ────────────────────────────────────────────

type RequestStatus = 'Pending' | 'AdvisorApproved' | 'HODApproved' | 'Rejected' | string;

interface StatusBadgeProps {
  status: RequestStatus;
  /** Show a friendly label instead of the raw status string */
  showLabel?: boolean;
}

const statusConfig: Record<string, {
  color: string;
  icon: React.ReactNode;
  label: string;
}> = {
  Pending: {
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    icon: <Clock size={14} />,
    label: 'Pending Advisor',
  },
  AdvisorApproved: {
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    icon: <Clock size={14} />,
    label: 'Pending HOD',
  },
  HODApproved: {
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    icon: <CheckCircle size={14} />,
    label: 'Approved',
  },
  Rejected: {
    color: 'text-red-400 bg-red-400/10 border-red-400/20',
    icon: <AlertCircle size={14} />,
    label: 'Rejected',
  },
};

const defaultConfig = {
  color: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  icon: <Clock size={14} />,
  label: 'Unknown',
};

export function StatusBadge({ status, showLabel = true }: StatusBadgeProps) {
  const config = statusConfig[status] ?? defaultConfig;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${config.color} shrink-0`}>
      {config.icon}
      {showLabel ? config.label : status}
    </div>
  );
}

// ────────────────────────────────────────────
// AI Risk Badge (for AI analysis insight)
// ────────────────────────────────────────────

interface AIRiskBadgeProps {
  /** The fraud risk score from 0 to 1 */
  riskScore: number;
  /** The attendance risk prediction label */
  riskPrediction?: string;
  /** Size variant */
  size?: 'sm' | 'md';
}

export function AIRiskBadge({ riskScore, riskPrediction, size = 'sm' }: AIRiskBadgeProps) {
  const isHighRisk = riskScore > 0.5 || (riskPrediction && riskPrediction !== 'Safe');
  
  const badgeColor = isHighRisk
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/20'
    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20';
  
  const label = isHighRisk ? 'High Risk' : 'Safe';

  if (size === 'sm') {
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeColor}`}>
        {label}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase border shadow-sm ${badgeColor}`}>
      <Sparkles size={12} /> {label}
    </div>
  );
}

// ────────────────────────────────────────────
// Helper: get status color class string
// ────────────────────────────────────────────

export function getStatusColor(status: string): string {
  return statusConfig[status]?.color ?? defaultConfig.color;
}

export function getStatusLabel(status: string): string {
  return statusConfig[status]?.label ?? status;
}
