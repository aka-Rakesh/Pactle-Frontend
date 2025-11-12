import { useQuery } from '@tanstack/react-query';
import { healthApi } from '../api';
import { queryKeys } from '../lib/queryKeys';

export const useHealthCheck = () => {
  return useQuery({
    queryKey: queryKeys.health.status(),
    queryFn: async () => {
      return await healthApi.checkHealth();
    },
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

export const useApiStatus = () => {
  return useQuery({
    queryKey: queryKeys.health.api(),
    queryFn: async () => {
      return await healthApi.checkApiStatus();
    },
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}; 