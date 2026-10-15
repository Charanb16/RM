import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Phone,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Navigation,
  ArrowRight,
  Wrench
} from "lucide-react";
import { assistanceApi, fallbackBooking } from "../../api/assistance";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge, { getStatusBadgeConfig } from "../../components/ui/Badge";
import StatusTimeline from "../../components/ui/StatusTimeline";
import ProviderMap from "../../components/maps/ProviderMap";
export const ProviderActiveJob = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: job = fallbackBooking, isLoading } = useQuery({
    queryKey: ["provider-active-job"],
    queryFn: assistanceApi.getActiveJob,
    initialData: fallbackBooking
  });
  const [currentStatus, setCurrentStatus] = useState(job.status || "en_route");
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus) => assistanceApi.updateJobStatus(job.id, newStatus),
    onSuccess: (data) => {
      setCurrentStatus(data.status);
      queryClient.invalidateQueries({ queryKey: ["provider-active-job"] });
    }
  });
  const handleAdvanceStatus = () => {
    let nextStatus = currentStatus;
    if (currentStatus === "accepted") nextStatus = "en_route";
    else if (currentStatus === "en_route") nextStatus = "arrived";
    else if (currentStatus === "arrived") nextStatus = "in_progress";
    else if (currentStatus === "in_progress") nextStatus = "completed";
    updateStatusMutation.mutate(nextStatus);
  };
  const getNextActionConfig = () => {
    switch (currentStatus) {
      case "accepted":
        return {
          label: "Start Driving (Mark En Route)",
          icon: Navigation,
          variant: "primary"
        };
      case "en_route":
        return {
          label: "Confirm Arrival at Vehicle",
          icon: MapPin,
          variant: "primary"
        };
      case "arrived":
        return {
          label: "Start Service / Tow Prep",
          icon: Wrench,
          variant: "secondary"
        };
      case "in_progress":
        return {
          label: "Complete Job & Finalize Payout",
          icon: CheckCircle2,
          variant: "success"
        };
      case "completed":
        return {
          label: "Job Finished \u2022 Ready For Next Call",
          icon: CheckCircle2,
          variant: "outline"
        };
      default:
        return {
          label: "Advance Status",
          icon: ArrowRight,
          variant: "primary"
        };
    }
  };
  const nextAction = getNextActionConfig();
  const badgeConfig = getStatusBadgeConfig(currentStatus);
  return <PageWrapper showSidebar maxWidth="default"><div className="space-y-8 animate-fadeInUp">{
    /* Header */
  }<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10"><div><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Active Job Console
              </span></div><h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Dispatch #{job.id}</h1><p className="text-xs sm:text-sm text-slate-400">
              Live progression and on-site telematics for technician unit
            </p></div><div className="flex items-center gap-3"><Badge variant={badgeConfig.variant} dot pulse={badgeConfig.pulse} size="md">{badgeConfig.label}</Badge></div></div>{
    /* Primary Action Hero Bar */
  }<div className="p-6 rounded-3xl glass-card border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-r from-navy-950 via-slate-900 to-navy-950"><div><span className="text-xs text-slate-400 uppercase font-semibold tracking-wider block">
              Required Next Milestone
            </span><h3 className="text-xl font-bold text-white mt-1">{currentStatus === "completed" ? "Job Successfully Completed & Billed" : `Next Step: ${nextAction.label}`}</h3><p className="text-xs text-slate-300 mt-1">
              Tap the button to send live telemetry update to the motorist.
            </p></div><div>{currentStatus === "completed" ? <Button
    variant="primary"
    size="lg"
    onClick={() => navigate("/provider/offers")}
  >
                Return to Job Radar
              </Button> : <Button
    variant={nextAction.variant}
    size="lg"
    isLoading={updateStatusMutation.isPending}
    onClick={handleAdvanceStatus}
    leftIcon={<nextAction.icon className="w-5 h-5" />}
    className="px-8 shadow-xl shadow-amber-500/20"
  >{nextAction.label}</Button>}</div></div>{
    /* Main Grid: Left (Map & Customer) | Right (Timeline & Details) */
  }<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">{
    /* Left Column */
  }<div className="lg:col-span-2 space-y-6">{
    /* Live Navigation Map */
  }<div><div className="flex items-center justify-between mb-3"><h3 className="text-base font-bold text-white flex items-center gap-2"><Navigation className="w-4 h-4 text-amber-400" /><span>Turn-by-Turn Pickup Route</span></h3><a
    href={`https://www.google.com/maps/dir/?api=1&destination=${job.pickup_latitude},${job.pickup_longitude}`}
    target="_blank"
    rel="noopener noreferrer"
    className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
  >
                  Open in Google Maps &rarr;
                </a></div><ProviderMap
    customerLat={job.pickup_latitude}
    customerLng={job.pickup_longitude}
    customerAddress={job.pickup_address}
    className="h-[380px]"
  /></div>{
    /* Motorist / Customer Card */
  }<Card className="p-6 border border-white/10 space-y-4"><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center font-bold text-navy-950 text-xl shadow-lg">{job.customer?.first_name?.[0] || "A"}</div><div><h4 className="text-lg font-bold text-white">{job.customer?.first_name} {job.customer?.last_name}</h4><p className="text-xs text-slate-400">
                      Verified Motorist • San Francisco Bay
                    </p><p className="text-xs text-amber-400 font-mono mt-1">{job.customer?.phone_number || "+1 (555) 782-9901"}</p></div></div><div className="flex items-center gap-2 w-full sm:w-auto"><a
    href={`tel:${job.customer?.phone_number || "5557829901"}`}
    className="flex-1 sm:flex-initial"
  ><Button
    variant="primary"
    size="sm"
    leftIcon={<Phone className="w-4 h-4" />}
    className="w-full"
  >
                      Call Driver
                    </Button></a><Button
    variant="outline"
    size="sm"
    leftIcon={<MessageSquare className="w-4 h-4 text-amber-400" />}
  >
                    SMS
                  </Button></div></div>{
    /* Notes from customer */
  }{job.notes && <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300"><span className="font-semibold text-white block mb-1">
                    Customer Reported Details:
                  </span><p className="italic">"{job.notes}"</p></div>}</Card>{
    /* Vehicle Details */
  }{job.vehicle && <Card className="p-5 border border-white/10"><h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-3">
                  Vehicle Under Service
                </h4><div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs"><div><span className="text-slate-400 block">Make & Model</span><span className="font-semibold text-white mt-0.5 block">{job.vehicle.year} {job.vehicle.make} {job.vehicle.model}</span></div><div><span className="text-slate-400 block">License Plate</span><span className="font-mono font-bold text-amber-400 mt-0.5 block">{job.vehicle.license_plate}</span></div><div><span className="text-slate-400 block">Body Color</span><span className="font-semibold text-white mt-0.5 block capitalize">{job.vehicle.color}</span></div><div><span className="text-slate-400 block">Drive Class</span><span className="font-semibold text-white mt-0.5 block uppercase">{job.vehicle.vehicle_type}</span></div></div></Card>}</div>{
    /* Right Column: Timeline & Payout */
  }<div className="space-y-6">{
    /* Payout Summary */
  }<Card className="p-6 border border-white/10 space-y-3"><h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 pb-2 border-b border-white/10">
                Guaranteed Provider Payout
              </h4><div className="flex items-baseline justify-between"><span className="text-xs text-slate-300">Service Fee Quoted</span><span className="text-2xl font-black text-amber-400 font-mono">
                  ${job.estimated_cost_min.toFixed(2)}</span></div><p className="text-[11px] text-slate-400 leading-relaxed">
                Direct deposit initiated immediately upon customer digital signature and job completion.
              </p></Card>{
    /* Live Status Timeline */
  }<Card className="p-6 border border-white/10 space-y-4"><h4 className="text-sm font-bold uppercase tracking-wider text-white pb-2 border-b border-white/10">
                Milestones Status
              </h4><StatusTimeline currentStatus={currentStatus} /></Card></div></div></div></PageWrapper>;
};
export default ProviderActiveJob;
