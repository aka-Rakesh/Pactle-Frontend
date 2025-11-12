import { API_CONFIG, API_ENDPOINTS, getAuthHeaders, withTimeout, ApiErrorClass } from './config';
import { getCookie, COOKIE_KEYS } from '../stores/authStore';
import type { 
  DashboardStatisticsResponse, 
  TimeRangeParams,
  ProcessRFQResponse,
  QuotationListResponse,
  QuotationDetailsResponse,
  QuotationUpdateRequest,
  QuotationUpdateResponse,
} from '../types/common';

class QuotationApi {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    params?: Record<string, string | number | boolean>,
    timeoutOverrideMs?: number
  ): Promise<T> {
    const token = getCookie(COOKIE_KEYS.ACCESS_TOKEN);
    if (!token) {
      throw new ApiErrorClass('No authentication token found', 401);
    }

    const isFileProcessEndpoint = endpoint.includes('/api/quotations/rfq-proxy/process-pdf/');
    const baseUrl = isFileProcessEndpoint ? API_CONFIG.FILE_PROCESS_BASE_URL : API_CONFIG.BASE_URL;
    const url = new URL(`${baseUrl}${endpoint}`);
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
        headers: {
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },
      }),
      timeoutOverrideMs
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

  // Process RFQ
  async processRFQ(data: FormData | object): Promise<ProcessRFQResponse> {
    const isFormData = data instanceof FormData;
    const token = getCookie(COOKIE_KEYS.ACCESS_TOKEN);
    const options: RequestInit = {
      method: 'POST',
      headers: isFormData ? {} : getAuthHeaders(token || ''),
      body: isFormData ? data : JSON.stringify(data),
    };

    return this.makeRequest<ProcessRFQResponse>(
      API_ENDPOINTS.QUOTATIONS.PROCESS_RFQ,
      options,
      undefined,
      API_CONFIG.FILE_PROCESS_TIMEOUT
    );
  }

  async createQuotation(payload:any): Promise<QuotationDetailsResponse> {
    return this.makeRequest<QuotationDetailsResponse>(
      API_ENDPOINTS.QUOTATIONS.CREATE,
      {
        method: 'POST',
        headers: getAuthHeaders(getCookie(COOKIE_KEYS.ACCESS_TOKEN) || ''),
        body: JSON.stringify(payload),
      }
    );
  }

  async finalizeSelections(payload: { quotation_id: string; selections?: Record<string, string>; manual_items?: any[] }): Promise<{ success: boolean; quotation: any; message?: string }> {
    return this.makeRequest(
      API_ENDPOINTS.QUOTATIONS.FINALIZE,
      {
        method: 'POST',
        headers: getAuthHeaders(getCookie(COOKIE_KEYS.ACCESS_TOKEN) || ''),
        body: JSON.stringify(payload),
      }
    );
  }

  // List quotations
  async getQuotations(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    search?: string;
    content_type?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<QuotationListResponse> {
    const raw = await this.makeRequest<any>(
      API_ENDPOINTS.QUOTATIONS.LIST,
      { method: 'GET' },
      params
    );

    if (raw && raw.success && raw.data && raw.data.quotations) {
      return raw as QuotationListResponse;
    }

    if (raw && Array.isArray(raw.results)) {
      const quotations = raw.results.map((r: any) => ({
        quote_id: r.quote_id,
        status: r.status,
        content_type: r.content_type,
        created_at: r.created_at,
        expires_at: r.expires_at,
        is_expired: Boolean(r.is_expired),
        total_amount: typeof r.total_amount === 'string' ? parseFloat(r.total_amount) : (r.total_amount ?? 0),
        items_count: r.items_count,
        match_rate: r.match_rate,
        rfq_preview: r.rfq_preview,
        company_name: r.company_name,
        email: r.email,
        rfq_id: r.rfq_id,
        customer_info: r.customer_info,
      }));

      const currentPage = params?.page || 1;
      const pageSize = params?.page_size || 20;
      const totalItems = raw.count || 0;
      const totalPages = Math.ceil(totalItems / pageSize);
      const hasNext = Boolean(raw.next);
      const hasPrevious = Boolean(raw.previous);

      const normalized: QuotationListResponse = {
        success: true,
        data: {
          quotations,
          pagination: {
            current_page: currentPage,
            page_size: pageSize,
            total_items: totalItems,
            total_pages: totalPages,
            has_next: hasNext,
            has_previous: hasPrevious,
          },
          filters: {
            status: params?.status ?? '',
            content_type: params?.content_type ?? '',
            from_date: params?.from_date ?? '',
            to_date: params?.to_date ?? '',
          },
          company_info: {
            id: 0,
            name: raw.results?.[0]?.company_name,
            slug: '',
          },
        },
      };

      return normalized;
    }

    return {
      success: true,
      data: {
        quotations: [],
        pagination: {
          current_page: 1,
          page_size: 0,
          total_items: 0,
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
        filters: { status: '', content_type: '', from_date: '', to_date: '' },
        company_info: { id: 0, name: '', slug: '' },
      },
    } as QuotationListResponse;
  }

  // Get quotation details
  async getQuotationDetails(quoteId: string): Promise<QuotationDetailsResponse> {
    return this.makeRequest<QuotationDetailsResponse>(
      API_ENDPOINTS.QUOTATIONS.DETAILS(quoteId),
      { method: 'GET' }
    );
  }

  

  // Update quotation
  async updateQuotation(quoteId: string, data: QuotationUpdateRequest): Promise<QuotationUpdateResponse> {
    const token = getCookie(COOKIE_KEYS.ACCESS_TOKEN);
    return this.makeRequest<QuotationUpdateResponse>(
      API_ENDPOINTS.QUOTATIONS.UPDATE(quoteId),
      {
        method: 'PATCH',
        headers: getAuthHeaders(token || ''),
        body: JSON.stringify(data),
      }
    );
  }

  // Delete quotation
  async deleteQuotation(quoteId: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(
      API_ENDPOINTS.QUOTATIONS.DELETE(quoteId),
      { method: 'DELETE' }
    );
  }

  // Approve quotation
  async approveQuotation(quoteId: string): Promise<QuotationUpdateResponse> {
    return this.makeRequest<QuotationUpdateResponse>(
      API_ENDPOINTS.QUOTATIONS.APPROVE(quoteId),
      { method: 'POST' }
    );
  }

  async uploadQuotationPdfs(formData: FormData): Promise<any> {
    return this.makeRequest(
      API_ENDPOINTS.QUOTATIONS.UPLOAD_QUOTATION,
      {
        method: 'POST',
        body: formData,
      },
      undefined,
      API_CONFIG.FILE_PROCESS_TIMEOUT
    );
  }

  // Send quotation
  async sendQuotation(quoteId: string): Promise<QuotationUpdateResponse> {
    return this.makeRequest<QuotationUpdateResponse>(
      API_ENDPOINTS.QUOTATIONS.SEND(quoteId),
      { method: 'POST' }
    );
  }

  // Export quotations
  async exportQuotations(): Promise<any> {
    return this.makeRequest(
      API_ENDPOINTS.QUOTATIONS.EXPORT,
      { method: 'GET' }
    );
  }

  // Statistics endpoints
  async getDashboardStatistics(params?: TimeRangeParams): Promise<DashboardStatisticsResponse> {
    return this.makeRequest<DashboardStatisticsResponse>(
      API_ENDPOINTS.QUOTATIONS.STATISTICS.DASHBOARD,
      { method: 'GET' },
      params as Record<string, string | number | boolean>
    );
  }
}

export default new QuotationApi(); 