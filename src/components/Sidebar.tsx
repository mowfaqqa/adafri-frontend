"use client";
import React, { useState, useEffect, useRef } from "react";
import { Menu, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { getUserInfo as getServerUserInfo } from "@/lib/utils/cookies";

// Define proper TypeScript interfaces
interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  subItems?: SubItem[];
}

interface SubItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
}

interface UserInfo {
  name: string;
  organizationId?: string;
}

interface Workspace {
  id: string;
  name: string;
  icon: string;
}

// Navigation items matching the design - reordered as requested
const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "/icons/dashboardnew.png",
    href: "/dashboard"
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: "/icons/marketingnew.png",
    href: "/dashboard",
  },
  {
    id: "advertising",
    label: "Advertising",
    icon: "/icons/advertisingnew.png",
    href: "/dashboard",
  },
  {
    id: "tools",
    label: "Tools",
    icon: "/icons/toolsnew.png",
    href: "/dashboard",
  }
];

const externalItems: NavItem[] = [
  {
    id: "whatsapp",
    label: "Whatsapp",
    icon: "/icons/whatsapp.png",
    href: "/externals/whatsapp"
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    icon: "/icons/chatgpt.png",
    href: "/externals/chatgpt"
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: "/icons/telegram.png",
    href: "/externals/telegram"
  }
];

const SidebarItem = ({ 
  item, 
  isCollapsed,
  isActive,
  onClick
}: { 
  item: NavItem; 
  isCollapsed: boolean;
  isActive: boolean;
  onClick: () => void;
}) => {
  return (
    <div className="relative">
      <Link href={item.href} passHref>
        <div 
          className={cn(
            "flex items-center p-3 my-2 rounded-lg cursor-pointer",
            isActive ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50",
            isCollapsed && "justify-center" // Center items when collapsed
          )}
          onClick={onClick}
        >
          <div className={cn(
            "flex items-center justify-center",
            isCollapsed ? "w-8 h-8" : "w-6 h-6 mr-3" // Make icons bigger when collapsed and remove margin when collapsed
          )}>
            <Image
              src={item.icon}
              width={isCollapsed ? 28 : 24}
              height={isCollapsed ? 28 : 24}
              alt={item.label}
              className={isCollapsed ? "font-bold" : ""} // Make icons bolder when collapsed
            />
          </div>
          {!isCollapsed && <span className="font-medium">{item.label}</span>}
        </div>
      </Link>
    </div>
  );
};

// Modal component for signing into another workspace
const WorkspaceModal = ({ isOpen, onClose, onSubmit }: { 
  isOpen: boolean; 
  onClose: () => void;
  onSubmit: (data: { organizationId: string; email: string; password: string }) => void;
}) => {
  const [formData, setFormData] = useState({
    organizationId: "",
    email: "",
    password: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Sign into workspace</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="organizationId" className="block text-sm font-medium text-gray-700 mb-1">
              Organization ID
            </label>
            <input
              id="organizationId"
              name="organizationId"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.organizationId}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
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

const Sidebar = ({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: "" });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Handle clicks outside of the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Try to get user info from cookies first
    try {
      const cookieInfo = getServerUserInfo();
      if (cookieInfo && cookieInfo.name) {
        setUserInfo({
          name: cookieInfo.name,
          // organizationId: cookieInfo.organizationId || undefined
        });
      } else {
        // Fallback to localStorage if cookie info doesn't have name
        const localInfo = getLocalUserInfo();
        setUserInfo({
          name: localInfo.name
        });
      }

      // Get workspaces from localStorage if available
      const storedWorkspaces = localStorage.getItem('workspaces');
      if (storedWorkspaces) {
        setWorkspaces(JSON.parse(storedWorkspaces));
      }
    } catch (error) {
      console.log("Error getting user info from cookies, falling back to localStorage");
      // Fallback to localStorage
      const localInfo = getLocalUserInfo();
      setUserInfo({
        name: localInfo.name
      });
    }
    
    // Set active tab based on pathname
    const path = pathname.split('/')[1];
    if (path) {
      const matchingItem = [...navItems, ...externalItems].find(
        item => item.href.includes(`/${path}`)
      );
      if (matchingItem) {
        setActiveTab(matchingItem.id);
        // Also update localStorage for Dashboard to read
        localStorage.setItem('activeCategory', matchingItem.id);
      }
    }
  }, [pathname]);

  const handleItemClick = (item: NavItem) => {
    setActiveTab(item.id);
    
    // Store the active category in localStorage for dashboard to use
    localStorage.setItem('activeCategory', item.id);
    
    // Trigger localStorage event for dashboard to detect
    window.dispatchEvent(new Event('storage'));
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleSignIntoWorkspace = (data: { organizationId: string; email: string; password: string }) => {
    // Simulate signing into workspace
    const newWorkspace: Workspace = {
      id: data.organizationId,
      name: data.email.split('@')[0], // Use part of email as name for demo
      icon: data.organizationId.substring(0, 2).toUpperCase() // Use first two letters as icon
    };
    
    const updatedWorkspaces = [...workspaces, newWorkspace];
    setWorkspaces(updatedWorkspaces);
    
    // Store in localStorage
    localStorage.setItem('workspaces', JSON.stringify(updatedWorkspaces));
    
    // Close modal
    setShowModal(false);
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    // Simulate switching workspace
    setUserInfo({
      ...userInfo,
      name: workspace.name,
      organizationId: workspace.id
    });
    
    // Close dropdown
    setShowDropdown(false);
  };

  // Generate initials for user's icon
  const userInitials = userInfo.name ? userInfo.name.substring(0, 2).toUpperCase() : "US";

  return (
    <div className="relative">
      <div
        className={cn(
          "flex flex-col h-screen bg-white border-r transition-all duration-300 top-0 left-0 fixed",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-center">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex">
            <Image
              src="/icons/icon-main.png"
              width={40}
              height={40}
              alt="icon"
            />
          </div>
          {!isCollapsed && (
            <Image
              src="/icons/djombi-icon.png"
              width={140}
              height={40}
              alt="icon"
            />
          )}
        </div>

        {/* Toggle button */}
        <div className="flex justify-center">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-3 hover:bg-gray-100 rounded-lg items-center"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Company selector with dropdown */}
        <div className="px-4 py-3 relative" ref={dropdownRef}>
          <div 
            className={cn(
              "flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50",
              isCollapsed ? "justify-center" : "justify-between"
            )}
            onClick={toggleDropdown}
          >
            <div className="flex items-center">
              <div className="w-6 h-6 bg-blue-600 rounded mr-2 flex items-center justify-center text-white text-xs font-bold">
                {userInitials}
              </div>
              {!isCollapsed && <span className="font-medium">{userInfo.name}</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown size={16} />
            )}
          </div>

          {/* Workspace Dropdown */}
          {showDropdown && !isCollapsed && (
            <div className="absolute left-4 right-4 mt-2 bg-white border rounded-lg shadow-lg z-10">
              <div className="p-2">
                <p className="text-xs uppercase text-gray-400 pb-2">Workspaces</p>
                
                {/* Current workspace */}
                <div className="flex items-center p-2 bg-blue-50 rounded-md mb-1">
                  <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-medium mr-2">
                    {userInitials}
                  </div>
                  <div>
                    <p className="font-medium">{userInfo.name}</p>
                    <p className="text-xs text-gray-500">Current workspace</p>
                  </div>
                </div>
                
                {/* Other workspaces */}
                {workspaces.filter(w => w.id !== userInfo.organizationId).map((workspace) => (
                  <div 
                    key={workspace.id}
                    className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                    onClick={() => handleWorkspaceClick(workspace)}
                  >
                    <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center text-white font-medium mr-2">
                      {workspace.icon}
                    </div>
                    <div>
                      <p className="font-medium">{workspace.name}</p>
                    </div>
                  </div>
                ))}
                
                {/* Add workspace button */}
                <button 
                  className="w-full mt-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium flex items-center justify-center"
                  onClick={() => {
                    setShowDropdown(false);
                    setShowModal(true);
                  }}
                >
                  <span>+ Sign into another workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto px-4">
          {/* Dashboard Item (Placed first as requested) */}
          <SidebarItem
            key={navItems[0].id}
            item={navItems[0]}
            isCollapsed={isCollapsed}
            isActive={activeTab === navItems[0].id}
            onClick={() => handleItemClick(navItems[0])}
          />
          
          {/* Features section */}
          {!isCollapsed && (
            <div className="text-xs uppercase text-gray-400 mt-4 mb-2 px-3">
              FEATURES
            </div>
          )}
          
          {/* Other Menu Items (marketing, advertising, tools) */}
          <div className="mb-6">
            {navItems.slice(1).map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                isCollapsed={isCollapsed}
                isActive={activeTab === item.id}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>

          {/* Externals Section */}
          {!isCollapsed && (
            <div className="text-xs uppercase text-gray-400 mt-4 mb-2 px-3">
              EXTERNALS
            </div>
          )}
          
          <div className="mb-6">
            {externalItems.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                isCollapsed={isCollapsed}
                isActive={activeTab === item.id}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>
        </div>

        {/* Upgrade Banner */}
        <div className="mx-4 mb-4 bg-gradient-to-b from-blue-400 to-blue-600 rounded-lg text-white p-4">
          <div className="flex justify-center mb-3">
            <div className="bg-white/20 rounded-full p-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 3L19 12L5 21V3Z"
                  fill="white"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          {!isCollapsed && (
            <>
              <h3 className="text-center font-medium mb-1">Upgrade your potential</h3>
              <p className="text-sm text-center mb-3">you're now using Free plan.</p>
              <button className="w-full py-2 bg-blue-700 hover:bg-blue-800 rounded-lg font-medium text-center">
                UNLOCK NOW !
              </button>
            </>
          )}
        </div>
      </div>

      {/* Workspace Sign-in Modal */}
      <WorkspaceModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSignIntoWorkspace}
      />
    </div>
  );
};

export default Sidebar;










































































// "use client";
// import React, { useState, useEffect } from "react";
// import { Menu } from "lucide-react";
// import { cn } from "@/lib/utils";
// import Link from "next/link";
// import Image from "next/image";
// import { usePathname, useRouter } from "next/navigation";

// // Define proper TypeScript interfaces
// interface NavItem {
//   id: string;
//   label: string;
//   icon: string;
//   href: string;
//   subItems?: SubItem[];
// }

// interface SubItem {
//   id: string;
//   label: string;
//   href: string;
//   icon?: string;
// }

// // Navigation items matching the design
// const navItems: NavItem[] = [
//   {
//     id: "dashboard",
//     label: "Dashboard",
//     icon: "/icons/dashboardnew.png",
//     href: "/dashboard"
//   },
//   {
//     id: "marketing",
//     label: "Marketing",
//     icon: "/icons/marketingnew.png",
//     href: "/dashboard",
//   },
//   {
//     id: "advertising",
//     label: "Advertising",
//     icon: "/icons/advertisingnew.png",
//     href: "/dashboard",
//   },
//   {
//     id: "tools",
//     label: "Tools",
//     icon: "/icons/toolsnew.png",
//     href: "/dashboard",
//   }
// ];

// const externalItems: NavItem[] = [
//   {
//     id: "whatsapp",
//     label: "Whatsapp",
//     icon: "/icons/whatsapp.png",
//     href: "/externals/whatsapp"
//   },
//   {
//     id: "chatgpt",
//     label: "ChatGPT",
//     icon: "/icons/chatgpt.png",
//     href: "/externals/chatgpt"
//   },
//   {
//     id: "telegram",
//     label: "Telegram",
//     icon: "/icons/telegram.png",
//     href: "/externals/telegram"
//   }
// ];

// const SidebarItem = ({ 
//   item, 
//   isCollapsed,
//   isActive,
//   onClick
// }: { 
//   item: NavItem; 
//   isCollapsed: boolean;
//   isActive: boolean;
//   onClick: () => void;
// }) => {
//   return (
//     <div className="relative">
//       <Link href={item.href} passHref>
//         <div 
//           className={cn(
//             "flex items-center p-3 my-2 rounded-lg cursor-pointer",
//             isActive ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
//           )}
//           onClick={onClick}
//         >
//           <div className={cn(
//             "flex items-center justify-center mr-3",
//             isCollapsed ? "w-8 h-8" : "w-6 h-6" // Make icons bigger when collapsed
//           )}>
//             <Image
//               src={item.icon}
//               width={isCollapsed ? 28 : 24}
//               height={isCollapsed ? 28 : 24}
//               alt={item.label}
//             />
//           </div>
//           {!isCollapsed && <span className="font-medium">{item.label}</span>}
//         </div>
//       </Link>
//     </div>
//   );
// };

// const Sidebar = ({
//   isCollapsed,
//   setIsCollapsed,
// }: {
//   isCollapsed: boolean;
//   setIsCollapsed: (collapsed: boolean) => void;
// }) => {
//   const [activeTab, setActiveTab] = useState("dashboard");
//   const pathname = usePathname();
//   const router = useRouter();

//   useEffect(() => {
//     // Set active tab based on pathname
//     const path = pathname.split('/')[1];
//     if (path) {
//       const matchingItem = [...navItems, ...externalItems].find(
//         item => item.href.includes(`/${path}`)
//       );
//       if (matchingItem) {
//         setActiveTab(matchingItem.id);
//         // Also update localStorage for Dashboard to read
//         localStorage.setItem('activeCategory', matchingItem.id);
//       }
//     }
//   }, [pathname]);

//   const handleItemClick = (item: NavItem) => {
//     setActiveTab(item.id);
    
//     // Store the active category in localStorage for dashboard to use
//     localStorage.setItem('activeCategory', item.id);
    
//     // Trigger localStorage event for dashboard to detect
//     window.dispatchEvent(new Event('storage'));
//   };

//   return (
//     <div className="relative">
//       <div
//         className={cn(
//           "flex flex-col h-screen bg-white border-r transition-all duration-300 top-0 left-0 fixed",
//           isCollapsed ? "w-20" : "w-64"
//         )}
//       >
//         {/* Logo */}
//         <div className="p-4 flex items-center justify-center">
//           <div className="w-8 h-8 bg-emerald-600 rounded-lg flex">
//             <Image
//               src="/icons/icon-main.png"
//               width={40}
//               height={40}
//               alt="icon"
//             />
//           </div>
//           {!isCollapsed && (
//             <Image
//               src="/icons/djombi-icon.png"
//               width={140}
//               height={40}
//               alt="icon"
//             />
//           )}
//         </div>

//         {/* Toggle button */}
//         <div className="flex justify-center">
//           <button
//             onClick={() => setIsCollapsed(!isCollapsed)}
//             className="p-3 hover:bg-gray-100 rounded-lg items-center"
//           >
//             <Menu className="h-5 w-5" />
//           </button>
//         </div>

//         {/* Company selector */}
//         <div className="px-4 py-3">
//           <div className="flex items-center justify-between p-2 border rounded-lg">
//             <div className="flex items-center">
//               <div className="w-6 h-6 bg-blue-600 rounded mr-2"></div>
//               {!isCollapsed && <span className="font-medium">Company 1</span>}
//             </div>
//             {!isCollapsed && (
//               <svg
//                 width="16"
//                 height="16"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 xmlns="http://www.w3.org/2000/svg"
//               >
//                 <path
//                   d="M7 10L12 15L17 10"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 />
//               </svg>
//             )}
//           </div>
//         </div>

//         {/* Main Navigation */}
//         <div className="flex-1 overflow-y-auto px-4">
//           {/* Features section */}
//           {!isCollapsed && (
//             <div className="text-xs uppercase text-gray-400 mt-4 mb-2 px-3">
//               FEATURES
//             </div>
//           )}
          
//           {/* Menu Items */}
//           <div className="mb-6">
//             {navItems.map((item) => (
//               <SidebarItem
//                 key={item.id}
//                 item={item}
//                 isCollapsed={isCollapsed}
//                 isActive={activeTab === item.id}
//                 onClick={() => handleItemClick(item)}
//               />
//             ))}
//           </div>

//           {/* Externals Section */}
//           {!isCollapsed && (
//             <div className="text-xs uppercase text-gray-400 mt-4 mb-2 px-3">
//               EXTERNALS
//             </div>
//           )}
          
//           <div className="mb-6">
//             {externalItems.map((item) => (
//               <SidebarItem
//                 key={item.id}
//                 item={item}
//                 isCollapsed={isCollapsed}
//                 isActive={activeTab === item.id}
//                 onClick={() => handleItemClick(item)}
//               />
//             ))}
//           </div>
//         </div>

//         {/* Upgrade Banner */}
//         <div className="mx-4 mb-4 bg-gradient-to-b from-blue-400 to-blue-600 rounded-lg text-white p-4">
//           <div className="flex justify-center mb-3">
//             <div className="bg-white/20 rounded-full p-2">
//               <svg
//                 width="24"
//                 height="24"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 xmlns="http://www.w3.org/2000/svg"
//               >
//                 <path
//                   d="M5 3L19 12L5 21V3Z"
//                   fill="white"
//                   stroke="white"
//                   strokeWidth="2"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 />
//               </svg>
//             </div>
//           </div>
//           {!isCollapsed && (
//             <>
//               <h3 className="text-center font-medium mb-1">Upgrade your potential</h3>
//               <p className="text-sm text-center mb-3">you're now using Free plan.</p>
//               <button className="w-full py-2 bg-blue-700 hover:bg-blue-800 rounded-lg font-medium text-center">
//                 UNLOCK NOW !
//               </button>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Sidebar;







































// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import React, { useState, useEffect } from "react";
// import { Menu } from "lucide-react";
// import { cn } from "@/lib/utils";
// import Link from "next/link";
// import Image from "next/image";
// import { usePathname, useRouter } from "next/navigation";

// // Define proper TypeScript interfaces
// interface NavItem {
//   id: string;
//   label: string;
//   icon: string;
//   href: string;
//   subItems?: SubItem[];
// }

// interface SubItem {
//   id: string;
//   label: string;
//   href: string;
//   icon?: string;
// }

// // Navigation items matching the design
// const navItems: NavItem[] = [
//   {
//     id: "dashboard",
//     label: "Dashboard",
//     icon: "/icons/dashboardnew.png",
//     href: "/dashboard"
//   },
//   {
//     id: "marketing",
//     label: "Marketing",
//     icon: "/icons/marketingnew.png",
//     href: "/marketing",
//     subItems: [
//       { id: "email", label: "Email Marketing", href: "/marketing/email" },
//       { id: "crm", label: "CRM", href: "/marketing/crm" },
//       { id: "social", label: "Social Media", href: "/marketing/social" }
//     ]
//   },
//   {
//     id: "advertising",
//     label: "Advertising",
//     icon: "/icons/advertisingnew.png",
//     href: "/advertising",
//     subItems: [
//       { id: "google", label: "Google Ads", href: "/advertising/google" },
//       { id: "facebook", label: "Facebook Ads", href: "/advertising/facebook" },
//       { id: "linkedin", label: "LinkedIn Ads", href: "/advertising/linkedin" }
//     ]
//   },
//   {
//     id: "tools",
//     label: "Tools",
//     icon: "/icons/toolsnew.png",
//     href: "/tools",
//     subItems: [
//       { id: "builder", label: "Website Builder", href: "/tools/website-builder" },
//       { id: "analytics", label: "Analytics", href: "/tools/analytics" },
//       { id: "task", label: "Task Manager", href: "/tools/task-manager" }
//     ]
//   }
// ];

// const externalItems: NavItem[] = [
//   {
//     id: "whatsapp",
//     label: "Whatsapp",
//     icon: "/icons/whatsapp.png",
//     href: "/externals/whatsapp"
//   },
//   {
//     id: "chatgpt",
//     label: "ChatGPT",
//     icon: "/icons/chatgpt.png",
//     href: "/externals/chatgpt"
//   },
//   {
//     id: "telegram",
//     label: "Telegram",
//     icon: "/icons/telegram.png",
//     href: "/externals/telegram"
//   }
// ];

// const SidebarItem = ({ 
//   item, 
//   isCollapsed,
//   isActive,
//   onClick
// }: { 
//   item: NavItem; 
//   isCollapsed: boolean;
//   isActive: boolean;
//   onClick: () => void;
// }) => {
//   // Simple item rendering without dropdown functionality
//   return (
//     <div className="relative">
//       <Link href={item.href} passHref>
//         <div 
//           className={cn(
//             "flex items-center p-3 my-2 rounded-lg cursor-pointer",
//             isActive ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
//           )}
//           onClick={onClick}
//         >
//           <div className={cn(
//             "flex items-center justify-center mr-3",
//             isCollapsed ? "w-8 h-8" : "w-6 h-6" // Make icons bigger when collapsed
//           )}>
//             <Image
//               src={item.icon}
//               width={isCollapsed ? 28 : 24}
//               height={isCollapsed ? 28 : 24}
//               alt={item.label}
//             />
//           </div>
//           {!isCollapsed && <span className="font-medium">{item.label}</span>}
//         </div>
//       </Link>
//     </div>
//   );
// };

// const Sidebar = ({
//   isCollapsed,
//   setIsCollapsed,
// }: {
//   isCollapsed: boolean;
//   setIsCollapsed: (collapsed: boolean) => void;
// }) => {
//   const [activeTab, setActiveTab] = useState("dashboard");
//   const pathname = usePathname();
//   const router = useRouter();

//   useEffect(() => {
//     // Set active tab based on pathname
//     const path = pathname.split('/')[1];
//     if (path) {
//       const matchingItem = [...navItems, ...externalItems].find(
//         item => item.href.includes(`/${path}`)
//       );
//       if (matchingItem) {
//         setActiveTab(matchingItem.id);
//       }
//     }
//   }, [pathname]);

//   const handleItemClick = (item: NavItem) => {
//     setActiveTab(item.id);
    
//     // Store the active category in localStorage for dashboard to use
//     localStorage.setItem('activeCategory', item.id);
//   };

//   return (
//     <div className="relative">
//       <div
//         className={cn(
//           "flex flex-col h-screen bg-white border-r transition-all duration-300 top-0 left-0 fixed",
//           isCollapsed ? "w-20" : "w-64"
//         )}
//       >
//         {/* Logo */}
//         <div className="p-4 flex items-center justify-center">
//           <div className="w-8 h-8 bg-emerald-600 rounded-lg flex">
//             <Image
//               src="/icons/icon-main.png"
//               width={40}
//               height={40}
//               alt="icon"
//             />
//           </div>
//           {!isCollapsed && (
//             <Image
//               src="/icons/djombi-icon.png"
//               width={140}
//               height={40}
//               alt="icon"
//             />
//           )}
//         </div>

//         {/* Toggle button */}
//         <div className="flex justify-center">
//           <button
//             onClick={() => setIsCollapsed(!isCollapsed)}
//             className="p-3 hover:bg-gray-100 rounded-lg items-center"
//           >
//             <Menu className="h-5 w-5" />
//           </button>
//         </div>

//         {/* Company selector */}
//         <div className="px-4 py-3">
//           <div className="flex items-center justify-between p-2 border rounded-lg">
//             <div className="flex items-center">
//               <div className="w-6 h-6 bg-blue-600 rounded mr-2"></div>
//               {!isCollapsed && <span className="font-medium">Company 1</span>}
//             </div>
//             {!isCollapsed && (
//               <svg
//                 width="16"
//                 height="16"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 xmlns="http://www.w3.org/2000/svg"
//               >
//                 <path
//                   d="M7 10L12 15L17 10"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 />
//               </svg>
//             )}
//           </div>
//         </div>

//         {/* Main Navigation */}
//         <div className="flex-1 overflow-y-auto px-4">
//           {/* Features section */}
//           {!isCollapsed && (
//             <div className="text-xs uppercase text-gray-400 mt-4 mb-2 px-3">
//               FEATURES
//             </div>
//           )}
          
//           {/* Menu Items */}
//           <div className="mb-6">
//             {navItems.map((item) => (
//               <SidebarItem
//                 key={item.id}
//                 item={item}
//                 isCollapsed={isCollapsed}
//                 isActive={activeTab === item.id}
//                 onClick={() => handleItemClick(item)}
//               />
//             ))}
//           </div>

//           {/* Externals Section */}
//           {!isCollapsed && (
//             <div className="text-xs uppercase text-gray-400 mt-4 mb-2 px-3">
//               EXTERNALS
//             </div>
//           )}
          
//           <div className="mb-6">
//             {externalItems.map((item) => (
//               <SidebarItem
//                 key={item.id}
//                 item={item}
//                 isCollapsed={isCollapsed}
//                 isActive={activeTab === item.id}
//                 onClick={() => handleItemClick(item)}
//               />
//             ))}
//           </div>
//         </div>

//         {/* Upgrade Banner */}
//         <div className="mx-4 mb-4 bg-gradient-to-b from-blue-400 to-blue-600 rounded-lg text-white p-4">
//           <div className="flex justify-center mb-3">
//             <div className="bg-white/20 rounded-full p-2">
//               <svg
//                 width="24"
//                 height="24"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 xmlns="http://www.w3.org/2000/svg"
//               >
//                 <path
//                   d="M5 3L19 12L5 21V3Z"
//                   fill="white"
//                   stroke="white"
//                   strokeWidth="2"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 />
//               </svg>
//             </div>
//           </div>
//           {!isCollapsed && (
//             <>
//               <h3 className="text-center font-medium mb-1">Upgrade your potential</h3>
//               <p className="text-sm text-center mb-3">you're now using Free plan.</p>
//               <button className="w-full py-2 bg-blue-700 hover:bg-blue-800 rounded-lg font-medium text-center">
//                 UNLOCK NOW !
//               </button>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Sidebar;











































































// This is the old Sidebr code



// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import React, { useState } from "react";
// import {
//   ChevronRight,
//   Menu,
//   Settings,
//   // LayoutDashboard,
//   // MessageCircle,
//   // Tool,
//   // BrandRolodex
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from "@/components/ui/collapsible";
// import Link from "next/link";
// import Image from "next/image";
// import { usePathname } from "next/navigation";

// // Navigation configuration
// const navigation = [
//   {
//     // title: "Main Menu",
//     items: [
//       {
//         label: "Dashboard",
//         icon: "/icons/dashboard2.png",
//         href: "/dashboard",
//       },
//       {
//         label: "Marketing",
//         icon: "/icons/martech2.png",
//         href: "/martech",
//         subItems: [
//           {
//             label: "Mass Mailing",
//             href: "/dashboard/mass-mailing",
//             icon: "/icons/mass-mailing.png",
//           },
//           {
//             label: "CRM",
//             href: "/dashboard/social",
//             icon: "/icons/crm.png",
//           },
//           {
//             label: "Social Listeniing",
//             href: "/dashboard/analytics",
//             icon: "/icons/social.png",
//           },
//           {
//             label: "Post Publisher",
//             href: "/dashboard/analytics",
//             icon: "/icons/post-publisher.png",
//           },
//           {
//             label: "AI Calling",
//             href: "/dashboard/analytics",
//             icon: "/icons/ai-calling.png",
//           },
//           {
//             label: "sms",
//             href: "/dashboard/analytics",
//             icon: "/icons/sms.png",
//           },
//         ],
//       },
//       {
//         label: "Advertising",
//         icon: "/icons/adtech2.png",
//         href: "/adtech",
//         subItems: [
//           {
//             label: "Google Ads",
//             href: "/dashboard/google-ads",
//             icon: "/icons/google-ads.png",
//           },
//           {
//             label: "Meta",
//             href: "/dashboard/builder",
//             icon: "/icons/meta.png",
//           },
//           {
//             label: "Twitter",
//             href: "/dashboard/performance",
//             icon: "/icons/twitter.png",
//           },
//           {
//             label: "tiktok",
//             href: "/dashboard/performance",
//             icon: "/icons/tiktok.png",
//           },
//           {
//             label: "LinkedIn",
//             href: "/dashboard/performance",
//             icon: "/icons/linkedin.png",
//           },
//           {
//             label: "Spotify",
//             href: "/dashboard/performance",
//             icon: "/icons/spotify.png",
//           },
//         ],
//       },
//       {
//         label: "Tools",
//         icon: "/icons/tool2.png",
//         href: "/tool",
//         subItems: [
//           {
//             label: "Website Builder",
//             href: "/dashboard/campaigns",
//             icon: "/icons/website-builder.png",
//           },
//           {
//             label: "Internal Message",
//             href: "/dashboard/messaging",
//             icon: "/icons/internal-message.png",
//           },
//           {
//             label: "Online Meeting",
//             href: "/dashboard/messaging",
//             icon: "/icons/online-meeting.png",
//           },
//           {
//             label: "E-sign",
//             href: "/dashboard/documents",
//             icon: "/icons/e-sign.png",
//           },
//           {
//             label: "E-sign(signatures)",
//             href: "/dashboard/signatures",
//             icon: "/icons/e-sign.png",
//           },
//           {
//             label: "Task Manager",
//             href: "/dashboard/task-manager",
//             icon: "/icons/task-manager.png",
//           },
//           {
//             label: "Image Editor",
//             href: "/dashboard/performance",
//             icon: "/icons/image-editor.png",
//           },
//         ],
//       },
//     ],
//   },
//   {
//     title: "External Messaging",
//     items: [
//       {
//         label: "Telegram",
//         icon: "/icons/telegram.png",
//         href: "/dashboard/telegram",
//         iconColor: "#229ED9",
//       },
//       {
//         label: "WhatsApp",
//         icon: "/icons/whatsapp.png",
//         href: "/dashboard/whatsapp",
//         iconColor: "#25D366",
//       },
//       {
//         label: "Messenger",
//         icon: "/icons/messager.png",
//         href: "/dashboard/messenger",
//         iconColor: "#0084FF",
//       },
//     ],
//   },
// ];

// interface SidebarProps {
//   isCollapsed: boolean;
//   setIsCollapsed: (collapsed: boolean) => void;
// }

// // Popover to show
// const PopoverContent = ({ item }: { item: any }) => {
//   return (
//     <div className="fixed left-16 top-auto min-w-[200px] bg-white rounded-lg shadow-lg border z-[100]">
//       <div className="p-2">
//         <div className="font-medium text-sm mb-2">{item.label}</div>
//         {item.subItems && (
//           <div className="space-y-1">
//             {item.subItems.map((subItem: any, index: number) => (
//               <Link key={index} href={subItem.href} passHref>
//                 <div className="flex items-center gap-3 p-2 rounded-lg cursor-pointer text-sm">
//                   <Image src={subItem.icon} alt="icon" width={24} height={24} />
//                   <span>{subItem.label}</span>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// const SidebarItem = ({ item, isCollapsed }: any) => {
//   // Set isOpen to true by default if the item label is "Martech"
//   const [isOpen, setIsOpen] = useState(item.label === "Marketing");
//   const [showPopover, setShowPopover] = useState(false);
//   const pathname = usePathname();
//   const Icon = item.icon;

//   const isActive = (item: any): boolean => {
//     if (pathname === item.href) return true;
//     if (item.subItems) {
//       return item.subItems.some((subItem: any) => pathname === subItem.href);
//     }
//     return false;
//   };
//   if (item.subItems) {
//     return (
//       <div
//         className="relative"
//         onMouseEnter={() => isCollapsed && setShowPopover(true)}
//         onMouseLeave={() => isCollapsed && setShowPopover(false)}
//       >
//         <Collapsible open={isOpen} onOpenChange={setIsOpen}>
//           <CollapsibleTrigger
//             className={cn(
//               "flex w-full items-center p-3 hover:bg-gray-100 rounded-lg",
//               isActive(item) && "bg-emerald-50 text-emerald-600"
//             )}
//           >
//             <div className="flex items-center flex-1">
//               {/* Increased icon size to 6 (24px) and ensured consistent square container */}
//               <div className="relative h-6 w-6 flex justify-center items-center">
//                 <Image
//                   src={item.icon}
//                   alt="icon"
//                   objectFit="cover"
//                   layout="fill"
//                 />
//               </div>

//               {!isCollapsed && (
//                 <>
//                   {/* Increased spacing with ml-4 instead of ml-3 */}
//                   <span className="ml-4 text-sm p-1">{item.label}</span>
//                   <ChevronRight
//                     className={cn(
//                       "ml-auto h-4 w-4 transition-transform",
//                       isOpen && "rotate-90"
//                     )}
//                   />
//                 </>
//               )}
//             </div>
//           </CollapsibleTrigger>

//           {/* SubItems Edit */}
//           <CollapsibleContent>
//             {!isCollapsed &&
//               item.subItems.map((subItem: any, index: number) => (
//                 <Link key={index} href={subItem.href} passHref>
//                   <div className="flex items-center gap-4 p-3 pl-10 hover:bg-gray-100 rounded-lg cursor-pointer text-sm">
//                     {/* Increased spacing and consistent icon size */}
//                     <div className="relative h-5 w-5 flex justify-center items-center">
//                       <Image
//                         src={subItem.icon}
//                         alt="icon"
//                         layout="fill"
//                         objectFit="cover"
//                       />
//                     </div>
//                     <span className="flex items-center">{subItem.label}</span>
//                   </div>
//                 </Link>
//               ))}
//           </CollapsibleContent>
//         </Collapsible>
//         {isCollapsed && showPopover && <PopoverContent item={item} />}
//       </div>
//     );
//   }

//   return (
//     <div
//       className="relative"
//       onMouseEnter={() => isCollapsed && setShowPopover(true)}
//       onMouseLeave={() => isCollapsed && setShowPopover(false)}
//     >
//       <Link href={item.href} passHref>
//         <div className="flex items-center p-3 hover:bg-gray-100 rounded-lg cursor-pointer">
//           {/* Increased icon size and consistent container */}
//           <div className="relative h-6 w-6 flex justify-center items-center">
//             <Image
//               src={Icon}
//               alt="icon"
//               layout="fill"
//               objectFit="cover"
//             />
//           </div>
//           {!isCollapsed && <span className="ml-4 text-sm">{item.label}</span>}
//         </div>
//       </Link>
//       {isCollapsed && showPopover && <PopoverContent item={item} />}
//     </div>
//   );
// };


// const Sidebar = ({
//   isCollapsed,
//   setIsCollapsed,
// }: {
//   isCollapsed: boolean;
//   setIsCollapsed: (collapsed: boolean) => void;
// }) => {
//   const [showPopover, setShowPopover] = useState(false);


//   return (
//     <div className="relative">
//       <div
//         className={cn(
//           "flex flex-col h-screen bg-white border-r transition-all duration-300 top-0 left-0 fixed",
//           isCollapsed ? "w-20" : "w-64"
//         )}
//       >
//         {/* Logo */}
//         <div className="p-4 flex items-center justify-center">
//           <div className="w-8 h-8 bg-emerald-600 rounded-lg flex">
//             <Image
//               src="/icons/icon-main.png"
//               width={40}
//               height={40}
//               alt="icon"
//             />
//           </div>
//           {!isCollapsed && (
//             <Image
//               src="/icons/djombi-icon.png"
//               width={140}
//               height={40}
//               alt="icon"
//             />
//           )}
//         </div>

//         {/* Toggle button - centered when collapsed */}
//         <div className="flex justify-center">
//           <button
//             onClick={() => setIsCollapsed(!isCollapsed)}
//             className="p-3 hover:bg-gray-100 rounded-lg items-center"
//           >
//             <Menu className="h-5 w-5" />
//           </button>
//         </div>

//         {/* Navigation Sections - Increased spacing */}
//         <div className="flex-1 overflow-y-auto">
//           {navigation
//             // filter out the external messaging
//             .filter((section) => section.title !== "External Messaging")
//             .map((section, index: number) => (
//               <div
//                 key={index}
//                 className={`flex flex-col ${isCollapsed ? "items-center" : "pl-6"} mb-8`}
//               >
//                 {!isCollapsed && (
//                   <div className="text-xs uppercase text-gray-500 mb-3">
//                     {section.title}
//                   </div>
//                 )}
//                 <div className={`space-y-4 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
//                   {section.items.map((item) => (
//                     <SidebarItem
//                       key={item.href}
//                       item={item}
//                       isCollapsed={isCollapsed}
//                       className={`py-3 ${isCollapsed ? "flex justify-center" : ""}`}
//                     />
//                   ))}
//                 </div>
//               </div>
//             ))}
//         </div>

//         {/* Messaging Section (Moved to Bottom) - Added gray square backgrounds for collapsed icons */}
//         <div className={`p-4 mb-5 border-t ${isCollapsed ? "flex flex-col items-center" : "pl-6"}`}>
//           {!isCollapsed && (
//             <div className="text-xs uppercase text-gray-500 mb-3">
//               Messaging
//             </div>
//           )}
//           {navigation
//             .find((section) => section.title === "External Messaging")
//             ?.items.map((item) => (
//               <div key={item.href} className="mt-2">
//                 {isCollapsed ? (
//                   <Link href={item.href} passHref>
//                     {/* Gray square background for collapsed messaging icons */}
//                     <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
//                       <div className="relative h-6 w-6 flex justify-center items-center">
//                         <Image
//                           src={item.icon}
//                           alt="icon"
//                           layout="fill"
//                           objectFit="cover"
//                         />
//                       </div>
//                     </div>
//                   </Link>
//                 ) : (
//                   <SidebarItem
//                     item={item}
//                     isCollapsed={isCollapsed}
//                     className="py-3"
//                   />
//                 )}
//               </div>
//             ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Sidebar;



















// const SidebarItem = ({ item, isCollapsed }: any) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [showPopover, setShowPopover] = useState(false);
//   const pathname = usePathname();
//   const Icon = item.icon;

//   const isActive = (item: any): boolean => {
//     if (pathname === item.href) return true;
//     if (item.subItems) {
//       return item.subItems.some((subItem: any) => pathname === subItem.href);
//     }
//     return false;
//   };
//   if (item.subItems) {
//     return (
//       <div
//         className="relative"
//         onMouseEnter={() => isCollapsed && setShowPopover(true)}
//         onMouseLeave={() => isCollapsed && setShowPopover(false)}
//       >
//         <Collapsible open={isOpen} onOpenChange={setIsOpen}>
//           <CollapsibleTrigger
//             className={cn(
//               "flex w-full items-center p-2 hover:bg-gray-100 rounded-lg",
//               isActive(item) && "bg-emerald-50 text-emerald-600"
//             )}
//           >
//             <div className="flex items-center flex-1">
//               <div className=" relative h-5 w-5 flex justify-center">
//                 <Image
//                   src={item.icon}
//                   alt="icon"
//                   objectFit="cover"
//                   layout="fill"
//                 />
//               </div>

//               {!isCollapsed && (
//                 <>
//                   <span className="ml-3 text-sm p-1">{item.label}</span>
//                   <ChevronRight
//                     className={cn(
//                       "ml-auto h-4 w-4 transition-transform",
//                       isOpen && "rotate-90"
//                     )}
//                   />
//                 </>
//               )}
//             </div>
//           </CollapsibleTrigger>

//           {/* SubItems Edit */}
//           <CollapsibleContent>
//             {!isCollapsed &&
//               item.subItems.map((subItem: any, index: number) => (
//                 <Link key={index} href={subItem.href} passHref>
//                   <div className="flex items-center gap-3 p-2 pl-9 hover:bg-gray-100 rounded-lg cursor-pointer text-sm">
//                     <Image
//                       src={subItem.icon}
//                       alt="icon"
//                       width={14}
//                       height={14}

//                     />
//                     <span className="flex items-center ">{subItem.label}</span>
//                   </div>
//                 </Link>
//               ))}
//           </CollapsibleContent>
//         </Collapsible>
//         {isCollapsed && showPopover && <PopoverContent item={item} />}
//       </div>
//     );
//   }

//   return (
//     <div
//       className="relative"
//       onMouseEnter={() => isCollapsed && setShowPopover(true)}
//       onMouseLeave={() => isCollapsed && setShowPopover(false)}
//     >
//       <Link href={item.href} passHref>
//         <div className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
//           <Image src={Icon} alt="icon" width={14} height={14} />
//           {!isCollapsed && <span className="ml-3 text-sm">{item.label}</span>}
//         </div>
//       </Link>
//       {isCollapsed && showPopover && <PopoverContent item={item} />}
//     </div>
//   );
// };

// const Sidebar = () => {
//   const [isCollapsed, setIsCollapsed] = useState(false);
//   const [showPopover, setShowPopover] = useState(false);

//   return (
//     <div className="relative">
//       <div
//         className={cn(
//           "flex flex-col h-screen bg-white border-r transition-all duration-300",
//           isCollapsed ? "w-20" : "w-64"
//         )}
//       >
//         {/* Logo */}
//         <div className="p-4 flex items-center justify-center">
//           <div className="w-8 h-8 bg-emerald-600 rounded-lg flex">
//             <Image
//               src="/icons/icon-main.png"
//               width={40}
//               height={40}
//               alt="icon"
//             />
//           </div>
//           {!isCollapsed && (
//             <Image
//               src="/icons/djombi-icon.png"
//               width={140}
//               height={40}
//               alt="icon"
//             />
//           )}
//         </div>

//         {/* Toggle button - centered when collapsed */}
//         <div className="flex justify-center">
//           <button
//             onClick={() => setIsCollapsed(!isCollapsed)}
//             className="p-2 hover:bg-gray-100 rounded-lg items-center"
//           >
//             <Menu className="h-5 w-5" />
//           </button>
//         </div>

//         {/* Navigation Sections */}
//         <div className="flex-1 overflow-y-auto">
//           {navigation
//             // filter out the external messaging
//             .filter((section) => section.title !== "External Messaging")
//             .map((section, index: number) => (
//               <div
//                 key={index}
//                 className={`flex flex-col ${isCollapsed ? "items-center" : "pl-6"} mb-6`}
//               >
//                 {!isCollapsed && (
//                   <div className="text-xs uppercase text-gray-500 mb-2">
//                     {section.title}
//                   </div>
//                 )}
//                 <div className={`space-y-3 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
//                   {section.items.map((item) => (
//                     <SidebarItem
//                       key={item.href}
//                       item={item}
//                       isCollapsed={isCollapsed}
//                       className={`py-2 ${isCollapsed ? "flex justify-center" : ""}`}
//                     />
//                   ))}
//                 </div>
//               </div>
//             ))}
//         </div>

//         {/* Messaging Section (Moved to Bottom) */}
//         <div className={`p-4 mb-5 border-t ${isCollapsed ? "flex flex-col items-center" : "pl-6"}`}>
//           {!isCollapsed && (
//             <div className="text-xs uppercase text-gray-500 mb-2">
//               Messaging
//             </div>
//           )}
//           {navigation
//             .find((section) => section.title === "External Messaging")
//             ?.items.map((item) => (
//               <SidebarItem
//                 key={item.href}
//                 item={item}
//                 isCollapsed={isCollapsed}
//                 className={`py-2 ${isCollapsed ? "bg-gray-100 rounded-lg w-12 h-12 flex items-center justify-center" : ""}`}
//               />
//             ))}
//         </div>
//       </div>
//     </div>
//   );
// };







{/* Settings at the bottom */ }
{/* <div className="p-2 border-t">
          <div
            className="relative"
            onMouseEnter={() => isCollapsed && setShowPopover(true)}
            onMouseLeave={() => isCollapsed && setShowPopover(false)}
          >
            <Link href="/dashboard/settings">
              <div className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                <Settings className="h-5 w-5 text-emerald-600" />
                {!isCollapsed && <span className="ml-3 text-sm">Settings</span>}
              </div>
            </Link>
            {isCollapsed && showPopover && (
              <PopoverContent item={{ label: "Settings" }} />
            )}
          </div>
        </div> */}