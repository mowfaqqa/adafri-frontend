import { create } from "zustand";
import * as authApi from "@/lib/api/messaging/auth";
import socketClient from "@/lib/socket/messagingSocketClient/socketClient";
import { User } from "@/lib/types/collab-messaging/auth";
import Cookies from "js-cookie";
import config from "@/lib/config/messaging";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  externalAuth: {
    externalToken: string | null;
    isExternalAuthenticated: boolean;
  };

  // Actions
  initialize: (externalToken: string) => Promise<boolean>;
  initializeFromStorage: () => Promise<void>;
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
  clearError: () => void;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  externalAuth: {
    externalToken: null,
    isExternalAuthenticated: false,
  },

  initialize: async (externalToken: string) => {
    try {
      set({
        isLoading: true,
        externalAuth: {
          ...get().externalAuth,
          externalToken,
        },
      });

      // Authenticate with external token
      const { token, user } = await authApi.authenticateWithExternalToken(externalToken);

      // Store token in both localStorage and cookies for different usage contexts
      localStorage.setItem("messaging_token", token);
      Cookies.set(config.tokenCookieName, token);

      // Initialize socket connection with token
      socketClient.connect(token);

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        externalAuth: {
          externalToken,
          isExternalAuthenticated: true,
        },
      });

      return true;
    } catch (error: any) {
      console.error("Failed to initialize with external token:", error);
      
      set({
        error: error.message || "Failed to initialize with external token",
        isLoading: false,
        externalAuth: {
          ...get().externalAuth,
          isExternalAuthenticated: false,
        },
      });
      
      return false;
    }
  },

  initializeFromStorage: async () => {
    try {
      // Only run in browser environment
      if (typeof window === "undefined") return;

      set({ isLoading: true });

      // Check for token in both localStorage and cookies
      const token = localStorage.getItem("messaging_token") || Cookies.get(config.tokenCookieName);
      
      if (!token) {
        set({ isLoading: false });
        return;
      }

      // Initialize auth state with token
      set({ token });

      // Connect to socket with token
      socketClient.connect(token);

      try {
        // Get current user
        const user = await authApi.getCurrentUser();
        
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        // If token is invalid or expired, clear storage
        localStorage.removeItem("messaging_token");
        Cookies.remove(config.tokenCookieName);
        
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({
        error: error.message || "Failed to initialize from storage",
        isLoading: false,
      });
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });

      const { token, user } = await authApi.login({ email, password });

      // Store token in localStorage and cookies
      localStorage.setItem("messaging_token", token);
      Cookies.set(config.tokenCookieName, token);

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

      // Store token in localStorage and cookies
      localStorage.setItem("messaging_token", token);
      Cookies.set(config.tokenCookieName, token);

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

      // Disconnect socket
      socketClient.disconnect();

      // Clear storage
      localStorage.removeItem("messaging_token");
      Cookies.remove(config.tokenCookieName);

      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        externalAuth: {
          externalToken: null,
          isExternalAuthenticated: false,
        },
      });
    } catch (error: any) {
      // Even if API call fails, clear local state
      localStorage.removeItem("messaging_token");
      Cookies.remove(config.tokenCookieName);
      socketClient.disconnect();
      
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        externalAuth: {
          externalToken: null,
          isExternalAuthenticated: false,
        },
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