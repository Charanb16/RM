import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Phone,
  MessageSquare,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  Car,
  XCircle,
  Play
} from "lucide-react";
import { assistanceApi, fallbackBooking } from "../../api/assistance";
import { useWebSocket } from "../../hooks/useWebSocket";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge, { getStatusBadgeConfig } from "../../components/ui/Badge";
import StatusTimeline from "../../components/ui/StatusTimeline";
import ProviderMap from "../../components/maps/ProviderMap";
export const CustomerBookingStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [simulatedStatus, setSimulatedStatus] = useState(null);
  const [etaSeconds, setEtaSeconds] = useState(480);
  const { data: request, isLoading } = useQuery({
    queryKey: ["booking-request", id],
    queryFn: () => assistanceApi.getRequestById(id || "req-8842"),
    initialData: fallbackBooking
  });
  const currentStatus = simulatedStatus || request?.status || "en_route";
  useWebSocket({
    urlPath: `/ws/assistance/${id}/`,
    onMessage: (msg) => {
      if (msg.type === "booking_status_updated") {
        queryClient.invalidateQueries({ queryKey: ["booking-request", id] });
      }
    }
  });
  const cancelMutation = useMutation({
    mutationFn: () => assistanceApi.cancelRequest(id || "req-8842"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-request", id] });
      setSimulatedStatus("cancelled");
    }
  });
  useEffect(() => {
    if (currentStatus !== "en_route" && currentStatus !== "accepted") return;
    const timer = setInterval(() => {
      setEtaSeconds((prev) => prev > 0 ? prev - 1 : 0);
    }, 1e3);
    return () => clearInterval(timer);
  }, [currentStatus]);
  const formatCountdown = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };
  const statusBadge = getStatusBadgeConfig(currentStatus);
  const handleSimulateNextStep = () => {
    const flow = [
      "requested",
      "searching",
      "offered",
      "accepted",
      "en_route",
      "arrived",
      "in_progress",
      "completed"
    ];
    const currentIndex = flow.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % flow.length;
    setSimulatedStatus(flow[nextIndex]);
  };
  const canCancel = ["requested", "searching", "offered"].includes(currentStatus);
  return <PageWrapper showSidebar maxWidth="default"><div className="space-y-8 animate-fadeInUp">{
    /* Top Status Banner with Pulsing Animation */
  }<div className="p-6 rounded-3xl glass-card border border-white/10 relative overflow-hidden"><div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"><div className="space-y-2"><div className="flex items-center gap-3"><Badge
    variant={statusBadge.variant}
    dot
    pulse={statusBadge.pulse}
    size="md"
    className="px-3.5 py-1 text-xs uppercase tracking-wider font-bold"
  >{statusBadge.label}</Badge><span className="text-xs font-mono text-slate-400">
                  Tracking Request #{request.id}</span></div><h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{request.service?.name || "Roadside Assistance"}</h1><p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-amber-400 shrink-0" />{request.pickup_address}</p></div>{
    /* Quick Demo Simulator Tool */
  }<div className="flex flex-wrap items-center gap-2"><Button
    variant="outline"
    size="sm"
    onClick={handleSimulateNextStep}
    leftIcon={<Play className="w-3.5 h-3.5 text-amber-400" />}
    className="bg-navy-950/80 text-xs border-amber-500/30 text-amber-300 hover:text-white"
    title="Click to advance status for demo testing"
  >
                Simulate Next Status Step
              </Button>{canCancel && <Button
    variant="danger"
    size="sm"
    onClick={() => cancelMutation.mutate()}
    isLoading={cancelMutation.isPending}
    leftIcon={<XCircle className="w-4 h-4" />}
  >
                  Cancel Request
                </Button>}</div></div></div>{
    /* Main Grid: Left Column (Map + Provider Card) | Right Column (Status Timeline) */
  }<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">{
    /* Left Column: Live Map & Assigned Provider Card */
  }<div className="lg:col-span-2 space-y-6">{
    /* Live Interactive Map */
  }<div><div className="flex items-center justify-between mb-3"><h3 className="text-base font-bold text-white flex items-center gap-2"><span>Live Vehicle Tracking</span><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /></h3>{["en_route", "accepted"].includes(currentStatus) && <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono"><Clock className="w-3.5 h-3.5" /><span>Est. Arrival: {formatCountdown(etaSeconds)}</span></div>}</div><ProviderMap
    customerLat={request.pickup_latitude}
    customerLng={request.pickup_longitude}
    customerAddress={request.pickup_address}
    providers={request.provider ? [request.provider] : []}
    className="h-[360px]"
  /></div>{
    /* Provider Details Card */
  }{request.provider && <Card className="p-6 border border-white/10"><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><div className="flex items-center gap-4"><div className="relative"><img
    src={request.provider.user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
    alt="Provider"
    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-lg shadow-amber-500/20"
  /><span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-navy-950" /></div><div><div className="flex items-center gap-2"><h4 className="text-lg font-bold text-white">{request.provider.user?.first_name} {request.provider.user?.last_name}</h4><span className="p-1 rounded-full bg-blue-500/20 text-blue-400"><ShieldCheck className="w-3.5 h-3.5" /></span></div><p className="text-xs text-slate-400">{request.provider.business_name}</p><div className="flex items-center gap-3 mt-1.5 text-xs text-slate-300"><span className="flex items-center gap-1 text-amber-400 font-bold"><Star className="w-3.5 h-3.5 fill-current" />{request.provider.rating_avg.toFixed(1)}</span><span>•</span><span>{request.provider.total_jobs} total jobs</span><span>•</span><span className="text-slate-400">{request.provider.vehicle_type}</span></div></div></div><div className="flex items-center gap-2 w-full sm:w-auto"><a
    href={`tel:${request.provider.user?.phone_number || "5552348901"}`}
    className="flex-1 sm:flex-initial"
  ><Button
    variant="primary"
    size="sm"
    leftIcon={<Phone className="w-4 h-4" />}
    className="w-full"
  >
                        Call Tech
                      </Button></a><Button
    variant="outline"
    size="sm"
    leftIcon={<MessageSquare className="w-4 h-4 text-amber-400" />}
  >
                      Message
                    </Button></div></div></Card>}{
    /* Vehicle Card */
  }{request.vehicle && <Card className="p-4 border border-white/10 flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-white/5 text-amber-400"><Car className="w-5 h-5" /></div><div><h5 className="text-sm font-bold text-white">{request.vehicle.year} {request.vehicle.make} {request.vehicle.model}</h5><p className="text-xs font-mono text-slate-400">
                      Plate: {request.vehicle.license_plate} • {request.vehicle.color}</p></div></div><div className="text-right"><span className="text-xs text-slate-400 block">Quoted Price</span><span className="text-sm font-bold text-amber-400">
                    ${request.estimated_cost_min} - ${request.estimated_cost_max}</span></div></Card>}</div>{
    /* Right Column: Visual Status Timeline */
  }<div className="space-y-4"><Card className="p-6 border border-white/10"><div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10"><h3 className="text-base font-bold text-white">Dispatch Milestones</h3><span className="text-xs text-amber-400 font-semibold font-mono">{currentStatus.toUpperCase()}</span></div>{
    /* Status Timeline Component */
  }<StatusTimeline currentStatus={currentStatus} /></Card>{
    /* Need Help Card */
  }<Card className="p-4 border border-white/5 text-center space-y-2"><p className="text-xs text-slate-400">
                Questions about your active dispatch or delay?
              </p><a
    href="tel:18005557623"
    className="text-xs font-bold text-amber-400 hover:text-amber-300 block font-mono"
  >
                Call Emergency Dispatch: 1-800-555-ROAD
              </a></Card></div></div></div></PageWrapper>;
};
export default CustomerBookingStatus;
