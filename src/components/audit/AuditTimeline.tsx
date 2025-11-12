import React, { useEffect, useRef } from 'react';
import type { AuditEvent } from './AuditTypes';
import AuditEventItem from './AuditEventItem';

export type AuditTimelineProps = {
  items: AuditEvent[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
};

const AuditTimeline: React.FC<AuditTimelineProps> = ({ items, hasNextPage, isFetchingNextPage, onLoadMore }) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || !onLoadMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          onLoadMore();
          break;
        }
      }
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, onLoadMore]);

  return (
    <div className="py-2">
      <ol role="list">
        {items.map((ev) => (
          <AuditEventItem key={ev.id} event={ev} />
        ))}
      </ol>
      {hasNextPage && (
        <div ref={sentinelRef} className="py-4 text-center text-xs text-gray-500">
          {isFetchingNextPage ? 'Loading…' : 'Load more'}
        </div>
      )}
    </div>
  );
};

export default AuditTimeline;
