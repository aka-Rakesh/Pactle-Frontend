import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { AuditEvent, AuditPage, AuditFilters } from './AuditTypes';
import { DEFAULT_FILTERS } from './AuditTypes';

const MOCK_ITEMS: AuditEvent[] = [
  { id: 'e6', type: 'SIGNED', actor: { email: 'customer@company.com' }, createdAt: '2025-02-18T12:17:00Z', meta: {} },
  { id: 'e5', type: 'SENT', actor: { email: 'kamal@pactle.co' }, createdAt: '2025-02-18T12:10:00Z', meta: { targetEmail: 'legal@pactle.co' } },
  { id: 'e4', type: 'APPROVED', actor: { email: 'legal@pactle.co' }, createdAt: '2025-02-18T12:05:00Z' },
  { id: 'e3', type: 'VIEWED', actor: { email: 'legal@pactle.co' }, createdAt: '2025-02-18T12:03:00Z' },
  { id: 'e2', type: 'EDITED', actor: { email: 'kamal@pactle.co' }, createdAt: '2025-02-18T12:01:00Z', meta: { diffSummary: 'Header updated' } },
  { id: 'e1', type: 'CREATED', actor: { email: 'kamal@pactle.co' }, createdAt: '2025-02-18T12:00:00Z' },
];

export function useAuditData(documentId: string | undefined, filters: AuditFilters = DEFAULT_FILTERS) {
  const pageSize = 50;

  const prepared = useMemo(() => {
    const items = [...MOCK_ITEMS];
    // Sort
    items.sort((a, b) => (filters.sort === 'newest' ? (b.createdAt.localeCompare(a.createdAt)) : (a.createdAt.localeCompare(b.createdAt))));

    // Filter by type
    const byType = filters.types.length ? items.filter(i => filters.types.includes(i.type)) : items;

    // Filter by actor
    const act = filters.actor.trim().toLowerCase();
    const byActor = act ? byType.filter(i => (i.actor?.email || i.actor?.name || 'system').toLowerCase().includes(act)) : byType;

    // Filter by date
    const from = filters.dateFrom ? Date.parse(filters.dateFrom) : undefined;
    const to = filters.dateTo ? Date.parse(filters.dateTo) : undefined;
    const byDate = byActor.filter(i => {
      const t = Date.parse(i.createdAt);
      if (from && t < from) return false;
      if (to && t > to) return false;
      return true;
    });

    // Search
    const q = filters.query.trim().toLowerCase();
    const bySearch = q ? byDate.filter(i => {
      const parts = [
        i.message || '',
        i.actor?.email || '',
        i.actor?.name || '',
        i.meta?.targetEmail || '',
        i.type,
      ].join(' ').toLowerCase();
      return parts.includes(q);
    }) : byDate;

    return bySearch;
  }, [filters]);

  return useInfiniteQuery<AuditPage>({
    queryKey: ['audit', documentId, filters],
    queryFn: async ({ pageParam }) => {
      const cursor = typeof pageParam === 'number' ? pageParam : 0;
      const slice = prepared.slice(cursor, cursor + pageSize);
      const next = cursor + pageSize < prepared.length ? cursor + pageSize : null;
      const page: AuditPage = {
        items: slice,
        nextCursor: next as any,
        total: prepared.length,
      };
      // Simulate latency
      await new Promise(r => setTimeout(r, 150));
      return page;
    },
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextCursor ?? null,
  });
}
