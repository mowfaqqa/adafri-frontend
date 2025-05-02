import React from 'react';
import { FeaturesCard } from './FeaturesCard';

interface Feature {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
}

interface UnlockedFeaturesProps {
  activeTabFeatures: Feature[];
  onFeatureClick: (link: string, isActive: boolean) => void;
}

export const UnlockedFeatures: React.FC<UnlockedFeaturesProps> = ({ activeTabFeatures, onFeatureClick }) => {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">UNLOCKED FEATURES</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {activeTabFeatures.map((feature) => (
          <FeaturesCard
            key={feature.id}
            title={feature.title}
            isActive={feature.isActive}
            imageUrl={feature.imageUrl}
            subtitle={feature.subtitle}
            link={feature.link}
            onClick={onFeatureClick}
          />
        ))}
        {activeTabFeatures.length === 0 && (
          <div className="col-span-full text-center p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No features available for the selected tab</p>
          </div>
        )}
      </div>
    </div>
  );
};