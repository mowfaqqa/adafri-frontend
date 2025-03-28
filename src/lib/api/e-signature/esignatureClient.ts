import axios from "axios";

const esignatureClient = axios.create({
  baseURL: "/api",
});

// Add JWT interceptor
esignatureClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling interceptor
esignatureClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 403) {
        throw new Error("You don't have permission to perform this action.");
      } else if (status === 404) {
        throw new Error("Resource not found.");
      } else {
        throw new Error("An error occurred. Please try again.");
      }
    }
    throw error;
  }
);

export default esignatureClient;