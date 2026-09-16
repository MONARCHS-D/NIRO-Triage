import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'outline-destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded cursor-pointer select-none';

  const sizeClasses = {
    sm: 'text-xs h-8 px-2.5 gap-1.5 min-w-[32px]',
    md: 'text-sm h-10 px-3.5 gap-2 min-h-[40px]',
    lg: 'text-sm h-11 px-4 gap-2.5 min-h-[44px]', // 44px touch target minimum
  }[size];

  const variantClasses = {
    primary:
      'bg-[#2563EB] hover:bg-[#164FD6] text-white shadow-sm focus-visible:outline-[#2563EB] active:bg-[#164FD6]',
    secondary:
      'bg-white border border-[#E6ECF2] text-[#25364A] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] shadow-sm',
    tertiary:
      'bg-transparent text-[#2563EB] hover:bg-[#E8F0FF] hover:text-[#164FD6]',
    destructive:
      'bg-[#B3261E] hover:bg-[#991B1B] text-white shadow-sm focus-visible:outline-[#B3261E]',
    'outline-destructive':
      'bg-white border border-red-300 text-[#B3261E] hover:bg-[#FDECEC]',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
