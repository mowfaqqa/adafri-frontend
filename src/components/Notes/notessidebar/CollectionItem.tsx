import React from 'react';
import { ChevronRight, Plus, MoreHorizontal, Star, Users } from 'lucide-react';
import { Note, NoteFolder, Collection } from '@/lib/types/notes/types';
import FolderItem from './FolderItem';

interface CollectionItemProps {
  collection: Collection;
  notes: Note[];
  folders: NoteFolder[];
  activeNote: Note | null;
  editingId: string | null;
  editingValue: string;
  onToggleExpansion: () => void;
  onStartEditing: (id: string, value: string, type: 'collection' | 'folder') => void;
  onSaveEdit: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onCreateNote: () => void;
  onContextMenu: (e: React.MouseEvent, type: 'collection', id: string) => void;
  onNoteClick: (note: Note) => void;
  onNoteContextMenu: (e: React.MouseEvent, noteId: string) => void;
  onSetEditingValue: (value: string) => void;
  onFolderProps: {
    onToggleFolder: (folderId: string) => void;
    onCreateNoteInFolder: (collectionId: string, folderId: string) => void;
    onFolderContextMenu: (e: React.MouseEvent, folderId: string) => void;
    onCreateFolder: (collectionId: string) => void;
  };
}

export default function CollectionItem({
  collection,
  notes,
  folders,
  activeNote,
  editingId,
  editingValue,
  onToggleExpansion,
  onStartEditing,
  onSaveEdit,
  onKeyPress,
  onCreateNote,
  onContextMenu,
  onNoteClick,
  onNoteContextMenu,
  onSetEditingValue,
  onFolderProps
}: CollectionItemProps) {
  const collectionNotes = notes.filter(note => note.collectionId === collection.id);
  const collectionFolders = folders.filter(folder => folder.collectionId === collection.id);

  return (
    <div className="border border-gray-200/50 rounded-lg bg-white/50">
      {/* Collection Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200/50">
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={onToggleExpansion}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight 
              size={14} 
              className={`transform transition-transform ${collection.isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
          
          {editingId === collection.id ? (
            <input
              type="text"
              value={editingValue}
              onChange={(e) => onSetEditingValue(e.target.value)}
              onBlur={onSaveEdit}
              onKeyDown={onKeyPress}
              className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <span 
              className="text-sm font-medium text-gray-800 cursor-pointer hover:text-blue-600"
              onDoubleClick={() => onStartEditing(collection.id, collection.name, 'collection')}
            >
              📁 {collection.name}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={onCreateNote}
            className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
            title={`Add note to ${collection.name}`}
          >
            <Plus size={12} />
          </button>
          <button
            onClick={(e) => onContextMenu(e, 'collection', collection.id)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <MoreHorizontal size={12} />
          </button>
        </div>
      </div>

      {/* Collection Content */}
      {collection.isExpanded && (
        <div className="p-2 space-y-2">
          {/* Direct Collection Notes */}
          {collectionNotes.filter(note => !note.folderId).map(note => (
            <div key={note.id} className="group">
              <div
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  activeNote?.id === note.id 
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200' 
                    : 'hover:bg-white/80'
                }`}
                onClick={() => onNoteClick(note)}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800 truncate block">
                    📝 {note.title}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {note.updatedAt.toLocaleDateString()}
                    </span>
                    {note.isFavorite && <Star size={10} className="text-yellow-500" fill="currentColor" />}
                    {note.isShared && <Users size={10} className="text-green-500" />}
                  </div>
                </div>
                <button
                  onClick={(e) => onNoteContextMenu(e, note.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal size={12} />
                </button>
              </div>
            </div>
          ))}

          {/* Folders */}
          {collectionFolders.map(folder => (
            <FolderItem
              key={folder.id}
              folder={folder}
              notes={collectionNotes.filter(note => note.folderId === folder.id)}
              activeNote={activeNote}
              editingId={editingId}
              editingValue={editingValue}
              onToggleExpansion={() => onFolderProps.onToggleFolder(folder.id)}
              onStartEditing={(id, value, type) => onStartEditing(id, value, type)}
              onSaveEdit={onSaveEdit}
              onKeyPress={onKeyPress}
              onCreateNote={() => onFolderProps.onCreateNoteInFolder(collection.id, folder.id)}
              onContextMenu={(e) => onFolderProps.onFolderContextMenu(e, folder.id)}
              onNoteClick={onNoteClick}
              onNoteContextMenu={onNoteContextMenu}
              onSetEditingValue={onSetEditingValue}
            />
          ))}
        </div>
      )}
    </div>
  );
}