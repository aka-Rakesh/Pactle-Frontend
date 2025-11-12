import React from 'react';
import { Loading } from '../../components/ui/Loading';
import { useAuthStore } from '../../stores';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <Loading
        fullscreen
        size="lg"
        message="Loading..."
        subMessage="Please wait while we set things up for you."
      />
    );
  }

  return <>{children}</>;
};

export default PublicRoute;