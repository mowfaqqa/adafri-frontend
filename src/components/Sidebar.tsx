/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import {
  ChevronRight,
  Menu,
  Settings,
  // LayoutDashboard,
  // MessageCircle,
  // Tool,
  // BrandRolodex
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

// Navigation configuration
const navigation = [
  {
    title: "Main Menu",
    items: [
      {
        label: "Dashboard",
        icon: "/icons/martech.png",
        href: "/dashboard",
      },
      {
        label: "Martech",
        icon: "/icons/martech.png",
        href: "/martech",
        subItems: [
          {
            label: "Mass Mailing",
            href: "/dashboard/email",
            icon: "/icons/mass-mailing.png",
          },
          {
            label: "CRM",
            href: "/dashboard/social",
            icon: "/icons/crm.png",
          },
          {
            label: "Social Listeniing",
            href: "/dashboard/analytics",
            icon: "/icons/social.png",
          },
          {
            label: "Post Publisher",
            href: "/dashboard/analytics",
            icon: "/icons/post-publisher.png",
          },
          {
            label: "AI Calling",
            href: "/dashboard/analytics",
            icon: "/icons/ai-calling.png",
          },
          {
            label: "sms",
            href: "/dashboard/analytics",
            icon: "/icons/sms.png",
          },
        ],
      },
      {
        label: "Adtech",
        icon: "/icons/adtech.png",
        href: "/adtech",
        subItems: [
          {
            label: "Google Ads",
            href: "/dashboard/campaigns",
            icon: "/icons/google-ads.png",
          },
          {
            label: "Meta",
            href: "/dashboard/builder",
            icon: "/icons/meta.png",
          },
          {
            label: "Twitter",
            href: "/dashboard/performance",
            icon: "/icons/twitter.png",
          },
          {
            label: "tiktok",
            href: "/dashboard/performance",
            icon: "/icons/tiktok.png",
          },
          {
            label: "LinkedIn",
            href: "/dashboard/performance",
            icon: "/icons/linkedin.png",
          },
          {
            label: "Spotify",
            href: "/dashboard/performance",
            icon: "/icons/spotify.png",
          },
        ],
      },
      {
        label: "Tools",
        icon: "/icons/tool.png",
        href: "/tool",
        subItems: [
          {
            label: "Website Builder",
            href: "/dashboard/campaigns",
            icon: "/icons/website-builder.png",
          },
          {
            label: "Internal Message",
            href: "/dashboard/messaging",
            icon: "/icons/internal-message.png",
          },
          {
            label: "Online Meeting",
            href: "/dashboard/performance",
            icon: "/icons/online-meeting.png",
          },
          {
            label: "E-sign",
            href: "/dashboard/performance",
            icon: "/icons/e-sign.png",
          },
          {
            label: "Task Manager",
            href: "/dashboard/task-manager",
            icon: "/icons/task-manager.png",
          },
          {
            label: "Image Editor",
            href: "/dashboard/performance",
            icon: "/icons/image-editor.png",
          },
        ],
      },
    ],
  },
  {
    title: "Messaging",
    items: [
      {
        label: "Telegram",
        icon: "/icons/telegram.png",
        href: "/telegram",
        iconColor: "#229ED9",
      },
      {
        label: "WhatsApp",
        icon: "/icons/whatsapp.png",
        href: "/whatsapp",
        iconColor: "#25D366",
      },
      {
        label: "Messenger",
        icon: "/icons/facebook.png",
        href: "/messenger",
        iconColor: "#0084FF",
      },
    ],
  },
];

const PopoverContent = ({ item }: { item: any }) => {
  return (
    <div className="fixed left-16 top-auto min-w-[200px] bg-white rounded-lg shadow-lg border z-[100]">
      <div className="p-2">
        <div className="font-medium text-sm mb-2">{item.label}</div>
        {item.subItems && (
          <div className="space-y-1">
            {item.subItems.map((subItem: any, index: number) => (
              <Link key={index} href={subItem.href} passHref>
                <div className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer text-sm">
                  <Image src={subItem.icon} alt="icon" width={14} height={14} />
                  <span>{subItem.label}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
const SidebarItem = ({ item, isCollapsed }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const pathname = usePathname();
  const Icon = item.icon;

  const isActive = (item: any): boolean => {
    if (pathname === item.href) return true;
    if (item.subItems) {
      return item.subItems.some((subItem: any) => pathname === subItem.href);
    }
    return false;
  };
  if (item.subItems) {
    return (
      <div
        className="relative"
        onMouseEnter={() => isCollapsed && setShowPopover(true)}
        onMouseLeave={() => isCollapsed && setShowPopover(false)}
      >
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger
            className={cn(
              "flex w-full items-center p-2 hover:bg-gray-100 rounded-lg",
              isActive(item) && "bg-emerald-50 text-emerald-600"
            )}
          >
            <div className="flex items-center flex-1">
              <div className=" relative h-5 w-5 flex justify-center">
                <Image
                  src={item.icon}
                  alt="icon"
                  objectFit="cover"
                  layout="fill"
                />
              </div>

              {!isCollapsed && (
                <>
                  <span className="ml-3 text-sm">{item.label}</span>
                  <ChevronRight
                    className={cn(
                      "ml-auto h-4 w-4 transition-transform",
                      isOpen && "rotate-90"
                    )}
                  />
                </>
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {!isCollapsed &&
              item.subItems.map((subItem: any, index: number) => (
                <Link key={index} href={subItem.href} passHref>
                  <div className="flex items-center gap-3 p-2 pl-9 hover:bg-gray-100 rounded-lg cursor-pointer text-sm">
                    <Image
                      src={subItem.icon}
                      alt="icon"
                      width={14}
                      height={14}
                    />
                    <span className="flex items-center ">{subItem.label}</span>
                  </div>
                </Link>
              ))}
          </CollapsibleContent>
        </Collapsible>
        {isCollapsed && showPopover && <PopoverContent item={item} />}
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => isCollapsed && setShowPopover(true)}
      onMouseLeave={() => isCollapsed && setShowPopover(false)}
    >
      <Link href={item.href} passHref>
        <div className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
          <Image src={Icon} alt="icon" width={14} height={14} />
          {!isCollapsed && <span className="ml-3 text-sm">{item.label}</span>}
        </div>
      </Link>
      {isCollapsed && showPopover && <PopoverContent item={item} />}
    </div>
  );
};

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPopover, setShowPopover] = useState(false);

  return (
    <div className="relative">
      <div
        className={cn(
          "flex flex-col h-screen bg-white border-r transition-all duration-300",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="p-4 flex items-center">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center mr-4">
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
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto">
          {navigation.map((section, index: number) => (
            <div key={index} className="mt-4 px-2">
              {!isCollapsed && (
                <div className="text-xs uppercase text-gray-500 mb-2">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => (
                <SidebarItem
                  key={item.href}
                  item={item}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Settings at the bottom */}
        <div className="p-2 border-t">
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
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
