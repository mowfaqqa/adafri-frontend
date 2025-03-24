import React from 'react';
import { WhatsAppMessage, MessageType } from '../../lib/types/whatsapp';
import { CheckCheck, File, Image, Mic, Video, MapPin, User, Forward } from 'lucide-react';

interface ChatMessageProps {
  message: WhatsAppMessage;
  showSender?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, showSender = true }) => {
  // Format timestamp
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get message container classes based on sender
  const getContainerClasses = (): string => {
    return `max-w-[70%] rounded-lg p-3 mb-2 ${
      message.isFromMe
        ? 'ml-auto bg-green-100 rounded-tr-none'
        : 'mr-auto bg-white rounded-tl-none border'
    }`;
  };

  // Render different message types
  const renderMessageContent = () => {
    switch (message.type) {
      case MessageType.IMAGE:
        return (
          <div className="space-y-2">
            <div className="bg-gray-200 rounded-md flex items-center justify-center h-40 overflow-hidden">
              {message.media?.data ? (
                <img
                  src={`data:${message.media.mimetype};base64,${message.media.data}`}
                  alt="Image"
                  className="max-h-40 max-w-full object-contain"
                />
              ) : (
                <Image className="h-10 w-10 text-gray-500" />
              )}
            </div>
            {message.body && <p>{message.body}</p>}
          </div>
        );

      case MessageType.VIDEO:
        return (
          <div className="space-y-2">
            <div className="bg-gray-200 rounded-md flex items-center justify-center h-40">
              <Video className="h-10 w-10 text-gray-500" />
            </div>
            <p>{message.body || 'Video'}</p>
          </div>
        );

      case MessageType.AUDIO:
        return (
          <div className="flex items-center space-x-2">
            <Mic className="h-5 w-5 text-gray-500" />
            <p>Audio message</p>
          </div>
        );

      case MessageType.DOCUMENT:
        return (
          <div className="flex items-center space-x-2">
            <File className="h-5 w-5 text-gray-500" />
            <p>{message.body || 'Document'}</p>
          </div>
        );

      case MessageType.LOCATION:
        return (
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-gray-500" />
            <p>{message.body || 'Location'}</p>
          </div>
        );

      case MessageType.CONTACT:
        return (
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-500" />
            <p>{message.body || 'Contact'}</p>
          </div>
        );

      case MessageType.TEXT:
      default:
        return <p className="whitespace-pre-wrap break-words">{message.body}</p>;
    }
  };

  return (
    <div className={getContainerClasses()}>
      {showSender && message.isGroup && !message.isFromMe && (
        <div className="font-medium text-xs text-blue-600 mb-1">
          {message.author || 'Unknown'}
        </div>
      )}
      
      {message.isForwarded && (
        <div className="flex items-center text-gray-500 text-xs mb-1">
          <Forward className="h-3 w-3 mr-1" />
          Forwarded
        </div>
      )}
      
      {message.hasQuotedMsg && message.quotedMsg && (
        <div className="mb-2 p-2 bg-gray-100 border-l-2 border-gray-300 rounded text-sm">
          <div className="font-medium text-xs text-gray-600">
            {message.quotedMsg.isFromMe ? 'You' : message.quotedMsg.author || 'Unknown'}
          </div>
          <p className="truncate text-gray-600">{message.quotedMsg.body}</p>
        </div>
      )}
      
      {renderMessageContent()}
      
      <div className="flex justify-end items-center mt-1 space-x-1">
        <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
        {message.isFromMe && (
          <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
        )}
      </div>
    </div>
  );
};

export default ChatMessage;