import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rawMaterialsApi } from '../api';
import type {
  RawMaterialCreatePayload,
  RawMaterialUpdatePayload,
  RawMaterialFilterPayload,
  RawMaterialUpdateItemRequest,
  RawMaterialBulkUpdateRequest,
  RawMaterialQueryParams
} from '../types/common';

// Query keys
export const rawMaterialsKeys = {
  all: ['rawMaterials'] as const,
  lists: () => [...rawMaterialsKeys.all, 'list'] as const,
  list: (params: RawMaterialQueryParams) => [...rawMaterialsKeys.lists(), params] as const,
  details: () => [...rawMaterialsKeys.all, 'detail'] as const,
  detail: (id: number) => [...rawMaterialsKeys.details(), id] as const,
  search: (query: string) => [...rawMaterialsKeys.all, 'search', query] as const,
};

// List raw materials
export const useRawMaterialsList = (params?: RawMaterialQueryParams) => {
  return useQuery({
    queryKey: rawMaterialsKeys.list(params || {}),
    queryFn: () => rawMaterialsApi.getRawMaterialsList(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get raw material details
export const useRawMaterialDetails = (id: number) => {
  return useQuery({
    queryKey: rawMaterialsKeys.detail(id),
    queryFn: () => rawMaterialsApi.getRawMaterialDetails(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Search raw materials
export const useRawMaterialsSearch = (query: string, params?: Omit<RawMaterialQueryParams, 'search'>) => {
  return useQuery({
    queryKey: rawMaterialsKeys.search(query),
    queryFn: () => rawMaterialsApi.searchRawMaterials(query, params),
    enabled: !!query,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create raw material
export const useCreateRawMaterials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RawMaterialCreatePayload) => rawMaterialsApi.createRawMaterial(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rawMaterialsKeys.lists() });
    },
  });
};

// Update raw material
export const useUpdateRawMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RawMaterialUpdatePayload }) =>
      rawMaterialsApi.updateRawMaterial(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: rawMaterialsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rawMaterialsKeys.detail(id) });
    },
  });
};

// Delete raw material
export const useDeleteRawMaterials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(id => rawMaterialsApi.deleteRawMaterial(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rawMaterialsKeys.lists() });
    },
  });
};

// Update single field
export const useUpdateRawMaterialItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RawMaterialUpdateItemRequest) => rawMaterialsApi.updateRawMaterialItem(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rawMaterialsKeys.lists() });
    },
  });
};

// Bulk update raw materials
export const useBulkUpdateRawMaterials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requests: RawMaterialBulkUpdateRequest[]) => rawMaterialsApi.bulkUpdateRawMaterials(requests),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rawMaterialsKeys.lists() });
    },
  });
};

// Filter raw materials
export const useFilterRawMaterials = () => {
  return useMutation({
    mutationFn: (filterPayload: RawMaterialFilterPayload) => rawMaterialsApi.filterRawMaterials(filterPayload),
  });
};
