'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import InputField from "@/components/auth/InputField";
import AuthLayout from "@/components/auth/AuthLayout";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setEmail(e.target.value);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess(false);

        try {
            const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                // Handle HTTP error responses
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Request failed with status ${response.status}`);
            }

            const data = await response.json();
            setSuccess(true);
            console.log('Password reset OTP sent:', data);
            
            // Redirect to verify OTP page with email parameter
            router.push(`/auth/verify-reset-otp?email=${encodeURIComponent(email)}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send reset OTP');
            console.error('Password reset error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="w-full max-w-md mx-auto">
                <h1 className="text-2xl font-bold text-center text-white mb-6">Reset Your Password</h1>
                
                {success ? (
                    <div className="text-center space-y-6">
                        <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 px-4 py-3 rounded relative" role="alert">
                            Password reset OTP has been sent to your email address. Redirecting you to verification page...
                        </div>
                    </div>
                ) : (
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
                                {error}
                            </div>
                        )}

                        <div className="text-white mb-4">
                            Enter the email address associated with your account and we'll send you an OTP to reset your password.
                        </div>

                        {/* Email Input */}
                        <InputField
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={handleEmailChange}
                            // text="Email"
                            className="text-gray-900"
                            error=""
                        />

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending...' : 'Send me the reset OTP'}
                        </Button>

                        {/* Return to Login */}
                        <div className="text-center">
                            <Link
                                href="/auth/login"
                                className="text-white hover:underline text-sm block"
                            >
                                Return to Sign In
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </AuthLayout>
    );
}