import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Hash, Lock, Info, ChevronDown, Phone, Video, MoreVertical, Smile, Reply, Edit, Trash, MoreHorizontal } from 'lucide-react';
import dynamic from 'next/dynamic';

import useChannelStore from '@/lib/store/messaging/channelStore';
import useMessageStore from '@/lib/store/messaging/messageStore';
import useAuthStore from '@/lib/store/messaging/authStore';
import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
import Spinner from '@/components/custom-ui/modal/custom-spinner';
import Avatar from '@/components/custom-ui/avatar';
import Image from "next/image";

// Dynamically import EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-200">Loading emoji picker...</div>,
});

const MessageList: React.FC = () => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  
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
    typingUsers,
    updateMessage,
    deleteMessage,
    addReaction,
    setActiveThread
  } = useMessageStore();
  
  const { user } = useAuthStore();
  
  // Get messages for the selected channel or DM and sort them chronologically
  const rawMessages = 
    selectedWorkspaceId && selectedChannelId 
      ? ((channelMessages[selectedWorkspaceId] || {})[selectedChannelId] || [])
      : selectedWorkspaceId && selectedDirectMessageId 
        ? ((directMessages[selectedWorkspaceId] || {})[selectedDirectMessageId] || [])
        : [];

  // Sort messages by creation date (oldest first, newest last)
  const messages = [...rawMessages].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateA - dateB; // Ascending order (oldest first)
  });
  
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
    ? workspaces.find((w: any) => w.id === selectedWorkspaceId)
    : null;
  
  // Get typing users for the current channel or DM
  const currentTypingUsers = typingUsers.filter(tu => 
    tu.workspaceId === selectedWorkspaceId && (
      (selectedChannelId && tu.channelId === selectedChannelId) ||
      (selectedDirectMessageId && tu.dmId === selectedDirectMessageId)
    )
  );

  // Enhanced scroll to bottom with smooth animation - moved before useEffect
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
    // Fallback for older browsers
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Handle loading more messages with useCallback - moved before useEffect
  const handleLoadMore = useCallback(async () => {
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
    
    // Store current scroll position to maintain it after loading
    const messageList = messageListRef.current;
    const scrollHeightBefore = messageList?.scrollHeight || 0;
    
    try {
      if (selectedChannelId) {
        await fetchOlderMessages('channel', selectedWorkspaceId, selectedChannelId);
      } else if (selectedDirectMessageId) {
        await fetchOlderMessages('dm', selectedWorkspaceId, selectedDirectMessageId);
      }
      
      // Maintain scroll position after loading older messages
      setTimeout(() => {
        if (messageList) {
          const scrollHeightAfter = messageList.scrollHeight;
          const scrollDifference = scrollHeightAfter - scrollHeightBefore;
          messageList.scrollTop = scrollDifference;
        }
      }, 0);
      
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    selectedWorkspaceId, 
    selectedChannelId, 
    selectedDirectMessageId, 
    isLoadingMore, 
    hasMoreMessages, 
    fetchOlderMessages
  ]);

  // Fetch messages when channel or DM changes
  useEffect(() => {
    setShouldScrollToBottom(true);
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
  
  // Scroll to bottom when messages change (only if user should be at bottom)
  useEffect(() => {
    if (shouldScrollToBottom) {
      scrollToBottom(false); // Don't animate on initial load
      setShouldScrollToBottom(false);
    }
  }, [messages.length, shouldScrollToBottom, scrollToBottom]);

  // Auto-scroll to bottom when new messages arrive (only if user is near bottom)
  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;

    const { scrollTop, scrollHeight, clientHeight } = messageList;
    const isNearBottom = scrollTop >= scrollHeight - clientHeight - 100;
    
    // If user is near bottom, scroll to bottom when new messages arrive
    if (isNearBottom && messages.length > 0) {
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [messages, scrollToBottom]);
  
  // Set up scroll listener with enhanced scrolling functionality
  useEffect(() => {
    const messageList = messageListRef.current;
    
    if (!messageList) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messageList;
      
      // Check if user has scrolled up from bottom
      const isScrolledUp = scrollTop < scrollHeight - clientHeight - 100;
      setShowScrollToBottom(isScrolledUp);
      
      // Check if user has scrolled to top for loading more messages
      if (scrollTop <= 50 && !isLoadingMore) {
        const cacheKey = selectedChannelId 
          ? `${selectedWorkspaceId}:channel:${selectedChannelId}`
          : selectedDirectMessageId 
            ? `${selectedWorkspaceId}:dm:${selectedDirectMessageId}`
            : '';
        
        if (cacheKey && hasMoreMessages[cacheKey]) {
          handleLoadMore();
        }
      }
    };
    
    // Enhanced scroll handling with throttling for better performance
    let scrollTimeout: NodeJS.Timeout;
    const throttledScrollHandler = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 16); // ~60fps
    };
    
    messageList.addEventListener('scroll', throttledScrollHandler, { passive: true });
    
    return () => {
      messageList.removeEventListener('scroll', throttledScrollHandler);
      clearTimeout(scrollTimeout);
    };
  }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId, hasMoreMessages, isLoadingMore, handleLoadMore]);
  
  // Scroll to specific message (useful for navigation)
  const scrollToMessage = (messageId: string) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Handle edit message
  const handleEditMessage = (messageId: string, content: string) => {
    setIsEditing(messageId);
    setEditContent(content);
    setShowActionsModal(false);
  };

  // Handle edit submit
  const handleEditSubmit = async (messageId: string) => {
    if (editContent.trim() === '' || editContent === messages.find(m => m.id === messageId)?.content) {
      setIsEditing(null);
      return;
    }

    try {
      await updateMessage(messageId, editContent);
      setIsEditing(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  // Handle reply
  const handleReply = (messageId: string) => {
    if (selectedWorkspaceId) {
      setActiveThread(selectedWorkspaceId, messageId);
      setShowActionsModal(false);
    }
  };

  // Handle delete
  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      setShowActionsModal(false);
      setActiveMessageId(null);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Handle add reaction
  const handleAddReaction = async (emoji: string, messageId: string) => {
    try {
      await addReaction(messageId, emoji);
      setShowEmojiPicker(false);
      setShowActionsModal(false);
      setActiveMessageId(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };
  
  // Render header
  const renderHeader = () => {
    if (currentChannel) {
      return (
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white p-4 shadow-sm border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${
              currentChannel.isPrivate 
                ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                : 'bg-gradient-to-br from-blue-500 to-purple-600'
            } shadow-lg`}>
              {currentChannel.isPrivate ? 
                <Lock size={20} className="text-white" /> : 
                <Hash size={20} className="text-white" />
              }
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-lg">{currentChannel.name}</h2>
              <p className="text-sm text-gray-500">
                {currentChannel.isPrivate ? 'Private channel' : 'Public channel'} • 12 members online
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
              <Phone size={18} />
            </button>
            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
              <Video size={18} />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      );
    } else if (currentDM) {
      return (
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white p-4 shadow-sm border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img 
                src={currentDM?.otherUser?.avatar || '/api/placeholder/48/48'} 
                alt={currentDM?.otherUser?.fullName}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-lg">{currentDM?.otherUser?.fullName}</h2>
              <p className="text-sm text-green-600 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Active now
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
              <Phone size={18} />
            </button>
            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
              <Video size={18} />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Safe date formatting function
  const formatTime = (timestamp: string | Date) => {
    try {
      let date: Date;
      
      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        console.warn('Invalid timestamp provided:', timestamp);
        return 'Invalid date';
      }

      // Check if the parsed date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date value:', timestamp);
        return 'Invalid date';
      }

      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch (error) {
      console.error('Error formatting time:', error, 'Timestamp:', timestamp);
      return 'Invalid date';
    }
  };

  // Custom message bubble component
  const MessageBubble: React.FC<{ message: any; isOwnMessage: boolean }> = ({ message, isOwnMessage }) => {
    return (
      <div 
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}
        onMouseEnter={() => setHoveredMessageId(message.id)}
        onMouseLeave={() => setHoveredMessageId(null)}
      >
        <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-[70%] relative`}>
          {/* Avatar for other users */}
          {!isOwnMessage && (
            <div className="flex-shrink-0">
              <Avatar
                src={message.sender?.avatar}
                alt={message.sender?.fullName || 'User'}
                size="sm"
              />
            </div>
          )}
          
          {/* Message container */}
          <div className="relative">
            <div className={`
              px-4 py-3 rounded-2xl shadow-sm relative
              ${isOwnMessage 
                 ? 'bg-gradient-to-br from-gray-100 to-gray-150 text-gray-800 ml-2' 
                : 'bg-gradient-to-br from-blue-400 to-blue-500 text-white mr-2 border border-gray-200'
              }
              ${isOwnMessage ? 'rounded-br-md' : 'rounded-bl-md'}
            `}>
              {/* Message content or edit form */}
              {isEditing === message.id ? (
                <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(message.id); }} className="space-y-2">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(null)}
                      className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  
                  {/* Time and status */}
                  <div className={`
                    flex items-center justify-end mt-2 space-x-1
                     ${isOwnMessage ? 'text-gray-500' : 'text-blue-100'}
                  `}>
                    <span className="text-xs">
                      {formatTime(message.createdAt)}
                    </span>
                    
                    {/* Message status for own messages */}
                    {isOwnMessage && (
                      <div className="flex">
                        {/* Double tick for sent/delivered */}
                        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                        </svg>
                        <svg className="w-4 h-4 -ml-1" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Message actions - only show on hover */}
            {hoveredMessageId === message.id && isEditing !== message.id && (
              <div className={`absolute top-0 ${isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex items-center space-x-1 bg-white rounded-full shadow-lg border border-gray-200 px-2 py-1`}>
                <button
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setModalPosition({ x: rect.left, y: rect.bottom + 5 });
                    setActiveMessageId(message.id);
                    setShowEmojiPicker(true);
                  }}
                  className="p-1 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                  title="Add reaction"
                >
                  <Smile size={16} />
                </button>
                <button
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setModalPosition({ x: rect.left, y: rect.bottom + 5 });
                    setActiveMessageId(message.id);
                    setShowActionsModal(true);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  title="More actions"
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // If no workspace, channel or DM is selected
  if (!selectedWorkspaceId || (!selectedChannelId && !selectedDirectMessageId)) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            {currentWorkspace ? (
              <>
                <div className="flex items-center justify-center mb-6 mx-auto">
                  <Image
                    src="/icons/no-data.svg"
                    alt="No data"
                    width={70}
                    height={70}
                    className="w-56 h-56"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to {currentWorkspace.name}</h3>
                <p className="text-gray-600 leading-relaxed">Select a channel or start a conversation to begin collaborating with your team</p>
              </>
            ) : (
              <>
                 <div className="flex items-center justify-center mb-6 mx-auto">
                  <Image
                    src="/icons/no-data.svg"
                    alt="No data"
                    width={70}
                    height={70}
                    className="w-56 h-56"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Messaging</h3>
                <p className="text-gray-600 leading-relaxed">Select or create a workspace to get started with your team collaboration</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
   <div className="flex-1 flex flex-col h-full relative">
    {/* Fixed Header */}
    {renderHeader()}
    
    {/* Messages area with proper scrolling */}
    <div 
      ref={messageListRef}
      className="flex-1 p-4 overflow-y-auto scroll-smooth"
      style={{ 
        scrollBehavior: 'smooth',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch', // Better scrolling on iOS
        height: 'calc(100vh - 140px)' // Adjust based on your layout
      }}
      onWheel={(e) => {
        // Allow natural wheel scrolling
        e.stopPropagation();
      }}
      onTouchMove={(e) => {
        // Allow natural touch scrolling on mobile
        e.stopPropagation();
      }}
    >
      {/* Loading indicator for older messages */}
      {isLoadingMore && (
        <div className="flex justify-center items-center py-6">
          <div className="bg-white rounded-full p-3 shadow-lg border border-gray-200">
            <Spinner size="sm" />
          </div>
        </div>
      )}
      
      {/* No messages state */}
      {messages.length === 0 && !isLoadingMore && (
        <div className="flex h-full items-center justify-center">
          <div className="text-center max-w-md mx-auto bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              {currentChannel ? <Hash size={28} className="text-white" /> : <span className="text-3xl">💬</span>}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {currentChannel ? `Welcome to #${currentChannel?.name}` : 'Start a conversation'}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {currentChannel 
                ? `This is the beginning of the #${currentChannel?.name} channel. Share ideas, files, and collaborate with your team.`
                : `This is the beginning of your conversation with ${currentDM?.otherUser?.fullName}. Send a message to get started!`
              }
            </p>
          </div>
        </div>
      )}
      
      {/* Messages with message IDs for navigation */}
      {messages.length > 0 && (
        <div className="space-y-1">
          {messages.map((message) => (
            <div key={message.id} data-message-id={message.id}>
              <MessageBubble
                message={message} 
                isOwnMessage={message.sender?.id === user?.id}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Typing indicator */}
      {currentTypingUsers.length > 0 && (
        <div className="flex justify-start mb-4">
          <div className="flex items-center space-x-3">
            <img 
              // src={currentTypingUsers[0]?.avatar || '/api/placeholder/32/32'} 
              alt="User typing" 
              className="w-8 h-8 rounded-full object-cover" 
            />
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-200">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* This div is used to scroll to the bottom */}
      <div ref={messagesEndRef} />
    </div>
    
    {/* Enhanced scroll to bottom button */}
    {showScrollToBottom && (
      <div className="absolute bottom-6 right-6 flex flex-col items-end space-y-2 z-20">
        {/* Scroll position indicator */}
        <div className="bg-white rounded-full shadow-lg border border-gray-200 px-3 py-1">
          <span className="text-xs text-gray-500">
            {messages.length > 0 && 'Scroll to latest'}
          </span>
        </div>
        
        {/* Scroll to bottom button */}
        <button
          onClick={() => scrollToBottom(true)}
          className="p-3 bg-blue-500 text-white rounded-full shadow-xl hover:bg-blue-600 transition-all duration-200 hover:scale-110 flex items-center justify-center"
          title="Scroll to bottom"
        >
          <ChevronDown size={20} />
        </button>
      </div>
    )}

    {/* Actions Modal */}
    {showActionsModal && activeMessageId && (
      <>
        <div 
          className="fixed inset-0 z-50"
          onClick={() => setShowActionsModal(false)}
        />
        <div 
          className="fixed bg-white rounded-2xl shadow-lg border border-gray-200 z-50 min-w-[80px]"
          style={{
            left: `${modalPosition.x}px`,
            top: `${modalPosition.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="p-2">
            {/* Quick emoji reactions */}
            <div className="flex flex-wrap justify-center gap-1 p-1 border-b border-gray-100">
              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleAddReaction(emoji, activeMessageId)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-2xl"
                >
                  {emoji}
                </button>
              ))}
              <button
                onClick={() => {
                  setShowActionsModal(false);
                  setShowEmojiPicker(true);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Smile size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="py-2">
              <button
                onClick={() => handleReply(activeMessageId)}
                className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <Reply size={20} className="text-gray-500 mr-3" />
                <span className="text-gray-700">Reply</span>
              </button>

              {/* Show edit and delete only for own messages - FIXED VERSION */}
              {(() => {
                const message = messages.find(m => m.id === activeMessageId);
                const isOwnMessage = message?.sender?.id === user?.id;
                
                console.log('Debug - Message:', message?.sender?.id, 'User:', user?.id, 'IsOwn:', isOwnMessage);
                
                if (isOwnMessage && message) {
                  return (
                    <>
                      <button
                        onClick={() => handleEditMessage(activeMessageId, message.content)}
                        className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <Edit size={20} className="text-gray-500 mr-3" />
                        <span className="text-gray-700">Edit</span>
                      </button>
                      
                      <button
                        onClick={() => handleDelete(activeMessageId)}
                        className="flex items-center w-full px-4 py-3 text-left hover:bg-red-50 transition-colors"
                      >
                        <Trash size={20} className="text-red-500 mr-3" />
                        <span className="text-red-500">Delete</span>
                      </button>
                    </>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      </>
    )}

    {/* Emoji Picker Modal */}
    {showEmojiPicker && activeMessageId && (
      <>
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setShowEmojiPicker(false)}
        />
        <div 
          className="fixed z-50"
          style={{
            left: `${modalPosition.x}px`,
            top: `${modalPosition.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <EmojiPicker
              onEmojiClick={(emojiData) => handleAddReaction(emojiData.emoji, activeMessageId)}
              width={320}
              height={400}
            />
          </div>
        </div>
      </>
    )}
  </div>
);
};

export default MessageList;
































































// August 1
// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import { Hash, Lock, Info, ChevronDown, Phone, Video, MoreVertical, Smile, Reply, Edit, Trash, MoreHorizontal } from 'lucide-react';
// import dynamic from 'next/dynamic';

// import useChannelStore from '@/lib/store/messaging/channelStore';
// import useMessageStore from '@/lib/store/messaging/messageStore';
// import useAuthStore from '@/lib/store/messaging/authStore';
// import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
// import Spinner from '@/components/custom-ui/modal/custom-spinner';
// import Avatar from '@/components/custom-ui/avatar';
// import Image from "next/image";

// // Dynamically import EmojiPicker to avoid SSR issues
// const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
//   ssr: false,
//   loading: () => <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-200">Loading emoji picker...</div>,
// });

// const MessageList: React.FC = () => {
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const messageListRef = useRef<HTMLDivElement>(null);
//   const [showScrollToBottom, setShowScrollToBottom] = useState(false);
//   const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
//   const [showActionsModal, setShowActionsModal] = useState(false);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
//   const [isEditing, setIsEditing] = useState<string | null>(null);
//   const [editContent, setEditContent] = useState('');
//   const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
//   const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  
//   const { selectedWorkspaceId, workspaces } = useWorkspaceStore();
//   const { 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     channelsByWorkspace, 
//     directMessagesByWorkspace 
//   } = useChannelStore();
  
//   const { 
//     channelMessages, 
//     directMessages, 
//     hasMoreMessages, 
//     fetchChannelMessages, 
//     fetchDirectMessages,
//     fetchOlderMessages, 
//     typingUsers,
//     updateMessage,
//     deleteMessage,
//     addReaction,
//     setActiveThread
//   } = useMessageStore();
  
//   const { user } = useAuthStore();
  
//   // Get messages for the selected channel or DM and sort them chronologically
//   const rawMessages = 
//     selectedWorkspaceId && selectedChannelId 
//       ? ((channelMessages[selectedWorkspaceId] || {})[selectedChannelId] || [])
//       : selectedWorkspaceId && selectedDirectMessageId 
//         ? ((directMessages[selectedWorkspaceId] || {})[selectedDirectMessageId] || [])
//         : [];

//   // Sort messages by creation date (oldest first, newest last)
//   const messages = [...rawMessages].sort((a, b) => {
//     const dateA = new Date(a.createdAt).getTime();
//     const dateB = new Date(b.createdAt).getTime();
//     return dateA - dateB; // Ascending order (oldest first)
//   });
  
//   // Get current channel or DM data
//   const currentChannel = 
//     selectedWorkspaceId && selectedChannelId 
//       ? (channelsByWorkspace[selectedWorkspaceId] || []).find(c => c.id === selectedChannelId) 
//       : null;
  
//   const currentDM = 
//     selectedWorkspaceId && selectedDirectMessageId 
//       ? (directMessagesByWorkspace[selectedWorkspaceId] || []).find(dm => dm.id === selectedDirectMessageId) 
//       : null;
  
//   // Get current workspace
//   const currentWorkspace = selectedWorkspaceId 
//     ? workspaces.find((w: any) => w.id === selectedWorkspaceId)
//     : null;
  
//   // Get typing users for the current channel or DM
//   const currentTypingUsers = typingUsers.filter(tu => 
//     tu.workspaceId === selectedWorkspaceId && (
//       (selectedChannelId && tu.channelId === selectedChannelId) ||
//       (selectedDirectMessageId && tu.dmId === selectedDirectMessageId)
//     )
//   );

//   // Enhanced scroll to bottom with smooth animation - moved before useEffect
//   const scrollToBottom = useCallback((smooth: boolean = true) => {
//     if (messageListRef.current) {
//       messageListRef.current.scrollTo({
//         top: messageListRef.current.scrollHeight,
//         behavior: smooth ? 'smooth' : 'auto'
//       });
//     }
//     // Fallback for older browsers
//     messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
//   }, []);

//   // Handle loading more messages with useCallback - moved before useEffect
//   const handleLoadMore = useCallback(async () => {
//     if (!selectedWorkspaceId) return;
    
//     let cacheKey = '';
//     if (selectedChannelId) {
//       cacheKey = `${selectedWorkspaceId}:channel:${selectedChannelId}`;
//     } else if (selectedDirectMessageId) {
//       cacheKey = `${selectedWorkspaceId}:dm:${selectedDirectMessageId}`;
//     } else {
//       return;
//     }
    
//     if (isLoadingMore || !hasMoreMessages[cacheKey]) {
//       return;
//     }
    
//     setIsLoadingMore(true);
    
//     // Store current scroll position to maintain it after loading
//     const messageList = messageListRef.current;
//     const scrollHeightBefore = messageList?.scrollHeight || 0;
    
//     try {
//       if (selectedChannelId) {
//         await fetchOlderMessages('channel', selectedWorkspaceId, selectedChannelId);
//       } else if (selectedDirectMessageId) {
//         await fetchOlderMessages('dm', selectedWorkspaceId, selectedDirectMessageId);
//       }
      
//       // Maintain scroll position after loading older messages
//       setTimeout(() => {
//         if (messageList) {
//           const scrollHeightAfter = messageList.scrollHeight;
//           const scrollDifference = scrollHeightAfter - scrollHeightBefore;
//           messageList.scrollTop = scrollDifference;
//         }
//       }, 0);
      
//     } catch (error) {
//       console.error('Error loading more messages:', error);
//     } finally {
//       setIsLoadingMore(false);
//     }
//   }, [
//     selectedWorkspaceId, 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     isLoadingMore, 
//     hasMoreMessages, 
//     fetchOlderMessages
//   ]);

//   // Fetch messages when channel or DM changes
//   useEffect(() => {
//     setShouldScrollToBottom(true);
//     if (selectedWorkspaceId && selectedChannelId) {
//       fetchChannelMessages(selectedWorkspaceId, selectedChannelId);
//     } else if (selectedWorkspaceId && selectedDirectMessageId) {
//       fetchDirectMessages(selectedWorkspaceId, selectedDirectMessageId);
//     }
//   }, [
//     selectedWorkspaceId, 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     fetchChannelMessages, 
//     fetchDirectMessages
//   ]);
  
//   // Scroll to bottom when messages change (only if user should be at bottom)
//   useEffect(() => {
//     if (shouldScrollToBottom) {
//       scrollToBottom(false); // Don't animate on initial load
//       setShouldScrollToBottom(false);
//     }
//   }, [messages.length, shouldScrollToBottom, scrollToBottom]);

//   // Auto-scroll to bottom when new messages arrive (only if user is near bottom)
//   useEffect(() => {
//     const messageList = messageListRef.current;
//     if (!messageList) return;

//     const { scrollTop, scrollHeight, clientHeight } = messageList;
//     const isNearBottom = scrollTop >= scrollHeight - clientHeight - 100;
    
//     // If user is near bottom, scroll to bottom when new messages arrive
//     if (isNearBottom && messages.length > 0) {
//       setTimeout(() => scrollToBottom(true), 100);
//     }
//   }, [messages, scrollToBottom]);
  
//   // Set up scroll listener with enhanced scrolling functionality
//   useEffect(() => {
//     const messageList = messageListRef.current;
    
//     if (!messageList) return;
    
//     const handleScroll = () => {
//       const { scrollTop, scrollHeight, clientHeight } = messageList;
      
//       // Check if user has scrolled up from bottom
//       const isScrolledUp = scrollTop < scrollHeight - clientHeight - 100;
//       setShowScrollToBottom(isScrolledUp);
      
//       // Check if user has scrolled to top for loading more messages
//       if (scrollTop <= 50 && !isLoadingMore) {
//         const cacheKey = selectedChannelId 
//           ? `${selectedWorkspaceId}:channel:${selectedChannelId}`
//           : selectedDirectMessageId 
//             ? `${selectedWorkspaceId}:dm:${selectedDirectMessageId}`
//             : '';
        
//         if (cacheKey && hasMoreMessages[cacheKey]) {
//           handleLoadMore();
//         }
//       }
//     };
    
//     // Enhanced scroll handling with throttling for better performance
//     let scrollTimeout: NodeJS.Timeout;
//     const throttledScrollHandler = () => {
//       clearTimeout(scrollTimeout);
//       scrollTimeout = setTimeout(handleScroll, 16); // ~60fps
//     };
    
//     messageList.addEventListener('scroll', throttledScrollHandler, { passive: true });
    
//     return () => {
//       messageList.removeEventListener('scroll', throttledScrollHandler);
//       clearTimeout(scrollTimeout);
//     };
//   }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId, hasMoreMessages, isLoadingMore, handleLoadMore]);
  
//   // Scroll to specific message (useful for navigation)
//   const scrollToMessage = (messageId: string) => {
//     const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
//     if (messageElement) {
//       messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
//     }
//   };

//   // Handle edit message
//   const handleEditMessage = (messageId: string, content: string) => {
//     setIsEditing(messageId);
//     setEditContent(content);
//     setShowActionsModal(false);
//   };

//   // Handle edit submit
//   const handleEditSubmit = async (messageId: string) => {
//     if (editContent.trim() === '' || editContent === messages.find(m => m.id === messageId)?.content) {
//       setIsEditing(null);
//       return;
//     }

//     try {
//       await updateMessage(messageId, editContent);
//       setIsEditing(null);
//       setEditContent('');
//     } catch (error) {
//       console.error('Error updating message:', error);
//     }
//   };

//   // Handle reply
//   const handleReply = (messageId: string) => {
//     if (selectedWorkspaceId) {
//       setActiveThread(selectedWorkspaceId, messageId);
//       setShowActionsModal(false);
//     }
//   };

//   // Handle delete
//   const handleDelete = async (messageId: string) => {
//     try {
//       await deleteMessage(messageId);
//       setShowActionsModal(false);
//       setActiveMessageId(null);
//     } catch (error) {
//       console.error('Error deleting message:', error);
//     }
//   };

//   // Handle add reaction
//   const handleAddReaction = async (emoji: string, messageId: string) => {
//     try {
//       await addReaction(messageId, emoji);
//       setShowEmojiPicker(false);
//       setShowActionsModal(false);
//       setActiveMessageId(null);
//     } catch (error) {
//       console.error('Error adding reaction:', error);
//     }
//   };
  
//   // Render header
//   // 1. Update the renderHeader function (replace lines 264-315)
//   const renderHeader = () => {
//     if (currentChannel) {
//       return (
//         <div className="sticky top-0 z-10 flex items-center justify-between bg-white p-4 shadow-sm border-b border-gray-200">
//           <div className="flex items-center space-x-3">
//             <div className={`p-3 rounded-full ${
//               currentChannel.isPrivate 
//                 ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
//                 : 'bg-gradient-to-br from-blue-500 to-purple-600'
//             } shadow-lg`}>
//               {currentChannel.isPrivate ? 
//                 <Lock size={20} className="text-white" /> : 
//                 <Hash size={20} className="text-white" />
//               }
//             </div>
//             <div>
//               <h2 className="font-semibold text-gray-900 text-lg">{currentChannel.name}</h2>
//               <p className="text-sm text-gray-500">
//                 {currentChannel.isPrivate ? 'Private channel' : 'Public channel'} • 12 members online
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Phone size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Video size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200">
//               <MoreVertical size={18} />
//             </button>
//           </div>
//         </div>
//       );
//     } else if (currentDM) {
//       return (
//         <div className="sticky top-0 z-10 flex items-center justify-between bg-white p-4 shadow-sm border-b border-gray-200">
//           <div className="flex items-center space-x-3">
//             <div className="relative">
//               <img 
//                 src={currentDM?.otherUser?.avatar || '/api/placeholder/48/48'} 
//                 alt={currentDM?.otherUser?.fullName}
//                 className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
//               />
//               <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
//             </div>
//             <div>
//               <h2 className="font-semibold text-gray-900 text-lg">{currentDM?.otherUser?.fullName}</h2>
//               <p className="text-sm text-green-600 flex items-center">
//                 <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
//                 Active now
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Phone size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Video size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200">
//               <MoreVertical size={18} />
//             </button>
//           </div>
//         </div>
//       );
//     }
    
//     return null;
//   };

//   // Custom message bubble component
//   const MessageBubble: React.FC<{ message: any; isOwnMessage: boolean }> = ({ message, isOwnMessage }) => {
//     const formatTime = (timestamp: string) => {
//       return new Date(timestamp).toLocaleTimeString('en-US', { 
//         hour: '2-digit', 
//         minute: '2-digit',
//         hour12: false 
//       });
//     };

//     return (
//       <div 
//         className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}
//         onMouseEnter={() => setHoveredMessageId(message.id)}
//         onMouseLeave={() => setHoveredMessageId(null)}
//       >
//         <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-[70%] relative`}>
//           {/* Avatar for other users */}
//           {!isOwnMessage && (
//             <div className="flex-shrink-0">
//               <Avatar
//                 src={message.sender?.avatar}
//                 alt={message.sender?.fullName}
//                 size="sm"
//               />
//             </div>
//           )}
          
//           {/* Message container */}
//           <div className="relative">
//             <div className={`
//               px-4 py-3 rounded-2xl shadow-sm relative
//               ${isOwnMessage 
//                  ? 'bg-gradient-to-br from-gray-100 to-gray-150 text-gray-800 ml-2' 
//                 : 'bg-gradient-to-br from-blue-400 to-blue-500 text-white mr-2 border border-gray-200'
//               }
//               ${isOwnMessage ? 'rounded-br-md' : 'rounded-bl-md'}
//             `}>
//               {/* Message content or edit form */}
//               {isEditing === message.id ? (
//                 <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(message.id); }} className="space-y-2">
//                   <input
//                     type="text"
//                     value={editContent}
//                     onChange={(e) => setEditContent(e.target.value)}
//                     className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
//                     autoFocus
//                   />
//                   <div className="flex justify-end space-x-2">
//                     <button
//                       type="button"
//                       onClick={() => setIsEditing(null)}
//                       className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
//                     >
//                       Cancel
//                     </button>
//                     <button
//                       type="submit"
//                       className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
//                     >
//                       Save
//                     </button>
//                   </div>
//                 </form>
//               ) : (
//                 <>
//                   <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
//                     {message.content}
//                   </p>
                  
//                   {/* Time and status */}
//                   <div className={`
//                     flex items-center justify-end mt-2 space-x-1
//                      ${isOwnMessage ? 'text-gray-500' : 'text-blue-100'}
//                   `}>
//                     <span className="text-xs">
//                       {formatTime(message.createdAt)}
//                     </span>
                    
//                     {/* Message status for own messages */}
//                     {isOwnMessage && (
//                       <div className="flex">
//                         {/* Double tick for sent/delivered */}
//                         <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
//                           <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
//                         </svg>
//                         <svg className="w-4 h-4 -ml-1" viewBox="0 0 16 16" fill="currentColor">
//                           <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
//                         </svg>
//                       </div>
//                     )}
//                   </div>
//                 </>
//               )}
//             </div>
            
//             {/* Message actions - only show on hover */}
//             {hoveredMessageId === message.id && isEditing !== message.id && (
//               <div className={`absolute top-0 ${isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex items-center space-x-1 bg-white rounded-full shadow-lg border border-gray-200 px-2 py-1`}>
//                 <button
//                   onClick={(e) => {
//                     const rect = e.currentTarget.getBoundingClientRect();
//                     setModalPosition({ x: rect.left, y: rect.bottom + 5 });
//                     setActiveMessageId(message.id);
//                     setShowEmojiPicker(true);
//                   }}
//                   className="p-1 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
//                   title="Add reaction"
//                 >
//                   <Smile size={16} />
//                 </button>
//                 <button
//                   onClick={(e) => {
//                     const rect = e.currentTarget.getBoundingClientRect();
//                     setModalPosition({ x: rect.left, y: rect.bottom + 5 });
//                     setActiveMessageId(message.id);
//                     setShowActionsModal(true);
//                   }}
//                   className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
//                   title="More actions"
//                 >
//                   <MoreHorizontal size={16} />
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };
  
//   // If no workspace, channel or DM is selected
//   if (!selectedWorkspaceId || (!selectedChannelId && !selectedDirectMessageId)) {
//     return (
//       <div className="flex-1 flex flex-col">
//         <div className="flex min-h-[70vh] items-center justify-center">
//           <div className="text-center max-w-md mx-auto px-6">
//             {currentWorkspace ? (
//               <>
//                 <div className="flex items-center justify-center mb-6 mx-auto">
//                   <Image
//                     src="/icons/no-data.svg"
//                     alt="No data"
//                     width={70}
//                     height={70}
//                     className="w-56 h-56"
//                   />
//                 </div>
//                 <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to {currentWorkspace.name}</h3>
//                 <p className="text-gray-600 leading-relaxed">Select a channel or start a conversation to begin collaborating with your team</p>
//               </>
//             ) : (
//               <>
//                  <div className="flex items-center justify-center mb-6 mx-auto">
//                   <Image
//                     src="/icons/no-data.svg"
//                     alt="No data"
//                     width={70}
//                     height={70}
//                     className="w-56 h-56"
//                   />
//                 </div>
//                 <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Messaging</h3>
//                 <p className="text-gray-600 leading-relaxed">Select or create a workspace to get started with your team collaboration</p>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   }
  
//   return (
//    <div className="flex-1 flex flex-col h-full relative">
//     {/* Fixed Header */}
//     {renderHeader()}
    
//     {/* Messages area with proper scrolling */}
//     <div 
//       ref={messageListRef}
//       className="flex-1 p-4 overflow-y-auto scroll-smooth"
//       style={{ 
//         scrollBehavior: 'smooth',
//         overscrollBehavior: 'contain',
//         WebkitOverflowScrolling: 'touch', // Better scrolling on iOS
//         height: 'calc(100vh - 140px)' // Adjust based on your layout
//       }}
//       onWheel={(e) => {
//         // Allow natural wheel scrolling
//         e.stopPropagation();
//       }}
//       onTouchMove={(e) => {
//         // Allow natural touch scrolling on mobile
//         e.stopPropagation();
//       }}
//     >
//       {/* Loading indicator for older messages */}
//       {isLoadingMore && (
//         <div className="flex justify-center items-center py-6">
//           <div className="bg-white rounded-full p-3 shadow-lg border border-gray-200">
//             <Spinner size="sm" />
//           </div>
//         </div>
//       )}
      
//       {/* No messages state */}
//       {messages.length === 0 && !isLoadingMore && (
//         <div className="flex h-full items-center justify-center">
//           <div className="text-center max-w-md mx-auto bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
//             <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
//               {currentChannel ? <Hash size={28} className="text-white" /> : <span className="text-3xl">💬</span>}
//             </div>
//             <h3 className="text-xl font-bold text-gray-900 mb-3">
//               {currentChannel ? `Welcome to #${currentChannel?.name}` : 'Start a conversation'}
//             </h3>
//             <p className="text-gray-600 leading-relaxed">
//               {currentChannel 
//                 ? `This is the beginning of the #${currentChannel?.name} channel. Share ideas, files, and collaborate with your team.`
//                 : `This is the beginning of your conversation with ${currentDM?.otherUser?.fullName}. Send a message to get started!`
//               }
//             </p>
//           </div>
//         </div>
//       )}
      
//       {/* Messages with message IDs for navigation */}
//       {messages.length > 0 && (
//         <div className="space-y-1">
//           {messages.map((message) => (
//             <div key={message.id} data-message-id={message.id}>
//               <MessageBubble
//                 message={message} 
//                 isOwnMessage={message.sender.id === user?.id}
//               />
//             </div>
//           ))}
//         </div>
//       )}
      
//       {/* Typing indicator */}
//       {currentTypingUsers.length > 0 && (
//         <div className="flex justify-start mb-4">
//           <div className="flex items-center space-x-3">
//             <img 
//               // src={currentTypingUsers[0]?.avatar || '/api/placeholder/32/32'} 
//               alt="User typing" 
//               className="w-8 h-8 rounded-full object-cover" 
//             />
//             <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-200">
//               <div className="flex space-x-1">
//                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
//                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
      
//       {/* This div is used to scroll to the bottom */}
//       <div ref={messagesEndRef} />
//     </div>
    
//     {/* Enhanced scroll to bottom button */}
//     {showScrollToBottom && (
//       <div className="absolute bottom-6 right-6 flex flex-col items-end space-y-2 z-20">
//         {/* Scroll position indicator */}
//         <div className="bg-white rounded-full shadow-lg border border-gray-200 px-3 py-1">
//           <span className="text-xs text-gray-500">
//             {messages.length > 0 && 'Scroll to latest'}
//           </span>
//         </div>
        
//         {/* Scroll to bottom button */}
//         <button
//           onClick={() => scrollToBottom(true)}
//           className="p-3 bg-blue-500 text-white rounded-full shadow-xl hover:bg-blue-600 transition-all duration-200 hover:scale-110 flex items-center justify-center"
//           title="Scroll to bottom"
//         >
//           <ChevronDown size={20} />
//         </button>
//       </div>
//     )}

//     {/* Actions Modal */}
//     {showActionsModal && activeMessageId && (
//       <>
//         <div 
//           className="fixed inset-0 z-50"
//           onClick={() => setShowActionsModal(false)}
//         />
//         <div 
//           className="fixed bg-white rounded-2xl shadow-lg border border-gray-200 z-50 min-w-[80px]"
//           style={{
//             left: `${modalPosition.x}px`,
//             top: `${modalPosition.y}px`,
//             transform: 'translateX(-50%)'
//           }}
//         >
//           <div className="p-2">
//             {/* Quick emoji reactions */}
//             <div className="flex flex-wrap justify-center gap-1 p-1 border-b border-gray-100">
//               {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
//                 <button
//                   key={emoji}
//                   onClick={() => handleAddReaction(emoji, activeMessageId)}
//                   className="p-2 hover:bg-gray-100 rounded-full transition-colors text-2xl"
//                 >
//                   {emoji}
//                 </button>
//               ))}
//               <button
//                 onClick={() => {
//                   setShowActionsModal(false);
//                   setShowEmojiPicker(true);
//                 }}
//                 className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//               >
//                 <Smile size={24} className="text-gray-500" />
//               </button>
//             </div>

//             {/* Action buttons */}
//             <div className="py-2">
//               <button
//                 onClick={() => handleReply(activeMessageId)}
//                 className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
//               >
//                 <Reply size={20} className="text-gray-500 mr-3" />
//                 <span className="text-gray-700">Reply</span>
//               </button>

//               {/* Show edit and delete only for own messages */}
//               {(() => {
//                 const message = messages.find(m => m.id === activeMessageId);
//                 const isOwnMessage = message?.sender?.id === user?.id;
                
//                 if (isOwnMessage && message) {
//                   return (
//                     <>
//                       <button
//                         onClick={() => handleEditMessage(activeMessageId, message.content)}
//                         className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
//                       >
//                         <Edit size={20} className="text-gray-500 mr-3" />
//                         <span className="text-gray-700">Edit</span>
//                       </button>
                      
//                       <button
//                         onClick={() => handleDelete(activeMessageId)}
//                         className="flex items-center w-full px-4 py-3 text-left hover:bg-red-50 transition-colors"
//                       >
//                         <Trash size={20} className="text-red-500 mr-3" />
//                         <span className="text-red-500">Delete</span>
//                       </button>
//                     </>
//                   );
//                 }
//                 return null;
//               })()}
//             </div>
//           </div>
//         </div>
//       </>
//     )}

//     {/* Emoji Picker Modal */}
//     {showEmojiPicker && activeMessageId && (
//       <>
//         <div 
//           className="fixed inset-0 bg-black bg-opacity-50 z-50"
//           onClick={() => setShowEmojiPicker(false)}
//         />
//         <div 
//           className="fixed z-50"
//           style={{
//             left: `${modalPosition.x}px`,
//             top: `${modalPosition.y}px`,
//             transform: 'translateX(-50%)'
//           }}
//         >
//           <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
//             <EmojiPicker
//               onEmojiClick={(emojiData) => handleAddReaction(emojiData.emoji, activeMessageId)}
//               width={320}
//               height={400}
//             />
//           </div>
//         </div>
//       </>
//     )}
//   </div>
// );
// };

// export default MessageList;

















































































// 30/6/2025
// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import { Hash, Lock, Info, ChevronDown, Phone, Video, MoreVertical, Smile, Reply, Edit, Trash, MoreHorizontal } from 'lucide-react';
// import dynamic from 'next/dynamic';

// import useChannelStore from '@/lib/store/messaging/channelStore';
// import useMessageStore from '@/lib/store/messaging/messageStore';
// import useAuthStore from '@/lib/store/messaging/authStore';
// import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
// import Spinner from '@/components/custom-ui/modal/custom-spinner';
// import Avatar from '@/components/custom-ui/avatar';
// import Image from "next/image";

// // Dynamically import EmojiPicker to avoid SSR issues
// const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
//   ssr: false,
//   loading: () => <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-200">Loading emoji picker...</div>,
// });

// const MessageList: React.FC = () => {
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const messageListRef = useRef<HTMLDivElement>(null);
//   const [showScrollToBottom, setShowScrollToBottom] = useState(false);
//   const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
//   const [showActionsModal, setShowActionsModal] = useState(false);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
//   const [isEditing, setIsEditing] = useState<string | null>(null);
//   const [editContent, setEditContent] = useState('');
//   const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  
//   const { selectedWorkspaceId, workspaces } = useWorkspaceStore();
//   const { 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     channelsByWorkspace, 
//     directMessagesByWorkspace 
//   } = useChannelStore();
  
//   const { 
//     channelMessages, 
//     directMessages, 
//     hasMoreMessages, 
//     fetchChannelMessages, 
//     fetchDirectMessages,
//     fetchOlderMessages, 
//     typingUsers,
//     updateMessage,
//     deleteMessage,
//     addReaction,
//     setActiveThread
//   } = useMessageStore();
  
//   const { user } = useAuthStore();
  
//   // Fetch messages when channel or DM changes
//   useEffect(() => {
//     if (selectedWorkspaceId && selectedChannelId) {
//       fetchChannelMessages(selectedWorkspaceId, selectedChannelId);
//     } else if (selectedWorkspaceId && selectedDirectMessageId) {
//       fetchDirectMessages(selectedWorkspaceId, selectedDirectMessageId);
//     }
//   }, [
//     selectedWorkspaceId, 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     fetchChannelMessages, 
//     fetchDirectMessages
//   ]);
  
//   // Scroll to bottom when messages change
//   useEffect(() => {
//     scrollToBottom();
//   }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId]);
  
//   // Set up scroll listener with enhanced scrolling functionality
//   useEffect(() => {
//     const messageList = messageListRef.current;
    
//     if (!messageList) return;
    
//     const handleScroll = () => {
//       const { scrollTop, scrollHeight, clientHeight } = messageList;
      
//       // Check if user has scrolled up from bottom
//       const isScrolledUp = scrollTop < scrollHeight - clientHeight - 100;
//       setShowScrollToBottom(isScrolledUp);
      
//       // Check if user has scrolled to top for loading more messages
//       // Add a small threshold to prevent excessive API calls
//       if (scrollTop <= 10) {
//         handleLoadMore();
//       }
//     };
    
//     // Enhanced scroll handling with throttling for better performance
//     let scrollTimeout: NodeJS.Timeout;
//     const throttledScrollHandler = () => {
//       clearTimeout(scrollTimeout);
//       scrollTimeout = setTimeout(handleScroll, 16); // ~60fps
//     };
    
//     messageList.addEventListener('scroll', throttledScrollHandler, { passive: true });
    
//     return () => {
//       messageList.removeEventListener('scroll', throttledScrollHandler);
//       clearTimeout(scrollTimeout);
//     };
//   }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId, hasMoreMessages, fetchOlderMessages]);
  
//   // Get messages for the selected channel or DM
//   const messages = 
//     selectedWorkspaceId && selectedChannelId 
//       ? ((channelMessages[selectedWorkspaceId] || {})[selectedChannelId] || [])
//       : selectedWorkspaceId && selectedDirectMessageId 
//         ? ((directMessages[selectedWorkspaceId] || {})[selectedDirectMessageId] || [])
//         : [];
  
//   // Get current channel or DM data
//   const currentChannel = 
//     selectedWorkspaceId && selectedChannelId 
//       ? (channelsByWorkspace[selectedWorkspaceId] || []).find(c => c.id === selectedChannelId) 
//       : null;
  
//   const currentDM = 
//     selectedWorkspaceId && selectedDirectMessageId 
//       ? (directMessagesByWorkspace[selectedWorkspaceId] || []).find(dm => dm.id === selectedDirectMessageId) 
//       : null;
  
//   // Get current workspace
//   const currentWorkspace = selectedWorkspaceId 
//     ? workspaces.find((w: any )=> w.id === selectedWorkspaceId)
//     : null;
  
//   // Get typing users for the current channel or DM
//   const currentTypingUsers = typingUsers.filter(tu => 
//     tu.workspaceId === selectedWorkspaceId && (
//       (selectedChannelId && tu.channelId === selectedChannelId) ||
//       (selectedDirectMessageId && tu.dmId === selectedDirectMessageId)
//     )
//   );
  
//   // Enhanced scroll to bottom with smooth animation
//   const scrollToBottom = (smooth: boolean = true) => {
//     if (messageListRef.current) {
//       messageListRef.current.scrollTo({
//         top: messageListRef.current.scrollHeight,
//         behavior: smooth ? 'smooth' : 'auto'
//       });
//     }
//     // Fallback for older browsers
//     messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
//   };
  
//   // Scroll to specific message (useful for navigation)
//   const scrollToMessage = (messageId: string) => {
//     const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
//     if (messageElement) {
//       messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
//     }
//   };
  
//   // Handle loading more messages with useCallback to prevent unnecessary re-renders
//   const handleLoadMore = useCallback(async () => {
//   if (!selectedWorkspaceId) return;
  
//   let cacheKey = '';
//   if (selectedChannelId) {
//     cacheKey = `${selectedWorkspaceId}:channel:${selectedChannelId}`;
//   } else if (selectedDirectMessageId) {
//     cacheKey = `${selectedWorkspaceId}:dm:${selectedDirectMessageId}`;
//   } else {
//     return;
//   }
  
//   if (isLoadingMore || !hasMoreMessages[cacheKey]) {
//     return;
//   }
  
//   setIsLoadingMore(true);
  
//   try {
//     if (selectedChannelId) {
//       await fetchOlderMessages('channel', selectedWorkspaceId, selectedChannelId);
//     } else if (selectedDirectMessageId) {
//       await fetchOlderMessages('dm', selectedWorkspaceId, selectedDirectMessageId);
//     }
//   } catch (error) {
//     console.log('Error loading more messages:', error);
//   } finally {
//     setIsLoadingMore(false);
//   }
// }, [
//   selectedWorkspaceId, 
//   selectedChannelId, 
//   selectedDirectMessageId, 
//   isLoadingMore, 
//   hasMoreMessages, 
//   fetchOlderMessages
//   // Removed handleLoadMore from dependencies - this was causing the circular dependency
// ]);

//   // Handle edit message
//   const handleEditMessage = (messageId: string, content: string) => {
//     setIsEditing(messageId);
//     setEditContent(content);
//     setShowActionsModal(false);
//   };

//   // Handle edit submit
//   const handleEditSubmit = async (messageId: string) => {
//     if (editContent.trim() === '' || editContent === messages.find(m => m.id === messageId)?.content) {
//       setIsEditing(null);
//       return;
//     }

//     try {
//       await updateMessage(messageId, editContent);
//       setIsEditing(null);
//       setEditContent('');
//     } catch (error) {
//       console.log('Error updating message:', error);
//     }
//   };

//   // Handle reply
//   const handleReply = (messageId: string) => {
//     if (selectedWorkspaceId) {
//       setActiveThread(selectedWorkspaceId, messageId);
//       setShowActionsModal(false);
//     }
//   };

//   // Handle delete
//   const handleDelete = async (messageId: string) => {
//     try {
//       await deleteMessage(messageId);
//       setShowActionsModal(false);
//       setActiveMessageId(null);
//     } catch (error) {
//       console.log('Error deleting message:', error);
//     }
//   };

//   // Handle add reaction
//   const handleAddReaction = async (emoji: string, messageId: string) => {
//     try {
//       await addReaction(messageId, emoji);
//       setShowEmojiPicker(false);
//       setShowActionsModal(false);
//       setActiveMessageId(null);
//     } catch (error) {
//       console.log('Error adding reaction:', error);
//     }
//   };
  
//   // Render header
//   const renderHeader = () => {
//     if (currentChannel) {
//       return (
//         <div className="flex items-center justify-between bg-white p-4 shadow-sm">
//           <div className="flex items-center space-x-3">
//             <div className={`p-3 rounded-full ${
//               currentChannel.isPrivate 
//                 ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
//                 : 'bg-gradient-to-br from-blue-500 to-purple-600'
//             } shadow-lg`}>
//               {currentChannel.isPrivate ? 
//                 <Lock size={20} className="text-white" /> : 
//                 <Hash size={20} className="text-white" />
//               }
//             </div>
//             <div>
//               <h2 className="font-semibold text-gray-900 text-lg">{currentChannel.name}</h2>
//               <p className="text-sm text-gray-500">
//                 {currentChannel.isPrivate ? 'Private channel' : 'Public channel'} • 12 members online
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Phone size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Video size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200">
//               <MoreVertical size={18} />
//             </button>
//           </div>
//         </div>
//       );
//     } else if (currentDM) {
//       return (
//         <div className="flex items-center justify-between bg-white p-4 shadow-sm">
//           <div className="flex items-center space-x-3">
//             <div className="relative">
//               <img 
//                 src={currentDM?.otherUser?.avatar || '/api/placeholder/48/48'} 
//                 alt={currentDM?.otherUser?.fullName}
//                 className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
//               />
//               <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
//             </div>
//             <div>
//               <h2 className="font-semibold text-gray-900 text-lg">{currentDM?.otherUser?.fullName}</h2>
//               <p className="text-sm text-green-600 flex items-center">
//                 <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
//                 Active now
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Phone size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Video size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200">
//               <MoreVertical size={18} />
//             </button>
//           </div>
//         </div>
//       );
//     }
    
//     return null;
//   };

//   // Custom message bubble component
//   const MessageBubble: React.FC<{ message: any; isOwnMessage: boolean }> = ({ message, isOwnMessage }) => {
//     const formatTime = (timestamp: string) => {
//       return new Date(timestamp).toLocaleTimeString('en-US', { 
//         hour: '2-digit', 
//         minute: '2-digit',
//         hour12: false 
//       });
//     };

//     return (
//       <div 
//         className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}
//         onMouseEnter={() => setHoveredMessageId(message.id)}
//         onMouseLeave={() => setHoveredMessageId(null)}
//       >
//         <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-[70%] relative`}>
//           {/* Avatar for other users */}
//           {!isOwnMessage && (
//             <div className="flex-shrink-0">
//               <Avatar
//                 src={message.sender?.avatar}
//                 alt={message.sender?.fullName}
//                 size="sm"
//               />
//             </div>
//           )}
          
//           {/* Message container */}
//           <div className="relative">
//             <div className={`
//               px-4 py-3 rounded-2xl shadow-sm relative
//               ${isOwnMessage 
//                  ? 'bg-gradient-to-br from-gray-100 to-gray-150 text-gray-800 ml-2' 
//                 : 'bg-gradient-to-br from-blue-400 to-blue-500 text-white mr-2 border border-gray-200'
//               }
//               ${isOwnMessage ? 'rounded-br-md' : 'rounded-bl-md'}
//             `}>
//               {/* Message content or edit form */}
//               {isEditing === message.id ? (
//                 <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(message.id); }} className="space-y-2">
//                   <input
//                     type="text"
//                     value={editContent}
//                     onChange={(e) => setEditContent(e.target.value)}
//                     className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
//                     autoFocus
//                   />
//                   <div className="flex justify-end space-x-2">
//                     <button
//                       type="button"
//                       onClick={() => setIsEditing(null)}
//                       className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
//                     >
//                       Cancel
//                     </button>
//                     <button
//                       type="submit"
//                       className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
//                     >
//                       Save
//                     </button>
//                   </div>
//                 </form>
//               ) : (
//                 <>
//                   <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
//                     {message.content}
//                   </p>
                  
//                   {/* Time and status */}
//                   <div className={`
//                     flex items-center justify-end mt-2 space-x-1
//                      ${isOwnMessage ? 'text-gray-500' : 'text-blue-100'}
//                   `}>
//                     <span className="text-xs">
//                       {formatTime(message.createdAt)}
//                     </span>
                    
//                     {/* Message status for own messages */}
//                     {isOwnMessage && (
//                       <div className="flex">
//                         {/* Double tick for sent/delivered */}
//                         <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
//                           <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
//                         </svg>
//                         <svg className="w-4 h-4 -ml-1" viewBox="0 0 16 16" fill="currentColor">
//                           <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
//                         </svg>
//                       </div>
//                     )}
//                   </div>
//                 </>
//               )}
//             </div>
            
//             {/* Message actions - only show on hover */}
//             {hoveredMessageId === message.id && isEditing !== message.id && (
//               <div className={`absolute top-0 ${isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex items-center space-x-1 bg-white rounded-full shadow-lg border border-gray-200 px-2 py-1`}>
//                 <button
//                   onClick={(e) => {
//                     const rect = e.currentTarget.getBoundingClientRect();
//                     setModalPosition({ x: rect.left, y: rect.bottom + 5 });
//                     setActiveMessageId(message.id);
//                     setShowEmojiPicker(true);
//                   }}
//                   className="p-1 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
//                   title="Add reaction"
//                 >
//                   <Smile size={16} />
//                 </button>
//                 <button
//                   onClick={(e) => {
//                     const rect = e.currentTarget.getBoundingClientRect();
//                     setModalPosition({ x: rect.left, y: rect.bottom + 5 });
//                     setActiveMessageId(message.id);
//                     setShowActionsModal(true);
//                   }}
//                   className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
//                   title="More actions"
//                 >
//                   <MoreHorizontal size={16} />
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };
  
//   // If no workspace, channel or DM is selected
//   if (!selectedWorkspaceId || (!selectedChannelId && !selectedDirectMessageId)) {
//     return (
//       <div className="flex-1 flex flex-col">
//         <div className="flex min-h-[70vh] items-center justify-center">
//           <div className="text-center max-w-md mx-auto px-6">
//             {currentWorkspace ? (
//               <>
//                 <div className="flex items-center justify-center mb-6 mx-auto">
//                   <Image
//                     src="/icons/no-data.svg"
//                     alt="No data"
//                     width={70}
//                     height={70}
//                     className="w-56 h-56"
//                   />
//                 </div>
//                 <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to {currentWorkspace.name}</h3>
//                 <p className="text-gray-600 leading-relaxed">Select a channel or start a conversation to begin collaborating with your team</p>
//               </>
//             ) : (
//               <>
//                  <div className="flex items-center justify-center mb-6 mx-auto">
//                   <Image
//                     src="/icons/no-data.svg"
//                     alt="No data"
//                     width={70}
//                     height={70}
//                     className="w-56 h-56"
//                   />
//                 </div>
//                 <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Messaging</h3>
//                 <p className="text-gray-600 leading-relaxed">Select or create a workspace to get started with your team collaboration</p>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   }
  
//   return (
//     <div className="flex-1 flex flex-col relative">
//       {/* Header */}
//       {renderHeader()}
      
//       {/* Messages area with enhanced scrolling */}
//       <div 
//         ref={messageListRef}
//         className="flex-1 p-4 overflow-y-auto scroll-smooth"
//         style={{ 
//           scrollBehavior: 'smooth',
//           overscrollBehavior: 'contain',
//           WebkitOverflowScrolling: 'touch' // Better scrolling on iOS
//         }}
//         onWheel={(e) => {
//           // Allow natural wheel scrolling
//           e.stopPropagation();
//         }}
//         onTouchMove={(e) => {
//           // Allow natural touch scrolling on mobile
//           e.stopPropagation();
//         }}
//       >
//         {/* Loading indicator for older messages */}
//         {isLoadingMore && (
//           <div className="flex justify-center items-center py-6">
//             <div className="bg-white rounded-full p-3 shadow-lg border border-gray-200">
//               <Spinner size="sm" />
//             </div>
//           </div>
//         )}
        
//         {/* No messages state */}
//         {messages.length === 0 && !isLoadingMore && (
//           <div className="flex h-full items-center justify-center">
//             <div className="text-center max-w-md mx-auto bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
//               <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
//                 {currentChannel ? <Hash size={28} className="text-white" /> : <span className="text-3xl">💬</span>}
//               </div>
//               <h3 className="text-xl font-bold text-gray-900 mb-3">
//                 {currentChannel ? `Welcome to #${currentChannel?.name}` : 'Start a conversation'}
//               </h3>
//               <p className="text-gray-600 leading-relaxed">
//                 {currentChannel 
//                   ? `This is the beginning of the #${currentChannel?.name} channel. Share ideas, files, and collaborate with your team.`
//                   : `This is the beginning of your conversation with ${currentDM?.otherUser?.fullName}. Send a message to get started!`
//                 }
//               </p>
//             </div>
//           </div>
//         )}
        
//         {/* Messages with message IDs for navigation */}
//         {messages.length > 0 && (
//           <div className="space-y-1">
//             {messages.map((message) => (
//               <div key={message.id} data-message-id={message.id}>
//                 <MessageBubble
//                   message={message} 
//                   isOwnMessage={message.sender.id === user?.id}
//                 />
//               </div>
//             ))}
//           </div>
//         )}
        
//         {/* Typing indicator */}
//         {currentTypingUsers.length > 0 && (
//           <div className="flex justify-start mb-4">
//             <div className="flex items-center space-x-3">
//               <img 
//                 // src={currentTypingUsers[0]?.avatar || '/api/placeholder/32/32'} 
//                 alt="User typing" 
//                 className="w-8 h-8 rounded-full object-cover" 
//               />
//               <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-200">
//                 <div className="flex space-x-1">
//                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
//                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
        
//         {/* This div is used to scroll to the bottom */}
//         <div ref={messagesEndRef} />
//       </div>
      
//       {/* Enhanced scroll to bottom button with scroll position indicator */}
//       {showScrollToBottom && (
//         <div className="absolute bottom-6 right-6 flex flex-col items-end space-y-2 z-10">
//           {/* Scroll position indicator */}
//           <div className="bg-white rounded-full shadow-lg border border-gray-200 px-3 py-1">
//             <span className="text-xs text-gray-500">
//               {messages.length > 0 && 'Scroll to latest'}
//             </span>
//           </div>
          
//           {/* Scroll to bottom button */}
//           <button
//             onClick={() => scrollToBottom(true)}
//             className="p-3 bg-blue-500 text-white rounded-full shadow-xl hover:bg-blue-600 transition-all duration-200 hover:scale-110 flex items-center justify-center"
//             title="Scroll to bottom"
//           >
//             <ChevronDown size={20} />
//           </button>
//         </div>
//       )}

//       {/* Actions Modal */}
//       {showActionsModal && activeMessageId && (
//         <>
//           <div 
//             className="fixed inset-0 z-50"
//             onClick={() => setShowActionsModal(false)}
//           />
//           <div 
//             className="fixed bg-white rounded-2xl shadow-lg border border-gray-200 z-50 min-w-[80px]"
//             style={{
//               left: `${modalPosition.x}px`,
//               top: `${modalPosition.y}px`,
//               transform: 'translateX(-50%)'
//             }}
//           >
//             <div className="p-2">
//               {/* Quick emoji reactions */}
//               <div className="flex flex-wrap justify-center gap-1 p-1 border-b border-gray-100">
//                 {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
//                   <button
//                     key={emoji}
//                     onClick={() => handleAddReaction(emoji, activeMessageId)}
//                     className="p-2 hover:bg-gray-100 rounded-full transition-colors text-2xl"
//                   >
//                     {emoji}
//                   </button>
//                 ))}
//                 <button
//                   onClick={() => {
//                     setShowActionsModal(false);
//                     setShowEmojiPicker(true);
//                   }}
//                   className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//                 >
//                   <Smile size={24} className="text-gray-500" />
//                 </button>
//               </div>

//               {/* Action buttons */}
//               <div className="py-2">
//                 <button
//                   onClick={() => handleReply(activeMessageId)}
//                   className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
//                 >
//                   <Reply size={20} className="text-gray-500 mr-3" />
//                   <span className="text-gray-700">Reply</span>
//                 </button>

//                 {/* Show edit and delete only for own messages */}
//                 {(() => {
//                   const message = messages.find(m => m.id === activeMessageId);
//                   const isOwnMessage = message?.sender?.id === user?.id;
                  
//                   if (isOwnMessage && message) {
//                     return (
//                       <>
//                         <button
//                           onClick={() => handleEditMessage(activeMessageId, message.content)}
//                           className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
//                         >
//                           <Edit size={20} className="text-gray-500 mr-3" />
//                           <span className="text-gray-700">Edit</span>
//                         </button>
                        
//                         <button
//                           onClick={() => handleDelete(activeMessageId)}
//                           className="flex items-center w-full px-4 py-3 text-left hover:bg-red-50 transition-colors"
//                         >
//                           <Trash size={20} className="text-red-500 mr-3" />
//                           <span className="text-red-500">Delete</span>
//                         </button>
//                       </>
//                     );
//                   }
//                   return null;
//                 })()}
//               </div>
//             </div>
//           </div>
//         </>
//       )}

//       {/* Emoji Picker Modal */}
//       {showEmojiPicker && activeMessageId && (
//         <>
//           <div 
//             className="fixed inset-0 bg-black bg-opacity-50 z-50"
//             onClick={() => setShowEmojiPicker(false)}
//           />
//           <div 
//             className="fixed z-50"
//             style={{
//               left: `${modalPosition.x}px`,
//               top: `${modalPosition.y}px`,
//               transform: 'translateX(-50%)'
//             }}
//           >
//             <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
//               <EmojiPicker
//                 onEmojiClick={(emojiData) => handleAddReaction(emojiData.emoji, activeMessageId)}
//                 width={320}
//                 height={400}
//               />
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default MessageList;





















































// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import { Hash, Lock, Info, ChevronDown, Phone, Video, MoreVertical, Smile, Reply, Edit, Trash, MoreHorizontal } from 'lucide-react';
// import dynamic from 'next/dynamic';

// import useChannelStore from '@/lib/store/messaging/channelStore';
// import useMessageStore from '@/lib/store/messaging/messageStore';
// import useAuthStore from '@/lib/store/messaging/authStore';
// import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
// import Spinner from '@/components/custom-ui/modal/custom-spinner';
// import Avatar from '@/components/custom-ui/avatar';

// // Dynamically import EmojiPicker to avoid SSR issues
// const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
//   ssr: false,
//   loading: () => <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-200">Loading emoji picker...</div>,
// });

// const MessageList: React.FC = () => {
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const messageListRef = useRef<HTMLDivElement>(null);
//   const [showScrollToBottom, setShowScrollToBottom] = useState(false);
//   const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
//   const [showActionsModal, setShowActionsModal] = useState(false);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
//   const [isEditing, setIsEditing] = useState<string | null>(null);
//   const [editContent, setEditContent] = useState('');
//   const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  
//   const { selectedWorkspaceId, workspaces } = useWorkspaceStore();
//   const { 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     channelsByWorkspace, 
//     directMessagesByWorkspace 
//   } = useChannelStore();
  
//   const { 
//     channelMessages, 
//     directMessages, 
//     hasMoreMessages, 
//     fetchChannelMessages, 
//     fetchDirectMessages,
//     fetchOlderMessages, 
//     typingUsers,
//     updateMessage,
//     deleteMessage,
//     addReaction,
//     setActiveThread
//   } = useMessageStore();
  
//   const { user } = useAuthStore();
  
//   // Handle loading more messages with useCallback to prevent unnecessary re-renders
//   const handleLoadMore = useCallback(async () => {
//     if (!selectedWorkspaceId) return;
    
//     let cacheKey = '';
//     if (selectedChannelId) {
//       cacheKey = `${selectedWorkspaceId}:channel:${selectedChannelId}`;
//     } else if (selectedDirectMessageId) {
//       cacheKey = `${selectedWorkspaceId}:dm:${selectedDirectMessageId}`;
//     } else {
//       return;
//     }
    
//     if (isLoadingMore || !hasMoreMessages[cacheKey]) {
//       return;
//     }
    
//     setIsLoadingMore(true);
    
//     try {
//       if (selectedChannelId) {
//         await fetchOlderMessages('channel', selectedWorkspaceId, selectedChannelId);
//       } else if (selectedDirectMessageId) {
//         await fetchOlderMessages('dm', selectedWorkspaceId, selectedDirectMessageId);
//       }
//     } catch (error) {
//       console.log('Error loading more messages:', error);
//     } finally {
//       setIsLoadingMore(false);
//     }
//   }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId, isLoadingMore, hasMoreMessages, fetchOlderMessages]);
  
//   // Fetch messages when channel or DM changes
//   useEffect(() => {
//     if (selectedWorkspaceId && selectedChannelId) {
//       fetchChannelMessages(selectedWorkspaceId, selectedChannelId);
//     } else if (selectedWorkspaceId && selectedDirectMessageId) {
//       fetchDirectMessages(selectedWorkspaceId, selectedDirectMessageId);
//     }
//   }, [
//     selectedWorkspaceId, 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     fetchChannelMessages, 
//     fetchDirectMessages
//   ]);
  
//   // Scroll to bottom when messages change
//   useEffect(() => {
//     scrollToBottom();
//   }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId]);
  
//   // Set up scroll listener with enhanced scrolling functionality
//   useEffect(() => {
//     const messageList = messageListRef.current;
    
//     if (!messageList) return;
    
//     const handleScroll = () => {
//       const { scrollTop, scrollHeight, clientHeight } = messageList;
      
//       // Check if user has scrolled up from bottom
//       const isScrolledUp = scrollTop < scrollHeight - clientHeight - 100;
//       setShowScrollToBottom(isScrolledUp);
      
//       // Check if user has scrolled to top for loading more messages
//       // Add a small threshold to prevent excessive API calls
//       if (scrollTop <= 10) {
//         handleLoadMore();
//       }
//     };
    
//     // Enhanced scroll handling with throttling for better performance
//     let scrollTimeout: NodeJS.Timeout;
//     const throttledScrollHandler = () => {
//       clearTimeout(scrollTimeout);
//       scrollTimeout = setTimeout(handleScroll, 16); // ~60fps
//     };
    
//     messageList.addEventListener('scroll', throttledScrollHandler, { passive: true });
    
//     return () => {
//       messageList.removeEventListener('scroll', throttledScrollHandler);
//       clearTimeout(scrollTimeout);
//     };
//   }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId, handleLoadMore]);
  
//   // Get messages for the selected channel or DM
//   const messages = 
//     selectedWorkspaceId && selectedChannelId 
//       ? ((channelMessages[selectedWorkspaceId] || {})[selectedChannelId] || [])
//       : selectedWorkspaceId && selectedDirectMessageId 
//         ? ((directMessages[selectedWorkspaceId] || {})[selectedDirectMessageId] || [])
//         : [];
  
//   // Get current channel or DM data
//   const currentChannel = 
//     selectedWorkspaceId && selectedChannelId 
//       ? (channelsByWorkspace[selectedWorkspaceId] || []).find(c => c.id === selectedChannelId) 
//       : null;
  
//   const currentDM = 
//     selectedWorkspaceId && selectedDirectMessageId 
//       ? (directMessagesByWorkspace[selectedWorkspaceId] || []).find(dm => dm.id === selectedDirectMessageId) 
//       : null;
  
//   // Get current workspace
//   const currentWorkspace = selectedWorkspaceId 
//     ? workspaces.find((w: any )=> w.id === selectedWorkspaceId)
//     : null;
  
//   // Get typing users for the current channel or DM
//   const currentTypingUsers = typingUsers.filter(tu => 
//     tu.workspaceId === selectedWorkspaceId && (
//       (selectedChannelId && tu.channelId === selectedChannelId) ||
//       (selectedDirectMessageId && tu.dmId === selectedDirectMessageId)
//     )
//   );
  
//   // Enhanced scroll to bottom with smooth animation
//   const scrollToBottom = (smooth: boolean = true) => {
//     if (messageListRef.current) {
//       messageListRef.current.scrollTo({
//         top: messageListRef.current.scrollHeight,
//         behavior: smooth ? 'smooth' : 'auto'
//       });
//     }
//     // Fallback for older browsers
//     messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
//   };
  
//   // Scroll to specific message (useful for navigation)
//   const scrollToMessage = (messageId: string) => {
//     const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
//     if (messageElement) {
//       messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
//     }
//   };

//   // Handle edit message
//   const handleEditMessage = (messageId: string, content: string) => {
//     setIsEditing(messageId);
//     setEditContent(content);
//     setShowActionsModal(false);
//   };

//   // Handle edit submit
//   const handleEditSubmit = async (messageId: string) => {
//     if (editContent.trim() === '' || editContent === messages.find(m => m.id === messageId)?.content) {
//       setIsEditing(null);
//       return;
//     }

//     try {
//       await updateMessage(messageId, editContent);
//       setIsEditing(null);
//       setEditContent('');
//     } catch (error) {
//       console.log('Error updating message:', error);
//     }
//   };

//   // Handle reply
//   const handleReply = (messageId: string) => {
//     if (selectedWorkspaceId) {
//       setActiveThread(selectedWorkspaceId, messageId);
//       setShowActionsModal(false);
//     }
//   };

//   // Handle delete
//   const handleDelete = async (messageId: string) => {
//     try {
//       await deleteMessage(messageId);
//       setShowActionsModal(false);
//       setActiveMessageId(null);
//     } catch (error) {
//       console.log('Error deleting message:', error);
//     }
//   };

//   // Handle add reaction
//   const handleAddReaction = async (emoji: string, messageId: string) => {
//     try {
//       await addReaction(messageId, emoji);
//       setShowEmojiPicker(false);
//       setShowActionsModal(false);
//       setActiveMessageId(null);
//     } catch (error) {
//       console.log('Error adding reaction:', error);
//     }
//   };
  
//   // Render header
//   const renderHeader = () => {
//     if (currentChannel) {
//       return (
//         <div className="flex items-center justify-between bg-white p-4 shadow-sm">
//           <div className="flex items-center space-x-3">
//             <div className={`p-3 rounded-full ${
//               currentChannel.isPrivate 
//                 ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
//                 : 'bg-gradient-to-br from-blue-500 to-purple-600'
//             } shadow-lg`}>
//               {currentChannel.isPrivate ? 
//                 <Lock size={20} className="text-white" /> : 
//                 <Hash size={20} className="text-white" />
//               }
//             </div>
//             <div>
//               <h2 className="font-semibold text-gray-900 text-lg">{currentChannel.name}</h2>
//               <p className="text-sm text-gray-500">
//                 {currentChannel.isPrivate ? 'Private channel' : 'Public channel'} • 12 members online
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Phone size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Video size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200">
//               <MoreVertical size={18} />
//             </button>
//           </div>
//         </div>
//       );
//     } else if (currentDM) {
//       return (
//         <div className="flex items-center justify-between bg-white p-4 shadow-sm">
//           <div className="flex items-center space-x-3">
//             <div className="relative">
//               <img 
//                 src={currentDM?.otherUser?.avatar || '/api/placeholder/48/48'} 
//                 alt={currentDM?.otherUser?.fullName}
//                 className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
//               />
//               <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
//             </div>
//             <div>
//               <h2 className="font-semibold text-gray-900 text-lg">{currentDM?.otherUser?.fullName}</h2>
//               <p className="text-sm text-green-600 flex items-center">
//                 <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
//                 Active now
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Phone size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Video size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200">
//               <MoreVertical size={18} />
//             </button>
//           </div>
//         </div>
//       );
//     }
    
//     return null;
//   };

//   // Custom message bubble component
//   const MessageBubble: React.FC<{ message: any; isOwnMessage: boolean }> = ({ message, isOwnMessage }) => {
//     const formatTime = (timestamp: string) => {
//       return new Date(timestamp).toLocaleTimeString('en-US', { 
//         hour: '2-digit', 
//         minute: '2-digit',
//         hour12: false 
//       });
//     };

//     return (
//       <div 
//         className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}
//         onMouseEnter={() => setHoveredMessageId(message.id)}
//         onMouseLeave={() => setHoveredMessageId(null)}
//       >
//         <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-[70%] relative`}>
//           {/* Avatar for other users */}
//           {!isOwnMessage && (
//             <div className="flex-shrink-0">
//               <Avatar
//                 src={message.sender?.avatar}
//                 alt={message.sender?.fullName}
//                 size="sm"
//               />
//             </div>
//           )}
          
//           {/* Message container */}
//           <div className="relative">
//             <div className={`
//               px-4 py-3 rounded-2xl shadow-sm relative
//               ${isOwnMessage 
//                  ? 'bg-gradient-to-br from-gray-100 to-gray-150 text-gray-800 ml-2' 
//                 : 'bg-gradient-to-br from-blue-400 to-blue-500 text-white mr-2 border border-gray-200'
//               }
//               ${isOwnMessage ? 'rounded-br-md' : 'rounded-bl-md'}
//             `}>
//               {/* Message content or edit form */}
//               {isEditing === message.id ? (
//                 <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(message.id); }} className="space-y-2">
//                   <input
//                     type="text"
//                     value={editContent}
//                     onChange={(e) => setEditContent(e.target.value)}
//                     className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
//                     autoFocus
//                   />
//                   <div className="flex justify-end space-x-2">
//                     <button
//                       type="button"
//                       onClick={() => setIsEditing(null)}
//                       className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
//                     >
//                       Cancel
//                     </button>
//                     <button
//                       type="submit"
//                       className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
//                     >
//                       Save
//                     </button>
//                   </div>
//                 </form>
//               ) : (
//                 <>
//                   <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
//                     {message.content}
//                   </p>
                  
//                   {/* Time and status */}
//                   <div className={`
//                     flex items-center justify-end mt-2 space-x-1
//                      ${isOwnMessage ? 'text-gray-500' : 'text-blue-100'}
//                   `}>
//                     <span className="text-xs">
//                       {formatTime(message.createdAt)}
//                     </span>
                    
//                     {/* Message status for own messages */}
//                     {isOwnMessage && (
//                       <div className="flex">
//                         {/* Double tick for sent/delivered */}
//                         <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
//                           <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
//                         </svg>
//                         <svg className="w-4 h-4 -ml-1" viewBox="0 0 16 16" fill="currentColor">
//                           <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
//                         </svg>
//                       </div>
//                     )}
//                   </div>
//                 </>
//               )}
//             </div>
            
//             {/* Message actions - only show on hover */}
//             {hoveredMessageId === message.id && isEditing !== message.id && (
//               <div className={`absolute top-0 ${isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex items-center space-x-1 bg-white rounded-full shadow-lg border border-gray-200 px-2 py-1`}>
//                 <button
//                   onClick={(e) => {
//                     const rect = e.currentTarget.getBoundingClientRect();
//                     setModalPosition({ x: rect.left, y: rect.bottom + 5 });
//                     setActiveMessageId(message.id);
//                     setShowEmojiPicker(true);
//                   }}
//                   className="p-1 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
//                   title="Add reaction"
//                 >
//                   <Smile size={16} />
//                 </button>
//                 <button
//                   onClick={(e) => {
//                     const rect = e.currentTarget.getBoundingClientRect();
//                     setModalPosition({ x: rect.left, y: rect.bottom + 5 });
//                     setActiveMessageId(message.id);
//                     setShowActionsModal(true);
//                   }}
//                   className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
//                   title="More actions"
//                 >
//                   <MoreHorizontal size={16} />
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };
  
//   // If no workspace, channel or DM is selected
//   if (!selectedWorkspaceId || (!selectedChannelId && !selectedDirectMessageId)) {
//     return (
//       <div className="flex-1 flex flex-col">
//         <div className="flex min-h-[70vh] items-center justify-center">
//           <div className="text-center max-w-md mx-auto px-6">
//             {currentWorkspace ? (
//               <>
//                 <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg">
//                   <Hash size={36} className="text-white" />
//                 </div>
//                 <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to {currentWorkspace.name}</h3>
//                 <p className="text-gray-600 leading-relaxed">Select a channel or start a conversation to begin collaborating with your team</p>
//               </>
//             ) : (
//               <>
//                 <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg">
//                   <Hash size={36} className="text-gray-500" />
//                 </div>
//                 <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Messaging</h3>
//                 <p className="text-gray-600 leading-relaxed">Select or create a workspace to get started with your team collaboration</p>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   }
  
//   return (
//     <div className="flex-1 flex flex-col relative">
//       {/* Header */}
//       {renderHeader()}
      
//       {/* Messages area with enhanced scrolling */}
//       <div 
//         ref={messageListRef}
//         className="flex-1 p-4 overflow-y-auto scroll-smooth"
//         style={{ 
//           scrollBehavior: 'smooth',
//           overscrollBehavior: 'contain',
//           WebkitOverflowScrolling: 'touch' // Better scrolling on iOS
//         }}
//         onWheel={(e) => {
//           // Allow natural wheel scrolling
//           e.stopPropagation();
//         }}
//         onTouchMove={(e) => {
//           // Allow natural touch scrolling on mobile
//           e.stopPropagation();
//         }}
//       >
//         {/* Loading indicator for older messages */}
//         {isLoadingMore && (
//           <div className="flex justify-center items-center py-6">
//             <div className="bg-white rounded-full p-3 shadow-lg border border-gray-200">
//               <Spinner size="sm" />
//             </div>
//           </div>
//         )}
        
//         {/* No messages state */}
//         {messages.length === 0 && !isLoadingMore && (
//           <div className="flex h-full items-center justify-center">
//             <div className="text-center max-w-md mx-auto bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
//               <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
//                 {currentChannel ? <Hash size={28} className="text-white" /> : <span className="text-3xl">💬</span>}
//               </div>
//               <h3 className="text-xl font-bold text-gray-900 mb-3">
//                 {currentChannel ? `Welcome to #${currentChannel?.name}` : 'Start a conversation'}
//               </h3>
//               <p className="text-gray-600 leading-relaxed">
//                 {currentChannel 
//                   ? `This is the beginning of the #${currentChannel?.name} channel. Share ideas, files, and collaborate with your team.`
//                   : `This is the beginning of your conversation with ${currentDM?.otherUser?.fullName}. Send a message to get started!`
//                 }
//               </p>
//             </div>
//           </div>
//         )}
        
//         {/* Messages with message IDs for navigation */}
//         {messages.length > 0 && (
//           <div className="space-y-1">
//             {messages.map((message) => (
//               <div key={message.id} data-message-id={message.id}>
//                 <MessageBubble
//                   message={message} 
//                   isOwnMessage={message.sender.id === user?.id}
//                 />
//               </div>
//             ))}
//           </div>
//         )}
        
//         {/* Typing indicator */}
//         {/* {currentTypingUsers.length > 0 && (
//           <div className="flex justify-start mb-4">
//             <div className="flex items-center space-x-3">
//               <img 
//                 src={currentTypingUsers[0]?.avatar || '/api/placeholder/32/32'} 
//                 alt="User typing" 
//                 className="w-8 h-8 rounded-full object-cover" 
//               />
//               <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-200">
//                 <div className="flex space-x-1">
//                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
//                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )} */}
        
//         {/* This div is used to scroll to the bottom */}
//         <div ref={messagesEndRef} />
//       </div>
      
//       {/* Enhanced scroll to bottom button with scroll position indicator */}
//       {showScrollToBottom && (
//         <div className="absolute bottom-6 right-6 flex flex-col items-end space-y-2 z-10">
//           {/* Scroll position indicator */}
//           <div className="bg-white rounded-full shadow-lg border border-gray-200 px-3 py-1">
//             <span className="text-xs text-gray-500">
//               {messages.length > 0 && 'Scroll to latest'}
//             </span>
//           </div>
          
//           {/* Scroll to bottom button */}
//           <button
//             onClick={() => scrollToBottom(true)}
//             className="p-3 bg-blue-500 text-white rounded-full shadow-xl hover:bg-blue-600 transition-all duration-200 hover:scale-110 flex items-center justify-center"
//             title="Scroll to bottom"
//           >
//             <ChevronDown size={20} />
//           </button>
//         </div>
//       )}

//       {/* Actions Modal */}
//       {showActionsModal && activeMessageId && (
//         <>
//           <div 
//             className="fixed inset-0 z-50"
//             onClick={() => setShowActionsModal(false)}
//           />
//           <div 
//             className="fixed bg-white rounded-2xl shadow-lg border border-gray-200 z-50 min-w-[80px]"
//             style={{
//               left: `${modalPosition.x}px`,
//               top: `${modalPosition.y}px`,
//               transform: 'translateX(-50%)'
//             }}
//           >
//             <div className="p-2">
//               {/* Quick emoji reactions */}
//               <div className="flex flex-wrap justify-center gap-1 p-1 border-b border-gray-100">
//                 {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
//                   <button
//                     key={emoji}
//                     onClick={() => handleAddReaction(emoji, activeMessageId)}
//                     className="p-2 hover:bg-gray-100 rounded-full transition-colors text-2xl"
//                   >
//                     {emoji}
//                   </button>
//                 ))}
//                 <button
//                   onClick={() => {
//                     setShowActionsModal(false);
//                     setShowEmojiPicker(true);
//                   }}
//                   className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//                 >
//                   <Smile size={24} className="text-gray-500" />
//                 </button>
//               </div>

//               {/* Action buttons */}
//               <div className="py-2">
//                 <button
//                   onClick={() => handleReply(activeMessageId)}
//                   className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
//                 >
//                   <Reply size={20} className="text-gray-500 mr-3" />
//                   <span className="text-gray-700">Reply</span>
//                 </button>

//                 {/* Show edit and delete only for own messages */}
//                 {(() => {
//                   const message = messages.find(m => m.id === activeMessageId);
//                   const isOwnMessage = message?.sender?.id === user?.id;
                  
//                   if (isOwnMessage && message) {
//                     return (
//                       <>
//                         <button
//                           onClick={() => handleEditMessage(activeMessageId, message.content)}
//                           className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
//                         >
//                           <Edit size={20} className="text-gray-500 mr-3" />
//                           <span className="text-gray-700">Edit</span>
//                         </button>
                        
//                         <button
//                           onClick={() => handleDelete(activeMessageId)}
//                           className="flex items-center w-full px-4 py-3 text-left hover:bg-red-50 transition-colors"
//                         >
//                           <Trash size={20} className="text-red-500 mr-3" />
//                           <span className="text-red-500">Delete</span>
//                         </button>
//                       </>
//                     );
//                   }
//                   return null;
//                 })()}
//               </div>
//             </div>
//           </div>
//         </>
//       )}

//       {/* Emoji Picker Modal */}
//       {showEmojiPicker && activeMessageId && (
//         <>
//           <div 
//             className="fixed inset-0 bg-black bg-opacity-50 z-50"
//             onClick={() => setShowEmojiPicker(false)}
//           />
//           <div 
//             className="fixed z-50"
//             style={{
//               left: `${modalPosition.x}px`,
//               top: `${modalPosition.y}px`,
//               transform: 'translateX(-50%)'
//             }}
//           >
//             <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
//               <EmojiPicker
//                 onEmojiClick={(emojiData) => handleAddReaction(emojiData.emoji, activeMessageId)}
//                 width={320}
//                 height={400}
//               />
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default MessageList;







































































// Latest version of the code is commented out below.
// import React, { useEffect, useRef, useState } from 'react';
// import { Hash, Lock, Info, ChevronDown, Phone, Video, MoreVertical, Smile, Reply, Edit, Trash, MoreHorizontal } from 'lucide-react';
// import dynamic from 'next/dynamic';

// import useChannelStore from '@/lib/store/messaging/channelStore';
// import useMessageStore from '@/lib/store/messaging/messageStore';
// import useAuthStore from '@/lib/store/messaging/authStore';
// import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
// import Spinner from '@/components/custom-ui/modal/custom-spinner';
// import Avatar from '@/components/custom-ui/avatar';

// // Dynamically import EmojiPicker to avoid SSR issues
// const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
//   ssr: false,
//   loading: () => <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-200">Loading emoji picker...</div>,
// });

// const MessageList: React.FC = () => {
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const messageListRef = useRef<HTMLDivElement>(null);
//   const [showScrollToBottom, setShowScrollToBottom] = useState(false);
//   const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
//   const [showActionsModal, setShowActionsModal] = useState(false);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
//   const [isEditing, setIsEditing] = useState<string | null>(null);
//   const [editContent, setEditContent] = useState('');
//   const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  
//   const { selectedWorkspaceId, workspaces } = useWorkspaceStore();
//   const { 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     channelsByWorkspace, 
//     directMessagesByWorkspace 
//   } = useChannelStore();
  
//   const { 
//     channelMessages, 
//     directMessages, 
//     hasMoreMessages, 
//     fetchChannelMessages, 
//     fetchDirectMessages,
//     fetchOlderMessages, 
//     typingUsers,
//     updateMessage,
//     deleteMessage,
//     addReaction,
//     setActiveThread
//   } = useMessageStore();
  
//   const { user } = useAuthStore();
  
//   // Fetch messages when channel or DM changes
//   useEffect(() => {
//     if (selectedWorkspaceId && selectedChannelId) {
//       fetchChannelMessages(selectedWorkspaceId, selectedChannelId);
//     } else if (selectedWorkspaceId && selectedDirectMessageId) {
//       fetchDirectMessages(selectedWorkspaceId, selectedDirectMessageId);
//     }
//   }, [
//     selectedWorkspaceId, 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     fetchChannelMessages, 
//     fetchDirectMessages
//   ]);
  
//   // Scroll to bottom when messages change
//   useEffect(() => {
//     scrollToBottom();
//   }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId]);
  
//   // Set up scroll listener with enhanced scrolling functionality
//   useEffect(() => {
//     const messageList = messageListRef.current;
    
//     if (!messageList) return;
    
//     const handleScroll = () => {
//       const { scrollTop, scrollHeight, clientHeight } = messageList;
      
//       // Check if user has scrolled up from bottom
//       const isScrolledUp = scrollTop < scrollHeight - clientHeight - 100;
//       setShowScrollToBottom(isScrolledUp);
      
//       // Check if user has scrolled to top for loading more messages
//       // Add a small threshold to prevent excessive API calls
//       if (scrollTop <= 10) {
//         handleLoadMore();
//       }
//     };
    
//     // Enhanced scroll handling with throttling for better performance
//     let scrollTimeout: NodeJS.Timeout;
//     const throttledScrollHandler = () => {
//       clearTimeout(scrollTimeout);
//       scrollTimeout = setTimeout(handleScroll, 16); // ~60fps
//     };
    
//     messageList.addEventListener('scroll', throttledScrollHandler, { passive: true });
    
//     return () => {
//       messageList.removeEventListener('scroll', throttledScrollHandler);
//       clearTimeout(scrollTimeout);
//     };
//   }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId, hasMoreMessages]);
  
//   // Get messages for the selected channel or DM
//   const messages = 
//     selectedWorkspaceId && selectedChannelId 
//       ? ((channelMessages[selectedWorkspaceId] || {})[selectedChannelId] || [])
//       : selectedWorkspaceId && selectedDirectMessageId 
//         ? ((directMessages[selectedWorkspaceId] || {})[selectedDirectMessageId] || [])
//         : [];
  
//   // Get current channel or DM data
//   const currentChannel = 
//     selectedWorkspaceId && selectedChannelId 
//       ? (channelsByWorkspace[selectedWorkspaceId] || []).find(c => c.id === selectedChannelId) 
//       : null;
  
//   const currentDM = 
//     selectedWorkspaceId && selectedDirectMessageId 
//       ? (directMessagesByWorkspace[selectedWorkspaceId] || []).find(dm => dm.id === selectedDirectMessageId) 
//       : null;
  
//   // Get current workspace
//   const currentWorkspace = selectedWorkspaceId 
//     ? workspaces.find((w: any )=> w.id === selectedWorkspaceId)
//     : null;
  
//   // Get typing users for the current channel or DM
//   const currentTypingUsers = typingUsers.filter(tu => 
//     tu.workspaceId === selectedWorkspaceId && (
//       (selectedChannelId && tu.channelId === selectedChannelId) ||
//       (selectedDirectMessageId && tu.dmId === selectedDirectMessageId)
//     )
//   );
  
//   // Enhanced scroll to bottom with smooth animation
//   const scrollToBottom = (smooth: boolean = true) => {
//     if (messageListRef.current) {
//       messageListRef.current.scrollTo({
//         top: messageListRef.current.scrollHeight,
//         behavior: smooth ? 'smooth' : 'auto'
//       });
//     }
//     // Fallback for older browsers
//     messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
//   };
  
//   // Scroll to specific message (useful for navigation)
//   const scrollToMessage = (messageId: string) => {
//     const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
//     if (messageElement) {
//       messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
//     }
//   };
  
//   // Handle loading more messages
//   const handleLoadMore = async () => {
//     if (!selectedWorkspaceId) return;
    
//     let cacheKey = '';
//     if (selectedChannelId) {
//       cacheKey = `${selectedWorkspaceId}:channel:${selectedChannelId}`;
//     } else if (selectedDirectMessageId) {
//       cacheKey = `${selectedWorkspaceId}:dm:${selectedDirectMessageId}`;
//     } else {
//       return;
//     }
    
//     if (isLoadingMore || !hasMoreMessages[cacheKey]) {
//       return;
//     }
    
//     setIsLoadingMore(true);
    
//     try {
//       if (selectedChannelId) {
//         await fetchOlderMessages('channel', selectedWorkspaceId, selectedChannelId);
//       } else if (selectedDirectMessageId) {
//         await fetchOlderMessages('dm', selectedWorkspaceId, selectedDirectMessageId);
//       }
//     } catch (error) {
//       console.log('Error loading more messages:', error);
//     } finally {
//       setIsLoadingMore(false);
//     }
//   };

//   // Handle edit message
//   const handleEditMessage = (messageId: string, content: string) => {
//     setIsEditing(messageId);
//     setEditContent(content);
//     setShowActionsModal(false);
//   };

//   // Handle edit submit
//   const handleEditSubmit = async (messageId: string) => {
//     if (editContent.trim() === '' || editContent === messages.find(m => m.id === messageId)?.content) {
//       setIsEditing(null);
//       return;
//     }

//     try {
//       await updateMessage(messageId, editContent);
//       setIsEditing(null);
//       setEditContent('');
//     } catch (error) {
//       console.log('Error updating message:', error);
//     }
//   };

//   // Handle reply
//   const handleReply = (messageId: string) => {
//     if (selectedWorkspaceId) {
//       setActiveThread(selectedWorkspaceId, messageId);
//       setShowActionsModal(false);
//     }
//   };

//   // Handle delete
//   const handleDelete = async (messageId: string) => {
//     try {
//       await deleteMessage(messageId);
//       setShowActionsModal(false);
//       setActiveMessageId(null);
//     } catch (error) {
//       console.log('Error deleting message:', error);
//     }
//   };

//   // Handle add reaction
//   const handleAddReaction = async (emoji: string, messageId: string) => {
//     try {
//       await addReaction(messageId, emoji);
//       setShowEmojiPicker(false);
//       setShowActionsModal(false);
//       setActiveMessageId(null);
//     } catch (error) {
//       console.log('Error adding reaction:', error);
//     }
//   };
  
//   // Render header
//   const renderHeader = () => {
//     if (currentChannel) {
//       return (
//         <div className="flex items-center justify-between bg-white p-4 shadow-sm">
//           <div className="flex items-center space-x-3">
//             <div className={`p-3 rounded-full ${
//               currentChannel.isPrivate 
//                 ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
//                 : 'bg-gradient-to-br from-blue-500 to-purple-600'
//             } shadow-lg`}>
//               {currentChannel.isPrivate ? 
//                 <Lock size={20} className="text-white" /> : 
//                 <Hash size={20} className="text-white" />
//               }
//             </div>
//             <div>
//               <h2 className="font-semibold text-gray-900 text-lg">{currentChannel.name}</h2>
//               <p className="text-sm text-gray-500">
//                 {currentChannel.isPrivate ? 'Private channel' : 'Public channel'} • 12 members online
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Phone size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Video size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200">
//               <MoreVertical size={18} />
//             </button>
//           </div>
//         </div>
//       );
//     } else if (currentDM) {
//       return (
//         <div className="flex items-center justify-between bg-white p-4 shadow-sm">
//           <div className="flex items-center space-x-3">
//             <div className="relative">
//               <img 
//                 src={currentDM?.otherUser?.avatar || '/api/placeholder/48/48'} 
//                 alt={currentDM?.otherUser?.fullName}
//                 className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
//               />
//               <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
//             </div>
//             <div>
//               <h2 className="font-semibold text-gray-900 text-lg">{currentDM?.otherUser?.fullName}</h2>
//               <p className="text-sm text-green-600 flex items-center">
//                 <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
//                 Active now
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Phone size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Video size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200">
//               <MoreVertical size={18} />
//             </button>
//           </div>
//         </div>
//       );
//     }
    
//     return null;
//   };

//   // Custom message bubble component
//   const MessageBubble: React.FC<{ message: any; isOwnMessage: boolean }> = ({ message, isOwnMessage }) => {
//     const formatTime = (timestamp: string) => {
//       return new Date(timestamp).toLocaleTimeString('en-US', { 
//         hour: '2-digit', 
//         minute: '2-digit',
//         hour12: false 
//       });
//     };

//     return (
//       <div 
//         className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}
//         onMouseEnter={() => setHoveredMessageId(message.id)}
//         onMouseLeave={() => setHoveredMessageId(null)}
//       >
//         <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-[70%] relative`}>
//           {/* Avatar for other users */}
//           {!isOwnMessage && (
//             <div className="flex-shrink-0">
//               <Avatar
//                 src={message.sender?.avatar}
//                 alt={message.sender?.fullName}
//                 size="sm"
//               />
//             </div>
//           )}
          
//           {/* Message container */}
//           <div className="relative">
//             <div className={`
//               px-4 py-3 rounded-2xl shadow-sm relative
//               ${isOwnMessage 
//                  ? 'bg-gradient-to-br from-gray-100 to-gray-150 text-gray-800 ml-2' 
//                 : 'bg-gradient-to-br from-blue-400 to-blue-500 text-white mr-2 border border-gray-200'
//               }
//               ${isOwnMessage ? 'rounded-br-md' : 'rounded-bl-md'}
//             `}>
//               {/* Message content or edit form */}
//               {isEditing === message.id ? (
//                 <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(message.id); }} className="space-y-2">
//                   <input
//                     type="text"
//                     value={editContent}
//                     onChange={(e) => setEditContent(e.target.value)}
//                     className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
//                     autoFocus
//                   />
//                   <div className="flex justify-end space-x-2">
//                     <button
//                       type="button"
//                       onClick={() => setIsEditing(null)}
//                       className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
//                     >
//                       Cancel
//                     </button>
//                     <button
//                       type="submit"
//                       className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
//                     >
//                       Save
//                     </button>
//                   </div>
//                 </form>
//               ) : (
//                 <>
//                   <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
//                     {message.content}
//                   </p>
                  
//                   {/* Time and status */}
//                   <div className={`
//                     flex items-center justify-end mt-2 space-x-1
//                      ${isOwnMessage ? 'text-gray-500' : 'text-blue-100'}
//                   `}>
//                     <span className="text-xs">
//                       {formatTime(message.createdAt)}
//                     </span>
                    
//                     {/* Message status for own messages */}
//                     {isOwnMessage && (
//                       <div className="flex">
//                         {/* Double tick for sent/delivered */}
//                         <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
//                           <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
//                         </svg>
//                         <svg className="w-4 h-4 -ml-1" viewBox="0 0 16 16" fill="currentColor">
//                           <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
//                         </svg>
//                       </div>
//                     )}
//                   </div>
//                 </>
//               )}
//             </div>
            
//             {/* Message actions - only show on hover */}
//             {hoveredMessageId === message.id && isEditing !== message.id && (
//               <div className={`absolute top-0 ${isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex items-center space-x-1 bg-white rounded-full shadow-lg border border-gray-200 px-2 py-1`}>
//                 <button
//                   onClick={(e) => {
//                     const rect = e.currentTarget.getBoundingClientRect();
//                     setModalPosition({ x: rect.left, y: rect.bottom + 5 });
//                     setActiveMessageId(message.id);
//                     setShowEmojiPicker(true);
//                   }}
//                   className="p-1 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
//                   title="Add reaction"
//                 >
//                   <Smile size={16} />
//                 </button>
//                 <button
//                   onClick={(e) => {
//                     const rect = e.currentTarget.getBoundingClientRect();
//                     setModalPosition({ x: rect.left, y: rect.bottom + 5 });
//                     setActiveMessageId(message.id);
//                     setShowActionsModal(true);
//                   }}
//                   className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
//                   title="More actions"
//                 >
//                   <MoreHorizontal size={16} />
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };
  
//   // If no workspace, channel or DM is selected
//   if (!selectedWorkspaceId || (!selectedChannelId && !selectedDirectMessageId)) {
//     return (
//       <div className="flex-1 flex flex-col">
//         <div className="flex min-h-[70vh] items-center justify-center">
//           <div className="text-center max-w-md mx-auto px-6">
//             {currentWorkspace ? (
//               <>
//                 <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg">
//                   <Hash size={36} className="text-white" />
//                 </div>
//                 <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to {currentWorkspace.name}</h3>
//                 <p className="text-gray-600 leading-relaxed">Select a channel or start a conversation to begin collaborating with your team</p>
//               </>
//             ) : (
//               <>
//                 <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg">
//                   <Hash size={36} className="text-gray-500" />
//                 </div>
//                 <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Messaging</h3>
//                 <p className="text-gray-600 leading-relaxed">Select or create a workspace to get started with your team collaboration</p>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   }
  
//   return (
//     <div className="flex-1 flex flex-col relative">
//       {/* Header */}
//       {renderHeader()}
      
//       {/* Messages area with enhanced scrolling */}
//       <div 
//         ref={messageListRef}
//         className="flex-1 p-4 overflow-y-auto scroll-smooth"
//         style={{ 
//           scrollBehavior: 'smooth',
//           overscrollBehavior: 'contain',
//           WebkitOverflowScrolling: 'touch' // Better scrolling on iOS
//         }}
//         onWheel={(e) => {
//           // Allow natural wheel scrolling
//           e.stopPropagation();
//         }}
//         onTouchMove={(e) => {
//           // Allow natural touch scrolling on mobile
//           e.stopPropagation();
//         }}
//       >
//         {/* Loading indicator for older messages */}
//         {isLoadingMore && (
//           <div className="flex justify-center items-center py-6">
//             <div className="bg-white rounded-full p-3 shadow-lg border border-gray-200">
//               <Spinner size="sm" />
//             </div>
//           </div>
//         )}
        
//         {/* No messages state */}
//         {messages.length === 0 && !isLoadingMore && (
//           <div className="flex h-full items-center justify-center">
//             <div className="text-center max-w-md mx-auto bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
//               <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
//                 {currentChannel ? <Hash size={28} className="text-white" /> : <span className="text-3xl">💬</span>}
//               </div>
//               <h3 className="text-xl font-bold text-gray-900 mb-3">
//                 {currentChannel ? `Welcome to #${currentChannel?.name}` : 'Start a conversation'}
//               </h3>
//               <p className="text-gray-600 leading-relaxed">
//                 {currentChannel 
//                   ? `This is the beginning of the #${currentChannel?.name} channel. Share ideas, files, and collaborate with your team.`
//                   : `This is the beginning of your conversation with ${currentDM?.otherUser?.fullName}. Send a message to get started!`
//                 }
//               </p>
//             </div>
//           </div>
//         )}
        
//         {/* Messages with message IDs for navigation */}
//         {messages.length > 0 && (
//           <div className="space-y-1">
//             {messages.map((message) => (
//               <div key={message.id} data-message-id={message.id}>
//                 <MessageBubble
//                   message={message} 
//                   isOwnMessage={message.sender.id === user?.id}
//                 />
//               </div>
//             ))}
//           </div>
//         )}
        
//         {/* Typing indicator */}
//         {currentTypingUsers.length > 0 && (
//           <div className="flex justify-start mb-4">
//             <div className="flex items-center space-x-3">
//               <img 
//                 // src={currentTypingUsers[0]?.avatar || '/api/placeholder/32/32'} 
//                 alt="User typing" 
//                 className="w-8 h-8 rounded-full object-cover" 
//               />
//               <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-200">
//                 <div className="flex space-x-1">
//                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
//                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
        
//         {/* This div is used to scroll to the bottom */}
//         <div ref={messagesEndRef} />
//       </div>
      
//       {/* Enhanced scroll to bottom button with scroll position indicator */}
//       {showScrollToBottom && (
//         <div className="absolute bottom-6 right-6 flex flex-col items-end space-y-2 z-10">
//           {/* Scroll position indicator */}
//           <div className="bg-white rounded-full shadow-lg border border-gray-200 px-3 py-1">
//             <span className="text-xs text-gray-500">
//               {messages.length > 0 && 'Scroll to latest'}
//             </span>
//           </div>
          
//           {/* Scroll to bottom button */}
//           <button
//             onClick={() => scrollToBottom(true)}
//             className="p-3 bg-blue-500 text-white rounded-full shadow-xl hover:bg-blue-600 transition-all duration-200 hover:scale-110 flex items-center justify-center"
//             title="Scroll to bottom"
//           >
//             <ChevronDown size={20} />
//           </button>
//         </div>
//       )}

//       {/* Actions Modal */}
//       {showActionsModal && activeMessageId && (
//         <>
//           <div 
//             className="fixed inset-0 z-50"
//             onClick={() => setShowActionsModal(false)}
//           />
//           <div 
//             className="fixed bg-white rounded-2xl shadow-lg border border-gray-200 z-50 min-w-[80px]"
//             style={{
//               left: `${modalPosition.x}px`,
//               top: `${modalPosition.y}px`,
//               transform: 'translateX(-50%)'
//             }}
//           >
//             <div className="p-2">
//               {/* Quick emoji reactions */}
//               <div className="flex flex-wrap justify-center gap-1 p-1 border-b border-gray-100">
//                 {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
//                   <button
//                     key={emoji}
//                     onClick={() => handleAddReaction(emoji, activeMessageId)}
//                     className="p-2 hover:bg-gray-100 rounded-full transition-colors text-2xl"
//                   >
//                     {emoji}
//                   </button>
//                 ))}
//                 <button
//                   onClick={() => {
//                     setShowActionsModal(false);
//                     setShowEmojiPicker(true);
//                   }}
//                   className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//                 >
//                   <Smile size={24} className="text-gray-500" />
//                 </button>
//               </div>

//               {/* Action buttons */}
//               <div className="py-2">
//                 <button
//                   onClick={() => handleReply(activeMessageId)}
//                   className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
//                 >
//                   <Reply size={20} className="text-gray-500 mr-3" />
//                   <span className="text-gray-700">Reply</span>
//                 </button>

//                 {/* Show edit and delete only for own messages */}
//                 {(() => {
//                   const message = messages.find(m => m.id === activeMessageId);
//                   const isOwnMessage = message?.sender?.id === user?.id;
                  
//                   if (isOwnMessage && message) {
//                     return (
//                       <>
//                         <button
//                           onClick={() => handleEditMessage(activeMessageId, message.content)}
//                           className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
//                         >
//                           <Edit size={20} className="text-gray-500 mr-3" />
//                           <span className="text-gray-700">Edit</span>
//                         </button>
                        
//                         <button
//                           onClick={() => handleDelete(activeMessageId)}
//                           className="flex items-center w-full px-4 py-3 text-left hover:bg-red-50 transition-colors"
//                         >
//                           <Trash size={20} className="text-red-500 mr-3" />
//                           <span className="text-red-500">Delete</span>
//                         </button>
//                       </>
//                     );
//                   }
//                   return null;
//                 })()}
//               </div>
//             </div>
//           </div>
//         </>
//       )}

//       {/* Emoji Picker Modal */}
//       {showEmojiPicker && activeMessageId && (
//         <>
//           <div 
//             className="fixed inset-0 bg-black bg-opacity-50 z-50"
//             onClick={() => setShowEmojiPicker(false)}
//           />
//           <div 
//             className="fixed z-50"
//             style={{
//               left: `${modalPosition.x}px`,
//               top: `${modalPosition.y}px`,
//               transform: 'translateX(-50%)'
//             }}
//           >
//             <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
//               <EmojiPicker
//                 onEmojiClick={(emojiData) => handleAddReaction(emojiData.emoji, activeMessageId)}
//                 width={320}
//                 height={400}
//               />
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default MessageList;



























































// import React, { useEffect, useRef, useState } from 'react';
// import { Hash, Lock, Info, ChevronDown, Phone, Video, MoreVertical } from 'lucide-react';

// import useChannelStore from '@/lib/store/messaging/channelStore';
// import useMessageStore from '@/lib/store/messaging/messageStore';
// import useAuthStore from '@/lib/store/messaging/authStore';
// import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
// import Spinner from '@/components/custom-ui/modal/custom-spinner';
// import MessageItem from './MessageItem';

// const MessageList: React.FC = () => {
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const messageListRef = useRef<HTMLDivElement>(null);
//   const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
//   const { selectedWorkspaceId, workspaces } = useWorkspaceStore();
//   const { 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     channelsByWorkspace, 
//     directMessagesByWorkspace 
//   } = useChannelStore();
  
//   const { 
//     channelMessages, 
//     directMessages, 
//     hasMoreMessages, 
//     fetchChannelMessages, 
//     fetchDirectMessages,
//     fetchOlderMessages, 
//     typingUsers
//   } = useMessageStore();
  
//   const { user } = useAuthStore();
  
//   // Fetch messages when channel or DM changes
//   useEffect(() => {
//     if (selectedWorkspaceId && selectedChannelId) {
//       fetchChannelMessages(selectedWorkspaceId, selectedChannelId);
//     } else if (selectedWorkspaceId && selectedDirectMessageId) {
//       fetchDirectMessages(selectedWorkspaceId, selectedDirectMessageId);
//     }
//   }, [
//     selectedWorkspaceId, 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     fetchChannelMessages, 
//     fetchDirectMessages
//   ]);
  
//   // Scroll to bottom when messages change
//   useEffect(() => {
//     scrollToBottom();
//   }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId]);
  
//   // Set up scroll listener
//   useEffect(() => {
//     const messageList = messageListRef.current;
    
//     if (!messageList) return;
    
//     const handleScroll = () => {
//       // Check if user has scrolled up
//       const isScrolledUp = messageList.scrollTop < messageList.scrollHeight - messageList.clientHeight - 100;
//       setShowScrollToBottom(isScrolledUp);
      
//       // Check if user has scrolled to top for loading more messages
//       if (messageList.scrollTop === 0) {
//         handleLoadMore();
//       }
//     };
    
//     messageList.addEventListener('scroll', handleScroll);
    
//     return () => {
//       messageList.removeEventListener('scroll', handleScroll);
//     };
//   }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId]);
  
//   // Get messages for the selected channel or DM
//   const messages = 
//     selectedWorkspaceId && selectedChannelId 
//       ? ((channelMessages[selectedWorkspaceId] || {})[selectedChannelId] || [])
//       : selectedWorkspaceId && selectedDirectMessageId 
//         ? ((directMessages[selectedWorkspaceId] || {})[selectedDirectMessageId] || [])
//         : [];
  
//   // Get current channel or DM data
//   const currentChannel = 
//     selectedWorkspaceId && selectedChannelId 
//       ? (channelsByWorkspace[selectedWorkspaceId] || []).find(c => c.id === selectedChannelId) 
//       : null;
  
//   const currentDM = 
//     selectedWorkspaceId && selectedDirectMessageId 
//       ? (directMessagesByWorkspace[selectedWorkspaceId] || []).find(dm => dm.id === selectedDirectMessageId) 
//       : null;
  
//   // Get current workspace
//   const currentWorkspace = selectedWorkspaceId 
//     ? workspaces.find((w: any )=> w.id === selectedWorkspaceId)
//     : null;
  
//   // Get typing users for the current channel or DM
//   const currentTypingUsers = typingUsers.filter(tu => 
//     tu.workspaceId === selectedWorkspaceId && (
//       (selectedChannelId && tu.channelId === selectedChannelId) ||
//       (selectedDirectMessageId && tu.dmId === selectedDirectMessageId)
//     )
//   );
  
//   // Scroll to bottom
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };
  
//   // Handle loading more messages
//   const handleLoadMore = async () => {
//     if (!selectedWorkspaceId) return;
    
//     let cacheKey = '';
//     if (selectedChannelId) {
//       cacheKey = `${selectedWorkspaceId}:channel:${selectedChannelId}`;
//     } else if (selectedDirectMessageId) {
//       cacheKey = `${selectedWorkspaceId}:dm:${selectedDirectMessageId}`;
//     } else {
//       return;
//     }
    
//     if (isLoadingMore || !hasMoreMessages[cacheKey]) {
//       return;
//     }
    
//     setIsLoadingMore(true);
    
//     try {
//       if (selectedChannelId) {
//         await fetchOlderMessages('channel', selectedWorkspaceId, selectedChannelId);
//       } else if (selectedDirectMessageId) {
//         await fetchOlderMessages('dm', selectedWorkspaceId, selectedDirectMessageId);
//       }
//     } catch (error) {
//       console.log('Error loading more messages:', error);
//     } finally {
//       setIsLoadingMore(false);
//     }
//   };
  
//   // Render header
//   const renderHeader = () => {
//     if (currentChannel) {
//       return (
//         <div className="flex items-center justify-between bg-white p-4 shadow-sm">
//           <div className="flex items-center space-x-3">
//             <div className={`p-3 rounded-full ${
//               currentChannel.isPrivate 
//                 ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
//                 : 'bg-gradient-to-br from-blue-500 to-purple-600'
//             } shadow-lg`}>
//               {currentChannel.isPrivate ? 
//                 <Lock size={20} className="text-white" /> : 
//                 <Hash size={20} className="text-white" />
//               }
//             </div>
//             <div>
//               <h2 className="font-semibold text-gray-900 text-lg">{currentChannel.name}</h2>
//               <p className="text-sm text-gray-500">
//                 {currentChannel.isPrivate ? 'Private channel' : 'Public channel'} • 2 members online
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Phone size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Video size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200">
//               <MoreVertical size={18} />
//             </button>
//           </div>
//         </div>
//       );
//     } else if (currentDM) {
//       return (
//         <div className="flex items-center justify-between bg-white p-4 shadow-sm">
//           <div className="flex items-center space-x-3">
//             <div className="relative">
//               <img 
//                 src={currentDM?.otherUser?.avatar || '/api/placeholder/48/48'} 
//                 alt={currentDM?.otherUser?.fullName}
//                 className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
//               />
//               <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
//             </div>
//             <div>
//               <h2 className="font-semibold text-gray-900 text-lg">{currentDM?.otherUser?.fullName}</h2>
//               <p className="text-sm text-green-600 flex items-center">
//                 <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
//                 Active now
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Phone size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
//               <Video size={18} />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200">
//               <MoreVertical size={18} />
//             </button>
//           </div>
//         </div>
//       );
//     }
    
//     return null;
//   };

//   // Custom message bubble component
//   const MessageBubble: React.FC<{ message: any; isOwnMessage: boolean }> = ({ message, isOwnMessage }) => {
//     const formatTime = (timestamp: string) => {
//       return new Date(timestamp).toLocaleTimeString('en-US', { 
//         hour: '2-digit', 
//         minute: '2-digit',
//         hour12: false 
//       });
//     };

//     return (
//       <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
//         <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-[70%]`}>
//           {/* Avatar for other users */}
//           {!isOwnMessage && (
//             <img 
//               src={message.sender?.avatar || '/api/placeholder/32/32'} 
//               alt={message.sender?.fullName}
//               className="w-8 h-8 rounded-full object-cover flex-shrink-0"
//             />
//           )}
          
//           {/* Message container with MessageItem for hover actions */}
//           <div className="relative group">
//             <div className={`
//               px-4 py-3 rounded-2xl shadow-sm relative
//               ${isOwnMessage 
//                 ? 'bg-gradient-to-br from-gray-100 to-gray-150 text-white ml-2' 
//                 : 'bg-gradient-to-br from-blue-400 to-blue-500 text-white mr-2 border border-gray-200'
//               }
//               ${isOwnMessage ? 'rounded-br-md' : 'rounded-bl-md'}
//             `}>
//               {/* Sender name for channels (not DMs) */}
//               {/* {!isOwnMessage && currentChannel && (
//                 <p className="text-xs font-semibold text-blue-600 mb-1">
//                   {message.sender?.fullName}
//                 </p>
//               )} */}
              
//               {/* Message content */}
//               <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
//                 {message.content}
//               </p>
              
//               {/* Time and status */}
//               <div className={`
//                 flex items-center justify-end mt-2 space-x-1
//                 ${isOwnMessage ? 'text-gray-500' : 'text-blue-100'}
//               `}>
//                 <span className="text-xs">
//                   {formatTime(message.createdAt)}
//                 </span>
                
//                 {/* Message status for own messages */}
//                 {isOwnMessage && (
//                   <div className="flex">
//                     {/* Double tick for sent/delivered */}
//                     <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
//                       <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
//                     </svg>
//                     <svg className="w-4 h-4 -ml-1" viewBox="0 0 16 16" fill="currentColor">
//                       <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
//                     </svg>
//                   </div>
//                 )}
//               </div>
//             </div>
            
//             {/* MessageItem overlay for hover actions */}
//             <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
//               <MessageItem 
//                 message={message} 
//                 isOwnMessage={isOwnMessage}
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };
  
//   // If no workspace, channel or DM is selected
//   if (!selectedWorkspaceId || (!selectedChannelId && !selectedDirectMessageId)) {
//     return (
//       <div className="flex-1 flex flex-col">
//         <div className="flex min-h-[100vh] items-center justify-center">
//           <div className="text-center max-w-md mx-auto px-6">
//             {currentWorkspace ? (
//               <>
//                 <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg">
//                   <Hash size={36} className="text-white" />
//                 </div>
//                 <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to {currentWorkspace.name}</h3>
//                 <p className="text-gray-600 leading-relaxed">Select a channel or start a conversation to begin collaborating with your team</p>
//               </>
//             ) : (
//               <>
//                 <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg">
//                   <Hash size={36} className="text-gray-500" />
//                 </div>
//                 <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Messaging</h3>
//                 <p className="text-gray-600 leading-relaxed">Select or create a workspace to get started with your team collaboration</p>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   }
  
//   return (
//     <div className="flex-1 flex flex-col relative">
//       {/* Header */}
//       {renderHeader()}
      
//       {/* Messages area */}
//       <div 
//         ref={messageListRef}
//         className="flex-1 p-4 overflow-y-auto"
//         style={{ scrollBehavior: 'smooth' }}
//       >
//         {/* Loading indicator for older messages */}
//         {isLoadingMore && (
//           <div className="flex justify-center items-center py-6">
//             <div className="bg-white rounded-full p-3 shadow-lg border border-gray-200">
//               <Spinner size="sm" />
//             </div>
//           </div>
//         )}
        
//         {/* No messages state */}
//         {messages.length === 0 && !isLoadingMore && (
//           <div className="flex h-full items-center justify-center">
//             <div className="text-center max-w-md mx-auto bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
//               <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
//                 {currentChannel ? <Hash size={28} className="text-white" /> : <span className="text-3xl">💬</span>}
//               </div>
//               <h3 className="text-xl font-bold text-gray-900 mb-3">
//                 {currentChannel ? `Welcome to #${currentChannel?.name}` : 'Start a conversation'}
//               </h3>
//               <p className="text-gray-600 leading-relaxed">
//                 {currentChannel 
//                   ? `This is the beginning of the #${currentChannel?.name} channel. Share ideas, files, and collaborate with your team.`
//                   : `This is the beginning of your conversation with ${currentDM?.otherUser?.fullName}. Send a message to get started!`
//                 }
//               </p>
//             </div>
//           </div>
//         )}
        
//         {/* Messages */}
//         {messages.length > 0 && (
//           <div className="space-y-1">
//             {messages.map((message) => (
//               <MessageBubble
//                 key={message.id} 
//                 message={message} 
//                 isOwnMessage={message.sender.id === user?.id}
//               />
//             ))}
//           </div>
//         )}
        
//         {/* Typing indicator */}
//         {currentTypingUsers.length > 0 && (
//           <div className="flex justify-start mb-4">
//             <div className="flex items-center space-x-3">
//               <img 
//                 src={currentTypingUsers[0]?.avatar || '/'} 
//                 alt="User typing"
//                 className="w-8 h-8 rounded-full object-cover"
//               />
//               <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-200">
//                 <div className="flex space-x-1">
//                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
//                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
        
//         {/* This div is used to scroll to the bottom */}
//         <div ref={messagesEndRef} />
//       </div>
      
//       {/* Scroll to bottom button */}
//       {showScrollToBottom && (
//         <button
//           onClick={scrollToBottom}
//           className="absolute bottom-6 right-6 p-3 bg-blue-500 text-white rounded-full shadow-xl hover:bg-blue-600 transition-all duration-200 hover:scale-110 z-10"
//         >
//           <ChevronDown size={20} />
//         </button>
//       )}
//     </div>
//   );
// };

// export default MessageList;





























































// import React, { useEffect, useRef, useState } from 'react';
// import { Hash, Lock, Info, ChevronDown } from 'lucide-react';

// import useChannelStore from '@/lib/store/messaging/channelStore';
// import useMessageStore from '@/lib/store/messaging/messageStore';
// import useAuthStore from '@/lib/store/messaging/authStore';
// import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
// import Spinner from '@/components/custom-ui/modal/custom-spinner';
// import MessageItem from './MessageItem';

// const MessageList: React.FC = () => {
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const messageListRef = useRef<HTMLDivElement>(null);
//   const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
//   const { selectedWorkspaceId, workspaces } = useWorkspaceStore();
//   const { 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     channelsByWorkspace, 
//     directMessagesByWorkspace 
//   } = useChannelStore();
  
//   const { 
//     channelMessages, 
//     directMessages, 
//     hasMoreMessages, 
//     fetchChannelMessages, 
//     fetchDirectMessages,
//     fetchOlderMessages, 
//     typingUsers
//   } = useMessageStore();
  
//   const { user } = useAuthStore();
  
//   // Fetch messages when channel or DM changes
//   useEffect(() => {
//     if (selectedWorkspaceId && selectedChannelId) {
//       fetchChannelMessages(selectedWorkspaceId, selectedChannelId);
//     } else if (selectedWorkspaceId && selectedDirectMessageId) {
//       fetchDirectMessages(selectedWorkspaceId, selectedDirectMessageId);
//     }
//   }, [
//     selectedWorkspaceId, 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     fetchChannelMessages, 
//     fetchDirectMessages
//   ]);
  
//   // Scroll to bottom when messages change
//   useEffect(() => {
//     scrollToBottom();
//   }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId]);
  
//   // Set up scroll listener
//   useEffect(() => {
//     const messageList = messageListRef.current;
    
//     if (!messageList) return;
    
//     const handleScroll = () => {
//       // Check if user has scrolled up
//       const isScrolledUp = messageList.scrollTop < messageList.scrollHeight - messageList.clientHeight - 100;
//       setShowScrollToBottom(isScrolledUp);
      
//       // Check if user has scrolled to top for loading more messages
//       if (messageList.scrollTop === 0) {
//         handleLoadMore();
//       }
//     };
    
//     messageList.addEventListener('scroll', handleScroll);
    
//     return () => {
//       messageList.removeEventListener('scroll', handleScroll);
//     };
//   }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId]);
  
//   // Get messages for the selected channel or DM
//   const messages = 
//     selectedWorkspaceId && selectedChannelId 
//       ? ((channelMessages[selectedWorkspaceId] || {})[selectedChannelId] || [])
//       : selectedWorkspaceId && selectedDirectMessageId 
//         ? ((directMessages[selectedWorkspaceId] || {})[selectedDirectMessageId] || [])
//         : [];
  
//   // Get current channel or DM data
//   const currentChannel = 
//     selectedWorkspaceId && selectedChannelId 
//       ? (channelsByWorkspace[selectedWorkspaceId] || []).find(c => c.id === selectedChannelId) 
//       : null;
  
//   const currentDM = 
//     selectedWorkspaceId && selectedDirectMessageId 
//       ? (directMessagesByWorkspace[selectedWorkspaceId] || []).find(dm => dm.id === selectedDirectMessageId) 
//       : null;
  
//   // Get current workspace
//   const currentWorkspace = selectedWorkspaceId 
//     ? workspaces.find((w: any )=> w.id === selectedWorkspaceId)
//     : null;
  
//   // Get typing users for the current channel or DM
//   const currentTypingUsers = typingUsers.filter(tu => 
//     tu.workspaceId === selectedWorkspaceId && (
//       (selectedChannelId && tu.channelId === selectedChannelId) ||
//       (selectedDirectMessageId && tu.dmId === selectedDirectMessageId)
//     )
//   );
  
//   // Scroll to bottom
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };
  
//   // Handle loading more messages
//   const handleLoadMore = async () => {
//     if (!selectedWorkspaceId) return;
    
//     let cacheKey = '';
//     if (selectedChannelId) {
//       cacheKey = `${selectedWorkspaceId}:channel:${selectedChannelId}`;
//     } else if (selectedDirectMessageId) {
//       cacheKey = `${selectedWorkspaceId}:dm:${selectedDirectMessageId}`;
//     } else {
//       return;
//     }
    
//     if (isLoadingMore || !hasMoreMessages[cacheKey]) {
//       return;
//     }
    
//     setIsLoadingMore(true);
    
//     try {
//       if (selectedChannelId) {
//         await fetchOlderMessages('channel', selectedWorkspaceId, selectedChannelId);
//       } else if (selectedDirectMessageId) {
//         await fetchOlderMessages('dm', selectedWorkspaceId, selectedDirectMessageId);
//       }
//     } catch (error) {
//       console.log('Error loading more messages:', error);
//     } finally {
//       setIsLoadingMore(false);
//     }
//   };
  
//   // Render header
//   const renderHeader = () => {
//     if (currentChannel) {
//       return (
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             <div className="flex items-center space-x-3">
//               <div className={`p-2 rounded-lg ${
//                 currentChannel.isPrivate 
//                   ? 'bg-amber-100 text-amber-600' 
//                   : 'bg-blue-100 text-blue-600'
//               }`}>
//                 {currentChannel.isPrivate ? <Lock size={18} /> : <Hash size={18} />}
//               </div>
//               <div>
//                 <h2 className="font-semibold text-gray-900 text-lg">{currentChannel.name}</h2>
//                 <p className="text-sm text-gray-500">
//                   {currentChannel.isPrivate ? 'Private channel' : 'Public channel'} • 12 members
//                 </p>
//               </div>
//             </div>
//           </div>
//           <button 
//             className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//             title="View details"
//           >
//             <Info size={18} />
//           </button>
//         </div>
//       );
//     } else if (currentDM) {
//       return (
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             <div className="relative">
//               <img 
//                 src={currentDM?.otherUser?.avatar || '/api/placeholder/40/40'} 
//                 alt={currentDM?.otherUser?.fullName}
//                 className="w-10 h-10 rounded-full object-cover"
//               />
//               <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
//             </div>
//             <div>
//               <h2 className="font-semibold text-gray-900 text-lg">{currentDM?.otherUser?.fullName}</h2>
//               <p className="text-sm text-green-600">Active now • @{currentDM?.otherUser?.username}</p>
//             </div>
//           </div>
//           <button 
//             className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//             title="View details"
//           >
//             <Info size={18} />
//           </button>
//         </div>
//       );
//     }
    
//     return null;
//   };
  
//   // If no workspace, channel or DM is selected
//   if (!selectedWorkspaceId || (!selectedChannelId && !selectedDirectMessageId)) {
//     return (
//       <div className="flex-1 flex flex-col">
//         <div className="flex min-h-[70vh] items-center justify-center">
//           <div className="text-center max-w-md mx-auto px-6">
//             {currentWorkspace ? (
//               <>
//                 <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
//                   <Hash size={32} className="text-blue-500" />
//                 </div>
//                 <h3 className="text-xl font-semibold text-gray-900 mb-3">Welcome to {currentWorkspace.name}</h3>
//                 <p className="text-gray-500 leading-relaxed">Select a channel or start a conversation to begin collaborating with your team</p>
//               </>
//             ) : (
//               <>
//                 <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6 mx-auto">
//                   <Hash size={32} className="text-gray-400" />
//                 </div>
//                 <h3 className="text-xl font-semibold text-gray-900 mb-3">Welcome to Messaging</h3>
//                 <p className="text-gray-500 leading-relaxed">Select or create a workspace to get started with your team collaboration</p>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   }
  
//   return (
//     <div className="flex-1 flex flex-col relative">
//       {/* Header */}
//       <div className="bg-white p-6 border-b border-gray-200">
//         {renderHeader()}
//       </div>
      
//       {/* Messages area */}
//       <div 
//         ref={messageListRef}
//         className="flex-1 p-6 overflow-y-auto bg-white"
//         style={{ scrollBehavior: 'smooth' }}
//       >
//         {/* Loading indicator for older messages */}
//         {isLoadingMore && (
//           <div className="flex justify-center items-center py-6">
//             <div className="bg-white rounded-full p-3 shadow-sm border border-gray-200">
//               <Spinner size="sm" />
//             </div>
//           </div>
//         )}
        
//         {/* No messages state */}
//         {messages.length === 0 && !isLoadingMore && (
//           <div className="flex h-full items-center justify-center">
//             <div className="text-center max-w-md mx-auto">
//               <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
//                 {currentChannel ? <Hash size={24} className="text-blue-500" /> : <span className="text-2xl">💬</span>}
//               </div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-3">
//                 {currentChannel ? `Welcome to #${currentChannel?.name}` : 'Start a conversation'}
//               </h3>
//               <p className="text-gray-500 leading-relaxed">
//                 {currentChannel 
//                   ? `This is the beginning of the #${currentChannel?.name} channel. Share ideas, files, and collaborate with your team.`
//                   : `This is the beginning of your conversation with ${currentDM?.otherUser?.fullName}. Send a message to get started!`
//                 }
//               </p>
//             </div>
//           </div>
//         )}
        
//         {/* Messages */}
//         {messages.length > 0 && (
//           <div className="space-y-4">
//             {messages.map((message) => {
//               const isOwnMessage = message.sender.id === user?.id;
//               return (
//                 <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
//                   <div className={`flex items-start space-x-3 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
//                     {/* Avatar */}
//                     <img 
//                       src={message.sender.avatar || '/api/placeholder/32/32'} 
//                       alt={message.sender.fullName}
//                       className="w-8 h-8 rounded-full object-cover flex-shrink-0"
//                     />
                    
//                     {/* Message content */}
//                     <div className={`${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
//                       {/* Sender name and timestamp */}
//                       <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
//                         {/* <span className="text-sm font-medium text-gray-900">{message.sender.fullName}</span> */}
//                         {/* <span className="text-xs text-gray-500">{message.timestamp}</span> */}
//                       </div>
                      
//                       {/* Message bubble */}
//                       <div className={`px-4 py-3 rounded-2xl max-w-full ${
//                         isOwnMessage 
//                           ? 'bg-blue-600 text-white rounded-br-sm' 
//                           : 'bg-gray-100 text-gray-900 rounded-bl-sm'
//                       }`}>
//                         <p className="text-sm leading-relaxed break-words">{message.content}</p>
                        
//                         {/* Reactions */}
//                         {message.reactions && message.reactions.length > 0 && (
//                           <div className="flex space-x-1 mt-2">
//                             {message.reactions.map((reaction, idx) => (
//                               <span key={idx} className={`text-xs px-2 py-1 rounded-full ${
//                                 isOwnMessage 
//                                   ? 'bg-white bg-opacity-20 text-white' 
//                                   : 'bg-white border border-gray-200 text-gray-700'
//                               }`}>
//                                 {reaction.emoji} {reaction.count}
//                               </span>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
        
//         {/* Typing indicator */}
//         {currentTypingUsers.length > 0 && (
//           <div className="mt-6 flex items-center space-x-2">
//             <div className="bg-gray-200 rounded-full px-4 py-2">
//               <div className="flex space-x-1">
//                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
//                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//               </div>
//             </div>
//             <span className="text-sm text-gray-500">
//               {currentTypingUsers.length === 1 
//                 ? `${currentTypingUsers[0]?.username} is typing...`
//                 : `${currentTypingUsers.length} people are typing...`
//               }
//             </span>
//           </div>
//         )}
        
//         {/* This div is used to scroll to the bottom */}
//         <div ref={messagesEndRef} />
//       </div>
      
//       {/* Scroll to bottom button */}
//       {showScrollToBottom && (
//         <button
//           onClick={scrollToBottom}
//           className="absolute bottom-6 right-6 p-3 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 hover:scale-105 z-10"
//         >
//           <ChevronDown size={20} className="text-gray-600" />
//         </button>
//       )}
//     </div>
//   );
// };

// export default MessageList;


































// Mr. Muwa Code Ui
// import React, { useEffect, useRef, useState } from 'react';
// import { Hash, Lock, Info, ChevronDown } from 'lucide-react';

// import useChannelStore from '@/lib/store/messaging/channelStore';
// import useMessageStore from '@/lib/store/messaging/messageStore';
// import useAuthStore from '@/lib/store/messaging/authStore';
// import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
// import Spinner from '@/components/custom-ui/modal/custom-spinner';
// import MessageItem from './MessageItem';

// const MessageList: React.FC = () => {
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const messageListRef = useRef<HTMLDivElement>(null);
//   const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
//   const { selectedWorkspaceId, workspaces } = useWorkspaceStore();
//   const { 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     channelsByWorkspace, 
//     directMessagesByWorkspace 
//   } = useChannelStore();
  
//   const { 
//     channelMessages, 
//     directMessages, 
//     hasMoreMessages, 
//     fetchChannelMessages, 
//     fetchDirectMessages,
//     fetchOlderMessages, 
//     typingUsers
//   } = useMessageStore();
  
//   const { user } = useAuthStore();
  
//   // Fetch messages when channel or DM changes
//   useEffect(() => {
//     if (selectedWorkspaceId && selectedChannelId) {
//       fetchChannelMessages(selectedWorkspaceId, selectedChannelId);
//     } else if (selectedWorkspaceId && selectedDirectMessageId) {
//       fetchDirectMessages(selectedWorkspaceId, selectedDirectMessageId);
//     }
//   }, [
//     selectedWorkspaceId, 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     fetchChannelMessages, 
//     fetchDirectMessages
//   ]);
  
//   // Scroll to bottom when messages change
//   useEffect(() => {
//     scrollToBottom();
//   }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId]);
  
//   // Set up scroll listener
//   useEffect(() => {
//     const messageList = messageListRef.current;
    
//     if (!messageList) return;
    
//     const handleScroll = () => {
//       // Check if user has scrolled up
//       const isScrolledUp = messageList.scrollTop < messageList.scrollHeight - messageList.clientHeight - 100;
//       setShowScrollToBottom(isScrolledUp);
      
//       // Check if user has scrolled to top for loading more messages
//       if (messageList.scrollTop === 0) {
//         handleLoadMore();
//       }
//     };
    
//     messageList.addEventListener('scroll', handleScroll);
    
//     return () => {
//       messageList.removeEventListener('scroll', handleScroll);
//     };
//   }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId]);
  
//   // Get messages for the selected channel or DM
//   const messages = 
//     selectedWorkspaceId && selectedChannelId 
//       ? ((channelMessages[selectedWorkspaceId] || {})[selectedChannelId] || [])
//       : selectedWorkspaceId && selectedDirectMessageId 
//         ? ((directMessages[selectedWorkspaceId] || {})[selectedDirectMessageId] || [])
//         : [];
  
//   // Get current channel or DM data
//   const currentChannel = 
//     selectedWorkspaceId && selectedChannelId 
//       ? (channelsByWorkspace[selectedWorkspaceId] || []).find(c => c.id === selectedChannelId) 
//       : null;
  
//   const currentDM = 
//     selectedWorkspaceId && selectedDirectMessageId 
//       ? (directMessagesByWorkspace[selectedWorkspaceId] || []).find(dm => dm.id === selectedDirectMessageId) 
//       : null;
  
//   // Get current workspace
//   const currentWorkspace = selectedWorkspaceId 
//     ? workspaces.find((w: any )=> w.id === selectedWorkspaceId)
//     : null;
  
//   // Get typing users for the current channel or DM
//   const currentTypingUsers = typingUsers.filter(tu => 
//     tu.workspaceId === selectedWorkspaceId && (
//       (selectedChannelId && tu.channelId === selectedChannelId) ||
//       (selectedDirectMessageId && tu.dmId === selectedDirectMessageId)
//     )
//   );
  
//   // Scroll to bottom
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };
  
//   // Handle loading more messages
//   const handleLoadMore = async () => {
//     if (!selectedWorkspaceId) return;
    
//     let cacheKey = '';
//     if (selectedChannelId) {
//       cacheKey = `${selectedWorkspaceId}:channel:${selectedChannelId}`;
//     } else if (selectedDirectMessageId) {
//       cacheKey = `${selectedWorkspaceId}:dm:${selectedDirectMessageId}`;
//     } else {
//       return;
//     }
    
//     if (isLoadingMore || !hasMoreMessages[cacheKey]) {
//       return;
//     }
    
//     setIsLoadingMore(true);
    
//     try {
//       if (selectedChannelId) {
//         await fetchOlderMessages('channel', selectedWorkspaceId, selectedChannelId);
//       } else if (selectedDirectMessageId) {
//         await fetchOlderMessages('dm', selectedWorkspaceId, selectedDirectMessageId);
//       }
//     } catch (error) {
//       console.log('Error loading more messages:', error);
//     } finally {
//       setIsLoadingMore(false);
//     }
//   };
  
//   // Render header
//   const renderHeader = () => {
//     if (currentChannel) {
//       return (
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             <div className="flex items-center space-x-3">
//               <div className={`p-2 rounded-lg ${
//                 currentChannel.isPrivate 
//                   ? 'bg-amber-100 text-amber-600' 
//                   : 'bg-blue-100 text-blue-600'
//               }`}>
//                 {currentChannel.isPrivate ? <Lock size={18} /> : <Hash size={18} />}
//               </div>
//               <div>
//                 <h2 className="font-semibold text-gray-900 text-lg">{currentChannel.name}</h2>
//                 <p className="text-sm text-gray-500">
//                   {currentChannel.isPrivate ? 'Private channel' : 'Public channel'} • 12 members
//                 </p>
//               </div>
//             </div>
//           </div>
//           <button 
//             className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//             title="View details"
//           >
//             <Info size={18} />
//           </button>
//         </div>
//       );
//     } else if (currentDM) {
//       return (
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             <div className="relative">
//               <img 
//                 src={currentDM?.otherUser?.avatar || '/api/placeholder/40/40'} 
//                 alt={currentDM?.otherUser?.fullName}
//                 className="w-10 h-10 rounded-full object-cover"
//               />
//               <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
//             </div>
//             <div>
//               <h2 className="font-semibold text-gray-900 text-lg">{currentDM?.otherUser?.fullName}</h2>
//               <p className="text-sm text-green-600">Active now • @{currentDM?.otherUser?.username}</p>
//             </div>
//           </div>
//           <button 
//             className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//             title="View details"
//           >
//             <Info size={18} />
//           </button>
//         </div>
//       );
//     }
    
//     return null;
//   };
  
//   // If no workspace, channel or DM is selected
//   if (!selectedWorkspaceId || (!selectedChannelId && !selectedDirectMessageId)) {
//     return (
//       <div className="flex-1 flex flex-col">
//         <div className="flex min-h-[70vh] items-center justify-center">
//           <div className="text-center max-w-md mx-auto px-6">
//             {currentWorkspace ? (
//               <>
//                 <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
//                   <Hash size={32} className="text-blue-500" />
//                 </div>
//                 <h3 className="text-xl font-semibold text-gray-900 mb-3">Welcome to {currentWorkspace.name}</h3>
//                 <p className="text-gray-500 leading-relaxed">Select a channel or start a conversation to begin collaborating with your team</p>
//               </>
//             ) : (
//               <>
//                 <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6 mx-auto">
//                   <Hash size={32} className="text-gray-400" />
//                 </div>
//                 <h3 className="text-xl font-semibold text-gray-900 mb-3">Welcome to Messaging</h3>
//                 <p className="text-gray-500 leading-relaxed">Select or create a workspace to get started with your team collaboration</p>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   }
  
//   return (
//     <div className="flex-1 flex flex-col relative">
//       {/* Header */}
//       <div className="bg-white p-6 border-b border-gray-200">
//         {renderHeader()}
//       </div>
      
//       {/* Messages area */}
//       <div 
//         ref={messageListRef}
//         className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-white to-gray-50"
//         style={{ scrollBehavior: 'smooth' }}
//       >
//         {/* Loading indicator for older messages */}
//         {isLoadingMore && (
//           <div className="flex justify-center items-center py-6">
//             <div className="bg-white rounded-full p-3 shadow-sm border border-gray-200">
//               <Spinner size="sm" />
//             </div>
//           </div>
//         )}
        
//         {/* No messages state */}
//         {messages.length === 0 && !isLoadingMore && (
//           <div className="flex h-full items-center justify-center">
//             <div className="text-center max-w-md mx-auto">
//               <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
//                 {currentChannel ? <Hash size={24} className="text-blue-500" /> : <span className="text-2xl">💬</span>}
//               </div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-3">
//                 {currentChannel ? `Welcome to #${currentChannel?.name}` : 'Start a conversation'}
//               </h3>
//               <p className="text-gray-500 leading-relaxed">
//                 {currentChannel 
//                   ? `This is the beginning of the #${currentChannel?.name} channel. Share ideas, files, and collaborate with your team.`
//                   : `This is the beginning of your conversation with ${currentDM?.otherUser?.fullName}. Send a message to get started!`
//                 }
//               </p>
//             </div>
//           </div>
//         )}
        
//         {/* Messages */}
//         {messages.length > 0 && (
//           <div className="space-y-6">
//             {messages.map((message) => (
//               <MessageItem 
//                 key={message.id} 
//                 message={message} 
//                 isOwnMessage={message.sender.id === user?.id}
//               />
//             ))}
//           </div>
//         )}
        
//         {/* Typing indicator */}
//         {currentTypingUsers.length > 0 && (
//           <div className="mt-6 flex items-center space-x-2">
//             <div className="bg-gray-200 rounded-full px-4 py-2">
//               <div className="flex space-x-1">
//                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
//                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//               </div>
//             </div>
//             <span className="text-sm text-gray-500">
//               {currentTypingUsers.length === 1 
//                 ? `${currentTypingUsers[0]?.username} is typing...`
//                 : `${currentTypingUsers.length} people are typing...`
//               }
//             </span>
//           </div>
//         )}
        
//         {/* This div is used to scroll to the bottom */}
//         <div ref={messagesEndRef} />
//       </div>
      
//       {/* Scroll to bottom button */}
//       {showScrollToBottom && (
//         <button
//           onClick={scrollToBottom}
//           className="absolute bottom-6 right-6 p-3 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 hover:scale-105 z-10"
//         >
//           <ChevronDown size={20} className="text-gray-600" />
//         </button>
//       )}
//     </div>
//   );
// };

// export default MessageList;































































// import React, { useEffect, useRef, useState } from 'react';
// import { Hash, Lock, Info, ChevronDown } from 'lucide-react';

// import useChannelStore from '@/lib/store/messaging/channelStore';
// import useMessageStore from '@/lib/store/messaging/messageStore';
// import useAuthStore from '@/lib/store/messaging/authStore';
// import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
// import Spinner from '@/components/custom-ui/modal/custom-spinner';
// import MessageItem from './MessageItem';

// const MessageList: React.FC = () => {
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const messageListRef = useRef<HTMLDivElement>(null);
//   const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
//   const { selectedWorkspaceId, workspaces } = useWorkspaceStore();
//   const { 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     channelsByWorkspace, 
//     directMessagesByWorkspace 
//   } = useChannelStore();
  
//   const { 
//     channelMessages, 
//     directMessages, 
//     hasMoreMessages, 
//     fetchChannelMessages, 
//     fetchDirectMessages,
//     fetchOlderMessages, 
//     typingUsers
//   } = useMessageStore();
  
//   const { user } = useAuthStore();
  
//   // Fetch messages when channel or DM changes
//   useEffect(() => {
//     if (selectedWorkspaceId && selectedChannelId) {
//       fetchChannelMessages(selectedWorkspaceId, selectedChannelId);
//     } else if (selectedWorkspaceId && selectedDirectMessageId) {
//       fetchDirectMessages(selectedWorkspaceId, selectedDirectMessageId);
//     }
//   }, [
//     selectedWorkspaceId, 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     fetchChannelMessages, 
//     fetchDirectMessages
//   ]);
  
//   // Scroll to bottom when messages change
//   useEffect(() => {
//     scrollToBottom();
//   }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId]);
  
//   // Set up scroll listener
//   useEffect(() => {
//     const messageList = messageListRef.current;
    
//     if (!messageList) return;
    
//     const handleScroll = () => {
//       // Check if user has scrolled up
//       const isScrolledUp = messageList.scrollTop < messageList.scrollHeight - messageList.clientHeight - 100;
//       setShowScrollToBottom(isScrolledUp);
      
//       // Check if user has scrolled to top for loading more messages
//       if (messageList.scrollTop === 0) {
//         handleLoadMore();
//       }
//     };
    
//     messageList.addEventListener('scroll', handleScroll);
    
//     return () => {
//       messageList.removeEventListener('scroll', handleScroll);
//     };
//   }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId]);
  
//   // Get messages for the selected channel or DM
//   const messages = 
//     selectedWorkspaceId && selectedChannelId 
//       ? ((channelMessages[selectedWorkspaceId] || {})[selectedChannelId] || [])
//       : selectedWorkspaceId && selectedDirectMessageId 
//         ? ((directMessages[selectedWorkspaceId] || {})[selectedDirectMessageId] || [])
//         : [];
  
//   // Get current channel or DM data
//   const currentChannel = 
//     selectedWorkspaceId && selectedChannelId 
//       ? (channelsByWorkspace[selectedWorkspaceId] || []).find(c => c.id === selectedChannelId) 
//       : null;
  
//   const currentDM = 
//     selectedWorkspaceId && selectedDirectMessageId 
//       ? (directMessagesByWorkspace[selectedWorkspaceId] || []).find(dm => dm.id === selectedDirectMessageId) 
//       : null;
  
//   // Get current workspace
//   const currentWorkspace = selectedWorkspaceId 
//     ? workspaces.find((w: any )=> w.id === selectedWorkspaceId)
//     : null;
  
//   // Get typing users for the current channel or DM
//   const currentTypingUsers = typingUsers.filter(tu => 
//     tu.workspaceId === selectedWorkspaceId && (
//       (selectedChannelId && tu.channelId === selectedChannelId) ||
//       (selectedDirectMessageId && tu.dmId === selectedDirectMessageId)
//     )
//   );
  
//   // Scroll to bottom
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };
  
//   // Handle loading more messages
//   const handleLoadMore = async () => {
//     if (!selectedWorkspaceId) return;
    
//     let cacheKey = '';
//     if (selectedChannelId) {
//       cacheKey = `${selectedWorkspaceId}:channel:${selectedChannelId}`;
//     } else if (selectedDirectMessageId) {
//       cacheKey = `${selectedWorkspaceId}:dm:${selectedDirectMessageId}`;
//     } else {
//       return;
//     }
    
//     if (isLoadingMore || !hasMoreMessages[cacheKey]) {
//       return;
//     }
    
//     setIsLoadingMore(true);
    
//     try {
//       if (selectedChannelId) {
//         await fetchOlderMessages('channel', selectedWorkspaceId, selectedChannelId);
//       } else if (selectedDirectMessageId) {
//         await fetchOlderMessages('dm', selectedWorkspaceId, selectedDirectMessageId);
//       }
//     } catch (error) {
//       console.log('Error loading more messages:', error);
//     } finally {
//       setIsLoadingMore(false);
//     }
//   };
  
//   // Render header
//   const renderHeader = () => {
//     if (currentChannel) {
//       return (
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             <div className="flex items-center space-x-3">
//               <div className={`p-2 rounded-lg ${
//                 currentChannel.isPrivate 
//                   ? 'bg-amber-100 text-amber-600' 
//                   : 'bg-blue-100 text-blue-600'
//               }`}>
//                 {currentChannel.isPrivate ? <Lock size={18} /> : <Hash size={18} />}
//               </div>
//               <div>
//                 <h2 className="font-semibold text-gray-900 text-lg">{currentChannel.name}</h2>
//                 <p className="text-sm text-gray-500">
//                   {currentChannel.isPrivate ? 'Private channel' : 'Public channel'} • 12 members
//                 </p>
//               </div>
//             </div>
//           </div>
//           <button 
//             className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//             title="View details"
//           >
//             <Info size={18} />
//           </button>
//         </div>
//       );
//     } else if (currentDM) {
//       return (
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             <div className="relative">
//               <img 
//                 src={currentDM?.otherUser?.avatar || '/api/placeholder/40/40'} 
//                 alt={currentDM?.otherUser?.fullName}
//                 className="w-10 h-10 rounded-full object-cover"
//               />
//               <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
//             </div>
//             <div>
//               <h2 className="font-semibold text-gray-900 text-lg">{currentDM?.otherUser?.fullName}</h2>
//               <p className="text-sm text-green-600">Active now • @{currentDM?.otherUser?.username}</p>
//             </div>
//           </div>
//           <button 
//             className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//             title="View details"
//           >
//             <Info size={18} />
//           </button>
//         </div>
//       );
//     }
    
//     return null;
//   };
  
//   // If no workspace, channel or DM is selected
//   if (!selectedWorkspaceId || (!selectedChannelId && !selectedDirectMessageId)) {
//     return (
//       <div className="flex-1 flex flex-col">
//         <div className="flex min-h-[70vh] items-center justify-center">
//           <div className="text-center max-w-md mx-auto px-6">
//             {currentWorkspace ? (
//               <>
//                 <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
//                   <Hash size={32} className="text-blue-500" />
//                 </div>
//                 <h3 className="text-xl font-semibold text-gray-900 mb-3">Welcome to {currentWorkspace.name}</h3>
//                 <p className="text-gray-500 leading-relaxed">Select a channel or start a conversation to begin collaborating with your team</p>
//               </>
//             ) : (
//               <>
//                 <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6 mx-auto">
//                   <Hash size={32} className="text-gray-400" />
//                 </div>
//                 <h3 className="text-xl font-semibold text-gray-900 mb-3">Welcome to Messaging</h3>
//                 <p className="text-gray-500 leading-relaxed">Select or create a workspace to get started with your team collaboration</p>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   }
  
//   return (
//     <div className="flex-1 flex flex-col relative">
//       {/* Header */}
//       <div className="bg-white p-6 border-b border-gray-200">
//         {renderHeader()}
//       </div>
      
//       {/* Messages area */}
//       <div 
//         ref={messageListRef}
//         className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-white to-gray-50"
//         style={{ scrollBehavior: 'smooth' }}
//       >
//         {/* Loading indicator for older messages */}
//         {isLoadingMore && (
//           <div className="flex justify-center items-center py-6">
//             <div className="bg-white rounded-full p-3 shadow-sm border border-gray-200">
//               <Spinner size="sm" />
//             </div>
//           </div>
//         )}
        
//         {/* No messages state */}
//         {messages.length === 0 && !isLoadingMore && (
//           <div className="flex h-full items-center justify-center">
//             <div className="text-center max-w-md mx-auto">
//               <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
//                 {currentChannel ? <Hash size={24} className="text-blue-500" /> : <span className="text-2xl">💬</span>}
//               </div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-3">
//                 {currentChannel ? `Welcome to #${currentChannel?.name}` : 'Start a conversation'}
//               </h3>
//               <p className="text-gray-500 leading-relaxed">
//                 {currentChannel 
//                   ? `This is the beginning of the #${currentChannel?.name} channel. Share ideas, files, and collaborate with your team.`
//                   : `This is the beginning of your conversation with ${currentDM?.otherUser?.fullName}. Send a message to get started!`
//                 }
//               </p>
//             </div>
//           </div>
//         )}
        
//         {/* Messages */}
//         {messages.length > 0 && (
//           <div className="space-y-6">
//             {messages.map((message) => (
//               <MessageItem 
//                 key={message.id} 
//                 message={message} 
//                 isOwnMessage={message.sender.id === user?.id}
//               />
//             ))}
//           </div>
//         )}
        
//         {/* Typing indicator */}
//         {currentTypingUsers.length > 0 && (
//           <div className="mt-6 flex items-center space-x-2">
//             <div className="bg-gray-200 rounded-full px-4 py-2">
//               <div className="flex space-x-1">
//                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
//                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//               </div>
//             </div>
//             <span className="text-sm text-gray-500">
//               {currentTypingUsers.length === 1 
//                 ? `${currentTypingUsers[0]?.username} is typing...`
//                 : `${currentTypingUsers.length} people are typing...`
//               }
//             </span>
//           </div>
//         )}
        
//         {/* This div is used to scroll to the bottom */}
//         <div ref={messagesEndRef} />
//       </div>
      
//       {/* Scroll to bottom button */}
//       {showScrollToBottom && (
//         <button
//           onClick={scrollToBottom}
//           className="absolute bottom-6 right-6 p-3 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 hover:scale-105 z-10"
//         >
//           <ChevronDown size={20} className="text-gray-600" />
//         </button>
//       )}
//     </div>
//   );
// };

// export default MessageList;



















































// import React, { useEffect, useRef, useState } from 'react';
// import { Hash, Lock, InfoIcon, ChevronDown } from 'lucide-react';

// import useChannelStore from '@/lib/store/messaging/channelStore';
// import useMessageStore from '@/lib/store/messaging/messageStore';
// import useAuthStore from '@/lib/store/messaging/authStore';
// import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
// import Spinner from '@/components/custom-ui/modal/custom-spinner';
// import MessageItem from './MessageItem';

// const MessageList: React.FC = () => {
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const messageListRef = useRef<HTMLDivElement>(null);
//   const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
//   const { selectedWorkspaceId, workspaces } = useWorkspaceStore();
//   const { 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     channelsByWorkspace, 
//     directMessagesByWorkspace 
//   } = useChannelStore();
  
//   const { 
//     channelMessages, 
//     directMessages, 
//     hasMoreMessages, 
//     fetchChannelMessages, 
//     fetchDirectMessages,
//     fetchOlderMessages, 
//     typingUsers
//   } = useMessageStore();
  
//   const { user } = useAuthStore();
  
//   // Fetch messages when channel or DM changes
//   useEffect(() => {
//     if (selectedWorkspaceId && selectedChannelId) {
//       fetchChannelMessages(selectedWorkspaceId, selectedChannelId);
//     } else if (selectedWorkspaceId && selectedDirectMessageId) {
//       fetchDirectMessages(selectedWorkspaceId, selectedDirectMessageId);
//     }
//   }, [
//     selectedWorkspaceId, 
//     selectedChannelId, 
//     selectedDirectMessageId, 
//     fetchChannelMessages, 
//     fetchDirectMessages
//   ]);
  
//   // Scroll to bottom when messages change
//   useEffect(() => {
//     scrollToBottom();
//   }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId]);
  
//   // Set up scroll listener
//   useEffect(() => {
//     const messageList = messageListRef.current;
    
//     if (!messageList) return;
    
//     const handleScroll = () => {
//       // Check if user has scrolled up
//       const isScrolledUp = messageList.scrollTop < messageList.scrollHeight - messageList.clientHeight - 100;
//       setShowScrollToBottom(isScrolledUp);
      
//       // Check if user has scrolled to top for loading more messages
//       if (messageList.scrollTop === 0) {
//         handleLoadMore();
//       }
//     };
    
//     messageList.addEventListener('scroll', handleScroll);
    
//     return () => {
//       messageList.removeEventListener('scroll', handleScroll);
//     };
//   }, [selectedWorkspaceId, selectedChannelId, selectedDirectMessageId]);
  
//   // Get messages for the selected channel or DM
//   const messages = 
//     selectedWorkspaceId && selectedChannelId 
//       ? ((channelMessages[selectedWorkspaceId] || {})[selectedChannelId] || [])
//       : selectedWorkspaceId && selectedDirectMessageId 
//         ? ((directMessages[selectedWorkspaceId] || {})[selectedDirectMessageId] || [])
//         : [];
  
//   // Get current channel or DM data
//   const currentChannel = 
//     selectedWorkspaceId && selectedChannelId 
//       ? (channelsByWorkspace[selectedWorkspaceId] || []).find(c => c.id === selectedChannelId) 
//       : null;
  
//   const currentDM = 
//     selectedWorkspaceId && selectedDirectMessageId 
//       ? (directMessagesByWorkspace[selectedWorkspaceId] || []).find(dm => dm.id === selectedDirectMessageId) 
//       : null;
  
//   // Get current workspace
//   const currentWorkspace = selectedWorkspaceId 
//     ? workspaces.find((w: any )=> w.id === selectedWorkspaceId)
//     : null;
  
//   // Get typing users for the current channel or DM
//   const currentTypingUsers = typingUsers.filter(tu => 
//     tu.workspaceId === selectedWorkspaceId && (
//       (selectedChannelId && tu.channelId === selectedChannelId) ||
//       (selectedDirectMessageId && tu.dmId === selectedDirectMessageId)
//     )
//   );
  
//   // Scroll to bottom
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };
  
//   // Handle loading more messages
//   const handleLoadMore = async () => {
//     if (!selectedWorkspaceId) return;
    
//     let cacheKey = '';
//     if (selectedChannelId) {
//       cacheKey = `${selectedWorkspaceId}:channel:${selectedChannelId}`;
//     } else if (selectedDirectMessageId) {
//       cacheKey = `${selectedWorkspaceId}:dm:${selectedDirectMessageId}`;
//     } else {
//       return;
//     }
    
//     if (isLoadingMore || !hasMoreMessages[cacheKey]) {
//       return;
//     }
    
//     setIsLoadingMore(true);
    
//     try {
//       if (selectedChannelId) {
//         await fetchOlderMessages('channel', selectedWorkspaceId, selectedChannelId);
//       } else if (selectedDirectMessageId) {
//         await fetchOlderMessages('dm', selectedWorkspaceId, selectedDirectMessageId);
//       }
//     } catch (error) {
//       console.log('Error loading more messages:', error);
//     } finally {
//       setIsLoadingMore(false);
//     }
//   };
  
//   // Render header
//   const renderHeader = () => {
//     if (currentChannel) {
//       return (
//         <div className="flex items-center space-x-2">
//           {currentChannel.isPrivate ? (
//             <Lock size={20} className="text-gray-500" />
//           ) : (
//             <Hash size={20} className="text-gray-500" />
//           )}
//           <h2 className="font-semibold">{currentChannel.name}</h2>
//           <button 
//             className="ml-2 text-gray-400 hover:text-gray-600"
//             title="View details"
//           >
//             <InfoIcon size={16} />
//           </button>
//         </div>
//       );
//     } else if (currentDM) {
//       return (
//         <div className="flex items-center space-x-2">
//           <h2 className="font-semibold">{currentDM?.otherUser?.fullName}</h2>
//           <span className="text-sm text-gray-500">@{currentDM?.otherUser?.username}</span>
//         </div>
//       );
//     }
    
//     return null;
//   };
  
//   // If no workspace, channel or DM is selected
//   if (!selectedWorkspaceId || (!selectedChannelId && !selectedDirectMessageId)) {
//     return (
//       // <div className="flex-1 flex flex-col border border-gray-200 rounded-r-xl">
//       <div className="flex-1 flex flex-col">
//         <div className="flex min-h-[70vh] items-center justify-center">
//           <div className="text-center">
//             {currentWorkspace ? (
//               <>
//                 <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to {currentWorkspace.name}</h3>
//                 <p className="text-gray-500">Select a channel or conversation to start chatting</p>
//               </>
//             ) : (
//               <>
//                 <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Messaging</h3>
//                 <p className="text-gray-500">Select or create a workspace to get started</p>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   }
  
//   return (
//     <div className="flex-1 flex flex-col">
//       {/* Header */}
//       <div className="bg-white p-4 border-b">
//         {renderHeader()}
//       </div>
      
//       {/* Messages area */}
//       <div 
//         ref={messageListRef}
//         className="flex-1 p-4 overflow-y-auto"
//       >
//         {/* Loading indicator for older messages */}
//         {isLoadingMore && (
//           <div className="flex justify-center items-center py-4">
//             <Spinner size="sm" />
//           </div>
//         )}
        
//         {/* No messages state */}
//         {messages.length === 0 && !isLoadingMore && (
//           <div className="flex h-full items-center justify-center">
//             <div className="text-center">
//               <h3 className="text-lg font-medium text-gray-900 mb-2">
//                 {currentChannel ? `Welcome to #${currentChannel?.name}` : 'Start a conversation'}
//               </h3>
//               <p className="text-gray-500">
//                 {currentChannel 
//                   ? `This is the beginning of the #${currentChannel?.name} channel`
//                   : `This is the beginning of your conversation with ${currentDM?.otherUser?.fullName}`
//                 }
//               </p>
//             </div>
//           </div>
//         )}
        
//         {/* Messages */}
//         {messages.length > 0 && (
//           <div className="space-y-4">
//             {messages.map((message) => (
//               <MessageItem 
//                 key={message.id} 
//                 message={message} 
//                 isOwnMessage={message.sender.id === user?.id}
//               />
//             ))}
//           </div>
//         )}
        
//         {/* Typing indicator */}
//         {currentTypingUsers.length > 0 && (
//           <div className="mt-2 text-gray-500 text-sm">
//             {currentTypingUsers.length === 1 
//               ? `${currentTypingUsers[0]?.username} is typing...`
//               : `${currentTypingUsers.length} people are typing...`
//             }
//           </div>
//         )}
        
//         {/* This div is used to scroll to the bottom */}
//         <div ref={messagesEndRef} />
//       </div>
      
//       {/* Scroll to bottom button */}
//       {showScrollToBottom && (
//         <button
//           onClick={scrollToBottom}
//           className="absolute bottom-24 right-8 rounded-full bg-gray-100 p-2 shadow-md hover:bg-gray-200"
//         >
//           <ChevronDown size={20} />
//         </button>
//       )}
//     </div>
//   );
// };

// export default MessageList;