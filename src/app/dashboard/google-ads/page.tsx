import GoogleAdsOverview from "@/components/GoogleAds/GoogleAdsOverview";
import { GoogleAdsProvider } from "@/lib/context/GoogleAdsContext";
import React from "react";


const GoogleAds = () => {
  return (
    <GoogleAdsProvider>
        <GoogleAdsOverview />
    </GoogleAdsProvider>
  );
};

export default GoogleAds;