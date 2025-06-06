import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Smile } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useDropzone } from 'react-dropzone';

import useMessageStore from '@/lib/store/messaging/messageStore';
import useChannelStore from '@/lib/store/messaging/channelStore';
import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
import Button from '@/components/custom-ui/button';
import config from '@/lib/config/messaging';

// Dynamically import EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => <div className="p-2 bg-white rounded-md shadow-md">Loading emoji picker...</div>,
});

interface MessageInputProps {
  threadId?: string;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  threadId,
  placeholder = 'Write a message...'
}) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { sendMessage, sendThreadMessage, startTyping, stopTyping } = useMessageStore();
  const { selectedChannelId, selectedDirectMessageId } = useChannelStore();
  const { selectedWorkspaceId } = useWorkspaceStore();
  
  // Set up dropzone for file uploads
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: config.fileUpload.allowedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: config.fileUpload.maxFiles,
    maxSize: config.fileUpload.maxFileSize,
    onDrop: (acceptedFiles) => {
      // Concat new files to existing ones, up to max allowed
      const newFiles = [...files, ...acceptedFiles].slice(0, config.fileUpload.maxFiles);
      setFiles(newFiles);
    },
  });
  
  // Focus input when component mounts or selection changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedChannelId, selectedDirectMessageId, threadId]);
  
  // Clean up typing indicator when component unmounts
  useEffect(() => {
    return () => {
      // Clean up typing indicator
      if (isTyping && selectedWorkspaceId) {
        stopTyping(selectedWorkspaceId);
      }
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [isTyping, stopTyping, typingTimeout, selectedWorkspaceId]);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Skip typing indicator if no workspace selected
    if (!selectedWorkspaceId) return;
    
    // Handle typing indicator
    if (!isTyping) {
      setIsTyping(true);
      startTyping(selectedWorkspaceId);
    }
    
    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to stop typing
    const timeout = setTimeout(() => {
      setIsTyping(false);
      if (selectedWorkspaceId) {
        stopTyping(selectedWorkspaceId);
      }
    }, 2000);
    
    setTypingTimeout(timeout);
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (message.trim() === '' && files.length === 0) return;
    if (!selectedWorkspaceId) return;
    
    try {
      if (threadId) {
        // Send a thread message
        await sendThreadMessage(message, selectedWorkspaceId, threadId, files);
      } else {
        // Send a regular message
        await sendMessage(message, selectedWorkspaceId, files);
      }
      
      // Clear input and files
      setMessage('');
      setFiles([]);
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        if (selectedWorkspaceId) {
          stopTyping(selectedWorkspaceId);
        }
      }
      
      // Clear typing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    } catch (error) {
      console.log('Error sending message:', error);
    }
  };
  
  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle emoji selection
  const handleEmojiSelect = (emoji: any) => {
    setMessage(prev => prev + emoji.emoji);
    setShowEmojiPicker(false);
    
    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Handle removing a file
  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  // No workspace, channel or DM selected
  if (!selectedWorkspaceId || (!selectedChannelId && !selectedDirectMessageId && !threadId)) {
    return null;
  }
  
  return (
    <div className="p-4 border-t bg-white">
      {/* File preview area */}
      {files.length > 0 && (
        <div className="mb-3 p-2 border rounded-md bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div 
                key={index}
                className="relative flex items-center bg-white p-2 rounded border"
              >
                <span className="text-xs truncate max-w-xs">
                  {file.name}
                </span>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="ml-2 p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div 
        className={`
          flex space-x-2 rounded-md border
          ${isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}
        `}
        {...getRootProps()}
      >
        {/* File input */}
        <input {...getInputProps()} />
        
        <button
          type="button"
          className="p-2 text-gray-500 hover:text-gray-700"
          title="Attach files"
        >
          <Paperclip size={20} />
        </button>
        
        {/* Message input */}
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={isDragActive ? 'Drop files here...' : placeholder}
          className="flex-1 p-2 focus:outline-none"
        />
        
        {/* Emoji picker button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Add emoji"
          >
            <Smile size={20} />
          </button>
          
          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-10 right-0 z-10">
              <EmojiPicker
                onEmojiClick={handleEmojiSelect}
                width={300}
                height={350}
              />
            </div>
          )}
        </div>
        
        {/* Send button */}
        <Button
          onClick={handleSendMessage}
          disabled={message.trim() === '' && files.length === 0}
          className="rounded-none rounded-r-md"
        >
          <Send size={20} />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;