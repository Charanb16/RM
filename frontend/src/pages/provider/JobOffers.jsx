import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Radio,
  Clock,
  MapPin,
  Car,
  Check,
  X
} from "lucide-react";
import { assistanceApi, fallbackOffers } from "../../api/assistance";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
const OfferCard = ({
  offer,
  onAccept,
  onReject,
  isAccepting
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    const diff = Math.floor(
      (new Date(offer.expires_at).getTime() - Date.now()) / 1e3
    );
    return diff > 0 ? diff : 90;
  });
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => prev > 0 ? prev - 1 : 0);
    }, 1e3);
    return () => clearInterval(timer);
  }, []);
  const isExpired = secondsRemaining === 0;
  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };
  return <Card
    className={`p-6 border transition-all duration-300 ${isExpired ? "opacity-40 border-slate-800" : "border-amber-500/40 shadow-xl shadow-amber-500/10 hover:border-amber-400"}`}
  ><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10"><div><div className="flex items-center gap-2"><span className="font-bold text-lg text-white">{offer.request?.service?.name || "Roadside Dispatch"}</span><Badge variant="blue" size="sm">{offer.distance_km} km away
            </Badge></div><span className="text-xs font-mono text-slate-400">
            Request #{offer.request_id}</span></div>{
    /* Live Countdown Timer Badge */
  }<div
    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border ${isExpired ? "bg-red-950/40 text-red-400 border-red-500/40" : secondsRemaining <= 30 ? "bg-red-500/20 text-red-300 border-red-500/50 animate-pulse" : "bg-amber-500/20 text-amber-300 border-amber-500/50"}`}
  ><Clock className="w-4 h-4" /><span>{isExpired ? "EXPIRED" : `Expires in ${formatTimer(secondsRemaining)}`}</span></div></div>{
    /* Details Grid */
  }<div className="py-4 space-y-3 text-xs"><div className="flex items-start gap-2.5 text-slate-200"><MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /><div><span className="font-semibold text-white block">Breakdown Location</span><span className="text-slate-300">{offer.request?.pickup_address || "Market St & 4th St, San Francisco, CA"}</span></div></div>{offer.request?.vehicle && <div className="flex items-start gap-2.5 text-slate-200"><Car className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" /><div><span className="font-semibold text-white block">Vehicle</span><span className="text-slate-300">{offer.request.vehicle.year} {offer.request.vehicle.make}{" "}{offer.request.vehicle.model} (Plate: {offer.request.vehicle.license_plate})
              </span></div></div>}{offer.request?.notes && <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-slate-300 italic">
            "{offer.request.notes}"
          </div>}</div>{
    /* Pricing & Decision Footer */
  }<div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><span className="text-xs text-slate-400 block font-medium">Guaranteed Payout</span><div className="flex items-baseline gap-1"><span className="text-2xl font-black text-amber-400 font-mono">
              ${offer.quoted_price}</span><span className="text-[11px] text-slate-400">
              (~{offer.estimated_arrival_mins} min ETA)
            </span></div></div><div className="flex items-center gap-3"><Button
    variant="ghost"
    size="md"
    disabled={isExpired || isAccepting}
    onClick={() => onReject(offer)}
    leftIcon={<X className="w-4 h-4" />}
    className="text-slate-400 hover:text-red-400"
  >
            Decline
          </Button><Button
    variant="primary"
    size="md"
    disabled={isExpired}
    isLoading={isAccepting}
    onClick={() => onAccept(offer)}
    leftIcon={<Check className="w-4 h-4" />}
    className="px-6 shadow-lg shadow-amber-500/25"
  >
            Accept Job & Dispatch
          </Button></div></div></Card>;
};
export const ProviderJobOffers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeOffers, setActiveOffers] = useState(fallbackOffers);
  const [acceptingId, setAcceptingId] = useState(null);
  const { data: serverOffers } = useQuery({
    queryKey: ["incoming-offers"],
    queryFn: assistanceApi.getIncomingOffers
  });
  useEffect(() => {
    if (serverOffers && serverOffers.length > 0) {
      setActiveOffers(serverOffers);
    }
  }, [serverOffers]);
  const respondMutation = useMutation({
    mutationFn: ({ offerId, action }) => assistanceApi.respondToOffer(offerId, action),
    onSuccess: (_, variables) => {
      if (variables.action === "accept") {
        navigate("/provider/active-job");
      } else {
        setActiveOffers((prev) => prev.filter((o) => o.id !== variables.offerId));
      }
    },
    onSettled: () => {
      setAcceptingId(null);
    }
  });
  const handleAccept = (offer) => {
    setAcceptingId(offer.id);
    respondMutation.mutate({ offerId: offer.id, action: "accept" });
  };
  const handleReject = (offer) => {
    setActiveOffers((prev) => prev.filter((o) => o.id !== offer.id));
    respondMutation.mutate({ offerId: offer.id, action: "reject" });
  };
  return <PageWrapper showSidebar maxWidth="default"><div className="space-y-8 animate-fadeInUp">{
    /* Header */
  }<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10"><div><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" /><span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Live Dispatch Radar
              </span></div><h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Incoming Job Offers
            </h1><p className="text-xs sm:text-sm text-slate-400">
              Immediate distress calls from nearby stranded motorists. Fast response guaranteed.
            </p></div><div className="flex items-center gap-2"><span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Radar Active • 25 km Radius
            </span></div></div>{
    /* Offers List */
  }{activeOffers.length === 0 ? <Card className="text-center py-20 border border-white/10 max-w-lg mx-auto"><div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto mb-4 animate-pulse"><Radio className="w-8 h-8 text-amber-400" /></div><h3 className="text-lg font-bold text-white">Scanning For New Distress Calls</h3><p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-6">
              Your radar is actively listening for breakdowns in your operating sector. Keep this page open to hear dispatch alerts.
            </p><Button
    variant="outline"
    size="sm"
    onClick={() => setActiveOffers(fallbackOffers)}
  >
              Reload Simulated Offers
            </Button></Card> : <div className="grid grid-cols-1 gap-6">{activeOffers.map((offer) => <OfferCard
    key={offer.id}
    offer={offer}
    onAccept={handleAccept}
    onReject={handleReject}
    isAccepting={acceptingId === offer.id}
  />)}</div>}</div></PageWrapper>;
};
export default ProviderJobOffers;
