"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
// import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getUserInfo as getServerUserInfo } from "@/lib/utils/cookies";

// Define proper TypeScript interfaces
interface UserInfo {
  name: string;
}

interface FeatureCardProps {
  title: string;
  isActive: boolean;
  imageUrl: string;
  subtitle?: string;
  link: string;
  onClick: (link: string, isActive: boolean) => void;
}
  
interface UnlockedFeaturesProps {
  activeTabFeatures: Feature[];
  onFeatureClick: (link: string, isActive: boolean) => void;
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
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: "" });
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const router = useRouter();

  useEffect(() => {
    // Try to get user info from cookies first
    try {
      const cookieInfo = getServerUserInfo();
      if (cookieInfo && cookieInfo.name) {
        setUserInfo({
          name: cookieInfo.name
        });
      } else {
        // Fallback to localStorage if cookie info doesn't have name
        const localInfo = getLocalUserInfo();
        setUserInfo({
          name: localInfo.name
        });
      }
    } catch (error) {
      console.log("Error getting user info from cookies, falling back to localStorage");
      // Fallback to localStorage
      const localInfo = getLocalUserInfo();
      setUserInfo({
        name: localInfo.name
      });
    }
    
    // Get active category from localStorage (set by Sidebar)
    const savedCategory = localStorage.getItem('activeCategory');
    if (savedCategory) {
      setActiveTab(savedCategory);
    }
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
      // Show a message or modal that this feature is not available
      alert("This feature is currently unavailable. Please upgrade to access it.");
    }
  };

  // Get features for the active tab with required state
  const getActiveTabFeatures = (): Feature[] => {
    // These are the only features that should be ON by default
    const alwaysActiveFeatures = {
      "professional-mail": ["dashboard", "tools"].includes(activeTab),
      "task-manager": ["dashboard", "tools"].includes(activeTab),
      "google-ads": ["dashboard", "advertising"].includes(activeTab),
      "sms": ["dashboard", "marketing"].includes(activeTab),
      "dashboard-overview": activeTab === "dashboard",
      "website-builder": false,
      "mass-mailing": false,
      "intern-messages": false,
      "analytics": false,
      "facebook-ads": false,
      "linkedin-ads": false,
      "crm": false,
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
                <p className="text-gray-200">Good Morning,</p>
                <h2 className="text-3xl font-bold">{userInfo.name}</h2>
              </div>
              <div className="sm:absolute sm:right-5 sm:bottom-5 w-full sm:w-64 bg-white/20 backdrop-blur-sm rounded-lg p-3 mt-4 sm:mt-0">
                <p className="text-xs text-gray-100">Quote of the day</p>
                <p className="text-sm font-medium">
                  "Either you run the day, or the day runs you"
                </p>
                <p className="text-xs text-gray-200 mt-1">Jim Rohn</p>
              </div>
            </div>
          </div>

          {/* Unlocked Features Section - Shows features based on selected sidebar category */}
          <UnlockedFeatures 
            activeTabFeatures={getActiveTabFeatures()} 
            onFeatureClick={handleFeatureClick}
          />

          {/* Statistics Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">STATISTICS</h3>
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <div className="flex justify-center items-center">
                <Image
                  src="/assets/Statistics-image.png"
                  alt="No statistics yet"
                  width={200}
                  height={200}
                />
              </div>
              <p className="text-lg font-medium mt-2">No statistics yet !</p>
            </div>
          </div>
        </div>

        {/* Right Section (1 column) */}
        <div className="lg:col-span-1">
          {/* Unlock Level Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 justify-center">
            {/* Semi-circular Progress Gauge */}
            <div className="flex justify-center items-center mb-4">
              <Image
                src="/assets/semi-circle-chart.png"
                alt="Connect emails"
                width={250}
                height={250}
              />
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold">Unlock level 2</h3>
            </div>

            {/* Features List */}
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
                <span className="text-gray-700">Collaborative messaging</span>
              </li>
              <li className="flex items-center">
                <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
                <span className="text-gray-700">Customer Relationship Manager (CRM)</span>
              </li>
            </ul>

            {/* Button */}
            <button className="w-full py-3 bg-gray-100 text-gray-800 rounded-lg text-center font-medium">
              Invite team members
            </button>
          </div>

          {/* Email Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 text-center">EMAILS</h3>

            {/* Made buttons responsive and flex-wrap to prevent overflow */}
            <div className="flex justify-center flex-wrap gap-2 mb-6">
              <button className="py-2 px-4 bg-gray-100 text-gray-800 rounded-lg">Personal</button>
              <button className="py-2 px-4 bg-blue-600 text-white rounded-lg">Professional</button>
            </div>

            <div className="flex justify-center p-6">
              <div className="text-center">
                <Image
                  src="/assets/email-image.png"
                  alt="Connect emails"
                  width={150}
                  height={150}
                />
                <p className="mt-4 text-sm font-medium">Connect your email pro</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    // </ProtectedRoute>
  );
};

// Feature Card Component using shadcn Switch
const FeatureCard: React.FC<FeatureCardProps> = ({ title, isActive, imageUrl, link, onClick }) => {
  const handleClick = () => {
    onClick(link, isActive);
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-100 p-4 transition-all duration-200 ${isActive ? 'cursor-pointer hover:shadow-md' : 'opacity-75'}`}
      onClick={handleClick}
    >
      {/* Top section with toggle */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">{isActive ? "ON" : "OFF"}</span>
        <Switch checked={isActive} />
      </div>

      {/* Center icon */}
      <div className="flex justify-center items-center my-6">
        <Image
          src={imageUrl}
          alt={title}
          width={40}
          height={40}
        />
      </div>

      {/* Title at bottom */}
      <div className="text-center">
        <h4 className="text-sm font-medium text-gray-800">{title}</h4>
      </div>
    </div>
  );
};

// Unlocked Features Component
const UnlockedFeatures: React.FC<UnlockedFeaturesProps> = ({ activeTabFeatures, onFeatureClick }) => {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">UNLOCKED FEATURES</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {activeTabFeatures.map((feature) => (
          <FeatureCard
            key={feature.id}
            title={feature.title}
            isActive={feature.isActive}
            imageUrl={feature.imageUrl}
            subtitle={feature.subtitle}
            link={feature.link}
            onClick={onFeatureClick}
          />
        ))}
        {activeTabFeatures.length === 0 && (
          <div className="col-span-full text-center p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No features available for the selected tab</p>
          </div>
        )}
      </div>
    </div>
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
        link: "/dashboard/overview",
        isActive: true
      }
    ]
  },
  {
    id: "marketing",
    label: "Marketing", 
    features: [
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
        link: "/dashboard/mass-mailing",
        isActive: false
      },
      {
        id: "crm",
        title: "CRM",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/crm.png",
        link: "/dashboard/intern-message",
        isActive: false
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
        id: "post-publisher",
        title: "Post Publisher",
        subtitle: "Boost Connections, Drive Sales!",
        imageUrl: "/icons/post-publisher.png",
        link: "/dashboard/post-publisher",
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
        imageUrl: "/icons/online-meeting.png",
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
        link: "/externals/whatsapp",
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
        link: "/externals/chatgpt",
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
        link: "/externals/telegram",
        isActive: true
      }
    ]
  }
];

export default Dashboard;









































// "use client";
// import React, { useState, useEffect } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
// import { getUserInfo } from "@/lib/utils/cookies";
// import { Switch } from "@/components/ui/switch";

// // Define proper TypeScript interfaces
// interface UserInfo {
//   name: string;
// }

// interface FeatureCardProps {
//   title: string;
//   isActive: boolean;
//   imageUrl: string;
//   subtitle?: string;
// }
  
// interface UnlockedFeaturesProps {
//   activeTabFeatures: Feature[];
// }

// interface Feature {
//   id: string;
//   title: string;
//   subtitle: string;
//   imageUrl: string;
//   link: string;
//   isActive: boolean;
// }

// // Define the Tab interface to fix TypeScript errors
// interface Tab {
//   id: string;
//   label: string;
//   features: Feature[];
// }

// const Dashboard: React.FC = () => {
//   const [userInfo, setUserInfo] = useState<UserInfo>({ name: "" });
//   const [activeTab, setActiveTab] = useState<string>("dashboard");

//   useEffect(() => {
//     const cookieInfo = getUserInfo();
//     setUserInfo({
//       name: cookieInfo.name || "User",
//     });
    
//     // Get active category from localStorage (set by Sidebar)
//     const savedCategory = localStorage.getItem('activeCategory');
//     if (savedCategory) {
//       setActiveTab(savedCategory);
//     }
//   }, []);

//   // Listen for changes to activeCategory in localStorage
//   useEffect(() => {
//     const handleStorageChange = () => {
//       const savedCategory = localStorage.getItem('activeCategory');
//       if (savedCategory) {
//         setActiveTab(savedCategory);
//       }
//     };

//     // Check for activeCategory changes
//     window.addEventListener('storage', handleStorageChange);
    
//     return () => {
//       window.removeEventListener('storage', handleStorageChange);
//     };
//   }, []);

//   // Get features for the active tab
//   const getActiveTabFeatures = (): Feature[] => {
//     const activeTabData = exampleData.find(tab => tab.id === activeTab);
//     return activeTabData ? activeTabData.features : [];
//   };

//   return (
//     // <ProtectedRoute>
//       <div className="p-6 min-h-screen bg-white overflow-hidden overflow-y-auto">
//         {/* App Title */}
//         <h1 className="text-2xl font-bold text-gray-900 mb-4">The everything app for work !</h1>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Left Section (2 columns) */}
//           <div className="lg:col-span-2">
//             {/* Welcome Banner with Image and Quote */}
//             <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-gray-800 to-gray-700 mb-6 min-h-[10rem] sm:h-40 md:h-48">
//               <div className="absolute inset-0">
//                 <Image
//                   src="/assets/banner-image.png"
//                   alt="People selfie"
//                   fill
//                   className="object-cover opacity-60"
//                 />
//               </div>
//               <div className="relative p-5 text-white z-10 h-full flex flex-col justify-between">
//                 <div>
//                   <p className="text-gray-200">Good Morning,</p>
//                   <h2 className="text-3xl font-bold">{userInfo.name}</h2>
//                 </div>
//                 <div className="sm:absolute sm:right-5 sm:bottom-5 w-full sm:w-64 bg-white/20 backdrop-blur-sm rounded-lg p-3 mt-4 sm:mt-0">
//                   <p className="text-xs text-gray-100">Quote of the day</p>
//                   <p className="text-sm font-medium">
//                     "Either you run the day, or the day runs you"
//                   </p>
//                   <p className="text-xs text-gray-200 mt-1">Jim Rohn</p>
//                 </div>
//               </div>
//             </div>

//             {/* Unlocked Features Section - Shows features based on selected sidebar category */}
//             <UnlockedFeatures activeTabFeatures={getActiveTabFeatures()} />

//             {/* Statistics Section */}
//             <div>
//               <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">STATISTICS</h3>
//               <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
//                 <div className="flex justify-center items-center">
//                   <Image
//                     src="/assets/Statistics-image.png"
//                     alt="No statistics yet"
//                     width={200}
//                     height={200}
//                   />
//                 </div>
//                 <p className="text-lg font-medium mt-2">No statistics yet !</p>
//               </div>
//             </div>
//           </div>

//           {/* Right Section (1 column) */}
//           <div className="lg:col-span-1">
//             {/* Unlock Level Card */}
//             <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 justify-center">
//               {/* Semi-circular Progress Gauge */}
//               <div className="flex justify-center items-center mb-4">
//                 <Image
//                   src="/assets/semi-circle-chart.png"
//                   alt="Connect emails"
//                   width={250}
//                   height={250}
//                 />
//               </div>

//               {/* Title */}
//               <div className="text-center mb-6">
//                 <h3 className="text-2xl font-bold">Unlock level 2</h3>
//               </div>

//               {/* Features List */}
//               <ul className="space-y-4 mb-8">
//                 <li className="flex items-center">
//                   <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
//                   <span className="text-gray-700">Collaborative messaging</span>
//                 </li>
//                 <li className="flex items-center">
//                   <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
//                   <span className="text-gray-700">Customer Relationship Manager (CRM)</span>
//                 </li>
//               </ul>

//               {/* Button */}
//               <button className="w-full py-3 bg-gray-100 text-gray-800 rounded-lg text-center font-medium">
//                 Invite team members
//               </button>
//             </div>

//             {/* Email Section */}
//             <div className="bg-white rounded-lg border border-gray-200 p-6">
//               <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 text-center">EMAILS</h3>

//               {/* Made buttons responsive and flex-wrap to prevent overflow */}
//               <div className="flex justify-center flex-wrap gap-2 mb-6">
//                 <button className="py-2 px-4 bg-gray-100 text-gray-800 rounded-lg">Personal</button>
//                 <button className="py-2 px-4 bg-blue-600 text-white rounded-lg">Professional</button>
//               </div>

//               <div className="flex justify-center p-6">
//                 <div className="text-center">
//                   <Image
//                     src="/assets/email-image.png"
//                     alt="Connect emails"
//                     width={150}
//                     height={150}
//                   />
//                   <p className="mt-4 text-sm font-medium">Connect your email pro</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     // {/* </ProtectedRoute> */}
//   );
// };

// // Feature Card Component using shadcn Switch
// const FeatureCard: React.FC<FeatureCardProps> = ({ title, isActive, imageUrl }) => {
//   // Update the status as per request: Professional Emails ON, Intern Messages OFF
//   const overrideStatus = (): boolean => {
//     if (title === "Professional Emails") return true;
//     if (title === "Intern Messages") return false;
//     return isActive;
//   };

//   const currentActive = overrideStatus();

//   return (
//     <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
//       {/* Top section with toggle */}
//       <div className="flex justify-between items-center mb-4">
//         <span className="text-sm text-gray-500">{currentActive ? "ON" : "OFF"}</span>
//         <Switch checked={currentActive} />
//       </div>

//       {/* Center icon */}
//       <div className="flex justify-center items-center my-6">
//         <Image
//           src={imageUrl}
//           alt={title}
//           width={40}
//           height={40}
//         />
//       </div>

//       {/* Title at bottom */}
//       <div className="text-center">
//         <h4 className="text-sm font-medium text-gray-800">{title}</h4>
//       </div>
//     </div>
//   );
// };

// // Unlocked Features Component
// const UnlockedFeatures: React.FC<UnlockedFeaturesProps> = ({ activeTabFeatures }) => {
//   return (
//     <div className="mb-6">
//       <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">UNLOCKED FEATURES</h3>

//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//         {activeTabFeatures.map((feature) => (
//           <FeatureCard
//             key={feature.id}
//             title={feature.title}
//             isActive={feature.isActive}
//             imageUrl={feature.imageUrl}
//             subtitle={feature.subtitle}
//           />
//         ))}
//         {activeTabFeatures.length === 0 && (
//           <div className="col-span-full text-center p-6 bg-gray-50 rounded-lg">
//             <p className="text-gray-500">No features available for the selected tab</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // Example data with expanded categories that match sidebar items
// const exampleData: Tab[] = [
//   {
//     id: "dashboard",
//     label: "Dashboard",
//     features: [
//       {
//         id: "dashboard-overview",
//         title: "Dashboard Overview",
//         subtitle: "View all your stats",
//         imageUrl: "/icons/dashboardnew.png",
//         link: "/dashboard/overview",
//         isActive: true
//       }
//     ]
//   },
//   {
//     id: "marketing",
//     label: "Marketing", 
//     features: [
//       {
//         id: "professional-mail",
//         title: "Professional Emails",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/online-meeting.png",
//         link: "/dashboard/professional-mail",
//         isActive: false
//       },
//       {
//         id: "mass-mailing",
//         title: "Mass Mailing",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/mass-mailing.png",
//         link: "/dashboard/mass-mailing",
//         isActive: true
//       },
//       {
//         id: "task-manager",
//         title: "Task Manager",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/task-manager.png",
//         link: "/dashboard/task-manager",
//         isActive: true
//       },
//       {
//         id: "crm",
//         title: "CRM",
//         subtitle: "Manage your customers",
//         imageUrl: "/icons/crm.png",
//         link: "/marketing/crm",
//         isActive: false
//       },
//     ]
//   },
//   {
//     id: "tools",
//     label: "Tools",
//     features: [
//       {
//         id: "professional-mail",
//         title: "Professional Emails",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/online-meeting.png",
//         link: "/dashboard/professional-mail",
//         isActive: false
//       },
//       {
//         id: "task-manager",
//         title: "Task Manager",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/task-manager.png",
//         link: "/dashboard/task-manager",
//         isActive: true
//       },
//       {
//         id: "intern-messages",
//         title: "Intern Messages",
//         subtitle: "Internal Communication",
//         imageUrl: "/icons/internal-message.png",
//         link: "/dashboard/intern-messages",
//         isActive: true
//       },
//       {
//         id: "website-builder",
//         title: "Website Builder",
//         subtitle: "Create your own website",
//         imageUrl: "/icons/website-builder.png",
//         link: "/tools/website-builder", 
//         isActive: true
//       },
//       {
//         id: "analytics",
//         title: "Analytics",
//         subtitle: "Track your performance",
//         imageUrl: "/icons/analytics.png",
//         link: "/tools/analytics",
//         isActive: false
//       }
//     ],
//   },
//   {
//     id: "advertising",
//     label: "Advertising",
//     features: [
//       {
//         id: "google-ads",
//         title: "Google Ads",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/google-ads.png",
//         link: "/dashboard/google-ads",
//         isActive: true
//       },
//       {
//         id: "facebook-ads",
//         title: "Facebook Ads",
//         subtitle: "Reach your audience on Facebook",
//         imageUrl: "/icons/facebook-ads.png",
//         link: "/advertising/facebook",
//         isActive: false
//       },
//       {
//         id: "linkedin-ads",
//         title: "LinkedIn Ads",
//         subtitle: "Professional advertising",
//         imageUrl: "/icons/linkedin-ads.png",
//         link: "/advertising/linkedin",
//         isActive: true
//       }
//     ],
//   },
//   {
//     id: "whatsapp",
//     label: "Whatsapp",
//     features: [
//       {
//         id: "whatsapp-messaging",
//         title: "WhatsApp Messaging",
//         subtitle: "Connect with customers",
//         imageUrl: "/icons/whatsapp.png",
//         link: "/externals/whatsapp",
//         isActive: true
//       }
//     ]
//   },
//   {
//     id: "chatgpt",
//     label: "ChatGPT", 
//     features: [
//       {
//         id: "chatgpt-assistant",
//         title: "ChatGPT Assistant",
//         subtitle: "AI-powered assistance",
//         imageUrl: "/icons/chatgpt.png",
//         link: "/externals/chatgpt",
//         isActive: true
//       }
//     ]
//   },
//   {
//     id: "telegram",
//     label: "Telegram",
//     features: [
//       {
//         id: "telegram-messaging",
//         title: "Telegram Messaging",
//         subtitle: "Secure communication",
//         imageUrl: "/icons/telegram.png", 
//         link: "/externals/telegram",
//         isActive: true
//       }
//     ]
//   }
// ];

// export default Dashboard;











































// "use client";
// import React, { useState, useEffect } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import { Tab } from "@/lib/interfaces/Dashboard/types";
// import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
// import { getUserInfo } from "@/lib/utils/cookies";

// const Dashboard = () => {
//   const [userInfo, setUserInfo] = useState({ name: "" });
//   const [activeTab, setActiveTab] = useState("tools");

//   useEffect(() => {
//     const cookieInfo = getUserInfo();
//     setUserInfo({
//       name: cookieInfo.name || "User",
//     });
//   }, []);

//   return (
//     <ProtectedRoute>
//       <div className="p-6 min-h-screen bg-white overflow-hidden overflow-y-auto">
//         {/* App Title */}
//         <h1 className="text-2xl font-bold text-gray-900 mb-4">The everything app for work !</h1>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Left Section (2 columns) */}
//           <div className="lg:col-span-2">
//             {/* Welcome Banner with Image and Quote */}
//             <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-gray-800 to-gray-700 mb-6 h-40">
//               <div className="absolute inset-0">
//                 <Image
//                   src="/assets/banner-image.png"
//                   alt="People selfie"
//                   fill
//                   className="object-cover opacity-60"
//                 />
//               </div>
//               <div className="relative p-5 text-white z-10 h-full flex flex-col justify-between">
//                 <div>
//                   <p className="text-gray-200">Good Morning,</p>
//                   <h2 className="text-3xl font-bold">{userInfo.name}</h2>
//                 </div>
//                 <div className="absolute right-5 bottom-5 w-64 bg-white/20 backdrop-blur-sm rounded-lg p-3">
//                   <p className="text-xs text-gray-100">Quote of the day</p>
//                   <p className="text-sm font-medium">
//                     "Either you run the day, or the day runs you"
//                   </p>
//                   <p className="text-xs text-gray-200 mt-1">Jim Rohn</p>
//                 </div>
//               </div>
//             </div>

//             {/* Unlocked Features */}
//             <div className="mb-6">
//               <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">UNLOCKED FEATURES</h3>

//               <div className="grid grid-cols-4 gap-4">
//                 <FeatureCard
//                   title="Google Ad"
//                   isActive={true}
//                   iconColor="bg-green-500"
//                   iconBorderColor="border-green-200"
//                 />
//                 <FeatureCard
//                   title="Professional Emails"
//                   isActive={false}
//                   iconColor="bg-gray-300"
//                   iconBorderColor="border-gray-200"
//                 />
//                 <FeatureCard
//                   title="Task Manager"
//                   isActive={true}
//                   iconColor="bg-orange-500"
//                   iconBorderColor="border-orange-200"
//                 />
//                 <FeatureCard
//                   title="Intern Messages"
//                   isActive={true}
//                   iconColor="bg-purple-500"
//                   iconBorderColor="border-purple-200"
//                 />
//               </div>
//             </div>

//             {/* Statistics Section */}
//             <div>
//               <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">STATISTICS</h3>
//               <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
//                 <div className="flex justify-center items-center">
//                   <Image
//                     src="/assets/Statistics-image.png"
//                     alt="No statistics yet"
//                     width={200}
//                     height={200}
//                   />
//                 </div>
//                 <p className="text-lg font-medium mt-2">No statistics yet !</p>
//               </div>
//             </div>
//           </div>

//           {/* Right Section (1 column) */}
//           <div className="lg:col-span-1">
//             {/* Unlock Level Card */}
//             <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 justify-center">
//               {/* Semi-circular Progress Gauge */}
//               <div className="flex justify-center items-center mb-4">
//                 <Image
//                   src="/assets/semi-circle-chart.png"
//                   alt="Connect emails"
//                   width={250}
//                   height={250}
//                 />
//               </div>


//               {/* Title */}
//               <div className="text-center mb-6">
//                 <h3 className="text-2xl font-bold">Unlock level 2</h3>
//               </div>

//               {/* Features List */}
//               <ul className="space-y-4 mb-8">
//                 <li className="flex items-center">
//                   <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
//                   <span className="text-gray-700">Collaborative messaging</span>
//                 </li>
//                 <li className="flex items-center">
//                   <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
//                   <span className="text-gray-700">Customer Relationship Manager (CRM)</span>
//                 </li>
//               </ul>

//               {/* Button */}
//               <button className="w-full py-3 bg-gray-100 text-gray-800 rounded-lg text-center font-medium">
//                 Invite team members
//               </button>
//             </div>

//             {/* Email Section */}
//             <div className="bg-white rounded-lg border border-gray-200 p-6">
//               <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">EMAILS</h3>

//               <div className="flex space-x-2 mb-6">
//                 <button className="py-2 px-4 bg-gray-100 text-gray-800 rounded-lg">Personal</button>
//                 <button className="py-2 px-4 bg-blue-600 text-white rounded-lg">Professional</button>
//               </div>

//               <div className="flex justify-center p-6">
//                 <div className="text-center">
//                   <Image
//                     src="/assets/email-image.png"
//                     alt="Connect emails"
//                     width={150}
//                     height={150}
//                   />
//                   <p className="mt-4 text-sm font-medium">Connect your email pro</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </ProtectedRoute>
//   );
// };

// // Feature Card Component
// const FeatureCard = ({ title, isActive, iconColor, iconBorderColor }) => {
//   return (
//     <div className="border border-gray-200 rounded-lg p-4 flex flex-col items-center bg-white">
//       <div className={`mb-2 w-12 h-12 flex items-center justify-center border-2 ${iconBorderColor} rounded-md`}>
//         <div className={`w-4 h-4 ${iconColor}`}></div>
//       </div>
//       <p className="text-sm font-medium text-center text-gray-800 mb-3">{title}</p>
//       <div className="flex items-center">
//         <div className="mr-2 w-8 h-4 rounded-full bg-gray-200 relative">
//           <div className={`absolute inset-0 w-4 h-4 rounded-full ${isActive ? 'bg-blue-600 translate-x-4' : 'bg-gray-400'} transition-all`}></div>
//         </div>
//         <span className="text-xs text-gray-500">{isActive ? 'ON' : 'OFF'}</span>
//       </div>
//     </div>
//   );
// };

// // Your existing example data
// const exampleData: Tab[] = [
//   {
//     id: "martech",
//     label: "Marketing",
//     features: [
//       {
//         id: "mass-mailing",
//         title: "Mass Mailing",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/mass-mailing.png",
//         link: "/dashboard/mass-mailing",
//       },
//       // Other marketing features...
//     ],
//   },
//   {
//     id: "tools",
//     label: "Tools",
//     features: [
//       {
//         id: "professional-mail",
//         title: "Professional Mail",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/online-meeting.png",
//         link: "/dashboard/professional-mail",
//       },
//       {
//         id: "task-manager",
//         title: "Task Manager",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/task-manager.png",
//         link: "/dashboard/task-manager",
//       },
//       // Other tool features...
//     ],
//   },
//   {
//     id: "adtech",
//     label: "Advertising",
//     features: [
//       {
//         id: "google-ads",
//         title: "Google Ad",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/google-ads.png",
//         link: "/dashboard/google-ads",
//       },
//       // Other advertising features...
//     ],
//   },
// ];

// export default Dashboard;
































// {/* <div className="flex justify-center mb-8">
//   <svg width="200" height="100" viewBox="0 0 200 100">
//     {/* Background arc */}
//     <path
//       d="M10,90 A90,90 0 0,1 190,90"
//       fill="none"
//       stroke="#f0f0f0"
//       strokeWidth="12"
//       strokeLinecap="round"
//     />

//     {/* Progress arc - blue section */}
//     <path
//       d="M10,90 A90,90 0 0,1 50,15"
//       fill="none"
//       stroke="#3b82f6"
//       strokeWidth="12"
//       strokeLinecap="round"
//     />

//     {/* Progress arc - yellow section */}
//     <path
//       d="M50,15 A90,90 0 0,1 95,5"
//       fill="none"
//       stroke="#eab308"
//       strokeWidth="12"
//       strokeLinecap="round"
//     />

//     {/* Progress arc - green section */}
//     <path
//       d="M95,5 A90,90 0 0,1 190,90"
//       fill="none"
//       stroke="#22c55e"
//       strokeWidth="12"
//       strokeLinecap="round"
//     />

//     {/* Divider lines */}
//     <line x1="50" y1="15" x2="45" y2="8" stroke="white" strokeWidth="2" />
//     <line x1="95" y1="5" x2="95" y2="-2" stroke="white" strokeWidth="2" />
//   </svg>
// </div> */}













// "use client";
// import React, { useState, useEffect } from "react";
// // import DashboardEmailList from "@/components/Dashboard/DashboardEmailComp";
// // import DashboardMessageList from "@/components/Dashboard/DirectMessagingComp";
// // import FavoritesCard from "@/components/Dashboard/FavoritesCard";
// import FeatureCarousel from "@/components/Dashboard/featureCarousel";
// // import DashboardPollCard from "@/components/Dashboard/PollingCard";
// import { Tab } from "@/lib/interfaces/Dashboard/types";
// import FavoritesCard2 from "@/components/Dashboard/FavoritesCard2";
// import EmailOnlineMessaging from "@/components/Dashboard/EmailOnlineMessaging";
// import { PollingCard2 } from "@/components/Dashboard/PollingCard2";
// import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
// import { getUserInfo, clearAuthCookies } from "@/lib/utils/cookies";



// const Dashboard = () => {
//   const [userInfo, setUserInfo] = useState({ name: ""});
//   const [pollData, setPollData] = useState({
//     title: "Vote for the Next Feature",
//     options: [
//       { id: "e-sign", label: "E-Sign", votes: 50 },
//       { id: "image-editor", label: "Image Editor", votes: 70 },
//       { id: "ai-calling", label: "AI Calling", votes: 40 },
//       { id: "crm", label: "CRM", votes: 30 },
//     ],
//   });

//   const handleVote = (optionId: string) => {
//     setPollData((prev) => ({
//       ...prev,
//       options: prev.options.map((option) =>
//         option.id === optionId ? { ...option, votes: option.votes + 1 } : option
//       ),
//     }));
//   };

//   // Load user info from cookies on component mount
//     useEffect(() => {
//       const cookieInfo = getUserInfo();
//       setUserInfo({
//         name: cookieInfo.name || "User",
//       });
//     }, []);

//   return (
//     <ProtectedRoute>
//       <div className="p-6 min-h-screen overflow-hidden overflow-y-auto transition-all duration-300">
//         {/* Welcome banner */}
//         <div className="bg-gradient-to-r from-teal-500 to-teal-700 text-white p-8 rounded-xl mb-8 mt-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
//           <div>
//             <h1 className="text-2xl font-medium">Welcome {userInfo.name}</h1>
//             <p>We are here to help you</p>
//           </div>
//           {/* Polling Card */}
//           <PollingCard2 options={pollData.options} />
//         </div>

//         {/* Main content grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//           {/* Left Section (Expanded) */}
//           <div className="lg:col-span-2 flex flex-col gap-4">
//             <FavoritesCard2 className="" />
//             <FeatureCarousel
//               tabs={exampleData}
//               className="shadow-md border border-gray-200 rounded-xl overflow-hidden"
//             />
//           </div>

//           {/* Right Section */}
//           <div className="col-span-1 lg:col-span-1 w-full min-w-0">
//             <EmailOnlineMessaging className="w-full" />
//           </div>
//         </div>
//       </div>
//     </ProtectedRoute>
//   );
// };

// export default Dashboard;





// Feature cards list

// const exampleData: Tab[] = [
//   {
//     id: "martech",
//     label: "Marketing",
//     features: [
//       {
//         id: "mass-mailing",
//         title: "Mass Mailing",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/mass-mailing.png",
//         link: "/dashboard/mass-mailing",
//       },
//       {
//         id: "crm",
//         title: "CRM",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/crm.png",
//         link: "/dashboard/intern-message",
//       },
//       {
//         id: "social-listening",
//         title: "Social Listening",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/social.png",
//         link: "/dashboard/social-listening",
//       },
//       {
//         id: "post-publisher",
//         title: "Post Publisher",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/post-publisher.png",
//         link: "/dashboard/post-publisher",
//       },
//       {
//         id: "ai-calling",
//         title: "AI Calling",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/ai-calling.png",
//         link: "/dashboard/ai-calling",
//       },
//       {
//         id: "sms",
//         title: "SMS",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/sms.png",
//         link: "/dashboard/sms",
//       },
//     ],
//   },
//   {
//     id: "tools",
//     label: "Tools",
//     features: [
//       {
//         id: "professional-mail",
//         title: "Professional Mail",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/online-meeting.png",
//         link: "/dashboard/professional-mail",
//       },
//       {
//         id: "website-builder",
//         title: "Website Builder",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/website-builder.png",
//         link: "/dashboard/website-builder",
//       },
//       {
//         id: "internal-message",
//         title: "Internal Message",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/internal-message.png",
//         link: "/dashboard/messaging",
//       },
//       {
//         id: "online-meeting",
//         title: "Online Meeting",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/online-meeting.png",
//         link: "/dashboard/online-message",
//       },
//       {
//         id: "e-sign",
//         title: "E-Sign",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/e-sign.png",
//         link: "/dashboard/e-sign",
//       },
//       {
//         id: "task-manager",
//         title: "Task Manager",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/task-manager.png",
//         link: "/dashboard/task-manager",
//       },
//       {
//         id: "image-editor",
//         title: "Image Editor",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/image-editor.png",
//         link: "/dashboard/image-editor",
//       },
//     ],
//   },
//   {
//     id: "adtech",
//     label: "Advertising",
//     features: [
//       {
//         id: "google-ads",
//         title: "Google Ads",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/google-ads.png",
//         link: "/dashboard/google-ads",
//       },
//       {
//         id: "Meta",
//         title: "Meta",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/meta.png",
//         link: "/dashboard/meta",
//       },
//       {
//         id: "twitter",
//         title: "Twitter",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/twitter.png",
//         link: "/dashboard/twitter",
//       },
//       {
//         id: "tiktok",
//         title: "Tiktok",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/tiktok.png",
//         link: "/dashboard/tiktok",
//       },
//       {
//         id: "linkedIn",
//         title: "LinkedIn",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/linkedin.png",
//         link: "/dashboard/linkedin",
//       },
//       {
//         id: "spotify",
//         title: "Spotify",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/spotify.png",
//         link: "/dashboard/spotify",
//       },
//     ],
//   },
// ];
