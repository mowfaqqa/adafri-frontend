import React from 'react';
import { Eye, AlertCircle, Image, Video, File } from 'lucide-react';
import { 
  Post, 
  POST_TYPE_CONFIG, 
  STATUS_CONFIG, 
  PRIORITY_CONFIG,
  CATEGORY_CONFIG 
} from '@/lib/types/post-publisher/post';

interface PostModalPreviewTabProps {
  formData: Partial<Post>;
  uploadedFiles: any[];
}

const PostModalPreviewTab: React.FC<PostModalPreviewTabProps> = ({
  formData,
  uploadedFiles
}) => {
  const postTypeConfig = POST_TYPE_CONFIG[formData.type || 'email'];
  const categoryConfig = CATEGORY_CONFIG[formData.category || 'communication'];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Eye className="w-5 h-5 text-blue-600" />
          <span>Post Preview</span>
        </h3>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          {/* Preview Header */}
          <div className="flex items-center space-x-4 mb-6">
            <div className={`p-3 rounded-xl ${postTypeConfig.color} text-white`}>
              <span className="text-lg">{postTypeConfig.icon}</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-xl">
                {formData.title || 'Untitled Post'}
              </h4>
              <p className="text-sm text-gray-500 flex items-center space-x-2">
                <span>{postTypeConfig.label}</span>
                <span>•</span>
                <span className={`px-2 py-1 rounded-full text-xs ${categoryConfig.color} text-white`}>
                  {categoryConfig.label}
                </span>
              </p>
            </div>
          </div>

          {/* Preview Description */}
          {formData.description && (
            <div className="mb-4">
              <p className="text-gray-600 italic">{formData.description}</p>
            </div>
          )}

          {/* Preview Content */}
          <div className="mb-6">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: formData.content || '<p class="text-gray-500">No content yet...</p>' 
              }}
            />
          </div>

          {/* Preview Media */}
          {uploadedFiles.length > 0 && (
            <div className="mb-6">
              <h5 className="font-medium text-gray-900 mb-3">Attachments</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="relative">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                        {file.type.startsWith('video/') ? (
                          <Video className="w-6 h-6 text-purple-500" />
                        ) : (
                          <File className="w-6 h-6 text-gray-500" />
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Tags */}
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {formData.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Preview Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {formData.assignee ? formData.assignee.split(' ').map(n => n[0]).join('') : '??'}
              </div>
              <div>
                <div className="text-sm font-medium">{formData.assignee || 'Unassigned'}</div>
                <div className="text-xs text-gray-500">
                  {formData.scheduledAt 
                    ? `Scheduled for ${new Date(formData.scheduledAt).toLocaleDateString()}` 
                    : 'Created now'
                  }
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-xs ${PRIORITY_CONFIG[formData.priority || 'medium'].bgColor} ${PRIORITY_CONFIG[formData.priority || 'medium'].color}`}>
                {PRIORITY_CONFIG[formData.priority || 'medium'].icon} {PRIORITY_CONFIG[formData.priority || 'medium'].label}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs border-2 ${STATUS_CONFIG[formData.status || 'draft'].bgColor} ${STATUS_CONFIG[formData.status || 'draft'].color}`}>
                {STATUS_CONFIG[formData.status || 'draft'].icon} {STATUS_CONFIG[formData.status || 'draft'].label}
              </span>
            </div>
          </div>
        </div>

        {/* Metadata Preview */}
        {(formData.metadata?.targetAudience?.length || 
          formData.metadata?.budgetAllocated || 
          formData.metadata?.expectedReach) && (
          <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
            <h5 className="font-medium text-gray-900 mb-3">Campaign Details</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {formData.metadata?.targetAudience && formData.metadata.targetAudience.length > 0 && (
                <div>
                  <span className="text-gray-500">Target Audience:</span>
                  <p className="font-medium">{formData.metadata.targetAudience.join(', ')}</p>
                </div>
              )}
              {formData.metadata?.budgetAllocated && formData.metadata.budgetAllocated > 0 && (
                <div>
                  <span className="text-gray-500">Budget:</span>
                  <p className="font-medium">${formData.metadata.budgetAllocated.toLocaleString()}</p>
                </div>
              )}
              {formData.metadata?.expectedReach && formData.metadata.expectedReach > 0 && (
                <div>
                  <span className="text-gray-500">Expected Reach:</span>
                  <p className="font-medium">{formData.metadata.expectedReach.toLocaleString()} people</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preview Actions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Preview Notice</h4>
            <p className="text-sm text-yellow-700 mt-1">
              This is how your post will appear. The actual appearance may vary depending on the platform and device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostModalPreviewTab;