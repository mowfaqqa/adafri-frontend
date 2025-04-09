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
    // title: "Main Menu",
    items: [
      {
        label: "Dashboard",
        icon: "/icons/dashboard2.png",
        href: "/dashboard",
      },
      {
        label: "Marketing",
        icon: "/icons/martech2.png",
        href: "/martech",
        subItems: [
          {
            label: "Mass Mailing",
            href: "/dashboard/mass-mailing",
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
        label: "Advertising",
        icon: "/icons/adtech2.png",
        href: "/adtech",
        subItems: [
          {
            label: "Google Ads",
            href: "/dashboard/google-ads",
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
        icon: "/icons/tool2.png",
        href: "/tool",
        subItems: [
          {
            label: "Professional Mail",
            href: "/dashboard/professional-mail",
            icon: "/icons/online-meeting.png",
          },
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
            href: "/dashboard/messaging",
            icon: "/icons/online-meeting.png",
          },
          {
            label: "E-sign",
            href: "/dashboard/e-sign",
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
    title: "External Messaging",
    items: [
      {
        label: "Telegram",
        icon: "/icons/telegram.png",
        href: "/dashboard/telegram",
        iconColor: "#229ED9",
      },
      {
        label: "WhatsApp",
        icon: "/icons/whatsapp.png",
        href: "/dashboard/whatsapp",
        iconColor: "#25D366",
      },
      {
        label: "Messenger",
        icon: "/icons/messager.png",
        href: "/dashboard/messenger",
        iconColor: "#0084FF",
      },
    ],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

// Popover to show
const PopoverContent = ({ item }: { item: any }) => {
  return (
    <div className="fixed left-16 top-auto min-w-[200px] bg-white rounded-lg shadow-lg border z-[100]">
      <div className="p-2">
        <div className="font-medium text-sm mb-2">{item.label}</div>
        {item.subItems && (
          <div className="space-y-1">
            {item.subItems.map((subItem: any, index: number) => (
              <Link key={index} href={subItem.href} passHref>
                <div className="flex items-center gap-3 p-2 rounded-lg cursor-pointer text-sm">
                  <Image src={subItem.icon} alt="icon" width={24} height={24} />
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
  // Set isOpen to true by default if the item label is "Martech"
  const [isOpen, setIsOpen] = useState(item.label === "Marketing");
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
              "flex w-full items-center p-3 hover:bg-gray-100 rounded-lg",
              isActive(item) && "bg-emerald-50 text-emerald-600"
            )}
          >
            <div className="flex items-center flex-1">
              {/* Increased icon size to 6 (24px) and ensured consistent square container */}
              <div className="relative h-6 w-6 flex justify-center items-center">
                <Image
                  src={item.icon}
                  alt="icon"
                  objectFit="cover"
                  layout="fill"
                />
              </div>

              {!isCollapsed && (
                <>
                  {/* Increased spacing with ml-4 instead of ml-3 */}
                  <span className="ml-4 text-sm p-1">{item.label}</span>
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

          {/* SubItems Edit */}
          <CollapsibleContent>
            {!isCollapsed &&
              item.subItems.map((subItem: any, index: number) => (
                <Link key={index} href={subItem.href} passHref>
                  <div className="flex items-center gap-4 p-3 pl-10 hover:bg-gray-100 rounded-lg cursor-pointer text-sm">
                    {/* Increased spacing and consistent icon size */}
                    <div className="relative h-5 w-5 flex justify-center items-center">
                      <Image
                        src={subItem.icon}
                        alt="icon"
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                    <span className="flex items-center">{subItem.label}</span>
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
        <div className="flex items-center p-3 hover:bg-gray-100 rounded-lg cursor-pointer">
          {/* Increased icon size and consistent container */}
          <div className="relative h-6 w-6 flex justify-center items-center">
            <Image
              src={Icon}
              alt="icon"
              layout="fill"
              objectFit="cover"
            />
          </div>
          {!isCollapsed && <span className="ml-4 text-sm">{item.label}</span>}
        </div>
      </Link>
      {isCollapsed && showPopover && <PopoverContent item={item} />}
    </div>
  );
};


const Sidebar = ({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}) => {
  const [showPopover, setShowPopover] = useState(false);


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

        {/* Toggle button - centered when collapsed */}
        <div className="flex justify-center">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-3 hover:bg-gray-100 rounded-lg items-center"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Sections - Increased spacing */}
        <div className="flex-1 overflow-y-auto">
          {navigation
            // filter out the external messaging
            .filter((section) => section.title !== "External Messaging")
            .map((section, index: number) => (
              <div
                key={index}
                className={`flex flex-col ${isCollapsed ? "items-center" : "pl-6"} mb-8`}
              >
                {!isCollapsed && (
                  <div className="text-xs uppercase text-gray-500 mb-3">
                    {section.title}
                  </div>
                )}
                <div className={`space-y-4 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
                  {section.items.map((item) => (
                    <SidebarItem
                      key={item.href}
                      item={item}
                      isCollapsed={isCollapsed}
                      className={`py-3 ${isCollapsed ? "flex justify-center" : ""}`}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>

        {/* Messaging Section (Moved to Bottom) - Added gray square backgrounds for collapsed icons */}
        <div className={`p-4 mb-5 border-t ${isCollapsed ? "flex flex-col items-center" : "pl-6"}`}>
          {!isCollapsed && (
            <div className="text-xs uppercase text-gray-500 mb-3">
              Messaging
            </div>
          )}
          {navigation
            .find((section) => section.title === "External Messaging")
            ?.items.map((item) => (
              <div key={item.href} className="mt-2">
                {isCollapsed ? (
                  <Link href={item.href} passHref>
                    {/* Gray square background for collapsed messaging icons */}
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="relative h-6 w-6 flex justify-center items-center">
                        <Image
                          src={item.icon}
                          alt="icon"
                          layout="fill"
                          objectFit="cover"
                        />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <SidebarItem
                    item={item}
                    isCollapsed={isCollapsed}
                    className="py-3"
                  />
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

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

export default Sidebar;





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