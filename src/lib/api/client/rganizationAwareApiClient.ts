// lib/api/clients/organizationAwareApiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getPrimaryAccessToken, getCurrentOrganization } from '@/lib/utils/enhancedCookies';

// Base configuration for different microservices
export const MICROSERVICE_ENDPOINTS = {
  TASK_MANAGER: process.env.TASK_MANAGER_API_URL || 'https://task-manager-api-e7mf.onrender.com/api',
  CRM: 'https://crm-api.onrender.com/api',
  PROFESSIONAL_EMAIL: 'https://email-api.onrender.com/api',
  COLLABORATIVE_MESSAGE: process.env.MESSAGING_API_URL || 'https://messaging-a1v0.onrender.com/api',
  WHATSAPP_URL: process.env.WHATSAPP_CLIENT_API_URL || 'https://whatsapp-server-rem0.onrender.com/api',
  // Add more as needed
} as const;

export type MicroserviceType = keyof typeof MICROSERVICE_ENDPOINTS;

// Organization-aware API client factory
export class OrganizationAwareApiClient {
  private axiosInstance: AxiosInstance;
  private serviceName: string;

  constructor(
    baseURL: string, 
    serviceName: string,
    additionalConfig: AxiosRequestConfig = {}
  ) {
    this.serviceName = serviceName;
    
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...additionalConfig.headers,
      },
      timeout: 10000,
      ...additionalConfig,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - adds auth token and organization context
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add authentication token
        const token = getPrimaryAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add organization context
        const currentOrgId = getCurrentOrganization();
        if (currentOrgId) {
          // Add organization ID to headers for backend processing
          config.headers['X-Organization-ID'] = currentOrgId;
          
          // Also add to query params for GET requests if needed
          if (config.method === 'get' && !config.params?.organizationId) {
            config.params = {
              ...config.params,
              organizationId: currentOrgId
            };
          }
        }

        // Add service identifier for logging/monitoring
        config.headers['X-Service'] = this.serviceName;

        return config;
      },
      (error) => {
        console.error(`[${this.serviceName}] Request error:`, error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handles common errors and organization context
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        const status = error.response?.status;
        
        // Handle organization-specific errors
        if (status === 403 && error.response?.data?.code === 'NO_ORGANIZATION_ACCESS') {
          console.error(`[${this.serviceName}] No access to current organization`);
          // Redirect to organization selection or show error
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/setup';
          }
          return Promise.reject(new Error('No access to current organization'));
        }

        // Handle authentication errors
        if (status === 401) {
          console.error(`[${this.serviceName}] Authentication failed`);
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          return Promise.reject(new Error('Authentication required'));
        }

        // Handle organization not found errors
        if (status === 404 && error.response?.data?.code === 'ORGANIZATION_NOT_FOUND') {
          console.error(`[${this.serviceName}] Organization not found`);
          // Handle organization switching or selection
          return Promise.reject(new Error('Organization not found'));
        }

        return Promise.reject(error);
      }
    );
  }

  // Get the axios instance for making requests
  getInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  // Convenience methods for common HTTP operations
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.patch(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete(url, config);
    return response.data;
  }

  // Method to check if client has proper organization context
  hasOrganizationContext(): boolean {
    return !!getCurrentOrganization();
  }

  // Method to get current organization ID
  getCurrentOrganizationId(): string | null {
    return getCurrentOrganization();
  }
}

// Factory function to create service-specific clients
export const createMicroserviceClient = (
  serviceType: MicroserviceType,
  additionalConfig?: AxiosRequestConfig
): OrganizationAwareApiClient => {
  const baseURL = MICROSERVICE_ENDPOINTS[serviceType];
  const serviceName = serviceType.toLowerCase().replace('_', '-');
  
  return new OrganizationAwareApiClient(baseURL, serviceName, additionalConfig);
};

// Pre-configured clients for each microservice
export const taskManagerClient = createMicroserviceClient('TASK_MANAGER');
export const crmClient = createMicroserviceClient('CRM');
export const professionalEmailClient = createMicroserviceClient('PROFESSIONAL_EMAIL');
export const collaborativeMessageClient = createMicroserviceClient('COLLABORATIVE_MESSAGE');

// Legacy support - updated task manager client
export const taskApiClient = taskManagerClient.getInstance();

// Utility function to refresh all clients when organization changes
export const refreshAllClientsForOrganization = () => {
  // This will trigger the request interceptors to use the new organization context
  console.log('Organization context refreshed for all API clients');
};