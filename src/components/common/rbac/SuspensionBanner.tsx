'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface SuspensionBannerProps {
  onViewDetails?: () => void;
}

export const SuspensionBanner: React.FC<SuspensionBannerProps> = ({ onViewDetails }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-rose-50/95 border-b border-rose-200/90 text-rose-950 px-3 sm:px-5 py-2 text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xs z-30 transition-colors"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-5 h-5 rounded-full bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className="font-semibold text-rose-950">Practitioner access suspended:</span>
          <span className="text-rose-800">
            Clinical write actions are restricted. Contact your facility administrator to restore access.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 ml-auto sm:ml-0">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100/80 text-rose-800 border border-rose-200/80">
          Read-only
        </span>
        <Link
          href="/settings"
          onClick={onViewDetails}
          className="inline-flex items-center gap-1 font-semibold text-xs text-rose-900 hover:text-rose-950 hover:underline cursor-pointer transition-colors"
        >
          <span>View access details</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
