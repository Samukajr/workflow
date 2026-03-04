import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedDepartments?: string[];
}

export function ProtectedRoute({ children, allowedDepartments = [] }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedDepartments.length > 0 && user && !allowedDepartments.includes(user.department)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
