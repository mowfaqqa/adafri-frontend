import React from 'react';
import { Plus, Star, MoreHorizontal, Users } from 'lucide-react';
import { Note, Collection, NoteFolder, ActiveView, ModalAction } from '@/lib/types/notes/types';

interface NotesGridProps {
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

export default function NotesGrid({
  notes,
  collections,
  folders,
  activeView,
  viewingCollection,
  viewingFolder,
  onSelectNote,
  onShowModal,
  onCreateNote
}: NotesGridProps) {
  const getViewTitle = () => {
    if (viewingCollection) {
      return 'Collection Contents';
    } else if (viewingFolder) {
      return 'Folder Contents';
    } else {
      return activeView === 'favorites' ? 'Recent Favorites' : 
             activeView === 'shared' ? 'Recent Shared' : 'Recent Notes';
    }
  };

  if (notes.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 h-full overflow-hidden">
        <div className="p-6">
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-lg font-medium">No notes found</p>
            <p className="text-sm mt-1">
              {activeView === 'favorites' ? 'Star some notes to see them here' :
               activeView === 'shared' ? 'Share some notes to see them here' : 'Create your first note'}
            </p>
            <button
              onClick={onCreateNote}
              className="mt-4 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 text-sm font-semibold mx-auto"
            >
              <Plus size={20} />
              Create Your First Note
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 h-full overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            {getViewTitle()}
          </h2>
          <span className="text-sm text-gray-500">
            {notes.length} {notes.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {notes.map(note => {
            const collection = collections.find(c => c.id === note.collectionId);
            const folder = folders.find(f => f.id === note.folderId);
            
            return (
              <div
                key={note.id}
                className="group bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-blue-200"
                onClick={() => onSelectNote(note)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">
                    {note.title || 'Untitled Note'}
                  </h3>
                  <div className="flex items-center gap-1 ml-2">
                    {note.isFavorite && <Star size={12} className="text-yellow-500" fill="currentColor" />}
                    {note.isShared && <Users size={12} className="text-green-500" />}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowModal({
                          type: 'note',
                          itemId: note.id,
                          position: { x: e.clientX, y: e.clientY }
                        });
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal size={12} />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-600 text-xs line-clamp-3 mb-3 leading-relaxed">
                  {note.content || 'No content'}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{note.updatedAt.toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <span>📁</span>
                    <span className="truncate max-w-20">
                      {collection?.name}
                      {folder && `/${folder.name}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}