import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { resetAxiosInstance } from './AxiosInstance';
// import { resetAxiosInstance } from './axiosConfig';


// Types for user data and auth state
export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  // State
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setReset: () => void;
  clearError: () => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Create the auth slice with Zustand
export const authSlice = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      token: null,
      user: null,
      loading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });
          
          // This would be an API call to your auth endpoint
          const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || 'Authentication failed');
          }
          
          // Update state with user data and token
          set({
            isAuthenticated: true,
            token: data.token,
            user: data.user,
            loading: false,
          });
          
        } catch (error) {
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Login failed' 
          });
        }
      },
      
      register: async (userData: RegisterData) => {
        try {
          set({ loading: true, error: null });
          
          // This would be an API call to your register endpoint
          const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
          }
          
          set({
            isAuthenticated: true,
            token: data.token,
            user: data.user,
            loading: false,
          });
          
        } catch (error) {
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Registration failed' 
          });
        }
      },
      
      logout: () => {
        // Clear auth state
        set({
          isAuthenticated: false,
          token: null,
          user: null,
          error: null,
        });
        
        // Reset axios instance to clear token
        resetAxiosInstance();
        
        // Clear localStorage (persist middleware will handle this too, but for safety)
        localStorage.removeItem('auth');
      },
      
      setUser: (user: User) => set({ user }),
      
      setToken: (token: string) => set({ token, isAuthenticated: true }),
      
      setError: (error: string | null) => set({ error }),
      
      setLoading: (loading: boolean) => set({ loading }),
      
      setReset: () => {
        // Called when token is invalid (401 error)
        const { logout } = get();
        logout();
        set({ error: 'Your session has expired. Please log in again.' });
      },
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth', // Storage key in localStorage
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);