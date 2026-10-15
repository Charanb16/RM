import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Clock,
  MapPin,
  Calendar,
  Star,
  CheckCircle2,
  Search
} from "lucide-react";
import { assistanceApi } from "../../api/assistance";
import { reviewsApi } from "../../api/reviews";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge, { getStatusBadgeConfig } from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Spinner from "../../components/ui/Spinner";
export const CustomerBookingHistory = () => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewModalRequest, setReviewModalRequest] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittedReview, setIsSubmittedReview] = useState(false);
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["customer-history-requests"],
    queryFn: assistanceApi.getCustomerRequests
  });
  const reviewMutation = useMutation({
    mutationFn: () => reviewsApi.submitReview({
      request_id: reviewModalRequest?.id || "",
      provider_id: reviewModalRequest?.provider_id || "prov-1",
      rating,
      comment
    }),
    onSuccess: () => {
      setIsSubmittedReview(true);
      setTimeout(() => {
        setIsSubmittedReview(false);
        setReviewModalRequest(null);
        setComment("");
      }, 1500);
    }
  });
  const filteredRequests = requests.filter((req) => {
    const matchesFilter = filterStatus === "all" ? true : filterStatus === "completed" ? req.status === "completed" : filterStatus === "active" ? !["completed", "cancelled", "no_providers_found"].includes(req.status) : req.status === filterStatus;
    const matchesSearch = req.service?.name.toLowerCase().includes(searchTerm.toLowerCase()) || req.pickup_address.toLowerCase().includes(searchTerm.toLowerCase()) || req.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  return <PageWrapper showSidebar maxWidth="default"><div className="space-y-8 animate-fadeInUp">{
    /* Header */
  }<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10"><div><h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Service History
            </h1><p className="text-xs sm:text-sm text-slate-400 mt-1">
              Complete archive of your roadside assistance requests and digital receipts
            </p></div><Link to="/customer/new-request"><Button variant="primary" size="md">
              New Request
            </Button></Link></div>{
    /* Filter & Search Bar */
  }<div className="flex flex-col sm:flex-row items-center justify-between gap-4"><div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">{["all", "completed", "active", "cancelled"].map((tab) => <button
    key={tab}
    onClick={() => setFilterStatus(tab)}
    className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${filterStatus === tab ? "bg-amber-500 text-navy-950 font-bold shadow-md shadow-amber-500/20" : "glass text-slate-400 hover:text-white"}`}
  >{tab}</button>)}</div><div className="relative w-full sm:w-64"><Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input
    type="text"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    placeholder="Search address or service..."
    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input"
  /></div></div>{
    /* Requests List */
  }{isLoading ? <div className="py-20 flex justify-center"><Spinner size="lg" className="text-amber-400" /></div> : filteredRequests.length === 0 ? <Card className="text-center py-16 border border-white/10"><Clock className="w-12 h-12 text-slate-500 mx-auto mb-3" /><h3 className="text-lg font-bold text-white">No Matching Service Records</h3><p className="text-xs text-slate-400 mt-1">
              No previous bookings matched your search or status criteria.
            </p></Card> : <div className="space-y-4">{filteredRequests.map((req) => {
    const badge = getStatusBadgeConfig(req.status);
    return <Card
      key={req.id}
      hoverEffect
      className="p-6 border border-white/10 space-y-4"
    ><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold"><Clock className="w-5 h-5" /></div><div><div className="flex items-center gap-2"><h4 className="text-base font-bold text-white">{req.service?.name || "Roadside Service"}</h4><span className="text-xs font-mono text-slate-400">
                            #{req.id}</span></div><p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5"><Calendar className="w-3.5 h-3.5 text-slate-500" />{new Date(req.created_at).toLocaleDateString(void 0, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })}</p></div></div><div className="flex items-center gap-3"><Badge variant={badge.variant} dot pulse={badge.pulse} size="md">{badge.label}</Badge><span className="text-base font-bold text-amber-400 font-mono">
                        ${req.final_cost || req.estimated_cost_min}</span></div></div>{
      /* Body details */
    }<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs"><div><span className="text-slate-400 block font-medium">Pickup Site</span><span className="text-slate-200 flex items-center gap-1 mt-0.5 font-medium"><MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />{req.pickup_address}</span></div><div><span className="text-slate-400 block font-medium">Vehicle Serviced</span><span className="text-slate-200 mt-0.5 block font-medium">{req.vehicle ? `${req.vehicle.year} ${req.vehicle.make} ${req.vehicle.model} (${req.vehicle.license_plate})` : "Tesla Model 3 Performance"}</span></div><div><span className="text-slate-400 block font-medium">Provider Unit</span><span className="text-slate-200 mt-0.5 block font-medium">{req.provider?.business_name || "Apex Rapid Roadside Pros"}</span></div></div>{
      /* Card actions */
    }<div className="pt-3 border-t border-white/5 flex items-center justify-between"><Link
      to={`/customer/requests/${req.id}`}
      className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
    >
                      View Live Tracker & Route &rarr;
                    </Link>{req.status === "completed" && <Button
      variant="outline"
      size="sm"
      onClick={() => setReviewModalRequest(req)}
      leftIcon={<Star className="w-3.5 h-3.5 text-amber-400" />}
    >
                        Rate Provider
                      </Button>}</div></Card>;
  })}</div>}{
    /* Review Modal */
  }<Modal
    isOpen={Boolean(reviewModalRequest)}
    onClose={() => setReviewModalRequest(null)}
    title="Rate & Review Provider"
    subtitle={`Provide feedback for ${reviewModalRequest?.provider?.business_name || "your technician"}`}
  >{isSubmittedReview ? <div className="py-8 text-center space-y-2"><CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" /><h4 className="text-lg font-bold text-white">Thank You!</h4><p className="text-xs text-slate-300">
                Your review has been submitted to the provider profile.
              </p></div> : <div className="space-y-4"><div><label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Service Rating
                </label><div className="flex items-center gap-2">{[1, 2, 3, 4, 5].map((star) => <button
    key={star}
    type="button"
    onClick={() => setRating(star)}
    className="p-1 rounded-lg transition-transform hover:scale-110"
  ><Star
    className={`w-7 h-7 ${star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-600"}`}
  /></button>)}<span className="ml-2 text-sm font-bold text-amber-400 font-mono">{rating}.0 / 5.0
                  </span></div></div><div><label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Your Feedback
                </label><textarea
    rows={4}
    value={comment}
    onChange={(e) => setComment(e.target.value)}
    placeholder="How was the response speed, professionalism, and equipment quality?"
    className="w-full rounded-xl p-3 text-sm glass-input placeholder-slate-500 resize-none"
  /></div><div className="pt-2 flex items-center justify-end gap-3"><Button
    variant="ghost"
    size="md"
    onClick={() => setReviewModalRequest(null)}
  >
                  Cancel
                </Button><Button
    variant="primary"
    size="md"
    onClick={() => reviewMutation.mutate()}
    isLoading={reviewMutation.isPending}
  >
                  Submit Review
                </Button></div></div>}</Modal></div></PageWrapper>;
};
export default CustomerBookingHistory;
