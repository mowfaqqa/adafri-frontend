import React from 'react';
import { ChevronRight, Plus, MoreHorizontal, Star, Users } from 'lucide-react';
import { Note, NoteFolder } from '@/lib/types/notes/types';

interface FolderItemProps {
  folder: NoteFolder;
  notes: Note[];
  activeNote: Note | null;
  editingId: string | null;
  editingValue: string;
  onToggleExpansion: () => void;
  onStartEditing: (id: string, value: string, type: 'collection' | 'folder') => void;
  onSaveEdit: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onCreateNote: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onNoteClick: (note: Note) => void;
  onNoteContextMenu: (e: React.MouseEvent, noteId: string) => void;
  onSetEditingValue: (value: string) => void;
}

export default function FolderItem({
  folder,
  notes,
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
  onSetEditingValue
}: FolderItemProps) {
  return (
    <div className="border border-gray-200/50 rounded-lg bg-white/30">
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={onToggleExpansion}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight 
              size={12} 
              className={`transform transition-transform ${folder.isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
          
          {editingId === folder.id ? (
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
              className="text-sm text-gray-700 cursor-pointer hover:text-blue-600"
              onDoubleClick={() => onStartEditing(folder.id, folder.name, 'folder')}
            >
              📂 {folder.name}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={onCreateNote}
            className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
            title={`Add note to ${folder.name}`}
          >
            <Plus size={10} />
          </button>
          <button
            onClick={onContextMenu}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <MoreHorizontal size={10} />
          </button>
        </div>
      </div>

      {/* Folder Notes */}
      {folder.isExpanded && (
        <div className="pl-4 pr-2 pb-2 space-y-1">
          {notes.map(note => (
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
                  <span className="text-sm text-gray-700 truncate block">
                    📄 {note.title}
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
        </div>
      )}
    </div>
  );
}