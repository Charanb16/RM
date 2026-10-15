import { useState, useEffect, useCallback } from 'react';

const DEFAULT_COORDS = {
  latitude: 37.7749,
  longitude: -122.4194,
};

export const useGeolocation = (watch = false) => {
  const [state, setState] = useState({
    latitude: DEFAULT_COORDS.latitude,
    longitude: DEFAULT_COORDS.longitude,
    accuracy: null,
    loading: true,
    error: null,
  });

  const updatePosition = useCallback((position) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      loading: false,
      error: null,
    });
  }, []);

  const handleError = useCallback((error) => {
    setState((prev) => ({
      ...prev,
      loading: false,
      error: error.message || 'Unable to retrieve location',
    }));
  }, []);

  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Geolocation is not supported by your browser',
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(updatePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 15000,
    });
  }, [updatePosition, handleError]);

  useEffect(() => {
    refreshLocation();

    if (watch && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(updatePosition, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      });

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [watch, refreshLocation, updatePosition, handleError]);

  return {
    ...state,
    refreshLocation,
  };
};

export default useGeolocation;
