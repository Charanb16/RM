import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({
  id,
  type = 'info',
  title,
  message,
  onDismiss,
}) => {
  const iconConfig = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
  };

  const borderConfig = {
    success: 'border-emerald-500/30 bg-emerald-950/40',
    error: 'border-red-500/30 bg-red-950/40',
    warning: 'border-amber-500/30 bg-amber-950/40',
    info: 'border-blue-500/30 bg-blue-950/40',
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl text-left transition-all duration-300 animate-slideInRight ${borderConfig[type]}`}
      role="alert"
    >
      <div className="shrink-0 mt-0.5">{iconConfig[type]}</div>
      <div className="flex-1 pr-2">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        {message && <p className="text-xs text-slate-300 mt-0.5">{message}</p>}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="text-slate-400 hover:text-white p-1 rounded transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
