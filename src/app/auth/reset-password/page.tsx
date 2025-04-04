'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import InputField from "@/components/auth/InputField";
import AuthLayout from "@/components/auth/AuthLayout";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [token, setToken] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Get token from URL query parameters
        const tokenFromUrl = searchParams?.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            setError("Reset token is missing. Please use the link from your email.");
        }
    }, [searchParams]);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setPassword(e.target.value);

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setConfirmPassword(e.target.value);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate passwords match
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
            const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, newPassword: password })
            });

            if (!response.ok) {
                // Handle HTTP error responses
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Request failed with status ${response.status}`);
            }

            const data = await response.json();
            setSuccess(true);
            console.log('Password reset successful:', data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password');
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
                            Your password has been successfully reset.
                        </div>
                        <Button
                            type="button"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => router.push('/login')}
                        >
                            Return to Sign In
                        </Button>
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
                            Please enter your new password below.
                        </div>

                        {/* New Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                                New Password
                            </label>
                            <InputField
                                // id="password"
                                type="password"
                                placeholder="Enter new password"
                                value={password}
                                onChange={handlePasswordChange}
                                // required
                            />
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                                Confirm New Password
                            </label>
                            <InputField
                                // id="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                                // required
                            />
                        </div>

                        {/* Password Requirements */}
                        <div className="text-sm text-white opacity-80">
                            <p>Password must:</p>
                            <ul className="list-disc pl-5 mt-1">
                                <li>Be at least 8 characters long</li>
                                <li>Include at least one uppercase letter</li>
                                <li>Include at least one number</li>
                                <li>Include at least one special character</li>
                            </ul>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={isLoading || !token}
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </form>
                )}
            </div>
        </AuthLayout>
    );
}