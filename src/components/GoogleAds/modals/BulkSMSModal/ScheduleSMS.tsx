"use client";
import React, { useState } from 'react';
import { Edit, Send, Trash2, ChevronRight } from 'lucide-react';

interface ScheduledMessage {
  id: string;
  sender: string;
  message: string;
  pages: number;
  date: string;
  phoneNumbers: string;
  country: string;
}

interface ScheduleSMSProps {
  onSubmit: (data: any) => void;
  onSend: (message: ScheduledMessage) => void;
  scheduledMessages: ScheduledMessage[];
  setScheduledMessages: (messages: ScheduledMessage[]) => void;
  initialData: {
    senderName: string;
    phoneNumbers: string;
    country: string;
    message: string;
    sendOption: 'now' | 'schedule';
    scheduleDate: string;
    scheduleTime: string;
  };
  setCurrentStep?: (step: string) => void;
}

const ScheduleSMS: React.FC<ScheduleSMSProps> = ({
  onSubmit,
  onSend,
  scheduledMessages,
  setScheduledMessages,
  initialData,
  setCurrentStep
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const messagesPerPage = 10;
  
  // Calculate pagination
  const totalPages = Math.ceil(scheduledMessages.length / messagesPerPage);
  const indexOfLastMessage = currentPage * messagesPerPage;
  const indexOfFirstMessage = indexOfLastMessage - messagesPerPage;
  const currentMessages = scheduledMessages.slice(indexOfFirstMessage, indexOfLastMessage);
  
  const handleEdit = (message: ScheduledMessage) => {
    const [date, time] = message.date.split(', ');
    onSubmit({
      senderName: message.sender,
      phoneNumbers: message.phoneNumbers,
      country: message.country,
      message: message.message,
      sendOption: 'schedule',
      scheduleDate: date,
      scheduleTime: time,
    });
    
    if (setCurrentStep) {
      setCurrentStep('compose');
    }
  };

  const handleSend = (message: ScheduledMessage) => {
    onSend(message);
  };

  const handleDelete = (id: string) => {
    setScheduledMessages(scheduledMessages.filter(message => message.id !== id));
  };

  return (
    <div className="w-full overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Scheduled Messages</h3>
      </div>
      
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 mb-2 text-gray-700 font-medium border-b pb-2 px-2">
        <div className="col-span-1 flex items-center">#</div>
        <div className="col-span-2 flex items-center">Sender</div>
        <div className="col-span-4 flex items-center">Message</div>
        <div className="col-span-1 flex items-center">Pages</div>
        <div className="col-span-2 flex items-center">Date</div>
        <div className="col-span-2 flex items-center">Actions</div>
      </div>
      
      {/* Table Content */}
      <div className="overflow-y-auto max-h-96 pr-1">
        {currentMessages.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No scheduled messages found
          </div>
        ) : (
          currentMessages.map((message, index) => (
            <div 
              key={message.id} 
              className="grid grid-cols-12 gap-2 py-3 border-b border-gray-100 hover:bg-gray-50 px-2"
            >
              <div className="col-span-1 text-gray-800 flex items-center">
                {indexOfFirstMessage + index + 1}
              </div>
              <div className="col-span-2 font-medium text-gray-800 flex items-center truncate">
                {message.sender}
              </div>
              <div className="col-span-4 text-gray-600 flex items-center truncate">
                {message.message}
              </div>
              <div className="col-span-1 text-gray-600 flex items-center">
                {message.pages}
              </div>
              <div className="col-span-2 text-gray-500 text-xs flex items-center">
                {message.date}
              </div>
              <div className="col-span-2 flex space-x-1 items-center">
                <button 
                  onClick={() => handleEdit(message)}
                  className="p-1 text-gray-600 hover:text-blue-600"
                  title="Edit Message"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleSend(message)}
                  className="p-1 text-gray-600 hover:text-green-600"
                  title="Send Now"
                >
                  <Send size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(message.id)}
                  className="p-1 text-gray-600 hover:text-red-600"
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
            Showing {indexOfFirstMessage + 1}-{Math.min(indexOfLastMessage, scheduledMessages.length)} of {scheduledMessages.length} messages
          </span>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 text-gray-600 hover:text-blue-600 disabled:opacity-50"
            >
              <ChevronRight size={18} className="transform rotate-180" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 text-gray-600 hover:text-blue-600 disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleSMS;





















































// "use client";
// import React, { useState, useRef, useEffect } from 'react';
// import { Edit, Send, Trash2, Plus, ChevronRight } from 'lucide-react';
// import ComposeSMS from './ComposeSMS';

// interface ScheduleSMSProps {
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

// // Sample scheduled SMS data
// const sampleScheduled = [
//   {
//     id: "1",
//     sender: "Daniel",
//     message: "Moving forward with Adafri",
//     pages: 4,
//     date: "1 Jan, 2025, 12:00"
//   },
//   {
//     id: "2",
//     sender: "Daniel",
//     message: "Amazing Day to use Adafri Platform",
//     pages: 2,
//     date: "1 Jan, 2025, 12:00"
//   },
//   {
//     id: "3",
//     sender: "Daniel",
//     message: "Looking forward to having you",
//     pages: 5,
//     date: "1 Jan, 2025, 12:00"
//   },
//   {
//     id: "4",
//     sender: "Daniel",
//     message: "Adafri Platform is here for you",
//     pages: 1,
//     date: "1 Jan, 2025, 12:00"
//   }
// ];

// const ScheduleSMS: React.FC<ScheduleSMSProps> = ({ onSubmit, initialData, setCurrentStep }) => {
//   // State for scheduled messages - in a real app this would likely come from an API
//   const [scheduledMessages, setScheduledMessages] = useState(sampleScheduled);
//   const [currentPage, setCurrentPage] = useState(1);
//   const messagesPerPage = 10;
  
//   const tableRef = useRef<HTMLDivElement>(null);
  
//   // Calculate pagination
//   const totalPages = Math.ceil(scheduledMessages.length / messagesPerPage);
//   const indexOfLastMessage = currentPage * messagesPerPage;
//   const indexOfFirstMessage = indexOfLastMessage - messagesPerPage;
//   const currentMessages = scheduledMessages.slice(indexOfFirstMessage, indexOfLastMessage);
  
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

//   const handleEdit = (scheduled: typeof sampleScheduled[0]) => {
//     // When editing a scheduled SMS, pass its data to the parent component
//     onSubmit({
//       senderName: scheduled.sender,
//       phoneNumbers: '', // Would come from your backend in a real app
//       country: '', // Would come from your backend in a real app
//       message: scheduled.message,
//       sendOption: 'schedule',
//       scheduleDate: scheduled.date.split(',')[0], // Extract date part
//       scheduleTime: scheduled.date.split(', ')[1], // Extract time part
//     });
    
//     // Navigate back to compose step
//     if (setCurrentStep) {
//       setCurrentStep('compose');
//     }
//   };

//   const handleSend = (scheduled: typeof sampleScheduled[0]) => {
//     // In a real app, you might send the SMS immediately instead of waiting for scheduled time
//     console.log('Sending scheduled SMS now:', scheduled);
//     // For demo purposes, we'll just remove it from the list
//     setScheduledMessages(scheduledMessages.filter(s => s.id !== scheduled.id));
//   };

//   const handleDelete = (id: string) => {
//     // Remove the scheduled SMS from the list
//     setScheduledMessages(scheduledMessages.filter(message => message.id !== id));
//   };

//   return (
//     <div className="w-full overflow-hidden">
//       <div className="flex justify-between items-center mb-4">
//         <h3 className="text-lg font-medium">Scheduled Messages</h3>
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
//         {currentMessages.length === 0 ? (
//           <div className="text-center py-6 text-gray-500">
//             No scheduled messages found
//           </div>
//         ) : (
//           currentMessages.map((message, index) => (
//             <div 
//               key={message.id} 
//               className="grid grid-cols-12 gap-2 py-3 border-b border-gray-100 hover:bg-gray-50 px-2"
//             >
//               <div className="col-span-1 text-gray-800 flex items-center">
//                 <span>{indexOfFirstMessage + index + 1}</span>
//               </div>
//               <div className="col-span-2 font-medium text-gray-800 flex items-center truncate">
//                 {message.sender}
//               </div>
//               <div className="col-span-4 text-gray-600 flex items-center truncate">
//                 {message.message}
//               </div>
//               <div className="col-span-1 text-gray-600 flex items-center">
//                 {message.pages}
//               </div>
//               <div className="col-span-2 text-gray-500 text-xs flex items-center">
//                 {message.date}
//               </div>
//               <div className="col-span-2 flex space-x-1 items-center">
//                 <button 
//                   onClick={() => handleEdit(message)}
//                   className="p-1 text-gray-600 hover:text-blue-600"
//                   aria-label={`Edit scheduled SMS from ${message.sender}`}
//                   title="Edit Message"
//                 >
//                   <Edit size={16} />
//                 </button>
//                 <button 
//                   onClick={() => handleSend(message)}
//                   className="p-1 text-gray-600 hover:text-green-600"
//                   aria-label={`Send scheduled SMS from ${message.sender} now`}
//                   title="Send Now"
//                 >
//                   <Send size={16} />
//                 </button>
//                 <button 
//                   onClick={() => handleDelete(message.id)}
//                   className="p-1 text-gray-600 hover:text-red-600"
//                   aria-label={`Delete scheduled SMS from ${message.sender}`}
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
//             Showing {indexOfFirstMessage + 1}-{Math.min(indexOfLastMessage, scheduledMessages.length)} of {scheduledMessages.length} messages
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

// export default ScheduleSMS;