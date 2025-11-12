import { API_CONFIG, API_ENDPOINTS, getAuthHeaders, withTimeout, ApiErrorClass } from './config';
import { getCookie, COOKIE_KEYS } from '../stores/authStore';
import type { 
  PriceMasterListResponse,
  PriceMasterDetailsResponse,
  PriceMasterCategoriesResponse,
  PriceMasterBrandsResponse,
  PriceMasterUpdateItemRequest,
  PriceMasterUpdateItemResponse,
  PriceMasterBulkUpdateRequest,
  PriceMasterBulkUpdateResponse,
  PriceMasterQueryParams,
  PriceMasterItem,
  PriceMasterCreatePayload,
  PriceMasterCreateResponse
} from '../types/common';

class PriceMasterApi {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    params?: Record<string, string | number | boolean>
  ): Promise<T> {
    const token = getCookie(COOKIE_KEYS.ACCESS_TOKEN);
    
    if (!token) {
      throw new ApiErrorClass('No authentication token found', 401);
    }

    const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await withTimeout(
      fetch(url.toString(), {
        ...options,
        headers: getAuthHeaders(token),
      })
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw ApiErrorClass.fromResponse({
        message: errorData.message || `HTTP ${response.status}`,
        status: response.status,
        errors: errorData.errors,
      });
    }

    if (response.status === 204 || response.status === 205) {
      return undefined as unknown as T;
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return undefined as unknown as T;
    }
    try {
      const data = await response.json();
      
      if (data && typeof data === 'object' && 'success' in data) {
        if (!data.success) {
          throw ApiErrorClass.fromResponse({
            message: data.error?.message || data.message || 'Request failed',
            status: response.status,
            errors: data.error?.details || data.errors,
          });
        }
        return data as T;
      }
      
      return data as T;
    } catch (error) {
      if (error instanceof ApiErrorClass) {
        throw error;
      }
      return undefined as unknown as T;
    }
  }

  async getPriceMasterList(params?: PriceMasterQueryParams): Promise<PriceMasterListResponse> {
    return this.makeRequest<PriceMasterListResponse>(
      API_ENDPOINTS.PRICEMASTER.LIST,
      { method: 'GET' },
      params as Record<string, string | number | boolean>
    );
  }

  async getPriceMasterDetails(id: number): Promise<PriceMasterDetailsResponse> {
    return this.makeRequest<PriceMasterDetailsResponse>(
      API_ENDPOINTS.PRICEMASTER.DETAILS(id),
      { method: 'GET' }
    );
  }

  async getPriceMasterCategories(): Promise<PriceMasterCategoriesResponse> {
    return this.makeRequest<PriceMasterCategoriesResponse>(
      API_ENDPOINTS.PRICEMASTER.CATEGORIES,
      { method: 'GET' }
    );
  }

  async getPriceMasterBrands(): Promise<PriceMasterBrandsResponse> {
    return this.makeRequest<PriceMasterBrandsResponse>(
      API_ENDPOINTS.PRICEMASTER.BRANDS,
      { method: 'GET' }
    );
  }

  async updatePriceMasterItem(request: PriceMasterUpdateItemRequest): Promise<PriceMasterUpdateItemResponse> {
    return this.makeRequest<PriceMasterUpdateItemResponse>(
      API_ENDPOINTS.PRICEMASTER.UPDATE_ITEM,
      {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(getCookie(COOKIE_KEYS.ACCESS_TOKEN) || ''),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );
  }

  async bulkUpdatePriceMasterItems(requests: PriceMasterBulkUpdateRequest[]): Promise<PriceMasterBulkUpdateResponse> {
    return this.makeRequest<PriceMasterBulkUpdateResponse>(
      API_ENDPOINTS.PRICEMASTER.BULK_UPDATE,
      {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(getCookie(COOKIE_KEYS.ACCESS_TOKEN) || ''),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requests),
      }
    );
  }

  async createPriceMasterItem(payload: PriceMasterCreatePayload): Promise<PriceMasterCreateResponse> {
    return this.makeRequest<PriceMasterCreateResponse>(
      API_ENDPOINTS.PRICEMASTER.CREATE,
      {
        method: 'POST',
        headers: {
          ...getAuthHeaders(getCookie(COOKIE_KEYS.ACCESS_TOKEN) || ''),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );
  }

  async updatePriceMasterById(id: number, payload: Partial<PriceMasterItem>): Promise<PriceMasterDetailsResponse> {
    return this.makeRequest<PriceMasterDetailsResponse>(
      API_ENDPOINTS.PRICEMASTER.UPDATE_BY_ID(id),
      {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(getCookie(COOKIE_KEYS.ACCESS_TOKEN) || ''),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );
  }

  async deletePriceMasterItem(id: number): Promise<void> {
    return this.makeRequest<void>(
      API_ENDPOINTS.PRICEMASTER.DELETE(id),
      { method: 'DELETE' }
    );
  }

  async searchPriceMaster(query: string, params?: Omit<PriceMasterQueryParams, 'search'>): Promise<PriceMasterListResponse> {
    const finalParams: Record<string, string | number | boolean> = { q: query };
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) finalParams[k] = v as any;
      });
    }
    return this.makeRequest<PriceMasterListResponse>(
      API_ENDPOINTS.PRICEMASTER.SEARCH,
      { method: 'GET' },
      finalParams
    );
  }

  async uploadCSV(file: File): Promise<{ success: boolean; processed: number }>{
    const token = getCookie(COOKIE_KEYS.ACCESS_TOKEN);
    if (!token) {
      throw new ApiErrorClass('No authentication token found', 401);
    }
    const formData = new FormData();
    formData.append('file', file);
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.PRICEMASTER.CSV}`;
    const response = await withTimeout(
      fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw ApiErrorClass.fromResponse({
        message: errorData.message || `HTTP ${response.status}`,
        status: response.status,
        errors: errorData.errors,
      });
    }
    return response.json();
  }
}

export default new PriceMasterApi();
