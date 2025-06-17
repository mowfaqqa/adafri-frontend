"use client";

import React, { useEffect, useState } from "react";
import { Search, Bell, Settings, LogOut, X, Building } from "lucide-react";

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
import useWorkspaceStore from "@/lib/store/messaging/workspaceStore";
import Avatar from "@/components/custom-ui/avatar";
import CreateWorkspaceModal from "../workspace/CreateWorkspaceModal";

const ChatLayout = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);

  const { user, logout } = useAuthStore();
  const { activeThreadId } = useMessageStore();
  const { clearSelection: clearChannelSelection } = useChannelStore();
  const { openModal } = useModalStore();
  const {
    workspaces,
    selectedWorkspaceId,
    selectWorkspace,
    fetchWorkspaces,
    clearSelection: clearWorkspaceSelection,
  } = useWorkspaceStore();

  // Fetch workspaces on component mount
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

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
    clearChannelSelection();
    clearWorkspaceSelection();
  };

  // Handle opening user profile modal
  const handleOpenProfile = () => {
    setShowUserMenu(false);
    openModal("editProfile");
  };

  // Handle workspace selection
  const handleSelectWorkspace = (workspaceId: string) => {
    selectWorkspace(workspaceId);
    setShowWorkspaceSelector(false);
  };

  // Handle creating a new workspace
  const handleCreateWorkspace = () => {
    setShowWorkspaceSelector(false);
    openModal("createWorkspace");
  };

  // Get current workspace
  const currentWorkspace = selectedWorkspaceId
    ? workspaces.find((w) => w.id === selectedWorkspaceId)
    : null;

  return (
    <div className="px-4 py-3">
      <h2 className="text-2xl font-semibold flex justify-between items-center">
        <div className="flex items-center">
          <span>Messages</span>

          {/* Workspace selector */}
          {workspaces.length > 0 && (
            <div className="relative ml-4">
              <button
                onClick={() => setShowWorkspaceSelector(!showWorkspaceSelector)}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
              >
                {currentWorkspace ? (
                  <>
                    {currentWorkspace.logo ? (
                      <img
                        src={currentWorkspace.logo}
                        alt={currentWorkspace.name}
                        className="w-5 h-5 rounded object-cover"
                      />
                    ) : (
                      <Building size={16} className="text-gray-500" />
                    )}
                    <span>{currentWorkspace.name}</span>
                  </>
                ) : (
                  <>
                    <Building size={16} className="text-gray-500" />
                    <span>Select Workspace</span>
                  </>
                )}
              </button>

              {showWorkspaceSelector && (
                <div className="absolute top-full left-0 mt-1 w-60 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    {workspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        onClick={() => handleSelectWorkspace(workspace.id)}
                        className={`flex items-center w-full px-4 py-2 text-left ${
                          selectedWorkspaceId === workspace.id
                            ? "bg-emerald-50 text-emerald-700"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {workspace.logo ? (
                          <img
                            src={workspace.logo}
                            alt={workspace.name}
                            className="w-5 h-5 rounded mr-2 object-cover"
                          />
                        ) : (
                          <Building size={16} className="mr-2 text-gray-500" />
                        )}
                        <span>{workspace.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t py-1">
                    <button
                      onClick={handleCreateWorkspace}
                      className="flex items-center w-full px-4 py-2 text-left text-emerald-600 hover:bg-gray-100"
                    >
                      <span>+ Create Workspace</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

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
            {/* <button
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
            </button> */}

            {/* User menu dropdown */}
            {/* {showUserMenu && (
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
            )} */}
          </div>

          {selectedWorkspaceId ? (
            <>
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
                <DirectMessageList workspaceId={selectedWorkspaceId} />
              </div>

              {/* Channels section */}
              <div>
                <ChannelList workspaceId={selectedWorkspaceId} />
              </div>
            </>
          ) : (
            // Show a prompt to select or create a workspace
            <div className="flex flex-col items-center justify-center py-8">
              <Building size={32} className="text-gray-400 mb-2" />
              <p className="text-gray-500 text-center mb-4">
                Select a workspace to see channels and direct messages
              </p>
              {workspaces.length > 0 ? (
                <div className="space-y-2 w-full">
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      onClick={() => selectWorkspace(workspace.id)}
                      className="flex items-center w-full p-2 rounded-md hover:bg-gray-100"
                    >
                      {workspace.logo ? (
                        <img
                          src={workspace.logo}
                          alt={workspace.name}
                          className="w-6 h-6 rounded mr-2 object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center mr-2">
                          <span className="text-xs font-semibold">
                            {workspace.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span>{workspace.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => openModal("createWorkspace")}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"
                >
                  Create a Workspace
                </button>
              )}
            </div>
          )}
        </div>

        {/* Main chat area */}
        <div className="flex">
          <div className="flex flex-col">
            <MessageList />
            <MessageInput />
          </div>

          {/* Thread view */}
          {activeThreadId && <ThreadView />}
        </div>
      </div>

      {/* Modals */}
      <CreateChannelModal />
      <CreateWorkspaceModal />
    </div>
  );
};

export default ChatLayout;
