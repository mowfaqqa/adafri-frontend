"use client";
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DisplayCampaignAudienceProps {
    isOpen: boolean;
    onClose: () => void;
    onPrevious: () => void;
    onNext: (audienceData: AudienceData) => void;
}

interface AudienceData {
    gender: string[];
    ageRanges: string[];
    devices: string[];
}

const DisplayCampaignAudience: React.FC<DisplayCampaignAudienceProps> = ({
    isOpen,
    onClose,
    onPrevious,
    onNext,
}) => {
    const [audienceData, setAudienceData] = useState<AudienceData>({
        gender: ['All'],
        ageRanges: [],
        devices: ['All'],
    });

    // Handler for gender selection
    const handleGenderSelection = (gender: string) => {
        let updatedGenders: string[];

        if (gender === 'All') {
            updatedGenders = ['All'];
        } else {
            // Remove 'All' if it exists
            const withoutAll = audienceData.gender.filter(g => g !== 'All');

            // Toggle the selected gender
            if (withoutAll.includes(gender)) {
                updatedGenders = withoutAll.filter(g => g !== gender);
                // If nothing is selected, default back to 'All'
                if (updatedGenders.length === 0) {
                    updatedGenders = ['All'];
                }
            } else {
                updatedGenders = [...withoutAll, gender];
            }
        }

        setAudienceData({
            ...audienceData,
            gender: updatedGenders,
        });
    };

    // Handler for age range selection
    const handleAgeSelection = (ageRange: string) => {
        let updatedAges: string[];

        if (audienceData.ageRanges.includes(ageRange)) {
            updatedAges = audienceData.ageRanges.filter(age => age !== ageRange);
        } else {
            updatedAges = [...audienceData.ageRanges, ageRange];
        }

        setAudienceData({
            ...audienceData,
            ageRanges: updatedAges,
        });
    };

    // Handler for device selection
    const handleDeviceSelection = (device: string) => {
        let updatedDevices: string[];

        if (device === 'All') {
            updatedDevices = ['All'];
        } else {
            // Remove 'All' if it exists
            const withoutAll = audienceData.devices.filter(d => d !== 'All');

            // Toggle the selected device
            if (withoutAll.includes(device)) {
                updatedDevices = withoutAll.filter(d => d !== device);
                // If nothing is selected, default back to 'All'
                if (updatedDevices.length === 0) {
                    updatedDevices = ['All'];
                }
            } else {
                updatedDevices = [...withoutAll, device];
            }
        }

        setAudienceData({
            ...audienceData,
            devices: updatedDevices,
        });
    };

    // Handle next button click
    const handleNext = () => {
        onNext(audienceData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Display campaign</DialogTitle>
                    <div className="mt-2 w-full bg-gray-200 h-2 rounded-full">
                        <div className="bg-teal-500 h-2 rounded-full w-3/6"></div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-1">
                    <div>
                        <h3 className="text-lg mb-1">Who can see your Advertising</h3>
                    </div>

                    <div>
                        <h3 className="text-gray-500 mb-2">Gender</h3>
                        <div className="flex flex-wrap gap-2">
                            {['All', 'Men', 'Women'].map((gender) => (
                                <Button
                                    key={gender}
                                    onClick={() => handleGenderSelection(gender)}
                                    variant={audienceData.gender.includes(gender) ? "default" : "outline"}
                                    className={audienceData.gender.includes(gender) ? "bg-gray-200 text-gray-900 hover:bg-gray-300 border" : "border"}
                                >
                                    {gender}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-gray-500 mb-2">Age</h3>
                        <div className="flex flex-wrap gap-2">
                            {['18-24 years', '25-34 years', '35-44 years', '45-54 years', '+55 years'].map((age) => (
                                <Button
                                    key={age}
                                    onClick={() => handleAgeSelection(age)}
                                    variant={audienceData.ageRanges.includes(age) ? "default" : "outline"}
                                    className={audienceData.ageRanges.includes(age) ? "bg-gray-200 text-gray-900 hover:bg-gray-300 border" : "border"}
                                >
                                    {age}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-gray-500 mb-2">Devices</h3>
                        <div className="flex flex-wrap gap-2">
                            {['All', 'Laptop', 'Phones', 'Tablets'].map((device) => (
                                <Button
                                    key={device}
                                    onClick={() => handleDeviceSelection(device)}
                                    variant={audienceData.devices.includes(device) ? "default" : "outline"}
                                    className={audienceData.devices.includes(device) ? "bg-gray-200 text-gray-900 hover:bg-gray-300 border" : "border"}
                                >
                                    {device}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-between">
                    <Button
                        onClick={onPrevious}
                        variant="outline"
                        className="px-6 py-2 border border-gray-300"
                    >
                        previous
                    </Button>
                    <Button
                        onClick={handleNext}
                        className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white"
                    >
                        Next
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DisplayCampaignAudience;