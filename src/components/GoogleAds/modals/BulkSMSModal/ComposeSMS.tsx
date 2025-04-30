"use client";
import React, { useState, useEffect } from 'react';
import { ChevronDown, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

interface ComposeSMSProps {
  onSubmit: (data: {
    senderName: string;
    phoneNumbers: string;
    country: string;
    message: string;
    sendOption: 'now' | 'schedule';
    scheduleDate?: string;
    scheduleTime?: string;
  }) => void;
  onSaveDraft?: (data: {
    senderName: string;
    phoneNumbers: string;
    country: string;
    message: string;
    sendOption: 'now' | 'schedule';
    scheduleDate?: string;
    scheduleTime?: string;
  }) => void;
  initialData: {
    senderName: string;
    phoneNumbers: string;
    country: string;
    message: string;
    sendOption: 'now' | 'schedule';
    scheduleDate?: string;
    scheduleTime?: string;
  };
}

// Countries with their codes
const countries = [
  { name: "Nigeria", code: "+234" },
  { name: "United States", code: "+1" },
  { name: "United Kingdom", code: "+44" },
  { name: "South Africa", code: "+27" },
  { name: "Ghana", code: "+233" },
  { name: "Kenya", code: "+254" },
  { name: "Canada", code: "+1" },
  { name: "India", code: "+91" },
];

const ComposeSMS: React.FC<ComposeSMSProps> = ({ onSubmit, onSaveDraft, initialData }) => {
  const [senderName, setSenderName] = useState(initialData.senderName);
  const [phoneNumbers, setPhoneNumbers] = useState(initialData.phoneNumbers);
  const [country, setCountry] = useState(initialData.country);
  const [countryCode, setCountryCode] = useState("+000");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [message, setMessage] = useState(initialData.message);
  const [sendOption, setSendOption] = useState<'now' | 'schedule'>(initialData.sendOption);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scheduleDate, setScheduleDate] = useState(initialData.scheduleDate || '');
  const [scheduleTime, setScheduleTime] = useState(initialData.scheduleTime || '');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialData.scheduleDate ? new Date(initialData.scheduleDate) : undefined
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      
      // Read the file content and update phoneNumbers
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // Parse CSV or TXT content
        const numbers = content
          .split(/[,\n]/)
          .map(num => num.trim())
          .filter(num => num.length > 0)
          .join(', ');
        setPhoneNumbers(numbers);
      };
      reader.readAsText(file);
    }
  };

  // Update form when initialData changes
  useEffect(() => {
    setSenderName(initialData.senderName);
    setPhoneNumbers(initialData.phoneNumbers);
    setCountry(initialData.country);
    setMessage(initialData.message);
    setSendOption(initialData.sendOption);
    setScheduleDate(initialData.scheduleDate || '');
    setScheduleTime(initialData.scheduleTime || '');

    // Update selected date for the calendar
    if (initialData.scheduleDate) {
      setSelectedDate(new Date(initialData.scheduleDate));
    }

    // Set country code if country is set in initialData
    if (initialData.country) {
      const selectedCountry = countries.find(c => c.name === initialData.country);
      if (selectedCountry) {
        setCountryCode(selectedCountry.code);
      }
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submissionData = {
      senderName,
      phoneNumbers,
      country,
      message,
      sendOption,
      ...(sendOption === 'schedule' ? { scheduleDate, scheduleTime } : {})
    };
    
    onSubmit(submissionData);
  };

  const handleSaveDraft = () => {
    const draftData = {
      senderName,
      phoneNumbers,
      country,
      message,
      sendOption,
      ...(sendOption === 'schedule' ? { scheduleDate, scheduleTime } : {})
    };
    
    if (onSaveDraft) {
      onSaveDraft(draftData);
    } else {
      // Fallback to regular submit if onSaveDraft not provided
      onSubmit(draftData);
    }
  };

  const handleSelectCountry = (countryName: string, countryCode: string) => {
    setCountry(countryName);
    setCountryCode(countryCode);
    setIsCountryDropdownOpen(false);
  };

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setScheduleDate(format(date, 'yyyy-MM-dd'));
    }
  };

  // Clear file and make sure phoneNumbers remains editable
  const handleClearFile = () => {
    setUploadedFile(null);
    // Don't clear phoneNumbers so user can still edit manually
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label htmlFor="senderName" className="block text-sm font-medium text-gray-700 mb-1">
              Sender name
            </label>
            <input
              type="text"
              id="senderName"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-1">
              Choose a file to upload (CSV, TXT)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                id="fileUpload"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="fileUpload"
                className="cursor-pointer flex-1 border border-gray-300 rounded-md px-3 py-2 inline-block text-center"
              >
                {uploadedFile ? uploadedFile.name : "Choose File"}
              </label>
              {uploadedFile && (
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="text-red-500 hover:text-red-700"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Upload a file with phone numbers or type them manually below
            </p>
          </div>

          <div>
            <label htmlFor="phoneNumbers" className="block text-sm font-medium text-gray-700 mb-1">
              Recipients' Phone numbers
            </label>
            <textarea
              id="phoneNumbers"
              value={phoneNumbers}
              onChange={(e) => setPhoneNumbers(e.target.value)}
              placeholder="Enter 080..., 080... or 23480..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="radio"
                id="sendNow"
                checked={sendOption === 'now'}
                onChange={() => setSendOption('now')}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
              />
              <label htmlFor="sendNow" className="ml-2 block text-sm text-gray-700">
                Send now
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="scheduleLater"
                checked={sendOption === 'schedule'}
                onChange={() => setSendOption('schedule')}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
              />
              <label htmlFor="scheduleLater" className="ml-2 block text-sm text-gray-700">
                Schedule (Auto-send later)
              </label>
            </div>
            
            {/* Schedule Date & Time Selection */}
            {sendOption === 'schedule' && (
              <div className="mt-4 p-4 border border-gray-200 rounded-md space-y-3">
                <div>
                  <label htmlFor="scheduleDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule Date
                  </label>
                  <div className="relative">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal border border-gray-300 text-gray-700"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                            </span>
                            <CalendarIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          initialFocus
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </PopoverContent>
                    </Popover>
                    <input
                      type="hidden"
                      id="scheduleDate"
                      value={scheduleDate}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="scheduleTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule Time
                  </label>
                  <input
                    type="time"
                    id="scheduleTime"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <div className="flex relative">
              <div className="bg-teal-500 text-white flex items-center justify-center px-4 rounded-l-md">
                {countryCode}
              </div>
              <button
                type="button"
                className="w-full bg-gray-100 text-left px-4 py-2 rounded-r-md flex items-center justify-between"
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              >
                <span className="text-gray-700">
                  {country || "Choose your Country"}
                </span>
                <ChevronDown className="h-5 w-5 text-gray-500" />
              </button>

              {/* Country dropdown */}
              {isCountryDropdownOpen && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {countries.map((countryItem) => (
                    <div
                      key={countryItem.name}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                      onClick={() => handleSelectCountry(countryItem.name, countryItem.code)}
                    >
                      <span>{countryItem.name}</span>
                      <span className="text-gray-500">{countryItem.code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Compose Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="text-sm text-gray-500 mt-1">
              {message.length} characters / {Math.ceil(message.length / 160)} pages
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Save Draft
        </Button>
        <Button
          onClick={handleSubmit}
          className="px-6 py-2 bg-teal-500 text-white hover:bg-teal-600"
        >
          {sendOption === 'schedule' ? 'Schedule' : 'Send'}
        </Button>
      </div>
    </div>
  );
};

export default ComposeSMS;


















































// "use client";
// import React, { useState, useEffect } from 'react';
// import { ChevronDown } from 'lucide-react';
// import { Button } from "@/components/ui/button";

// interface ComposeSMSProps {
//   onSubmit: (data: {
//     senderName: string;
//     phoneNumbers: string;
//     country: string;
//     message: string;
//     sendOption: 'now' | 'schedule';
//   }) => void;
//   initialData: {
//     senderName: string;
//     phoneNumbers: string;
//     country: string;
//     message: string;
//     sendOption: 'now' | 'schedule';
//   };
// }

// // Countries with their codes
// const countries = [
//   { name: "Nigeria", code: "+234" },
//   { name: "United States", code: "+1" },
//   { name: "United Kingdom", code: "+44" },
//   { name: "South Africa", code: "+27" },
//   { name: "Ghana", code: "+233" },
//   { name: "Kenya", code: "+254" },
//   { name: "Canada", code: "+1" },
//   { name: "India", code: "+91" },
// ];

// const ComposeSMS: React.FC<ComposeSMSProps> = ({ onSubmit, initialData }) => {
//   const [senderName, setSenderName] = useState(initialData.senderName);
//   const [phoneNumbers, setPhoneNumbers] = useState(initialData.phoneNumbers);
//   const [country, setCountry] = useState(initialData.country);
//   const [countryCode, setCountryCode] = useState("+000");
//   const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
//   const [message, setMessage] = useState(initialData.message);
//   const [sendOption, setSendOption] = useState<'now' | 'schedule'>(initialData.sendOption);
//   const [uploadedFile, setUploadedFile] = useState<File | null>(null);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       setUploadedFile(e.target.files[0]);
//     }
//   };

//   // Update form when initialData changes
//   useEffect(() => {
//     setSenderName(initialData.senderName);
//     setPhoneNumbers(initialData.phoneNumbers);
//     setCountry(initialData.country);
//     setMessage(initialData.message);
//     setSendOption(initialData.sendOption);

//     // Set country code if country is set in initialData
//     if (initialData.country) {
//       const selectedCountry = countries.find(c => c.name === initialData.country);
//       if (selectedCountry) {
//         setCountryCode(selectedCountry.code);
//       }
//     }
//   }, [initialData]);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onSubmit({
//       senderName,
//       phoneNumbers,
//       country,
//       message,
//       sendOption,
//     });
//   };

//   const handleSaveDraft = () => {
//     // Logic for saving draft
//     // For now, just submit with current data
//     onSubmit({
//       senderName,
//       phoneNumbers,
//       country,
//       message,
//       sendOption,
//     });
//   };

//   const handleSelectCountry = (countryName: string, countryCode: string) => {
//     setCountry(countryName);
//     setCountryCode(countryCode);
//     setIsCountryDropdownOpen(false);
//   };


//   return (
//     <div>
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* Left Column */}
//         <div className="space-y-4">
//           <div>
//             <label htmlFor="senderName" className="block text-sm font-medium text-gray-700 mb-1">
//               Sender name
//             </label>
//             <input
//               type="text"
//               id="senderName"
//               value={senderName}
//               onChange={(e) => setSenderName(e.target.value)}
//               className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
//             />
//           </div>

//           <div>
//             <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-1">
//               Choose a file to upload (CSV, TXT)
//             </label>
//             <input
//               type="file"
//               id="fileUpload"
//               accept=".csv,.txt"
//               onChange={handleFileChange}
//               className="hidden"
//             />
//             <label
//               htmlFor="fileUpload"
//               className="cursor-pointer w-full border border-gray-300 rounded-md px-3 py-2 inline-block text-center"
//             >
//               {uploadedFile ? uploadedFile.name : "Choose File"}
//             </label>
//           </div>

//           <div>
//             <label htmlFor="phoneNumbers" className="block text-sm font-medium text-gray-700 mb-1">
//               Recipients' Phone numbers
//             </label>
//             <textarea
//               id="phoneNumbers"
//               value={phoneNumbers}
//               onChange={(e) => setPhoneNumbers(e.target.value)}
//               placeholder="Enter 080..., 080... or 23480..."
//               className="w-full border border-gray-300 rounded-md px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-teal-500"
//             />
//           </div>

//           <div className="space-y-2">
//             <div className="flex items-center">
//               <input
//                 type="radio"
//                 id="sendNow"
//                 checked={sendOption === 'now'}
//                 onChange={() => setSendOption('now')}
//                 className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
//               />
//               <label htmlFor="sendNow" className="ml-2 block text-sm text-gray-700">
//                 Send now
//               </label>
//             </div>
//             <div className="flex items-center">
//               <input
//                 type="radio"
//                 id="scheduleLater"
//                 checked={sendOption === 'schedule'}
//                 onChange={() => setSendOption('schedule')}
//                 className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
//               />
//               <label htmlFor="scheduleLater" className="ml-2 block text-sm text-gray-700">
//                 Schedule (Auto-send later)
//               </label>
//             </div>
//           </div>
//         </div>

//         {/* Right Column */}
//         <div className="space-y-4">
//           <div>
//             <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
//               Country
//             </label>
//             <div className="flex relative">
//               <div className="bg-teal-500 text-white flex items-center justify-center px-4 rounded-l-md">
//                 {countryCode}
//               </div>
//               <button
//                 type="button"
//                 className="w-full bg-gray-100 text-left px-4 py-2 rounded-r-md flex items-center justify-between"
//                 onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
//               >
//                 <span className="text-gray-700">
//                   {country || "Choose your Country"}
//                 </span>
//                 <ChevronDown className="h-5 w-5 text-gray-500" />
//               </button>

//               {/* Country dropdown */}
//               {isCountryDropdownOpen && (
//                 <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
//                   {countries.map((countryItem) => (
//                     <div
//                       key={countryItem.name}
//                       className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
//                       onClick={() => handleSelectCountry(countryItem.name, countryItem.code)}
//                     >
//                       <span>{countryItem.name}</span>
//                       <span className="text-gray-500">{countryItem.code}</span>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>

//           <div>
//             <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
//               Compose Message
//             </label>
//             <textarea
//               id="message"
//               value={message}
//               onChange={(e) => setMessage(e.target.value)}
//               className="w-full border border-gray-300 rounded-md px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-teal-500"
//             />
//           </div>
//         </div>
//       </div>

//       <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
//         <Button
//           variant="outline"
//           onClick={handleSaveDraft}
//           className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
//         >
//           Save Draft
//         </Button>
//         <Button
//           onClick={handleSubmit}
//           className="px-6 py-2 bg-teal-500 text-white hover:bg-teal-600"
//         >
//           Send
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default ComposeSMS;