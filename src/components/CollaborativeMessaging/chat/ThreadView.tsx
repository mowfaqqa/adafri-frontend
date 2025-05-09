"use client";

import React, { useEffect, useRef } from 'react';
import { X, MessageSquare, Users } from 'lucide-react';

import MessageItem from './MessageItem';
import useMessageStore from '@/lib/store/messaging/messageStore';
import useAuthStore from '@/lib/store/messaging/authStore';
import Spinner from '@/components/custom-ui/modal/custom-spinner';
import Avatar from '@/components/custom-ui/avatar';
import MessageInput from './Messageinput';

const ThreadView = () => {
  const { activeThreadId, threads, setActiveThread, fetchThreadMessages } = useMessageStore();
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch thread messages when thread changes
  useEffect(() => {
    if (activeThreadId) {
      fetchThreadMessages(activeThreadId);
    }
  }, [activeThreadId, fetchThreadMessages]);
  
  // Scroll to bottom when thread messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThreadId, threads]);
  
  // Close thread view
  const handleClose = () => {
    setActiveThread(null);
  };
  
  // If no thread is active, don't render anything
  if (!activeThreadId) {
    return null;
  }
  
  // Get current thread data
  const thread = threads[activeThreadId];
  
  return (
    <div className="w-80 flex flex-col border-l border-gray-200 bg-white">
      {/* Thread header */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center">
          <MessageSquare size={18} className="text-gray-500 mr-2" />
          <h3 className="font-medium">Thread</h3>
        </div>
        <button
          onClick={handleClose}
          className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
        >
          <X size={18} />
        </button>
      </div>
      
      {/* Thread content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!thread ? (
          <div className="h-full flex items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <>
            {/* Parent message */}
            <div className="pb-4 border-b">
              <MessageItem 
                message={thread.parentMessage} 
                isOwnMessage={thread.parentMessage.sender.id === user?.id}
              />
            </div>
            
            {/* Participants */}
            {thread.participants.length > 0 && (
              <div className="pb-3">
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Users size={14} className="mr-1" />
                  <span>{thread.participants.length} {thread.participants.length === 1 ? 'participant' : 'participants'}</span>
                </div>
                <div className="flex -space-x-2 overflow-hidden">
                  {thread.participants.slice(0, 5).map((participant) => (
                    <Avatar
                      key={participant.id}
                      src={participant.avatar}
                      alt={participant.fullName}
                      size="sm"
                      className="border-2 border-white"
                    />
                  ))}
                  {thread.participants.length > 5 && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-xs border-2 border-white">
                      +{thread.participants.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Thread messages */}
            {thread.messages.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p>No replies yet</p>
                <p className="text-sm">Be the first to reply to this thread</p>
              </div>
            ) : (
              <div className="space-y-4">
                {thread.messages.map((message) => (
                  <MessageItem 
                    key={message.id} 
                    message={message} 
                    isOwnMessage={message.sender.id === user?.id}
                  />
                ))}
              </div>
            )}
            
            {/* This div is used to scroll to the bottom */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Thread input */}
      <MessageInput 
        threadId={activeThreadId} 
        placeholder="Reply in thread..." 
      />
    </div>
  );
};

export default ThreadView;