'use client';

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import InputField from "@/components/auth/InputField";
import AuthLayout from "@/components/auth/AuthLayout";
import {
    Eye as EyeOpen,
    EyeOff as EyeClosed
} from "lucide-react";

// Create a separate component that uses useSearchParams
function VerifyResetOTPForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // Get email from URL params if available
        const emailParam = searchParams?.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [searchParams]);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setEmail(e.target.value);

    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setOtp(e.target.value);

    const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setNewPassword(e.target.value);
        
    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setConfirmPassword(e.target.value);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        if (!email || !otp || !newPassword) {
            setError("All fields are required");
            return;
        }
        
        if (newPassword !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }
        
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        
        setIsLoading(true);
        setError("");
        setSuccess(false);

        try {
            const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    email, 
                    otp, 
                    new_password: newPassword 
                })
            });

            if (!response.ok) {
                // Handle HTTP error responses
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Request failed with status ${response.status}`);
            }

            const data = await response.json();
            setSuccess(true);
            console.log('Password reset successfully:', data);
            
            // Show success message and redirect to login after a delay
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password');
            console.error('Password reset error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-center text-white mb-6">Reset Your Password</h1>
            
            {success ? (
                <div className="text-center space-y-6">
                    <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 px-4 py-3 rounded relative" role="alert">
                        Password reset successful! Redirecting to login page...
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
                        Enter the verification code sent to your email and your new password.
                    </div>

                    {/* Email Input */}
                    <InputField
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={handleEmailChange}
                        className="text-gray-900"
                        error=""
                        disabled={!!searchParams?.get('email')}
                    />

                    {/* OTP Input */}
                    <InputField
                        type="text"
                        name="otp"
                        placeholder="Enter verification code"
                        value={otp}
                        onChange={handleOtpChange}
                        className="text-gray-900"
                        error=""
                    />
                    
                    {/* New Password Input */}
                    <div className="relative">
                        <InputField
                            type={showPassword ? "text" : "password"}
                            name="newPassword"
                            placeholder="Create new password"
                            value={newPassword}
                            onChange={handleNewPasswordChange}
                            className="text-gray-900"
                            error=""
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
                    
                    {/* Confirm Password Input */}
                    <InputField
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        className="text-gray-900"
                        error=""
                    />

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : 'Reset Password'}
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
    );
}

// Main component with Suspense boundary
const VerifyResetOTPPage = () => {
    return (
        <AuthLayout>
            <Suspense fallback={
                <div className="w-full max-w-md mx-auto text-white text-center p-6">
                    <div className="animate-pulse">Loading...</div>
                </div>
            }>
                <VerifyResetOTPForm />
            </Suspense>
        </AuthLayout>
    );
}

export default VerifyResetOTPPage;


































// 'use client';

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { useRouter, useSearchParams } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import InputField from "@/components/auth/InputField";
// import AuthLayout from "@/components/auth/AuthLayout";

// export default function VerifyResetOTPPage() {
//     const searchParams = useSearchParams();
//     const router = useRouter();
//     const [email, setEmail] = useState("");
//     const [otp, setOtp] = useState("");
//     const [isLoading, setIsLoading] = useState(false);
//     const [isResending, setIsResending] = useState(false);
//     const [error, setError] = useState("");
//     const [success, setSuccess] = useState(false);

//     useEffect(() => {
//         // Get email from URL params if available
//         const emailParam = searchParams?.get('email');
//         if (emailParam) {
//             setEmail(emailParam);
//         }
//     }, [searchParams]);

//     const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setEmail(e.target.value);

//     const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setOtp(e.target.value);

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setIsLoading(true);
//         setError("");
//         setSuccess(false);

//         try {
//             const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/verify-email', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ email, otp })
//             });

//             if (!response.ok) {
//                 // Handle HTTP error responses
//                 const errorData = await response.json().catch(() => ({}));
//                 throw new Error(errorData.message || `Request failed with status ${response.status}`);
//             }

//             const data = await response.json();
//             setSuccess(true);
//             console.log('OTP verified successfully:', data);
            
//             // Redirect to reset password page with token or other necessary parameters
//             // Assuming the API returns a reset token
//             setTimeout(() => {
//                 router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(data.resetToken || '')}`);
//             }, 1500);
//         } catch (err) {
//             setError(err instanceof Error ? err.message : 'Failed to verify OTP');
//             console.error('OTP verification error:', err);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleResendOTP = async () => {
//         setIsResending(true);
//         setError("");

//         try {
//             const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/resend-otp', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ email })
//             });

//             if (!response.ok) {
//                 // Handle HTTP error responses
//                 const errorData = await response.json().catch(() => ({}));
//                 throw new Error(errorData.message || `Request failed with status ${response.status}`);
//             }

//             const data = await response.json();
//             console.log('OTP resent successfully:', data);
//             // Show temporary success message for resend
//             setError("OTP has been resent to your email");
//             setTimeout(() => setError(""), 3000);
//         } catch (err) {
//             setError(err instanceof Error ? err.message : 'Failed to resend OTP');
//             console.error('Resend OTP error:', err);
//         } finally {
//             setIsResending(false);
//         }
//     };

//     return (
//         <AuthLayout>
//             <div className="w-full max-w-md mx-auto">
//                 <h1 className="text-2xl font-bold text-center text-white mb-6">Verify Reset Code</h1>
                
//                 {success ? (
//                     <div className="text-center space-y-6">
//                         <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 px-4 py-3 rounded relative" role="alert">
//                             OTP verified successfully! Redirecting you to reset your password...
//                         </div>
//                     </div>
//                 ) : (
//                     <form className="space-y-6" onSubmit={handleSubmit}>
//                         {/* Error/Info Message */}
//                         {error && (
//                             <div className={`${error.includes('resent') ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-red-50 border-red-300 text-red-700'} border px-4 py-3 rounded relative`} role="alert">
//                                 {error}
//                             </div>
//                         )}

//                         <div className="text-white mb-4">
//                             Enter the OTP sent to your email to continue with password reset.
//                         </div>

//                         {/* Email Input */}
//                         <InputField
//                             type="email"
//                             name="email"
//                             placeholder="Enter your email"
//                             value={email}
//                             onChange={handleEmailChange}
//                             text="Email"
//                             className="text-gray-900"
//                             error=""
//                             disabled={!!searchParams?.get('email')}
//                         />

//                         {/* OTP Input */}
//                         <InputField
//                             type="text"
//                             name="otp"
//                             placeholder="Enter OTP from your email"
//                             value={otp}
//                             onChange={handleOtpChange}
//                             text="OTP Code"
//                             className="text-gray-900"
//                             error=""
//                         />

//                         {/* Verify Button */}
//                         <Button
//                             type="submit"
//                             className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
//                             disabled={isLoading}
//                         >
//                             {isLoading ? 'Verifying...' : 'Verify OTP'}
//                         </Button>

//                         {/* Resend OTP Button */}
//                         <Button
//                             type="button"
//                             className="w-full bg-transparent hover:bg-gray-700 text-white border border-white"
//                             onClick={handleResendOTP}
//                             disabled={isResending || !email}
//                         >
//                             {isResending ? 'Sending...' : 'Resend OTP'}
//                         </Button>

//                         {/* Return to Login */}
//                         <div className="text-center">
//                             <Link
//                                 href="/login"
//                                 className="text-white hover:underline text-sm block"
//                             >
//                                 Return to Sign In
//                             </Link>
//                         </div>
//                     </form>
//                 )}
//             </div>
//         </AuthLayout>
//     );
// }