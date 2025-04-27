"use client";
import React, { useState } from 'react';
import ComposeSMS from './ComposeSMS';
import DraftSMS from './DraftSMS';
import ScheduleSMS from './ScheduleSMS';
import BuySMS from './BuySMS';
import UploadNo from './UploadNo';
import AllContact from './AllContact';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from 'lucide-react';

interface BulkSMSFlowManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSend?: (data: any) => void; // Callback for when SMS is sent
}

// Define the steps in the bulk SMS flow
type BulkSMSStep = 'compose' | 'draft' | 'schedule' | 'buy' | 'upload' | 'all-contact';

const BulkSMSFlowManager: React.FC<BulkSMSFlowManagerProps> = ({
  isOpen,
  onClose,
  onSend,
}) => {
  const [currentStep, setCurrentStep] = useState<BulkSMSStep>('compose');
  
  // SMS data state
  const [smsData, setSmsData] = useState({
    senderName: 'Adafri Platform',
    phoneNumbers: '',
    country: '',
    message: 'Hello User',
    sendOption: 'now' as 'now' | 'schedule',
    scheduleDate: '',
    scheduleTime: '',
  });

  // Draft messages state
  const [draftMessages, setDraftMessages] = useState<any[]>([]);

  // Scheduled messages state
  const [scheduledMessages, setScheduledMessages] = useState<any[]>([]);

  // Handler for compose SMS submission
  const handleComposeSubmit = (composeData: {
    senderName: string;
    phoneNumbers: string;
    country: string;
    message: string;
    sendOption: 'now' | 'schedule';
    scheduleDate?: string;
    scheduleTime?: string;
  }) => {
    if (composeData.sendOption === 'now') {
      // Send immediately
      const recipients = composeData.phoneNumbers.split(',').filter(Boolean).length;
      onSend?.({
        title: composeData.message.slice(0, 50),
        sender: composeData.senderName,
        date: new Date().toLocaleDateString(),
        recipients,
        sent: recipients,
        status: 'completed',
        message: composeData.message,
        phoneNumbers: composeData.phoneNumbers,
        country: composeData.country,
      });
      handleClose();
    } else if (composeData.sendOption === 'schedule') {
      // Add to scheduled messages
      const newScheduledMessage = {
        id: String(Date.now()),
        sender: composeData.senderName,
        message: composeData.message,
        pages: Math.ceil(composeData.message.length / 160),
        date: `${composeData.scheduleDate}, ${composeData.scheduleTime}`,
        phoneNumbers: composeData.phoneNumbers,
        country: composeData.country,
      };
      setScheduledMessages(prev => [...prev, newScheduledMessage]);
      setCurrentStep('schedule');
    }
  };

  // Handler for saving drafts
  const handleSaveDraft = (draftData: {
    senderName: string;
    phoneNumbers: string;
    country: string;
    message: string;
    sendOption: 'now' | 'schedule';
    scheduleDate?: string;
    scheduleTime?: string;
  }) => {
    // Add to draft messages
    const newDraftMessage = {
      id: String(Date.now()),
      sender: draftData.senderName,
      message: draftData.message,
      pages: Math.ceil(draftData.message.length / 160),
      date: new Date().toLocaleDateString() + ', ' + new Date().toLocaleTimeString(),
      phoneNumbers: draftData.phoneNumbers,
      country: draftData.country,
    };
    setDraftMessages(prev => [...prev, newDraftMessage]);
    setCurrentStep('draft');
  };

  // Handler for editing scheduled messages
  const handleScheduleEdit = (editData: any) => {
    setSmsData({
      senderName: editData.senderName,
      phoneNumbers: editData.phoneNumbers,
      country: editData.country,
      message: editData.message,
      sendOption: 'schedule',
      scheduleDate: editData.scheduleDate,
      scheduleTime: editData.scheduleTime,
    });
    setCurrentStep('compose');
  };

  // Handler for sending scheduled messages immediately
  const handleScheduledSend = (scheduledMessage: any) => {
    const recipients = scheduledMessage.phoneNumbers.split(',').filter(Boolean).length;
    onSend?.({
      title: scheduledMessage.message.slice(0, 50),
      sender: scheduledMessage.sender,
      date: new Date().toLocaleDateString(),
      recipients,
      sent: recipients,
      status: 'completed',
      message: scheduledMessage.message,
      phoneNumbers: scheduledMessage.phoneNumbers,
      country: scheduledMessage.country,
    });
    
    // Remove from scheduled messages
    setScheduledMessages(prev => prev.filter(msg => msg.id !== scheduledMessage.id));
  };

  // Handler for draft SMS submission
  const handleDraftSubmit = (draftData: any) => {
    setSmsData({
      ...smsData,
      ...draftData
    });
    // After selecting a draft, move to compose step to edit it
    setCurrentStep('compose');
  };

  // Handler for sending draft messages immediately
  const handleDraftSend = (draftMessage: any) => {
    const recipients = draftMessage.phoneNumbers.split(',').filter(Boolean).length;
    onSend?.({
      title: draftMessage.message.slice(0, 50),
      sender: draftMessage.sender,
      date: new Date().toLocaleDateString(),
      recipients,
      sent: recipients,
      status: 'completed',
      message: draftMessage.message,
      phoneNumbers: draftMessage.phoneNumbers,
      country: draftMessage.country,
    });
    
    // Remove from draft messages
    setDraftMessages(prev => prev.filter(msg => msg.id !== draftMessage.id));
  };

  // Handler for buy SMS submission
  const handleBuySubmit = (buyData: any) => {
    setSmsData({
      ...smsData,
      ...buyData
    });
    handleClose();
  };

  // Handler for upload numbers submission
  const handleUploadSubmit = (uploadData: any) => {
    setSmsData({
      ...smsData,
      ...uploadData
    });
    // Go back to compose step with uploaded numbers
    setCurrentStep('compose');
  };

  // Handler for import contacts submission
  const handleImportSubmit = (importData: any) => {
    setSmsData({
      ...smsData,
      ...importData
    });
    // Go back to compose step with imported contacts
    setCurrentStep('compose');
  };

  // Close and reset the flow
  const handleClose = () => {
    onClose();
    // Reset the state after the dialog closes
    setTimeout(() => {
      setCurrentStep('compose');
      setSmsData({
        senderName: 'Adafri Platform',
        phoneNumbers: '',
        country: '',
        message: 'Hello User',
        sendOption: 'now',
        scheduleDate: '',
        scheduleTime: '',
      });
    }, 200);
  };

  const getTabCount = (tab: BulkSMSStep) => {
    switch (tab) {
      case 'schedule':
        return scheduledMessages.length;
      case 'draft':
        return draftMessages.length;
      // Add counts for other tabs if needed
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md md:max-w-2xl lg:max-w-5xl xl:max-w-6xl p-0 max-h-[150vh]">
        
        <div className="p-6 h-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Bulk SMS</h2>
            <button 
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Navigation Tabs */}
          <div className="mb-6">
            <div className="inline-flex rounded-lg bg-gray-100 p-1">
              <button
                className={`px-4 py-2 text-sm rounded-lg ${
                  currentStep === 'compose' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setCurrentStep('compose')}
              >
                Compose
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-lg ${
                  currentStep === 'draft' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setCurrentStep('draft')}
              >
                Draft {getTabCount('draft') ? `(${getTabCount('draft')})` : ''}
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-lg ${
                  currentStep === 'schedule' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setCurrentStep('schedule')}
              >
                Schedule {getTabCount('schedule') ? `(${getTabCount('schedule')})` : ''}
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-lg ${
                  currentStep === 'buy' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setCurrentStep('buy')}
              >
                Buy SMS
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-lg ${
                  currentStep === 'upload' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setCurrentStep('upload')}
              >
                Upload No
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-lg ${
                  currentStep === 'all-contact' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setCurrentStep('all-contact')}
              >
                All Contacts
              </button>
            </div>
          </div>

          {/* Step Content - with scroll capability */}
          <div className="flex-1 overflow-y-auto mt-6 pr-2">
            {currentStep === 'compose' && (
              <ComposeSMS
                onSubmit={handleComposeSubmit}
                initialData={smsData}
                onSaveDraft={handleSaveDraft}
              />
            )}
            
            {currentStep === 'draft' && (
              <DraftSMS
                onSubmit={handleDraftSubmit}
                onSend={handleDraftSend}
                initialData={smsData}
                setCurrentStep={(step: string) => setCurrentStep(step as BulkSMSStep)}
                draftMessages={draftMessages}
                setDraftMessages={setDraftMessages}
              />
            )}
            
            {currentStep === 'schedule' && (
              <ScheduleSMS
                onSubmit={handleScheduleEdit}
                onSend={handleScheduledSend}
                scheduledMessages={scheduledMessages}
                setScheduledMessages={setScheduledMessages}
                initialData={smsData}
                setCurrentStep={(step: string) => setCurrentStep(step as BulkSMSStep)}
              />
            )}
            
            {currentStep === 'buy' && (
              <BuySMS
                onSubmit={handleBuySubmit}
                initialData={smsData}
              />
            )}
            
            {currentStep === 'upload' && (
              <UploadNo
                onSubmit={handleUploadSubmit}
                initialData={smsData}
              />
            )}
            
            {currentStep === 'all-contact' && (
              <AllContact
                onSubmit={handleImportSubmit}
                initialData={smsData}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkSMSFlowManager;



























// "use client";
// import React, { useState } from 'react';
// import ComposeSMS from './ComposeSMS';
// import DraftSMS from './DraftSMS';
// import ScheduleSMS from './ScheduleSMS';
// import BuySMS from './BuySMS';
// import UploadNo from './UploadNo';
// import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
// import { X } from 'lucide-react';
// import AllContact from './AllContact';

// interface BulkSMSFlowManagerProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// // Define the steps in the bulk SMS flow
// type BulkSMSStep = 'compose' | 'draft' | 'schedule' | 'buy' | 'upload' | 'all-contact';

// const BulkSMSFlowManager: React.FC<BulkSMSFlowManagerProps> = ({
//   isOpen,
//   onClose,
// }) => {
//   const [currentStep, setCurrentStep] = useState<BulkSMSStep>('compose');
  
//   // SMS data state
//   const [smsData, setSmsData] = useState({
//     senderName: 'Adafri Platform',
//     phoneNumbers: '',
//     country: '',
//     message: 'Hello User',
//     sendOption: 'now' as 'now' | 'schedule',
//     scheduleDate: '',
//     scheduleTime: '',
//   });

//   // Handler for compose SMS submission
//   const handleComposeSubmit = (composeData: {
//     senderName: string;
//     phoneNumbers: string;
//     country: string;
//     message: string;
//     sendOption: 'now' | 'schedule';
//   }) => {
//     setSmsData({
//       ...smsData,
//       ...composeData
//     });
//     // If scheduling is selected, move to schedule step
//     if (composeData.sendOption === 'schedule') {
//       setCurrentStep('schedule');
//     } else {
//       // Otherwise, close the dialog
//       handleClose();
//     }
//   };

//   // Handler for draft SMS submission
//   const handleDraftSubmit = (draftData: any) => {
//     setSmsData({
//       ...smsData,
//       ...draftData
//     });
//     // After selecting a draft, move to compose step to edit it
//     setCurrentStep('compose');
//   };

//   // Handler for schedule SMS submission
//   const handleScheduleSubmit = (scheduleData: {
//     scheduleDate: string;
//     scheduleTime: string;
//   }) => {
//     setSmsData({
//       ...smsData,
//       ...scheduleData
//     });
//     handleClose();
//   };

//   // Handler for buy SMS submission
//   const handleBuySubmit = (buyData: any) => {
//     setSmsData({
//       ...smsData,
//       ...buyData
//     });
//     handleClose();
//   };

//   // Handler for upload numbers submission
//   const handleUploadSubmit = (uploadData: any) => {
//     setSmsData({
//       ...smsData,
//       ...uploadData
//     });
//     handleClose();
//   };

//   // Handler for import contacts submission
//   const handleImportSubmit = (importData: any) => {
//     setSmsData({
//       ...smsData,
//       ...importData
//     });
//     handleClose();
//   };

//   // Close and reset the flow
//   const handleClose = () => {
//     onClose();
//     // Reset the state after the dialog closes
//     setTimeout(() => {
//       setCurrentStep('compose');
//       setSmsData({
//         senderName: 'Adafri Platform',
//         phoneNumbers: '',
//         country: '',
//         message: 'Hello User',
//         sendOption: 'now',
//         scheduleDate: '',
//         scheduleTime: '',
//       });
//     }, 200);
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={handleClose}>
//       {/* Increased width and height for more space */}
//       <DialogContent className="sm:max-w-md md:max-w-2xl lg:max-w-5xl xl:max-w-6xl p-0 max-h-[150vh]">
        
//         <div className="p-6 h-full overflow-hidden flex flex-col">
//           {/* Header */}
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-2xl font-bold">Bulk SMS</h2>
//             <button 
//               onClick={handleClose}
//               className="p-1 hover:bg-gray-100 rounded-full"
//             >
//               <X className="h-6 w-6" />
//             </button>
//           </div>
          
//           {/* Navigation Tabs */}
//           <div className="mb-6">
//             <div className="inline-flex rounded-lg bg-gray-100 p-1">
//               <button
//                 className={`px-4 py-2 text-sm rounded-lg ${
//                   currentStep === 'compose' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
//                 }`}
//                 onClick={() => setCurrentStep('compose')}
//               >
//                 Compose
//               </button>
//               <button
//                 className={`px-4 py-2 text-sm rounded-lg ${
//                   currentStep === 'draft' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
//                 }`}
//                 onClick={() => setCurrentStep('draft')}
//               >
//                 Draft
//               </button>
//               <button
//                 className={`px-4 py-2 text-sm rounded-lg ${
//                   currentStep === 'schedule' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
//                 }`}
//                 onClick={() => setCurrentStep('schedule')}
//               >
//                 Schedule
//               </button>
//               <button
//                 className={`px-4 py-2 text-sm rounded-lg ${
//                   currentStep === 'buy' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
//                 }`}
//                 onClick={() => setCurrentStep('buy')}
//               >
//                 Buy SMS
//               </button>
//               <button
//                 className={`px-4 py-2 text-sm rounded-lg ${
//                   currentStep === 'upload' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
//                 }`}
//                 onClick={() => setCurrentStep('upload')}
//               >
//                 Upload No
//               </button>
//               <button
//                 className={`px-4 py-2 text-sm rounded-lg ${
//                   currentStep === 'all-contact' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
//                 }`}
//                 onClick={() => setCurrentStep('all-contact')}
//               >
//                 All Contacts
//               </button>
//             </div>
//           </div>

//           {/* Step Content - with scroll capability */}
//           <div className="flex-1 overflow-y-auto mt-6 pr-2">
//             {currentStep === 'compose' && (
//               <ComposeSMS
//                 onSubmit={handleComposeSubmit}
//                 initialData={smsData}
//               />
//             )}
            
//             {currentStep === 'draft' && (
//               <DraftSMS
//                 onSubmit={handleDraftSubmit}
//                 initialData={smsData}
//                 // setCurrentStep={setCurrentStep}
//               />
//             )}
            
//             {currentStep === 'schedule' && (
//               <ScheduleSMS
//                 onSubmit={handleScheduleSubmit}
//                 initialData={smsData}
//                 // setCurrentStep={setCurrentStep}
//               />
//             )}
            
//             {currentStep === 'buy' && (
//               <BuySMS
//                 onSubmit={handleBuySubmit}
//                 initialData={smsData}
//               />
//             )}
            
//            {currentStep === 'upload' && (
//               <UploadNo
//                 onSubmit={handleUploadSubmit}
//                 initialData={smsData}
//               />
//             )}
            
//             {currentStep === 'all-contact' && (
//               <AllContact
//                 onSubmit={handleImportSubmit}
//                 initialData={smsData}
//               />
//             )}
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default BulkSMSFlowManager;


























// "use client";
// import React, { useState } from 'react';
// import ComposeSMS from './ComposeSMS';
// import DraftSMS from './DraftSMS';
// import ScheduleSMS from './ScheduleSMS';
// // import BuySMS from './BuySMS';
// // import UploadNo from './UploadNo';
// // import ImportContact from './ImportContact';
// import { Dialog, DialogContent } from "@/components/ui/dialog";
// import { X } from 'lucide-react';

// interface BulkSMSFlowManagerProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// // Define the steps in the bulk SMS flow
// type BulkSMSStep = 'compose' | 'draft' | 'schedule' | 'buy' | 'upload' | 'import';

// const BulkSMSFlowManager: React.FC<BulkSMSFlowManagerProps> = ({
//   isOpen,
//   onClose,
// }) => {
//   const [currentStep, setCurrentStep] = useState<BulkSMSStep>('compose');
  
//   // SMS data state
//   const [smsData, setSmsData] = useState({
//     senderName: 'Adafri Platform',
//     phoneNumbers: '',
//     country: '',
//     message: 'Hello User',
//     sendOption: 'now' as 'now' | 'schedule',
//     scheduleDate: '',
//     scheduleTime: '',
//   });

//   // Handler for compose SMS submission
//   const handleComposeSubmit = (composeData: {
//     senderName: string;
//     phoneNumbers: string;
//     country: string;
//     message: string;
//     sendOption: 'now' | 'schedule';
//   }) => {
//     setSmsData({
//       ...smsData,
//       ...composeData
//     });
//     // If scheduling is selected, move to schedule step
//     if (composeData.sendOption === 'schedule') {
//       setCurrentStep('schedule');
//     } else {
//       // Otherwise, close the dialog
//       handleClose();
//     }
//   };

//   // Handler for draft SMS submission
//   const handleDraftSubmit = (draftData: any) => {
//     setSmsData({
//       ...smsData,
//       ...draftData
//     });
//     // After selecting a draft, move to compose step to edit it
//     setCurrentStep('compose');
//   };

//   // Handler for schedule SMS submission
//   const handleScheduleSubmit = (scheduleData: {
//     scheduleDate: string;
//     scheduleTime: string;
//   }) => {
//     setSmsData({
//       ...smsData,
//       ...scheduleData
//     });
//     handleClose();
//   };

//   // Handler for buy SMS submission
//   const handleBuySubmit = (buyData: any) => {
//     setSmsData({
//       ...smsData,
//       ...buyData
//     });
//     handleClose();
//   };

//   // Handler for upload numbers submission
//   const handleUploadSubmit = (uploadData: any) => {
//     setSmsData({
//       ...smsData,
//       ...uploadData
//     });
//     handleClose();
//   };

//   // Handler for import contacts submission
//   const handleImportSubmit = (importData: any) => {
//     setSmsData({
//       ...smsData,
//       ...importData
//     });
//     handleClose();
//   };

//   // Close and reset the flow
//   const handleClose = () => {
//     onClose();
//     // Reset the state after the dialog closes
//     setTimeout(() => {
//       setCurrentStep('compose');
//       setSmsData({
//         senderName: 'Adafri Platform',
//         phoneNumbers: '',
//         country: '',
//         message: 'Hello User',
//         sendOption: 'now',
//         scheduleDate: '',
//         scheduleTime: '',
//       });
//     }, 200);
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={handleClose}>
//       <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-4xl p-0">
//         <div className="p-6">
//           {/* Header */}
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-2xl font-bold">Bulk SMS</h2>
//             <button 
//               onClick={handleClose}
//               className="p-1 hover:bg-gray-100 rounded-full"
//             >
//               <X className="h-6 w-6" />
//             </button>
//           </div>
          
//           {/* Navigation Tabs */}
//           <div className="mb-6">
//             <div className="inline-flex rounded-lg bg-gray-100 p-1">
//               <button
//                 className={`px-4 py-2 text-sm rounded-lg ${
//                   currentStep === 'compose' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
//                 }`}
//                 onClick={() => setCurrentStep('compose')}
//               >
//                 Compose
//               </button>
//               <button
//                 className={`px-4 py-2 text-sm rounded-lg ${
//                   currentStep === 'draft' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
//                 }`}
//                 onClick={() => setCurrentStep('draft')}
//               >
//                 Draft
//               </button>
//               <button
//                 className={`px-4 py-2 text-sm rounded-lg ${
//                   currentStep === 'schedule' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
//                 }`}
//                 onClick={() => setCurrentStep('schedule')}
//               >
//                 Schedule
//               </button>
//               <button
//                 className={`px-4 py-2 text-sm rounded-lg ${
//                   currentStep === 'buy' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
//                 }`}
//                 onClick={() => setCurrentStep('buy')}
//               >
//                 Buy SMS
//               </button>
//               <button
//                 className={`px-4 py-2 text-sm rounded-lg ${
//                   currentStep === 'upload' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
//                 }`}
//                 onClick={() => setCurrentStep('upload')}
//               >
//                 Upload No
//               </button>
//               <button
//                 className={`px-4 py-2 text-sm rounded-lg ${
//                   currentStep === 'import' ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'
//                 }`}
//                 onClick={() => setCurrentStep('import')}
//               >
//                 Import
//               </button>
//             </div>
//           </div>

//           {/* Step Content */}
//           <div className="mt-6">
//             {currentStep === 'compose' && (
//               <ComposeSMS
//                 onSubmit={handleComposeSubmit}
//                 initialData={smsData}
//               />
//             )}
            
//             {currentStep === 'draft' && (
//               <DraftSMS
//                 onSubmit={handleDraftSubmit}
//                 initialData={smsData}
//               />
//             )}
            
//             {/* Commented out components will be added later */}
//             {currentStep === 'schedule' && (
//               <ScheduleSMS
//                 onSubmit={handleScheduleSubmit}
//                 initialData={smsData}
//               />
//             )}
            
//             {/* {currentStep === 'buy' && (
//               <BuySMS
//                 onSubmit={handleBuySubmit}
//                 initialData={smsData}
//               />
//             )}
            
//             {currentStep === 'upload' && (
//               <UploadNo
//                 onSubmit={handleUploadSubmit}
//                 initialData={smsData}
//               />
//             )}
            
//             {currentStep === 'import' && (
//               <ImportContact
//                 onSubmit={handleImportSubmit}
//                 initialData={smsData}
//               />
//             )} */}
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default BulkSMSFlowManager;