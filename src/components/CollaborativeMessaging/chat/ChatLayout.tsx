"use client";

import React, { useEffect, useState } from "react";
import { Search, Bell, Settings, LogOut, X } from "lucide-react";

import ChannelList from "./ChannelList";
import DirectMessageList from "./DirectMessageList";
import MessageList from "./MessageList";
import MessageInput from "./Messageinput";
import ThreadView from "./ThreadView";
import CreateChannelModal from "./CreateChannelModal";
import useAuthStore from "@/lib/store/messaging/authStore";
import useMessageStore from "@/lib/store/messaging/messageStore";
import useChannelStore from "@/lib/store/messaging/channelStore";
import useModalStore from "@/lib/store/messaging/modalStore";
import Avatar from "@/components/custom-ui/avatar";

const ChatLayout = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { user, logout } = useAuthStore();
  const { activeThreadId } = useMessageStore();
  const { clearSelection } = useChannelStore();
  const { openModal } = useModalStore();

  // Reset mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Handle user logout
  const handleLogout = async () => {
    await logout();
    clearSelection();
  };

  // Handle opening user profile modal
  const handleOpenProfile = () => {
    setShowUserMenu(false);
    openModal("editProfile");
  };

  return (
    <div className="px-4 py-3">
      <h2 className="text-2xl font-semibold flex justify-between items-center">
        <span>Messages</span>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Search size={24} />}
        </button>
      </h2>

      <div className="flex h-[85vh] bg-gray-100 mt-5 rounded-xl overflow-hidden">
        {/* Sidebar - hidden on mobile unless opened */}
        <div
          className={`
            ${isMobileMenuOpen ? "fixed inset-0 z-40 bg-white" : "hidden"} 
            md:relative md:block md:w-64 md:bg-white md:text-gray-900 md:p-4 md:rounded-l-xl
          `}
        >
          {/* Close button for mobile */}
          {isMobileMenuOpen && (
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold">Navigation</h3>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>
          )}

          {/* User profile */}
          <div className="mb-6 flex items-center space-x-3 relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 hover:bg-gray-100 p-2 rounded-md w-full"
            >
              <Avatar
                src={user?.avatar}
                alt={user?.fullName || "User"}
                size="md"
                status="online"
              />
              <div className="min-w-0">
                <p className="font-medium truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-500 truncate">
                  @{user?.username}
                </p>
              </div>
            </button>

            {/* User menu dropdown */}
            {showUserMenu && (
              <div className="absolute top-12 left-0 w-full bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <button
                  onClick={handleOpenProfile}
                  className="flex items-center w-full p-3 hover:bg-gray-100 text-left"
                >
                  <Settings size={16} className="mr-2 text-gray-500" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full p-3 hover:bg-gray-100 text-left border-t"
                >
                  <LogOut size={16} className="mr-2 text-gray-500" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Options section */}
          <div className="mb-8">
            <h2 className="text-gray-400 text-sm mb-4">OPTIONS</h2>
            <div className="flex items-center space-x-2 mb-2 text-gray-400 p-2 hover:bg-gray-100 rounded-md cursor-pointer">
              <Search size={20} />
              <span>Search</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 p-2 hover:bg-gray-100 rounded-md cursor-pointer">
              <Bell size={20} />
              <span>Announcement</span>
            </div>
          </div>

          {/* Direct Messages section */}
          <div className="mb-8">
            <DirectMessageList />
          </div>

          {/* Channels section */}
          <div>
            <ChannelList />
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            <MessageList />
            <MessageInput />
          </div>

          {/* Thread view */}
          {activeThreadId && <ThreadView />}
        </div>
      </div>

      {/* Modals */}
      <CreateChannelModal />
    </div>
  );
};

export default ChatLayout;
