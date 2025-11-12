import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { ApiErrorClass } from "../api";
import { useAuthStore } from "../stores/authStore";

export function createQueryClient(): QueryClient {
  // Create query cache with error handler
  const queryCache = new QueryCache({
    onError: (error: unknown) => {
      if (error instanceof ApiErrorClass && error.status === 401) {
        // Handle 401 errors globally
        const authStore = useAuthStore.getState();
        authStore.logout();
      }
    },
  });

  // Create mutation cache with error handler
  const mutationCache = new MutationCache({
    onError: (error: unknown) => {
      if (error instanceof ApiErrorClass && error.status === 401) {
        // Handle 401 errors globally
        const authStore = useAuthStore.getState();
        authStore.logout();
      }
    },
  });

  return new QueryClient({
    queryCache,
    mutationCache,
    defaultOptions: {
      queries: {
        // Time in milliseconds that data is considered fresh
        staleTime: 10 * 60 * 1000, // 10 minutes (increased from 5)
        // Time in milliseconds that data is kept in cache
        gcTime: 30 * 60 * 1000, // 30 minutes (increased from 10)
        // Retry failed requests
        retry: (failureCount, error: unknown) => {
          // Don't retry on 4xx errors (client errors)
          if (
            error instanceof ApiErrorClass &&
            error.status >= 400 &&
            error.status < 500
          ) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        // Refetch on window focus
        refetchOnWindowFocus: false,
        // Refetch on reconnect
        refetchOnReconnect: true,
        // Enable structural sharing for better performance
        structuralSharing: true,
        // Reduce unnecessary refetches
        refetchOnMount: false,
        // Optimize for frequently changing data
        refetchInterval: false,
      },
      mutations: {
        // Retry failed mutations
        retry: (failureCount, error: unknown) => {
          // Don't retry on 4xx errors (client errors)
          if (
            error instanceof ApiErrorClass &&
            error.status >= 400 &&
            error.status < 500
          ) {
            return false;
          }
          // Retry up to 1 time for other errors
          return failureCount < 1;
        },
        networkMode: 'online',
      },
    },
  });
}
