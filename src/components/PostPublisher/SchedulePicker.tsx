'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Send, Edit3, ChevronDown } from 'lucide-react';

interface SchedulePickerProps {
  onScheduleChange: (date: Date | null) => void;
  onPublish: (publishType: 'now' | 'schedule' | 'draft', scheduledAt?: Date) => void;
  scheduledAt: Date | null;
  isValid: boolean;
}

const SchedulePicker: React.FC<SchedulePickerProps> = ({
  onScheduleChange,
  onPublish,
  scheduledAt,
  isValid
}) => {
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Initialize with scheduledAt prop if provided
  useEffect(() => {
    if (scheduledAt) {
      setScheduleType('later');
      const date = new Date(scheduledAt);
      setSelectedDate(date.toISOString().split('T')[0]);
      setSelectedTime(date.toTimeString().slice(0, 5));
    } else {
      setScheduleType('now');
      setSelectedDate('');
      setSelectedTime('');
    }
  }, [scheduledAt]);

  const handleScheduleTypeChange = (type: 'now' | 'later') => {
    setScheduleType(type);
    if (type === 'now') {
      onScheduleChange(null);
      setSelectedDate('');
      setSelectedTime('');
    } else {
      // If switching to later and we have date/time, update
      if (selectedDate && selectedTime) {
        updateScheduledDate(selectedDate, selectedTime);
      }
    }
  };

  const updateScheduledDate = (date?: string, time?: string) => {
    const dateToUse = date || selectedDate;
    const timeToUse = time || selectedTime;
    
    if (dateToUse && timeToUse) {
      const dateTime = new Date(`${dateToUse}T${timeToUse}`);
      onScheduleChange(dateTime);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (scheduleType === 'later') {
      updateScheduledDate(date, selectedTime);
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (scheduleType === 'later') {
      updateScheduledDate(selectedDate, time);
    }
  };

  const handlePublishClick = (type: 'now' | 'schedule' | 'draft') => {
    setShowDropdown(false);
    
    if (type === 'now') {
      onPublish('now');
    } else if (type === 'schedule') {
      onPublish('schedule', scheduledAt || undefined);
    } else if (type === 'draft') {
      onPublish('draft');
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Minimum 5 minutes from now
    return now.toISOString().slice(0, 16);
  };

  const formatScheduledDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMainButtonText = () => {
    if (scheduleType === 'now') {
      return 'Publish Now';
    } else if (scheduleType === 'later' && scheduledAt) {
      return 'Schedule Post';
    }
    return 'Schedule Post';
  };

  const getMainButtonIcon = () => {
    if (scheduleType === 'now') {
      return <Send size={16} />;
    }
    return <Clock size={16} />;
  };

  const isMainButtonDisabled = () => {
    if (!isValid) return true;
    if (scheduleType === 'later' && !scheduledAt) return true;
    return false;
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-semibold mb-4">Schedule Post</h3>
      
      <div className="space-y-4">
        {/* Schedule Type Selection */}
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="scheduleType"
              value="now"
              checked={scheduleType === 'now'}
              onChange={() => handleScheduleTypeChange('now')}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">Publish now</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="scheduleType"
              value="later"
              checked={scheduleType === 'later'}
              onChange={() => handleScheduleTypeChange('later')}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">Schedule for later</span>
          </label>
        </div>

        {/* Date and Time Pickers */}
        {scheduleType === 'later' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={16} className="inline mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock size={16} className="inline mr-1" />
                  Time
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {scheduledAt && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Scheduled for:</strong> {formatScheduledDate(scheduledAt)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Publish Button Group */}
        <div className="pt-2 relative">
          <div className="flex">
            {/* Main Button */}
            <button
              onClick={() => handlePublishClick(scheduleType === 'now' ? 'now' : 'schedule')}
              disabled={isMainButtonDisabled()}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-l-lg font-medium transition-colors ${
                !isMainButtonDisabled()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {getMainButtonIcon()}
              <span>{getMainButtonText()}</span>
            </button>

            {/* Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={!isValid}
                className={`px-3 py-3 rounded-r-lg border-l border-blue-700 font-medium transition-colors ${
                  isValid
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ChevronDown size={16} />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && isValid && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handlePublishClick('now')}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Send size={16} className="mr-2" />
                      Publish Now
                    </button>
                    <button
                      onClick={() => handlePublishClick('schedule')}
                      disabled={scheduleType === 'later' && !scheduledAt}
                      className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                        scheduleType === 'later' && !scheduledAt
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Clock size={16} className="mr-2" />
                      Schedule Post
                    </button>
                    <button
                      onClick={() => handlePublishClick('draft')}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Edit3 size={16} className="mr-2" />
                      Save as Draft
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Validation Messages */}
        {!isValid && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            Please select at least one platform and add content to publish.
          </div>
        )}

        {scheduleType === 'later' && selectedDate && selectedTime && (
          <div className="text-xs text-gray-500">
            <p>• Posts will be published automatically at the scheduled time</p>
            <p>• You can edit or cancel scheduled posts from the queue</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulePicker;











































































// working code
// 'use client';

// import React, { useState } from 'react';
// import { Calendar, Clock, Send, Edit3, ChevronDown } from 'lucide-react';

// interface SchedulePickerProps {
//   onScheduleChange: (date: Date | null) => void;
//   onPublish: (publishType: 'now' | 'schedule' | 'draft', scheduledAt?: Date) => void;
//   scheduledAt: Date | null;
//   isValid: boolean;
// }

// const SchedulePicker: React.FC<SchedulePickerProps> = ({
//   onScheduleChange,
//   onPublish,
//   scheduledAt,
//   isValid
// }) => {
//   const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
//   const [selectedDate, setSelectedDate] = useState('');
//   const [selectedTime, setSelectedTime] = useState('');
//   const [showDropdown, setShowDropdown] = useState(false);

//   const handleScheduleTypeChange = (type: 'now' | 'later') => {
//     setScheduleType(type);
//     if (type === 'now') {
//       onScheduleChange(null);
//     } else {
//       updateScheduledDate();
//     }
//   };

//   const updateScheduledDate = () => {
//     if (selectedDate && selectedTime) {
//       const dateTime = new Date(`${selectedDate}T${selectedTime}`);
//       onScheduleChange(dateTime);
//     }
//   };

//   const handleDateChange = (date: string) => {
//     setSelectedDate(date);
//     if (date && selectedTime) {
//       const dateTime = new Date(`${date}T${selectedTime}`);
//       onScheduleChange(dateTime);
//     }
//   };

//   const handleTimeChange = (time: string) => {
//     setSelectedTime(time);
//     if (selectedDate && time) {
//       const dateTime = new Date(`${selectedDate}T${time}`);
//       onScheduleChange(dateTime);
//     }
//   };

//   const handlePublishClick = (type: 'now' | 'schedule' | 'draft') => {
//     setShowDropdown(false);
    
//     if (type === 'now') {
//       onPublish('now');
//     } else if (type === 'schedule') {
//       onPublish('schedule', scheduledAt || undefined);
//     } else if (type === 'draft') {
//       onPublish('draft');
//     }
//   };

//   const getMinDateTime = () => {
//     const now = new Date();
//     now.setMinutes(now.getMinutes() + 5); // Minimum 5 minutes from now
//     return now.toISOString().slice(0, 16);
//   };

//   const formatScheduledDate = (date: Date) => {
//     return date.toLocaleDateString('en-US', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const getMainButtonText = () => {
//     if (scheduleType === 'now') {
//       return 'Publish Now';
//     } else if (scheduleType === 'later' && scheduledAt) {
//       return 'Schedule Post';
//     }
//     return 'Schedule Post';
//   };

//   const getMainButtonIcon = () => {
//     if (scheduleType === 'now') {
//       return <Send size={16} />;
//     }
//     return <Clock size={16} />;
//   };

//   const isMainButtonDisabled = () => {
//     if (!isValid) return true;
//     if (scheduleType === 'later' && !scheduledAt) return true;
//     return false;
//   };

//   return (
//     <div className="bg-white rounded-lg border p-4">
//       <h3 className="font-semibold mb-4">Schedule Post</h3>
      
//       <div className="space-y-4">
//         {/* Schedule Type Selection */}
//         <div className="flex space-x-4">
//           <label className="flex items-center space-x-2 cursor-pointer">
//             <input
//               type="radio"
//               name="scheduleType"
//               value="now"
//               checked={scheduleType === 'now'}
//               onChange={() => handleScheduleTypeChange('now')}
//               className="w-4 h-4 text-blue-600"
//             />
//             <span className="text-sm">Publish now</span>
//           </label>
//           <label className="flex items-center space-x-2 cursor-pointer">
//             <input
//               type="radio"
//               name="scheduleType"
//               value="later"
//               checked={scheduleType === 'later'}
//               onChange={() => handleScheduleTypeChange('later')}
//               className="w-4 h-4 text-blue-600"
//             />
//             <span className="text-sm">Schedule for later</span>
//           </label>
//         </div>

//         {/* Date and Time Pickers */}
//         {scheduleType === 'later' && (
//           <div className="space-y-3">
//             <div className="grid grid-cols-2 gap-3">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   <Calendar size={16} className="inline mr-1" />
//                   Date
//                 </label>
//                 <input
//                   type="date"
//                   value={selectedDate}
//                   onChange={(e) => handleDateChange(e.target.value)}
//                   min={new Date().toISOString().split('T')[0]}
//                   className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   <Clock size={16} className="inline mr-1" />
//                   Time
//                 </label>
//                 <input
//                   type="time"
//                   value={selectedTime}
//                   onChange={(e) => handleTimeChange(e.target.value)}
//                   className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//             </div>

//             {scheduledAt && (
//               <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
//                 <p className="text-sm text-blue-800">
//                   <strong>Scheduled for:</strong> {formatScheduledDate(scheduledAt)}
//                 </p>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Publish Button Group */}
//         <div className="pt-2 relative">
//           <div className="flex">
//             {/* Main Button */}
//             <button
//               onClick={() => handlePublishClick(scheduleType === 'now' ? 'now' : 'schedule')}
//               disabled={isMainButtonDisabled()}
//               className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-l-lg font-medium transition-colors ${
//                 !isMainButtonDisabled()
//                   ? 'bg-blue-600 text-white hover:bg-blue-700'
//                   : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//               }`}
//             >
//               {getMainButtonIcon()}
//               <span>{getMainButtonText()}</span>
//             </button>

//             {/* Dropdown Button */}
//             <div className="relative">
//               <button
//                 onClick={() => setShowDropdown(!showDropdown)}
//                 disabled={!isValid}
//                 className={`px-3 py-3 rounded-r-lg border-l border-blue-700 font-medium transition-colors ${
//                   isValid
//                     ? 'bg-blue-600 text-white hover:bg-blue-700'
//                     : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                 }`}
//               >
//                 <ChevronDown size={16} />
//               </button>

//               {/* Dropdown Menu */}
//               {showDropdown && isValid && (
//                 <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
//                   <div className="py-1">
//                     <button
//                       onClick={() => handlePublishClick('now')}
//                       className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
//                     >
//                       <Send size={16} className="mr-2" />
//                       Publish Now
//                     </button>
//                     <button
//                       onClick={() => handlePublishClick('schedule')}
//                       disabled={scheduleType === 'later' && !scheduledAt}
//                       className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
//                         scheduleType === 'later' && !scheduledAt
//                           ? 'text-gray-400 cursor-not-allowed'
//                           : 'text-gray-700 hover:bg-gray-100'
//                       }`}
//                     >
//                       <Clock size={16} className="mr-2" />
//                       Schedule Post
//                     </button>
//                     <button
//                       onClick={() => handlePublishClick('draft')}
//                       className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
//                     >
//                       <Edit3 size={16} className="mr-2" />
//                       Save as Draft
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Validation Messages */}
//         {!isValid && (
//           <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
//             Please select at least one platform and add content to publish.
//           </div>
//         )}

//         {scheduleType === 'later' && selectedDate && selectedTime && (
//           <div className="text-xs text-gray-500">
//             <p>• Posts will be published automatically at the scheduled time</p>
//             <p>• You can edit or cancel scheduled posts from the queue</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SchedulePicker;
































































// 'use client';

// import React, { useState } from 'react';
// import { Calendar, Clock, Send } from 'lucide-react';

// interface SchedulePickerProps {
//   onScheduleChange: (date: Date | null) => void;
//   onPublish: (publishNow: boolean) => void;
//   scheduledAt: Date | null;
//   isValid: boolean;
// }

// const SchedulePicker: React.FC<SchedulePickerProps> = ({
//   onScheduleChange,
//   onPublish,
//   scheduledAt,
//   isValid
// }) => {
//   const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
//   const [selectedDate, setSelectedDate] = useState('');
//   const [selectedTime, setSelectedTime] = useState('');

//   const handleScheduleTypeChange = (type: 'now' | 'later') => {
//     setScheduleType(type);
//     if (type === 'now') {
//       onScheduleChange(null);
//     } else {
//       updateScheduledDate();
//     }
//   };

//   const updateScheduledDate = () => {
//     if (selectedDate && selectedTime) {
//       const dateTime = new Date(`${selectedDate}T${selectedTime}`);
//       onScheduleChange(dateTime);
//     }
//   };

//   const handleDateChange = (date: string) => {
//     setSelectedDate(date);
//     if (date && selectedTime) {
//       const dateTime = new Date(`${date}T${selectedTime}`);
//       onScheduleChange(dateTime);
//     }
//   };

//   const handleTimeChange = (time: string) => {
//     setSelectedTime(time);
//     if (selectedDate && time) {
//       const dateTime = new Date(`${selectedDate}T${time}`);
//       onScheduleChange(dateTime);
//     }
//   };

//   const getMinDateTime = () => {
//     const now = new Date();
//     now.setMinutes(now.getMinutes() + 5); // Minimum 5 minutes from now
//     return now.toISOString().slice(0, 16);
//   };

//   const formatScheduledDate = (date: Date) => {
//     return date.toLocaleDateString('en-US', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   return (
//     <div className="bg-white rounded-lg border p-4">
//       <h3 className="font-semibold mb-4">Schedule Post</h3>
      
//       <div className="space-y-4">
//         {/* Schedule Type Selection */}
//         <div className="flex space-x-4">
//           <label className="flex items-center space-x-2 cursor-pointer">
//             <input
//               type="radio"
//               name="scheduleType"
//               value="now"
//               checked={scheduleType === 'now'}
//               onChange={() => handleScheduleTypeChange('now')}
//               className="w-4 h-4 text-blue-600"
//             />
//             <span className="text-sm">Publish now</span>
//           </label>
//           <label className="flex items-center space-x-2 cursor-pointer">
//             <input
//               type="radio"
//               name="scheduleType"
//               value="later"
//               checked={scheduleType === 'later'}
//               onChange={() => handleScheduleTypeChange('later')}
//               className="w-4 h-4 text-blue-600"
//             />
//             <span className="text-sm">Schedule for later</span>
//           </label>
//         </div>

//         {/* Date and Time Pickers */}
//         {scheduleType === 'later' && (
//           <div className="space-y-3">
//             <div className="grid grid-cols-2 gap-3">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   <Calendar size={16} className="inline mr-1" />
//                   Date
//                 </label>
//                 <input
//                   type="date"
//                   value={selectedDate}
//                   onChange={(e) => handleDateChange(e.target.value)}
//                   min={new Date().toISOString().split('T')[0]}
//                   className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   <Clock size={16} className="inline mr-1" />
//                   Time
//                 </label>
//                 <input
//                   type="time"
//                   value={selectedTime}
//                   onChange={(e) => handleTimeChange(e.target.value)}
//                   className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//             </div>

//             {scheduledAt && (
//               <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
//                 <p className="text-sm text-blue-800">
//                   <strong>Scheduled for:</strong> {formatScheduledDate(scheduledAt)}
//                 </p>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Publish Button */}
//         <div className="pt-2">
//           <button
//             onClick={() => onPublish(scheduleType === 'now')}
//             disabled={!isValid || (scheduleType === 'later' && !scheduledAt)}
//             className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
//               isValid && (scheduleType === 'now' || scheduledAt)
//                 ? 'bg-blue-600 text-white hover:bg-blue-700'
//                 : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//             }`}
//           >
//             <Send size={16} />
//             <span>
//               {scheduleType === 'now' ? 'Publish Now' : 'Schedule Post'}
//             </span>
//           </button>
//         </div>

//         {/* Validation Messages */}
//         {!isValid && (
//           <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
//             Please select at least one platform and add content to publish.
//           </div>
//         )}

//         {scheduleType === 'later' && selectedDate && selectedTime && (
//           <div className="text-xs text-gray-500">
//             <p>• Posts will be published automatically at the scheduled time</p>
//             <p>• You can edit or cancel scheduled posts from the queue</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SchedulePicker;