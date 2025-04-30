import React, { useState } from "react";
import { WhatsAppChat } from "../../lib/types/whatsapp";
import { Search, RefreshCw, MessageSquarePlus } from "lucide-react";

interface ChatListProps {
  chats: WhatsAppChat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChatId,
  onSelectChat,
  onRefresh,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format timestamp to readable format
  const formatTimestamp = (timestamp: number): string => {
    if (!timestamp) return "";

    const date = new Date(timestamp * 1000);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 pl-9 pr-3 bg-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>

        <div className="flex">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
          >
            <RefreshCw
              className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
          <button className="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
            <MessageSquarePlus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-pulse">Loading chats...</div>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? "No chats match your search" : "No chats available"}
          </div>
        ) : (
          <ul>
            {filteredChats.map((chat) => (
              <li
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`p-3 hover:bg-gray-100 cursor-pointer border-b transition-colors ${
                  selectedChatId === chat.id ? "bg-green-50" : ""
                }`}
              >
                <div className="flex items-center">
                  <div className="relative">
                    <div className="bg-gray-300 h-12 w-12 rounded-full flex-shrink-0 flex items-center justify-center font-medium text-gray-600">
                      {chat.isGroup ? "G" : chat.name.charAt(0).toUpperCase()}
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full">
                        {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="ml-3 flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium truncate">{chat.name}</h3>
                      <span className="text-xs text-gray-500 ml-1 flex-shrink-0">
                        {formatTimestamp(chat.timestamp)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm text-gray-500 truncate">
                        {chat.lastMessage || "No messages yet"}
                      </p>
                      {chat.pinned && (
                        <div className="ml-1 text-gray-400">
                          <svg
                            className="h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M17,4V10L15,12V20H13V12L11,10V4H9V3H19V4H17M7,5V7H5V9H7V11H9V9H11V7H9V5H7Z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatList;
