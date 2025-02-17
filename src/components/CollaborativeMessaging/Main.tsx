"use client";
import React, { useState } from "react";
import { Search, Bell, Plus, Send } from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
}

interface Chat {
  id: number;
  name: string;
  type: "dm" | "channel";
}

interface DirectMessage {
  id: number;
  name: string;
  unread: number;
}

interface Channel {
  id: number;
  name: string;
  unread: number;
}
const MessagingUI = () => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Record<number, Message[]>>({});

  // Sample data
  const directMessages: DirectMessage[] = [
    { id: 1, name: "John Smith", unread: 3 },
    { id: 2, name: "Sarah Johnson", unread: 1 },
    { id: 3, name: "Mike Wilson", unread: 0 },
    { id: 4, name: "Emma Davis", unread: 2 },
  ];

  const channels: Channel[] = [
    { id: 5, name: "General", unread: 5 },
    { id: 6, name: "Front-end Dev", unread: 0 },
    { id: 9, name: "Backend-Dev", unread: 0 },
    { id: 8, name: "Projects", unread: 0 },
  ];

  const handleSendMessage = () => {
    if (message.trim() && selectedChat) {
      setMessages((prev) => ({
        ...prev,
        [selectedChat.id]: [
          ...(prev[selectedChat.id] || []),
          {
            id: Date.now(),
            text: message,
            sender: "You",
            timestamp: new Date().toLocaleTimeString(),
          },
        ],
      }));
      setMessage("");
    }
  };

  return (
    <div className="px-8 py-3 border border-gray-200">
      <h2 className="text-2xl  font-semibold">Messages</h2>
      <div className="flex h-[85vh] bg-gray-100">
        {/* Sidebar */}

        <div className="w-64 bg-white text-gray-900 p-4">
          {/* Options section */}
          <div className="mb-8">
            <h2 className="text-gray-400 text-sm mb-4">OPTIONS</h2>
            <div className="flex items-center space-x-2 mb-2 text-gray-400">
              <Search size={20} />
              <span>Search</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Bell size={20} />
              <span>Announcement</span>
            </div>
          </div>

          {/* Direct Messages section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-gray-400 text-sm">DIRECT MESSAGES</h2>
              <Plus size={16} className="text-gray-400 cursor-pointer" />
            </div>
            {directMessages.map((dm) => (
              <div
                key={dm.id}
                onClick={() =>
                  setSelectedChat({ id: dm.id, name: dm.name, type: "dm" })
                }
                className={`flex justify-between items-center p-2 cursor-pointer rounded ${
                  selectedChat?.id === dm.id
                    ? "bg-emerald-200"
                    : "hover:bg-[#EFF3FF]"
                }`}
              >
                <span>{dm.name}</span>
                {dm.unread > 0 && (
                  <span className="bg-emerald-400 text-white text-xs px-2 py-1 rounded-full">
                    {dm.unread}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Channels section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-gray-400 text-sm">CHANNELS</h2>
              <Plus size={16} className="text-gray-400 cursor-pointer" />
            </div>
            {channels.map((channel) => (
              <div
                key={channel.id}
                onClick={() =>
                  setSelectedChat({
                    id: channel.id,
                    name: channel.name,
                    type: "channel",
                  })
                }
                className={`flex justify-between items-center p-2 cursor-pointer rounded ${
                  selectedChat?.id === channel.id
                    ? "bg-emerald-200"
                    : "hover:bg-[#EFF3FF]"
                }`}
              >
                <span>{channel.name}</span>
                {channel.unread > 0 && (
                  <span className="bg-emerald-400 text-white text-xs px-2 py-1 rounded-full">
                    {channel.unread}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col border border-gray-200">
          {/* Chat header */}
          {selectedChat && (
            <div className="bg-white p-4 border-b">
              <h2 className="font-semibold">
                {selectedChat.type === "channel" ? "#" : ""}
                {selectedChat.name}
              </h2>
            </div>
          )}

          {/* Messages area */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedChat ? (
              messages[selectedChat.id]?.map((msg) => (
                <span key={msg.id} className="mb-4 rounded-xl bg-white px-4 flex flex-col flex-wrap max-w-xl">
                  <span className="font-semibold">{msg.sender}</span>
                  <span className="text-gray-700">{msg.text}</span>
                  <span className="text-xs text-gray-500">{msg.timestamp}</span>
                </span>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a chat to start messaging
              </div>
            )}
          </div>

          {/* Message input */}
          {selectedChat && (
            <div className="p-4 border-t bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a message"
                  className="flex-1 p-2 border rounded"
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingUI;
