import React, { forwardRef } from 'react';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      startIcon,
      endIcon,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-sm">
          {startIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              {startIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full rounded-xl py-2.5 text-sm transition-all duration-200 placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed ${
              startIcon ? 'pl-10' : 'pl-3.5'
            } ${endIcon ? 'pr-10' : 'pr-3.5'} ${
              error
                ? 'border-red-500 bg-red-950/20 text-red-100 focus:border-red-400 focus:ring-1 focus:ring-red-500'
                : 'glass-input'
            } ${className}`}
            {...props}
          />
          {endIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
              {endIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs font-medium text-red-400">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
