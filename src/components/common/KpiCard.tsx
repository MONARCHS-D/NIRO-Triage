import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'increase' | 'decrease' | 'neutral';
  helperText?: string;
  alert?: boolean;
  onClick?: () => void;
  active?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  delta,
  deltaType = 'neutral',
  helperText,
  alert = false,
  onClick,
  active = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-lg border p-4 transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:border-slate-400' : ''
      } ${
        active
          ? 'border-[#2563EB] ring-2 ring-blue-100'
          : alert
          ? 'border-red-200 bg-red-50/20'
          : 'border-[#E6ECF2]'
      }`}
      style={{ boxShadow: '0 1px 3px rgba(16, 32, 51, 0.04)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#6B7B8F] tracking-wide uppercase">{label}</span>
        {delta && (
          <span
            className={`inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded ${
              deltaType === 'increase'
                ? 'text-emerald-700 bg-emerald-50'
                : deltaType === 'decrease'
                ? 'text-blue-700 bg-blue-50'
                : 'text-slate-600 bg-slate-100'
            }`}
          >
            {deltaType === 'increase' && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
            {deltaType === 'decrease' && <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {deltaType === 'neutral' && <Minus className="w-3 h-3 mr-0.5" />}
            {delta}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <span className={`text-[28px] font-bold leading-none tabular-nums ${alert ? 'text-[#B3261E]' : 'text-[#102033]'}`}>
          {value}
        </span>
      </div>

      {helperText && (
        <p className="mt-2 text-xs text-[#6B7B8F] line-clamp-1">{helperText}</p>
      )}
    </div>
  );
};
