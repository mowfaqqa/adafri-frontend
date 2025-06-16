// import React, { useEffect } from 'react';
// import { Plus, Settings } from 'lucide-react';
// import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
// import useModalStore from '@/lib/store/messaging/modalStore';
// import useAuthStore from '@/lib/store/messaging/authStore';
// import Avatar from '@/components/custom-ui/avatar';

// const WorkspaceSidebar: React.FC = () => {
//   const { 
//     workspaces, 
//     selectedWorkspaceId, 
//     selectWorkspace, 
//     fetchWorkspaces 
//   } = useWorkspaceStore();
  
//   const { openModal } = useModalStore();
//   const { user } = useAuthStore();
  
//   // Fetch workspaces on component mount
//   useEffect(() => {
//     fetchWorkspaces();
//   }, [fetchWorkspaces]);
  
//   // Handle workspace selection
//   const handleSelectWorkspace = (workspaceId: string) => {
//     selectWorkspace(workspaceId);
//   };
  
//   // Handle workspace creation
//   const handleCreateWorkspace = () => {
//     openModal('createWorkspace');
//   };
  
//   // Handle workspace settings
//   const handleWorkspaceSettings = (e: React.MouseEvent, workspaceId: string) => {
//     e.stopPropagation(); // Prevent workspace selection
//     openModal('editWorkspace', { workspaceId });
//   };
  
//   return (
//     <div className="h-full w-16 border bg-gray-300 border-2 rounded-md border-gray-300 flex flex-col items-center py-4">
//       {/* User avatar at the top */}
//       <div className="mb-6">
//         <Avatar
//           src={user?.avatar}
//           alt={user?.fullName || 'User'}
//           size="md"
//           status="online"
//           onClick={() => openModal('editProfile')}
//           className="cursor-pointer border-1 border-gray-800 hover:border-emerald-500 transition-colors"
//         />
//       </div>
      
//       {/* Workspace list */}
//       <div className="flex-1 w-full flex flex-col items-center space-y-4 overflow-y-auto">
//         {workspaces.map((workspace) => (
//           <div 
//             key={workspace.id} 
//             className="relative group"
//             onClick={() => handleSelectWorkspace(workspace.id)}
//           >
//             {/* Selection indicator */}
//             {selectedWorkspaceId === workspace.id && (
//               <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full" />
//             )}
            
//             {/* Workspace logo/icon */}
//             <div 
//               className={`
//                 w-10 h-10 rounded-md flex items-center justify-center 
//                 font-semibold text-white cursor-pointer
//                 ${selectedWorkspaceId === workspace.id 
//                   ? 'bg-emerald-600' 
//                   : 'bg-gray-600 hover:bg-gray-500'
//                 }
//               `}
//               title={workspace.name}
//             >
//               {workspace.logo ? (
//                 <img 
//                   src={workspace.logo} 
//                   alt={workspace.name} 
//                   className="w-full h-full object-cover rounded-md"
//                 />
//               ) : (
//                 workspace.name.substring(0, 2).toUpperCase()
//               )}
//             </div>
            
//             {/* Settings button (visible on hover) */}
//             <button 
//               className="absolute -right-1 -bottom-1 w-5 h-5 bg-gray-700 rounded-full 
//                         flex items-center justify-center opacity-0 group-hover:opacity-100
//                         transition-opacity hover:bg-gray-600"
//               onClick={(e) => handleWorkspaceSettings(e, workspace.id)}
//               title="Workspace settings"
//             >
//               <Settings size={10} className="text-gray-300" />
//             </button>
//           </div>
//         ))}
//       </div>
      
//       {/* Create workspace button */}
//       <button
//         onClick={handleCreateWorkspace}
//         className="w-10 h-10 bg-gray-700 rounded-md flex items-center justify-center 
//                    text-gray-300 hover:bg-gray-600 hover:text-white mt-4"
//         title="Create workspace"
//       >
//         <Plus size={24} />
//       </button>
//     </div>
//   );
// };

// export default WorkspaceSidebar;