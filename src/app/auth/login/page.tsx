'use client';

import React, { useState, useEffect, Suspense, useContext, useCallback } from "react";
import Link from "next/link";
import Image from 'next/image';
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from 'js-cookie';
import {
    Facebook as FaFacebook,
    Linkedin as FaLinkedin,
    Eye as EyeOpen,
    EyeOff as EyeClosed
} from "lucide-react";
import { Button } from "@/components/ui/button";
import InputField from "@/components/auth/InputField";
import AuthLayout from "@/components/auth/AuthLayout";
import { AuthContext } from "@/lib/context/auth";
import { Spinner } from "@awc/react";

// Main component that uses Suspense
function Login({isLoading}: {isLoading: boolean}) {
    const { isLoading: isLoadingAuth, isAuthenticated, user, tryLogin, login: isRedirecting } = useContext(AuthContext);
    const login = () => {
        tryLogin(true);
    }
    return (
        <AuthLayout>
            <Suspense fallback={
                <div className="w-full max-w-md mx-auto text-white text-center p-6">
                    <div className="animate-pulse">Loading...</div>
                </div>
            }>
                {isLoadingAuth && <div className="w-full max-w-md mx-auto text-white text-center p-6 flex flex-col items-center">
                    <Spinner width='30px' height='30px' />
                    <div className="animate-pulse">Loading...</div>
                    </div>}
                {!isLoadingAuth && !isAuthenticated && <Button onClick={login}>Log in</Button>}
                {!isLoadingAuth && isAuthenticated && user && <div className="flex flex-col items-center">
                    <span className="text-md">Connected as {user.email}</span>
                    <span className="text-md text-gray-800">or</span>
                    <Button onClick={login}>Login with another account</Button>
                </div>}
                {isRedirecting && <div className="w-full max-w-md mx-auto text-white text-center p-6">
                    <span className="animate-pulse">Redirecting in a few seconds to authentication page...</span>
                </div>}
                {/* {!isLoading && <LoginForm />} */}
            </Suspense>
        </AuthLayout>
    );
}
// const Login: React.FC = ({isLoading, children}: {isLoading: boolean}) => {
//     return (
//         <AuthLayout>
//             <Suspense fallback={
//                 <div className="w-full max-w-md mx-auto text-white text-center p-6">
//                     <div className="animate-pulse">Loading...</div>
//                 </div>
//             }>
            
//                 <LoginForm />
//             </Suspense>
//         </AuthLayout>
//     );
// };

// Define the component that uses useSearchParams
const LoginForm: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const {isAuthenticated, user, isLoading: isVerifying} = useContext(AuthContext);


    // Function to check authentication status - all dependent functions are defined inside
    const checkAuthStatus = useCallback(async (): Promise<boolean> => {
        // Function to decode JWT and check expiration - moved inside useCallback
        const isTokenExpired = (token: string): boolean => {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const { exp } = JSON.parse(jsonPayload);
                
                // Get current time in seconds
                const currentTime = Math.floor(Date.now() / 1000);
                
                // Return true if token is expired
                return exp < currentTime;
            } catch (error) {
                console.error('Error decoding token:', error);
                return true; // Assume expired if there's an error
            }
        };

        // Function to refresh the access token - moved inside useCallback
        const refreshAccessToken = async (): Promise<boolean> => {
            try {
                const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/refresh-token', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include', // This ensures cookies are sent with the request
                    cache: 'no-store'
                });
                
                if (!response.ok) {
                    // If refresh token is expired or invalid, clean up cookies
                    Cookies.remove('__frsadfrusrtkn');
                    Cookies.remove('__rfrsadfrusrtkn');
                    Cookies.remove('accessToken');
                    throw new Error('Failed to refresh token');
                }
                
                // Parse response to get new tokens
                const data = await response.json();
                
                // Update cookies with new tokens if available
                if (data.meta && data.meta.access_token) {
                    Cookies.set('__frsadfrusrtkn', data.meta.access_token, { 
                        secure: true,
                        sameSite: 'strict',
                        path: '/'
                    });
                    
                    Cookies.set('accessToken', data.meta.access_token, { 
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

        // Main authentication status check logic
        try {
            const _accessToken = Cookies.get('__frsadfrusrtkn');
            // console.log('t', _accessToken)
            
            if (!_accessToken) {
                return false;
            }
            const accessToken = _accessToken
            
            // Check if token is expired
            if (isTokenExpired(accessToken)) {
                // Try to refresh the token
                const refreshSuccess = await refreshAccessToken();
                return refreshSuccess;
            }
            
            return true;
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    }, []); // No external dependencies now

    useEffect(() => {
        // Check if user just verified email
        const verified = searchParams?.get('verified');
        if (verified === 'true') {
            setSuccessMessage("Email verified successfully! Please log in.");
            
            // Prefill email if available in cookies
            const storedEmail = Cookies.get('userEmail');
            if (storedEmail) {
                setEmail(storedEmail);
            }
        }
        
        // Check if user is already logged in
        const checkLoginStatus = async () => {
            const isLoggedIn = await checkAuthStatus();
            if (isLoggedIn) {
                router.push('/dashboard');
            } else {
                // Clear any existing tokens if authentication failed
                // This happens when the refresh token is expired or invalid
                Cookies.remove('__frsadfrusrtkn');
                Cookies.remove('__rfrsadfrusrtkn');
                Cookies.remove('accessToken');
                
                // No need to redirect since we're already on the login page
            }
        };
        
        checkLoginStatus();
    }, [searchParams, router, checkAuthStatus]);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setEmail(e.target.value);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setPassword(e.target.value);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        if (!email || !password) {
            setError("Please enter both email and password");
            return;
        }
    
        setIsLoading(true);
        setError("");
        setSuccessMessage("");
    
        try {
            // Login request
            const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include', // Include cookies in request
                cache: 'no-store'
            });
    
            const data = await response.json();

            // Check if 2FA is required
            if (response.status === 403 && data.message?.includes('2FA')) {
                // Store email and password for 2FA verification
                Cookies.set('2faEmail', email, { 
                    secure: true,
                    sameSite: 'strict',
                    path: '/'
                });
                
                Cookies.set('2faPassword', password, { 
                    secure: true,
                    sameSite: 'strict',
                    path: '/'
                });
                
                // Navigate to 2FA verification page
                router.push('/auth/two-factor-verification');
                return;
            }

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            
            // Handle tokens from meta object in response body
            if (data.meta && data.meta.access_token) {
                Cookies.set('__frsadfrusrtkn', data.meta.access_token, { 
                    secure: true,
                    sameSite: 'strict',
                    path: '/'
                });
                
                // Also set it in the standardized cookie name for our utility functions
                Cookies.set('accessToken', data.meta.access_token, { 
                    secure: true,
                    sameSite: 'strict',
                    path: '/'
                });
            }
            
            // For the refresh token, the server will set it as HttpOnly
            // but we'll also store it for our local usage
            if (data.meta && data.meta.refresh_token) {
                Cookies.set('__rfrsadfrusrtkn', data.meta.refresh_token, { 
                    secure: true,
                    sameSite: 'strict',
                    path: '/'
                });
            }
            
            // Store user information
            if (data.data) {
                const { id, first_name, last_name } = data.data;
                
                // Store email
                Cookies.set('userEmail', email, { 
                    expires: 30,
                    path: '/',
                    sameSite: 'lax'
                });
                
                // Store user ID if available
                if (id) {
                    Cookies.set('userId', id, { 
                        expires: 30,
                        path: '/',
                        sameSite: 'lax'
                    });
                }
                
                // Store user name if available
                if (first_name && last_name) {
                    const combinedName = `${first_name}.${last_name}`;
                    Cookies.set('userName', combinedName, { 
                        expires: 30,
                        path: '/',
                        sameSite: 'lax'
                    });
                }
            }
            
            // Redirect to dashboard
            router.push('/dashboard');
            
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Login failed';
            setError(errorMessage);
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = (provider: string) => {
        // Implement social login logic here or call an API endpoint
        setIsLoading(true);
        console.log(`Logging in with ${provider}...`);
        
        // For now, just show an error message
        setError(`${provider} login is not implemented yet`);
        setIsLoading(false);
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                <p className="text-emerald-500 mt-2">
                    Sign in to access your account
                </p>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 px-4 py-3 rounded relative" role="alert">
                    {successMessage}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
                    {error}
                </div>
            )}

            {/* Email Input */}
            <InputField
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                required
                aria-label="Email"
            />

            {/* Password Input */}
            <div className="relative">
                <InputField
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    aria-label="Password"
                />
                <button 
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? (
                        <EyeClosed className="h-5 w-5" />
                    ) : (
                        <EyeOpen className="h-5 w-5" />
                    )}
                </button>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
                <Link
                    href="/auth/forgot-password"
                    className="text-sm text-white hover:underline"
                >
                    Forgot password?
                </Link>
            </div>

            {/* Login Button */}
            <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                disabled={isLoading}
            >
                {isLoading ? 'Logging in...' : 'Log In'}
            </Button>

            {/* Social Login Buttons */}
            <div className="mt-6 space-y-4">
                <button
                    type="button"
                    className="w-full px-4 py-2 flex items-center justify-center bg-white text-black rounded-lg shadow-sm hover:bg-emerald-50 focus:outline-none transition-colors"
                    aria-label="Log in with Google"
                    onClick={() => handleSocialLogin('Google')}
                    disabled={isLoading}
                >
                    <Image
                        src="/icons/google.png"
                        alt="Google"
                        height={20}
                        width={20}
                        className="h-5 mr-2"
                    />
                    Log in with Google
                </button>
                <button
                    type="button"
                    className="w-full px-4 py-2 flex items-center justify-center bg-emerald-800 text-white rounded-lg shadow-sm hover:bg-emerald-900 focus:outline-none transition-colors"
                    aria-label="Log in with Facebook"
                    onClick={() => handleSocialLogin('Facebook')}
                    disabled={isLoading}
                >
                    <FaFacebook className="mr-2 h-5 w-5" />
                    Log in with Facebook
                </button>
                <button
                    type="button"
                    className="w-full px-4 py-2 flex items-center justify-center bg-emerald-700 text-white rounded-lg shadow-sm hover:bg-emerald-800 focus:outline-none transition-colors"
                    aria-label="Log in with LinkedIn"
                    onClick={() => handleSocialLogin('LinkedIn')}
                    disabled={isLoading}
                >
                    <FaLinkedin className="mr-2 h-5 w-5" />
                    Log in with LinkedIn
                </button>
            </div>

            {/* Don't have an account */}
            <div className="mt-6 text-center text-sm text-white">
                <p>
                    Don't have an account?{" "}
                    <Link
                        href="/auth/signup"
                        className="text-teal-500 hover:underline"
                    >
                        Sign up
                    </Link>
                </p>
            </div>

            {/* Privacy Policy and Terms */}
            <div className="mt-4 text-center text-sm text-white">
                <p>
                    By signing in, you agree to our{" "}
                    <Link
                        href="/privacy-policy"
                        className="text-emerald-400 hover:underline"
                    >
                        Privacy Policy
                    </Link>{" "}
                    and{" "}
                    <Link
                        href="/terms-of-service"
                        className="text-emerald-400 hover:underline"
                    >
                        Terms of Service
                    </Link>
                </p>
            </div>
        </form>
    );
};

export default Login;




















































// 'use client';

// import React, { useState, useEffect, Suspense } from "react";
// import Link from "next/link";
// import Image from 'next/image';
// import { useRouter, useSearchParams } from "next/navigation";
// import Cookies from 'js-cookie';
// import {
//     Facebook as FaFacebook,
//     Linkedin as FaLinkedin,
//     Eye as EyeOpen,
//     EyeOff as EyeClosed
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import InputField from "@/components/auth/InputField";
// import AuthLayout from "@/components/auth/AuthLayout";

// // Main component that uses Suspense
// const Login: React.FC = () => {
//     return (
//         <AuthLayout>
//             <Suspense fallback={
//                 <div className="w-full max-w-md mx-auto text-white text-center p-6">
//                     <div className="animate-pulse">Loading...</div>
//                 </div>
//             }>
//                 <LoginForm />
//             </Suspense>
//         </AuthLayout>
//     );
// };

// // Define the component that uses useSearchParams
// const LoginForm: React.FC = () => {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");
//     const [successMessage, setSuccessMessage] = useState("");
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const [showPassword, setShowPassword] = useState(false);

//     // Function to decode JWT and check expiration
//     const isTokenExpired = (token: string): boolean => {
//         try {
//             const base64Url = token.split('.')[1];
//             const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//             const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
//                 return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//             }).join(''));

//             const { exp } = JSON.parse(jsonPayload);
            
//             // Get current time in seconds
//             const currentTime = Math.floor(Date.now() / 1000);
            
//             // Return true if token is expired
//             return exp < currentTime;
//         } catch (error) {
//             console.error('Error decoding token:', error);
//             return true; // Assume expired if there's an error
//         }
//     };

//     // Function to refresh the access token
//     const refreshAccessToken = async (): Promise<boolean> => {
//         try {
//             const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/refresh-token', {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 credentials: 'include', // This ensures cookies are sent with the request
//                 cache: 'no-store'
//             });
            
//             if (!response.ok) {
//                 throw new Error('Failed to refresh token');
//             }
            
//             return true;
//         } catch (error) {
//             console.error('Error refreshing token:', error);
//             return false;
//         }
//     };

//     // Function to check authentication status
//     const checkAuthStatus = async (): Promise<boolean> => {
//         try {
//             const accessToken = Cookies.get('__frsadfrusrtkn');
            
//             if (!accessToken) {
//                 return false;
//             }
            
//             // Check if token is expired
//             if (isTokenExpired(accessToken)) {
//                 // Try to refresh the token
//                 const refreshSuccess = await refreshAccessToken();
//                 return refreshSuccess;
//             }
            
//             return true;
//         } catch (error) {
//             console.error('Auth check error:', error);
//             return false;
//         }
//     };

//     useEffect(() => {
//         // Check if user just verified email
//         const verified = searchParams?.get('verified');
//         if (verified === 'true') {
//             setSuccessMessage("Email verified successfully! Please log in.");
            
//             // Prefill email if available in cookies
//             const storedEmail = Cookies.get('userEmail');
//             if (storedEmail) {
//                 setEmail(storedEmail);
//             }
//         }
        
//         // Check if user is already logged in
//         const checkLoginStatus = async () => {
//             const isLoggedIn = await checkAuthStatus();
//             if (isLoggedIn) {
//                 router.push('/dashboard');
//             }
//         };
        
//         checkLoginStatus();
//     }, [searchParams, router]);

//     const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setEmail(e.target.value);

//     const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setPassword(e.target.value);

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
    
//         if (!email || !password) {
//             setError("Please enter both email and password");
//             return;
//         }
    
//         setIsLoading(true);
//         setError("");
//         setSuccessMessage("");
    
//         try {
//             // Login request
//             const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/login', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ email, password }),
//                 credentials: 'include', // Include cookies in request
//                 cache: 'no-store'
//             });
    
//             const data = await response.json();

//             // Check if 2FA is required
//             if (response.status === 403 && data.message?.includes('2FA')) {
//                 // Store email and password for 2FA verification
//                 Cookies.set('2faEmail', email, { 
//                     secure: true,
//                     sameSite: 'strict',
//                     path: '/'
//                 });
                
//                 Cookies.set('2faPassword', password, { 
//                     secure: true,
//                     sameSite: 'strict',
//                     path: '/'
//                 });
                
//                 // Navigate to 2FA verification page
//                 router.push('/auth/two-factor-verification');
//                 return;
//             }

//             if (!response.ok) {
//                 throw new Error(data.message || 'Login failed');
//             }
            
//             // Handle tokens from meta object in response body
//             if (data.meta && data.meta.access_token) {
//                 Cookies.set('__frsadfrusrtkn', data.meta.access_token, { 
//                     secure: true,
//                     sameSite: 'strict',
//                     path: '/'
//                 });
                
//                 // Also set it in the standardized cookie name for our utility functions
//                 Cookies.set('accessToken', data.meta.access_token, { 
//                     secure: true,
//                     sameSite: 'strict',
//                     path: '/'
//                 });
//             }
            
//             // For the refresh token, the server will set it as HttpOnly
//             // but we'll also store it for our local usage
//             if (data.meta && data.meta.refresh_token) {
//                 Cookies.set('__rfrsadfrusrtkn', data.meta.refresh_token, { 
//                     secure: true,
//                     sameSite: 'strict',
//                     path: '/'
//                 });
//             }
            
//             // Store user information
//             if (data.data) {
//                 const { id, first_name, last_name } = data.data;
                
//                 // Store email
//                 Cookies.set('userEmail', email, { 
//                     expires: 30,
//                     path: '/',
//                     sameSite: 'lax'
//                 });
                
//                 // Store user ID if available
//                 if (id) {
//                     Cookies.set('userId', id, { 
//                         expires: 30,
//                         path: '/',
//                         sameSite: 'lax'
//                     });
//                 }
                
//                 // Store user name if available
//                 if (first_name && last_name) {
//                     const combinedName = `${first_name}.${last_name}`;
//                     Cookies.set('userName', combinedName, { 
//                         expires: 30,
//                         path: '/',
//                         sameSite: 'lax'
//                     });
//                 }
//             }
            
//             // Redirect to dashboard
//             router.push('/dashboard');
            
//         } catch (err: unknown) {
//             const errorMessage = err instanceof Error ? err.message : 'Login failed';
//             setError(errorMessage);
//             console.error('Login error:', err);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleSocialLogin = (provider: string) => {
//         // Implement social login logic here or call an API endpoint
//         setIsLoading(true);
//         console.log(`Logging in with ${provider}...`);
        
//         // For now, just show an error message
//         setError(`${provider} login is not implemented yet`);
//         setIsLoading(false);
//     };

//     return (
//         <form className="space-y-6" onSubmit={handleSubmit}>
//             <div className="text-center mb-6">
//                 <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
//                 <p className="text-emerald-500 mt-2">
//                     Sign in to access your account
//                 </p>
//             </div>

//             {/* Success Message */}
//             {successMessage && (
//                 <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 px-4 py-3 rounded relative" role="alert">
//                     {successMessage}
//                 </div>
//             )}

//             {/* Error Message */}
//             {error && (
//                 <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
//                     {error}
//                 </div>
//             )}

//             {/* Email Input */}
//             <InputField
//                 type="email"
//                 placeholder="Enter your email"
//                 value={email}
//                 onChange={handleEmailChange}
//                 required
//                 aria-label="Email"
//             />

//             {/* Password Input */}
//             <div className="relative">
//                 <InputField
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Enter your password"
//                     value={password}
//                     onChange={handlePasswordChange}
//                     required
//                     aria-label="Password"
//                 />
//                 <button 
//                     type="button"
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                     onClick={() => setShowPassword(!showPassword)}
//                     aria-label={showPassword ? "Hide password" : "Show password"}
//                 >
//                     {showPassword ? (
//                         <EyeClosed className="h-5 w-5" />
//                     ) : (
//                         <EyeOpen className="h-5 w-5" />
//                     )}
//                 </button>
//             </div>

//             {/* Forgot Password Link */}
//             <div className="text-right">
//                 <Link
//                     href="/auth/forgot-password"
//                     className="text-sm text-white hover:underline"
//                 >
//                     Forgot password?
//                 </Link>
//             </div>

//             {/* Login Button */}
//             <Button
//                 type="submit"
//                 className="w-full bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
//                 disabled={isLoading}
//             >
//                 {isLoading ? 'Logging in...' : 'Log In'}
//             </Button>

//             {/* Social Login Buttons */}
//             <div className="mt-6 space-y-4">
//                 <button
//                     type="button"
//                     className="w-full px-4 py-2 flex items-center justify-center bg-white text-black rounded-lg shadow-sm hover:bg-emerald-50 focus:outline-none transition-colors"
//                     aria-label="Log in with Google"
//                     onClick={() => handleSocialLogin('Google')}
//                     disabled={isLoading}
//                 >
//                     <Image
//                         src="/icons/google.png"
//                         alt="Google"
//                         height={20}
//                         width={20}
//                         className="h-5 mr-2"
//                     />
//                     Log in with Google
//                 </button>
//                 <button
//                     type="button"
//                     className="w-full px-4 py-2 flex items-center justify-center bg-emerald-800 text-white rounded-lg shadow-sm hover:bg-emerald-900 focus:outline-none transition-colors"
//                     aria-label="Log in with Facebook"
//                     onClick={() => handleSocialLogin('Facebook')}
//                     disabled={isLoading}
//                 >
//                     <FaFacebook className="mr-2 h-5 w-5" />
//                     Log in with Facebook
//                 </button>
//                 <button
//                     type="button"
//                     className="w-full px-4 py-2 flex items-center justify-center bg-emerald-700 text-white rounded-lg shadow-sm hover:bg-emerald-800 focus:outline-none transition-colors"
//                     aria-label="Log in with LinkedIn"
//                     onClick={() => handleSocialLogin('LinkedIn')}
//                     disabled={isLoading}
//                 >
//                     <FaLinkedin className="mr-2 h-5 w-5" />
//                     Log in with LinkedIn
//                 </button>
//             </div>

//             {/* Don't have an account */}
//             <div className="mt-6 text-center text-sm text-white">
//                 <p>
//                     Don't have an account?{" "}
//                     <Link
//                         href="/auth/signup"
//                         className="text-teal-500 hover:underline"
//                     >
//                         Sign up
//                     </Link>
//                 </p>
//             </div>

//             {/* Privacy Policy and Terms */}
//             <div className="mt-4 text-center text-sm text-white">
//                 <p>
//                     By signing in, you agree to our{" "}
//                     <Link
//                         href="/privacy-policy"
//                         className="text-emerald-400 hover:underline"
//                     >
//                         Privacy Policy
//                     </Link>{" "}
//                     and{" "}
//                     <Link
//                         href="/terms-of-service"
//                         className="text-emerald-400 hover:underline"
//                     >
//                         Terms of Service
//                     </Link>
//                 </p>
//             </div>
//         </form>
//     );
// };

// export default Login;







































































// 'use client';

// import React, { useState, useEffect, Suspense } from "react";
// import Link from "next/link";
// import Image from 'next/image';
// import { useRouter, useSearchParams } from "next/navigation";
// import Cookies from 'js-cookie';
// import {
//     Facebook as FaFacebook,
//     Linkedin as FaLinkedin,
//     Eye as EyeOpen,
//     EyeOff as EyeClosed
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import InputField from "@/components/auth/InputField";
// import AuthLayout from "@/components/auth/AuthLayout";

// // Main component that uses Suspense
// const Login: React.FC = () => {
//     return (
//         <AuthLayout>
//             <Suspense fallback={
//                 <div className="w-full max-w-md mx-auto text-white text-center p-6">
//                     <div className="animate-pulse">Loading...</div>
//                 </div>
//             }>
//                 <LoginForm />
//             </Suspense>
//         </AuthLayout>
//     );
// };

// // Define the component that uses useSearchParams
// const LoginForm: React.FC = () => {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");
//     const [successMessage, setSuccessMessage] = useState("");
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const [showPassword, setShowPassword] = useState(false);

//     // Function to decode JWT and check expiration
//     const isTokenExpired = (token: string): boolean => {
//         try {
//             const base64Url = token.split('.')[1];
//             const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//             const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
//                 return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//             }).join(''));

//             const { exp } = JSON.parse(jsonPayload);
            
//             // Get current time in seconds
//             const currentTime = Math.floor(Date.now() / 1000);
            
//             // Return true if token is expired
//             return exp < currentTime;
//         } catch (error) {
//             console.error('Error decoding token:', error);
//             return true; // Assume expired if there's an error
//         }
//     };

//     // Function to refresh the access token
//     const refreshAccessToken = async (): Promise<boolean> => {
//         try {
//             const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/refresh-token', {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 credentials: 'include', // This ensures cookies are sent with the request
//                 cache: 'no-store'
//             });
            
//             if (!response.ok) {
//                 throw new Error('Failed to refresh token');
//             }
            
//             return true;
//         } catch (error) {
//             console.error('Error refreshing token:', error);
//             return false;
//         }
//     };

//     // Function to check authentication status
//     const checkAuthStatus = async (): Promise<boolean> => {
//         try {
//             const accessToken = Cookies.get('__frsadfrusrtkn');
            
//             if (!accessToken) {
//                 return false;
//             }
            
//             // Check if token is expired
//             if (isTokenExpired(accessToken)) {
//                 // Try to refresh the token
//                 const refreshSuccess = await refreshAccessToken();
//                 return refreshSuccess;
//             }
            
//             return true;
//         } catch (error) {
//             console.error('Auth check error:', error);
//             return false;
//         }
//     };

//     useEffect(() => {
//         // Check if user just verified email
//         const verified = searchParams?.get('verified');
//         if (verified === 'true') {
//             setSuccessMessage("Email verified successfully! Please log in.");
            
//             // Prefill email if available in cookies
//             const storedEmail = Cookies.get('userEmail');
//             if (storedEmail) {
//                 setEmail(storedEmail);
//             }
//         }
        
//         // Check if user is already logged in
//         const checkLoginStatus = async () => {
//             const isLoggedIn = await checkAuthStatus();
//             if (isLoggedIn) {
//                 router.push('/dashboard');
//             }
//         };
        
//         checkLoginStatus();
//     }, [searchParams, router]);

//     const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setEmail(e.target.value);

//     const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setPassword(e.target.value);

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
    
//         if (!email || !password) {
//             setError("Please enter both email and password");
//             return;
//         }
    
//         setIsLoading(true);
//         setError("");
//         setSuccessMessage("");
    
//         try {
//             // Login request
//             const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/login', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ email, password }),
//                 credentials: 'include', // Include cookies in request
//                 cache: 'no-store'
//             });
    
//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Login failed');
//             }
    
//             const data = await response.json();
            
//             // Handle tokens from meta object in response body
//             if (data.meta && data.meta.access_token) {
//                 Cookies.set('__frsadfrusrtkn', data.meta.access_token, { 
//                     secure: true,
//                     sameSite: 'strict',
//                     path: '/'
//                 });
                
//                 // Also set it in the standardized cookie name for our utility functions
//                 Cookies.set('accessToken', data.meta.access_token, { 
//                     secure: true,
//                     sameSite: 'strict',
//                     path: '/'
//                 });
//             }
            
//             // For the refresh token, the server will set it as HttpOnly
//             // but we'll also store it for our local usage
//             if (data.meta && data.meta.refresh_token) {
//                 Cookies.set('__rfrsadfrusrtkn', data.meta.refresh_token, { 
//                     secure: true,
//                     sameSite: 'strict',
//                     path: '/'
//                 });
//             }
            
//             // Store user information
//             if (data.data) {
//                 const { id, first_name, last_name } = data.data;
                
//                 // Store email
//                 Cookies.set('userEmail', email, { 
//                     expires: 30,
//                     path: '/',
//                     sameSite: 'lax'
//                 });
                
//                 // Store user ID if available
//                 if (id) {
//                     Cookies.set('userId', id, { 
//                         expires: 30,
//                         path: '/',
//                         sameSite: 'lax'
//                     });
//                 }
                
//                 // Store user name if available
//                 if (first_name && last_name) {
//                     const combinedName = `${first_name}.${last_name}`;
//                     Cookies.set('userName', combinedName, { 
//                         expires: 30,
//                         path: '/',
//                         sameSite: 'lax'
//                     });
//                 }
//             }
            
//             // Redirect to dashboard
//             router.push('/dashboard');
            
//         } catch (err: any) {
//             const errorMessage = err.message || 'Login failed';
//             setError(errorMessage);
//             console.error('Login error:', err);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleSocialLogin = (provider: string) => {
//         // Implement social login logic here or call an API endpoint
//         setIsLoading(true);
//         console.log(`Logging in with ${provider}...`);
        
//         // For now, just show an error message
//         setError(`${provider} login is not implemented yet`);
//         setIsLoading(false);
//     };

//     return (
//         <form className="space-y-6" onSubmit={handleSubmit}>
//             <div className="text-center mb-6">
//                 <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
//                 <p className="text-emerald-500 mt-2">
//                     Sign in to access your account
//                 </p>
//             </div>

//             {/* Success Message */}
//             {successMessage && (
//                 <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 px-4 py-3 rounded relative" role="alert">
//                     {successMessage}
//                 </div>
//             )}

//             {/* Error Message */}
//             {error && (
//                 <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
//                     {error}
//                 </div>
//             )}

//             {/* Email Input */}
//             <InputField
//                 type="email"
//                 placeholder="Enter your email"
//                 value={email}
//                 onChange={handleEmailChange}
//                 required
//                 aria-label="Email"
//             />

//             {/* Password Input */}
//             <div className="relative">
//                 <InputField
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Enter your password"
//                     value={password}
//                     onChange={handlePasswordChange}
//                     required
//                     aria-label="Password"
//                 />
//                 <button 
//                     type="button"
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                     onClick={() => setShowPassword(!showPassword)}
//                     aria-label={showPassword ? "Hide password" : "Show password"}
//                 >
//                     {showPassword ? (
//                         <EyeClosed className="h-5 w-5" />
//                     ) : (
//                         <EyeOpen className="h-5 w-5" />
//                     )}
//                 </button>
//             </div>

//             {/* Forgot Password Link */}
//             <div className="text-right">
//                 <Link
//                     href="/auth/forgot-password"
//                     className="text-sm text-white hover:underline"
//                 >
//                     Forgot password?
//                 </Link>
//             </div>

//             {/* Login Button */}
//             <Button
//                 type="submit"
//                 className="w-full bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
//                 disabled={isLoading}
//             >
//                 {isLoading ? 'Logging in...' : 'Log In'}
//             </Button>

//             {/* Social Login Buttons */}
//             <div className="mt-6 space-y-4">
//                 <button
//                     type="button"
//                     className="w-full px-4 py-2 flex items-center justify-center bg-white text-black rounded-lg shadow-sm hover:bg-emerald-50 focus:outline-none transition-colors"
//                     aria-label="Log in with Google"
//                     onClick={() => handleSocialLogin('Google')}
//                     disabled={isLoading}
//                 >
//                     <Image
//                         src="/icons/google.png"
//                         alt="Google"
//                         height={20}
//                         width={20}
//                         className="h-5 mr-2"
//                     />
//                     Log in with Google
//                 </button>
//                 <button
//                     type="button"
//                     className="w-full px-4 py-2 flex items-center justify-center bg-emerald-800 text-white rounded-lg shadow-sm hover:bg-emerald-900 focus:outline-none transition-colors"
//                     aria-label="Log in with Facebook"
//                     onClick={() => handleSocialLogin('Facebook')}
//                     disabled={isLoading}
//                 >
//                     <FaFacebook className="mr-2 h-5 w-5" />
//                     Log in with Facebook
//                 </button>
//                 <button
//                     type="button"
//                     className="w-full px-4 py-2 flex items-center justify-center bg-emerald-700 text-white rounded-lg shadow-sm hover:bg-emerald-800 focus:outline-none transition-colors"
//                     aria-label="Log in with LinkedIn"
//                     onClick={() => handleSocialLogin('LinkedIn')}
//                     disabled={isLoading}
//                 >
//                     <FaLinkedin className="mr-2 h-5 w-5" />
//                     Log in with LinkedIn
//                 </button>
//             </div>

//             {/* Don't have an account */}
//             <div className="mt-6 text-center text-sm text-white">
//                 <p>
//                     Don't have an account?{" "}
//                     <Link
//                         href="/auth/signup"
//                         className="text-teal-500 hover:underline"
//                     >
//                         Sign up
//                     </Link>
//                 </p>
//             </div>

//             {/* Privacy Policy and Terms */}
//             <div className="mt-4 text-center text-sm text-white">
//                 <p>
//                     By signing in, you agree to our{" "}
//                     <Link
//                         href="/privacy-policy"
//                         className="text-emerald-400 hover:underline"
//                     >
//                         Privacy Policy
//                     </Link>{" "}
//                     and{" "}
//                     <Link
//                         href="/terms-of-service"
//                         className="text-emerald-400 hover:underline"
//                     >
//                         Terms of Service
//                     </Link>
//                 </p>
//             </div>
//         </form>
//     );
// };

// export default Login;


































// 'use client';

// import React, { useState, useEffect, Suspense } from "react";
// import Link from "next/link";
// import Image from 'next/image';
// import { useRouter, useSearchParams } from "next/navigation";
// import Cookies from 'js-cookie';
// import {
//     Facebook as FaFacebook,
//     Linkedin as FaLinkedin,
//     Eye as EyeOpen,
//     EyeOff as EyeClosed
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import InputField from "@/components/auth/InputField";
// import AuthLayout from "@/components/auth/AuthLayout";

// // Function to decode JWT and check expiration
// const isTokenExpired = (token: string): boolean => {
//     try {
//         const base64Url = token.split('.')[1];
//         const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//         const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
//             return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//         }).join(''));

//         const { exp } = JSON.parse(jsonPayload);
        
//         // Get current time in seconds
//         const currentTime = Math.floor(Date.now() / 1000);
        
//         // Return true if token is expired
//         return exp < currentTime;
//     } catch (error) {
//         console.error('Error decoding token:', error);
//         return true; // Assume expired if there's an error
//     }
// };

// // Function to refresh the access token
// const refreshAccessToken = async (): Promise<boolean> => {
//     try {
//         // For refresh token endpoint, we don't need to send anything in the body
//         // The server will use HttpOnly cookies that are automatically included
//         const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/refresh-token', {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             credentials: 'include', // This ensures cookies are sent with the request
//             cache: 'no-store'
//         });
        
//         if (!response.ok) {
//             throw new Error('Failed to refresh token');
//         }
        
//         // The tokens are now set as HttpOnly cookies by the server
//         // We don't need to manually set cookies from the response
//         return true;
//     } catch (error) {
//         console.error('Error refreshing token:', error);
//         return false;
//     }
// };

// // Function to check authentication status
// export const checkAuthStatus = async (): Promise<boolean> => {
//     try {
//         const accessToken = Cookies.get('__frsadfrusrtkn');
        
//         if (!accessToken) {
//             return false;
//         }
        
//         // Check if token is expired
//         if (isTokenExpired(accessToken)) {
//             // Try to refresh the token
//             const refreshSuccess = await refreshAccessToken();
//             return refreshSuccess;
//         }
        
//         return true;
//     } catch (error) {
//         console.error('Auth check error:', error);
//         return false;
//     }
// };

// // Define the component that uses useSearchParams
// const LoginForm: React.FC = () => {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");
//     const [successMessage, setSuccessMessage] = useState("");
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const [showPassword, setShowPassword] = useState(false);

//     useEffect(() => {
//         // Check if user just verified email
//         const verified = searchParams?.get('verified');
//         if (verified === 'true') {
//             setSuccessMessage("Email verified successfully! Please log in.");
            
//             // Prefill email if available in cookies
//             const storedEmail = Cookies.get('userEmail');
//             if (storedEmail) {
//                 setEmail(storedEmail);
//             }
//         }
        
//         // Check if user is already logged in
//         const checkLoginStatus = async () => {
//             const isLoggedIn = await checkAuthStatus();
//             if (isLoggedIn) {
//                 router.push('/dashboard');
//             }
//         };
        
//         checkLoginStatus();
//     }, [searchParams, router]);

//     const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setEmail(e.target.value);

//     const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setPassword(e.target.value);

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
    
//         if (!email || !password) {
//             setError("Please enter both email and password");
//             return;
//         }
    
//         setIsLoading(true);
//         setError("");
//         setSuccessMessage("");
    
//         try {
//             // Login request
//             const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/login', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ email, password }),
//                 credentials: 'include', // Include cookies in request
//                 cache: 'no-store'
//             });
    
//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Login failed');
//             }
    
//             const data = await response.json();
//             console.log('Login response:', data);
            
//             // Handle tokens from meta object in response body
//             if (data.meta && data.meta.access_token) {
//                 Cookies.set('__frsadfrusrtkn', data.meta.access_token, { 
//                     secure: true,
//                     sameSite: 'strict',
//                     path: '/'
//                 });
                
//                 // Also set it in the standardized cookie name for our utility functions
//                 Cookies.set('accessToken', data.meta.access_token, { 
//                     secure: true,
//                     sameSite: 'strict',
//                     path: '/'
//                 });
//             }
            
//             // For the refresh token, the server will set it as HttpOnly
//             // but we'll also store it for our local usage
//             if (data.meta && data.meta.refresh_token) {
//                 Cookies.set('__rfrsadfrusrtkn', data.meta.refresh_token, { 
//                     secure: true,
//                     sameSite: 'strict',
//                     path: '/'
//                 });
//             }
            
//             // Store user information
//             Cookies.set('userEmail', email, { 
//                 expires: 30,
//                 path: '/',
//                 sameSite: 'lax'
//             });
            
//             // Store the user ID
//             if (data.data && data.data.id) {
//                 Cookies.set('userId', data.data.id, { 
//                     expires: 30,
//                     path: '/',
//                     sameSite: 'lax'
//                 });
//             }
            
//             // Store first name and last name as userName
//             if (data.data && data.data.first_name && data.data.last_name) {
//                 const firstName = data.data.first_name;
//                 const lastName = data.data.last_name;
//                 const combinedName = `${firstName}.${lastName}`;
                
//                 Cookies.set('userName', combinedName, { 
//                     expires: 30,
//                     path: '/',
//                     sameSite: 'lax'
//                 });
//             }
            
//             // Redirect to dashboard
//             router.push('/dashboard');
            
//         } catch (err: any) {
//             const errorMessage = err.message || 'Login failed';
//             setError(errorMessage);
//             console.error('Login error:', err);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <form className="space-y-6" onSubmit={handleSubmit}>
//             <div className="text-center mb-6">
//                 <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
//                 <p className="text-emerald-500 mt-2">
//                     Sign in to access your account
//                 </p>
//             </div>

//             {/* Success Message */}
//             {successMessage && (
//                 <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 px-4 py-3 rounded relative" role="alert">
//                     {successMessage}
//                 </div>
//             )}

//             {/* Error Message */}
//             {error && (
//                 <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
//                     {error}
//                 </div>
//             )}

//             {/* Email Input */}
//             <InputField
//                 type="email"
//                 placeholder="Enter your email"
//                 value={email}
//                 onChange={handleEmailChange}
//             />

//             {/* Password Input */}
//             <div className="relative">
//                 <InputField
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Enter your password"
//                     value={password}
//                     onChange={handlePasswordChange}
//                 />
//                 <button 
//                     type="button"
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                     onClick={() => setShowPassword(!showPassword)}
//                     aria-label={showPassword ? "Hide password" : "Show password"}
//                 >
//                     {showPassword ? (
//                         <EyeClosed className="h-5 w-5" />
//                     ) : (
//                         <EyeOpen className="h-5 w-5" />
//                     )}
//                 </button>
//             </div>

//             {/* Forgot Password Link */}
//             <div className="text-right">
//                 <Link
//                     href="/auth/forgot-password"
//                     className="text-sm text-white hover:underline"
//                 >
//                     Forgot password?
//                 </Link>
//             </div>

//             {/* Login Button */}
//             <Button
//                 type="submit"
//                 className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
//                 disabled={isLoading}
//             >
//                 {isLoading ? 'Logging in...' : 'Log In'}
//             </Button>

//             {/* Social Login Buttons */}
//             <div className="mt-6 space-y-4">
//                 <button
//                     type="button"
//                     className="w-full px-4 py-2 flex items-center justify-center bg-white text-black rounded-lg shadow-sm hover:bg-emerald-50 focus:outline-none"
//                     aria-label="Log in with Google"
//                 >
//                     <Image
//                         src="/icons/google.png"
//                         alt="Google"
//                         height={20}
//                         width={20}
//                         className="h-5 mr-2"
//                     />
//                     Log in with Google
//                 </button>
//                 <button
//                     type="button"
//                     className="w-full px-4 py-2 flex items-center justify-center bg-emerald-800 text-white rounded-lg shadow-sm hover:bg-emerald-900 focus:outline-none"
//                     aria-label="Log in with Facebook"
//                 >
//                     <FaFacebook className="mr-2 h-5 w-5" />
//                     Log in with Facebook
//                 </button>
//                 <button
//                     type="button"
//                     className="w-full px-4 py-2 flex items-center justify-center bg-emerald-700 text-white rounded-lg shadow-sm hover:bg-emerald-800 focus:outline-none"
//                     aria-label="Log in with LinkedIn"
//                 >
//                     <FaLinkedin className="mr-2 h-5 w-5" />
//                     Log in with LinkedIn
//                 </button>
//             </div>

//             {/* Don't have an account */}
//             <div className="mt-6 text-center text-sm text-white">
//                 <p>
//                     Don't have an account?{" "}
//                     <Link
//                         href="/auth/signup"
//                         className="text-teal-500 hover:underline"
//                     >
//                         Sign up
//                     </Link>
//                 </p>
//             </div>

//             {/* Privacy Policy and Terms */}
//             <div className="mt-4 text-center text-sm text-white">
//                 <p>
//                     By signing in, you agree to our{" "}
//                     <Link
//                         href="/privacy-policy"
//                         className="text-emerald-400 hover:underline"
//                     >
//                         Privacy Policy
//                     </Link>{" "}
//                     and{" "}
//                     <Link
//                         href="/terms-of-service"
//                         className="text-emerald-400 hover:underline"
//                     >
//                         Terms of Service
//                     </Link>
//                 </p>
//             </div>
//         </form>
//     );
// };

// // Main component that uses Suspense
// const Login: React.FC = () => {
//     return (
//         <AuthLayout>
//             <Suspense fallback={
//                 <div className="w-full max-w-md mx-auto text-white text-center p-6">
//                     <div className="animate-pulse">Loading...</div>
//                 </div>
//             }>
//                 <LoginForm />
//             </Suspense>
//         </AuthLayout>
//     );
// };

// export default Login;







































