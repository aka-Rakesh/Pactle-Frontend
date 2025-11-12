import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import { toast } from "sonner";
import type { User } from "../types/common";

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (user: User, accessToken: string) => void;
  signup: (user: User, accessToken: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  clearError: () => void;
  initializeAuth: () => void;
  refreshToken: () => Promise<boolean>;
}

type AuthStore = AuthState & AuthActions;

// Cookie configuration
const COOKIE_CONFIG = {
  expires: 7, // 7 days
  secure: import.meta.env.PROD,
  sameSite: "strict" as const,
};

const COOKIE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
} as const;

// Helper functions for cookie management
const setCookie = (key: string, value: string) => {
  Cookies.set(key, value, COOKIE_CONFIG);
};

const getCookie = (key: string): string | undefined => {
  const value = Cookies.get(key);
  return value;
};

const removeCookie = (key: string) => {
  Cookies.remove(key);
};

const clearAuthCookies = () => {
  Object.values(COOKIE_KEYS).forEach((key) => removeCookie(key));
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isLoading: true,
      error: null,
      isAuthenticated: false,

      // Actions
      initializeAuth: () => {
        try {
          set({ isLoading: true, error: null });

          const accessToken = getCookie(COOKIE_KEYS.ACCESS_TOKEN);
          const refreshToken = getCookie(COOKIE_KEYS.REFRESH_TOKEN);
          const userData = getCookie(COOKIE_KEYS.USER_DATA);

          if (accessToken && refreshToken && userData) {
            try {
              const user = JSON.parse(userData);
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
              });
            } catch (error) {
              console.error("Failed to parse user data:", error);
              clearAuthCookies();
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("Auth initialization failed:", error);
          clearAuthCookies();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: "Authentication initialization failed",
          });
          toast.error("Authentication initialization failed");
        }
      },

      login: (user: User, accessToken: string) => {
        set({ isLoading: true, error: null });

        try {
          // Store tokens and user data in cookies
          setCookie(COOKIE_KEYS.ACCESS_TOKEN, accessToken);
          setCookie(COOKIE_KEYS.USER_DATA, JSON.stringify(user));

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          toast.success("Login successful!");
        } catch (error) {
          console.error("Login failed:", error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: "Login failed. Please try again.",
          });
        }
      },

      signup: (user: User, accessToken: string) => {
        set({ isLoading: true, error: null });

        try {
          // Store tokens and user data in cookies
          setCookie(COOKIE_KEYS.ACCESS_TOKEN, accessToken);
          setCookie(COOKIE_KEYS.USER_DATA, JSON.stringify(user));

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          toast.success(`Account created successfully! Welcome, ${user.name}!`);
        } catch (error) {
          console.error("Signup failed:", error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: "Signup failed. Please try again.",
          });
        }
      },

      logout: () => {
        try {
          clearAuthCookies();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          toast.success("You have been logged out successfully");
          window.location.replace("/login");
        } catch (error) {
          console.error("Logout failed:", error);
          toast.error("Logout failed, but you have been signed out locally");
        }
      },

      setUser: (user: User) => {
        set({ user });
        // Update user data in cookies
        setCookie(COOKIE_KEYS.USER_DATA, JSON.stringify(user));
      },

      clearError: () => {
        set({ error: null });
      },

      refreshToken: async () => {
        try {
          const refreshToken = getCookie(COOKIE_KEYS.REFRESH_TOKEN);
          if (!refreshToken) {
            return false;
          }

          // Import the auth API client dynamically to avoid circular dependencies
          const { authApi } = await import('../api/auth');
          const response = await authApi.refreshToken(refreshToken);
          
          if (response.access) {
            setCookie(COOKIE_KEYS.ACCESS_TOKEN, response.access);
            set({ isAuthenticated: true });
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('Token refresh failed:', error);
          return false;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Export cookie helpers for use in API layer
export { setCookie, getCookie, removeCookie, clearAuthCookies, COOKIE_KEYS };
