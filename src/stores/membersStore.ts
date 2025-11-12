import { create } from 'zustand';
import { toast } from 'sonner';
import { membersApi } from '../api/member';
import type { CreateMemberRequest, Member, MembersQueryParams, Role, UpdateMemberRequest } from '../types/common';
import { ApiErrorClass } from '../api';


interface MembersState {
  members: Member[];
  roles: Role[];
  company: { id: number; name: string } | null;
  error: string | null;
  totalCount: number;
  currentPage: number;
  filters: MembersQueryParams;
}

interface MembersActions {
  fetchMembers: (params?: MembersQueryParams) => Promise<void>;
  createMember: (memberData: CreateMemberRequest) => Promise<Member>;
  updateMember: (memberId: number, updates: UpdateMemberRequest) => Promise<Member>;
  deactivateMember: (memberId: number) => Promise<void>;
  activateMember: (memberId: number) => Promise<void>;
  resendInvitation: (memberId: number) => Promise<void>;
  setFilters: (filters: MembersQueryParams) => void;
  setPage: (page: number) => void;
  clearError: () => void;
}

type MembersStore = MembersState & MembersActions;

export const useMembersStore = create<MembersStore>((set, get) => ({
  // Initial state
  members: [],
  roles: [],
  company: null,
  error: null,
  totalCount: 0,
  currentPage: 1,
  filters: {},

  // Actions
  fetchMembers: async (params?: MembersQueryParams) => {
    set({ error: null });
    
    try {
      const { filters } = get();
      const queryParams = params || { ...filters };
      const response = await membersApi.getMembers(queryParams);
      
      set({
        members: response.users,
        company: response.company,
        totalCount: response.count,
      });
    } catch (error) {
      console.error('Failed to fetch members:', error);
      const errorMessage =
        error instanceof ApiErrorClass ? error.message : 'Failed to load team members. Please try again.';

      set({ error: errorMessage });
      toast.error(errorMessage);
    }
  },

  createMember: async (memberData: CreateMemberRequest): Promise<Member> => {
    set({ error: null });
    
    try {
      const response = await membersApi.createMember(memberData);
      const newMember = response.member;
      
      // Refresh the members list to get updated data
      await get().fetchMembers();
      
      toast.success("Member added successfully");
      return newMember;
    } catch (error) {
      console.error('Failed to create member:', error);
      const errorMessage =
        error instanceof ApiErrorClass ? error.message : 'Failed to create member. Please try again.';

      set({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  },

  updateMember: async (memberId: number, updates: UpdateMemberRequest): Promise<Member> => {
    set({ error: null });
    
    try {
      const updatedMember = await membersApi.updateMember(memberId, updates);
      
      // Update the member in the list
      set(state => ({
        members: state.members.map(member => 
          member.id === memberId ? updatedMember : member
        )
      }));
      
      toast.success("Member updated successfully");
      return updatedMember;
    } catch (error) {
      console.error('Failed to update member:', error);
      const errorMessage =
        error instanceof ApiErrorClass ? error.message : 'Failed to update member. Please try again.';

      set({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  },

  deactivateMember: async (memberId: number): Promise<void> => {
    set({ error: null });
    
    try {
      await membersApi.deactivateMember(memberId);
      
      // Update the member status in the list
      set(state => ({
        members: state.members.map(member => 
          member.id === memberId 
            ? { ...member, status: 'INACTIVE', is_active: false }
            : member
        )
      }));
      
      toast.success("Member deactivated");
      await get().fetchMembers();
    } catch (error) {
      console.error('Failed to deactivate member:', error);
      const errorMessage =
        error instanceof ApiErrorClass ? error.message : 'Failed to deactivate member. Please try again.';

      set({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  },

  activateMember: async (memberId: number): Promise<void> => {
    set({ error: null });
    
    try {
      await membersApi.activateMember(memberId);
      
      // Update the member status in the list
      set(state => ({
        members: state.members.map(member => 
          member.id === memberId 
            ? { ...member, status: 'ACTIVE', is_active: true }
            : member
        )
      }));
      
      toast.success("Member activated");
    } catch (error) {
      console.error('Failed to activate member:', error);
      const errorMessage =
        error instanceof ApiErrorClass ? error.message : 'Failed to activate member. Please try again.';

      set({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  },

  resendInvitation: async (memberId: number): Promise<void> => {
    set({ error: null });
    
    try {
      await membersApi.resendInvitation(memberId);
      toast.success("Invitation re-sent");
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      const errorMessage =
        error instanceof ApiErrorClass ? error.message : 'Failed to resend invitation. Please try again.';

      set({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  },

  setFilters: (newFilters: MembersQueryParams) => {
    set({ filters: newFilters, currentPage: 1 });
  },

  setPage: (page: number) => {
    set({ currentPage: page });
  },

  clearError: () => {
    set({ error: null });
  },
})); 