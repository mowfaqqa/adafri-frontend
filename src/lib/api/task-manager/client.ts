import { getAuthToken, removeCookie } from "@/lib/utils/cookies";
import axios from "axios";

// Create axios instance with default config
const taskApiClient = axios.create({
  baseURL: "https://task-manager-api-e7mf.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to set the auth token dynamically
// This will be called from components that have access to AuthContext
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getStoredAuthToken = () => authToken;

// Request interceptor for API calls
taskApiClient.interceptors.request.use(
  (config) => {
    // Priority:
    // 1. Use token from AuthContext (set via setAuthToken)
    const token = authToken || getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
taskApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    const statusCode = error.response?.status;

    if (statusCode === 401) {
      // Token expired or invalid - redirect to login
      if (typeof window !== "undefined") {
        // Clear both cookie and context token
        removeCookie("accessToken");
        authToken = null;

       
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);

export default taskApiClient;
