import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Quotation, RFQEmail } from '../types/common';

interface QuotationState {
  quotations: Quotation[];
  processingNew: boolean;
  processingBaselineTotal: number | null;
  processingBaselineLatestCreatedAt: string | null;
}

interface QuotationActions {
  addQuotation: (quotation: Quotation) => void;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;
  getQuotationById: (id: string) => Quotation | undefined;
  getQuotationByRfqId: (rfqId: string) => Quotation | undefined;
  getRFQEmailData: (rfqId: string) => Promise<RFQEmail | null>;
  startProcessingNew: () => void;
  stopProcessingNew: () => void;
  setProcessingBaseline: (total: number, latestCreatedAt: string | null) => void;
  clearProcessingBaseline: () => void;
}

type QuotationStore = QuotationState & QuotationActions;

export const useQuotationStore = create<QuotationStore>()(
  persist(
    (set, get) => ({
  // Initial state
  quotations: [],
  processingNew: false,
  processingBaselineTotal: null,
  processingBaselineLatestCreatedAt: null,

  // Actions
  addQuotation: (quotation: Quotation) => {
    set(state => ({
      quotations: [...state.quotations, quotation]
    }));
  },

  updateQuotation: (id: string, updates: Partial<Quotation>) => {
    set(state => ({
      quotations: state.quotations.map(quotation => 
        quotation.id === id 
          ? { ...quotation, ...updates, updatedAt: new Date().toISOString() }
          : quotation
      )
    }));
  },

  deleteQuotation: (id: string) => {
    set(state => ({
      quotations: state.quotations.filter(quotation => quotation.id !== id)
    }));
  },

  getQuotationById: (id: string): Quotation | undefined => {
    const { quotations } = get();
    return quotations.find(quotation => quotation.id === id);
  },

  getQuotationByRfqId: (rfqId: string): Quotation | undefined => {
    const { quotations } = get();
    return quotations.find(quotation => quotation.rfqId === rfqId);
  },

      getRFQEmailData: async (_rfqId: string): Promise<RFQEmail | null> => {
        return null;
      },
      startProcessingNew: () => set({ processingNew: true }),
      stopProcessingNew: () => set({ processingNew: false }),
      setProcessingBaseline: (total: number, latestCreatedAt: string | null) => set({
        processingBaselineTotal: total,
        processingBaselineLatestCreatedAt: latestCreatedAt,
      }),
      clearProcessingBaseline: () => set({
        processingBaselineTotal: null,
        processingBaselineLatestCreatedAt: null,
      }),
    }),
    {
      name: "quotation-storage",
      partialize: (state) => ({
        quotations: state.quotations,
        processingNew: state.processingNew,
        processingBaselineTotal: state.processingBaselineTotal,
        processingBaselineLatestCreatedAt: state.processingBaselineLatestCreatedAt,
      }),
    }
  )
); 