// lib/context/GoogleAdsContext.tsx

"use client"
import React, { createContext, useContext, useState, ReactNode } from "react";

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

type Campaign = {
  id: string;
  name: string;
  date?: string;
  status: "active" | "draft" | "completed";
  description?: string;
  imageUrl?: string;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  tasks?: Task[];
};

// Define types for display campaigns
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

// Example display campaigns data
const exampleDisplayCampaigns: DisplayCampaign[] = [
  {
    id: '1',
    name: 'AdAfri-Display 1',
    date: '12 Dec, 2024',
    imageUrl: '/assets/adafri-sample.jpg',
    impressions: '1,245',
    clicks: '87',
    conversions: '24',
    status: 'active'
  },
];

type GoogleAdsContextType = {
  displayCampaigns: DisplayCampaign[];
  searchCampaigns: Campaign[];
  smsCampaigns: Campaign[];
  metaCampaigns: Campaign[];
  addCampaign: (type: string, campaign: Omit<Campaign, "id">) => void;
  updateCampaign: (type: string, id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (type: string, id: string) => void;
  selectedCampaign: Campaign | null;
  setSelectedCampaign: (campaign: Campaign | null) => void;
  createDisplayCampaign: () => void;
  isLoading: boolean;
};

const GoogleAdsContext = createContext<GoogleAdsContextType | undefined>(undefined);

export const useGoogleAds = () => {
  const context = useContext(GoogleAdsContext);
  if (context === undefined) {
    throw new Error("useGoogleAds must be used within a GoogleAdsProvider");
  }
  return context;
};

interface GoogleAdsProviderProps {
  children: ReactNode;
}

export const GoogleAdsProvider: React.FC<GoogleAdsProviderProps> = ({ children }) => {
  // Add isLoading state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Change this to use the DisplayCampaign type and initialize with example data
  const [displayCampaigns, setDisplayCampaigns] = useState<DisplayCampaign[]>(exampleDisplayCampaigns);
  const [searchCampaigns, setSearchCampaigns] = useState<Campaign[]>([]);
  const [smsCampaigns, setSmsCampaigns] = useState<Campaign[]>([]);
  const [metaCampaigns, setMetaCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const generateId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  // Add function to create a new display campaign
  const createDisplayCampaign = () => {
    // Set loading temporarily
    setIsLoading(true);
    
    setTimeout(() => {
      const newCampaign: DisplayCampaign = {
        id: generateId(),
        name: `New Display Campaign ${displayCampaigns.length + 1}`,
        date: new Date().toLocaleDateString('en-GB', { 
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }).replace(/ /g, ' '),
        imageUrl: '/placeholder-ad.jpg',
        impressions: '0',
        clicks: '0',
        conversions: '0',
        status: 'active'
      };
      
      setDisplayCampaigns([...displayCampaigns, newCampaign]);
      setIsLoading(false);
    }, 1000); // Simulate API delay
  };

  const addCampaign = (type: string, campaign: Omit<Campaign, "id">) => {
    const newCampaign = { ...campaign, id: generateId() };
    
    switch (type) {
      case "display":
        // This needs to be updated to handle DisplayCampaign type
        console.warn("Use createDisplayCampaign instead for display campaigns");
        break;
      case "search":
        setSearchCampaigns([...searchCampaigns, newCampaign]);
        break;
      case "sms":
        setSmsCampaigns([...smsCampaigns, newCampaign]);
        break;
      case "meta":
        setMetaCampaigns([...metaCampaigns, newCampaign]);
        break;
      default:
        console.error(`Invalid campaign type: ${type}`);
    }
  };

  const updateCampaign = (type: string, id: string, updates: Partial<Campaign>) => {
    switch (type) {
      case "display":
        // This needs to be updated to handle DisplayCampaign type
        setDisplayCampaigns(
          displayCampaigns.map((campaign) =>
            campaign.id === id ? { ...campaign, ...updates as any } : campaign
          )
        );
        break;
      case "search":
        setSearchCampaigns(
          searchCampaigns.map((campaign) =>
            campaign.id === id ? { ...campaign, ...updates } : campaign
          )
        );
        break;
      case "sms":
        setSmsCampaigns(
          smsCampaigns.map((campaign) =>
            campaign.id === id ? { ...campaign, ...updates } : campaign
          )
        );
        break;
      case "meta":
        setMetaCampaigns(
          metaCampaigns.map((campaign) =>
            campaign.id === id ? { ...campaign, ...updates } : campaign
          )
        );
        break;
      default:
        console.error(`Invalid campaign type: ${type}`);
    }
    
    // Update selectedCampaign if it's the one being modified
    if (selectedCampaign && selectedCampaign.id === id) {
      setSelectedCampaign({ ...selectedCampaign, ...updates });
    }
  };

  const deleteCampaign = (type: string, id: string) => {
    switch (type) {
      case "display":
        setDisplayCampaigns(displayCampaigns.filter((campaign) => campaign.id !== id));
        break;
      case "search":
        setSearchCampaigns(searchCampaigns.filter((campaign) => campaign.id !== id));
        break;
      case "sms":
        setSmsCampaigns(smsCampaigns.filter((campaign) => campaign.id !== id));
        break;
      case "meta":
        setMetaCampaigns(metaCampaigns.filter((campaign) => campaign.id !== id));
        break;
      default:
        console.error(`Invalid campaign type: ${type}`);
    }
    
    // Clear selectedCampaign if it's the one being deleted
    if (selectedCampaign && selectedCampaign.id === id) {
      setSelectedCampaign(null);
    }
  };

  const value = {
    displayCampaigns,
    searchCampaigns,
    smsCampaigns,
    metaCampaigns,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    selectedCampaign,
    setSelectedCampaign,
    createDisplayCampaign,
    isLoading
  };

  return (
    <GoogleAdsContext.Provider value={value}>
      {children}
    </GoogleAdsContext.Provider>
  );
};
























// import React, { createContext, useContext, useState, ReactNode } from "react";

// type AdCampaign = {
//   id: string;
//   name: string;
//   budget: number;
//   status: "active" | "paused" | "completed";
//   performance: {
//     clicks: number;
//     impressions: number;
//     ctr: number;
//     conversions: number;
//   };
// };

// type GoogleAdsContextType = {
//   campaigns: AdCampaign[];
//   addCampaign: (campaign: Omit<AdCampaign, "id">) => void;
//   updateCampaign: (id: string, updates: Partial<AdCampaign>) => void;
//   deleteCampaign: (id: string) => void;
//   selectedCampaign: AdCampaign | null;
//   setSelectedCampaign: (campaign: AdCampaign | null) => void;
// };

// const GoogleAdsContext = createContext<GoogleAdsContextType | undefined>(undefined);

// export const useGoogleAds = () => {
//   const context = useContext(GoogleAdsContext);
//   if (context === undefined) {
//     throw new Error("useGoogleAds must be used within a GoogleAdsProvider");
//   }
//   return context;
// };

// export const GoogleAdsProvider = ({ children }: { children: ReactNode }) => {
//   const [campaigns, setCampaigns] = useState<AdCampaign[]>([
//     {
//       id: "1",
//       name: "Summer Promotion",
//       budget: 500,
//       status: "active",
//       performance: {
//         clicks: 1240,
//         impressions: 24500,
//         ctr: 5.06,
//         conversions: 87
//       }
//     },
//     {
//       id: "2",
//       name: "Holiday Season",
//       budget: 1000,
//       status: "paused",
//       performance: {
//         clicks: 3210,
//         impressions: 45700,
//         ctr: 7.02,
//         conversions: 165
//       }
//     }
//   ]);
  
//   const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);

//   const addCampaign = (campaign: Omit<AdCampaign, "id">) => {
//     const newCampaign = {
//       ...campaign,
//       id: Date.now().toString()
//     };
//     setCampaigns([...campaigns, newCampaign]);
//   };

//   const updateCampaign = (id: string, updates: Partial<AdCampaign>) => {
//     setCampaigns(
//       campaigns.map(campaign => 
//         campaign.id === id ? { ...campaign, ...updates } : campaign
//       )
//     );
//   };

//   const deleteCampaign = (id: string) => {
//     setCampaigns(campaigns.filter(campaign => campaign.id !== id));
//   };

//   return (
//     <GoogleAdsContext.Provider 
//       value={{ 
//         campaigns, 
//         addCampaign, 
//         updateCampaign, 
//         deleteCampaign,
//         selectedCampaign,
//         setSelectedCampaign
//       }}
//     >
//       {children}
//     </GoogleAdsContext.Provider>
//   );
// };