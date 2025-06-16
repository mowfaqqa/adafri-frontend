import axios from "axios";
import Cookies from "js-cookie";
import config from "@/lib/config/messaging";
import { refreshToken } from "./auth";

// Create an axios instance with default configs
const messagingApi = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach the JWT token to all requests
messagingApi.interceptors.request.use(
  (config: any) => {
    // Get token from cookie or localStorage (prefer cookie for security)
    const token =
      localStorage.getItem("token")! 
      
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common responses and token refresh
messagingApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const statusCode = error.response?.status;

    // Handle token expiration (401)
    if (statusCode === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        const refreshTokenValue = Cookies.get(config.refreshTokenCookieName);

        if (refreshTokenValue) {
          const response = await refreshToken(refreshTokenValue);

          if (response && response.token) {
            // Store the new tokens
            Cookies.set(config.tokenCookieName, response.token);
            if (response.refreshToken) {
              Cookies.set(config.refreshTokenCookieName, response.refreshToken);
            }

            // Update authorization header and retry the request
            originalRequest.headers.Authorization = `Bearer ${response.token}`;
            return messagingApi(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);

        // Clear authentication if refresh fails
        Cookies.remove(config.tokenCookieName);
        Cookies.remove(config.refreshTokenCookieName);
        localStorage.removeItem("token");

        // If on client side, redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default messagingApi;
