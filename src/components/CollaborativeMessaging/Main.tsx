/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Bell,
  Settings,
  ChevronLeft,
  Plus,
  MoreVertical,
  Send,
} from "lucide-react";

// Sidebar Channel Item Component
const ChannelItem = ({ icon, name, count = 0 }: any) => (
  <div className="flex items-center px-3 py-1.5 hover:bg-[#E0E7FF80] rounded-md cursor-pointer group">
    {icon}
    <span className="ml-2 flex-1 text-sm">{name}</span>
    {count > 0 && (
      <span className="bg-gray-900 text-white text-xs px-2 py-0.5 rounded-full">
        {count}
      </span>
    )}
  </div>
);

// Direct Message Item Component
const DirectMessageItem = ({ name, avatar, status, count = 0 }: any) => (
  <div className="flex items-center px-3 py-1.5 hover:bg-[#E0E7FF80] rounded-md cursor-pointer group">
    <Avatar className="h-6 w-6">
      <AvatarImage src={avatar} />
      <AvatarFallback>{name.charAt(0)}</AvatarFallback>
    </Avatar>
    <span className="ml-2 flex-1 text-sm">{name}</span>
    {count > 0 && (
      <span className="bg-gray-900 text-white text-xs px-2 py-0.5 rounded-full">
        {count}
      </span>
    )}
  </div>
);

// Message Component
const Message = ({ user, role, content, timestamp }: any) => (
  <div className="bg-white flex gap-3 py-2 group rounded-md px-3">
    <Avatar className="h-8 w-8 mt-1">
      <AvatarImage src={user.avatar} />
      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
    </Avatar>
    <div className="flex-1 bg-white">
      <div className="flex items-center gap-2">
        <span className="font-medium">{user.name}</span>
        <span className="text-sm text-gray-500">{role}</span>
        <span className="text-xs text-gray-400">{timestamp}</span>
      </div>
      <p className="text-sm text-gray-700">{content}</p>
    </div>
    <Button
      variant="ghost"
      size="icon"
      className="opacity-0 group-hover:opacity-100"
    >
      <MoreVertical className="h-4 w-4" />
    </Button>
  </div>
);

// Sidebar Component
const Sidebar = () => (
  <div className="w-60 border-r bg-gray-50 h-[90vh] flex flex-col">
    <ScrollArea className="flex-1 my-3 border-b border-gray-300">
      <div className="p-2 space-y-4">
        <div className="border-b border-gray-300">
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Options</span>
            <Plus className="h-4 w-4 text-gray-500" />
          </div>
          <ChannelItem
            icon={<Search className="h-4 w-4 text-gray-500" />}
            name="Search"
          />
          <ChannelItem
            icon={<Bell className="h-4 w-4 text-gray-500" />}
            name="Announcement"
          />
        </div>

        <div className="border-b border-gray-300">
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Direct Messages</span>
            <Plus className="h-4 w-4 text-gray-500" />
          </div>
          <DirectMessageItem
            name="Nataly Chaplack"
            avatar="/avatars/nataly.jpg"
            count={15}
          />
          <DirectMessageItem
            name="Shchastislav Yurchuk"
            avatar="/avatars/shchastislav.jpg"
            count={2}
          />
          <DirectMessageItem
            name="Mary Croostina"
            avatar="/avatars/mary.jpg"
            count={4}
          />
        </div>

        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Channels</span>
            <Plus className="h-4 w-4 text-gray-500" />
          </div>
          <ChannelItem
            icon={<span className="text-gray-500"></span>}
            name="General"
            count={5}
          />
          <ChannelItem
            icon={<span className="text-gray-500"></span>}
            name="Front-end Dev"
          />
          <ChannelItem
            icon={<span className="text-gray-500"></span>}
            name="Backend-Dev"
          />
          <ChannelItem
            icon={<span className="text-gray-500"></span>}
            name="Product Managers"
          />
        </div>
      </div>
    </ScrollArea>
  </div>
);

// Chat Header Component
const ChatHeader = () => (
  <div className="h-14 border-b flex items-center justify-between px-4">
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src="/avatars/nataly.jpg" />
        <AvatarFallback>NC</AvatarFallback>
      </Avatar>
      <div>
        <h2 className="font-medium">Nataly Chaplack</h2>
        <p className="text-sm text-gray-500">Director of the Lviv Forum</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon">
        <Search className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

// Chat Input Component
const ChatInput = () => (
  <div className="border-t p-4">
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon">
        <Plus className="h-4 w-4" />
      </Button>
      <Input placeholder="Write a message" className="flex-1" />
      <Button>
        <Send className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

// Main Chat Area Component
const ChatArea = () => (
  <div className="flex-1 flex flex-col bg-[#F5F5FA]">
    <ChatHeader />
    <ScrollArea className="flex-1 p-4">
      <Message
        user={{
          name: "Nataly Chaplack",
          avatar: "/avatars/nataly.jpg",
        }}
        role="Director of the Lviv Forum"
        content="Hello, I am sending today's indicators"
        timestamp="Friday 2:20pm"
      />
      <div className="pl-11 pb-4 bg-white my-3">
        <p className="text-sm text-gray-700">Box office: 36,870</p>
        <p className="text-sm text-gray-700">Number of incoming: 2,346</p>
        <p className="text-sm text-gray-700">Conversion: 89%</p>
        <p className="text-sm text-gray-700">Sales: 67</p>
        <p className="text-sm text-gray-700">The number of checks is 55</p>
        <span className="text-xs text-gray-400">Friday 4:50pm</span>
      </div>
      <Message
        user={{
          name: "Nataly Chaplack",
          avatar: "/avatars/nataly.jpg",
        }}
        role="Director of the Lviv Forum"
        content="I promise that by the evening there will be better results, we are fulfilling the plan!!!"
        timestamp="Friday 6:15pm"
      />
    </ScrollArea>
    <ChatInput />
  </div>
);

// Main Layout Component
const ChatLayout = () => {
  return (
    <div className="h-[90vh] flex flex-col m-5 ">
      <header className="h-12 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            go back to dashboard
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-500" />
          <Settings className="h-5 w-5 text-gray-500" />
          <Button>Chat with us</Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden border border-gray-300">
        <Sidebar />
        <ChatArea />
      </div>
    </div>
  );
};

export default ChatLayout;
