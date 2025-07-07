import React from 'react';
import { Star } from 'lucide-react';
import { Note } from '@/lib/types/notes/types';

interface NoteEditorProps {
  note: Note;
  isEditing: boolean;
  onUpdateNote: (updates: Partial<Note>) => void;
  onToggleFavorite: (noteId: string) => void;
  onToggleShare: (noteId: string) => void;
}

export default function NoteEditor({ 
  note, 
  isEditing, 
  onUpdateNote, 
  onToggleFavorite, 
  onToggleShare 
}: NoteEditorProps) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 h-full overflow-hidden">
      <div className="p-6">
        <input
          type="text"
          value={note.title}
          onChange={(e) => onUpdateNote({ title: e.target.value })}
          className="w-full text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent bg-transparent border-none outline-none placeholder-gray-400 mb-4"
          placeholder="✨ Untitled Note"
        />
        <textarea
          value={note.content}
          onChange={(e) => onUpdateNote({ content: e.target.value })}
          className="w-full h-96 text-gray-700 bg-transparent border-none outline-none resize-none placeholder-gray-400 leading-relaxed text-sm"
          placeholder="Start writing something amazing..."
        />
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isEditing ? 'bg-orange-400 animate-pulse' : 'bg-green-400'}`}></div>
            {isEditing ? 'Saving changes...' : `Saved ${note.updatedAt.toLocaleString()}`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleShare(note.id)}
              className={`p-2 rounded-xl transition-all duration-200 ${
                note.isShared 
                  ? 'text-green-500 bg-green-50 shadow-lg scale-110' 
                  : 'text-gray-400 hover:text-green-500 hover:bg-green-50 hover:scale-110'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16,6 12,2 8,6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </button>
            <button
              onClick={() => onToggleFavorite(note.id)}
              className={`p-2 rounded-xl transition-all duration-200 ${
                note.isFavorite 
                  ? 'text-yellow-500 bg-yellow-50 shadow-lg scale-110' 
                  : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 hover:scale-110'
              }`}
            >
              <Star size={16} fill={note.isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}