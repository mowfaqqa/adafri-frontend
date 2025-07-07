'use client';

import React, {useEffect, Suspense, useContext, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/auth/AuthLayout";
import { AuthContext } from "@/lib/context/auth";
import { Spinner } from "@awc/react";

// Internal component to handle search params
function LoginContent() {
    const { 
        isLoading: isLoadingAuth, 
        isAuthenticated, 
        user, 
        tryLogin, 
        login: isRedirecting 
    } = useContext(AuthContext);
    
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/dashboard';
    
    const login = useCallback(() => {
        tryLogin(true);
    }, [tryLogin]);

    // Redirect authenticated users to intended destination
    useEffect(() => {
        if (isAuthenticated && user) {
            router.push(redirectTo);
        }
    }, [isAuthenticated, user, router, redirectTo]);
    
    return (
        <AuthLayout>
            {isLoadingAuth && (
                <div className="w-full max-w-md mx-auto text-white text-center p-6 flex flex-col items-center">
                    <Spinner width='30px' height='30px' />
                    <div className="animate-pulse">Loading...</div>
                </div>
            )}
            
            {!isLoadingAuth && !isAuthenticated && (
                <div className="w-full max-w-md mx-auto text-center">
                    <h1 className="text-2xl font-bold mb-6 text-white">Welcome to Djombi</h1>
                    <p className="text-gray-300 mb-6">
                        Sign in to access your dashboard and all the powerful tools.
                    </p>
                    <Button 
                        onClick={login}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3"
                    >
                        Log in
                    </Button>
                    <div className="mt-4">
                        <Link href="/" className="text-white hover:underline">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            )}
            
            {!isLoadingAuth && isAuthenticated && user && (
                <div className="flex flex-col items-center">
                    <span className="text-md text-white mb-2">Connected as {user.email}</span>
                    <span className="text-md text-gray-300 mb-4">or</span>
                    <Button 
                        onClick={login}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                        Login with another account
                    </Button>
                    <div className="mt-4">
                        <Link href={redirectTo} className="text-white hover:underline">
                            Continue to Dashboard →
                        </Link>
                    </div>
                </div>
            )}
            
            {isRedirecting && (
                <div className="w-full max-w-md mx-auto text-white text-center p-6">
                    <span className="animate-pulse">Redirecting to authentication page...</span>
                </div>
            )}
        </AuthLayout>
    );
}

// Main component that uses Suspense
function Login() {
    return (
        <Suspense fallback={
            <div className="w-full max-w-md mx-auto text-white text-center p-6">
                <div className="animate-pulse">Loading...</div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}

export default Login;