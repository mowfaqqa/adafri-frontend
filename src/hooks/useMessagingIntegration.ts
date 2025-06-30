"use client";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/lib/context/auth";
import useAuthStore from "@/lib/store/messaging/authStore";
import { useAuthApi } from "@/lib/api/messaging/auth";
import socketClient from "@/lib/socket/messagingSocketClient/socketClient";
import Cookies from "js-cookie";
import config from "@/lib/config/messaging";

export const useMessagingIntegration = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Main application auth
  const authContext = useContext(AuthContext);

  // Messaging auth
  const {
    initialize,
    isAuthenticated: isMessagingAuthenticated,
    user: messagingUser,
  } = useAuthStore();

  // Hook-based API
  const authApi = useAuthApi();

  // Effect to initialize messaging when main app auth changes
  useEffect(() => {
    const initializeMessaging = async () => {
      // Case 1: External auth is authenticated but messaging is not yet authenticated
      if (
        authContext.isAuthenticated &&
        authContext.token &&
        !isMessagingAuthenticated
      ) {
        try {
          setIsInitializing(true);
          setError(null);

          // Extract the token value from auth context
          const tokenValue = authContext.token.access_token;

          // Call the hook-based API for external token authentication
          const authResponse =
            await authApi.authenticateWithExternalToken(tokenValue);
          console.log("Auth response:", authResponse);
          // Initialize messaging with the response
          if (authResponse && authResponse.token) {
            // Store the messaging token
            localStorage.setItem("messaging_token", tokenValue);
            Cookies.set(config.tokenCookieName, tokenValue);

            // Initialize socket connection
            socketClient.connect(authResponse.token);

            // Update the messaging auth store
            const success = await initialize(tokenValue);

            if (success) {
              setIsInitialized(true);
            } else {
              setError("Failed to initialize messaging after authentication");
            }
          } else {
            setError("Invalid response from authentication service");
          }
        } catch (err) {
          console.error("Error initializing messaging:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Unknown error initializing messaging"
          );
        } finally {
          setIsInitializing(false);
        }
      }
      // Case 2: External auth is not authenticated - reset messaging
      else if (!authContext.isAuthenticated) {
        if (isInitialized) {
          socketClient.disconnect();
          localStorage.removeItem("messaging_token");
          Cookies.remove(config.tokenCookieName);
          setIsInitialized(false);
        }
        setIsInitializing(false);
      }
      // Case 3: Both are already authenticated - just mark as done
      else if (authContext.isAuthenticated && isMessagingAuthenticated) {
        setIsInitialized(true);
        setIsInitializing(false);
      }
    };

    initializeMessaging();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isMessagingInitialized: isInitialized,
    isMessagingInitializing: isInitializing,
    isMessagingAuthenticated,
    messagingError: error,
    messagingUser,
    mainUser: authContext.user,
  };
};

export default useMessagingIntegration;















































// 30/6/2025
// "use client";
// import { useContext, useEffect, useState } from "react";
// import { AuthContext } from "@/lib/context/auth";
// import useAuthStore from "@/lib/store/messaging/authStore";
// import { useAuthApi } from "@/lib/api/messaging/auth";
// import socketClient from "@/lib/socket/messagingSocketClient/socketClient";
// import Cookies from "js-cookie";
// import config from "@/lib/config/messaging";

// export const useMessagingIntegration = () => {
//   const [isInitialized, setIsInitialized] = useState(false);
//   const [isInitializing, setIsInitializing] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Main application auth
//   const authContext = useContext(AuthContext);

//   // Messaging auth
//   const {
//     initialize,
//     isAuthenticated: isMessagingAuthenticated,
//     user: messagingUser,
//   } = useAuthStore();

//   // Hook-based API
//   const authApi = useAuthApi();

//   // Effect to initialize messaging when main app auth changes
//   useEffect(() => {
//     const initializeMessaging = async () => {
//       // Case 1: External auth is authenticated but messaging is not yet authenticated
//       if (
//         authContext.isAuthenticated &&
//         authContext.token &&
//         !isMessagingAuthenticated
//       ) {
//         try {
//           setIsInitializing(true);
//           setError(null);

//           // Extract the token value from auth context
//           const tokenValue = authContext.token.access_token;

//           // Call the hook-based API for external token authentication
//           const authResponse =
//             await authApi.authenticateWithExternalToken(tokenValue);
//           console.log("Auth response:", authResponse);
//           // Initialize messaging with the response
//           if (authResponse && authResponse.token) {
//             // Store the messaging token
//             localStorage.setItem("messaging_token", tokenValue);
//             Cookies.set(config.tokenCookieName, tokenValue);

//             // Initialize socket connection
//             socketClient.connect(authResponse.token);

//             // Update the messaging auth store
//             const success = await initialize(tokenValue);

//             if (success) {
//               setIsInitialized(true);
//             } else {
//               setError("Failed to initialize messaging after authentication");
//             }
//           } else {
//             setError("Invalid response from authentication service");
//           }
//         } catch (err) {
//           console.error("Error initializing messaging:", err);
//           setError(
//             err instanceof Error
//               ? err.message
//               : "Unknown error initializing messaging"
//           );
//         } finally {
//           setIsInitializing(false);
//         }
//       }
//       // Case 2: External auth is not authenticated - reset messaging
//       else if (!authContext.isAuthenticated) {
//         if (isInitialized) {
//           socketClient.disconnect();
//           localStorage.removeItem("messaging_token");
//           Cookies.remove(config.tokenCookieName);
//           setIsInitialized(false);
//         }
//         setIsInitializing(false);
//       }
//       // Case 3: Both are already authenticated - just mark as done
//       else if (authContext.isAuthenticated && isMessagingAuthenticated) {
//         setIsInitialized(true);
//         setIsInitializing(false);
//       }
//     };

//     initializeMessaging();
//   }, []);

//   return {
//     isMessagingInitialized: isInitialized,
//     isMessagingInitializing: isInitializing,
//     isMessagingAuthenticated,
//     messagingError: error,
//     messagingUser,
//     mainUser: authContext.user,
//   };
// };

// export default useMessagingIntegration;