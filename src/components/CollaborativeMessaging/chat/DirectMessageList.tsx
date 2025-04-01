"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";

import useChannelStore from "@/store/messaging/channelStore";
import useAuthStore from "@/store/messaging/authStore";
import Spinner from "@/components/custom-ui/modal/custom-spinner";
import Avatar from "@/components/custom-ui/avatar";
import Badge from "@/components/custom-ui/badge";

import * as userApi from "@/lib/api/messaging/auth";
import { User } from "@/lib/types/collab-messaging/auth";

const DirectMessageList = () => {
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const {
    directMessages,
    fetchDirectMessages,
    selectDirectMessage,
    selectedDirectMessageId,
    createDirectMessage,
  } = useChannelStore();
  const { user: currentUser } = useAuthStore();

  // Fetch direct messages on component mount
  useEffect(() => {
    fetchDirectMessages();
  }, [fetchDirectMessages]);

  // Load online users
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const users = await userApi.getOnlineUsers();
        setOnlineUsers(users);
      } catch (error) {
        console.error("Error fetching online users:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchOnlineUsers();

    // Set up a timer to refresh online users every minute
    const intervalId = setInterval(fetchOnlineUsers, 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Handle DM selection
  const handleSelectDM = (dmId: string) => {
    selectDirectMessage(dmId);
  };

  // Handle starting a new DM
  const handleStartNewDM = () => {
    setIsSearching(!isSearching);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle creating a DM with a user
  const handleCreateDM = async (userId: string) => {
    try {
      const directMessage = await createDirectMessage(userId);
      selectDirectMessage(directMessage.id);
      setIsSearching(false);
      setSearchQuery("");
    } catch (error) {
      console.error("Error creating direct message:", error);
    }
  };

  // Get online status for a user
  const getUserStatus = (lastSeen: Date) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMinutes = Math.floor(
      (now.getTime() - lastSeenDate.getTime()) / (1000 * 60)
    );

    return diffMinutes < 5 ? "online" : "offline";
  };

  // Filter online users based on search query
  const filteredOnlineUsers = onlineUsers.filter(
    (user) =>
      // Don't show current user
      user.id !== currentUser?.id &&
      // Filter by search query
      (searchQuery === "" ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-gray-400 text-sm">DIRECT MESSAGES</h2>
        <button
          onClick={handleStartNewDM}
          className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-md hover:bg-gray-100"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Search Area */}
      {isSearching && (
        <div className="mb-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="mt-2 max-h-48 overflow-y-auto">
            {isLoadingUsers ? (
              <div className="py-4 flex justify-center">
                <Spinner size="sm" />
              </div>
            ) : filteredOnlineUsers.length > 0 ? (
              filteredOnlineUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleCreateDM(user.id)}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                >
                  <Avatar
                    src={user.avatar}
                    alt={user.fullName}
                    size="sm"
                    status={getUserStatus(user.lastSeen)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-2 text-center text-sm text-gray-500">
                {searchQuery ? "No users found" : "No online users"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Direct Messages List */}
      <div className="space-y-1">
        {directMessages.map((dm) => (
          <div
            key={dm.id}
            onClick={() => handleSelectDM(dm.id)}
            className={`
              flex items-center justify-between p-2 cursor-pointer rounded
              ${
                selectedDirectMessageId === dm.id
                  ? "bg-emerald-200"
                  : "hover:bg-gray-100"
              }
            `}
          >
            <div className="flex items-center space-x-2 min-w-0">
              <Avatar
                src={dm?.otherUser?.avatar}
                alt={dm?.otherUser?.fullName}
                size="sm"
                status={getUserStatus(dm.otherUser?.lastSeen)}
              />
              <span className="truncate text-sm">{dm.otherUser?.fullName}</span>
            </div>

            {dm?.unreadCount && dm?.unreadCount > 0 && (
              <Badge variant="primary" rounded size="sm">
                {dm?.unreadCount}
              </Badge>
            )}
          </div>
        ))}

        {/* Empty state */}
        {directMessages.length === 0 && !isSearching && (
          <div className="py-4 text-center">
            <p className="text-sm text-gray-500">No conversations yet</p>
            <button
              onClick={handleStartNewDM}
              className="mt-2 text-sm text-emerald-600 hover:underline"
            >
              Start a conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessageList;
