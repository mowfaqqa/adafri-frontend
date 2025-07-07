import React from 'react';
import { Star, FolderPlus, Users, Eye, Edit2, Trash2, Move } from 'lucide-react';
import { Note, NoteFolder, Collection } from '@/lib/types/notes/types';

interface ContextMenuProps {
  contextMenu: {
    type: 'collection' | 'folder' | 'note';
    itemId: string;
    position: { x: number; y: number };
  };
  notes: Note[];
  folders: NoteFolder[];
  collections: Collection[];
  onOpenInView: (type: 'collection' | 'folder', itemId: string) => void;
  onStartEditing: (type: 'collection' | 'folder' | 'note', itemId: string) => void;
  onCreateFolder: (collectionId: string) => void;
  onMove: (type: 'note' | 'folder', itemId: string) => void;
  onToggleFavorite: (noteId: string) => void;
  onDelete: (type: 'collection' | 'folder' | 'note', itemId: string) => void;
  onClose: () => void;
}

export default function ContextMenu({
  contextMenu,
  notes,
  folders,
  collections,
  onOpenInView,
  onStartEditing,
  onCreateFolder,
  onMove,
  onToggleFavorite,
  onDelete,
  onClose
}: ContextMenuProps) {
  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const getNote = (id: string) => notes.find(n => n.id === id);
  const getFolder = (id: string) => folders.find(f => f.id === id);
  const getCollection = (id: string) => collections.find(c => c.id === id);

  return (
    <div 
      className="fixed bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-40 overflow-hidden"
      style={{ 
        left: contextMenu.position.x, 
        top: contextMenu.position.y 
      }}
    >
      {contextMenu.type === 'collection' && (
        <>
          <button 
            onClick={() => handleAction(() => onOpenInView('collection', contextMenu.itemId))}
            className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <Eye size={14} />
            Open in View
          </button>
          <button 
            onClick={() => handleAction(() => onStartEditing('collection', contextMenu.itemId))}
            className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <Edit2 size={14} />
            Rename
          </button>
          <button 
            onClick={() => handleAction(() => onCreateFolder(contextMenu.itemId))}
            className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <FolderPlus size={14} />
            Create Folder
          </button>
          <div className="border-t border-gray-100"></div>
          <button 
            onClick={() => handleAction(() => onDelete('collection', contextMenu.itemId))}
            className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </>
      )}
      
      {contextMenu.type === 'folder' && (
        <>
          <button 
            onClick={() => handleAction(() => onOpenInView('folder', contextMenu.itemId))}
            className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <Eye size={14} />
            Open in View
          </button>
          <button 
            onClick={() => handleAction(() => onStartEditing('folder', contextMenu.itemId))}
            className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <Edit2 size={14} />
            Rename
          </button>
          <button 
            onClick={() => handleAction(() => onMove('folder', contextMenu.itemId))}
            className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <Move size={14} />
            Move to
          </button>
          <div className="border-t border-gray-100"></div>
          <button 
            onClick={() => handleAction(() => onDelete('folder', contextMenu.itemId))}
            className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </>
      )}
      
      {contextMenu.type === 'note' && (
        <>
          <button 
            onClick={() => handleAction(() => onToggleFavorite(contextMenu.itemId))}
            className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-yellow-50 transition-colors"
          >
            <Star size={14} />
            {getNote(contextMenu.itemId)?.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          </button>
          <button 
            onClick={() => handleAction(() => onStartEditing('note', contextMenu.itemId))}
            className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <Edit2 size={14} />
            Rename
          </button>
          <button 
            onClick={() => handleAction(() => onMove('note', contextMenu.itemId))}
            className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <Move size={14} />
            Move to
          </button>
          <div className="border-t border-gray-100"></div>
          <button 
            onClick={() => handleAction(() => onDelete('note', contextMenu.itemId))}
            className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </>
      )}
    </div>
  );
}