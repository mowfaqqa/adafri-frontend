import React, { useEffect, useRef, useState } from 'react';
import { X, MessageSquare, Users, ArrowDown, Sparkles, Clock, Eye } from 'lucide-react';

import MessageItem from './MessageItem';
import useMessageStore from '@/lib/store/messaging/messageStore';
import useAuthStore from '@/lib/store/messaging/authStore';
import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
import Spinner from '@/components/custom-ui/modal/custom-spinner';
import Avatar from '@/components/custom-ui/avatar';
import MessageInput from './Messageinput';

const ThreadView: React.FC = () => {
  const { activeThreadId, threads, setActiveThread, fetchThreadMessages } = useMessageStore();
  const { user } = useAuthStore();
  const { selectedWorkspaceId } = useWorkspaceStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // State for scroll arrow visibility
  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  
  // Fetch thread messages when thread changes
  useEffect(() => {
    if (selectedWorkspaceId && activeThreadId) {
      fetchThreadMessages(selectedWorkspaceId, activeThreadId);
    }
  }, [selectedWorkspaceId, activeThreadId, fetchThreadMessages]);
  
  // Scroll to bottom when thread messages change
  useEffect(() => {
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThreadId, threads, isNearBottom]);
  
  // Handle scroll events to show/hide scroll arrow
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // Show arrow when user has scrolled up more than 100px from bottom
      setShowScrollArrow(scrollFromBottom > 100);
      setIsNearBottom(scrollFromBottom < 50);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close thread view
  const handleClose = () => {
    setActiveThread(selectedWorkspaceId || '', null);
  };
  
  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // If no thread is active or no workspace selected, don't render anything
  if (!activeThreadId || !selectedWorkspaceId) {
    return null;
  }
  
  // Get current thread data
  const thread = selectedWorkspaceId && threads[selectedWorkspaceId] 
    ? threads[selectedWorkspaceId][activeThreadId] 
    : undefined;
  
  return (
    <div className="w-100 h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-l-2 border-gradient-to-b from-blue-200 to-purple-200 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-100/40 to-pink-100/40 rounded-full blur-2xl"></div>
      
      {/* Thread header with enhanced design */}
      <div className="relative z-10 flex justify-between items-center p-4 border-b border-white/60 bg-white/80 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <MessageSquare size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Thread Discussion</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Sparkles size={12} className="text-yellow-500" />
              <span>Active conversation</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-white/60 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Thread content with enhanced styling */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 relative custom-scrollbar min-h-0"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 transparent',
          maxHeight: 'calc(100vh - 200px)' // Ensure it doesn't overflow the container
        }}
      >
        {!thread ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Spinner size="sm" />
              </div>
              <p className="text-gray-500 font-medium">Loading thread...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Parent message with enhanced card design */}
            <div className="relative">
              <div className="absolute -left-2 top-0 w-1 h-full bg-gradient-to-b from-blue-400 to-purple-500 rounded-full"></div>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-xs font-semibold rounded-full">
                    Original Message
                  </div>
                  <Clock size={12} className="text-gray-400" />
                </div>
                <MessageItem 
                  message={thread.parentMessage} 
                  isOwnMessage={thread.parentMessage.sender.id === user?.id}
                />
              </div>
            </div>
            
            {/* Participants section with enhanced design */}
            {thread.participants.length > 0 && (
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-white/40 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg">
                      <Users size={14} className="text-white" />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">
                        {thread.participants.length} {thread.participants.length === 1 ? 'Participant' : 'Participants'}
                      </span>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Eye size={10} />
                        <span>Active in this thread</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {thread.participants.slice(0, 5).map((participant, index) => (
                    <div 
                      key={participant.id}
                      className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-3 py-2 border border-white/40 hover:bg-white/80 transition-all duration-200"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <Avatar
                        src={participant.avatar}
                        alt={participant.fullName}
                        size="sm"
                        className="border-2 border-white shadow-sm"
                      />
                      <span className="text-sm font-medium text-gray-700 truncate max-w-20">
                        {participant.fullName}
                      </span>
                    </div>
                  ))}
                  {thread.participants.length > 5 && (
                    <div className="flex items-center justify-center min-w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 text-xs font-bold border-2 border-white shadow-sm">
                      +{thread.participants.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Thread messages with enhanced styling */}
            {thread.messages.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={24} className="text-blue-500" />
                </div>
                <h3 className="font-semibold text-gray-700 mb-2">Start the conversation</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  Be the first to reply and get this thread going!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {thread.messages.map((message, index) => (
                  <div 
                    key={message.id}
                    className="transform transition-all duration-300 animate-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-md hover:shadow-lg hover:bg-white/70 transition-all duration-200">
                      <MessageItem 
                        message={message} 
                        isOwnMessage={message.sender.id === user?.id}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* This div is used to scroll to the bottom */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Scroll to bottom arrow with enhanced design */}
      {showScrollArrow && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 z-20 p-3 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 animate-bounce"
          title="Scroll to bottom"
        >
          <ArrowDown size={20} />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-lg opacity-60 -z-10"></div>
        </button>
      )}
      
      {/* Thread input with enhanced styling */}
      <div className="relative z-10 bg-white/80 backdrop-blur-xl border-t border-white/60 p-3 flex-shrink-0">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg overflow-hidden">
          <MessageInput 
            threadId={activeThreadId} 
            placeholder="Share your thoughts in this thread..." 
          />
        </div>
      </div>
      
      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3B82F6, #8B5CF6);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563EB, #7C3AED);
        }
        @keyframes animate-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation: animate-in 0.3s ease-out forwards;
        }
        .slide-in-from-bottom-2 {
          animation: slideInFromBottom 0.4s ease-out;
        }
        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ThreadView;



























































// August 1
// import React, { useEffect, useRef } from 'react';
// import { X, MessageSquare, Users } from 'lucide-react';

// import MessageItem from './MessageItem';
// import useMessageStore from '@/lib/store/messaging/messageStore';
// import useAuthStore from '@/lib/store/messaging/authStore';
// import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
// import Spinner from '@/components/custom-ui/modal/custom-spinner';
// import Avatar from '@/components/custom-ui/avatar';
// import MessageInput from './Messageinput';

// const ThreadView: React.FC = () => {
//   const { activeThreadId, threads, setActiveThread, fetchThreadMessages } = useMessageStore();
//   const { user } = useAuthStore();
//   const { selectedWorkspaceId } = useWorkspaceStore();
//   const messagesEndRef = useRef<HTMLDivElement>(null);
  
//   // Fetch thread messages when thread changes
//   useEffect(() => {
//     if (selectedWorkspaceId && activeThreadId) {
//       fetchThreadMessages(selectedWorkspaceId, activeThreadId);
//     }
//   }, [selectedWorkspaceId, activeThreadId, fetchThreadMessages]);
  
//   // Scroll to bottom when thread messages change
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [activeThreadId, threads]);
  
//   // Close thread view
//   const handleClose = () => {
//     setActiveThread(selectedWorkspaceId || '', null);
//   };
  
//   // If no thread is active or no workspace selected, don't render anything
//   if (!activeThreadId || !selectedWorkspaceId) {
//     return null;
//   }
  
//   // Get current thread data
//   const thread = selectedWorkspaceId && threads[selectedWorkspaceId] 
//     ? threads[selectedWorkspaceId][activeThreadId] 
//     : undefined;
  
//   return (
//     <div className="w-100 flex flex-col border-l border-gray-200">
//       {/* Thread header */}
//       <div className="flex justify-between items-center p-4 border-b">
//         <div className="flex items-center">
//           <MessageSquare size={18} className="text-gray-500 mr-2" />
//           <h3 className="font-medium">Thread</h3>
//         </div>
//         <button
//           onClick={handleClose}
//           className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
//         >
//           <X size={18} />
//         </button>
//       </div>
      
//       {/* Thread content */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-4">
//         {!thread ? (
//           <div className="h-full flex items-center justify-center">
//             <Spinner size="sm" />
//           </div>
//         ) : (
//           <>
//             {/* Parent message */}
//             <div className="pb-4 border-b">
//               <MessageItem 
//                 message={thread.parentMessage} 
//                 isOwnMessage={thread.parentMessage.sender.id === user?.id}
//               />
//             </div>
            
//             {/* Participants */}
//             {thread.participants.length > 0 && (
//               <div className="pb-3">
//                 <div className="flex items-center text-xs text-gray-500 mb-2">
//                   <Users size={14} className="mr-1" />
//                   <span>{thread.participants.length} {thread.participants.length === 1 ? 'participant' : 'participants'}</span>
//                 </div>
//                 <div className="flex -space-x-2 overflow-hidden">
//                   {thread.participants.slice(0, 5).map((participant) => (
//                     <Avatar
//                       key={participant.id}
//                       src={participant.avatar}
//                       alt={participant.fullName}
//                       size="sm"
//                       className="border-2 border-white"
//                     />
//                   ))}
//                   {thread.participants.length > 5 && (
//                     <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-xs border-2 border-white">
//                       +{thread.participants.length - 5}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
            
//             {/* Thread messages */}
//             {thread.messages.length === 0 ? (
//               <div className="py-8 text-center text-gray-500">
//                 <p>No replies yet</p>
//                 <p className="text-sm">Be the first to reply to this thread</p>
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 {thread.messages.map((message) => (
//                   <MessageItem 
//                     key={message.id} 
//                     message={message} 
//                     isOwnMessage={message.sender.id === user?.id}
//                   />
//                 ))}
//               </div>
//             )}
            
//             {/* This div is used to scroll to the bottom */}
//             <div ref={messagesEndRef} />
//           </>
//         )}
//       </div>
      
//       {/* Thread input */}
//       <MessageInput 
//         threadId={activeThreadId} 
//         placeholder="Reply in thread..." 
//       />
//     </div>
//   );
// };

// export default ThreadView;