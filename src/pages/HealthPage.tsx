import React from "react";
import { useHealthCheck } from "../hooks";
import { Loading } from "../components/ui/Loading";
import { Button } from "../components/ui/Button";

const HealthPage: React.FC = () => {
  const { data: healthData, isLoading, error, refetch } = useHealthCheck();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ok':
      case 'healthy':
        return "text-green-default";
      case 'warning':
        return "text-yellow-default";
      case 'error':
      case 'unhealthy':
        return "text-red-600";
      default:
        return "text-gray-light";
    }
  };

    if (isLoading) {
    return (
      <Loading
        fullscreen
        size="lg"
        message="Checking system health..."
        subMessage="Please wait while we verify that all services are up and ready to use."
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-dark p-4">
      <div className="bg-background-light rounded-lg shadow-md p-8 max-w-md w-full border border-border-dark">
        <h1 className="text-2xl font-bold mb-6 text-center">API Health Check</h1>
        
        {error ? (
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-800 text-sm">{error.message}</p>
            </div>
            <p className="text-lg font-semibold text-red-600">
              API Unavailable
            </p>
          </div>
        ) : healthData ? (
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-lg">
                Status:{" "}
                <span className={`font-semibold ${getStatusColor(healthData.status)}`}>
                  {healthData.status.toUpperCase()}
                </span>
              </p>
              
              {healthData.timestamp && (
                <p className="text-sm text-gray-light">
                  Last checked: {new Date(healthData.timestamp).toLocaleString()}
                </p>
              )}
            </div>
            
            <div className="pt-4 border-t border-border-dark">
              <p className="text-xs text-gray-light">
                API Endpoint: {import.meta.env.VITE_API_URL}
              </p>
            </div>
          </div>
        ) : null}
        
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => refetch()}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Checking..." : "Refresh"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HealthPage;