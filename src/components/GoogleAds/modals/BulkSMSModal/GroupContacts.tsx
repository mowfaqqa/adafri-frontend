"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Edit, Trash2, Plus, Mail, ChevronRight, List, ArrowLeft, UserPlus, Upload } from 'lucide-react';
import AddContact from './AddContact';
import ImportContacts from './ImportContacts';

interface GroupsModalProps {
    onClose: () => void;
    existingGroups: { id: string; name: string; count: number; createdAt: string }[];
    onNavigateToAllContacts: () => void;
}

const GroupContacts: React.FC<GroupsModalProps> = ({ 
    onClose, 
    existingGroups: initialGroups, 
    onNavigateToAllContacts 
}) => {
    // State for groups
    const [groups, setGroups] = useState(initialGroups);
    const [currentPage, setCurrentPage] = useState(1);
    const [newGroupName, setNewGroupName] = useState('');
    const [isAddingGroup, setIsAddingGroup] = useState(false);
    const [isAddContactOpen, setIsAddContactOpen] = useState(false);
    const [isImportContactsOpen, setIsImportContactsOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    
    const groupsPerPage = 10;
    const tableRef = useRef<HTMLDivElement>(null);
    
    // Calculate pagination
    const totalPages = Math.ceil(groups.length / groupsPerPage);
    const indexOfLastGroup = currentPage * groupsPerPage;
    const indexOfFirstGroup = indexOfLastGroup - groupsPerPage;
    const currentGroups = groups.slice(indexOfFirstGroup, indexOfLastGroup);

    // Scroll handling for pagination
    useEffect(() => {
        const handleScroll = () => {
            if (tableRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
                
                // If scrolled near bottom and not on last page
                if (scrollTop + clientHeight >= scrollHeight - 20 && currentPage < totalPages) {
                    setCurrentPage(prev => prev + 1);
                }
                
                // If scrolled near top and not on first page
                if (scrollTop <= 20 && currentPage > 1) {
                    setCurrentPage(prev => prev - 1);
                }
            }
        };

        const tableElement = tableRef.current;
        if (tableElement) {
            tableElement.addEventListener('scroll', handleScroll);
            
            return () => {
                tableElement.removeEventListener('scroll', handleScroll);
            };
        }
    }, [currentPage, totalPages]);

    // Handler for adding a new group
    const handleAddGroup = () => {
        if (newGroupName.trim()) {
            const newGroup = {
                id: (groups.length + 1).toString(),
                name: newGroupName.trim(),
                count: 0,
                createdAt: new Date().toLocaleString()
            };
            
            setGroups([...groups, newGroup]);
            setNewGroupName('');
            setIsAddingGroup(false);
        }
    };

    // Handler for deleting a group
    const handleDeleteGroup = (id: string) => {
        setGroups(groups.filter(group => group.id !== id));
    };

    // Handler for adding contact to a specific group
    const handleAddContactToGroup = (groupName: string) => {
        setSelectedGroup(groupName);
        setIsAddContactOpen(true);
    };

    // Handler for importing contacts to a specific group
    const handleImportContactsToGroup = (groupName: string) => {
        setSelectedGroup(groupName);
        setIsImportContactsOpen(true);
    };

    // Handler for saving contact
    const handleSaveContact = (contactData: any) => {
        // In a real app, this would add the contact to the database
        console.log('Adding contact to group:', selectedGroup, contactData);
        
        // Update the count for the selected group
        const updatedGroups = groups.map(group => 
            group.name === selectedGroup 
                ? { ...group, count: group.count + 1 } 
                : group
        );
        
        setGroups(updatedGroups);
        setIsAddContactOpen(false);
    };

    // Handler for importing contacts
    const handleImportContacts = (importData: any) => {
        // In a real app, this would import contacts from a file
        console.log('Importing contacts to group:', selectedGroup, importData);
        
        // Mock updating the count for the selected group
        // Assuming we imported 5 contacts for this example
        const mockImportCount = 5;
        
        const updatedGroups = groups.map(group => 
            group.name === selectedGroup 
                ? { ...group, count: group.count + mockImportCount } 
                : group
        );
        
        setGroups(updatedGroups);
        setIsImportContactsOpen(false);
        
        // Show success message
        alert(`Successfully imported ${mockImportCount} contacts to ${selectedGroup}!`);
    };

    return (
        <div className="w-full overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onNavigateToAllContacts}
                        className="p-1 text-gray-600 hover:text-blue-600"
                        aria-label="Go back to All Contacts"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h3 className="text-lg font-medium">Contact Groups</h3>
                </div>
                <button
                    onClick={() => setIsAddingGroup(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                >
                    <Plus size={16} />
                    <span>New Group</span>
                </button>
            </div>

            {/* Add Group Form */}
            {isAddingGroup && (
                <div className="mb-4 p-4 bg-gray-50 rounded-md">
                    <h4 className="text-md font-medium mb-3">Create New Group</h4>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Enter group name"
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <button
                            onClick={handleAddGroup}
                            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => setIsAddingGroup(false)}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* AddContact Modal */}
            {isAddContactOpen && (
                <AddContact
                    isOpen={isAddContactOpen}
                    onClose={() => setIsAddContactOpen(false)}
                    onSave={handleSaveContact}
                    existingGroups={groups.map(g => g.name)}
                    preSelectedGroup={selectedGroup || undefined}
                />
            )}

            {/* ImportContacts Modal */}
            {isImportContactsOpen && (
                <ImportContacts
                    isOpen={isImportContactsOpen}
                    onClose={() => setIsImportContactsOpen(false)}
                    onImport={handleImportContacts}
                    existingGroups={groups.map(g => g.name)}
                    preSelectedGroup={selectedGroup || undefined}
                />
            )}

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 mb-2 text-gray-700 font-medium border-b pb-2 px-2">
                <div className="col-span-1 flex items-center">
                    <span>#</span>
                </div>
                <div className="col-span-4 flex items-center">
                    <span>Group</span>
                </div>
                <div className="col-span-2 flex items-center">
                    <span>Contacts</span>
                </div>
                <div className="col-span-3 flex items-center">
                    <span>Created</span>
                </div>
                <div className="col-span-2 flex items-center">
                    <span>Actions</span>
                </div>
            </div>

            {/* Table Content */}
            <div 
                ref={tableRef} 
                className="overflow-y-auto max-h-96 pr-1"
                style={{ scrollBehavior: 'smooth' }}
            >
                {currentGroups.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                        No groups found
                    </div>
                ) : (
                    currentGroups.map((group, index) => (
                        <div key={group.id} className="grid grid-cols-12 gap-2 py-3 border-b border-gray-100 hover:bg-gray-50 px-2">
                            <div className="col-span-1 text-gray-800 flex items-center">
                                <span>{indexOfFirstGroup + index + 1}</span>
                            </div>
                            <div className="col-span-4 font-medium text-gray-800 flex items-center truncate">
                                {group.name}
                            </div>
                            <div className="col-span-2 text-gray-600 flex items-center">
                                {group.count}
                            </div>
                            <div className="col-span-3 text-gray-500 text-xs flex items-center">
                                {group.createdAt}
                            </div>
                            <div className="col-span-2 flex space-x-1 items-center">
                                <button
                                    onClick={() => handleAddContactToGroup(group.name)}
                                    className="p-1 text-gray-600 hover:text-green-600"
                                    aria-label={`Add contact to ${group.name}`}
                                    title="Add Contact"
                                >
                                    <UserPlus size={16} />
                                </button>
                                <button
                                    onClick={() => handleImportContactsToGroup(group.name)}
                                    className="p-1 text-gray-600 hover:text-blue-600"
                                    aria-label={`Import contacts to ${group.name}`}
                                    title="Import Contacts"
                                >
                                    <Upload size={16} />
                                </button>
                                <button
                                    onClick={() => handleDeleteGroup(group.id)}
                                    className="p-1 text-gray-600 hover:text-red-600"
                                    aria-label={`Delete ${group.name}`}
                                    title="Delete Group"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-3 px-2">
                    <span className="text-sm text-gray-600">
                        Showing {indexOfFirstGroup + 1}-{Math.min(indexOfLastGroup, groups.length)} of {groups.length} groups
                    </span>
                    <div className="flex items-center">
                        <span className="text-sm text-gray-600 mr-2">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-1 text-gray-600 hover:text-blue-600 disabled:opacity-50"
                            aria-label="Previous page"
                        >
                            <ChevronRight size={18} className="transform rotate-180" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-1 text-gray-600 hover:text-blue-600 disabled:opacity-50"
                            aria-label="Next page"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupContacts;