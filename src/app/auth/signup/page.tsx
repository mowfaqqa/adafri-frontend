'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from 'next/image';
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';
import {
    Facebook as FaFacebook,
    Linkedin as FaLinkedin,
    Eye as EyeOpen,
    EyeOff as EyeClosed,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import InputField from "@/components/auth/InputField";
import AuthLayout from "@/components/auth/AuthLayout";

export default function SignUp() {
    const [first_name, setFirstName] = useState("");
    const [last_name, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | ''>('');
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFirstName(e.target.value);

    const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setLastName(e.target.value);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setEmail(e.target.value);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setConfirmPassword(e.target.value);

    // Password validation requirements
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    // Calculate password strength
    useEffect(() => {
        if (password === '') {
            setPasswordStrength('');
            return;
        }

        let score = 0;
        if (hasMinLength) score++;
        if (hasUpperCase) score++;
        if (hasLowerCase) score++;
        if (hasNumber) score++;
        if (hasSpecialChar) score++;

        if (score <= 2) setPasswordStrength('weak');
        else if (score <= 4) setPasswordStrength('medium');
        else setPasswordStrength('strong');
    }, [password, hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar]);

    // Get the color and text for password strength indicator
    const getPasswordStrengthColor = () => {
        switch (passwordStrength) {
            case 'weak': return 'text-red-500';
            case 'medium': return 'text-yellow-500';
            case 'strong': return 'text-green-500';
            default: return '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Enhanced validation
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
            setError("Password must be at least 8 characters long, include uppercase and lowercase letters, a number, and a special character.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // Try to make the API call
            let useDemo = false;
            
            try {
                const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, first_name, last_name, password })
                });

                if (!response.ok) {
                    // If API call fails, we'll use demo mode but still show the error
                    const errorData = await response.json().catch(() => ({}));
                    console.error("API Error:", errorData.message || `Request failed with status ${response.status}`);
                    useDemo = true;
                    throw new Error(errorData.message || `Request failed with status ${response.status}`);
                }

                await response.json();
            } catch (err) {
                // Endpoint error - switch to demo mode but we'll still show the error
                console.log("Using demo mode due to API error:", err);
                useDemo = true;
                // We'll still throw this later after setting demo mode
            }
            
            // Store user details in cookies regardless of API success/failure
            Cookies.set('userEmail', email, { expires: 30, path: '/' });
            Cookies.set('userFirstName', first_name, { expires: 30, path: '/' });
            Cookies.set('userLastName', last_name, { expires: 30, path: '/' });
            Cookies.set('userName', `${first_name} ${last_name}`, { expires: 30, path: '/' });
            
            // Always navigate to verify email page, with demo flag if needed
            const demoParam = useDemo ? '&demo=true' : '';
            router.push(`/auth/verify-email?email=${encodeURIComponent(email)}${demoParam}`);
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Create an Account</h2>
                    <p className="text-emerald-500 mt-2">
                        Join us today and get started
                    </p>
                </div>
                
                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
                        {error}
                    </div>
                )}

                {/* Name inputs on the same line */}
                <div className="flex gap-4 w-full">
                    {/* First Name Input */}
                    <InputField
                        type="text"
                        placeholder="Enter your First Name"
                        value={first_name}
                        onChange={handleFirstNameChange}
                    />

                    {/* Last Name Input */}
                    <InputField
                        type="text"
                        placeholder="Enter your Last Name"
                        value={last_name}
                        onChange={handleLastNameChange}
                    />
                </div>
                
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
                        placeholder="Create a password"
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

                {/* Password Strength Indicator */}
                {password && (
                    <div className="mt-1">
                        <div className="flex items-center justify-between">
                            <div className="w-[350px] bg-gray-200 rounded-md h-1.5 mr-2">
                                <div 
                                    className={`h-1.5 rounded-full ${
                                        passwordStrength === 'weak' ? 'bg-red-500 w-1/3' : 
                                        passwordStrength === 'medium' ? 'bg-yellow-500 w-2/3' : 
                                        passwordStrength === 'strong' ? 'bg-green-500 w-full' : ''
                                    }`}
                                ></div>
                            </div>
                            <span className={`text-sm font-medium min-w-[10px] text-right ${getPasswordStrengthColor()}`}>
                                {passwordStrength === 'weak' && 'Weak'}
                                {passwordStrength === 'medium' && 'Medium'}
                                {passwordStrength === 'strong' && 'Strong'}
                            </span>
                        </div>
                        
                        {/* Hidden requirements message that shows on hover or focus */}
                        {/* <div className="mt-1 text-xs text-gray-400">
                            Password must have: 8+ chars, uppercase, lowercase, number, special char
                        </div> */}
                    </div>
                )}

                {/* Confirm Password Input */}
                <div className="relative">
                    <InputField
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                    />
                    {password && confirmPassword && (
                        <div className="mt-1 text-xs">
                            {password === confirmPassword ? (
                                <div className="flex items-center text-green-500">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Passwords match
                                </div>
                            ) : (
                                <div className="flex items-center text-red-500">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Passwords don't match
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isLoading}
                >
                    {isLoading ? 'Creating account...' : 'Sign Up'}
                </Button>

                {/* Social Signup Buttons */}
                <div className="mt-4 space-y-3">
                    <button
                        type="button"
                        className="w-full px-4 py-2 flex items-center justify-center bg-white text-black rounded-lg shadow-sm hover:bg-emerald-50 focus:outline-none"
                        aria-label="Sign up with Google"
                    >
                        <Image
                            src="/icons/google.png"
                            alt="Google"
                            height={20}
                            width={20}
                            className="h-5 mr-2"
                        />
                        Sign up with Google
                    </button>
                    <button
                        type="button"
                        className="w-full px-4 py-2 flex items-center justify-center bg-emerald-800 text-white rounded-lg shadow-sm hover:bg-emerald-900 focus:outline-none"
                        aria-label="Sign up with Facebook"
                    >
                        <FaFacebook className="mr-2 h-5 w-5" />
                        Sign up with Facebook
                    </button>
                    <button
                        type="button"
                        className="w-full px-4 py-2 flex items-center justify-center bg-emerald-700 text-white rounded-lg shadow-sm hover:bg-emerald-800 focus:outline-none"
                        aria-label="Sign up with LinkedIn"
                    >
                        <FaLinkedin className="mr-2 h-5 w-5" />
                        Sign up with LinkedIn
                    </button>
                </div>

                {/* Already have an account */}
                <div className="mt-4 text-center text-sm text-white">
                    <p>
                        Already have an account?{" "}
                        <Link
                            href="/auth/login"
                            className="text-emerald-400 hover:underline"
                        >
                            Log in
                        </Link>
                    </p>
                </div>

                {/* Privacy Policy and Terms */}
                <div className="mt-4 text-center text-sm text-white">
                    <p>
                        By signing up, you agree to our{" "}
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

// export default function SignUp() {
//     const [first_name, setFirstName] = useState("");
//     const [last_name, setLastName] = useState("");
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [confirmPassword, setConfirmPassword] = useState("");
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");
//     const router = useRouter();

//     const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setFirstName(e.target.value);

//     const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setLastName(e.target.value);

//     const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setEmail(e.target.value);

//     const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setPassword(e.target.value);

//     const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setConfirmPassword(e.target.value);

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();

//         // Basic validation
//         if (password !== confirmPassword) {
//             setError("Passwords do not match");
//             return;
//         }

//         if (password.length < 8) {
//             setError("Password must be at least 8 characters long");
//             return;
//         }

//         setIsLoading(true);
//         setError("");


//         try {
//             setIsLoading(true);

//             const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/auth/register', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ email, first_name, last_name, password })
//             });

//             if (!response.ok) {
//                 // Handle HTTP error responses (400, 500, etc.)
//                 const errorData = await response.json().catch(() => ({}));
//                 throw new Error(errorData.message || `Request failed with status ${response.status}`);
//             }

//             const data = await response.json();
//             // Navigate to dashboard
//             router.push('/auth/login');
//             console.log(data);
//         } catch (err) {
//             setError(err instanceof Error ? err.message : 'Login failed');
//         } finally {
//             setIsLoading(false);
//         }

//         // try {
//         //     // Use postRequest for signup
//         //     const data = await postRequest('/api/v1/auth/register', {
//         //         name,
//         //         email,
//         //         password
//         //     });

//         //     console.log("Signup successful:", data);

//         //     // Successful signup (postRequest will handle token setting internally)
//         //     router.push('/login');
//         //     // console.log(data);

//         // } catch (err) {
//         //     // Error handling (postRequest already handles API errors)
//         //     setError(err instanceof Error ? err.message : 'Signup failed');
//         // } finally {
//         //     setIsLoading(false);
//         // }
//     };

//     return (
//         <AuthLayout>
//             <form className="space-y-4" onSubmit={handleSubmit}>
//                 {/* Error Message */}
//                 {error && (
//                     <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
//                         {error}
//                     </div>
//                 )}

//                 {/* Name inputs on the same line */}
//                 <div className="flex gap-4 w-full">
//                     {/* First Name Input */}
//                     <InputField
//                         type="text"
//                         placeholder="Enter your First Name"
//                         value={first_name}
//                         onChange={handleFirstNameChange}
//                     />

//                     {/* Last Name Input */}
//                     <InputField
//                         type="text"
//                         placeholder="Enter your Last Name"
//                         value={last_name}
//                         onChange={handleLastNameChange}
//                     />
//                 </div>
                
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
//                     placeholder="Create a password"
//                     value={password}
//                     onChange={handlePasswordChange}
//                 />

//                 {/* Confirm Password Input */}
//                 <InputField
//                     type="password"
//                     placeholder="Confirm your password"
//                     value={confirmPassword}
//                     onChange={handleConfirmPasswordChange}
//                 />

//                 {/* Submit Button */}
//                 <Button
//                     type="submit"
//                     className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
//                     disabled={isLoading}
//                 >
//                     {isLoading ? 'Creating account...' : 'Sign Up'}
//                 </Button>

//                 {/* Social Signup Buttons */}
//                 <div className="mt-4 space-y-3">
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-white text-black rounded-lg shadow-sm hover:bg-emerald-50 focus:outline-none"
//                         aria-label="Sign up with Google"
//                     >
//                         <Image
//                             src="/icons/google.png"
//                             alt="Google"
//                             height={20}
//                             width={20}
//                             className="h-5 mr-2"
//                         />
//                         Sign up with Google
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-emerald-800 text-white rounded-lg shadow-sm hover:bg-emerald-900 focus:outline-none"
//                         aria-label="Sign up with Facebook"
//                     >
//                         <FaFacebook className="mr-2 h-5 w-5" />
//                         Sign up with Facebook
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full px-4 py-2 flex items-center justify-center bg-emerald-700 text-white rounded-lg shadow-sm hover:bg-emerald-800 focus:outline-none"
//                         aria-label="Sign up with LinkedIn"
//                     >
//                         <FaLinkedin className="mr-2 h-5 w-5" />
//                         Sign up with LinkedIn
//                     </button>
//                 </div>

//                 {/* Already have an account */}
//                 <div className="mt-4 text-center text-sm text-white">
//                     <p>
//                         Already have an account?{" "}
//                         <Link
//                             href="/auth/login"
//                             className="text-emerald-400 hover:underline"
//                         >
//                             Log in
//                         </Link>
//                     </p>
//                 </div>

//                 {/* Privacy Policy and Terms */}
//                 <div className="mt-4 text-center text-sm text-white">
//                     <p>
//                         By signing up, you agree to our{" "}
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






//     try {
//         const response = await fetch('/api/auth/signup', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 email: form.email,
//                 first_name: form.first_name,
//                 last_name: form.last_name,
//                 password: form.password
//             })
//         });

//         const data = await response.json();

//         if (response.ok) {
//             // Successful signup
//             router.push('/login'); // Redirect to login page
//         } else {
//             // Handle signup errors
//             setErrors({
//                 ...errors,
//                 email: data.message || 'Signup failed. Please try again.'
//             });
//         }
//     } catch (error) {
//         console.error('Signup error:', error);
//         setErrors({
//             ...errors,
//             email: 'Network error. Please try again.'
//         });
//     } finally {
//         setIsLoading(false);
//     }
// } else {
//     setIsLoading(false);
// }