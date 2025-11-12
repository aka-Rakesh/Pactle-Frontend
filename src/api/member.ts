import type { CreateMemberRequest, CreateMemberResponse, Member, MembersQueryParams, MembersResponse, UpdateMemberRequest } from "../types/common";
import BaseApiClient from "./base";
import { API_ENDPOINTS } from "./config";

class MembersApiClient extends BaseApiClient {
  async getMembers(params?: MembersQueryParams): Promise<MembersResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.status) queryParams.append("status", params.status);
      if (params?.job_title)
        queryParams.append("job_title", params.job_title);
      if (params?.search) queryParams.append("search", params.search);
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.offset)
        queryParams.append("offset", params.offset.toString());

      const endpoint = `${API_ENDPOINTS.AUTH.USERS}${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;
      const response = await this.get<MembersResponse>(endpoint, true);
      return response;
    } catch (error) {
      console.error("Failed to fetch members:", error);
      throw error;
    }
  }

  async createMember(
    memberData: CreateMemberRequest
  ): Promise<CreateMemberResponse> {
    try {
      const payload = {
        email: memberData.email,
        name: memberData.name,
        job_title: memberData.job_title || "",
        bio: memberData.bio || "",
        phone: memberData.phone || "",
        role_id: memberData.role_id,
        access_level: memberData.access_level || "View Only",
        is_admin: memberData.is_admin || false,
      };

      const response = await this.post<CreateMemberResponse>(
        API_ENDPOINTS.AUTH.CREATE_USER,
        payload,
        true
      );
      return response;
    } catch (error) {
      console.error("Failed to create member:", error);
      throw error;
    }
  }

  async updateMember(
    memberId: number,
    updates: UpdateMemberRequest
  ): Promise<Member> {
    try {
      const response = await this.patch<Member>(
        API_ENDPOINTS.AUTH.UPDATE_USER(memberId),
        updates,
        true
      );
      return response;
    } catch (error) {
      console.error("Failed to update member:", error);
      throw error;
    }
  }

  async getMember(memberId: number): Promise<Member> {
    try {
      const response = await this.get<{ success: boolean; user: Member }>(
        API_ENDPOINTS.AUTH.GET_USER(memberId),
        true
      );
      return response.user;
    } catch (error) {
      console.error("Failed to get member:", error);
      throw error;
    }
  }

  async deactivateMember(memberId: number): Promise<void> {
    try {
      await this.delete(
        `${API_ENDPOINTS.AUTH.DEACTIVATE_USER(memberId)}`,
        true
      );
    } catch (error) {
      console.error("Failed to deactivate member:", error);
      throw error;
    }
  }

  async activateMember(memberId: number): Promise<void> {
    try {
      await this.post(
        `${API_ENDPOINTS.AUTH.ACTIVATE_USER(memberId)}`,
        {},
        true
      );
    } catch (error) {
      console.error("Failed to activate member:", error);
      throw error;
    }
  }

  async resendInvitation(memberId: number): Promise<void> {
    try {
      await this.post(
        `${API_ENDPOINTS.AUTH.RESEND_INVITATION(memberId)}`,
        {},
        true
      );
    } catch (error) {
      console.error("Failed to resend invitation:", error);
      throw error;
    }
  }

  async changePassword(
    memberId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      await this.post(
        API_ENDPOINTS.AUTH.CHANGE_PASSWORD(memberId),
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        true
      );
    } catch (error) {
      console.error("Failed to change password:", error);
      throw error;
    }
  }
}

export const membersApi = new MembersApiClient();
export default membersApi;
