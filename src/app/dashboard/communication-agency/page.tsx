import AgencyDashboard from '@/components/CommunicationAgency/AgencyDashboard';
import React from 'react';


export const metadata = {
  title: 'Post Publisher',
  description: 'Manage content across all channels with advanced publishing tools',
};

export default function PostPage() {
  return (
    <div className="space-y-6 p-6">
        <AgencyDashboard />
    </div>
  );
}