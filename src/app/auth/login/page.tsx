'use client';

import { useState, } from "react";
import Link from "next/link";
import Image from 'next/image';
import { useRouter } from "next/navigation";
import {
    Facebook as FaFacebook,
    Linkedin as FaLinkedin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import InputField from "@/components/auth/InputField";
import AuthLayout from "@/components/auth/AuthLayout";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setEmail(e.target.value);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setPassword(e.target.value);

    // Helper function to set cookies
    const setCookie = (name: string, value: string, days: number = 7) => {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value}; path=/; expires=${expires.toUTCString()}; samesite=strict`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                // Handle HTTP error responses (400, 500, etc.)
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Request failed with status ${response.status}`);
            }

            const data = await response.json();

            // Store user data in cookies
            if (data.meta && data.meta.accessToken) {
                // Store the access token
                setCookie('accessToken', data.meta.accessToken);
                
                // Store the email
                setCookie('userEmail', email);
                
                // Store the user's name if available in the response
                if (data.data && data.data.name) {
                    setCookie('userName', data.data.name);
                } else {
                    // If name is not available in the response, extract it from email or set a default
                    const nameFromEmail = email.split('@')[0];
                    setCookie('userName', nameFromEmail);
                }

                // Optionally store additional user info if needed
                if (data.data && data.data.userId) {
                    setCookie('userId', data.data.userId);
                }
            }

            // Navigate to dashboard
            router.push('/dashboard');
            console.log('Login successful:', data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <form className="space-y-6" onSubmit={handleSubmit}>
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
                <InputField
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                />

                {/* Forgot Password */}
                <Link
                    href="/forgot-password"
                    className="text-white hover:underline text-sm block"
                >
                    Forgot Password?
                </Link>

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isLoading}
                >
                    {isLoading ? 'Logging in...' : 'Login'}
                </Button>

                {/* Social Login Buttons */}
                <div className="mt-6 space-y-4">
                    <button
                        type="button"
                        className="w-full px-4 py-2 flex items-center justify-center bg-white text-black rounded-lg shadow-sm hover:bg-emerald-50 focus:outline-none"
                        aria-label="Sign in with Google"
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
                        aria-label="Sign in with Facebook"
                    >
                        <FaFacebook className="mr-2 h-5 w-5" />
                        Sign in with Facebook
                    </button>
                    <button
                        type="button"
                        className="w-full px-4 py-2 flex items-center justify-center bg-emerald-700 text-white rounded-lg shadow-sm hover:bg-emerald-800 focus:outline-none"
                        aria-label="Sign in with LinkedIn"
                    >
                        <FaLinkedin className="mr-2 h-5 w-5" />
                        Sign in with LinkedIn
                    </button>
                </div>

                {/* Privacy Policy and Terms */}
                <div className="mt-6 text-center text-sm text-white">
                    <p>
                        By signing in, you agree to our{" "}
                        <Link
                            href="/privacy-policy"
                            className="text-emerald-600 hover:underline"
                        >
                            Privacy Policy
                        </Link>{" "}
                        and{" "}
                        <Link
                            href="/terms-of-service"
                            className="text-emerald-600 hover:underline"
                        >
                            Terms of Service
                        </Link>
                        .
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
}













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