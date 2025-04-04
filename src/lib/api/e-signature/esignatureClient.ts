import axios from "axios";
import Cookies from "js-cookie";

const esignatureClient = axios.create({
  baseURL: "https://e-signature-l8m5.onrender.com/api/v1",
});

esignatureClient.interceptors.request.use((config) => {
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ3Y2VmMzZhLWEyNDYtNGIxMi04NGQ3LWE5ZGVjMTUxMmZkNyIsImlhdCI6MTc0MzE2OTI5NiwiZXhwIjoxNzQzMTcyODk2fQ.43r2EHSw6QpCYgOaCDLbC8DgtUn-8d_GWafVKLvQFnY";
  // localStorage.getItem("token");
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
