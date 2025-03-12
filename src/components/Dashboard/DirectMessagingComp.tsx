import React from 'react';
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Reply, Clock, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  sender: {
    name: string;
    avatarColor: string;
  };
  content: string;
  timestamp?: string;
}

interface MessageListProps {
  messages: Message[];
  className?: string;
}

const MessageItem: React.FC<{ message: Message }> = ({ message }) => {
  // Function to get initials from name
  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  return (
    <div className="flex items-start gap-3 group py-4">
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
          <span className="font-semibold text-lg">{message.sender.name}</span>
        </div>
        <p className="text-gray-600">{message.content}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <Reply className="w-5 h-5 text-gray-500" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <Clock className="w-5 h-5 text-gray-500" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <Trash2 className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

const MessageList: React.FC<MessageListProps> = ({ messages, className }) => {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-0">
        <CardTitle className="text-2xl font-semibold">Direct Messaging</CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
      </CardContent>
    </Card>
  );
};

// Example usage
const DashboardMessageList = () => {
  const messages: Message[] = [
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
    {
      id: '3',
      sender: {
        name: 'Sabrina',
        avatarColor: '#007BFF', // Blue
      },
      content: 'We have a meeting today at 3p.m ...',
    },
    {
      id: '4',
      sender: {
        name: 'Timi',
        avatarColor: '#007BFF', // Blue
      },
      content: 'We have a meeting today at 1p.m ...',
    },
  ];

  return (
    <div className="min-h-screen p-2">
      <MessageList messages={messages} />
    </div>
  );
};

export default DashboardMessageList;