"use client";
import React, { useState } from 'react';

interface TemplateProps {
  onSubmit: (templateData: any) => void;
  initialData: any;
  setCurrentTab: (tab: string) => void;
}

const Template: React.FC<TemplateProps> = ({
  onSubmit,
  initialData,
  setCurrentTab
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(initialData.template || 'blank');
  const [emailContent, setEmailContent] = useState(initialData.content || '');

  // Predefined templates
  const templates = [
    { id: 'blank', name: 'Blank', preview: '/api/placeholder/160/100', description: 'Start from scratch' },
    { id: 'newsletter', name: 'Newsletter', preview: '/api/placeholder/160/100', description: 'Share updates and news' },
    { id: 'promotion', name: 'Promotion', preview: '/api/placeholder/160/100', description: 'Announce sales or offers' },
    { id: 'announcement', name: 'Announcement', preview: '/api/placeholder/160/100', description: 'Make important announcements' },
    { id: 'event', name: 'Event', preview: '/api/placeholder/160/100', description: 'Invite to events or webinars' },
  ];

  // Get template content based on selection
  const getTemplateContent = (templateId: string) => {
    switch (templateId) {
      case 'newsletter':
        return `<h1>Newsletter Title</h1>
<p>Dear ${initialData.name ? `${initialData.name} Subscribers` : 'Subscribers'},</p>
<p>Welcome to our latest newsletter! Here are the latest updates...</p>
<h2>Latest News</h2>
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
<h2>Upcoming Events</h2>
<p>Join us for our upcoming events and webinars.</p>`;
      case 'promotion':
        return `<h1>Special Offer!</h1>
<p>Dear Valued Customer,</p>
<p>We're excited to announce our latest promotion just for you!</p>
<h2>Limited Time Offer</h2>
<p>Get 20% off on all products using code: SPECIAL20</p>
<p>Offer valid until [Date]</p>`;
      case 'announcement':
        return `<h1>Important Announcement</h1>
<p>Dear ${initialData.name ? `${initialData.name} Community` : 'Community'},</p>
<p>We have an important announcement to share with you.</p>
<h2>What's Changing</h2>
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
<h2>What This Means For You</h2>
<p>Here's what you need to know about these changes.</p>`;
      case 'event':
        return `<h1>You're Invited!</h1>
<p>Dear ${initialData.name ? `${initialData.name} Community` : 'Invitee'},</p>
<p>We're delighted to invite you to our upcoming event.</p>
<h2>Event Details</h2>
<p>Date: [Date]<br>Time: [Time]<br>Location: [Location]</p>
<h2>What to Expect</h2>
<p>Join us for an exciting day filled with [activities].</p>`;
      case 'blank':
      default:
        return `<h1>${initialData.subject || 'Email Subject'}</h1>
<p>Dear Recipient,</p>
<p>Write your message here...</p>
<p>Best regards,<br>Your Name</p>`;
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setEmailContent(getTemplateContent(templateId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const templateData = {
      template: selectedTemplate,
      content: emailContent,
    };
    
    onSubmit(templateData);
  };

  const navigateBack = () => {
    setCurrentTab('setup');
  };

  return (
    <div className="flex flex-col space-y-6 pb-16">
      <div className="space-y-2">
        <h3 className="text-xl font-medium">Email Template</h3>
        <p className="text-teal-600">Design your email content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selection */}
        <div className="space-y-4">
          <h4 className="font-medium">Choose a template</h4>
          
          <div className="space-y-3 max-h-60 pr-2">
            {templates.map(template => (
              <div 
                key={template.id}
                className={`border rounded-lg p-3 cursor-pointer hover:border-teal-500 transition-colors ${
                  selectedTemplate === template.id ? 'border-teal-500 bg-teal-50' : ''
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <div className="flex items-center space-x-3">
                  <img 
                    src={template.preview} 
                    alt={template.name} 
                    className="w-16 h-10 object-cover rounded"
                  />
                  <div>
                    <h5 className="font-medium">{template.name}</h5>
                    <p className="text-xs text-gray-500">{template.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Email Editor */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="font-medium">Edit content</h4>
          
          <div className="border rounded-lg overflow-hidden">
            {/* Simple editor toolbar */}
            <div className="flex items-center space-x-2 p-2 bg-teal-50 border-b overflow-x-auto">
              <button className="p-1 hover:bg-teal-100 rounded">B</button>
              <button className="p-1 hover:bg-teal-100 rounded"><i>I</i></button>
              <button className="p-1 hover:bg-teal-100 rounded"><u>U</u></button>
              <span className="border-r h-5 mx-1"></span>
              <button className="p-1 hover:bg-teal-100 rounded">H1</button>
              <button className="p-1 hover:bg-teal-100 rounded">H2</button>
              <span className="border-r h-5 mx-1"></span>
              <button className="p-1 hover:bg-teal-100 rounded">Link</button>
              <button className="p-1 hover:bg-teal-100 rounded">Image</button>
            </div>
            
            {/* Editor textarea with scrolling */}
            <textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              className="w-full h-40 p-4 focus:outline-none overflow-y-auto resize-none"
              placeholder="Compose your email content here..."
            />
          </div>
          
          {/* Preview with scrolling */}
          <div className="space-y-2">
            <h4 className="font-medium">Preview</h4>
            <div 
              className="border rounded-lg p-4 bg-white h-40 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: emailContent }}
            />
          </div>
        </div>
      </div>

      {/* Campaign Summary */}
      <div className="bg-teal-50 p-4 rounded-lg space-y-2">
        <h4 className="font-medium text-teal-800">Campaign Summary</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div className="text-teal-600">Campaign Name:</div>
          <div>{initialData.name || 'Untitled Campaign'}</div>
          
          <div className="text-teal-600">Recipients:</div>
          <div>{initialData.recipientList?.length || initialData.recipientCount || 0} contacts</div>
          
          <div className="text-teal-600">Subject:</div>
          <div>{initialData.subject || 'No subject'}</div>
          
          <div className="text-teal-600">Delivery:</div>
          <div>
            {initialData.sendOption === 'now' 
              ? 'Immediately after setup' 
              : `Scheduled for ${initialData.scheduleDate} at ${initialData.scheduleTime}`}
          </div>
          
          <div className="text-teal-600">Template:</div>
          <div>{templates.find(t => t.id === selectedTemplate)?.name || 'Custom'}</div>
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
          type="button"
          onClick={handleSubmit}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          Send Campaign
        </button>
      </div>
    </div>
  );
};

export default Template;