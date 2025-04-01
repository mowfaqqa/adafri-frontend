/**
 * Get a cookie value by name
 * @param name The name of the cookie to retrieve
 * @returns The cookie value or null if not found
 */
export function getCookie(name: string): string | null {
    if (typeof document === 'undefined') {
      return null; // Handle server-side rendering
    }
    
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + '=')) {
        return cookie.substring(name.length + 1);
      }
    }
    return null;
  }
  
  /**
   * Set a cookie with the given name and value
   * @param name The name of the cookie
   * @param value The value to store
   * @param days Number of days until the cookie expires (default: 7)
   */
  export function setCookie(name: string, value: string, days: number = 7): void {
    if (typeof document === 'undefined') {
      return; // Handle server-side rendering
    }
    
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; samesite=strict`;
  }
  
  /**
   * Remove a cookie by name
   * @param name The name of the cookie to remove
   */
  export function removeCookie(name: string): void {
    if (typeof document === 'undefined') {
      return; // Handle server-side rendering
    }
    
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=strict`;
  }
  
  /**
   * Get the authentication token from cookies
   */
  export function getAuthToken(): string | null {
    return getCookie('accessToken');
  }
  
  /**
   * Get user information from cookies
   */
  export function getUserInfo() {
    return {
      email: getCookie('userEmail'),
      name: getCookie('userName'),
      userId: getCookie('userId'),
      accessToken: getCookie('accessToken')
    };
  }
  
  /**
   * Check if user is authenticated (has valid access token)
   */
  export function isAuthenticated(): boolean {
    return !!getCookie('accessToken');
  }
  
  /**
   * Clear all authentication cookies (for logout)
   */
  export function clearAuthCookies(): void {
    removeCookie('accessToken');
    removeCookie('userEmail');
    removeCookie('userName');
    removeCookie('userId');
    removeCookie('linkedEmailId');
  }






// utils/cookies.ts

// /**
//  * Get a cookie value by name
//  * @param name The name of the cookie to retrieve
//  * @returns The cookie value or null if not found
//  */
// export function getCookie(name: string): string | null {
//     if (typeof document === 'undefined') {
//         return null; // Handle server-side rendering
//     }

//     const cookies = document.cookie.split(';');
//     for (let i = 0; i < cookies.length; i++) {
//         const cookie = cookies[i].trim();
//         if (cookie.startsWith(name + '=')) {
//             return cookie.substring(name.length + 1);
//         }
//     }
//     return null;
// }

// /**
//  * Set a cookie with the given name and value
//  * @param name The name of the cookie
//  * @param value The value to store
//  * @param days Number of days until the cookie expires (default: 7)
//  */
// export function setCookie(name: string, value: string, days: number = 7): void {
//     if (typeof document === 'undefined') {
//         return; // Handle server-side rendering
//     }

//     const expires = new Date();
//     expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
//     document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; samesite=strict`;
// }

// /**
//  * Remove a cookie by name
//  * @param name The name of the cookie to remove
//  */
// export function removeCookie(name: string): void {
//     if (typeof document === 'undefined') {
//         return; // Handle server-side rendering
//     }

//     document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=strict`;
// }

// /**
//  * Get the authentication token from cookies
//  */
// export function getAuthToken(): string | null {
//     return getCookie('accessToken');
// }

// /**
//  * Get user information from cookies
//  */
// export function getUserInfo() {
//     return {
//         email: getCookie('userEmail'),
//         name: getCookie('userName'),
//         userId: getCookie('userId'),
//         accessToken: getCookie('accessToken')
//     };
// }

// /**
//  * Check if user is authenticated (has valid access token)
//  */
// export function isAuthenticated(): boolean {
//     return !!getCookie('accessToken');
// }

// /**
//  * Clear all authentication cookies (for logout)
//  */
// export function clearAuthCookies(): void {
//     removeCookie('accessToken');
//     removeCookie('userEmail');
//     removeCookie('userName');
//     removeCookie('userId');
//     removeCookie('linkedEmailId');
// }