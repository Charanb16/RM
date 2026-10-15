import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Car,
  Clock,
  Radio,
  Briefcase,
  Headphones,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Sidebar = () => {
  const { user, isCustomer, isProvider } = useAuth();

  const customerLinks = [
    {
      to: '/customer/dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/customer/new-request',
      label: 'New Request',
      icon: PlusCircle,
      badge: 'SOS',
    },
    {
      to: '/customer/vehicles',
      label: 'My Garage',
      icon: Car,
      badge: null,
    },
    {
      to: '/customer/history',
      label: 'Service History',
      icon: Clock,
      badge: null,
    },
  ];

  const providerLinks = [
    {
      to: '/provider/dashboard',
      label: 'Dispatch Hub',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/provider/offers',
      label: 'Incoming Offers',
      icon: Radio,
      badge: 'Live',
    },
    {
      to: '/provider/active-job',
      label: 'Active Dispatch',
      icon: Briefcase,
      badge: null,
    },
  ];

  const links = isCustomer ? customerLinks : providerLinks;

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 glass border-r border-white/10 bg-navy-950/70 min-h-[calc(100vh-4rem)] p-4 justify-between">
      <div className="space-y-6">
        {/* User Card */}
        <div className="p-3.5 rounded-2xl glass-card flex items-center gap-3 border border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center font-bold text-navy-950 text-base shadow-md">
            {user?.first_name?.[0] || 'U'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-white truncate">
              {user?.first_name} {user?.last_name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-400 capitalize">
                {isProvider ? 'Certified Pro' : 'Verified Member'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Navigation
          </p>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/20 to-red-500/10 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Support box */}
      <div className="p-3.5 rounded-2xl glass-card border border-white/5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Headphones className="w-4 h-4 text-blue-400" />
          <span>24/7 Roadside Hotline</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Experiencing critical highway emergencies? Call emergency dispatch directly.
        </p>
        <div className="pt-1 flex items-center justify-between text-xs">
          <span className="text-amber-400 font-mono font-bold">+1 (800) 555-ROAD</span>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
