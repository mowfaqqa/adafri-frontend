"use client";

import { useState, useEffect, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserInfo } from "@/lib/utils/cookies";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useSearchParams } from "next/navigation";

// Import our tab components
import { PersonalInformationTab } from "@/components/profile/PersonalInformationTab";
import { SecurityTab } from "@/components/profile/SecurityTab";
import NotificationTab from "@/components/profile/NotificationTab";
import EmailTab from "@/components/profile/EmailTab";
import { AccountSettingsTab } from "@/components/profile/AccountSettingsTab";

// Create a client component that uses searchParams
function ProfileContent() {
  const [activeTab, setActiveTab] = useState("personal-information");
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [darkMode, setDarkMode] = useState(false);
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Load user info from cookies on component mount
    const cookieInfo = getUserInfo();
    setUserInfo({
      name: cookieInfo?.name || "User",
      email: cookieInfo?.email || "user@example.com"
    });
    
    // Check if dark mode is saved in localStorage
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode) {
        setDarkMode(savedDarkMode === 'true');
      }
    }
    
    // Check if tab is specified in URL
    const tabParam = searchParams?.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Toggle dark mode and save to localStorage
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', String(newDarkMode));
      
      // Emit an event so other components can respond to the theme change
      window.dispatchEvent(new CustomEvent('themeChange', {
        detail: { darkMode: newDarkMode }
      }));
    }
  };

  return (
    <div className="min-h-screen">
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <div className="mb-6">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="personal-information">Personal Information</TabsTrigger>
              <TabsTrigger value="account-settings">Account Settings</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="notification">Notification</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Personal Information Tab */}
          <TabsContent value="personal-information">
            <PersonalInformationTab userInfo={userInfo} setUserInfo={setUserInfo} />
          </TabsContent>
          
          {/* Account Settings Tab */}
          <TabsContent value="account-settings">
            <AccountSettingsTab darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          </TabsContent>
          
          {/* Email Tab */}
          <TabsContent value="email">
            <EmailTab />
          </TabsContent>
          
          {/* Notification Tab */}
          <TabsContent value="notification">
            <NotificationTab />
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security">
            <SecurityTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Main page component that wraps ProfileContent in Suspense
export default function ProfilePage() {
  return (
    // <ProtectedRoute>
      <Suspense fallback={<div className="p-6">Loading profile settings...</div>}>
        <ProfileContent />
      </Suspense>
    // {/* </ProtectedRoute> */}
  );
}