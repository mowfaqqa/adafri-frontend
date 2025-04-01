/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Cookies from "js-cookie";

export const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://email-service-latest-agqz.onrender.com";

interface TokenPayload {
  exp: number;
  [key: string]: any;
}

// Store access and refresh tokens in cookies (with appropriate expiration)
export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  // Store access token with 1-hour expiration in a cookie
  Cookies.set("access_token", accessToken, {
    expires: 1 / 24, // 1 hour expiration
    // secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    path: "/",
  });
  
  // Store refresh token in HTTP-only cookie (should be handled by the backend)
  Cookies.set("refresh_token", refreshToken, {
    expires: 7, // 7 days expiration (example)
    // secure: process.env.NODE_ENV === 'production', // Secure flag in production
    path: "/",
  });
};

// Check if the access token has expired
const isAccessTokenExpired = (): boolean => {
  const accessToken = Cookies.get("access_token");
  if (!accessToken) return true;

  try {
    const tokenData = JSON.parse(atob(accessToken.split(".")[1])) as TokenPayload; // Decode JWT token payload
    return Date.now() > tokenData.exp * 1000; // Compare expiration time with current time
  } catch (error) {
    console.error("Token decode error:", error);
    return true; // If decoding fails, assume the token is invalid/expired
  }
};

// Error handling with proper typing
function handleError(error: unknown): string {
  if (error instanceof Error) {
    // Check for specific error messages or handle them in a custom way
    if (error.message.includes("Session expired")) {
      return "Your session has expired. Please log in again.";
    }
    return error.message;
  } else if (typeof error === "string") {
    return error; // If it's a string error, return as is
  } else if (error instanceof Response) {
    // Handle fetch errors (e.g., network issues)
    return `Network error: ${error.statusText || "Unknown error"}`;
  } else {
    return "An unexpected error occurred.";
  }
}

// Type for HTTP methods
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

// Generic request function
async function request<T>(
  URL: string,
  method: HttpMethod,
  payload?: unknown
): Promise<T> {
  const accessToken = Cookies.get("access_token");

  // Check if access token exists or is expired
  if (!accessToken || isAccessTokenExpired()) {
    await handleLogout();
    throw new Error("Session expired. Please log in again.");
  }

  try {
    const response = await fetch(`${baseUrl}${URL}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    // Handle successful response (even if no content)
    if (response.ok) {
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        return (await response.json()) as T;
      }
      return {} as T; // If no JSON body (e.g., 204 No Content)
    }

    // Handle error responses properly
    const errorData = await response.json().catch(() => null); // Attempt to parse JSON
    const errorMessage =
      errorData?.message || `Error ${response.status}: ${response.statusText}`;

    throw new Error(errorMessage);
  } catch (error: unknown) {
    // Log the error and throw a specific error message
    console.error("API request error:", error);

    const errorMessage = handleError(error);
    throw new Error(errorMessage);
  }
}

// Logout the user by clearing tokens - now returns a Promise
export const handleLogout = async (): Promise<void> => {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  
  try {
    // Using fetch directly for logout
    await fetch(`${baseUrl}/api/auth/logout`, { method: "POST" });
  } catch (error) {
    console.error("Logout error:", error);
  }
  
  // For Next.js, better to use the Router for navigation
  if (typeof window !== 'undefined') {
    window.location.href = "/";
  }
};

// HTTP request handlers with proper typing
export async function postRequest<T>(
  URL: string,
  payload?: unknown
): Promise<T> {
  return request<T>(`${URL}`, "POST", payload);
}

export async function putRequest<T>(
  URL: string,
  payload?: unknown
): Promise<T> {
  return request<T>(URL, "PUT", payload);
}

export async function getRequest<T>(URL: string): Promise<T> {
  return request<T>(URL, "GET");
}

// Added DELETE request handler
export async function deleteRequest<T>(URL: string): Promise<T> {
  return request<T>(URL, "DELETE");
}