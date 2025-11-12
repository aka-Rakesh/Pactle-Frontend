const en: Record<string, string> = {
  'audit.title': 'Audit Trail',
  'audit.clear': 'Clear filters',
  'audit.search.placeholder': 'Search activity',
  'audit.filters.type': 'Type',
  'audit.filters.actor': 'Actor',
  'audit.filters.date': 'Date',
  'audit.sort.newest': 'Newest',
  'audit.sort.oldest': 'Oldest',
  'audit.empty': 'No activity yet.',
  'audit.no_results': 'No events match your filters.',
  'audit.loading': 'Loading...',
  'audit.error': 'Something went wrong',
  'audit.retry': 'Retry',
  'audit.more': 'More details',
  'audit.less': 'Hide details',
};

export const t = (key: string) => en[key] ?? key;
