// lib/api/organizationApi.ts
const API_BASE_URL = 'https://email-service-latest-agqz.onrender.com/api/v1';

export interface CreateOrganizationData {
  business_name: string;
  business_address: string;
  business_phone: string;
  business_taxId: string;
  business_industry: string;
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
  role: string;
  permissions: string[];
  twoFactorEnabled: boolean;
  organization: Organization;
}

export interface OrganizationsResponse {
  status: string;
  message: string;
  data: OrganizationMember[];
}

export interface CreateOrganizationResponse {
  status: string;
  message: string;
  data: Organization;
}

export interface SwitchOrganizationData {
  organizationId: string;
}

export interface SwitchOrganizationResponse {
  status: string;
  message: string;
  data?: any;
}

class OrganizationApiService {
  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getOrganizations(): Promise<OrganizationsResponse> {
    return this.makeRequest<OrganizationsResponse>('/organizations');
  }

  async createOrganization(data: CreateOrganizationData): Promise<CreateOrganizationResponse> {
    return this.makeRequest<CreateOrganizationResponse>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async switchOrganization(data: SwitchOrganizationData): Promise<SwitchOrganizationResponse> {
    return this.makeRequest<SwitchOrganizationResponse>('/organizations/switch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const organizationApi = new OrganizationApiService();