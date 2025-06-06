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
        href: "/"
    },
    {
        id: "marketing",
        label: "Marketing",
        icon: "/icons/marketingnew.png",
        href: "/",
    },
    {
        id: "advertising",
        label: "Advertising",
        icon: "/icons/advertisingnew.png",
        href: "/",
    },
    {
        id: "tools",
        label: "Tools",
        icon: "/icons/toolsnew.png",
        href: "/",
    }
];

const externalItems: NavItem[] = [
    {
        id: "whatsapp",
        label: "Whatsapp",
        icon: "/icons/whatsapp.png",
        href: "/"
    },
    {
        id: "chatgpt",
        label: "ChatGPT",
        icon: "/icons/chatgpt.png",
        href: "/"
    },
    {
        id: "telegram",
        label: "Telegram",
        icon: "/icons/telegram.png",
        href: "/"
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

const UserTestSidebar = ({
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

    const handleSignUp = () => {
        router.push('/auth/signup');
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
                            <button
                                className="w-full py-2 bg-blue-700 hover:bg-blue-800 rounded-lg font-medium text-center text-white"
                                onClick={handleSignUp}
                            >
                                SIGN UP NOW
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

export default UserTestSidebar;
