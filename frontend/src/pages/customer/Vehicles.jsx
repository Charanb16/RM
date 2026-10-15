import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Car,
  Plus,
  Trash2,
  Check,
  Star,
  Shield,
  Palette,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { vehiclesApi } from '../../api/vehicles';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const vehicleSchema = z.object({
  make: z.string().min(2, 'Make is required (e.g. Tesla, Ford)'),
  model: z.string().min(1, 'Model is required (e.g. Model 3, F-150)'),
  year: z.coerce.number().min(1980).max(2027),
  license_plate: z.string().min(3, 'License plate is required'),
  color: z.string().min(2, 'Color is required'),
  vehicle_type: z.enum(['car', 'motorcycle', 'suv', 'truck', 'van']),
  is_default: z.boolean().optional(),
});

export const CustomerVehicles = () => {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['customer-vehicles'],
    queryFn: vehiclesApi.getVehicles,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => vehiclesApi.createVehicle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-vehicles'] });
      setIsAddModalOpen(false);
      reset();
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id) => vehiclesApi.setDefaultVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-vehicles'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => vehiclesApi.deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-vehicles'] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: '',
      model: '',
      year: 2023,
      license_plate: '',
      color: '',
      vehicle_type: 'car',
      is_default: false,
    },
  });

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  return (
    <PageWrapper showSidebar maxWidth="default">
      <div className="space-y-8 animate-fadeInUp">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              My Garage
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage your registered vehicles for instantaneous roadside dispatch matching
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add New Vehicle
          </Button>
        </div>

        {/* Vehicles list */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" className="text-amber-400" />
          </div>
        ) : vehicles.length === 0 ? (
          <Card className="text-center py-16 border border-white/10 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto mb-4">
              <Car className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Vehicles Registered</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-6">
              Add your vehicle details so towing and service units arrive with the correct equipment and tow brackets.
            </p>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Vehicle Now
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((veh) => (
              <Card
                key={veh.id}
                hoverEffect
                className={`p-6 border flex flex-col justify-between ${
                  veh.is_default
                    ? 'border-amber-500/50 shadow-lg shadow-amber-500/10'
                    : 'border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <Car className="w-6 h-6" />
                    </div>
                    {veh.is_default ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/40">
                        <Star className="w-3.5 h-3.5 fill-current" /> Primary Vehicle
                      </span>
                    ) : (
                      <button
                        onClick={() => setDefaultMutation.mutate(veh.id)}
                        className="text-xs text-slate-400 hover:text-amber-400 font-medium transition-colors"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-white">
                    {veh.year} {veh.make}
                  </h3>
                  <p className="text-sm text-slate-300 font-medium">{veh.model}</p>

                  <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <CreditCard className="w-3.5 h-3.5" /> License Plate
                      </span>
                      <span className="font-mono font-bold bg-navy-950 px-2 py-0.5 rounded border border-white/10 text-white">
                        {veh.license_plate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Palette className="w-3.5 h-3.5" /> Color
                      </span>
                      <span>{veh.color}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Shield className="w-3.5 h-3.5" /> Classification
                      </span>
                      <span className="uppercase text-[11px] font-semibold text-amber-400">
                        {veh.vehicle_type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-end">
                  <button
                    onClick={() => deleteMutation.mutate(veh.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete Vehicle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add Vehicle Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Vehicle"
          subtitle="Register your car, motorcycle, SUV or truck"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Make"
                placeholder="e.g. Tesla"
                error={errors.make?.message}
                {...register('make')}
              />
              <Input
                label="Model"
                placeholder="e.g. Model 3"
                error={errors.model?.message}
                {...register('model')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Year"
                type="number"
                placeholder="2023"
                error={errors.year?.message}
                {...register('year')}
              />
              <Input
                label="License Plate"
                placeholder="CA-8X99-TS"
                error={errors.license_plate?.message}
                {...register('license_plate')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Color"
                placeholder="Midnight Silver"
                error={errors.color?.message}
                {...register('color')}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Vehicle Type
                </label>
                <select
                  className="w-full rounded-xl py-2.5 px-3.5 text-sm glass-input"
                  {...register('vehicle_type')}
                >
                  <option value="car">Passenger Car / Sedan</option>
                  <option value="suv">SUV / Crossover</option>
                  <option value="truck">Pickup Truck</option>
                  <option value="van">Cargo / Passenger Van</option>
                  <option value="motorcycle">Motorcycle</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={createMutation.isPending}
              >
                Save Vehicle
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageWrapper>
  );
};

export default CustomerVehicles;
