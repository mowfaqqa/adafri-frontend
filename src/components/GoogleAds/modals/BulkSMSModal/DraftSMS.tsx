"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Edit, Send, Trash2, ChevronRight } from 'lucide-react';

interface DraftSMSProps {
  onSubmit: (data: any) => void;
  onSend: (data: any) => void; // Added the missing onSend prop
  initialData: {
    senderName: string;
    phoneNumbers: string;
    country: string;
    message: string;
    sendOption: 'now' | 'schedule';
    scheduleDate?: string;
    scheduleTime?: string;
  };
  setCurrentStep?: (step: string) => void;
  draftMessages: Array<{
    id: string;
    sender: string;
    message: string;
    pages: number;
    date: string;
    phoneNumbers: string;
    country: string;
    scheduleDate?: string;
    scheduleTime?: string;
  }>;
  setDraftMessages: React.Dispatch<React.SetStateAction<Array<any>>>;
}

const DraftSMS: React.FC<DraftSMSProps> = ({ 
  onSubmit, 
  onSend, 
  initialData, 
  setCurrentStep,
  draftMessages,
  setDraftMessages
}) => {
  // Use draftMessages from props instead of local state
  const [currentPage, setCurrentPage] = useState(1);
  const draftsPerPage = 10;
  
  const tableRef = useRef<HTMLDivElement>(null);
  
  // Calculate pagination
  const totalPages = Math.ceil(draftMessages.length / draftsPerPage);
  const indexOfLastDraft = currentPage * draftsPerPage;
  const indexOfFirstDraft = indexOfLastDraft - draftsPerPage;
  const currentDrafts = draftMessages.slice(indexOfFirstDraft, indexOfLastDraft);
  
  // Scroll handling for pagination
  useEffect(() => {
    const handleScroll = () => {
      if (tableRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
        
        // If scrolled near bottom and not on last page
        if (scrollTop + clientHeight >= scrollHeight - 20 && currentPage < totalPages) {
          setCurrentPage(prev => prev + 1);
        }
        
        // If scrolled near top and not on first page
        if (scrollTop <= 20 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      }
    };

    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener('scroll', handleScroll);
      
      return () => {
        tableElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [currentPage, totalPages]);

  const handleEdit = (draft: typeof draftMessages[0]) => {
    // When editing a draft, pass its data to the parent component
    onSubmit({
      senderName: draft.sender,
      phoneNumbers: draft.phoneNumbers || '',
      country: draft.country || '',
      message: draft.message,
      sendOption: 'now',
      scheduleDate: draft.scheduleDate || '',
      scheduleTime: draft.scheduleTime || '',
    });

    // Navigate back to compose step
    if (setCurrentStep) {
      setCurrentStep('compose');
    }
  };

  const handleSend = (draft: typeof draftMessages[0]) => {
    // Call the onSend prop with the draft data
    onSend({
      senderName: draft.sender,
      phoneNumbers: draft.phoneNumbers || '',
      country: draft.country || '',
      message: draft.message,
      sendOption: 'now',
      scheduleDate: draft.scheduleDate || '',
      scheduleTime: draft.scheduleTime || '',
    });
    
    // Remove the draft from the list
    setDraftMessages(draftMessages.filter(d => d.id !== draft.id));
  };

  const handleDelete = (id: string) => {
    // Remove the draft from the list
    setDraftMessages(draftMessages.filter(draft => draft.id !== id));
  };

  return (
    <div className="w-full overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Draft Messages</h3>
      </div>
      
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 mb-2 text-gray-700 font-medium border-b pb-2 px-2">
        <div className="col-span-1 flex items-center">
          <span>#</span>
        </div>
        <div className="col-span-2 flex items-center">
          <span>Sender</span>
        </div>
        <div className="col-span-4 flex items-center">
          <span>Message</span>
        </div>
        <div className="col-span-1 flex items-center">
          <span>Pages</span>
        </div>
        <div className="col-span-2 flex items-center">
          <span>Date</span>
        </div>
        <div className="col-span-2 flex items-center">
          <span>Actions</span>
        </div>
      </div>
      
      {/* Table Content */}
      <div 
        ref={tableRef} 
        className="overflow-y-auto max-h-96 pr-1"
        style={{ scrollBehavior: 'smooth' }}
      >
        {currentDrafts.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No draft messages found
          </div>
        ) : (
          currentDrafts.map((draft, index) => (
            <div 
              key={draft.id} 
              className="grid grid-cols-12 gap-2 py-3 border-b border-gray-100 hover:bg-gray-50 px-2"
            >
              <div className="col-span-1 text-gray-800 flex items-center">
                <span>{indexOfFirstDraft + index + 1}</span>
              </div>
              <div className="col-span-2 font-medium text-gray-800 flex items-center truncate">
                {draft.sender}
              </div>
              <div className="col-span-4 text-gray-600 flex items-center truncate">
                {draft.message}
              </div>
              <div className="col-span-1 text-gray-600 flex items-center">
                {draft.pages}
              </div>
              <div className="col-span-2 text-gray-500 text-xs flex items-center">
                {draft.date}
              </div>
              <div className="col-span-2 flex space-x-1 items-center">
                <button 
                  onClick={() => handleEdit(draft)}
                  className="p-1 text-gray-600 hover:text-blue-600"
                  aria-label={`Edit draft from ${draft.sender}`}
                  title="Edit Message"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleSend(draft)}
                  className="p-1 text-gray-600 hover:text-green-600"
                  aria-label={`Send draft from ${draft.sender}`}
                  title="Send Now"
                >
                  <Send size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(draft.id)}
                  className="p-1 text-gray-600 hover:text-red-600"
                  aria-label={`Delete draft from ${draft.sender}`}
                  title="Delete Message"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-3 px-2">
          <span className="text-sm text-gray-600">
            Showing {indexOfFirstDraft + 1}-{Math.min(indexOfLastDraft, draftMessages.length)} of {draftMessages.length} messages
          </span>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 text-gray-600 hover:text-blue-600 disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronRight size={18} className="transform rotate-180" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 text-gray-600 hover:text-blue-600 disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftSMS;







































// "use client";
// import React, { useState, useRef, useEffect } from 'react';
// import { Edit, Send, Trash2, Plus, ChevronRight } from 'lucide-react';

// interface DraftSMSProps {
//   onSubmit: (data: any) => void;
//   initialData: {
//     senderName: string;
//     phoneNumbers: string;
//     country: string;
//     message: string;
//     sendOption: 'now' | 'schedule';
//     scheduleDate: string;
//     scheduleTime: string;
//   };
//   setCurrentStep?: (step: string) => void; // Add this prop to control navigation
// }

// // Sample draft data
// const sampleDrafts = [
//   {
//     id: "1",
//     sender: "Daniel",
//     message: "Moving forward with Adafri",
//     pages: 4,
//     date: "1 Jan, 2025, 12:00"
//   },
//   {
//     id: "2",
//     sender: "Marketing",
//     message: "New product launch announcement",
//     pages: 2,
//     date: "3 Jan, 2025, 15:30"
//   },
//   {
//     id: "3",
//     sender: "Support",
//     message: "System maintenance notification",
//     pages: 1,
//     date: "5 Jan, 2025, 09:00"
//   }
// ];

// const DraftSMS: React.FC<DraftSMSProps> = ({ onSubmit, initialData, setCurrentStep }) => {
//   // State for drafts - in a real app this would likely come from an API
//   const [drafts, setDrafts] = useState(sampleDrafts);
//   const [currentPage, setCurrentPage] = useState(1);
//   const draftsPerPage = 10;
  
//   const tableRef = useRef<HTMLDivElement>(null);
  
//   // Calculate pagination
//   const totalPages = Math.ceil(drafts.length / draftsPerPage);
//   const indexOfLastDraft = currentPage * draftsPerPage;
//   const indexOfFirstDraft = indexOfLastDraft - draftsPerPage;
//   const currentDrafts = drafts.slice(indexOfFirstDraft, indexOfLastDraft);
  
//   // Scroll handling for pagination
//   useEffect(() => {
//     const handleScroll = () => {
//       if (tableRef.current) {
//         const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
        
//         // If scrolled near bottom and not on last page
//         if (scrollTop + clientHeight >= scrollHeight - 20 && currentPage < totalPages) {
//           setCurrentPage(prev => prev + 1);
//         }
        
//         // If scrolled near top and not on first page
//         if (scrollTop <= 20 && currentPage > 1) {
//           setCurrentPage(prev => prev - 1);
//         }
//       }
//     };

//     const tableElement = tableRef.current;
//     if (tableElement) {
//       tableElement.addEventListener('scroll', handleScroll);
      
//       return () => {
//         tableElement.removeEventListener('scroll', handleScroll);
//       };
//     }
//   }, [currentPage, totalPages]);

//   const handleEdit = (draft: typeof sampleDrafts[0]) => {
//     // When editing a draft, pass its data to the parent component
//     onSubmit({
//       senderName: draft.sender,
//       phoneNumbers: '', // Would come from your backend in a real app
//       country: '', // Would come from your backend in a real app
//       message: draft.message,
//       sendOption: 'now', // Default or from the draft data
//       scheduleDate: '',
//       scheduleTime: '',
//     });

//     // Navigate back to compose step
//     if (setCurrentStep) {
//       setCurrentStep('compose');
//     }
//   };

//   const handleSend = (draft: typeof sampleDrafts[0]) => {
//     // In a real app, you might send the SMS directly or prepare it for sending
//     console.log('Sending draft:', draft);
//     // For demo purposes, we'll just remove it from drafts
//     setDrafts(drafts.filter(d => d.id !== draft.id));
//   };

//   const handleDelete = (id: string) => {
//     // Remove the draft from the list
//     setDrafts(drafts.filter(draft => draft.id !== id));
//   };

//   return (
//     <div className="w-full overflow-hidden">
//       <div className="flex justify-between items-center mb-4">
//         <h3 className="text-lg font-medium">Draft Messages</h3>
//       </div>
      
//       {/* Table Header */}
//       <div className="grid grid-cols-12 gap-2 mb-2 text-gray-700 font-medium border-b pb-2 px-2">
//         <div className="col-span-1 flex items-center">
//           <span>#</span>
//         </div>
//         <div className="col-span-2 flex items-center">
//           <span>Sender</span>
//         </div>
//         <div className="col-span-4 flex items-center">
//           <span>Message</span>
//         </div>
//         <div className="col-span-1 flex items-center">
//           <span>Pages</span>
//         </div>
//         <div className="col-span-2 flex items-center">
//           <span>Date</span>
//         </div>
//         <div className="col-span-2 flex items-center">
//           <span>Actions</span>
//         </div>
//       </div>
      
//       {/* Table Content */}
//       <div 
//         ref={tableRef} 
//         className="overflow-y-auto max-h-96 pr-1"
//         style={{ scrollBehavior: 'smooth' }}
//       >
//         {currentDrafts.length === 0 ? (
//           <div className="text-center py-6 text-gray-500">
//             No draft messages found
//           </div>
//         ) : (
//           currentDrafts.map((draft, index) => (
//             <div 
//               key={draft.id} 
//               className="grid grid-cols-12 gap-2 py-3 border-b border-gray-100 hover:bg-gray-50 px-2"
//             >
//               <div className="col-span-1 text-gray-800 flex items-center">
//                 <span>{indexOfFirstDraft + index + 1}</span>
//               </div>
//               <div className="col-span-2 font-medium text-gray-800 flex items-center truncate">
//                 {draft.sender}
//               </div>
//               <div className="col-span-4 text-gray-600 flex items-center truncate">
//                 {draft.message}
//               </div>
//               <div className="col-span-1 text-gray-600 flex items-center">
//                 {draft.pages}
//               </div>
//               <div className="col-span-2 text-gray-500 text-xs flex items-center">
//                 {draft.date}
//               </div>
//               <div className="col-span-2 flex space-x-1 items-center">
//                 <button 
//                   onClick={() => handleEdit(draft)}
//                   className="p-1 text-gray-600 hover:text-blue-600"
//                   aria-label={`Edit draft from ${draft.sender}`}
//                   title="Edit Message"
//                 >
//                   <Edit size={16} />
//                 </button>
//                 <button 
//                   onClick={() => handleSend(draft)}
//                   className="p-1 text-gray-600 hover:text-green-600"
//                   aria-label={`Send draft from ${draft.sender}`}
//                   title="Send Now"
//                 >
//                   <Send size={16} />
//                 </button>
//                 <button 
//                   onClick={() => handleDelete(draft.id)}
//                   className="p-1 text-gray-600 hover:text-red-600"
//                   aria-label={`Delete draft from ${draft.sender}`}
//                   title="Delete Message"
//                 >
//                   <Trash2 size={16} />
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
      
//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div className="flex justify-between items-center mt-3 px-2">
//           <span className="text-sm text-gray-600">
//             Showing {indexOfFirstDraft + 1}-{Math.min(indexOfLastDraft, drafts.length)} of {drafts.length} messages
//           </span>
//           <div className="flex items-center">
//             <span className="text-sm text-gray-600 mr-2">
//               Page {currentPage} of {totalPages}
//             </span>
//             <button
//               onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1}
//               className="p-1 text-gray-600 hover:text-blue-600 disabled:opacity-50"
//               aria-label="Previous page"
//             >
//               <ChevronRight size={18} className="transform rotate-180" />
//             </button>
//             <button
//               onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//               disabled={currentPage === totalPages}
//               className="p-1 text-gray-600 hover:text-blue-600 disabled:opacity-50"
//               aria-label="Next page"
//             >
//               <ChevronRight size={18} />
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DraftSMS;