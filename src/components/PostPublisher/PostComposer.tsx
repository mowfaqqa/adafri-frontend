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
    <div className="space-y-6">
      {/* Text Composer */}
      <div className="relative">
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder={getPlaceholderText()}
          className="w-full p-6 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg placeholder-gray-400 transition-all duration-200 bg-white shadow-sm"
          rows={postType === 'story' ? 4 : 8}
          style={{ minHeight: postType === 'story' ? '120px' : '200px' }}
        />
        <div className={`absolute bottom-4 right-4 text-sm font-medium ${
          charCount > characterLimit 
            ? 'text-red-500' 
            : charCount > characterLimit * 0.8 
              ? 'text-yellow-500' 
              : 'text-gray-500'
        }`}>
          {charCount}/{characterLimit}
        </div>
      </div>

      {/* Media Upload Area */}
      <div className="space-y-4">
        {/* Upload Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border border-blue-200 shadow-sm hover:shadow-md transform hover:scale-105"
          >
            <Image size={18} />
            <span className="font-medium">Photo</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-200 border border-green-200 shadow-sm hover:shadow-md transform hover:scale-105">
            <Video size={18} />
            <span className="font-medium">Video</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-200 border border-purple-200 shadow-sm hover:shadow-md transform hover:scale-105">
            <Link size={18} />
            <span className="font-medium">Link</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 rounded-xl hover:from-yellow-100 hover:to-yellow-200 transition-all duration-200 border border-yellow-200 shadow-sm hover:shadow-md transform hover:scale-105">
            <Smile size={18} />
            <span className="font-medium">Emoji</span>
          </button>
        </div>

        {/* Drag and Drop Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer group"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-100 transition-colors">
              <Upload size={24} className="text-gray-400 group-hover:text-blue-500" />
            </div>
            <div>
              <p className="text-gray-600 font-medium">Drag & drop media here</p>
              <p className="text-sm text-gray-400">or click to browse</p>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Media Preview Grid */}
      {media.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800 flex items-center space-x-2">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{media.length}</span>
            </div>
            <span>Uploaded Media</span>
          </h4>
          
          <div className={`grid gap-4 ${
            media.length === 1 ? 'grid-cols-1' : 
            media.length === 2 ? 'grid-cols-2' : 
            'grid-cols-2 md:grid-cols-3'
          }`}>
            {media.map((file, index) => (
              <div key={index} className="relative group">
                <div className="relative overflow-hidden rounded-xl shadow-md">
                  {file.type.startsWith('video/') ? (
                    <div className="aspect-square bg-gray-900 flex items-center justify-center">
                      <Video className="text-white" size={32} />
                    </div>
                  ) : (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Upload preview"
                      className="w-full aspect-square object-cover"
                    />
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                    <button
                      onClick={() => removeMedia(index)}
                      className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 transform hover:scale-110"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                
                {/* File Info */}
                <div className="mt-2 px-2">
                  <p className="text-xs text-gray-500 truncate font-medium">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </div>
            ))}
            
            {/* Add More Button */}
            {media.length < 10 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="text-center">
                  <Plus size={24} className="text-gray-400 group-hover:text-blue-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 group-hover:text-blue-600">Add More</p>
                </div>
              </button>
            )}
          </div>
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