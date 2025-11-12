import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '../api/member';
import { queryKeys } from '../lib/queryKeys';
import type { CreateMemberRequest, MembersQueryParams, UpdateMemberRequest } from '../types/common';

export const useMembers = (params?: MembersQueryParams) => {
  return useQuery({
    queryKey: queryKeys.members.list(params || {}),
    queryFn: async () => {
      return await membersApi.getMembers(params);
    },
  });
};

export const useCreateMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (memberData: CreateMemberRequest) => {
      return await membersApi.createMember(memberData);
    },
    onSuccess: () => {
      // Invalidate and refetch members list
      queryClient.invalidateQueries({ queryKey: queryKeys.members.lists() });
    },
    onError: (error) => {
      console.error('Create member failed:', error);
    },
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ memberId, updates }: { memberId: number; updates: UpdateMemberRequest }) => {
      return await membersApi.updateMember(memberId, updates);
    },
    onMutate: async ({ memberId, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.members.detail(memberId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.members.lists() });
      
      const previousMember = queryClient.getQueryData(queryKeys.members.detail(memberId));
      const previousMembersList = queryClient.getQueryData(queryKeys.members.lists());
      
      queryClient.setQueryData(queryKeys.members.detail(memberId), (old: any) => {
        if (!old) return old;
        const updatedMember = { ...old };
        Object.keys(updates).forEach(key => {
          if (updates[key as keyof typeof updates] !== undefined) {
            updatedMember[key as keyof typeof updatedMember] = updates[key as keyof typeof updates];
          }
        });
        return updatedMember;
      });
      
      queryClient.setQueryData(queryKeys.members.lists(), (old: any) => {
        if (!old?.data?.members) return old;
        return {
          ...old,
          data: {
            ...old.data,
            members: old.data.members.map((member: any) => {
              if (member.id === memberId) {
                const updatedMember = { ...member };
                Object.keys(updates).forEach(key => {
                  if (updates[key as keyof typeof updates] !== undefined) {
                    updatedMember[key as keyof typeof updatedMember] = updates[key as keyof typeof updates];
                  }
                });
                return updatedMember;
              }
              return member;
            }),
          },
        };
      });
      
      return { previousMember, previousMembersList };
    },
    onSuccess: (updatedMember) => {
      // Update the specific member in the cache
      queryClient.setQueryData(queryKeys.members.detail(updatedMember.id), updatedMember);
      // Invalidate the list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.members.lists() });
    },
    onError: (_err, { memberId }, context) => {
      if (context?.previousMember) {
        queryClient.setQueryData(queryKeys.members.detail(memberId), context.previousMember);
      }
      if (context?.previousMembersList) {
        queryClient.setQueryData(queryKeys.members.lists(), context.previousMembersList);
      }
    },
    onSettled: (_data, _error, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.detail(memberId) });
    },
  });
};

export const useDeactivateMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (memberId: number) => {
      await membersApi.deactivateMember(memberId);
    },
    onMutate: async (memberId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.members.detail(memberId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.members.lists() });
      
      const previousMember = queryClient.getQueryData(queryKeys.members.detail(memberId));
      const previousMembersList = queryClient.getQueryData(queryKeys.members.lists());
      
      queryClient.setQueryData(queryKeys.members.detail(memberId), (old: any) => 
        old ? { ...old, status: 'INACTIVE', is_active: false } : old
      );
      
      queryClient.setQueryData(queryKeys.members.lists(), (old: any) => {
        if (!old?.data?.members) return old;
        return {
          ...old,
          data: {
            ...old.data,
            members: old.data.members.map((member: any) =>
              member.id === memberId ? { ...member, status: 'INACTIVE', is_active: false } : member
            ),
          },
        };
      });
      
      return { previousMember, previousMembersList };
    },
    onSuccess: (_) => {
      // Invalidate the list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.members.lists() });
    },
    onError: (_error, memberId, context: any) => {
      if (context?.previousMember) {
        queryClient.setQueryData(queryKeys.members.detail(memberId), context.previousMember);
      }
      if (context?.previousMembersList) {
        queryClient.setQueryData(queryKeys.members.lists(), context.previousMembersList);
      }
    },
    onSettled: (_data, _error, memberId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.detail(memberId) });
    },
  });
};

export const useActivateMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (memberId: number) => {
      await membersApi.activateMember(memberId);
    },
    onMutate: async (memberId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.members.detail(memberId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.members.lists() });
      
      const previousMember = queryClient.getQueryData(queryKeys.members.detail(memberId));
      const previousMembersList = queryClient.getQueryData(queryKeys.members.lists());
      
      queryClient.setQueryData(queryKeys.members.detail(memberId), (old: any) => 
        old ? { ...old, status: 'ACTIVE', is_active: true } : old
      );
      
      queryClient.setQueryData(queryKeys.members.lists(), (old: any) => {
        if (!old?.data?.members) return old;
        return {
          ...old,
          data: {
            ...old.data,
            members: old.data.members.map((member: any) =>
              member.id === memberId ? { ...member, status: 'ACTIVE', is_active: true } : member
            ),
          },
        };
      });
      
      return { previousMember, previousMembersList };
    },
    onSuccess: (_) => {
      // Invalidate the list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.members.lists() });
    },
    onError: (_error, memberId, context: any) => {
      if (context?.previousMember) {
        queryClient.setQueryData(queryKeys.members.detail(memberId), context.previousMember);
      }
      if (context?.previousMembersList) {
        queryClient.setQueryData(queryKeys.members.lists(), context.previousMembersList);
      }
    },
    onSettled: (_data, _error, memberId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.detail(memberId) });
    },
  });
};

export const useResendInvitation = () => {
  return useMutation({
    mutationFn: async (memberId: number) => {
      await membersApi.resendInvitation(memberId);
    },
    onError: (error) => {
      console.error('Resend invitation failed:', error);
    },
  });
}; 