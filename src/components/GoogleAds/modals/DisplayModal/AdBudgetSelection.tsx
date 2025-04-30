// components/AdBudgetSelection.tsx

"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdBudgetSelectionProps {
    isOpen: boolean;
    onClose: () => void;
    onPrevious: () => void;
    onNext: (budgetData: BidBudgetData) => void;
}

interface BidBudgetData  {
    bidType: 'CPM' | 'CPC';
    budget: number;
    impressions: number;
}

// Helper function to calculate impressions based on budget
const calculateImpressions = (budget: number): number => {
    // This is a simplified calculation - adjust based on your actual metrics
    const impressionRate = 8700; // Impressions per $1
    return Math.round(budget * impressionRate / 1000) / 10; // Convert to millions with 1 decimal place
};

// Helper function to determine color range for slider
const getSliderBackgroundStyle = (value: number): string => {
    const redStop = Math.min(200 / value * 100, 100);
    const yellowStop = Math.min(500 / value * 100, 100);

    return `linear-gradient(to right, 
    red 0%, red ${redStop}%, 
    #FFCC00 ${redStop}%, #FFCC00 ${yellowStop}%, 
    green ${yellowStop}%, green 100%)`;
};

const AdBudgetSelection: React.FC<AdBudgetSelectionProps> = ({
    isOpen,
    onClose,
    onPrevious,
    onNext,
}) => {
    const [bidType, setBidType] = useState<'CPM' | 'CPC'>('CPM');
    const [budget, setBudget] = useState<number>(700);
    const [impressions, setImpressions] = useState<number>(6.1);
    const [sliderBackground, setSliderBackground] = useState<string>('');

    useEffect(() => {
        // Update impressions when budget changes
        setImpressions(calculateImpressions(budget));

        // Update slider background based on budget
        setSliderBackground(getSliderBackgroundStyle(budget));
    }, [budget]);

    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value) || 0;
        setBudget(value);
    };

    const handleSubmit = () => {
        const budgetData: BidBudgetData = {
            bidType,
            budget,
            impressions
        };
        onNext(budgetData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">Display campaign</DialogTitle>
                    <div className="mt-2 w-full bg-gray-200 h-2 rounded-full">
                        <div className="bg-teal-500 h-2 rounded-full w-5/6"></div>
                    </div>
                </DialogHeader>

                <div className="py-4">
                    <h2 className="text-xl font-semibold mb-6">How much do you want to spend on your ad?</h2>

                    <div className="space-y-6">
                        <div>
                            <p className="font-medium mb-3">Choose your bid</p>
                            <div className="flex space-x-3">
                                <Button
                                    onClick={() => setBidType('CPM')}
                                    className={`rounded-full px-6 ${bidType === 'CPM'
                                        ? 'bg-teal-500 text-white'
                                        : 'bg-gray-600 text-gray-800'}`}
                                >
                                    CPM
                                </Button>
                                <Button
                                    onClick={() => setBidType('CPC')}
                                    className={`rounded-full px-6 ${bidType === 'CPC'
                                        ? 'bg-teal-500 text-white'
                                        : 'bg-gray-200 text-gray-800'}`}
                                >
                                    CPC
                                </Button>
                            </div>
                        </div>

                        <div>
                            <p className="font-medium mb-3">Choose your budget</p>
                            <div className="flex items-center space-x-3 mb-2">
                                <span className="text-xl">$</span>
                                <Input
                                    type="number"
                                    value={budget}
                                    onChange={handleBudgetChange}
                                    className="text-xl font-medium"
                                    min={1}
                                />
                            </div>

                            <div className="mt-6 mb-2">
                                {/* Custom styled range slider */}
                                <div className="relative h-2 rounded-full overflow-hidden mb-1">
                                    {/* Colored background track */}
                                    <div
                                        className="absolute inset-0 z-0"
                                        style={{ background: sliderBackground }}
                                    ></div>

                                    {/* Active position indicator */}
                                    <div
                                        className="absolute h-full bg-blue-900 rounded-full z-10"
                                        style={{
                                            width: '8px',
                                            left: `calc(${Math.min((budget / 1000) * 100, 100)}% - 4px)`,
                                        }}
                                    ></div>
                                </div>

                                <div className="flex justify-end">
                                    <span className="text-gray-500">{impressions.toFixed(1)} M Impressions</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        onClick={onPrevious}
                        className="text-gray-700"
                    >
                        previous
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="bg-teal-500 hover:bg-teal-600 text-white px-8"
                    >
                        Import images
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AdBudgetSelection;