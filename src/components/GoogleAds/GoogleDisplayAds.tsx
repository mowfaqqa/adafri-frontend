// components/GoogleDisplayAds.tsx

"use client";
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Clock, ArrowRight, Play, Eye, MousePointer, DollarSign } from 'lucide-react';
import { useGoogleAds } from "@/lib/context/GoogleAdsContext";
import Image from "next/image"
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
}

const GoogleDisplayAds: React.FC = () => {
  // Use the context to get display campaigns and related functions
  const { displayCampaigns, createDisplayCampaign, isLoading } = useGoogleAds();

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
          <Card key={campaign.id} className="border rounded-lg">
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
            <Button variant="ghost" className="flex items-center" onClick={createDisplayCampaign}>
              <span className="mr-2">+ Create campaign</span>
            </Button>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" className="w-full" onClick={createDisplayCampaign}>
        + Create campaign
      </Button>
    </div>
  );
};

export default GoogleDisplayAds;