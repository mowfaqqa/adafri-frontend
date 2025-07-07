import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface CreateCollectionModalProps {
  show: boolean;
  onClose: () => void;
  onCreateCollection: (name: string, description?: string) => void;
}

export default function CreateCollectionModal({
  show,
  onClose,
  onCreateCollection
}: CreateCollectionModalProps) {
  const [collectionData, setCollectionData] = useState({
    name: '',
    isPrivate: true,
    teamMembers: [{ email: '', role: 'viewer' as 'viewer' | 'editor' | 'moderator' }]
  });

  const handleCreate = () => {
    if (collectionData.name.trim()) {
      onCreateCollection(
        collectionData.name, 
        `Privacy: ${collectionData.isPrivate ? 'Private' : 'Public'}`
      );
      setCollectionData({
        name: '',
        isPrivate: true,
        teamMembers: [{ email: '', role: 'viewer' }]
      });
    }
  };

  const addTeamMember = () => {
    setCollectionData(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { email: '', role: 'viewer' }]
    }));
  };

  const updateTeamMember = (index: number, field: 'email' | 'role', value: string) => {
    setCollectionData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }));
  };

  const removeTeamMember = (index: number) => {
    setCollectionData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }));
  };

  const handleClose = () => {
    setCollectionData({
      name: '',
      isPrivate: true,
      teamMembers: [{ email: '', role: 'viewer' }]
    });
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 w-96 shadow-2xl border border-white/50 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create New Collection
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Collection Name</label>
            <input
              type="text"
              placeholder="Enter collection name..."
              value={collectionData.name}
              onChange={(e) => setCollectionData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Privacy</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={collectionData.isPrivate}
                  onChange={() => setCollectionData(prev => ({ ...prev, isPrivate: true }))}
                  className="mr-2"
                />
                <span className="text-sm">Private</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!collectionData.isPrivate}
                  onChange={() => setCollectionData(prev => ({ ...prev, isPrivate: false }))}
                  className="mr-2"
                />
                <span className="text-sm">Public</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Team Members</label>
            <div className="space-y-2">
              {collectionData.teamMembers.map((member, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter email..."
                    value={member.email}
                    onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 text-sm"
                  />
                  <select
                    value={member.role}
                    onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 text-sm"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="moderator">Moderator</option>
                  </select>
                  {collectionData.teamMembers.length > 1 && (
                    <button
                      onClick={() => removeTeamMember(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addTeamMember}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus size={14} />
                Add team member
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!collectionData.name.trim()}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Create Collection
          </button>
        </div>
      </div>
    </div>
  );
}