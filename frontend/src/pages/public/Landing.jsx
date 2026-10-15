import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  ShieldCheck,
  Clock,
  MapPin,
  Zap,
  Disc,
  Truck,
  Fuel,
  Key,
  Anchor,
  Star,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  PhoneCall,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageWrapper from '../../components/layout/PageWrapper';

export const Landing = () => {
  const services = [
    {
      title: 'Flat Tire & Puncture',
      desc: 'Rapid on-site wheel swap or vulcanized plug repair by mobile tire technicians.',
      icon: Disc,
      price: 'From $49',
      color: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Battery Jumpstart',
      desc: 'High-amperage 12V/24V booster jumpstart, alternator test, and voltage diagnosis.',
      icon: Zap,
      price: 'From $39',
      color: 'from-yellow-400 to-amber-500',
    },
    {
      title: 'Flatbed Towing',
      desc: 'Damage-free tilt-tray towing for standard, EV, exotic, or accident vehicles.',
      icon: Truck,
      price: 'From $89',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Emergency Fuel',
      desc: 'Direct dispatch with 2-3 gallons of Unleaded, Premium, or Ultra-Low Diesel.',
      icon: Fuel,
      price: 'From $35',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Lockout Assistance',
      desc: 'Zero-scratch pneumatic air-wedge entry for modern high-security automotive locks.',
      icon: Key,
      price: 'From $45',
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Winch & Extraction',
      desc: 'Heavy off-road cable extraction from ditches, mud, snowdrifts, or steep embankments.',
      icon: Anchor,
      price: 'From $110',
      color: 'from-red-500 to-rose-600',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Request in 30 Seconds',
      description:
        'Drop a pin on your live breakdown location, select your vehicle, and choose the exact service needed.',
      icon: MapPin,
    },
    {
      step: '02',
      title: 'Instant Provider Match',
      description:
        'Our smart dispatch algorithm broadcasts to verified pros nearby. Watch them accept and track their live GPS ETA.',
      icon: Clock,
    },
    {
      step: '03',
      title: 'Fixed & Back on the Road',
      description:
        'Certified mechanic arrives on site, performs the job, and handles frictionless digital payment with zero surge markups.',
      icon: CheckCircle2,
    },
  ];

  return (
    <PageWrapper maxWidth="full" className="p-0 sm:p-0 lg:p-0">
      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden text-center">
        {/* Glow backdrop circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-amber-500/15 via-red-500/10 to-blue-500/15 blur-[120px] pointer-events-none rounded-full" />

        {/* Live Pill Banner */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-amber-500/30 text-amber-300 text-xs font-semibold mb-8 animate-fadeInUp">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Average Arrival Time Under 14 Minutes Across San Francisco Bay</span>
          <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1] animate-fadeInUp">
          Stranded? <br />
          <span className="gradient-text">Help is on the Way.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed animate-fadeInUp">
          On-demand roadside assistance powered by live GPS dispatch. Instant quotes, certified local mechanics, and 24/7 flatbed recovery without costly annual subscriptions.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeInUp">
          <Link to="/customer/new-request" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto text-base px-8 py-4 shadow-xl shadow-amber-500/25"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Get Help Now
            </Button>
          </Link>
          <Link to="/register?role=provider" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base px-8 py-4"
              leftIcon={<Truck className="w-5 h-5 text-amber-400" />}
            >
              Join as Provider
            </Button>
          </Link>
        </div>

        {/* Live stats ticker */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { label: 'Verified Providers', value: '500+' },
            { label: 'Jobs Completed', value: '10,000+' },
            { label: 'Avg Arrival Time', value: '< 15 Mins' },
            { label: 'Customer Rating', value: '4.95 / 5.0' },
          ].map((stat, i) => (
            <div
              key={i}
              className="glass p-5 rounded-2xl border border-white/5 text-center group hover:border-amber-500/20 transition-all duration-300"
            >
              <div className="text-2xl sm:text-3xl font-black text-white group-hover:text-amber-400 transition-colors">
                {stat.value}
              </div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-navy-950/60 border-t border-b border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Immediate Response Fleet
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              Comprehensive Roadside Support
            </h2>
            <p className="text-slate-400 mt-3 text-sm sm:text-base">
              Every unit in our network is equipped with commercial-grade jump starters, hydraulic winches, and vulcanizing tire equipment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card
                  key={index}
                  hoverEffect
                  className="flex flex-col justify-between group p-7 border border-white/10 hover:border-amber-500/40"
                >
                  <div>
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-amber-400 font-bold text-sm">{item.price}</span>
                    <Link
                      to="/customer/new-request"
                      className="text-xs font-semibold text-slate-300 group-hover:text-white flex items-center gap-1 transition-colors"
                    >
                      Order Now <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Frictionless Dispatch
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            How RoadMate Works
          </h2>
          <p className="text-slate-400 mt-3 text-sm sm:text-base">
            Skip the agonizing 45-minute phone queues. Get assistance dispatched to your exact GPS coordinates in three intuitive steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((st, i) => {
            const Icon = st.icon;
            return (
              <div
                key={i}
                className="glass-card rounded-2xl p-8 border border-white/10 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300"
              >
                <div className="text-5xl font-black text-white/10 absolute top-4 right-4 group-hover:text-amber-500/20 transition-colors">
                  {st.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{st.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{st.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Network / Trust Section */}
      <section id="network" className="py-20 bg-gradient-to-b from-navy-900 to-navy-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-3xl p-8 sm:p-12 border border-white/10 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold mb-4 border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4" /> 100% Background Checked & Insured
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                  The Safest Hands on Every Mile of the Highway.
                </h2>
                <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                  Every roadside operator in the RoadMate network undergoes strict background vetting, vehicle inspection, and certified mechanical competency exams.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    'Live GPS driver tracking with real-time ETA updates',
                    'Transparent flat pricing — no unexpected hook-up or per-mile spikes',
                    'All major insurance & roadside coverage reimbursement receipts',
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <Link to="/customer/new-request">
                    <Button variant="primary" size="md">
                      Get Emergency Help
                    </Button>
                  </Link>
                  <a href="tel:18005557623">
                    <Button variant="outline" size="md" leftIcon={<PhoneCall className="w-4 h-4 text-amber-400" />}>
                      1-800-555-ROAD
                    </Button>
                  </a>
                </div>
              </div>

              {/* Review showcase card */}
              <div className="space-y-4">
                <div className="glass p-5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-blue-600/30 flex items-center justify-center font-bold text-xs text-blue-300">
                        MR
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">Maya Reynolds</div>
                        <div className="text-[11px] text-slate-400">Tesla Model Y • Flat Tire</div>
                      </div>
                    </div>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 italic">
                    "Tire blew out on I-80 during heavy rain. RoadMate had a flatbed truck to my location in 11 minutes. Total lifesaver!"
                  </p>
                </div>

                <div className="glass p-5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-emerald-600/30 flex items-center justify-center font-bold text-xs text-emerald-300">
                        TK
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">Trevor King</div>
                        <div className="text-[11px] text-slate-400">BMW M3 • Battery Jumpstart</div>
                      </div>
                    </div>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 italic">
                    "Super clean UI. I could see the technician Marcus driving on the map toward my underground garage in real-time."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-navy-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-navy-950 stroke-[2.5]" />
            </div>
            <span className="font-bold text-white text-base">
              ROAD<span className="text-amber-400">MATE</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link to="/customer/new-request" className="hover:text-white transition-colors">
              Dispatch
            </Link>
            <Link to="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/register?role=provider" className="hover:text-white transition-colors">
              Provider Application
            </Link>
            <a href="#services" className="hover:text-white transition-colors">
              Services
            </a>
          </div>

          <div className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} RoadMate Technologies Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </PageWrapper>
  );
};

export default Landing;
