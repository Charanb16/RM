import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Wrench, Menu, X, LogOut, User, Car, Clock, Bell, Radio } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';

export const Navbar = () => {
  const { user, isAuthenticated, logout, isCustomer, isProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-white/10 bg-navy-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:shadow-amber-500/40 transition-all duration-300">
            <Wrench className="w-5 h-5 text-navy-950 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
              ROAD<span className="text-amber-400">MATE</span>
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold -mt-1">
              Rapid Recovery
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {!isAuthenticated ? (
            <>
              <a
                href="#services"
                className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Services
              </a>
              <a
                href="#how-it-works"
                className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                How It Works
              </a>
              <a
                href="#network"
                className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Coverage
              </a>
            </>
          ) : isCustomer ? (
            <>
              <Link
                to="/customer/dashboard"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/customer/dashboard')
                    ? 'bg-white/10 text-amber-400'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/customer/new-request"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/customer/new-request')
                    ? 'bg-white/10 text-amber-400'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Request Help
              </Link>
              <Link
                to="/customer/vehicles"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/customer/vehicles')
                    ? 'bg-white/10 text-amber-400'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Vehicles
              </Link>
              <Link
                to="/customer/history"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/customer/history')
                    ? 'bg-white/10 text-amber-400'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                History
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/provider/dashboard"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/provider/dashboard')
                    ? 'bg-white/10 text-amber-400'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Provider Hub
              </Link>
              <Link
                to="/provider/offers"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/provider/offers')
                    ? 'bg-white/10 text-amber-400'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>Job Radar</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </Link>
              <Link
                to="/provider/active-job"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/provider/active-job')
                    ? 'bg-white/10 text-amber-400'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Active Dispatch
              </Link>
            </>
          )}
        </nav>

        {/* Right Action buttons */}
        <div className="hidden md:flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/customer/new-request">
                <Button variant="primary" size="sm">
                  Get Help Now
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                  {user?.first_name?.[0] || 'U'}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white leading-tight">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-[10px] text-amber-400 font-medium capitalize">
                    {user?.role} Portal
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                aria-label="Logout"
                title="Log out"
                className="text-slate-400 hover:text-red-400"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-navy-950/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-3 animate-fadeInUp">
          {!isAuthenticated ? (
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-slate-200 hover:bg-white/5 font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-slate-200 hover:bg-white/5 font-medium"
              >
                Join Network
              </Link>
              <Link
                to="/customer/new-request"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block"
              >
                <Button variant="primary" size="md" className="w-full">
                  Get Help Now
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-2 mb-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                  {user?.first_name?.[0] || 'U'}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="text-xs text-amber-400 capitalize">{user?.role}</div>
                </div>
              </div>

              {isCustomer ? (
                <>
                  <Link
                    to="/customer/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/5"
                  >
                    <Shield className="w-4 h-4 text-amber-400" /> Dashboard
                  </Link>
                  <Link
                    to="/customer/new-request"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/5"
                  >
                    <Wrench className="w-4 h-4 text-amber-400" /> Request Assistance
                  </Link>
                  <Link
                    to="/customer/vehicles"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/5"
                  >
                    <Car className="w-4 h-4 text-amber-400" /> Garage / Vehicles
                  </Link>
                  <Link
                    to="/customer/history"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/5"
                  >
                    <Clock className="w-4 h-4 text-amber-400" /> Service History
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/provider/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/5"
                  >
                    <Radio className="w-4 h-4 text-emerald-400" /> Provider Hub
                  </Link>
                  <Link
                    to="/provider/offers"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/5"
                  >
                    <Bell className="w-4 h-4 text-amber-400" /> Job Offers Radar
                  </Link>
                  <Link
                    to="/provider/active-job"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/5"
                  >
                    <Wrench className="w-4 h-4 text-blue-400" /> Active Job
                  </Link>
                </>
              )}

              <div className="pt-3 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full text-red-400 hover:text-red-300"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Log Out
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
