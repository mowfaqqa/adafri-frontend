"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Edit, Send, Trash2, Plus, Mail, List, ChevronRight, ArrowLeft } from 'lucide-react';
import AddContact from './AddContact';
import EditContact from './EditContact';
import ImportContacts from './ImportContacts';
import GroupContacts from './GroupContacts';

interface AllContactProps {
    onSubmit: (data: any) => void;
    initialData: {
        senderName: string;
        phoneNumbers: string;
        country: string;
        message: string;
        sendOption: 'now' | 'schedule';
        scheduleDate: string;
        scheduleTime: string;
    };
    setCurrentStep?: (step: string) => void;
}

// Define the ContactData interface
interface ContactData {
    name: string;
    group: string;
    newGroup?: string;
    phoneNumber: string;
}

interface ImportData {
    group: string;
    newGroup?: string;
    file: File | null;
}

// Sample contacts data
const sampleContacts = [
    {
        id: "1",
        name: "Chris Chief",
        number: "09031568943",
        group: "Adafri"
    },
    {
        id: "2",
        name: "Daniel Odedara",
        number: "08023443322",
        group: "ChatGPT"
    },
];

// Sample groups data - matching the format from the image
const sampleGroups = [
    {
        id: "1",
        name: "Adafri",
        count: 200,
        createdAt: "Wed, April 15th 2025, 3:21PM"
    },
    {
        id: "2",
        name: "TechFair",
        count: 150,
        createdAt: "Fri, April 16th 2025, 12:21PM"
    },
    {
        id: "3",
        name: "ChatGPT",
        count: 15,
        createdAt: "Mon, April 14th 2025, 10:11AM"
    },
    {
        id: "4",
        name: "Dudu",
        count: 8,
        createdAt: "Sun, April 13th 2025, 9:45AM"
    },
    {
        id: "5",
        name: "Friends",
        count: 25,
        createdAt: "Tue, April 8th 2025, 2:30PM"
    },
    {
        id: "6",
        name: "Family",
        count: 12,
        createdAt: "Mon, April 7th 2025, 5:15PM"
    },
    {
        id: "7",
        name: "Work",
        count: 35,
        createdAt: "Fri, April 4th 2025, 11:05AM"
    }
];

const existingGroups = sampleGroups.map(group => group.name);

const AllContact: React.FC<AllContactProps> = ({ onSubmit, initialData, setCurrentStep }) => {
    // State for contacts - in a real app this would likely come from an API
    const [contacts, setContacts] = useState(sampleContacts);
    const [currentPage, setCurrentPage] = useState(1);
    const contactsPerPage = 10;
    const [isAddContactOpen, setIsAddContactOpen] = useState(false);
    const [isEditContactOpen, setIsEditContactOpen] = useState(false);
    const [isImportContactsOpen, setIsImportContactsOpen] = useState(false);
    const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false); // New state for Groups modal
    const [phoneNumbers, setPhoneNumbers] = useState(initialData.phoneNumbers);
    const [currentContact, setCurrentContact] = useState<typeof sampleContacts[0] | null>(null);
    
    const tableRef = useRef<HTMLDivElement>(null);
    
    // Calculate pagination
    const totalPages = Math.ceil(contacts.length / contactsPerPage);
    const indexOfLastContact = currentPage * contactsPerPage;
    const indexOfFirstContact = indexOfLastContact - contactsPerPage;
    const currentContacts = contacts.slice(indexOfFirstContact, indexOfLastContact);
    
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

    // Handler for sending SMS to a contact
    const handleSend = (contact: typeof sampleContacts[0]) => {
        // When sending to a contact, pass its data to the parent component
        onSubmit({
            senderName: initialData.senderName,
            phoneNumbers: contact.number,
            country: initialData.country,
            message: initialData.message,
            sendOption: 'now',
            scheduleDate: '',
            scheduleTime: '',
        });

        // Navigate to compose step
        if (setCurrentStep) {
            setCurrentStep('compose');
        }
    };

    // Handler for editing a contact
    const handleEdit = (contact: typeof sampleContacts[0]) => {
        setCurrentContact(contact);
        setIsEditContactOpen(true);
    };

    // Handler for saving edited contact
    const handleSaveEditedContact = (contactData: ContactData) => {
        if (currentContact) {
            // Update the contacts array with edited data
            const updatedContacts = contacts.map(contact => 
                contact.id === currentContact.id 
                    ? { 
                        ...contact, 
                        name: contactData.name,
                        number: contactData.phoneNumber,
                        group: contactData.newGroup || contactData.group
                    } 
                    : contact
            );
            
            setContacts(updatedContacts);
            setIsEditContactOpen(false);
            setCurrentContact(null);
        }
    };

    // Handler for adding a new contact
    const handleSaveContact = (contactData: ContactData) => {
        // Create a new contact
        const newContact = {
            id: (contacts.length + 1).toString(),
            name: contactData.name,
            number: contactData.phoneNumber,
            group: contactData.newGroup || contactData.group
        };
        
        // Add to contacts
        setContacts([...contacts, newContact]);
        setIsAddContactOpen(false);
        
        // Add the new contact's phone number to the list
        if (contactData.phoneNumber) {
            const updatedNumbers = phoneNumbers
                ? `${phoneNumbers}\n${contactData.phoneNumber}`
                : contactData.phoneNumber;
            setPhoneNumbers(updatedNumbers);
        }
    };

    // Handler for importing contacts
    const handleImportContacts = (importData: ImportData) => {
        // This would typically process a CSV/TXT file and add contacts
        // For this example, we'll just log the data
        console.log('Importing contacts:', importData);
        
        // In a real implementation, you would:
        // 1. Parse the file content (CSV/TXT)
        // 2. Create contact objects from the parsed data
        // 3. Add them to the contacts array
        // 4. Handle any validation or errors

        // Example mock implementation:
        if (importData.file) {
            // Mock adding some contacts from import
            const newContacts = [
                {
                    id: (contacts.length + 1).toString(),
                    name: "Imported Contact 1",
                    number: "08011111111",
                    group: importData.newGroup || importData.group
                },
                {
                    id: (contacts.length + 2).toString(),
                    name: "Imported Contact 2",
                    number: "08022222222",
                    group: importData.newGroup || importData.group
                }
            ];
            
            setContacts([...contacts, ...newContacts]);
            
            // Show success message
            alert(`Successfully imported ${newContacts.length} contacts!`);
        }
        
        setIsImportContactsOpen(false);
    };

    // Handler for deleting a contact
    const handleDelete = (id: string) => {
        // Remove the contact from the list
        setContacts(contacts.filter(contact => contact.id !== id));
    };

    // Handler for opening the import contacts modal
    const handleOpenImportContacts = () => {
        setIsImportContactsOpen(true);
    };

    // Handler for groups button - opens the Groups modal
    const handleGroups = () => {
        setIsGroupsModalOpen(true);
    };

    return (
        <div className="w-full overflow-hidden">
            {isGroupsModalOpen ? (
                <GroupContacts
                    onClose={() => setIsGroupsModalOpen(false)}
                    existingGroups={sampleGroups}
                    onNavigateToAllContacts={() => setIsGroupsModalOpen(false)}
                />
            ) : (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">All Contacts</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handleOpenImportContacts}
                                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                            >
                                <span>Import Contact</span>
                            </button>
                            <button
                                onClick={() => setIsAddContactOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                            >
                                <span>Add Contact</span>
                            </button>
                            <button
                                onClick={handleGroups}
                                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                            >
                                <span>Groups</span>
                            </button>
                        </div>
                    </div>

                    {/* AddContact Modal */}
                    <AddContact
                        isOpen={isAddContactOpen}
                        onClose={() => setIsAddContactOpen(false)}
                        onSave={handleSaveContact}
                        existingGroups={existingGroups}
                    />

                    {/* EditContact Modal */}
                    <EditContact
                        isOpen={isEditContactOpen}
                        onClose={() => {
                            setIsEditContactOpen(false);
                            setCurrentContact(null);
                        }}
                        onSave={handleSaveEditedContact}
                        existingGroups={existingGroups}
                        contactData={currentContact}
                    />

                    {/* ImportContacts Modal */}
                    <ImportContacts
                        isOpen={isImportContactsOpen}
                        onClose={() => setIsImportContactsOpen(false)}
                        onImport={handleImportContacts}
                        existingGroups={existingGroups}
                    />

                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 mb-2 text-gray-700 font-medium border-b pb-2 px-2">
                        <div className="col-span-1 flex items-center">
                            <span>#</span>
                        </div>
                        <div className="col-span-4 flex items-center">
                            <span>Name</span>
                        </div>
                        <div className="col-span-3 flex items-center">
                            <span>Numbers</span>
                        </div>
                        <div className="col-span-2 flex items-center">
                            <span>Group</span>
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
                        {currentContacts.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                                No contacts found
                            </div>
                        ) : (
                            currentContacts.map((contact, index) => (
                                <div key={contact.id} className="grid grid-cols-12 gap-2 py-3 border-b border-gray-100 hover:bg-gray-50 px-2">
                                    <div className="col-span-1 text-gray-800 flex items-center">
                                        <span>{indexOfFirstContact + index + 1}</span>
                                    </div>
                                    <div className="col-span-4 font-medium text-gray-800 flex items-center truncate">
                                        {contact.name}
                                    </div>
                                    <div className="col-span-3 text-gray-600 flex items-center truncate">
                                        {contact.number}
                                    </div>
                                    <div className="col-span-2 text-gray-600 flex items-center truncate">
                                        {contact.group}
                                    </div>
                                    <div className="col-span-2 flex space-x-1 items-center">
                                        <button
                                            onClick={() => handleSend(contact)}
                                            className="p-1 text-gray-600 hover:text-green-600"
                                            aria-label={`Send SMS to ${contact.name}`}
                                            title="Send SMS"
                                        >
                                            <Send size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(contact)}
                                            className="p-1 text-gray-600 hover:text-blue-600"
                                            aria-label={`Edit ${contact.name}`}
                                            title="Edit Contact"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(contact.id)}
                                            className="p-1 text-gray-600 hover:text-red-600"
                                            aria-label={`Delete ${contact.name}`}
                                            title="Delete Contact"
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
                                Showing {indexOfFirstContact + 1}-{Math.min(indexOfLastContact, contacts.length)} of {contacts.length} contacts
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
                </>
            )}
        </div>
    );
};

export default AllContact;












































// "use client";
// import React, { useState } from 'react';
// import { Edit, Send, Trash2, Plus, Mail, List, ChevronRight } from 'lucide-react';
// import AddContact from './AddContact';
// import EditContact from './EditContact';
// import ImportContacts from './ImportContacts';

// interface AllContactProps {
//     onSubmit: (data: any) => void;
//     initialData: {
//         senderName: string;
//         phoneNumbers: string;
//         country: string;
//         message: string;
//         sendOption: 'now' | 'schedule';
//         scheduleDate: string;
//         scheduleTime: string;
//     };
//     setCurrentStep?: (step: string) => void;
// }

// // Define the ContactData interface
// interface ContactData {
//     name: string;
//     group: string;
//     newGroup?: string;
//     phoneNumber: string;
// }

// interface ImportData {
//     group: string;
//     newGroup?: string;
//     file: File | null;
// }

// // Sample contacts data
// const sampleContacts = [
//     {
//         id: "1",
//         name: "Chris Chief",
//         number: "09031568943",
//         group: "Adafri"
//     },
//     {
//         id: "2",
//         name: "Daniel Odedara",
//         number: "08023443322",
//         group: "ChatGPT"
//     },
// ];

// const existingGroups = ["Adafri", "ChatGPT", "Dudu", "Friends", "Family", "Work"];

// const AllContact: React.FC<AllContactProps> = ({ onSubmit, initialData, setCurrentStep }) => {
//     // State for contacts - in a real app this would likely come from an API
//     const [contacts, setContacts] = useState(sampleContacts);
//     const [currentPage, setCurrentPage] = useState(1);
//     const contactsPerPage = 10;
//     const [isAddContactOpen, setIsAddContactOpen] = useState(false);
//     const [isEditContactOpen, setIsEditContactOpen] = useState(false);
//     const [isImportContactsOpen, setIsImportContactsOpen] = useState(false);
//     const [phoneNumbers, setPhoneNumbers] = useState(initialData.phoneNumbers);
//     const [currentContact, setCurrentContact] = useState<typeof sampleContacts[0] | null>(null);

//     // Handler for sending SMS to a contact
//     const handleSend = (contact: typeof sampleContacts[0]) => {
//         // When sending to a contact, pass its data to the parent component
//         onSubmit({
//             senderName: initialData.senderName,
//             phoneNumbers: contact.number,
//             country: initialData.country,
//             message: initialData.message,
//             sendOption: 'now',
//             scheduleDate: '',
//             scheduleTime: '',
//         });

//         // Navigate to compose step
//         if (setCurrentStep) {
//             setCurrentStep('compose');
//         }
//     };

//     // Handler for editing a contact
//     const handleEdit = (contact: typeof sampleContacts[0]) => {
//         setCurrentContact(contact);
//         setIsEditContactOpen(true);
//     };

//     // Handler for saving edited contact
//     const handleSaveEditedContact = (contactData: ContactData) => {
//         if (currentContact) {
//             // Update the contacts array with edited data
//             const updatedContacts = contacts.map(contact => 
//                 contact.id === currentContact.id 
//                     ? { 
//                         ...contact, 
//                         name: contactData.name,
//                         number: contactData.phoneNumber,
//                         group: contactData.newGroup || contactData.group
//                     } 
//                     : contact
//             );
            
//             setContacts(updatedContacts);
//             setIsEditContactOpen(false);
//             setCurrentContact(null);
//         }
//     };

//     // Handler for adding a new contact
//     const handleSaveContact = (contactData: ContactData) => {
//         // Create a new contact
//         const newContact = {
//             id: (contacts.length + 1).toString(),
//             name: contactData.name,
//             number: contactData.phoneNumber,
//             group: contactData.newGroup || contactData.group
//         };
        
//         // Add to contacts
//         setContacts([...contacts, newContact]);
//         setIsAddContactOpen(false);
        
//         // Add the new contact's phone number to the list
//         if (contactData.phoneNumber) {
//             const updatedNumbers = phoneNumbers
//                 ? `${phoneNumbers}\n${contactData.phoneNumber}`
//                 : contactData.phoneNumber;
//             setPhoneNumbers(updatedNumbers);
//         }
//     };

//     // Handler for importing contacts
//     const handleImportContacts = (importData: ImportData) => {
//         // This would typically process a CSV/TXT file and add contacts
//         // For this example, we'll just log the data
//         console.log('Importing contacts:', importData);
        
//         // In a real implementation, you would:
//         // 1. Parse the file content (CSV/TXT)
//         // 2. Create contact objects from the parsed data
//         // 3. Add them to the contacts array
//         // 4. Handle any validation or errors

//         // Example mock implementation:
//         if (importData.file) {
//             // Mock adding some contacts from import
//             const newContacts = [
//                 {
//                     id: (contacts.length + 1).toString(),
//                     name: "Imported Contact 1",
//                     number: "08011111111",
//                     group: importData.newGroup || importData.group
//                 },
//                 {
//                     id: (contacts.length + 2).toString(),
//                     name: "Imported Contact 2",
//                     number: "08022222222",
//                     group: importData.newGroup || importData.group
//                 }
//             ];
            
//             setContacts([...contacts, ...newContacts]);
            
//             // Show success message
//             alert(`Successfully imported ${newContacts.length} contacts!`);
//         }
//     };

//     // Handler for deleting a contact
//     const handleDelete = (id: string) => {
//         // Remove the contact from the list
//         setContacts(contacts.filter(contact => contact.id !== id));
//     };

//     // Handler for opening the import contacts modal
//     const handleOpenImportContacts = () => {
//         setIsImportContactsOpen(true);
//     };

//     // Handler for groups button
//     const handleGroups = () => {
//         console.log('Groups clicked');
//         // This would open the groups modal
//     };

//     // Calculate pagination
//     const totalPages = Math.ceil(contacts.length / contactsPerPage);
//     const indexOfLastContact = currentPage * contactsPerPage;
//     const indexOfFirstContact = indexOfLastContact - contactsPerPage;
//     const currentContacts = contacts.slice(indexOfFirstContact, indexOfLastContact);

//     return (
//         <div className="w-full">
//             <div className="flex justify-between items-center mb-6">
//                 <h3 className="text-lg font-medium">All Contacts</h3>
//                 <div className="flex space-x-2">
//                     <button
//                         onClick={handleOpenImportContacts}
//                         className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
//                     >
//                         <span>Import Contact</span>
//                     </button>
//                     <button
//                         onClick={() => setIsAddContactOpen(true)}
//                         className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
//                     >
//                         <span>Add Contact</span>
//                     </button>
//                     <button
//                         onClick={handleGroups}
//                         className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
//                     >
//                         <span>Groups</span>
//                     </button>
//                 </div>
//             </div>

//             {/* AddContact Modal */}
//             <AddContact
//                 isOpen={isAddContactOpen}
//                 onClose={() => setIsAddContactOpen(false)}
//                 onSave={handleSaveContact}
//                 existingGroups={existingGroups}
//             />

//             {/* EditContact Modal */}
//             <EditContact
//                 isOpen={isEditContactOpen}
//                 onClose={() => {
//                     setIsEditContactOpen(false);
//                     setCurrentContact(null);
//                 }}
//                 onSave={handleSaveEditedContact}
//                 existingGroups={existingGroups}
//                 contactData={currentContact}
//             />

//             {/* ImportContacts Modal */}
//             <ImportContacts
//                 isOpen={isImportContactsOpen}
//                 onClose={() => setIsImportContactsOpen(false)}
//                 onImport={handleImportContacts}
//                 existingGroups={existingGroups}
//             />

//             {/* Table Header */}
//             <div className="grid grid-cols-4 gap-4 mb-2 text-gray-700 font-medium border-b pb-2">
//                 <div className="flex items-center">
//                     <span>Name</span>
//                 </div>
//                 <div className="flex items-center">
//                     <span>Numbers</span>
//                 </div>
//                 <div className="flex items-center">
//                     <span>Group</span>
//                 </div>
//                 <div className="flex items-center">
//                     <span>Actions</span>
//                 </div>
//             </div>

//             {/* Table Content */}
//             {currentContacts.length === 0 ? (
//                 <div className="text-center py-10 text-gray-500">
//                     No contacts found
//                 </div>
//             ) : (
//                 currentContacts.map((contact, index) => (
//                     <div key={contact.id} className="grid grid-cols-4 gap-4 py-4 border-b border-gray-100">
//                         <div className="font-medium text-gray-800">
//                             <span className="mr-1">{indexOfFirstContact + index + 1}.</span>
//                             {contact.name}
//                         </div>
//                         <div className="text-gray-600">{contact.number}</div>
//                         <div className="text-gray-600">{contact.group}</div>
//                         <div className="flex space-x-2">
//                             <button
//                                 onClick={() => handleSend(contact)}
//                                 className="p-1 text-gray-600 hover:text-green-600"
//                                 aria-label={`Send SMS to ${contact.name}`}
//                             >
//                                 <Send size={18} />
//                             </button>
//                             <button
//                                 onClick={() => handleEdit(contact)}
//                                 className="p-1 text-gray-600 hover:text-blue-600"
//                                 aria-label={`Edit ${contact.name}`}
//                             >
//                                 <Edit size={18} />
//                             </button>
//                             <button
//                                 onClick={() => handleDelete(contact.id)}
//                                 className="p-1 text-gray-600 hover:text-red-600"
//                                 aria-label={`Delete ${contact.name}`}
//                             >
//                                 <Trash2 size={18} />
//                             </button>
//                         </div>
//                     </div>
//                 ))
//             )}

//             {/* Pagination */}
//             {totalPages > 1 && (
//                 <div className="flex justify-end items-center mt-4">
//                     <span className="text-sm text-gray-600 mr-2">
//                         Page {currentPage}
//                     </span>
//                     <button
//                         onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//                         disabled={currentPage === totalPages}
//                         className="p-1 text-gray-600 hover:text-blue-600 disabled:opacity-50"
//                         aria-label="Next page"
//                     >
//                         <ChevronRight size={18} />
//                     </button>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default AllContact;