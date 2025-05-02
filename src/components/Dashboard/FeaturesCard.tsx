import React from 'react';
import Image from 'next/image';
import { Switch } from "@/components/ui/switch";

interface FeatureCardProps {
  title: string;
  isActive: boolean;
  imageUrl: string;
  subtitle?: string;
  link: string;
  onClick: (link: string, isActive: boolean) => void;
}

export const FeaturesCard: React.FC<FeatureCardProps> = ({ title, isActive, imageUrl, link, onClick }) => {
  const handleClick = () => {
    onClick(link, isActive);
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-100 p-4 transition-all duration-200 ${isActive ? 'cursor-pointer hover:shadow-md' : 'opacity-75'}`}
      onClick={handleClick}
    >
      {/* Top section with toggle */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">{isActive ? "ON" : "OFF"}</span>
        <Switch checked={isActive} />
      </div>

      {/* Center icon */}
      <div className="flex justify-center items-center my-6">
        <Image
          src={imageUrl}
          alt={title}
          width={40}
          height={40}
        />
      </div>

      {/* Title at bottom */}
      <div className="text-center">
        <h4 className="text-sm font-medium text-gray-800">{title}</h4>
      </div>
    </div>
  );
};