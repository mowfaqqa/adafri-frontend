// File: OnlineMessageComponent.tsx

'use client';
import React from 'react';
import { cn } from "@/lib/utils";
import { Reply, Clock, Trash2 } from 'lucide-react';

export interface Message {
  id: string;
  sender: {
    name: string;
    avatarColor: string;
  };
  content: string;
  timestamp?: string;
}

export interface MessageListProps {
  messages: Message[];
  className?: string;
}

const MessageItem: React.FC<{ message: Message }> = ({ message }) => {
  // Function to get initials from name
  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  return (
    <div className="flex items-start gap-3 group py-4 px-4 hover:bg-gray-50 transition-colors">
      {/* Avatar */}
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
        style={{ backgroundColor: message.sender.avatarColor }}
      >
        {getInitials(message.sender.name)}
      </div>

      {/* Message Content */}
      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold">{message.sender.name}</span>
        </div>
        <p className="text-gray-600 text-sm">{message.content}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <Reply className="w-4 h-4 text-gray-500" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <Clock className="w-4 h-4 text-gray-500" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <Trash2 className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

export const MessageList: React.FC<MessageListProps> = ({ messages, className }) => {
  return (
    <div className={cn("flex-1 divide-y", className)}>
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
};

// Sample data for testing
export const sampleMessages: Message[] = [
  {
    id: '1',
    sender: {
      name: 'Khalil',
      avatarColor: '#FFD700', // Gold
    },
    content: 'i put the pictures in the Drive',
  },
  {
    id: '2',
    sender: {
      name: 'Abdou',
      avatarColor: '#FF0000', // Red
    },
    content: 'What are the tasks today ?',
  },
  // Add more message examples...
];