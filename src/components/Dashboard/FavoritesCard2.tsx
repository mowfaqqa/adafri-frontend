'use client';

import React, { useState } from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import FavoritesCardItem from './FavoritesCardItem';

interface Feature {
    id: string;
    title: string;
    subtitle: string;
    imageUrl: string;
    link: string;
}

interface FavoriteOption {
    label: string;
    href: string;
    icon: string;
}

const initialFavorites: Feature[] = [
    {
        id: "online-message",
        title: "Online Message",
        subtitle: "Connect with customers",
        imageUrl: "/icons/online-meeting.png",
        link: "/dashboard/online-message",
    },
];

// Flatten newFavorite structure for easier use in the modal
const favoriteOptions: FavoriteOption[] = [
    // First column
    { label: "Mass Mailing", href: "/dashboard/mass-mailing", icon: "/icons/mass-mailing.png" },
    { label: "CRM", href: "/dashboard/social", icon: "/icons/crm.png" },
    { label: "Social Listening", href: "/dashboard/analytics", icon: "/icons/social.png" },
    { label: "Post Publisher", href: "/dashboard/analytics", icon: "/icons/post-publisher.png" },
    { label: "AI Calling", href: "/dashboard/analytics", icon: "/icons/ai-calling.png" },
    { label: "SMS", href: "/dashboard/analytics", icon: "/icons/sms.png" },
    // Second column
    { label: "Google Ads", href: "/dashboard/campaigns", icon: "/icons/google-ads.png" },
    { label: "Meta", href: "/dashboard/builder", icon: "/icons/meta.png" },
    { label: "Twitter", href: "/dashboard/performance", icon: "/icons/twitter.png" },
    { label: "TikTok", href: "/dashboard/performance", icon: "/icons/tiktok.png" },
    { label: "LinkedIn", href: "/dashboard/performance", icon: "/icons/linkedin.png" },
    { label: "Spotify", href: "/dashboard/performance", icon: "/icons/spotify.png" },
    // Third column
    { label: "Website Builder", href: "/dashboard/campaigns", icon: "/icons/website-builder.png" },
    { label: "Internal Message", href: "/dashboard/messaging", icon: "/icons/internal-message.png" },
    { label: "Online Meeting", href: "/dashboard/performance", icon: "/icons/online-meeting.png" },
    { label: "E-sign", href: "/dashboard/performance", icon: "/icons/e-sign.png" },
    { label: "Task Manager", href: "/dashboard/task-manager", icon: "/icons/task-manager.png" },
    { label: "Image Editor", href: "/dashboard/performance", icon: "/icons/image-editor.png" },
];

interface FavoritesCard2Props {
    className?: string;
}

const FavoritesCard2: React.FC<FavoritesCard2Props> = ({ className = "" }) => {
    const [favorites, setFavorites] = useState<Feature[]>(initialFavorites);
    const [showModal, setShowModal] = useState<boolean>(false);

    // Function to add a new favorite card
    const addNewFavorite = () => {
        setShowModal(true);
    };

    // Function to handle selection of a favorite option
    const handleSelectFavorite = (option: FavoriteOption) => {
        const newFavorite: Feature = {
            id: option.label.toLowerCase().replace(/\s+/g, '-'),
            title: option.label,
            subtitle: `Added from favorites`,
            imageUrl: option.icon,
            link: option.href,
        };

        // Only add if we have less than 4 favorites
        if (favorites.length < 4) {
            setFavorites([...favorites, newFavorite]);
        }
        setShowModal(false);
    };

    // Function to remove a favorite
    const removeFavorite = (idToRemove: string) => {
        setFavorites(favorites.filter(fav => fav.id !== idToRemove));
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-md relative">
            <CardHeader className="pb-0">
                <CardTitle className="text-xl">Favourites</CardTitle>
            </CardHeader>

            <div className="flex flex-wrap justify-center gap-6 mt-4">
                {favorites.map((feature, index) => (
                    <div key={`${feature.id}-${index}`} className="relative flex-shrink-0">
                        <FavoritesCardItem
                            feature={feature}
                            className="flex-shrink-0"
                        />
                        {/* Remove button */}
                        <button
                            onClick={() => removeFavorite(feature.id)}
                            className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full w-6 h-6 hidden group-hover:flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                ))}

                {favorites.length < 4 && (
                    <div className="flex-shrink-0 cursor-pointer" onClick={addNewFavorite}>
                        <div className="bg-gray-50 w-[180px] h-[250px] flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="40"
                                height="40"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="gray"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal for selecting new favorites */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Select a Favorite</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="overflow-y-auto pr-2 -mr-2 flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {favoriteOptions.map((option, index) => (
                                    <div
                                        key={index}
                                        className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSelectFavorite(option)}
                                    >
                                        <div className="w-16 h-16 flex items-center justify-center mb-2">
                                            <img
                                                src={option.icon}
                                                alt={option.label}
                                                className="max-w-full max-h-full object-contain"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = "/icons/default.png";
                                                }}
                                            />
                                        </div>
                                        <span className="text-center font-medium">{option.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FavoritesCard2;