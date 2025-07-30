"use client";
import React, { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UnlockedFeatures } from "@/components/Dashboard/UnlockedFeatures";
import { UnlockLevelCard } from "@/components/Dashboard/UnlockLevelCard";
import { EmailSection } from "@/components/Dashboard/EmailSection";
import { StatisticsSection } from "@/components/Dashboard/StatisticsSection";
import { FeatureUnavailableModal } from "@/components/Dashboard/FeatureUnavailableModal";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthContext } from "@/lib/context/auth";

// Define proper TypeScript interfaces
interface UserInfo {
  name: string;
}

interface Feature {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
}

// Define the Tab interface to fix TypeScript errors
interface Tab {
  id: string;
  label: string;
  features: Feature[];
}

// Quotes collection for rotation
const quotes = [
  { text: "Either you run the day, or the day runs you", author: "Jim Rohn" },
  { text: "The future belongs to those who believe in the beauty of their dreams", author: "Eleanor Roosevelt" },
  { text: "The best way to predict the future is to create it", author: "Peter Drucker" },
  { text: "The only way to do great work is to love what you do", author: "Steve Jobs" },
  { text: "Strive not to be a success, but rather to be of value", author: "Albert Einstein" },
  { text: "Don't watch the clock; do what it does. Keep going", author: "Sam Levenson" },
  { text: "The harder I work, the luckier I get", author: "Samuel Goldwyn" },
  { text: "Success is not final, failure is not fatal: It is the courage to continue that counts", author: "Winston Churchill" },
  { text: "Believe you can and you're halfway there", author: "Theodore Roosevelt" },
  { text: "Your time is limited, don't waste it living someone else's life", author: "Steve Jobs" }
];

// Get time-based greeting
const getTimeBasedGreeting = (): string => {
  const hours = new Date().getHours();
  
  if (hours >= 5 && hours < 12) {
    return "Good Morning";
  } else if (hours >= 12 && hours < 18) {
    return "Good Afternoon";
  } else {
    return "Good Evening";
  }
};

// Get random quote that changes daily
const getDailyQuote = (): typeof quotes[0] => {
  // Use the date to seed the quote selection so it's consistent for the day
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const quoteIndex = dayOfYear % quotes.length;
  
  return quotes[quoteIndex];
};

// Local function to get user info from localStorage
const getLocalUserInfo = (): UserInfo => {
  // Only execute on client-side
  if (typeof window !== 'undefined') {
    const storedName = localStorage.getItem('userName');
    return { name: storedName || "User" };
  }
  return { name: "User" };
};

const Dashboard: React.FC = () => {
  // const [userInfo, setUserInfo] = useState<UserInfo>({ name: "" });
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [greeting, setGreeting] = useState<string>("Good Day");
  const [quote, setQuote] = useState<typeof quotes[0]>(quotes[0]);
  const router = useRouter();
  const {user: userInfo} = useContext(AuthContext);

  useEffect(() => {
    // Initialize time-based greeting and daily quote
    setGreeting(getTimeBasedGreeting());
    setQuote(getDailyQuote());
    
    // Try to get user info from cookies first
    // try {
    //   const cookieInfo = getServerUserInfo();
    //   if (cookieInfo && cookieInfo.name) {
    //     setUserInfo({
    //       name: cookieInfo.name
    //     });
    //   } else {
    //     // Fallback to localStorage if cookie info doesn't have name
    //     const localInfo = getLocalUserInfo();
    //     setUserInfo({
    //       name: localInfo.name
    //     });
    //   }
    // } catch (error) {
    //   console.log("Error getting user info from cookies, falling back to localStorage");
    //   // Fallback to localStorage
    //   const localInfo = getLocalUserInfo();
    //   setUserInfo({
    //     name: localInfo.name
    //   });
    // }
    
    // Get active category from localStorage (set by Sidebar)
    const savedCategory = localStorage.getItem('activeCategory');
    if (savedCategory) {
      setActiveTab(savedCategory);
    }

    // Update greeting based on time every minute
    const intervalId = setInterval(() => {
      setGreeting(getTimeBasedGreeting());
    }, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, []);

  // Listen for changes to activeCategory in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCategory = localStorage.getItem('activeCategory');
      if (savedCategory) {
        setActiveTab(savedCategory);
      }
    };

    // Check for activeCategory changes
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Handle feature card clicks
  const handleFeatureClick = (link: string, isActive: boolean) => {
    if (isActive) {
      router.push(link);
    } else {
      // Show modal instead of alert
      setModalOpen(true);
    }
  };

  // Get features for the active tab with required state
  const getActiveTabFeatures = (): Feature[] => {
    // These are the only features that should be ON by default
    const alwaysActiveFeatures = {
      "professional-mail": ["dashboard", "tools"].includes(activeTab),
      "task-manager": ["dashboard", "tools"].includes(activeTab),
      "google-ads": ["dashboard", "advertising"].includes(activeTab),
      "dashboard-overview": activeTab === "dashboard",
      "post-publisher": activeTab === "marketing",
      "crm": true,
      "invoice": true,
      "note": true,
      "sms": ["dashboard", "advertising"].includes(activeTab),
      "website-builder": false,
      "mass-mailing": ["dashboard", "advertising"].includes(activeTab),
      "intern-messages": false,
      "analytics": false,
      "facebook-ads": false,
      "linkedin-ads": false,
      "whatsapp-messaging": activeTab === "whatsapp",
      "chatgpt-assistant": activeTab === "chatgpt",
      "telegram-messaging": activeTab === "telegram"
    };

    // Get all features for the current tab
    const currentTabFeatures = exampleData.find(tab => tab.id === activeTab)?.features || [];
    
    // For dashboard, we want to show specific items from different categories
    if (activeTab === "dashboard") {
      return [
        // Find the professional email feature
        ...exampleData.flatMap(tab => 
          tab.features.filter(feature => 
            ["professional-mail", "task-manager", "google-ads"].includes(feature.id)
          )
        )
      ].map(feature => ({
        ...feature,
        isActive: !!alwaysActiveFeatures[feature.id as keyof typeof alwaysActiveFeatures]
      }));
    }
    
    // For other tabs, show their own features with correct active states
    return currentTabFeatures.map(feature => ({
      ...feature,
      isActive: !!alwaysActiveFeatures[feature.id as keyof typeof alwaysActiveFeatures]
    }));
  };

  return (
    // <ProtectedRoute>
    <div className="p-6 min-h-screen bg-white overflow-hidden overflow-y-auto">
      {/* App Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-4">The everything app for work !</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section (2 columns) */}
        <div className="lg:col-span-2">
          {/* Welcome Banner with Image and Quote */}
          <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-gray-800 to-gray-700 mb-6 min-h-[10rem] sm:h-40 md:h-48">
            <div className="absolute inset-0">
              <Image
                src="/assets/banner-image.png"
                alt="People selfie"
                fill
                className="object-cover opacity-60"
              />
            </div>
            <div className="relative p-5 text-white z-10 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl text-gray-200">{greeting},</h3>
                <h2 className="text-3xl font-bold">{userInfo?.first_name}&nbsp;{userInfo?.last_name}</h2>
              </div>
              <div className="sm:absolute sm:right-5 sm:bottom-5 w-full sm:w-64 bg-white/20 backdrop-blur-sm rounded-lg p-3 mt-4 sm:mt-0">
                <p className="text-xs text-gray-100">Quote of the day</p>
                <p className="text-sm font-medium">
                  "{quote.text}"
                </p>
                <p className="text-xs text-gray-200 mt-1">{quote.author}</p>
              </div>
            </div>
          </div>

          {/* Unlocked Features Section - Shows features based on selected sidebar category */}
          <UnlockedFeatures 
            activeTabFeatures={getActiveTabFeatures()} 
            onFeatureClick={handleFeatureClick}
          />

          {/* Statistics Section */}
          <StatisticsSection />
        </div>

        {/* Right Section (1 column) */}
        <div className="lg:col-span-1">
          {/* Unlock Level Card */}
          <UnlockLevelCard />

          {/* Email Section */}
          <EmailSection />
        </div>
      </div>

      {/* Feature Unavailable Modal */}
      <FeatureUnavailableModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
    // </ProtectedRoute>
  );
};

// Example data with expanded categories that match sidebar items
const exampleData: Tab[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    features: [
      {
        id: "dashboard-overview",
        title: "Dashboard Overview",
        subtitle: "View all your stats",
        imageUrl: "/icons/dashboardnew.png",
        link: "/dashboard",
        isActive: true
      }
    ]
  },
  {
    id: "marketing",
    label: "Marketing", 
    features: [
      {
        id: "crm",
        title: "CRM",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/crm.png",
        link: "/dashboard/crm",
        isActive: true
      },
      {
        id: "post-publisher",
        title: "Post Publisher",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/post-publisher.png",
        link: "/dashboard/post-publisher",
        isActive: true
      },
      {
        id: "social-listening",
        title: "Social Listening",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/social.png",
        link: "/dashboard/social-listening",
        isActive: false
      },
      {
        id: "ai-calling",
        title: "AI Calling",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/ai-calling.png",
        link: "/dashboard/ai-calling",
        isActive: false
      },
    ]
  },
  {
    id: "tools",
    label: "Tools",
    features: [
      {
        id: "professional-mail",
        title: "Professional Mail",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/online-meeting.png",
        link: "/dashboard/professional-mail",
        isActive: true
      },
      {
        id: "task-manager",
        title: "Task Manager",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/task-manager.png",
        link: "/dashboard/task-manager",
        isActive: true
      },
      {
        id: "invoice",
        title: "Invoice",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/invoice.png",
        link: "/dashboard/invoices",
        isActive: true
      },
      {
        id: "note",
        title: "Note",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/note.png",
        link: "/dashboard/notes",
        isActive: true
      },
      {
        id: "website-builder",
        title: "Website Builder",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/website-builder.png",
        link: "/dashboard/website-builder",
        isActive: false
      },
      {
        id: "internal-message",
        title: "Internal Message",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/internal-message.png",
        link: "/dashboard/messaging",
        isActive: false
      },
      {
        id: "online-meeting",
        title: "Online Meeting",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/online-meeting2.png",
        link: "/dashboard/online-message",
        isActive: false
      },
      {
        id: "e-sign",
        title: "E-Sign",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/e-sign.png",
        link: "/dashboard/e-sign",
        isActive: false
      },
      {
        id: "image-editor",
        title: "Image Editor",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/image-editor.png",
        link: "/dashboard/image-editor",
        isActive: false
      },
    ],
  },
  {
    id: "advertising",
    label: "Advertising",
    features: [
      {
        id: "google-ads",
        title: "Google Ads",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/google-ads.png",
        link: "/dashboard/google-ads",
        isActive: true
      },
      {
        id: "sms",
        title: "SMS",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/sms.png",
        link: "/dashboard/google-ads",
        isActive: true
      },
      {
        id: "mass-mailing",
        title: "Mass Mailing",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/mass-mailing.png",
        link: "/dashboard/google-ads",
        isActive: false
      },
      {
        id: "Meta",
        title: "Meta",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/meta.png",
        link: "/dashboard/meta",
        isActive: false
      },
      {
        id: "twitter",
        title: "Twitter",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/twitter.png",
        link: "/dashboard/twitter",
        isActive: false
      },
      {
        id: "tiktok",
        title: "Tiktok",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/tiktok.png",
        link: "/dashboard/tiktok",
        isActive: false
      },
      {
        id: "linkedIn",
        title: "LinkedIn",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/linkedin.png",
        link: "/dashboard/linkedin",
        isActive: false
      },
      {
        id: "spotify",
        title: "Spotify",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/spotify.png",
        link: "/dashboard/spotify",
        isActive: false
      },
    ],
  },
  {
    id: "whatsapp",
    label: "Whatsapp",
    features: [
      {
        id: "whatsapp-messaging",
        title: "WhatsApp Messaging",
        subtitle: "Connect with customers",
        imageUrl: "/icons/whatsapp.png",
        link: "/dashboard/whatsapp",
        isActive: true
      }
    ]
  },
  {
    id: "chatgpt",
    label: "ChatGPT", 
    features: [
      {
        id: "chatgpt-assistant",
        title: "ChatGPT Assistant",
        subtitle: "AI-powered assistance",
        imageUrl: "/icons/chatgpt.png",
        link: "/dashboard/chatgpt",
        isActive: true
      }
    ]
  },
  {
    id: "telegram",
    label: "Telegram",
    features: [
      {
        id: "telegram-messaging",
        title: "Telegram Messaging",
        subtitle: "Secure communication",
        imageUrl: "/icons/telegram.png", 
        link: "/dashboard/telegram",
        isActive: true
      }
    ]
  }
];

export default Dashboard;