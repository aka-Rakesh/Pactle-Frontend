import { create } from 'zustand';
import type { AuditFilters, AuditEventType } from './AuditTypes';
import { DEFAULT_FILTERS } from './AuditTypes';

interface AuditState {
  filters: AuditFilters;
  setQuery: (q: string) => void;
  toggleType: (t: AuditEventType) => void;
  setActor: (a: string) => void;
  setDate: (from?: string, to?: string) => void;
  setSort: (s: 'newest' | 'oldest') => void;
  clear: () => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  filters: { ...DEFAULT_FILTERS },
  setQuery: (q) => set((s) => ({ filters: { ...s.filters, query: q } })),
  toggleType: (t) => set((s) => {
    const has = s.filters.types.includes(t);
    return { filters: { ...s.filters, types: has ? s.filters.types.filter(x => x !== t) : [...s.filters.types, t] } };
  }),
  setActor: (a) => set((s) => ({ filters: { ...s.filters, actor: a } })),
  setDate: (from, to) => set((s) => ({ filters: { ...s.filters, dateFrom: from, dateTo: to } })),
  setSort: (srt) => set((s) => ({ filters: { ...s.filters, sort: srt } })),
  clear: () => set({ filters: { ...DEFAULT_FILTERS } }),
}));
