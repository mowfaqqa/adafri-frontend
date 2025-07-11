import React, { useState, useRef, useEffect } from 'react';
import {
  Filter,
  X,
  Search,
  Calendar,
  Tag,
  User,
  CheckCircle,
  RotateCcw,
  ChevronDown,
  Grid,
  List,
  SlidersHorizontal
} from 'lucide-react';
import { 
  PostFilter as PostFilterType, 
  PostType, 
  PostStatus, 
  PostCategory,
  Priority, 
  TeamMember,
  POST_TYPE_CONFIG,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  CATEGORY_CONFIG 
} from '@/lib/types/post-publisher/post';

interface PostFilterProps {
  onFilterChange: (filters: PostFilterType) => void;
  teamMembers: TeamMember[];
  activeFilters: PostFilterType;
  totalPosts: number;
  filteredCount: number;
  onViewModeChange?: (mode: 'board' | 'list' | 'grid') => void;
  viewMode?: 'board' | 'list' | 'grid';
}

const PostFilter: React.FC<PostFilterProps> = ({
  onFilterChange,
  teamMembers,
  activeFilters,
  totalPosts,
  filteredCount,
  onViewModeChange,
  viewMode = 'board'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'type' | 'status' | 'assignee' | 'advanced'>('type');
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (category: keyof PostFilterType, value: any) => {
    const newFilters = { ...activeFilters };
    
    if (category === 'type' || category === 'status' || category === 'assignee' || category === 'priority' || category === 'category' || category === 'tags') {
      const currentArray = (newFilters[category] as any[]) || [];
      if (currentArray.includes(value)) {
        newFilters[category] = currentArray.filter((item: any) => item !== value) as any;
      } else {
        newFilters[category] = [...currentArray, value] as any;
      }
    } else {
      newFilters[category] = value;
    }
    
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    onFilterChange({});
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    return Object.entries(activeFilters).reduce((count, [key, filter]) => {
      if (Array.isArray(filter)) {
        return count + filter.length;
      }
      return filter ? count + 1 : count;
    }, 0);
  };

  const FilterSection: React.FC<{
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
  }> = ({ title, children, icon }) => (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900 flex items-center space-x-2 text-sm">
        {icon}
        <span>{title}</span>
      </h4>
      {children}
    </div>
  );

  const FilterCheckbox: React.FC<{
    label: string;
    value: string;
    checked: boolean;
    onChange: () => void;
    color?: string;
    icon?: string;
    count?: number;
  }> = ({ label, value, checked, onChange, color, icon, count }) => (
    <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer group">
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div className="flex items-center space-x-2">
          {color && (
            <div className={`w-3 h-3 rounded-full ${color}`} />
          )}
          {icon && <span className="text-sm">{icon}</span>}
          <span className="text-sm text-gray-700 group-hover:text-gray-900">
            {label}
          </span>
        </div>
      </div>
      {count !== undefined && (
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {count}
        </span>
      )}
    </label>
  );

  return (
    <div className="flex items-center space-x-4">
      {/* Search */}
      <div className="flex-1 relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search posts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* View Mode Toggle */}
      {onViewModeChange && (
        <div className="flex items-center bg-white border border-gray-300 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('board')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'board' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Board View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Dropdown */}
      <div className="relative" ref={filterRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {getActiveFilterCount() > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              {getActiveFilterCount()}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-96">
            {/* Filter Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Filter Posts</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {filteredCount} of {totalPosts} posts
                </span>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-gray-200 divide-x divide-gray-200">
                {[
                { key: 'type', label: 'Type', icon: <Tag className="w-4 h-4" /> },
                { key: 'status', label: 'Status', icon: <CheckCircle className="w-4 h-4" /> },
                { key: 'assignee', label: 'People', icon: <User className="w-4 h-4" /> },
                { key: 'advanced', label: 'Advanced', icon: <SlidersHorizontal className="w-4 h-4" /> }
                ].map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`min-w-0 truncate flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors flex-1 justify-center ${
                    activeTab === tab.key
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                </button>
                ))}
            </div>

            {/* Filter Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {activeTab === 'type' && (
                <div className="space-y-4">
                  <FilterSection title="Post Type" icon={<Tag className="w-4 h-4" />}>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {Object.entries(POST_TYPE_CONFIG).map(([key, config]) => (
                        <FilterCheckbox
                          key={key}
                          label={config.label}
                          value={key}
                          checked={activeFilters.type?.includes(key as PostType) || false}
                          onChange={() => handleFilterChange('type', key)}
                          icon={config.icon}
                          color={config.color}
                        />
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection title="Category" icon={<Grid className="w-4 h-4" />}>
                    <div className="space-y-1">
                      {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <FilterCheckbox
                          key={key}
                          label={config.label}
                          value={key}
                          checked={activeFilters.category?.includes(key as PostCategory) || false}
                          onChange={() => handleFilterChange('category', key)}
                          icon={config.icon}
                          color={config.color}
                        />
                      ))}
                    </div>
                  </FilterSection>
                </div>
              )}

              {activeTab === 'status' && (
                <div className="space-y-4">
                  <FilterSection title="Status" icon={<CheckCircle className="w-4 h-4" />}>
                    <div className="space-y-1">
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <FilterCheckbox
                          key={key}
                          label={config.label}
                          value={key}
                          checked={activeFilters.status?.includes(key as PostStatus) || false}
                          onChange={() => handleFilterChange('status', key)}
                          icon={config.icon}
                        />
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection title="Priority" icon={<SlidersHorizontal className="w-4 h-4" />}>
                    <div className="space-y-1">
                      {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                        <FilterCheckbox
                          key={key}
                          label={config.label}
                          value={key}
                          checked={activeFilters.priority?.includes(key as Priority) || false}
                          onChange={() => handleFilterChange('priority', key)}
                          icon={config.icon}
                        />
                      ))}
                    </div>
                  </FilterSection>
                </div>
              )}

              {activeTab === 'assignee' && (
                <div className="space-y-4">
                  <FilterSection title="Assignee" icon={<User className="w-4 h-4" />}>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {teamMembers.map((member) => (
                        <FilterCheckbox
                          key={member.id}
                          label={`${member.name} - ${member.role}`}
                          value={member.name}
                          checked={activeFilters.assignee?.includes(member.name) || false}
                          onChange={() => handleFilterChange('assignee', member.name)}
                        />
                      ))}
                    </div>
                  </FilterSection>
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="space-y-4">
                  <FilterSection title="Date Range" icon={<Calendar className="w-4 h-4" />}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">From</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onChange={(e) => {
                            const dateRange = activeFilters.dateRange || { start: new Date(), end: new Date() };
                            handleFilterChange('dateRange', {
                              ...dateRange,
                              start: new Date(e.target.value)
                            });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">To</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onChange={(e) => {
                            const dateRange = activeFilters.dateRange || { start: new Date(), end: new Date() };
                            handleFilterChange('dateRange', {
                              ...dateRange,
                              end: new Date(e.target.value)
                            });
                          }}
                        />
                      </div>
                    </div>
                  </FilterSection>

                  <FilterSection title="Content Type">
                    <div className="space-y-2">
                      <FilterCheckbox
                        label="Has Media"
                        value="hasMedia"
                        checked={activeFilters.hasMedia || false}
                        onChange={() => handleFilterChange('hasMedia', !activeFilters.hasMedia)}
                      />
                      <FilterCheckbox
                        label="Has Comments"
                        value="hasComments"
                        checked={activeFilters.hasComments || false}
                        onChange={() => handleFilterChange('hasComments', !activeFilters.hasComments)}
                      />
                    </div>
                  </FilterSection>

                  <FilterSection title="Tags">
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Filter by tags..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleFilterChange('tags', [e.target.value]);
                          } else {
                            handleFilterChange('tags', []);
                          }
                        }}
                      />
                      <p className="text-xs text-gray-500">
                        Enter tag names to filter posts
                      </p>
                    </div>
                  </FilterSection>
                </div>
              )}
            </div>

            {/* Filter Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing {filteredCount} of {totalPosts} posts
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {getActiveFilterCount() > 0 && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Active:</span>
          <div className="flex flex-wrap gap-1">
            {activeFilters.type && activeFilters.type.map((type) => (
              <span
                key={type}
                className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
              >
                <span>{POST_TYPE_CONFIG[type].label}</span>
                <button
                  onClick={() => handleFilterChange('type', type)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            
            {activeFilters.status && activeFilters.status.map((status) => (
              <span
                key={status}
                className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
              >
                <span>{STATUS_CONFIG[status].label}</span>
                <button
                  onClick={() => handleFilterChange('status', status)}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            
            {activeFilters.assignee && activeFilters.assignee.map((assignee) => (
              <span
                key={assignee}
                className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
              >
                <span>{assignee}</span>
                <button
                  onClick={() => handleFilterChange('assignee', assignee)}
                  className="text-purple-600 hover:text-purple-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {activeFilters.priority && activeFilters.priority.map((priority) => (
              <span
                key={priority}
                className="inline-flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs"
              >
                <span>{PRIORITY_CONFIG[priority].label}</span>
                <button
                  onClick={() => handleFilterChange('priority', priority)}
                  className="text-orange-600 hover:text-orange-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostFilter;