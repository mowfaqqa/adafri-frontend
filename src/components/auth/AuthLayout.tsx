'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/lib/context/auth';
// import { Spinner } from '@awc/react';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    const router = useRouter();
    const {isAuthenticated} = useContext(AuthContext);
    useEffect(()=>{
        if(isAuthenticated){            
            router.push('/dashboard');
        }
    }, [isAuthenticated, router])
    return (
        <div
            className="h-screen w-screen flex justify-center items-center bg-center bg-cover px-4 md:px-6">

            {/* Logo in top left corner */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
                <Link href="/">
                    <Image
                        src="/icons/djombi-white.png"
                        alt="Djombi Logo"
                        width={40}
                        height={40}
                        className="h-8 w-auto "
                    />
                </Link>
            </div>

            <Image
                src="/assets/background.png"
                alt="Background"
                fill
                quality={100}
                priority
                className="absolute inset-0 z-0 object-cover"
            />
            <div className="max-w-sm md:max-w-md lg:max-w-lg p-6 bg-white bg-opacity-30 backdrop-blur-md rounded-lg shadow-lg">
                {children}
            </div>
        </div >
    );
}