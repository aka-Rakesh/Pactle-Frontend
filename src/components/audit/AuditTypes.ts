export type AuditEventType =
  | 'CREATED' | 'EDITED' | 'SENT' | 'VIEWED' | 'APPROVED' | 'SIGNED'
  | 'COMMENTED' | 'RESTORED' | 'PERMISSION_CHANGED' | 'FAILED' | 'UNKNOWN';

export type AuditActor = {
  id?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
};

export type AuditMeta = {
  targetEmail?: string;
  targetUserId?: string;
  ip?: string;
  userAgent?: string;
  location?: string;
  diffSummary?: string;
  requestId?: string;
  [k: string]: unknown;
};

export type AuditEvent = {
  id: string;
  type: AuditEventType;
  actor?: AuditActor;
  message?: string;
  createdAt: string; // ISO
  meta?: AuditMeta;
};

export type AuditPage = {
  items: AuditEvent[];
  nextCursor?: string | null;
  total?: number;
};

export type AuditFilters = {
  query: string;
  types: AuditEventType[];
  actor: string; // email or name substring
  dateFrom?: string; // ISO
  dateTo?: string;   // ISO
  sort: 'newest' | 'oldest';
};

export const DEFAULT_FILTERS: AuditFilters = {
  query: '',
  types: [],
  actor: '',
  sort: 'newest',
};
