"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
import useModalStore from '@/lib/store/messaging/modalStore';
import useAuthStore from '@/lib/store/messaging/authStore';

interface WorkspaceSelectorProps {
  isCollapsed: boolean;
  isMobile?: boolean;
}

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({ 
  isCollapsed, 
  isMobile = false 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get data and functions from stores (like WorkspaceSidebar)
  const { 
    workspaces, 
    selectedWorkspaceId, 
    selectWorkspace, 
    fetchWorkspaces 
  } = useWorkspaceStore();
  
  const { openModal } = useModalStore();
  const { user } = useAuthStore();

  // Fetch workspaces on component mount (like WorkspaceSidebar)
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Handle clicks outside of the dropdown with useCallback for better performance
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowDropdown(false);
    }
  }, []);

  useEffect(() => {
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown, handleClickOutside]);

  // Handle workspace selection (like WorkspaceSidebar)
  const handleSelectWorkspace = useCallback((workspaceId: string) => {
    selectWorkspace(workspaceId);
    setShowDropdown(false);
  }, [selectWorkspace]);

  // Handle workspace creation (like WorkspaceSidebar)
  const handleCreateWorkspace = useCallback(() => {
    setShowDropdown(false);
    openModal('createWorkspace');
  }, [openModal]);

  // Handle workspace settings (like WorkspaceSidebar) 
  const handleWorkspaceSettings = useCallback((e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation(); // Prevent workspace selection
    openModal('editWorkspace', { workspaceId });
  }, [openModal]);

  const toggleDropdown = useCallback(() => {
    setShowDropdown(prev => !prev);
  }, []);

  // Find the currently selected workspace
  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);
  
  // Generate display name and initials
  const displayName = selectedWorkspace?.name || user?.fullName || "User";
  const userInitials = displayName ? displayName.substring(0, 2).toUpperCase() : "US";

  return (
    <div 
      className={cn(
        "px-4 relative",
        isCollapsed && !isMobile ? "py-3" : "py-3"
      )} 
      ref={dropdownRef}
    >
      <div
        className={cn(
          "flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200",
          isCollapsed && !isMobile ? "justify-center" : "justify-between"
        )}
        onClick={toggleDropdown}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown();
          }
        }}
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
      >
        <div className={cn(
          "flex items-center min-w-0",
          isCollapsed && !isMobile ? "justify-center" : "flex-1"
        )}>
          <div 
            className="w-6 h-6 bg-blue-600 rounded mr-2 flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            aria-label={`${displayName} avatar`}
          >
            {selectedWorkspace?.logo ? (
              <img 
                src={selectedWorkspace.logo} 
                alt={selectedWorkspace.name} 
                className="w-full h-full object-cover rounded"
              />
            ) : (
              userInitials
            )}
          </div>
          {(!isCollapsed || isMobile) && (
            <span className="font-medium truncate">{displayName}</span>
          )}
        </div>
        {(!isCollapsed || isMobile) && (
          <ChevronDown 
            size={16} 
            className={cn(
              "flex-shrink-0 transition-transform duration-200",
              showDropdown && "rotate-180"
            )}
          />
        )}
      </div>

      {/* Workspace Dropdown */}
      {showDropdown && (!isCollapsed || isMobile) && (
        <div className="absolute left-4 right-4 mt-2 bg-white border rounded-lg shadow-lg z-50 animate-in slide-in-from-top-1 duration-200">
          <div className="p-2">
            <p className="text-xs uppercase text-gray-400 pb-2 font-medium">Workspaces</p>

            {/* Workspace list */}
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className={cn(
                  "flex items-center p-2 rounded-md mb-1 cursor-pointer group relative transition-colors duration-150",
                  selectedWorkspaceId === workspace.id 
                    ? "bg-blue-50 border border-blue-100" 
                    : "hover:bg-gray-50"
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
                  "w-8 h-8 rounded-md flex items-center justify-center text-white font-medium mr-2 flex-shrink-0",
                  selectedWorkspaceId === workspace.id 
                    ? "bg-blue-600" 
                    : "bg-gray-600"
                )}>
                  {workspace.logo ? (
                    <img 
                      src={workspace.logo} 
                      alt={workspace.name} 
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    workspace.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{workspace.name}</p>
                  {selectedWorkspaceId === workspace.id && (
                    <p className="text-xs text-gray-500">Current workspace</p>
                  )}
                </div>
                
                {/* Settings button (visible on hover) - like WorkspaceSidebar */}
                <button 
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 bg-gray-700 rounded-full 
                            flex items-center justify-center transition-opacity hover:bg-gray-600 ml-2 flex-shrink-0
                            focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  onClick={(e) => handleWorkspaceSettings(e, workspace.id)}
                  title="Workspace settings"
                  type="button"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gray-300">
                    <path 
                      d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            ))}

            {/* Create workspace button - triggers handleCreateWorkspace like WorkspaceSidebar */}
            <button
              type="button"
              className="w-full mt-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              onClick={handleCreateWorkspace}
            >
              <span>+ Sign into another workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSelector;



















































// "use client";
// import React, { useState, useEffect, useRef } from "react";
// import { ChevronDown } from "lucide-react";
// import { cn } from "@/lib/utils";
// import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';
// import useModalStore from '@/lib/store/messaging/modalStore';
// import useAuthStore from '@/lib/store/messaging/authStore';

// interface WorkspaceSelectorProps {
//   isCollapsed: boolean;
// }

// const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({ isCollapsed }) => {
//   const [showDropdown, setShowDropdown] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);
  
//   // Get data and functions from stores (like WorkspaceSidebar)
//   const { 
//     workspaces, 
//     selectedWorkspaceId, 
//     selectWorkspace, 
//     fetchWorkspaces 
//   } = useWorkspaceStore();
  
//   const { openModal } = useModalStore();
//   const { user } = useAuthStore();

//   // Fetch workspaces on component mount (like WorkspaceSidebar)
//   useEffect(() => {
//     fetchWorkspaces();
//   }, [fetchWorkspaces]);

//   // Handle clicks outside of the dropdown
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setShowDropdown(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   // Handle workspace selection (like WorkspaceSidebar)
//   const handleSelectWorkspace = (workspaceId: string) => {
//     selectWorkspace(workspaceId);
//     setShowDropdown(false);
//   };

//   // Handle workspace creation (like WorkspaceSidebar)
//   const handleCreateWorkspace = () => {
//     setShowDropdown(false);
//     openModal('createWorkspace');
//   };

//   // Handle workspace settings (like WorkspaceSidebar) 
//   const handleWorkspaceSettings = (e: React.MouseEvent, workspaceId: string) => {
//     e.stopPropagation(); // Prevent workspace selection
//     openModal('editWorkspace', { workspaceId });
//   };

//   const toggleDropdown = () => {
//     setShowDropdown(!showDropdown);
//   };

//   // Find the currently selected workspace
//   const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);
  
//   // Generate display name and initials
//   const displayName = selectedWorkspace?.name || user?.fullName || "User";
//   const userInitials = displayName ? displayName.substring(0, 2).toUpperCase() : "US";

//   return (
//     <div className="px-4 py-3 relative" ref={dropdownRef}>
//       <div
//         className={cn(
//           "flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50",
//           isCollapsed ? "justify-center" : "justify-between"
//         )}
//         onClick={toggleDropdown}
//       >
//         <div className="flex items-center">
//           <div className="w-6 h-6 bg-blue-600 rounded mr-2 flex items-center justify-center text-white text-xs font-bold">
//             {selectedWorkspace?.logo ? (
//               <img 
//                 src={selectedWorkspace.logo} 
//                 alt={selectedWorkspace.name} 
//                 className="w-full h-full object-cover rounded"
//               />
//             ) : (
//               userInitials
//             )}
//           </div>
//           {!isCollapsed && <span className="font-medium">{displayName}</span>}
//         </div>
//         {!isCollapsed && (
//           <ChevronDown size={16} />
//         )}
//       </div>

//       {/* Workspace Dropdown */}
//       {showDropdown && !isCollapsed && (
//         <div className="absolute left-4 right-4 mt-2 bg-white border rounded-lg shadow-lg z-10">
//           <div className="p-2">
//             <p className="text-xs uppercase text-gray-400 pb-2">Workspaces</p>

//             {/* Workspace list */}
//             {workspaces.map((workspace) => (
//               <div
//                 key={workspace.id}
//                 className={cn(
//                   "flex items-center p-2 rounded-md mb-1 cursor-pointer group relative",
//                   selectedWorkspaceId === workspace.id 
//                     ? "bg-blue-50" 
//                     : "hover:bg-gray-50"
//                 )}
//                 onClick={() => handleSelectWorkspace(workspace.id)}
//               >
//                 <div className={cn(
//                   "w-8 h-8 rounded-md flex items-center justify-center text-white font-medium mr-2",
//                   selectedWorkspaceId === workspace.id 
//                     ? "bg-blue-600" 
//                     : "bg-gray-600"
//                 )}>
//                   {workspace.logo ? (
//                     <img 
//                       src={workspace.logo} 
//                       alt={workspace.name} 
//                       className="w-full h-full object-cover rounded-md"
//                     />
//                   ) : (
//                     workspace.name.substring(0, 2).toUpperCase()
//                   )}
//                 </div>
//                 <div className="flex-1">
//                   <p className="font-medium">{workspace.name}</p>
//                   {selectedWorkspaceId === workspace.id && (
//                     <p className="text-xs text-gray-500">Current workspace</p>
//                   )}
//                 </div>
                
//                 {/* Settings button (visible on hover) - like WorkspaceSidebar */}
//                 <button 
//                   className="opacity-0 group-hover:opacity-100 w-6 h-6 bg-gray-700 rounded-full 
//                             flex items-center justify-center transition-opacity hover:bg-gray-600 ml-2"
//                   onClick={(e) => handleWorkspaceSettings(e, workspace.id)}
//                   title="Workspace settings"
//                 >
//                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gray-300">
//                     <path 
//                       d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" 
//                       stroke="currentColor" 
//                       strokeWidth="2" 
//                       strokeLinecap="round" 
//                       strokeLinejoin="round"
//                     />
//                   </svg>
//                 </button>
//               </div>
//             ))}

//             {/* Create workspace button - triggers handleCreateWorkspace like WorkspaceSidebar */}
//             <button
//               className="w-full mt-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium flex items-center justify-center"
//               onClick={handleCreateWorkspace}
//             >
//               <span>+ Sign into another workspace</span>
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default WorkspaceSelector;