import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  onCreateNote: () => void;
}

export default function EmptyState({ onCreateNote }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="relative mb-8">
        <div className="w-64 h-64 bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
          <div className="w-48 h-48 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl">
            <div className="text-5xl animate-bounce">📝</div>
          </div>
        </div>
        <div className="absolute top-16 right-16 w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute bottom-16 left-16 w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-60 animate-pulse delay-300"></div>
      </div>
      <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
        Ready to create something amazing?
      </h2>
      <p className="text-gray-600 mb-6 text-sm max-w-md">
        Select a note from the sidebar or create a new one to get started
      </p>
      <button
        onClick={onCreateNote}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 text-sm font-semibold"
      >
        <Plus size={20} />
        Create Your First Note
      </button>
    </div>
  );
}