import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Search, Bell, Settings, X, Users, Hash, MessageSquare, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";

import useAuthStore from '@/lib/store/messaging/authStore';
import useMessageStore from '@/lib/store/messaging/messageStore';
import useChannelStore from '@/lib/store/messaging/channelStore';
import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
import useModalStore from '@/lib/store/messaging/modalStore';
import Avatar from '@/components/custom-ui/avatar';
import MessageList from './MessageList';
import MessageInput from './Messageinput';
import ThreadView from './ThreadView';
import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal';
import CreateChannelModal from './CreateChannelModal';
import DirectMessageList from './DirectMessageList';
import ChannelList from './ChannelList';
import { InviteTeamMembersModal } from '@/components/Dashboard/InviteTeamMembersModal';

const MessagingLayout: React.FC = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);

  const { user, logout } = useAuthStore();
  const { activeThreadId } = useMessageStore();
  const { clearSelection: clearChannelSelection } = useChannelStore();
  const { 
    selectedWorkspaceId, 
    workspaces, 
    clearSelection: clearWorkspaceSelection,
    selectWorkspace,
    fetchWorkspaces 
  } = useWorkspaceStore();
  const { openModal } = useModalStore();

  // Initialize socket listeners for messages
  useEffect(() => {
    const messageStore = useMessageStore.getState();
    messageStore.setupSocketListeners();

    return () => {
      messageStore.cleanupSocketListeners();
    };
  }, []);

  // Fetch workspaces on component mount
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Handle clicks outside of the workspace dropdown
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target as Node)) {
      setShowWorkspaceDropdown(false);
    }
  }, []);

  useEffect(() => {
    if (showWorkspaceDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showWorkspaceDropdown, handleClickOutside]);

  // Reset mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle user logout
  const handleLogout = async () => {
    await logout();
    clearChannelSelection();
    clearWorkspaceSelection();
  };

  // Handle opening user profile modal
  const handleOpenProfile = () => {
    setShowUserMenu(false);
    openModal('editProfile');
  };

  // Handle opening invite modal
  const handleOpenInviteModal = () => {
    setIsInviteModalOpen(true);
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
  };

  // Handle workspace selection
  const handleSelectWorkspace = useCallback((workspaceId: string) => {
    selectWorkspace(workspaceId);
    setShowWorkspaceDropdown(false);
  }, [selectWorkspace]);

  // Handle workspace creation
  const handleCreateWorkspace = useCallback(() => {
    setShowWorkspaceDropdown(false);
    openModal('createWorkspace');
  }, [openModal]);

  // Handle workspace settings
  const handleWorkspaceSettings = useCallback((e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation();
    openModal('editWorkspace', { workspaceId });
  }, [openModal]);

  const toggleWorkspaceDropdown = useCallback(() => {
    setShowWorkspaceDropdown(prev => !prev);
  }, []);

  // Get current workspace
  const currentWorkspace = selectedWorkspaceId 
    ? workspaces.find(w => w.id === selectedWorkspaceId)
    : null;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10">
        {/* App Title */}
        <div className="flex items-center min-w-0">
          <div>
            <h1 className="font-semibold text-gray-900 text-2xl">Collaborating Messaging</h1>
            <p className="text-sm text-gray-500 hidden sm:block">Collaborate and communicate</p>
          </div>
        </div>
        
        {/* Header Actions - Only Search and Bell */}
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
            <Search size={20} />
          </button>
          <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
            <Bell size={20} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </button>
        </div>
      </header>
      
      {/* Main content layout */}
      <div className="flex-1 flex overflow-hidden px-3 pt-1 pb-3 sm:px-4 sm:pt-2 sm:pb-4">
        <div className="flex flex-1 max-w-full mx-auto overflow-hidden">
          {/* Options Sidebar */}
          <div
            className={`
              ${isMobileMenuOpen ? 'fixed inset-0 z-50 bg-white' : 'hidden'} 
              md:flex md:flex-col md:w-72
              bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-l-2xl
              border-r-0 md:border-r-2
              overflow-hidden shadow-lg
            `}
          >
            {/* Mobile Close Header */}
            {isMobileMenuOpen && (
              <div className="flex justify-between items-center p-4 border-b border-gray-200 md:hidden bg-white">
                <h3 className="font-semibold text-gray-900">Navigation</h3>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            )}
            
            {currentWorkspace ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Options Content */}
                

                <div className="flex-1 overflow-y-auto">
                  {/* Workspace Header with Dropdown */}
                  <div className="mb-6 relative" ref={workspaceDropdownRef}>
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-x p-4 text-white">
                      <div className="flex items-center h-12">
                        <button
                          onClick={toggleWorkspaceDropdown}
                          className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mr-3 flex-shrink-0 hover:bg-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-500"
                          title="Switch workspace"
                        >
                          {currentWorkspace.logo ? (
                            <img 
                              src={currentWorkspace.logo} 
                              alt={currentWorkspace.name}
                              className="w-full h-full object-cover rounded-lg" 
                            />
                          ) : (
                            <span className="font-bold text-white text-sm">
                              {currentWorkspace.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <h2 className="font-semibold text-white text-lg truncate">
                            {currentWorkspace.name}
                          </h2>
                          <p className="text-white/80 text-sm">Team Workspace</p>
                        </div>
                        <button
                          onClick={toggleWorkspaceDropdown}
                          className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-500"
                        >
                          <ChevronDown 
                            size={18} 
                            className={cn(
                              "transition-transform duration-200",
                              showWorkspaceDropdown && "rotate-180"
                            )}
                          />
                        </button>
                      </div>

                      {/* Workspace Dropdown */}
                      {showWorkspaceDropdown && (
                        <div className="absolute top-full left-4 right-4 mt-2 bg-white border rounded-xl shadow-xl z-50 animate-in slide-in-from-top-1 duration-200">
                          <div className="p-4">
                            <p className="text-xs uppercase text-gray-400 pb-3 font-medium">Workspaces</p>

                            {/* Workspace list */}
                            <div className="max-h-54 overflow-y-auto">
                              {workspaces.map((workspace) => (
                                <div
                                  key={workspace.id}
                                  className={cn(
                                    "flex items-center p-3 rounded-lg mb-2 cursor-pointer group relative transition-all duration-150",
                                    selectedWorkspaceId === workspace.id 
                                      ? "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-sm" 
                                      : "hover:bg-gray-50 hover:shadow-sm"
                                  )}
                                  onClick={() => handleSelectWorkspace(workspace.id)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      handleSelectWorkspace(workspace.id);
                                    }
                                  }}
                                >
                                  <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium mr-3 flex-shrink-0 shadow-md",
                                    selectedWorkspaceId === workspace.id 
                                      ? "bg-gradient-to-br from-blue-500 to-purple-600" 
                                      : "bg-gray-600"
                                  )}>
                                    {workspace.logo ? (
                                      <img 
                                        src={workspace.logo} 
                                        alt={workspace.name} 
                                        className="w-full h-full object-cover rounded-lg"
                                      />
                                    ) : (
                                      workspace.name.substring(0, 2).toUpperCase()
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-gray-900">{workspace.name}</p>
                                    {selectedWorkspaceId === workspace.id && (
                                      <div className="flex items-center mt-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                        <p className="text-xs text-gray-500">Current workspace</p>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Settings button */}
                                  <button 
                                    className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full 
                                              flex items-center justify-center transition-all duration-200 ml-2 flex-shrink-0
                                              focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                    onClick={(e) => handleWorkspaceSettings(e, workspace.id)}
                                    title="Workspace settings"
                                    type="button"
                                  >
                                    <Settings size={14} className="text-gray-300" />
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Create workspace button */}
                            <button
                              type="button"
                              className="w-full mt-4 p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                                       text-white rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-200 
                                       shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              onClick={handleCreateWorkspace}
                            >
                              <span>+ Sign into another workspace</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  

                  {/* Quick Actions */}
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                      Quick Actions
                    </h3>
                    <div className="space-y-2">
                      <button className="flex items-center space-x-3 text-gray-700 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 w-full text-left transition-all duration-200 group">
                        <div className="p-1 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors">
                          <Search size={16} className="text-gray-500 group-hover:text-blue-600" />
                        </div>
                        <span className="font-medium">Search Messages</span>
                      </button>
                      <button className="flex items-center space-x-3 text-gray-700 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 w-full text-left transition-all duration-200 group">
                        <div className="p-1 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors">
                          <Bell size={16} className="text-gray-500 group-hover:text-blue-600" />
                        </div>
                        <span className="font-medium">Notifications</span>
                      </button>
                    </div>
                  </div>

                  {/* Direct Messages */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3 px-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Direct Messages
                      </h3>
                      <button className="p-1 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
                        <MessageSquare size={14} />
                      </button>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-gray-100">
                      <DirectMessageList workspaceId={selectedWorkspaceId} />
                    </div>
                  </div>

                  {/* Channels */}
                  <div>
                    <div className="flex items-center justify-between mb-3 px-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Channels
                      </h3>
                      <button className="p-1 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
                        <Hash size={14} />
                      </button>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-gray-100">
                      <ChannelList workspaceId={selectedWorkspaceId} />
                    </div>
                  </div>
                </div>
                
                {/* Invite Teams Button - Fixed at bottom */}
                <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <button
                    onClick={handleOpenInviteModal}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium w-full shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <Users size={18} />
                    <span>Invite Team Mate</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Settings size={24} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">No workspace selected</h3>
                  <p className="text-gray-500 mb-4 text-sm">Create or select a workspace to get started</p>
                  <button
                    onClick={() => openModal('createWorkspace')}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                  >
                    Create Workspace
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className={`
            flex-1 flex overflow-hidden bg-white border-2 border-gray-200
            ${isMobileMenuOpen ? 'rounded-2xl' : 'md:rounded-r-2xl md:border-l-0 rounded-2xl md:rounded-l-none'}
          `}>
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Mobile Menu Toggle */}
              <div className="md:hidden p-4 border-b border-gray-200">
                <button
                  className="flex items-center text-gray-700 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <Search size={20} />
                  <span className="ml-2 font-medium">Channels & Messages</span>
                </button>
              </div>
              
              {/* Message Area - Fixed layout */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-hidden">
                  <MessageList />
                </div>
                <div className="">
                  <MessageInput />
                </div>
              </div>
            </div>

            {/* Thread View */}
            {activeThreadId && (
              <div className="w-80 lg:w-96 border-l border-gray-200 bg-gray-50">
                <ThreadView />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Modals */}
      <CreateWorkspaceModal />
      <CreateChannelModal />
      <InviteTeamMembersModal 
        isOpen={isInviteModalOpen} 
        onClose={handleCloseInviteModal}
        workspaceId={currentWorkspace?.id || ''} 
      />
    </div>
  );
};

export default MessagingLayout;




































































// import React, { useEffect, useState } from 'react';
// import { Search, Bell, Settings, LogOut, X } from 'lucide-react';

// import useAuthStore from '@/lib/store/messaging/authStore';
// import useMessageStore from '@/lib/store/messaging/messageStore';
// import useChannelStore from '@/lib/store/messaging/channelStore';
// import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
// import useModalStore from '@/lib/store/messaging/modalStore';
// import Avatar from '@/components/custom-ui/avatar';
// import MessageList from './MessageList';
// import MessageInput from './Messageinput';
// import ThreadView from './ThreadView';
// import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal';
// import CreateChannelModal from './CreateChannelModal';
// import DirectMessageList from './DirectMessageList';
// import ChannelList from './ChannelList';
// import WorkspaceSelector from '@/components/WorkspaceSelector';

// const MessagingLayout: React.FC = () => {
//   const [showUserMenu, setShowUserMenu] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//   const { user, logout } = useAuthStore();
//   const { activeThreadId } = useMessageStore();
//   const { clearSelection: clearChannelSelection } = useChannelStore();
//   const { selectedWorkspaceId, workspaces, clearSelection: clearWorkspaceSelection } = useWorkspaceStore();
//   const { openModal } = useModalStore();

//   // Initialize socket listeners for messages
//   useEffect(() => {
//     const messageStore = useMessageStore.getState();
//     messageStore.setupSocketListeners();

//     return () => {
//       messageStore.cleanupSocketListeners();
//     };
//   }, []);

//   // Reset mobile menu on window resize
//   useEffect(() => {
//     const handleResize = () => {
//       if (window.innerWidth >= 768) {
//         setIsMobileMenuOpen(false);
//       }
//     };

//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   // Handle user logout
//   const handleLogout = async () => {
//     await logout();
//     clearChannelSelection();
//     clearWorkspaceSelection();
//   };

//   // Handle opening user profile modal
//   const handleOpenProfile = () => {
//     setShowUserMenu(false);
//     openModal('editProfile');
//   };

//   // Get current workspace
//   const currentWorkspace = selectedWorkspaceId 
//     ? workspaces.find(w => w.id === selectedWorkspaceId)
//     : null;

//   return (
//     <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
//       {/* Header */}
//       <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10">
//         {/* Workspace Info */}
//         <div className="flex items-center min-w-0">
//           {currentWorkspace && (
//             <div className="flex items-center">
//               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-lg">
//                 {currentWorkspace.logo ? (
//                   <img 
//                     src={currentWorkspace.logo} 
//                     alt={currentWorkspace.name} 
//                     className="w-full h-full object-cover rounded-xl" 
//                   />
//                 ) : (
//                   <span className="font-bold text-white text-sm">
//                     {currentWorkspace.name.substring(0, 2).toUpperCase()}
//                   </span>
//                 )}
//               </div>
//               <div>
//                 <h1 className="font-semibold text-gray-900 truncate text-lg">
//                   {currentWorkspace.name}
//                 </h1>
//                 <p className="text-sm text-gray-500">Workspace</p>
//               </div>
//             </div>
//           )}
//         </div>
        
//         {/* Header Actions */}
//         <div className="flex items-center space-x-2">
//           <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200">
//             <Search size={20} />
//           </button>
//           <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200">
//             <Bell size={20} />
//             <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
//           </button>
          
//           {/* Replace User Menu with WorkspaceSelector */}
//           <div className="relative">
//             <WorkspaceSelector 
//               isCollapsed={false} 
//               isMobile={false}
//             />
//           </div>
//         </div>
//       </header>
      
//       {/* Main content layout */}
//       <div className="flex-1 flex overflow-hidden px-3 pt-1 pb-3 sm:px-4 sm:pt-2 sm:pb-4">
//         <div className="flex flex-1 max-w-full mx-auto overflow-hidden">
//           {/* Options Sidebar */}
//           <div
//             className={`
//               ${isMobileMenuOpen ? 'fixed inset-0 z-50 bg-white' : 'hidden'} 
//               md:flex md:flex-col md:w-64
//               bg-white border-2 border-gray-200 rounded-l-2xl
//               border-r-0 md:border-r-2
//               overflow-hidden
//             `}
//           >
//             {/* Mobile Close Header */}
//             {isMobileMenuOpen && (
//               <div className="flex justify-between items-center p-4 border-b border-gray-200 md:hidden">
//                 <h3 className="font-semibold text-gray-900">Navigation</h3>
//                 <button
//                   onClick={() => setIsMobileMenuOpen(false)}
//                   className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
//                 >
//                   <X size={24} />
//                 </button>
//               </div>
//             )}
            
//             {currentWorkspace ? (
//               <div className="flex-1 flex flex-col overflow-hidden">
//                 {/* Options Content */}
//                 <div className="flex-1 px-3 pt-1 pb-3 sm:px-4 sm:pt-2 sm:pb-4 overflow-y-auto">
//                   {/* Quick Actions */}
//                   <div className="mb-6">
//                     <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
//                       Quick Actions
//                     </h2>
//                     <div className="space-y-1">
//                       <button className="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-gray-100 w-full text-left transition-colors">
//                         <Search size={18} className="text-gray-500" />
//                         <span className="font-medium">Search</span>
//                       </button>
//                       <button className="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-gray-100 w-full text-left transition-colors">
//                         <Bell size={18} className="text-gray-500" />
//                         <span className="font-medium">Announcements</span>
//                       </button>
//                     </div>
//                   </div>

//                   {/* Direct Messages */}
//                   <div className="mb-6">
//                     <DirectMessageList workspaceId={selectedWorkspaceId} />
//                   </div>

//                   {/* Channels */}
//                   <div>
//                     <ChannelList workspaceId={selectedWorkspaceId} />
//                   </div>
//                 </div>
                
//                 {/* Create Workspace Button - Fixed at bottom */}
//                 <div className="p-6 border-t border-gray-200">
//                   <button
//                     onClick={() => openModal('createWorkspace')}
//                     className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium w-full"
//                   >
//                     Create Workspace
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <div className="flex-1 flex items-center justify-center p-6">
//                 <div className="text-center">
//                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
//                     <Settings size={24} className="text-gray-400" />
//                   </div>
//                   <h3 className="font-semibold text-gray-900 mb-2">No workspace selected</h3>
//                   <p className="text-gray-500 mb-4 text-sm">Create or select a workspace to get started</p>
//                   <button
//                     onClick={() => openModal('createWorkspace')}
//                     className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
//                   >
//                     Create Workspace
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Main Chat Area */}
//           <div className={`
//             flex-1 flex overflow-hidden bg-white border-2 border-gray-200
//             ${isMobileMenuOpen ? 'rounded-2xl' : 'md:rounded-r-2xl md:border-l-0 rounded-2xl md:rounded-l-none'}
//           `}>
//             <div className="flex-1 flex flex-col overflow-hidden">
//               {/* Mobile Menu Toggle */}
//               <div className="md:hidden p-4 border-b border-gray-200">
//                 <button
//                   className="flex items-center text-gray-700 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
//                   onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//                 >
//                   <Search size={20} />
//                   <span className="ml-2 font-medium">Channels & Messages</span>
//                 </button>
//               </div>
              
//               {/* Message Area - Centered */}
//               <div className="flex flex-col justify-center overflow-hidden">
//                 <div className="flex-1 items-center justify-center overflow-hidden">
//                   <MessageList />
//                 </div>
//                 <div className="">
//                   <MessageInput />
//                 </div>
//               </div>
//             </div>

//             {/* Thread View */}
//             {activeThreadId && (
//               <div className="w-80 lg:w-96 border-l border-gray-200 bg-gray-50">
//                 <ThreadView />
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Mobile Overlay */}
//       {isMobileMenuOpen && (
//         <div 
//           className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm"
//           onClick={() => setIsMobileMenuOpen(false)}
//         />
//       )}

//       {/* Modals */}
//       <CreateWorkspaceModal />
//       <CreateChannelModal />
//     </div>
//   );
// };

// export default MessagingLayout;



























































// Daniel Design
// import React, { useEffect, useState } from 'react';
// import { Search, Bell, Settings, LogOut, X } from 'lucide-react';

// import useAuthStore from '@/lib/store/messaging/authStore';
// import useMessageStore from '@/lib/store/messaging/messageStore';
// import useChannelStore from '@/lib/store/messaging/channelStore';
// import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
// import useModalStore from '@/lib/store/messaging/modalStore';
// import Avatar from '@/components/custom-ui/avatar';
// import MessageList from './MessageList';
// import MessageInput from './Messageinput';
// import ThreadView from './ThreadView';
// import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal';
// import CreateChannelModal from './CreateChannelModal';
// import DirectMessageList from './DirectMessageList';
// import ChannelList from './ChannelList';

// const MessagingLayout: React.FC = () => {
//   const [showUserMenu, setShowUserMenu] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//   const { user, logout } = useAuthStore();
//   const { activeThreadId } = useMessageStore();
//   const { clearSelection: clearChannelSelection } = useChannelStore();
//   const { selectedWorkspaceId, workspaces, clearSelection: clearWorkspaceSelection } = useWorkspaceStore();
//   const { openModal } = useModalStore();

//   // Initialize socket listeners for messages
//   useEffect(() => {
//     const messageStore = useMessageStore.getState();
//     messageStore.setupSocketListeners();

//     return () => {
//       messageStore.cleanupSocketListeners();
//     };
//   }, []);

//   // Reset mobile menu on window resize
//   useEffect(() => {
//     const handleResize = () => {
//       if (window.innerWidth >= 768) {
//         setIsMobileMenuOpen(false);
//       }
//     };

//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   // Handle user logout
//   const handleLogout = async () => {
//     await logout();
//     clearChannelSelection();
//     clearWorkspaceSelection();
//   };

//   // Handle opening user profile modal
//   const handleOpenProfile = () => {
//     setShowUserMenu(false);
//     openModal('editProfile');
//   };

//   // Get current workspace
//   const currentWorkspace = selectedWorkspaceId 
//     ? workspaces.find(w => w.id === selectedWorkspaceId)
//     : null;

//   return (
//     <div className="h-screen flex flex-col overflow-hidden">
//       {/* Header */}
//       <header className="h-16 bg-white mt-1 border-gray-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10">
//         {/* Workspace Info */}
//         <div className="flex items-center min-w-0">
//           {currentWorkspace && (
//             <div className="flex items-center">
//               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
//                 {currentWorkspace.logo ? (
//                   <img 
//                     src={currentWorkspace.logo} 
//                     alt={currentWorkspace.name} 
//                     className="w-full h-full object-cover rounded-lg" 
//                   />
//                 ) : (
//                   <span className="font-semibold text-white text-sm">
//                     {currentWorkspace.name.substring(0, 2).toUpperCase()}
//                   </span>
//                 )}
//               </div>
//               <h1 className="font-semibold text-gray-900 truncate text-lg">
//                 {currentWorkspace.name}
//               </h1>
//             </div>
//           )}
//         </div>
        
       
//       </header>
      
//       {/* Main content layout with borders */}
//       <div className="flex-1 flex overflow-hidden px-3 pt-1 pb-3 sm:px-4 sm:pt-2 sm:pb-4">
//         <div className="flex flex-1 max-w-full mx-auto overflow-hidden">
//           {/* Options Sidebar - Left section with left-rounded border */}
//           <div
//             className={`
//               ${isMobileMenuOpen ? 'fixed inset-0 z-50 bg-white' : 'hidden'} 
//               md:flex md:flex-col md:w-64
//               bg-white border-2 border-gray-200 rounded-l-2xl
//               border-r-0 md:border-r-2
//               overflow-hidden
//             `}
//           >
//             {/* Mobile Close Header */}
//             {isMobileMenuOpen && (
//               <div className="flex justify-between items-center p-4 border-b border-gray-200 md:hidden">
//                 <h3 className="font-semibold text-gray-900">Navigation</h3>
//                 <button
//                   onClick={() => setIsMobileMenuOpen(false)}
//                   className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
//                 >
//                   <X size={24} />
//                 </button>
//               </div>
//             )}
            
//             {currentWorkspace ? (
//               <div className="flex-1 flex flex-col overflow-hidden">
//                 {/* Options Content */}
//                 <div className="flex-1 px-3 pt-1 pb-3 sm:px-4 sm:pt-2 sm:pb-4 overflow-y-auto">
//                   {/* Quick Actions */}
//                   <div className="mb-6">
//                     <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
//                       Quick Actions
//                     </h2>
//                     <div className="space-y-1">
//                       <button className="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-gray-100 w-full text-left transition-colors">
//                         <Search size={18} className="text-gray-500" />
//                         <span className="font-medium">Search</span>
//                       </button>
//                       <button className="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-gray-100 w-full text-left transition-colors">
//                         <Bell size={18} className="text-gray-500" />
//                         <span className="font-medium">Announcements</span>
//                       </button>
//                     </div>
//                   </div>

//                   {/* Direct Messages */}
//                   <div className="mb-6">
//                     <DirectMessageList workspaceId={selectedWorkspaceId} />
//                   </div>

//                   {/* Channels */}
//                   <div>
//                     <ChannelList workspaceId={selectedWorkspaceId} />
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               <div className="flex-1 flex items-center justify-center p-6">
//                 <div className="text-center">
//                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
//                     <Settings size={24} className="text-gray-400" />
//                   </div>
//                   <h3 className="font-semibold text-gray-900 mb-2">No workspace selected</h3>
//                   <p className="text-gray-500 mb-4 text-sm">Create or select a workspace to get started</p>
//                   <button
//                     onClick={() => openModal('createWorkspace')}
//                     className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
//                   >
//                     Create Workspace
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Main Chat Area - Right section with right-rounded border */}
//           <div className={`
//             flex-1 flex overflow-hidden bg-white border-2 border-gray-200
//             ${isMobileMenuOpen ? 'rounded-2xl' : 'md:rounded-r-2xl md:border-l-0 rounded-2xl md:rounded-l-none'}
//           `}>
//             <div className="flex-1 flex flex-col overflow-hidden">
//               {/* Mobile Menu Toggle */}
//               <div className="md:hidden p-4 border-b border-gray-200">
//                 <button
//                   className="flex items-center text-gray-700 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
//                   onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//                 >
//                   <Search size={20} />
//                   <span className="ml-2 font-medium">Channels & Messages</span>
//                 </button>
//               </div>
              
//               {/* Message Area - Centered */}
//               <div className="flex flex-col justify-center overflow-hidden">
//                 <div className="flex-1 items-center justify-center overflow-hidden">
//                   {/* <MessageList /> */}
//                 </div>
//                 <div className="bottom-0 border-t border-gray-200">
//                   <MessageInput />
//                 </div>
//               </div>
//             </div>

//             {/* Thread View */}
//             {activeThreadId && (
//               <div className="w-80 lg:w-96 border-l border-gray-200 bg-gray-50">
//                 <ThreadView />
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Mobile Overlay */}
//       {isMobileMenuOpen && (
//         <div 
//           className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
//           onClick={() => setIsMobileMenuOpen(false)}
//         />
//       )}

//       {/* Modals */}
//       <CreateWorkspaceModal />
//       <CreateChannelModal />
//     </div>
//   );
// };

// export default MessagingLayout;

















































// import React, { useEffect, useState } from 'react';
// import { Search, Bell, Settings, LogOut, X } from 'lucide-react';


// import useAuthStore from '@/lib/store/messaging/authStore';
// import useMessageStore from '@/lib/store/messaging/messageStore';
// import useChannelStore from '@/lib/store/messaging/channelStore';
// import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
// import useModalStore from '@/lib/store/messaging/modalStore';
// import Avatar from '@/components/custom-ui/avatar';
// import MessageList from './MessageList';
// import MessageInput from './Messageinput';
// import ThreadView from './ThreadView';
// import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal';
// import CreateChannelModal from './CreateChannelModal';
// import DirectMessageList from './DirectMessageList';
// import ChannelList from './ChannelList';
// // import WorkspaceSidebar from '../workspace/WorkspaceSidebar';

// const MessagingLayout: React.FC = () => {
//   const [showUserMenu, setShowUserMenu] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

//   const { user, logout } = useAuthStore();
//   const { activeThreadId } = useMessageStore();
//   const { clearSelection: clearChannelSelection } = useChannelStore();
//   const { selectedWorkspaceId, workspaces, clearSelection: clearWorkspaceSelection } = useWorkspaceStore();
//   const { openModal } = useModalStore();

//   // Initialize socket listeners for messages
//   useEffect(() => {
//     const messageStore = useMessageStore.getState();
//     messageStore.setupSocketListeners();

//     return () => {
//       messageStore.cleanupSocketListeners();
//     };
//   }, []);

//   // Reset mobile menu on window resize
//   useEffect(() => {
//     const handleResize = () => {
//       if (window.innerWidth >= 768) {
//         setIsMobileMenuOpen(false);
//         setIsMobileSidebarOpen(false);
//       }
//     };

//     window.addEventListener('resize', handleResize);

//     return () => {
//       window.removeEventListener('resize', handleResize);
//     };
//   }, []);

//   // Handle user logout
//   const handleLogout = async () => {
//     await logout();
//     clearChannelSelection();
//     clearWorkspaceSelection();
//   };

//   // Handle opening user profile modal
//   const handleOpenProfile = () => {
//     setShowUserMenu(false);
//     openModal('editProfile');
//   };

//   // Get current workspace
//   const currentWorkspace = selectedWorkspaceId 
//     ? workspaces.find(w => w.id === selectedWorkspaceId)
//     : null;

//   return (
//     <div className="h-screen flex overflow-hidden">
//       {/* Mobile workspace sidebar toggle */}
//       {/* <button
//         className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-200 text-white rounded"
//         onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
//       >
//         {isMobileSidebarOpen ? <X size={20} /> : <img src="/logo-small.svg" alt="Logo" className="w-5 h-5" />}
//       </button> */}

//       {/* Workspace sidebar - can be toggled on mobile */}
//       {/* This is the sidebar in black colour */}
//       {/* <div className={`
//         ${isMobileSidebarOpen ? 'block' : 'hidden'} 
//         md:block h-full
//       `}>
//         <WorkspaceSidebar />
//       </div> */}
      
//       {/* Main content area the content for messaging*/}
//       <div className="flex-1 flex flex-col h-full">
//         {/* Header */}
//         <header className="h-16 bg-white border-b flex items-center justify-between px-4">
//           {/* MU and Name Text */}
//           <div className="flex items-center">
//             {currentWorkspace && (
//               <div className="flex items-center">
//                 <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center mr-3">
//                   {currentWorkspace.logo ? (
//                     <img src={currentWorkspace.logo} alt={currentWorkspace.name} className="w-full h-full object-cover rounded" />
//                   ) : (
//                     <span className="font-semibold text-gray-700">
//                       {currentWorkspace.name.substring(0, 2).toUpperCase()}
//                     </span>
//                   )}
//                 </div>
//                 <h1 className="font-semibold text-gray-800">{currentWorkspace.name}</h1>
//               </div>
//             )}
//           </div>
          
//           <div className="flex items-center space-x-4">
//             <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
//               <Search size={20} />
//             </button>
//             <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
//               <Bell size={20} />
//             </button>
            
//             {/* User profile dropdown */}
//             <div className="relative">
//               <button
//                 onClick={() => setShowUserMenu(!showUserMenu)}
//                 className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-md"
//               >
//                 <Avatar
//                   src={user?.avatar}
//                   alt={user?.fullName || 'User'}
//                   size="sm"
//                   status="online"
//                 />
//               </button>
              
//               {showUserMenu && (
//                 <div className="absolute top-12 right-0 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
//                   <div className="p-3 border-b">
//                     <p className="font-medium">{user?.fullName}</p>
//                     <p className="text-xs text-gray-500">@{user?.username}</p>
//                   </div>
//                   <button
//                     onClick={handleOpenProfile}
//                     className="flex items-center w-full p-3 hover:bg-gray-100 text-left"
//                   >
//                     <Settings size={16} className="mr-2 text-gray-500" />
//                     <span>Settings</span>
//                   </button>
//                   <button
//                     onClick={handleLogout}
//                     className="flex items-center w-full p-3 hover:bg-gray-100 text-left border-t"
//                   >
//                     <LogOut size={16} className="mr-2 text-gray-500" />
//                     <span>Logout</span>
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </header>
        
//         {/* Main content layout */}
//         <div className="flex-1 flex overflow-hidden">
//           {/* Sidebar - hidden on mobile unless opened */}
//           <div
//             className={`
//               ${isMobileMenuOpen ? 'block w-full absolute inset-0 z-40 bg-white' : 'hidden'} 
//               md:relative md:block md:w-64 md:bg-white md:border-r
//             `}
//           >
//             {/* Close button for mobile */}
//             {isMobileMenuOpen && (
//               <div className="flex justify-between items-center p-4 border-b">
//                 <h3 className="font-semibold">Navigation</h3>
//                 <button
//                   onClick={() => setIsMobileMenuOpen(false)}
//                   className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
//                 >
//                   <X size={24} />
//                 </button>
//               </div>
//             )}
            
//             {currentWorkspace ? (
//               <>
//                 {/* Options section */}
//                 <div className="h-screen p-4 border-x-2 border-l-2 rounded-md">
//                   <div className="mb-4">
//                     <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Options</h2>
//                     <button className="flex items-center space-x-2 text-gray-700 p-2 rounded-md hover:bg-gray-100 w-full text-left">
//                       <Search size={18} className="text-gray-500" />
//                       <span>Search</span>
//                     </button>
//                     <button className="flex items-center space-x-2 text-gray-700 p-2 rounded-md hover:bg-gray-100 w-full text-left">
//                       <Bell size={18} className="text-gray-500" />
//                       <span>Announcement</span>
//                     </button>
//                   </div>

//                   {/* Direct Messages section */}
//                   <div className="mb-6">
//                     <DirectMessageList workspaceId={selectedWorkspaceId} />
//                   </div>

//                   {/* Channels section */}
//                   <div>
//                     <ChannelList workspaceId={selectedWorkspaceId} />
//                   </div>
//                 </div>
//               </>
//             ) : (
//               <div className="flex h-full items-center justify-center">
//                 <div className="text-center p-4">
//                   <p className="text-gray-500 mb-4">No workspace selected</p>
//                   <button
//                     onClick={() => openModal('createWorkspace')}
//                     className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
//                   >
//                     Create a Workspace
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Main chat area */}
//           <div className="flex-1 flex overflow-hidden">
//             <div className="flex-1 flex flex-col">
//               {/* Mobile menu toggle */}
//               <div className="md:hidden p-4 border-b">
//                 <button
//                   className="text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100"
//                   onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//                 >
//                   <Search size={20} />
//                   <span className="ml-2">Channels & Messages</span>
//                 </button>
//               </div>
              
//               {/* Message list and input */}
//               <div className="flex-1 flex flex-col overflow-hidden">
//                 <MessageList />
//                 <MessageInput />
//               </div>
//             </div>

//             {/* Thread view */}
//             {activeThreadId && <ThreadView />}
//           </div>
//         </div>
//       </div>

//       {/* Modals */}
//       <CreateWorkspaceModal />
//       <CreateChannelModal />
//     </div>
//   );
// };

// export default MessagingLayout;