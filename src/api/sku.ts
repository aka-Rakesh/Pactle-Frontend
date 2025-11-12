import { API_CONFIG, API_ENDPOINTS, getAuthHeaders, withTimeout, ApiErrorClass } from './config';
import { getCookie, COOKIE_KEYS } from '../stores/authStore';
import type { 
  SKUListResponse,
  SKUDetailsResponse,
  SKUCategoriesResponse,
  SKUBrandsResponse,
  SKUSearchResponse,
  SKUStatsResponse,
  SKUQueryParams
} from '../types/common';

class SKUApi {
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

    const data = await response.json();
    
    if (data && typeof data === 'object' && 'success' in data) {
      if (!data.success) {
        throw ApiErrorClass.fromResponse({
          message: data.error?.message || data.message || 'Request failed',
          status: response.status,
          errors: data.error?.details || data.errors,
        });
      }
      return data;
    }
    
    return data;
  }

  async getSKUList(params?: SKUQueryParams): Promise<SKUListResponse> {
    return this.makeRequest<SKUListResponse>(
      API_ENDPOINTS.SKU.LIST,
      { method: 'GET' },
      params as Record<string, string | number | boolean>
    );
  }

  async getSKUDetails(hsn_code: string): Promise<SKUDetailsResponse> {
    return this.makeRequest<SKUDetailsResponse>(
      API_ENDPOINTS.SKU.DETAILS(hsn_code),
      { method: 'GET' }
    );
  }

  async getSKUCategories(): Promise<SKUCategoriesResponse> {
    return this.makeRequest<SKUCategoriesResponse>(
      API_ENDPOINTS.SKU.CATEGORIES,
      { method: 'GET' }
    );
  }

  async getSKUBrands(): Promise<SKUBrandsResponse> {
    return this.makeRequest<SKUBrandsResponse>(
      API_ENDPOINTS.SKU.BRANDS,
      { method: 'GET' }
    );
  }

  async searchSKU(params?: SKUQueryParams): Promise<SKUSearchResponse> {
    return this.makeRequest<SKUSearchResponse>(
      API_ENDPOINTS.SKU.SEARCH,
      { method: 'GET' },
      params as Record<string, string | number | boolean>
    );
  }

  async getSKUStats(): Promise<SKUStatsResponse> {
    return this.makeRequest<SKUStatsResponse>(
      API_ENDPOINTS.SKU.STATS,
      { method: 'GET' }
    );
  }

  async exportSKUData(format: string, includeFields?: string[]): Promise<any> {
    const params: Record<string, string> = { format };
    if (includeFields) {
      params.include_fields = JSON.stringify(includeFields);
    }
    
    return this.makeRequest(
      API_ENDPOINTS.SKU.EXPORT,
      { method: 'GET' },
      params
    );
  }
}

export default new SKUApi(); 