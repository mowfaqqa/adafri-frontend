'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AuthHeader() {
  const pathname = usePathname();
  const router = useRouter();

  // Determine active tab
  const isSignIn = pathname === "/auth/login";
  const isSignUp = pathname === "/auth/signup";

  // Handle tab navigation
  const handleTabChange = (tab: string) => {
    if (tab === "login") router.push("/auth/login");
    else if (tab === "signup") router.push("/auth/signup");
  };

  return (
    <div className="text-center mb-6">
      <Tabs
        value={isSignIn ? "login" : isSignUp ? "signup" : "login"}
        onValueChange={handleTabChange}
        className="flex justify-center"
      >
        <TabsList>
          <TabsTrigger
            value="login"
            className={`px-4 py-2 text-sm md:text-base ${
              isSignIn ? "text-blue-600 font-bold" : "text-gray-500"
            }`}
          >
            Login
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className={`px-4 py-2 text-sm md:text-base ${
              isSignUp ? "text-blue-600 font-bold" : "text-gray-500"
            }`}
          >
            Sign Up
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}