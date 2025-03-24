import React, { useEffect, useRef, useState } from 'react';
import { WhatsAppMessage, WhatsAppChat } from '../../lib/types/whatsapp';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import { Search, Phone, Video, MoreVertical, ArrowLeft, RefreshCw } from 'lucide-react';

interface ChatAreaProps {
  chat?: WhatsAppChat;
  messages: WhatsAppMessage[];
  onSendMessage: (message: string) => void;
  onSendMedia?: (media: File, caption?: string) => void;
  onBack?: () => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  messages,
  onSendMessage,
  onSendMedia,
  onBack,
  isLoading = false,
  onRefresh,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);
  
  // Handle manual scrolling
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(atBottom);
  };
  
  // Group messages by date for display
  const groupMessagesByDate = () => {
    const groups: { date: string; messages: WhatsAppMessage[] }[] = [];
    let currentDate = '';
    let currentGroup: WhatsAppMessage[] = [];
    
    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp * 1000).toLocaleDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }
    
    return groups;
  };
  
  const messageGroups = groupMessagesByDate();
  
  // If no chat is selected
  if (!chat) {
    return (
      <div className="h-full flex flex-col bg-slate-50">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-gray-500">
            <div className="mb-4">
              <img 
                src="/images/whatsapp-logo.png" 
                alt="WhatsApp" 
                className="w-24 h-24 mx-auto opacity-25"
              />
            </div>
            <h3 className="text-xl font-medium mb-2">WhatsApp Web</h3>
            <p>Select a chat to start messaging</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 bg-white border-b flex items-center">
        <button
          onClick={onBack}
          className="md:hidden mr-2 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <div className="flex-1 flex items-center">
          <div className="bg-gray-200 h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center font-medium text-gray-600">
            {chat.isGroup ? 'G' : chat.name.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <h3 className="font-medium leading-tight">{chat.name}</h3>
            <p className="text-xs text-gray-500">
              {chat.isGroup ? 'Group' : 'Online'}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-1">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
            <Search className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
            <Phone className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
            <Video className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div 
        className="flex-1 overflow-y-auto p-4 bg-slate-50" 
        onScroll={handleScroll}
      >
        {isLoading && (
          <div className="flex justify-center my-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          </div>
        )}
        
        {!isLoading && messageGroups.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="mb-2">No messages yet</p>
              {onRefresh && (
                <button 
                  onClick={onRefresh}
                  className="text-sm text-green-600 hover:text-green-700 px-4 py-2 border border-green-600 rounded-md"
                >
                  Refresh Messages
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {messageGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <div className="flex justify-center my-3">
                  <div className="bg-white py-1 px-3 rounded-full text-xs text-gray-600 shadow-sm">
                    {group.date}
                  </div>
                </div>
                
                {group.messages.map((message, messageIndex) => (
                  <ChatMessage
                    key={message.id || `${message.timestamp}-${messageIndex}`}
                    message={message}
                    showSender={chat.isGroup}
                  />
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <MessageInput
        onSendMessage={onSendMessage}
        onSendMedia={onSendMedia}
        isDisabled={isLoading}
      />
    </div>
  );
};

export default ChatArea;