'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Play, Send, Volume2 } from 'lucide-react';

// Mock platforms data with proper icons
const PLATFORMS = [
  { 
    id: 'instagram', 
    name: 'Instagram', 
    icon: () => <div className="w-4 h-4 bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 rounded-sm"></div>,
    color: 'from-pink-500 to-orange-500'
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    icon: () => <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center text-white text-xs font-bold">f</div>,
    color: 'from-blue-600 to-blue-700'
  },
  { 
    id: 'twitter', 
    name: 'Twitter', 
    icon: () => <div className="w-4 h-4 bg-blue-400 rounded-sm flex items-center justify-center text-white text-xs">𝕏</div>,
    color: 'from-blue-400 to-blue-500'
  },
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: () => <div className="w-4 h-4 bg-blue-700 rounded-sm flex items-center justify-center text-white text-xs font-bold">in</div>,
    color: 'from-blue-700 to-blue-800'
  },
  { 
    id: 'tiktok', 
    name: 'TikTok', 
    icon: () => <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center text-white text-xs">♪</div>,
    color: 'from-black to-gray-800'
  },
];

interface PostPreviewProps {
  selectedPlatforms: string[];
  content: string;
  media: File[];
  postType: 'post' | 'story' | 'reel';
  shareToFeed?: boolean;
}

const PostPreview: React.FC<PostPreviewProps> = ({
  selectedPlatforms,
  content,
  media,
  postType,
  shareToFeed = false
}) => {
  const [currentPlatform, setCurrentPlatform] = useState(selectedPlatforms[0] || 'instagram');

  const renderPlatformIcon = (platformId: string) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    return platform ? <platform.icon /> : null;
  };

  const getCurrentPlatform = () => {
    return PLATFORMS.find(p => p.id === currentPlatform);
  };

  const StoryPreview = () => (
    <div className="bg-black rounded-2xl overflow-hidden max-w-xs mx-auto aspect-[9/16] relative shadow-2xl">
      {media.length > 0 ? (
        <img
          src={URL.createObjectURL(media[0])}
          alt="Story preview"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-600 via-blue-600 to-teal-600 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Play className="text-white" size={24} />
            </div>
            <p className="text-white text-lg font-medium">Story Preview</p>
            <p className="text-white/70 text-sm">Add content to see preview</p>
          </div>
        </div>
      )}
      
      {/* Story Progress Bar */}
      <div className="absolute top-4 left-4 right-4">
        <div className="h-1 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full w-1/3"></div>
        </div>
      </div>
      
      {/* Story Header */}
      <div className="absolute top-8 left-4 right-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full border-2 border-white p-0.5">
            <div className="w-full h-full bg-gray-200 rounded-full"></div>
          </div>
          <div>
            <span className="text-white text-sm font-semibold drop-shadow-lg">your_username</span>
            <div className="text-white/80 text-xs">2h</div>
          </div>
        </div>
        <MoreHorizontal size={20} className="text-white drop-shadow-lg" />
      </div>
      
      {/* Story Content */}
      {content && (
        <div className="absolute bottom-24 left-4 right-4">
          <div className="bg-black/50 backdrop-blur-sm p-4 rounded-xl">
            <p className="text-white text-sm leading-relaxed drop-shadow-lg">
              {content}
            </p>
          </div>
        </div>
      )}
      
      {/* Story Footer */}
      <div className="absolute bottom-6 left-4 right-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 border-2 border-white rounded-full flex items-center justify-center">
            <Heart size={18} className="text-white" />
          </div>
          <div className="w-10 h-10 border-2 border-white rounded-full flex items-center justify-center">
            <Send size={18} className="text-white" />
          </div>
        </div>
        <div className="text-white text-xs">👀 124</div>
      </div>
    </div>
  );

  const ReelPreview = () => (
    <div className="bg-black rounded-2xl overflow-hidden max-w-xs mx-auto aspect-[9/16] relative shadow-2xl">
      {media.length > 0 ? (
        <div className="relative w-full h-full">
          <img
            src={URL.createObjectURL(media[0])}
            alt="Reel preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Play className="text-white ml-1" size={24} />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-pink-600 via-purple-600 to-blue-600 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Play className="text-white" size={24} />
            </div>
            <p className="text-white text-lg font-medium">Reel Preview</p>
            <p className="text-white/70 text-sm">Add video to see preview</p>
          </div>
        </div>
      )}
      
      {/* Reel UI Elements */}
      <div className="absolute top-4 right-4 flex flex-col space-y-4">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <Heart size={20} className="text-white" />
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <MessageCircle size={20} className="text-white" />
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <Share size={20} className="text-white" />
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <Bookmark size={20} className="text-white" />
        </div>
      </div>
      
      {/* Reel Bottom Info */}
      <div className="absolute bottom-4 left-4 right-16">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full"></div>
            <span className="text-white text-sm font-semibold">your_username</span>
            <button className="text-white text-xs border border-white px-2 py-1 rounded">Follow</button>
          </div>
          {content && (
            <p className="text-white text-sm leading-relaxed pr-4">
              {content}
            </p>
          )}
          <div className="flex items-center space-x-2">
            <Volume2 size={16} className="text-white" />
            <span className="text-white text-xs">Original audio</span>
          </div>
        </div>
      </div>
      
      {shareToFeed && (
        <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
          Also sharing to Feed
        </div>
      )}
    </div>
  );

  const PostPreview = () => (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-sm mx-auto border border-gray-100">
      {/* Post Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full shadow-md"></div>
            <div>
              <p className="font-semibold text-sm">your_username</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <MoreHorizontal size={16} className="text-gray-400" />
        </div>
      </div>

      

      {/* Post Media */}
      {media.length > 0 ? (
        <div className="relative">
          <img
            src={URL.createObjectURL(media[0])}
            alt="Post preview"
            className="w-full aspect-square object-cover"
          />
        </div>
      ) : (
        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Play className="text-gray-400" size={24} />
            </div>
            <p className="text-gray-500 text-sm">Post Preview</p>
            <p className="text-gray-400 text-xs">Add content to see preview</p>
          </div>
        </div>
      )}

      {/* Post Content */}
      {content && (
        <div className="px-4 py-3">
          <p className="text-sm text-gray-800 leading-relaxed">{content}</p>
        </div>
      )}

      {/* Engagement Bar */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <Heart size={20} className="text-gray-700 hover:text-red-500 cursor-pointer transition-colors" />
            <MessageCircle size={20} className="text-gray-700 hover:text-blue-500 cursor-pointer transition-colors" />
            <Share size={20} className="text-gray-700 hover:text-green-500 cursor-pointer transition-colors" />
          </div>
          <Bookmark size={20} className="text-gray-700 hover:text-yellow-500 cursor-pointer transition-colors" />
        </div>
        
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-800">1,234 likes</p>
          <p className="text-xs text-gray-500">View all 23 comments</p>
          <p className="text-xs text-gray-400">2 hours ago</p>
        </div>
      </div>
    </div>
  );

  const renderPreview = () => {
    switch (postType) {
      case 'story':
        return <StoryPreview />;
      case 'reel':
        return <ReelPreview />;
      default:
        return <PostPreview />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Selector */}
      {selectedPlatforms.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h4 className="font-medium text-gray-800 mb-3">Preview Platform</h4>
          <div className="flex flex-wrap gap-2">
            {selectedPlatforms.map(platformId => {
              const platform = PLATFORMS.find(p => p.id === platformId);
              return (
                <button
                  key={platformId}
                  onClick={() => setCurrentPlatform(platformId)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    platformId === currentPlatform
                      ? `bg-gradient-to-r ${platform?.color} text-white shadow-md transform scale-105`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {renderPlatformIcon(platformId)}
                  <span className="font-medium">{platform?.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Preview Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          {renderPlatformIcon(currentPlatform)}
          <h3 className="font-semibold text-gray-800">
            {getCurrentPlatform()?.name} {postType.charAt(0).toUpperCase() + postType.slice(1)} Preview
          </h3>
        </div>
        
        <div className="flex justify-center">
          {renderPreview()}
        </div>
      </div>
      
      {/* Publishing Info */}
      {selectedPlatforms.length > 1 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">{selectedPlatforms.length}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800 mb-2">
                Publishing to {selectedPlatforms.length} platforms
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedPlatforms.map(id => {
                  const platform = PLATFORMS.find(p => p.id === id);
                  return (
                    <span key={id} className="inline-flex items-center space-x-1 bg-white px-3 py-1 rounded-lg text-xs font-medium text-gray-700 shadow-sm">
                      {renderPlatformIcon(id)}
                      <span>{platform?.name}</span>
                    </span>
                  );
                })}
              </div>
              {postType === 'reel' && shareToFeed && (
                <div className="mt-2 text-xs text-blue-600 font-medium">
                  ✨ Reel will also be shared to main feed
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostPreview;



























































// 'use client';

// import React, { useState } from 'react';
// import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Play } from 'lucide-react';
// import { PLATFORMS } from '@/lib/types/post-publisher/social-media';

// interface PreviewPaneProps {
//   selectedPlatforms: string[];
//   content: string;
//   media: File[];
//   postType: 'post' | 'story' | 'reel';
// }

// const PreviewPane: React.FC<PreviewPaneProps> = ({
//   selectedPlatforms,
//   content,
//   media,
//   postType
// }) => {
//   const [currentPlatform, setCurrentPlatform] = useState(selectedPlatforms[0] || 'instagram');

//   // Helper function to render platform icon
//   const renderPlatformIcon = (platformId: string, size: number = 16, className: string = "") => {
//     const platform = PLATFORMS.find(p => p.id === platformId);
//     if (!platform) return null;
    
//     const IconComponent = platform.icon;
//     return React.createElement(IconComponent, { size, className });
//   };

//   const platform = PLATFORMS.find(p => p.id === currentPlatform);

//   const UniversalPreview = () => (
//     <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-sm mx-auto border border-gray-100">
//       {/* Header */}
//       <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
//               {renderPlatformIcon(currentPlatform, 16, 'text-white')}
//             </div>
//             <span className="font-semibold text-gray-900 text-sm">
//               {platform?.name || 'Platform'} Preview
//             </span>
//           </div>
//           <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
//             <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
//           </div>
//         </div>
//       </div>

//       {/* Content */}
//       <div className="bg-gray-50">
//         {/* Post Header */}
//         <div className="p-4 bg-white">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full shadow-md"></div>
//               <div>
//                 <p className="font-semibold text-sm">your_username</p>
//                 <p className="text-xs text-gray-500">2 hours ago</p>
//               </div>
//             </div>
//             <MoreHorizontal size={16} className="text-gray-400" />
//           </div>
//         </div>

//         {/* Media Content */}
//         {postType === 'story' ? (
//           <div className="aspect-[9/16] bg-gradient-to-br from-blue-100 to-purple-100 relative overflow-hidden">
//             {media.length > 0 ? (
//               <img
//                 src={URL.createObjectURL(media[0])}
//                 alt="Story preview"
//                 className="w-full h-full object-cover"
//               />
//             ) : (
//               <div className="flex items-center justify-center h-full">
//                 <div className="text-center">
//                   <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
//                     <Play className="text-white" size={24} />
//                   </div>
//                   <p className="text-white text-sm font-medium">Story Preview</p>
//                 </div>
//               </div>
//             )}
            
//             {/* Story UI Elements */}
//             <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
//               <div className="flex items-center space-x-2">
//                 <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full border-2 border-white shadow-lg"></div>
//                 <span className="text-white text-sm font-medium drop-shadow-lg">your_username</span>
//                 <span className="text-white/70 text-xs">now</span>
//               </div>
//               <MoreHorizontal size={16} className="text-white drop-shadow-lg" />
//             </div>
            
//             {content && (
//               <div className="absolute bottom-20 left-4 right-4">
//                 <p className="text-white text-sm drop-shadow-lg bg-black/20 p-3 rounded-xl backdrop-blur-sm">
//                   {content}
//                 </p>
//               </div>
//             )}
//           </div>
//         ) : (
//           <div className="bg-white">
//             {/* Post Media */}
//             {media.length > 0 ? (
//               <div className="aspect-square bg-gray-100 relative overflow-hidden">
//                 <img
//                   src={URL.createObjectURL(media[0])}
//                   alt="Post preview"
//                   className="w-full h-full object-cover"
//                 />
//                 {postType === 'reel' && (
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
//                       <Play className="text-white ml-1" size={20} />
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
//                 <div className="text-center">
//                   <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
//                     <Play className="text-gray-400" size={24} />
//                   </div>
//                   <p className="text-gray-500 text-sm">
//                     {postType === 'reel' ? 'Video Preview' : 'Post Preview'}
//                   </p>
//                 </div>
//               </div>
//             )}

//             {/* Text Content */}
//             {content && (
//               <div className="p-4 bg-white border-b border-gray-100">
//                 <div className="text-sm">
//                   <span className="font-semibold">your_username</span>{' '}
//                   <span className="text-gray-800">{content}</span>
//                 </div>
//               </div>
//             )}

//             {/* Engagement Bar */}
//             <div className="p-4 bg-white">
//               <div className="flex items-center justify-between mb-3">
//                 <div className="flex items-center space-x-4">
//                   <Heart size={20} className="text-gray-700 hover:text-red-500 cursor-pointer transition-colors" />
//                   <MessageCircle size={20} className="text-gray-700 hover:text-blue-500 cursor-pointer transition-colors" />
//                   <Share size={20} className="text-gray-700 hover:text-green-500 cursor-pointer transition-colors" />
//                 </div>
//                 <Bookmark size={20} className="text-gray-700 hover:text-yellow-500 cursor-pointer transition-colors" />
//               </div>
              
//               <div className="text-xs text-gray-500 mb-2">
//                 <span className="font-semibold">1,234 likes</span>
//               </div>
              
//               <div className="text-xs text-gray-500 mb-1">
//                 View all 23 comments
//               </div>
              
//               <div className="text-xs text-gray-400">
//                 2 hours ago
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );

//   return (
//     <div className="space-y-4">
//       <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
//           <h3 className="text-lg font-semibold text-white">Preview</h3>
//         </div>
        
//         <div className="p-4">
//           {/* Platform Tabs */}
//           {selectedPlatforms.length > 1 && (
//             <div className="flex flex-wrap gap-2 mb-4">
//               {selectedPlatforms.map(platformId => {
//                 const platform = PLATFORMS.find(p => p.id === platformId);
//                 return (
//                   <button
//                     key={platformId}
//                     onClick={() => setCurrentPlatform(platformId)}
//                     className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all ${
//                       platformId === currentPlatform
//                         ? 'bg-blue-500 text-white shadow-lg'
//                         : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                     }`}
//                   >
//                     {renderPlatformIcon(platformId, 14)}
//                     <span>{platform?.name}</span>
//                   </button>
//                 );
//               })}
//             </div>
//           )}
          
//           {/* Preview */}
//           <div className="mb-4">
//             <UniversalPreview />
//           </div>
          
//           {/* Multiple Platform Notice */}
//           {selectedPlatforms.length > 1 && (
//             <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
//               <p className="text-sm text-blue-800">
//                 <span className="font-medium">Publishing to {selectedPlatforms.length} platforms:</span>
//               </p>
//               <div className="flex flex-wrap gap-2 mt-2">
//                 {selectedPlatforms.map(id => {
//                   const platform = PLATFORMS.find(p => p.id === id);
//                   return (
//                     <span key={id} className="inline-flex items-center space-x-1 bg-white px-2 py-1 rounded-lg text-xs text-gray-600">
//                       {renderPlatformIcon(id, 12)}
//                       <span>{platform?.name}</span>
//                     </span>
//                   );
//                 })}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PreviewPane;





























































// 'use client';

// import React from 'react';
// import { PLATFORMS } from '@/lib/types/post-publisher/social-media';

// interface PostPreviewProps {
//   content: string;
//   media: File[];
//   selectedPlatforms: string[];
// }

// const PostPreview: React.FC<PostPreviewProps> = ({ content, media, selectedPlatforms }) => {
//   const truncateContent = (text: string, limit: number) => {
//     return text.length > limit ? text.substring(0, limit) + '...' : text;
//   };

//   const getPlatformConfig = (platformId: string) => {
//     return PLATFORMS.find(p => p.id === platformId);
//   };

//   if (selectedPlatforms.length === 0) {
//     return (
//       <div className="bg-white rounded-lg border p-4">
//         <h3 className="font-semibold mb-3">Preview</h3>
//         <div className="text-center py-8">
//           <p className="text-gray-500">Select platforms to see preview</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white rounded-lg border p-4">
//       <h3 className="font-semibold mb-3">Preview</h3>
//       <div className="space-y-4">
//         {selectedPlatforms.map(platformId => {
//           const platform = getPlatformConfig(platformId);
//           if (!platform) return null;
          
//           const truncatedContent = truncateContent(content, platform.characterLimit);
//           const isContentTruncated = content.length > platform.characterLimit;

//           return (
//             <div key={platformId} className="border rounded-lg p-4">
//               <div className="flex items-center space-x-2 mb-3">
//                 <div className={`w-6 h-6 ${platform.color} rounded flex items-center justify-center text-white text-xs`}>
//                   {platform.icon}
//                 </div>
//                 <span className="font-medium text-sm">{platform.name}</span>
//                 {isContentTruncated && (
//                   <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
//                     Content truncated
//                   </span>
//                 )}
//               </div>

//               <div className="space-y-2">
//                 {/* Content Preview */}
//                 <div className="text-sm">
//                   <p className="whitespace-pre-wrap">{truncatedContent}</p>
//                   <div className="text-xs text-gray-500 mt-1">
//                     {content.length}/{platform.characterLimit} characters
//                   </div>
//                 </div>

//                 {/* Media Preview */}
//                 {media.length > 0 && (
//                   <div className="grid grid-cols-2 gap-2">
//                     {media.slice(0, 4).map((file, index) => (
//                       <div key={index} className="relative">
//                         <img
//                           src={URL.createObjectURL(file)}
//                           alt="Media preview"
//                           className="w-full h-16 object-cover rounded"
//                         />
//                         {index === 3 && media.length > 4 && (
//                           <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xs rounded">
//                             +{media.length - 4}
//                           </div>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 )}

//                 {/* Platform-specific elements */}
//                 {platformId === 'twitter' && (
//                   <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
//                     <span>Reply</span>
//                     <span>Retweet</span>
//                     <span>Like</span>
//                     <span>Share</span>
//                   </div>
//                 )}

//                 {platformId === 'instagram' && (
//                   <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
//                     <span>❤️ Like</span>
//                     <span>💬 Comment</span>
//                     <span>📤 Share</span>
//                   </div>
//                 )}

//                 {platformId === 'facebook' && (
//                   <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
//                     <span>👍 Like</span>
//                     <span>💬 Comment</span>
//                     <span>📤 Share</span>
//                   </div>
//                 )}

//                 {platformId === 'linkedin' && (
//                   <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
//                     <span>👍 Like</span>
//                     <span>💬 Comment</span>
//                     <span>🔄 Repost</span>
//                     <span>📤 Send</span>
//                   </div>
//                 )}

//                 {platformId === 'tiktok' && (
//                   <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
//                     <span>❤️ Like</span>
//                     <span>💬 Comment</span>
//                     <span>📤 Share</span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default PostPreview;