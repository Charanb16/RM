import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Wrench, Shield, ArrowRight, UserCheck, Truck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import PageWrapper from '../../components/layout/PageWrapper';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'alex.rivera@example.com',
      password: 'password123',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await login({
        email: data.email,
        password: data.password,
        role: selectedRole,
      });

      const redirectTarget =
        location.state?.from?.pathname ||
        (res.user.role === 'provider' ? '/provider/dashboard' : '/customer/dashboard');

      navigate(redirectTarget, { replace: true });
    } catch {
      setErrorMessage('Invalid credentials. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (role) => {
    setSelectedRole(role);
    if (role === 'customer') {
      setValue('email', 'alex.rivera@example.com');
      setValue('password', 'password123');
    } else {
      setValue('email', 'marcus.vance@apexpros.io');
      setValue('password', 'password123');
    }
  };

  return (
    <PageWrapper maxWidth="narrow" className="flex items-center justify-center py-12">
      <div className="w-full max-w-md mx-auto space-y-6 animate-fadeInUp">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Wrench className="w-5 h-5 text-navy-950 stroke-[2.5]" />
            </div>
            <span className="text-2xl font-black text-white">
              ROAD<span className="text-amber-400">MATE</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-400">
            Sign in to access your roadside dispatch portal and live bookings
          </p>
        </div>

        {/* Role toggle tabs */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-navy-950/80 border border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleQuickDemo('customer')}
            className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              selectedRole === 'customer'
                ? 'bg-amber-500 text-navy-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Driver / Customer</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('provider')}
            className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              selectedRole === 'provider'
                ? 'bg-amber-500 text-navy-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Service Provider</span>
          </button>
        </div>

        {/* Login Card */}
        <Card className="border border-white/10 shadow-2xl p-6 sm:p-8">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              startIcon={<Mail className="w-4 h-4" />}
              placeholder="you@domain.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              startIcon={<Lock className="w-4 h-4" />}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-navy-950"
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-amber-400 hover:text-amber-300 font-medium">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to {selectedRole === 'provider' ? 'Provider Hub' : 'Account'}
            </Button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
              Fast Evaluator Quick-Sign-In
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('customer')}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Demo Customer</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('provider')}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Truck className="w-3.5 h-3.5 text-blue-400" />
                <span>Demo Provider</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Footer link */}
        <p className="text-center text-xs text-slate-400">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-amber-400 hover:text-amber-300 font-semibold">
            Create account
          </Link>
        </p>
      </div>
    </PageWrapper>
  );
};

export default Login;
