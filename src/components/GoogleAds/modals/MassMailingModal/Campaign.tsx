"use client";
import React, { useState } from 'react';
import { Calendar, CheckCircle, Users, MoreVertical, Plus } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  targetDate: string;
  recipientCount: number;
  sent: number;
  sender: string;
  campaign: string;
  status: 'pending' | 'active' | 'done';
  emailContent?: string;
  emailAddresses?: string;
}

interface CampaignProps {
  initialData: any;
  onSubmit: (data: any) => void;
  setCurrentTab: (tab: string) => void;
}

const Campaign: React.FC<CampaignProps> = ({ initialData, onSubmit, setCurrentTab }) => {
  const [pendingCampaigns, setPendingCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Happy New Year 2025 to our amazing clients',
      subject: 'Happy New Year 2025!',
      targetDate: '25 Dec, 2024',
      recipientCount: 500,
      sent: 0,
      sender: 'Danny',
      campaign: 'End of Year',
      status: 'pending'
    },
    {
      id: '2',
      name: 'Happy New Year 2025 to our amazing clients',
      subject: 'Happy New Year 2025!',
      targetDate: '08 Jan, 2025',
      recipientCount: 500,
      sent: 0,
      sender: 'Ukachume',
      campaign: 'New Year',
      status: 'pending'
    }
  ]);

  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([
    {
      id: '3',
      name: 'Happy New Year 2025 to our amazing clients',
      subject: 'Happy New Year 2025!',
      targetDate: '08 Jan, 2025',
      recipientCount: 500,
      sent: 250,
      sender: 'Sarah',
      campaign: 'January Updates',
      status: 'active'
    }
  ]);

  const [doneCampaigns, setDoneCampaigns] = useState<Campaign[]>([
    {
      id: '4',
      name: 'Happy New Year 2025',
      subject: 'Happy New Year 2025!',
      targetDate: '25 Dec, 2024',
      recipientCount: 500,
      sent: 500,
      sender: 'Mike',
      campaign: 'Holiday Greetings',
      status: 'done'
    }
  ]);

  // New campaign modal state
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);

  // Campaign form data state
  const [campaignFormData, setCampaignFormData] = useState({
    name: initialData.name || '',
    subject: initialData.subject || 'Happy New Year 2025!',
    targetDate: initialData.targetDate || '',
    recipientCount: initialData.recipientCount || 500,
    sender: initialData.sender || '',
    campaign: initialData.campaign || '',
  });

  // Handle new campaign button click
  const handleNewCampaign = () => {
    setIsNewCampaignModalOpen(true);
  };

  // Handle create campaign submit
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: campaignFormData.name,
      subject: campaignFormData.subject,
      targetDate: campaignFormData.targetDate,
      recipientCount: campaignFormData.recipientCount,
      sent: 0,
      sender: campaignFormData.sender,
      campaign: campaignFormData.campaign,
      status: 'pending'
    };
    
    setPendingCampaigns(prev => [...prev, newCampaign]);
    setIsNewCampaignModalOpen(false);
    
    // Submit data to parent component
    onSubmit({
      name: campaignFormData.name,
      subject: campaignFormData.subject,
      targetDate: campaignFormData.targetDate,
      recipientCount: campaignFormData.recipientCount,
      sender: campaignFormData.sender,
      campaign: campaignFormData.campaign
    });
    
    // Reset form data
    setCampaignFormData({
      name: '',
      subject: 'Happy New Year 2025!',
      targetDate: '',
      recipientCount: 500,
      sender: '',
      campaign: '',
    });
  };

  // Handle selecting an existing campaign
  const handleSelectCampaign = (campaign: Campaign) => {
    onSubmit({
      name: campaign.name,
      subject: campaign.subject,
      targetDate: campaign.targetDate,
      recipientCount: campaign.recipientCount,
      sender: campaign.sender,
      campaign: campaign.campaign,
      sent: campaign.sent
    });
    
    // Navigate to next tab
    setCurrentTab('recipients');
  };

  // Render campaign card using MassMailing style
  const renderCampaignCard = (campaign: Campaign) => (
    <div 
      key={campaign.id} 
      className="bg-white rounded-lg shadow p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleSelectCampaign(campaign)}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h3 className="font-medium text-gray-800">{campaign.name}</h3>
          <div className="text-sm text-gray-600">
            Subject: {campaign.subject}
          </div>
          <div className="text-sm text-gray-600">
            From: {campaign.sender} • Campaign: {campaign.campaign}
          </div>
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{campaign.targetDate}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{campaign.recipientCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{campaign.sent}</span>
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
      
      {campaign.status === 'done' && (
        <div className="mt-2 text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full inline-block">
          Sent
        </div>
      )}
      {campaign.status === 'active' && (
        <div className="mt-2 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full inline-block">
          Active
        </div>
      )}
      {campaign.status === 'pending' && (
        <div className="mt-2 text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full inline-block">
          Pending
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        {/* Pending Campaigns */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Pending Campaigns</h3>
          </div>
          <div className="space-y-4">
            {pendingCampaigns.map(campaign => renderCampaignCard(campaign))}
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Active Campaigns</h3>
          </div>
          <div className="space-y-4">
            {activeCampaigns.map(campaign => renderCampaignCard(campaign))}
          </div>
        </div>

        {/* Done Campaigns */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Done Campaigns</h3>
          </div>
          <div className="space-y-4">
            {doneCampaigns.map(campaign => renderCampaignCard(campaign))}
          </div>
        </div>
      </div>

      {/* Create Campaign Button (Matching MassMailing style) */}
      <button 
        onClick={handleNewCampaign}
        className="w-full py-3 px-4 border border-gray-300 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <span className="mr-2">+</span>
        Create Campaign
      </button>

      {/* New Campaign Modal */}
      <Dialog open={isNewCampaignModalOpen} onOpenChange={setIsNewCampaignModalOpen}>
        <DialogContent className="sm:max-w-md p-0">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Create New Campaign</h2>
              <button 
                onClick={() => setIsNewCampaignModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCampaign}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={campaignFormData.name}
                    onChange={(e) => setCampaignFormData({...campaignFormData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter campaign name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={campaignFormData.subject}
                    onChange={(e) => setCampaignFormData({...campaignFormData, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email subject"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sender
                  </label>
                  <input
                    type="text"
                    value={campaignFormData.sender}
                    onChange={(e) => setCampaignFormData({...campaignFormData, sender: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter sender name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Category
                  </label>
                  <input
                    type="text"
                    value={campaignFormData.campaign}
                    onChange={(e) => setCampaignFormData({...campaignFormData, campaign: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter campaign category"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={campaignFormData.targetDate}
                    onChange={(e) => setCampaignFormData({...campaignFormData, targetDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Recipients
                  </label>
                  <input
                    type="number"
                    value={campaignFormData.recipientCount}
                    onChange={(e) => setCampaignFormData({...campaignFormData, recipientCount: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter number of recipients"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewCampaignModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Campaign;












































// "use client";
// import React, { useState } from 'react';
// import { MoreVertical, Plus } from 'lucide-react';
// import { Dialog, DialogContent } from "@/components/ui/dialog";
// import { X } from 'lucide-react';

// interface Campaign {
//   id: string;
//   name: string;
//   subject: string;
//   targetDate: string;
//   recipientCount: number;
//   status: 'pending' | 'active' | 'done';
// }

// interface CampaignProps {
//   initialData: any;
//   onSubmit: (data: any) => void;
//   setCurrentTab: (tab: string) => void;
// }

// const Campaign: React.FC<CampaignProps> = ({ initialData, onSubmit, setCurrentTab }) => {
//   const [pendingCampaigns, setPendingCampaigns] = useState<Campaign[]>([
//     {
//       id: '1',
//       name: 'Happy New Year 2025 to our amazing clients',
//       subject: 'Happy New Year 2025!',
//       targetDate: '25 Dec, 2024',
//       recipientCount: 500,
//       status: 'pending'
//     },
//     {
//       id: '2',
//       name: 'Happy New Year 2025 to our amazing clients',
//       subject: 'Happy New Year 2025!',
//       targetDate: '08 Jan, 2025',
//       recipientCount: 500,
//       status: 'pending'
//     }
//   ]);

//   const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([
//     {
//       id: '3',
//       name: 'Happy New Year 2025 to our amazing clients',
//       subject: 'Happy New Year 2025!',
//       targetDate: '08 Jan, 2025',
//       recipientCount: 500,
//       status: 'active'
//     }
//   ]);

//   const [doneCampaigns, setDoneCampaigns] = useState<Campaign[]>([
//     {
//       id: '4',
//       name: 'Happy New Year 2025',
//       subject: 'Happy New Year 2025!',
//       targetDate: '25 Dec, 2024',
//       recipientCount: 500,
//       status: 'done'
//     }
//   ]);

//   // New campaign modal state
//   const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);

//   // Campaign form data state
//   const [campaignFormData, setCampaignFormData] = useState({
//     name: initialData.name || '',
//     subject: initialData.subject || 'Happy New Year 2025!',
//     targetDate: initialData.targetDate || '',
//     recipientCount: initialData.recipientCount || 500,
//   });

//   // Handle new campaign button click
//   const handleNewCampaign = () => {
//     setIsNewCampaignModalOpen(true);
//   };

//   // Handle create campaign submit
//   const handleCreateCampaign = (e: React.FormEvent) => {
//     e.preventDefault();
    
//     const newCampaign: Campaign = {
//       id: Date.now().toString(),
//       name: campaignFormData.name,
//       subject: campaignFormData.subject,
//       targetDate: campaignFormData.targetDate,
//       recipientCount: campaignFormData.recipientCount,
//       status: 'pending'
//     };
    
//     setPendingCampaigns(prev => [...prev, newCampaign]);
//     setIsNewCampaignModalOpen(false);
    
//     // Submit data to parent component
//     onSubmit({
//       name: campaignFormData.name,
//       subject: campaignFormData.subject,
//       targetDate: campaignFormData.targetDate,
//       recipientCount: campaignFormData.recipientCount
//     });
    
//     // Reset form data
//     setCampaignFormData({
//       name: '',
//       subject: 'Happy New Year 2025!',
//       targetDate: '',
//       recipientCount: 500,
//     });
//   };

//   // Handle selecting an existing campaign
//   const handleSelectCampaign = (campaign: Campaign) => {
//     onSubmit({
//       name: campaign.name,
//       subject: campaign.subject,
//       targetDate: campaign.targetDate,
//       recipientCount: campaign.recipientCount
//     });
    
//     // Navigate to next tab
//     setCurrentTab('recipients');
//   };

//   // Render campaign card
//   const renderCampaignCard = (campaign: Campaign) => (
//     <div 
//       key={campaign.id} 
//       className="bg-white rounded-lg shadow-sm border p-4 mb-4 cursor-pointer hover:border-blue-300"
//       onClick={() => handleSelectCampaign(campaign)}
//     >
//       <div className="flex justify-between items-start mb-2">
//         <div className="text-xs text-gray-500 mb-1">
//           {campaign.status === 'pending' ? 'Dray' : 
//            campaign.status === 'active' ? 'Urbantime' : 'Dray'}
//         </div>
//         <button 
//           className="p-1 hover:bg-gray-100 rounded"
//           onClick={(e) => {
//             e.stopPropagation();
//             // Add actions menu logic here
//           }}
//         >
//           <MoreVertical className="h-4 w-4" />
//         </button>
//       </div>
      
//       <h3 className="text-sm font-medium mb-4">{campaign.name}</h3>
      
//       <div className="flex justify-between items-center">
//         <div className="flex items-center text-xs text-gray-500">
//           <span className="inline-block mr-4">
//             {campaign.targetDate}
//           </span>
//           <span className="flex items-center">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
//             </svg>
//             {campaign.recipientCount}
//           </span>
//         </div>
//         <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Plan</span>
//       </div>
//     </div>
//   );

//   return (
//     <>
//       <div className="grid grid-cols-3 gap-6">
//         {/* Pending Campaigns */}
//         <div className="flex flex-col">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="font-medium">Pending Campaigns</h3>
//             <button 
//               onClick={handleNewCampaign}
//               className="p-1 hover:bg-gray-100 rounded"
//             >
//               <Plus className="h-5 w-5" />
//             </button>
//           </div>
//           <div className="space-y-4">
//             {pendingCampaigns.map(campaign => renderCampaignCard(campaign))}
//           </div>
//         </div>

//         {/* Active Campaigns */}
//         <div className="flex flex-col">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="font-medium">Active Campaigns</h3>
//             <button 
//               onClick={handleNewCampaign}
//               className="p-1 hover:bg-gray-100 rounded"
//             >
//               <Plus className="h-5 w-5" />
//             </button>
//           </div>
//           <div className="space-y-4">
//             {activeCampaigns.map(campaign => renderCampaignCard(campaign))}
//           </div>
//         </div>

//         {/* Done Campaigns */}
//         <div className="flex flex-col">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="font-medium">Done Campaigns</h3>
//             <button 
//               className="p-1 hover:bg-gray-100 rounded invisible"
//             >
//               <Plus className="h-5 w-5" />
//             </button>
//           </div>
//           <div className="space-y-4">
//             {doneCampaigns.map(campaign => renderCampaignCard(campaign))}
//           </div>
//         </div>
//       </div>

//       {/* New Campaign Modal */}
//       <Dialog open={isNewCampaignModalOpen} onOpenChange={setIsNewCampaignModalOpen}>
//         <DialogContent className="sm:max-w-md p-0">
//           <div className="p-6">
//             <div className="flex justify-between items-center mb-6">
//               <h2 className="text-xl font-bold">Create New Campaign</h2>
//               <button 
//                 onClick={() => setIsNewCampaignModalOpen(false)}
//                 className="p-1 hover:bg-gray-100 rounded-full"
//               >
//                 <X className="h-5 w-5" />
//               </button>
//             </div>
            
//             <form onSubmit={handleCreateCampaign}>
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Campaign Name
//                   </label>
//                   <input
//                     type="text"
//                     value={campaignFormData.name}
//                     onChange={(e) => setCampaignFormData({...campaignFormData, name: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Enter campaign name"
//                     required
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Email Subject
//                   </label>
//                   <input
//                     type="text"
//                     value={campaignFormData.subject}
//                     onChange={(e) => setCampaignFormData({...campaignFormData, subject: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Enter email subject"
//                     required
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Target Date
//                   </label>
//                   <input
//                     type="date"
//                     value={campaignFormData.targetDate}
//                     onChange={(e) => setCampaignFormData({...campaignFormData, targetDate: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                     required
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Estimated Recipients
//                   </label>
//                   <input
//                     type="number"
//                     value={campaignFormData.recipientCount}
//                     onChange={(e) => setCampaignFormData({...campaignFormData, recipientCount: parseInt(e.target.value) || 0})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Enter number of recipients"
//                     required
//                   />
//                 </div>
//               </div>
              
//               <div className="flex justify-end mt-6 space-x-3">
//                 <button
//                   type="button"
//                   onClick={() => setIsNewCampaignModalOpen(false)}
//                   className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                 >
//                   Create Campaign
//                 </button>
//               </div>
//             </form>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// };

// export default Campaign;