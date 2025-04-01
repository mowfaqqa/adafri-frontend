import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import GoogleAdsOverview from "@/components/GoogleAds/GoogleAdsOverview";
import { GoogleAdsProvider } from "@/lib/context/GoogleAdsContext";
import React from "react";


const GoogleAds = () => {
  return (
    <ProtectedRoute>
      <GoogleAdsProvider>
        <GoogleAdsOverview />
      </GoogleAdsProvider>
    </ProtectedRoute>
  );
};

export default GoogleAds;