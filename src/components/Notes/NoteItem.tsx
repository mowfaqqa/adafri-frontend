import React, { useState } from 'react';
import { Star, Users, MoreHorizontal, Trash2, FolderOpen, Edit2 } from 'lucide-react';
import { Note, NoteItemProps } from '@/lib/types/notes/types';

export default function NoteItem({ 
  note, 
  isActive, 
  onClick, 
  onToggleFavorite, 
  onToggleShare,
  onDelete,
  onRename,
  onMoveToFolder,
  onMoveToCollection,
  folders = [],
  collections = [],
  showModal
}: NoteItemProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showMoveToCollectionMenu, setShowMoveToCollectionMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(note.title);

  const handleRename = () => {
    if (editValue.trim() && editValue.trim() !== note.title) {
      onRename(editValue.trim());
    }
    setIsEditing(false);
    setEditValue(note.title);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(note.title);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditValue(note.title);
  };

  // Get current collection and folder names for display
  const currentCollection = collections.find(c => c.id === note.collectionId);
  const currentFolder = folders.find(f => f.id === note.folderId);

  return (
    <div
      className={`relative group p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isActive 
          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-lg transform scale-[1.01]' 
          : 'hover:bg-white/80 hover:shadow-md border border-gray-200/50 bg-white/50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyPress}
              className="w-full px-2 py-1 text-sm font-semibold border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h4 
              className={`font-semibold truncate mb-2 text-sm ${
                isActive ? 'text-blue-900' : 'text-gray-900'
              }`}
              onDoubleClick={(e) => {
                e.stopPropagation();
                startEditing();
              }}
            >
              {note.title || '✨ Untitled Note'}
            </h4>
          )}
          
          <p className="text-xs text-gray-600 line-clamp-2 mb-2 leading-relaxed">
            {note.content || 'No content yet...'}
          </p>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {note.updatedAt.toLocaleDateString()}
            </span>
            
            {/* Collection and Folder info */}
            <div className="flex items-center gap-1 text-gray-500">
              <span>📁</span>
              <span className="truncate max-w-16">
                {currentCollection?.name || 'Unknown'}
              </span>
              {currentFolder && (
                <>
                  <span>/</span>
                  <span className="truncate max-w-16">
                    {currentFolder.name}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            {note.isFavorite && (
              <div className="flex items-center gap-1">
                <Star size={10} className="text-yellow-500" fill="currentColor" />
                <span className="text-xs text-yellow-600">Favorite</span>
              </div>
            )}
            {note.isShared && (
              <div className="flex items-center gap-1">
                <Users size={10} className="text-green-500" />
                <span className="text-xs text-green-600">Shared</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="relative ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              showModal({
                type: 'note',
                itemId: note.id,
                position: { x: e.clientX, y: e.clientY }
              });
            }}
            className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100 rounded-lg"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
      
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r"></div>
      )}

      {/* Quick Actions on Hover */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`p-1 rounded transition-colors ${
            note.isFavorite 
              ? 'text-yellow-500 bg-yellow-50' 
              : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
          }`}
          title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star size={12} fill={note.isFavorite ? 'currentColor' : 'none'} />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleShare();
          }}
          className={`p-1 rounded transition-colors ${
            note.isShared 
              ? 'text-green-500 bg-green-50' 
              : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
          }`}
          title={note.isShared ? 'Unshare note' : 'Share note'}
        >
          <Users size={12} />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            startEditing();
          }}
          className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
          title="Rename note"
        >
          <Edit2 size={12} />
        </button>
      </div>
    </div>
  );
}

































































// 3/7/2025
// import React, { useState } from 'react';
// import { Star, Users, MoreHorizontal, Trash2, FolderOpen } from 'lucide-react';
// import { Note, NoteItemProps } from '@/lib/types/notes/types';

// export default function NoteItem({ 
//   note, 
//   isActive, 
//   onClick, 
//   onToggleFavorite, 
//   onDelete,
//   onMoveToFolder,
//   folders = []
// }: NoteItemProps) {
//   const [showMenu, setShowMenu] = useState(false);
//   const [showMoveMenu, setShowMoveMenu] = useState(false);

//   return (
//     <div
//       className={`relative group p-4 rounded-xl cursor-pointer transition-all duration-200 ${
//         isActive 
//           ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg transform scale-[1.02]' 
//           : 'hover:bg-white/80 hover:shadow-md border border-gray-200/50 bg-white/50'
//       }`}
//       onClick={onClick}
//     >
//       <div className="flex items-start justify-between">
//         <div className="flex-1 min-w-0">
//           <h4 className={`font-semibold truncate mb-2 ${
//             isActive ? 'text-blue-900' : 'text-gray-900'
//           }`}>
//             {note.title || '✨ Untitled Note'}
//           </h4>
//           <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
//             {note.content || 'No content yet...'}
//           </p>
//           <div className="flex items-center gap-3">
//             <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
//               {note.updatedAt.toLocaleDateString()}
//             </span>
//             {note.isFavorite && (
//               <div className="flex items-center gap-1">
//                 <Star size={12} className="text-yellow-500" fill="currentColor" />
//                 <span className="text-xs text-yellow-600">Favorite</span>
//               </div>
//             )}
//             {note.isShared && (
//               <div className="flex items-center gap-1">
//                 <Users size={12} className="text-green-500" />
//                 <span className="text-xs text-green-600">Shared</span>
//               </div>
//             )}
//           </div>
//         </div>
        
//         <div className="relative ml-2">
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               setShowMenu(!showMenu);
//             }}
//             className="p-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100 rounded-lg"
//           >
//             <MoreHorizontal size={16} />
//           </button>
          
//           {showMenu && (
//             <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-36 overflow-hidden">
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   onToggleFavorite();
//                   setShowMenu(false);
//                 }}
//                 className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-yellow-50 transition-colors"
//               >
//                 <Star size={14} className={note.isFavorite ? 'text-yellow-500' : 'text-gray-400'} />
//                 {note.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
//               </button>
              
//               {onMoveToFolder && folders.length > 0 && (
//                 <>
//                   <div className="border-t border-gray-100"></div>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setShowMoveMenu(!showMoveMenu);
//                     }}
//                     className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition-colors relative"
//                   >
//                     <FolderOpen size={14} />
//                     Move to Folder
//                     <span className="ml-auto">▶</span>
//                   </button>
                  
//                   {showMoveMenu && (
//                     <div className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-xl shadow-lg min-w-40 overflow-hidden">
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           onMoveToFolder(null);
//                           setShowMenu(false);
//                           setShowMoveMenu(false);
//                         }}
//                         className={`flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
//                           !note.folderId ? 'bg-blue-50 text-blue-700' : ''
//                         }`}
//                       >
//                         📋 Unfiled
//                       </button>
//                       {folders.map(folder => (
//                         <button
//                           key={folder.id}
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             onMoveToFolder(folder.id);
//                             setShowMenu(false);
//                             setShowMoveMenu(false);
//                           }}
//                           className={`flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
//                             note.folderId === folder.id ? 'bg-blue-50 text-blue-700' : ''
//                           }`}
//                         >
//                           📁 {folder.name}
//                         </button>
//                       ))}
//                     </div>
//                   )}
//                 </>
//               )}
              
//               <div className="border-t border-gray-100"></div>
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   onDelete();
//                   setShowMenu(false);
//                 }}
//                 className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
//               >
//                 <Trash2 size={14} />
//                 Delete Note
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
      
//       {/* Active indicator */}
//       {isActive && (
//         <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r"></div>
//       )}
//     </div>
//   );
// }
