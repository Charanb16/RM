import React from 'react';

export const Card = ({
  children,
  className = '',
  hoverEffect = false,
  glow = false,
  title,
  subtitle,
  headerAction,
  ...props
}) => {
  return (
    <div
      className={`glass-card rounded-2xl p-6 transition-all duration-300 relative overflow-hidden ${
        hoverEffect ? 'glass-card-hover' : ''
      } ${glow ? 'border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.15)]' : ''} ${className}`}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-start justify-between mb-5 pb-3 border-b border-white/5">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div className="ml-4 shrink-0">{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
