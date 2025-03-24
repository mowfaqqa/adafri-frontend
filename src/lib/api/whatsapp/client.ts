/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/utils/whatsapp/axios-config";

// Base API client with common functionality
export default class ApiClient {
  // Base path for API endpoints
  protected basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  // Generic GET request
  protected async get<T>(endpoint: string, params?: Record<string, any>) {
    const response = await api.get<T>(`${this.basePath}${endpoint}`, {
      params,
    });
    return response.data;
  }

  // Generic POST request
  protected async post<T>(endpoint: string, data?: any) {
    const response = await api.post<T>(`${this.basePath}${endpoint}`, data);
    return response.data;
  }

  // Generic PUT request
  protected async put<T>(endpoint: string, data?: any) {
    const response = await api.put<T>(`${this.basePath}${endpoint}`, data);
    return response.data;
  }

  // Generic DELETE request
  protected async delete<T>(endpoint: string) {
    const response = await api.delete<T>(`${this.basePath}${endpoint}`);
    return response.data;
  }

  // Upload file with form data
  protected async uploadFile<T>(
    endpoint: string,
    file: File,
    fieldName: string,
    extraData?: Record<string, any>
  ) {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (extraData) {
      Object.entries(extraData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await api.post<T>(
      `${this.basePath}${endpoint}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  }
}
