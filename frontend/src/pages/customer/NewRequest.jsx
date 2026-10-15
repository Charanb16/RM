import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Car,
  Wrench,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Shield,
  Disc,
  Zap,
  Truck,
  Fuel,
  Key,
  Anchor,
  Clock,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { vehiclesApi } from '../../api/vehicles';
import { servicesApi, fallbackServices } from '../../api/services';
import { assistanceApi } from '../../api/assistance';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LocationPicker from '../../components/maps/LocationPicker';
import Spinner from '../../components/ui/Spinner';

export const CustomerNewRequest = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [pickupLat, setPickupLat] = useState(37.7749);
  const [pickupLng, setPickupLng] = useState(-122.4194);
  const [pickupAddress, setPickupAddress] = useState('Market St & 4th St, San Francisco, CA');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  // Load Vehicles & Services
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['customer-vehicles'],
    queryFn: vehiclesApi.getVehicles,
  });

  const { data: services = fallbackServices, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.getServices,
  });

  // Pre-select default vehicle if not selected
  React.useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicleId) {
      const defaultVeh = vehicles.find((v) => v.is_default) || vehicles[0];
      setSelectedVehicleId(defaultVeh.id);
    }
  }, [vehicles, selectedVehicleId]);

  // Pre-select first service if not selected
  React.useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  // Submit Mutation
  const createRequestMutation = useMutation({
    mutationFn: (payload) => assistanceApi.createRequest(payload),
    onSuccess: (newReq) => {
      navigate(`/customer/requests/${newReq.id}`);
    },
    onError: () => {
      setErrorMsg('Failed to broadcast request. Please check inputs.');
    },
  });

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];

  const getServiceIcon = (slug) => {
    switch (slug) {
      case 'puncture':
        return Disc;
      case 'battery':
        return Zap;
      case 'towing':
        return Truck;
      case 'fuel':
        return Fuel;
      case 'lockout':
        return Key;
      case 'winch':
        return Anchor;
      default:
        return Wrench;
    }
  };

  const handleNextStep1 = () => {
    if (!selectedVehicleId) {
      setErrorMsg('Please select a vehicle to continue');
      return;
    }
    if (!selectedServiceId) {
      setErrorMsg('Please select a service');
      return;
    }
    setErrorMsg(null);
    setCurrentStep(2);
  };

  const handleNextStep2 = () => {
    if (!pickupAddress.trim()) {
      setErrorMsg('Please specify your current breakdown address or drop a pin');
      return;
    }
    setErrorMsg(null);
    setCurrentStep(3);
  };

  const handleSubmit = () => {
    setErrorMsg(null);
    createRequestMutation.mutate({
      vehicle_id: selectedVehicleId,
      service_id: selectedServiceId,
      pickup_latitude: pickupLat,
      pickup_longitude: pickupLng,
      pickup_address: pickupAddress,
      destination_address: destinationAddress || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <PageWrapper showSidebar maxWidth="default">
      <div className="max-w-4xl mx-auto space-y-8 animate-fadeInUp">
        {/* Wizard Step Indicator */}
        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between max-w-md mx-auto relative">
            {/* Step lines */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 -z-0" />
            <div
              className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-amber-500 transition-all duration-500 -z-0"
              style={{
                width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
              }}
            />

            {[
              { num: 1, label: 'Vehicle & Service' },
              { num: 2, label: 'Live Location' },
              { num: 3, label: 'Review & Dispatch' },
            ].map((step) => {
              const isPast = currentStep > step.num;
              const isCurrent = currentStep === step.num;

              return (
                <div key={step.num} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                      isPast
                        ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                        : isCurrent
                        ? 'bg-amber-500 text-navy-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.6)] ring-4 ring-amber-500/20'
                        : 'bg-navy-950 border border-slate-700 text-slate-500'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : step.num}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-2 ${
                      isCurrent ? 'text-amber-400 font-bold' : isPast ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Select Vehicle & Service */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-fadeInUp">
            {/* Vehicle Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">1. Select Your Breakdown Vehicle</h3>
                  <p className="text-xs text-slate-400">
                    Which vehicle requires immediate roadside assistance?
                  </p>
                </div>
              </div>

              {isLoadingVehicles ? (
                <div className="py-8 flex justify-center">
                  <Spinner size="md" className="text-amber-400" />
                </div>
              ) : vehicles.length === 0 ? (
                <Card className="text-center p-6 border border-white/10">
                  <p className="text-sm text-slate-300 mb-3">No vehicle saved in your garage.</p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/customer/vehicles')}
                  >
                    Add Vehicle First
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {vehicles.map((v) => {
                    const isSelected = selectedVehicleId === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVehicleId(v.id)}
                        className={`p-4 rounded-2xl glass cursor-pointer transition-all border ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Car
                            className={`w-5 h-5 ${
                              isSelected ? 'text-amber-400' : 'text-slate-400'
                            }`}
                          />
                          {v.is_default && (
                            <span className="text-[10px] font-bold text-amber-400 uppercase">
                              Default
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white">
                          {v.year} {v.make}
                        </h4>
                        <p className="text-xs text-slate-300">{v.model}</p>
                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>{v.license_plate}</span>
                          <span className="capitalize">{v.color}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Service Selection */}
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white">2. Select Assistance Service</h3>
                <p className="text-xs text-slate-400">
                  Choose the specialized service needed for your vehicle
                </p>
              </div>

              {isLoadingServices ? (
                <div className="py-8 flex justify-center">
                  <Spinner size="md" className="text-amber-400" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map((srv) => {
                    const isSelected = selectedServiceId === srv.id;
                    const SrvIcon = getServiceIcon(srv.slug);

                    return (
                      <div
                        key={srv.id}
                        onClick={() => setSelectedServiceId(srv.id)}
                        className={`p-5 rounded-2xl glass cursor-pointer transition-all border flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div
                              className={`p-2.5 rounded-xl ${
                                isSelected
                                  ? 'bg-amber-500 text-navy-950'
                                  : 'bg-white/5 text-amber-400'
                              }`}
                            >
                              <SrvIcon className="w-5 h-5 stroke-[2.2]" />
                            </div>
                            <span className="text-sm font-bold text-amber-400 font-mono">
                              ${srv.base_price}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white mb-1">{srv.name}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {srv.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> ~{srv.estimated_duration_mins} mins job
                          </span>
                          {isSelected && (
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              Selected <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleNextStep1}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Location
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Confirm Location */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeInUp">
            <div>
              <h3 className="text-lg font-bold text-white">Set Your Breakdown Location</h3>
              <p className="text-xs text-slate-400">
                Pinpoint your precise coordinates so the closest dispatch unit navigates directly to your lane
              </p>
            </div>

            {/* Interactive Leaflet Location Picker */}
            <LocationPicker
              initialLat={pickupLat}
              initialLng={pickupLng}
              onLocationSelect={(lat, lng, addr) => {
                setPickupLat(lat);
                setPickupLng(lng);
                if (addr) setPickupAddress(addr);
              }}
              className="h-96"
            />

            {/* Address Inputs */}
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Pickup Address / Landmark Description"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                startIcon={<MapPin className="w-4 h-4 text-amber-400" />}
                placeholder="e.g. I-80 Westbound Shoulder, Mile Marker 14"
              />

              {selectedService.slug === 'towing' && (
                <Input
                  label="Destination Address (Where should we tow your car?)"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  startIcon={<MapPin className="w-4 h-4 text-blue-400" />}
                  placeholder="e.g. Tesla Service Center, 999 Van Ness Ave"
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setCurrentStep(1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Vehicle & Service
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleNextStep2}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Review & Confirm Dispatch
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Review + Submit */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeInUp">
            <div>
              <h3 className="text-lg font-bold text-white">Review & Confirm Request</h3>
              <p className="text-xs text-slate-400">
                Check the dispatch order details before we broadcast to certified providers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Summary Card */}
              <Card className="p-6 border border-white/10 space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 border-b border-white/10 pb-2">
                  Dispatch Details
                </h4>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block">Vehicle</span>
                    <span className="font-semibold text-white">
                      {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
                    </span>
                    <span className="text-xs font-mono text-slate-400 block">
                      Plate: {selectedVehicle?.license_plate}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block">Required Service</span>
                    <span className="font-semibold text-amber-400">
                      {selectedService?.name}
                    </span>
                    <span className="text-xs text-slate-400 block">
                      Estimated on-site time: ~{selectedService?.estimated_duration_mins} mins
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block">Breakdown Site</span>
                    <span className="font-semibold text-slate-200">
                      {pickupAddress}
                    </span>
                  </div>

                  {destinationAddress && (
                    <div>
                      <span className="text-xs text-slate-400 block">Tow Dropoff</span>
                      <span className="font-semibold text-slate-200">
                        {destinationAddress}
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Pricing & Notes */}
              <div className="space-y-6">
                <Card className="p-6 border border-white/10 space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 border-b border-white/10 pb-2">
                    Transparent Estimate
                  </h4>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-300">
                      <span>Standard Base Fee</span>
                      <span>${selectedService?.base_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Live GPS Dispatch & Matching</span>
                      <span className="text-emerald-400 font-semibold">FREE</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Platform Safety Guarantee</span>
                      <span className="text-emerald-400 font-semibold">Included</span>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                      <span className="font-bold text-white">Estimated Cost Range</span>
                      <div className="text-right">
                        <span className="text-xl font-black text-amber-400">
                          ${selectedService?.base_price.toFixed(0)} - $
                          {(selectedService?.base_price * 1.35).toFixed(0)}
                        </span>
                        <p className="text-[10px] text-slate-400">Final price confirmed upon arrival</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Additional Technician Notes */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Technician Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Lug nuts are over-torqued, hazard lights are flashing on shoulder"
                    className="w-full rounded-xl p-3 text-sm glass-input placeholder-slate-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setCurrentStep(2)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Location
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                isLoading={createRequestMutation.isPending}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="px-8"
              >
                Broadcast Dispatch Request Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default CustomerNewRequest;
