import apiClient from './client';

export const vehiclesApi = {
  getVehicles: async () => {
    try {
      const response = await apiClient.get('/api/vehicles/');
      return response.data;
    } catch {
      // Fallback portfolio mock data if backend not active
      return [
        {
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
        {
          id: 'veh-2',
          user_id: 'usr-1',
          make: 'Ford',
          model: 'F-150 Lightning',
          year: 2022,
          license_plate: 'TX-44M-FRD',
          color: 'Antimatter Blue',
          vehicle_type: 'truck',
          is_default: false,
          created_at: '2024-03-20T14:30:00Z',
        },
      ];
    }
  },

  getVehicleById: async (id) => {
    const response = await apiClient.get(`/api/vehicles/${id}/`);
    return response.data;
  },

  createVehicle: async (payload) => {
    try {
      const response = await apiClient.post('/api/vehicles/', payload);
      return response.data;
    } catch {
      return {
        id: 'veh-' + Date.now(),
        user_id: 'usr-1',
        ...payload,
        is_default: payload.is_default ?? false,
        created_at: new Date().toISOString(),
      };
    }
  },

  updateVehicle: async (id, payload) => {
    const response = await apiClient.patch(`/api/vehicles/${id}/`, payload);
    return response.data;
  },

  deleteVehicle: async (id) => {
    try {
      await apiClient.delete(`/api/vehicles/${id}/`);
    } catch {
      // simulate success for showcase
    }
  },

  setDefaultVehicle: async (id) => {
    try {
      const response = await apiClient.post(`/api/vehicles/${id}/set_default/`);
      return response.data;
    } catch {
      return {
        id,
        user_id: 'usr-1',
        make: 'Tesla',
        model: 'Model 3 Performance',
        year: 2023,
        license_plate: 'CA-8X99-TS',
        color: 'Midnight Silver Metallic',
        vehicle_type: 'car',
        is_default: true,
        created_at: '2024-01-15T10:00:00Z',
      };
    }
  },
};
