import React from 'react';
import type { AuditEvent } from './AuditTypes';
import { typeMeta, getTagBackgroundColor, getTagTextColor } from './AuditUtils';

const AuditEventItem: React.FC<{ event: AuditEvent }> = ({ event }) => {
  const meta = typeMeta[event.type] || typeMeta.UNKNOWN;

  const getStandardMessage = () => {
    const actor = event.actor?.email || event.actor?.name || 'System';
    const target = event.meta?.targetEmail;
    
    switch (event.type) {
      case 'CREATED':
        return `Document was created by ${actor}`;
      case 'EDITED':
        return `Document was edited by ${actor}`;
      case 'SENT':
        return `Document was sent to ${target || actor}`;
      case 'VIEWED':
        return `Document was viewed by ${actor}`;
      case 'APPROVED':
        return `Document was approved by ${actor}`;
      case 'SIGNED':
        return `Document was signed by ${actor}`;
      case 'COMMENTED':
        return `Document was commented on by ${actor}`;
      case 'RESTORED':
        return `Document was restored by ${actor}`;
      case 'PERMISSION_CHANGED':
        return `Permissions were changed by ${actor}`;
      case 'FAILED':
        return `Action failed for ${actor}`;
      default:
        return event.message || `Activity by ${actor}`;
    }
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const timeStr = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(d);
    const dateStr = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
    return `${timeStr}, ${dateStr}`;
  };

  const renderMessage = () => {
    const actor = event.actor?.email || event.actor?.name || 'System';
    const target = event.meta?.targetEmail;
    
    switch (event.type) {
      case 'SENT':
        return (
          <>
            Document was sent to
            <br />
            {target || actor}
          </>
        );
      case 'SIGNED':
        return (
          <>
            Document was signed by
            <br />
            {actor}
          </>
        );
      default:
        return getStandardMessage();
    }
  };

  return (
    <li
      className="mx-3 my-2 p-3"
      style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#f4f2ed' }}
      aria-label={`${meta.label} by ${event.actor?.email || event.actor?.name || 'System'} at ${new Date(event.createdAt).toISOString()}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="mb-1.5">
            <span 
              className="inline-block px-2.5 py-1 rounded-full"
              style={{ 
                backgroundColor: getTagBackgroundColor(event.type),
                color: getTagTextColor(event.type),
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0%'
              }}
            >
              {meta.label}
            </span>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            <time dateTime={event.createdAt} title={event.createdAt}>{formatDateTime(event.createdAt)}</time>
          </div>
          <div className="border-l-2 border-gray-400 pl-3 ml-1 pb-2">
            <div className="text-sm text-gray-900 leading-relaxed">
              {renderMessage()}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default AuditEventItem;
