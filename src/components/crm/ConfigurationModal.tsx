"use client";
import { useState } from 'react';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivitySelect: (activity: string) => void;
}

export function ConfigurationModal({ isOpen, onClose, onActivitySelect }: ConfigurationModalProps) {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  if (!isOpen) return null;

  const activities = [
    { id: 'B2C', label: 'B2C' },
    { id: 'B2B', label: 'B2B' },
    { id: 'B2B2C', label: 'B2B2C' },
    { id: 'B2G', label: 'B2G' }
  ];

  const handleActivityClick = (activityId: string) => {
    setSelectedActivity(activityId);
  };

  const handleContinue = () => {
    if (selectedActivity) {
      onActivitySelect(selectedActivity);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
        {/* Progress indicator */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-2">
            <div className="w-8 h-1 bg-blue-500 rounded"></div>
            <div className="w-8 h-1 bg-gray-200 rounded"></div>
            <div className="w-8 h-1 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Let's configure your dashboard
        </h2>

        {/* Question */}
        <h3 className="text-lg font-medium text-gray-900 mb-6 text-center">
          What type of activity are you into?
        </h3>

        {/* Activity buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {activities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => handleActivityClick(activity.id)}
              className={`
                relative px-6 py-4 rounded-lg border-2 transition-all duration-200 font-medium
                ${selectedActivity === activity.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                }
              `}
            >
              {activity.label}
              {selectedActivity === activity.id && (
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!selectedActivity}
          className={`
            w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200
            ${selectedActivity
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          Continue
        </button>

        {/* Dimensions indicator */}
        {/* <div className="text-center text-xs text-gray-400 mt-4">
          935 × 455
        </div> */}
      </div>
    </div>
  );
}