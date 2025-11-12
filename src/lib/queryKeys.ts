// Centralized query key factory for better organization and type safety
export const queryKeys = {
  // Auth related keys
  auth: {
    all: ["auth"] as const,
    user: () => [...queryKeys.auth.all, "user"] as const,
    profile: () => [...queryKeys.auth.all, "profile"] as const,
    invitation: (token: string) =>
      [...queryKeys.auth.all, "invitation", token] as const,
    email: (token: string) => [...queryKeys.auth.all, "email", token] as const,
    reset: (token: string) => [...queryKeys.auth.all, "reset", token] as const,
  },

  // Quotations related keys
  quotations: {
    all: ["quotations"] as const,
    lists: () => [...queryKeys.quotations.all, "list"] as const,
    list: (filters: Record<string, unknown> | undefined) =>
      [...queryKeys.quotations.lists(), filters || {}] as const,
    details: () => [...queryKeys.quotations.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.quotations.details(), id] as const,
    stats: () => [...queryKeys.quotations.all, "stats"] as const,
    dashboard: (params: unknown) =>
      [...queryKeys.quotations.stats(), "dashboard", params || {}] as const,
    summary: () => [...queryKeys.quotations.all, "summary"] as const,
  },

  // Members related keys
  members: {
    all: ["members"] as const,
    lists: () => [...queryKeys.members.all, "list"] as const,
    list: (filters: unknown) =>
      [...queryKeys.members.lists(), filters || {}] as const,
    details: () => [...queryKeys.members.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.members.details(), id] as const,
  },

  // SKU related keys
  sku: {
    all: ["sku"] as const,
    categories: () => [...queryKeys.sku.all, "categories"] as const,
    brands: () => [...queryKeys.sku.all, "brands"] as const,
    lists: () => [...queryKeys.sku.all, "list"] as const,
    list: (filters: unknown, pageSize: number) =>
      [...queryKeys.sku.lists(), JSON.stringify(filters), pageSize] as const,
    search: (query: string) => [...queryKeys.sku.all, "search", query] as const,
    tempEdits: () => [...queryKeys.sku.all, 'temp-edits'] as const,
  },

  pricemaster: {
    all: ["pricemaster"] as const,
    categories: () => [...queryKeys.pricemaster.all, "categories"] as const,
    brands: () => [...queryKeys.pricemaster.all, "brands"] as const,
    lists: () => [...queryKeys.pricemaster.all, "list"] as const,
    list: (filters: unknown, pageSize: number) =>
      [...queryKeys.pricemaster.lists(), JSON.stringify(filters), pageSize] as const,
    details: () => [...queryKeys.pricemaster.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.pricemaster.details(), id] as const,
  },

  // Health related keys
  health: {
    all: ["health"] as const,
    status: () => [...queryKeys.health.all, "status"] as const,
    api: () => [...queryKeys.health.all, "api"] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
