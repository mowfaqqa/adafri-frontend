// Shared types for the Notes application

export interface Note {
  id: string;
  title: string;
  content: string;
  collectionId: string; // Notes always belong to a collection
  folderId?: string | null; // Optional folder within collection
  isFavorite: boolean;
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteFolder {
  id: string;
  name: string;
  collectionId: string; // Folders belong to collections
  isExpanded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  isExpanded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ActiveView = 'all' | 'favorites' | 'shared';

export type ModalType = 'collection' | 'folder' | 'note';

export interface ModalAction {
  type: ModalType;
  itemId: string;
  position: { x: number; y: number };
}

// Props interfaces for components
export interface NotesAppProps {
  className?: string;
  // Add any other props your main app component might need
}

export interface NotesSidebarProps {
  notes: Note[];
  folders: NoteFolder[];
  collections: Collection[];
  activeNote: Note | null;
  activeView: ActiveView;
  searchQuery: string;
  setActiveNote: (note: Note | null) => void;
  setActiveView: (view: ActiveView) => void;
  setSearchQuery: (query: string) => void;
  toggleFavorite: (noteId: string) => void;
  toggleShare: (noteId: string) => void;
  deleteNote: (noteId: string) => void;
  toggleFolder: (folderId: string) => void;
  deleteFolder: (folderId: string) => void;
  toggleCollection: (collectionId: string) => void;
  deleteCollection: (collectionId: string) => void;
  createNote: (collectionId: string, folderId?: string | null) => void;
  createFolder: (collectionId: string, name: string) => void;
  createCollection: (name: string, description?: string) => void;
  moveNoteToFolder: (noteId: string, folderId: string | null) => void;
  moveNoteToCollection: (noteId: string, collectionId: string) => void;
  renameNote: (noteId: string, newTitle: string) => void;
  renameFolder: (folderId: string, newName: string) => void;
  renameCollection: (collectionId: string, newName: string) => void;
  showModal: (action: ModalAction) => void;
  openInView: (type: 'collection' | 'folder', itemId: string) => void;
  onShowCreateCollectionModal?: () => void;
}

export interface NoteItemProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  onToggleFavorite: () => void;
  onToggleShare: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
  onMoveToFolder?: (folderId: string | null) => void;
  onMoveToCollection?: (collectionId: string) => void;
  folders?: NoteFolder[];
  collections?: Collection[];
  showModal: (action: ModalAction) => void;
}

export interface CollectionItemProps {
  show: boolean;
  type: 'note' | 'folder';
  collection: Collection;
  notes: Note[];
  folders: NoteFolder[];
  activeNote: Note | null;
  onToggleExpansion: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onCreateNote: (collectionId: string) => void;
  onCreateFolder: (collectionId: string, name: string) => void;
  onNoteClick: (note: Note) => void;
  onNoteFavorite: (noteId: string) => void;
  onNoteShare: (noteId: string) => void;
  onNoteDelete: (noteId: string) => void;
  onNoteRename: (noteId: string, newTitle: string) => void;
  onFolderToggle: (folderId: string) => void;
  onFolderRename: (folderId: string, newName: string) => void;
  onFolderDelete: (folderId: string) => void;
  onMoveNote: (noteId: string, folderId: string | null) => void;
  showModal: (action: ModalAction) => void;
  openInView: (type: 'collection' | 'folder', itemId: string) => void;
  editingId: string | null;
  editingValue: string;
  onStartEditing: (id: string, value: string, type: 'collection' | 'folder') => void;
  onSaveEdit: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSetEditingValue: (value: string) => void;
  onContextMenu: (e: React.MouseEvent, type: 'collection', id: string) => void;
  onNoteContextMenu: (e: React.MouseEvent, noteId: string) => void;
  onFolderProps: {
    onToggleFolder: (folderId: string) => void;
    onCreateNoteInFolder: (collectionId: string, folderId: string) => void;
    onFolderContextMenu: (e: React.MouseEvent, folderId: string) => void;
    onCreateFolder: (collectionId: string) => void;
  };
}

export interface FolderItemProps {
  folder: NoteFolder;
  notes: Note[];
  activeNote: Note | null;
  onToggleExpansion: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onCreateNote: (folderId: string) => void;
  onNoteClick: (note: Note) => void;
  onNoteFavorite: (noteId: string) => void;
  onNoteShare: (noteId: string) => void;
  onNoteDelete: (noteId: string) => void;
  onNoteRename: (noteId: string, newTitle: string) => void;
  onMoveNote: (noteId: string, folderId: string | null) => void;
  folders: NoteFolder[];
  collections: Collection[];
  showModal: (action: ModalAction) => void;
  openInView: (type: 'collection' | 'folder', itemId: string) => void;
}

// Additional component interfaces for new components
export interface NoteEditorProps {
  note: Note;
  isEditing: boolean;
  onUpdateNote: (updates: Partial<Note>) => void;
  onToggleFavorite: (noteId: string) => void;
  onToggleShare: (noteId: string) => void;
}

export interface NotesGridProps {
  notes: Note[];
  collections: Collection[];
  folders: NoteFolder[];
  activeView: ActiveView;
  viewingCollection: string | null;
  viewingFolder: string | null;
  onSelectNote: (note: Note) => void;
  onShowModal: (action: ModalAction) => void;
  onCreateNote: () => void;
}

export interface CreateModalProps {
  show: boolean;
  onClose: () => void;
  onCreateWithCollection: (type: 'note' | 'folder') => void;
}

export interface CollectionSelectorProps {
  show: boolean;
  type: 'note' | 'folder';
  collections: Collection[];
  notes: Note[];
  folders: NoteFolder[];
  onClose: () => void;
  onExecuteCreate: (collectionId: string, folderName?: string) => void;
}

export interface CreateCollectionModalProps {
  show: boolean;
  onClose: () => void;
  onCreateCollection: (name: string, description?: string) => void;
}

export interface EmptyStateProps {
  onCreateNote: () => void;
}

export interface ContextMenuProps {
  contextMenu: ModalAction;
  onOpenInView: (type: 'collection' | 'folder', itemId: string) => void;
  onRename: (type: 'collection' | 'folder' | 'note', itemId: string) => void;
  onDelete: (type: 'collection' | 'folder' | 'note', itemId: string) => void;
  onToggleFavorite: (noteId: string) => void;
  onToggleShare: (noteId: string) => void;
  onCreateFolder: (collectionId: string) => void;
  onMove: (type: 'note' | 'folder', itemId: string) => void;
  onClose: () => void;
}

export interface ContextMenuWrapperProps {
  contextMenu: ModalAction | null;
  notes: Note[];
  folders: NoteFolder[];
  collections: Collection[];
  onOpenInView: (type: 'collection' | 'folder', itemId: string) => void;
  onRename: (type: 'collection' | 'folder' | 'note', itemId: string) => void;
  onDelete: (type: 'collection' | 'folder' | 'note', itemId: string) => void;
  onToggleFavorite: (noteId: string) => void;
  onToggleShare: (noteId: string) => void;
  onCreateFolder: (collectionId: string) => void;
  onMove: (type: 'note' | 'folder', itemId: string) => void;
  onClose: () => void;
}

// Team member interface for collection creation
export interface TeamMember {
  email: string;
  role: 'viewer' | 'editor' | 'moderator';
}

export interface CollectionData {
  name: string;
  isPrivate: boolean;
  teamMembers: TeamMember[];
}








































// export interface NotesSidebarProps {
//   notes: Note[];
//   folders: NoteFolder[];
//   collections: Collection[];
//   activeNote: Note | null;
//   activeView: ActiveView;
//   searchQuery: string;
//   setActiveNote: (note: Note) => void;
//   setActiveView: (view: ActiveView) => void;
//   setSearchQuery: (query: string) => void;
//   toggleFavorite: (noteId: string) => void;
//   toggleShare: (noteId: string) => void;
//   deleteNote: (noteId: string) => void;
//   toggleFolder: (folderId: string) => void;
//   deleteFolder: (folderId: string) => void;
//   toggleCollection: (collectionId: string) => void;
//   deleteCollection: (collectionId: string) => void;
//   createNote: (collectionId: string, folderId?: string | null) => void;
//   createFolder: (collectionId: string, name: string) => void;
//   createCollection: (name: string, description?: string) => void;
//   moveNoteToFolder: (noteId: string, folderId: string | null) => void;
//   moveNoteToCollection: (noteId: string, collectionId: string) => void;
//   renameNote: (noteId: string, newTitle: string) => void;
//   renameFolder: (folderId: string, newName: string) => void;
//   renameCollection: (collectionId: string, newName: string) => void;
//   showModal: (action: ModalAction) => void;
//   openInView: (type: 'collection' | 'folder', itemId: string) => void;
// }// Shared types for the Notes application

// export interface Note {
//   id: string;
//   title: string;
//   content: string;
//   collectionId: string; // Notes always belong to a collection
//   folderId?: string | null; // Optional folder within collection
//   isFavorite: boolean;
//   isShared: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface NoteFolder {
//   id: string;
//   name: string;
//   collectionId: string; // Folders belong to collections
//   isExpanded: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface Collection {
//   id: string;
//   name: string;
//   description?: string;
//   isExpanded: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export type ActiveView = 'all' | 'favorites' | 'shared';

// export type ModalType = 'collection' | 'folder' | 'note';

// export interface ModalAction {
//   type: ModalType;
//   itemId: string;
//   position: { x: number; y: number };
// }

// // Props interfaces for components
// export interface NotesAppProps {
//   // Main app component props (if needed for external usage)
// }

// export interface NotesSidebarProps {
//   notes: Note[];
//   folders: NoteFolder[];
//   collections: Collection[];
//   activeNote: Note | null;
//   activeView: ActiveView;
//   searchQuery: string;
//   setActiveNote: (note: Note) => void;
//   setActiveView: (view: ActiveView) => void;
//   setSearchQuery: (query: string) => void;
//   toggleFavorite: (noteId: string) => void;
//   toggleShare: (noteId: string) => void;
//   deleteNote: (noteId: string) => void;
//   toggleFolder: (folderId: string) => void;
//   deleteFolder: (folderId: string) => void;
//   toggleCollection: (collectionId: string) => void;
//   deleteCollection: (collectionId: string) => void;
//   createNote: (collectionId: string, folderId?: string | null) => void;
//   createFolder: (collectionId: string, name: string) => void;
//   createCollection: (name: string, description?: string) => void;
//   moveNoteToFolder: (noteId: string, folderId: string | null) => void;
//   moveNoteToCollection: (noteId: string, collectionId: string) => void;
//   renameNote: (noteId: string, newTitle: string) => void;
//   renameFolder: (folderId: string, newName: string) => void;
//   renameCollection: (collectionId: string, newName: string) => void;
//   showModal: (action: ModalAction) => void;
// }

// export interface NoteItemProps {
//   note: Note;
//   isActive: boolean;
//   onClick: () => void;
//   onToggleFavorite: () => void;
//   onToggleShare: () => void;
//   onDelete: () => void;
//   onRename: (newTitle: string) => void;
//   onMoveToFolder?: (folderId: string | null) => void;
//   onMoveToCollection?: (collectionId: string) => void;
//   folders?: NoteFolder[];
//   collections?: Collection[];
//   showModal: (action: ModalAction) => void;
// }

// export interface CollectionItemProps {
//   collection: Collection;
//   notes: Note[];
//   folders: NoteFolder[];
//   activeNote: Note | null;
//   onToggleExpansion: () => void;
//   onRename: (newName: string) => void;
//   onDelete: () => void;
//   onCreateNote: (collectionId: string) => void;
//   onCreateFolder: (collectionId: string, name: string) => void;
//   onNoteClick: (note: Note) => void;
//   onNoteFavorite: (noteId: string) => void;
//   onNoteShare: (noteId: string) => void;
//   onNoteDelete: (noteId: string) => void;
//   onNoteRename: (noteId: string, newTitle: string) => void;
//   onFolderToggle: (folderId: string) => void;
//   onFolderRename: (folderId: string, newName: string) => void;
//   onFolderDelete: (folderId: string) => void;
//   onMoveNote: (noteId: string, folderId: string | null) => void;
//   showModal: (action: ModalAction) => void;
// }

// export interface FolderItemProps {
//   folder: NoteFolder;
//   notes: Note[];
//   activeNote: Note | null;
//   onToggleExpansion: () => void;
//   onRename: (newName: string) => void;
//   onDelete: () => void;
//   onCreateNote: (folderId: string) => void;
//   onNoteClick: (note: Note) => void;
//   onNoteFavorite: (noteId: string) => void;
//   onNoteShare: (noteId: string) => void;
//   onNoteDelete: (noteId: string) => void;
//   onNoteRename: (noteId: string, newTitle: string) => void;
//   onMoveNote: (noteId: string, folderId: string | null) => void;
//   folders: NoteFolder[];
//   collections: Collection[];
//   showModal: (action: ModalAction) => void;
// }




















































// // Shared types for the Notes application

// export interface Note {
//   id: string;
//   title: string;
//   content: string;
//   folderId: string | null;
//   isFavorite: boolean;
//   isShared: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface NoteFolder {
//   id: string;
//   name: string;
//   isExpanded: boolean;
// }

// export type ActiveView = 'all' | 'favorites' | 'shared';

// // Props interfaces for components
// export interface NotesAppProps {
//   // Main app component props (if needed for external usage)
// }

// export interface NotesSidebarProps {
//   notes: Note[];
//   folders: NoteFolder[];
//   activeNote: Note | null;
//   activeView: ActiveView;
//   searchQuery: string;
//   setActiveNote: (note: Note) => void;
//   setActiveView: (view: ActiveView) => void;
//   setSearchQuery: (query: string) => void;
//   toggleFavorite: (noteId: string) => void;
//   deleteNote: (noteId: string) => void;
//   toggleFolder: (folderId: string) => void;
//   deleteFolder: (folderId: string) => void;
//   createNote: (folderId?: string | null) => void;
//   moveNoteToFolder: (noteId: string, folderId: string | null) => void;
// }

// export interface NoteItemProps {
//   note: Note;
//   isActive: boolean;
//   onClick: () => void;
//   onToggleFavorite: () => void;
//   onDelete: () => void;
//   onMoveToFolder?: (folderId: string | null) => void;
//   folders?: NoteFolder[];
// }