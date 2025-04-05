'use client';

import React, { useState, useEffect, Suspense } from "react";
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
    }, [searchParams]);

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
                credentials: 'include',
                cache: 'no-store'
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }
    
            const data = await response.json();
            console.log('Login response:', data);
            
            // Handle tokens from meta object
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
            
            if (data.meta && data.meta.refresh_token) {
                Cookies.set('__rfrsadfrusrtkn', data.meta.refresh_token, { 
                    secure: true,
                    sameSite: 'strict',
                    path: '/'
                });
            }
            
            // Store user information
            Cookies.set('userEmail', email, { 
                expires: 30,
                path: '/',
                sameSite: 'lax'
            });
            
            // Store the user ID
            if (data.data && data.data.id) {
                Cookies.set('userId', data.data.id, { 
                    expires: 30,
                    path: '/',
                    sameSite: 'lax'
                });
            }
            
            // Store first name and last name as userName
            if (data.data && data.data.first_name && data.data.last_name) {
                const firstName = data.data.first_name;
                const lastName = data.data.last_name;
                const combinedName = `${firstName}.${lastName}`;
                
                Cookies.set('userName', combinedName, { 
                    expires: 30,
                    path: '/',
                    sameSite: 'lax'
                });
            }
            
            // Redirect to dashboard
            router.push('/dashboard');
            
        } catch (err: any) {
            const errorMessage = err.message || 'Login failed';
            setError(errorMessage);
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
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
            />

            {/* Password Input */}
            <div className="relative">
                <InputField
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
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
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isLoading}
            >
                {isLoading ? 'Logging in...' : 'Log In'}
            </Button>

            {/* Social Login Buttons */}
            <div className="mt-6 space-y-4">
                <button
                    type="button"
                    className="w-full px-4 py-2 flex items-center justify-center bg-white text-black rounded-lg shadow-sm hover:bg-emerald-50 focus:outline-none"
                    aria-label="Log in with Google"
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
                    className="w-full px-4 py-2 flex items-center justify-center bg-emerald-800 text-white rounded-lg shadow-sm hover:bg-emerald-900 focus:outline-none"
                    aria-label="Log in with Facebook"
                >
                    <FaFacebook className="mr-2 h-5 w-5" />
                    Log in with Facebook
                </button>
                <button
                    type="button"
                    className="w-full px-4 py-2 flex items-center justify-center bg-emerald-700 text-white rounded-lg shadow-sm hover:bg-emerald-800 focus:outline-none"
                    aria-label="Log in with LinkedIn"
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

// Main component that uses Suspense
const Login: React.FC = () => {
    return (
        <AuthLayout>
            <Suspense fallback={
                <div className="w-full max-w-md mx-auto text-white text-center p-6">
                    <div className="animate-pulse">Loading...</div>
                </div>
            }>
                <LoginForm />
            </Suspense>
        </AuthLayout>
    );
};

export default Login;



































// 'use client';

// import { useState, useEffect, Suspense } from "react";
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

// // Define constants for auth state
// // const AUTH_STATE_COOKIE = 'auth_state';

// export default function Login() {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");
//     const [successMessage, setSuccessMessage] = useState("");
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const [showPassword, setShowPassword] = useState(false);

//     // useEffect(() => {
//     //     // Check if user just verified email
//     //     const verified = searchParams.get('verified');
//     //     if (verified === 'true') {
//     //         setSuccessMessage("Email verified successfully! Please log in.");
            
//     //         // Prefill email if available in cookies
//     //         const storedEmail = Cookies.get('userEmail');
//     //         if (storedEmail) {
//     //             setEmail(storedEmail);
//     //         }
//     //     }

//     //     // Check if user is already authenticated
//     //     const authState = Cookies.get(AUTH_STATE_COOKIE);
//     //     if (authState === 'authenticated') {
//     //         router.push('/dashboard');
//     //     }
//     // }, [searchParams, router]);

//     const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setEmail(e.target.value);

//     const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setPassword(e.target.value);

//     // Update your handleSubmit function in login.tsx:

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
//                 credentials: 'include',
//                 cache: 'no-store'
//             });
    
//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Login failed');
//             }
    
//             const data = await response.json();
//             console.log('Login response:', data);
            
//             // Handle tokens from meta object
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
//         <AuthLayout>
//             <form className="space-y-6" onSubmit={handleSubmit}>
                
//                 <div className="text-center mb-6">
//                     <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
//                     <p className="text-emerald-500 mt-2">
//                         Sign in to access your account
//                     </p>
//                 </div>

//                 {/* Success Message */}
//                 {successMessage && (
//                     <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 px-4 py-3 rounded relative" role="alert">
//                         {successMessage}
//                     </div>
//                 )}

//                 {/* Error Message */}
//                 {error && (
//                     <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
//                         {error}
//                     </div>
//                 )}

//                 {/* Email Input */}
//                 <InputField
//                     type="email"
//                     placeholder="Enter your email"
//                     value={email}
//                     onChange={handleEmailChange}
//                 />

//                 {/* Password Input */}
//                 <div className="relative">
//                     <InputField
//                         type={showPassword ? "text" : "password"}
//                         placeholder="Enter your password"
//                         value={password}
//                         onChange={handlePasswordChange}
//                     />
//                     <button 
//                         type="button"
//                         className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                         onClick={() => setShowPassword(!showPassword)}
//                         aria-label={showPassword ? "Hide password" : "Show password"}
//                     >
//                         {showPassword ? (
//                             <EyeClosed className="h-5 w-5" />
//                         ) : (
//                             <EyeOpen className="h-5 w-5" />
//                         )}
//                     </button>
//                 </div>

//                 {/* Forgot Password Link */}
//                 <div className="text-right">
//                     <Link
//                         href="/auth/forgot-password"
//                         className="text-sm text-white hover:underline"
//                     >
//                         Forgot password?
//                     </Link>
//                 </div>

//                 {/* Login Button */}
//                 <Button
//                     type="submit"
//                     className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
//                     disabled={isLoading}
//                 >
//                     {isLoading ? 'Logging in...' : 'Log In'}
//                 </Button>

//                 {/* Social Login Buttons */}
//                 <div className="mt-6 space-y-4">
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-white text-black rounded-lg shadow-sm hover:bg-emerald-50 focus:outline-none"
//                         aria-label="Log in with Google"
//                     >
//                         <Image
//                             src="/icons/google.png"
//                             alt="Google"
//                             height={20}
//                             width={20}
//                             className="h-5 mr-2"
//                         />
//                         Log in with Google
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-emerald-800 text-white rounded-lg shadow-sm hover:bg-emerald-900 focus:outline-none"
//                         aria-label="Log in with Facebook"
//                     >
//                         <FaFacebook className="mr-2 h-5 w-5" />
//                         Log in with Facebook
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-emerald-700 text-white rounded-lg shadow-sm hover:bg-emerald-800 focus:outline-none"
//                         aria-label="Log in with LinkedIn"
//                     >
//                         <FaLinkedin className="mr-2 h-5 w-5" />
//                         Log in with LinkedIn
//                     </button>
//                 </div>

//                 {/* Don't have an account */}
//                 <div className="mt-6 text-center text-sm text-white">
//                     <p>
//                         Don't have an account?{" "}
//                         <Link
//                             href="/auth/signup"
//                             className="text-teal-500 hover:underline"
//                         >
//                             Sign up
//                         </Link>
//                     </p>
//                 </div>

//                 {/* Privacy Policy and Terms */}
//                 <div className="mt-4 text-center text-sm text-white">
//                     <p>
//                         By signing in, you agree to our{" "}
//                         <Link
//                             href="/privacy-policy"
//                             className="text-emerald-400 hover:underline"
//                         >
//                             Privacy Policy
//                         </Link>{" "}
//                         and{" "}
//                         <Link
//                             href="/terms-of-service"
//                             className="text-emerald-400 hover:underline"
//                         >
//                             Terms of Service
//                         </Link>
//                     </p>
//                 </div>
//             </form>
//         </AuthLayout>
//     );
// }

























// const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!email || !password) {
//         setError("Please enter both email and password");
//         return;
//     }

//     setIsLoading(true);
//     setError("");
//     setSuccessMessage("");

//     try {
//         // Login request
//         const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/login', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ email, password }),
//             credentials: 'include', // Important: includes cookies in the request/response
//             cache: 'no-store' // Ensure we're not using cached responses
//         });

//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.message || 'Login failed');
//         }

//         const data = await response.json();
//         console.log('Login response:', data);
        
//         // Check if we have tokens in the response data that need to be manually stored
//         // Check for tokens in both the main response and the meta object
//         if (data.accessToken) {
//             Cookies.set('__frsadfrusrtkn', data.accessToken, { 
//                 secure: true,
//                 sameSite: 'strict',
//                 path: '/'
//             });
//         }
        
//         if (data.refreshToken) {
//             Cookies.set('__rfrsadfrusrtkn', data.refreshToken, { 
//                 secure: true,
//                 sameSite: 'strict',
//                 path: '/'
//             });
//         }
        
//         // Handle tokens in the meta object
//         if (data.meta && data.meta.access_token) {
//             Cookies.set('__frsadfrusrtkn', data.meta.access_token, { 
//                 secure: true,
//                 sameSite: 'strict',
//                 path: '/'
//             });
//         }
        
//         if (data.meta && data.meta.refresh_token) {
//             Cookies.set('__rfrsadfrusrtkn', data.meta.refresh_token, { 
//                 secure: true,
//                 sameSite: 'strict',
//                 path: '/'
//             });
//         }
        
//         // Store user information
//         Cookies.set('userEmail', email, { 
//             expires: 30,
//             path: '/',
//             sameSite: 'lax'
//         });
        
//         // Store the user ID
//         if (data.data && data.data.id) {
//             Cookies.set('userId', data.data.id, { 
//                 expires: 30,
//                 path: '/',
//                 sameSite: 'lax'
//             });
//         }
        
//         // Set our client-side auth state cookie
//         Cookies.set(AUTH_STATE_COOKIE, 'authenticated', { 
//             expires: 1, // 1 day expiration
//             path: '/',
//             sameSite: 'lax'
//         });
        
//         // Redirect to dashboard
//         router.push('/dashboard');
        
//     } catch (err: any) {
//         const errorMessage = err.message || 'Login failed';
//         setError(errorMessage);
//         console.error('Login error:', err);
//     } finally {
//         setIsLoading(false);
//     }
// };














// 'use client';

// import { useState, useEffect } from "react";
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

// // Define constants for cookie names as they come from the backend
// const ACCESS_TOKEN_COOKIE = '__frsadfrusrtkn';
// const REFRESH_TOKEN_COOKIE = '__rfrsadfrusrtkn';

// export default function Login() {
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
//         const verified = searchParams.get('verified');
//         if (verified === 'true') {
//             setSuccessMessage("Email verified successfully! Please log in.");
            
//             // Prefill email if available in cookies
//             const storedEmail = Cookies.get('userEmail');
//             if (storedEmail) {
//                 setEmail(storedEmail);
//             }
//         }

//         // Check if user is already logged in via cookies
//         const checkAuth = () => {
//             const accessToken = Cookies.get(ACCESS_TOKEN_COOKIE);
//             const refreshToken = Cookies.get(REFRESH_TOKEN_COOKIE);
            
//             if (accessToken && refreshToken) {
//                 router.push('/dashboard');
//             }
//         };
        
//         checkAuth();
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
//             // Using fetch API instead of axios
//             const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/login', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ email, password }),
//                 credentials: 'include' // This is equivalent to withCredentials in axios
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Login failed');
//             }

//             const data = await response.json();
//             console.log('Login response:', data);
            
//             // Give the browser a moment to process and save the cookies
//             setTimeout(() => {
//                 // Check if cookies are set
//                 const accessToken = Cookies.get(ACCESS_TOKEN_COOKIE);
//                 const refreshToken = Cookies.get(REFRESH_TOKEN_COOKIE);
                
//                 console.log('Access token present:', !!accessToken);
//                 console.log('Refresh token present:', !!refreshToken);
                
//                 if (accessToken && refreshToken) {
//                     // Store additional user information
//                     Cookies.set('userEmail', email, { 
//                         expires: 30,
//                         path: '/',
//                         secure: true,
//                         sameSite: 'strict'
//                     });
                    
//                     // Extract name from email or use provided name
//                     const nameFromEmail = email.split('@')[0];
//                     const userName = (data.data && data.data.name) ? data.data.name : nameFromEmail;
//                     Cookies.set('userName', userName, { 
//                         expires: 30,
//                         path: '/',
//                         secure: true,
//                         sameSite: 'strict'
//                     });
                    
//                     // Store user ID if available
//                     if (data.data && data.data.userId) {
//                         Cookies.set('userId', data.data.userId, { 
//                             expires: 30,
//                             path: '/',
//                             secure: true,
//                             sameSite: 'strict'
//                         });
//                     }
                    
//                     // Navigate to dashboard
//                     router.push('/dashboard');
//                 } else {
//                     // If cookies are not set automatically, show an error
//                     console.error('Authentication cookies not found after login');
                    
//                     // As a last resort, check if tokens are in the response data
//                     if (data.meta && (data.meta.accessToken || data.meta.refreshToken)) {
//                         console.log('Tokens found in response body, setting manually');
                        
//                         if (data.meta.accessToken) {
//                             Cookies.set(ACCESS_TOKEN_COOKIE, data.meta.accessToken, {
//                                 expires: 1,
//                                 path: '/',
//                                 secure: true,
//                                 sameSite: 'lax' // Using 'lax' for better compatibility
//                             });
//                         }
                        
//                         if (data.meta.refreshToken) {
//                             Cookies.set(REFRESH_TOKEN_COOKIE, data.meta.refreshToken, {
//                                 expires: 30,
//                                 path: '/',
//                                 secure: true,
//                                 sameSite: 'lax' // Using 'lax' for better compatibility
//                             });
//                         }
                        
//                         router.push('/dashboard');
//                     } else {
//                         setError("Authentication failed. Please try again or contact support.");
//                     }
//                 }
//             }, 300); // Increased delay to ensure cookies are processed
            
//         } catch (err) {
//             const errorMessage = err.message || 'Login failed';
//             setError(errorMessage);
//             console.error('Login error:', err);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <AuthLayout>
//             <form className="space-y-6" onSubmit={handleSubmit}>
                
//                 <div className="text-center mb-6">
//                     <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
//                     <p className="text-emerald-500 mt-2">
//                         Sign in to access your account
//                     </p>
//                 </div>

//                 {/* Success Message */}
//                 {successMessage && (
//                     <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 px-4 py-3 rounded relative" role="alert">
//                         {successMessage}
//                     </div>
//                 )}

//                 {/* Error Message */}
//                 {error && (
//                     <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
//                         {error}
//                     </div>
//                 )}

//                 {/* Email Input */}
//                 <InputField
//                     type="email"
//                     placeholder="Enter your email"
//                     value={email}
//                     onChange={handleEmailChange}
//                 />

//                 {/* Password Input */}
//                 <div className="relative">
//                     <InputField
//                         type={showPassword ? "text" : "password"}
//                         placeholder="Enter your password"
//                         value={password}
//                         onChange={handlePasswordChange}
//                     />
//                     <button 
//                         type="button"
//                         className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                         onClick={() => setShowPassword(!showPassword)}
//                         aria-label={showPassword ? "Hide password" : "Show password"}
//                     >
//                         {showPassword ? (
//                             <EyeClosed className="h-5 w-5" />
//                         ) : (
//                             <EyeOpen className="h-5 w-5" />
//                         )}
//                     </button>
//                 </div>

//                 {/* Forgot Password Link */}
//                 <div className="text-right">
//                     <Link
//                         href="/auth/forgot-password"
//                         className="text-sm text-white hover:underline"
//                     >
//                         Forgot password?
//                     </Link>
//                 </div>

//                 {/* Login Button */}
//                 <Button
//                     type="submit"
//                     className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
//                     disabled={isLoading}
//                 >
//                     {isLoading ? 'Logging in...' : 'Log In'}
//                 </Button>

//                 {/* Social Login Buttons */}
//                 <div className="mt-6 space-y-4">
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-white text-black rounded-lg shadow-sm hover:bg-emerald-50 focus:outline-none"
//                         aria-label="Log in with Google"
//                     >
//                         <Image
//                             src="/icons/google.png"
//                             alt="Google"
//                             height={20}
//                             width={20}
//                             className="h-5 mr-2"
//                         />
//                         Log in with Google
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-emerald-800 text-white rounded-lg shadow-sm hover:bg-emerald-900 focus:outline-none"
//                         aria-label="Log in with Facebook"
//                     >
//                         <FaFacebook className="mr-2 h-5 w-5" />
//                         Log in with Facebook
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-emerald-700 text-white rounded-lg shadow-sm hover:bg-emerald-800 focus:outline-none"
//                         aria-label="Log in with LinkedIn"
//                     >
//                         <FaLinkedin className="mr-2 h-5 w-5" />
//                         Log in with LinkedIn
//                     </button>
//                 </div>

//                 {/* Don't have an account */}
//                 <div className="mt-6 text-center text-sm text-white">
//                     <p>
//                         Don't have an account?{" "}
//                         <Link
//                             href="/auth/signup"
//                             className="text-teal-500 hover:underline"
//                         >
//                             Sign up
//                         </Link>
//                     </p>
//                 </div>

//                 {/* Privacy Policy and Terms */}
//                 <div className="mt-4 text-center text-sm text-white">
//                     <p>
//                         By signing in, you agree to our{" "}
//                         <Link
//                             href="/privacy-policy"
//                             className="text-emerald-400 hover:underline"
//                         >
//                             Privacy Policy
//                         </Link>{" "}
//                         and{" "}
//                         <Link
//                             href="/terms-of-service"
//                             className="text-emerald-400 hover:underline"
//                         >
//                             Terms of Service
//                         </Link>
//                     </p>
//                 </div>
//             </form>
//         </AuthLayout>
//     );
// }



























// 'use client';

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import Image from 'next/image';
// import { useRouter, useSearchParams } from "next/navigation";
// import Cookies from 'js-cookie';
// import axios from 'axios';
// import {
//     Facebook as FaFacebook,
//     Linkedin as FaLinkedin,
//     Eye as EyeOpen,
//     EyeOff as EyeClosed
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import InputField from "@/components/auth/InputField";
// import AuthLayout from "@/components/auth/AuthLayout";

// // Define constants for cookie names as they come from the backend
// const ACCESS_TOKEN_COOKIE = '__frsadfrusrtkn';
// const REFRESH_TOKEN_COOKIE = '__rfrsadfrusrtkn';

// export default function Login() {
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
//         const verified = searchParams.get('verified');
//         if (verified === 'true') {
//             setSuccessMessage("Email verified successfully! Please log in.");
            
//             // Prefill email if available in cookies
//             const storedEmail = Cookies.get('userEmail');
//             if (storedEmail) {
//                 setEmail(storedEmail);
//             }
//         }

//         // Check if user is already logged in
//         const checkAuth = async () => {
//             const accessToken = Cookies.get(ACCESS_TOKEN_COOKIE);
            
//             if (accessToken) {
//                 try {
//                     // Create axios instance with default auth headers
//                     const api = axios.create({
//                         headers: {
//                             'Cookie': `${ACCESS_TOKEN_COOKIE}=${accessToken}`
//                         },
//                         withCredentials: true
//                     });
                    
//                     // Validate token with backend
//                     const response = await api.get(
//                         'https://be-auth-server.onrender.com/api/v1/auth/validate-token'
//                     );
                    
//                     if (response.data.success) {
//                         router.push('/dashboard');
//                     }
//                 } catch (err) {
//                     // Token validation failed, try refresh token
//                     const refreshToken = Cookies.get(REFRESH_TOKEN_COOKIE);
//                     if (refreshToken) {
//                         try {
//                             await refreshAuthToken(refreshToken);
//                             router.push('/dashboard');
//                         } catch (refreshErr) {
//                             // Clear invalid tokens
//                             Cookies.remove(ACCESS_TOKEN_COOKIE);
//                             Cookies.remove(REFRESH_TOKEN_COOKIE);
//                         }
//                     }
//                 }
//             }
//         };
        
//         checkAuth();
//     }, [searchParams, router]);

//     // Function to refresh auth token
//     const refreshAuthToken = async (refreshToken) => {
//         try {
//             const api = axios.create({
//                 headers: {
//                     'Cookie': `${REFRESH_TOKEN_COOKIE}=${refreshToken}`
//                 },
//                 withCredentials: true
//             });
            
//             const response = await api.post(
//                 'https://be-auth-server.onrender.com/api/v1/auth/refresh-token'
//             );
            
//             if (response.data.meta && response.data.meta.accessToken) {
//                 Cookies.set(ACCESS_TOKEN_COOKIE, response.data.meta.accessToken, {
//                     expires: 1, // Access token typically has shorter life
//                     path: '/',
//                     secure: true,
//                     sameSite: 'strict'
//                 });
                
//                 if (response.data.meta.refreshToken) {
//                     Cookies.set(REFRESH_TOKEN_COOKIE, response.data.meta.refreshToken, {
//                         expires: 30, // Refresh token has longer life
//                         path: '/',
//                         secure: true,
//                         sameSite: 'strict'
//                     });
//                 }
                
//                 return true;
//             }
            
//             throw new Error('Failed to refresh token');
//         } catch (error) {
//             console.error('Token refresh error:', error);
//             throw error;
//         }
//     };

//     // Create configured axios instance for authenticated requests
//     const createAuthenticatedApi = () => {
//         const accessToken = Cookies.get(ACCESS_TOKEN_COOKIE);
//         return axios.create({
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Cookie': accessToken ? `${ACCESS_TOKEN_COOKIE}=${accessToken}` : ''
//             },
//             withCredentials: true
//         });
//     };

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
//             // Using axios for login request
//             const response = await axios({
//                 method: 'POST',
//                 url: 'https://be-auth-server.onrender.com/api/v1/auth/login',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 data: JSON.stringify({ email, password }),
//                 withCredentials: true // Important: this tells axios to include cookies
//             });

//             const data = response.data;
//             console.log('Login response:', data);
            
//             // Check for cookies in response headers
//             const cookies = response.headers['set-cookie'];
//             let accessTokenSet = false;
//             let refreshTokenSet = false;
            
//             if (cookies) {
//                 // Parse cookies from headers
//                 for (const cookie of cookies) {
//                     if (cookie.includes(ACCESS_TOKEN_COOKIE)) {
//                         const tokenValue = cookie.split(';')[0].split('=')[1];
//                         Cookies.set(ACCESS_TOKEN_COOKIE, tokenValue, {
//                             expires: 1,
//                             path: '/',
//                             secure: true,
//                             sameSite: 'strict'
//                         });
//                         accessTokenSet = true;
//                     }
                    
//                     if (cookie.includes(REFRESH_TOKEN_COOKIE)) {
//                         const tokenValue = cookie.split(';')[0].split('=')[1];
//                         Cookies.set(REFRESH_TOKEN_COOKIE, tokenValue, {
//                             expires: 30,
//                             path: '/',
//                             secure: true,
//                             sameSite: 'strict'
//                         });
//                         refreshTokenSet = true;
//                     }
//                 }
//             }
            
//             // If cookies weren't in headers, check response body
//             if (!accessTokenSet && data.meta && data.meta.accessToken) {
//                 Cookies.set(ACCESS_TOKEN_COOKIE, data.meta.accessToken, {
//                     expires: 1,
//                     path: '/',
//                     secure: true,
//                     sameSite: 'strict'
//                 });
//                 accessTokenSet = true;
//             }
            
//             if (!refreshTokenSet && data.meta && data.meta.refreshToken) {
//                 Cookies.set(REFRESH_TOKEN_COOKIE, data.meta.refreshToken, {
//                     expires: 30,
//                     path: '/',
//                     secure: true,
//                     sameSite: 'strict'
//                 });
//                 refreshTokenSet = true;
//             }
            
//             // Store user information
//             Cookies.set('userEmail', email, { 
//                 expires: 30,
//                 path: '/',
//                 secure: true,
//                 sameSite: 'strict'
//             });
            
//             // Extract name from email or use provided name
//             const nameFromEmail = email.split('@')[0];
//             const userName = (data.data && data.data.name) ? data.data.name : nameFromEmail;
//             Cookies.set('userName', userName, { 
//                 expires: 30,
//                 path: '/',
//                 secure: true,
//                 sameSite: 'strict'
//             });
            
//             // Store user ID if available
//             if (data.data && data.data.userId) {
//                 Cookies.set('userId', data.data.userId, { 
//                     expires: 30,
//                     path: '/',
//                     secure: true,
//                     sameSite: 'strict'
//                 });
//             }

//             // Verify at least access token is set before redirecting
//             if (accessTokenSet || Cookies.get(ACCESS_TOKEN_COOKIE)) {
//                 router.push('/dashboard');
//             } else {
//                 throw new Error('Authentication token not found. Please try again.');
//             }
            
//         } catch (err) {
//             const errorMessage = err.response?.data?.message || 
//                                 (err instanceof Error ? err.message : 'Login failed');
//             setError(errorMessage);
//             console.error('Login error:', err);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     // Example of making an authenticated request
//     const makeAuthenticatedRequest = async () => {
//         try {
//             const api = createAuthenticatedApi();
//             const response = await api.get('https://be-auth-server.onrender.com/api/v1/protected-route');
//             return response.data;
//         } catch (error) {
//             // If token expired, try to refresh
//             const refreshToken = Cookies.get(REFRESH_TOKEN_COOKIE);
//             if (refreshToken) {
//                 try {
//                     await refreshAuthToken(refreshToken);
//                     // Retry with new token
//                     const api = createAuthenticatedApi();
//                     const response = await api.get('https://be-auth-server.onrender.com/api/v1/protected-route');
//                     return response.data;
//                 } catch (refreshError) {
//                     // Refresh failed, redirect to login
//                     router.push('/auth/login');
//                     throw refreshError;
//                 }
//             } else {
//                 // No refresh token, redirect to login
//                 router.push('/auth/login');
//                 throw error;
//             }
//         }
//     };

//     return (
//         <AuthLayout>
//             <form className="space-y-6" onSubmit={handleSubmit}>
                
//                 <div className="text-center mb-6">
//                     <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
//                     <p className="text-emerald-500 mt-2">
//                         Sign in to access your account
//                     </p>
//                 </div>

//                 {/* Success Message */}
//                 {successMessage && (
//                     <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 px-4 py-3 rounded relative" role="alert">
//                         {successMessage}
//                     </div>
//                 )}

//                 {/* Error Message */}
//                 {error && (
//                     <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
//                         {error}
//                     </div>
//                 )}

//                 {/* Email Input */}
//                 <InputField
//                     type="email"
//                     placeholder="Enter your email"
//                     value={email}
//                     onChange={handleEmailChange}
//                 />

//                 {/* Password Input */}
//                 <div className="relative">
//                     <InputField
//                         type={showPassword ? "text" : "password"}
//                         placeholder="Enter your password"
//                         value={password}
//                         onChange={handlePasswordChange}
//                     />
//                     <button 
//                         type="button"
//                         className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                         onClick={() => setShowPassword(!showPassword)}
//                         aria-label={showPassword ? "Hide password" : "Show password"}
//                     >
//                         {showPassword ? (
//                             <EyeClosed className="h-5 w-5" />
//                         ) : (
//                             <EyeOpen className="h-5 w-5" />
//                         )}
//                     </button>
//                 </div>

//                 {/* Forgot Password Link */}
//                 <div className="text-right">
//                     <Link
//                         href="/auth/forgot-password"
//                         className="text-sm text-white hover:underline"
//                     >
//                         Forgot password?
//                     </Link>
//                 </div>

//                 {/* Login Button */}
//                 <Button
//                     type="submit"
//                     className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
//                     disabled={isLoading}
//                 >
//                     {isLoading ? 'Logging in...' : 'Log In'}
//                 </Button>

//                 {/* Social Login Buttons */}
//                 <div className="mt-6 space-y-4">
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-white text-black rounded-lg shadow-sm hover:bg-emerald-50 focus:outline-none"
//                         aria-label="Log in with Google"
//                     >
//                         <Image
//                             src="/icons/google.png"
//                             alt="Google"
//                             height={20}
//                             width={20}
//                             className="h-5 mr-2"
//                         />
//                         Log in with Google
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-emerald-800 text-white rounded-lg shadow-sm hover:bg-emerald-900 focus:outline-none"
//                         aria-label="Log in with Facebook"
//                     >
//                         <FaFacebook className="mr-2 h-5 w-5" />
//                         Log in with Facebook
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-emerald-700 text-white rounded-lg shadow-sm hover:bg-emerald-800 focus:outline-none"
//                         aria-label="Log in with LinkedIn"
//                     >
//                         <FaLinkedin className="mr-2 h-5 w-5" />
//                         Log in with LinkedIn
//                     </button>
//                 </div>

//                 {/* Don't have an account */}
//                 <div className="mt-6 text-center text-sm text-white">
//                     <p>
//                         Don't have an account?{" "}
//                         <Link
//                             href="/auth/signup"
//                             className="text-teal-500 hover:underline"
//                         >
//                             Sign up
//                         </Link>
//                     </p>
//                 </div>

//                 {/* Privacy Policy and Terms */}
//                 <div className="mt-4 text-center text-sm text-white">
//                     <p>
//                         By signing in, you agree to our{" "}
//                         <Link
//                             href="/privacy-policy"
//                             className="text-emerald-400 hover:underline"
//                         >
//                             Privacy Policy
//                         </Link>{" "}
//                         and{" "}
//                         <Link
//                             href="/terms-of-service"
//                             className="text-emerald-400 hover:underline"
//                         >
//                             Terms of Service
//                         </Link>
//                     </p>
//                 </div>
//             </form>
//         </AuthLayout>
//     );
// }















































// 'use client';

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import Image from 'next/image';
// import { useRouter, useSearchParams } from "next/navigation";
// import Cookies from 'js-cookie';
// import axios from 'axios';
// import {
//     Facebook as FaFacebook,
//     Linkedin as FaLinkedin,
//     Eye as EyeOpen,
//     EyeOff as EyeClosed
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import InputField from "@/components/auth/InputField";
// import AuthLayout from "@/components/auth/AuthLayout";

// export default function Login() {
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
//         const verified = searchParams.get('verified');
//         if (verified === 'true') {
//             setSuccessMessage("Email verified successfully! Please log in.");
            
//             // Prefill email if available in cookies
//             const storedEmail = Cookies.get('userEmail');
//             if (storedEmail) {
//                 setEmail(storedEmail);
//             }
//         }

//         // Check if user is already logged in
//         const checkAuth = () => {
//             const token = Cookies.get('__rfsadfrusrtkn');
//             if (token) {
//                 router.push('/dashboard');
//             }
//         };
        
//         checkAuth();
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
//             // Using axios similar to the Postman example
//             const response = await axios({
//                 method: 'POST',
//                 url: 'https://be-auth-server.onrender.com/api/v1/auth/login',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 data: JSON.stringify({ email, password }),
//                 withCredentials: true // Important: this tells axios to include cookies
//             });

//             const data = response.data;
//             console.log(data)
            
//             // Manual cookie handling if needed
//             if (data.meta && data.meta.accessToken) {
//                 // Set the authentication cookie manually
//                 Cookies.set('__rfsadfrusrtkn', data.meta.accessToken, {
//                     expires: 30, // 30 days
//                     path: '/',
//                     secure: true,
//                     sameSite: 'strict'
//                 });
//             }
            
//             // Store additional user information
//             Cookies.set('userEmail', email, { 
//                 expires: 30,
//                 path: '/',
//                 secure: true,
//                 sameSite: 'strict'
//             });
            
//             // Extract name from email or use provided name
//             const nameFromEmail = email.split('@')[0];
//             const userName = (data.data && data.data.name) ? data.data.name : nameFromEmail;
//             Cookies.set('userName', userName, { 
//                 expires: 30,
//                 path: '/',
//                 secure: true,
//                 sameSite: 'strict'
//             });
            
//             // Store user ID if available
//             if (data.data && data.data.userId) {
//                 Cookies.set('userId', data.data.userId, { 
//                     expires: 30,
//                     path: '/',
//                     secure: true,
//                     sameSite: 'strict'
//                 });
//             }

//             // Verify the cookie is set
//             if (Cookies.get('__rfsadfrusrtkn')) {
//                 // Navigate to dashboard
//                 router.push('/dashboard');
//             } else {
//                 // If the cookie doesn't exist, try to extract and set it from the response headers
//                 const cookies = response.headers['set-cookie'];
//                 if (cookies) {
//                     const authCookie = cookies.find(cookie => cookie.includes('__frsadfrusrtkn'));
//                     if (authCookie) {
//                         const tokenValue = authCookie.split(';')[0].split('=')[1];
//                         Cookies.set('__frsadfrusrtkn', tokenValue, {
//                             expires: 30,
//                             path: '/',
//                             secure: true,
//                             sameSite: 'strict'
//                         });
//                         router.push('/dashboard');
//                     } else {
//                         throw new Error('Authentication token not found in response headers');
//                     }
//                 } else if (data.meta && data.meta.accessToken) {
//                     // If no cookie in headers but token in response body, retry setting cookie
//                     Cookies.set('__frsadfrusrtkn', data.meta.accessToken, {
//                         expires: 30,
//                         path: '/',
//                         secure: true,
//                         sameSite: 'strict'
//                     });
//                     router.push('/dashboard');
//                 } else {
//                     throw new Error('Authentication token not found');
//                 }
//             }
            
//         } catch (err) {
//             const errorMessage = err.response?.data?.message || 
//                                 (err instanceof Error ? err.message : 'Login failed');
//             setError(errorMessage);
//             console.error('Login error:', err);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <AuthLayout>
//             <form className="space-y-6" onSubmit={handleSubmit}>
                
//                 <div className="text-center mb-6">
//                     <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
//                     <p className="text-emerald-500 mt-2">
//                         Sign in to access your account
//                     </p>
//                 </div>

//                 {/* Success Message */}
//                 {successMessage && (
//                     <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 px-4 py-3 rounded relative" role="alert">
//                         {successMessage}
//                     </div>
//                 )}

//                 {/* Error Message */}
//                 {error && (
//                     <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
//                         {error}
//                     </div>
//                 )}

//                 {/* Email Input */}
//                 <InputField
//                     type="email"
//                     placeholder="Enter your email"
//                     value={email}
//                     onChange={handleEmailChange}
//                 />

//                 {/* Password Input */}
//                 <div className="relative">
//     <InputField
//         type={showPassword ? "text" : "password"}
//         placeholder="Enter your password"
//         value={password}
//         onChange={handlePasswordChange}
//     />
//     <button 
//         type="button"
//         className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//         onClick={() => setShowPassword(!showPassword)}
//         aria-label={showPassword ? "Hide password" : "Show password"}
//     >
//         {showPassword ? (
//             <EyeClosed className="h-5 w-5" />
//         ) : (
//             <EyeOpen className="h-5 w-5" />
//         )}
//     </button>
// </div>
//                 {/* Forgot Password Link */}
//                 <div className="text-right">
//                     <Link
//                         href="/auth/forgot-password"
//                         className="text-sm text-white hover:underline"
//                     >
//                         Forgot password?
//                     </Link>
//                 </div>

//                 {/* Login Button */}
//                 <Button
//                     type="submit"
//                     className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
//                     disabled={isLoading}
//                 >
//                     {isLoading ? 'Logging in...' : 'Log In'}
//                 </Button>

//                 {/* Social Login Buttons */}
//                 <div className="mt-6 space-y-4">
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-white text-black rounded-lg shadow-sm hover:bg-emerald-50 focus:outline-none"
//                         aria-label="Log in with Google"
//                     >
//                         <Image
//                             src="/icons/google.png"
//                             alt="Google"
//                             height={20}
//                             width={20}
//                             className="h-5 mr-2"
//                         />
//                         Log in with Google
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-emerald-800 text-white rounded-lg shadow-sm hover:bg-emerald-900 focus:outline-none"
//                         aria-label="Log in with Facebook"
//                     >
//                         <FaFacebook className="mr-2 h-5 w-5" />
//                         Log in with Facebook
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-emerald-700 text-white rounded-lg shadow-sm hover:bg-emerald-800 focus:outline-none"
//                         aria-label="Log in with LinkedIn"
//                     >
//                         <FaLinkedin className="mr-2 h-5 w-5" />
//                         Log in with LinkedIn
//                     </button>
//                 </div>

//                 {/* Don't have an account */}
//                 <div className="mt-6 text-center text-sm text-white">
//                     <p>
//                         Don't have an account?{" "}
//                         <Link
//                             href="/auth/signup"
//                             className="text-teal-500 hover:underline"
//                         >
//                             Sign up
//                         </Link>
//                     </p>
//                 </div>

//                 {/* Privacy Policy and Terms */}
//                 <div className="mt-4 text-center text-sm text-white">
//                     <p>
//                         By signing in, you agree to our{" "}
//                         <Link
//                             href="/privacy-policy"
//                             className="text-emerald-400 hover:underline"
//                         >
//                             Privacy Policy
//                         </Link>{" "}
//                         and{" "}
//                         <Link
//                             href="/terms-of-service"
//                             className="text-emerald-400 hover:underline"
//                         >
//                             Terms of Service
//                         </Link>
//                     </p>
//                 </div>
//             </form>
//         </AuthLayout>
//     );
// }
































// 'use client';

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import Image from 'next/image';
// import { useRouter, useSearchParams } from "next/navigation";
// import Cookies from 'js-cookie';
// import {
//     Facebook as FaFacebook,
//     Linkedin as FaLinkedin
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import InputField from "@/components/auth/InputField";
// import AuthLayout from "@/components/auth/AuthLayout";

// export default function Login() {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");
//     const [successMessage, setSuccessMessage] = useState("");
//     const router = useRouter();
//     const searchParams = useSearchParams();

//     useEffect(() => {
//         // Check if user just verified email
//         const verified = searchParams.get('verified');
//         if (verified === 'true') {
//             setSuccessMessage("Email verified successfully! Please log in.");
            
//             // Prefill email if available in cookies
//             const storedEmail = Cookies.get('userEmail');
//             if (storedEmail) {
//                 setEmail(storedEmail);
//             }
//         }

//         // Check if user is already logged in
//         const checkAuth = () => {
//             const token = Cookies.get('__rfsadfrusrtkn');
//             if (token) {
//                 router.push('/dashboard');
//             }
//         };
        
//         checkAuth();
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
//             const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/login', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ email, password }),
//                 credentials: 'include' // Important: this tells fetch to include cookies
//             });

//             if (!response.ok) {
//                 const errorData = await response.json().catch(() => ({}));
//                 throw new Error(errorData.message || `Login failed with status ${response.status}`);
//             }

//             const data = await response.json();
            
//             // Store user data in cookies
//             // The JWT token is already stored as a cookie by the server (the __rfsadfrusrtkn)
//             // Store additional user information
//             Cookies.set('userEmail', email, { 
//                 expires: 30, // 30 days
//                 path: '/',
//                 secure: true,
//                 sameSite: 'strict'
//             });
            
//             // Extract name from email or use provided name
//             const nameFromEmail = email.split('@')[0];
//             const userName = (data.data && data.data.name) ? data.data.name : nameFromEmail;
//             Cookies.set('userName', userName, { 
//                 expires: 30,
//                 path: '/',
//                 secure: true,
//                 sameSite: 'strict'
//             });
            
//             // Store user ID if available
//             if (data.data && data.data.userId) {
//                 Cookies.set('userId', data.data.userId, { 
//                     expires: 30,
//                     path: '/',
//                     secure: true,
//                     sameSite: 'strict'
//                 });
//             }

//             // Verify the cookie was set
//             const authCookie = document.cookie
//                 .split('; ')
//                 .find(row => row.startsWith('__rfsadfrusrtkn'));
                
//             if (!authCookie) {
//                 // If the cookie was not automatically set by the server,
//                 // manually extract and set the token
//                 if (data.meta && data.meta.accessToken) {
//                     // Set the cookie manually with the same parameters seen in Postman
//                     document.cookie = `__rfsadfrusrtkn=${data.meta.accessToken}; Path=/; Secure; HttpOnly; Max-Age=2592000; SameSite=Strict`;
//                 } else {
//                     throw new Error('Authentication token not found in response');
//                 }
//             }

//             // Navigate to dashboard after a short delay to ensure cookies are set
//             setTimeout(() => {
//                 router.push('/dashboard');
//             }, 100);
            
//         } catch (err) {
//             setError(err instanceof Error ? err.message : 'Login failed');
//             console.error('Login error:', err);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <AuthLayout>
//             <form className="space-y-6" onSubmit={handleSubmit}>
                
//                 <div className="text-center mb-6">
//                     <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
//                     <p className="text-emerald-300 mt-2">
//                         Sign in to access your account
//                     </p>
//                 </div>

//                 {/* Success Message */}
//                 {successMessage && (
//                     <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 px-4 py-3 rounded relative" role="alert">
//                         {successMessage}
//                     </div>
//                 )}

//                 {/* Error Message */}
//                 {error && (
//                     <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
//                         {error}
//                     </div>
//                 )}

//                 {/* Email Input */}
//                 <InputField
//                     type="email"
//                     placeholder="Enter your email"
//                     value={email}
//                     onChange={handleEmailChange}
//                 />

//                 {/* Password Input */}
//                 <InputField
//                     type="password"
//                     placeholder="Enter your password"
//                     value={password}
//                     onChange={handlePasswordChange}
//                 />

//                 {/* Forgot Password Link */}
//                 <div className="text-right">
//                     <Link
//                         href="/auth/forgot-password"
//                         className="text-sm text-emerald-400 hover:underline"
//                     >
//                         Forgot password?
//                     </Link>
//                 </div>

//                 {/* Login Button */}
//                 <Button
//                     type="submit"
//                     className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
//                     disabled={isLoading}
//                 >
//                     {isLoading ? 'Logging in...' : 'Log In'}
//                 </Button>

//                 {/* Social Login Buttons */}
//                 <div className="mt-6 space-y-4">
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-white text-black rounded-lg shadow-sm hover:bg-emerald-50 focus:outline-none"
//                         aria-label="Log in with Google"
//                     >
//                         <Image
//                             src="/icons/google.png"
//                             alt="Google"
//                             height={20}
//                             width={20}
//                             className="h-5 mr-2"
//                         />
//                         Log in with Google
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-emerald-800 text-white rounded-lg shadow-sm hover:bg-emerald-900 focus:outline-none"
//                         aria-label="Log in with Facebook"
//                     >
//                         <FaFacebook className="mr-2 h-5 w-5" />
//                         Log in with Facebook
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-emerald-700 text-white rounded-lg shadow-sm hover:bg-emerald-800 focus:outline-none"
//                         aria-label="Log in with LinkedIn"
//                     >
//                         <FaLinkedin className="mr-2 h-5 w-5" />
//                         Log in with LinkedIn
//                     </button>
//                 </div>

//                 {/* Don't have an account */}
//                 <div className="mt-6 text-center text-sm text-white">
//                     <p>
//                         Don't have an account?{" "}
//                         <Link
//                             href="/auth/signup"
//                             className="text-emerald-400 hover:underline"
//                         >
//                             Sign up
//                         </Link>
//                     </p>
//                 </div>

//                 {/* Privacy Policy and Terms */}
//                 <div className="mt-4 text-center text-sm text-white">
//                     <p>
//                         By signing in, you agree to our{" "}
//                         <Link
//                             href="/privacy-policy"
//                             className="text-emerald-400 hover:underline"
//                         >
//                             Privacy Policy
//                         </Link>{" "}
//                         and{" "}
//                         <Link
//                             href="/terms-of-service"
//                             className="text-emerald-400 hover:underline"
//                         >
//                             Terms of Service
//                         </Link>
//                     </p>
//                 </div>
//             </form>
//         </AuthLayout>
//     );
// }





































// 'use client';

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import Image from 'next/image';
// import { useRouter, useSearchParams } from "next/navigation";
// import Cookies from 'js-cookie';
// import {
//     Facebook as FaFacebook,
//     Linkedin as FaLinkedin
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import InputField from "@/components/auth/InputField";
// import AuthLayout from "@/components/auth/AuthLayout";

// export default function Login() {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");
//     const [successMessage, setSuccessMessage] = useState("");
//     const router = useRouter();
//     const searchParams = useSearchParams();

//     useEffect(() => {
//         // Check if user just verified email
//         const verified = searchParams.get('verified');
//         if (verified === 'true') {
//             setSuccessMessage("Email verified successfully! Please log in.");
            
//             // Prefill email if available in cookies
//             const storedEmail = Cookies.get('userEmail');
//             if (storedEmail) {
//                 setEmail(storedEmail);
//             }
//         }
//     }, [searchParams]);

//     const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setEmail(e.target.value);

//     const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setPassword(e.target.value);

//     // Helper function to set cookies
//     const setCookie = (name: string, value: string, days: number = 7) => {
//         const expires = new Date();
//         expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
//         document.cookie = `${name}=${value}; path=/; expires=${expires.toUTCString()}; samesite=strict`;
//     };

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
//             const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/login', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ email, password })
//             });

//             if (!response.ok) {
//                 const errorData = await response.json().catch(() => ({}));
//                 throw new Error(errorData.message || `Login failed with status ${response.status}`);
//             }

//             const data = await response.json();
            
//             // Store user data in cookies
//             if (data.meta && data.meta.accessToken) {
//                 // Store the access token
//                 setCookie('accessToken', data.meta.accessToken);
                
//                 // Store the email
//                 setCookie('userEmail', email);
                
//                 // Store the user's name if available in the response
//                 if (data.data && data.data.name) {
//                     setCookie('userName', data.data.name);
//                 } else {
//                     // If name is not available in the response, extract it from email or set a default
//                     const nameFromEmail = email.split('@')[0];
//                     setCookie('userName', nameFromEmail);
//                 }

//                 // Optionally store additional user info if needed
//                 if (data.data && data.data.userId) {
//                     setCookie('userId', data.data.userId);
//                 }
//             } else {
//                 // Fallback to original behavior if needed
//                 Cookies.set('accessToken', data.accessToken, { 
//                     expires: 30, // 30 days
//                     path: '/' 
//                 });
//             }

//             // Navigate to dashboard
//             router.push('/dashboard');
//         } catch (err) {
//             setError(err instanceof Error ? err.message : 'Login failed');
//             console.error('Login error:', err);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <AuthLayout>
//             <form className="space-y-6" onSubmit={handleSubmit}>
//                 <div className="text-center mb-6">
//                     <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
//                     <p className="text-emerald-300 mt-2">
//                         Sign in to access your account
//                     </p>
//                 </div>

//                 {/* Success Message */}
//                 {successMessage && (
//                     <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 px-4 py-3 rounded relative" role="alert">
//                         {successMessage}
//                     </div>
//                 )}

//                 {/* Error Message */}
//                 {error && (
//                     <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
//                         {error}
//                     </div>
//                 )}

//                 {/* Email Input */}
//                 <InputField
//                     type="email"
//                     placeholder="Enter your email"
//                     value={email}
//                     onChange={handleEmailChange}
//                 />

//                 {/* Password Input */}
//                 <InputField
//                     type="password"
//                     placeholder="Enter your password"
//                     value={password}
//                     onChange={handlePasswordChange}
//                 />

//                 {/* Forgot Password Link */}
//                 <div className="text-right">
//                     <Link
//                         href="/auth/forgot-password"
//                         className="text-sm text-emerald-400 hover:underline"
//                     >
//                         Forgot password?
//                     </Link>
//                 </div>

//                 {/* Login Button */}
//                 <Button
//                     type="submit"
//                     className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
//                     disabled={isLoading}
//                 >
//                     {isLoading ? 'Logging in...' : 'Log In'}
//                 </Button>

//                 {/* Social Login Buttons */}
//                 <div className="mt-6 space-y-4">
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-white text-black rounded-lg shadow-sm hover:bg-emerald-50 focus:outline-none"
//                         aria-label="Log in with Google"
//                     >
//                         <Image
//                             src="/icons/google.png"
//                             alt="Google"
//                             height={20}
//                             width={20}
//                             className="h-5 mr-2"
//                         />
//                         Log in with Google
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-emerald-800 text-white rounded-lg shadow-sm hover:bg-emerald-900 focus:outline-none"
//                         aria-label="Log in with Facebook"
//                     >
//                         <FaFacebook className="mr-2 h-5 w-5" />
//                         Log in with Facebook
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-emerald-700 text-white rounded-lg shadow-sm hover:bg-emerald-800 focus:outline-none"
//                         aria-label="Log in with LinkedIn"
//                     >
//                         <FaLinkedin className="mr-2 h-5 w-5" />
//                         Log in with LinkedIn
//                     </button>
//                 </div>

//                 {/* Don't have an account */}
//                 <div className="mt-6 text-center text-sm text-white">
//                     <p>
//                         Don't have an account?{" "}
//                         <Link
//                             href="/auth/signup"
//                             className="text-emerald-400 hover:underline"
//                         >
//                             Sign up
//                         </Link>
//                     </p>
//                 </div>

//                 {/* Privacy Policy and Terms */}
//                 <div className="mt-4 text-center text-sm text-white">
//                     <p>
//                         By signing in, you agree to our{" "}
//                         <Link
//                             href="/privacy-policy"
//                             className="text-emerald-400 hover:underline"
//                         >
//                             Privacy Policy
//                         </Link>{" "}
//                         and{" "}
//                         <Link
//                             href="/terms-of-service"
//                             className="text-emerald-400 hover:underline"
//                         >
//                             Terms of Service
//                         </Link>
//                     </p>
//                 </div>
//             </form>
//         </AuthLayout>
//     );
// }










































// 'use client';

// import { useState, } from "react";
// import Link from "next/link";
// import Image from 'next/image';
// import { useRouter } from "next/navigation";
// import {
//     Facebook as FaFacebook,
//     Linkedin as FaLinkedin
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import InputField from "@/components/auth/InputField";
// import AuthLayout from "@/components/auth/AuthLayout";

// export default function LoginPage() {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");
//     const router = useRouter();

//     const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setEmail(e.target.value);

//     const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setPassword(e.target.value);

//     // Helper function to set cookies
//     const setCookie = (name: string, value: string, days: number = 7) => {
//         const expires = new Date();
//         expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
//         document.cookie = `${name}=${value}; path=/; expires=${expires.toUTCString()}; samesite=strict`;
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setIsLoading(true);
//         setError("");

//         try {
//             const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/auth/login', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ email, password })
//             });

//             if (!response.ok) {
//                 // Handle HTTP error responses (400, 500, etc.)
//                 const errorData = await response.json().catch(() => ({}));
//                 throw new Error(errorData.message || `Request failed with status ${response.status}`);
//             }

//             const data = await response.json();

//             // Store user data in cookies
//             if (data.meta && data.meta.accessToken) {
//                 // Store the access token
//                 setCookie('accessToken', data.meta.accessToken);
                
//                 // Store the email
//                 setCookie('userEmail', email);
                
//                 // Store the user's name if available in the response
//                 if (data.data && data.data.name) {
//                     setCookie('userName', data.data.name);
//                 } else {
//                     // If name is not available in the response, extract it from email or set a default
//                     const nameFromEmail = email.split('@')[0];
//                     setCookie('userName', nameFromEmail);
//                 }

//                 // Optionally store additional user info if needed
//                 if (data.data && data.data.userId) {
//                     setCookie('userId', data.data.userId);
//                 }
//             }

//             // Navigate to dashboard
//             router.push('/dashboard');
//             console.log('Login successful:', data);
//         } catch (err) {
//             setError(err instanceof Error ? err.message : 'Login failed');
//             console.error('Login error:', err);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <AuthLayout>
//             <form className="space-y-6" onSubmit={handleSubmit}>
//                 {/* Error Message */}
//                 {error && (
//                     <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
//                         {error}
//                     </div>
//                 )}

//                 {/* Email Input */}
//                 <InputField
//                     type="email"
//                     placeholder="Enter your email"
//                     value={email}
//                     onChange={handleEmailChange}
//                 />

//                 {/* Password Input */}
//                 <InputField
//                     type="password"
//                     placeholder="Enter your password"
//                     value={password}
//                     onChange={handlePasswordChange}
//                 />

//                 {/* Forgot Password */}
//                 <Link
//                     href="/auth/forgot-password"
//                     className="text-white hover:underline text-sm block"
//                 >
//                     Forgot Password?
//                 </Link>

//                 {/* Submit Button */}
//                 <Button
//                     type="submit"
//                     className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
//                     disabled={isLoading}
//                 >
//                     {isLoading ? 'Logging in...' : 'Login'}
//                 </Button>

//                 {/* Social Login Buttons */}
//                 <div className="mt-6 space-y-4">
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-white text-black rounded-lg shadow-sm hover:bg-emerald-50 focus:outline-none"
//                         aria-label="Sign in with Google"
//                     >
//                         <Image
//                             src="/icons/google.png"
//                             alt="Google"
//                             height={20}
//                             width={20}
//                             className="h-5 mr-2"
//                         />
//                         Log in with Google
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-emerald-800 text-white rounded-lg shadow-sm hover:bg-emerald-900 focus:outline-none"
//                         aria-label="Sign in with Facebook"
//                     >
//                         <FaFacebook className="mr-2 h-5 w-5" />
//                         Sign in with Facebook
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-emerald-700 text-white rounded-lg shadow-sm hover:bg-emerald-800 focus:outline-none"
//                         aria-label="Sign in with LinkedIn"
//                     >
//                         <FaLinkedin className="mr-2 h-5 w-5" />
//                         Sign in with LinkedIn
//                     </button>
//                 </div>

//                 {/* Privacy Policy and Terms */}
//                 <div className="mt-6 text-center text-sm text-white">
//                     <p>
//                         By signing in, you agree to our{" "}
//                         <Link
//                             href="/privacy-policy"
//                             className="text-emerald-600 hover:underline"
//                         >
//                             Privacy Policy
//                         </Link>{" "}
//                         and{" "}
//                         <Link
//                             href="/terms-of-service"
//                             className="text-emerald-600 hover:underline"
//                         >
//                             Terms of Service
//                         </Link>
//                         .
//                     </p>
//                 </div>
//             </form>
//         </AuthLayout>
//     );
// }













// 'use client'; 
// import { useState } from "react";
// import Link from "next/link";
// import Image from 'next/image';
// import { useRouter } from "next/navigation";
// import {
//     Facebook as FaFacebook,
//     Linkedin as FaLinkedin
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import InputField from "@/components/auth/InputField";
// import AuthLayout from "@/components/auth/AuthLayout";
// import { postRequest } from "@/app/dashboard/api/fetchAPI";


// export default function SignIn() {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");
//     const router = useRouter();

//     const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setEmail(e.target.value);

//     const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setPassword(e.target.value);

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setIsLoading(true);
//         setError("");

//         try {
//             setIsLoading(true);

//             const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/auth/login', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ email, password })
//             });

//             if (!response.ok) {
//                 // Handle HTTP error responses (400, 500, etc.)
//                 const errorData = await response.json().catch(() => ({}));
//                 throw new Error(errorData.message || `Request failed with status ${response.status}`);
//             }

//             const data = await response.json();

//             // Store token in localStorage or cookies if needed
//             if (data.meta.accessToken) {
//                 // localStorage.setItem('token', data.meta.accessToken);
//                 // Or use cookies
//                 document.cookie = `token=${data.token}; path=/; max-age=86400; samesite=strict`;
//             }

//             // Navigate to dashboard
//             router.push('/dashboard');
//             console.log(data);
//         } catch (err) {
//             setError(err instanceof Error ? err.message : 'Login failed');
//         } finally {
//             setIsLoading(false);
//         }

//     }

//     return (
//         <AuthLayout>
//             <form className="space-y-6" onSubmit={handleSubmit}>
//                 {/* Error Message */}
//                 {error && (
//                     <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
//                         {error}
//                     </div>
//                 )}

//                 {/* Email Input */}
//                 <InputField
//                     type="email"
//                     placeholder="Enter your email"
//                     value={email}
//                     onChange={handleEmailChange}
//                 />

//                 {/* Password Input */}
//                 <InputField
//                     type="password"
//                     placeholder="Enter your password"
//                     value={password}
//                     onChange={handlePasswordChange}
//                 />

//                 {/* Forgot Password */}
//                 <Link
//                     href="/forgot-password"
//                     className="text-white hover:underline text-sm block"
//                 >
//                     Forgot Password?
//                 </Link>

//                 {/* Submit Button */}
//                 <Button
//                     type="submit"
//                     className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
//                     disabled={isLoading}
//                 >
//                     {isLoading ? 'Logging in...' : 'Login'}
//                 </Button>

//                 {/* Social Login Buttons */}
//                 <div className="mt-6 space-y-4">
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-white text-black rounded-lg shadow-sm hover:bg-emerald-50 focus:outline-none"
//                         aria-label="Sign in with Google"
//                     >
//                         <Image
//                             src="/icons/google.png"
//                             alt="Google"
//                             height={20}
//                             width={20}
//                             className="h-5 mr-2"
//                         />
//                         Log in with Google
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-emerald-800 text-white rounded-lg shadow-sm hover:bg-emerald-900 focus:outline-none"
//                         aria-label="Sign in with Facebook"
//                     >
//                         <FaFacebook className="mr-2 h-5 w-5" />
//                         Sign in with Facebook
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-emerald-700 text-white rounded-lg shadow-sm hover:bg-emerald-800 focus:outline-none"
//                         aria-label="Sign in with LinkedIn"
//                     >
//                         <FaLinkedin className="mr-2 h-5 w-5" />
//                         Sign in with LinkedIn
//                     </button>
//                 </div>

//                 {/* Privacy Policy and Terms */}
//                 <div className="mt-6 text-center text-sm text-white">
//                     <p>
//                         By signing in, you agree to our{" "}
//                         <Link
//                             href="/privacy-policy"
//                             className="text-emerald-600 hover:underline"
//                         >
//                             Privacy Policy
//                         </Link>{" "}
//                         and{" "}
//                         <Link
//                             href="/terms-of-service"
//                             className="text-emerald-600 hover:underline"
//                         >
//                             Terms of Service
//                         </Link>
//                         .
//                     </p>
//                 </div>
//             </form>
//         </AuthLayout>
//     );
// }




        // try {
        //     // Use postRequest instead of fetch
        //     const data = await postRequest('/api/v1/auth/login', { email, password });

        //     // Successful login (postRequest will handle token setting internally)
        //     router.push('/dashboard');
        //     console.log(data);

        // } catch (err) {
        //     // Error handling (postRequest already handles API errors)
        //     setError(err instanceof Error ? err.message : 'Login failed');
        // } finally {
        //     setIsLoading(false);
        // }