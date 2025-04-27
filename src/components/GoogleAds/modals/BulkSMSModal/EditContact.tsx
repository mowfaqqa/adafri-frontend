"use client";
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface EditContactProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ContactData) => void;
    existingGroups: string[];
    contactData: {
        id: string;
        name: string;
        number: string;
        group: string;
    } | null;
}

interface ContactData {
    name: string;
    group: string;
    newGroup?: string;
    phoneNumber: string;
}

const EditContact: React.FC<EditContactProps> = ({
    isOpen,
    onClose,
    onSave,
    existingGroups,
    contactData
}) => {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [newGroup, setNewGroup] = useState('');
    const [addingNewGroup, setAddingNewGroup] = useState(false);

    // Reset form or load data when modal opens
    useEffect(() => {
        if (isOpen && contactData) {
            setName(contactData.name);
            setPhoneNumber(contactData.number);
            setSelectedGroup(contactData.group);
            setNewGroup('');
            setAddingNewGroup(false);
        }
    }, [isOpen, contactData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            group: selectedGroup,
            newGroup: addingNewGroup ? newGroup : undefined,
            phoneNumber
        });
        resetForm();
    };

    const resetForm = () => {
        setName('');
        setPhoneNumber('');
        setSelectedGroup('');
        setNewGroup('');
        setAddingNewGroup(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    <X size={24} />
                </button>
                
                <h2 className="text-xl font-bold mb-6">Edit Contact</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Contact name"
                            required
                        />
                    </div>
                    
                    <div className="mb-4">
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Phone number"
                            required
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
                            Group
                        </label>
                        
                        {!addingNewGroup ? (
                            <div className="flex space-x-2">
                                <select
                                    id="group"
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="">Select a group</option>
                                    {existingGroups.map((group) => (
                                        <option key={group} value={group}>
                                            {group}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setAddingNewGroup(true)}
                                    className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                                >
                                    New
                                </button>
                            </div>
                        ) : (
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newGroup}
                                    onChange={(e) => setNewGroup(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="New group name"
                                />
                                <button
                                    type="button"
                                    onClick={() => setAddingNewGroup(false)}
                                    className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                        >
                            Update Contact
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditContact;