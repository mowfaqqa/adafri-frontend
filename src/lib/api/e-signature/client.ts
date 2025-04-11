// lib/axios.js
import { getAuthToken } from "@/lib/utils/cookies";
import axios from "axios";

const API_BASE_URL = "https://e-signature-l8m5.onrender.com/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the authentication token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    const statusCode = error.response?.status;

    if (statusCode === 401) {
      // Token expired or invalid - redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// Document-related API calls
export const documentService = {
  // Get all documents for the current user
  getDocuments: () => apiClient.get("/documents"),

  // Get a specific document by ID
  getDocumentById: (id: string) => apiClient.get(`/documents/${id}`),

  // Create a new document
  createDocument: (data: any) =>
    apiClient.post("/documents", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  // Get all signatures for a document
  getDocumentSignatures: (documentId: string) =>
    apiClient.get(`/e-signatures/document/${documentId}`),
};

// E-signature-related API calls
export const signatureService = {
  // Request a new signature
  requestSignature: (data: any) => apiClient.post("/e-signatures", data),

  // Get signature details by ID
  getSignatureById: (id: string) => apiClient.get(`/e-signatures/${id}`),

  // Update signature status (sign or reject)
  updateSignatureStatus: (id: string, statusData: any) =>
    apiClient.patch(`/e-signatures/${id}/status`, statusData),
};

export default apiClient;
