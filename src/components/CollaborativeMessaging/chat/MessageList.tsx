"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Hash, Lock, InfoIcon, ChevronDown } from 'lucide-react';

import useChannelStore from '@/store/messaging/channelStore';
import useMessageStore from '@/store/messaging/messageStore';
import useAuthStore from '@/store/messaging/authStore';
import Spinner from '@/components/custom-ui/modal/custom-spinner';
import MessageItem from './MessageItem';

const MessageList = () => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  const { selectedChannelId, selectedDirectMessageId, channels, directMessages } = useChannelStore();
  const { 
    channelMessages, directMessages: dmMessages, 
    hasMoreMessages, fetchChannelMessages, fetchDirectMessages,
    fetchOlderMessages, typingUsers, setupSocketListeners, cleanupSocketListeners 
  } = useMessageStore();
  const { user } = useAuthStore();
  
  // Set up socket listeners
  useEffect(() => {
    setupSocketListeners();
    
    return () => {
      cleanupSocketListeners();
    };
  }, [setupSocketListeners, cleanupSocketListeners]);
  
  // Fetch messages when channel or DM changes
  useEffect(() => {
    if (selectedChannelId) {
      fetchChannelMessages(selectedChannelId);
    } else if (selectedDirectMessageId) {
      fetchDirectMessages(selectedDirectMessageId);
    }
  }, [selectedChannelId, selectedDirectMessageId, fetchChannelMessages, fetchDirectMessages]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [selectedChannelId, selectedDirectMessageId]);
  
  // Set up scroll listener
  useEffect(() => {
    const messageList = messageListRef.current;
    
    if (!messageList) return;
    
    const handleScroll = () => {
      // Check if user has scrolled up
      const isScrolledUp = messageList.scrollTop < messageList.scrollHeight - messageList.clientHeight - 100;
      setShowScrollToBottom(isScrolledUp);
      
      // Check if user has scrolled to top for loading more messages
      if (messageList.scrollTop === 0) {
        handleLoadMore();
      }
    };
    
    messageList.addEventListener('scroll', handleScroll);
    
    return () => {
      messageList.removeEventListener('scroll', handleScroll);
    };
  }, [selectedChannelId, selectedDirectMessageId]);
  
  // Get messages for the selected channel or DM
  const messages = selectedChannelId 
    ? (channelMessages[selectedChannelId] || [])
    : selectedDirectMessageId 
      ? (dmMessages[selectedDirectMessageId] || [])
      : [];
  
  // Get current channel or DM data
  const currentChannel = selectedChannelId 
    ? channels.find(c => c.id === selectedChannelId) 
    : null;
  
  const currentDM = selectedDirectMessageId 
    ? directMessages.find(dm => dm.id === selectedDirectMessageId) 
    : null;
  
  // Get typing users for the current channel or DM
  const currentTypingUsers = typingUsers.filter(tu => 
    (selectedChannelId && tu.channelId === selectedChannelId) ||
    (selectedDirectMessageId && tu.dmId === selectedDirectMessageId)
  );
  
  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle loading more messages
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMoreMessages[selectedChannelId || selectedDirectMessageId || '']) {
      return;
    }
    
    setIsLoadingMore(true);
    
    try {
      if (selectedChannelId) {
        await fetchOlderMessages('channel', selectedChannelId);
      } else if (selectedDirectMessageId) {
        await fetchOlderMessages('dm', selectedDirectMessageId);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  // Render header
  const renderHeader = () => {
    if (currentChannel) {
      return (
        <div className="flex items-center space-x-2">
          {currentChannel.isPrivate ? (
            <Lock size={20} className="text-gray-500" />
          ) : (
            <Hash size={20} className="text-gray-500" />
          )}
          <h2 className="font-semibold">{currentChannel.name}</h2>
          <button 
            className="ml-2 text-gray-400 hover:text-gray-600"
            title="View details"
          >
            <InfoIcon size={16} />
          </button>
        </div>
      );
    } else if (currentDM) {
      return (
        <div className="flex items-center space-x-2">
          <h2 className="font-semibold">{currentDM?.otherUser?.fullName}</h2>
          <span className="text-sm text-gray-500">@{currentDM?.otherUser?.username}</span>
        </div>
      );
    }
    
    return null;
  };
  
  // If no channel or DM is selected
  if (!selectedChannelId && !selectedDirectMessageId) {
    return (
      <div className="flex-1 flex flex-col border border-gray-200 rounded-r-xl">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to messaging</h3>
            <p className="text-gray-500">Select a channel or conversation to start chatting</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col border border-gray-200 rounded-r-xl">
      {/* Header */}
      <div className="bg-white p-4 border-b">
        {renderHeader()}
      </div>
      
      {/* Messages area */}
      <div 
        ref={messageListRef}
        className="flex-1 p-4 overflow-y-auto"
      >
        {/* Loading indicator for older messages */}
        {isLoadingMore && (
          <div className="flex justify-center items-center py-4">
            <Spinner />
          </div>
        )}
        
        {/* No messages state */}
        {messages.length === 0 && !isLoadingMore && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {currentChannel ? `Welcome to #${currentChannel?.name}` : 'Start a conversation'}
              </h3>
              <p className="text-gray-500">
                {currentChannel 
                  ? `This is the beginning of the #${currentChannel?.name} channel`
                  : `This is the beginning of your conversation with ${currentDM?.otherUser?.fullName}`
                }
              </p>
            </div>
          </div>
        )}
        
        {/* Messages */}
        {messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageItem 
                key={message?.id} 
                message={message} 
                isOwnMessage={message?.sender.id === user?.id}
              />
            ))}
          </div>
        )}
        
        {/* Typing indicator */}
        {currentTypingUsers.length > 0 && (
          <div className="mt-2 text-gray-500 text-sm">
            {currentTypingUsers.length === 1 
              ? `${currentTypingUsers[0]?.username} is typing...`
              : `${currentTypingUsers?.length} people are typing...`
            }
          </div>
        )}
        
        {/* This div is used to scroll to the bottom */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-8 rounded-full bg-gray-100 p-2 shadow-md hover:bg-gray-200"
        >
          <ChevronDown size={20} />
        </button>
      )}
    </div>
  );
};

export default MessageList;