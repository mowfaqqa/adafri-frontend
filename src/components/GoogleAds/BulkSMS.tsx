"use client";
import React, { useState } from 'react';
import { Calendar, CheckCircle, Users, MoreVertical } from 'lucide-react';
import BulkSMSFlowManager from './modals/BulkSMSModal/BulkSMSFlowManager';
import BulkSMSViewModal from './modals/BulkSMSModal/BulkSMSViewModal';


interface BulkSMSItem {
  id: string;
  title: string;
  sender: string;
  date: string;
  recipients: number;
  sent: number;
  status: 'completed' | 'pending' | 'failed';
  message: string;
  phoneNumbers: string;
  country: string;
}

const BulkSMS: React.FC = () => {
  const [bulkSMSList, setBulkSMSList] = useState<BulkSMSItem[]>([
    {
      id: '1',
      title: 'Happy New Year 2025 to our amazing clients',
      sender: 'Daniel',
      date: '25 Dec, 2024',
      recipients: 500,
      sent: 500,
      status: 'completed',
      message: 'Happy New Year 2025 to our amazing clients. Wishing you all the best!',
      phoneNumbers: '08012345678, 08123456789',
      country: 'Nigeria'
    },
  ]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSMS, setSelectedSMS] = useState<BulkSMSItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
  const openViewModal = (sms: BulkSMSItem) => {
    setSelectedSMS(sms);
    setIsViewModalOpen(true);
  };
  
  const closeViewModal = () => {
    setIsViewModalOpen(false);
    // Optional: clear selected SMS after modal close with a delay
    setTimeout(() => setSelectedSMS(null), 300);
  };

  // Function to add a new sent SMS to the list
  const addSentSMS = (newSMS: Omit<BulkSMSItem, 'id'>) => {
    const smsWithId = {
      ...newSMS,
      id: String(Date.now()) // Generate unique ID
    };
    setBulkSMSList(prevList => [smsWithId, ...prevList]);
  };

  return (
    <div className="space-y-4">
      {bulkSMSList.map((sms) => (
        <div 
          key={sms.id} 
          className="bg-white rounded-lg shadow p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => openViewModal(sms)}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-800">{sms.title || sms.message.slice(0, 50) + '...'}</h3>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{sms.date}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{sms.recipients}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{sms.sent}</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                From: {sms.sender} • Country: {sms.country}
              </div>
            </div>
            <button 
              className="text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation(); // Prevent the card click from triggering
                // Add your action menu logic here if needed
              }}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}

      <button 
        onClick={openModal}
        className="w-full py-3 px-4 border border-gray-300 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <span className="mr-2">+</span>
        Create Bulk SMS
      </button>
      
      <BulkSMSFlowManager 
        isOpen={isModalOpen} 
        onClose={closeModal}
        onSend={addSentSMS}
      />
      
      <BulkSMSViewModal
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        sms={selectedSMS}
      />
    </div>
  );
};

export default BulkSMS;