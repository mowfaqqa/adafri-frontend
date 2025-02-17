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
    <div className={cn("w-full max-w-[810px] px-5 mx-2 bg-white", className)}>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold">Features</h2>
        <div className="flex gap-8">
          {tabs.map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "py-2 px-1 text-lg font-medium relative",
                activeTab === tab.id
                  ? "text-emerald-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
              )}
            </button>
          ))}
        </div>
        <div className="w-24" /> {/* Spacer for alignment */}
      </div>

      {tabs.map((tab: any) => (
        <div
          key={tab.id}
          className={cn(
            "transition-opacity duration-300",
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
