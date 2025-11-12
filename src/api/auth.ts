import BaseApiClient from './base';
import { API_ENDPOINTS } from './config';
import { setCookie, getCookie, clearAuthCookies, COOKIE_KEYS } from '../stores/authStore';
import type { 
  LoginRequest, 
  LoginResponse, 
  SignupRequest, 
  SignupResponse, 
  User, 
  VerifyInvitationResponse, 
  SetupPasswordRequest, 
  SetupPasswordResponse,
  VerifyEmailResponse,
  VerifyResetTokenResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
  CompanyInfoResponse,
  RefreshTokenResponse
} from '../types/common';

class AuthApiClient extends BaseApiClient {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
      setCookie(COOKIE_KEYS.ACCESS_TOKEN, response.tokens.access);
      setCookie(COOKIE_KEYS.REFRESH_TOKEN, response.tokens.refresh);
      const userData = {
       ...response.user
      };
      setCookie(COOKIE_KEYS.USER_DATA, JSON.stringify(userData));
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async signup(userData: SignupRequest): Promise<SignupResponse> {
    try {
      const response = await this.post<SignupResponse>(API_ENDPOINTS.AUTH.SIGNUP, userData);
      return response;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await this.post<RefreshTokenResponse>(API_ENDPOINTS.AUTH.REFRESH, { refresh: refreshToken });
      if (response.access) {
        setCookie(COOKIE_KEYS.ACCESS_TOKEN, response.access);
      }
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = getCookie(COOKIE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        await this.post(API_ENDPOINTS.AUTH.LOGOUT, { refresh: refreshToken });
      }
        } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      clearAuthCookies();
    }
  }

  async verifyInvitation(token: string): Promise<VerifyInvitationResponse> {
    try {
      const response = await this.get<VerifyInvitationResponse>(`${API_ENDPOINTS.AUTH.VERIFY_INVITATION}?token=${encodeURIComponent(token)}`);
      return response;
    } catch (error) {
      console.error('Verify invitation failed:', error);
      throw error;
    }
  }

  async setupPassword(data: SetupPasswordRequest): Promise<SetupPasswordResponse> {
    try {
      const response = await this.post<SetupPasswordResponse>(API_ENDPOINTS.AUTH.SETUP_PASSWORD, data);
      setCookie(COOKIE_KEYS.ACCESS_TOKEN, response.tokens.access);
      setCookie(COOKIE_KEYS.REFRESH_TOKEN, response.tokens.refresh);
      const userData = {
        ...response.user
      };
      setCookie(COOKIE_KEYS.USER_DATA, JSON.stringify(userData));
      return response;
    } catch (error) {
      console.error('Setup password failed:', error);
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    try {
      const response = await this.post<VerifyEmailResponse>(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
      const anyResponse: any = response as any;
      if (anyResponse?.tokens?.access) {
        setCookie(COOKIE_KEYS.ACCESS_TOKEN, anyResponse.tokens.access);
        if (anyResponse.tokens.refresh) {
          setCookie(COOKIE_KEYS.REFRESH_TOKEN, anyResponse.tokens.refresh);
        }
        if (anyResponse.user) {
          setCookie(COOKIE_KEYS.USER_DATA, JSON.stringify(anyResponse.user));
        }
      }
      return response;
    } catch (error) {
      console.error('Verify email failed:', error);
      throw error;
    }
  }

  async verifyResetToken(token: string): Promise<VerifyResetTokenResponse> {
    try {
      const response = await this.get<VerifyResetTokenResponse>(`${API_ENDPOINTS.AUTH.VERIFY_RESET_TOKEN}?token=${encodeURIComponent(token)}`);
      return response;
    } catch (error) {
      console.error('Verify reset token failed:', error);
      throw error;
    }
  }

  async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    try {
      const response = await this.post<ResetPasswordResponse>(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
      return response;
    } catch (error) {
      console.error('Reset password failed:', error);
      throw error;
    }
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    try {
      const response = await this.post<ForgotPasswordResponse>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
      return response;
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  }

  async resendVerification(data: ResendVerificationRequest): Promise<ResendVerificationResponse> {
    try {
      const response = await this.post<ResendVerificationResponse>(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, data);
      return response;
    } catch (error) {
      console.error('Resend verification failed:', error);
      throw error;
    }
  }

  async getCompanyInfo(domain: string): Promise<CompanyInfoResponse> {
    try {
      const response = await this.get<CompanyInfoResponse>(`${API_ENDPOINTS.COMPANY.INFO}?domain=${encodeURIComponent(domain)}`);
      return response;
    } catch (error) {
      console.error('Get company info failed:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    try {
      const userData = getCookie(COOKIE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  getAccessToken(): string | null {
    return getCookie(COOKIE_KEYS.ACCESS_TOKEN) || null;
  }

  getRefreshToken(): string | null {
    return getCookie(COOKIE_KEYS.REFRESH_TOKEN) || null;
  }

  isAuthenticated(): boolean {
    const accessToken = getCookie(COOKIE_KEYS.ACCESS_TOKEN);
    const refreshToken = getCookie(COOKIE_KEYS.REFRESH_TOKEN);
    return !!(accessToken && refreshToken);
  }
}

export const authApi = new AuthApiClient();
export default authApi;
