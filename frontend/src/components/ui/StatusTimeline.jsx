import React from 'react';
import { Check, Clock, Radio, Truck, MapPin, Wrench, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const ORDERED_STEPS = [
  {
    key: 'requested',
    title: 'Requested',
    description: 'Assistance request logged in system',
    icon: Clock,
  },
  {
    key: 'searching',
    title: 'Searching',
    description: 'Matching nearest certified providers',
    icon: Radio,
  },
  {
    key: 'offered',
    title: 'Provider Found',
    description: 'Dispatch offers submitted by pros',
    icon: MapPin,
  },
  {
    key: 'accepted',
    title: 'Accepted',
    description: 'Driver assigned and dispatched',
    icon: CheckCircle2,
  },
  {
    key: 'en_route',
    title: 'En Route',
    description: 'Driver navigation in progress',
    icon: Truck,
  },
  {
    key: 'arrived',
    title: 'Arrived',
    description: 'Assistance unit on scene',
    icon: MapPin,
  },
  {
    key: 'in_progress',
    title: 'In Progress',
    description: 'Active vehicle recovery / repair',
    icon: Wrench,
  },
  {
    key: 'completed',
    title: 'Completed',
    description: 'Service completed successfully',
    icon: Check,
  },
];

export const StatusTimeline = ({ currentStatus, className = '' }) => {
  if (currentStatus === 'cancelled') {
    return (
      <div className={`p-5 rounded-2xl bg-red-950/20 border border-red-500/30 text-center ${className}`}>
        <div className="inline-flex p-3 rounded-full bg-red-500/10 text-red-400 mb-2">
          <XCircle className="w-8 h-8" />
        </div>
        <h4 className="text-base font-semibold text-white">Request Cancelled</h4>
        <p className="text-xs text-slate-400 mt-1">
          This roadside assistance request was cancelled. No charges incurred.
        </p>
      </div>
    );
  }

  if (currentStatus === 'no_providers_found') {
    return (
      <div className={`p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-center ${className}`}>
        <div className="inline-flex p-3 rounded-full bg-amber-500/10 text-amber-400 mb-2">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h4 className="text-base font-semibold text-white">No Units Available</h4>
        <p className="text-xs text-slate-400 mt-1">
          All nearby providers are engaged. Our dispatch team has been notified.
        </p>
      </div>
    );
  }

  const currentIndex = ORDERED_STEPS.findIndex((s) => s.key === currentStatus);
  const activeIdx = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className={`space-y-4 ${className}`}>
      {ORDERED_STEPS.map((step, index) => {
        const isCompleted = index < activeIdx || currentStatus === 'completed';
        const isCurrent = index === activeIdx && currentStatus !== 'completed';
        const StepIcon = step.icon;

        return (
          <div key={step.key} className="relative flex items-start group">
            {/* Connecting line */}
            {index < ORDERED_STEPS.length - 1 && (
              <div
                className={`absolute left-5 top-10 bottom-0 w-0.5 -ml-[1px] transition-colors duration-500 ${
                  index < activeIdx
                    ? 'bg-emerald-500'
                    : index === activeIdx
                    ? 'bg-gradient-to-b from-amber-500 to-slate-800'
                    : 'bg-slate-800'
                }`}
                style={{ height: 'calc(100% + 4px)' }}
              />
            )}

            {/* Step icon / badge */}
            <div className="relative z-10 flex items-center justify-center">
              {isCompleted ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
              ) : isCurrent ? (
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 flex items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse">
                  <StepIcon className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-navy-950/80 border border-slate-700/60 text-slate-500 flex items-center justify-center transition-all duration-300">
                  <StepIcon className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Content text */}
            <div className="ml-4 flex-1 pb-6">
              <div className="flex items-center justify-between">
                <h4
                  className={`text-sm font-semibold transition-colors duration-300 ${
                    isCurrent
                      ? 'text-amber-400 font-bold'
                      : isCompleted
                      ? 'text-white'
                      : 'text-slate-500'
                  }`}
                >
                  {step.title}
                </h4>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    LIVE
                  </span>
                )}
                {isCompleted && (
                  <span className="text-[11px] font-medium text-emerald-400">
                    Done
                  </span>
                )}
              </div>
              <p
                className={`text-xs mt-0.5 transition-colors duration-300 ${
                  isCurrent ? 'text-slate-300' : isCompleted ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatusTimeline;
