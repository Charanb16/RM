import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, User, Phone, Briefcase, Wrench, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import PageWrapper from '../../components/layout/PageWrapper';

const registerSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone_number: z.string().min(10, 'Valid phone number required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  business_name: z.string().optional(),
});

export const Register = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'provider' ? 'provider' : 'customer';
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      password: '',
      business_name: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const res = await registerUser({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone_number: data.phone_number,
        password: data.password,
        role: selectedRole,
        business_name: data.business_name,
      });

      if (res.user.role === 'provider') {
        navigate('/provider/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } catch {
      // Handled in auth hook fallback
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper maxWidth="narrow" className="py-12 flex items-center justify-center">
      <div className="w-full max-w-lg mx-auto space-y-6 animate-fadeInUp">
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Your Account</h2>
          <p className="text-xs text-slate-400">
            Join the fastest-growing modern roadside network
          </p>
        </div>

        {/* Account Type Selector */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-navy-950/80 border border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSelectedRole('customer')}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${
              selectedRole === 'customer'
                ? 'bg-amber-500 text-navy-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Driver / Motorist</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('provider')}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${
              selectedRole === 'provider'
                ? 'bg-amber-500 text-navy-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Tow / Service Provider</span>
          </button>
        </div>

        {/* Register Card */}
        <Card className="border border-white/10 shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="Marcus"
                startIcon={<User className="w-4 h-4" />}
                error={errors.first_name?.message}
                {...register('first_name')}
              />
              <Input
                label="Last Name"
                placeholder="Vance"
                startIcon={<User className="w-4 h-4" />}
                error={errors.last_name?.message}
                {...register('last_name')}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="marcus@apexpros.io"
              startIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Phone Number"
              placeholder="+1 (555) 000-0000"
              startIcon={<Phone className="w-4 h-4" />}
              error={errors.phone_number?.message}
              {...register('phone_number')}
            />

            {selectedRole === 'provider' && (
              <Input
                label="Business / Fleet Name"
                placeholder="Apex Heavy Recovery LLC"
                startIcon={<Briefcase className="w-4 h-4" />}
                error={errors.business_name?.message}
                {...register('business_name')}
              />
            )}

            <Input
              label="Create Password"
              type="password"
              placeholder="••••••••"
              startIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-start gap-2 pt-1 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                By registering, you agree to RoadMate's Terms of Service and Privacy Policy. All providers must clear verification.
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Complete Registration
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-amber-400 hover:text-amber-300 font-semibold">
            Sign in here
          </Link>
        </p>
      </div>
    </PageWrapper>
  );
};

export default Register;
