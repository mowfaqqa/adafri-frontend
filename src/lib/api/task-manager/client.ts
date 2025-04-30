import { getAuthToken, removeCookie } from "@/lib/utils/cookies";
import axios from "axios";

//cretae axios instance wth default config
const taskApiClient = axios.create({
  baseURL:

    "https://task-manager-api-e7mf.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

//Request intercepto for API calls
taskApiClient.interceptors.request.use(
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

//responsee interceptor for API calls
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
        removeCookie("accessToken");
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);

export default taskApiClient;
