import React, { useState } from 'react';
import Image from 'next/image';
import { InviteTeamMembersModal } from './InviteTeamMembersModal';

export const UnlockLevelCard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 justify-center">
        {/* Semi-circular Progress Gauge */}
        <div className="flex justify-center items-center mb-4">
          <Image
            src="/assets/semi-circle-chart.png"
            alt="Connect emails"
            width={250}
            height={250}
          />
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold">Unlock level 2</h3>
        </div>

        {/* Features List */}
        <ul className="space-y-4 mb-8">
          <li className="flex items-center">
            <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
            <span className="text-gray-700">Collaborative messaging</span>
          </li>
          <li className="flex items-center">
            <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
            <span className="text-gray-700">Customer Relationship Manager (CRM)</span>
          </li>
        </ul>

        {/* Button */}
        <button 
          className="w-full py-3 bg-gray-100 text-gray-800 rounded-lg text-center font-medium hover:bg-gray-200"
          onClick={handleOpenModal}
        >
          Invite team members
        </button>
      </div>

      {/* Modal */}
      <InviteTeamMembersModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </>
  );
};