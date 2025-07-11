import React from 'react';
import { 
  Post, 
  PostType, 
  PostStatus, 
  Priority, 
  PostCategory,
  TeamMember, 
  POST_TYPE_CONFIG, 
  STATUS_CONFIG, 
  PRIORITY_CONFIG,
  CATEGORY_CONFIG 
} from '@/lib/types/post-publisher/post';

interface PostModalSettingsTabProps {
  formData: Partial<Post>;
  setFormData: (data: Partial<Post>) => void;
  errors: Record<string, string>;
  teamMembers: TeamMember[];
}

const PostModalSettingsTab: React.FC<PostModalSettingsTabProps> = ({
  formData,
  setFormData,
  errors,
  teamMembers
}) => {
  const postTypeConfig = POST_TYPE_CONFIG[formData.type || 'email'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as PostType })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(POST_TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as PostCategory })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as PostStatus })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assignee <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.assignee}
            onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.assignee ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select assignee...</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.name}>
                {member.name} - {member.role}
              </option>
            ))}
          </select>
          {errors.assignee && <p className="text-red-500 text-sm mt-1">{errors.assignee}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
          <input
            type="datetime-local"
            value={formData.dueDate ? new Date(formData.dueDate).toISOString().slice(0, 16) : ''}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value ? new Date(e.target.value) : undefined })}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.dueDate ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.dueDate && <p className="text-red-500 text-sm mt-1">{errors.dueDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
          <input
            type="datetime-local"
            value={formData.scheduledAt ? new Date(formData.scheduledAt).toISOString().slice(0, 16) : ''}
            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value ? new Date(e.target.value) : undefined })}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.scheduledAt ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.scheduledAt && <p className="text-red-500 text-sm mt-1">{errors.scheduledAt}</p>}
        </div>
      </div>

      {/* Type-specific Settings */}
      {postTypeConfig.fields && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {postTypeConfig.label} Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {postTypeConfig.fields.map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {field.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Enter ${field}...`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostModalSettingsTab;