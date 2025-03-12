import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { authSlice } from './authSlice';

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
    _retry?: boolean;
  }

// Constants
const API_BASE_URL = 'https://email-service-latest-agqz.onrender.com';
const TIMEOUT_MS = 30000; // 30 seconds timeout

/**
 * Creates and configures an Axios instance with auth token, interceptors, and default settings
 * @returns Configured Axios instance
 */
export const createAxiosInstance = (): AxiosInstance => {
    const axiosInstance = axios.create({
        baseURL: API_BASE_URL,
        timeout: TIMEOUT_MS,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        withCredentials: false
    });

    // Add auth token if available
    const { token, setReset } = authSlice.getState();
    if (token) {
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Response interceptor for handling auth errors
    axiosInstance.interceptors.response.use(
        (response: AxiosResponse) => response,
        async (error: AxiosError) => {
            const originalRequest = error.config as CustomAxiosRequestConfig;

            // Handle session expiration (code 419)
            if (error.code === '419') {
                window.localStorage.removeItem('auth');
                // Redirect to login or show notification
            }

            // Handle unauthorized errors (401)
            if (
                error.response?.status === 401 &&
                originalRequest &&
                !originalRequest._retry
            ) {
                originalRequest._retry = true;
                // Get setReset from auth slice
                const { setReset } = authSlice.getState();
                setReset(); // Reset auth state
            }

            return Promise.reject(error);
        }
    );

    return axiosInstance;
};

/**
 * Singleton pattern for axios instance to avoid creating multiple instances
 */
let axiosInstance: AxiosInstance | null = null;

/**
 * Gets the axios instance (creates it if it doesn't exist)
 * @returns Axios instance
 */
export const getAxiosInstance = (): AxiosInstance => {
    if (!axiosInstance) {
        axiosInstance = createAxiosInstance();
    }
    return axiosInstance;
};

/**
 * Resets the axios instance (useful after logout or token change)
 */
export const resetAxiosInstance = (): void => {
    axiosInstance = null;
};

/**
 * Normalized API request methods with consistent path handling
 */

/**
 * Performs a GET request
 * @param path API endpoint path
 * @param params Optional query parameters
 * @returns Promise with the response
 */
export async function getRequest<T = any>(path: string, params?: object): Promise<AxiosResponse<T>> {
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    return getAxiosInstance().get<T>(normalizedPath, { params });
}

/**
 * Performs a POST request
 * @param path API endpoint path
 * @param payload Request body data
 * @returns Promise with the response
 */
export async function postRequest<T = any, D = any>(path: string, payload: D): Promise<AxiosResponse<T>> {
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    return getAxiosInstance().post<T>(normalizedPath, payload);
}

/**
 * Performs a PATCH request
 * @param path API endpoint path
 * @param payload Request body data
 * @returns Promise with the response
 */
export async function patchRequest<T = any, D = any>(path: string, payload: D): Promise<AxiosResponse<T>> {
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    return getAxiosInstance().patch<T>(normalizedPath, payload);
}

/**
 * Performs a DELETE request
 * @param path API endpoint path
 * @param payload Optional request body data
 * @returns Promise with the response
 */
export async function deleteRequest<T = any, D = any>(path: string, payload?: D): Promise<AxiosResponse<T>> {
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    return getAxiosInstance().delete<T>(normalizedPath, { data: payload });
}



























// import axios from 'axios'
// import { authSlice } from './authSlice'

// export const getAxiosInstance = () => {
//   const axiosInstance = axios.create()
//   const { token, setReset } = authSlice.getState()
//   // const setState = authSlice.setState(useUserLogOut)

//   axiosInstance.defaults.baseURL = 'https://sssdotnet.top'

//   if (token) {
//     axiosInstance.defaults.headers.common['Authorization'] = Bearer ${token}
//   }

//   // axiosInstance.interceptors.request.use()
//   axiosInstance.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//       const originalRequest = error.config
//       console.log(error)

//       if (error.code === 419) {
//         window.localStorage.removeItem('auth')
//       }
//       if (
//         error.response &&
//         error.response.status === 401 &&
//         !originalRequest._retry
//       ) {
//         // originalRequest._retry = true;
//         setReset()
//       }
//       return Promise.reject(error)
//     }
//   )

//   axiosInstance.defaults.headers.common['Content-Type'] = 'application/json'
//   axiosInstance.defaults.headers.common['Accept'] = 'application/json'

//   //All request will wait 2 seconds before timeout
//   // axiosInstance.defaults.timeout = 2000;

//   axiosInstance.defaults.withCredentials = false

//   return axiosInstance
// }

// export async function getRequest(URL: string) {
//   const response = await getAxiosInstance().get(/${URL})
//   return response
// }

// export async function postRequest<T = unknown>(URL: string, payload: T) {
//   const response = await getAxiosInstance().post(${URL}, payload)
//   return response
// }

// export async function patchRequest<T = unknown>(URL: string, payload: T) {
//   const response = await getAxiosInstance().patch(/${URL}, payload)
//   return response
// }

// export async function deleteRequest<T = unknown>(URL: string, payload?: T) {
//   const response = await getAxiosInstance().delete(/${URL}, {
//     data: payload,
//   })
//   return response
// }