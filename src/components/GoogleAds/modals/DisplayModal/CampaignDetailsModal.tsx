// components/CampaignDetailsModal.tsx

"use client";
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, Clock, Eye, MousePointer, DollarSign, 
  BarChart2, Users, MapPin, ImageIcon, 
  ChevronDown, PlusCircle 
} from 'lucide-react';
import Image from 'next/image';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, } from 'recharts';

// Define interface for campaign details
interface DisplayCampaign {
  id: string;
  name: string;
  date: string;
  imageUrl: string;
  impressions: string;
  clicks: string;
  conversions: string;
  status: 'active' | 'paused' | 'ended';
  budget: {
    initial: number;
    consumed: number;
  };
  performanceData: Array<{
    date: string;
    clicks: number;
    impressions: number;
  }>;
}

interface CampaignDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: DisplayCampaign;
}

const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  campaign 
}) => {
  const [selectedBudgetMetric, setSelectedBudgetMetric] = useState('Budget Consumed');

  
  // Safe calculations with default values
  const budgetConsumed = campaign.budget?.consumed ?? 0;
  const budgetInitial = campaign.budget?.initial ?? 0;
  const impressions = parseInt(campaign.impressions) || 0;
  const clicks = parseInt(campaign.clicks) || 0;

  // Calculate CTR
  const ctr = ((parseInt(campaign.clicks) / parseInt(campaign.impressions)) * 100).toFixed(2);

  // Default performance data if not provided
  const performanceData = campaign.performanceData ?? [
    { date: 'Day 1', clicks: 50, impressions: 1000 },
    { date: 'Day 2', clicks: 32, impressions: 3423 },
    { date: 'Day 3', clicks: 343, impressions: 1003 },
  ];

// Geographic Map

const genderData = [
  { category: 'Men', percentage: 45 },
  { category: 'Women', percentage: 30 },
  { category: 'Others', percentage: 25 }
];


// Ad Review
const clickData = [
  { size: '336x280', clicks: 29 },
  { size: '300x600', clicks: 16 },
  { size: '300x250', clicks: 9 },
  { size: '728x90', clicks: 2 },
  { size: '336x280', clicks: 29 }
];

const impressionData = [
  { size: '336x280', impressions: 30 },
  { size: '300x600', impressions: 25 },
  { size: '300x250', impressions: 18 },
  { size: '728x90', impressions: 10 },
  { size: '336x280', impressions: 22 }
];

  // const campaignData: DisplayCampaign = {
  //   id: '1',
  //   name: 'Sample Campaign',
  //   date: '2024-03-26',
  //   impressions: '12400',
  //   clicks: '129',
  //   conversions: '10',
  //   status: 'active',
  //   budget: {
  //     initial: 4.31,
  //     consumed: 4.31
  //   },
  //   performanceData: [
  //     { date: 'Day 1', clicks: 50, impressions: 1000 },
  //     { date: 'Day 2', clicks: 79, impressions: 1200 },
  //     { date: 'Day 3', clicks: 23, impressions: 1200 }
  //     // Add more data points
  //   ]
  // };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0 overflow-hidden">
        <div className="grid grid-cols-12 h-full">
          {/* Left Sidebar - Campaign Summary */}
           <div className="col-span-3 bg-gray-50 border-r p-6 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
               <h2 className="text-xl font-semibold">{campaign.name}</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
               </button>
            </div>
            
             <div className="flex items-center text-sm text-gray-500 space-x-2">
               <Clock className="h-4 w-4" />
               <span>{campaign.date}</span>
            </div>

             {campaign.imageUrl && (
              <div className="rounded-lg overflow-hidden shadow-md">
                <Image
                  src={campaign.imageUrl}
                  alt={campaign.name}
                  width={300}
                  height={200}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border rounded-lg p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Eye className="h-4 w-4 mr-2 text-purple-500" />
                  <div className="text-xs text-gray-500 truncate">Impressions</div>
                </div>
                <div className="font-bold text-purple-600">{campaign.impressions}</div>
              </div>
              <div className="bg-white border rounded-lg p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <MousePointer className="h-4 w-4 mr-2 text-yellow-500" />
                  <div className="text-xs text-gray-500 truncate">Clicks</div>
                </div>
                <div className="font-bold text-yellow-600">{campaign.clicks}</div>
              </div>
              <div className="bg-white border rounded-lg p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                  <div className="text-xs text-gray-500 truncate">Conversions</div>
                </div>
                <div className="font-bold text-green-600">{campaign.conversions}</div>
              </div>
            </div>

             {/* Budget and CTR Dropdown */}
             <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full">
                  <div className="flex items-center justify-between bg-white border rounded-lg p-3">
                    <div className="flex items-center">
                      <PlusCircle className="h-4 w-4 mr-2 text-blue-500" />
                      <span>{selectedBudgetMetric}</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedBudgetMetric('Budget Consumed')}>
                    Budget Consumed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedBudgetMetric('CTR')}>
                    CTR
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Metric Display */}
              <div className="mt-2 bg-white border rounded-lg p-3 text-center">
                {selectedBudgetMetric === 'Budget Consumed' ? (
                  <div>
                    <div className="text-xs text-gray-500">Budget Consumed</div>
                    <div className="font-bold text-blue-600">
                      {/* ${campaign.budget.consumed.toFixed(2)} */}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs text-gray-500">Click-Through Rate</div>
                    <div className="font-bold text-green-600">
                      {ctr}%
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border rounded-lg p-3">
              <div className="text-sm font-medium mb-2">Campaign Status</div>
              <div className={`
                py-1 px-2 rounded-full text-xs text-center font-semibold
                ${campaign.status === 'active' ? 'bg-green-100 text-green-700' : 
                  campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-red-100 text-red-700'}
              `}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </div>
            </div>
          </div>


          
          {/* Main Content - Performance Details */}
          <div className="col-span-9 overflow-y-auto">
            <Tabs defaultValue="performance" className="h-full flex flex-col">
              <TabsList className="bg-white px-6 py-3 flex justify-start space-x-4 mt-4">
                <TabsTrigger 
                    value="performance" 
                    className="flex items-center space-x-2 data-[state=active]:bg-gray-100 px-3 py-1.5 rounded"
                  >
                    <BarChart2 className="h-4 w-4" />
                    <span>Performance</span>
                </TabsTrigger>
                <TabsTrigger 
                    value="demographics" 
                    className="flex items-center space-x-2 data-[state=active]:bg-gray-100 px-3 py-1.5 rounded"
                  >
                    <Users className="h-4 w-4" />
                    <span>Demographics</span>
                </TabsTrigger>
                <TabsTrigger 
                    value="locations" 
                    className="flex items-center space-x-2 data-[state=active]:bg-gray-100 px-3 py-1.5 rounded"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Locations</span>
                </TabsTrigger>
                <TabsTrigger 
                    value="preview" 
                    className="flex items-center space-x-2 data-[state=active]:bg-gray-100 px-3 py-1.5 rounded"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>Ad Preview</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="performance" className="p-6 flex-1">
              <div className="bg-white border rounded-lg p-6 h-full flex flex-col">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2 text-teal-500" />
                  Campaign Performance
                </h3>
                <ResponsiveContainer width="100%" height="80%" className="mt-auto">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="clicks" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="impressions" 
                      stroke="#82ca9d" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              </TabsContent>

              <TabsContent value="demographics" className="p-6 flex-1">
                <div className="bg-white border rounded-lg p-6 h-full flex flex-col">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                     <Users className="h-5 w-5 mr-2 text-teal-500" />
                     Demographic Data
                   </h3>
                  <Tabs defaultValue="gender" className="h-full">
                    <TabsList>
                      <TabsTrigger value="gender">Gender</TabsTrigger>
                      <TabsTrigger value="behavior">Behavior</TabsTrigger>
                      <TabsTrigger value="age">Age</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="gender" className="mt-auto">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart 
                          data={genderData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="percentage" fill="#6366f1" />
                        </BarChart>
                      </ResponsiveContainer>
                    </TabsContent>
                    
                    {/* Placeholder for other tabs */}
                    <TabsContent value="behavior" className="mt-4">
                      <div className="text-center text-gray-500">Behavior data coming soon</div>
                    </TabsContent>
                    
                    <TabsContent value="age" className="mt-4">
                      <div className="text-center text-gray-500">Age distribution data coming soon</div>
                    </TabsContent>  
                  </Tabs>
                </div>
              </TabsContent>

              <TabsContent value="locations" className="p-6 flex-1">
                <div className="bg-white border rounded-lg p-6 h-full">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                     <MapPin className="h-5 w-5 mr-2 text-teal-500" />
                     Display Location
                   </h3>
                  <Tabs defaultValue="websites">
                    <TabsList>
                      <TabsTrigger value="websites">Websites</TabsTrigger>
                      <TabsTrigger value="geographic">Geographic Zone</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="websites" className="mt-4">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-3 text-left">Type</th>
                            <th className="p-3 text-left">Name</th>
                            <th className="p-3 text-right">Clicks</th>
                            <th className="p-3 text-right">Cost</th>
                            <th className="p-3 text-right">Impressions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {['www.example.com', 'www.another-site.com', 'www.third-site.com'].map((site, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3">Website</td>
                              <td className="p-3">{site}</td>
                              <td className="p-3 text-right">{campaign.clicks}</td>
                              <td className="p-3 text-right">$12</td>
                              <td className="p-3 text-right">{campaign.impressions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </TabsContent>

                    <TabsContent value="geographic" className="mt-4">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-3 text-left">Type</th>
                            <th className="p-3 text-left">Name</th>
                            <th className="p-3 text-right">Clicks</th>
                            <th className="p-3 text-right">Cost</th>
                            <th className="p-3 text-right">Impressions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {['Senegal', 'Guinea', 'Benin', 'Ivory Coast', 'Burkina Faso', 'Gabon'].map((country, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3">Country</td>
                              <td className="p-3">{country}</td>
                              <td className="p-3 text-right">21</td>
                              <td className="p-3 text-right">$12</td>
                              <td className="p-3 text-right">120</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="p-6 flex-1">
                <div className="bg-white border rounded-lg p-6 h-full">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2 text-teal-500" />
                    Ad Previews
                  </h3>

                  <Tabs defaultValue="clicks">
                    <TabsList>
                      <TabsTrigger value="clicks">Clicks</TabsTrigger>
                      <TabsTrigger value="impressions">Impressions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="clicks">
                      <div className="grid grid-cols-3 gap-4 mt-7">
                        {clickData.map((item, index) => (
                          <div 
                            key={index} 
                            className="border rounded-lg p-4 text-center bg-gray-50 hover:shadow-md transition-shadow"
                          >
                            <div className="text-sm text-gray-500 mb-2">{item.size}</div>
                            <div className="bg-white border rounded h-40 flex items-center justify-center flex-col">
                              <span className="text-2xl font-bold text-blue-600">{item.clicks}</span>
                              <span className="text-sm text-gray-500">Clicks</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="impressions">
                      <div className="grid grid-cols-3 gap-4 mt-7">
                        {impressionData.map((item, index) => (
                          <div 
                            key={index} 
                            className="border rounded-lg p-4 text-center bg-gray-50 hover:shadow-md transition-shadow"
                          >
                            <div className="text-sm text-gray-500 mb-2">{item.size}</div>
                            <div className="bg-white border rounded h-40 flex items-center justify-center flex-col">
                              <span className="text-2xl font-bold text-green-600">{item.impressions}</span>
                              <span className="text-sm text-gray-500">Impressions</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>

              {/* Rest of the existing code */}
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignDetailsModal;






























// components/CampaignDetailsModal.tsx

// "use client";
// import React from 'react';
// import { Dialog, DialogContent } from '@/components/ui/dialog';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { 
//   X, Clock, Eye, MousePointer, DollarSign, 
//   BarChart2, Users, MapPin, ImageIcon 
// } from 'lucide-react';
// import Image from 'next/image';

// // Define interface for campaign details
// interface DisplayCampaign {
//   id: string;
//   name: string;
//   date: string;
//   imageUrl: string;
//   impressions: string;
//   clicks: string;
//   conversions: string;
//   status: 'active' | 'paused' | 'ended';
// }

// interface CampaignDetailsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   campaign: DisplayCampaign;
// }

// const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({ 
//   isOpen, 
//   onClose, 
//   campaign 
// }) => {
//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
//       <DialogContent className="max-w-6xl w-full h-[90vh] p-0 overflow-hidden">
//         <div className="grid grid-cols-12 h-full">
//           {/* Left Sidebar - Campaign Summary */}
//           <div className="col-span-3 bg-gray-50 border-r p-6 overflow-y-auto space-y-6">
//             <div className="flex justify-between items-center">
//               <h2 className="text-xl font-semibold">{campaign.name}</h2>
//               <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
//                 <X className="h-6 w-6" />
//               </button>
//             </div>
            
//             <div className="flex items-center text-sm text-gray-500 space-x-2">
//               <Clock className="h-4 w-4" />
//               <span>{campaign.date}</span>
//             </div>

//             {campaign.imageUrl && (
//               <div className="rounded-lg overflow-hidden shadow-md">
//                 <Image
//                   src={campaign.imageUrl}
//                   alt={campaign.name}
//                   width={300}
//                   height={200}
//                   className="w-full h-auto object-cover"
//                 />
//               </div>
//             )}

//             <div className="grid grid-cols-3 gap-3">
//               <div className="bg-white border rounded-lg p-3 text-center">
//                 <div className="flex items-center justify-center mb-1">
//                   <Eye className="h-4 w-4 mr-2 text-purple-500" />
//                   <div className="text-xs text-gray-500">Impressions</div>
//                 </div>
//                 <div className="font-bold text-purple-600">{campaign.impressions}</div>
//               </div>
//               <div className="bg-white border rounded-lg p-3 text-center">
//                 <div className="flex items-center justify-center mb-1">
//                   <MousePointer className="h-4 w-4 mr-2 text-yellow-500" />
//                   <div className="text-xs text-gray-500">Clicks</div>
//                 </div>
//                 <div className="font-bold text-yellow-600">{campaign.clicks}</div>
//               </div>
//               <div className="bg-white border rounded-lg p-3 text-center">
//                 <div className="flex items-center justify-center mb-1">
//                   <DollarSign className="h-4 w-4 mr-2 text-green-500" />
//                   <div className="text-xs text-gray-500">Conversions</div>
//                 </div>
//                 <div className="font-bold text-green-600">{campaign.conversions}</div>
//               </div>
//             </div>

//             <div className="bg-white border rounded-lg p-3">
//               <div className="text-sm font-medium mb-2">Campaign Status</div>
//               <div className={`
//                 py-1 px-2 rounded-full text-xs text-center font-semibold
//                 ${campaign.status === 'active' ? 'bg-green-100 text-green-700' : 
//                   campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 
//                   'bg-red-100 text-red-700'}
//               `}>
//                 {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
//               </div>
//             </div>
//           </div>

//           {/* Main Content - Performance Details */}
//           <div className="col-span-9 overflow-y-auto">
//             <Tabs defaultValue="performance" className="h-full flex flex-col">
//               <TabsList className="bg-white border-b px-6 py-3 flex justify-start space-x-4">
//                 <TabsTrigger 
//                   value="performance" 
//                   className="flex items-center space-x-2 data-[state=active]:bg-gray-100 px-3 py-1.5 rounded"
//                 >
//                   <BarChart2 className="h-4 w-4" />
//                   <span>Performance</span>
//                 </TabsTrigger>
//                 <TabsTrigger 
//                   value="demographics" 
//                   className="flex items-center space-x-2 data-[state=active]:bg-gray-100 px-3 py-1.5 rounded"
//                 >
//                   <Users className="h-4 w-4" />
//                   <span>Demographics</span>
//                 </TabsTrigger>
//                 <TabsTrigger 
//                   value="locations" 
//                   className="flex items-center space-x-2 data-[state=active]:bg-gray-100 px-3 py-1.5 rounded"
//                 >
//                   <MapPin className="h-4 w-4" />
//                   <span>Locations</span>
//                 </TabsTrigger>
//                 <TabsTrigger 
//                   value="preview" 
//                   className="flex items-center space-x-2 data-[state=active]:bg-gray-100 px-3 py-1.5 rounded"
//                 >
//                   <ImageIcon className="h-4 w-4" />
//                   <span>Ad Preview</span>
//                 </TabsTrigger>
//               </TabsList>

//               <TabsContent value="performance" className="p-6 flex-1">
//                 <div className="bg-white border rounded-lg p-6 h-full">
//                   <h3 className="text-lg font-semibold mb-4 flex items-center">
//                     <BarChart2 className="h-5 w-5 mr-2 text-blue-500" />
//                     Campaign Performance
//                   </h3>
//                   <div className="h-[calc(100%-50px)] bg-gray-50 rounded flex items-center justify-center">
//                     Performance Chart Placeholder
//                   </div>
//                 </div>
//               </TabsContent>

//               <TabsContent value="demographics" className="p-6 flex-1">
//                 <div className="bg-white border rounded-lg p-6 h-full">
//                   <h3 className="text-lg font-semibold mb-4 flex items-center">
//                     <Users className="h-5 w-5 mr-2 text-purple-500" />
//                     Demographic Breakdown
//                   </h3>
//                   <div className="grid grid-cols-2 gap-4 h-[calc(100%-50px)]">
//                     <div className="bg-gray-50 rounded flex items-center justify-center">
//                       Gender Distribution Chart
//                     </div>
//                     <div className="bg-gray-50 rounded flex items-center justify-center">
//                       Age Group Distribution Chart
//                     </div>
//                   </div>
//                 </div>
//               </TabsContent>

//               <TabsContent value="locations" className="p-6 flex-1">
//                 <div className="bg-white border rounded-lg p-6 h-full">
//                   <h3 className="text-lg font-semibold mb-4 flex items-center">
//                     <MapPin className="h-5 w-5 mr-2 text-green-500" />
//                     Display Locations
//                   </h3>
//                   <div className="overflow-x-auto">
//                     <table className="w-full border-collapse">
//                       <thead>
//                         <tr className="bg-gray-100">
//                           <th className="p-3 text-left">Site</th>
//                           <th className="p-3 text-right">Clicks</th>
//                           <th className="p-3 text-right">Impressions</th>
//                           <th className="p-3 text-right">CTR</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {['www.example.com', 'www.another-site.com', 'www.third-site.com'].map((site, index) => (
//                           <tr key={index} className="border-b hover:bg-gray-50">
//                             <td className="p-3">{site}</td>
//                             <td className="p-3 text-right">{campaign.clicks}</td>
//                             <td className="p-3 text-right">{campaign.impressions}</td>
//                             <td className="p-3 text-right">
//                               {((parseInt(campaign.clicks) / parseInt(campaign.impressions) * 100).toFixed(2))}%
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               </TabsContent>

//               <TabsContent value="preview" className="p-6 flex-1">
//                 <div className="bg-white border rounded-lg p-6 h-full">
//                   <h3 className="text-lg font-semibold mb-4 flex items-center">
//                     <ImageIcon className="h-5 w-5 mr-2 text-indigo-500" />
//                     Ad Previews
//                   </h3>
//                   <div className="grid grid-cols-3 gap-4">
//                     {['336x280', '300x600', '728x90'].map((size, index) => (
//                       <div 
//                         key={index} 
//                         className="border rounded-lg p-4 text-center bg-gray-50 hover:shadow-md transition-shadow"
//                       >
//                         <div className="text-sm text-gray-500 mb-2">{size}</div>
//                         <div className="bg-white border rounded h-40 flex items-center justify-center">
//                           Ad Preview
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </TabsContent>
//             </Tabs>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default CampaignDetailsModal;