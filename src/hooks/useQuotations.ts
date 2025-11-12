import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { quotationApi } from '../api';
import { queryKeys } from '../lib/queryKeys';
import type {
  QuotationListResponse,
  QuotationDetailsResponse,
  QuotationUpdateRequest,
} from '../types/common';

export const useQuotationsList = (params?: {
  page?: number;
  page_size?: number;
  status?: string;
  search?: string;
  content_type?: string;
  from_date?: string;
  to_date?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.quotations.list(params),
    queryFn: async (): Promise<QuotationListResponse> => {
      return await quotationApi.getQuotations(params);
    },
  });
};

export const useQuotationsInfinite = (params?: {
  page_size?: number;
  status?: string;
  content_type?: string;
  from_date?: string;
  to_date?: string;
}) => {
  return useInfiniteQuery({
    queryKey: queryKeys.quotations.list(params),
    queryFn: async ({ pageParam = 1 }): Promise<QuotationListResponse> => {
      return await quotationApi.getQuotations({
        ...params,
        page: pageParam,
      });
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.data.pagination;
      return pagination.has_next ? pagination.current_page + 1 : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      const pagination = firstPage.data.pagination;
      return pagination.has_previous ? pagination.current_page - 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

export const useQuotationDetails = (quoteId?: string) => {
  return useQuery({
    queryKey: quoteId ? queryKeys.quotations.detail(quoteId) : queryKeys.quotations.detail('undefined'),
    queryFn: async (): Promise<QuotationDetailsResponse> => {
      if (!quoteId) throw new Error('Missing quoteId');
      return await quotationApi.getQuotationDetails(quoteId);
    },
    enabled: !!quoteId,
    retry: false,
    staleTime: 60 * 1000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
};

export const useCreateQuotation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: { parsed_rfq_data: any }) => {
      return await quotationApi.createQuotation(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.lists() });
      if ((data as any)?.quote_id) {
        queryClient.setQueryData(
          queryKeys.quotations.detail((data as any).quote_id),
          data as any
        );
      }
    },
    onError: (error) => {
      console.error('Create quotation failed:', error);
    },
  });
};

export const useUpdateQuotation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ quoteId, data }: { quoteId: string; data: QuotationUpdateRequest }) => {
      return await quotationApi.updateQuotation(quoteId, data);
    },
    onMutate: async ({ quoteId, data }) => {

      await queryClient.cancelQueries({ queryKey: queryKeys.quotations.detail(quoteId) });
      
      const previousQuotation = queryClient.getQueryData(queryKeys.quotations.detail(quoteId));
      
      queryClient.setQueryData(queryKeys.quotations.detail(quoteId), (old: any) => ({
        ...old,
        data: {
          ...old?.data,
          ...data,
        },
      }));
      
      return { previousQuotation };
    },
    onSuccess: (updatedQuotation, { quoteId }) => {
      queryClient.setQueryData(queryKeys.quotations.detail(quoteId), updatedQuotation);
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.lists() });
    },
    onError: (_err, { quoteId }, context) => {
      if (context?.previousQuotation) {
        queryClient.setQueryData(queryKeys.quotations.detail(quoteId), context.previousQuotation);
      }
    },
    onSettled: (_data, _error, { quoteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.detail(quoteId) });
    },
  });
};

export const useDeleteQuotation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quoteId: string) => {
      return await quotationApi.deleteQuotation(quoteId);
    },
    onSuccess: (_data, quoteId) => {
      queryClient.removeQueries({ queryKey: queryKeys.quotations.detail(quoteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.lists() });
    },
    onError: (error) => {
      console.error('Delete quotation failed:', error);
    },
  });
};

export const useApproveQuotation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quoteId: string) => quotationApi.approveQuotation(quoteId),
    onMutate: async (quoteId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.quotations.detail(quoteId) });
      const previousQuotation = queryClient.getQueryData(queryKeys.quotations.detail(quoteId));
      
      queryClient.setQueryData(queryKeys.quotations.detail(quoteId), (old: any) => ({
        ...old,
        data: {
          ...old?.data,
          status: 'APPROVED',
        },
      }));
      
      return { previousQuotation };
    },
    onSuccess: (data, quoteId) => {
      queryClient.setQueryData(queryKeys.quotations.detail(quoteId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.lists() });
    },
    onError: (_error, quoteId, context: any) => {
      if (context?.previousQuotation) {
        queryClient.setQueryData(queryKeys.quotations.detail(quoteId), context.previousQuotation);
      }
    },
    onSettled: (_data, _error, quoteId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.detail(quoteId) });
    },
  });
};

export const useSendQuotation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quoteId: string) => quotationApi.sendQuotation(quoteId),
    onMutate: async (quoteId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.quotations.detail(quoteId) });
      const previousQuotation = queryClient.getQueryData(queryKeys.quotations.detail(quoteId));
      
      queryClient.setQueryData(queryKeys.quotations.detail(quoteId), (old: any) => ({
        ...old,
        data: {
          ...old?.data,
          status: 'SENT',
        },
      }));
      
      return { previousQuotation };
    },
    onSuccess: (data, quoteId) => {
      queryClient.setQueryData(queryKeys.quotations.detail(quoteId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.lists() });
    },
    onError: (_error, quoteId, context: any) => {
      if (context?.previousQuotation) {
        queryClient.setQueryData(queryKeys.quotations.detail(quoteId), context.previousQuotation);
      }
    },
    onSettled: (_data, _error, quoteId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.detail(quoteId) });
    },
  });
};

export const useProcessRFQ = () => {
  
  return useMutation({
    mutationFn: async (data: FormData | object) => {
      return await quotationApi.processRFQ(data);
    },
    onError: (error) => {
      console.error('Process RFQ failed:', error);
    },
  });
};

export const useExportQuotations = () => {
  return useMutation({
    mutationFn: async () => {
      return await quotationApi.exportQuotations();
    },
    onError: () => {
      console.error('Export quotations failed');
    },
  });
};

export const useFinalizeQuotation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ quotationId, selections }: { quotationId: string; selections: Record<string, string> }) => {
      const manual_items: any[] = [];
      const apiSelections: Record<string, string> = {};
      Object.entries(selections || {}).forEach(([lineNo, value]) => {
        try {
          const parsed = JSON.parse(value as any);
          if (parsed && typeof parsed === 'object' && (parsed.selected_item || parsed.manual_item || parsed.line_no)) {
            const root = parsed as any;
            const sel = root.selected_item || root.manual_item || {};
            const item = {
              line_number: Number(root.line_no ?? lineNo),
              description: String(root.description ?? sel.description ?? ''),
              quantity: Number(root.quantity ?? sel.quantity ?? 0),
              unit: String(root.unit ?? sel.unit ?? ''),
              unit_price: Number(root.unit_price ?? sel.unit_price ?? 0),
              brand: sel.brand ?? root.brand ?? undefined,
              category: sel.category ?? root.category ?? undefined,
              hsn_code: sel.hsn_code ?? root.hsn_code ?? undefined,
              material_type: root.material_type ?? sel.material_type ?? undefined,
              size_specification: root.size_specification ?? root.size ?? sel.size ?? undefined,
            } as Record<string, any>;
            const cleaned: any = {};
            Object.entries(item).forEach(([k, v]) => {
              if (v !== undefined && v !== null && !(typeof v === 'number' && isNaN(v as any))) cleaned[k] = v;
            });
            manual_items.push(cleaned);
          } else {
            apiSelections[lineNo] = String(value);
          }
        } catch {
          apiSelections[lineNo] = String(value);
        }
      });

      const payload: any = { quotation_id: quotationId };
      if (Object.keys(apiSelections).length > 0) payload.selections = apiSelections;
      if (manual_items.length > 0) payload.manual_items = manual_items;
      return await quotationApi.finalizeSelections(payload);
    },
    onSuccess: (_data, { quotationId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.detail(quotationId),
      });
      
      queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.list(undefined),
      });
    },
  });
};


