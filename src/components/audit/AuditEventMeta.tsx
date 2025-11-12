import React from 'react';
import type { AuditEvent } from './AuditTypes';
import { formatRelative } from './AuditUtils';

const copy = async (text: string) => {
  try { await navigator.clipboard.writeText(text); } catch {}
};

const AuditEventMeta: React.FC<{ event: AuditEvent }> = ({ event }) => {
  const actor = event.actor?.name || event.actor?.email || 'System';
  const target = event.meta?.targetEmail;
  const ip = event.meta?.ip;
  const when = formatRelative(event.createdAt);

  return (
    <div className="text-xs text-gray-500 flex flex-wrap items-center gap-1.5">
      <span className="truncate max-w-[180px] font-medium" title={actor}>{actor}</span>
      <span className="text-gray-300">•</span>
      <time dateTime={event.createdAt} title={event.createdAt} className="text-gray-500">{when}</time>
      {target && (
        <>
          <span className="text-gray-300">•</span>
          <button className="text-gray-500 hover:text-gray-700" title={`Copy ${target}`} onClick={() => copy(target)}>
            {target}
          </button>
        </>
      )}
      {ip && (
        <>
          <span className="text-gray-300">•</span>
          <span className="text-gray-400" title={ip}>
            {ip}
          </span>
        </>
      )}
    </div>
  );
};

export default AuditEventMeta;
