import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const RequireRole = ({ allowedRoles, children }) => {
  const user = useAuthStore((state) => state.user);

  if (!user || !allowedRoles.includes(user.role)) {
    // If provider attempts customer route or vice versa, redirect them to their home portal
    const target = user?.role === 'provider' ? '/provider/dashboard' : '/customer/dashboard';
    return <Navigate to={target} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default RequireRole;
