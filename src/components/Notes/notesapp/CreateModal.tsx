import React from 'react';
import { X, FolderPlus } from 'lucide-react';

interface CreateModalProps {
  show: boolean;
  onClose: () => void;
  onCreateWithCollection: (type: 'note' | 'folder') => void;
}

export default function CreateModal({ 
  show, 
  onClose, 
  onCreateWithCollection 
}: CreateModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 w-80 shadow-2xl border border-white/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create New
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => {
              onClose();
              onCreateWithCollection('note');
            }}
            className="w-full flex items-center gap-3 p-4 text-left rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">New Note</h4>
              <p className="text-sm text-gray-600">Create a new note in a collection</p>
            </div>
          </button>
          
          <button
            onClick={() => {
              onClose();
              onCreateWithCollection('folder');
            }}
            className="w-full flex items-center gap-3 p-4 text-left rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <FolderPlus size={20} className="text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">New Folder</h4>
              <p className="text-sm text-gray-600">Create a new folder in a collection</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}