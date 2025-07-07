import React from 'react';
import { FileText, Star, Users } from 'lucide-react';
import { Note, ActiveView } from '@/lib/types/notes/types';

interface NavigationTabsProps {
  notes: Note[];
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  setActiveNote: (note: Note | null) => void;
}

export default function NavigationTabs({ 
  notes, 
  activeView, 
  setActiveView, 
  setActiveNote 
}: NavigationTabsProps) {
  const handleViewChange = (view: ActiveView) => {
    setActiveView(view);
    setActiveNote(null); // Clear active note to show grid view
  };

  return (
    <div className="space-y-1">
      <button
        onClick={() => handleViewChange('all')}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full ${
          activeView === 'all' 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
        }`}
      >
        <FileText size={16} />
        📄 All Notes
        <span className="ml-auto bg-white/20 px-2 py-1 rounded-full text-xs">
          {notes.length}
        </span>
      </button>
      
      <button
        onClick={() => handleViewChange('favorites')}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full ${
          activeView === 'favorites' 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
            : 'text-gray-600 hover:bg-yellow-50 hover:text-yellow-700'
        }`}
      >
        <Star size={16} />
        ⭐ Favorites
        <span className="ml-auto bg-white/20 px-2 py-1 rounded-full text-xs">
          {notes.filter(n => n.isFavorite).length}
        </span>
      </button>
      
      <button
        onClick={() => handleViewChange('shared')}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full ${
          activeView === 'shared' 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
            : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
        }`}
      >
        <Users size={16} />
        👥 Shared
        <span className="ml-auto bg-white/20 px-2 py-1 rounded-full text-xs">
          {notes.filter(n => n.isShared).length}
        </span>
      </button>
    </div>
  );
}