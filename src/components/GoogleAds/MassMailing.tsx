"use client";
import React, { useState } from 'react';
import { Calendar, CheckCircle, Users, MoreVertical, Mail } from 'lucide-react';
import MassMailingViewModal from './modals/MassMailingModal/MassMailingViewModal';
import MassMailingFlowManager from './modals/MassMailingModal/MassMailingFlowManager';

interface Campaign {
    id: string;
    title: string;
    sender: string;
    date: string;
    recipients: number;
    sent: number;
    status: 'pending' | 'active' | 'done';
    subject: string;
    emailContent: string;
    emailAddresses: string;
    campaign: string;
}

const MassMailing: React.FC = () => {
    const [massMailingList, setMassMailingList] = useState<Campaign[]>([
        {
            id: '1',
            title: 'Happy New Year 2025 to our amazing clients',
            sender: 'Danny',
            date: '25 Dec, 2024',
            recipients: 500,
            sent: 500,
            status: 'done', // Changed from 'completed' to 'done'
            subject: 'Happy New Year 2025',
            emailContent: 'Happy New Year 2025 to our amazing clients. Wishing you all the best!',
            emailAddresses: 'clients@example.com, subscribers@example.com',
            campaign: 'End of Year'
        },
        {
            id: '2',
            title: 'Happy New Year 2025 to our amazing clients',
            sender: 'Ukachume',
            date: '08 Jan, 2025',
            recipients: 500,
            sent: 500,
            status: 'done', // Changed from 'completed' to 'done'
            subject: 'Happy New Year 2025',
            emailContent: 'Happy New Year 2025 to our amazing clients. Wishing you all the best!',
            emailAddresses: 'clients@example.com, subscribers@example.com',
            campaign: 'New Year'
        }
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMailing, setSelectedMailing] = useState<Campaign | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const openViewModal = (mailing: Campaign) => {
        setSelectedMailing(mailing);
        setIsViewModalOpen(true);
    };

    const closeViewModal = () => {
        setIsViewModalOpen(false);
        // Optional: clear selected mailing after modal close with a delay
        setTimeout(() => setSelectedMailing(null), 300);
    };

    // Function to add a new sent email to the list
    const addSentMailing = (newMailing: Omit<Campaign, 'id'>) => {
        const mailingWithId = {
            ...newMailing,
            id: String(Date.now()) // Generate unique ID
        };
        setMassMailingList(prevList => [mailingWithId, ...prevList]);
    };

    return (
        <div className="space-y-4">
            {massMailingList.map((mailing) => (
                <div
                    key={mailing.id}
                    className="bg-white rounded-lg shadow p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openViewModal(mailing)}
                >
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <h3 className="font-medium text-gray-800">{mailing.title}</h3>
                            <div className="text-sm text-gray-600">
                                Subject: {mailing.subject}
                            </div>
                            <div className="text-sm text-gray-600">
                                From: {mailing.sender} • Campaign: {mailing.campaign}
                            </div>
                            <div className="flex items-center text-sm text-gray-500 space-x-4">
                                <div className="flex items-center space-x-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{mailing.date}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Users className="h-4 w-4" />
                                    <span>{mailing.recipients}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>{mailing.sent}</span>
                                </div>
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
                    {mailing.status === 'done' && (
                        <div className="mt-2 text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full inline-block">
                            Sent
                        </div>
                    )}
                    {mailing.status === 'active' && (
                        <div className="mt-2 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full inline-block">
                            Active
                        </div>
                    )}
                    {mailing.status === 'pending' && (
                        <div className="mt-2 text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full inline-block">
                            Pending
                        </div>
                    )}
                </div>
            ))}

            <button
                onClick={openModal}
                className="w-full py-3 px-4 border border-gray-300 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
            >
                <span className="mr-2">+</span>
                Create Campaign
            </button>

            <MassMailingFlowManager
                isOpen={isModalOpen}
                onClose={closeModal}
                onSend={addSentMailing}
            />

            <MassMailingViewModal
                isOpen={isViewModalOpen}
                onClose={closeViewModal}
                mailing={selectedMailing}
            />
        </div>
    );
};

export default MassMailing;