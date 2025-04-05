// "use client";
// import React, { useState } from 'react';
// import { Card, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { 
//   MoreVertical, Clock, ArrowRight, Play, Eye, MousePointer, DollarSign 
// } from 'lucide-react';
// import { useGoogleAds } from "@/lib/context/GoogleAdsContext";
// import Image from "next/image";
// import CampaignDetailsModal from './modals/DisplayModal/CampaignDetailsModal';

// // Define TypeScript interface for display campaign data
// interface DisplayCampaign {
//   id: string;
//   name: string;
//   date: string;
//   imageUrl: string;
//   impressions: string;
//   clicks: string;
//   conversions: string;
//   status: 'active' | 'paused' | 'ended';
// }

// const GoogleDisplayAds: React.FC = () => {
//   const { displayCampaigns, createDisplayCampaign, isLoading } = useGoogleAds();
//   const [selectedCampaign, setSelectedCampaign] = useState<DisplayCampaign | null>(null);

//   return (
//     <div className="space-y-4">
//       {/* Create Campaign Button at the Top */}
//       <Button 
//         variant="outline" 
//         className="w-full mb-4" 
//         onClick={createDisplayCampaign}
//       >
//         + Create campaign
//       </Button>

//       {isLoading ? (
//         <Card className="border rounded-lg w-full">
//           <CardContent className="p-4 flex items-center justify-center h-32">
//             <p>Loading campaigns...</p>
//           </CardContent>
//         </Card>
//       ) : displayCampaigns && displayCampaigns.length > 0 ? (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {displayCampaigns.map((campaign) => (
//             <Card 
//               key={campaign.id} 
//               className="border rounded-lg cursor-pointer hover:shadow-md transition-shadow w-full min-h-[400px] flex flex-col"
//               onClick={() => setSelectedCampaign(campaign)}
//             >
//               <CardContent className="p-4 flex-grow flex flex-col">
//                 <div className="flex justify-between items-start mb-2">
//                   <h3 className="font-medium truncate max-w-[80%]">{campaign.name}</h3>
//                   <button className="text-gray-500 hover:text-gray-700">
//                     <MoreVertical className="h-5 w-5" />
//                   </button>
//                 </div>

//                 <div className="flex items-center text-sm text-gray-500 mb-4">
//                   <Clock className="h-4 w-4 mr-1" />
//                   <span>{campaign.date}</span>
//                 </div>

//                 <div className="mb-4 flex-grow relative">
//                   {campaign.imageUrl ? (
//                     <div className="rounded-lg overflow-hidden h-full">
//                       <Image
//                         src={campaign.imageUrl}
//                         alt={campaign.name}
//                         layout="fill"
//                         objectFit="cover"
//                         className="w-full h-full"
//                       />
//                       <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-20">
//                         <button className="bg-white p-2 rounded-full shadow-md">
//                           <ArrowRight className="h-5 w-5" />
//                         </button>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="bg-gray-100 h-full rounded-lg flex items-center justify-center text-gray-500">
//                       No Image
//                     </div>
//                   )}
//                 </div>

//                 <div className="mt-auto flex items-center justify-between">
//                   <div className="flex items-center">
//                     <div className="mr-4 flex items-center">
//                       <Eye className="h-4 w-4 mr-1 text-gray-500" />
//                       <span className="font-medium">{campaign.impressions}</span>
//                     </div>
//                     <div className="mr-4 flex items-center">
//                       <MousePointer className="h-4 w-4 mr-1 text-gray-500" />
//                       <span className="font-medium">{campaign.clicks}</span>
//                     </div>
//                     <div className="flex items-center">
//                       <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
//                       <span className="font-medium">{campaign.conversions}</span>
//                     </div>
//                   </div>
//                   <button className="p-1 rounded-full bg-green-100">
//                     <Play className="h-4 w-4 text-green-600" fill="currentColor" />
//                   </button>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       ) : (
//         <Card className="border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer w-full">
//           <CardContent className="p-4 flex items-center justify-center h-32">
//             <Button variant="ghost" className="flex items-center" onClick={createDisplayCampaign}>
//               <span className="mr-2">+ Create campaign</span>
//             </Button>
//           </CardContent>
//         </Card>
//       )}

//       {/* Campaign Details Modal */}
//       {selectedCampaign && (
//         <CampaignDetailsModal
//           isOpen={!!selectedCampaign}
//           onClose={() => setSelectedCampaign(null)}
//           campaign={selectedCampaign}
//         />
//       )}
//     </div>
//   );
// };

// export default GoogleDisplayAds;




























// components/GoogleDisplayAds.tsx

"use client";
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Clock, ArrowRight, Play, Eye, MousePointer, DollarSign } from 'lucide-react';
import { useGoogleAds } from "@/lib/context/GoogleAdsContext";
import Image from "next/image"
import CampaignDetailsModal from './modals/DisplayModal/CampaignDetailsModal';
import CampaignFlowManager from './modals/DisplayModal/CampaignFlowManager';

// Define TypeScript interface for display campaign data (if not already defined in your context)
interface DisplayCampaign {
  id: string;
  name: string;
  date: string;
  imageUrl: string;
  impressions: string;
  clicks: string;
  conversions: string;
  status: 'active' | 'paused' | 'ended';
  budget?: {
    initial: number;
    consumed: number;
  };
  performanceData?: Array<{
    date: string;
    clicks: number;
    impressions: number;
  }>;
}

const GoogleDisplayAds: React.FC = () => {
  // Use the context to get display campaigns and related functions
  const { displayCampaigns, createDisplayCampaign, isLoading } = useGoogleAds();
  const [selectedCampaign, setSelectedCampaign] = useState<DisplayCampaign | null>(null);
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  
    // Handler for opening the modal flow
    const handleOpenFlow = () => {
      setIsFlowOpen(true);
    };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <Card className="border rounded-lg">
          <CardContent className="p-4 flex items-center justify-center h-32">
            <p>Loading campaigns...</p>
          </CardContent>
        </Card>
      ) : displayCampaigns && displayCampaigns.length > 0 ? (
        displayCampaigns.map((campaign) => (
          <Card key={campaign.id} className="border rounded-lg" onClick={() => setSelectedCampaign(campaign)}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{campaign.name}</h3>
                <button className="text-gray-500">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Clock className="h-4 w-4 mr-1" />
                <span>{campaign.date}</span>
              </div>

              <div className="mt-4">
                {campaign.imageUrl && (
                  <div className="relative rounded-lg overflow-hidden">
                    <Image
                      src={campaign.imageUrl}
                      alt={campaign.name}
                      width={600}
                      height={400}
                      className="w-full h-auto"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="bg-white p-2 rounded-full shadow-md">
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-4 flex items-center">
                    <Eye className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="font-medium">{campaign.impressions}</span>
                  </div>
                  <div className="mr-4 flex items-center">
                    <MousePointer className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="font-medium">{campaign.clicks}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="font-medium">{campaign.conversions}</span>
                  </div>
                </div>
                <button className="p-1 rounded-full bg-green-100">
                  <Play className="h-4 w-4 text-green-600" fill="currentColor" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
          <CardContent className="p-4 flex items-center justify-center h-32">
            <Button variant="ghost" className="flex items-center" onClick={handleOpenFlow}>
              <span className="mr-2">+ Create campaign</span>
            </Button>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" className="w-full border border-gray-300 hover:bg-gray-100 transition-colors" onClick={handleOpenFlow}>
        + Create campaign
      </Button>

      {/* Campaign Flow Manager */}
      <CampaignFlowManager 
        isOpen={isFlowOpen} 
        onClose={() => setIsFlowOpen(false)}
      />

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <CampaignDetailsModal
          isOpen={!!selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          campaign={selectedCampaign}
        />
      )}
    </div>
  );
};

export default GoogleDisplayAds;