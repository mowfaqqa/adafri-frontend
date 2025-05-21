import useAxios from "@/hooks/useAxios";
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
} from "@/lib/types/collab-messaging/auth";
import axiosInstance from "./axios";

// Non-hook based API functions (for use outside of components)
export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  const response = await axiosInstance.post("/auth/login", credentials);
  return response.data;
};

export const register = async (
  userData: RegisterData
): Promise<AuthResponse> => {
  const response = await axiosInstance.post("/auth/register", userData);
  return response.data;
};

export const refreshToken = async (
  refreshToken: string
): Promise<AuthResponse> => {
  const response = await axiosInstance.post("/auth/refresh-token", {
    refreshToken,
  });
  return response.data;
};

export const logout = async () => {
  return await axiosInstance.post("/auth/logout");
};

export const getCurrentUser = async () => {
  const response = await axiosInstance.get("/auth/me");
  return response.data.user;
};

export const authenticateWithExternalToken = async (
  externalToken: string
): Promise<AuthResponse> => {
  const response = await axiosInstance.post("/auth/external-token", {
    token: externalToken,
  });
  return response.data;
};
export const getOnlineUsers = async () => {
  const response = await axiosInstance.get(`/users/online`);
  return response.data.users;
};
// Hook-based version (for use inside React components)
export const useAuthApi = () => {
  const axios = useAxios();

  return {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const response = await axios.post("/auth/login", credentials);
      return response.data;
    },

    register: async (userData: RegisterData): Promise<AuthResponse> => {
      const response = await axios.post("/auth/register", userData);
      return response.data;
    },

    refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
      const response = await axios.post("/auth/refresh-token", {
        refreshToken,
      });
      return response.data;
    },

    logout: async () => {
      return await axios.post("/auth/logout");
    },

    getCurrentUser: async () => {
      const response = await axios.get("/auth/me");
      return response.data.user;
    },

    authenticateWithExternalToken: async (
      externalToken: string
    ): Promise<AuthResponse> => {
      const response = await axios.post("/auth/external-token", {
        token: externalToken,
      });
      return response.data;
    },
    getOnlineUsers: async () => {
      const response = await axios.get(`/users/online`);
      return response.data.users;
    },
  };
};
