'use client';

import React from 'react';
import Image from 'next/image';

interface AiOrganizationIllustrationProps {
  className?: string;
  width?: number;
  height?: number;
}

/**
 * AiOrganizationIllustration: Section 18 AI transparency & summarization symbol.
 * Visualizes 3-4 structured information fragments converging into a clean organized card.
 * Communicates organization and summarization, NOT autonomous medical intelligence.
 */
export const AiOrganizationIllustration: React.FC<AiOrganizationIllustrationProps> = ({
  className = '',
  width = 280,
  height = 200,
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <Image
        src="/motifs/ai_organization.svg"
        alt="AI Information Organization: Multi-source fragments structured into clinical note"
        width={width}
        height={height}
        className="object-contain"
      />
    </div>
  );
};
