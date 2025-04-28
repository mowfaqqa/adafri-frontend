// app/auth/two-factor/page.tsx
'use client';

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/auth/AuthLayout";

const TwoFactorVerification: React.FC = () => {
    const [code, setCode] = useState<string[]>(new Array(6).fill(''));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const inputRefs = useRef<(HTMLInputElement | null)[]>(new Array(6).fill(null));

    useEffect(() => {
        // Focus first input on mount
        inputRefs.current[0]?.focus();

        // Check if we have the required email and password
        const email = Cookies.get('2faEmail');
        const password = Cookies.get('2faPassword');
        
        if (!email || !password) {
            // Redirect back to login if we don't have the required credentials
            router.push('/auth/login');
        }
    }, [router]);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Paste handling
            const pastedCode = value.slice(0, 6).split('');
            const newCode = [...code];
            pastedCode.forEach((char, i) => {
                if (i < 6) {
                    newCode[i] = char;
                }
            });
            setCode(newCode);
            const lastFilledIndex = Math.min(pastedCode.length - 1, 5);
            inputRefs.current[lastFilledIndex]?.focus();
        } else {
            // Single digit input
            const newCode = [...code];
            newCode[index] = value;
            setCode(newCode);

            // Move to next input if value is entered
            if (value && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const verificationCode = code.join('');
        
        if (verificationCode.length !== 6) {
            setError("Please enter all 6 digits");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const email = Cookies.get('2faEmail') || '';
            const password = Cookies.get('2faPassword') || '';

            // Send the login request with 2FA code
            const response = await fetch('https://be-auth-server.onrender.com/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    email,
                    password,
                    code: verificationCode 
                }),
                credentials: 'include',
                cache: 'no-store'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '2FA verification failed');
            }

            const data = await response.json();
            
            // Handle tokens from response
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
            
            // Clear the 2FA email and password cookies
            Cookies.remove('2faEmail');
            Cookies.remove('2faPassword');
            
            // Redirect to dashboard
            router.push('/dashboard');
            
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : '2FA verification failed';
            setError(errorMessage);
            console.error('2FA verification error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const setInputRef = (el: HTMLInputElement | null, index: number) => {
        inputRefs.current[index] = el;
    };

    return (
        <AuthLayout>
            <div className="w-full max-w-md mx-auto">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Two-Factor Authentication</h2>
                        <p className="text-emerald-500 mt-2">
                            Enter the 6-digit code from your authenticator app
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-center space-x-2 mb-6">
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => setInputRef(el, index)}
                                type="text"
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ''))}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-12 h-12 text-center text-xl font-medium border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none transition-colors"
                                aria-label={`Digit ${index + 1}`}
                            />
                        ))}
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Verifying...' : 'Verify'}
                    </Button>

                    <div className="mt-4 text-center text-sm text-white">
                        <p>
                            Didn't receive the code?{" "}
                            <button
                                type="button"
                                className="text-emerald-400 hover:underline"
                                onClick={() => console.log('Resend code functionality to be implemented')}
                            >
                                Resend
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </AuthLayout>
    );
};

export default TwoFactorVerification;