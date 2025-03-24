/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "./axios";
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
} from "../../types/collab-messaging/auth";

/**
 * Login user
 */
export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>(
    "/auth/login",
    credentials
  );
  return response.data;
};

/**
 * Register a new user
 */
export const register = async (
  userData: RegisterData
): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>(
    "/auth/register",
    userData
  );
  return response.data;
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await axiosInstance.get<{ user: User }>("/auth/me");
  return response.data.user;
};

/**
 * Logout user
 */
export const logout = async (): Promise<{ message: string }> => {
  const response = await axiosInstance.post<{ message: string }>(
    "/auth/logout"
  );
  return response.data;
};

/**
 * Update user avatar
 */
export const updateAvatar = async (file: File): Promise<{ avatar: string }> => {
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
};

/**
 * Update user profile
 */
export const updateProfile = async (data: any): Promise<{ user: User }> => {
  const response = await axiosInstance.put<{ user: User }>(
    "/users/profile",
    data
  );
  return response.data;
};

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId: string): Promise<User> => {
  const response = await axiosInstance.get<{ user: User }>(
    `/users/profile/${userId}`
  );
  return response.data.user;
};

/**
 * Get online users
 */
export const getOnlineUsers = async (): Promise<User[]> => {
  const response = await axiosInstance.get<{ users: User[] }>("/users/online");
  return response.data.users;
};
