import axios from "axios";

//cretae axios instance wth default config
const taskApiClient = axios.create({
  baseURL: process.env.TASK_MANAGER_API_URL || "https://task-manager-api-e7mf.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

//Request intercepto for API calls
taskApiClient.interceptors.request.use(
  (config) => {
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
    const customError = {
      message: error.response?.data?.message || "Something went wrong",
      status: error.response?.status || 500,
      data: error.response?.data || null,
    };

    return Promise.reject(customError);
  }
);

export default taskApiClient;
