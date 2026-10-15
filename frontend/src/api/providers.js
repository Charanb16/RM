import apiClient from './client';

export const fallbackProviders = [
  {
    id: 'prov-1',
    user_id: 'usr-p1',
    business_name: 'Apex Rapid Roadside Pros',
    service_radius_km: 25,
    is_online: true,
    verification_status: 'approved',
    rating_avg: 4.9,
    total_jobs: 384,
    current_lat: 37.7749,
    current_lng: -122.4194,
    vehicle_type: 'Heavy Flatbed & Service Van',
    services_offered: ['puncture', 'battery', 'towing', 'fuel', 'lockout'],
    user: {
      id: 'usr-p1',
      email: 'apex.recovery@roadmate.io',
      first_name: 'Marcus',
      last_name: 'Vance',
      phone_number: '+1 (555) 234-8901',
      role: 'provider',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      is_verified: true,
      created_at: '2023-08-10T00:00:00Z',
    },
  },
  {
    id: 'prov-2',
    user_id: 'usr-p2',
    business_name: 'Golden State Heavy Haul & Assist',
    service_radius_km: 30,
    is_online: true,
    verification_status: 'approved',
    rating_avg: 4.8,
    total_jobs: 215,
    current_lat: 37.7833,
    current_lng: -122.4167,
    vehicle_type: 'Tilt-Tray Wrecker',
    services_offered: ['towing', 'winch', 'battery'],
    user: {
      id: 'usr-p2',
      email: 'david.chen@gsrecovery.com',
      first_name: 'David',
      last_name: 'Chen',
      phone_number: '+1 (555) 987-6543',
      role: 'provider',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      is_verified: true,
      created_at: '2023-11-04T00:00:00Z',
    },
  },
  {
    id: 'prov-3',
    user_id: 'usr-p3',
    business_name: 'Metro Quick-Boost & Tire Team',
    service_radius_km: 15,
    is_online: true,
    verification_status: 'approved',
    rating_avg: 5.0,
    total_jobs: 512,
    current_lat: 37.7695,
    current_lng: -122.4467,
    vehicle_type: 'Mobile Response SUV',
    services_offered: ['puncture', 'battery', 'lockout', 'fuel'],
    user: {
      id: 'usr-p3',
      email: 'sarah.k@quickboost.org',
      first_name: 'Sarah',
      last_name: 'Kowalski',
      phone_number: '+1 (555) 345-6789',
      role: 'provider',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      is_verified: true,
      created_at: '2023-05-19T00:00:00Z',
    },
  },
];

export const providersApi = {
  getNearbyProviders: async (lat, lng, radiusKm = 25) => {
    try {
      const response = await apiClient.get('/api/providers/nearby/', {
        params: { lat, lng, radius_km: radiusKm },
      });
      if (response.data && response.data.length > 0) {
        return response.data;
      }
      return fallbackProviders;
    } catch {
      return fallbackProviders;
    }
  },

  getProfile: async (id) => {
    try {
      const url = id ? `/api/providers/${id}/` : '/api/providers/me/';
      const response = await apiClient.get(url);
      return response.data;
    } catch {
      return fallbackProviders[0];
    }
  },

  updateProfile: async (payload) => {
    const response = await apiClient.patch('/api/providers/me/', payload);
    return response.data;
  },

  toggleOnlineStatus: async (isOnline) => {
    try {
      const response = await apiClient.post('/api/providers/toggle_online/', {
        is_online: isOnline,
      });
      return response.data;
    } catch {
      return { is_online: isOnline };
    }
  },
};
