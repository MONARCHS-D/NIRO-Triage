'use client';

import React from 'react';
import Image from 'next/image';

interface DataFlowMotifProps {
  className?: string;
  opacity?: number;
  width?: number;
  height?: number;
}

/**
 * DataFlowMotif: "Care reaches further" data curve motif per Section 5.2.
 * Represents continuity of care and information flow (NOT physiological ECG).
 * Placed in dashboard lower-right with 20-40% opacity.
 */
export const DataFlowMotif: React.FC<DataFlowMotifProps> = ({
  className = '',
  opacity = 0.35,
  width = 240,
  height = 80,
}) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none relative inline-block transition-opacity duration-300 ${className}`}
      style={{ opacity }}
    >
      <Image
        src="/motifs/data_curve.png"
        alt="Continuous information flow motif"
        width={width}
        height={height}
        className="object-contain"
        priority={false}
      />
    </div>
  );
};
