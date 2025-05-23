import { useContext, useEffect } from "react";
import { useTaskManagerApi } from "./useTaskmanagerApi";
import { setAuthToken } from "@/lib/api/task-manager/client";
import { AuthContext } from "../context/auth";

/**
 * Auth-aware wrapper for the Task Manager API
 * This hook ensures the API client always has the latest auth token
 */
export const useAuthAwareTaskManagerApi = () => {
  const { token, user } = useContext(AuthContext);
  const taskManagerApi = useTaskManagerApi();

  useEffect(() => {
    if (token?.access_token) {
      setAuthToken(token.access_token);
    } else {
      setAuthToken(null);
    }
  }, [token]);

  // Return the task manager API with current user info
  return {
    ...taskManagerApi,
    currentUser: user,
    currentUserId: user?.uid || null, 
    isAuthenticated: !!token?.access_token && !!user,
  };
};
