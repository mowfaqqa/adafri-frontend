"use client";
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown, Upload, UserPlus } from 'lucide-react';
import AddContact from './AddContact';

// Define the ContactData interface
interface ContactData {
  name: string;
  group: string;
  newGroup?: string;
  phoneNumber: string;
}

interface UploadNoProps {
    onSubmit: (data: {
        name: string;
        description: string;
        country: string;
        phoneNumbers: string;
        uploadedFile?: File | null;
    }) => void;
    initialData: {
        name?: string;
        description?: string;
        country: string;
        phoneNumbers: string;
    };
}

// Countries with their codes
const countries = [
  { name: "Nigeria", code: "+234" },
  { name: "United States", code: "+1" },
  { name: "United Kingdom", code: "+44" },
  { name: "South Africa", code: "+27" },
  { name: "Ghana", code: "+233" },
  { name: "Kenya", code: "+254" },
  { name: "Canada", code: "+1" },
  { name: "India", code: "+91" },
];

const UploadNo: React.FC<UploadNoProps> = ({ onSubmit, initialData }) => {
    const [name, setName] = useState(initialData.name || '');
    const [description, setDescription] = useState(initialData.description || '');
    const [country, setCountry] = useState(initialData.country);
    const [countryCode, setCountryCode] = useState("+000");
    const [phoneNumbers, setPhoneNumbers] = useState(initialData.phoneNumbers);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isAddContactOpen, setIsAddContactOpen] = useState(false);
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

    // Update form when initialData changes
    useEffect(() => {
        setName(initialData.name || '');
        setDescription(initialData.description || '');
        setCountry(initialData.country);
        setPhoneNumbers(initialData.phoneNumbers);
        
        // Set country code if country is set in initialData
        if (initialData.country) {
            const selectedCountry = countries.find(c => c.name === initialData.country);
            if (selectedCountry) {
                setCountryCode(selectedCountry.code);
            }
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            description,
            country,
            phoneNumbers,
            uploadedFile
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadedFile(e.target.files[0]);
        }
    };

    const handleSaveContact = (contactData: ContactData) => {
        // Handle the saved contact data
        console.log("Saved contact:", contactData);
        
        // Add the new contact's phone number to the list
        if (contactData.phoneNumber) {
            const updatedNumbers = phoneNumbers 
                ? `${phoneNumbers}\n${contactData.phoneNumber}` 
                : contactData.phoneNumber;
            setPhoneNumbers(updatedNumbers);
        }
    };
    
    const handleSelectCountry = (countryName: string, countryCode: string) => {
        setCountry(countryName);
        setCountryCode(countryCode);
        setIsCountryDropdownOpen(false);
    };

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter a name for the numbers"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                            Country
                        </label>
                        <div className="flex relative">
                            <div className="bg-teal-500 text-white flex items-center justify-center px-4 rounded-l-md">
                                {countryCode}
                            </div>
                            <button
                                type="button"
                                className="w-full bg-gray-100 text-left px-4 py-2 rounded-r-md flex items-center justify-between"
                                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                            >
                                <span className="text-gray-700">
                                    {country || "Choose your Country"}
                                </span>
                                <ChevronDown className="h-5 w-5 text-gray-500" />
                            </button>
                            
                            {/* Country dropdown */}
                            {isCountryDropdownOpen && (
                                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {countries.map((countryItem) => (
                                        <div
                                            key={countryItem.name}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                                            onClick={() => handleSelectCountry(countryItem.name, countryItem.code)}
                                        >
                                            <span>{countryItem.name}</span>
                                            <span className="text-gray-500">{countryItem.code}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            or Paste Numbers here
                        </label>
                        <textarea
                            value={phoneNumbers}
                            onChange={(e) => setPhoneNumbers(e.target.value)}
                            placeholder="Enter 080..., 080... or 23480..."
                            className="w-full border border-gray-300 rounded-md px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <input
                            type="text"
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter a description (optional)"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-1">
                            Choose a file to upload (CSV, TXT)
                        </label>
                        <input
                            type="file"
                            id="fileUpload"
                            accept=".csv,.txt"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <label
                            htmlFor="fileUpload"
                            className="cursor-pointer w-full border border-gray-300 rounded-md px-3 py-2 inline-block text-center"
                        >
                            {uploadedFile ? uploadedFile.name : "Choose File"}
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
                <Button
                    onClick={handleSubmit}
                    className="flex items-center bg-teal-500 text-white hover:bg-teal-600 px-4 py-2"
                >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload numbers
                </Button>

                <Button
                    onClick={() => setIsAddContactOpen(true)}
                    variant="outline"
                    className="flex items-center border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2"
                >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Contact
                </Button>
            </div>
            
            {/* AddContact Modal */}
            <AddContact
                isOpen={isAddContactOpen}
                onClose={() => setIsAddContactOpen(false)}
                onSave={handleSaveContact}
                existingGroups={["Friends", "Family", "Work", "Clients", "VIP"]}
            />
        </div>
    );
};

export default UploadNo;