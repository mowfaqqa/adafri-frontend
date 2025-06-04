"use client";

import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, Sun, Moon, User, Settings, LogOut, ChevronDown, Menu, X, MoreVertical } from "lucide-react";
import React, { useState, useEffect, useRef, useContext } from "react";
import Image from "next/image";
import { clearAuthCookies } from "@/lib/utils/cookies";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { AuthContext } from "@/lib/context/auth";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  
  // Get auth context
  const {user: userInfo, setUser, tryLogin, tryLogout} = useContext(AuthContext);

  // Check if screen is mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
      setMobileDropdownOpen(false);
    }
  }, [isMobile]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Load preferences from localStorage on component mount
  useEffect(() => {
    // Check if dark mode is saved in localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === 'true');
    }

    // Check if sidebar state is saved in localStorage
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState !== null) {
      setIsCollapsed(savedSidebarState === 'true');
    }

    // Listen for theme changes from other components
    const handleThemeChange = (e: any) => {
      setDarkMode(e.detail.darkMode);
    };

    window.addEventListener('themeChange', handleThemeChange);

    return () => {
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setMobileDropdownOpen(false);
      }
    }

    if (dropdownOpen || mobileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen, mobileDropdownOpen]);

  // Update document body class when dark mode changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle logout
  const handleLogout = () => {
    // Clear all authentication cookies
    clearAuthCookies();
    
    // Reset user state in the component
    setUser(null);

    // Close dropdowns
    setDropdownOpen(false);
    setMobileDropdownOpen(false);
    
    // Call tryLogout
    tryLogout(true);

    // Redirect to login page
    router.push("/auth/login");
  };

  // Handle login
  const handleLogin = () => {
    console.log('logging in');
    tryLogin(true);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));

    window.dispatchEvent(new CustomEvent('themeChange', {
      detail: { darkMode: newDarkMode }
    }));
  };

  // Navigate to settings page
  const navigateToSettings = () => {
    setDropdownOpen(false);
    setMobileDropdownOpen(false);
    router.push("/dashboard/profile");
  };

  // Navigate to profile page
  const navigateToProfile = () => {
    setDropdownOpen(false);
    setMobileDropdownOpen(false);
    router.push("/dashboard/profile?tab=personal-information");
  };

  // Toggle sidebar - different behavior for mobile vs desktop with localStorage persistence
  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      const newCollapsedState = !isCollapsed;
      setIsCollapsed(newCollapsedState);
      localStorage.setItem('sidebarCollapsed', String(newCollapsedState));
    }
  };

  return (
    <div
      className={`min-h-screen flex overflow-hidden ${darkMode ? "bg-gray-50 text-white dark" : "bg-white text-black"}`}
    >
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && isMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile Sidebar */}
          <div className="relative flex flex-col bg-white shadow-xl w-56">
            <Sidebar 
              isCollapsed={false} 
              setIsCollapsed={() => {}} 
              isMobile={true}
              onMobileItemClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className={`flex-1 overflow-hidden transition-all duration-300 ${
          isMobile 
            ? "ml-0" 
            : (isCollapsed ? "ml-[80px]" : "ml-[256px]")
        }`}
      >
        {/* Mobile Top Navbar */}
        {isMobile ? (
          <div className="flex justify-between items-center my-2 px-4 md:hidden">
            {/* Left: Hamburger Menu */}
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Center: Logo */}
            <div className="flex items-center justify-center flex-1">
              <div className="flex items-center">
                <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center mr-2">
                  <Image
                    src="/icons/icon-main.png"
                    width={32}
                    height={32}
                    alt="icon"
                  />
                </div>
                <Image
                  src="/icons/djombi-icon.png"
                  width={120}
                  height={32}
                  alt="Djombi"
                />
              </div>
            </div>

            {/* Right: Three Dots Menu */}
            <div className="relative" ref={mobileDropdownRef}>
              <button
                onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              {/* Mobile Dropdown Menu */}
              {mobileDropdownOpen && (
                <div className="absolute right-0 top-12 w-60 bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 z-50">
                  {/* Notification */}
                  <div className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                    <Bell className="w-4 h-4" /> 
                    Notifications
                  </div>
                  
                  {/* Profile Section */}
                  <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                  <div className="flex items-center gap-2 p-2 mb-2">
                    <Image
                      src={userInfo && userInfo.photoURL ? userInfo.photoURL : "/icons/demo-profile.jpg"}
                      alt="Profile Picture"
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{userInfo?.first_name} {userInfo?.last_name}</span>
                      <span className="text-xs text-gray-500">{userInfo?.email}</span>
                    </div>
                  </div>
                  
                  <div
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={navigateToProfile}
                  >
                    <User className="w-4 h-4" /> Profile
                  </div>
                  <div className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                    <MessageSquare className="w-4 h-4" /> Chat with us
                  </div>
                  <div
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={toggleDarkMode}
                  >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    Toggle Theme
                  </div>
                  <div
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={navigateToSettings}
                  >
                    <Settings className="w-4 h-4" /> Settings
                  </div>
                  <div
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500"
                    onClick={handleLogin}
                  >
                    <LogOut className="w-4 h-4" /> Log in
                  </div>
                  <div
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Desktop Top Navbar */
          <div className="flex justify-between items-center my-2 px-6">
            {/* Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
            </button>

            <div className="flex items-center gap-4 ml-auto">
              {/* Notification Icon */}
              <button className="relative flex items-center justify-center p-2">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>

              {/* Profile Button */}
              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <Image
                    src={userInfo && userInfo.photoURL ? userInfo.photoURL : "/icons/demo-profile.jpg"}
                    alt="Profile Picture"
                    width={30}
                    height={30}
                    className="rounded-full"
                  />
                  <ChevronDown className="w-4 h-4 ml-1 text-gray-500" />
                </button>

                {/* Desktop Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 z-50">
                    <div
                      className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={navigateToProfile}
                    >
                      <User className="w-4 h-4" /> Profile
                    </div>
                    <div className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                      <MessageSquare className="w-4 h-4" /> Chat with us
                    </div>
                    <div
                      className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={toggleDarkMode}
                    >
                      {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      Toggle Theme
                    </div>
                    <div
                      className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={navigateToSettings}
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </div>
                    <div
                      className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500"
                      onClick={handleLogin}
                    >
                      <LogOut className="w-4 h-4" /> Log in
                    </div>
                    <div
                      className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" /> Log out
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;













































// "use client";

// import { Button } from "@/components/ui/button";
// import { Bell, MessageSquare, Sun, Moon, User, Settings, LogOut, ChevronDown, Menu, X, MoreVertical } from "lucide-react";
// import React, { useState, useEffect, useRef } from "react";
// import Image from "next/image";
// import { getUserInfo, clearAuthCookies } from "@/lib/utils/cookies";
// import { useRouter } from "next/navigation";
// import Sidebar from "@/components/Sidebar";

// const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
//   const [darkMode, setDarkMode] = useState(false);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
//   const [isCollapsed, setIsCollapsed] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);
//   const [userInfo, setUserInfo] = useState({ name: "", email: "" });
//   const router = useRouter();
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const mobileDropdownRef = useRef<HTMLDivElement>(null);

//   // Check if screen is mobile
//   useEffect(() => {
//     const checkScreenSize = () => {
//       setIsMobile(window.innerWidth < 768);
//     };

//     checkScreenSize();
//     window.addEventListener('resize', checkScreenSize);
//     return () => window.removeEventListener('resize', checkScreenSize);
//   }, []);

//   // Close mobile menu when screen size changes to desktop
//   useEffect(() => {
//     if (!isMobile) {
//       setIsMobileMenuOpen(false);
//       setMobileDropdownOpen(false);
//     }
//   }, [isMobile]);

//   // Prevent body scroll when mobile menu is open
//   useEffect(() => {
//     if (isMobileMenuOpen) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'unset';
//     }

//     return () => {
//       document.body.style.overflow = 'unset';
//     };
//   }, [isMobileMenuOpen]);

//   // Load user info from cookies on component mount
//   useEffect(() => {
//     const cookieInfo = getUserInfo();
//     setUserInfo({
//       name: cookieInfo.name || "User",
//       email: cookieInfo.email || "user@example.com"
//     });

//     // Check if dark mode is saved in localStorage
//     const savedDarkMode = localStorage.getItem('darkMode');
//     if (savedDarkMode) {
//       setDarkMode(savedDarkMode === 'true');
//     }

//     // Listen for theme changes from other components
//     const handleThemeChange = (e: any) => {
//       setDarkMode(e.detail.darkMode);
//     };

//     window.addEventListener('themeChange', handleThemeChange);

//     return () => {
//       window.removeEventListener('themeChange', handleThemeChange);
//     };
//   }, []);

//   // Handle clicks outside the dropdown to close it
//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setDropdownOpen(false);
//       }
//       if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
//         setMobileDropdownOpen(false);
//       }
//     }

//     if (dropdownOpen || mobileDropdownOpen) {
//       document.addEventListener('mousedown', handleClickOutside);
//     }
    
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [dropdownOpen, mobileDropdownOpen]);

//   // Update document body class when dark mode changes
//   useEffect(() => {
//     if (darkMode) {
//       document.body.classList.add('dark');
//     } else {
//       document.body.classList.remove('dark');
//     }
//   }, [darkMode]);

//   // Handle logout
//   const handleLogout = () => {
//     clearAuthCookies();
//     setUserInfo({
//       name: "",
//       email: ""
//     });
//     setDropdownOpen(false);
//     setMobileDropdownOpen(false);
//     router.push("/auth/login");
//   };

//   // Toggle dark mode
//   const toggleDarkMode = () => {
//     const newDarkMode = !darkMode;
//     setDarkMode(newDarkMode);
//     localStorage.setItem('darkMode', String(newDarkMode));

//     window.dispatchEvent(new CustomEvent('themeChange', {
//       detail: { darkMode: newDarkMode }
//     }));
//   };

//   // Navigate to settings page
//   const navigateToSettings = () => {
//     setDropdownOpen(false);
//     setMobileDropdownOpen(false);
//     router.push("/dashboard/profile");
//   };

//   // Navigate to profile page
//   const navigateToProfile = () => {
//     setDropdownOpen(false);
//     setMobileDropdownOpen(false);
//     router.push("/dashboard/profile?tab=personal-information");
//   };

//   // Toggle sidebar - different behavior for mobile vs desktop
//   const toggleSidebar = () => {
//     if (isMobile) {
//       setIsMobileMenuOpen(!isMobileMenuOpen);
//     } else {
//       setIsCollapsed(!isCollapsed);
//     }
//   };

//   return (
//     <div
//       className={`min-h-screen flex overflow-hidden ${darkMode ? "bg-gray-100 text-white dark" : "bg-white text-black"}`}
//     >
//       {/* Desktop Sidebar */}
//       <div className="hidden md:block">
//         <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
//       </div>

//       {/* Mobile Sidebar Overlay */}
//       {isMobileMenuOpen && isMobile && (
//         <div className="md:hidden fixed inset-0 z-50 flex">
//           {/* Backdrop */}
//           <div
//             className="fixed inset-0 bg-black bg-opacity-50"
//             onClick={() => setIsMobileMenuOpen(false)}
//           />
          
//           {/* Mobile Sidebar */}
//           <div className="relative flex flex-col bg-white shadow-xl w-56">
//             <Sidebar 
//               isCollapsed={false} 
//               setIsCollapsed={() => {}} 
//               isMobile={true}
//               onMobileItemClick={() => setIsMobileMenuOpen(false)}
//             />
//           </div>
//         </div>
//       )}

//       {/* Main Content */}
//       <div
//         className={`flex-1 overflow-hidden transition-all duration-300 ${
//           isMobile 
//             ? "ml-0" 
//             : (isCollapsed ? "ml-[100px]" : "ml-[260px]")
//         }`}
//       >
//         {/* Mobile Top Navbar */}
//         {isMobile ? (
//           <div className="flex justify-between items-center my-2 px-4 md:hidden">
//             {/* Left: Hamburger Menu */}
//             <button
//               onClick={toggleSidebar}
//               className="p-2 hover:bg-gray-100 rounded-lg"
//             >
//               <Menu className="h-5 w-5" />
//             </button>

//             {/* Center: Logo */}
//             <div className="flex items-center justify-center flex-1">
//               <div className="flex items-center">
//                 <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center mr-2">
//                   <Image
//                     src="/icons/icon-main.png"
//                     width={32}
//                     height={32}
//                     alt="icon"
//                   />
//                 </div>
//                 <Image
//                   src="/icons/djombi-icon.png"
//                   width={120}
//                   height={32}
//                   alt="Djombi"
//                 />
//               </div>
//             </div>

//             {/* Right: Three Dots Menu */}
//             <div className="relative" ref={mobileDropdownRef}>
//               <button
//                 onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
//                 className="p-2 hover:bg-gray-100 rounded-lg"
//               >
//                 <MoreVertical className="h-5 w-5" />
//               </button>

//               {/* Mobile Dropdown Menu */}
//               {mobileDropdownOpen && (
//                 <div className="absolute right-0 top-12 w-60 bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 z-50">
//                   {/* Notification */}
//                   <div className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
//                     <Bell className="w-4 h-4" /> 
//                     Notifications
//                   </div>
                  
//                   {/* Profile Section */}
//                   <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
//                   <div className="flex items-center gap-2 p-2 mb-2">
//                     <Image
//                       src="/icons/demo-profile.jpg"
//                       alt="Profile Picture"
//                       width={24}
//                       height={24}
//                       className="rounded-full"
//                     />
//                     <div className="flex flex-col">
//                       <span className="text-sm font-medium">{userInfo.name}</span>
//                       <span className="text-xs text-gray-500">{userInfo.email}</span>
//                     </div>
//                   </div>
                  
//                   <div
//                     className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
//                     onClick={navigateToProfile}
//                   >
//                     <User className="w-4 h-4" /> Profile
//                   </div>
//                   <div className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
//                     <MessageSquare className="w-4 h-4" /> Chat with us
//                   </div>
//                   <div
//                     className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
//                     onClick={toggleDarkMode}
//                   >
//                     {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
//                     Toggle Theme
//                   </div>
//                   <div
//                     className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
//                     onClick={navigateToSettings}
//                   >
//                     <Settings className="w-4 h-4" /> Settings
//                   </div>
//                   <div
//                     className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500"
//                     onClick={handleLogout}
//                   >
//                     <LogOut className="w-4 h-4" /> Log out
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         ) : (
//           /* Desktop Top Navbar */
//           <div className="flex justify-between items-center my-2 px-6">
//             {/* Toggle Button */}
//             <button
//               onClick={toggleSidebar}
//               className="p-2 hover:bg-gray-100 rounded-lg"
//             >
//               {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
//             </button>

//             <div className="flex items-center gap-4 ml-auto">
//               {/* Notification Icon */}
//               <button className="relative flex items-center justify-center">
//                 <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
//               </button>

//               {/* Profile Button */}
//               <div className="relative" ref={dropdownRef}>
//                 <button
//                   className="flex items-center gap-3 cursor-pointer"
//                   onClick={() => setDropdownOpen(!dropdownOpen)}
//                 >
//                   <Image
//                     src="/icons/demo-profile.jpg"
//                     alt="Profile Picture"
//                     width={30}
//                     height={30}
//                     className="rounded-full"
//                   />
//                   <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
//                 </button>

//                 {/* Desktop Dropdown Menu */}
//                 {dropdownOpen && (
//                   <div className="absolute right-0 top-12 w-60 bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 z-50">
//                     <div
//                       className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
//                       onClick={navigateToProfile}
//                     >
//                       <User className="w-4 h-4" /> Profile
//                     </div>
//                     <div className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
//                       <MessageSquare className="w-4 h-4" /> Chat with us
//                     </div>
//                     <div
//                       className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
//                       onClick={toggleDarkMode}
//                     >
//                       {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
//                       Toggle Theme
//                     </div>
//                     <div
//                       className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
//                       onClick={navigateToSettings}
//                     >
//                       <Settings className="w-4 h-4" /> Settings
//                     </div>
//                     <div
//                       className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500"
//                       onClick={handleLogout}
//                     >
//                       <LogOut className="w-4 h-4" /> Log out
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Main Content */}
//         {children}
//       </div>
//     </div>
//   );
// };

// export default DashboardLayout;

























































// "use client";

// import { Button } from "@/components/ui/button";
// import { Bell, MessageSquare, Sun, Moon, Settings, LogOut, ChevronDown, Menu, X, User as UserIcon } from "lucide-react";
// import React, { useState, useEffect, useRef, useContext } from "react";
// import Image from "next/image";
// import { clearAuthCookies } from "@/lib/utils/cookies";
// import { useRouter } from "next/navigation";
// import Sidebar from "@/components/Sidebar";
// import { AuthContext } from "@/lib/context/auth";

// const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
//   const [darkMode, setDarkMode] = useState(false);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   // Set isCollapsed to false by default (sidebar open)
//   const [isCollapsed, setIsCollapsed] = useState(false);
//   const router = useRouter();
//   // Create a ref for the dropdown container
//   const dropdownRef = useRef(null);
  
//   const {user: userInfo, setUser, tryLogin, tryLogout} = useContext(AuthContext);

//   // Load user info from cookies on component mount
//   useEffect(() => {
//     // Check if dark mode is saved in localStorage
//     const savedDarkMode = localStorage.getItem('darkMode');
//     if (savedDarkMode) {
//       setDarkMode(savedDarkMode === 'true');
//     }

//     // Check if sidebar state is saved in localStorage
//     const savedSidebarState = localStorage.getItem('sidebarCollapsed');
//     if (savedSidebarState !== null) {
//       setIsCollapsed(savedSidebarState === 'true');
//     }

//     // Listen for theme changes from other components
//     const handleThemeChange = (e: any) => {
//       setDarkMode(e.detail.darkMode);
//     };

//     window.addEventListener('themeChange', handleThemeChange);

//     return () => {
//       window.removeEventListener('themeChange', handleThemeChange);
//     };
//   }, []);

//   // Handle clicks outside the dropdown to close it
//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       // Using type assertion to fix TypeScript error with .contains()
//       const currentElement = dropdownRef.current as HTMLElement | null;
//       if (currentElement && !currentElement.contains(event.target as Node)) {
//         setDropdownOpen(false);
//       }
//     }
//     // Add event listener when dropdown is open
//     if (dropdownOpen) {
//       document.addEventListener('mousedown', handleClickOutside);
//     }
    
//     // Cleanup the event listener
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [dropdownOpen]);

//   // Update document body class when dark mode changes
//   useEffect(() => {
//     if (darkMode) {
//       document.body.classList.add('dark');
//     } else {
//       document.body.classList.remove('dark');
//     }
//   }, [darkMode]);

//   // Handle logout
//   const handleLogout = () => {
//     // Clear all authentication cookies
//     clearAuthCookies();
    
//     // Reset user state in the component
//     setUser(null);

//     // Close dropdown
//     setDropdownOpen(false);
//     tryLogout(true);

//     // Redirect to login page
//     router.push("/auth/login");
//   };

//   // Handle login
//   const handleLogin = () => {
//     console.log('logging out');
//     tryLogin(true);
//   };

//   // Toggle dark mode
//   const toggleDarkMode = () => {
//     const newDarkMode = !darkMode;
//     setDarkMode(newDarkMode);
//     localStorage.setItem('darkMode', String(newDarkMode));

//     // Emit an event so other components can respond to the theme change
//     window.dispatchEvent(new CustomEvent('themeChange', {
//       detail: { darkMode: newDarkMode }
//     }));
//   };

//   // Navigate to settings page
//   const navigateToSettings = () => {
//     setDropdownOpen(false);
//     router.push("/dashboard/profile");
//   };

//   // Navigate to profile page
//   const navigateToProfile = () => {
//     setDropdownOpen(false);
//     router.push("/dashboard/profile?tab=personal-information");
//   };

//   // Toggle sidebar with localStorage persistence
//   const toggleSidebar = () => {
//     const newCollapsedState = !isCollapsed;
//     setIsCollapsed(newCollapsedState);
//     localStorage.setItem('sidebarCollapsed', String(newCollapsedState));
//   };

//   return (
//     <div
//       className={`min-h-screen flex overflow-hidden ${darkMode ? "bg-gray-50 text-white dark" : "bg-white text-black"}`}
//     >
//       {/* Sidebar */}
//       <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

//       {/* Main Content */}
//       <div
//         className={`flex-1 overflow-hidden transition-all duration-300 ${isCollapsed ? "ml-[80px]" : "ml-[256px]"}`}
//       >
//         {/* Top Navbar */}
//         <div className="flex justify-between items-center my-2 px-6">
//           {/* Toggle Button Moved to Left Side of Layout */}
//           <Button 
//             variant="ghost" 
//             className="p-2 hover:bg-gray-100 rounded-lg" 
//             onClick={toggleSidebar}
//           >
//             {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
//           </Button>

//           <div className="flex items-center gap-4 ml-auto">
//             {/* Notification Icon - Removed border */}
//             <button className="relative flex items-center justify-center p-2">
//               <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
//             </button>

//             {/* Profile Button - Redesigned without border */}
//             <div className="relative" ref={dropdownRef}>
//               <button
//                 className="flex items-center gap-3 cursor-pointer"
//                 onClick={() => setDropdownOpen(!dropdownOpen)}
//               >
//                 <Image
//                   src={userInfo && userInfo.photoURL ? userInfo.photoURL : "/icons/demo-profile.jpg"}
//                   alt="Profile Picture"
//                   width={30}
//                   height={30}
//                   className="rounded-full"
//                 />
//                 {/* 
//                 <div className="flex flex-col items-start">
//                   <p className="text-sm font-medium">{userInfo?.first_name} {userInfo?.last_name}</p>
//                   <p className="text-xs text-gray-500">{userInfo?.email}</p>
//                 </div>
//                 */}
//                 <ChevronDown className="w-4 h-4 ml-1 text-gray-500" />
//               </button>

//               {/* Dropdown Menu */}
//               {dropdownOpen && (
//                 <div className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 z-50">
//                   <div
//                     className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
//                     onClick={navigateToProfile}
//                   >
//                     <UserIcon className="w-4 h-4" /> Profile
//                   </div>
//                   <div className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
//                     <MessageSquare className="w-4 h-4" /> Chat with us
//                   </div>
//                   <div
//                     className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
//                     onClick={toggleDarkMode}
//                   >
//                     {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
//                     Toggle Theme
//                   </div>
//                   <div
//                     className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
//                     onClick={navigateToSettings}
//                   >
//                     <Settings className="w-4 h-4" /> Settings
//                   </div>
//                   <div
//                     className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500"
//                     onClick={handleLogin}
//                   >
//                     <LogOut className="w-4 h-4" /> Log in
//                   </div>
//                   <div
//                     className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500"
//                     onClick={handleLogout}
//                   >
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




























































// "use client";

// import { Button } from "@/components/ui/button";
// import { Bell, MessageSquare, Sun, Moon, Settings, LogOut, ChevronDown, Menu, X, User as UserIcon } from "lucide-react";
// import React, { useState, useEffect, useRef, useContext } from "react";
// import Image from "next/image";
// import { clearAuthCookies } from "@/lib/utils/cookies";
// import { useRouter } from "next/navigation";
// import Sidebar from "@/components/Sidebar";
// import { AuthContext } from "@/lib/context/auth";

// const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
//   const [darkMode, setDarkMode] = useState(false);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   // Set isCollapsed to true by default
//   const [isCollapsed, setIsCollapsed] = useState(true);
//   const router = useRouter();
//   // Create a ref for the dropdown container
//   const dropdownRef = useRef(null);
  
//   const {user: userInfo, setUser, tryLogin, tryLogout} = useContext(AuthContext);

//   // Load user info from cookies on component mount
//   useEffect(() => {
//     // Check if dark mode is saved in localStorage
//     const savedDarkMode = localStorage.getItem('darkMode');
//     if (savedDarkMode) {
//       setDarkMode(savedDarkMode === 'true');
//     }

//     // Listen for theme changes from other components
//     const handleThemeChange = (e: any) => {
//       setDarkMode(e.detail.darkMode);
//     };

//     window.addEventListener('themeChange', handleThemeChange);

//     return () => {
//       window.removeEventListener('themeChange', handleThemeChange);
//     };
//   }, []);

//   // Handle clicks outside the dropdown to close it
//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       // Using type assertion to fix TypeScript error with .contains()
//       const currentElement = dropdownRef.current as HTMLElement | null;
//       if (currentElement && !currentElement.contains(event.target as Node)) {
//         setDropdownOpen(false);
//       }
//     }
//     // Add event listener when dropdown is open
//     if (dropdownOpen) {
//       document.addEventListener('mousedown', handleClickOutside);
//     }
    
//     // Cleanup the event listener
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [dropdownOpen]);

//   // Update document body class when dark mode changes
//   useEffect(() => {
//     if (darkMode) {
//       document.body.classList.add('dark');
//     } else {
//       document.body.classList.remove('dark');
//     }
//   }, [darkMode]);

//   // Handle logout
//   const handleLogout = () => {
//     // Clear all authentication cookies
//     clearAuthCookies();
    
//     // Reset user state in the component
//     setUser(null);

//     // Close dropdown
//     setDropdownOpen(false);
//     tryLogout(true);

//     // Redirect to login page
//     router.push("/auth/login");
//   };

//   // Handle login
//   const handleLogin = () => {
//     console.log('logging out');
//     tryLogin(true);
//   };

//   // Toggle dark mode
//   const toggleDarkMode = () => {
//     const newDarkMode = !darkMode;
//     setDarkMode(newDarkMode);
//     localStorage.setItem('darkMode', String(newDarkMode));

//     // Emit an event so other components can respond to the theme change
//     window.dispatchEvent(new CustomEvent('themeChange', {
//       detail: { darkMode: newDarkMode }
//     }));
//   };

//   // Navigate to settings page
//   const navigateToSettings = () => {
//     setDropdownOpen(false);
//     router.push("/dashboard/profile");
//   };

//   // Navigate to profile page
//   const navigateToProfile = () => {
//     setDropdownOpen(false);
//     router.push("/dashboard/profile?tab=personal-information");
//   };

//   // Toggle sidebar
//   const toggleSidebar = () => {
//     setIsCollapsed(!isCollapsed);
//   };

//   return (
//     <div
//       className={`min-h-screen flex overflow-hidden ${darkMode ? "bg-gray-50 text-white dark" : "bg-white text-black"}`}
//     >
//       {/* Sidebar */}
//       <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

//       {/* Main Content */}
//       <div
//         className={`flex-1 overflow-hidden transition-all duration-300 ${isCollapsed ? "ml-[100px]" : "ml-[260px]"}`}
//       >
//         {/* Top Navbar */}
//         <div className="flex justify-between items-center my-2 px-6">
//           {/* Toggle Button Moved to Left Side of Layout */}
//           <Button 
//             variant="ghost" 
//             className="p-2 hover:bg-gray-100 rounded-lg" 
//             onClick={toggleSidebar}
//           >
//             {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
//           </Button>

//           <div className="flex items-center gap-4 ml-auto">
//             {/* Notification Icon - Removed border */}
//             <button className="relative flex items-center justify-center p-2">
//               <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
//             </button>

//             {/* Profile Button - Redesigned without border */}
//             <div className="relative" ref={dropdownRef}>
//               <button
//                 className="flex items-center gap-3 cursor-pointer"
//                 onClick={() => setDropdownOpen(!dropdownOpen)}
//               >
//                 <Image
//                   src={userInfo && userInfo.photoURL ? userInfo.photoURL : "/icons/demo-profile.jpg"}
//                   alt="Profile Picture"
//                   width={30}
//                   height={30}
//                   className="rounded-full"
//                 />
//                 {/* 
//                 <div className="flex flex-col items-start">
//                   <p className="text-sm font-medium">{userInfo?.first_name} {userInfo?.last_name}</p>
//                   <p className="text-xs text-gray-500">{userInfo?.email}</p>
//                 </div>
//                 */}
//                 <ChevronDown className="w-4 h-4 ml-1 text-gray-500" />
//               </button>

//               {/* Dropdown Menu */}
//               {dropdownOpen && (
//                 <div className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 z-50">
//                   <div
//                     className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
//                     onClick={navigateToProfile}
//                   >
//                     <UserIcon className="w-4 h-4" /> Profile
//                   </div>
//                   <div className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
//                     <MessageSquare className="w-4 h-4" /> Chat with us
//                   </div>
//                   <div
//                     className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
//                     onClick={toggleDarkMode}
//                   >
//                     {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
//                     Toggle Theme
//                   </div>
//                   <div
//                     className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
//                     onClick={navigateToSettings}
//                   >
//                     <Settings className="w-4 h-4" /> Settings
//                   </div>
//                   <div
//                     className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500"
//                     onClick={handleLogin}
//                   >
//                     <LogOut className="w-4 h-4" /> Log in
//                   </div>
//                   <div
//                     className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500"
//                     onClick={handleLogout}
//                   >
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




















































// "use client";

// import { Button } from "@/components/ui/button";
// import { Bell, MessageSquare, Sun, Moon, Settings, LogOut, ChevronDown, User as UserIcon } from "lucide-react";
// import React, { useState, useEffect, useContext } from "react";
// import Image from "next/image";
// import { clearAuthCookies } from "@/lib/utils/cookies";
// import { useRouter } from "next/navigation";
// import Sidebar from "@/components/Sidebar";
// import { AuthContext } from "@/lib/context/auth";

// const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
//   const [darkMode, setDarkMode] = useState(false);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [isCollapsed, setIsCollapsed] = useState(false);
//   const router = useRouter();

//   const {user: userInfo, setUser, tryLogin, tryLogout} = useContext(AuthContext);

//   // Load user info from cookies on component mount
//   useEffect(() => {
//     // Check if dark mode is saved in localStorage
//     const savedDarkMode = localStorage.getItem('darkMode');
//     if (savedDarkMode) {
//       setDarkMode(savedDarkMode === 'true');
//     }

//     // Listen for theme changes from other components
//     const handleThemeChange = (e: any) => {
//       setDarkMode(e.detail.darkMode);
//     };

//     window.addEventListener('themeChange', handleThemeChange);

//     return () => {
//       window.removeEventListener('themeChange', handleThemeChange);
//     };
//   }, []);

//   // Update document body class when dark mode changes
//   useEffect(() => {
//     if (darkMode) {
//       document.body.classList.add('dark');
//     } else {
//       document.body.classList.remove('dark');
//     }
//   }, [darkMode]);

//   // Handle logout
//   const handleLogout = () => {
//     // Clear all authentication cookies
//     clearAuthCookies();

//     // Reset user state in the component
//     // setUserInfo(null);
//     setUser(null);

//     // Close dropdown
//     setDropdownOpen(false);
//     tryLogout(true);

//     // Redirect to login page
//     router.push("/auth/login");
//   };
//   // Handle logout
//   const handleLogin = () => {
//     console.log('logging out')
//     // Clear all authentication cookies
//       // dispatch(setLogout(true));
//       tryLogin(true);
//   };

//   // Toggle dark mode
//   const toggleDarkMode = () => {
//     const newDarkMode = !darkMode;
//     setDarkMode(newDarkMode);
//     localStorage.setItem('darkMode', String(newDarkMode));

//     // Emit an event so other components can respond to the theme change
//     window.dispatchEvent(new CustomEvent('themeChange', {
//       detail: { darkMode: newDarkMode }
//     }));
//   };

//   // Navigate to settings page
//   const navigateToSettings = () => {
//     setDropdownOpen(false);
//     router.push("/dashboard/profile");
//   };

//   // Navigate to profile page
//   const navigateToProfile = () => {
//     setDropdownOpen(false);
//     router.push("/dashboard/profile?tab=personal-information");
//   };

//   return (
//     <div
//       className={`min-h-screen flex overflow-hidden ${darkMode ? "bg-gray-50 text-white dark" : "bg-white text-black"}`}
//     >
//       {/* Sidebar */}
//       <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

//       {/* Main Content */}
//       <div
//         className={`flex-1 overflow-hidden transition-all duration-300 ${isCollapsed ? "ml-[100px]" : "ml-[260px]"}`}
//       >
//         {/* Top Navbar */}
//         <div className="flex justify-between items-center my-2 px-6">
//           <div className="flex items-center gap-4 ml-auto mr-6">

//             {/* Profile & Notifications */}
//             <div className="flex items-center gap-4 rounded-lg border border-gray-200 p-2">
//               <button className="relative flex items-center justify-center px-2">
//                 <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
//               </button>

//               {/* Profile Button - Redesigned to match image */}
//               <div className="relative px-2 py-1">
//               <button
//                   className="flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-200 cursor-pointer"
//                   onClick={() => setDropdownOpen(!dropdownOpen)}
//                 >
//                     <Image
//                       src={userInfo && userInfo.photoURL ? userInfo.photoURL : "/icons/demo-profile.jpg"}
//                       alt="Profile Picture"
//                       width={30}
//                       height={30}
//                       className="rounded-full"
//                     />
//                   <div className="flex flex-col items-start">
//                     <p className="text-sm font-medium">{userInfo?.first_name} {userInfo?.last_name}</p>
//                     <p className="text-xs text-gray-500">{userInfo?.email}</p>
//                   </div>
//                   <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
//                 </button>

//                 {/* Dropdown Menu */}
//                 {dropdownOpen && (
//                   <div className="absolute right-0 top-16 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 z-50">
//                     <div
//                       className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
//                       onClick={navigateToProfile}
//                     >
//                       <UserIcon className="w-4 h-4" /> Profile
//                     </div>
//                     <div className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
//                       <MessageSquare className="w-4 h-4" /> Chat with us
//                     </div>
//                     <div
//                       className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
//                       onClick={toggleDarkMode}
//                     >
//                       {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
//                       Toggle Theme
//                     </div>
//                     <div
//                       className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
//                       onClick={navigateToSettings}
//                     >
//                       <Settings className="w-4 h-4" /> Settings
//                     </div>
//                     <div
//                       className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500"
//                       onClick={handleLogin}
//                     >
//                       <LogOut className="w-4 h-4" /> Log in
//                     </div>
//                     <div
//                       className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500"
//                       onClick={handleLogout}
//                     >
//                       <LogOut className="w-4 h-4" /> Log out
//                     </div>
//                   </div>
//                 )}
//               </div>
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































// "use client";

// import Sidebar from "@/components/Sidebar";
// import { Button } from "@/components/ui/button";
// import { Bell, MessageSquare, Sun, Moon, User, Settings, LogOut } from "lucide-react";
// import React, { useState, useEffect } from "react";
// import Image from "next/image";
// import { getUserInfo, clearAuthCookies } from "@/lib/utils/cookies";
// import { useRouter } from "next/navigation";

// const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
//   const [darkMode, setDarkMode] = useState(false);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [isCollapsed, setIsCollapsed] = useState(false);
//   const [userInfo, setUserInfo] = useState({ name: "", email: "" });
//   const router = useRouter();

//   // Load user info from cookies on component mount
//   useEffect(() => {
//     const cookieInfo = getUserInfo();
//     setUserInfo({
//       name: cookieInfo.name || "User",
//       email: cookieInfo.email || "user@example.com"
//     });
//   }, []);

//   // Handle logout
//   const handleLogout = () => {
//     // Clear all authentication cookies
//     clearAuthCookies();

//     // For extra security, explicitly clear individual cookies using the correct syntax
//     // Cookies.remove('accessToken', { path: '/' });
//     // Cookies.remove('__frsadfrusrtkn', { path: '/' });
//     // Cookies.remove('__rfrsadfrusrtkn', { path: '/' });
//     // Cookies.remove('userEmail', { path: '/' });
//     // Cookies.remove('userName', { path: '/' });
//     // Cookies.remove('userId', { path: '/' });

//     // Reset user state in the component
//     setUserInfo({
//       name: "",
//       email: ""
//     });

//     // Close dropdown
//     setDropdownOpen(false);

//     // Redirect to login page
//     router.push("/auth/login");
//   };

//   return (
//     <div
//       className={`min-h-screen flex overflow-hidden ${darkMode ? "bg-black text-white" : "bg-gray-200 text-black"
//         }`}
//     >
//       {/* Sidebar */}
//       <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

//       {/* Main Content */}
//       <div
//         className={`flex-1 overflow-hidden transition-all duration-300 ${isCollapsed ? "ml-[100px]" : "ml-[260px]"
//           }`}
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
//                   <p className="text-sm font-medium">{userInfo.name}</p>
//                   <p className="text-xs text-gray-500">{userInfo.email}</p>
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
//                   <div
//                     className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer text-red-500"
//                     onClick={handleLogout}
//                   >
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
