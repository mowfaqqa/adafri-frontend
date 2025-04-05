"use client";

import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, Sun, Moon, User, Settings, LogOut } from "lucide-react";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getUserInfo, clearAuthCookies } from "@/lib/utils/cookies";
import { useRouter } from "next/navigation";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const router = useRouter();

  // Load user info from cookies on component mount
  useEffect(() => {
    const cookieInfo = getUserInfo();
    setUserInfo({
      name: cookieInfo.name || "User",
      email: cookieInfo.email || "user@example.com"
    });
  }, []);

  // Handle logout
  const handleLogout = () => {
    // Clear all authentication cookies
    clearAuthCookies();

    // For extra security, explicitly clear individual cookies using the correct syntax
    // Cookies.remove('accessToken', { path: '/' });
    // Cookies.remove('__frsadfrusrtkn', { path: '/' });
    // Cookies.remove('__rfrsadfrusrtkn', { path: '/' });
    // Cookies.remove('userEmail', { path: '/' });
    // Cookies.remove('userName', { path: '/' });
    // Cookies.remove('userId', { path: '/' });

    // Reset user state in the component
    setUserInfo({
      name: "",
      email: ""
    });

    // Close dropdown
    setDropdownOpen(false);

    // Redirect to login page
    router.push("/auth/login");
  };

  return (
    <div
      className={`min-h-screen flex overflow-hidden ${darkMode ? "bg-black text-white" : "bg-gray-200 text-black"
        }`}
    >
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content */}
      <div
        className={`flex-1 overflow-hidden transition-all duration-300 ${isCollapsed ? "ml-[100px]" : "ml-[260px]"
          }`}
      >
        {/* Top Navbar */}
        <div className="flex justify-between items-center my-2 px-6">
          <div className="flex items-center gap-4 ml-auto mr-6">
            <Button className="bg-gradient-to-r from-[#00A791] to-[#014D42] text-white px-4 p-5 py-2 rounded-lg">
              Share
            </Button>

            {/* Profile & Notifications */}
            <div className="flex items-center gap-4">
              <Bell className="w-5 h-5 text-gray-600" />
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <Image
                  src="/icons/demo-profile.jpg"
                  alt="Profile Picture"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div>
                  <p className="text-sm font-medium">{userInfo.name}</p>
                  <p className="text-xs text-gray-500">{userInfo.email}</p>
                </div>
              </div>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 top-[60px] w-48 bg-white shadow-lg rounded-md p-2 z-50 mr-6">
                  <div className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer">
                    <User className="w-4 h-4" /> Profile
                  </div>
                  <div className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer">
                    <MessageSquare className="w-4 h-4" /> Chat with us
                  </div>
                  <div
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => setDarkMode(!darkMode)}
                  >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    Toggle Theme
                  </div>
                  <div className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer">
                    <Settings className="w-4 h-4" /> Settings
                  </div>
                  <div
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer text-red-500"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;



















// "use client";

// import Sidebar from "@/components/Sidebar";
// import { Button } from "@/components/ui/button";
// import { Bell, MessageSquare, Sun, Moon, User, Settings, LogOut } from "lucide-react";
// import React, { useState } from "react";
// import Image from "next/image";

// const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
//   const [darkMode, setDarkMode] = useState(false);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [isCollapsed, setIsCollapsed] = useState(false);

//   return (
//     <div
//       className={`min-h-screen flex overflow-hidden ${
//         darkMode ? "bg-black text-white" : "bg-gray-200 text-black"
//       }`}
//     >
//       {/* Sidebar */}
//       <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

//       {/* Main Content */}
//       <div
//         className={`flex-1 overflow-hidden transition-all duration-300 ${
//           isCollapsed ? "ml-[100px]" : "ml-[260px]"
//         }`}
//       >
//         {/* Top Navbar */}
//         <div className="flex justify-between items-center my-2 px-6">
//           <div className="flex items-center gap-4 ml-auto mr-6">
//             <Button className="bg-gradient-to-r from-[#00A791] to-[#014D42] text-white px-4 p-5 py-2 rounded-lg">
//               Share
//             </Button>

//             {/* Profile & Notifications */}
//             <div className="flex items-center gap-4">
//               <Bell className="w-5 h-5 text-gray-600" />
//               <div
//                 className="flex items-center gap-2 cursor-pointer"
//                 onClick={() => setDropdownOpen(!dropdownOpen)}
//               >
//                 <Image
//                   src="/icons/demo-profile.jpg"
//                   alt="Profile Picture"
//                   width={32}
//                   height={32}
//                   className="rounded-full"
//                 />
//                 <div>
//                   <p className="text-sm font-medium">Muwaff Leo</p>
//                   <p className="text-xs text-gray-500">muwaffleo@gmail.com</p>
//                 </div>
//               </div>

//               {/* Dropdown Menu */}
//               {dropdownOpen && (
//                 <div className="absolute right-0 top-[60px] w-48 bg-white shadow-lg rounded-md p-2 z-50 mr-6">
//                   <div className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer">
//                     <User className="w-4 h-4" /> Profile
//                   </div>
//                   <div className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer">
//                     <MessageSquare className="w-4 h-4" /> Chat with us
//                   </div>
//                   <div
//                     className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
//                     onClick={() => setDarkMode(!darkMode)}
//                   >
//                     {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
//                     Toggle Theme
//                   </div>
//                   <div className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer">
//                     <Settings className="w-4 h-4" /> Settings
//                   </div>
//                   <div className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer text-red-500">
//                     <LogOut className="w-4 h-4" /> Log out
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Main Content */}
//         {children}
//       </div>
//     </div>
//   );
// };

// export default DashboardLayout;
