import {
  API_CONFIG,
  getDefaultHeaders,
  getAuthHeaders,
  ApiErrorClass,
  withTimeout,
} from "./config";
import { getCookie, COOKIE_KEYS, useAuthStore } from '../stores/authStore';

export default class BaseApiClient {
  private async request<T>(
    url: string,
    options: RequestInit,
    auth: boolean = false
  ): Promise<T> {
    try {
      const headers = auth
        ? getAuthHeaders(getCookie(COOKIE_KEYS.ACCESS_TOKEN) || "")
        : getDefaultHeaders();

      const response = await withTimeout(
        fetch(`${API_CONFIG.BASE_URL}${url}`, {
          ...options,
          headers: {
            ...headers,
            ...(options.headers || {}),
          },
        })
      );

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // ignore JSON parse errors
        }

        if (response.status === 401 && auth) {
          const authStore = useAuthStore.getState();
          const refreshSuccess = await authStore.refreshToken();
          
          if (refreshSuccess) {
            const newHeaders = getAuthHeaders(getCookie(COOKIE_KEYS.ACCESS_TOKEN) || "");
            const retryResponse = await withTimeout(
              fetch(`${API_CONFIG.BASE_URL}${url}`, {
                ...options,
                headers: {
                  ...newHeaders,
                  ...(options.headers || {}),
                },
              })
            );

            if (!retryResponse.ok) {
              authStore.logout();
              throw new ApiErrorClass(
                "Authentication failed after token refresh",
                retryResponse.status,
                errorData.errors
              );
            }

            // Return the successful retry response
            if (retryResponse.status === 204 || retryResponse.status === 205) {
              return undefined as unknown as T;
            }
            const contentType = retryResponse.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
              return undefined as unknown as T;
            }
            try {
              return (await retryResponse.json()) as T;
            } catch {
              return undefined as unknown as T;
            }
          } else {
            authStore.logout();
            return undefined as unknown as T;
          }
        }

        // Construct a detailed error message
        let errorMessage = "Request failed";
        if (errorData?.errors) {
          errorMessage = Object.values(errorData.errors).flat().join(" ");
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        throw new ApiErrorClass(
          errorMessage,
          response.status,
          errorData.errors
        );
      }

      if (response.status === 204 || response.status === 205) {
        return undefined as unknown as T;
      }
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        return undefined as unknown as T;
      }

      try {
        return (await response.json()) as T;
      } catch {
        return undefined as unknown as T;
      }
    } catch (error) {
      if (error instanceof ApiErrorClass) {
        throw error;
      }
      throw error;
    }
  }

  protected get<T>(url: string, auth: boolean = false): Promise<T> {
    return this.request<T>(url, { method: "GET" }, auth);
  }

  protected post<T>(url: string, body: any, auth: boolean = false): Promise<T> {
    return this.request<T>(
      url,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      auth
    );
  }

  protected put<T>(url: string, body: any, auth: boolean = false): Promise<T> {
    return this.request<T>(
      url,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
      auth
    );
  }

  protected patch<T>(
    url: string,
    body: any,
    auth: boolean = false
  ): Promise<T> {
    return this.request<T>(
      url,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
      auth
    );
  }

  protected delete<T>(url: string, auth: boolean = false): Promise<T> {
    return this.request<T>(url, { method: "DELETE" }, auth);
  }
}
