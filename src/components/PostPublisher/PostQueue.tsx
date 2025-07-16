'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Edit, Trash2, Eye, MoreHorizontal, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { SocialPost, PLATFORMS, renderPlatformIcon } from '@/lib/types/post-publisher/social-media';

interface PostQueueProps {
  posts: SocialPost[];
  onEditPost: (post: SocialPost) => void;
  onDeletePost: (postId: string) => void;
  onViewPost: (post: SocialPost) => void;
}

type FilterType = 'all' | 'draft' | 'scheduled' | 'published' | 'failed';

interface StatusCounts {
  all: number;
  draft: number;
  scheduled: number;
  published: number;
  failed: number;
}

const PostQueue: React.FC<PostQueueProps> = ({
  posts,
  onEditPost,
  onDeletePost,
  onViewPost
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit size={16} className="text-gray-500" />;
      case 'scheduled':
        return <Clock size={16} className="text-blue-500" />;
      case 'published':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPosts = posts.filter(post => 
    filter === 'all' || post.status === filter
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusCounts = (): StatusCounts => {
    const counts: StatusCounts = {
      all: posts.length,
      draft: posts.filter(p => p.status === 'draft').length,
      scheduled: posts.filter(p => p.status === 'scheduled').length,
      published: posts.filter(p => p.status === 'published').length,
      failed: posts.filter(p => p.status === 'failed').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  const filterOptions: Array<{ key: FilterType; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'published', label: 'Published' },
    { key: 'failed', label: 'Failed' }
  ];

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Post Queue</h3>
        <div className="text-sm text-gray-500">
          {filteredPosts.length} of {posts.length} posts
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
        {filterOptions.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
            {statusCounts[key] > 0 && (
              <span className={`ml-1 text-xs ${
                filter === key ? 'text-blue-500' : 'text-gray-500'
              }`}>
                ({statusCounts[key]})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto text-gray-400 mb-2" size={48} />
            <p className="text-gray-500">
              {filter === 'all' ? 'No posts yet' : `No ${filter} posts`}
            </p>
          </div>
        ) : (
          filteredPosts.map(post => (
            <div
              key={post.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {getStatusIcon(post.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(post.scheduledAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 line-clamp-2">
                    {post.content || 'No content'}
                  </p>
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === post.id ? null : post.id)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  
                  {activeDropdown === post.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => {
                          onViewPost(post);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                      {post.status !== 'published' && (
                        <button
                          onClick={() => {
                            onEditPost(post);
                            setActiveDropdown(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onDeletePost(post.id);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center space-x-2"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Platforms */}
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs text-gray-500">Platforms:</span>
                <div className="flex items-center space-x-1">
                  {post.platforms.map(platformId => (
                    <div key={platformId} className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
                      {renderPlatformIcon(platformId, 14, "text-gray-600")}
                    </div>
                  ))}
                </div>
              </div>

              {/* Media Preview */}
              {post.media.length > 0 && (
                <div className="flex space-x-1">
                  {post.media.slice(0, 3).map((file, index) => (
                    <div key={index} className="w-8 h-8 bg-gray-200 rounded overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Media"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {post.media.length > 3 && (
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600">
                      +{post.media.length - 3}
                    </div>
                  )}
                </div>
              )}

              {/* Analytics for published posts */}
              {post.status === 'published' && post.analytics && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {Object.values(post.analytics).reduce((sum, data) => sum + data.reach, 0)}
                      </div>
                      <div className="text-gray-500">Reach</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {Object.values(post.analytics).reduce((sum, data) => sum + data.likes, 0)}
                      </div>
                      <div className="text-gray-500">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {Object.values(post.analytics).reduce((sum, data) => sum + data.clicks, 0)}
                      </div>
                      <div className="text-gray-500">Clicks</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {Object.values(post.analytics).reduce((sum, data) => sum + data.shares, 0)}
                      </div>
                      <div className="text-gray-500">Shares</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PostQueue;