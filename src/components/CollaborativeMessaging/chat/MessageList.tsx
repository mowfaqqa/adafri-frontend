import React, { useEffect, useRef, useState } from 'react';
import { Hash, Lock, InfoIcon, ChevronDown } from 'lucide-react';

import useChannelStore from '@/lib/store/messaging/channelStore';
import useMessageStore from '@/lib/store/messaging/messageStore';
import useAuthStore from '@/lib/store/messaging/authStore';
import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
import Spinner from '@/components/custom-ui/modal/custom-spinner';
import MessageItem from './MessageItem';

const MessageList: React.FC = () => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  const { selectedWorkspaceId, workspaces } = useWorkspaceStore();
  const { 
    selectedChannelId, 
    selectedDirectMessageId, 
    channelsByWorkspace, 
    directMessagesByWorkspace 
  } = useChannelStore();
  
  const { 
    channelMessages, 
    directMessages, 
    hasMoreMessages, 
    fetchChannelMessages, 
    fetchDirectMessages,
    fetchOlderMessages, 
    typingUsers
  } = useMessageStore();
  
  const { user } = useAuthStore();
  
  // Fetch messages when channel or DM changes
  useEffect(() => {
    if (selectedWorkspaceId && selectedChannelId) {
      fetchChannelMessages(selectedWorkspaceId, selectedChannelId);
    } else if (selectedWorkspaceId && selectedDirectMessageId) {
      fetchDirectMessages(selectedWorkspaceId, selectedDirectMessageId);
    }
  }, [
    selectedWorkspaceId, 
    selectedChannelId, 
    selectedDirectMessageId, 
    fetchChannelMessages, 
    fetchDirectMessages
  ]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId]);
  
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
  }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId]);
  
  // Get messages for the selected channel or DM
  const messages = 
    selectedWorkspaceId && selectedChannelId 
      ? ((channelMessages[selectedWorkspaceId] || {})[selectedChannelId] || [])
      : selectedWorkspaceId && selectedDirectMessageId 
        ? ((directMessages[selectedWorkspaceId] || {})[selectedDirectMessageId] || [])
        : [];
  
  // Get current channel or DM data
  const currentChannel = 
    selectedWorkspaceId && selectedChannelId 
      ? (channelsByWorkspace[selectedWorkspaceId] || []).find(c => c.id === selectedChannelId) 
      : null;
  
  const currentDM = 
    selectedWorkspaceId && selectedDirectMessageId 
      ? (directMessagesByWorkspace[selectedWorkspaceId] || []).find(dm => dm.id === selectedDirectMessageId) 
      : null;
  
  // Get current workspace
  const currentWorkspace = selectedWorkspaceId 
    ? workspaces.find((w: any )=> w.id === selectedWorkspaceId)
    : null;
  
  // Get typing users for the current channel or DM
  const currentTypingUsers = typingUsers.filter(tu => 
    tu.workspaceId === selectedWorkspaceId && (
      (selectedChannelId && tu.channelId === selectedChannelId) ||
      (selectedDirectMessageId && tu.dmId === selectedDirectMessageId)
    )
  );
  
  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle loading more messages
  const handleLoadMore = async () => {
    if (!selectedWorkspaceId) return;
    
    let cacheKey = '';
    if (selectedChannelId) {
      cacheKey = `${selectedWorkspaceId}:channel:${selectedChannelId}`;
    } else if (selectedDirectMessageId) {
      cacheKey = `${selectedWorkspaceId}:dm:${selectedDirectMessageId}`;
    } else {
      return;
    }
    
    if (isLoadingMore || !hasMoreMessages[cacheKey]) {
      return;
    }
    
    setIsLoadingMore(true);
    
    try {
      if (selectedChannelId) {
        await fetchOlderMessages('channel', selectedWorkspaceId, selectedChannelId);
      } else if (selectedDirectMessageId) {
        await fetchOlderMessages('dm', selectedWorkspaceId, selectedDirectMessageId);
      }
    } catch (error) {
      console.log('Error loading more messages:', error);
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
  
  // If no workspace, channel or DM is selected
  if (!selectedWorkspaceId || (!selectedChannelId && !selectedDirectMessageId)) {
    return (
      <div className="flex-1 flex flex-col border border-gray-200 rounded-r-xl">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            {currentWorkspace ? (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to {currentWorkspace.name}</h3>
                <p className="text-gray-500">Select a channel or conversation to start chatting</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Messaging</h3>
                <p className="text-gray-500">Select or create a workspace to get started</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col">
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
            <Spinner size="sm" />
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
                key={message.id} 
                message={message} 
                isOwnMessage={message.sender.id === user?.id}
              />
            ))}
          </div>
        )}
        
        {/* Typing indicator */}
        {currentTypingUsers.length > 0 && (
          <div className="mt-2 text-gray-500 text-sm">
            {currentTypingUsers.length === 1 
              ? `${currentTypingUsers[0]?.username} is typing...`
              : `${currentTypingUsers.length} people are typing...`
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