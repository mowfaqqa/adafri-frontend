"use client";
import React, { useState } from 'react';

interface RecipientsProps {
  initialData: any;
  onSubmit: (data: any) => void;
  setCurrentTab: (tab: string) => void;
}

const Recipients: React.FC<RecipientsProps> = ({ initialData, onSubmit, setCurrentTab }) => {
  const [recipientData, setRecipientData] = useState({
    recipientList: initialData.recipientList || [],
    recipientSource: 'all', // 'all', 'segment', 'upload'
    selectedSegment: '',
    csvFile: null as File | null,
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      ...recipientData,
      recipientCount: recipientData.recipientList.length || initialData.recipientCount
    });
    
    // Move to next tab
    setCurrentTab('setup');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Configure Recipients</h2>
      
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Source
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div 
                  className={`p-4 border rounded-lg cursor-pointer ${
                    recipientData.recipientSource === 'all' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setRecipientData({...recipientData, recipientSource: 'all'})}
                >
                  <h3 className="font-medium mb-1">All Contacts</h3>
                  <p className="text-sm text-gray-500">Send to all your contacts</p>
                </div>
                
                <div 
                  className={`p-4 border rounded-lg cursor-pointer ${
                    recipientData.recipientSource === 'segment' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setRecipientData({...recipientData, recipientSource: 'segment'})}
                >
                  <h3 className="font-medium mb-1">Segment</h3>
                  <p className="text-sm text-gray-500">Send to a specific segment</p>
                </div>
                
                <div 
                  className={`p-4 border rounded-lg cursor-pointer ${
                    recipientData.recipientSource === 'upload' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setRecipientData({...recipientData, recipientSource: 'upload'})}
                >
                  <h3 className="font-medium mb-1">Upload CSV</h3>
                  <p className="text-sm text-gray-500">Import contacts from file</p>
                </div>
              </div>
            </div>
            
            {/* Conditional fields based on selection */}
            {recipientData.recipientSource === 'segment' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Segment
                </label>
                <select
                  value={recipientData.selectedSegment}
                  onChange={(e) => setRecipientData({...recipientData, selectedSegment: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a segment</option>
                  <option value="new-customers">New Customers</option>
                  <option value="active-users">Active Users</option>
                  <option value="inactive-users">Inactive Users</option>
                  <option value="newsletter">Newsletter Subscribers</option>
                </select>
              </div>
            )}
            
            {recipientData.recipientSource === 'upload' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload CSV File
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>Upload a file</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          className="sr-only" 
                          accept=".csv"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setRecipientData({...recipientData, csvFile: e.target.files[0]});
                            }
                          }}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV up to 10MB</p>
                    {recipientData.csvFile && (
                      <p className="text-xs text-green-500">
                        Selected: {recipientData.csvFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentTab('campaign')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Campaign Summary</h3>
        <div className="text-sm text-gray-600">
          <p><span className="font-medium">Campaign:</span> {initialData.name}</p>
          <p><span className="font-medium">Subject:</span> {initialData.subject}</p>
          <p><span className="font-medium">Target Date:</span> {initialData.targetDate}</p>
          <p>
            <span className="font-medium">Recipients:</span> 
            {" "}
            {initialData.recipientCount} contacts
          </p>
        </div>
      </div>
    </div>
  );
};

export default Recipients;