// components/DisplayCampaignCreatives.tsx

"use client";
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DisplayCampaignCreativesProps {
  isOpen: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: (creativeData: CreativeData) => void;
}

interface CreativeData {
  displayType: 'websites' | 'behaviours';
  behaviour?: string;
  websiteCategory?: string;
  secondaryCategory?: string;
}

const DisplayCampaignCreatives: React.FC<DisplayCampaignCreativesProps> = ({
  isOpen,
  onClose,
  onPrevious,
  onNext,
}) => {
  const [displayType, setDisplayType] = useState<'websites' | 'behaviours'>('websites');
  const [behaviour, setBehaviour] = useState('');
  const [websiteCategory, setWebsiteCategory] = useState<string>('installed_apps');
  const [secondaryCategory, setSecondaryCategory] = useState<string>('');

  const handleDisplayTypeChange = (type: 'websites' | 'behaviours') => {
    setDisplayType(type);
  };

  const handleSubmit = () => {
    const creativeData: CreativeData = {
      displayType,
      behaviour: displayType === 'behaviours' ? behaviour : undefined,
      websiteCategory: displayType === 'websites' ? websiteCategory : undefined,
      secondaryCategory: displayType === 'websites' ? secondaryCategory : undefined,
    };
    onNext(creativeData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl h-[450px]">
        <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Display campaign</DialogTitle>
                <div className="mt-2 w-full bg-gray-200 h-2 rounded-full">
                    <div className="bg-teal-500 h-2 rounded-full w-4/6"></div>
                </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <h2 className="text-lg">Display your ad in websites or based on behaviours</h2>
          
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span 
              className={`cursor-pointer ${displayType === 'websites' ? 'font-semibold' : 'text-gray-500'}`}
              onClick={() => handleDisplayTypeChange('websites')}
            >
              Specific websites
            </span>
            
            <div className="relative inline-block w-16 h-8">
              <input 
                type="checkbox" 
                className="opacity-0 w-0 h-0"
                checked={displayType === 'behaviours'}
                onChange={() => handleDisplayTypeChange(displayType === 'websites' ? 'behaviours' : 'websites')}
                id="toggle"
              />
              <label 
                htmlFor="toggle"
                className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full ${displayType === 'behaviours' ? 'bg-teal-500' : 'bg-gray-300'}`}
              >
                <span 
                  className={`absolute h-6 w-6 left-1 bottom-1 bg-white rounded-full transition-transform duration-300 ${displayType === 'behaviours' ? 'transform translate-x-8' : ''}`}
                ></span>
                {displayType === 'websites' && (
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-white">★</span>
                )}
              </label>
            </div>
            
            <span 
              className={`cursor-pointer ${displayType === 'behaviours' ? 'font-semibold' : 'text-gray-500'}`}
              onClick={() => handleDisplayTypeChange('behaviours')}
            >
              based on behaviours
            </span>
          </div>
          
          {displayType === 'behaviours' ? (
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="flex-1 mr-2">
                  <Select onValueChange={setWebsiteCategory} value={websiteCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Installed apps" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="installed_apps">Installed apps</SelectItem>
                      <SelectItem value="shopping">Shopping sites</SelectItem>
                      <SelectItem value="news">News sites</SelectItem>
                      <SelectItem value="social">Social media</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Label className="mx-2 text-gray-500">or/and</Label>
                
                <div className="flex-1 ml-2">
                  <Select onValueChange={setSecondaryCategory} value={secondaryCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Recent search on the Web</SelectItem>
                      <SelectItem value="option2">Interests based on site visits</SelectItem>
                      {/* <SelectItem value="option3">Option 3</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={behaviour}
                  onChange={(e) => setBehaviour(e.target.value)}
                  placeholder="Enter the a user behaviour"
                  className="flex-1"
                />
                <Button 
                  onClick={handleSubmit} 
                  className="bg-teal-500 hover:bg-teal-500 min-w-12"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
          <Button
            variant="outline" 
            onClick={onPrevious}
            className="text-gray-700"
          >
            previous
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-teal-500 hover:bg-teal-600 text-white px-8"
          >
            Next
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DisplayCampaignCreatives;
























// components/DisplayCampaignCreatives.tsx

// "use client";
// import React, { useState } from 'react';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

// interface DisplayCampaignCreativesProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onPrevious: () => void;
//   onNext: (creativeData: CreativeData) => void;
// }

// interface CreativeData {
//   displayType: 'websites' | 'behaviours';
//   websites?: string[];
//   behaviours?: string[];
// }

// const DisplayCampaignCreatives: React.FC<DisplayCampaignCreativesProps> = ({
//   isOpen,
//   onClose,
//   onPrevious,
//   onNext,
// }) => {
//   const [displayType, setDisplayType] = useState<'websites' | 'behaviours'>('websites');
//   const [behaviour, setBehaviour] = useState('');
//   const [behaviours, setBehaviours] = useState<string[]>([]);
//   const [website, setWebsite] = useState('');
//   const [websites, setWebsites] = useState<string[]>([]);

//   const handleDisplayTypeChange = (type: 'websites' | 'behaviours') => {
//     setDisplayType(type);
//   };

//   const handleAddBehaviour = () => {
//     if (behaviour.trim()) {
//       setBehaviours([...behaviours, behaviour.trim()]);
//       setBehaviour('');
//     }
//   };

//   const handleAddWebsite = () => {
//     if (website.trim()) {
//       setWebsites([...websites, website.trim()]);
//       setWebsite('');
//     }
//   };

//   const handleSubmit = () => {
//     const creativeData: CreativeData = {
//       displayType,
//       websites: displayType === 'websites' ? websites : undefined,
//       behaviours: displayType === 'behaviours' ? behaviours : undefined,
//     };
//     onNext(creativeData);
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[600px]">
//         <DialogHeader>
//           <DialogTitle>Display campaign</DialogTitle>
//         </DialogHeader>
        
//         <div className="py-4">
//           <h2 className="text-xl font-semibold mb-4">Display your ad in websites or based on behaviours</h2>
          
//           <div className="flex space-x-4 mb-6">
//             <button
//               onClick={() => handleDisplayTypeChange('websites')}
//               className={`px-4 py-2 rounded-md ${
//                 displayType === 'websites' 
//                   ? 'bg-blue-900 text-white' 
//                   : 'bg-gray-200 text-gray-800'
//               }`}
//             >
//               Specific websites
//             </button>
            
//             <button
//               onClick={() => handleDisplayTypeChange('behaviours')}
//               className={`px-4 py-2 rounded-md ${
//                 displayType === 'behaviours' 
//                   ? 'bg-blue-900 text-white' 
//                   : 'bg-gray-200 text-gray-800'
//               }`}
//             >
//               based on behaviours
//             </button>
//           </div>
          
//           {displayType === 'websites' ? (
//             <div className="space-y-4">
//               <div className="flex space-x-2">
//                 <Input
//                   value={website}
//                   onChange={(e) => setWebsite(e.target.value)}
//                   placeholder="Enter website URL"
//                 />
//                 <Button onClick={handleAddWebsite}>Add</Button>
//               </div>
              
//               {websites.length > 0 && (
//                 <div className="mt-4">
//                   <h3 className="font-medium mb-2">Selected websites:</h3>
//                   <ul className="list-disc pl-5">
//                     {websites.map((site, index) => (
//                       <li key={index}>{site}</li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//             </div>
//           ) : (
//             <div className="space-y-4">
//               <div className="flex space-x-2">
//                 <Input
//                   value={behaviour}
//                   onChange={(e) => setBehaviour(e.target.value)}
//                   placeholder="Enter a user behaviour"
//                 />
//                 <Button onClick={handleAddBehaviour} className="bg-blue-900">
//                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
//                   </svg>
//                 </Button>
//               </div>
              
//               {behaviours.length > 0 && (
//                 <div className="mt-4">
//                   <h3 className="font-medium mb-2">Selected behaviours:</h3>
//                   <ul className="list-disc pl-5">
//                     {behaviours.map((b, index) => (
//                       <li key={index}>{b}</li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
        
//         <div className="flex justify-between mt-6">
//           <Button variant="outline" onClick={onPrevious}>
//             previous
//           </Button>
//           <Button className="bg-blue-900" onClick={handleSubmit}>
//             Next
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default DisplayCampaignCreatives;