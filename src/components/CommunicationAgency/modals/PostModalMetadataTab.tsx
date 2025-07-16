import React from 'react';
import { UsersIcon, Link, DollarSign, Target, BarChart3, Plus, Trash2 } from 'lucide-react';
import { Post } from '@/lib/types/post-publisher/post';

interface PostModalMetadataTabProps {
  formData: Partial<Post>;
  setFormData: (data: Partial<Post>) => void;
  customFields: Array<{key: string, value: string}>;
  setCustomFields: (fields: Array<{key: string, value: string}>) => void;
}

const PostModalMetadataTab: React.FC<PostModalMetadataTabProps> = ({
  formData,
  setFormData,
  customFields,
  setCustomFields
}) => {
  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const updateCustomField = (index: number, field: 'key' | 'value', value: string) => {
    setCustomFields(customFields.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateMetadata = (key: string, value: any) => {
    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        [key]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <UsersIcon className="w-4 h-4 inline mr-1" />
            Target Audience
          </label>
          <input
            type="text"
            value={formData.metadata?.targetAudience?.join(', ') || ''}
            onChange={(e) => updateMetadata('targetAudience', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Customers, Internal Team, Prospects..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Link className="w-4 h-4 inline mr-1" />
            Campaign ID
          </label>
          <input
            type="text"
            value={formData.metadata?.campaignId || ''}
            onChange={(e) => updateMetadata('campaignId', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Link to campaign..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Budget Allocated
          </label>
          <input
            type="number"
            value={formData.metadata?.budgetAllocated || ''}
            onChange={(e) => updateMetadata('budgetAllocated', Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Target className="w-4 h-4 inline mr-1" />
            Expected Reach
          </label>
          <input
            type="number"
            value={formData.metadata?.expectedReach || ''}
            onChange={(e) => updateMetadata('expectedReach', Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Number of people..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <BarChart3 className="w-4 h-4 inline mr-1" />
          Key Performance Indicators (KPIs)
        </label>
        <textarea
          value={formData.metadata?.kpis?.join(', ') || ''}
          onChange={(e) => updateMetadata('kpis', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="List your success metrics (comma-separated)..."
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Linked Modules</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['CRM', 'Email Marketing', 'Social Media', 'Analytics', 'E-commerce', 'Support'].map((module) => (
            <label key={module} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.metadata?.linkedModules?.includes(module) || false}
                onChange={(e) => {
                  const linkedModules = formData.metadata?.linkedModules || [];
                  if (e.target.checked) {
                    updateMetadata('linkedModules', [...linkedModules, module]);
                  } else {
                    updateMetadata('linkedModules', linkedModules.filter(m => m !== module));
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{module}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Custom Fields</label>
          <button
            type="button"
            onClick={addCustomField}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Add Field</span>
          </button>
        </div>
        <div className="space-y-3">
          {customFields.map((field, index) => (
            <div key={index} className="flex space-x-3">
              <input
                type="text"
                placeholder="Field name"
                value={field.key}
                onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Field value"
                value={field.value}
                onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => removeCustomField(index)}
                className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {customFields.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No custom fields added yet. Click "Add Field" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostModalMetadataTab;