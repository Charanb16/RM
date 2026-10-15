import React, { forwardRef } from 'react';
import Spinner from './Spinner';

export const Button = forwardRef(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-navy-950 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3.5 text-base font-semibold gap-2.5',
    };

    const variantStyles = {
      primary:
        'bg-cta-gradient hover:bg-cta-gradient-hover text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 border border-amber-400/30 focus:ring-amber-500',
      secondary:
        'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 border border-blue-400/30 focus:ring-blue-500',
      outline:
        'glass hover:bg-white/10 text-slate-200 border border-white/20 hover:border-amber-400/50 hover:text-white focus:ring-amber-500',
      ghost:
        'text-slate-300 hover:text-white hover:bg-white/5 focus:ring-slate-400',
      danger:
        'bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 border border-red-500/30 focus:ring-red-500',
      success:
        'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border border-emerald-500/30 focus:ring-emerald-500',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading && <Spinner size="sm" className="mr-1 text-white" />}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
