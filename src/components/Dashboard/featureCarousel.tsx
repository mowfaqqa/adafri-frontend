/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { cn } from "@/lib/utils";
import Carousel from "./Carousel";
import { useState } from "react";
import { FeatureCarouselProps } from "@/lib/interfaces/Dashboard/types";

const FeatureCarousel: React.FC<FeatureCarouselProps> = ({
  tabs,
  className,
}) => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className={cn("p-4 bg-white rounded-xl shadow-md relative", className)}>
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1 space-x-2">
          {tabs.map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
                activeTab === tab.id
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {tabs.map((tab: any) => (
        <div
          key={tab.id}
          className={cn(
            "transition-opacity duration-300 bg-gray-100 rounded-xl py-2",
            activeTab === tab.id ? "opacity-100" : "opacity-0 hidden"
          )}
        >
          <Carousel features={tab.features} />
        </div>
      ))}
    </div>
  );
};

export default FeatureCarousel;
