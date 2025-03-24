'use client';

import Image from 'next/image';
import AuthHeader from '@/components/auth/AuthHeader';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
    <div 
      className="h-screen w-screen flex justify-center items-center bg-center bg-cover px-4 md:px-6">
         <Image
                src="/assets/background.png"
                alt="Background"
                fill
                quality={100}
                priority
                className="absolute inset-0 z-0 object-cover"
            />
        <div className="max-w-sm md:max-w-md lg:max-w-lg p-6 bg-white bg-opacity-30 backdrop-blur-md rounded-lg shadow-lg">
            <AuthHeader />
            {children}
        </div>
    </div >
  );
}