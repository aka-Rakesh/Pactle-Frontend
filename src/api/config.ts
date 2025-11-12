import type { ApiError } from '../types/common';

// Environment configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  FILE_PROCESS_BASE_URL: import.meta.env.VITE_API_URL  || 'http://localhost:8000',
  TIMEOUT: 30000, // 30 seconds
  FILE_PROCESS_TIMEOUT: Number(import.meta.env.VITE_FILE_PROCESS_TIMEOUT) || 300000, // 5 minutes
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/api/auth/signup/',
    LOGIN: '/api/auth/login/',
    SETUP_PASSWORD: '/api/auth/setup-password/',
    VERIFY_INVITATION: '/api/auth/verify-invitation/',
    VERIFY_EMAIL: '/api/auth/verify-email/',
    RESEND_VERIFICATION: '/api/auth/resend-verification/',
    VERIFY_RESET_TOKEN: '/api/auth/verify-reset-token/',
    RESET_PASSWORD: '/api/auth/reset-password/',
    FORGOT_PASSWORD: '/api/auth/forgot-password/',
    LOGOUT: '/api/auth/logout/',
    REFRESH: '/api/auth/refresh/',
    USERS: '/api/auth/users/',
    CREATE_USER: '/api/auth/users/create/',
    GET_USER: (id: number) => `/api/auth/users/${id}/`,
    UPDATE_USER: (id: number) => `/api/auth/users/${id}/`,
    DEACTIVATE_USER: (id: number) => `/api/auth/users/${id}/`,
    ACTIVATE_USER: (id: number) => `/api/auth/users/${id}/activate/`,
    RESEND_INVITATION: (id: number) => `/api/auth/users/${id}/resend-invitation/`,
    CHANGE_PASSWORD: (id: number) => `/api/auth/users/${id}/change-password/`,
  },
  ROLES: {
    CREATE_ROLES: '/api/auth/roles/create/',
    ROLES: '/api/auth/roles/',
    ROLES_DETAILS: (role_id: number) => `/api/auth/roles/${role_id}/`,
    UPDATE_ROLES: (role_id: number) => `/api/auth/roles/${role_id}/update/`,
    DELETE_ROLES: (role_id: number) => `/api/auth/roles/${role_id}/delete/`,
  },
  COMPANY: {
    INFO: '/api/auth/company-info/',
    CREATE_COMPANY: '/api/auth/company/create/',
    COMPANY_PROFILE: '/api/auth/company/profile/',
    UPDATE_COMPANY: '/api/auth/company/update/',
    COMPANY_USERS_SUMMARY: '/api/auth/company/users-summary/',
  },
  QUOTATIONS: {
    PROCESS_RFQ: '/api/quotations/rfq-proxy/process-pdf/',
    CREATE: `/api/quotations/llm-enhanced/process-direct/`,
    FINALIZE: '/api/quotations/llm-enhanced/finalize/',
    LIST: '/api/quotations/quotation/',
    DETAILS: (quote_id: string) => `/api/quotations/quotation/${quote_id}/`,
    UPDATE: (quote_id: string) => `/api/quotations/quotation/${quote_id}/update/`,
    DELETE: (quote_id: string) => `/api/quotations/quotation/${quote_id}/`,
    RFQ: (rfq_id: string) => `/api/quotations/rfq/${rfq_id}/`,
    SUMMARY: '/api/quotations/quotation/summary/',
    APPROVE: (quote_id: string) => `/api/quotations/quotation/${quote_id}/approve/`,
    UPLOAD_QUOTATION: `/api/quotations/llm-enhanced/upload-pdfs/`,
    SEND: (quote_id: string) => `/api/quotations/quotation/${quote_id}/send/`,
    EXPORT: '/api/quotations/quotation/export/',
    DOWNLOAD:(quote_id: string, attachment_id: string) => `/api/quotations/quotation/${quote_id}/download-attachment/${attachment_id}`,
    STATISTICS: {
      DASHBOARD: '/api/quotations/analytics/dashboard/',
    },
  },
  SKU: {
    LIST: '/api/sku/',
    DETAILS: (hsn_code: string) => `/api/sku/${hsn_code}/`,
    SUMMARY: '/api/sku/summary/',
    CATEGORIES: '/api/sku/categories/',
    BRANDS: '/api/sku/brands/',
    SEARCH: '/api/sku/search/',
    EXPORT: '/api/sku/export/',
    STATS: '/api/sku/stats/',
    UPLOAD_CSV: '/api/sku/upload-csv/',
  },
  PRICEMASTER: {
    LIST: '/api/pricemaster/',
    DETAILS: (id: number) => `/api/pricemaster/${id}/`,
    CATEGORIES: '/api/pricemaster/categories/',
    BRANDS: '/api/pricemaster/brands/',
    UPDATE_ITEM: '/api/pricemaster/update_item/',
    BULK_UPDATE: '/api/pricemaster/bulk_update_items/',
    CREATE: '/api/pricemaster/',
    UPDATE_BY_ID: (id: number) => `/api/pricemaster/${id}/`,
    DELETE: (id: number) => `/api/pricemaster/${id}/`,
    SEARCH: '/api/pricemaster/search/',
    CSV: '/api/pricemaster/upload-csv/',
  },
  RAW_MATERIALS: {
    LIST: '/api/rawmaterials/',
    CREATE: '/api/rawmaterials/',
    DETAILS: (id: number) => `/api/rawmaterials/${id}/`,
    UPDATE: (id: number) => `/api/rawmaterials/${id}/`,
    DELETE: (id: number) => `/api/rawmaterials/${id}/`,
    SEARCH: '/api/rawmaterials/search/',
    FILTER: '/api/rawmaterials/filter/',
    UPDATE_ITEM: '/api/rawmaterials/update_item/',
    BULK_UPDATE: '/api/rawmaterials/bulk_update_items/',
  },
  HEALTH: '/api/health/',
  USER: {
    PROFILE: '/api/auth/users/profile/',
    PROFILE_UPDATE: (id: number) => `/api/auth/users/${id}/`,
  },
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Token storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

// Custom error class for API errors
export class ApiErrorClass extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }

  static fromResponse(response: ApiError): ApiErrorClass {
    return new ApiErrorClass(response.message, response.status, response.errors);
  }
}

// HTTP headers configuration
export const getDefaultHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
});

export const getAuthHeaders = (token: string): HeadersInit => ({
  ...getDefaultHeaders(),
  'Authorization': `Bearer ${token}`,
});

// Request timeout utility
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = API_CONFIG.TIMEOUT
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
};