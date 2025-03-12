'use client';

import { useState } from "react";
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
import { postRequest } from "@/app/dashboard/api/fetchAPI";

export default function SignUp() {
    const [first_name, setFirstName] = useState("");
    const [last_name, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFirstName(e.target.value);

    const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setLastName(e.target.value);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setEmail(e.target.value);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setPassword(e.target.value);

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setConfirmPassword(e.target.value);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        setIsLoading(true);
        setError("");


        try {
            setIsLoading(true);

            const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, first_name, last_name, password })
            });

            if (!response.ok) {
                // Handle HTTP error responses (400, 500, etc.)
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Request failed with status ${response.status}`);
            }

            const data = await response.json();
            // Navigate to dashboard
            router.push('/auth/login');
            console.log(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }

        // try {
        //     // Use postRequest for signup
        //     const data = await postRequest('/api/v1/auth/register', {
        //         name,
        //         email,
        //         password
        //     });

        //     console.log("Signup successful:", data);

        //     // Successful signup (postRequest will handle token setting internally)
        //     router.push('/login');
        //     // console.log(data);

        // } catch (err) {
        //     // Error handling (postRequest already handles API errors)
        //     setError(err instanceof Error ? err.message : 'Signup failed');
        // } finally {
        //     setIsLoading(false);
        // }
    };

    return (
        <AuthLayout>
            <form className="space-y-4" onSubmit={handleSubmit}>
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
                <InputField
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={handlePasswordChange}
                />

                {/* Confirm Password Input */}
                <InputField
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                />

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
                        .
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
}






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