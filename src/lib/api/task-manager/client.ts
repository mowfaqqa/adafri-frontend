import axios from "axios";

//cretae axios instance wth default config
const taskApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api",
  headers: {
    "Coontent-Type": "application/json",
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
