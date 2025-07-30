'use client';
import React, { useState, useEffect } from 'react';
import { X, Send, Clock, Calendar, Image, Video, Link, Smile, Zap } from 'lucide-react';
import PostComposer from './PostComposer';
import PlatformSelector from './PlatformSelector';
import PostPreview from './PostPreview';
import SchedulePicker from './SchedulePicker';
import { SocialAccount, SocialPost } from '@/lib/types/post-publisher/social-media';

// Extended interface for posts with additional properties
interface ExtendedSocialPost extends SocialPost {
  postType?: 'post' | 'story' | 'reel';
  shareToFeed?: boolean;
}

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (postData: any, publishType: 'now' | 'schedule' | 'draft', scheduledAt: Date) => void;
  connectedAccounts: SocialAccount[];
  selectedChannel?: string;
  prefilledDate?: Date | null;
  prefilledTime?: string;
  editingPost?: SocialPost | null;
}

const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  onPublish,
  connectedAccounts,
  selectedChannel,
  prefilledDate = null,
  prefilledTime = '09:00',
  editingPost = null
}) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<File[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [postType, setPostType] = useState<'post' | 'story' | 'reel'>('post');
  const [shareToFeed, setShareToFeed] = useState(false);

  // Initialize with editing post data
  useEffect(() => {
    if (editingPost && isOpen) {
      setContent(editingPost.content || '');
      setMedia(editingPost.media || []);
      setSelectedPlatforms(editingPost.platforms || []);
      
      // Handle postType - fallback to 'post' if not defined in the interface
      const postTypeFromPost = (editingPost as any).postType || 'post';
      setPostType(postTypeFromPost);
      
      // Handle shareToFeed - fallback to false if not defined in the interface
      const shareToFeedFromPost = (editingPost as any).shareToFeed || false;
      setShareToFeed(shareToFeedFromPost);
      
      // Set scheduled date for editing
      const editDate = new Date(editingPost.scheduledAt);
      setScheduledAt(editDate);
    } else if (prefilledDate && isOpen && !editingPost) {
      // Handle prefilled date from calendar (new post)
      const scheduledDate = new Date(prefilledDate);
      const [hours, minutes] = prefilledTime.split(':');
      scheduledDate.setHours(parseInt(hours), parseInt(minutes));
      setScheduledAt(scheduledDate);
    } else if (!editingPost) {
      // Reset for new posts
      setScheduledAt(null);
    }
  }, [editingPost, prefilledDate, prefilledTime, isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen || (!editingPost && !prefilledDate)) {
      setContent('');
      setMedia([]);
      setSelectedPlatforms([]);
      setScheduledAt(null);
      setPostType('post');
      setShareToFeed(false);
    }
  }, [isOpen, editingPost, prefilledDate]);

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handlePublish = (publishType: 'now' | 'schedule' | 'draft', scheduledDate?: Date) => {
    let status: 'published' | 'scheduled' | 'draft' = 'draft';
    let postScheduledAt: Date;

    // Determine status and scheduled time based on publish type
    switch (publishType) {
      case 'now':
        status = 'published';
        postScheduledAt = new Date(); // Current time for published posts
        break;
      case 'schedule':
        status = 'scheduled';
        postScheduledAt = scheduledDate || scheduledAt || new Date();
        break;
      case 'draft':
        status = 'draft';
        postScheduledAt = new Date(); // Current time for drafts
        break;
      default:
        postScheduledAt = new Date();
    }

    const postData = {
      id: editingPost?.id || `post-${Date.now()}`, // Keep existing ID when editing
      content,
      media: [...media],
      platforms: selectedPlatforms,
      scheduledAt: postScheduledAt,
      status,
      postType,
      shareToFeed: postType === 'reel' ? shareToFeed : false,
      createdBy: editingPost?.createdBy || 'current-user'
    };
    
    onPublish(postData, publishType, postScheduledAt);
    handleClose();
  };

  const handleClose = () => {
    setContent('');
    setMedia([]);
    setSelectedPlatforms([]);
    setScheduledAt(null);
    setPostType('post');
    setShareToFeed(false);
    onClose();
  };

  const isValid = content.trim().length > 0 && selectedPlatforms.length > 0;

  const getModalTitle = () => {
    if (editingPost) {
      return 'Edit Post';
    } else if (prefilledDate) {
      return 'Create New Post';
    } else {
      return 'Create New Post';
    }
  };

  const getModalSubtitle = () => {
    if (editingPost) {
      return `Editing ${editingPost.status} post scheduled for ${new Date(editingPost.scheduledAt).toLocaleDateString()}`;
    } else if (prefilledDate) {
      return `Scheduling for ${prefilledDate.toLocaleDateString()} at ${prefilledTime}`;
    } else {
      return 'Share your content across all platforms';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className={`text-white p-6 ${
          editingPost 
            ? 'bg-gradient-to-r from-orange-600 via-red-600 to-pink-600' 
            : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Zap size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{getModalTitle()}</h2>
                <p className="text-blue-100">
                  {getModalSubtitle()}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-xl transition-all duration-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row h-[calc(95vh-120px)]">
          {/* Left Panel - Compose (60% width on desktop) */}
          <div className="flex-1 lg:w-3/5 p-6 overflow-y-auto border-r border-gray-200">
            <div className="space-y-6">
              {/* Post Type Selector */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-100">
                <h3 className="font-semibold mb-4 flex items-center space-x-2 text-gray-800">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Send size={16} className="text-white" />
                  </div>
                  <span>Content Type</span>
                </h3>
                <div className="flex bg-white p-1 rounded-lg shadow-sm">
                  {(['post', 'story', 'reel'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setPostType(type)}
                      className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                        postType === type
                          ? 'bg-blue-500 text-white shadow-md transform scale-105'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
                
                {/* Reel specific option */}
                {postType === 'reel' && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareToFeed}
                        onChange={(e) => setShareToFeed(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Also share to Feed</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Compose Section */}
              <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-xl p-6 border border-gray-100">
                <h3 className="font-semibold mb-4 flex items-center space-x-2 text-gray-800">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <Image size={16} className="text-white" />
                  </div>
                  <span>Compose Your {postType.charAt(0).toUpperCase() + postType.slice(1)}</span>
                </h3>
                <PostComposer
                  content={content}
                  media={media}
                  onContentChange={setContent}
                  onMediaUpload={setMedia}
                  postType={postType}
                />
              </div>

              {/* Platform Selection */}
              <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl p-6 border border-gray-100">
                <h3 className="font-semibold mb-4 flex items-center space-x-2 text-gray-800">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Send size={16} className="text-white" />
                  </div>
                  <span>Select Platforms</span>
                </h3>
                <PlatformSelector
                  selectedPlatforms={selectedPlatforms}
                  onPlatformToggle={handlePlatformToggle}
                  connectedAccounts={connectedAccounts}
                />
              </div>

              {/* Schedule Section */}
              <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-6 border border-gray-100">
                <h3 className="font-semibold mb-4 flex items-center space-x-2 text-gray-800">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <Clock size={16} className="text-white" />
                  </div>
                  <span>Schedule Options</span>
                  {(prefilledDate || editingPost) && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {editingPost 
                        ? `Editing: ${new Date(editingPost.scheduledAt).toLocaleDateString()}`
                        : `Pre-scheduled: ${prefilledDate?.toLocaleDateString()}`
                      }
                    </span>
                  )}
                </h3>
                <SchedulePicker
                  scheduledAt={scheduledAt}
                  onScheduleChange={setScheduledAt}
                  onPublish={handlePublish}
                  isValid={isValid}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - Preview (40% width on desktop) */}
          <div className="w-full lg:w-2/5 bg-gradient-to-br from-gray-50 to-blue-50 p-6 overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-br from-gray-50 to-blue-50 pb-4 mb-4">
              <h3 className="font-semibold flex items-center space-x-2 text-gray-800">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Video size={16} className="text-white" />
                </div>
                <span>Live Preview</span>
                {editingPost && (
                  <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                    Editing Mode
                  </span>
                )}
              </h3>
            </div>
            
            <PostPreview
              content={content}
              media={media}
              selectedPlatforms={selectedPlatforms}
              postType={postType}
              shareToFeed={shareToFeed}
            />

            {/* Enhanced Quick Stats */}
            <div className="mt-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <h4 className="font-semibold mb-4 text-gray-800">Post Analytics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{content.length}</div>
                  <div className="text-xs text-blue-500 font-medium">Characters</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{selectedPlatforms.length}</div>
                  <div className="text-xs text-green-500 font-medium">Platforms</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{media.length}</div>
                  <div className="text-xs text-purple-500 font-medium">Media Files</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">
                    {scheduledAt ? '⏰' : '🚀'}
                  </div>
                  <div className="text-xs text-yellow-500 font-medium">
                    {scheduledAt ? 'Scheduled' : 'Instant'}
                  </div>
                </div>
              </div>
              
              {/* Editing indicator */}
              {editingPost && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-orange-700">
                      Editing Post ID: {editingPost.id}
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    Original status: {editingPost.status} | Created: {new Date(editingPost.scheduledAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComposeModal;






































// 7/18/2025 2:55

// 'use client';
// import React, { useState, useEffect } from 'react';
// import { X, Send, Clock, Calendar, Image, Video, Link, Smile, Zap } from 'lucide-react';
// import PostComposer from './PostComposer';
// import PlatformSelector from './PlatformSelector';
// import PostPreview from './PostPreview';
// import SchedulePicker from './SchedulePicker';
// import { SocialAccount } from '@/lib/types/post-publisher/social-media';

// interface ComposeModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onPublish: (postData: any, publishType: 'now' | 'schedule' | 'draft', scheduledAt: Date) => void;
//   connectedAccounts: SocialAccount[];
//   selectedChannel?: string;
//   prefilledDate?: Date | null;
//   prefilledTime?: string;
// }

// const ComposeModal: React.FC<ComposeModalProps> = ({
//   isOpen,
//   onClose,
//   onPublish,
//   connectedAccounts,
//   selectedChannel,
//   prefilledDate = null,
//   prefilledTime = '09:00'
// }) => {
//   const [content, setContent] = useState('');
//   const [media, setMedia] = useState<File[]>([]);
//   const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
//   const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
//   const [postType, setPostType] = useState<'post' | 'story' | 'reel'>('post');
//   const [shareToFeed, setShareToFeed] = useState(false);

//   // Effect to handle prefilled date from calendar
//   useEffect(() => {
//     if (prefilledDate && isOpen) {
//       const scheduledDate = new Date(prefilledDate);
//       const [hours, minutes] = prefilledTime.split(':');
//       scheduledDate.setHours(parseInt(hours), parseInt(minutes));
//       setScheduledAt(scheduledDate);
//     }
//   }, [prefilledDate, prefilledTime, isOpen]);

//   const handlePlatformToggle = (platform: string) => {
//     setSelectedPlatforms(prev => 
//       prev.includes(platform) 
//         ? prev.filter(p => p !== platform)
//         : [...prev, platform]
//     );
//   };

//   const handlePublish = (publishType: 'now' | 'schedule' | 'draft', scheduledDate?: Date) => {
//     let status: 'published' | 'scheduled' | 'draft' = 'draft';
//     let postScheduledAt: Date;

//     // Determine status and scheduled time based on publish type
//     switch (publishType) {
//       case 'now':
//         status = 'published';
//         postScheduledAt = new Date(); // Current time for published posts
//         break;
//       case 'schedule':
//         status = 'scheduled';
//         postScheduledAt = scheduledDate || scheduledAt || new Date();
//         break;
//       case 'draft':
//         status = 'draft';
//         postScheduledAt = new Date(); // Current time for drafts
//         break;
//       default:
//         postScheduledAt = new Date();
//     }

//     const postData = {
//       id: `post-${Date.now()}`, // Generate a unique ID
//       content,
//       media: [...media],
//       platforms: selectedPlatforms,
//       scheduledAt: postScheduledAt,
//       status,
//       postType,
//       shareToFeed: postType === 'reel' ? shareToFeed : false,
//       createdBy: 'current-user' // You might want to get this from auth context
//     };
    
//     onPublish(postData, publishType, postScheduledAt);
//     handleClose();
//   };

//   const handleClose = () => {
//     setContent('');
//     setMedia([]);
//     setSelectedPlatforms([]);
//     setScheduledAt(null);
//     setPostType('post');
//     setShareToFeed(false);
//     onClose();
//   };

//   const isValid = content.trim().length > 0 && selectedPlatforms.length > 0;

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-6">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center space-x-3">
//               <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
//                 <Zap size={24} />
//               </div>
//               <div>
//                 <h2 className="text-2xl font-bold">Create New Post</h2>
//                 <p className="text-blue-100">
//                   {prefilledDate 
//                     ? `Scheduling for ${prefilledDate.toLocaleDateString()} at ${prefilledTime}`
//                     : 'Share your content across all platforms'
//                   }
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={handleClose}
//               className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-xl transition-all duration-200"
//             >
//               <X size={24} />
//             </button>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="flex flex-col lg:flex-row h-[calc(95vh-120px)]">
//           {/* Left Panel - Compose (60% width on desktop) */}
//           <div className="flex-1 lg:w-3/5 p-6 overflow-y-auto border-r border-gray-200">
//             <div className="space-y-6">
//               {/* Post Type Selector */}
//               <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-100">
//                 <h3 className="font-semibold mb-4 flex items-center space-x-2 text-gray-800">
//                   <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
//                     <Send size={16} className="text-white" />
//                   </div>
//                   <span>Content Type</span>
//                 </h3>
//                 <div className="flex bg-white p-1 rounded-lg shadow-sm">
//                   {(['post', 'story', 'reel'] as const).map((type) => (
//                     <button
//                       key={type}
//                       onClick={() => setPostType(type)}
//                       className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
//                         postType === type
//                           ? 'bg-blue-500 text-white shadow-md transform scale-105'
//                           : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
//                       }`}
//                     >
//                       {type.charAt(0).toUpperCase() + type.slice(1)}
//                     </button>
//                   ))}
//                 </div>
                
//                 {/* Reel specific option */}
//                 {postType === 'reel' && (
//                   <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
//                     <label className="flex items-center space-x-3 cursor-pointer">
//                       <input
//                         type="checkbox"
//                         checked={shareToFeed}
//                         onChange={(e) => setShareToFeed(e.target.checked)}
//                         className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                       />
//                       <span className="text-sm font-medium text-gray-700">Also share to Feed</span>
//                     </label>
//                   </div>
//                 )}
//               </div>

//               {/* Compose Section */}
//               <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-xl p-6 border border-gray-100">
//                 <h3 className="font-semibold mb-4 flex items-center space-x-2 text-gray-800">
//                   <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
//                     <Image size={16} className="text-white" />
//                   </div>
//                   <span>Compose Your {postType.charAt(0).toUpperCase() + postType.slice(1)}</span>
//                 </h3>
//                 <PostComposer
//                   content={content}
//                   media={media}
//                   onContentChange={setContent}
//                   onMediaUpload={setMedia}
//                   postType={postType}
//                 />
//               </div>

//               {/* Platform Selection */}
//               <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl p-6 border border-gray-100">
//                 <h3 className="font-semibold mb-4 flex items-center space-x-2 text-gray-800">
//                   <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
//                     <Send size={16} className="text-white" />
//                   </div>
//                   <span>Select Platforms</span>
//                 </h3>
//                 <PlatformSelector
//                   selectedPlatforms={selectedPlatforms}
//                   onPlatformToggle={handlePlatformToggle}
//                   connectedAccounts={connectedAccounts}
//                 />
//               </div>

//               {/* Schedule Section */}
//               <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-6 border border-gray-100">
//                 <h3 className="font-semibold mb-4 flex items-center space-x-2 text-gray-800">
//                   <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
//                     <Clock size={16} className="text-white" />
//                   </div>
//                   <span>Schedule Options</span>
//                   {prefilledDate && (
//                     <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
//                       Pre-scheduled: {prefilledDate.toLocaleDateString()}
//                     </span>
//                   )}
//                 </h3>
//                 <SchedulePicker
//                   scheduledAt={scheduledAt}
//                   onScheduleChange={setScheduledAt}
//                   onPublish={handlePublish}
//                   isValid={isValid}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Right Panel - Preview (40% width on desktop) */}
//           <div className="w-full lg:w-2/5 bg-gradient-to-br from-gray-50 to-blue-50 p-6 overflow-y-auto">
//             <div className="sticky top-0 bg-gradient-to-br from-gray-50 to-blue-50 pb-4 mb-4">
//               <h3 className="font-semibold flex items-center space-x-2 text-gray-800">
//                 <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
//                   <Video size={16} className="text-white" />
//                 </div>
//                 <span>Live Preview</span>
//               </h3>
//             </div>
            
//             <PostPreview
//               content={content}
//               media={media}
//               selectedPlatforms={selectedPlatforms}
//               postType={postType}
//               shareToFeed={shareToFeed}
//             />

//             {/* Enhanced Quick Stats */}
//             <div className="mt-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
//               <h4 className="font-semibold mb-4 text-gray-800">Post Analytics</h4>
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
//                   <div className="text-2xl font-bold text-blue-600">{content.length}</div>
//                   <div className="text-xs text-blue-500 font-medium">Characters</div>
//                 </div>
//                 <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
//                   <div className="text-2xl font-bold text-green-600">{selectedPlatforms.length}</div>
//                   <div className="text-xs text-green-500 font-medium">Platforms</div>
//                 </div>
//                 <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
//                   <div className="text-2xl font-bold text-purple-600">{media.length}</div>
//                   <div className="text-xs text-purple-500 font-medium">Media Files</div>
//                 </div>
//                 <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
//                   <div className="text-2xl font-bold text-yellow-600">
//                     {scheduledAt ? '⏰' : '🚀'}
//                   </div>
//                   <div className="text-xs text-yellow-500 font-medium">
//                     {scheduledAt ? 'Scheduled' : 'Instant'}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ComposeModal;


























// Work in progress, do not use this code yet
// 'use client';
// import React, { useState } from 'react';
// import { X, Send, Clock, Calendar, Image, Video, Link, Smile, Zap } from 'lucide-react';
// import PostComposer from './PostComposer';
// import PlatformSelector from './PlatformSelector';
// import PostPreview from './PostPreview';
// import SchedulePicker from './SchedulePicker';
// import { SocialAccount } from '@/lib/types/post-publisher/social-media';

// interface ComposeModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onPublish: (postData: any, publishType: 'now' | 'schedule' | 'draft', scheduledAt: Date) => void;
//   connectedAccounts: SocialAccount[];
//   selectedChannel?: string;
// }

// const ComposeModal: React.FC<ComposeModalProps> = ({
//   isOpen,
//   onClose,
//   onPublish,
//   connectedAccounts,
//   selectedChannel
// }) => {
//   const [content, setContent] = useState('');
//   const [media, setMedia] = useState<File[]>([]);
//   const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
//   const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
//   const [postType, setPostType] = useState<'post' | 'story' | 'reel'>('post');
//   const [shareToFeed, setShareToFeed] = useState(false);

//   const handlePlatformToggle = (platform: string) => {
//     setSelectedPlatforms(prev => 
//       prev.includes(platform) 
//         ? prev.filter(p => p !== platform)
//         : [...prev, platform]
//     );
//   };

//   const handlePublish = (publishType: 'now' | 'schedule' | 'draft', scheduledDate?: Date) => {
//     let status: 'published' | 'scheduled' | 'draft' = 'draft';
//     let postScheduledAt: Date;

//     // Determine status and scheduled time based on publish type
//     switch (publishType) {
//       case 'now':
//         status = 'published';
//         postScheduledAt = new Date(); // Current time for published posts
//         break;
//       case 'schedule':
//         status = 'scheduled';
//         postScheduledAt = scheduledDate || scheduledAt || new Date();
//         break;
//       case 'draft':
//         status = 'draft';
//         postScheduledAt = new Date(); // Current time for drafts
//         break;
//       default:
//         postScheduledAt = new Date();
//     }

//     const postData = {
//       content,
//       media: [...media],
//       platforms: selectedPlatforms,
//       scheduledAt: postScheduledAt,
//       status,
//       postType,
//       shareToFeed: postType === 'reel' ? shareToFeed : false
//     };
    
//     onPublish(postData, publishType, postScheduledAt);
//     handleClose();
//   };

//   const handleClose = () => {
//     setContent('');
//     setMedia([]);
//     setSelectedPlatforms([]);
//     setScheduledAt(null);
//     setPostType('post');
//     setShareToFeed(false);
//     onClose();
//   };

//   const isValid = content.trim().length > 0 && selectedPlatforms.length > 0;

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-6">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center space-x-3">
//               <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
//                 <Zap size={24} />
//               </div>
//               <div>
//                 <h2 className="text-2xl font-bold">Create New Post</h2>
//                 <p className="text-blue-100">Share your content across all platforms</p>
//               </div>
//             </div>
//             <button
//               onClick={handleClose}
//               className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-xl transition-all duration-200"
//             >
//               <X size={24} />
//             </button>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="flex flex-col lg:flex-row h-[calc(95vh-120px)]">
//           {/* Left Panel - Compose (60% width on desktop) */}
//           <div className="flex-1 lg:w-3/5 p-6 overflow-y-auto border-r border-gray-200">
//             <div className="space-y-6">
//               {/* Post Type Selector */}
//               <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-100">
//                 <h3 className="font-semibold mb-4 flex items-center space-x-2 text-gray-800">
//                   <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
//                     <Send size={16} className="text-white" />
//                   </div>
//                   <span>Content Type</span>
//                 </h3>
//                 <div className="flex bg-white p-1 rounded-lg shadow-sm">
//                   {(['post', 'story', 'reel'] as const).map((type) => (
//                     <button
//                       key={type}
//                       onClick={() => setPostType(type)}
//                       className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
//                         postType === type
//                           ? 'bg-blue-500 text-white shadow-md transform scale-105'
//                           : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
//                       }`}
//                     >
//                       {type.charAt(0).toUpperCase() + type.slice(1)}
//                     </button>
//                   ))}
//                 </div>
                
//                 {/* Reel specific option */}
//                 {postType === 'reel' && (
//                   <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
//                     <label className="flex items-center space-x-3 cursor-pointer">
//                       <input
//                         type="checkbox"
//                         checked={shareToFeed}
//                         onChange={(e) => setShareToFeed(e.target.checked)}
//                         className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                       />
//                       <span className="text-sm font-medium text-gray-700">Also share to Feed</span>
//                     </label>
//                   </div>
//                 )}
//               </div>

//               {/* Compose Section */}
//               <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-xl p-6 border border-gray-100">
//                 <h3 className="font-semibold mb-4 flex items-center space-x-2 text-gray-800">
//                   <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
//                     <Image size={16} className="text-white" />
//                   </div>
//                   <span>Compose Your {postType.charAt(0).toUpperCase() + postType.slice(1)}</span>
//                 </h3>
//                 <PostComposer
//                   content={content}
//                   media={media}
//                   onContentChange={setContent}
//                   onMediaUpload={setMedia}
//                   postType={postType}
//                 />
//               </div>

//               {/* Platform Selection */}
//               <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl p-6 border border-gray-100">
//                 <h3 className="font-semibold mb-4 flex items-center space-x-2 text-gray-800">
//                   <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
//                     <Send size={16} className="text-white" />
//                   </div>
//                   <span>Select Platforms</span>
//                 </h3>
//                 <PlatformSelector
//                   selectedPlatforms={selectedPlatforms}
//                   onPlatformToggle={handlePlatformToggle}
//                   connectedAccounts={connectedAccounts}
//                 />
//               </div>

//               {/* Schedule Section */}
//               <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-6 border border-gray-100">
//                 <h3 className="font-semibold mb-4 flex items-center space-x-2 text-gray-800">
//                   <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
//                     <Clock size={16} className="text-white" />
//                   </div>
//                   <span>Schedule Options</span>
//                 </h3>
//                 <SchedulePicker
//                   scheduledAt={scheduledAt}
//                   onScheduleChange={setScheduledAt}
//                   onPublish={handlePublish}
//                   isValid={isValid}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Right Panel - Preview (40% width on desktop) */}
//           <div className="w-full lg:w-2/5 bg-gradient-to-br from-gray-50 to-blue-50 p-6 overflow-y-auto">
//             <div className="sticky top-0 bg-gradient-to-br from-gray-50 to-blue-50 pb-4 mb-4">
//               <h3 className="font-semibold flex items-center space-x-2 text-gray-800">
//                 <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
//                   <Video size={16} className="text-white" />
//                 </div>
//                 <span>Live Preview</span>
//               </h3>
//             </div>
            
//             <PostPreview
//               content={content}
//               media={media}
//               selectedPlatforms={selectedPlatforms}
//               postType={postType}
//               shareToFeed={shareToFeed}
//             />

//             {/* Enhanced Quick Stats */}
//             <div className="mt-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
//               <h4 className="font-semibold mb-4 text-gray-800">Post Analytics</h4>
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
//                   <div className="text-2xl font-bold text-blue-600">{content.length}</div>
//                   <div className="text-xs text-blue-500 font-medium">Characters</div>
//                 </div>
//                 <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
//                   <div className="text-2xl font-bold text-green-600">{selectedPlatforms.length}</div>
//                   <div className="text-xs text-green-500 font-medium">Platforms</div>
//                 </div>
//                 <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
//                   <div className="text-2xl font-bold text-purple-600">{media.length}</div>
//                   <div className="text-xs text-purple-500 font-medium">Media Files</div>
//                 </div>
//                 <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
//                   <div className="text-2xl font-bold text-yellow-600">
//                     {scheduledAt ? '⏰' : '🚀'}
//                   </div>
//                   <div className="text-xs text-yellow-500 font-medium">
//                     {scheduledAt ? 'Scheduled' : 'Instant'}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ComposeModal;




















































// 'use client';

// import React, { useState } from 'react';
// import { X, Image, Video, Link, Smile, MapPin } from 'lucide-react';
// import SchedulePicker from './SchedulePicker';
// import { SocialAccount, renderPlatformIcon } from '@/lib/types/post-publisher/social-media';

// interface ComposeModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onPublish: (postData: any, publishType: 'now' | 'schedule' | 'draft', scheduledAt?: Date) => void;
//   connectedAccounts: SocialAccount[];
//   selectedChannel: string;
// }

// const ComposeModal: React.FC<ComposeModalProps> = ({
//   isOpen,
//   onClose,
//   onPublish,
//   connectedAccounts,
//   selectedChannel
// }) => {
//   const [content, setContent] = useState('');
//   const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
//   const [media, setMedia] = useState<File[]>([]);
//   const [scheduledAt, setScheduledAt] = useState<Date | null>(null);

//   // Get available platforms (connected accounts only)
//   const availablePlatforms = connectedAccounts.filter(acc => acc.connected);

//   // Initialize selected platforms based on selectedChannel
//   React.useEffect(() => {
//     if (selectedChannel === 'all') {
//       setSelectedPlatforms(availablePlatforms.map(acc => acc.platform));
//     } else {
//       const channelAccount = availablePlatforms.find(acc => acc.platform === selectedChannel);
//       setSelectedPlatforms(channelAccount ? [channelAccount.platform] : []);
//     }
//   }, [selectedChannel, availablePlatforms]);

//   const handlePlatformToggle = (platform: string) => {
//     setSelectedPlatforms(prev => 
//       prev.includes(platform) 
//         ? prev.filter(p => p !== platform)
//         : [...prev, platform]
//     );
//   };

//   const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = Array.from(e.target.files || []);
//     setMedia(prev => [...prev, ...files]);
//   };

//   const removeMedia = (index: number) => {
//     setMedia(prev => prev.filter((_, i) => i !== index));
//   };

//   const handlePublish = (publishType: 'now' | 'schedule' | 'draft', scheduledDate?: Date) => {
//     const postData = {
//       content,
//       platforms: selectedPlatforms,
//       media,
//     };

//     onPublish(postData, publishType, scheduledDate);
    
//     // Reset form
//     setContent('');
//     setSelectedPlatforms(selectedChannel === 'all' ? availablePlatforms.map(acc => acc.platform) : [selectedChannel]);
//     setMedia([]);
//     setScheduledAt(null);
//     onClose();
//   };

//   const isValid = content.trim() !== '' && selectedPlatforms.length > 0;

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
//         {/* Header */}
//         <div className="flex justify-between items-center p-6 border-b">
//           <h2 className="text-xl font-semibold">Create New Post</h2>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//           >
//             <X size={20} />
//           </button>
//         </div>

//         <div className="p-6 space-y-6">
//           {/* Platform Selection */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-3">
//               Select Platforms
//             </label>
//             <div className="grid grid-cols-2 gap-3">
//               {availablePlatforms.map(account => (
//                 <label
//                   key={account.id}
//                   className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
//                     selectedPlatforms.includes(account.platform)
//                       ? 'border-blue-500 bg-blue-50'
//                       : 'border-gray-200 hover:bg-gray-50'
//                   }`}
//                 >
//                   <input
//                     type="checkbox"
//                     checked={selectedPlatforms.includes(account.platform)}
//                     onChange={() => handlePlatformToggle(account.platform)}
//                     className="w-4 h-4 text-blue-600"
//                   />
//                   <div className="flex items-center space-x-2">
//                     {renderPlatformIcon(account.platform, 20)}
//                     <span className="text-sm font-medium">{account.username}</span>
//                   </div>
//                 </label>
//               ))}
//             </div>
//           </div>

//           {/* Content Input */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Content
//             </label>
//             <textarea
//               value={content}
//               onChange={(e) => setContent(e.target.value)}
//               placeholder="What's on your mind?"
//               className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
//               rows={4}
//             />
//             <div className="flex justify-between items-center mt-2">
//               <div className="flex space-x-2">
//                 <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
//                   <Image size={16} className="text-gray-500" />
//                 </button>
//                 <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
//                   <Video size={16} className="text-gray-500" />
//                 </button>
//                 <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
//                   <Link size={16} className="text-gray-500" />
//                 </button>
//                 <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
//                   <Smile size={16} className="text-gray-500" />
//                 </button>
//                 <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
//                   <MapPin size={16} className="text-gray-500" />
//                 </button>
//               </div>
//               <span className="text-sm text-gray-500">
//                 {content.length}/280
//               </span>
//             </div>
//           </div>

//           {/* Media Upload */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Media
//             </label>
//             <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
//               <input
//                 type="file"
//                 multiple
//                 accept="image/*,video/*"
//                 onChange={handleMediaUpload}
//                 className="hidden"
//                 id="media-upload"
//               />
//               <label
//                 htmlFor="media-upload"
//                 className="cursor-pointer flex flex-col items-center"
//               >
//                 <Image size={24} className="text-gray-400 mb-2" />
//                 <span className="text-sm text-gray-500">
//                   Click to upload images or videos
//                 </span>
//               </label>
//             </div>

//             {/* Media Preview */}
//             {media.length > 0 && (
//               <div className="grid grid-cols-4 gap-2 mt-3">
//                 {media.map((file, index) => (
//                   <div key={index} className="relative">
//                     <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
//                       {file.type.startsWith('image/') ? (
//                         <img
//                           src={URL.createObjectURL(file)}
//                           alt="Preview"
//                           className="w-full h-full object-cover"
//                         />
//                       ) : (
//                         <video
//                           src={URL.createObjectURL(file)}
//                           className="w-full h-full object-cover"
//                         />
//                       )}
//                     </div>
//                     <button
//                       onClick={() => removeMedia(index)}
//                       className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
//                     >
//                       ×
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Schedule Picker */}
//           <SchedulePicker
//             onScheduleChange={setScheduledAt}
//             onPublish={handlePublish}
//             scheduledAt={scheduledAt}
//             isValid={isValid}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ComposeModal;

















































































































// 'use client';

// import React, { useState } from 'react';
// import { X, Send, Clock, Calendar, Image, Video, Link, Smile, Zap } from 'lucide-react';
// import PostComposer from './PostComposer';
// import PlatformSelector from './PlatformSelector';
// import PostPreview from './PostPreview';
// import SchedulePicker from './SchedulePicker';
// import { SocialAccount } from '@/lib/types/post-publisher/social-media';

// interface ComposeModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onPublish: (postData: any) => void;
//   connectedAccounts: SocialAccount[];
//   selectedChannel?: string;
// }

// const ComposeModal: React.FC<ComposeModalProps> = ({
//   isOpen,
//   onClose,
//   onPublish,
//   connectedAccounts,
//   selectedChannel
// }) => {
//   const [content, setContent] = useState('');
//   const [media, setMedia] = useState<File[]>([]);
//   const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
//   const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
//   const [activeTab, setActiveTab] = useState<'compose' | 'schedule'>('compose');

//   const handlePlatformToggle = (platform: string) => {
//     setSelectedPlatforms(prev => 
//       prev.includes(platform) 
//         ? prev.filter(p => p !== platform)
//         : [...prev, platform]
//     );
//   };

//   const handlePublish = (publishNow: boolean) => {
//     const postData = {
//       content,
//       media: [...media],
//       platforms: selectedPlatforms,
//       scheduledAt: publishNow ? new Date() : scheduledAt,
//       status: publishNow ? 'published' : 'scheduled'
//     };
    
//     onPublish(postData);
//     handleClose();
//   };

//   const handleClose = () => {
//     setContent('');
//     setMedia([]);
//     setSelectedPlatforms([]);
//     setScheduledAt(null);
//     setActiveTab('compose');
//     onClose();
//   };

//   const isValid = content.trim().length > 0 && selectedPlatforms.length > 0;

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
//                 <Zap size={20} />
//               </div>
//               <div>
//                 <h2 className="text-xl font-bold">Create New Post</h2>
//                 <p className="text-blue-100">Share your content across all platforms</p>
//               </div>
//             </div>
//             <button
//               onClick={handleClose}
//               className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
//             >
//               <X size={24} />
//             </button>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="flex h-[calc(90vh-120px)]">
//           {/* Left Panel - Compose */}
//           <div className="flex-1 p-6 overflow-y-auto">
//             <div className="space-y-6">
//               {/* Compose Section */}
//               <div className="bg-gray-50 rounded-xl p-4">
//                 <h3 className="font-semibold mb-4 flex items-center space-x-2">
//                   <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
//                     <Send size={16} className="text-blue-600" />
//                   </div>
//                   <span>Compose Your Post</span>
//                 </h3>
//                 <PostComposer
//                   content={content}
//                   media={media}
//                   onContentChange={setContent}
//                   onMediaUpload={setMedia}
//                 />
//               </div>

//               {/* Platform Selection */}
//               <div className="bg-gray-50 rounded-xl p-4">
//                 <h3 className="font-semibold mb-4 flex items-center space-x-2">
//                   <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
//                     <Image size={16} className="text-green-600" />
//                   </div>
//                   <span>Select Platforms</span>
//                 </h3>
//                 <PlatformSelector
//                   selectedPlatforms={selectedPlatforms}
//                   onPlatformToggle={handlePlatformToggle}
//                   connectedAccounts={connectedAccounts}
//                 />
//               </div>

//               {/* Schedule Section */}
//               <div className="bg-gray-50 rounded-xl p-4">
//                 <h3 className="font-semibold mb-4 flex items-center space-x-2">
//                   <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
//                     <Clock size={16} className="text-purple-600" />
//                   </div>
//                   <span>Schedule Options</span>
//                 </h3>
//                 <SchedulePicker
//                   scheduledAt={scheduledAt}
//                   onScheduleChange={setScheduledAt}
//                   onPublish={handlePublish}
//                   isValid={isValid}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Right Panel - Preview */}
//           <div className="w-1/2 bg-gray-50 p-6 border-l overflow-y-auto">
//             <div className="sticky top-0 bg-gray-50 pb-4 mb-4 border-b">
//               <h3 className="font-semibold flex items-center space-x-2">
//                 <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
//                   <Video size={16} className="text-indigo-600" />
//                 </div>
//                 <span>Live Preview</span>
//               </h3>
//             </div>
            
//             <PostPreview
//               content={content}
//               media={media}
//               selectedPlatforms={selectedPlatforms}
//             />

//             {/* Quick Stats */}
//             <div className="mt-6 p-4 bg-white rounded-xl border">
//               <h4 className="font-medium mb-3">Post Statistics</h4>
//               <div className="grid grid-cols-2 gap-3">
//                 <div className="text-center p-3 bg-blue-50 rounded-lg">
//                   <div className="text-2xl font-bold text-blue-600">{content.length}</div>
//                   <div className="text-xs text-blue-500">Characters</div>
//                 </div>
//                 <div className="text-center p-3 bg-green-50 rounded-lg">
//                   <div className="text-2xl font-bold text-green-600">{selectedPlatforms.length}</div>
//                   <div className="text-xs text-green-500">Platforms</div>
//                 </div>
//                 <div className="text-center p-3 bg-purple-50 rounded-lg">
//                   <div className="text-2xl font-bold text-purple-600">{media.length}</div>
//                   <div className="text-xs text-purple-500">Media Files</div>
//                 </div>
//                 <div className="text-center p-3 bg-yellow-50 rounded-lg">
//                   <div className="text-2xl font-bold text-yellow-600">
//                     {scheduledAt ? '⏰' : '🚀'}
//                   </div>
//                   <div className="text-xs text-yellow-500">
//                     {scheduledAt ? 'Scheduled' : 'Instant'}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ComposeModal;