import React, { useState } from 'react';
import { X, Plus, Folder, FileText } from 'lucide-react';
import { CollectionSelectorProps } from '@/lib/types/notes/types';

export default function CollectionSelector({
  show,
  type,
  collections,
  notes,
  folders,
  onClose,
  onExecuteCreate
}: CollectionSelectorProps) {
  const [folderName, setFolderName] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('');

  const handleCreate = () => {
    if (!selectedCollection) return;
    
    if (type === 'folder' && !folderName.trim()) return;
    
    onExecuteCreate(selectedCollection, type === 'folder' ? folderName : undefined);
    setFolderName('');
    setSelectedCollection('');
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {type === 'folder' ? <Folder size={20} /> : <FileText size={20} />}
            Create New {type === 'folder' ? 'Folder' : 'Note'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {type === 'folder' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Folder Name
              </label>
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Collection
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedCollection === collection.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCollection(collection.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{collection.name}</span>
                  </div>
                  {collection.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {collection.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedCollection || (type === 'folder' && !folderName.trim())}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create {type === 'folder' ? 'Folder' : 'Note'}
          </button>
        </div>
      </div>
    </div>
  );
}