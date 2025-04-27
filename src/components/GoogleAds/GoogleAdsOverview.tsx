// components/GoogleAds/GoogleAdsOverview.tsx

"use client";
import React from "react";
import { useGoogleAds } from "@/lib/context/GoogleAdsContext";
import GoogleDisplayAds from "./GoogleDisplayAds";
import GoogleSearchAds from "./GoogleSearchAds";
import { PlusIcon } from "lucide-react";
import BulkSMS from "./BulkSMS";
import MassMailing from "./MassMailing";

const GoogleAdsOverview = () => {
  return (
    <div className="mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Advertising</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Google Display Ad Section */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">Google Display Ad</h2>
            <button className="rounded-full p-1 hover:bg-gray-100">
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
          <GoogleDisplayAds />
        </div>

        {/* Google Search Ad Section */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">Google Search Ad</h2>
            <button className="rounded-full p-1 hover:bg-gray-100">
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
          <GoogleSearchAds />
        </div>

        {/* Bulk SMS Section */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">Bulk SMS</h2>
            <button className="rounded-full p-1 hover:bg-gray-100">
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
          <BulkSMS />
        </div>

        {/* Meta Ads Section */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">Mass Mailing</h2>
            <button className="rounded-full p-1 hover:bg-gray-100">
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
          <MassMailing />
        </div>
      </div>
    </div>
  );
};

export default GoogleAdsOverview;