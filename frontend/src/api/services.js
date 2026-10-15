import apiClient from './client';

export const fallbackServices = [
  {
    id: 'srv-1',
    name: 'Flat Tire & Puncture',
    slug: 'puncture',
    description: 'On-site tire replacement or puncture plugging using professional vulcanizing plugs.',
    base_price: 49.0,
    icon: 'Disc',
    is_active: true,
    estimated_duration_mins: 25,
  },
  {
    id: 'srv-2',
    name: 'Battery Jumpstart',
    slug: 'battery',
    description: '12V/24V high-crank booster start, alternator health test, and battery terminal cleaning.',
    base_price: 39.0,
    icon: 'Zap',
    is_active: true,
    estimated_duration_mins: 15,
  },
  {
    id: 'srv-3',
    name: 'Flatbed Towing',
    slug: 'towing',
    description: 'Hydraulic tilt-tray flatbed recovery for sedans, SUVs, luxury, and electric vehicles.',
    base_price: 89.0,
    icon: 'Truck',
    is_active: true,
    estimated_duration_mins: 45,
  },
  {
    id: 'srv-4',
    name: 'Emergency Fuel Delivery',
    slug: 'fuel',
    description: 'Delivery of 2-3 gallons of Regular, Premium, or Ultra-Low Sulfur Diesel direct to your tank.',
    base_price: 35.0,
    icon: 'Fuel',
    is_active: true,
    estimated_duration_mins: 20,
  },
  {
    id: 'srv-5',
    name: 'Lockout Assistance',
    slug: 'lockout',
    description: 'Damage-free inflatable air-wedge lockout entry for all modern electronic vehicle doors.',
    base_price: 45.0,
    icon: 'Key',
    is_active: true,
    estimated_duration_mins: 20,
  },
  {
    id: 'srv-6',
    name: 'Winching & Ditch Extraction',
    slug: 'winch',
    description: 'Heavy duty steel cable winch recovery from snow, sand, mud, ditches, or curbs.',
    base_price: 110.0,
    icon: 'Anchor',
    is_active: true,
    estimated_duration_mins: 50,
  },
];

export const servicesApi = {
  getServices: async () => {
    try {
      const response = await apiClient.get('/api/services/');
      if (response.data && response.data.length > 0) {
        return response.data;
      }
      return fallbackServices;
    } catch {
      return fallbackServices;
    }
  },

  getServiceById: async (id) => {
    try {
      const response = await apiClient.get(`/api/services/${id}/`);
      return response.data;
    } catch {
      const matched = fallbackServices.find((s) => s.id === id);
      if (matched) return matched;
      return fallbackServices[0];
    }
  },
};
