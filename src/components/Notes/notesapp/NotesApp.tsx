import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import NotesSidebar from '../notessidebar/NotesSidebar';
import NoteEditor from './NoteEditor';
import NotesGrid from './NotesGrid';
import CreateModal from './CreateModal';
import CollectionSelector from './CollectionSelector';
import CreateCollectionModal from './CreateCollectionModal';
import EmptyState from './EmptyState';
import ContextMenuWrapper from './ContextMenuWrapper';
import { DeleteModal, InlineEditor } from './InlineEditorModal';
import { Note, NoteFolder, Collection, ActiveView, ModalAction } from '@/lib/types/notes/types';

// Initial data
const initialCollections: Collection[] = [
  { 
    id: 'personal', 
    name: 'Personal', 
    description: 'Personal notes and thoughts',
    isExpanded: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  { 
    id: 'work', 
    name: 'Work', 
    description: 'Work-related notes and projects',
    isExpanded: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
];

const initialFolders: NoteFolder[] = [
  { 
    id: 'personal-ideas', 
    name: 'Ideas', 
    collectionId: 'personal',
    isExpanded: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  { 
    id: 'work-projects', 
    name: 'Projects', 
    collectionId: 'work',
    isExpanded: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
];

const initialNotes: Note[] = [
  {
    id: '1',
    title: 'Welcome to Djombi Notes',
    content: 'This is your first note! Start writing your thoughts here.',
    collectionId: 'personal',
    folderId: 'personal-ideas',
    isFavorite: true,
    isShared: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: '2',
    title: 'Project Planning',
    content: 'List of project ideas to work on this quarter...',
    collectionId: 'work',
    folderId: 'work-projects',
    isFavorite: false,
    isShared: true,
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02'),
  },
  {
    id: '3',
    title: 'Meeting Notes',
    content: 'Notes from today\'s team meeting...',
    collectionId: 'work',
    folderId: null,
    isFavorite: true,
    isShared: false,
    createdAt: new Date('2025-01-03'),
    updatedAt: new Date('2025-01-03'),
  },
];

export default function NotesApp() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [folders, setFolders] = useState<NoteFolder[]>(initialFolders);
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [contextMenu, setContextMenu] = useState<ModalAction | null>(null);
  const [viewingCollection, setViewingCollection] = useState<string | null>(null);
  const [viewingFolder, setViewingFolder] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCollectionSelector, setShowCollectionSelector] = useState<{
    type: 'note' | 'folder';
    show: boolean;
  }>({ type: 'note', show: false });
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
  
  // New state for modals and inline editing
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    type: 'collection' | 'folder' | 'note';
    itemId: string;
    itemName: string;
  } | null>(null);
  
  const [editingItem, setEditingItem] = useState<{
    type: 'collection' | 'folder' | 'note';
    itemId: string;
  } | null>(null);

  // Auto-save functionality
  useEffect(() => {
    if (activeNote && isEditing) {
      const timer = setTimeout(() => {
        setNotes(prev => prev.map(note => 
          note.id === activeNote.id ? { ...activeNote, updatedAt: new Date() } : note
        ));
        setIsEditing(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeNote, isEditing]);

  // Create new note
  const createNote = (collectionId: string, folderId?: string | null) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      collectionId,
      folderId: folderId || null,
      isFavorite: false,
      isShared: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNote(newNote);
    setActiveView('all');
  };

  // Handle page navigation from TinyMCE links
  const handleNavigateToPage = (pageTitle: string) => {
    // Find the note with matching title
    const targetNote = notes.find(note => 
      note.title.toLowerCase() === pageTitle.toLowerCase()
    );
    
    if (targetNote) {
      setActiveNote(targetNote);
      // Clear any view filters to ensure the note is accessible
      setViewingCollection(null);
      setViewingFolder(null);
      setActiveView('all');
    } else {
      // If note doesn't exist, create it
      handleCreatePage(pageTitle);
    }
  };

  // Handle page creation from TinyMCE editor
  const handleCreatePage = (title: string) => {
    const currentCollectionId = activeNote?.collectionId || 'personal';
    const currentFolderId = activeNote?.folderId || null;
    
    const newNote: Note = {
      id: Date.now().toString(),
      title: title.trim() || 'Untitled Page',
      content: '<p>Start writing your page content here...</p>',
      collectionId: currentCollectionId,
      folderId: currentFolderId,
      isFavorite: false,
      isShared: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setNotes(prev => [newNote, ...prev]);
    return newNote.id;
  };

  // Create new collection
  const createCollection = (name: string, description?: string) => {
    if (name.trim()) {
      const newCollection: Collection = {
        id: Date.now().toString(),
        name: name.trim(),
        description: description?.trim(),
        isExpanded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCollections(prev => [...prev, newCollection]);
      setShowCreateCollectionModal(false);
    }
  };

  // Create new folder (now with modal instead of prompt)
  const createFolder = (collectionId: string, name: string) => {
    if (name.trim()) {
      const newFolder: NoteFolder = {
        id: Date.now().toString(),
        name: name.trim(),
        collectionId,
        isExpanded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setFolders(prev => [...prev, newFolder]);
    }
  };

  // Delete collection with modal
  const deleteCollection = (collectionId: string) => {
    setNotes(prev => prev.filter(note => note.collectionId !== collectionId));
    setFolders(prev => prev.filter(folder => folder.collectionId !== collectionId));
    setCollections(prev => prev.filter(collection => collection.id !== collectionId));
    if (activeNote?.collectionId === collectionId) {
      setActiveNote(null);
    }
    setDeleteModal(null);
  };

  // Delete folder with modal
  const deleteFolder = (folderId: string) => {
    setNotes(prev => prev.map(note => 
      note.folderId === folderId ? { ...note, folderId: null } : note
    ));
    setFolders(prev => prev.filter(folder => folder.id !== folderId));
    setDeleteModal(null);
  };

  // Delete note with modal
  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    if (activeNote?.id === noteId) {
      setActiveNote(null);
    }
    setDeleteModal(null);
  };

  // Update note
  const updateNote = (updates: Partial<Note>) => {
    if (activeNote) {
      const updatedNote = { ...activeNote, ...updates, updatedAt: new Date() };
      setActiveNote(updatedNote);
      setNotes(prev => prev.map(note => 
        note.id === activeNote.id ? updatedNote : note
      ));
      setIsEditing(true);
    }
  };

  // Toggle favorite
  const toggleFavorite = (noteId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId ? { ...note, isFavorite: !note.isFavorite } : note
    ));
    if (activeNote?.id === noteId) {
      setActiveNote(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  // Toggle share
  const toggleShare = (noteId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId ? { ...note, isShared: !note.isShared } : note
    ));
    if (activeNote?.id === noteId) {
      setActiveNote(prev => prev ? { ...prev, isShared: !prev.isShared } : null);
    }
  };

  // Toggle expansions
  const toggleCollection = (collectionId: string) => {
    setCollections(prev => prev.map(collection => 
      collection.id === collectionId ? { ...collection, isExpanded: !collection.isExpanded } : collection
    ));
  };

  const toggleFolder = (folderId: string) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, isExpanded: !folder.isExpanded } : folder
    ));
  };

  // Move functions
  const moveNoteToFolder = (noteId: string, folderId: string | null) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId ? { ...note, folderId } : note
    ));
    if (activeNote?.id === noteId) {
      setActiveNote(prev => prev ? { ...prev, folderId } : null);
    }
  };

  const moveNoteToCollection = (noteId: string, collectionId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId ? { ...note, collectionId, folderId: null } : note
    ));
    if (activeNote?.id === noteId) {
      setActiveNote(prev => prev ? { ...prev, collectionId, folderId: null } : null);
    }
  };

  // Rename functions with inline editing
  const renameNote = (noteId: string, newTitle: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId ? { ...note, title: newTitle.trim() } : note
    ));
    if (activeNote?.id === noteId) {
      setActiveNote(prev => prev ? { ...prev, title: newTitle.trim() } : null);
    }
    setEditingItem(null);
  };

  const renameFolder = (folderId: string, newName: string) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, name: newName.trim() } : folder
    ));
    setEditingItem(null);
  };

  const renameCollection = (collectionId: string, newName: string) => {
    setCollections(prev => prev.map(collection => 
      collection.id === collectionId ? { ...collection, name: newName.trim() } : collection
    ));
    setEditingItem(null);
  };

  // Show modal
  const showModal = (action: ModalAction) => {
    setContextMenu(action);
  };

  // Handle "Open in View" functionality
  const openInView = (type: 'collection' | 'folder', itemId: string) => {
    if (type === 'collection') {
      setViewingCollection(itemId);
      setViewingFolder(null);
      setActiveView('all');
      setActiveNote(null);
    } else if (type === 'folder') {
      setViewingFolder(itemId);
      setViewingCollection(null);
      setActiveView('all');
      setActiveNote(null);
    }
  };

  // Handle view changes from sidebar
  const handleViewChange = (view: ActiveView) => {
    setActiveView(view);
    setViewingCollection(null);
    setViewingFolder(null);
    setActiveNote(null);
  };

  // Get notes for current view
  const getNotesForView = () => {
    let filtered = notes;
    
    if (viewingCollection) {
      filtered = notes.filter(note => note.collectionId === viewingCollection);
    } else if (viewingFolder) {
      filtered = notes.filter(note => note.folderId === viewingFolder);
    } else {
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
    }

    if (searchQuery) {
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const displayNotes = getNotesForView();

  // Get current view title
  const getViewTitle = () => {
    if (viewingCollection) {
      const collection = collections.find(c => c.id === viewingCollection);
      return `📁 ${collection?.name || 'Collection'}`;
    } else if (viewingFolder) {
      const folder = folders.find(f => f.id === viewingFolder);
      return `📂 ${folder?.name || 'Folder'}`;
    } else {
      return activeView === 'favorites' ? '⭐ Favorites' : 
             activeView === 'shared' ? '👥 Shared Notes' : '📝 My Notes';
    }
  };

  const getViewDescription = () => {
    if (viewingCollection) {
      const collection = collections.find(c => c.id === viewingCollection);
      return collection?.description || 'Collection contents';
    } else if (viewingFolder) {
      return 'Folder contents';
    } else {
      return activeView === 'favorites' ? 'Your starred notes' : 
             activeView === 'shared' ? 'Notes shared with others' : 'All your notes in one place';
    }
  };

  // Handle creating with collection selection
  const handleCreateWithCollection = (type: 'note' | 'folder') => {
    setShowCollectionSelector({ type, show: true });
  };

  const executeCreateWithCollection = (collectionId: string, folderName?: string) => {
    if (showCollectionSelector.type === 'note') {
      createNote(collectionId);
    } else {
      if (folderName) {
        createFolder(collectionId, folderName);
      }
    }
    setShowCollectionSelector({ type: 'note', show: false });
  };

  // Handle context menu actions with modals
  const handleRename = (type: 'collection' | 'folder' | 'note', itemId: string) => {
    setEditingItem({ type, itemId });
    setContextMenu(null);
  };

  const handleDelete = (type: 'collection' | 'folder' | 'note', itemId: string) => {
    let itemName = '';
    
    if (type === 'collection') {
      const collection = collections.find(c => c.id === itemId);
      itemName = collection?.name || '';
    } else if (type === 'folder') {
      const folder = folders.find(f => f.id === itemId);
      itemName = folder?.name || '';
    } else {
      const note = notes.find(n => n.id === itemId);
      itemName = note?.title || '';
    }
    
    setDeleteModal({
      show: true,
      type,
      itemId,
      itemName
    });
    setContextMenu(null);
  };

  const confirmDelete = () => {
    if (!deleteModal) return;
    
    if (deleteModal.type === 'collection') {
      deleteCollection(deleteModal.itemId);
    } else if (deleteModal.type === 'folder') {
      deleteFolder(deleteModal.itemId);
    } else {
      deleteNote(deleteModal.itemId);
    }
  };

  // Updated folder creation handler (now triggers modal in sidebar)
  const handleCreateFolder = (collectionId: string) => {
    // This will be handled by the sidebar's modal system
    console.log(`Create folder in collection ${collectionId}`);
  };

  const handleMove = (type: 'note' | 'folder', itemId: string) => {
    console.log(`Move ${type} ${itemId}`);
  };

  // Get current value for inline editing
  const getCurrentEditValue = () => {
    if (!editingItem) return '';
    
    if (editingItem.type === 'collection') {
      const collection = collections.find(c => c.id === editingItem.itemId);
      return collection?.name || '';
    } else if (editingItem.type === 'folder') {
      const folder = folders.find(f => f.id === editingItem.itemId);
      return folder?.name || '';
    } else {
      const note = notes.find(n => n.id === editingItem.itemId);
      return note?.title || '';
    }
  };

  const handleInlineEditSave = (newValue: string) => {
    if (!editingItem) return;
    
    if (editingItem.type === 'collection') {
      renameCollection(editingItem.itemId, newValue);
    } else if (editingItem.type === 'folder') {
      renameFolder(editingItem.itemId, newValue);
    } else {
      renameNote(editingItem.itemId, newValue);
    }
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu && !(e.target as Element).closest('.context-menu')) {
        setContextMenu(null);
      }
    };
    
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {getViewTitle()}
                </h1>
                {(viewingCollection || viewingFolder) && (
                  <button
                    onClick={() => {
                      setViewingCollection(null);
                      setViewingFolder(null);
                      setActiveView('all');
                      setActiveNote(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Back to all notes"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
              <p className="text-gray-600 text-sm">
                {getViewDescription()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
              >
                <Plus size={18} />
                Create New
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeNote ? (
            <div className="h-full p-6">
              <NoteEditor
                note={activeNote}
                isEditing={isEditing}
                onUpdateNote={updateNote}
                onToggleFavorite={toggleFavorite}
                onToggleShare={toggleShare}
                onCreatePage={handleCreatePage}
                onNavigateToPage={handleNavigateToPage}
                notes={notes}
              />
            </div>
          ) : displayNotes.length > 0 ? (
            <div className="h-full p-6">
              <NotesGrid
                notes={displayNotes}
                collections={collections}
                folders={folders}
                activeView={activeView}
                viewingCollection={viewingCollection}
                viewingFolder={viewingFolder}
                onSelectNote={setActiveNote}
                onShowModal={showModal}
                onCreateNote={() => setShowCreateModal(true)}
              />
            </div>
          ) : (
            <div className="h-full p-6">
              <EmptyState onCreateNote={() => setShowCreateModal(true)} />
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <NotesSidebar
        notes={notes}
        folders={folders}
        collections={collections}
        activeNote={activeNote}
        activeView={activeView}
        searchQuery={searchQuery}
        setActiveNote={setActiveNote}
        setActiveView={handleViewChange}
        setSearchQuery={setSearchQuery}
        toggleFavorite={toggleFavorite}
        toggleShare={toggleShare}
        deleteNote={(noteId) => handleDelete('note', noteId)}
        toggleFolder={toggleFolder}
        deleteFolder={(folderId) => handleDelete('folder', folderId)}
        toggleCollection={toggleCollection}
        deleteCollection={(collectionId) => handleDelete('collection', collectionId)}
        createNote={createNote}
        createFolder={createFolder}
        createCollection={createCollection}
        moveNoteToFolder={moveNoteToFolder}
        moveNoteToCollection={moveNoteToCollection}
        renameNote={(noteId, newTitle) => handleRename('note', noteId)}
        renameFolder={(folderId, newName) => handleRename('folder', folderId)}
        renameCollection={(collectionId, newName) => handleRename('collection', collectionId)}
        showModal={showModal}
        openInView={openInView}
        onShowCreateCollectionModal={() => setShowCreateCollectionModal(true)}
        editingItem={editingItem}
        onInlineEditSave={handleInlineEditSave}
        onCancelEdit={() => setEditingItem(null)}
      />

      {/* Create New Modal */}
      <CreateModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateWithCollection={handleCreateWithCollection}
      />

      {/* Collection Selector Modal */}
      <CollectionSelector
        show={showCollectionSelector.show}
        type={showCollectionSelector.type}
        collections={collections}
        notes={notes}
        folders={folders}
        onClose={() => setShowCollectionSelector({ type: 'note', show: false })}
        onExecuteCreate={executeCreateWithCollection}
      />

      {/* Create Collection Modal */}
      <CreateCollectionModal
        show={showCreateCollectionModal}
        onClose={() => setShowCreateCollectionModal(false)}
        onCreateCollection={createCollection}
      />

      {/* Context Menu */}
      <ContextMenuWrapper
        contextMenu={contextMenu}
        notes={notes}
        folders={folders}
        collections={collections}
        onOpenInView={openInView}
        onRename={handleRename}
        onDelete={handleDelete}
        onToggleFavorite={toggleFavorite}
        onToggleShare={toggleShare}
        onCreateFolder={handleCreateFolder}
        onMove={handleMove}
        onClose={() => setContextMenu(null)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        show={deleteModal?.show || false}
        title={`Delete ${deleteModal?.type || ''}`}
        message={`Are you sure you want to delete this ${deleteModal?.type}? This action cannot be undone.`}
        itemName={deleteModal?.itemName}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal(null)}
      />

      {/* Inline Editor for renaming */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Rename {editingItem.type}
            </h3>
            <InlineEditor
              value={getCurrentEditValue()}
              onSave={handleInlineEditSave}
              onCancel={() => setEditingItem(null)}
              placeholder={`Enter ${editingItem.type} name...`}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}





















































































// 7/10/2`
// import React, { useState, useEffect } from 'react';
// import { Plus, X } from 'lucide-react';
// import NotesSidebar from '../notessidebar/NotesSidebar';
// import NoteEditor from './NoteEditor';
// import NotesGrid from './NotesGrid';
// import CreateModal from './CreateModal';
// import CollectionSelector from './CollectionSelector';
// import CreateCollectionModal from './CreateCollectionModal';
// import EmptyState from './EmptyState';
// import ContextMenuWrapper from './ContextMenuWrapper';
// import { Note, NoteFolder, Collection, ActiveView, ModalAction } from '@/lib/types/notes/types';

// // Initial data
// const initialCollections: Collection[] = [
//   { 
//     id: 'personal', 
//     name: 'Personal', 
//     description: 'Personal notes and thoughts',
//     isExpanded: true,
//     createdAt: new Date('2025-01-01'),
//     updatedAt: new Date('2025-01-01')
//   },
//   { 
//     id: 'work', 
//     name: 'Work', 
//     description: 'Work-related notes and projects',
//     isExpanded: true,
//     createdAt: new Date('2025-01-01'),
//     updatedAt: new Date('2025-01-01')
//   },
// ];

// const initialFolders: NoteFolder[] = [
//   { 
//     id: 'personal-ideas', 
//     name: 'Ideas', 
//     collectionId: 'personal',
//     isExpanded: true,
//     createdAt: new Date('2025-01-01'),
//     updatedAt: new Date('2025-01-01')
//   },
//   { 
//     id: 'work-projects', 
//     name: 'Projects', 
//     collectionId: 'work',
//     isExpanded: true,
//     createdAt: new Date('2025-01-01'),
//     updatedAt: new Date('2025-01-01')
//   },
// ];

// const initialNotes: Note[] = [
//   {
//     id: '1',
//     title: 'Welcome to Djombi Notes',
//     content: 'This is your first note! Start writing your thoughts here.',
//     collectionId: 'personal',
//     folderId: 'personal-ideas',
//     isFavorite: true,
//     isShared: false,
//     createdAt: new Date('2025-01-01'),
//     updatedAt: new Date('2025-01-01'),
//   },
//   {
//     id: '2',
//     title: 'Project Planning',
//     content: 'List of project ideas to work on this quarter...',
//     collectionId: 'work',
//     folderId: 'work-projects',
//     isFavorite: false,
//     isShared: true,
//     createdAt: new Date('2025-01-02'),
//     updatedAt: new Date('2025-01-02'),
//   },
//   {
//     id: '3',
//     title: 'Meeting Notes',
//     content: 'Notes from today\'s team meeting...',
//     collectionId: 'work',
//     folderId: null,
//     isFavorite: true,
//     isShared: false,
//     createdAt: new Date('2025-01-03'),
//     updatedAt: new Date('2025-01-03'),
//   },
// ];

// export default function NotesApp() {
//   const [notes, setNotes] = useState<Note[]>(initialNotes);
//   const [folders, setFolders] = useState<NoteFolder[]>(initialFolders);
//   const [collections, setCollections] = useState<Collection[]>(initialCollections);
//   const [activeNote, setActiveNote] = useState<Note | null>(null);
//   const [activeView, setActiveView] = useState<ActiveView>('all');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isEditing, setIsEditing] = useState(false);
//   const [contextMenu, setContextMenu] = useState<ModalAction | null>(null);
//   const [viewingCollection, setViewingCollection] = useState<string | null>(null);
//   const [viewingFolder, setViewingFolder] = useState<string | null>(null);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showCollectionSelector, setShowCollectionSelector] = useState<{
//     type: 'note' | 'folder';
//     show: boolean;
//   }>({ type: 'note', show: false });
//   const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);

//   // Auto-save functionality
//   useEffect(() => {
//     if (activeNote && isEditing) {
//       const timer = setTimeout(() => {
//         setNotes(prev => prev.map(note => 
//           note.id === activeNote.id ? { ...activeNote, updatedAt: new Date() } : note
//         ));
//         setIsEditing(false);
//       }, 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [activeNote, isEditing]);

//   // Create new note
//   const createNote = (collectionId: string, folderId?: string | null) => {
//     const newNote: Note = {
//       id: Date.now().toString(),
//       title: 'Untitled Note',
//       content: '',
//       collectionId,
//       folderId: folderId || null,
//       isFavorite: false,
//       isShared: false,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };
//     setNotes(prev => [newNote, ...prev]);
//     setActiveNote(newNote);
//     setActiveView('all');
//   };

//   // Create new collection
//   const createCollection = (name: string, description?: string) => {
//     if (name.trim()) {
//       const newCollection: Collection = {
//         id: Date.now().toString(),
//         name: name.trim(),
//         description: description?.trim(),
//         isExpanded: true,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };
//       setCollections(prev => [...prev, newCollection]);
//       setShowCreateCollectionModal(false);
//     }
//   };

//   // Create new folder
//   const createFolder = (collectionId: string, name: string) => {
//     if (name.trim()) {
//       const newFolder: NoteFolder = {
//         id: Date.now().toString(),
//         name: name.trim(),
//         collectionId,
//         isExpanded: true,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };
//       setFolders(prev => [...prev, newFolder]);
//     }
//   };

//   // Delete collection
//   const deleteCollection = (collectionId: string) => {
//     setNotes(prev => prev.filter(note => note.collectionId !== collectionId));
//     setFolders(prev => prev.filter(folder => folder.collectionId !== collectionId));
//     setCollections(prev => prev.filter(collection => collection.id !== collectionId));
//     if (activeNote?.collectionId === collectionId) {
//       setActiveNote(null);
//     }
//   };

//   // Delete folder
//   const deleteFolder = (folderId: string) => {
//     setNotes(prev => prev.map(note => 
//       note.folderId === folderId ? { ...note, folderId: null } : note
//     ));
//     setFolders(prev => prev.filter(folder => folder.id !== folderId));
//   };

//   // Update note
//   const updateNote = (updates: Partial<Note>) => {
//     if (activeNote) {
//       const updatedNote = { ...activeNote, ...updates, updatedAt: new Date() };
//       setActiveNote(updatedNote);
//       setNotes(prev => prev.map(note => 
//         note.id === activeNote.id ? updatedNote : note
//       ));
//       setIsEditing(true);
//     }
//   };

//   // Toggle favorite
//   const toggleFavorite = (noteId: string) => {
//     setNotes(prev => prev.map(note => 
//       note.id === noteId ? { ...note, isFavorite: !note.isFavorite } : note
//     ));
//     if (activeNote?.id === noteId) {
//       setActiveNote(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
//     }
//   };

//   // Toggle share
//   const toggleShare = (noteId: string) => {
//     setNotes(prev => prev.map(note => 
//       note.id === noteId ? { ...note, isShared: !note.isShared } : note
//     ));
//     if (activeNote?.id === noteId) {
//       setActiveNote(prev => prev ? { ...prev, isShared: !prev.isShared } : null);
//     }
//   };

//   // Delete note
//   const deleteNote = (noteId: string) => {
//     setNotes(prev => prev.filter(note => note.id !== noteId));
//     if (activeNote?.id === noteId) {
//       setActiveNote(null);
//     }
//   };

//   // Toggle expansions
//   const toggleCollection = (collectionId: string) => {
//     setCollections(prev => prev.map(collection => 
//       collection.id === collectionId ? { ...collection, isExpanded: !collection.isExpanded } : collection
//     ));
//   };

//   const toggleFolder = (folderId: string) => {
//     setFolders(prev => prev.map(folder => 
//       folder.id === folderId ? { ...folder, isExpanded: !folder.isExpanded } : folder
//     ));
//   };

//   // Move functions
//   const moveNoteToFolder = (noteId: string, folderId: string | null) => {
//     setNotes(prev => prev.map(note => 
//       note.id === noteId ? { ...note, folderId } : note
//     ));
//     if (activeNote?.id === noteId) {
//       setActiveNote(prev => prev ? { ...prev, folderId } : null);
//     }
//   };

//   const moveNoteToCollection = (noteId: string, collectionId: string) => {
//     setNotes(prev => prev.map(note => 
//       note.id === noteId ? { ...note, collectionId, folderId: null } : note
//     ));
//     if (activeNote?.id === noteId) {
//       setActiveNote(prev => prev ? { ...prev, collectionId, folderId: null } : null);
//     }
//   };

//   // Rename functions
//   const renameNote = (noteId: string, newTitle: string) => {
//     setNotes(prev => prev.map(note => 
//       note.id === noteId ? { ...note, title: newTitle.trim() } : note
//     ));
//     if (activeNote?.id === noteId) {
//       setActiveNote(prev => prev ? { ...prev, title: newTitle.trim() } : null);
//     }
//   };

//   const renameFolder = (folderId: string, newName: string) => {
//     setFolders(prev => prev.map(folder => 
//       folder.id === folderId ? { ...folder, name: newName.trim() } : folder
//     ));
//   };

//   const renameCollection = (collectionId: string, newName: string) => {
//     setCollections(prev => prev.map(collection => 
//       collection.id === collectionId ? { ...collection, name: newName.trim() } : collection
//     ));
//   };

//   // Show modal
//   const showModal = (action: ModalAction) => {
//     setContextMenu(action);
//   };

//   // Handle "Open in View" functionality
//   const openInView = (type: 'collection' | 'folder', itemId: string) => {
//     if (type === 'collection') {
//       setViewingCollection(itemId);
//       setViewingFolder(null);
//       setActiveView('all');
//       setActiveNote(null); // Clear active note to show grid
//     } else if (type === 'folder') {
//       setViewingFolder(itemId);
//       setViewingCollection(null);
//       setActiveView('all');
//       setActiveNote(null); // Clear active note to show grid
//     }
//   };

//   // Handle view changes from sidebar
//   const handleViewChange = (view: ActiveView) => {
//     setActiveView(view);
//     setViewingCollection(null);
//     setViewingFolder(null);
//     setActiveNote(null); // Clear active note to show grid
//   };

//   // Get notes for current view
//   const getNotesForView = () => {
//     let filtered = notes;
    
//     if (viewingCollection) {
//       filtered = notes.filter(note => note.collectionId === viewingCollection);
//     } else if (viewingFolder) {
//       filtered = notes.filter(note => note.folderId === viewingFolder);
//     } else {
//       switch (activeView) {
//         case 'favorites':
//           filtered = notes.filter(note => note.isFavorite);
//           break;
//         case 'shared':
//           filtered = notes.filter(note => note.isShared);
//           break;
//         default:
//           filtered = notes;
//       }
//     }

//     if (searchQuery) {
//       filtered = filtered.filter(note => 
//         note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         note.content.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     return filtered;
//   };

//   const displayNotes = getNotesForView();

//   // Get current view title
//   const getViewTitle = () => {
//     if (viewingCollection) {
//       const collection = collections.find(c => c.id === viewingCollection);
//       return `📁 ${collection?.name || 'Collection'}`;
//     } else if (viewingFolder) {
//       const folder = folders.find(f => f.id === viewingFolder);
//       return `📂 ${folder?.name || 'Folder'}`;
//     } else {
//       return activeView === 'favorites' ? '⭐ Favorites' : 
//              activeView === 'shared' ? '👥 Shared Notes' : '📝 My Notes';
//     }
//   };

//   const getViewDescription = () => {
//     if (viewingCollection) {
//       const collection = collections.find(c => c.id === viewingCollection);
//       return collection?.description || 'Collection contents';
//     } else if (viewingFolder) {
//       return 'Folder contents';
//     } else {
//       return activeView === 'favorites' ? 'Your starred notes' : 
//              activeView === 'shared' ? 'Notes shared with others' : 'All your notes in one place';
//     }
//   };

//   // Handle creating with collection selection
//   const handleCreateWithCollection = (type: 'note' | 'folder') => {
//     setShowCollectionSelector({ type, show: true });
//   };

//   const executeCreateWithCollection = (collectionId: string, folderName?: string) => {
//     if (showCollectionSelector.type === 'note') {
//       createNote(collectionId);
//     } else {
//       if (folderName) {
//         createFolder(collectionId, folderName);
//       }
//     }
//     setShowCollectionSelector({ type: 'note', show: false });
//   };

//   // Handle context menu actions
//   const handleRename = (type: 'collection' | 'folder' | 'note', itemId: string) => {
//     let currentValue = '';
    
//     if (type === 'collection') {
//       const collection = collections.find(c => c.id === itemId);
//       currentValue = collection?.name || '';
//     } else if (type === 'folder') {
//       const folder = folders.find(f => f.id === itemId);
//       currentValue = folder?.name || '';
//     } else {
//       const note = notes.find(n => n.id === itemId);
//       currentValue = note?.title || '';
//     }
    
//     const newName = prompt(`Enter new ${type} name:`, currentValue);
//     if (newName && newName.trim() && newName.trim() !== currentValue) {
//       if (type === 'collection') {
//         renameCollection(itemId, newName.trim());
//       } else if (type === 'folder') {
//         renameFolder(itemId, newName.trim());
//       } else {
//         renameNote(itemId, newName.trim());
//       }
//     }
//   };

//   const handleDelete = (type: 'collection' | 'folder' | 'note', itemId: string) => {
//     if (type === 'collection') {
//       deleteCollection(itemId);
//     } else if (type === 'folder') {
//       deleteFolder(itemId);
//     } else {
//       deleteNote(itemId);
//     }
//   };

//   const handleCreateFolder = (collectionId: string) => {
//     const folderName = prompt('Enter folder name:');
//     if (folderName && folderName.trim()) {
//       createFolder(collectionId, folderName.trim());
//     }
//   };

//   const handleMove = (type: 'note' | 'folder', itemId: string) => {
//     // This would typically open a modal to select destination
//     console.log(`Move ${type} ${itemId}`);
//   };

//   // Close modal when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (contextMenu && !(e.target as Element).closest('.context-menu')) {
//         setContextMenu(null);
//       }
//     };
    
//     if (contextMenu) {
//       document.addEventListener('click', handleClickOutside);
//       return () => document.removeEventListener('click', handleClickOutside);
//     }
//   }, [contextMenu]);

//   return (
//     <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
//       {/* Main Content Area */}
//       <div className="flex-1 flex flex-col">
//         {/* Header */}
//         <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-6 shadow-sm">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="flex items-center gap-2 mb-2">
//                 <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
//                   {getViewTitle()}
//                 </h1>
//                 {(viewingCollection || viewingFolder) && (
//                   <button
//                     onClick={() => {
//                       setViewingCollection(null);
//                       setViewingFolder(null);
//                       setActiveView('all');
//                       setActiveNote(null);
//                     }}
//                     className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
//                     title="Back to all notes"
//                   >
//                     <X size={20} />
//                   </button>
//                 )}
//               </div>
//               <p className="text-gray-600 text-sm">
//                 {getViewDescription()}
//               </p>
//             </div>
//             <div className="flex items-center gap-3">
//               <button
//                 onClick={() => setShowCreateModal(true)}
//                 className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
//               >
//                 <Plus size={18} />
//                 Create New
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="flex-1 p-6">
//           {activeNote ? (
//             <NoteEditor
//               note={activeNote}
//               isEditing={isEditing}
//               onUpdateNote={updateNote}
//               onToggleFavorite={toggleFavorite}
//               onToggleShare={toggleShare}
//             />
//           ) : displayNotes.length > 0 ? (
//             <NotesGrid
//               notes={displayNotes}
//               collections={collections}
//               folders={folders}
//               activeView={activeView}
//               viewingCollection={viewingCollection}
//               viewingFolder={viewingFolder}
//               onSelectNote={setActiveNote}
//               onShowModal={showModal}
//               onCreateNote={() => setShowCreateModal(true)}
//             />
//           ) : (
//             <EmptyState onCreateNote={() => setShowCreateModal(true)} />
//           )}
//         </div>
//       </div>

//       {/* Sidebar */}
//       <NotesSidebar
//         notes={notes}
//         folders={folders}
//         collections={collections}
//         activeNote={activeNote}
//         activeView={activeView}
//         searchQuery={searchQuery}
//         setActiveNote={setActiveNote}
//         setActiveView={handleViewChange}
//         setSearchQuery={setSearchQuery}
//         toggleFavorite={toggleFavorite}
//         toggleShare={toggleShare}
//         deleteNote={deleteNote}
//         toggleFolder={toggleFolder}
//         deleteFolder={deleteFolder}
//         toggleCollection={toggleCollection}
//         deleteCollection={deleteCollection}
//         createNote={createNote}
//         createFolder={createFolder}
//         createCollection={createCollection}
//         moveNoteToFolder={moveNoteToFolder}
//         moveNoteToCollection={moveNoteToCollection}
//         renameNote={renameNote}
//         renameFolder={renameFolder}
//         renameCollection={renameCollection}
//         showModal={showModal}
//         openInView={openInView}
//         onShowCreateCollectionModal={() => setShowCreateCollectionModal(true)}
//       />

//       {/* Create New Modal */}
//       <CreateModal
//         show={showCreateModal}
//         onClose={() => setShowCreateModal(false)}
//         onCreateWithCollection={handleCreateWithCollection}
//       />

//       {/* Collection Selector Modal */}
//       <CollectionSelector
//         show={showCollectionSelector.show}
//         type={showCollectionSelector.type}
//         collections={collections}
//         notes={notes}
//         folders={folders}
//         onClose={() => setShowCollectionSelector({ type: 'note', show: false })}
//         onExecuteCreate={executeCreateWithCollection}
//       />

//       {/* Create Collection Modal */}
//       <CreateCollectionModal
//         show={showCreateCollectionModal}
//         onClose={() => setShowCreateCollectionModal(false)}
//         onCreateCollection={createCollection}
//       />

//       {/* Context Menu */}
//       <ContextMenuWrapper
//         contextMenu={contextMenu}
//         notes={notes}
//         folders={folders}
//         collections={collections}
//         onOpenInView={openInView}
//         onRename={handleRename}
//         onDelete={handleDelete}
//         onToggleFavorite={toggleFavorite}
//         onToggleShare={toggleShare}
//         onCreateFolder={handleCreateFolder}
//         onMove={handleMove}
//         onClose={() => setContextMenu(null)}
//       />
//     </div>
//   );
// }


















































// 3/7/2025
// import React, { useState, useEffect } from 'react';
// import { Plus, Star, FolderPlus, X } from 'lucide-react';
// import NotesSidebar from './NotesSidebar';
// import { Note, NoteFolder, ActiveView } from '@/lib/types/notes/types';

// // Initial data
// const initialFolders: NoteFolder[] = [
//   { id: 'personal', name: 'Personal', isExpanded: true },
//   { id: 'work', name: 'Work', isExpanded: true },
// ];

// const initialNotes: Note[] = [
//   {
//     id: '1',
//     title: 'Welcome to Djombi Notes',
//     content: 'This is your first note! Start writing your thoughts here.',
//     folderId: 'personal',
//     isFavorite: true,
//     isShared: false,
//     createdAt: new Date('2025-01-01'),
//     updatedAt: new Date('2025-01-01'),
//   },
//   {
//     id: '2',
//     title: 'Project Ideas',
//     content: 'List of project ideas to work on...',
//     folderId: 'work',
//     isFavorite: false,
//     isShared: true,
//     createdAt: new Date('2025-01-02'),
//     updatedAt: new Date('2025-01-02'),
//   },
// ];

// export default function NotesApp() {
//   const [notes, setNotes] = useState<Note[]>(initialNotes);
//   const [folders, setFolders] = useState<NoteFolder[]>(initialFolders);
//   const [activeNote, setActiveNote] = useState<Note | null>(null);
//   const [activeView, setActiveView] = useState<ActiveView>('all');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showNewFolderModal, setShowNewFolderModal] = useState(false);
//   const [newFolderName, setNewFolderName] = useState('');
//   const [isEditing, setIsEditing] = useState(false);

//   // Auto-save functionality
//   useEffect(() => {
//     if (activeNote && isEditing) {
//       const timer = setTimeout(() => {
//         setNotes(prev => prev.map(note => 
//           note.id === activeNote.id ? { ...activeNote, updatedAt: new Date() } : note
//         ));
//         setIsEditing(false);
//       }, 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [activeNote, isEditing]);

//   // Create new note
//   const createNote = (folderId?: string | null) => {
//     const newNote: Note = {
//       id: Date.now().toString(),
//       title: 'Untitled Note',
//       content: '',
//       folderId: folderId || null,
//       isFavorite: false,
//       isShared: false,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };
//     setNotes(prev => [newNote, ...prev]);
//     setActiveNote(newNote);
//     setActiveView('all');
//   };

//   // Create new folder
//   const createFolder = () => {
//     if (newFolderName.trim()) {
//       const newFolder: NoteFolder = {
//         id: Date.now().toString(),
//         name: newFolderName.trim(),
//         isExpanded: true,
//       };
//       setFolders(prev => [...prev, newFolder]);
//       setNewFolderName('');
//       setShowNewFolderModal(false);
//     }
//   };

//   // Delete folder
//   const deleteFolder = (folderId: string) => {
//     // Move notes from deleted folder to unfiled
//     setNotes(prev => prev.map(note => 
//       note.folderId === folderId ? { ...note, folderId: null } : note
//     ));
//     setFolders(prev => prev.filter(folder => folder.id !== folderId));
//   };

//   // Update note folder
//   const moveNoteToFolder = (noteId: string, folderId: string | null) => {
//     setNotes(prev => prev.map(note => 
//       note.id === noteId ? { ...note, folderId } : note
//     ));
//     if (activeNote?.id === noteId) {
//       setActiveNote(prev => prev ? { ...prev, folderId } : null);
//     }
//   };
//   const updateNote = (updates: Partial<Note>) => {
//     if (activeNote) {
//       const updatedNote = { ...activeNote, ...updates, updatedAt: new Date() };
//       setActiveNote(updatedNote);
//       setNotes(prev => prev.map(note => 
//         note.id === activeNote.id ? updatedNote : note
//       ));
//       setIsEditing(true);
//     }
//   };

//   // Toggle favorite
//   const toggleFavorite = (noteId: string) => {
//     setNotes(prev => prev.map(note => 
//       note.id === noteId ? { ...note, isFavorite: !note.isFavorite } : note
//     ));
//     if (activeNote?.id === noteId) {
//       setActiveNote(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
//     }
//   };

//   // Delete note
//   const deleteNote = (noteId: string) => {
//     setNotes(prev => prev.filter(note => note.id !== noteId));
//     if (activeNote?.id === noteId) {
//       setActiveNote(null);
//     }
//   };

//   // Toggle folder expansion
//   const toggleFolder = (folderId: string) => {
//     setFolders(prev => prev.map(folder => 
//       folder.id === folderId ? { ...folder, isExpanded: !folder.isExpanded } : folder
//     ));
//   };

//   return (
//     <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
//       {/* Main Content Area */}
//       <div className="flex-1 flex flex-col">
//         {/* Header */}
//         <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-6 shadow-sm">
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
//                 {activeView === 'favorites' ? '⭐ Favorites' : 
//                  activeView === 'shared' ? '👥 Shared Notes' : '📝 My Notes'}
//               </h1>
//               <p className="text-gray-600 mt-1">
//                 {activeView === 'favorites' ? 'Your starred notes' : 
//                  activeView === 'shared' ? 'Notes shared with others' : 'All your notes in one place'}
//               </p>
//             </div>
//             <div className="flex items-center gap-3">
//               <button
//                 onClick={() => setShowNewFolderModal(true)}
//                 className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-blue-200"
//               >
//                 <FolderPlus size={20} />
//                 New Folder
//               </button>
//               <button
//                 onClick={() => createNote()}
//                 className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
//               >
//                 <Plus size={20} />
//                 Create Note
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="flex-1 p-6">
//           {activeNote ? (
//             <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 h-full overflow-hidden">
//               <div className="p-8">
//                 <input
//                   type="text"
//                   value={activeNote.title}
//                   onChange={(e) => updateNote({ title: e.target.value })}
//                   className="w-full text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent bg-transparent border-none outline-none placeholder-gray-400 mb-6"
//                   placeholder="✨ Untitled Note"
//                 />
//                 <textarea
//                   value={activeNote.content}
//                   onChange={(e) => updateNote({ content: e.target.value })}
//                   className="w-full h-96 text-gray-700 bg-transparent border-none outline-none resize-none placeholder-gray-400 leading-relaxed text-lg"
//                   placeholder="Start writing something amazing..."
//                 />
//                 <div className="flex items-center justify-between mb-12 pt-1 border-t border-gray-200">
//                   <div className="text-sm text-gray-500 flex items-center gap-2">
//                     <div className={`w-2 h-2 rounded-full ${isEditing ? 'bg-orange-400 animate-pulse' : 'bg-green-400'}`}></div>
//                     {isEditing ? 'Saving changes...' : `Saved ${activeNote.updatedAt.toLocaleString()}`}
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <button
//                       onClick={() => toggleFavorite(activeNote.id)}
//                       className={`p-3 rounded-xl transition-all duration-200 ${
//                         activeNote.isFavorite 
//                           ? 'text-yellow-500 bg-yellow-50 shadow-lg scale-110' 
//                           : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 hover:scale-110'
//                       }`}
//                     >
//                       <Star size={18} fill={activeNote.isFavorite ? 'currentColor' : 'none'} />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div className="flex flex-col items-center justify-center h-full text-center">
//               <div className="relative mb-8">
//                 <div className="w-80 h-80 bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
//                   <div className="w-64 h-64 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl">
//                     <div className="text-6xl animate-bounce">📝</div>
//                   </div>
//                 </div>
//                 <div className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-60 animate-pulse"></div>
//                 <div className="absolute bottom-20 left-20 w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-60 animate-pulse delay-300"></div>
//               </div>
//               <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
//                 {activeView === 'favorites' ? 'No favorite notes yet' :
//                  activeView === 'shared' ? 'No shared notes yet' : 'Ready to create something amazing?'}
//               </h2>
//               <p className="text-gray-600 mb-8 text-lg max-w-md">
//                 {activeView === 'favorites' ? 'Star some notes to see them here ⭐' :
//                  activeView === 'shared' ? 'Share some notes to see them here 👥' : 'Select a note from the sidebar or create a new one to get started'}
//               </p>
//               <button
//                 onClick={() => createNote()}
//                 className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 text-lg font-semibold"
//               >
//                 <Plus size={24} />
//                 Create Your First Note
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Sidebar */}
//       <NotesSidebar
//         notes={notes}
//         folders={folders}
//         activeNote={activeNote}
//         activeView={activeView}
//         searchQuery={searchQuery}
//         setActiveNote={setActiveNote}
//         setActiveView={setActiveView}
//         setSearchQuery={setSearchQuery}
//         toggleFavorite={toggleFavorite}
//         deleteNote={deleteNote}
//         toggleFolder={toggleFolder}
//         deleteFolder={deleteFolder}
//         createNote={createNote}
//         moveNoteToFolder={moveNoteToFolder}
//       />

//       {/* New Folder Modal */}
//       {showNewFolderModal && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
//           <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 w-96 shadow-2xl border border-white/50">
//             <div className="flex items-center justify-between mb-6">
//               <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Create New Folder</h3>
//               <button
//                 onClick={() => {
//                   setShowNewFolderModal(false);
//                   setNewFolderName('');
//                 }}
//                 className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
//               >
//                 <X size={20} />
//               </button>
//             </div>
//             <input
//               type="text"
//               placeholder="Enter folder name..."
//               value={newFolderName}
//               onChange={(e) => setNewFolderName(e.target.value)}
//               className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6 bg-white/80 backdrop-blur-sm"
//               onKeyPress={(e) => {
//                 if (e.key === 'Enter') {
//                   e.preventDefault();
//                   createFolder();
//                 }
//               }}
//               autoFocus
//             />
//             <div className="flex gap-3 justify-end">
//               <button
//                 onClick={() => {
//                   setShowNewFolderModal(false);
//                   setNewFolderName('');
//                 }}
//                 className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={createFolder}
//                 disabled={!newFolderName.trim()}
//                 className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Create Folder
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }