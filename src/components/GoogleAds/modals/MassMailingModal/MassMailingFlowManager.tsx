"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import Campaign from './Campaign';
import Recipients from './Recipients';
import Setup from './Setup';
import Template from './Template';

interface MassMailingFlowManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSend?: (data: any) => void; // Callback for when email is sent
}

// Define the tabs in the mass mailing flow
type MassMailingTab = 'campaign' | 'recipients' | 'setup' | 'template';

const MassMailingFlowManager: React.FC<MassMailingFlowManagerProps> = ({
  isOpen,
  onClose,
  onSend,
}) => {
  // Current active tab state
  const [currentTab, setCurrentTab] = useState<MassMailingTab>('campaign');
  const contentRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(true);
  
  // Email data state
  const [emailData, setEmailData] = useState({
    name: '',
    subject: 'Happy New Year 2025!',
    recipientCount: 500,
    recipientList: [],
    sendOption: 'now' as 'now' | 'schedule',
    scheduleDate: '',
    scheduleTime: '',
    template: '',
    content: ''
  });

  // Check scroll position on mount and content change
  useEffect(() => {
    const checkScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        setShowScrollTop(scrollTop > 20);
        setShowScrollBottom(scrollTop + clientHeight < scrollHeight - 20);
      }
    };

    // Initial check
    checkScroll();
    
    // Add scroll event listener
    const currentRef = contentRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', checkScroll);
      return () => currentRef.removeEventListener('scroll', checkScroll);
    }
  }, [currentTab, emailData]);

  // Scroll handlers
  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Handler for campaign submission
  const handleCampaignSubmit = (campaignData: any) => {
    setEmailData({
      ...emailData,
      ...campaignData
    });
    // Move to next step
    setCurrentTab('recipients');
    // Scroll to top when changing tabs
    setTimeout(() => scrollToTop(), 100);
  };

  // Handler for recipients submission
  const handleRecipientsSubmit = (recipientsData: any) => {
    setEmailData({
      ...emailData,
      ...recipientsData
    });
    // Move to next step
    setCurrentTab('setup');
    // Scroll to top when changing tabs
    setTimeout(() => scrollToTop(), 100);
  };

  // Handler for setup submission
  const handleSetupSubmit = (setupData: any) => {
    setEmailData({
      ...emailData,
      ...setupData
    });
    // Move to next step
    setCurrentTab('template');
    // Scroll to top when changing tabs
    setTimeout(() => scrollToTop(), 100);
  };

  // Handler for template submission
  const handleTemplateSubmit = (templateData: any) => {
    setEmailData({
      ...emailData,
      ...templateData
    });
    
    // Send the email if everything is ready
    onSend?.({
      ...emailData,
      ...templateData,
      date: new Date().toLocaleDateString()
    });
    
    handleClose();
  };

  // Close and reset the flow
  const handleClose = () => {
    onClose();
    // Reset the state after the dialog closes
    setTimeout(() => {
      setCurrentTab('campaign');
      setEmailData({
        name: '',
        subject: 'Happy New Year 2025!',
        recipientCount: 500,
        recipientList: [],
        sendOption: 'now',
        scheduleDate: '',
        scheduleTime: '',
        template: '',
        content: ''
      });
    }, 200);
  };

  // Get the count for tabs if needed
  const getTabCount = (tab: MassMailingTab) => {
    switch (tab) {
      case 'recipients':
        return emailData.recipientList.length > 0 ? emailData.recipientList.length : null;
      // Add counts for other tabs if needed
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-7xl p-0 h-[90vh] max-h-[90vh] w-full overflow-hidden">
        
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold">Mass Mailing</h2>
            <button 
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Navigation Tabs - Using the rounded style from BulkSMSFlowManager */}
          <div className="px-6 pt-6">
            <div className="inline-flex rounded-lg bg-gray-100 p-1">
              <button
                className={`px-4 py-2 text-sm rounded-lg ${
                  currentTab === 'campaign' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => { 
                  setCurrentTab('campaign');
                  setTimeout(() => scrollToTop(), 100);
                }}
              >
                Campaign
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-lg ${
                  currentTab === 'recipients' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => { 
                  setCurrentTab('recipients');
                  setTimeout(() => scrollToTop(), 100);
                }}
              >
                Recipients {getTabCount('recipients') ? `(${getTabCount('recipients')})` : ''}
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-lg ${
                  currentTab === 'setup' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => { 
                  setCurrentTab('setup');
                  setTimeout(() => scrollToTop(), 100);
                }}
              >
                Setup
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-lg ${
                  currentTab === 'template' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => { 
                  setCurrentTab('template');
                  setTimeout(() => scrollToTop(), 100);
                }}
              >
                Template
              </button>
            </div>
          </div>

          {/* Scroll to top button */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="absolute top-24 right-6 z-10 p-2 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-700"
              aria-label="Scroll to top"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          )}
          
          {/* Scroll to bottom button */}
          {showScrollBottom && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-6 right-6 z-10 p-2 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-700"
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          )}

          {/* Step Content - with scroll capability */}
          <div 
            ref={contentRef}
            className="flex-1 overflow-y-auto px-6 py-4"
          >
            {currentTab === 'campaign' && (
              <Campaign
                onSubmit={handleCampaignSubmit}
                initialData={emailData}
                setCurrentTab={(tab: string) => setCurrentTab(tab as MassMailingTab)}
              />
            )}
            
            {currentTab === 'recipients' && (
              <Recipients
                onSubmit={handleRecipientsSubmit}
                initialData={emailData}
                setCurrentTab={(tab: string) => setCurrentTab(tab as MassMailingTab)}
              />
            )}
            
            {currentTab === 'setup' && (
              <Setup
                onSubmit={handleSetupSubmit}
                initialData={emailData}
                setCurrentTab={(tab: string) => setCurrentTab(tab as MassMailingTab)}
              />
            )}
            
            {currentTab === 'template' && (
              <Template
                onSubmit={handleTemplateSubmit}
                initialData={emailData}
                setCurrentTab={(tab: string) => setCurrentTab(tab as MassMailingTab)}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MassMailingFlowManager;