"use client";
import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

interface SetupProps {
  onSubmit: (setupData: any) => void;
  initialData: any;
  setCurrentTab: (tab: string) => void;
}

const Setup: React.FC<SetupProps> = ({
  onSubmit,
  initialData,
  setCurrentTab
}) => {
  // Existing state
  const [sendOption, setSendOption] = useState<'now' | 'schedule'>(initialData.sendOption || 'now');
  const [scheduleDate, setScheduleDate] = useState(initialData.scheduleDate || '');
  const [scheduleTime, setScheduleTime] = useState(initialData.scheduleTime || '');
  
  // New state from the image
  const [campaignName, setCampaignName] = useState(initialData.name || '');
  const [emailSubject, setEmailSubject] = useState(initialData.subject || '');
  const [fromName, setFromName] = useState(initialData.fromName || '');
  const [fromEmail, setFromEmail] = useState(initialData.fromEmail || '');
  const [replyToEmail, setReplyToEmail] = useState(initialData.replyToEmail || '');
  const [trackOpens, setTrackOpens] = useState(initialData.trackOpens || false);
  const [trackClicks, setTrackClicks] = useState(initialData.trackClicks || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const setupData = {
      name: campaignName,
      subject: emailSubject,
      fromName,
      fromEmail,
      replyToEmail,
      trackOpens,
      trackClicks,
      sendOption,
      scheduleDate,
      scheduleTime,
    };
    
    onSubmit(setupData);
    setCurrentTab('template');
  };

  const navigateBack = () => {
    setCurrentTab('recipients');
  };

  return (
    <div className="flex flex-col space-y-6 overflow-hidden">
      <div className="space-y-2">
        <h3 className="text-xl font-medium">Campaign Setup</h3>
        <p className="text-teal-600">Configure your email campaign details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block font-medium">Name of Campaign</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Enter your campaign name"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          
          <div className="space-y-4">
            <label className="block font-medium">Email Subject</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Enter your email subject"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
        </div>

        {/* Sender Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block font-medium">From Name</label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          
          <div className="space-y-4">
            <label className="block font-medium">From Email</label>
            <input
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="block font-medium">Reply-To Email</label>
          <input
            type="email"
            value={replyToEmail}
            onChange={(e) => setReplyToEmail(e.target.value)}
            placeholder="Enter your from email"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Tracking Options */}
        <div className="space-y-4">
          <label className="block font-medium">Tracking Options</label>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="track-opens"
                checked={trackOpens}
                onChange={(e) => setTrackOpens(e.target.checked)}
                className="h-4 w-4 text-teal-600 rounded"
              />
              <label htmlFor="track-opens" className="ml-2 text-sm">Track opens</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="track-clicks"
                checked={trackClicks}
                onChange={(e) => setTrackClicks(e.target.checked)}
                className="h-4 w-4 text-teal-600 rounded"
              />
              <label htmlFor="track-clicks" className="ml-2 text-sm">Track clicks</label>
            </div>
          </div>
        </div>

        {/* Send Options */}
        <div className="space-y-4">
          <label className="font-medium">When would you like to send this campaign?</label>
          
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="send-now"
                name="sendOption"
                checked={sendOption === 'now'}
                onChange={() => setSendOption('now')}
                className="h-4 w-4 text-teal-600"
              />
              <div>
                <label htmlFor="send-now" className="font-medium">Send now</label>
                <p className="text-sm text-gray-500">Your campaign will be sent as soon as you complete the setup</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="send-later"
                name="sendOption"  
                checked={sendOption === 'schedule'}
                onChange={() => setSendOption('schedule')}
                className="h-4 w-4 text-teal-600"
              />
              <div>
                <label htmlFor="send-later" className="font-medium">Schedule for later</label>
                <p className="text-sm text-gray-500">Choose a specific date and time to send your campaign</p>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Options - Show only if schedule is selected */}
        {sendOption === 'schedule' && (
          <div className="space-y-4 p-4 bg-teal-50 rounded-lg">
            <label className="block font-medium">When should we send this campaign?</label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required={sendOption === 'schedule'}
                />
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              
              <div>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required={sendOption === 'schedule'}
                />
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              Your campaign will be sent on {scheduleDate ? new Date(scheduleDate).toLocaleDateString() : '[date]'} 
              at {scheduleTime || '[time]'}.
            </p>
          </div>
        )}

        {/* Campaign Summary */}
        <div className="bg-teal-50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-teal-800">Campaign Summary</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="text-teal-600">Campaign Name:</div>
            <div>{campaignName || 'Untitled Campaign'}</div>
            
            <div className="text-teal-600">Recipients:</div>
            <div>{initialData.recipientList?.length || initialData.recipientCount || 0} contacts</div>
            
            <div className="text-teal-600">Subject:</div>
            <div>{emailSubject || 'No subject'}</div>
            
            <div className="text-teal-600">From:</div>
            <div>{fromName || 'Not specified'} ({fromEmail || 'No email'})</div>
            
            <div className="text-teal-600">Tracking:</div>
            <div>
              {trackOpens && trackClicks 
                ? 'Opens and clicks' 
                : trackOpens 
                  ? 'Opens only' 
                  : trackClicks 
                    ? 'Clicks only' 
                    : 'No tracking'}
            </div>
            
            <div className="text-teal-600">Delivery:</div>
            <div>
              {sendOption === 'now' 
                ? 'Immediately after setup' 
                : `Scheduled for ${scheduleDate} at ${scheduleTime}`}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-between">
          <button
            type="button"
            onClick={navigateBack}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          
          <button
            type="submit"
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Continue to Template
          </button>
        </div>
      </form>
    </div>
  );
};

export default Setup;