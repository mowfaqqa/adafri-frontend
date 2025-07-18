"use client";
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { getUserInfo as getServerUserInfo } from "@/lib/utils/cookies";
import OrganizationSelector from "./OrganizationSelector"; // Import the new component
import EnhancedOrganizationSelector from "./Organization/EnhancedOrganizationSelector";

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

// Navigation items matching the design - reordered as requested
const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "/icons/dashboardnew.png",
    href: "/dashboard",
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
  },
];

const externalItems: NavItem[] = [
  {
    id: "whatsapp",
    label: "Whatsapp",
    icon: "/icons/whatsapp.png",
    href: "/dashboard/whatsapp",
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    icon: "/icons/chatgpt.png",
    href: "/dashboard/chatgpt",
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: "/icons/telegram.png",
    href: "/dashboard/telegram",
  },
];

// Updated SidebarItem interface to include mobile props
interface SidebarItemProps {
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
  onClick: () => void;
  isMobile?: boolean;
  onMobileItemClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  isCollapsed,
  isActive,
  onClick,
  isMobile = false,
  onMobileItemClick,
}) => {
  const handleClick = () => {
    onClick();
    if (isMobile && onMobileItemClick) {
      onMobileItemClick();
    }
  };

  return (
    <div className="relative">
      <Link href={item.href} passHref>
        <div
          className={cn(
            "flex items-center p-3 my-2 rounded-lg cursor-pointer",
            isActive ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50",
            isCollapsed && !isMobile && "justify-center" // Center items when collapsed on desktop only
          )}
          onClick={handleClick}
        >
          <div
            className={cn(
              "flex items-center justify-center",
              isCollapsed && !isMobile ? "w-8 h-8" : "w-6 h-6 mr-3" // Make icons bigger when collapsed and remove margin when collapsed (desktop only)
            )}
          >
            <Image
              src={item.icon}
              width={isCollapsed && !isMobile ? 28 : 24}
              height={isCollapsed && !isMobile ? 28 : 24}
              alt={item.label}
              className={isCollapsed && !isMobile ? "font-bold" : ""} // Make icons bolder when collapsed (desktop only)
            />
          </div>
          {(!isCollapsed || isMobile) && (
            <span className="font-medium">{item.label}</span>
          )}
        </div>
      </Link>
    </div>
  );
};

// Local function to get user info from localStorage
const getLocalUserInfo = (): UserInfo => {
  // Only execute on client-side
  if (typeof window !== "undefined") {
    const storedName = localStorage.getItem("userName");
    return { name: storedName || "User" };
  }
  return { name: "User" };
};

// Updated Sidebar interface to include mobile props
interface SidebarProps {
  isCollapsed?: boolean; // Default to false (open)
  setIsCollapsed: (collapsed: boolean) => void;
  isMobile?: boolean;
  onMobileItemClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false, // Default to false (open)
  setIsCollapsed,
  isMobile = false,
  onMobileItemClick,
}) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: "" });
  const pathname = usePathname();
  const router = useRouter();

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
          name: localInfo.name,
        });
      }
    } catch (error) {
      console.log(
        "Error getting user info from cookies, falling back to localStorage"
      );
      // Fallback to localStorage
      const localInfo = getLocalUserInfo();
      setUserInfo({
        name: localInfo.name,
      });
    }

    // Set active tab based on pathname
    const path = pathname.split("/")[1];
    if (path) {
      const matchingItem = [...navItems, ...externalItems].find((item) =>
        item.href.includes(`/${path}`)
      );
      if (matchingItem) {
        setActiveTab(matchingItem.id);
        // Also update localStorage for Dashboard to read
        localStorage.setItem("activeCategory", matchingItem.id);
      }
    }
  }, [pathname]);

  const handleItemClick = (item: NavItem) => {
    setActiveTab(item.id);

    // Store the active category in localStorage for dashboard to use
    localStorage.setItem("activeCategory", item.id);

    // Trigger localStorage event for dashboard to detect
    window.dispatchEvent(new Event("storage"));
  };

  const handleUpgradeClick = () => {
    // Navigate to the dashboard/transaction page
    router.push("/dashboard/transaction");
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "flex flex-col h-screen bg-white border-r transition-all duration-300 top-0 left-0 fixed z-50",
          isMobile
            ? "w-64" // Full width on mobile
            : isCollapsed
              ? "w-20"
              : "w-64"
        )}
      >
        {/* Logo */}
        <div className="p-2 flex items-center justify-center">
          <Link
            href="https://djombi.com"
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Image
                src="/icons/icon-main.png"
                width={32}
                height={32}
                alt="icon"
              />
            </div>
            {(!isCollapsed || isMobile) && (
              <Image
                src="/icons/djombi-icon.png"
                width={120}
                height={32}
                alt="icon"
                className="ml-2"
              />
            )}
          </Link>
        </div>

        {/* Organization Selector Component - Updated with mobile support */}
        <EnhancedOrganizationSelector
          isCollapsed={isCollapsed}
          isMobile={isMobile}
        />

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto px-4">
          {/* Dashboard Item (Placed first as requested) */}
          <SidebarItem
            key={navItems[0].id}
            item={navItems[0]}
            isCollapsed={isCollapsed}
            isActive={activeTab === navItems[0].id}
            onClick={() => handleItemClick(navItems[0])}
            isMobile={isMobile}
            onMobileItemClick={onMobileItemClick}
          />

          {/* Features section */}
          {(!isCollapsed || isMobile) && (
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
                isMobile={isMobile}
                onMobileItemClick={onMobileItemClick}
              />
            ))}
          </div>

          {/* Externals Section */}
          {(!isCollapsed || isMobile) && (
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
                isMobile={isMobile}
                onMobileItemClick={onMobileItemClick}
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
          {(!isCollapsed || isMobile) && (
            <>
              <h3 className="text-center font-medium mb-1">
                Upgrade your potential
              </h3>
              <p className="text-sm text-center mb-3">
                you're now using Free plan.
              </p>
              <button
                onClick={handleUpgradeClick}
                className="w-full py-2 bg-blue-700 hover:bg-blue-800 rounded-lg font-medium text-center"
              >
                UNLOCK NOW !
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
