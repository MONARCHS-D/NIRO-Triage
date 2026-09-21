'use client';

import React from 'react';
import Image from 'next/image';

interface EmptyStateIllustrationProps {
  title?: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
}

/**
 * EmptyStateIllustration: Section 15.1 Empty queue & general clean empty states.
 * Uses the approved editorial vector illustration with clear queue status.
 */
export const EmptyStateIllustration: React.FC<EmptyStateIllustrationProps> = ({
  title = 'Triage Queue All Clear',
  description = 'There are currently no patients waiting for clinical review.',
  className = '',
  action,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center select-none ${className}`}>
      <div className="relative w-[220px] h-[160px] mb-4 drop-shadow-xs">
        <Image
          src="/illustrations/empty/empty_queue.png"
          alt="Empty triage queue illustration"
          fill
          priority
          sizes="220px"
          className="object-contain"
        />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-[#102033] tracking-tight">{title}</h3>
      <p className="text-xs text-[#6B7B8F] max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};
