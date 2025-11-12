import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { Loading } from '../../components/ui/Loading';
import { usePermissions } from '../../hooks/usePermissions';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();
  const { canAccessPage } = usePermissions();
  

  if (isLoading) {
    return (
      <Loading
        size='lg'
        message="Setting up your workspace"
        subMessage="Please wait while Pactle finalizes your workspace and syncs your data."
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasAccess = canAccessPage('members');

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute; 