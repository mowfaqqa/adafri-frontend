// hooks/useAxios.ts
import { useContext, useEffect } from "react";
import axios, { AxiosError, AxiosResponse } from "axios";
import Cookies from "js-cookie";
import config from "@/lib/config/messaging";
import { AuthContext } from "@/lib/context/auth";
import { refreshToken } from "@/lib/api/messaging/auth";

// Create a function to get an axios instance that uses AuthContext
export const useAxios = () => {
  const { token, setAccessToken, tryLogout } = useContext(AuthContext);

  // Create axios instance
  const axiosInstance = axios.create({
    baseURL: config.apiBaseUrl,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Set up request interceptor
  useEffect(() => {
    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config: any) => {
        const authToken = token?.access_token;

        // Set the Authorization header if we have a token
        if (config.headers && authToken) {
          config.headers.Authorization = `Bearer ${authToken}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Set up response interceptor
    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        const statusCode = error.response?.status;

        // Handle token expiration (401)
        if (statusCode === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Attempt to refresh the token
            const refreshTokenValue = Cookies.get(
              config.refreshTokenCookieName
            );

            if (refreshTokenValue) {
              const response = await refreshToken(refreshTokenValue);

              if (response && response.token) {
                // Store the new tokens
                Cookies.set(config.tokenCookieName, response.token);
                if (response.refreshToken) {
                  Cookies.set(
                    config.refreshTokenCookieName,
                    response.refreshToken
                  );
                }

                // Update token in AuthContext
                setAccessToken({
                  access_token: response.token,
                  token_type: "Bearer",
                  expires_in: 172800
                });

                // Update authorization header and retry the request
                originalRequest.headers.Authorization = `Bearer ${response.token}`;
                return axiosInstance(originalRequest);
              }
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);

            // Clear authentication
            Cookies.remove(config.tokenCookieName);
            Cookies.remove(config.refreshTokenCookieName);
            localStorage.removeItem("messaging_token");

            // Log out the user through AuthContext
            tryLogout(true);
          }
        }

        return Promise.reject(error);
      }
    );

    // Clean up interceptors when the component unmounts
    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [token, axiosInstance, setAccessToken, tryLogout]);

  return axiosInstance;
};

export default useAxios;
