'use client';

import React from 'react';

interface AppAmbientGridProps {
  opacity?: number;
  className?: string;
  position?: 'top-right' | 'bottom-right' | 'full';
}

/**
 * AppAmbientGrid: Generates an ultra-subtle technical coordinate grid
 * per Sections 5.1, 19, 24, 25 of the design specification.
 * Occupies peripheral whitespace with 2-7% opacity.
 */
export const AppAmbientGrid: React.FC<AppAmbientGridProps> = ({
  opacity = 0.04,
  className = '',
  position = 'top-right',
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-0 right-0 w-[38%] h-[32%]';
      case 'bottom-right':
        return 'bottom-0 right-0 w-[42%] h-[35%]';
      case 'full':
        return 'inset-0 w-full h-full';
      default:
        return 'top-0 right-0 w-[38%] h-[32%]';
    }
  };

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none absolute z-0 overflow-hidden ${getPositionClasses()} ${className}`}
      style={{ opacity }}
    >
      <div
        className="w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(to right, #2563EB 1px, transparent 1px),
            linear-gradient(to bottom, #2563EB 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse at 80% 20%, black 40%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 80% 20%, black 40%, transparent 85%)',
        }}
      />
      {/* Coordinate point nodes */}
      <div className="absolute top-[32px] right-[64px] w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
      <div className="absolute top-[96px] right-[160px] w-2 h-2 rounded-full bg-[#087443]" />
      <div className="absolute top-[160px] right-[96px] w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
    </div>
  );
};
