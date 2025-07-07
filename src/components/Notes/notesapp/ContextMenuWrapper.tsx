import React, { useEffect } from 'react';
import ContextMenu from './ContextMenu';
import { ModalAction, Note, NoteFolder, Collection } from '@/lib/types/notes/types';

interface ContextMenuWrapperProps {
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

export default function ContextMenuWrapper({
  contextMenu,
  notes,
  folders,
  collections,
  onOpenInView,
  onRename,
  onDelete,
  onToggleFavorite,
  onToggleShare,
  onCreateFolder,
  onMove,
  onClose
}: ContextMenuWrapperProps) {
  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-context-menu]')) {
          onClose();
        }
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && contextMenu) {
        onClose();
      }
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [contextMenu, onClose]);

  // Enhanced rename function that gets current values
  const handleRename = (type: 'collection' | 'folder' | 'note', itemId: string) => {
    let currentValue = '';
    let itemName = '';
    
    if (type === 'collection') {
      const collection = collections.find(c => c.id === itemId);
      currentValue = collection?.name || '';
      itemName = 'collection';
    } else if (type === 'folder') {
      const folder = folders.find(f => f.id === itemId);
      currentValue = folder?.name || '';
      itemName = 'folder';
    } else {
      const note = notes.find(n => n.id === itemId);
      currentValue = note?.title || '';
      itemName = 'note';
    }
    
    const newName = prompt(`Enter new ${itemName} name:`, currentValue);
    if (newName && newName.trim() && newName.trim() !== currentValue) {
      onRename(type, itemId);
    }
  };

  // Enhanced delete function with confirmation
  const handleDelete = (type: 'collection' | 'folder' | 'note', itemId: string) => {
    let itemName = '';
    let confirmMessage = '';
    
    if (type === 'collection') {
      const collection = collections.find(c => c.id === itemId);
      itemName = collection?.name || 'collection';
      const noteCount = notes.filter(n => n.collectionId === itemId).length;
      const folderCount = folders.filter(f => f.collectionId === itemId).length;
      confirmMessage = `Are you sure you want to delete "${itemName}"? This will also delete ${noteCount} notes and ${folderCount} folders.`;
    } else if (type === 'folder') {
      const folder = folders.find(f => f.id === itemId);
      itemName = folder?.name || 'folder';
      const noteCount = notes.filter(n => n.folderId === itemId).length;
      confirmMessage = `Are you sure you want to delete "${itemName}"? This will also delete ${noteCount} notes.`;
    } else {
      const note = notes.find(n => n.id === itemId);
      itemName = note?.title || 'note';
      confirmMessage = `Are you sure you want to delete "${itemName}"?`;
    }
    
    if (confirm(confirmMessage)) {
      onDelete(type, itemId);
    }
  };

  // Enhanced create folder function
  const handleCreateFolder = (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    const collectionName = collection?.name || 'collection';
    
    const folderName = prompt(`Enter folder name for "${collectionName}":`);
    if (folderName && folderName.trim()) {
      onCreateFolder(collectionId);
    }
  };

  if (!contextMenu) return null;

  return (
    <div data-context-menu>
      <ContextMenu
        contextMenu={contextMenu}
        onOpenInView={onOpenInView}
        onRename={handleRename}
        onDelete={handleDelete}
        onToggleFavorite={onToggleFavorite}
        onToggleShare={onToggleShare}
        onCreateFolder={handleCreateFolder}
        onMove={onMove}
        onClose={onClose}
      />
    </div>
  );
}