import apiClient from './client';
import { fallbackServices } from './services';
import { fallbackProviders } from './providers';

export const fallbackBooking = {
  id: 'req-8842',
  customer_id: 'usr-1',
  customer: {
    id: 'usr-1',
    email: 'alex.rivera@example.com',
    first_name: 'Alex',
    last_name: 'Rivera',
    phone_number: '+1 (555) 782-9901',
    role: 'customer',
    is_verified: true,
    created_at: '2024-01-10T00:00:00Z',
  },
  provider_id: 'prov-1',
  provider: fallbackProviders[0],
  vehicle_id: 'veh-1',
  vehicle: {
    id: 'veh-1',
    user_id: 'usr-1',
    make: 'Tesla',
    model: 'Model 3 Performance',
    year: 2023,
    license_plate: 'CA-8X99-TS',
    color: 'Midnight Silver Metallic',
    vehicle_type: 'car',
    is_default: true,
    created_at: '2024-01-15T10:00:00Z',
  },
  service_id: 'srv-1',
  service: fallbackServices[0],
  status: 'en_route',
  pickup_latitude: 37.7749,
  pickup_longitude: -122.4194,
  pickup_address: 'Market St & 4th St, San Francisco, CA 94103',
  estimated_cost_min: 49.0,
  estimated_cost_max: 75.0,
  final_cost: null,
  notes: 'Front right tire completely flat after hitting pothole. Vehicle parked in curbside bay.',
  eta_minutes: 8,
  created_at: new Date(Date.now() - 15 * 60000).toISOString(),
  updated_at: new Date(Date.now() - 3 * 60000).toISOString(),
};

export const fallbackOffers = [
  {
    id: 'off-901',
    request_id: 'req-8842',
    request: fallbackBooking,
    provider_id: 'prov-1',
    provider: fallbackProviders[0],
    quoted_price: 65.0,
    estimated_arrival_mins: 8,
    distance_km: 2.4,
    status: 'pending',
    expires_at: new Date(Date.now() + 180000).toISOString(), // 3 mins from now
    created_at: new Date().toISOString(),
  },
  {
    id: 'off-902',
    request_id: 'req-8843',
    request: {
      ...fallbackBooking,
      id: 'req-8843',
      service_id: 'srv-2',
      service: fallbackServices[1],
      pickup_address: 'Embarcadero Pier 14, San Francisco, CA',
      notes: 'Dead 12V battery, car will not power up ignition.',
    },
    provider_id: 'prov-1',
    quoted_price: 45.0,
    estimated_arrival_mins: 14,
    distance_km: 4.8,
    status: 'pending',
    expires_at: new Date(Date.now() + 120000).toISOString(), // 2 mins from now
    created_at: new Date().toISOString(),
  },
  {
    id: 'off-903',
    request_id: 'req-8844',
    request: {
      ...fallbackBooking,
      id: 'req-8844',
      service_id: 'srv-3',
      service: fallbackServices[2],
      pickup_address: 'US-101 Northbound past Cesar Chavez',
      notes: 'Engine overheated, radiator steam. Tow required to dealership.',
    },
    provider_id: 'prov-1',
    quoted_price: 120.0,
    estimated_arrival_mins: 22,
    distance_km: 7.2,
    status: 'pending',
    expires_at: new Date(Date.now() + 90000).toISOString(), // 1.5 mins from now
    created_at: new Date().toISOString(),
  },
];

export const assistanceApi = {
  createRequest: async (payload) => {
    try {
      const response = await apiClient.post('/api/assistance/requests/', payload);
      return response.data;
    } catch {
      // Mock creation return
      const selectedService = fallbackServices.find((s) => s.id === payload.service_id) || fallbackServices[0];
      return {
        id: 'req-' + Math.floor(1000 + Math.random() * 9000),
        customer_id: 'usr-1',
        service_id: payload.service_id,
        service: selectedService,
        vehicle_id: payload.vehicle_id,
        vehicle: fallbackBooking.vehicle,
        status: 'searching',
        pickup_latitude: payload.pickup_latitude,
        pickup_longitude: payload.pickup_longitude,
        pickup_address: payload.pickup_address,
        destination_latitude: payload.destination_latitude,
        destination_longitude: payload.destination_longitude,
        destination_address: payload.destination_address,
        estimated_cost_min: selectedService.base_price,
        estimated_cost_max: selectedService.base_price * 1.4,
        notes: payload.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  },

  getRequestById: async (id) => {
    try {
      const response = await apiClient.get(`/api/assistance/requests/${id}/`);
      return response.data;
    } catch {
      return { ...fallbackBooking, id };
    }
  },

  getCustomerRequests: async () => {
    try {
      const response = await apiClient.get('/api/assistance/requests/');
      if (response.data && response.data.length > 0) {
        return response.data;
      }
      return [
        fallbackBooking,
        {
          ...fallbackBooking,
          id: 'req-7721',
          status: 'completed',
          service_id: 'srv-2',
          service: fallbackServices[1],
          pickup_address: 'Montgomery St & Pine St, San Francisco, CA',
          final_cost: 39.0,
          created_at: '2024-02-14T11:20:00Z',
          updated_at: '2024-02-14T12:05:00Z',
        },
        {
          ...fallbackBooking,
          id: 'req-6310',
          status: 'completed',
          service_id: 'srv-4',
          service: fallbackServices[3],
          pickup_address: 'Geary Blvd & Park Presidio, San Francisco, CA',
          final_cost: 42.0,
          created_at: '2024-01-28T19:40:00Z',
          updated_at: '2024-01-28T20:15:00Z',
        },
      ];
    } catch {
      return [fallbackBooking];
    }
  },

  cancelRequest: async (id) => {
    try {
      const response = await apiClient.post(`/api/assistance/requests/${id}/cancel/`);
      return response.data;
    } catch {
      return {
        ...fallbackBooking,
        id,
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      };
    }
  },

  getIncomingOffers: async () => {
    try {
      const response = await apiClient.get('/api/assistance/offers/');
      if (response.data && response.data.length > 0) {
        return response.data;
      }
      return fallbackOffers;
    } catch {
      return fallbackOffers;
    }
  },

  respondToOffer: async (offerId, action) => {
    try {
      const response = await apiClient.post(
        `/api/assistance/offers/${offerId}/respond/`,
        { action }
      );
      return response.data;
    } catch {
      return { success: true, status: action === 'accept' ? 'accepted' : 'rejected' };
    }
  },

  updateJobStatus: async (requestId, status) => {
    try {
      const response = await apiClient.post(
        `/api/assistance/requests/${requestId}/update_status/`,
        { status }
      );
      return response.data;
    } catch {
      return {
        ...fallbackBooking,
        id: requestId,
        status,
        updated_at: new Date().toISOString(),
      };
    }
  },

  getActiveJob: async () => {
    try {
      const response = await apiClient.get('/api/assistance/active_job/');
      return response.data;
    } catch {
      return fallbackBooking;
    }
  },
};
