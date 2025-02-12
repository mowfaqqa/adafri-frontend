/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import {
  ChevronRight,
  Menu,
  Settings,
  LayoutDashboard,
  // MessageCircle,
  // Tool,
  MessagesSquare,
  // BrandRolodex
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";

// Navigation configuration
const navigation = [
  {
    title: "Main Menu",
    items: [
      {
        label: "Dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
        href: "/dashboard",
      },
      {
        label: "Martech",
        // icon: BrandRolodex,
        href: "/martech",
        subItems: [
          { label: "Email Marketing", href: "/martech/email" },
          { label: "Social Media", href: "/martech/social" },
          { label: "Analytics", href: "/martech/analytics" },
        ],
      },
      {
        label: "Adtech",
        // icon: Tool,
        href: "/adtech",
        subItems: [
          { label: "Campaign Manager", href: "/adtech/campaigns" },
          { label: "Ad Builder", href: "/adtech/builder" },
          { label: "Performance", href: "/adtech/performance" },
        ],
      },
    ],
  },
  {
    title: "Messaging",
    items: [
      {
        label: "Telegram",
        icon: (
          <MessagesSquare className="h-5 w-5" style={{ color: "#229ED9" }} />
        ),
        href: "/telegram",
        iconColor: "#229ED9",
      },
      {
        label: "WhatsApp",
        icon: (
          <MessagesSquare className="h-5 w-5" style={{ color: "#25D366" }} />
        ),
        href: "/whatsapp",
        iconColor: "#25D366",
      },
      {
        label: "Messenger",
        icon: (
          <MessagesSquare className="h-5 w-5" style={{ color: "#0084FF" }} />
        ),
        href: "/messenger",
        iconColor: "#0084FF",
      },
    ],
  },
];

const SidebarItem = ({ item, isCollapsed }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = item.icon;

  if (item.subItems) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex w-full items-center p-2 hover:bg-gray-100 rounded-lg">
          <div className="flex items-center flex-1">
            {/* <Icon
              className="h-5 w-5"
              style={{ color: item.iconColor || "rgb(5 150 105)" }}
            /> */}
            {item.icon}
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
                <span className="flex items-center p-2 pl-9 hover:bg-gray-100 rounded-lg cursor-pointer text-sm">
                  {subItem.label}
                </span>
              </Link>
            ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <a
      href={item.href}
      className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
    >
      {/* <Icon
        className="h-5 w-5"
        style={{ color: item.iconColor || "rgb(5 150 105)" }}
      /> */}
      {Icon}
      {!isCollapsed && <span className="ml-3 text-sm">{item.label}</span>}
    </a>
  );
};

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-white border-r transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center">
        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">D</span>
        </div>
        {!isCollapsed && (
          <span className="ml-3 font-semibold text-xl">djombi</span>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-2 mx-2 hover:bg-gray-100 rounded-lg"
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
        <a
          href="/settings"
          className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
        >
          <Settings className="h-5 w-5 text-emerald-600" />
          {!isCollapsed && <span className="ml-3 text-sm">Settings</span>}
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
