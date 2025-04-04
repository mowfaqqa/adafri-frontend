import axios, { AxiosError, AxiosResponse } from "axios";
import Cookies from "js-cookie";

// Define the API base URL
const API_URL = process.env.MESSAGING_API_URL || "http://localhost:5000/api";

// Create an axios instance with default configs
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach the JWT token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common responses
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const statusCode = error.response?.status;

    // Handle token expiration or authentication issues
    if (statusCode === 401) {
      // If on client side, clear cookie and redirect to login
      if (typeof window !== "undefined") {
        Cookies.remove("token");
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;





















// import axios, { AxiosError, AxiosResponse } from "axios";

// // Define the API base URL
// const API_URL = process.env.MESSAGING_API_URL || "http://localhost:5000/api";

// // Create an axios instance with default configs
// const axiosInstance = axios.create({
//   baseURL: API_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // Add a request interceptor to attach the JWT token to all requests
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");
//     if (token && config.headers) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Add a response interceptor to handle common responses
// axiosInstance.interceptors.response.use(
//   (response: AxiosResponse) => {
//     return response;
//   },
//   (error: AxiosError) => {
//     const statusCode = error.response?.status;

//     // Handle token expiration or authentication issues
//     if (statusCode === 401) {
//       // If on client side, clear local storage and redirect to login
//       if (typeof window !== "undefined") {
//         localStorage.removeItem("token");
//         window.location.href = "/";
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;
