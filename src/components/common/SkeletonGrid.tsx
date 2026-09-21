'use client';

import React from 'react';

export interface SkeletonGridProps {
  className?: string;
  children?: React.ReactNode;
  /** Dot pitch in pixels (spacing between dots). Defaults to 11px for compact clinical fidelity. */
  dotPitch?: number;
  /** Dot diameter in pixels. Defaults to 1px for compact, crisp precision. */
  dotSize?: number;
  /** Whether the diagonal sweep wave animation is active. Defaults to true. */
  animated?: boolean;
  /** Animation speed: 'normal' (2.4s), 'fast' (1.8s), 'slow' (3.2s) */
  speed?: 'normal' | 'fast' | 'slow';
  /** Base background styling */
  bgClassName?: string;
  /** Border styling */
  borderClassName?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
}

/**
 * SkeletonGrid: Renders a compact clinical blue dotted grid with a smooth
 * diagonal sweep wave travelling from top-left to bottom-right.
 * Designed per precision workstation specifications with high visual fidelity.
 */
export const SkeletonGrid: React.FC<SkeletonGridProps> = ({
  className = '',
  children,
  dotPitch = 11,
  dotSize = 1,
  animated = true,
  speed = 'normal',
  bgClassName = 'bg-[#F8FAFC]',
  borderClassName = 'border border-[#DCE7F6]',
  style = {},
}) => {
  const speedStyle = {
    normal: '2.4s',
    fast: '1.8s',
    slow: '3.2s',
  }[speed];

  return (
    <div
      className={`relative overflow-hidden ${bgClassName} ${borderClassName} ${className}`}
      style={{
        boxShadow: '0 1px 2px rgba(16, 32, 51, 0.03)',
        ...style,
      }}
    >
      {/* Layer 1: Static Base Compact Blue Dotted Grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(37, 99, 235, 0.22) ${dotSize}px, transparent ${dotSize}px)`,
          backgroundSize: `${dotPitch}px ${dotPitch}px`,
        }}
      />

      {/* Layer 2: Diagonal Light Wave - Ambient Shimmer Beam Traveling Top-Left to Bottom-Right */}
      {animated && (
        <div
          className="absolute pointer-events-none animate-diagonal-sweep"
          style={{
            animationDuration: speedStyle,
            width: '240%',
            height: '240%',
            left: '-70%',
            top: '-70%',
            background:
              'linear-gradient(135deg, transparent 0%, transparent 40%, rgba(37, 99, 235, 0.04) 44%, rgba(59, 130, 246, 0.18) 48%, rgba(191, 219, 254, 0.5) 50%, rgba(59, 130, 246, 0.18) 52%, rgba(37, 99, 235, 0.04) 56%, transparent 60%, transparent 100%)',
          }}
        />
      )}

      {/* Layer 3: Diagonal Wave - High-Fidelity Illuminated Blue Dots Active Under the Diagonal Beam */}
      {animated && (
        <div
          className="absolute pointer-events-none animate-diagonal-sweep"
          style={{
            animationDuration: speedStyle,
            width: '240%',
            height: '240%',
            left: '-70%',
            top: '-70%',
            backgroundImage: `radial-gradient(circle, rgba(29, 78, 216, 0.95) ${dotSize + 0.3}px, rgba(59, 130, 246, 0.4) ${dotSize + 0.8}px, transparent ${dotSize + 1.2}px)`,
            backgroundSize: `${dotPitch}px ${dotPitch}px`,
            WebkitMaskImage:
              'linear-gradient(135deg, transparent 0%, transparent 43%, black 49%, black 51%, transparent 57%, transparent 100%)',
            maskImage:
              'linear-gradient(135deg, transparent 0%, transparent 43%, black 49%, black 51%, transparent 57%, transparent 100%)',
          }}
        />
      )}

      {/* Layer 4: Translucent Children / Placeholders */}
      {children && <div className="relative z-10 w-full h-full">{children}</div>}
    </div>
  );
};

/**
 * SkeletonKpiCard: Pre-styled metric card skeleton matching NIRO Triage KPI cards
 */
export const SkeletonKpiCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <SkeletonGrid className={`p-4 rounded-lg min-h-[116px] flex flex-col justify-between ${className}`}>
      {/* Top row: Label placeholder & Delta badge placeholder */}
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 rounded-xs bg-slate-400/30 backdrop-blur-2xs" />
        <div className="h-4 w-12 rounded-xs bg-blue-100/70 border border-blue-200/50" />
      </div>

      {/* Middle row: Big Metric Number block */}
      <div className="my-2 flex items-baseline gap-2">
        <div className="h-7 w-20 rounded-xs bg-slate-500/25 backdrop-blur-2xs" />
      </div>

      {/* Bottom row: Helper description line */}
      <div className="h-2.5 w-36 rounded-xs bg-slate-400/25 backdrop-blur-2xs" />
    </SkeletonGrid>
  );
};

/**
 * SkeletonTableRow: Pre-styled row skeleton matching Patient Table in Dashboard & Queue
 */
export const SkeletonTableRow: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <SkeletonGrid className={`p-3.5 rounded-lg border border-[#E2E8F0] bg-white/70 ${className}`}>
      <div className="grid grid-cols-12 gap-3 items-center text-xs">
        {/* ID Column */}
        <div className="col-span-2 sm:col-span-1">
          <div className="h-4 w-14 rounded-xs bg-blue-200/70" />
        </div>

        {/* Patient Name & Code */}
        <div className="col-span-4 sm:col-span-3 space-y-1.5">
          <div className="h-3.5 w-28 rounded-xs bg-slate-400/30" />
          <div className="h-2.5 w-20 rounded-xs bg-slate-400/20" />
        </div>

        {/* Age / Sex */}
        <div className="hidden sm:block sm:col-span-1">
          <div className="h-3 w-10 rounded-xs bg-slate-400/30" />
        </div>

        {/* Chief Complaint */}
        <div className="hidden md:block md:col-span-3">
          <div className="h-3 w-4/5 rounded-xs bg-slate-400/30" />
        </div>

        {/* Priority Badge */}
        <div className="col-span-3 sm:col-span-2">
          <div className="h-5 w-16 rounded-full bg-slate-200/70" />
        </div>

        {/* Status Badge */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="h-5 w-20 rounded-full bg-slate-200/60" />
        </div>

        {/* Action Button */}
        <div className="col-span-3 sm:col-span-1 text-right flex justify-end">
          <div className="h-6 w-14 rounded-md bg-blue-100/70 border border-blue-200/60" />
        </div>
      </div>
    </SkeletonGrid>
  );
};

/**
 * SkeletonTable: Complete table skeleton with header and rows
 */
export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="space-y-2.5 p-4 sm:p-6">
      {/* Header bar placeholder */}
      <div className="h-8 rounded-lg bg-slate-100/80 border border-slate-200/60 flex items-center px-4 justify-between">
        <div className="h-2.5 w-24 rounded-xs bg-slate-400/30" />
        <div className="h-2.5 w-32 rounded-xs bg-slate-400/25 hidden sm:block" />
        <div className="h-2.5 w-20 rounded-xs bg-slate-400/25" />
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} />
      ))}
    </div>
  );
};

/**
 * SkeletonBlock: General-purpose block skeleton with compact blue dot grid & diagonal sweep
 */
export const SkeletonBlock: React.FC<{
  className?: string;
  height?: string;
  rounded?: string;
}> = ({ className = '', height = 'h-12', rounded = 'rounded-lg' }) => {
  return <SkeletonGrid className={`${height} ${rounded} ${className}`} />;
};
