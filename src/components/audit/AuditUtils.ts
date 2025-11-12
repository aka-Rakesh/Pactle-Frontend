import { IconAlertTriangle, IconBadge, IconEdit, IconEye, IconFilePlus, IconHistory, IconMail, IconMessageCircle, IconShield, IconSignature } from '@tabler/icons-react';
import type { AuditEventType } from './AuditTypes';

export const typeMeta: Record<AuditEventType, { label: string; color: string; icon: React.ComponentType<any> }> = {
  CREATED: { label: 'CREATED', color: 'text-gray-900', icon: IconFilePlus },
  EDITED: { label: 'EDITED', color: 'text-gray-900', icon: IconEdit },
  SENT: { label: 'SENT', color: 'text-gray-900', icon: IconMail },
  VIEWED: { label: 'VIEWED', color: 'text-gray-900', icon: IconEye },
  APPROVED: { label: 'APPROVED', color: 'text-gray-900', icon: IconBadge },
  SIGNED: { label: 'SIGNED', color: 'text-gray-900', icon: IconSignature },
  COMMENTED: { label: 'COMMENTED', color: 'text-gray-900', icon: IconMessageCircle },
  RESTORED: { label: 'RESTORED', color: 'text-gray-900', icon: IconHistory },
  PERMISSION_CHANGED: { label: 'PERMISSIONS', color: 'text-gray-900', icon: IconShield },
  FAILED: { label: 'FAILED', color: 'text-gray-900', icon: IconAlertTriangle },
  UNKNOWN: { label: 'ACTIVITY', color: 'text-gray-900', icon: IconHistory },
};

export const getTagBackgroundColor = (type: AuditEventType): string => {
  switch (type) {
    case 'APPROVED':
    case 'VIEWED':
      return '#d3b0b0';
    case 'EDITED':
    case 'CREATED':
      return '#b8d3b0';
    case 'SENT':
    case 'SIGNED':
      return '#b0bcd3';
    default:
      return '#e5e7eb'; // gray-200 fallback
  }
};

export const getTagTextColor = (type: AuditEventType): string => {
  switch (type) {
    case 'APPROVED':
    case 'VIEWED':
      return '#482828';
    case 'EDITED':
    case 'CREATED':
      return '#2F4828';
    case 'SENT':
    case 'SIGNED':
      return '#283348';
    default:
      return '#374151'; // gray-700 fallback
  }
};

export const formatRelative = (iso: string, locale?: string) => {
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat(locale || undefined, { hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short', year: 'numeric' });
  return fmt.format(d);
};
