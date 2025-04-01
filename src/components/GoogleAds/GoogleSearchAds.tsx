// components/GoogleSearchAds.tsx

"use client";
import React, {useState} from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Clock, CheckCircle2, CalendarClock, Eye, MessageSquare, ThumbsUp } from 'lucide-react';
import { useGoogleAds } from "@/lib/context/GoogleAdsContext";
import CampaignSearchManager from './modals/DisplaySearchModal/CampaignSearchManager';

// Define TypeScript interface for search campaign data
interface SearchCampaign {
  id: string;
  name: string;
  description: string;
  date: string;
  views: string;
  comments: string;
  likes: string;
  status: 'active' | 'paused' | 'ended';
  tasks?: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  assignee?: string;
}

const GoogleSearchAds: React.FC = () => {
  // Use the context to get search campaigns and related functions
  const { searchCampaigns, addCampaign, isLoading } = useGoogleAds();
  const [isFlowOpen, setIsFlowOpen] = useState(false);

  // Handler for opening the modal flow
  const handleOpenFlow = () => {
    setIsFlowOpen(true);
  };

  const createSearchCampaign = () => {
    addCampaign("search", {
      name: `Nuur-Search ${searchCampaigns.length + 1}`,
      description: "Prepare and send a newsletter to the subscriber list announcing the December discounts and promotions.",
      date: "25 Dec, 2024",
      status: "active",
      tasks: [
        { id: "1", title: "Draft email content and subject", completed: true },
        { id: "2", title: "Add promotional visuals", completed: false }
      ],
      assignee: "Nuur"
    });
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <Card className="border rounded-lg">
          <CardContent className="p-4 flex items-center justify-center h-32">
            <p>Loading campaigns...</p>
          </CardContent>
        </Card>
      ) : searchCampaigns && searchCampaigns.length > 0 ? (
        searchCampaigns.map((campaign) => (
          <Card key={campaign.id} className="border rounded-lg">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{campaign.name}</h3>
                <button className="text-gray-500">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-2">
                <p className="text-gray-700">{campaign.description}</p>
              </div>

              <div className="mt-4 space-y-2">
                {campaign.tasks?.map((task) => (
                  <div key={task.id} className="flex items-start">
                    <div className="mr-2 mt-0.5">
                      {task.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="h-4 w-4 border border-gray-300 rounded-full" />
                      )}
                    </div>
                    <p className={`text-sm ${task.completed ? 'text-gray-500' : 'text-gray-700'}`}>
                      {task.title}
                      {task.completed && " (Completed)."}
                    </p>
                  </div>
                ))}
              </div>

              {campaign.assignee && (
                <div className="mt-4">
                  <p className="text-blue-600 text-sm">{campaign.assignee}</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <CalendarClock className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="text-sm text-gray-700">{campaign.date}</span>
                  </div>
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="text-sm text-gray-700">{campaign.views || "04"}</span>
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="text-sm text-gray-700">{campaign.comments || "100"}</span>
                  </div>
                  <div className="flex items-center">
                    <ThumbsUp className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="text-sm text-gray-700">{campaign.likes || "35"}</span>
                  </div>
                </div>
                <button className="p-1 rounded-full bg-green-100">
                  <CheckCircle2 className="h-4 w-4 text-green-600" fill="currentColor" />
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
      <CampaignSearchManager 
        isOpen={isFlowOpen} 
        onClose={() => setIsFlowOpen(false)}
      />
    </div>
  );
};

export default GoogleSearchAds;