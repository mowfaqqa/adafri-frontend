'use client';

import React from 'react';
import { Check, Plus, Lock, Crown } from 'lucide-react';
import { SocialAccount } from '@/lib/types/post-publisher/social-media';

// Enhanced platforms data with proper icons and features
const PLATFORMS = [
  { 
    id: 'instagram', 
    name: 'Instagram', 
    icon: () => <div className="w-5 h-5 bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 rounded-lg"></div>,
    color: 'from-pink-500 to-orange-500',
    connected: true,
    followers: '12.5K',
    engagement: '4.2%',
    isPremium: false
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    icon: () => <div className="w-5 h-5 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">f</div>,
    color: 'from-blue-600 to-blue-700',
    connected: true,
    followers: '8.2K',
    engagement: '2.8%',
    isPremium: false
  },
  { 
    id: 'twitter', 
    name: 'Twitter', 
    icon: () => <div className="w-5 h-5 bg-blue-400 rounded-lg flex items-center justify-center text-white text-xs font-bold">𝕏</div>,
    color: 'from-blue-400 to-blue-500',
    connected: true,
    followers: '25.1K',
    engagement: '6.1%',
    isPremium: false
  },
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: () => <div className="w-5 h-5 bg-blue-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">in</div>,
    color: 'from-blue-700 to-blue-800',
    connected: false,
    followers: '0',
    engagement: '0%',
    isPremium: true
  },
  { 
    id: 'tiktok', 
    name: 'TikTok', 
    icon: () => <div className="w-5 h-5 bg-black rounded-lg flex items-center justify-center text-white text-xs font-bold">♪</div>,
    color: 'from-black to-gray-800',
    connected: false,
    followers: '0',
    engagement: '0%',
    isPremium: true
  },
  { 
    id: 'youtube', 
    name: 'YouTube', 
    icon: () => <div className="w-5 h-5 bg-red-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">▶</div>,
    color: 'from-red-600 to-red-700',
    connected: true,
    followers: '3.4K',
    engagement: '8.9%',
    isPremium: true
  },
];

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onPlatformToggle: (platform: string) => void;
  connectedAccounts: SocialAccount[];
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatforms,
  onPlatformToggle,
  connectedAccounts
}) => {
  const renderPlatformIcon = (platformId: string) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    return platform ? <platform.icon /> : null;
  };

  const isPlatformSelected = (platformId: string) => {
    return selectedPlatforms.includes(platformId);
  };

  const isPlatformConnected = (platformId: string) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    return platform?.connected || false;
  };

  return (
    <div className="space-y-4">
      {/* Connected Platforms */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span>Connected Platforms</span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PLATFORMS.filter(platform => platform.connected).map((platform) => (
            <div
              key={platform.id}
              onClick={() => onPlatformToggle(platform.id)}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                isPlatformSelected(platform.id)
                  ? `border-transparent bg-gradient-to-r ${platform.color} text-white shadow-lg`
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Selection Indicator */}
              <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                isPlatformSelected(platform.id)
                  ? 'border-white bg-white'
                  : 'border-gray-300'
              }`}>
                {isPlatformSelected(platform.id) && (
                  <Check size={12} className="text-green-600" />
                )}
              </div>

              {/* Platform Info */}
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  isPlatformSelected(platform.id) ? 'bg-white/20' : 'bg-gray-50'
                }`}>
                  {renderPlatformIcon(platform.id)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className={`font-semibold text-sm ${
                      isPlatformSelected(platform.id) ? 'text-white' : 'text-gray-900'
                    }`}>
                      {platform.name}
                    </h3>
                    {platform.isPremium && (
                      <Crown size={12} className={isPlatformSelected(platform.id) ? 'text-yellow-200' : 'text-yellow-500'} />
                    )}
                  </div>
                  
                  <div className="mt-1 space-y-1">
                    <p className={`text-xs ${
                      isPlatformSelected(platform.id) ? 'text-white/80' : 'text-gray-500'
                    }`}>
                      {platform.followers} followers
                    </p>
                    <p className={`text-xs ${
                      isPlatformSelected(platform.id) ? 'text-white/80' : 'text-gray-500'
                    }`}>
                      {platform.engagement} avg engagement
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disconnected Platforms */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
          <span>Available Platforms</span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PLATFORMS.filter(platform => !platform.connected).map((platform) => (
            <div
              key={platform.id}
              className="relative p-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-all duration-200 cursor-pointer group"
            >
              {/* Premium Badge */}
              {platform.isPremium && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                  <Crown size={10} />
                  <span>Pro</span>
                </div>
              )}

              {/* Platform Info */}
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                  {renderPlatformIcon(platform.id)}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-gray-700 group-hover:text-gray-900">
                    {platform.name}
                  </h3>
                  <p className="text-xs text-gray-500">Not connected</p>
                </div>
                
                <button className="flex items-center space-x-1 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all">
                  <Plus size={12} />
                  <span>Connect</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selection Summary */}
      {selectedPlatforms.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">
                {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Your content will reach approximately{' '}
                <span className="font-semibold">
                  {PLATFORMS
                    .filter(p => selectedPlatforms.includes(p.id) && p.connected)
                    .reduce((total, p) => {
                      const followers = parseFloat(p.followers.replace('K', '')) * 1000;
                      return total + followers;
                    }, 0)
                    .toLocaleString()
                  } followers
                </span>
              </p>
            </div>
            
            <div className="flex -space-x-1">
              {selectedPlatforms.slice(0, 3).map(platformId => (
                <div key={platformId} className="w-8 h-8 bg-white rounded-full border-2 border-blue-200 flex items-center justify-center">
                  {renderPlatformIcon(platformId)}
                </div>
              ))}
              {selectedPlatforms.length > 3 && (
                <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-blue-200 flex items-center justify-center text-white text-xs font-bold">
                  +{selectedPlatforms.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformSelector;































































// 'use client';

// import React from 'react';
// import { Check, Plus } from 'lucide-react';
// import { PLATFORMS } from '@/lib/types/post-publisher/social-media';

// interface ConnectedAccount {
//   platform: string;
//   connected: boolean;
//   username?: string;
//   id?: string;
// }

// interface PlatformSelectorProps {
//   selectedPlatforms: string[];
//   onPlatformToggle: (platform: string) => void;
//   connectedAccounts: ConnectedAccount[];
// }

// const PlatformSelector: React.FC<PlatformSelectorProps> = ({
//   selectedPlatforms,
//   onPlatformToggle,
//   connectedAccounts
// }) => {
//   // Helper function to render platform icon
//   const renderPlatformIcon = (platformId: string, size: number = 16, className: string = "") => {
//     const platform = PLATFORMS.find(p => p.id === platformId);
//     if (!platform) return null;
    
//     const IconComponent = platform.icon;
//     return React.createElement(IconComponent, { size, className });
//   };

//   const getConnectedPlatforms = () => {
//     return connectedAccounts.filter(acc => acc.connected);
//   };

//   const isPlatformConnected = (platformId: string) => {
//     return connectedAccounts.some(acc => acc.platform === platformId && acc.connected);
//   };

//   const getAccountInfo = (platformId: string) => {
//     return connectedAccounts.find(acc => acc.platform === platformId && acc.connected);
//   };

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center justify-between">
//         <h3 className="text-sm font-semibold text-gray-900">Publish to</h3>
//         <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
//           {getConnectedPlatforms().length}/{PLATFORMS.length} connected
//         </span>
//       </div>
      
//       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
//         {PLATFORMS.map(platform => {
//           const isConnected = isPlatformConnected(platform.id);
//           const isSelected = selectedPlatforms.includes(platform.id);
//           const accountInfo = getAccountInfo(platform.id);
          
//           return (
//             <div key={platform.id} className="relative">
//               <button
//                 onClick={() => isConnected && onPlatformToggle(platform.id)}
//                 disabled={!isConnected}
//                 className={`relative w-full p-3 rounded-2xl border-2 transition-all duration-200 text-left ${
//                   isSelected && isConnected
//                     ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
//                     : isConnected
//                     ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
//                     : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
//                 }`}
//                 title={`${platform.name} ${isConnected ? (isSelected ? '(Selected)' : '(Available)') : '(Not Connected)'}`}
//               >
//                 <div className="flex items-center space-x-3">
//                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
//                     isSelected && isConnected 
//                       ? 'bg-blue-500' 
//                       : isConnected 
//                       ? 'bg-gray-100' 
//                       : 'bg-gray-200'
//                   }`}>
//                     {renderPlatformIcon(
//                       platform.id, 
//                       20, 
//                       isSelected && isConnected 
//                         ? 'text-white' 
//                         : isConnected 
//                         ? 'text-gray-600' 
//                         : 'text-gray-400'
//                     )}
//                   </div>
                  
//                   <div className="flex-1 min-w-0">
//                     <p className={`text-sm font-medium truncate ${
//                       isSelected && isConnected 
//                         ? 'text-blue-900' 
//                         : isConnected 
//                         ? 'text-gray-900' 
//                         : 'text-gray-500'
//                     }`}>
//                       {platform.name}
//                     </p>
//                     <p className={`text-xs truncate ${
//                       isSelected && isConnected 
//                         ? 'text-blue-600' 
//                         : isConnected 
//                         ? 'text-gray-500' 
//                         : 'text-gray-400'
//                     }`}>
//                       {isConnected ? (accountInfo?.username || 'Connected') : 'Not connected'}
//                     </p>
//                   </div>
//                 </div>
                
//                 {/* Selection indicator */}
//                 {isSelected && isConnected && (
//                   <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
//                     <Check size={12} className="text-white" />
//                   </div>
//                 )}
                
//                 {/* Connection status indicator */}
//                 <div className={`absolute bottom-2 right-2 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
//                   isConnected ? 'bg-green-500' : 'bg-gray-400'
//                 }`}></div>
                
//                 {/* Connect button for unconnected platforms */}
//                 {!isConnected && (
//                   <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
//                     <div className="text-center">
//                       <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-1">
//                         <Plus size={16} className="text-white" />
//                       </div>
//                       <span className="text-xs font-medium text-blue-600">Connect</span>
//                     </div>
//                   </div>
//                 )}
//               </button>
//             </div>
//           );
//         })}
//       </div>
      
//       {/* Connect more platforms */}
//       <div className="pt-3 border-t border-gray-100">
//         <button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-2xl text-center text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-all group">
//           <div className="flex items-center justify-center space-x-2">
//             <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-all">
//               <Plus size={16} className="group-hover:text-blue-600" />
//             </div>
//             <span className="text-sm font-medium">Connect more platforms</span>
//           </div>
//         </button>
//       </div>
//     </div>
//   );
// };

// export default PlatformSelector;




































































// 'use client';

// import React from 'react';
// import { SocialAccount, PLATFORMS } from '@/lib/types/post-publisher/social-media';

// interface PlatformSelectorProps {
//   selectedPlatforms: string[];
//   onPlatformToggle: (platform: string) => void;
//   connectedAccounts: SocialAccount[];
// }

// const PlatformSelector: React.FC<PlatformSelectorProps> = ({
//   selectedPlatforms,
//   onPlatformToggle,
//   connectedAccounts
// }) => {
//   return (
//     <div className="bg-white rounded-lg border p-4">
//       <h3 className="font-semibold mb-3">Select Platforms</h3>
//       <div className="space-y-2">
//         {PLATFORMS.map(platform => {
//           const isConnected = connectedAccounts.some(acc => acc.platform === platform.id && acc.connected);
//           const isSelected = selectedPlatforms.includes(platform.id);
          
//           return (
//             <label
//               key={platform.id}
//               className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer border transition-colors ${
//                 isConnected 
//                   ? 'hover:bg-gray-50 border-gray-200' 
//                   : 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50'
//               } ${isSelected && isConnected ? 'bg-blue-50 border-blue-200' : ''}`}
//             >
//               <input
//                 type="checkbox"
//                 checked={isSelected}
//                 onChange={() => isConnected && onPlatformToggle(platform.id)}
//                 disabled={!isConnected}
//                 className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
//               />
//               <div className={`w-8 h-8 ${platform.color} rounded-lg flex items-center justify-center text-white text-sm`}>
//                 {platform.icon}
//               </div>
//               <div className="flex-1">
//                 <span className={`font-medium ${isConnected ? 'text-gray-900' : 'text-gray-400'}`}>
//                   {platform.name}
//                 </span>
//                 {!isConnected && (
//                   <span className="text-xs text-gray-400 block">Not connected</span>
//                 )}
//                 {isConnected && (
//                   <span className="text-xs text-gray-500 block">
//                     {platform.characterLimit} character limit
//                   </span>
//                 )}
//               </div>
//             </label>
//           );
//         })}
//       </div>
      
//       {selectedPlatforms.length === 0 && (
//         <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
//           <p className="text-sm text-yellow-800">
//             Select at least one platform to publish your post.
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PlatformSelector;