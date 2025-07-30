'use client';

import React, { useState, useRef } from 'react';
import { Image, Video, Link, Smile, X, Upload, Plus } from 'lucide-react';

interface PostComposerProps {
  onContentChange: (content: string) => void;
  onMediaUpload: (files: File[]) => void;
  content: string;
  media: File[];
  postType?: 'post' | 'story' | 'reel';
}

const PostComposer: React.FC<PostComposerProps> = ({
  onContentChange,
  onMediaUpload,
  content,
  media,
  postType = 'post'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [charCount, setCharCount] = useState(content.length);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    onContentChange(newContent);
    setCharCount(newContent.length);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onMediaUpload([...media, ...files]);
  };

  const removeMedia = (index: number) => {
    const updatedMedia = media.filter((_, i) => i !== index);
    onMediaUpload(updatedMedia);
  };

  const getPlaceholderText = () => {
    switch (postType) {
      case 'story':
        return "What's your story today?";
      case 'reel':
        return "Describe your reel...";
      default:
        return "What's happening?";
    }
  };

  const getCharacterLimit = () => {
    switch (postType) {
      case 'story':
        return 150;
      case 'reel':
        return 220;
      default:
        return 280;
    }
  };

  const characterLimit = getCharacterLimit();

  return (
    <div className="space-y-4">
      {/* Text Composer - Hide for Story */}
      {postType !== 'story' && (
        <div className="relative">
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder={getPlaceholderText()}
            className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg placeholder-gray-400 transition-all duration-200 bg-white shadow-sm"
            rows={postType === 'reel' ? 4 : 6}
            style={{ minHeight: postType === 'reel' ? '100px' : '150px' }}
          />
          <div className={`absolute bottom-3 right-3 text-sm font-medium ${
            charCount > characterLimit 
              ? 'text-red-500' 
              : charCount > characterLimit * 0.8 
                ? 'text-yellow-500' 
                : 'text-gray-500'
          }`}>
            {charCount}/{characterLimit}
          </div>
        </div>
      )}

      {/* Media Upload Section */}
      <div className="space-y-3">
        {/* Upload Buttons - Only show for Post type */}
        {postType === 'post' && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md text-sm"
            >
              <Image size={16} />
              <span>Photo</span>
            </button>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md text-sm"
            >
              <Video size={16} />
              <span>Video</span>
            </button>
            
            <button className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md text-sm">
              <Link size={16} />
              <span>Link</span>
            </button>
            
            <button className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md text-sm">
              <Smile size={16} />
              <span>Emoji</span>
            </button>
          </div>
        )}

        {/* Media Grid - Show uploaded media */}
        {media.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {media.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 w-[120px] h-[120px]">
                    {file.type.startsWith('video/') ? (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Video className="text-gray-400" size={20} />
                      </div>
                    ) : (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Upload preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Remove button */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                      <button
                        onClick={() => removeMedia(index)}
                        className="w-6 h-6 bg-gray-800 bg-opacity-70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-90"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add More Button */}
              {media.length < 10 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-[120px] h-[120px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 group"
                >
                  <div className="text-center">
                    <Plus size={16} className="text-gray-400 group-hover:text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 group-hover:text-gray-700">Add</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Drag and Drop Area - Only show when no media uploaded */}
        {media.length === 0 && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 cursor-pointer group ${
              postType === 'story' ? 'p-16' : 'p-6'
            }`}
          >
            <div className="space-y-2">
              <div className={`${postType === 'story' ? 'w-16 h-16' : 'w-10 h-10'} bg-gray-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-gray-200 transition-colors`}>
                <Upload size={postType === 'story' ? 28 : 20} className="text-gray-400 group-hover:text-gray-600" />
              </div>
              <div>
                <p className="text-gray-600 font-medium">
                  {postType === 'story' ? 'Drag & drop' : 'Drag & drop'}
                </p>
                <p className="text-sm text-gray-400">
                  {postType === 'story' ? 'or select a file' : 'or click to browse'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Story specific controls */}
        {postType === 'story' && (
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <Image size={18} className="text-gray-600" />
              </button>
            </div>
            
            <div className="flex space-x-2">
              <span className="text-sm text-gray-500">Add Stickers</span>
              <button className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Aa Text
              </button>
              <button className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                🔗 Link
              </button>
              <button className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                🎵 Music
              </button>
              <button className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                + Other
              </button>
              <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-1">
                <span>⚡ Automatic</span>
                <span className="text-xs">▼</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Info message for posts */}
      {postType === 'post' && (
        <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <p className="text-sm text-blue-700">
            For best results on your Instagram Grid and Feed, we recommend uploading images with a 4:5 aspect ratio.
          </p>
        </div>
      )}
    </div>
  );
};

export default PostComposer;














































// 'use client';

// import React, { useState, useRef } from 'react';
// import { Image, Video, Link, Smile, X } from 'lucide-react';

// interface PostComposerProps {
//   onContentChange: (content: string) => void;
//   onMediaUpload: (files: File[]) => void;
//   content: string;
//   media: File[];
// }

// const PostComposer: React.FC<PostComposerProps> = ({
//   onContentChange,
//   onMediaUpload,
//   content,
//   media
// }) => {
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const [charCount, setCharCount] = useState(content.length);

//   const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     const newContent = e.target.value;
//     onContentChange(newContent);
//     setCharCount(newContent.length);
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = Array.from(e.target.files || []);
//     onMediaUpload([...media, ...files]);
//   };

//   const removeMedia = (index: number) => {
//     const updatedMedia = media.filter((_, i) => i !== index);
//     onMediaUpload(updatedMedia);
//   };

//   return (
//     <div className="bg-white rounded-lg border p-4">
//       <div className="mb-4">
//         <textarea
//           value={content}
//           onChange={handleContentChange}
//           placeholder="What's on your mind?"
//           className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
//           rows={4}
//         />
//         <div className="flex justify-between items-center mt-2">
//           <div className="flex space-x-2">
//             <button
//               onClick={() => fileInputRef.current?.click()}
//               className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 px-3 py-1 rounded-lg hover:bg-gray-100"
//             >
//               <Image size={18} />
//               <span className="text-sm">Photo</span>
//             </button>
//             <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 px-3 py-1 rounded-lg hover:bg-gray-100">
//               <Video size={18} />
//               <span className="text-sm">Video</span>
//             </button>
//             <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 px-3 py-1 rounded-lg hover:bg-gray-100">
//               <Link size={18} />
//               <span className="text-sm">Link</span>
//             </button>
//             <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 px-3 py-1 rounded-lg hover:bg-gray-100">
//               <Smile size={18} />
//               <span className="text-sm">Emoji</span>
//             </button>
//           </div>
//           <span className={`text-sm ${charCount > 280 ? 'text-red-500' : 'text-gray-500'}`}>
//             {charCount}/280
//           </span>
//         </div>
//       </div>

//       <input
//         ref={fileInputRef}
//         type="file"
//         multiple
//         accept="image/*,video/*"
//         onChange={handleFileUpload}
//         className="hidden"
//       />

//       {media.length > 0 && (
//         <div className="grid grid-cols-2 gap-2 mb-4">
//           {media.map((file, index) => (
//             <div key={index} className="relative group">
//               <img
//                 src={URL.createObjectURL(file)}
//                 alt="Upload preview"
//                 className="w-full h-24 object-cover rounded-lg"
//               />
//               <button
//                 onClick={() => removeMedia(index)}
//                 className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
//               >
//                 <X size={12} />
//               </button>
//               <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
//                 {file.name.substring(0, 10)}...
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default PostComposer;