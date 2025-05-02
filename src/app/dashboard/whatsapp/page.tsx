"use client";

import React, { useEffect, useState } from "react";
import { useWhatsAppClient } from "@/lib/hooks/whatsapp/useWhatsAppClient";
import { useChat } from "@/lib/hooks/whatsapp/useChat";
import {
  WhatsAppClientStatus,
  WhatsAppMessage,
  WhatsAppChat,
} from "@/lib/types/whatsapp";
import ChatList from "@/components/Whatsapp/ChatList";
import ChatArea from "@/components/Whatsapp/ChatArea";
import ConnectWhatsApp from "@/components/Whatsapp/ConnectWhatsApp";
import ProfilePanel from "@/components/Whatsapp/ProfilePanel";
import SearchPanel from "@/components/Whatsapp/SearchPanel";
import { Menu, Search, User } from "lucide-react";

export default function WhatsAppPage() {
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const {
    status,
    qrCode,
    profile,
    messages,
    currentChat,
    initClient,
    fetchMessages,
    selectChat,
    sendTextMessage,
    sendMediaMessage,
    logout,
    searchMessages,
    isInitializing,
    isLoggingOut,
    isSearching,
    searchResults,
  } = useWhatsAppClient();

  const { chats, refreshChats, isLoading: isLoadingChats } = useChat();

  // Auto-initialize on first load
  useEffect(() => {
    if (isFirstLoad && status === WhatsAppClientStatus.NOT_INITIALIZED) {
      initClient();
      setIsFirstLoad(false);
    }
  }, [isFirstLoad, status, initClient]);

  // Find current chat object
  const currentChatObj = chats.find((chat) => chat.id === currentChat);

  // Handle chat selection
  const handleSelectChat = (chatId: string) => {
    selectChat(chatId);
    // Fetch messages for the selected chat
    fetchMessages(chatId).catch((err) =>
      console.log(`Error fetching messages for chat ${chatId}:`, err)
    );
    setShowMobileMenu(false);
  };

  // Handle message search
  const handleSearchMessages = (query: string, chatId?: string) => {
    searchMessages({ query, chatId });
  };

  // Handle search message selection
  const handleSelectSearchMessage = (message: WhatsAppMessage) => {
    const chatId =
      message.chatId || (message.isFromMe ? message.to : message.from);
    selectChat(chatId);
    setShowSearch(false);
  };

  // Handle search chat selection
  const handleSelectSearchChat = (chat: WhatsAppChat) => {
    selectChat(chat.id);
    setShowSearch(false);
  };

  // Render connect page if not connected
  if (
    status === WhatsAppClientStatus.NOT_INITIALIZED ||
    status === WhatsAppClientStatus.INITIALIZING ||
    status === WhatsAppClientStatus.QR_READY ||
    status === WhatsAppClientStatus.AUTHENTICATED
  ) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 bg-white shadow-sm">
          <h1 className="text-xl font-semibold">WhatsApp Integration</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <ConnectWhatsApp
            status={status}
            qrCode={qrCode}
            onInitialize={initClient}
            isInitializing={isInitializing}
          />
        </div>
      </div>
    );
  }

  // Render main WhatsApp interface
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Menu Button - Only visible on small screens */}
        <div className="md:hidden absolute top-4 left-4 z-10">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 bg-white rounded-full shadow-md"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Chat List - Hidden on mobile unless toggled */}
        <div
          className={`${
            showMobileMenu ? "flex" : "hidden"
          } md:flex w-full md:w-1/3 max-w-sm flex-col bg-white border-r z-20`}
        >
          <div className="p-3 flex justify-between items-center bg-gray-50 border-b">
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center space-x-2"
            >
              <div className="bg-gray-200 h-10 w-10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <span className="font-medium">{profile?.name || "Profile"}</span>
            </button>

            <div>
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 rounded-full hover:bg-gray-200 text-gray-500"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>

          <ChatList
            chats={chats}
            selectedChatId={currentChat}
            onSelectChat={handleSelectChat}
            onRefresh={refreshChats}
            isLoading={isLoadingChats}
          />
        </div>

        {/* Chat Area */}
        <div
          className={`${
            showMobileMenu ? "hidden" : "flex"
          } md:flex flex-1 flex-col`}
        >
          <ChatArea
            chat={currentChatObj}
            messages={messages[currentChat || ""] || []}
            onSendMessage={(message) => {
              if (currentChat) {
                sendTextMessage({ chatId: currentChat, message });
              }
            }}
            onSendMedia={(media, caption) => {
              if (currentChat) {
                sendMediaMessage({ chatId: currentChat, media, caption });
              }
            }}
            onBack={() => setShowMobileMenu(true)}
            onRefresh={() => currentChat && fetchMessages(currentChat)}
          />
        </div>

        {/* Profile Panel */}
        {showProfile && (
          <div className="absolute inset-0 z-30 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="relative max-w-md w-full">
              <button
                onClick={() => setShowProfile(false)}
                className="absolute top-2 right-2 p-2 rounded-full bg-white text-gray-500 hover:bg-gray-100"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <ProfilePanel
                profile={profile}
                onLogout={logout}
                isLoggingOut={isLoggingOut}
              />
            </div>
          </div>
        )}

        {/* Search Panel */}
        {showSearch && (
          <div className="absolute inset-y-0 right-0 z-20 w-full sm:w-80 md:w-96">
            <SearchPanel
              onSearch={handleSearchMessages}
              messageResults={searchResults}
              isSearching={isSearching}
              currentChatId={currentChat!}
              onSelectMessage={handleSelectSearchMessage}
              onSelectChat={handleSelectSearchChat}
              onClose={() => setShowSearch(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
