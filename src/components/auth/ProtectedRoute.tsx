"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const ACCESS_TOKEN_COOKIE = '__frsadfrusrtkn';
const REFRESH_TOKEN_COOKIE = '__rfrsadfrusrtkn';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAuthentication = async () => {
      // Check for access token
      const accessToken = Cookies.get(ACCESS_TOKEN_COOKIE);
      
      // Check for refresh token
      const refreshToken = Cookies.get(REFRESH_TOKEN_COOKIE);
      
      if (!accessToken) {
        // If no access token exists, redirect to login
        console.log('Missing authentication token');
        router.replace('/auth/login');
        return;
      }
      
      // Check for userId as an additional verification
      const userId = Cookies.get('userId');
      if (!userId) {
        console.log('Missing user ID');
        Cookies.remove(ACCESS_TOKEN_COOKIE);
        Cookies.remove(REFRESH_TOKEN_COOKIE);
        router.replace('/auth/login');
        return;
      }

      try {
        // If access token is expired and refresh token exists, try to refresh
        if (refreshToken && isTokenExpired(accessToken)) {
          const success = await refreshAccessToken(refreshToken);
          if (!success) {
            throw new Error('Failed to refresh token');
          }
        }
        
        // If we get here, authentication is accepted
        setIsVerifying(false);
      } catch (error) {
        console.error('Error during authentication check:', error);
        // On error, clear tokens and redirect
        Cookies.remove(ACCESS_TOKEN_COOKIE);
        Cookies.remove(REFRESH_TOKEN_COOKIE);
        router.replace('/auth/login');
      }
    };
    
    verifyAuthentication();
  }, [router]);
  
  // Helper function to check if a JWT token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp < Date.now() / 1000;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // If we can't parse the token, assume it's expired
    }
  };
  
  // Function to refresh the access token using the refresh token
  const refreshAccessToken = async (refreshToken: string): Promise<boolean> => {
    try {
      const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/refresh-token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      
      const data = await response.json();
      
      // Store the new tokens from meta
      if (data.meta && data.meta.access_token) {
        Cookies.set(ACCESS_TOKEN_COOKIE, data.meta.access_token, { 
          secure: true,
          sameSite: 'strict',
          path: '/'
        });
      } else {
        return false;
      }
      
      // Update refresh token if a new one is provided
      if (data.meta && data.meta.refresh_token) {
        Cookies.set(REFRESH_TOKEN_COOKIE, data.meta.refresh_token, { 
          secure: true,
          sameSite: 'strict',
          path: '/'
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  // Show loading state while verifying
  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Authentication verified, render children
  return <>{children}</>;
}














// "use client";

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Cookies from 'js-cookie';

// // Define auth state cookie name
// const AUTH_STATE_COOKIE = 'auth_state';

// interface ProtectedRouteProps {
//   children: React.ReactNode;
// }

// export function ProtectedRoute({ children }: ProtectedRouteProps) {
//   const router = useRouter();
//   const [isVerifying, setIsVerifying] = useState(true);

//   useEffect(() => {
//     const verifyAuthentication = async () => {
//       // Check for our client-side auth state cookie
//       const authState = Cookies.get(AUTH_STATE_COOKIE);
      
//       if (!authState) {
//         // If no auth state cookie exists, redirect to login
//         router.replace('/auth/login');
//         return;
//       }
      
//       // Check for userId as an additional verification
//       const userId = Cookies.get('userId');
//       if (!userId) {
//         Cookies.remove(AUTH_STATE_COOKIE);
//         router.replace('/auth/login');
//         return;
//       }

//       try {
//         // Optional: If you have any endpoint that requires authentication
//         // you can use it here to test if the auth cookies are valid
//         // For example, a user profile endpoint or any protected resource
        
//         // For now, we'll trust the client-side cookies
//         // but in production, consider adding a proper verification endpoint
        
//         // If we get here, authentication is accepted for now
//         setIsVerifying(false);
//       } catch (error) {
//         console.error('Error during authentication check:', error);
//         // On error, clear auth state and redirect
//         Cookies.remove(AUTH_STATE_COOKIE);
//         router.replace('/auth/login');
//       }
//     };
    
//     verifyAuthentication();
//   }, [router]);

//   // Show loading state while verifying
//   if (isVerifying) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
//           <p className="mt-4 text-gray-600">Verifying access...</p>
//         </div>
//       </div>
//     );
//   }

//   // Authentication verified, render children
//   return <>{children}</>;
// }




















































// "use client";

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Cookies from 'js-cookie';

// interface ProtectedRouteProps {
//   children: React.ReactNode;
// }

// // Interface for session data
// interface SessionData {
//   accessToken: string;
//   sessionId: string;
//   expiresAt: number; // timestamp in milliseconds
// }

// // Session management utility with API integration
// export const SessionManager = {
//   // Base API URL
//   apiBaseUrl: 'https://be-auth-server.onrender.com/api/v1',
  
//   // Set session data after authentication is handled elsewhere
//   setSession: (token: string, sessionId: string, expiresInSeconds: number = 3600) => {
//     const expiresAt = Date.now() + expiresInSeconds * 1000;
    
//     // Store session data in cookies
//     Cookies.set('accessToken', token, { 
//       expires: new Date(expiresAt),
//       sameSite: 'strict' 
//     });
    
//     Cookies.set('sessionId', sessionId, {
//       expires: new Date(expiresAt),
//       sameSite: 'strict'
//     });
    
//     Cookies.set('expiresAt', String(expiresAt), { 
//       expires: new Date(expiresAt),
//       sameSite: 'strict' 
//     });
    
//     return {
//       accessToken: token,
//       sessionId: sessionId,
//       expiresAt: expiresAt
//     };
//   },
  
//   // Check session validity via API
//   checkSession: async (sessionId: string): Promise<boolean> => {
//     try {
//       const response = await fetch(`${SessionManager.apiBaseUrl}/sessions/${sessionId}`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${Cookies.get('accessToken')}`,
//         },
//       });

//       if (!response.ok) {
//         // Session invalid or expired
//         SessionManager.removeSession();
//         return false;
//       }

//       const sessionData = await response.json();
//       // Update expiration if needed
//       if (sessionData.expiresAt) {
//         const expiresAt = new Date(sessionData.expiresAt).getTime();
//         Cookies.set('expiresAt', String(expiresAt), { 
//           expires: new Date(expiresAt),
//           sameSite: 'strict' 
//         });
//       }
      
//       return true;
//     } catch (error) {
//       console.error('Session verification error:', error);
//       return false;
//     }
//   },
  
//   // Remove session via API
//   removeSession: async (): Promise<void> => {
//     const sessionId = Cookies.get('sessionId');
//     const accessToken = Cookies.get('accessToken');
    
//     // Only attempt API deletion if we have a sessionId and token
//     if (sessionId && accessToken) {
//       try {
//         await fetch(`${SessionManager.apiBaseUrl}/sessions/${sessionId}`, {
//           method: 'DELETE',
//           headers: {
//             'Authorization': `Bearer ${accessToken}`,
//           },
//         });
//       } catch (error) {
//         console.error('Error removing session from server:', error);
//       }
//     }
    
//     // Always clean up local cookies regardless of API success
//     Cookies.remove('accessToken');
//     Cookies.remove('sessionId');
//     Cookies.remove('expiresAt');
//   },
  
//   // Get current session data from cookies
//   getSession: (): SessionData | null => {
//     const accessToken = Cookies.get('accessToken');
//     const sessionId = Cookies.get('sessionId');
//     const expiresAt = Cookies.get('expiresAt');
    
//     if (!accessToken || !sessionId || !expiresAt) {
//       return null;
//     }
    
//     return {
//       accessToken,
//       sessionId,
//       expiresAt: parseInt(expiresAt)
//     };
//   },
  
//   // Check if session is locally valid (exists and not expired)
//   isLocalSessionValid: (): boolean => {
//     const session = SessionManager.getSession();
    
//     if (!session) {
//       return false;
//     }
    
//     // Check if session is expired
//     return session.expiresAt > Date.now();
//   },
  
//   // Get time remaining in seconds before session expires
//   getTimeRemaining: (): number | null => {
//     const session = SessionManager.getSession();
    
//     if (!session) {
//       return null;
//     }
    
//     const remainingMs = session.expiresAt - Date.now();
//     return remainingMs > 0 ? Math.floor(remainingMs / 1000) : 0;
//   },
// };

// export function ProtectedRoute({ children }: ProtectedRouteProps) {
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(true);
  
//   useEffect(() => {
//     const verifySession = async () => {
//       // First check if we have local session data
//       if (!SessionManager.isLocalSessionValid()) {
//         await SessionManager.removeSession();
//         router.replace('/auth/login');
//         return;
//       }
      
//       // If we have local data, verify with server
//       const session = SessionManager.getSession();
//       if (session?.sessionId) {
//         const isValid = await SessionManager.checkSession(session.sessionId);
//         if (!isValid) {
//           router.replace('/auth/login');
//           return;
//         }
//       } else {
//         // No session ID, redirect to login
//         router.replace('/auth/login');
//         return;
//       }
      
//       // Session is valid
//       setIsLoading(false);
//     };
    
//     verifySession();
    
//     // Set up periodic session verification (every minute)
//     const intervalId = setInterval(async () => {
//       const session = SessionManager.getSession();
//       if (session?.sessionId) {
//         await SessionManager.checkSession(session.sessionId);
//       }
//     }, 60000);
    
//     return () => clearInterval(intervalId);
//   }, [router]);
  
//   // Show loading state while checking authentication
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
//       </div>
//     );
//   }
  
//   return <>{children}</>;
// }

// // Custom hook for using session in components
// export function useSession() {
//   const router = useRouter();
//   const [sessionData, setSessionData] = useState<SessionData | null>(null);
//   const [isVerifying, setIsVerifying] = useState(true);
  
//   useEffect(() => {
//     const validateSession = async () => {
//       setIsVerifying(true);
      
//       // Get local session
//       const session = SessionManager.getSession();
//       setSessionData(session);
      
//       if (!session) {
//         setIsVerifying(false);
//         router.replace('/auth/login');
//         return;
//       }
      
//       // Verify with server
//       if (session.sessionId) {
//         const isValid = await SessionManager.checkSession(session.sessionId);
//         if (!isValid) {
//           router.replace('/auth/login');
//         }
//       }
      
//       setIsVerifying(false);
//     };
    
//     validateSession();
    
//     // Periodically check session status
//     const intervalId = setInterval(() => {
//       validateSession();
//     }, 60000); // Every minute
    
//     return () => clearInterval(intervalId);
//   }, [router]);
  
//   return {
//     session: sessionData,
//     isVerifying,
//     isAuthenticated: SessionManager.isLocalSessionValid(),
//     timeRemaining: SessionManager.getTimeRemaining(),
//     logout: async () => {
//       await SessionManager.removeSession();
//       router.replace('/auth/login');
//     }
//   };
// }



































// "use client";

// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import Cookies from 'js-cookie';

// interface ProtectedRouteProps {
//   children: React.ReactNode;
// }

// export function ProtectedRoute({ children }: ProtectedRouteProps) {
//   const router = useRouter();

//   useEffect(() => {
//     // Check for access token in cookies
//     const accessToken = Cookies.get('accessToken');
    
//     // If no access token, redirect to login page
//     if (!accessToken) {
//       router.replace('/auth/login');
//     }
//   }, []); // Empty dependency array means this runs once on component mount

//   // Optional: Add a loading state or placeholder while checking authentication
//   if (typeof window !== 'undefined' && !Cookies.get('accessToken')) {
//     return null; // or return a loading spinner
//   }

//   return <>{children}</>;
// }