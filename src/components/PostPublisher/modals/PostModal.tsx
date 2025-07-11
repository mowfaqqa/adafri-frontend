import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Save, 
  Send, 
  Eye, 
  Settings, 
  FileText, 
  Tag,
  Clock,
  AlertCircle,
  Zap
} from 'lucide-react';
import PostModalContentTab from './PostModalContentTab';
import PostModalSettingsTab from './PostModalSettingsTab';
import PostModalMetadataTab from './PostModalMetadataTab';
import PostModalPreviewTab from './PostModalPreviewTab';
import { 
  Post, 
  PostStatus, 
  TeamMember, 
  POST_TYPE_CONFIG, 
  CATEGORY_CONFIG 
} from '@/lib/types/post-publisher/post';

interface PostModalProps {
  post?: Post;
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: Partial<Post>) => void;
  teamMembers: TeamMember[];
  mode?: 'create' | 'edit' | 'duplicate';
}

const PostModal: React.FC<PostModalProps> = ({
  post,
  isOpen,
  onClose,
  onSave,
  teamMembers,
  mode = 'create'
}) => {
  const [formData, setFormData] = useState<Partial<Post>>({
    title: '',
    content: '',
    type: 'email',
    category: 'communication',
    tags: [],
    status: 'draft',
    assignee: '',
    priority: 'medium',
    description: '',
    scheduledAt: undefined,
    dueDate: undefined,
    metadata: {
      customFields: {},
      integrationData: {},
      targetAudience: [],
      budgetAllocated: 0,
      expectedReach: 0,
      kpis: [],
      linkedModules: []
    }
  });

  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'metadata' | 'preview'>('content');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<Array<{key: string, value: string}>>([]);

  // Initialize form data
  useEffect(() => {
    if (!isOpen) return;

    if (post && mode !== 'create') {
      if (mode === 'duplicate') {
        setFormData({
          ...post,
          id: undefined,
          title: `Copy of ${post.title}`,
          status: 'draft',
          createdAt: undefined,
          scheduledAt: undefined,
          comments: [],
          history: []
        });
      } else {
        setFormData(post);
      }
    } else {
      // Reset form for new post
      setFormData({
        title: '',
        content: '',
        type: 'email',
        category: 'communication',
        tags: [],
        status: 'draft',
        assignee: '',
        priority: 'medium',
        description: '',
        scheduledAt: undefined,
        dueDate: undefined,
        metadata: {
          customFields: {},
          integrationData: {},
          targetAudience: [],
          budgetAllocated: 0,
          expectedReach: 0,
          kpis: [],
          linkedModules: []
        }
      });
    }
    
    setErrors({});
    setActiveTab('content');
    setUploadedFiles([]);
    setCustomFields([]);
    setTagInput('');
  }, [post, mode, isOpen]);

  // Update category when type changes
  useEffect(() => {
    if (formData.type) {
      const typeConfig = POST_TYPE_CONFIG[formData.type];
      if (typeConfig && formData.category !== typeConfig.category) {
        setFormData(prev => ({
          ...prev,
          category: typeConfig.category
        }));
      }
    }
  }, [formData.type, formData.category]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content?.trim()) {
      newErrors.content = 'Content is required';
    }

    if (!formData.assignee?.trim()) {
      newErrors.assignee = 'Assignee is required';
    }

    if (formData.scheduledAt && new Date(formData.scheduledAt) < new Date()) {
      newErrors.scheduledAt = 'Scheduled date must be in the future';
    }

    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = 'Due date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSave = useCallback(async (newStatus?: PostStatus) => {
    if (!validateForm()) {
      setActiveTab('settings'); // Switch to settings tab to show errors
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = {
        ...formData,
        status: newStatus || formData.status,
        media: uploadedFiles,
        metadata: {
          ...formData.metadata,
          customFields: customFields.reduce((acc, field) => {
            if (field.key && field.value) {
              acc[field.key] = field.value;
            }
            return acc;
          }, {} as Record<string, any>)
        }
      };

      await onSave(postData);
      onClose();
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, uploadedFiles, customFields, validateForm, onSave, onClose]);

  if (!isOpen) return null;

  const postTypeConfig = POST_TYPE_CONFIG[formData.type || 'email'];
  const categoryConfig = CATEGORY_CONFIG[formData.category || 'communication'];
  const errorCount = Object.keys(errors).length;

  const TabButton: React.FC<{ 
    tab: string; 
    label: string; 
    icon: React.ReactNode; 
    count?: number 
  }> = ({ tab, label, icon, count }) => (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors relative ${
        activeTab === tab
          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count && count > 0 && (
        <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${postTypeConfig.color} text-white shadow-lg`}>
              <span className="text-xl">{postTypeConfig.icon}</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'create' ? 'Create New Post' : mode === 'duplicate' ? 'Duplicate Post' : 'Edit Post'}
              </h2>
              <p className="text-sm text-gray-500 flex items-center space-x-2">
                <span>{postTypeConfig.label}</span>
                <span>•</span>
                <span className={`px-2 py-1 rounded-full text-xs ${categoryConfig.color} text-white`}>
                  {categoryConfig.icon} {categoryConfig.label}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isSubmitting && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Saving...</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <TabButton 
            tab="content" 
            label="Content" 
            icon={<FileText className="w-4 h-4" />} 
          />
          <TabButton 
            tab="settings" 
            label="Settings" 
            icon={<Settings className="w-4 h-4" />} 
            count={errorCount} 
          />
          <TabButton 
            tab="metadata" 
            label="Metadata" 
            icon={<Tag className="w-4 h-4" />} 
          />
          <TabButton 
            tab="preview" 
            label="Preview" 
            icon={<Eye className="w-4 h-4" />} 
          />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-240px)]">
          {activeTab === 'content' && (
            <PostModalContentTab
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              tagInput={tagInput}
              setTagInput={setTagInput}
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
            />
          )}

          {activeTab === 'settings' && (
            <PostModalSettingsTab
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              teamMembers={teamMembers}
            />
          )}

          {activeTab === 'metadata' && (
            <PostModalMetadataTab
              formData={formData}
              setFormData={setFormData}
              customFields={customFields}
              setCustomFields={setCustomFields}
            />
          )}

          {activeTab === 'preview' && (
            <PostModalPreviewTab
              formData={formData}
              uploadedFiles={uploadedFiles}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            {errorCount > 0 && (
              <div className="text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>Please fix {errorCount} error{errorCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSave('draft')}
              disabled={isSubmitting || !formData.title || !formData.assignee}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Draft'}</span>
            </button>
            
            <button
              onClick={() => handleSave('in_review')}
              disabled={isSubmitting || errorCount > 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>Send for Review</span>
            </button>

            {(formData.status === 'approved' || formData.status === 'scheduled') && (
              <button
                onClick={() => handleSave('published')}
                disabled={isSubmitting || errorCount > 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                <span>Publish Now</span>
              </button>
            )}

            {formData.scheduledAt && formData.status === 'draft' && (
              <button
                onClick={() => handleSave('scheduled')}
                disabled={isSubmitting || errorCount > 0}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Clock className="w-4 h-4" />
                <span>Schedule</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostModal;