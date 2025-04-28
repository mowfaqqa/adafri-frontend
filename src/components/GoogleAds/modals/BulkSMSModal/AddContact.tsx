"use client";
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AddContactProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ContactData) => void;
    existingGroups: string[];
    preSelectedGroup?: string; // New prop for pre-selecting a group
}

interface ContactData {
    name: string;
    group: string;
    newGroup?: string;
    phoneNumber: string;
}

const AddContact: React.FC<AddContactProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    existingGroups,
    preSelectedGroup 
}) => {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [newGroup, setNewGroup] = useState('');
    const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Set the pre-selected group when the component mounts or when preSelectedGroup changes
    useEffect(() => {
        if (preSelectedGroup) {
            setSelectedGroup(preSelectedGroup);
        }
    }, [preSelectedGroup]);

    if (!isOpen) return null;

    const validate = () => {
        const newErrors: Record<string, string> = {};
        
        if (!name.trim()) {
            newErrors.name = 'Name is required';
        }
        
        if (!phoneNumber.trim()) {
            newErrors.phoneNumber = 'Phone number is required';
        } else if (!/^\d+$/.test(phoneNumber)) {
            newErrors.phoneNumber = 'Phone number should contain only digits';
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
            onSave({
                name,
                group: selectedGroup,
                newGroup: isCreatingNewGroup ? newGroup : undefined,
                phoneNumber
            });
            
            // Reset form
            setName('');
            setPhoneNumber('');
            setSelectedGroup('');
            setNewGroup('');
            setIsCreatingNewGroup(false);
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium">Add New Contact</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                            placeholder="Enter name"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                        )}
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Phone Number
                        </label>
                        <input
                            type="text"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className={`w-full border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                            placeholder="Enter phone number"
                        />
                        {errors.phoneNumber && (
                            <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                        )}
                    </div>
                    
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
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddContact;





































// "use client";
// import React, { useState } from 'react';
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
// import { ChevronDown } from 'lucide-react';

// interface ContactData {
//   name: string;
//   group: string;
//   newGroup?: string;
//   phoneNumber: string;
// }

// interface AddContactProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (contact: ContactData) => void;
//   existingGroups?: string[];
// }

// const AddContact: React.FC<AddContactProps> = ({
//   isOpen,
//   onClose,
//   onSave,
//   existingGroups = ["Friends", "Family", "Work", "Clients"]
// }) => {
//   // Form state
//   const [name, setName] = useState('');
//   const [selectedGroup, setSelectedGroup] = useState('');
//   const [newGroup, setNewGroup] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);

//   // Handle form submission
//   const handleSave = () => {
//     // Create contact object
//     const contactData: ContactData = {
//       name,
//       group: selectedGroup,
//       phoneNumber
//     };
    
//     // Add new group if created
//     if (newGroup) {
//       contactData.newGroup = newGroup;
//     }
    
//     // Pass data to parent component
//     onSave(contactData);
    
//     // Reset form fields
//     resetForm();
    
//     // Close dialog
//     onClose();
//   };
  
//   // Reset form to initial state
//   const handleCancel = () => {
//     resetForm();
//     onClose();
//   };
  
//   const resetForm = () => {
//     setName('');
//     setSelectedGroup('');
//     setNewGroup('');
//     setPhoneNumber('');
//     setIsGroupDropdownOpen(false);
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={handleCancel}>
//       <DialogContent className="sm:max-w-md p-0">
//         <DialogTitle className="p-4 border-b border-gray-200 font-medium">
//           Add Contact
//         </DialogTitle>
        
//         <div className="p-4 space-y-4">
//           {/* Name Field */}
//           <div>
//             <label htmlFor="contactName" className="block text-sm text-gray-700 mb-1">
//               Firstname Surname
//             </label>
//             <input
//               type="text"
//               id="contactName"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               placeholder="Enter a name"
//               className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
//             />
//           </div>
          
//           {/* Group Selection Dropdown */}
//           <div>
//             <label htmlFor="existingGroup" className="block text-sm text-gray-700 mb-1">
//               Choose an existing group
//             </label>
//             <div className="relative">
//               <button
//                 type="button"
//                 id="existingGroup"
//                 onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
//                 className="w-full border border-gray-300 rounded-md px-3 py-2 text-left flex items-center justify-between"
//               >
//                 <span className="text-gray-700">
//                   {selectedGroup || "Select a group"}
//                 </span>
//                 <ChevronDown className="h-5 w-5 text-gray-500" />
//               </button>
              
//               {isGroupDropdownOpen && (
//                 <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
//                   {existingGroups.map((group) => (
//                     <div
//                       key={group}
//                       className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
//                       onClick={() => {
//                         setSelectedGroup(group);
//                         setIsGroupDropdownOpen(false);
//                       }}
//                     >
//                       {group}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
          
//           {/* New Group Field */}
//           <div>
//             <label htmlFor="newGroup" className="block text-sm text-gray-700 mb-1">
//               Create a new group
//             </label>
//             <input
//               type="text"
//               id="newGroup"
//               value={newGroup}
//               onChange={(e) => setNewGroup(e.target.value)}
//               className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
//             />
//           </div>
          
//           {/* Phone Number Field */}
//           <div>
//             <label htmlFor="phoneNumber" className="block text-sm text-gray-700 mb-1">
//               Mobile Phone Number
//             </label>
//             <input
//               type="tel"
//               id="phoneNumber"
//               value={phoneNumber}
//               onChange={(e) => setPhoneNumber(e.target.value)}
//               className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
//             />
//           </div>
          
//           {/* Save Button */}
//           <Button
//             onClick={handleSave}
//             className="w-full bg-teal-500 text-white hover:bg-teal-600 px-4 py-2 mt-2"
//           >
//             Save Contact
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default AddContact;