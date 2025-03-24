"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

// Interface for poll options
interface PollOption {
  id: string;
  label: string;
  votes: number;
}

// Component for the poll indicators shown in the welcome banner
export const PollingCard2 = ({ options }: { options: PollOption[] }) => {
  // Calculate total votes
  const totalVotes = options.reduce((sum, option) => sum + option.votes, 0);
  
  // Calculate percentage for each option
  const getPercentage = (votes: number) => {
    return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  };

  // Take top 3 options by votes for display in the banner
  const topOptions = [...options]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 3);

  return (
    <div className="flex flex-wrap gap-4">
      {topOptions.map((option) => (
        <div key={option.id} className="bg-white rounded-lg px-6 py-3 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-teal-500"></div>
          <div>
            <h3 className="text-teal-500 font-medium">{option.label}</h3>
            <p className="text-black font-medium">{getPercentage(option.votes)}%</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Full Poll Card component
export const PollCard = ({
  title,
  options,
  onVote,
  className,
}: {
  title: string;
  options: PollOption[];
  onVote?: (optionId: string) => void;
  className?: string;
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const totalVotes = options.reduce((sum, option) => sum + option.votes, 0);

  const handleVote = (value: string) => {
    setSelectedOption(value);
    if (onVote) {
      onVote(value);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl w-full h-[350px] flex flex-col shadow-md mb-5">
      <h3 className="text-lg font-semibold text-left mb-4">{title}</h3>

      <Card
        className={cn("w-full h-[300px] bg-gray-100 shadow-none p-4 flex flex-col", className)}
      >
        <CardContent className="flex-grow flex flex-col justify-between">
          <RadioGroup
            onValueChange={handleVote}
            value={selectedOption || undefined}
            className="space-y-4 w-full"
          >
            {options.map((option) => {
              const percentage =
                totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

              return (
                <div key={option.id} className="relative w-full">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-sm text-gray-500 min-w-[40px]">
                        {percentage}%
                      </span>
                      <Label
                        htmlFor={option.id}
                        className="font-medium text-sm cursor-pointer flex-grow"
                      >
                        {option.label}
                      </Label>
                    </div>
                    <RadioGroupItem
                      value={option.id}
                      id={option.id}
                      className="h-4 w-4 border-2 border-gray-300"
                    />
                  </div>
                  <div className="h-2 bg-white rounded-lg overflow-hidden w-full mt-2">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
};

// DashboardPollCard component for use within the Dashboard
export const DashboardPollCard = () => {
  const [pollData, setPollData] = useState({
    title: "Vote for the Next Feature",
    options: [
      { id: "e-sign", label: "E-Sign", votes: 50 },
      { id: "image-editor", label: "Image Editor", votes: 70 },
      { id: "ai-calling", label: "AI Calling", votes: 40 },
      { id: "crm", label: "CRM", votes: 30 },
    ],
  });

  const handleVote = (optionId: string) => {
    setPollData((prev) => ({
      ...prev,
      options: prev.options.map((option) =>
        option.id === optionId ? { ...option, votes: option.votes + 1 } : option
      ),
    }));
  };

  return (
    <div className="w-full lg:w-[400px] rounded-xl flex bg-white mx-4 justify-center items-start">
      <PollCard
        title={pollData.title}
        options={pollData.options}
        onVote={handleVote}
      />
    </div>
  );
};

// Export a shared context to maintain poll state between components
export const usePollData = () => {
  const [pollData, setPollData] = useState({
    title: "Vote for the Next Feature",
    options: [
      { id: "e-sign", label: "E-Sign", votes: 50 },
      { id: "image-editor", label: "Image Editor", votes: 70 },
      { id: "ai-calling", label: "AI Calling", votes: 40 },
      { id: "crm", label: "CRM", votes: 30 },
    ],
  });

  const handleVote = (optionId: string) => {
    setPollData((prev) => ({
      ...prev,
      options: prev.options.map((option) =>
        option.id === optionId ? { ...option, votes: option.votes + 1 } : option
      ),
    }));
  };

  return { pollData, handleVote };
};