import React from 'react';
import Image from 'next/image';

export const StatisticsSection: React.FC = () => {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">STATISTICS</h3>
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <div className="flex justify-center items-center">
          <Image
            src="/assets/Statistics-image.png"
            alt="No statistics yet"
            width={200}
            height={200}
          />
        </div>
        <p className="text-lg font-medium mt-2">No statistics yet !</p>
      </div>
    </div>
  );
};