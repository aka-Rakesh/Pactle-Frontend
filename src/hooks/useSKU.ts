import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { skuApi } from '../api';
import { queryKeys } from '../lib/queryKeys';
import type { SKUQueryParams, SKUCategoriesResponse, SKUBrandsResponse, SKUListResponse } from '../types/common';

export const useSKUCategories = () => {
  return useQuery({
    queryKey: queryKeys.sku.categories(),
    queryFn: async (): Promise<SKUCategoriesResponse> => {
      return await skuApi.getSKUCategories();
    },
  });
};

export const useSKUBrands = () => {
  return useQuery({
    queryKey: queryKeys.sku.brands(),
    queryFn: async (): Promise<SKUBrandsResponse> => {
      return await skuApi.getSKUBrands();
    },
  });
};

export const useSKUInfinite = (
  filters: Partial<SKUQueryParams> = {},
  pageSize: number = 20
) => {
  return useInfiniteQuery({
    queryKey: queryKeys.sku.list(filters, pageSize),
    queryFn: async ({ pageParam = 1 }): Promise<SKUListResponse> => {
      return await skuApi.getSKUList({
        ...filters,
        page: pageParam as number,
        page_size: pageSize,
      } as SKUQueryParams);
    },
    getNextPageParam: (lastPage: SKUListResponse) => {
      const pagination = lastPage.data.pagination;
      return pagination.has_next ? pagination.current_page + 1 : undefined;
    },
    getPreviousPageParam: (firstPage: SKUListResponse) => {
      const pagination = firstPage.data.pagination;
      return pagination.has_previous ? pagination.current_page - 1 : undefined;
    },
    initialPageParam: 1,
  });
};

export const useSKUSearch = (query: string, filters: Partial<SKUQueryParams> = {}) => {
  const searchQuery = query.trim();
  
  return useQuery({
    queryKey: queryKeys.sku.search(searchQuery),
    queryFn: async (): Promise<SKUListResponse> => {
      return await skuApi.getSKUList({
        ...filters,
        search: searchQuery,
        page: 1,
        page_size: 50,
      } as SKUQueryParams);
    },
    enabled: searchQuery.length > 0,
  });
};

// SKU list with pagination
export const useSKUList = (params: SKUQueryParams) => {
  return useQuery({
    queryKey: queryKeys.sku.list(params, params.page_size || 20),
    queryFn: async (): Promise<SKUListResponse> => {
      return await skuApi.getSKUList(params);
    },
  });
};

export const useSKUDropdown = (
  searchQuery: string,
  filters: Partial<SKUQueryParams> = {},
  enabled: boolean = true
) => {
  const searchQueryTrimmed = searchQuery.trim();
  const hasSearchQuery = searchQueryTrimmed.length > 0;
  
  const queryKey = hasSearchQuery 
    ? queryKeys.sku.search(searchQueryTrimmed)
    : queryKeys.sku.list(filters, 20);
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<SKUListResponse> => {
      return await skuApi.getSKUList({
        ...filters,
        search: hasSearchQuery ? searchQueryTrimmed : undefined,
        page: 1,
        page_size: 20, 
      } as SKUQueryParams);
    },
    enabled: enabled,
    refetchOnWindowFocus: false,
  });
};

export const useCreateSKU = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      throw new Error('Create SKU API not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sku.all });
    },
    onError: (error) => {
      console.error('Create SKU failed:', error);
    },
  });
};

export const useUpdateSKU = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (_: { skuId: string; updates: any }) => {
      throw new Error('Update SKU API not implemented');
    },
    onSuccess: () => {

      queryClient.invalidateQueries({ queryKey: queryKeys.sku.all });
    },
    onError: (error) => {
      console.error('Update SKU failed:', error);
    },
  });
};

export const useSKUMetadata = () => {
  const categoriesQuery = useSKUCategories();
  const brandsQuery = useSKUBrands();
  
  return {
    categories: categoriesQuery.data?.data.categories || [],
    brands: brandsQuery.data?.data.brands || [],
    isLoading: categoriesQuery.isLoading || brandsQuery.isLoading,
    error: categoriesQuery.error || brandsQuery.error,
    refetch: () => {
      categoriesQuery.refetch();
      brandsQuery.refetch();
    },
  };
};