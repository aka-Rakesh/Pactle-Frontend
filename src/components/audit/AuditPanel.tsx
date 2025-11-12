import React from 'react';
import { useAuditStore } from './auditStore';
import { useAuditData } from './useAuditMock';
import AuditHeader from './AuditHeader';
import AuditControls from './AuditControls';
import AuditTimeline from './AuditTimeline';
import AuditSkeleton from './AuditSkeleton';
import AuditEmpty from './AuditEmpty';
import AuditError from './AuditError';

const AuditPanel: React.FC<{ documentId?: string; onClose?: () => void; className?: string }>
= ({ documentId, onClose, className }) => {
  const { filters, clear } = useAuditStore();
  const query = useAuditData(documentId, filters);

  const total = query.data?.pages?.[0]?.total ?? undefined;
  const items = query.data?.pages?.flatMap(p => p.items) ?? [];

  return (
    <aside className={`border-l border-gray-200 h-full flex flex-col ${className||''}`} style={{ backgroundColor: '#f4f2ed' }} aria-label="Audit Trail">
      <div className="px-4 py-2 border-b border-gray-200" style={{ backgroundColor: '#f4f2ed' }}>
        <AuditHeader total={total} onClose={onClose} />
      </div>
      <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: '#f4f2ed' }}>
        <AuditControls onClear={() => { clear(); }} actors={items.map(i => i.actor?.email || i.actor?.name || 'System')} />
      </div>
      <div 
        className="flex-1 overflow-y-auto" 
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {query.isError && <AuditError onRetry={() => query.refetch()} />}
        {query.isLoading && <AuditSkeleton rows={8} />}
        {!query.isLoading && items.length === 0 && (
          <AuditEmpty message={filters.query || filters.types.length || filters.actor || filters.dateFrom || filters.dateTo ? 'No events match your filters.' : undefined} />
        )}
        {items.length > 0 && (
          <AuditTimeline
            items={items}
            hasNextPage={Boolean(query.hasNextPage)}
            isFetchingNextPage={query.isFetchingNextPage}
            onLoadMore={() => query.fetchNextPage()}
          />
        )}
      </div>
    </aside>
  );
};

export default AuditPanel;
