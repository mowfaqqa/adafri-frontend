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
 * Checks both standard and legacy formats
 */
export function getAuthToken(): string | null {
  return getCookie('message_token')
}

/**
 * Get the Djombi access token from cookies
 * Uses the __frsadfrusrtkn cookie as specified
 */
export function getDjombiToken(): string | null {
  return getCookie('__frsadfrusrtkn') || getCookie('__rfrsadfrusrtkn');
}

/**
 * Get user information from cookies
 */
export function getUserInfo() {
  const userName = getCookie('userName');
  let firstName = '';
  let lastName = '';
  
  if (userName) {
    const nameParts = userName.split('.');
    firstName = nameParts[0] || '';
    lastName = nameParts[1] || '';
  }
  
  return {
    email: getCookie('userEmail'),
    name: userName,
    firstName: firstName,
    lastName: lastName,
    userId: getCookie('userId'),
    accessToken: getAuthToken()
  };
}

/**
 * Parse user name from cookie into first and last name
 */
export function getUserName(): { firstName: string, lastName: string } {
  const userName = getCookie('userName');
  if (!userName) {
    return { firstName: '', lastName: '' };
  }
  
  const nameParts = userName.split('.');
  return {
    firstName: nameParts[0] || '',
    lastName: nameParts[1] || ''
  };
}

/**
 * Check if user is authenticated (has valid access token)
 */
export function isAuthenticated(): boolean {
  // Check for both token formats
  return !!(getCookie('accessToken') || getCookie('__frsadfrusrtkn'));
}

/**
 * Set selected linked email ID and type in cookies
 * @param emailId The ID of the selected email
 * @param type The type of the email (personal/professional)
 */
export function setSelectedLinkedEmail(emailId: string, type: string | null): void {
  setCookie('selectedLinkedEmailId', emailId, 30); // 30 days expiry
  setCookie('selectedLinkedEmailType', type || '', 30); // 30 days expiry
}

/**
 * Get selected linked email ID from cookies
 */
export function getSelectedLinkedEmailId(): string | null {
  return getCookie('selectedLinkedEmailId');
}

/**
 * Get selected linked email type from cookies
 */
export function getSelectedLinkedEmailType(): string | null {
  const type = getCookie('selectedLinkedEmailType');
  return type === '' ? null : type;
}

/**
 * Get selected linked email information (both ID and type)
 */
export function getSelectedLinkedEmail(): { id: string; type: string | null } | null {
  const id = getSelectedLinkedEmailId();
  const type = getSelectedLinkedEmailType();
  
  if (id) {
    return { id, type };
  }
  return null;
}

/**
 * Get linked email ID by type from stored emails
 * This function would need to be used with stored email data
 */
export function getLinkedEmailIdByType(emails: any[], type: string | null): string | null {
  if (!emails || emails.length === 0) return null;
  
  // Find email with matching type
  const email = emails.find(email => {
    if (type === 'personal' || type === null) {
      return email.type === 'personal' || email.type === null;
    }
    return email.type === type;
  });
  
  return email ? email.id : null;
}

/**
 * Remove selected linked email cookies
 */
export function removeSelectedLinkedEmail(): void {
  removeCookie('selectedLinkedEmailId');
  removeCookie('selectedLinkedEmailType');
}

/**
 * Clear all authentication cookies (for logout)
 */
export function clearAuthCookies(): void {
  removeCookie('accessToken');
  removeCookie('__frsadfrusrtkn');
  removeCookie('__rfrsadfrusrtkn');
  removeCookie('userEmail');
  removeCookie('userName');
  removeCookie('userId');
  removeCookie('selectedLinkedEmailId');
  removeCookie('selectedLinkedEmailType');
}








































// 7/8/2025 working
// /**
//  * Get a cookie value by name
//  * @param name The name of the cookie to retrieve
//  * @returns The cookie value or null if not found
//  */
// export function getCookie(name: string): string | null {
//   if (typeof document === 'undefined') {
//     return null; // Handle server-side rendering
//   }
  
//   const cookies = document.cookie.split(';');
//   for (let i = 0; i < cookies.length; i++) {
//     const cookie = cookies[i].trim();
//     if (cookie.startsWith(name + '=')) {
//       return cookie.substring(name.length + 1);
//     }
//   }
//   return null;
// }

// /**
//  * Set a cookie with the given name and value
//  * @param name The name of the cookie
//  * @param value The value to store
//  * @param days Number of days until the cookie expires (default: 7)
//  */
// export function setCookie(name: string, value: string, days: number = 7): void {
//   if (typeof document === 'undefined') {
//     return; // Handle server-side rendering
//   }
  
//   const expires = new Date();
//   expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
//   document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; samesite=strict`;
// }

// /**
//  * Remove a cookie by name
//  * @param name The name of the cookie to remove
//  */
// export function removeCookie(name: string): void {
//   if (typeof document === 'undefined') {
//     return; // Handle server-side rendering
//   }
  
//   document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=strict`;
// }

// /**
//  * Get the authentication token from cookies
//  * Checks both standard and legacy formats
//  */
// export function getAuthToken(): string | null {
//   return getCookie('message_token')
// }

// /**
//  * Get user information from cookies
//  */
// export function getUserInfo() {
//   const userName = getCookie('userName');
//   let firstName = '';
//   let lastName = '';
  
//   if (userName) {
//     const nameParts = userName.split('.');
//     firstName = nameParts[0] || '';
//     lastName = nameParts[1] || '';
//   }
  
//   return {
//     email: getCookie('userEmail'),
//     name: userName,
//     firstName: firstName,
//     lastName: lastName,
//     userId: getCookie('userId'),
//     accessToken: getAuthToken()
//   };
// }

// /**
//  * Parse user name from cookie into first and last name
//  */
// export function getUserName(): { firstName: string, lastName: string } {
//   const userName = getCookie('userName');
//   if (!userName) {
//     return { firstName: '', lastName: '' };
//   }
  
//   const nameParts = userName.split('.');
//   return {
//     firstName: nameParts[0] || '',
//     lastName: nameParts[1] || ''
//   };
// }

// /**
//  * Check if user is authenticated (has valid access token)
//  */
// export function isAuthenticated(): boolean {
//   // Check for both token formats
//   return !!(getCookie('accessToken') || getCookie('__frsadfrusrtkn'));
// }

// /**
//  * Clear all authentication cookies (for logout)
//  */
// export function clearAuthCookies(): void {
//   removeCookie('accessToken');
//   removeCookie('__frsadfrusrtkn');
//   removeCookie('__rfrsadfrusrtkn');
//   removeCookie('userEmail');
//   removeCookie('userName');
//   removeCookie('userId');
//   removeCookie('linkedEmailId');
// }










































// /**
//  * Get a cookie value by name
//  * @param name The name of the cookie to retrieve
//  * @returns The cookie value or null if not found
//  */
// export function getCookie(name: string): string | null {
//     if (typeof document === 'undefined') {
//       return null; // Handle server-side rendering
//     }
    
//     const cookies = document.cookie.split(';');
//     for (let i = 0; i < cookies.length; i++) {
//       const cookie = cookies[i].trim();
//       if (cookie.startsWith(name + '=')) {
//         return cookie.substring(name.length + 1);
//       }
//     }
//     return null;
//   }
  
//   /**
//    * Set a cookie with the given name and value
//    * @param name The name of the cookie
//    * @param value The value to store
//    * @param days Number of days until the cookie expires (default: 7)
//    */
//   export function setCookie(name: string, value: string, days: number = 7): void {
//     if (typeof document === 'undefined') {
//       return; // Handle server-side rendering
//     }
    
//     const expires = new Date();
//     expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
//     document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; samesite=strict`;
//   }
  
//   /**
//    * Remove a cookie by name
//    * @param name The name of the cookie to remove
//    */
//   export function removeCookie(name: string): void {
//     if (typeof document === 'undefined') {
//       return; // Handle server-side rendering
//     }
    
//     document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=strict`;
//   }
  
//   /**
//    * Get the authentication token from cookies
//    */
//   export function getAuthToken(): string | null {
//     return getCookie('accessToken');
//   }
  
//   /**
//    * Get user information from cookies
//    */
//   export function getUserInfo() {
//     return {
//       email: getCookie('userEmail'),
//       name: getCookie('userName'),
//       userId: getCookie('userId'),
//       accessToken: getCookie('accessToken')
//     };
//   }
  
//   /**
//    * Check if user is authenticated (has valid access token)
//    */
//   export function isAuthenticated(): boolean {
//     return !!getCookie('accessToken');
//   }
  
//   /**
//    * Clear all authentication cookies (for logout)
//    */
//   export function clearAuthCookies(): void {
//     removeCookie('accessToken');
//     removeCookie('userEmail');
//     removeCookie('userName');
//     removeCookie('userId');
//     removeCookie('linkedEmailId');
//   }






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