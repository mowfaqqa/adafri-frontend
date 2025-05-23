import React, { useEffect, useState } from 'react';
import { Search, Bell, Settings, LogOut, X } from 'lucide-react';

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

const MessagingLayout: React.FC = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { user, logout } = useAuthStore();
  const { activeThreadId } = useMessageStore();
  const { clearSelection: clearChannelSelection } = useChannelStore();
  const { selectedWorkspaceId, workspaces, clearSelection: clearWorkspaceSelection } = useWorkspaceStore();
  const { openModal } = useModalStore();

  // Initialize socket listeners for messages
  useEffect(() => {
    const messageStore = useMessageStore.getState();
    messageStore.setupSocketListeners();

    return () => {
      messageStore.cleanupSocketListeners();
    };
  }, []);

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

  // Get current workspace
  const currentWorkspace = selectedWorkspaceId 
    ? workspaces.find(w => w.id === selectedWorkspaceId)
    : null;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white mt-1 border-gray-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10">
        {/* Workspace Info */}
        <div className="flex items-center min-w-0">
          {currentWorkspace && (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
                {currentWorkspace.logo ? (
                  <img 
                    src={currentWorkspace.logo} 
                    alt={currentWorkspace.name} 
                    className="w-full h-full object-cover rounded-lg" 
                  />
                ) : (
                  <span className="font-semibold text-white text-sm">
                    {currentWorkspace.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <h1 className="font-semibold text-gray-900 truncate text-lg">
                {currentWorkspace.name}
              </h1>
            </div>
          )}
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors">
            <Search size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors">
            <Bell size={20} />
          </button>
          
          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <Avatar
                src={user?.avatar}
                alt={user?.fullName || 'User'}
                size="sm"
                status="online"
              />
            </button>
            
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute top-12 right-0 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">{user?.fullName}</p>
                    <p className="text-sm text-gray-500">@{user?.username}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleOpenProfile}
                      className="flex items-center w-full px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                    >
                      <Settings size={16} className="mr-3 text-gray-500" />
                      <span className="text-gray-700">Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 hover:bg-gray-50 text-left border-t border-gray-100 transition-colors"
                    >
                      <LogOut size={16} className="mr-3 text-gray-500" />
                      <span className="text-gray-700">Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      
      {/* Main content layout with borders */}
      <div className="flex-1 flex overflow-hidden px-3 pt-1 pb-3 sm:px-4 sm:pt-2 sm:pb-4">
        <div className="flex flex-1 max-w-full mx-auto overflow-hidden">
          {/* Options Sidebar - Left section with left-rounded border */}
          <div
            className={`
              ${isMobileMenuOpen ? 'fixed inset-0 z-50 bg-white' : 'hidden'} 
              md:flex md:flex-col md:w-64
              bg-white border-2 border-gray-200 rounded-l-2xl
              border-r-0 md:border-r-2
              overflow-hidden
            `}
          >
            {/* Mobile Close Header */}
            {isMobileMenuOpen && (
              <div className="flex justify-between items-center p-4 border-b border-gray-200 md:hidden">
                <h3 className="font-semibold text-gray-900">Navigation</h3>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            )}
            
            {currentWorkspace ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Options Content */}
                <div className="flex-1 px-3 pt-1 pb-3 sm:px-4 sm:pt-2 sm:pb-4 overflow-y-auto">
                  {/* Quick Actions */}
                  <div className="mb-6">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Quick Actions
                    </h2>
                    <div className="space-y-1">
                      <button className="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-gray-100 w-full text-left transition-colors">
                        <Search size={18} className="text-gray-500" />
                        <span className="font-medium">Search</span>
                      </button>
                      <button className="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-gray-100 w-full text-left transition-colors">
                        <Bell size={18} className="text-gray-500" />
                        <span className="font-medium">Announcements</span>
                      </button>
                    </div>
                  </div>

                  {/* Direct Messages */}
                  <div className="mb-6">
                    <DirectMessageList workspaceId={selectedWorkspaceId} />
                  </div>

                  {/* Channels */}
                  <div>
                    <ChannelList workspaceId={selectedWorkspaceId} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Settings size={24} className="text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">No workspace selected</h3>
                  <p className="text-gray-500 mb-4 text-sm">Create or select a workspace to get started</p>
                  <button
                    onClick={() => openModal('createWorkspace')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Create Workspace
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Chat Area - Right section with right-rounded border */}
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
              
              {/* Message Area - Centered */}
              <div className="flex-1 flex flex-col justify-center overflow-hidden">
                <div className="flex-1 flex items-center justify-center overflow-hidden">
                  <MessageList />
                </div>
                <div className="border-t border-gray-200">
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
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Modals */}
      <CreateWorkspaceModal />
      <CreateChannelModal />
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