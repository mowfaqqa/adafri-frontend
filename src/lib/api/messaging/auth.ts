/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "./axios";
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
} from "../../types/collab-messaging/auth";

/**
 * Login user with credentials
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await axiosInstance.post<AuthResponse>("/auth/login", credentials);
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

/**
 * Register a new user
 */
export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await axiosInstance.post<AuthResponse>("/auth/register", userData);
    return response.data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

/**
 * Get current user profile from messaging backend
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await axiosInstance.get<{ user: User }>("/auth/me");
    return response.data.user;
  } catch (error) {
    console.error("Get current user error:", error);
    throw error;
  }
};

/**
 * Logout user
 */
export const logout = async (): Promise<{ message: string }> => {
  try {
    const response = await axiosInstance.post<{ message: string }>("/auth/logout");
    return response.data;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (refreshToken: string): Promise<{ token: string; refreshToken?: string }> => {
  try {
    const response = await axiosInstance.post<{ token: string; refreshToken?: string }>("/auth/refresh", {
      refreshToken,
    });
    return response.data;
  } catch (error) {
    console.error("Token refresh error:", error);
    throw error;
  }
};

/**
 * Update user avatar
 */
export const updateAvatar = async (file: File): Promise<{ avatar: string }> => {
  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await axiosInstance.put<{ avatar: string }>(
      "/users/avatar",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Update avatar error:", error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (data: any): Promise<{ user: User }> => {
  try {
    const response = await axiosInstance.put<{ user: User }>("/users/profile", data);
    return response.data;
  } catch (error) {
    console.error("Update profile error:", error);
    throw error;
  }
};

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId: string): Promise<User> => {
  try {
    const response = await axiosInstance.get<{ user: User }>(`/users/profile/${userId}`);
    return response.data.user;
  } catch (error) {
    console.error("Get user profile error:", error);
    throw error;
  }
};

/**
 * Get online users
 */
export const getOnlineUsers = async (): Promise<User[]> => {
  try {
    const response = await axiosInstance.get<{ users: User[] }>("/users/online");
    return response.data.users;
  } catch (error) {
    console.error("Get online users error:", error);
    throw error;
  }
};

/**
 * Create a new user in the messaging system
 * This is used when a user from the main auth system
 * needs to be registered in the messaging backend
 */
export const createMessagingUser = async (userData: {
  externalId: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
}): Promise<User> => {
  try {
    const response = await axiosInstance.post<{ user: User }>("/auth/external-user", userData);
    return response.data.user;
  } catch (error) {
    console.error("Create messaging user error:", error);
    throw error;
  }
};

/**
 * Authenticate with external token (from main application)
 */
export const authenticateWithExternalToken = async (token: string): Promise<AuthResponse> => {
  try {
    const response = await axiosInstance.post<AuthResponse>("/auth/external-token", { token });
    return response.data;
  } catch (error) {
    console.error("External token authentication error:", error);
    throw error;
  }
};