import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { WhatsAppMessage, WhatsAppChat } from "../../lib/types/whatsapp";

interface SearchPanelProps {
  onSearch: (query: string, chatId?: string) => void;
  messageResults?: WhatsAppMessage[];
  chatResults?: WhatsAppChat[];
  isSearching?: boolean;
  currentChatId?: string;
  onSelectMessage?: (message: WhatsAppMessage) => void;
  onSelectChat?: (chat: WhatsAppChat) => void;
  onClose: () => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  onSearch,
  messageResults = [],
  chatResults = [],
  isSearching = false,
  currentChatId,
  onSelectMessage,
  onSelectChat,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInCurrentChat, setSearchInCurrentChat] = useState(
    !!currentChatId
  );

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(
        searchQuery.trim(),
        searchInCurrentChat ? currentChatId : undefined
      );
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format message preview
  const formatMessagePreview = (message: WhatsAppMessage): string => {
    if (message.body.length > 100) {
      return message.body.substring(0, 100) + "...";
    }
    return message.body;
  };

  return (
    <div className="h-full flex flex-col bg-white border-l shadow-lg">
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="font-medium">Search Messages</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-3 border-b">
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full py-2 pl-9 pr-9 bg-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {currentChatId && (
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={searchInCurrentChat}
              onChange={(e) => setSearchInCurrentChat(e.target.checked)}
              className="mr-2"
            />
            Search only in current chat
          </label>
        )}

        <button
          onClick={handleSearch}
          disabled={!searchQuery.trim() || isSearching}
          className="w-full mt-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-pulse">Searching...</div>
          </div>
        ) : searchQuery &&
          messageResults.length === 0 &&
          chatResults.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No results found</div>
        ) : (
          <>
            {chatResults.length > 0 && (
              <div className="pt-2">
                <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase">
                  Chats
                </div>
                <ul>
                  {chatResults.map((chat) => (
                    <li
                      key={chat.id}
                      onClick={() => onSelectChat && onSelectChat(chat)}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                    >
                      <div className="flex items-center">
                        <div className="bg-gray-200 h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center font-medium text-gray-600">
                          {chat.isGroup
                            ? "G"
                            : chat.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium">{chat.name}</p>
                          <p className="text-sm text-gray-500">
                            {chat.isGroup ? "Group" : "Contact"}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {messageResults.length > 0 && (
              <div className="pt-2">
                <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase">
                  Messages
                </div>
                <ul>
                  {messageResults.map((message) => (
                    <li
                      key={message.id}
                      onClick={() =>
                        onSelectMessage && onSelectMessage(message)
                      }
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                    >
                      <div className="flex flex-col">
                        <div className="flex justify-between items-baseline mb-1">
                          <p className="font-medium text-sm">
                            {message.isFromMe
                              ? "You"
                              : message.author || "Contact"}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatMessagePreview(message)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;
