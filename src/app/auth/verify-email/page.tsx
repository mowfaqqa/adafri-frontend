'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Cookies from 'js-cookie';
import { Button } from "@/components/ui/button";
import InputField from "@/components/auth/InputField";
import AuthLayout from "@/components/auth/AuthLayout";

// Create a separate component that uses useSearchParams
function VerifyEmailForm() {
    const [otp, setOtp] = useState("");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isDemo, setIsDemo] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Get email from URL params or cookies
        const emailParam = searchParams.get('email');
        const demoParam = searchParams.get('demo');
        
        // Check if we're in demo mode
        if (demoParam === 'true') {
            setIsDemo(true);
        }
        
        if (emailParam) {
            setEmail(emailParam);
        } else {
            const storedEmail = Cookies.get('userEmail');
            if (storedEmail) {
                setEmail(storedEmail);
            } else {
                // Redirect to signup if no email is found
                router.push('/auth/signup');
            }
        }
    }, [searchParams, router]);

    useEffect(() => {
        // Countdown for resend button
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow only up to 6 digits
        const value = e.target.value;
        if (/^\d{0,6}$/.test(value)) {
            setOtp(value);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!otp || otp.length < 4) {
            setError("Please enter a valid OTP (4-6 digits)");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            if (isDemo) {
                // Demo mode - simulate API call
                console.log("Using demo verification with:", { email, otp });
                
                // Simulate verification delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // In demo mode, consider any 4-6 digit OTP as valid
                if (otp.length >= 4 && otp.length <= 6) {
                    // Navigate to login with verified flag
                    router.push('/auth/login?verified=true');
                } else {
                    throw new Error("Invalid verification code");
                }
            } else {
                // Real API call
                const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/verify-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, otp })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Verification failed with status ${response.status}`);
                }

                await response.json();
                
                // Navigate to login
                router.push('/auth/login?verified=true');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        
        setIsLoading(true);
        setError("");

        try {
            if (isDemo) {
                // Demo mode - simulate resend OTP
                console.log("Demo mode: Resending OTP for", email);
                
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Set cooldown for 60 seconds as usual
                setResendCooldown(60);
            } else {
                // Real API call
                const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/resend-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Failed to resend OTP with status ${response.status}`);
                }

                await response.json();
                
                // Set cooldown for 60 seconds
                setResendCooldown(60);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to resend OTP');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="space-y-4" onSubmit={handleVerify}>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">Verify Your Email</h2>
                <p className="text-emerald-500 mt-2">
                    We've sent a verification code to {email}
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
                    {error}
                </div>
            )}

            {/* OTP Input */}
            <InputField
                type="text"
                placeholder="Enter 6-digit verification code"
                value={otp}
                onChange={handleOtpChange}
                maxLength={6}
                inputMode="numeric"
                pattern="\d{6}"
            />

            {/* Verify Button */}
            <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isLoading}
            >
                {isLoading ? 'Verifying...' : 'Verify Email'}
            </Button>

            {/* Resend OTP */}
            <div className="mt-4 text-center">
                <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-emerald-400 hover:underline disabled:text-gray-500 disabled:no-underline"
                >
                    {resendCooldown > 0 
                        ? `Resend code in ${resendCooldown}s` 
                        : 'Resend verification code'}
                </button>
            </div>

            {/* Back to Registration */}
            <div className="mt-4 text-center text-sm text-white">
                <p>
                    Wrong email?{" "}
                    <Link
                        href="/auth/signup"
                        className="text-emerald-400 hover:underline"
                    >
                        Go back to sign up
                    </Link>
                </p>
            </div>
        </form>
    );
}

// Main component with Suspense boundary
const VerifyEmail: React.FC = () => {
    return (
        <AuthLayout>
            <Suspense fallback={
                <div className="w-full max-w-md mx-auto text-white text-center p-6">
                    <div className="animate-pulse">Loading...</div>
                </div>
            }>
                <VerifyEmailForm />
            </Suspense>
        </AuthLayout>
    );
}

export default VerifyEmail;