import { useQueryClient } from '@tanstack/react-query';

interface OptimisticUpdateOptions<T> {
  queryKey: any[];
  updateFn: (oldData: T | undefined) => T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useOptimisticUpdate() {
  const queryClient = useQueryClient();

  const optimisticUpdate = async <TData>(
    options: OptimisticUpdateOptions<TData>
  ) => {
    const { queryKey, updateFn, onError } = options;
    await queryClient.cancelQueries({ queryKey });
    const previousData = queryClient.getQueryData<TData>(queryKey);

    try {
      queryClient.setQueryData<TData>(queryKey, updateFn);

      return { previousData };
    } catch (error) {
      if (previousData) {
        queryClient.setQueryData(queryKey, previousData);
      }
      onError?.(error as Error);
      throw error;
    }
  };

  const rollbackUpdate = (queryKey: any[], previousData: any) => {
    queryClient.setQueryData(queryKey, previousData);
  };

  return {
    optimisticUpdate,
    rollbackUpdate,
  };
}

