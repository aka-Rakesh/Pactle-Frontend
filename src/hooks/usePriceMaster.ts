import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import priceMasterApi from '../api/pricemaster';
import { queryKeys } from '../lib/queryKeys';
import type { 
  PriceMasterQueryParams,
  PriceMasterUpdateItemRequest,
  PriceMasterBulkUpdateRequest,
  PriceMasterItem
} from '../types/common';

export const usePriceMasterList = (params?: PriceMasterQueryParams) => {
  return useQuery({
    queryKey: queryKeys.pricemaster.list(params, params?.page_size || 50),
    queryFn: () => priceMasterApi.getPriceMasterList(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false,
  });
};

export const usePriceMasterDetails = (id: number) => {
  return useQuery({
    queryKey: queryKeys.pricemaster.detail(id),
    queryFn: () => priceMasterApi.getPriceMasterDetails(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });
};

export const usePriceMasterCategories = () => {
  return useQuery({
    queryKey: queryKeys.pricemaster.categories(),
    queryFn: () => priceMasterApi.getPriceMasterCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: false,
  });
};

export const usePriceMasterBrands = () => {
  return useQuery({
    queryKey: queryKeys.pricemaster.brands(),
    queryFn: () => priceMasterApi.getPriceMasterBrands(),
    staleTime: 10 * 60 * 1000, // 10 minutes - brands don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: false, 
  });
};

export const useInfinitePriceMasterList = (params?: PriceMasterQueryParams) => {
  const pageSize = params?.page_size || 50;
  return useInfiniteQuery({
    queryKey: [...queryKeys.pricemaster.lists(), 'infinite', JSON.stringify(params || {}), pageSize],
    queryFn: ({ pageParam = 1 }) => priceMasterApi.getPriceMasterList({ ...(params || {}), page: pageParam, page_size: pageSize }),
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage?.next) {
        return (lastPageParam as number) + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });
};

export const useUpdatePriceMasterItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PriceMasterUpdateItemRequest) => 
      priceMasterApi.updatePriceMasterItem(request),
    onSuccess: () => {
      // Invalidate all price master lists to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.pricemaster.lists() });
    },
  });
};

export const useBulkUpdatePriceMasterItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requests: PriceMasterBulkUpdateRequest[]) => 
      priceMasterApi.bulkUpdatePriceMasterItems(requests),
    onSuccess: () => {
      // Invalidate all price master lists to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.pricemaster.lists() });
    },
  });
};

export const useCreatePriceMasterItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: Array<Partial<PriceMasterItem>>) => {
      const created: number[] = [];
      for (const item of items) {
        const res = await priceMasterApi.createPriceMasterItem(item);
        created.push(res.id);
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pricemaster.lists() });
    },
  });
};

export const useDeletePriceMasterItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: number[]) => {
      const uniqueIds = Array.from(new Set(ids));
      await Promise.all(uniqueIds.map((id) => priceMasterApi.deletePriceMasterItem(id)));
      return ids;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pricemaster.lists() });
    },
  });
};

export const useUpdatePriceMasterById = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<PriceMasterItem> }) => {
      return priceMasterApi.updatePriceMasterById(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pricemaster.lists() });
    },
  });
};

export const usePriceMasterSearch = (query: string, params?: Omit<PriceMasterQueryParams, 'search'>) => {
  return useQuery({
    queryKey: [...queryKeys.pricemaster.lists(), 'search', query, params || {}],
    queryFn: () => priceMasterApi.searchPriceMaster(query, params),
    enabled: !!query,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });
};
