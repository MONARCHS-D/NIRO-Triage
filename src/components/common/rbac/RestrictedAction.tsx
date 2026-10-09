'use client';

import React from 'react';

export type RestrictionReason =
  | 'ai_processing'
  | 'clinical_authority'
  | 'approval'
  | 'escalation'
  | 'handoff'
  | 'readonly_edit'
  | 'intake'
  | string;

const STANDARD_RESTRICTION_MESSAGES: Record<string, string> = {
  ai_processing: 'Disabled · AI processing restricted',
  clinical_authority: 'Disabled · Clinical authority suspended',
  approval: 'Disabled · Approval permission required',
  escalation: 'Disabled · Contact authorized clinical staff',
  handoff: 'Disabled · Handoff permission required',
  readonly_edit: 'Disabled · Read-only access',
  intake: 'Disabled · Intake registration restricted',
};

interface RestrictedActionProps {
  isRestricted: boolean;
  reason?: RestrictionReason;
  customTooltip?: string;
  children: React.ReactElement<any>;
  className?: string;
}

export const RestrictedAction: React.FC<RestrictedActionProps> = ({
  isRestricted,
  reason = 'clinical_authority',
  customTooltip,
  children,
  className = '',
}) => {
  if (!isRestricted) {
    return children;
  }

  const tooltip =
    customTooltip ||
    STANDARD_RESTRICTION_MESSAGES[reason] ||
    `Disabled · ${reason}`;

  const clonedChild = React.cloneElement(children, {
    disabled: true,
    'aria-disabled': true,
    'aria-description': tooltip,
  });

  return (
    <div
      title={tooltip}
      className={`inline-block cursor-not-allowed ${className}`}
      role="group"
      aria-label={tooltip}
    >
      {clonedChild}
    </div>
  );
};
