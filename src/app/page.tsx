"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
// import Sidebar from "@/components/Sidebar";
import UserTestDashboard from "./dashboard/UserTestDashboard/page";
import UserTestSidebar from "@/components/UserTestSidebar/UserTestSidebar";

export default function Home() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [showDashboard, setShowDashboard] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // Initialize refs for each section
  useEffect(() => {
    sectionRefs.current = [
      document.getElementById("landing-section"),
      document.getElementById("tools-section"),
      document.getElementById("dashboard-section")
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
            // Show dashboard only when we're at the dashboard section
            setShowDashboard(index === 2);
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
      {/* Navigation dots for section indicators */}
      <div className="fixed right-10 top-1/2 transform -translate-y-1/2 z-50">
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentSection === index ? "bg-emerald-500 scale-125" : "bg-gray-300 hover:bg-gray-400"
              }`}
              onClick={() => scrollToSection(index)}
            />
          ))}
        </div>
      </div>

      {/* First section - Landing image */}
      <section
        id="landing-section"
        className="min-h-screen flex items-center justify-center relative w-full"
      >
        <Image
          src="/assets/landing.png" // Update this path to match your asset location
          alt="Djombi - The everything app for work"
          fill
          className="object-cover"
          priority
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
          <Button 
            className="bg-emerald-500 hover:bg-emerald-600 text-white mt-8 px-8 py-6 text-lg"
            onClick={() => scrollToSection(1)}
          >
            Discover More
          </Button>
        </div>
      </section>
      
      {/* Second section - White background with text */}
      <section
        id="tools-section"
        className="min-h-screen flex items-center justify-center bg-white"
      >
        <div className="text-center p-8 max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            Everyday tools in 1 platform
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {/* Tool cards */}
            {[
              { title: "Professional Mail", icon: "/icons/online-meeting.png" },
              { title: "Task Manager", icon: "/icons/task-manager.png" },
              { title: "Google Ads", icon: "/icons/google-ads.png" },
              { title: "Website Builder", icon: "/icons/website-builder.png" },
              { title: "SMS", icon: "/icons/sms.png" },
              { title: "ChatGPT", icon: "/icons/chatgpt.png" },
            ].map((tool, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-lg shadow-sm flex items-center justify-center">
                  <Image src={tool.icon} width={32} height={32} alt={tool.title} />
                </div>
                <h3 className="text-lg font-medium">{tool.title}</h3>
              </div>
            ))}
          </div>
          <Button 
            className="bg-emerald-500 hover:bg-emerald-600 text-white mt-12 px-8 py-6 text-lg"
            onClick={() => scrollToSection(2)}
          >
            Try Dashboard
          </Button>
        </div>
      </section>
      
      {/* Third section - Dashboard with Sidebar */}
      <section
        id="dashboard-section"
        className="min-h-screen bg-gray-50 relative"
      >
        {showDashboard && (
          <>
            <UserTestSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <div 
              className={`transition-all duration-300 ${
                isCollapsed ? "ml-20" : "ml-64"
              }`}
            >
              <UserTestDashboard />
            </div>
          </>
        )}
        {!showDashboard && (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}



















































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
//           <Link href="/dashboard" passHref>
//             <Button className="bg-emerald-500 hover:bg-emerald-600 text-white text-lg py-6 px-10 rounded-lg shadow-lg transition-all">
//               View Dashboard
//             </Button>
//           </Link>
//         </div>
//       </section>
//     </div>
//   );
// }




















// import { Button } from "@/components/ui/button";
// import Link from "next/link";


// //  View Dashboard
// export default function Home() {
//   return (
//     <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
//       <main className="max-w-xl mx-auto flex justify-center items-center">
//         <Link href="/dashboard" passHref>
//           <Button className="bg-emerald-500 text-white">View Dashboard</Button>
//         </Link>
//       </main>
//     </div>
//   );
// }
