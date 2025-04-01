"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface DisplayCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (campaignData: {
    goal: string;
    name: string;
    startDate: string;
    endDate: string;
  }) => void;
  initialData?: {
    goal: string;
    name: string;
    startDate: string;
    endDate: string;
  };
}

const DisplayCampaignModal: React.FC<DisplayCampaignModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [campaignGoal, setCampaignGoal] = useState<string>(initialData?.goal || "");
  const [campaignName, setCampaignName] = useState<string>(initialData?.name || "");
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [startDateInput, setStartDateInput] = useState<string>("");
  const [endDateInput, setEndDateInput] = useState<string>("");
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);

  // Set initial dates if provided
  useEffect(() => {
    if (initialData?.startDate) {
      setStartDateInput(initialData.startDate);
      try {
        const startDate = parse(initialData.startDate, 'yyyy-MM-dd', new Date());
        if (isValid(startDate)) {
          setDate(prev => ({ ...prev, from: startDate }));
        }
      } catch (error) {
        console.error("Invalid start date format:", error);
      }
    }

    if (initialData?.endDate) {
      setEndDateInput(initialData.endDate);
      try {
        const endDate = parse(initialData.endDate, 'yyyy-MM-dd', new Date());
        if (isValid(endDate)) {
          setDate(prev => ({ ...prev, to: endDate }));
        }
      } catch (error) {
        console.error("Invalid end date format:", error);
      }
    }
  }, [initialData]);

  // Update input fields when calendar selection changes
  useEffect(() => {
    if (date?.from) {
      setStartDateInput(format(date.from, 'yyyy-MM-dd'));
    }
    if (date?.to) {
      setEndDateInput(format(date.to, 'yyyy-MM-dd'));
    }
  }, [date]);

  const handleStartDateChange = (value: string) => {
    setStartDateInput(value);
    try {
      const parsedDate = parse(value, 'yyyy-MM-dd', new Date());
      if (isValid(parsedDate)) {
        setDate(prev => ({ ...prev, from: parsedDate }));
      }
    } catch (error) {
      // Invalid date format, just update the input
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDateInput(value);
    try {
      const parsedDate = parse(value, 'yyyy-MM-dd', new Date());
      if (isValid(parsedDate)) {
        setDate(prev => ({ ...prev, to: parsedDate }));
      }
    } catch (error) {
      // Invalid date format, just update the input
    }
  };

  const handleSubmit = () => {
    onSubmit({
      goal: campaignGoal,
      name: campaignName,
      startDate: startDateInput,
      endDate: endDateInput
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Display campaign</DialogTitle>
          <div className="mt-2 w-full bg-gray-200 h-2 rounded-full">
            <div className="bg-teal-500 h-2 rounded-full w-1/6"></div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-1">
          <div>
            <h3 className="text-lg mb-5">Choose the goal of your campaign</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={campaignGoal === "without a goal" ? "default" : "outline"}
                className="rounded-full text-sm"
                onClick={() => setCampaignGoal("without a goal")}
              >
                without a goal
              </Button>
              <Button
                variant={campaignGoal === "notoriety" ? "default" : "outline"}
                className="rounded-full text-sm"
                onClick={() => setCampaignGoal("notoriety")}
              >
                Notoriety
              </Button>
              <Button
                variant={campaignGoal === "traffic" ? "default" : "outline"}
                className="rounded-full text-sm"
                onClick={() => setCampaignGoal("traffic")}
              >
                Traffic
              </Button>
              <Button
                variant={campaignGoal === "traffic and notoriety" ? "default" : "outline"}
                className="rounded-full text-sm"
                onClick={() => setCampaignGoal("traffic and notoriety")}
              >
                Traffic and notoriety
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Name of the campaign</h3>
            <Input
              placeholder="Enter the name of the campaign"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="bg-gray-100"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Schedule</h3>

            <div className="flex flex-col space-y-3">
              {/* Manual date inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Start Date (YYYY-MM-DD)</label>
                  <Input
                    placeholder="YYYY-MM-DD"
                    value={startDateInput}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">End Date (YYYY-MM-DD)</label>
                  <Input
                    placeholder="YYYY-MM-DD"
                    value={endDateInput}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="bg-gray-100"
                  />
                </div>
              </div>

              {/* Calendar picker */}
              <div className="relative">
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-100",
                        !date && "text-gray-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "MMM dd, yyyy")} - {format(date.to, "MMM dd, yyyy")}
                          </>
                        ) : (
                          format(date.from, "MMM dd, yyyy")
                        )
                      ) : (
                        "Or select dates from calendar"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from}
                      selected={date}
                      onSelect={(newDate) => {
                        setDate(newDate);
                        if (!newDate || (newDate.from && newDate.to)) {
                          setCalendarOpen(false);
                        }
                      }}
                      numberOfMonths={1}
                      className="border rounded-md"
                      footer={
                        <div className="p-3 border-t">
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <div>
                              Start: {date?.from ? format(date.from, "MMM dd, yyyy") : "-"}
                            </div>
                            <div>
                              End: {date?.to ? format(date.to, "MMM dd, yyyy") : "-"}
                            </div>
                          </div>
                        </div>
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            className="bg-gray-800 hover:bg-gray-900 text-white"
            onClick={handleSubmit}
            disabled={!campaignName || !campaignGoal || !startDateInput || !endDateInput}
          >
            Next
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DisplayCampaignModal;