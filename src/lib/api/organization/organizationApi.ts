// lib/api/organization/enhancedOrganizationApi.ts
import { ApiError } from "../errors/apiErrors";
import { 
  getPrimaryAccessToken, 
  setAuthTokens, 
  setCurrentOrganization 
} from "@/lib/utils/enhancedCookies";

// API Base URL
const API_BASE_URL = "https://be-auth-server.onrender.com/api/v1";

// Interfaces (keeping your existing ones)
export interface CreateOrganizationData {
  business_name: string;
  business_address: string;
  business_phone: string;
  business_taxId: string;
  business_industry: string;
}

export interface UpdateOrganizationData {
  organizationId: string;
  business_name?: string;
  business_address?: string;
  business_phone?: string;
  business_taxId?: string;
  business_industry?: string;
}

export interface Organization {
  id: string;
  business_name: string;
  business_address: string;
  business_phone: string;
  business_taxId: string;
  business_industry: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  role: "ADMIN" | "MEMBER" | "GUEST" | "OWNER";
  permissions: string[];
  twoFactorEnabled: boolean;
  status: "active" | "pending" | "suspended";
  joinedAt: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  organization: Organization;
}

export interface SwitchOrganizationData {
  organizationId: string;
}

export interface InviteMemberData {
  organizationId: string;
  email: string;
  role: "ADMIN" | "MEMBER" | "GUEST" | "OWNER";
}

export interface UpdateMemberRoleData {
  organizationId: string;
  memberId: string;
  role: string;
  twoFactorCode?: string;
}

export interface TwoFactorOperation {
  operation: string;
  data: any;
  twoFactorCode: string;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
  meta?: {
    access_token?: string;
    refresh_token?: string;
  };
}

export type OrganizationsResponse = ApiResponse<OrganizationMember[]>
export type CreateOrganizationResponse = ApiResponse<Organization>
export type UpdateOrganizationResponse = ApiResponse<Organization>
export type SwitchOrganizationResponse = ApiResponse<Organization>
export type InviteMemberResponse = ApiResponse<any>
export type MemberResponse = ApiResponse<OrganizationMember>

class OrganizationApiService {
  private pendingTwoFactorOperation: TwoFactorOperation | null = null;

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    requiresAuth: boolean = true
  ): Promise<T> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };

      if (requiresAuth) {
        const token = getPrimaryAccessToken();
        
        if (!token) {
          throw new ApiError(401, "No access token found");
        }
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers,
        credentials: "include",
        ...options,
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If can't parse error response, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new ApiError(response.status, errorMessage);
      }

      const data = await response.json();

      // Handle token updates from the response
      if (data.meta?.access_token && data.meta?.refresh_token) {
        setAuthTokens({
          djombiAccessToken: data.meta.access_token,
          djombiRefreshToken: data.meta.refresh_token
        });
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, error instanceof Error ? error.message : "Unknown error occurred");
    }
  }

  // Enhanced retry with 2FA support
  private async makeRequestWith2FA<T>(
    operation: string,
    requestFn: (twoFactorCode?: string) => Promise<T>,
    requiresTwoFactor: boolean = true
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 403 &&
        requiresTwoFactor
      ) {
        // Store operation for retry after 2FA
        this.pendingTwoFactorOperation = {
          operation,
          data: null,
          twoFactorCode: "",
        };
        throw new ApiError(403, "Two-factor authentication required");
      }
      throw error;
    }
  }

  // Retry operation with 2FA code
  async retryWithTwoFactor(twoFactorCode: string): Promise<any> {
    if (!this.pendingTwoFactorOperation) {
      throw new Error("No pending two-factor operation");
    }

    const operation = this.pendingTwoFactorOperation;
    this.pendingTwoFactorOperation = null;

    switch (operation.operation) {
      case "updateOrganization":
        return this.updateOrganization(operation.data, twoFactorCode);
      case "updateMemberRole":
        return this.updateMemberRole({ ...operation.data, twoFactorCode });
      case "removeMember":
        return this.removeMember(
          operation.data.organizationId,
          operation.data.memberId,
          twoFactorCode
        );
      case "inviteMember":
        return this.inviteMember(operation.data, twoFactorCode);
      default:
        throw new Error("Unknown operation");
    }
  }

  // Organization CRUD operations
  async getOrganizations(): Promise<OrganizationsResponse> {
    return this.makeRequest<OrganizationsResponse>("/organizations");
  }

  async createOrganization(
    data: CreateOrganizationData
  ): Promise<CreateOrganizationResponse> {
    const response = await this.makeRequest<CreateOrganizationResponse>("/organizations", {
      method: "POST",
      body: JSON.stringify(data),
    });

    // Set the created organization as current
    if (response.status === 'success' && response.data.id) {
      setCurrentOrganization(response.data.id);
    }

    return response;
  }

  async updateOrganization(
    data: UpdateOrganizationData,
    twoFactorCode?: string
  ): Promise<UpdateOrganizationResponse> {
    const requestData = twoFactorCode ? { ...data, twoFactorCode } : data;

    return this.makeRequestWith2FA("updateOrganization", () =>
      this.makeRequest<UpdateOrganizationResponse>("/organizations", {
        method: "PATCH",
        body: JSON.stringify(requestData),
      })
    );
  }

  async switchOrganization(
    data: SwitchOrganizationData
  ): Promise<SwitchOrganizationResponse> {
    const response = await this.makeRequest<SwitchOrganizationResponse>(
      "/organizations/switch",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    // Update current organization cookie on successful switch
    if (response.status === 'success') {
      setCurrentOrganization(data.organizationId);
    }

    return response;
  }

  // Member management operations
  async getMembers(
    organizationId: string
  ): Promise<ApiResponse<OrganizationMember[]>> {
    return this.makeRequest<ApiResponse<OrganizationMember[]>>(
      `/organizations/members?organizationId=${organizationId}`
    );
  }

  async inviteMember(
    data: InviteMemberData,
    twoFactorCode?: string
  ): Promise<InviteMemberResponse> {
    const requestData = twoFactorCode ? { ...data, twoFactorCode } : data;

    return this.makeRequestWith2FA("inviteMember", () =>
      this.makeRequest<InviteMemberResponse>("/organizations/invite", {
        method: "POST",
        body: JSON.stringify(requestData),
      })
    );
  }

  async updateMemberRole(data: UpdateMemberRoleData): Promise<MemberResponse> {
    return this.makeRequestWith2FA("updateMemberRole", () =>
      this.makeRequest<MemberResponse>("/organizations/members/role", {
        method: "POST",
        body: JSON.stringify(data),
      })
    );
  }

  async removeMember(
    organizationId: string,
    memberId: string,
    twoFactorCode?: string
  ): Promise<void> {
    const url = `/organizations/members?organizationId=${organizationId}&memberId=${memberId}`;
    const body = twoFactorCode ? JSON.stringify({ twoFactorCode }) : undefined;

    return this.makeRequestWith2FA("removeMember", () =>
      this.makeRequest<void>(url, {
        method: "DELETE",
        body,
      })
    );
  }

  // Invitation operations
  async acceptInvitation(token: string): Promise<ApiResponse<any>> {
    return this.makeRequest<ApiResponse<any>>("/organizations/invite/accept", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async rejectInvitation(token: string): Promise<ApiResponse<any>> {
    return this.makeRequest<ApiResponse<any>>("/organizations/invite/reject", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  // Utility methods
  hasPendingTwoFactorOperation(): boolean {
    return this.pendingTwoFactorOperation !== null;
  }

  clearPendingOperation(): void {
    this.pendingTwoFactorOperation = null;
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest('/health', { method: 'GET' }, false);
      return true;
    } catch {
      return false;
    }
  }
}

export const organizationApi = new OrganizationApiService();