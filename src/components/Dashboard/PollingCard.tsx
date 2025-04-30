"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface PollOption {
  id: string;
  label: string;
  votes: number;
}

interface PollCardProps {
  title: string;
  options: PollOption[];
  onVote?: (optionId: string) => void;
  className?: string;
}

const PollCard: React.FC<PollCardProps> = ({
  title,
  options,
  onVote,
  className,
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

  {/* Inner Card now fills the available height */}
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

// usage
const DashboardPollCard = () => {
  const [pollData, setPollData] = useState({
    title: "Vote for the Next Feature",
    options: [
      { id: "e-sign", label: "E-Sign", votes: 50 },
      { id: "image-editor", label: "Image Editor", votes: 70 },
      { id: "ai-calling", label: "AI calling", votes: 40 },
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

  // To edit the main card holding the options
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

export default DashboardPollCard;
