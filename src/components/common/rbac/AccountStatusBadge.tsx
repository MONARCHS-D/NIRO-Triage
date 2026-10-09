'use client';

import React from 'react';
import { Lock, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AccountStatusBadgeProps {
  status: 'ACTIVE' | 'SUSPENDED';
  variant?: 'topbar' | 'sidebar' | 'inline' | 'credentials';
  showIcon?: boolean;
  className?: string;
}

export const AccountStatusBadge: React.FC<AccountStatusBadgeProps> = ({
  status,
  variant = 'inline',
  showIcon = true,
  className = '',
}) => {
  const isSuspended = status === 'SUSPENDED';

  if (variant === 'sidebar') {
    if (isSuspended) {
      return (
        <span
          role="status"
          className={`text-[10px] font-medium text-rose-700 flex items-center gap-1 ${className}`}
        >
          {showIcon && <Lock className="w-2.5 h-2.5 shrink-0 text-rose-600" />}
          <span>Access suspended</span>
        </span>
      );
    }
    return (
      <span
        role="status"
        className={`text-[10px] font-medium text-emerald-700 flex items-center gap-1 ${className}`}
      >
        {showIcon && <CheckCircle2 className="w-2.5 h-2.5 shrink-0 text-emerald-600" />}
        <span>Active access</span>
      </span>
    );
  }

  if (variant === 'topbar') {
    if (isSuspended) {
      return (
        <span
          role="status"
          title="Account access suspended by Facility Administration"
          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 select-none ${className}`}
        >
          {showIcon && <Lock className="w-3 h-3 text-rose-600" />}
          <span>Suspended</span>
        </span>
      );
    }
    return null;
  }

  if (variant === 'credentials') {
    if (isSuspended) {
      return (
        <span
          role="status"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 ${className}`}
        >
          {showIcon && <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />}
          <span>Access Suspended</span>
        </span>
      );
    }
    return (
      <span
        role="status"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Active Session</span>
      </span>
    );
  }

  // Default 'inline'
  if (isSuspended) {
    return (
      <span
        role="status"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 ${className}`}
      >
        {showIcon && <Lock className="w-2.5 h-2.5 text-rose-600" />}
        <span>Suspended</span>
      </span>
    );
  }

  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <span>Active</span>
    </span>
  );
};
