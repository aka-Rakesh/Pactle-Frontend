import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { quotationApi } from '../api';
import { queryKeys } from '../lib/queryKeys';
import { getTimeRangeDates } from '../utils/dateUtils';
import type {
  TimeRangeParams,
  DashboardStatisticsResponse,
} from '../types/common';

export const useQuotationStats = (
  params?: TimeRangeParams
) => {
  const queryClient = useQueryClient();
  const defaultRange = getTimeRangeDates('7days');
  const defaultParams: TimeRangeParams = {
    start_date: defaultRange.startDate,
    end_date: defaultRange.endDate,
  };
  const [currentParams, setCurrentParams] = useState<TimeRangeParams>(params ?? defaultParams);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.quotations.dashboard(currentParams),
    queryFn: async (): Promise<DashboardStatisticsResponse> => {
      return await quotationApi.getDashboardStatistics(currentParams);
    },
  });

  const refetchWithParams = async (newParams?: TimeRangeParams) => {
    const nextParams = newParams ?? currentParams;
    try {
      setCurrentParams(nextParams);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.dashboard(nextParams),
      });
    } catch (error) {
      console.error('Failed to refetch quotation stats:', error);
    }
  };

  return {
    dashboardStats: data?.dashboard ?? null,
    isLoading,
    error: (error as Error | null)?.message ?? null,
    refetch: refetchWithParams,
  };
};