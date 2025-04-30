import axios, { AxiosError, AxiosResponse } from "axios";

const API_URL = process.env.WHATSAPP_CLIENT_API_URL || "http://localhost:5000/api";
// Create Axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 seconds
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Log the error but don't expose details to the console
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log("API Response Error:", {
        status: error.response.status,
        statusText: error.response.statusText,
        endpoint: error.config?.url,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.log("API Request Error: No response received", {
        endpoint: error.config?.url,
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log("API Setup Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
