"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchAdCreativeComponentProps {
    isOpen: boolean;
    onClose: () => void;
    onPrevious: () => void;
    onNext: (data: {
        title1: string;
        title2: string;
        title3?: string;
        description1: string;
        description2: string;
    }) => void;
}

const SearchAdCreative: React.FC<SearchAdCreativeComponentProps> = ({
    isOpen,
    onClose,
    onPrevious,
    onNext,
}) => {
    const [title1, setTitle1] = useState('');
    const [title2, setTitle2] = useState('');
    const [title3, setTitle3] = useState('');
    const [description1, setDescription1] = useState('');
    const [description2, setDescription2] = useState('');

    // Character counters
    const [title1Count, setTitle1Count] = useState(0);
    const [title2Count, setTitle2Count] = useState(0);
    const [title3Count, setTitle3Count] = useState(0);
    const [desc1Count, setDesc1Count] = useState(0);
    const [desc2Count, setDesc2Count] = useState(0);

    // Maximum character limits
    const TITLE_MAX = 30;
    const DESC_MAX = 90;

    // Update character counts when inputs change
    useEffect(() => {
        setTitle1Count(title1.length);
        setTitle2Count(title2.length);
        setTitle3Count(title3.length);
        setDesc1Count(description1.length);
        setDesc2Count(description2.length);
    }, [title1, title2, title3, description1, description2]);

    const handleSubmit = () => {
        // Validate the required fields
        if (!title1 || !title2 || !description1 || !description2) {
            // Handle validation error
            return;
        }

        onNext({
            title1,
            title2,
            title3: title3 || undefined, // Only include title3 if it has content
            description1,
            description2,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Search campaign</DialogTitle>
                    <div className="mt-2 w-full bg-gray-200 h-2 rounded-full">
                        <div className="bg-teal-500 h-2 rounded-full w-full"></div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Titles</h3>
                        <div className="space-y-4">
                            <div>
                                <Input
                                    placeholder="Title 1"
                                    value={title1}
                                    onChange={(e) => setTitle1(e.target.value)}
                                    maxLength={TITLE_MAX}
                                    className="w-full p-2 border rounded"
                                />
                                <div className="text-xs text-gray-500 text-right">
                                    {title1Count}/{TITLE_MAX}
                                </div>
                            </div>

                            <div>
                                <Input
                                    placeholder="Title 2"
                                    value={title2}
                                    onChange={(e) => setTitle2(e.target.value)}
                                    maxLength={TITLE_MAX}
                                    className="w-full p-2 border rounded"
                                />
                                <div className="text-xs text-gray-500 text-right">
                                    {title2Count}/{TITLE_MAX}
                                </div>
                            </div>

                            <div>
                                <Input
                                    placeholder="Title 3"
                                    value={title3}
                                    onChange={(e) => setTitle3(e.target.value)}
                                    maxLength={TITLE_MAX}
                                    className="w-full p-2 border rounded"
                                />
                                <div className="text-xs text-gray-500 text-right">
                                    (optionnal) {title3Count}/{TITLE_MAX}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-3">Descriptions</h3>
                        <div className="space-y-4">
                            <div>
                                <Input
                                    placeholder="Description 1"
                                    value={description1}
                                    onChange={(e) => setDescription1(e.target.value)}
                                    maxLength={DESC_MAX}
                                    className="w-full p-2 border rounded"
                                />
                                <div className="text-xs text-gray-500 text-right mt-1">
                                    {desc1Count}/{DESC_MAX}
                                </div>
                            </div>

                            <div>
                                <Input
                                    placeholder="Description 2"
                                    value={description2}
                                    onChange={(e) => setDescription2(e.target.value)}
                                    maxLength={DESC_MAX}
                                    className="w-full p-2 border rounded"
                                />
                                <div className="text-xs text-gray-500 text-right mt-1">
                                    {desc2Count}/{DESC_MAX}
                                </div>
                            </div>
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
                        variant="default"
                        onClick={handleSubmit}
                    >
                        Campaign review
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SearchAdCreative;