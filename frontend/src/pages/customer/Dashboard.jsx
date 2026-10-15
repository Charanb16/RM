import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Car,
  Clock,
  PlusCircle,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { assistanceApi } from '../../api/assistance';
import { vehiclesApi } from '../../api/vehicles';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge, { getStatusBadgeConfig } from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

export const CustomerDashboard = () => {
  const { user } = useAuth();

  const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['customer-requests'],
    queryFn: assistanceApi.getCustomerRequests,
  });

  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['customer-vehicles'],
    queryFn: vehiclesApi.getVehicles,
  });

  // Find active request if any
  const activeRequest = requests.find(
    (r) => !['completed', 'cancelled', 'no_providers_found'].includes(r.status)
  );

  return (
    <PageWrapper showSidebar maxWidth="default">
      <div className="space-y-8 animate-fadeInUp">
        {/* Header Greeting & Emergency SOS CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hello, {user?.first_name || 'Driver'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Your RoadMate emergency dispatch hub & vehicle telemetry
            </p>
          </div>

          <Link to="/customer/new-request">
            <Button
              variant="primary"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="shadow-xl shadow-amber-500/20"
            >
              Request Assistance Now
            </Button>
          </Link>
        </div>

        {/* Live Active Request Banner (if present) */}
        {activeRequest && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/20 via-red-500/15 to-navy-950 border border-amber-500/40 shadow-2xl relative overflow-hidden group">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="amber" dot pulse size="md">
                    LIVE DISPATCH ACTIVE
                  </Badge>
                  <span className="text-xs font-mono text-slate-400">
                    ID: #{activeRequest.id}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  {activeRequest.service?.name || 'Roadside Assistance'} In Progress
                </h3>
                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {activeRequest.pickup_address}
                  </span>
                  {activeRequest.eta_minutes && (
                    <span className="flex items-center gap-1 font-bold text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                      ETA: ~{activeRequest.eta_minutes} mins
                    </span>
                  )}
                </div>
              </div>

              <Link to={`/customer/requests/${activeRequest.id}`}>
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Track Live Status
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Overview Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Card className="flex items-center gap-4 p-5 border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                Registered Vehicles
              </p>
              <div className="text-2xl font-black text-white mt-0.5">
                {isLoadingVehicles ? <Spinner size="sm" /> : vehicles.length}
              </div>
            </div>
          </Card>

          <Card className="flex items-center gap-4 p-5 border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                Total Jobs Completed
              </p>
              <div className="text-2xl font-black text-white mt-0.5">
                {isLoadingRequests
                  ? <Spinner size="sm" />
                  : requests.filter((r) => r.status === 'completed').length}
              </div>
            </div>
          </Card>

          <Card className="flex items-center gap-4 p-5 border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                Account Protection
              </p>
              <div className="text-2xl font-black text-white mt-0.5">
                Active 24/7
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Service History & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Requests list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Recent Service Requests</h3>
              <Link
                to="/customer/history"
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoadingRequests ? (
              <div className="py-12 flex justify-center">
                <Spinner size="lg" className="text-amber-400" />
              </div>
            ) : requests.length === 0 ? (
              <Card className="text-center py-10 border border-white/10">
                <Clock className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <h4 className="text-base font-semibold text-white">No Previous Requests</h4>
                <p className="text-xs text-slate-400 mt-1">
                  You haven't requested roadside assistance yet.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {requests.slice(0, 4).map((req) => {
                  const badge = getStatusBadgeConfig(req.status);
                  return (
                    <Card
                      key={req.id}
                      hoverEffect
                      className="p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">
                            {req.service?.name || 'Roadside Rescue'}
                          </span>
                          <Badge variant={badge.variant} dot pulse={badge.pulse} size="sm">
                            {badge.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {req.pickup_address}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Total</span>
                          <span className="text-sm font-bold text-amber-400">
                            ${req.final_cost || req.estimated_cost_min}
                          </span>
                        </div>
                        <Link to={`/customer/requests/${req.id}`}>
                          <Button variant="outline" size="sm">
                            Details
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Garage sidebar quick view */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">My Vehicles</h3>
              <Link
                to="/customer/vehicles"
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                Manage
              </Link>
            </div>

            {isLoadingVehicles ? (
              <div className="py-8 flex justify-center">
                <Spinner size="md" className="text-amber-400" />
              </div>
            ) : vehicles.length === 0 ? (
              <Card className="text-center py-8 border border-white/10">
                <Car className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400 mb-3">No vehicle saved yet</p>
                <Link to="/customer/vehicles">
                  <Button variant="outline" size="sm">
                    Add Vehicle
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {vehicles.map((v) => (
                  <Card key={v.id} className="p-4 border border-white/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white text-sm">
                            {v.year} {v.make} {v.model}
                          </span>
                          {v.is_default && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-slate-400 mt-1">
                          Plate: {v.license_plate} • {v.color}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 text-amber-400">
                        <Car className="w-4 h-4" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default CustomerDashboard;
