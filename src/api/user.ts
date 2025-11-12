import BaseApiClient from './base';
import { API_ENDPOINTS, API_CONFIG } from './config';
import { getCookie, setCookie, COOKIE_KEYS } from '../stores/authStore';
import type { User } from '../types/common';

class UserApiClient extends BaseApiClient {
  
  async getProfile(): Promise<User> {
    try {
      const response = await this.get<any>(API_ENDPOINTS.USER.PROFILE, true);
      const user = response.user;
      return user;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  }

  async updateProfile(userId: number, formData: FormData): Promise<User> {
    try {
      const accessToken = getCookie(COOKIE_KEYS.ACCESS_TOKEN);
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.USER.PROFILE_UPDATE(userId)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      const result = await response.json();
      const user = result.user ;
      
      setCookie(COOKIE_KEYS.USER_DATA, JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }

  getCachedUser(): User | null {
    try {
      const userData = getCookie(COOKIE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to parse cached user data:', error);
      return null;
    }
  }
}

export const userApi = new UserApiClient();
export default userApi;