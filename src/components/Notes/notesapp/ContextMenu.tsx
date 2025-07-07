import React from 'react';
import { Star, FolderPlus, Users, Eye, Edit2, Trash2, Move } from 'lucide-react';
import { ModalAction } from '@/lib/types/notes/types';

interface ContextMenuProps {
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

export default function ContextMenu({
  contextMenu,
  onOpenInView,
  onRename,
  onDelete,
  onToggleFavorite,
  onToggleShare,
  onCreateFolder,
  onMove,
  onClose
}: ContextMenuProps) {
  const handleAction = (action: () => void) => {
    try {
      action();
    } catch (error) {
      console.error('Context menu action error:', error);
    } finally {
      onClose();
    }
  };

  // Calculate position to prevent off-screen display
  const getPosition = () => {
    const { x, y } = contextMenu.position;
    const menuWidth = 200;
    const menuHeight = 300;
    
    const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x;
    const adjustedY = y + menuHeight > window.innerHeight ? y - menuHeight : y;
    
    return {
      left: Math.max(10, adjustedX),
      top: Math.max(10, adjustedY)
    };
  };

  return (
    <div 
      className="fixed bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-48 overflow-hidden"
      style={getPosition()}
    >
      {contextMenu.type === 'collection' && (
        <>
          <button 
            onClick={() => handleAction(() => onOpenInView('collection', contextMenu.itemId))}
            className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <Eye size={16} className="text-blue-500" />
            <span>Open in View</span>
          </button>
          <button 
            onClick={() => handleAction(() => onRename('collection', contextMenu.itemId))}
            className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <Edit2 size={16} className="text-gray-500" />
            <span>Rename</span>
          </button>
          <button 
            onClick={() => handleAction(() => onCreateFolder(contextMenu.itemId))}
            className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <FolderPlus size={16} className="text-green-500" />
            <span>Create Folder</span>
          </button>
          <div className="border-t border-gray-100 my-1"></div>
          <button 
            onClick={() => handleAction(() => onDelete('collection', contextMenu.itemId))}
            className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} className="text-red-500" />
            <span>Delete</span>
          </button>
        </>
      )}
      
      {contextMenu.type === 'folder' && (
        <>
          <button 
            onClick={() => handleAction(() => onOpenInView('folder', contextMenu.itemId))}
            className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <Eye size={16} className="text-blue-500" />
            <span>Open in View</span>
          </button>
          <button 
            onClick={() => handleAction(() => onRename('folder', contextMenu.itemId))}
            className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <Edit2 size={16} className="text-gray-500" />
            <span>Rename</span>
          </button>
          <button 
            onClick={() => handleAction(() => onMove('folder', contextMenu.itemId))}
            className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <Move size={16} className="text-purple-500" />
            <span>Move to</span>
          </button>
          <div className="border-t border-gray-100 my-1"></div>
          <button 
            onClick={() => handleAction(() => onDelete('folder', contextMenu.itemId))}
            className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} className="text-red-500" />
            <span>Delete</span>
          </button>
        </>
      )}
      
      {contextMenu.type === 'note' && (
        <>
          <button 
            onClick={() => handleAction(() => onToggleFavorite(contextMenu.itemId))}
            className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-yellow-50 transition-colors"
          >
            <Star size={16} className="text-yellow-500" />
            <span>Toggle Favorite</span>
          </button>
          <button 
            onClick={() => handleAction(() => onRename('note', contextMenu.itemId))}
            className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <Edit2 size={16} className="text-gray-500" />
            <span>Rename</span>
          </button>
          <button 
            onClick={() => handleAction(() => onMove('note', contextMenu.itemId))}
            className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <Move size={16} className="text-purple-500" />
            <span>Move to</span>
          </button>
          <button 
            onClick={() => handleAction(() => onToggleShare(contextMenu.itemId))}
            className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-green-50 transition-colors"
          >
            <Users size={16} className="text-green-500" />
            <span>Toggle Share</span>
          </button>
          <div className="border-t border-gray-100 my-1"></div>
          <button 
            onClick={() => handleAction(() => onDelete('note', contextMenu.itemId))}
            className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} className="text-red-500" />
            <span>Delete</span>
          </button>
        </>
      )}
    </div>
  );
}