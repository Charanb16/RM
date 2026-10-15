import React from 'react';

export const Badge = ({
  children,
  variant = 'blue',
  size = 'md',
  dot = false,
  pulse = false,
  className = '',
}) => {
  const variantStyles = {
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    blue: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    red: 'bg-red-500/15 text-red-300 border-red-500/30',
    gray: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  };

  const dotColors = {
    amber: 'bg-amber-400',
    blue: 'bg-blue-400',
    green: 'bg-emerald-400',
    red: 'bg-red-400',
    gray: 'bg-slate-400',
    purple: 'bg-purple-400',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} ${
            pulse ? 'animate-pulseDot' : ''
          }`}
        />
      )}
      {children}
    </span>
  );
};

export const getStatusBadgeConfig = (status) => {
  switch (status) {
    case 'requested':
      return { variant: 'amber', label: 'Requested', pulse: true };
    case 'searching':
      return { variant: 'amber', label: 'Searching Dispatch', pulse: true };
    case 'offered':
      return { variant: 'blue', label: 'Offer Received', pulse: true };
    case 'accepted':
      return { variant: 'blue', label: 'Driver Assigned', pulse: false };
    case 'en_route':
      return { variant: 'amber', label: 'Driver En Route', pulse: true };
    case 'arrived':
      return { variant: 'green', label: 'Driver Arrived', pulse: true };
    case 'in_progress':
      return { variant: 'blue', label: 'Service In Progress', pulse: true };
    case 'completed':
      return { variant: 'green', label: 'Service Completed', pulse: false };
    case 'cancelled':
      return { variant: 'red', label: 'Cancelled', pulse: false };
    case 'no_providers_found':
      return { variant: 'gray', label: 'No Units Nearby', pulse: false };
    default:
      return { variant: 'gray', label: status, pulse: false };
  }
};

export const getVerificationBadgeConfig = (status) => {
  switch (status) {
    case 'approved':
      return { variant: 'green', label: 'Verified Partner' };
    case 'pending':
      return { variant: 'amber', label: 'Verification Pending' };
    case 'rejected':
      return { variant: 'red', label: 'Application Rejected' };
    case 'suspended':
      return { variant: 'red', label: 'Account Suspended' };
    default:
      return { variant: 'gray', label: status };
  }
};

export default Badge;
