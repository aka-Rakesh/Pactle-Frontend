import BaseApiClient from './base';
import { API_ENDPOINTS } from './config';
import type { HealthResponse } from '../types/common';

class HealthApiClient extends BaseApiClient {
  
  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await this.get<HealthResponse>(API_ENDPOINTS.HEALTH);
      return response;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  async checkApiStatus(): Promise<string> {
    try {
      const response = await this.checkHealth();
      return response.status;
    } catch (error) {
      throw new Error('API is unavailable');
    }
  }
}

// Export singleton instance
export const healthApi = new HealthApiClient();

// Legacy export for backward compatibility
export const fetchApiHealth = async (): Promise<string> => {
  return await healthApi.checkApiStatus();
};

export default healthApi;