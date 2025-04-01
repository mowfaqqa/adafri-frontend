"use client";
import React, { useState } from 'react';
import { useGoogleAds } from "@/lib/context/GoogleAdsContext";
import AdBudgetSelection from '../DisplayModal/AdBudgetSelection';
import DisplayCampaignModal from '../DisplayModal/DisplayCampaignModal';
import DisplayCampaignLocation from '../DisplayModal/DisplayCampaignLocation';
import DisplayCampaignAudience from '../DisplayModal/DisplayCampaignAudience';
import SearchAdCreative from './SearchAdCreative';

interface CampaignFlowManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define the steps in the campaign creation flow
// Removed 'creative-upload' and replaced with 'search-ad'
type CampaignStep = 'details' | 'location' | 'audience' | 'budget' | 'search-ad';

// Audience data interface
interface AudienceData {
  gender: string[];
  ageRanges: string[];
  devices: string[];
}

// Budget data interface
interface BudgetData {
  budget: number;
  budgetType: 'daily' | 'lifetime';
}

// Search Ad Creative data
interface SearchAdData {
  title1: string;
  title2: string;
  title3?: string;
  description1: string;
  description2: string;
}

const CampaignSearchManager: React.FC<CampaignFlowManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<CampaignStep>('details');
  const { createDisplayCampaign } = useGoogleAds();
  
  // Campaign data state - removed creative related fields
  const [campaignData, setCampaignData] = useState({
    goal: '',
    name: '',
    startDate: '',
    endDate: '',
    location: '',
    mapCoordinates: null as { lat: number; lng: number } | null,
    gender: [] as string[],
    ageRanges: [] as string[],
    devices: [] as string[],
    budget: 0,
    budgetType: 'daily' as 'daily' | 'lifetime',
    // Search ad specific fields
    title1: '',
    title2: '',
    title3: '',
    description1: '',
    description2: '',
  });

  // Handler for the first step submission
  const handleDetailsSubmit = (details: {
    goal: string;
    name: string;
    startDate: string;
    endDate: string;
  }) => {
    setCampaignData({
      ...campaignData,
      ...details
    });
    setCurrentStep('location');
  };

  // Handler for the location step submission
  const handleLocationSubmit = (locationData: {
    location: string;
    mapCoordinates: { lat: number; lng: number } | null;
  }) => {
    setCampaignData({
      ...campaignData,
      ...locationData
    });
    setCurrentStep('audience');
  };
  
  // Handler for the audience step submission
  const handleAudienceSubmit = (audienceData: AudienceData) => {
    setCampaignData({
      ...campaignData,
      ...audienceData
    });
    setCurrentStep('budget');
  };
  
  // Handler for the budget step submission
  const handleBudgetSubmit = (budgetData: BudgetData) => {
    setCampaignData({
      ...campaignData,
      ...budgetData
    });
    setCurrentStep('search-ad');
  };

  // Handler for the search ad step submission
  const handleSearchAdSubmit = (searchAdData: SearchAdData) => {
    const updatedCampaignData = {
      ...campaignData,
      ...searchAdData
    };
    
    setCampaignData(updatedCampaignData);
    
    // Create the campaign with all collected data
    // createDisplayCampaign(updatedCampaignData);
    // handleClose();
  };

  // Go back to previous step
  const handlePrevious = () => {
    switch (currentStep) {
      case 'location':
        setCurrentStep('details');
        break;
      case 'audience':
        setCurrentStep('location');
        break;
      case 'budget':
        setCurrentStep('audience');
        break;
      case 'search-ad':
        setCurrentStep('budget');
        break;
    }
  };

  // Close and reset the flow
  const handleClose = () => {
    setCurrentStep('details');
    setCampaignData({
      goal: '',
      name: '',
      startDate: '',
      endDate: '',
      location: '',
      mapCoordinates: null,
      gender: [],
      ageRanges: [],
      devices: [],
      budget: 0,
      budgetType: 'daily',
      title1: '',
      title2: '',
      title3: '',
      description1: '',
      description2: '',
    });
    onClose();
  };

  return (
    <>
      {/* First step - Campaign Details */}
      <DisplayCampaignModal
        isOpen={isOpen && currentStep === 'details'}
        onClose={handleClose}
        onSubmit={handleDetailsSubmit}
      />

      {/* Second step - Location Selection */}
      <DisplayCampaignLocation
        isOpen={isOpen && currentStep === 'location'}
        onClose={handleClose}
        onPrevious={handlePrevious}
        onNext={handleLocationSubmit}
      />

      {/* Third step - Audience Targeting */}
      <DisplayCampaignAudience
        isOpen={isOpen && currentStep === 'audience'}
        onClose={handleClose}
        onPrevious={handlePrevious}
        onNext={handleAudienceSubmit}
      />
      
      {/* Fourth step - Budget Selection */}
      <AdBudgetSelection
        isOpen={isOpen && currentStep === 'budget'}
        onClose={handleClose}
        onPrevious={handlePrevious}
        onNext={handleBudgetSubmit}
      />

      {/* Fifth step - Search Ad Creative */}
      <SearchAdCreative
        isOpen={isOpen && currentStep === 'search-ad'}
        onClose={handleClose}
        onPrevious={handlePrevious}
        onNext={handleSearchAdSubmit}
      />
    </>
  );
};

export default CampaignSearchManager;