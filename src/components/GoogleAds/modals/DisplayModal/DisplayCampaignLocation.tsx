// components/DisplayCampaignLocation.tsx

"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface DisplayCampaignLocationProps {
    isOpen: boolean;
    onClose: () => void;
    onPrevious: () => void;
    onNext: (locationData: {
        location: string;
        mapCoordinates: { lat: number; lng: number } | null;
    }) => void;
}

const DisplayCampaignLocation: React.FC<DisplayCampaignLocationProps> = ({
    isOpen,
    onClose,
    onPrevious,
    onNext,
}) => {
    const [location, setLocation] = useState<string>("");
    // In a real implementation, these would be set based on map selection
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

    // For demonstration purposes - this would be set when a user selects a point on the map
    const handleMapClick = () => {
        // Example coordinates for Dakar, Senegal
        setCoordinates({ lat: 14.7167, lng: -17.4677 });
    };

    const handleSubmit = () => {
        onNext({
            location,
            mapCoordinates: coordinates
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Display campaign</DialogTitle>
                    <div className="mt-2 w-full bg-gray-200 h-2 rounded-full">
                        <div className="bg-teal-500 h-2 rounded-full w-2/6"></div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-1">
                    <div>
                        <h3 className="text-lg mb-2">Where do you want your ad to display?</h3>
                        <Input
                            placeholder="Enter a city, country, department"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="bg-gray-100 mb-4"
                        />

                        {/* Map container */}
                        <div
                            className="w-full h-60 bg-gray-200 rounded-md overflow-hidden relative cursor-pointer"
                            onClick={handleMapClick}
                        >
                            {/* This would be replaced with an actual map component like Google Maps or Leaflet */}
                            <img
                                src="/api/placeholder/500/240"
                                alt="Map"
                                className="w-full h-full object-cover"
                            />

                            {/* If you had actual map data, you'd render it here */}
                            {/* For now, showing a placeholder image */}

                            {coordinates && (
                                <div className="absolute bottom-2 right-2 bg-white p-2 rounded-md text-xs shadow-md">
                                    Selected: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between mt-6">
                    <Button
                        variant="outline"
                        onClick={onPrevious}
                    >
                        previous
                    </Button>
                    <Button
                        className="bg-gray-800 hover:bg-gray-900 text-white"
                        onClick={handleSubmit}
                    >
                        next
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DisplayCampaignLocation;