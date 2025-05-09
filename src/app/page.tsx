"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  const [currentSection, setCurrentSection] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // Initialize refs for each section
  useEffect(() => {
    sectionRefs.current = [
      document.getElementById("landing-section"),
      document.getElementById("tools-section"),
      document.getElementById("footer-section")
    ];

    // Set up scroll event listener
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      // Determine which section is currently in view
      sectionRefs.current.forEach((section, index) => {
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionBottom = sectionTop + section.offsetHeight;

          if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            setCurrentSection(index);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Function to scroll to specific section
  const scrollToSection = (index: number) => {
    const section = sectionRefs.current[index];
    if (section) {
      window.scrollTo({
        top: section.offsetTop,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="flex flex-col font-[family-name:var(--font-geist-sans)]">

      {/* First section - Landing image */}
      <section
        id="landing-section"
        className="min-h-screen flex items-center justify-center relative w-full"
      >
        <Image
          src="/assets/landing.png" // Update this path to match your asset location
          fill
          className="object-cover"
          priority
          alt="Djombi - The everything app for work"
        />
        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center p-8">
          <Image
            src="/icons/djombi-white.png"
            width={700}
            height={200}
            alt="Djombi"
            className="mb-6"
          />
          <p className="text-2xl md:text-3xl text-white max-w-2xl mt-4">
            The everything app for work
          </p>
          <Link href="/dashboard/UserTestDashboard">
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600 text-white mt-12 px-8 py-6 text-lg"
            >
              Try Dashboard
            </Button>
          </Link>
        </div>
      </section>
      
    </div>
  );
}









































// import { Button } from "@/components/ui/button";
// import Link from "next/link";


// //  View Dashboard
// export default function Home() {
//   return (
//     <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
//       <main className="max-w-xl mx-auto flex justify-center items-center">
//         <Link href="/dashboard/UserTestDashboard" passHref>
//           <Button className="bg-emerald-500 text-white">View Dashboard</Button>
//         </Link>
//       </main>
//     </div>
//   );
// }































// "use client";
// import React, { useState, useEffect } from "react";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { getUserInfo as getServerUserInfo } from "@/lib/utils/cookies";
// import { UnlockedFeatures } from "@/components/Dashboard/UnlockedFeatures";
// import { UnlockLevelCard } from "@/components/Dashboard/UnlockLevelCard";
// import { EmailSection } from "@/components/Dashboard/EmailSection";
// import { StatisticsSection } from "@/components/Dashboard/StatisticsSection";
// import { FeatureUnavailableModal } from "@/components/Dashboard/FeatureUnavailableModal";
// import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// // Define proper TypeScript interfaces
// interface UserInfo {
//   name: string;
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

// // Quotes collection for rotation
// const quotes = [
//   { text: "Either you run the day, or the day runs you", author: "Jim Rohn" },
//   { text: "The future belongs to those who believe in the beauty of their dreams", author: "Eleanor Roosevelt" },
//   { text: "The best way to predict the future is to create it", author: "Peter Drucker" },
//   { text: "The only way to do great work is to love what you do", author: "Steve Jobs" },
//   { text: "Strive not to be a success, but rather to be of value", author: "Albert Einstein" },
//   { text: "Don't watch the clock; do what it does. Keep going", author: "Sam Levenson" },
//   { text: "The harder I work, the luckier I get", author: "Samuel Goldwyn" },
//   { text: "Success is not final, failure is not fatal: It is the courage to continue that counts", author: "Winston Churchill" },
//   { text: "Believe you can and you're halfway there", author: "Theodore Roosevelt" },
//   { text: "Your time is limited, don't waste it living someone else's life", author: "Steve Jobs" }
// ];

// // Get time-based greeting
// const getTimeBasedGreeting = (): string => {
//   const hours = new Date().getHours();
  
//   if (hours >= 5 && hours < 12) {
//     return "Good Morning";
//   } else if (hours >= 12 && hours < 18) {
//     return "Good Afternoon";
//   } else {
//     return "Good Evening";
//   }
// };

// // Get random quote that changes daily
// const getDailyQuote = (): typeof quotes[0] => {
//   // Use the date to seed the quote selection so it's consistent for the day
//   const today = new Date();
//   const start = new Date(today.getFullYear(), 0, 0);
//   const diff = today.getTime() - start.getTime();
//   const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
//   const quoteIndex = dayOfYear % quotes.length;
  
//   return quotes[quoteIndex];
// };

// // Local function to get user info from localStorage
// const getLocalUserInfo = (): UserInfo => {
//   // Only execute on client-side
//   if (typeof window !== 'undefined') {
//     const storedName = localStorage.getItem('userName');
//     return { name: storedName || "User" };
//   }
//   return { name: "User" };
// };

// const Dashboard: React.FC = () => {
//   const [userInfo, setUserInfo] = useState<UserInfo>({ name: "" });
//   const [activeTab, setActiveTab] = useState<string>("dashboard");
//   const [modalOpen, setModalOpen] = useState<boolean>(false);
//   const [greeting, setGreeting] = useState<string>("Good Day");
//   const [quote, setQuote] = useState<typeof quotes[0]>(quotes[0]);
//   const router = useRouter();

//   useEffect(() => {
//     // Initialize time-based greeting and daily quote
//     setGreeting(getTimeBasedGreeting());
//     setQuote(getDailyQuote());
    
//     // Try to get user info from cookies first
//     try {
//       const cookieInfo = getServerUserInfo();
//       if (cookieInfo && cookieInfo.name) {
//         setUserInfo({
//           name: cookieInfo.name
//         });
//       } else {
//         // Fallback to localStorage if cookie info doesn't have name
//         const localInfo = getLocalUserInfo();
//         setUserInfo({
//           name: localInfo.name
//         });
//       }
//     } catch (error) {
//       console.log("Error getting user info from cookies, falling back to localStorage");
//       // Fallback to localStorage
//       const localInfo = getLocalUserInfo();
//       setUserInfo({
//         name: localInfo.name
//       });
//     }
    
//     // Get active category from localStorage (set by Sidebar)
//     const savedCategory = localStorage.getItem('activeCategory');
//     if (savedCategory) {
//       setActiveTab(savedCategory);
//     }

//     // Update greeting based on time every minute
//     const intervalId = setInterval(() => {
//       setGreeting(getTimeBasedGreeting());
//     }, 60000); // Update every minute

//     return () => clearInterval(intervalId);
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

//   // Handle feature card clicks
//   const handleFeatureClick = (link: string, isActive: boolean) => {
//     if (isActive) {
//       router.push(link);
//     } else {
//       // Show modal instead of alert
//       setModalOpen(true);
//     }
//   };

//   // Get features for the active tab with required state
//   const getActiveTabFeatures = (): Feature[] => {
//     // These are the only features that should be ON by default
//     const alwaysActiveFeatures = {
//       "professional-mail": ["dashboard", "tools"].includes(activeTab),
//       "task-manager": ["dashboard", "tools"].includes(activeTab),
//       "google-ads": ["dashboard", "advertising"].includes(activeTab),
//       "sms": ["dashboard", "advertising"].includes(activeTab),
//       "dashboard-overview": activeTab === "dashboard",
//       "website-builder": false,
//       "mass-mailing": ["dashboard", "advertising"].includes(activeTab),
//       "intern-messages": false,
//       "analytics": false,
//       "facebook-ads": false,
//       "linkedin-ads": false,
//       "crm": false,
//       "whatsapp-messaging": activeTab === "whatsapp",
//       "chatgpt-assistant": activeTab === "chatgpt",
//       "telegram-messaging": activeTab === "telegram"
//     };

//     // Get all features for the current tab
//     const currentTabFeatures = exampleData.find(tab => tab.id === activeTab)?.features || [];
    
//     // For dashboard, we want to show specific items from different categories
//     if (activeTab === "dashboard") {
//       return [
//         // Find the professional email feature
//         ...exampleData.flatMap(tab => 
//           tab.features.filter(feature => 
//             ["professional-mail", "task-manager", "google-ads"].includes(feature.id)
//           )
//         )
//       ].map(feature => ({
//         ...feature,
//         isActive: !!alwaysActiveFeatures[feature.id as keyof typeof alwaysActiveFeatures]
//       }));
//     }
    
//     // For other tabs, show their own features with correct active states
//     return currentTabFeatures.map(feature => ({
//       ...feature,
//       isActive: !!alwaysActiveFeatures[feature.id as keyof typeof alwaysActiveFeatures]
//     }));
//   };

//   return (
//     // <ProtectedRoute>
//     <div className="p-6 min-h-screen bg-white overflow-hidden overflow-y-auto">
//       {/* App Title */}
//       <h1 className="text-2xl font-bold text-gray-900 mb-4">The everything app for work !</h1>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Left Section (2 columns) */}
//         <div className="lg:col-span-2">
//           {/* Welcome Banner with Image and Quote */}
//           <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-gray-800 to-gray-700 mb-6 min-h-[10rem] sm:h-40 md:h-48">
//             <div className="absolute inset-0">
//               <Image
//                 src="/assets/banner-image.png"
//                 alt="People selfie"
//                 fill
//                 className="object-cover opacity-60"
//               />
//             </div>
//             <div className="relative p-5 text-white z-10 h-full flex flex-col justify-between">
//               <div>
//                 <h3 className="text-2xl text-gray-200">{greeting},</h3>
//                 <h2 className="text-3xl font-bold">{userInfo.name}</h2>
//               </div>
//               <div className="sm:absolute sm:right-5 sm:bottom-5 w-full sm:w-64 bg-white/20 backdrop-blur-sm rounded-lg p-3 mt-4 sm:mt-0">
//                 <p className="text-xs text-gray-100">Quote of the day</p>
//                 <p className="text-sm font-medium">
//                   "{quote.text}"
//                 </p>
//                 <p className="text-xs text-gray-200 mt-1">{quote.author}</p>
//               </div>
//             </div>
//           </div>

//           {/* Unlocked Features Section - Shows features based on selected sidebar category */}
//           <UnlockedFeatures 
//             activeTabFeatures={getActiveTabFeatures()} 
//             onFeatureClick={handleFeatureClick}
//           />

//           {/* Statistics Section */}
//           <StatisticsSection />
//         </div>

//         {/* Right Section (1 column) */}
//         <div className="lg:col-span-1">
//           {/* Unlock Level Card */}
//           <UnlockLevelCard />

//           {/* Email Section */}
//           <EmailSection />
//         </div>
//       </div>

//       {/* Feature Unavailable Modal */}
//       <FeatureUnavailableModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
//     </div>
//     // </ProtectedRoute>
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
//         id: "crm",
//         title: "CRM",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/crm.png",
//         link: "/dashboard/intern-message",
//         isActive: false
//       },
//       {
//         id: "social-listening",
//         title: "Social Listening",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/social.png",
//         link: "/dashboard/social-listening",
//         isActive: false
//       },
//       {
//         id: "post-publisher",
//         title: "Post Publisher",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/post-publisher.png",
//         link: "/dashboard/post-publisher",
//         isActive: false
//       },
//       {
//         id: "ai-calling",
//         title: "AI Calling",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/ai-calling.png",
//         link: "/dashboard/ai-calling",
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
//         title: "Professional Mail",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/online-meeting.png",
//         link: "/dashboard/professional-mail",
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
//         id: "website-builder",
//         title: "Website Builder",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/website-builder.png",
//         link: "/dashboard/website-builder",
//         isActive: false
//       },
//       {
//         id: "internal-message",
//         title: "Internal Message",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/internal-message.png",
//         link: "/dashboard/messaging",
//         isActive: false
//       },
//       {
//         id: "online-meeting",
//         title: "Online Meeting",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/online-meeting.png",
//         link: "/dashboard/online-message",
//         isActive: false
//       },
//       {
//         id: "e-sign",
//         title: "E-Sign",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/e-sign.png",
//         link: "/dashboard/e-sign",
//         isActive: false
//       },
//       {
//         id: "image-editor",
//         title: "Image Editor",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/image-editor.png",
//         link: "/dashboard/image-editor",
//         isActive: false
//       },
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
//         id: "sms",
//         title: "SMS",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/sms.png",
//         link: "/dashboard/google-ads",
//         isActive: true
//       },
//       {
//         id: "mass-mailing",
//         title: "Mass Mailing",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/mass-mailing.png",
//         link: "/dashboard/google-ads",
//         isActive: false
//       },
//       {
//         id: "Meta",
//         title: "Meta",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/meta.png",
//         link: "/dashboard/meta",
//         isActive: false
//       },
//       {
//         id: "twitter",
//         title: "Twitter",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/twitter.png",
//         link: "/dashboard/twitter",
//         isActive: false
//       },
//       {
//         id: "tiktok",
//         title: "Tiktok",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/tiktok.png",
//         link: "/dashboard/tiktok",
//         isActive: false
//       },
//       {
//         id: "linkedIn",
//         title: "LinkedIn",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/linkedin.png",
//         link: "/dashboard/linkedin",
//         isActive: false
//       },
//       {
//         id: "spotify",
//         title: "Spotify",
//         subtitle: "Boost Connections, Drive Sales!",
//         imageUrl: "/icons/spotify.png",
//         link: "/dashboard/spotify",
//         isActive: false
//       },
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
//         link: "/dashboard/whatsapp",
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
//         link: "/dashboard/chatgpt",
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
//         link: "/dashboard/telegram",
//         isActive: true
//       }
//     ]
//   }
// ];

// export default Dashboard;























































// "use client";

// import { Button } from "@/components/ui/button";
// import Link from "next/link";
// import Image from "next/image";
// import React, { useState, useEffect, useRef } from "react";

// export default function Home() {
//   const [currentSection, setCurrentSection] = useState(0);
//   const sectionRefs = useRef<(HTMLElement | null)[]>([]);

//   // Initialize refs for each section
//   useEffect(() => {
//     sectionRefs.current = [
//       document.getElementById("landing-section"),
//       document.getElementById("tools-section"),
//       document.getElementById("footer-section")
//     ];

//     // Set up scroll event listener
//     const handleScroll = () => {
//       const scrollPosition = window.scrollY + window.innerHeight / 2;

//       // Determine which section is currently in view
//       sectionRefs.current.forEach((section, index) => {
//         if (section) {
//           const sectionTop = section.offsetTop;
//           const sectionBottom = sectionTop + section.offsetHeight;

//           if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
//             setCurrentSection(index);
//           }
//         }
//       });
//     };

//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   // Function to scroll to specific section
//   const scrollToSection = (index: number) => {
//     const section = sectionRefs.current[index];
//     if (section) {
//       window.scrollTo({
//         top: section.offsetTop,
//         behavior: "smooth"
//       });
//     }
//   };

//   return (
//     <div className="flex flex-col font-[family-name:var(--font-geist-sans)]">
//       {/* Navigation dots for section indicators */}
//       <div className="fixed right-10 top-1/2 transform -translate-y-1/2 z-50">
//         <div className="flex flex-col gap-4">
//           {[0, 1, 2].map((index) => (
//             <button
//               key={index}
//               className={`w-3 h-3 rounded-full transition-all duration-300 ${
//                 currentSection === index ? "bg-emerald-500 scale-125" : "bg-gray-300 hover:bg-gray-400"
//               }`}
//               onClick={() => scrollToSection(index)}
//             />
//           ))}
//         </div>
//       </div>

//       {/* First section - Landing image */}
//       <section
//         id="landing-section"
//         className="min-h-screen flex items-center justify-center relative w-full"
//       >
//         <Image
//           src="/assets/landing.png" // Update this path to match your asset location
//           fill
//           className="object-cover"
//           priority
//           alt="Djombi - The everything app for work"
//         />
//         <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center p-8">
//           <Image
//             src="/icons/djombi-white.png"
//             width={700}
//             height={200}
//             alt="Djombi"
//             className="mb-6"
//           />
//           <p className="text-2xl md:text-3xl text-white max-w-2xl mt-4">
//             The everything app for work
//           </p>
//           <Button 
//             className="bg-emerald-500 hover:bg-emerald-600 text-white mt-8 px-8 py-6 text-lg"
//             onClick={() => scrollToSection(1)}
//           >
//             Discover More
//           </Button>
//         </div>
//       </section>
      
//       {/* Second section - White background with text */}
//       <section
//         id="tools-section"
//         className="min-h-screen flex items-center justify-center bg-white"
//       >
//         <div className="text-center p-8 max-w-4xl mx-auto">
//           <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
//             Everyday tools in 1 platform
//           </h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
//             {/* Tool cards */}
//             {[
//               { title: "Professional Mail", icon: "/icons/online-meeting.png" },
//               { title: "Task Manager", icon: "/icons/task-manager.png" },
//               { title: "Google Ads", icon: "/icons/google-ads.png" },
//               { title: "Website Builder", icon: "/icons/website-builder.png" },
//               { title: "SMS", icon: "/icons/sms.png" },
//               { title: "ChatGPT", icon: "/icons/chatgpt.png" },
//             ].map((tool, index) => (
//               <div key={index} className="bg-gray-50 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
//                 <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-lg shadow-sm flex items-center justify-center">
//                   <Image src={tool.icon} width={32} height={32} alt={tool.title} />
//                 </div>
//                 <h3 className="text-lg font-medium">{tool.title}</h3>
//               </div>
//             ))}
//           </div>
//           <Link href="/dashboard/UserTestDashboard">
//             <Button 
//               className="bg-emerald-500 hover:bg-emerald-600 text-white mt-12 px-8 py-6 text-lg"
//             >
//               Try Dashboard
//             </Button>
//           </Link>
//         </div>
//       </section>
      
//       {/* Footer section */}
//       <section
//         id="footer-section"
//         className="bg-gray-900 text-white py-16"
//       >
//         <div className="container mx-auto px-4">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
//             <div>
//               <Image
//                 src="/icons/djombi-white.png"
//                 width={150}
//                 height={40}
//                 alt="Djombi"
//                 className="mb-4"
//               />
//               <p className="text-gray-400 mt-4">
//                 The everything app for work. Simplify your workflow with our all-in-one solution.
//               </p>
//             </div>
            
//             <div>
//               <h3 className="text-lg font-semibold mb-4">Products</h3>
//               <ul className="space-y-2">
//                 <li><a href="#" className="text-gray-400 hover:text-white transition">Email</a></li>
//                 <li><a href="#" className="text-gray-400 hover:text-white transition">Task Manager</a></li>
//                 <li><a href="#" className="text-gray-400 hover:text-white transition">Google Ads</a></li>
//                 <li><a href="#" className="text-gray-400 hover:text-white transition">Website Builder</a></li>
//               </ul>
//             </div>
            
//             <div>
//               <h3 className="text-lg font-semibold mb-4">Company</h3>
//               <ul className="space-y-2">
//                 <li><a href="#" className="text-gray-400 hover:text-white transition">About</a></li>
//                 <li><a href="#" className="text-gray-400 hover:text-white transition">Careers</a></li>
//                 <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
//                 <li><a href="#" className="text-gray-400 hover:text-white transition">Press</a></li>
//               </ul>
//             </div>
            
//             <div>
//               <h3 className="text-lg font-semibold mb-4">Support</h3>
//               <ul className="space-y-2">
//                 <li><a href="#" className="text-gray-400 hover:text-white transition">Help Center</a></li>
//                 <li><a href="#" className="text-gray-400 hover:text-white transition">Contact Us</a></li>
//                 <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
//                 <li><a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a></li>
//               </ul>
//             </div>
//           </div>
          
//           <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
//             <p className="text-gray-400 text-sm">© 2025 Djombi. All rights reserved.</p>
//             <div className="flex space-x-4 mt-4 md:mt-0">
//               <a href="#" className="text-gray-400 hover:text-white transition">
//                 <span className="sr-only">Facebook</span>
//                 <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
//                   <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
//                 </svg>
//               </a>
//               <a href="#" className="text-gray-400 hover:text-white transition">
//                 <span className="sr-only">Instagram</span>
//                 <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
//                   <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
//                 </svg>
//               </a>
//               <a href="#" className="text-gray-400 hover:text-white transition">
//                 <span className="sr-only">Twitter</span>
//                 <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
//                   <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
//                 </svg>
//               </a>
//               <a href="#" className="text-gray-400 hover:text-white transition">
//                 <span className="sr-only">LinkedIn</span>
//                 <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
//                   <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
//                 </svg>
//               </a>
//             </div>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }



















































// import { Button } from "@/components/ui/button";
// import Link from "next/link";
// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
//       {/* First section - Landing image */}
//       <section className="min-h-screen flex items-center justify-center relative w-full">
//         <Image
//           src="/assets/landing.png" // Update this path to match your asset location
//           alt="Djombi - The everything app for work"
//           fill
//           className="object-cover"
//           priority
//         />
//         <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center p-8">
//           {/* <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Djombi</h1>
//           <p className="text-2xl md:text-3xl text-white max-w-2xl">
//             The everything app for work
//           </p> */}
//         </div>
//       </section>
      
//       {/* Second section - White background with text */}
//       <section className="min-h-screen flex items-center justify-center bg-white">
//         <div className="text-center p-8 max-w-4xl mx-auto">
//           <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
//             Everyday tools in 1 platform
//           </h2>
//           <p className="text-xl text-gray-600 max-w-2xl mx-auto">
//             Simplify your workflow with our all-in-one solution designed to boost productivity and streamline communication.
//           </p>
//         </div>
//       </section>
      
//       {/* Third section - Dashboard button */}
//       <section className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <Link href="/dashboard/UserTestDashboard" passHref>
//             <Button className="bg-emerald-500 hover:bg-emerald-600 text-white text-lg py-6 px-10 rounded-lg shadow-lg transition-all">
//               View Dashboard
//             </Button>
//           </Link>
//         </div>
//       </section>
//     </div>
//   );
// }




















