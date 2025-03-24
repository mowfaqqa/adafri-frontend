/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import socketClient from "@/lib/socket/messagingSocketClient/socketClient";
import * as authApi from "../../lib/api/messaging/auth";
import { create } from "zustand";

interface AuthState {
  user: any | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    fullName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  initializeFromStorage: () => Promise<void>;
  clearError: () => void;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  initializeFromStorage: async () => {
    try {
      // Only run in browser environment
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("token");
      if (!token) return;

      set({ isLoading: true, token });

      // Connect to socket with token
      socketClient.connect(token);

      try {
        const user = await authApi.getCurrentUser();
        set({ user, isAuthenticated: true, isLoading: false });
      } catch (error) {
        // If token is invalid or expired, clear storage
        localStorage.removeItem("token");
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });

      const { token, user } = await authApi.login({ email, password });

      // Store token in localStorage
      localStorage.setItem("token", token);

      // Connect to socket with token
      socketClient.connect(token);

      set({ token, user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      let errorMessage = "Login failed";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  register: async (username, email, password, fullName) => {
    try {
      set({ isLoading: true, error: null });

      const { token, user } = await authApi.register({
        username,
        email,
        password,
        fullName,
      });

      // Store token in localStorage
      localStorage.setItem("token", token);

      // Connect to socket with token
      socketClient.connect(token);

      set({ token, user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      let errorMessage = "Registration failed";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });

      if (get().token) {
        await authApi.logout();
      }

      // Remove token from localStorage
      localStorage.removeItem("token");

      // Disconnect socket
      socketClient.disconnect();

      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error: any) {
      // Even if the API call fails, we should still clear local state
      localStorage.removeItem("token");
      socketClient.disconnect();
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  updateProfile: async (data) => {
    try {
      set({ isLoading: true, error: null });

      const { user } = await authApi.updateProfile(data);

      set({ user, isLoading: false });
    } catch (error: any) {
      let errorMessage = "Failed to update profile";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  updateAvatar: async (file) => {
    try {
      set({ isLoading: true, error: null });

      const { avatar } = await authApi.updateAvatar(file);

      // Update user with new avatar
      set((state) => ({
        user: state.user ? { ...state.user, avatar } : null,
        isLoading: false,
      }));
    } catch (error: any) {
      let errorMessage = "Failed to update avatar";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
