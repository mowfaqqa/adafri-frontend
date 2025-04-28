"use client";
import React, { useState, useRef, useEffect } from 'react';
import { X, Upload } from 'lucide-react';

interface ImportContactsProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ImportData) => void;
  existingGroups: string[];
  preSelectedGroup?: string; // New prop for pre-selecting a group
}

interface ImportData {
  group: string;
  newGroup?: string;
  file: File | null;
}

const ImportContacts: React.FC<ImportContactsProps> = ({
  isOpen,
  onClose,
  onImport,
  existingGroups,
  preSelectedGroup
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set the pre-selected group when the component mounts or when preSelectedGroup changes
  useEffect(() => {
    if (preSelectedGroup) {
      setSelectedGroup(preSelectedGroup);
    }
  }, [preSelectedGroup]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedFile) {
      newErrors.file = 'Please select a file to import';
    }
    
    if (!selectedGroup && !newGroup && !isCreatingNewGroup) {
      newErrors.group = 'Please select a group or create a new one';
    }
    
    if (isCreatingNewGroup && !newGroup.trim()) {
      newErrors.newGroup = 'Group name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onImport({
        group: selectedGroup,
        newGroup: isCreatingNewGroup ? newGroup : undefined,
        file: selectedFile
      });
      
      // Reset form
      setSelectedFile(null);
      setSelectedGroup('');
      setNewGroup('');
      setIsCreatingNewGroup(false);
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setIsCreatingNewGroup(true);
      setSelectedGroup('');
    } else {
      setIsCreatingNewGroup(false);
      setSelectedGroup(value);
    }
  };

  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-0 w-full max-w-md">
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Import Contacts</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Group
            </label>
            <select
              value={isCreatingNewGroup ? 'new' : selectedGroup}
              onChange={handleGroupChange}
              className={`w-full border ${errors.group ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500`}
            >
              <option value="">Select a group</option>
              {existingGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
              <option value="new">Create new group</option>
            </select>
            {errors.group && (
              <p className="text-red-500 text-xs mt-1">{errors.group}</p>
            )}
          </div>
          
          {isCreatingNewGroup && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                New Group Name
              </label>
              <input
                type="text"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                className={`w-full border ${errors.newGroup ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                placeholder="Enter new group name"
              />
              {errors.newGroup && (
                <p className="text-red-500 text-xs mt-1">{errors.newGroup}</p>
              )}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Import File (CSV or TXT)
            </label>
            <div 
              className={`border ${errors.file ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-6 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 cursor-pointer`}
              onClick={handleFileInputClick}
            >
              <div className="flex flex-col items-center justify-center">
                <Upload size={24} className="text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-2">
                  {selectedFile ? selectedFile.name : 'Click to select or drag and drop'}
                </p>
                <p className="text-xs text-gray-400 mb-2">
                  Supported formats: CSV, TXT
                </p>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button
                  type="button"
                  className="px-4 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                  onClick={handleFileInputClick}
                >
                  Browse
                </button>
              </div>
            </div>
            {errors.file && (
              <p className="text-red-500 text-xs mt-1">{errors.file}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
              disabled={!selectedFile || (selectedGroup === '' && !isCreatingNewGroup) || (isCreatingNewGroup && newGroup === '')}
            >
              Import
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportContacts;











































// "use client";
// import React, { useState, useRef } from 'react';
// import { X } from 'lucide-react';

// interface ImportContactsProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onImport: (data: ImportData) => void;
//   existingGroups: string[];
// }

// interface ImportData {
//   group: string;
//   newGroup?: string;
//   file: File | null;
// }

// const ImportContacts: React.FC<ImportContactsProps> = ({
//   isOpen,
//   onClose,
//   onImport,
//   existingGroups
// }) => {
//   const [selectedGroup, setSelectedGroup] = useState('');
//   const [newGroup, setNewGroup] = useState('');
//   const [file, setFile] = useState<File | null>(null);
//   const [fileName, setFileName] = useState('');
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const selectedFile = e.target.files[0];
//       setFile(selectedFile);
//       setFileName(selectedFile.name);
//     }
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!file) return;

//     onImport({
//       group: selectedGroup,
//       newGroup: newGroup || undefined,
//       file
//     });

//     // Reset form
//     setSelectedGroup('');
//     setNewGroup('');
//     setFile(null);
//     setFileName('');
//     onClose();
//   };

//   const handleFileInputClick = () => {
//     if (fileInputRef.current) {
//       fileInputRef.current.click();
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-0 relative">
//         <button 
//           onClick={onClose}
//           className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
//         >
//           <X size={20} />
//         </button>
        
//         <div className="border-b px-6 py-4">
//           <h2 className="text-xl font-bold">Import Contacts</h2>
//         </div>
        
//         <form onSubmit={handleSubmit} className="p-6">
//           <div className="mb-4">
//             <label htmlFor="group" className="block text-sm text-gray-600 mb-2">
//               Choose an existing group
//             </label>
//             <select
//               id="group"
//               value={selectedGroup}
//               onChange={(e) => setSelectedGroup(e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
//             >
//               <option value="">Select a group</option>
//               {existingGroups.map((group) => (
//                 <option key={group} value={group}>
//                   {group}
//                 </option>
//               ))}
//             </select>
//           </div>
          
//           <div className="mb-4">
//             <label htmlFor="newGroup" className="block text-sm text-gray-600 mb-2">
//               OR Create a new group
//             </label>
//             <input
//               type="text"
//               id="newGroup"
//               value={newGroup}
//               onChange={(e) => setNewGroup(e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
//               placeholder="New group name"
//             />
//           </div>
          
//           <div className="mb-6">
//             <label htmlFor="file" className="block text-sm text-gray-600 mb-2">
//               Choose a file to upload (CSV, TXT)
//             </label>
//             <div 
//               className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer flex items-center"
//               onClick={handleFileInputClick}
//             >
//               <span className="text-gray-500 truncate">
//                 {fileName || "No file selected"}
//               </span>
//             </div>
//             <input
//               type="file"
//               id="file"
//               ref={fileInputRef}
//               onChange={handleFileChange}
//               accept=".csv,.txt"
//               className="hidden"
//               required
//             />
//           </div>
          
//           <div className="flex justify-center">
//             <button
//               type="submit"
//               className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 w-full"
//               disabled={!file || (newGroup === '' && selectedGroup === '')}
//             >
//               Import Contacts
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default ImportContacts;