"use client";
import React, { useState } from 'react';
import DisplayCampaignModal from './DisplayCampaignModal';
import DisplayCampaignLocation from './DisplayCampaignLocation';
import DisplayCampaignAudience from './DisplayCampaignAudience';
import DisplayCampaignCreatives from './DisplayCampaignCreatives';
import CampaignCreativeUpload from './CampaignCreativeUpload';
import { useGoogleAds } from "@/lib/context/GoogleAdsContext";
import AdBudgetSelection from './AdBudgetSelection';

interface CampaignFlowManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define the steps in the campaign creation flow
type CampaignStep = 'details' | 'location' | 'audience' | 'creatives' | 'budget' | 'creative-upload';

// Audience data interface
interface AudienceData {
  gender: string[];
  ageRanges: string[];
  devices: string[];
}

// Creative data interface
interface CreativeData {
  displayType: 'websites' | 'behaviours';
  websites?: string[];
  behaviours?: string[];
}

// Creative upload data interface
interface CreativeUploadData {
  withCreatives: boolean;
  imageFile?: File | null;
  adTitle?: string;
  adDescription?: string;
}

// Budget data interface
interface BudgetData {
  budget: number;
  budgetType: 'daily' | 'lifetime';
}

const CampaignFlowManager: React.FC<CampaignFlowManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<CampaignStep>('details');
  const { createDisplayCampaign } = useGoogleAds();
  
  // Campaign data state
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
    displayType: 'websites' as 'websites' | 'behaviours',
    websites: [] as string[],
    behaviours: [] as string[],
    withCreatives: true,
    imageFile: null as File | null,
    adTitle: '',
    adDescription: '',
    budget: 0,
    budgetType: 'daily' as 'daily' | 'lifetime',
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
    setCurrentStep('creatives');
  };
  
  // Handler for the creatives step submission
  const handleCreativesSubmit = (creativeData: CreativeData) => {
    setCampaignData({
      ...campaignData,
      ...creativeData
    });
    setCurrentStep('budget');
  };
  
  // Handler for the budget step submission
  const handleBudgetSubmit = (budgetData: BudgetData) => {
    setCampaignData({
      ...campaignData,
      ...budgetData
    });
    setCurrentStep('creative-upload');
  };

  // Handler for the creative upload step submission
  const handleCreativeUploadSubmit = (creativeUploadData: CreativeUploadData) => {
    const updatedCampaignData = {
      ...campaignData,
      ...creativeUploadData
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
      case 'creatives':
        setCurrentStep('audience');
        break;
      case 'budget':
        setCurrentStep('creatives');
        break;
      case 'creative-upload':
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
      displayType: 'websites',
      websites: [],
      behaviours: [],
      withCreatives: true,
      imageFile: null,
      adTitle: '',
      adDescription: '',
      budget: 0,
      budgetType: 'daily',
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
      
      {/* Fourth step - Creative Targeting */}
      <DisplayCampaignCreatives
        isOpen={isOpen && currentStep === 'creatives'}
        onClose={handleClose}
        onPrevious={handlePrevious}
        onNext={handleCreativesSubmit}
      />
      
      {/* Fifth step - Budget Selection */}
      <AdBudgetSelection
        isOpen={isOpen && currentStep === 'budget'}
        onClose={handleClose}
        onPrevious={handlePrevious}
        onNext={handleBudgetSubmit}
      />

      {/* Sixth step - Creative Upload */}
      <CampaignCreativeUpload
        isOpen={isOpen && currentStep === 'creative-upload'}
        onClose={handleClose}
        onPrevious={handlePrevious}
        onNext={handleCreativeUploadSubmit}
      />
    </>
  );
};

export default CampaignFlowManager;