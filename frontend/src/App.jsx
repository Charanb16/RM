import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RequireAuth from './guards/RequireAuth';
import RequireRole from './guards/RequireRole';

// Public pages
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Register from './pages/public/Register';

// Customer pages
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerVehicles from './pages/customer/Vehicles';
import CustomerNewRequest from './pages/customer/NewRequest';
import CustomerBookingStatus from './pages/customer/BookingStatus';
import CustomerBookingHistory from './pages/customer/BookingHistory';

// Provider pages
import ProviderDashboard from './pages/provider/Dashboard';
import ProviderJobOffers from './pages/provider/JobOffers';
import ProviderActiveJob from './pages/provider/ActiveJob';

export const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Customer Routes */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireRole allowedRoles={['customer']} />}>
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/vehicles" element={<CustomerVehicles />} />
          <Route path="/customer/new-request" element={<CustomerNewRequest />} />
          <Route path="/customer/requests/:id" element={<CustomerBookingStatus />} />
          <Route path="/customer/history" element={<CustomerBookingHistory />} />
        </Route>
      </Route>

      {/* Protected Provider Routes */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireRole allowedRoles={['provider']} />}>
          <Route path="/provider/dashboard" element={<ProviderDashboard />} />
          <Route path="/provider/offers" element={<ProviderJobOffers />} />
          <Route path="/provider/active-job" element={<ProviderActiveJob />} />
        </Route>
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
