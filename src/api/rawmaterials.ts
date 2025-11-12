import { API_CONFIG, API_ENDPOINTS, getAuthHeaders, withTimeout, ApiErrorClass } from './config';
import { getCookie, COOKIE_KEYS } from '../stores/authStore';
import type { 
  RawMaterialListResponse,
  RawMaterialDetailsResponse,
  RawMaterialCreatePayload,
  RawMaterialUpdatePayload,
  RawMaterialSearchResponse,
  RawMaterialFilterPayload,
  RawMaterialUpdateItemRequest,
  RawMaterialUpdateItemResponse,
  RawMaterialBulkUpdateRequest,
  RawMaterialBulkUpdateResponse,
  RawMaterialQueryParams
} from '../types/common';

class RawMaterialsApi {
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
      
      // Handle new API response format with success field
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

  async getRawMaterialsList(params?: RawMaterialQueryParams): Promise<RawMaterialListResponse> {
    return this.makeRequest<RawMaterialListResponse>(
      API_ENDPOINTS.RAW_MATERIALS.LIST,
      { method: 'GET' },
      params as Record<string, string | number | boolean>
    );
  }

  async getRawMaterialDetails(id: number): Promise<RawMaterialDetailsResponse> {
    return this.makeRequest<RawMaterialDetailsResponse>(
      API_ENDPOINTS.RAW_MATERIALS.DETAILS(id),
      { method: 'GET' }
    );
  }

  async createRawMaterial(payload: RawMaterialCreatePayload): Promise<RawMaterialDetailsResponse> {
    return this.makeRequest<RawMaterialDetailsResponse>(
      API_ENDPOINTS.RAW_MATERIALS.CREATE,
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

  async updateRawMaterial(id: number, payload: RawMaterialUpdatePayload): Promise<RawMaterialDetailsResponse> {
    return this.makeRequest<RawMaterialDetailsResponse>(
      API_ENDPOINTS.RAW_MATERIALS.UPDATE(id),
      {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(getCookie(COOKIE_KEYS.ACCESS_TOKEN) || ''),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );
  }

  async deleteRawMaterial(id: number): Promise<void> {
    return this.makeRequest<void>(
      API_ENDPOINTS.RAW_MATERIALS.DELETE(id),
      { method: 'DELETE' }
    );
  }

  async searchRawMaterials(query: string, params?: Omit<RawMaterialQueryParams, 'search'>): Promise<RawMaterialSearchResponse> {
    const finalParams: Record<string, string | number | boolean> = { q: query };
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) finalParams[k] = v as any;
      });
    }
    return this.makeRequest<RawMaterialSearchResponse>(
      API_ENDPOINTS.RAW_MATERIALS.SEARCH,
      { method: 'GET' },
      finalParams
    );
  }

  async filterRawMaterials(filterPayload: RawMaterialFilterPayload): Promise<RawMaterialListResponse> {
    return this.makeRequest<RawMaterialListResponse>(
      API_ENDPOINTS.RAW_MATERIALS.FILTER,
      {
        method: 'POST',
        headers: {
          ...getAuthHeaders(getCookie(COOKIE_KEYS.ACCESS_TOKEN) || ''),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filterPayload),
      }
    );
  }

  async updateRawMaterialItem(request: RawMaterialUpdateItemRequest): Promise<RawMaterialUpdateItemResponse> {
    return this.makeRequest<RawMaterialUpdateItemResponse>(
      API_ENDPOINTS.RAW_MATERIALS.UPDATE_ITEM,
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

  async bulkUpdateRawMaterials(requests: RawMaterialBulkUpdateRequest[]): Promise<RawMaterialBulkUpdateResponse> {
    return this.makeRequest<RawMaterialBulkUpdateResponse>(
      API_ENDPOINTS.RAW_MATERIALS.BULK_UPDATE,
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
}

export default new RawMaterialsApi();
