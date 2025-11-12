import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, userApi } from '../api';
import { useAuthStore } from '../stores';
import { queryKeys } from '../lib/queryKeys';
import type { LoginRequest, SignupRequest, SetupPasswordRequest, ResetPasswordRequest, ForgotPasswordRequest, ResendVerificationRequest } from '../types/common';

export const useLogin = () => {
  const { login: storeLogin } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await authApi.login(credentials);
      return response;
    },
    onSuccess: (data) => {
      // Update the store with the login data
      if (data.user && data.tokens.access) {
        storeLogin(data.user, data.tokens.access);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
};

export const useSignup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userData: SignupRequest) => {
      const response = await authApi.signup(userData);
      return response;
    },
    onSuccess: (data) => {
      console.log('Signup successful:', data);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
    },
    onError: (error) => {
      console.error('Signup failed:', error);
    },
  });
};

export const useLogout = () => {
  const { logout: storeLogout } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await authApi.logout();
    },
    onSuccess: () => {
      // Clear all queries and update store
      queryClient.clear();
      storeLogout();
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      queryClient.clear();
      storeLogout();
    },
  });
};

export const useUserProfile = () => {
  return useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: async () => {
      return await userApi.getProfile();
    },
    enabled: !!useAuthStore.getState().isAuthenticated,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, formData }: { userId: number; formData: FormData }) => {
      return await userApi.updateProfile(userId, formData);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.profile() });
      
      const previousProfile = queryClient.getQueryData(queryKeys.auth.profile());
      
      queryClient.setQueryData(queryKeys.auth.profile(), (old: any) => ({
        ...old,
      }));
      
      return { previousProfile };
    },
    onSuccess: (updatedUser) => {
      // Update the profile query cache
      queryClient.setQueryData(queryKeys.auth.profile(), updatedUser);
      // Update the auth store
      useAuthStore.getState().setUser(updatedUser);
    },
    onError: (_err, _variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(queryKeys.auth.profile(), context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
    },
  });
};

export const useVerifyInvitation = (token: string) => {
  return useQuery({
    queryKey: queryKeys.auth.invitation(token),
    queryFn: async () => {
      return await authApi.verifyInvitation(token);
    },
    enabled: !!token && token.length > 0,
  });
};

export const useSetupPassword = () => {
  const { login: storeLogin } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: SetupPasswordRequest) => {
      return await authApi.setupPassword(data);
    },
    onSuccess: (data) => {
      // Update the store with the setup password data
      if (data.user && data.tokens.access) {
        storeLogin(data.user, data.tokens.access);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
    },
    onError: (error) => {
      console.error('Setup password failed:', error);
    },
  });
};

export const useVerifyEmail = (token: string) => {
  return useQuery({
    queryKey: queryKeys.auth.email(token),
    queryFn: async () => {
      return await authApi.verifyEmail(token);
    },
    enabled: !!token && token.length > 0,
  });
};

export const useVerifyResetToken = (token: string) => {
  return useQuery({
    queryKey: queryKeys.auth.reset(token),
    queryFn: async () => {
      return await authApi.verifyResetToken(token);
    },
    enabled: !!token,
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (data: ResetPasswordRequest) => {
      return await authApi.resetPassword(data);
    },
    onError: (error) => {
      console.error('Reset password failed:', error);
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (data: ForgotPasswordRequest) => {
      return await authApi.forgotPassword(data);
    },
    onError: (error) => {
      console.error('Forgot password failed:', error);
    },
  });
};

export const useResendVerification = () => {
  return useMutation({
    mutationFn: async (data: ResendVerificationRequest) => {
      return await authApi.resendVerification(data);
    },
    onError: (error) => {
      console.error('Resend verification failed:', error);
    },
  });
}; 