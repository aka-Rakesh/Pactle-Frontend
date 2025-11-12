import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores";
import { Loading } from "../../components/ui/Loading";
import { usePermissions } from "../../hooks/usePermissions";

interface PermissionRouteProps {
  children: React.ReactNode;
  pageKey: string;
  redirectTo?: string;
}

const PermissionRoute: React.FC<PermissionRouteProps> = ({ children, pageKey, redirectTo = "/dashboard" }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { canAccessPage } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return (
      <Loading
        size="lg"
        message="Setting up your workspace"
        subMessage="Please wait while Pactle finalizes your workspace and syncs your data."
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!canAccessPage(pageKey)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default PermissionRoute;


