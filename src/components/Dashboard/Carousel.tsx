/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { ChevronLeft, ChevronRight } from "lucide-react";
import FeatureCard from "./FeatureCard";
import { useRef, useState } from "react";
import { Feature } from "@/lib/interfaces/Dashboard/types";

// Animation constants
const TRANSITION_DURATION = 300;
const CARD_GAP = 24;

const Carousel: React.FC<{ features: Feature[] }> = ({ features }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = features.length;
  // const visibleSlides = 3;

  const next = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev: any) => (prev + 1) % totalSlides);
    setTimeout(() => setIsAnimating(false), TRANSITION_DURATION);
  };

  const prev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev: any) => (prev - 1 + totalSlides) % totalSlides);
    setTimeout(() => setIsAnimating(false), TRANSITION_DURATION);
  };

  // Prepare items for infinite scroll
  const items = [...features, ...features, ...features];
  const offset = currentIndex * -(288 + CARD_GAP); // 288px is card width + padding

  return (
    <div className="relative overflow-hidden">
      <div
        ref={containerRef}
        className="flex transition-transform duration-300 animated"
        style={{
          transform: `translateX(${offset}px)`,
        }}
      >
        {items.map((feature, index) => (
          <FeatureCard
            key={`${feature.id}-${index}`}
            feature={feature}
            className="flex-shrink-0 px-3 m-3"
          />
        ))}
      </div>

      <button
        onClick={prev}
        className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-200"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={next}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-200"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Carousel;
