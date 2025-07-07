import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Folder } from 'lucide-react';
import { Note, NoteFolder, Collection, NotesSidebarProps } from '@/lib/types/notes/types';
import NavigationTabs from './NavigationTabs';
import CollectionItem from './CollectionItem';
import ContextMenu from '../notesapp/ContextMenu';
import CreateCollectionModal from '../notesapp/CreateCollectionModal';

export default function NotesSidebar({ 
  notes, 
  folders, 
  collections,
  activeNote, 
  activeView, 
  searchQuery,
  setActiveNote,
  setActiveView,
  setSearchQuery,
  toggleFavorite,
  toggleShare,
  deleteNote,
  toggleFolder,
  deleteFolder,
  toggleCollection,
  deleteCollection,
  createNote,
  createFolder,
  createCollection,
  moveNoteToFolder,
  moveNoteToCollection,
  renameNote,
  renameFolder,
  renameCollection,
  showModal,
  openInView,
  onShowCreateCollectionModal
}: NotesSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingType, setEditingType] = useState<'note' | 'folder' | 'collection'>('note');
  const [contextMenu, setContextMenu] = useState<{
    type: 'collection' | 'folder' | 'note';
    itemId: string;
    position: { x: number; y: number };
  } | null>(null);
  const [moveModal, setMoveModal] = useState<{
    type: 'note' | 'folder';
    itemId: string;
  } | null>(null);
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);

  // Filter notes based on active view
  const getFilteredNotes = () => {
    let filtered = notes;
    
    switch (activeView) {
      case 'favorites':
        filtered = notes.filter(note => note.isFavorite);
        break;
      case 'shared':
        filtered = notes.filter(note => note.isShared);
        break;
      default:
        filtered = notes;
    }

    if (searchQuery) {
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredNotes = getFilteredNotes();

  // Editing functions
  const startEditing = (id: string, currentValue: string, type: 'note' | 'folder' | 'collection') => {
    setEditingId(id);
    setEditingValue(currentValue);
    setEditingType(type);
  };

  const saveEdit = () => {
    if (editingId && editingValue.trim()) {
      switch (editingType) {
        case 'note':
          renameNote(editingId, editingValue);
          break;
        case 'folder':
          renameFolder(editingId, editingValue);
          break;
        case 'collection':
          renameCollection(editingId, editingValue);
          break;
      }
    }
    setEditingId(null);
    setEditingValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Context menu functions
  const handleContextMenu = (e: React.MouseEvent, type: 'collection' | 'folder' | 'note', itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate position, ensuring modal stays within viewport
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.max(10, Math.min(rect.left - 200, window.innerWidth - 250));
    const y = Math.max(10, Math.min(rect.top, window.innerHeight - 300));
    
    setContextMenu({
      type,
      itemId,
      position: { x, y }
    });
  };

  const handleMove = (type: 'note' | 'folder', itemId: string) => {
    setMoveModal({ type, itemId });
    setContextMenu(null);
  };

  const executeMove = (targetCollectionId: string) => {
    if (moveModal) {
      if (moveModal.type === 'note') {
        moveNoteToCollection(moveModal.itemId, targetCollectionId);
      } else if (moveModal.type === 'folder') {
        const folder = folders.find(f => f.id === moveModal.itemId);
        if (folder) {
          // Move folder to different collection (this would need a moveFolderToCollection function)
          renameFolder(moveModal.itemId, folder.name);
        }
      }
    }
    setMoveModal(null);
  };

  const handleDelete = (type: 'collection' | 'folder' | 'note', itemId: string) => {
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
      switch (type) {
        case 'collection':
          deleteCollection(itemId);
          break;
        case 'folder':
          deleteFolder(itemId);
          break;
        case 'note':
          deleteNote(itemId);
          break;
      }
    }
  };

  const handleOpenInView = (type: 'collection' | 'folder', itemId: string) => {
    openInView(type, itemId);
    setContextMenu(null);
  };

  const handleRename = (type: 'collection' | 'folder' | 'note', itemId: string) => {
    let currentValue = '';
    if (type === 'collection') {
      currentValue = collections.find(c => c.id === itemId)?.name || '';
    } else if (type === 'folder') {
      currentValue = folders.find(f => f.id === itemId)?.name || '';
    } else {
      currentValue = notes.find(n => n.id === itemId)?.title || '';
    }
    startEditing(itemId, currentValue, type);
    setContextMenu(null);
  };

  const handleCreateFolder = (collectionId: string) => {
    const folderName = prompt('Enter folder name:');
    if (folderName && folderName.trim()) {
      createFolder(collectionId, folderName.trim());
    }
    setContextMenu(null);
  };

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.context-menu')) {
          setContextMenu(null);
        }
      }
    };
    
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  return (
    <div className="w-80 bg-white/70 backdrop-blur-sm border-l border-white/50 flex flex-col shadow-xl">
      {/* Search and Navigation */}
      <div className="p-4 border-b border-gray-200/50">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="🔍 Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 text-sm"
          />
        </div>
        
        <NavigationTabs
          notes={notes}
          activeView={activeView}
          setActiveView={setActiveView}
          setActiveNote={setActiveNote}
        />
      </div>

      {/* Collections Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Collections</h3>
            <button
              onClick={() => {
                if (onShowCreateCollectionModal) {
                  onShowCreateCollectionModal();
                } else {
                  setShowCreateCollectionModal(true);
                }
              }}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Create new collection"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Collections List */}
          <div className="space-y-2">
            {collections.map(collection => (
              <CollectionItem
                key={collection.id}
                collection={collection}
                notes={filteredNotes}
                folders={folders}
                activeNote={activeNote}
                editingId={editingId}
                editingValue={editingValue}
                onToggleExpansion={() => toggleCollection(collection.id)}
                onStartEditing={(id, value, type) => {
                  setEditingId(id);
                  setEditingValue(value);
                  setEditingType(type as 'note' | 'folder' | 'collection');
                }}
                onSaveEdit={saveEdit}
                onKeyPress={handleKeyPress}
                onCreateNote={() => createNote(collection.id)}
                onContextMenu={handleContextMenu}
                onNoteClick={setActiveNote}
                onNoteContextMenu={(e, noteId) => handleContextMenu(e, 'note', noteId)}
                onSetEditingValue={setEditingValue}
                onFolderProps={{
                  onToggleFolder: toggleFolder,
                  onCreateNoteInFolder: createNote,
                  onFolderContextMenu: (e, folderId) => handleContextMenu(e, 'folder', folderId),
                  onCreateFolder: handleCreateFolder
                }}
              />
            ))}
          </div>

          {/* Empty State */}
          {filteredNotes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-sm font-medium">No notes found</p>
              <p className="text-xs mt-1">Try adjusting your search or create a new note</p>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div className="context-menu">
          <ContextMenu
            contextMenu={contextMenu}
            onOpenInView={handleOpenInView}
            onRename={handleRename}
            onDelete={handleDelete}
            onToggleFavorite={toggleFavorite}
            onToggleShare={toggleShare}
            onCreateFolder={handleCreateFolder}
            onMove={handleMove}
            onClose={() => setContextMenu(null)}
          />
        </div>
      )}

      {/* Move Modal */}
      {moveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="move-modal bg-white/90 backdrop-blur-sm rounded-2xl p-6 w-96 shadow-2xl border border-white/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Move {moveModal.type === 'note' ? 'Note' : 'Folder'} to Collection
              </h3>
              <button
                onClick={() => setMoveModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {collections.map(collection => (
                <button
                  key={collection.id}
                  onClick={() => executeMove(collection.id)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Folder size={16} className="text-blue-500" />
                    <div>
                      <div className="font-medium text-gray-800">{collection.name}</div>
                      <div className="text-sm text-gray-500">
                        {notes.filter(n => n.collectionId === collection.id).length} notes
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Collection Modal */}
      {!onShowCreateCollectionModal && (
        <CreateCollectionModal
          show={showCreateCollectionModal}
          onClose={() => setShowCreateCollectionModal(false)}
          onCreateCollection={createCollection}
        />
      )}
    </div>
  );
}























































// 3/7/2025  7:13
// import React, { useState } from 'react';
// import { Search, Star, Users, FileText, Folder, Trash2, Plus, MoreHorizontal, ChevronRight, Eye, Edit2, Move, Share2, FolderPlus, X } from 'lucide-react';
// import { Note, NoteFolder, Collection, NotesSidebarProps } from '@/lib/types/notes/types';

// export default function NotesSidebar({ 
//   notes, 
//   folders, 
//   collections,
//   activeNote, 
//   activeView, 
//   searchQuery,
//   setActiveNote,
//   setActiveView,
//   setSearchQuery,
//   toggleFavorite,
//   toggleShare,
//   deleteNote,
//   toggleFolder,
//   deleteFolder,
//   toggleCollection,
//   deleteCollection,
//   createNote,
//   createFolder,
//   createCollection,
//   moveNoteToFolder,
//   moveNoteToCollection,
//   renameNote,
//   renameFolder,
//   renameCollection,
//   showModal,
//   openInView
// }: NotesSidebarProps) {
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [editingValue, setEditingValue] = useState('');
//   const [editingType, setEditingType] = useState<'note' | 'folder' | 'collection'>('note');
//   const [contextMenu, setContextMenu] = useState<{
//     type: 'collection' | 'folder' | 'note';
//     itemId: string;
//     position: { x: number; y: number };
//   } | null>(null);
//   const [moveModal, setMoveModal] = useState<{
//     type: 'note' | 'folder';
//     itemId: string;
//   } | null>(null);
//   const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
//   const [newCollectionData, setNewCollectionData] = useState({
//     name: '',
//     isPrivate: true,
//     teamMembers: [{ email: '', role: 'viewer' as 'viewer' | 'editor' | 'moderator' }]
//   });

//   // Filter notes based on active view
//   const getFilteredNotes = () => {
//     let filtered = notes;
    
//     switch (activeView) {
//       case 'favorites':
//         filtered = notes.filter(note => note.isFavorite);
//         break;
//       case 'shared':
//         filtered = notes.filter(note => note.isShared);
//         break;
//       default:
//         filtered = notes;
//     }

//     if (searchQuery) {
//       filtered = filtered.filter(note => 
//         note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         note.content.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     return filtered;
//   };

//   const filteredNotes = getFilteredNotes();

//   const startEditing = (id: string, currentValue: string, type: 'note' | 'folder' | 'collection') => {
//     setEditingId(id);
//     setEditingValue(currentValue);
//     setEditingType(type);
//   };

//   const saveEdit = () => {
//     if (editingId && editingValue.trim()) {
//       switch (editingType) {
//         case 'note':
//           renameNote(editingId, editingValue);
//           break;
//         case 'folder':
//           renameFolder(editingId, editingValue);
//           break;
//         case 'collection':
//           renameCollection(editingId, editingValue);
//           break;
//       }
//     }
//     setEditingId(null);
//     setEditingValue('');
//   };

//   const cancelEdit = () => {
//     setEditingId(null);
//     setEditingValue('');
//   };

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter') {
//       saveEdit();
//     } else if (e.key === 'Escape') {
//       cancelEdit();
//     }
//   };

//   const handleContextMenu = (e: React.MouseEvent, type: 'collection' | 'folder' | 'note', itemId: string) => {
//     e.preventDefault();
//     e.stopPropagation();
    
//     // Calculate position, ensuring modal stays within viewport
//     const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
//     const x = Math.min(rect.left - 200, window.innerWidth - 250); // Position to the left
//     const y = Math.min(rect.top, window.innerHeight - 300);
    
//     setContextMenu({
//       type,
//       itemId,
//       position: { x: Math.max(10, x), y: Math.max(10, y) }
//     });
//   };

//   const openInViewHandler = (type: 'collection' | 'folder', itemId: string) => {
//     openInView(type, itemId);
//     setContextMenu(null);
//   };

//   const handleMove = (type: 'note' | 'folder', itemId: string) => {
//     setMoveModal({ type, itemId });
//     setContextMenu(null);
//   };

//   const executeMove = (targetCollectionId: string) => {
//     if (moveModal) {
//       if (moveModal.type === 'note') {
//         moveNoteToCollection(moveModal.itemId, targetCollectionId);
//       } else if (moveModal.type === 'folder') {
//         // Move folder to different collection
//         const folder = folders.find(f => f.id === moveModal.itemId);
//         if (folder) {
//           // Update folder's collection
//           renameFolder(moveModal.itemId, folder.name); // This should be a move function
//         }
//       }
//     }
//     setMoveModal(null);
//   };

//   const handleCreateCollection = () => {
//     if (newCollectionData.name.trim()) {
//       createCollection(newCollectionData.name, `Privacy: ${newCollectionData.isPrivate ? 'Private' : 'Public'}`);
//       setNewCollectionData({
//         name: '',
//         isPrivate: true,
//         teamMembers: [{ email: '', role: 'viewer' }]
//       });
//       setShowNewCollectionModal(false);
//     }
//   };

//   const addTeamMember = () => {
//     setNewCollectionData(prev => ({
//       ...prev,
//       teamMembers: [...prev.teamMembers, { email: '', role: 'viewer' }]
//     }));
//   };

//   const updateTeamMember = (index: number, field: 'email' | 'role', value: string) => {
//     setNewCollectionData(prev => ({
//       ...prev,
//       teamMembers: prev.teamMembers.map((member, i) => 
//         i === index ? { ...member, [field]: value } : member
//       )
//     }));
//   };

//   const removeTeamMember = (index: number) => {
//     setNewCollectionData(prev => ({
//       ...prev,
//       teamMembers: prev.teamMembers.filter((_, i) => i !== index)
//     }));
//   };

//   // Close context menu when clicking outside
//   React.useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (contextMenu) {
//         const target = event.target as HTMLElement;
//         if (!target.closest('.context-menu')) {
//           setContextMenu(null);
//         }
//       }
//     };
    
//     if (contextMenu) {
//       document.addEventListener('click', handleClickOutside);
//       return () => document.removeEventListener('click', handleClickOutside);
//     }
//   }, [contextMenu]);

//   // Handle clicking outside of modals
//   React.useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (moveModal) {
//         const target = event.target as HTMLElement;
//         if (!target.closest('.move-modal')) {
//           setMoveModal(null);
//         }
//       }
//     };
    
//     if (moveModal) {
//       document.addEventListener('click', handleClickOutside);
//       return () => document.removeEventListener('click', handleClickOutside);
//     }
//   }, [moveModal]);

//   return (
//     <div className="w-80 bg-white/70 backdrop-blur-sm border-l border-white/50 flex flex-col shadow-xl">
//       {/* Search and Navigation */}
//       <div className="p-4 border-b border-gray-200/50">
//         <div className="relative mb-4">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
//           <input
//             type="text"
//             placeholder="🔍 Search notes..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 text-sm"
//           />
//         </div>
        
//         {/* Vertical Navigation Buttons */}
//         <div className="space-y-1">
//           <button
//             onClick={() => {
//               setActiveView('all');
//               setActiveNote(null); // Clear active note to show all notes view
//             }}
//             className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full ${
//               activeView === 'all' 
//                 ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
//                 : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
//             }`}
//           >
//             <FileText size={16} />
//             📄 All Notes
//             <span className="ml-auto bg-white/20 px-2 py-1 rounded-full text-xs">
//               {notes.length}
//             </span>
//           </button>
//           <button
//             onClick={() => {
//               setActiveView('favorites');
//               setActiveNote(null); // Clear active note to show favorites view
//             }}
//             className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full ${
//               activeView === 'favorites' 
//                 ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
//                 : 'text-gray-600 hover:bg-yellow-50 hover:text-yellow-700'
//             }`}
//           >
//             <Star size={16} />
//             ⭐ Favorites
//             <span className="ml-auto bg-white/20 px-2 py-1 rounded-full text-xs">
//               {notes.filter(n => n.isFavorite).length}
//             </span>
//           </button>
//           <button
//             onClick={() => {
//               setActiveView('shared');
//               setActiveNote(null); // Clear active note to show shared view
//             }}
//             className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full ${
//               activeView === 'shared' 
//                 ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
//                 : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
//             }`}
//           >
//             <Users size={16} />
//             👥 Shared
//             <span className="ml-auto bg-white/20 px-2 py-1 rounded-full text-xs">
//               {notes.filter(n => n.isShared).length}
//             </span>
//           </button>
//         </div>
//       </div>

//       {/* Collections Section */}
//       <div className="flex-1 overflow-y-auto">
//         <div className="p-4">
//           <div className="flex items-center justify-between mb-3">
//             <h3 className="text-sm font-semibold text-gray-700">Collections</h3>
//             <button
//               onClick={() => setShowNewCollectionModal(true)}
//               className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//               title="Create new collection"
//             >
//               <Plus size={14} />
//             </button>
//           </div>

//           {/* Collections List */}
//           <div className="space-y-2">
//             {collections.map(collection => {
//               const collectionNotes = filteredNotes.filter(note => note.collectionId === collection.id);
//               const collectionFolders = folders.filter(folder => folder.collectionId === collection.id);
              
//               return (
//                 <div key={collection.id} className="border border-gray-200/50 rounded-lg bg-white/50">
//                   {/* Collection Header */}
//                   <div className="flex items-center justify-between p-3 border-b border-gray-200/50">
//                     <div className="flex items-center gap-2 flex-1">
//                       <button
//                         onClick={() => toggleCollection(collection.id)}
//                         className="p-1 hover:bg-gray-100 rounded"
//                       >
//                         <ChevronRight 
//                           size={14} 
//                           className={`transform transition-transform ${collection.isExpanded ? 'rotate-90' : ''}`}
//                         />
//                       </button>
//                       {editingId === collection.id ? (
//                         <input
//                           type="text"
//                           value={editingValue}
//                           onChange={(e) => setEditingValue(e.target.value)}
//                           onBlur={saveEdit}
//                           onKeyDown={handleKeyPress}
//                           className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
//                           autoFocus
//                         />
//                       ) : (
//                         <span 
//                           className="text-sm font-medium text-gray-800 cursor-pointer hover:text-blue-600"
//                           onDoubleClick={() => startEditing(collection.id, collection.name, 'collection')}
//                         >
//                           📁 {collection.name}
//                         </span>
//                       )}
//                     </div>
//                     <div className="flex items-center gap-1">
//                       <button
//                         onClick={() => createNote(collection.id)}
//                         className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
//                         title={`Add note to ${collection.name}`}
//                       >
//                         <Plus size={12} />
//                       </button>
//                       <button
//                         onClick={(e) => handleContextMenu(e, 'collection', collection.id)}
//                         className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
//                       >
//                         <MoreHorizontal size={12} />
//                       </button>
//                     </div>
//                   </div>

//                   {/* Collection Content */}
//                   {collection.isExpanded && (
//                     <div className="p-2 space-y-2">
//                       {/* Direct Collection Notes */}
//                       {collectionNotes.filter(note => !note.folderId).map(note => (
//                         <div key={note.id} className="group">
//                           <div
//                             className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 ${
//                               activeNote?.id === note.id 
//                                 ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200' 
//                                 : 'hover:bg-white/80'
//                             }`}
//                             onClick={() => setActiveNote(note)}
//                           >
//                             <div className="flex-1 min-w-0">
//                               {editingId === note.id ? (
//                                 <input
//                                   type="text"
//                                   value={editingValue}
//                                   onChange={(e) => setEditingValue(e.target.value)}
//                                   onBlur={saveEdit}
//                                   onKeyDown={handleKeyPress}
//                                   className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
//                                   autoFocus
//                                 />
//                               ) : (
//                                 <span 
//                                   className="text-sm font-medium text-gray-800 truncate block"
//                                   onDoubleClick={() => startEditing(note.id, note.title, 'note')}
//                                 >
//                                   📝 {note.title}
//                                 </span>
//                               )}
//                               <div className="flex items-center gap-2 mt-1">
//                                 <span className="text-xs text-gray-400">
//                                   {note.updatedAt.toLocaleDateString()}
//                                 </span>
//                                 {note.isFavorite && <Star size={10} className="text-yellow-500" fill="currentColor" />}
//                                 {note.isShared && <Users size={10} className="text-green-500" />}
//                               </div>
//                             </div>
//                             <button
//                               onClick={(e) => handleContextMenu(e, 'note', note.id)}
//                               className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
//                             >
//                               <MoreHorizontal size={12} />
//                             </button>
//                           </div>
//                         </div>
//                       ))}

//                       {/* Folders */}
//                       {collectionFolders.map(folder => (
//                         <div key={folder.id} className="border border-gray-200/50 rounded-lg bg-white/30">
//                           <div className="flex items-center justify-between p-2">
//                             <div className="flex items-center gap-2 flex-1">
//                               <button
//                                 onClick={() => toggleFolder(folder.id)}
//                                 className="p-1 hover:bg-gray-100 rounded"
//                               >
//                                 <ChevronRight 
//                                   size={12} 
//                                   className={`transform transition-transform ${folder.isExpanded ? 'rotate-90' : ''}`}
//                                 />
//                               </button>
//                               {editingId === folder.id ? (
//                                 <input
//                                   type="text"
//                                   value={editingValue}
//                                   onChange={(e) => setEditingValue(e.target.value)}
//                                   onBlur={saveEdit}
//                                   onKeyDown={handleKeyPress}
//                                   className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
//                                   autoFocus
//                                 />
//                               ) : (
//                                 <span 
//                                   className="text-sm text-gray-700 cursor-pointer hover:text-blue-600"
//                                   onDoubleClick={() => startEditing(folder.id, folder.name, 'folder')}
//                                 >
//                                   📂 {folder.name}
//                                 </span>
//                               )}
//                             </div>
//                             <div className="flex items-center gap-1">
//                               <button
//                                 onClick={() => createNote(collection.id, folder.id)}
//                                 className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
//                                 title={`Add note to ${folder.name}`}
//                               >
//                                 <Plus size={10} />
//                               </button>
//                               <button
//                                 onClick={(e) => handleContextMenu(e, 'folder', folder.id)}
//                                 className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
//                               >
//                                 <MoreHorizontal size={10} />
//                               </button>
//                             </div>
//                           </div>

//                           {/* Folder Notes */}
//                           {folder.isExpanded && (
//                             <div className="pl-4 pr-2 pb-2 space-y-1">
//                               {collectionNotes.filter(note => note.folderId === folder.id).map(note => (
//                                 <div key={note.id} className="group">
//                                   <div
//                                     className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 ${
//                                       activeNote?.id === note.id 
//                                         ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200' 
//                                         : 'hover:bg-white/80'
//                                     }`}
//                                     onClick={() => setActiveNote(note)}
//                                   >
//                                     <div className="flex-1 min-w-0">
//                                       {editingId === note.id ? (
//                                         <input
//                                           type="text"
//                                           value={editingValue}
//                                           onChange={(e) => setEditingValue(e.target.value)}
//                                           onBlur={saveEdit}
//                                           onKeyDown={handleKeyPress}
//                                           className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
//                                           autoFocus
//                                         />
//                                       ) : (
//                                         <span 
//                                           className="text-sm text-gray-700 truncate block"
//                                           onDoubleClick={() => startEditing(note.id, note.title, 'note')}
//                                         >
//                                           📄 {note.title}
//                                         </span>
//                                       )}
//                                       <div className="flex items-center gap-2 mt-1">
//                                         <span className="text-xs text-gray-400">
//                                           {note.updatedAt.toLocaleDateString()}
//                                         </span>
//                                         {note.isFavorite && <Star size={10} className="text-yellow-500" fill="currentColor" />}
//                                         {note.isShared && <Users size={10} className="text-green-500" />}
//                                       </div>
//                                     </div>
//                                     <button
//                                       onClick={(e) => handleContextMenu(e, 'note', note.id)}
//                                       className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
//                                     >
//                                       <MoreHorizontal size={12} />
//                                     </button>
//                                   </div>
//                                 </div>
//                               ))}
//                             </div>
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>

//           {/* Empty State */}
//           {filteredNotes.length === 0 && (
//             <div className="text-center py-8 text-gray-500">
//               <div className="text-4xl mb-2">📝</div>
//               <p className="text-sm font-medium">No notes found</p>
//               <p className="text-xs mt-1">Try adjusting your search or create a new note</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Context Menu */}
//       {contextMenu && (
//         <div 
//           className="context-menu fixed bg-white border border-gray-200 rounded-xl shadow-xl z-50 min-w-48 overflow-hidden"
//           style={{ left: contextMenu.position.x, top: contextMenu.position.y }}
//           onClick={(e) => e.stopPropagation()}
//         >
//           {contextMenu.type === 'collection' && (
//             <>
//               <button 
//                 onClick={() => openInViewHandler('collection', contextMenu.itemId)}
//                 className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
//               >
//                 <Eye size={14} />
//                 Open in View
//               </button>
//               <button 
//                 onClick={() => {
//                   const collection = collections.find(c => c.id === contextMenu.itemId);
//                   if (collection) {
//                     startEditing(contextMenu.itemId, collection.name, 'collection');
//                   }
//                   setContextMenu(null);
//                 }}
//                 className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
//               >
//                 <Edit2 size={14} />
//                 Rename
//               </button>
//               <button 
//                 onClick={() => {
//                   const collection = collections.find(c => c.id === contextMenu.itemId);
//                   if (collection) {
//                     const folderName = prompt('Enter folder name:');
//                     if (folderName) {
//                       createFolder(collection.id, folderName);
//                     }
//                   }
//                   setContextMenu(null);
//                 }}
//                 className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
//               >
//                 <FolderPlus size={14} />
//                 Create Folder
//               </button>
//               <div className="border-t border-gray-100"></div>
//               <button 
//                 onClick={() => {
//                   deleteCollection(contextMenu.itemId);
//                   setContextMenu(null);
//                 }}
//                 className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
//               >
//                 <Trash2 size={14} />
//                 Delete
//               </button>
//             </>
//           )}

//           {contextMenu.type === 'folder' && (
//             <>
//               <button 
//                 onClick={() => openInViewHandler('folder', contextMenu.itemId)}
//                 className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
//               >
//                 <Eye size={14} />
//                 Open in View
//               </button>
//               <button 
//                 onClick={() => {
//                   const folder = folders.find(f => f.id === contextMenu.itemId);
//                   if (folder) {
//                     startEditing(contextMenu.itemId, folder.name, 'folder');
//                   }
//                   setContextMenu(null);
//                 }}
//                 className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
//               >
//                 <Edit2 size={14} />
//                 Rename
//               </button>
//               <button 
//                 onClick={() => handleMove('folder', contextMenu.itemId)}
//                 className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
//               >
//                 <Move size={14} />
//                 Move to
//               </button>
//               <button 
//                 onClick={() => {
//                   const folder = folders.find(f => f.id === contextMenu.itemId);
//                   if (folder) {
//                     const folderName = prompt('Enter folder name:');
//                     if (folderName) {
//                       createFolder(folder.collectionId, folderName);
//                     }
//                   }
//                   setContextMenu(null);
//                 }}
//                 className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
//               >
//                 <FolderPlus size={14} />
//                 Create Folder
//               </button>
//               <div className="border-t border-gray-100"></div>
//               <button 
//                 onClick={() => {
//                   deleteFolder(contextMenu.itemId);
//                   setContextMenu(null);
//                 }}
//                 className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
//               >
//                 <Trash2 size={14} />
//                 Delete
//               </button>
//             </>
//           )}

//           {contextMenu.type === 'note' && (
//             <>
//               <button 
//                 onClick={() => {
//                   const note = notes.find(n => n.id === contextMenu.itemId);
//                   if (note) {
//                     toggleFavorite(contextMenu.itemId);
//                   }
//                   setContextMenu(null);
//                 }}
//                 className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-yellow-50 transition-colors"
//               >
//                 <Star size={14} />
//                 {notes.find(n => n.id === contextMenu.itemId)?.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
//               </button>
//               <button 
//                 onClick={() => {
//                   const note = notes.find(n => n.id === contextMenu.itemId);
//                   if (note) {
//                     startEditing(contextMenu.itemId, note.title, 'note');
//                   }
//                   setContextMenu(null);
//                 }}
//                 className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
//               >
//                 <Edit2 size={14} />
//                 Rename
//               </button>
//               <button 
//                 onClick={() => handleMove('note', contextMenu.itemId)}
//                 className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
//               >
//                 <Move size={14} />
//                 Move to
//               </button>
//               <div className="border-t border-gray-100"></div>
//               <button 
//                 onClick={() => {
//                   deleteNote(contextMenu.itemId);
//                   setContextMenu(null);
//                 }}
//                 className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
//               >
//                 <Trash2 size={14} />
//                 Delete
//               </button>
//             </>
//           )}
//         </div>
//       )}

//       {/* Move Modal */}
//       {moveModal && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
//           <div className="move-modal bg-white/90 backdrop-blur-sm rounded-2xl p-6 w-96 shadow-2xl border border-white/50">
//             <div className="flex items-center justify-between mb-6">
//               <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//                 Move {moveModal.type === 'note' ? 'Note' : 'Folder'} to Collection
//               </h3>
//               <button
//                 onClick={() => setMoveModal(null)}
//                 className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
//               >
//                 <X size={20} />
//               </button>
//             </div>
//             <div className="space-y-2 max-h-60 overflow-y-auto">
//               {collections.map(collection => (
//                 <button
//                   key={collection.id}
//                   onClick={() => executeMove(collection.id)}
//                   className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
//                 >
//                   <div className="flex items-center gap-2">
//                     <Folder size={16} className="text-blue-500" />
//                     <div>
//                       <div className="font-medium text-gray-800">{collection.name}</div>
//                       <div className="text-sm text-gray-500">
//                         {notes.filter(n => n.collectionId === collection.id).length} notes
//                       </div>
//                     </div>
//                   </div>
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* New Collection Modal */}
//       {showNewCollectionModal && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
//           <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 w-96 shadow-2xl border border-white/50 max-h-96 overflow-y-auto">
//             <div className="flex items-center justify-between mb-6">
//               <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Create New Collection</h3>
//               <button
//                 onClick={() => {
//                   setShowNewCollectionModal(false);
//                   setNewCollectionData({
//                     name: '',
//                     isPrivate: true,
//                     teamMembers: [{ email: '', role: 'viewer' }]
//                   });
//                 }}
//                 className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
//               >
//                 <X size={20} />
//               </button>
//             </div>
            
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Collection Name</label>
//                 <input
//                   type="text"
//                   placeholder="Enter collection name..."
//                   value={newCollectionData.name}
//                   onChange={(e) => setNewCollectionData(prev => ({ ...prev, name: e.target.value }))}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-sm"
//                   autoFocus
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Privacy</label>
//                 <div className="flex gap-4">
//                   <label className="flex items-center">
//                     <input
//                       type="radio"
//                       checked={newCollectionData.isPrivate}
//                       onChange={() => setNewCollectionData(prev => ({ ...prev, isPrivate: true }))}
//                       className="mr-2"
//                     />
//                     <span className="text-sm">Private</span>
//                   </label>
//                   <label className="flex items-center">
//                     <input
//                       type="radio"
//                       checked={!newCollectionData.isPrivate}
//                       onChange={() => setNewCollectionData(prev => ({ ...prev, isPrivate: false }))}
//                       className="mr-2"
//                     />
//                     <span className="text-sm">Public</span>
//                   </label>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Team Members</label>
//                 <div className="space-y-2">
//                   {newCollectionData.teamMembers.map((member, index) => (
//                     <div key={index} className="flex gap-2">
//                       <input
//                         type="email"
//                         placeholder="Enter email..."
//                         value={member.email}
//                         onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
//                         className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 text-sm"
//                       />
//                       <select
//                         value={member.role}
//                         onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
//                         className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 text-sm"
//                       >
//                         <option value="viewer">Viewer</option>
//                         <option value="editor">Editor</option>
//                         <option value="moderator">Moderator</option>
//                       </select>
//                       {newCollectionData.teamMembers.length > 1 && (
//                         <button
//                           onClick={() => removeTeamMember(index)}
//                           className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
//                         >
//                           <Trash2 size={14} />
//                         </button>
//                       )}
//                     </div>
//                   ))}
//                   <button
//                     onClick={addTeamMember}
//                     className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
//                   >
//                     <Plus size={14} />
//                     Add team member
//                   </button>
//                 </div>
//               </div>
//             </div>

//             <div className="flex gap-3 justify-end mt-6">
//               <button
//                 onClick={() => {
//                   setShowNewCollectionModal(false);
//                   setNewCollectionData({
//                     name: '',
//                     isPrivate: true,
//                     teamMembers: [{ email: '', role: 'viewer' }]
//                   });
//                 }}
//                 className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors text-sm"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleCreateCollection}
//                 disabled={!newCollectionData.name.trim()}
//                 className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm"
//               >
//                 Create Collection
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }





















































// import React from 'react';
// import { Search, Star, Users, FileText, Folder, Trash2, Plus } from 'lucide-react';
// import NoteItem from './NoteItem';
// import { Note, NoteFolder, NotesSidebarProps } from '@/lib/types/notes/types';

// export default function NotesSidebar({ 
//   notes, 
//   folders, 
//   activeNote, 
//   activeView, 
//   searchQuery,
//   setActiveNote,
//   setActiveView,
//   setSearchQuery,
//   toggleFavorite,
//   deleteNote,
//   toggleFolder,
//   deleteFolder,
//   createNote,
//   moveNoteToFolder
// }: NotesSidebarProps) {
//   // Filter notes based on active view
//   const getFilteredNotes = () => {
//     let filtered = notes;
    
//     switch (activeView) {
//       case 'favorites':
//         filtered = notes.filter(note => note.isFavorite);
//         break;
//       case 'shared':
//         filtered = notes.filter(note => note.isShared);
//         break;
//       default:
//         filtered = notes;
//     }

//     if (searchQuery) {
//       filtered = filtered.filter(note => 
//         note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         note.content.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     return filtered;
//   };

//   // Group notes by folder
//   const groupNotesByFolder = (notes: Note[]) => {
//     const grouped = notes.reduce((acc, note) => {
//       const key = note.folderId || 'unfiled';
//       if (!acc[key]) acc[key] = [];
//       acc[key].push(note);
//       return acc;
//     }, {} as Record<string, Note[]>);
//     return grouped;
//   };

//   const filteredNotes = getFilteredNotes();
//   const groupedNotes = groupNotesByFolder(filteredNotes);

//   return (
//     <div className="w-80 bg-white/70 backdrop-blur-sm border-l border-white/50 flex flex-col shadow-xl">
//       {/* Search and Navigation */}
//       <div className="p-6 border-b border-gray-200/50">
//         <div className="relative mb-6">
//           <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//           <input
//             type="text"
//             placeholder="🔍 Search notes..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
//           />
//         </div>
        
//         {/* Vertical Navigation Buttons */}
//         <div className="space-y-2">
//           <button
//             onClick={() => setActiveView('all')}
//             className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full ${
//               activeView === 'all' 
//                 ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
//                 : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
//             }`}
//           >
//             <FileText size={18} />
//             📄 All Notes
//             <span className="ml-auto bg-white/20 px-2 py-1 rounded-full text-xs">
//               {notes.length}
//             </span>
//           </button>
//           <button
//             onClick={() => setActiveView('favorites')}
//             className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full ${
//               activeView === 'favorites' 
//                 ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
//                 : 'text-gray-600 hover:bg-yellow-50 hover:text-yellow-700'
//             }`}
//           >
//             <Star size={18} />
//             ⭐ Favorites
//             <span className="ml-auto bg-white/20 px-2 py-1 rounded-full text-xs">
//               {notes.filter(n => n.isFavorite).length}
//             </span>
//           </button>
//           <button
//             onClick={() => setActiveView('shared')}
//             className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full ${
//               activeView === 'shared' 
//                 ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
//                 : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
//             }`}
//           >
//             <Users size={18} />
//             👥 Shared
//             <span className="ml-auto bg-white/20 px-2 py-1 rounded-full text-xs">
//               {notes.filter(n => n.isShared).length}
//             </span>
//           </button>
//         </div>
//       </div>

//       {/* Notes List */}
//       <div className="flex-1 overflow-y-auto p-6">
//         {/* Unfiled Notes */}
//         {groupedNotes.unfiled && (
//           <div className="mb-6">
//             <div className="flex items-center justify-between mb-3">
//               <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
//                 📋 Unfiled Notes
//                 <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
//                   {groupedNotes.unfiled.length}
//                 </span>
//               </h3>
//               <button
//                 onClick={() => createNote(null)}
//                 className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                 title="Add note to Unfiled"
//               >
//                 <Plus size={14} />
//               </button>
//             </div>
//             <div className="space-y-3">
//               {groupedNotes.unfiled.map(note => (
//                 <NoteItem
//                   key={note.id}
//                   note={note}
//                   isActive={activeNote?.id === note.id}
//                   onClick={() => setActiveNote(note)}
//                   onToggleFavorite={() => toggleFavorite(note.id)}
//                   onDelete={() => deleteNote(note.id)}
//                   onMoveToFolder={(folderId) => moveNoteToFolder(note.id, folderId)}
//                   folders={folders}
//                 />
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Folders */}
//         {folders.map(folder => {
//           const folderNotes = groupedNotes[folder.id] || [];
//           if (folderNotes.length === 0 && activeView !== 'all') return null;

//           return (
//             <div key={folder.id} className="mb-6">
//               <button
//                 onClick={() => toggleFolder(folder.id)}
//                 className="flex items-center justify-between w-full text-left text-sm font-semibold text-gray-700 hover:text-blue-700 mb-3 p-2 hover:bg-blue-50 rounded-lg transition-all duration-200"
//               >
//                 <div className="flex items-center gap-2">
//                   <Folder size={16} className={folder.isExpanded ? 'text-blue-500' : 'text-gray-400'} />
//                   📁 {folder.name}
//                   <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
//                     {folderNotes.length}
//                   </span>
//                 </div>
//                 <div className="flex items-center gap-1">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       createNote(folder.id);
//                     }}
//                     className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
//                     title={`Add note to ${folder.name}`}
//                   >
//                     <Plus size={12} />
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       deleteFolder(folder.id);
//                     }}
//                     className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
//                     title="Delete folder"
//                   >
//                     <Trash2 size={12} />
//                   </button>
//                   <div className={`transform transition-transform ${folder.isExpanded ? 'rotate-90' : ''}`}>
//                     ▶
//                   </div>
//                 </div>
//               </button>
//               {folder.isExpanded && (
//                 <div className="space-y-3 ml-6 border-l-2 border-blue-100 pl-4">
//                   {folderNotes.map(note => (
//                     <NoteItem
//                       key={note.id}
//                       note={note}
//                       isActive={activeNote?.id === note.id}
//                       onClick={() => setActiveNote(note)}
//                       onToggleFavorite={() => toggleFavorite(note.id)}
//                       onDelete={() => deleteNote(note.id)}
//                       onMoveToFolder={(folderId) => moveNoteToFolder(note.id, folderId)}
//                       folders={folders}
//                     />
//                   ))}
//                 </div>
//               )}
//             </div>
//           );
//         })}

//         {filteredNotes.length === 0 && (
//           <div className="text-center py-12 text-gray-500">
//             <div className="text-6xl mb-4">📝</div>
//             <p className="text-lg font-medium">No notes found</p>
//             <p className="text-sm mt-1">Try adjusting your search or create a new note</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }