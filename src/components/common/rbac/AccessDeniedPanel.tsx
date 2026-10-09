'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, ExternalLink, HelpCircle } from 'lucide-react';
import { Button } from '../Button';

interface AccessDeniedPanelProps {
  title?: string;
  description?: string;
  onReturn?: () => void;
}

export const AccessDeniedPanel: React.FC<AccessDeniedPanelProps> = ({
  title = 'Intake is unavailable',
  description = 'Your practitioner account is suspended. New registrations and voice capture are disabled until access is restored.',
  onReturn,
}) => {
  const router = useRouter();

  const handleReturn = onReturn || (() => router.push('/dashboard'));

  return (
    <div className="max-w-2xl mx-auto my-8 sm:my-16 px-4">
      <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header with restrained clinical status badge */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-[#102033] tracking-tight">{title}</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                Suspended Access
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#526276] leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Guidance section */}
        <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#102033]">
            <HelpCircle className="w-4 h-4 text-[#2563EB]" />
            <span>What you can do</span>
          </div>
          <ul className="text-xs text-[#526276] space-y-2 pl-6 list-disc">
            <li>
              <strong>Contact facility administration</strong> to review statutory credentials or request account reactivation.
            </li>
            <li>
              <strong>Review existing records:</strong> You may continue to view historical patient records, evidence reports, and queue benchmarks where permitted by policy.
            </li>
            <li>
              <strong>Unsaved drafts:</strong> Any session work is preserved locally and cannot be submitted until your active status is reinstated.
            </li>
          </ul>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-[#E6ECF2]">
          <Button
            variant="secondary"
            size="md"
            onClick={() => router.push('/settings')}
            icon={<ExternalLink className="w-3.5 h-3.5" />}
          >
            View Account Status
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleReturn}
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
