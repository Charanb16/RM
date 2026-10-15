import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Star,
  Radio,
  Power,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  MapPin
} from "lucide-react";
import { providersApi, fallbackProviders } from "../../api/providers";
import { assistanceApi } from "../../api/assistance";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
export const ProviderDashboard = () => {
  const queryClient = useQueryClient();
  const [isOnlineState, setIsOnlineState] = useState(true);
  const { data: profile = fallbackProviders[0], isLoading: isLoadingProfile } = useQuery({
    queryKey: ["provider-profile"],
    queryFn: () => providersApi.getProfile()
  });
  const { data: offers = [] } = useQuery({
    queryKey: ["provider-offers"],
    queryFn: assistanceApi.getIncomingOffers
  });
  const { data: activeJob } = useQuery({
    queryKey: ["provider-active-job"],
    queryFn: assistanceApi.getActiveJob
  });
  const toggleOnlineMutation = useMutation({
    mutationFn: (newStatus) => providersApi.toggleOnlineStatus(newStatus),
    onSuccess: (data) => {
      setIsOnlineState(data.is_online);
      queryClient.invalidateQueries({ queryKey: ["provider-profile"] });
    }
  });
  const handleToggleOnline = () => {
    toggleOnlineMutation.mutate(!isOnlineState);
  };
  return <PageWrapper showSidebar maxWidth="default"><div className="space-y-8 animate-fadeInUp">{
    /* Header with Online/Offline Toggle Switch */
  }<div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"><div className="space-y-1"><div className="flex items-center gap-2"><span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                RoadMate Certified Dispatch
              </span><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE FLEET
              </span></div><h1 className="text-2xl sm:text-3xl font-extrabold text-white">{profile.business_name}</h1><p className="text-xs sm:text-sm text-slate-400">
              Unit: {profile.vehicle_type} • Radius: {profile.service_radius_km} km
            </p></div>{
    /* Interactive Online Toggle Button */
  }<div className="flex items-center gap-4 bg-navy-950/80 p-2.5 rounded-2xl border border-white/10"><div className="text-right"><span className="text-xs font-bold block text-white">{isOnlineState ? "Dispatch Online" : "Currently Offline"}</span><span className="text-[11px] text-slate-400">{isOnlineState ? "Receiving local distress calls" : "Radar paused"}</span></div><button
    onClick={handleToggleOnline}
    disabled={toggleOnlineMutation.isPending}
    className={`relative inline-flex h-10 w-20 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${isOnlineState ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" : "bg-slate-700"}`}
    role="switch"
    aria-checked={isOnlineState}
  ><span
    className={`pointer-events-none inline-block h-9 w-9 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out flex items-center justify-center ${isOnlineState ? "translate-x-10 text-emerald-600" : "translate-x-0 text-slate-500"}`}
  ><Power className="w-4 h-4 stroke-[2.5]" /></span></button></div></div>{
    /* Stats Grid */
  }<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"><Card className="p-5 border border-white/10 flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0"><DollarSign className="w-6 h-6" /></div><div><span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Today's Earnings
              </span><span className="text-2xl font-black text-white">$420.00</span><span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium mt-0.5"><TrendingUp className="w-3 h-3" /> +18% vs yesterday
              </span></div></Card><Card className="p-5 border border-white/10 flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0"><CheckCircle2 className="w-6 h-6" /></div><div><span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Total Jobs Done
              </span><span className="text-2xl font-black text-white">{profile.total_jobs}</span><span className="text-[11px] text-slate-400 font-medium mt-0.5">
                Verified completions
              </span></div></Card><Card className="p-5 border border-white/10 flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0"><Star className="w-6 h-6 fill-current" /></div><div><span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Driver Rating
              </span><span className="text-2xl font-black text-white">{profile.rating_avg.toFixed(1)} / 5.0
              </span><span className="text-[11px] text-blue-400 font-medium mt-0.5">
                Top 5% Partner in SF
              </span></div></Card><Card className="p-5 border border-white/10 flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0"><Clock className="w-6 h-6" /></div><div><span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Avg Response Time
              </span><span className="text-2xl font-black text-white">11.4 min</span><span className="text-[11px] text-slate-400 font-medium mt-0.5">
                Highway dispatch standard
              </span></div></Card></div>{
    /* Incoming Radar Alert Banner */
  }{offers.length > 0 && <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/20 via-navy-900 to-navy-950 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 animate-pulse"><Radio className="w-6 h-6" /></div><div><h4 className="text-base font-bold text-white">{offers.length} Urgent Dispatch Offers Pending On Your Radar
                </h4><p className="text-xs text-slate-300">
                  Stranded drivers within {profile.service_radius_km} km are awaiting emergency acceptance.
                </p></div></div><Link to="/provider/offers"><Button
    variant="primary"
    size="md"
    rightIcon={<ArrowRight className="w-4 h-4" />}
  >
                Review Incoming Offers
              </Button></Link></div>}{
    /* Two Column Section: Active Job Card & Recent Performance */
  }<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{
    /* Active Job Preview */
  }<div className="lg:col-span-2 space-y-4"><div className="flex items-center justify-between"><h3 className="text-lg font-bold text-white">Current Active Dispatch</h3><Link
    to="/provider/active-job"
    className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
  >
                Open Full Work Console &rarr;
              </Link></div>{activeJob ? <Card className="p-6 border border-white/10 space-y-4"><div className="flex items-start justify-between"><div><span className="text-xs font-mono text-slate-400">
                      JOB #{activeJob.id}</span><h4 className="text-lg font-bold text-white mt-1">{activeJob.service?.name}</h4><p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1"><MapPin className="w-4 h-4 text-amber-400" />{activeJob.pickup_address}</p></div><Badge variant="amber" dot pulse size="md">{activeJob.status.toUpperCase()}</Badge></div><div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"><div><span className="text-slate-400 block">Customer</span><span className="font-semibold text-white">{activeJob.customer?.first_name} {activeJob.customer?.last_name}</span></div><div><span className="text-slate-400 block">Vehicle</span><span className="font-semibold text-white">{activeJob.vehicle?.year} {activeJob.vehicle?.make} {activeJob.vehicle?.model}</span></div><div className="text-right"><span className="text-slate-400 block">Quoted Price</span><span className="font-bold text-amber-400 font-mono text-sm">
                      ${activeJob.estimated_cost_min}</span></div></div><div className="pt-2 flex justify-end"><Link to="/provider/active-job"><Button variant="primary" size="md">
                      Update Job Status & Navigation
                    </Button></Link></div></Card> : <Card className="text-center py-12 border border-white/10"><ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2" /><h4 className="text-base font-semibold text-white">No Active Job</h4><p className="text-xs text-slate-400 mt-1">
                  You are currently available for dispatch assignment.
                </p></Card>}</div>{
    /* Quick Operations Sidebar */
  }<div className="space-y-4"><h3 className="text-lg font-bold text-white">Coverage Info</h3><Card className="p-5 border border-white/10 space-y-4 text-xs"><div><span className="text-slate-400 block">Assigned Unit Equipment</span><span className="font-bold text-white text-sm block mt-0.5">
                  Tilt-Tray Hydraulic Flatbed
                </span></div><div><span className="text-slate-400 block">Authorized Services</span><div className="flex flex-wrap gap-1.5 mt-2">{profile.services_offered.map((slug) => <span
    key={slug}
    className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-medium text-slate-300 capitalize"
  >{slug}</span>)}</div></div><div className="pt-3 border-t border-white/10 space-y-1"><span className="text-slate-400 block">Inspection & Compliance</span><span className="text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> DOT #883921 Verified
                </span></div></Card></div></div></div></PageWrapper>;
};
export default ProviderDashboard;
