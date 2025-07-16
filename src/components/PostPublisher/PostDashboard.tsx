'use client';

import React, { useState } from 'react';
import { Plus, Settings, BarChart3, Calendar as CalendarIcon, List, Edit3, Send, Clock, Eye, Zap, Filter, Search, Bell } from 'lucide-react';
import PostQueue from './PostQueue';
import CalendarView from './CalendarView';
import SocialAccountConnect from './SocialAccountConnect';
import ComposeModal from './ComposeModal';
import ChannelSidebar from './ChannelSidebar';
import { SocialPost, SocialAccount, renderPlatformIcon } from '@/lib/types/post-publisher/social-media';

const PostDashboard: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'queue' | 'drafts' | 'sent' | 'analytics'>('queue');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Connected accounts (mock data)
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([
    { id: '1', platform: 'facebook', username: '@djombi', connected: true, avatar: 'https://via.placeholder.com/32' },
    { id: '2', platform: 'instagram', username: '@djombi_app', connected: true, avatar: 'https://via.placeholder.com/32' },
    { id: '3', platform: 'twitter', username: '@djombi', connected: false },
    { id: '4', platform: 'linkedin', username: 'Djombi', connected: true, avatar: 'https://via.placeholder.com/32' },
    { id: '5', platform: 'tiktok', username: '@djombi', connected: false },
  ]);
  
  // Posts (mock data)
  const [posts, setPosts] = useState<SocialPost[]>([
    {
      id: '1',
      content: 'Excited to announce our new feature! 🚀 #innovation #tech',
      media: [],
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      platforms: ['facebook', 'twitter', 'linkedin'],
      status: 'scheduled',
      createdBy: 'user1',
    },
    {
      id: '2',
      content: 'Behind the scenes of our latest project. Stay tuned for more updates!',
      media: [],
      scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      platforms: ['instagram', 'facebook'],
      status: 'published',
      createdBy: 'user1',
      analytics: {
        instagram: { reach: 1250, likes: 89, clicks: 23, shares: 5 },
        facebook: { reach: 856, likes: 45, clicks: 12, shares: 3 }
      }
    },
    {
      id: '3',
      content: 'This is a draft post that needs review...',
      media: [],
      scheduledAt: new Date(),
      platforms: ['twitter'],
      status: 'draft',
      createdBy: 'user1',
    },
    {
      id: '4',
      content: 'Check out our latest blog post about social media trends!',
      media: [],
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      platforms: ['linkedin', 'twitter'],
      status: 'scheduled',
      createdBy: 'user1',
    }
  ]);

  // Handlers
  const handleConnect = (platform: string) => {
    setConnectedAccounts(prev => 
      prev.map(acc => 
        acc.platform === platform ? { ...acc, connected: true } : acc
      )
    );
    console.log(`Connecting to ${platform}...`);
  };

  const handlePublish = (postData: any, publishType: 'now' | 'schedule' | 'draft', scheduledAt?: Date) => {
    let status: 'published' | 'scheduled' | 'draft' = 'draft';
    let postScheduledAt = new Date();

    // Determine status based on publish type
    switch (publishType) {
      case 'now':
        status = 'published';
        postScheduledAt = new Date(); // Current time for published posts
        break;
      case 'schedule':
        status = 'scheduled';
        postScheduledAt = scheduledAt || new Date();
        break;
      case 'draft':
        status = 'draft';
        postScheduledAt = new Date(); // Current time for drafts
        break;
    }

    const newPost: SocialPost = {
      id: Date.now().toString(),
      content: postData.content,
      media: postData.media || [],
      scheduledAt: postScheduledAt,
      platforms: postData.platforms,
      status: status,
      createdBy: 'current-user',
      // Add analytics for published posts (you might want to initialize this differently)
      ...(status === 'published' && {
        analytics: postData.platforms.reduce((acc: any, platform: string) => {
          acc[platform] = { reach: 0, likes: 0, clicks: 0, shares: 0 };
          return acc;
        }, {})
      })
    };

    setPosts(prev => [newPost, ...prev]);
    
    // Auto-switch to the appropriate tab based on publish type
    switch (publishType) {
      case 'now':
        setActiveTab('sent');
        break;
      case 'schedule':
        setActiveTab('queue');
        break;
      case 'draft':
        setActiveTab('drafts');
        break;
    }

    console.log(`Post ${publishType === 'now' ? 'published' : publishType === 'schedule' ? 'scheduled' : 'saved as draft'}:`, newPost);
  };

  const handleEditPost = (post: SocialPost) => {
    console.log('Edit post:', post);
    setShowComposeModal(true);
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleViewPost = (post: SocialPost) => {
    console.log('Viewing post:', post);
  };

  const handleDateSelect = (date: Date) => {
    setShowComposeModal(true);
  };

  const getConnectedCount = () => {
    return connectedAccounts.filter(acc => acc.connected).length;
  };

  const getFilteredPosts = () => {
    let filtered = posts;

    // Filter by channel
    if (selectedChannel !== 'all') {
      filtered = filtered.filter(post => post.platforms.includes(selectedChannel as any));
    }

    // Filter by tab
    switch (activeTab) {
      case 'queue':
        filtered = filtered.filter(post => post.status === 'scheduled');
        break;
      case 'drafts':
        filtered = filtered.filter(post => post.status === 'draft');
        break;
      case 'sent':
        filtered = filtered.filter(post => post.status === 'published');
        break;
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(post => 
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const getTabCounts = () => {
    const channelPosts = selectedChannel === 'all' ? posts : posts.filter(post => post.platforms.includes(selectedChannel as any));
    
    return {
      queue: channelPosts.filter(p => p.status === 'scheduled').length,
      drafts: channelPosts.filter(p => p.status === 'draft').length,
      sent: channelPosts.filter(p => p.status === 'published').length,
    };
  };

  const tabCounts = getTabCounts();
  const filteredPosts = getFilteredPosts();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Zap className="text-white" size={20} />
                </div>
                <span>
                  {selectedChannel === 'all' ? 'All Channels' : 
                   connectedAccounts.find(acc => acc.platform === selectedChannel)?.username || 'Channel'}
                </span>
              </h1>
              <p className="text-gray-600 mt-1">
                {selectedChannel === 'all' 
                  ? 'Manage content across all your social media channels' 
                  : 'Manage posts for this specific channel'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowCalendarView(!showCalendarView)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  showCalendarView ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <CalendarIcon size={16} />
                <span>Calendar</span>
              </button>
              <button
                onClick={() => setShowAccountModal(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings size={16} />
                <span>Accounts ({getConnectedCount()})</span>
              </button>
              <button
                onClick={() => setShowComposeModal(true)}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors shadow-md"
              >
                <Plus size={16} />
                <span>New Post</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {showCalendarView ? (
            <div className="h-full p-6">
              <CalendarView
                posts={filteredPosts}
                onDateSelect={handleDateSelect}
                onPostClick={handleViewPost}
              />
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Navigation Tabs */}
              <div className="bg-white border-b border-gray-200 px-6">
                <nav className="flex space-x-8">
                  {[
                    { key: 'queue', label: 'Queue', icon: Clock, count: tabCounts.queue },
                    { key: 'drafts', label: 'Drafts', icon: Edit3, count: tabCounts.drafts },
                    { key: 'sent', label: 'Sent', icon: Send, count: tabCounts.sent },
                    { key: 'analytics', label: 'Analytics', icon: BarChart3, count: 0 },
                  ].map(({ key, label, icon: Icon, count }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key as any)}
                      className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                      {count > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          activeTab === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto p-6">
                {activeTab === 'analytics' ? (
                  <div className="bg-white rounded-xl border p-8">
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="text-blue-600" size={32} />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                      <p className="text-gray-500 mb-6">
                        Track your social media performance across all platforms
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">2.4K</div>
                          <div className="text-sm text-blue-500">Total Reach</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">134</div>
                          <div className="text-sm text-green-500">Total Engagement</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">8</div>
                          <div className="text-sm text-purple-500">Active Campaigns</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        Coming soon: Detailed analytics, engagement metrics, and performance insights
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Enhanced Post Queue */}
                    <div className="bg-white rounded-xl shadow-sm border">
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <h2 className="text-lg font-semibold text-gray-900">
                            {activeTab === 'queue' && 'Scheduled Posts'}
                            {activeTab === 'drafts' && 'Draft Posts'}
                            {activeTab === 'sent' && 'Published Posts'}
                          </h2>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
                            </span>
                            <button className="p-2 hover:bg-gray-100 rounded-lg">
                              <Filter size={16} className="text-gray-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Posts List */}
                      <div className="p-6">
                        {filteredPosts.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              {activeTab === 'queue' && <Clock className="text-gray-400" size={24} />}
                              {activeTab === 'drafts' && <Edit3 className="text-gray-400" size={24} />}
                              {activeTab === 'sent' && <Send className="text-gray-400" size={24} />}
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              {activeTab === 'queue' && 'No scheduled posts'}
                              {activeTab === 'drafts' && 'No draft posts'}
                              {activeTab === 'sent' && 'No published posts'}
                            </h3>
                            <p className="text-gray-500 mb-6">
                              {activeTab === 'queue' && 'Schedule your first post to get started'}
                              {activeTab === 'drafts' && 'Create a draft to save your work'}
                              {activeTab === 'sent' && 'Your published posts will appear here'}
                            </p>
                            <button
                              onClick={() => setShowComposeModal(true)}
                              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Plus size={16} />
                              <span>Create New Post</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {filteredPosts.map(post => (
                              <div
                                key={post.id}
                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        post.status === 'scheduled' ? 'bg-blue-100' :
                                        post.status === 'draft' ? 'bg-gray-100' :
                                        post.status === 'published' ? 'bg-green-100' : 'bg-red-100'
                                      }`}>
                                        {post.status === 'scheduled' && <Clock size={16} className="text-blue-600" />}
                                        {post.status === 'draft' && <Edit3 size={16} className="text-gray-600" />}
                                        {post.status === 'published' && <Send size={16} className="text-green-600" />}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                          post.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                          post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                          {new Date(post.scheduledAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <p className="text-gray-900 mb-3 line-clamp-2">
                                      {post.content || 'No content'}
                                    </p>
                                    
                                    {/* Platforms */}
                                    <div className="flex items-center space-x-2 mb-3">
                                      <span className="text-xs text-gray-500">Publishing to:</span>
                                      <div className="flex space-x-1">
                                        {post.platforms.map(platformId => {
                                          const platform = connectedAccounts.find(acc => acc.platform === platformId);
                                          return platform ? (
                                            <span key={platformId} className="inline-flex items-center" title={platform.username}>
                                              {renderPlatformIcon(platformId, 16, "text-gray-600")}
                                            </span>
                                          ) : null;
                                        })}
                                      </div>
                                    </div>
                                    
                                    {/* Media preview */}
                                    {post.media.length > 0 && (
                                      <div className="flex space-x-1 mb-3">
                                        {post.media.slice(0, 3).map((file, index) => (
                                          <div key={index} className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                                            <img
                                              src={URL.createObjectURL(file)}
                                              alt="Media"
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        ))}
                                        {post.media.length > 3 && (
                                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-600">
                                            +{post.media.length - 3}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Analytics for published posts */}
                                    {post.status === 'published' && post.analytics && (
                                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                                        <div className="grid grid-cols-4 gap-3 text-center">
                                          <div>
                                            <div className="text-lg font-semibold text-gray-900">
                                              {Object.values(post.analytics).reduce((sum, data) => sum + data.reach, 0)}
                                            </div>
                                            <div className="text-xs text-gray-500">Reach</div>
                                          </div>
                                          <div>
                                            <div className="text-lg font-semibold text-gray-900">
                                              {Object.values(post.analytics).reduce((sum, data) => sum + data.likes, 0)}
                                            </div>
                                            <div className="text-xs text-gray-500">Likes</div>
                                          </div>
                                          <div>
                                            <div className="text-lg font-semibold text-gray-900">
                                              {Object.values(post.analytics).reduce((sum, data) => sum + data.clicks, 0)}
                                            </div>
                                            <div className="text-xs text-gray-500">Clicks</div>
                                          </div>
                                          <div>
                                            <div className="text-lg font-semibold text-gray-900">
                                              {Object.values(post.analytics).reduce((sum, data) => sum + data.shares, 0)}
                                            </div>
                                            <div className="text-xs text-gray-500">Shares</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Actions */}
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleViewPost(post)}
                                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                      title="View post"
                                    >
                                      <Eye size={16} className="text-gray-500" />
                                    </button>
                                    {post.status !== 'published' && (
                                      <button
                                        onClick={() => handleEditPost(post)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Edit post"
                                      >
                                        <Edit3 size={16} className="text-gray-500" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeletePost(post.id)}
                                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Delete post"
                                    >
                                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <ChannelSidebar
        connectedAccounts={connectedAccounts}
        selectedChannel={selectedChannel}
        onChannelSelect={setSelectedChannel}
        onConnectAccount={() => setShowAccountModal(true)}
        posts={posts}
      />

      {/* Modals */}
      <ComposeModal
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        onPublish={handlePublish}
        connectedAccounts={connectedAccounts}
        selectedChannel={selectedChannel}
      />

      <SocialAccountConnect
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onConnect={handleConnect}
        connectedAccounts={connectedAccounts}
      />
    </div>
  );
};

export default PostDashboard;












































































// 'use client';

// import React, { useState } from 'react';
// import { Plus, Settings, BarChart3, Calendar as CalendarIcon, List, Edit3, Send, Clock, Eye, Zap, Filter, Search, Bell } from 'lucide-react';
// import PostQueue from './PostQueue';
// import CalendarView from './CalendarView';
// import SocialAccountConnect from './SocialAccountConnect';
// import ComposeModal from './ComposeModal';
// import ChannelSidebar from './ChannelSidebar';
// import { SocialPost, SocialAccount } from '@/lib/types/post-publisher/social-media';

// const PostDashboard: React.FC = () => {
//   // State management
//   const [activeTab, setActiveTab] = useState<'queue' | 'drafts' | 'sent' | 'analytics'>('queue');
//   const [showAccountModal, setShowAccountModal] = useState(false);
//   const [showComposeModal, setShowComposeModal] = useState(false);
//   const [showCalendarView, setShowCalendarView] = useState(false);
//   const [selectedChannel, setSelectedChannel] = useState<string>('all');
//   const [searchQuery, setSearchQuery] = useState('');
  
//   // Connected accounts (mock data)
//   const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([
//     { id: '1', platform: 'facebook', username: '@djombi', connected: true, avatar: 'https://via.placeholder.com/32' },
//     { id: '2', platform: 'instagram', username: '@djombi_app', connected: true, avatar: 'https://via.placeholder.com/32' },
//     { id: '3', platform: 'twitter', username: '@djombi', connected: false },
//     { id: '4', platform: 'linkedin', username: 'Djombi', connected: true, avatar: 'https://via.placeholder.com/32' },
//     { id: '5', platform: 'tiktok', username: '@djombi', connected: false },
//   ]);
  
//   // Posts (mock data)
//   const [posts, setPosts] = useState<SocialPost[]>([
//     {
//       id: '1',
//       content: 'Excited to announce our new feature! 🚀 #innovation #tech',
//       media: [],
//       scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
//       platforms: ['facebook', 'twitter', 'linkedin'],
//       status: 'scheduled',
//       createdBy: 'user1',
//     },
//     {
//       id: '2',
//       content: 'Behind the scenes of our latest project. Stay tuned for more updates!',
//       media: [],
//       scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
//       platforms: ['instagram', 'facebook'],
//       status: 'published',
//       createdBy: 'user1',
//       analytics: {
//         instagram: { reach: 1250, likes: 89, clicks: 23, shares: 5 },
//         facebook: { reach: 856, likes: 45, clicks: 12, shares: 3 }
//       }
//     },
//     {
//       id: '3',
//       content: 'This is a draft post that needs review...',
//       media: [],
//       scheduledAt: new Date(),
//       platforms: ['twitter'],
//       status: 'draft',
//       createdBy: 'user1',
//     },
//     {
//       id: '4',
//       content: 'Check out our latest blog post about social media trends!',
//       media: [],
//       scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
//       platforms: ['linkedin', 'twitter'],
//       status: 'scheduled',
//       createdBy: 'user1',
//     }
//   ]);

//   // Handlers
//   const handleConnect = (platform: string) => {
//     setConnectedAccounts(prev => 
//       prev.map(acc => 
//         acc.platform === platform ? { ...acc, connected: true } : acc
//       )
//     );
//     console.log(`Connecting to ${platform}...`);
//   };

//   const handlePublish = (postData: any) => {
//     const newPost: SocialPost = {
//       id: Date.now().toString(),
//       content: postData.content,
//       media: postData.media,
//       scheduledAt: postData.scheduledAt || new Date(),
//       platforms: postData.platforms,
//       status: postData.status,
//       createdBy: 'current-user',
//     };

//     setPosts(prev => [newPost, ...prev]);
//     console.log('Post created:', newPost);
//   };

//   const handleEditPost = (post: SocialPost) => {
//     console.log('Edit post:', post);
//     setShowComposeModal(true);
//   };

//   const handleDeletePost = (postId: string) => {
//     setPosts(prev => prev.filter(p => p.id !== postId));
//   };

//   const handleViewPost = (post: SocialPost) => {
//     console.log('Viewing post:', post);
//   };

//   const handleDateSelect = (date: Date) => {
//     setShowComposeModal(true);
//   };

//   const getConnectedCount = () => {
//     return connectedAccounts.filter(acc => acc.connected).length;
//   };

//   const getFilteredPosts = () => {
//     let filtered = posts;

//     // Filter by channel
//     if (selectedChannel !== 'all') {
//       filtered = filtered.filter(post => post.platforms.includes(selectedChannel as any));
//     }

//     // Filter by tab
//     switch (activeTab) {
//       case 'queue':
//         filtered = filtered.filter(post => post.status === 'scheduled');
//         break;
//       case 'drafts':
//         filtered = filtered.filter(post => post.status === 'draft');
//         break;
//       case 'sent':
//         filtered = filtered.filter(post => post.status === 'published');
//         break;
//     }

//     // Search filter
//     if (searchQuery) {
//       filtered = filtered.filter(post => 
//         post.content.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     return filtered;
//   };

//   const getTabCounts = () => {
//     const channelPosts = selectedChannel === 'all' ? posts : posts.filter(post => post.platforms.includes(selectedChannel as any));
    
//     return {
//       queue: channelPosts.filter(p => p.status === 'scheduled').length,
//       drafts: channelPosts.filter(p => p.status === 'draft').length,
//       sent: channelPosts.filter(p => p.status === 'published').length,
//     };
//   };

//   const tabCounts = getTabCounts();
//   const filteredPosts = getFilteredPosts();

//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* Main Content */}
//       <div className="flex-1 flex flex-col">
//         {/* Header */}
//         <div className="bg-white border-b border-gray-200 p-6">
//           <div className="flex justify-between items-center">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
//                 <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
//                   <Zap className="text-white" size={20} />
//                 </div>
//                 <span>
//                   {selectedChannel === 'all' ? 'All Channels' : 
//                    connectedAccounts.find(acc => acc.platform === selectedChannel)?.username || 'Channel'}
//                 </span>
//               </h1>
//               <p className="text-gray-600 mt-1">
//                 {selectedChannel === 'all' 
//                   ? 'Manage content across all your social media channels' 
//                   : 'Manage posts for this specific channel'}
//               </p>
//             </div>
//             <div className="flex items-center space-x-3">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
//                 <input
//                   type="text"
//                   placeholder="Search posts..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//               <button
//                 onClick={() => setShowCalendarView(!showCalendarView)}
//                 className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
//                   showCalendarView ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
//                 }`}
//               >
//                 <CalendarIcon size={16} />
//                 <span>Calendar</span>
//               </button>
//               <button
//                 onClick={() => setShowAccountModal(true)}
//                 className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//               >
//                 <Settings size={16} />
//                 <span>Accounts ({getConnectedCount()})</span>
//               </button>
//               <button
//                 onClick={() => setShowComposeModal(true)}
//                 className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors shadow-md"
//               >
//                 <Plus size={16} />
//                 <span>New Post</span>
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Content Area */}
//         <div className="flex-1 overflow-hidden">
//           {showCalendarView ? (
//             <div className="h-full p-6">
//               <CalendarView
//                 posts={filteredPosts}
//                 onDateSelect={handleDateSelect}
//                 onPostClick={handleViewPost}
//               />
//             </div>
//           ) : (
//             <div className="h-full flex flex-col">
//               {/* Navigation Tabs */}
//               <div className="bg-white border-b border-gray-200 px-6">
//                 <nav className="flex space-x-8">
//                   {[
//                     { key: 'queue', label: 'Queue', icon: Clock, count: tabCounts.queue },
//                     { key: 'drafts', label: 'Drafts', icon: Edit3, count: tabCounts.drafts },
//                     { key: 'sent', label: 'Sent', icon: Send, count: tabCounts.sent },
//                     { key: 'analytics', label: 'Analytics', icon: BarChart3, count: 0 },
//                   ].map(({ key, label, icon: Icon, count }) => (
//                     <button
//                       key={key}
//                       onClick={() => setActiveTab(key as any)}
//                       className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
//                         activeTab === key
//                           ? 'border-blue-500 text-blue-600'
//                           : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                       }`}
//                     >
//                       <Icon size={16} />
//                       <span>{label}</span>
//                       {count > 0 && (
//                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                           activeTab === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
//                         }`}>
//                           {count}
//                         </span>
//                       )}
//                     </button>
//                   ))}
//                 </nav>
//               </div>

//               {/* Tab Content */}
//               <div className="flex-1 overflow-auto p-6">
//                 {activeTab === 'analytics' ? (
//                   <div className="bg-white rounded-xl border p-8">
//                     <div className="text-center py-12">
//                       <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                         <BarChart3 className="text-blue-600" size={32} />
//                       </div>
//                       <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
//                       <p className="text-gray-500 mb-6">
//                         Track your social media performance across all platforms
//                       </p>
//                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//                         <div className="bg-blue-50 p-4 rounded-lg">
//                           <div className="text-2xl font-bold text-blue-600">2.4K</div>
//                           <div className="text-sm text-blue-500">Total Reach</div>
//                         </div>
//                         <div className="bg-green-50 p-4 rounded-lg">
//                           <div className="text-2xl font-bold text-green-600">134</div>
//                           <div className="text-sm text-green-500">Total Engagement</div>
//                         </div>
//                         <div className="bg-purple-50 p-4 rounded-lg">
//                           <div className="text-2xl font-bold text-purple-600">8</div>
//                           <div className="text-sm text-purple-500">Active Campaigns</div>
//                         </div>
//                       </div>
//                       <div className="text-sm text-gray-400">
//                         Coming soon: Detailed analytics, engagement metrics, and performance insights
//                       </div>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="space-y-6">
//                     {/* Enhanced Post Queue */}
//                     <div className="bg-white rounded-xl shadow-sm border">
//                       <div className="p-6 border-b border-gray-200">
//                         <div className="flex justify-between items-center">
//                           <h2 className="text-lg font-semibold text-gray-900">
//                             {activeTab === 'queue' && 'Scheduled Posts'}
//                             {activeTab === 'drafts' && 'Draft Posts'}
//                             {activeTab === 'sent' && 'Published Posts'}
//                           </h2>
//                           <div className="flex items-center space-x-2">
//                             <span className="text-sm text-gray-500">
//                               {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
//                             </span>
//                             <button className="p-2 hover:bg-gray-100 rounded-lg">
//                               <Filter size={16} className="text-gray-500" />
//                             </button>
//                           </div>
//                         </div>
//                       </div>
                      
//                       {/* Posts List */}
//                       <div className="p-6">
//                         {filteredPosts.length === 0 ? (
//                           <div className="text-center py-12">
//                             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                               {activeTab === 'queue' && <Clock className="text-gray-400" size={24} />}
//                               {activeTab === 'drafts' && <Edit3 className="text-gray-400" size={24} />}
//                               {activeTab === 'sent' && <Send className="text-gray-400" size={24} />}
//                             </div>
//                             <h3 className="text-lg font-medium text-gray-900 mb-2">
//                               {activeTab === 'queue' && 'No scheduled posts'}
//                               {activeTab === 'drafts' && 'No draft posts'}
//                               {activeTab === 'sent' && 'No published posts'}
//                             </h3>
//                             <p className="text-gray-500 mb-6">
//                               {activeTab === 'queue' && 'Schedule your first post to get started'}
//                               {activeTab === 'drafts' && 'Create a draft to save your work'}
//                               {activeTab === 'sent' && 'Your published posts will appear here'}
//                             </p>
//                             <button
//                               onClick={() => setShowComposeModal(true)}
//                               className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                             >
//                               <Plus size={16} />
//                               <span>Create New Post</span>
//                             </button>
//                           </div>
//                         ) : (
//                           <div className="space-y-4">
//                             {filteredPosts.map(post => (
//                               <div
//                                 key={post.id}
//                                 className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
//                               >
//                                 <div className="flex justify-between items-start">
//                                   <div className="flex-1">
//                                     <div className="flex items-center space-x-3 mb-3">
//                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                                         post.status === 'scheduled' ? 'bg-blue-100' :
//                                         post.status === 'draft' ? 'bg-gray-100' :
//                                         post.status === 'published' ? 'bg-green-100' : 'bg-red-100'
//                                       }`}>
//                                         {post.status === 'scheduled' && <Clock size={16} className="text-blue-600" />}
//                                         {post.status === 'draft' && <Edit3 size={16} className="text-gray-600" />}
//                                         {post.status === 'published' && <Send size={16} className="text-green-600" />}
//                                       </div>
//                                       <div className="flex items-center space-x-2">
//                                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                                           post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
//                                           post.status === 'draft' ? 'bg-gray-100 text-gray-700' :
//                                           post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//                                         }`}>
//                                           {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
//                                         </span>
//                                         <span className="text-sm text-gray-500">
//                                           {new Date(post.scheduledAt).toLocaleDateString('en-US', {
//                                             month: 'short',
//                                             day: 'numeric',
//                                             hour: '2-digit',
//                                             minute: '2-digit'
//                                           })}
//                                         </span>
//                                       </div>
//                                     </div>
                                    
//                                     <p className="text-gray-900 mb-3 line-clamp-2">
//                                       {post.content || 'No content'}
//                                     </p>
                                    
//                                     {/* Platforms */}
//                                     <div className="flex items-center space-x-2 mb-3">
//                                       <span className="text-xs text-gray-500">Publishing to:</span>
//                                       <div className="flex space-x-1">
//                                         {post.platforms.map(platformId => {
//                                           const platform = connectedAccounts.find(acc => acc.platform === platformId);
//                                           return platform ? (
//                                             <span key={platformId} className="text-sm" title={platform.username}>
//                                               {platform.platform === 'facebook' && '📘'}
//                                               {platform.platform === 'instagram' && '📸'}
//                                               {platform.platform === 'twitter' && '🐦'}
//                                               {platform.platform === 'linkedin' && '💼'}
//                                               {platform.platform === 'tiktok' && '🎵'}
//                                             </span>
//                                           ) : null;
//                                         })}
//                                       </div>
//                                     </div>
                                    
//                                     {/* Media preview */}
//                                     {post.media.length > 0 && (
//                                       <div className="flex space-x-1 mb-3">
//                                         {post.media.slice(0, 3).map((file, index) => (
//                                           <div key={index} className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
//                                             <img
//                                               src={URL.createObjectURL(file)}
//                                               alt="Media"
//                                               className="w-full h-full object-cover"
//                                             />
//                                           </div>
//                                         ))}
//                                         {post.media.length > 3 && (
//                                           <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-600">
//                                             +{post.media.length - 3}
//                                           </div>
//                                         )}
//                                       </div>
//                                     )}
                                    
//                                     {/* Analytics for published posts */}
//                                     {post.status === 'published' && post.analytics && (
//                                       <div className="bg-gray-50 rounded-lg p-3 mt-3">
//                                         <div className="grid grid-cols-4 gap-3 text-center">
//                                           <div>
//                                             <div className="text-lg font-semibold text-gray-900">
//                                               {Object.values(post.analytics).reduce((sum, data) => sum + data.reach, 0)}
//                                             </div>
//                                             <div className="text-xs text-gray-500">Reach</div>
//                                           </div>
//                                           <div>
//                                             <div className="text-lg font-semibold text-gray-900">
//                                               {Object.values(post.analytics).reduce((sum, data) => sum + data.likes, 0)}
//                                             </div>
//                                             <div className="text-xs text-gray-500">Likes</div>
//                                           </div>
//                                           <div>
//                                             <div className="text-lg font-semibold text-gray-900">
//                                               {Object.values(post.analytics).reduce((sum, data) => sum + data.clicks, 0)}
//                                             </div>
//                                             <div className="text-xs text-gray-500">Clicks</div>
//                                           </div>
//                                           <div>
//                                             <div className="text-lg font-semibold text-gray-900">
//                                               {Object.values(post.analytics).reduce((sum, data) => sum + data.shares, 0)}
//                                             </div>
//                                             <div className="text-xs text-gray-500">Shares</div>
//                                           </div>
//                                         </div>
//                                       </div>
//                                     )}
//                                   </div>
                                  
//                                   {/* Actions */}
//                                   <div className="flex items-center space-x-2">
//                                     <button
//                                       onClick={() => handleViewPost(post)}
//                                       className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                                       title="View post"
//                                     >
//                                       <Eye size={16} className="text-gray-500" />
//                                     </button>
//                                     {post.status !== 'published' && (
//                                       <button
//                                         onClick={() => handleEditPost(post)}
//                                         className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                                         title="Edit post"
//                                       >
//                                         <Edit3 size={16} className="text-gray-500" />
//                                       </button>
//                                     )}
//                                     <button
//                                       onClick={() => handleDeletePost(post.id)}
//                                       className="p-2 hover:bg-red-50 rounded-lg transition-colors"
//                                       title="Delete post"
//                                     >
//                                       <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                                       </svg>
//                                     </button>
//                                   </div>
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Right Sidebar */}
//       <ChannelSidebar
//         connectedAccounts={connectedAccounts}
//         selectedChannel={selectedChannel}
//         onChannelSelect={setSelectedChannel}
//         onConnectAccount={() => setShowAccountModal(true)}
//         posts={posts}
//       />

//       {/* Modals */}
//       <ComposeModal
//         isOpen={showComposeModal}
//         onClose={() => setShowComposeModal(false)}
//         onPublish={handlePublish}
//         connectedAccounts={connectedAccounts}
//         selectedChannel={selectedChannel}
//       />

//       <SocialAccountConnect
//         isOpen={showAccountModal}
//         onClose={() => setShowAccountModal(false)}
//         onConnect={handleConnect}
//         connectedAccounts={connectedAccounts}
//       />
//     </div>
//   );
// };

// export default PostDashboard;



































































// Correct UI
// 'use client';

// import React, { useState } from 'react';
// import { Plus, Settings, BarChart3, Calendar as CalendarIcon, List, Edit3, Send, Clock, Eye, Zap, Filter, Search, Bell } from 'lucide-react';
// import PostQueue from './PostQueue';
// import CalendarView from './CalendarView';
// import SocialAccountConnect from './SocialAccountConnect';
// import ComposeModal from './ComposeModal';
// import ChannelSidebar from './ChannelSidebar';
// import { SocialPost, SocialAccount, renderPlatformIcon } from '@/lib/types/post-publisher/social-media';

// const PostDashboard: React.FC = () => {
//   // State management
//   const [activeTab, setActiveTab] = useState<'queue' | 'drafts' | 'sent' | 'analytics'>('queue');
//   const [showAccountModal, setShowAccountModal] = useState(false);
//   const [showComposeModal, setShowComposeModal] = useState(false);
//   const [showCalendarView, setShowCalendarView] = useState(false);
//   const [selectedChannel, setSelectedChannel] = useState<string>('all');
//   const [searchQuery, setSearchQuery] = useState('');
  
//   // Connected accounts (mock data)
//   const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([
//     { id: '1', platform: 'facebook', username: '@djombi', connected: true, avatar: 'https://via.placeholder.com/32' },
//     { id: '2', platform: 'instagram', username: '@djombi_app', connected: true, avatar: 'https://via.placeholder.com/32' },
//     { id: '3', platform: 'twitter', username: '@djombi', connected: false },
//     { id: '4', platform: 'linkedin', username: 'Djombi', connected: true, avatar: 'https://via.placeholder.com/32' },
//     { id: '5', platform: 'tiktok', username: '@djombi', connected: false },
//   ]);
  
//   // Posts (mock data)
//   const [posts, setPosts] = useState<SocialPost[]>([
//     {
//       id: '1',
//       content: 'Excited to announce our new feature! 🚀 #innovation #tech',
//       media: [],
//       scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
//       platforms: ['facebook', 'twitter', 'linkedin'],
//       status: 'scheduled',
//       createdBy: 'user1',
//     },
//     {
//       id: '2',
//       content: 'Behind the scenes of our latest project. Stay tuned for more updates!',
//       media: [],
//       scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
//       platforms: ['instagram', 'facebook'],
//       status: 'published',
//       createdBy: 'user1',
//       analytics: {
//         instagram: { reach: 1250, likes: 89, clicks: 23, shares: 5 },
//         facebook: { reach: 856, likes: 45, clicks: 12, shares: 3 }
//       }
//     },
//     {
//       id: '3',
//       content: 'This is a draft post that needs review...',
//       media: [],
//       scheduledAt: new Date(),
//       platforms: ['twitter'],
//       status: 'draft',
//       createdBy: 'user1',
//     },
//     {
//       id: '4',
//       content: 'Check out our latest blog post about social media trends!',
//       media: [],
//       scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
//       platforms: ['linkedin', 'twitter'],
//       status: 'scheduled',
//       createdBy: 'user1',
//     }
//   ]);

//   // Handlers
//   const handleConnect = (platform: string) => {
//     setConnectedAccounts(prev => 
//       prev.map(acc => 
//         acc.platform === platform ? { ...acc, connected: true } : acc
//       )
//     );
//     console.log(`Connecting to ${platform}...`);
//   };

//   const handlePublish = (postData: any) => {
//     const newPost: SocialPost = {
//       id: Date.now().toString(),
//       content: postData.content,
//       media: postData.media,
//       scheduledAt: postData.scheduledAt || new Date(),
//       platforms: postData.platforms,
//       status: postData.status,
//       createdBy: 'current-user',
//     };

//     setPosts(prev => [newPost, ...prev]);
//     console.log('Post created:', newPost);
//   };

//   const handleEditPost = (post: SocialPost) => {
//     console.log('Edit post:', post);
//     setShowComposeModal(true);
//   };

//   const handleDeletePost = (postId: string) => {
//     setPosts(prev => prev.filter(p => p.id !== postId));
//   };

//   const handleViewPost = (post: SocialPost) => {
//     console.log('Viewing post:', post);
//   };

//   const handleDateSelect = (date: Date) => {
//     setShowComposeModal(true);
//   };

//   const getConnectedCount = () => {
//     return connectedAccounts.filter(acc => acc.connected).length;
//   };

//   const getFilteredPosts = () => {
//     let filtered = posts;

//     // Filter by channel
//     if (selectedChannel !== 'all') {
//       filtered = filtered.filter(post => post.platforms.includes(selectedChannel as any));
//     }

//     // Filter by tab
//     switch (activeTab) {
//       case 'queue':
//         filtered = filtered.filter(post => post.status === 'scheduled');
//         break;
//       case 'drafts':
//         filtered = filtered.filter(post => post.status === 'draft');
//         break;
//       case 'sent':
//         filtered = filtered.filter(post => post.status === 'published');
//         break;
//     }

//     // Search filter
//     if (searchQuery) {
//       filtered = filtered.filter(post => 
//         post.content.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     return filtered;
//   };

//   const getTabCounts = () => {
//     const channelPosts = selectedChannel === 'all' ? posts : posts.filter(post => post.platforms.includes(selectedChannel as any));
    
//     return {
//       queue: channelPosts.filter(p => p.status === 'scheduled').length,
//       drafts: channelPosts.filter(p => p.status === 'draft').length,
//       sent: channelPosts.filter(p => p.status === 'published').length,
//     };
//   };

//   const tabCounts = getTabCounts();
//   const filteredPosts = getFilteredPosts();

//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* Main Content */}
//       <div className="flex-1 flex flex-col">
//         {/* Header */}
//         <div className="bg-white border-b border-gray-200 p-6">
//           <div className="flex justify-between items-center">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
//                 <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
//                   <Zap className="text-white" size={20} />
//                 </div>
//                 <span>
//                   {selectedChannel === 'all' ? 'All Channels' : 
//                    connectedAccounts.find(acc => acc.platform === selectedChannel)?.username || 'Channel'}
//                 </span>
//               </h1>
//               <p className="text-gray-600 mt-1">
//                 {selectedChannel === 'all' 
//                   ? 'Manage content across all your social media channels' 
//                   : 'Manage posts for this specific channel'}
//               </p>
//             </div>
//             <div className="flex items-center space-x-3">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
//                 <input
//                   type="text"
//                   placeholder="Search posts..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//               <button
//                 onClick={() => setShowCalendarView(!showCalendarView)}
//                 className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
//                   showCalendarView ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
//                 }`}
//               >
//                 <CalendarIcon size={16} />
//                 <span>Calendar</span>
//               </button>
//               <button
//                 onClick={() => setShowAccountModal(true)}
//                 className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//               >
//                 <Settings size={16} />
//                 <span>Accounts ({getConnectedCount()})</span>
//               </button>
//               <button
//                 onClick={() => setShowComposeModal(true)}
//                 className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors shadow-md"
//               >
//                 <Plus size={16} />
//                 <span>New Post</span>
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Content Area */}
//         <div className="flex-1 overflow-hidden">
//           {showCalendarView ? (
//             <div className="h-full p-6">
//               <CalendarView
//                 posts={filteredPosts}
//                 onDateSelect={handleDateSelect}
//                 onPostClick={handleViewPost}
//               />
//             </div>
//           ) : (
//             <div className="h-full flex flex-col">
//               {/* Navigation Tabs */}
//               <div className="bg-white border-b border-gray-200 px-6">
//                 <nav className="flex space-x-8">
//                   {[
//                     { key: 'queue', label: 'Queue', icon: Clock, count: tabCounts.queue },
//                     { key: 'drafts', label: 'Drafts', icon: Edit3, count: tabCounts.drafts },
//                     { key: 'sent', label: 'Sent', icon: Send, count: tabCounts.sent },
//                     { key: 'analytics', label: 'Analytics', icon: BarChart3, count: 0 },
//                   ].map(({ key, label, icon: Icon, count }) => (
//                     <button
//                       key={key}
//                       onClick={() => setActiveTab(key as any)}
//                       className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
//                         activeTab === key
//                           ? 'border-blue-500 text-blue-600'
//                           : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                       }`}
//                     >
//                       <Icon size={16} />
//                       <span>{label}</span>
//                       {count > 0 && (
//                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                           activeTab === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
//                         }`}>
//                           {count}
//                         </span>
//                       )}
//                     </button>
//                   ))}
//                 </nav>
//               </div>

//               {/* Tab Content */}
//               <div className="flex-1 overflow-auto p-6">
//                 {activeTab === 'analytics' ? (
//                   <div className="bg-white rounded-xl border p-8">
//                     <div className="text-center py-12">
//                       <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                         <BarChart3 className="text-blue-600" size={32} />
//                       </div>
//                       <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
//                       <p className="text-gray-500 mb-6">
//                         Track your social media performance across all platforms
//                       </p>
//                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//                         <div className="bg-blue-50 p-4 rounded-lg">
//                           <div className="text-2xl font-bold text-blue-600">2.4K</div>
//                           <div className="text-sm text-blue-500">Total Reach</div>
//                         </div>
//                         <div className="bg-green-50 p-4 rounded-lg">
//                           <div className="text-2xl font-bold text-green-600">134</div>
//                           <div className="text-sm text-green-500">Total Engagement</div>
//                         </div>
//                         <div className="bg-purple-50 p-4 rounded-lg">
//                           <div className="text-2xl font-bold text-purple-600">8</div>
//                           <div className="text-sm text-purple-500">Active Campaigns</div>
//                         </div>
//                       </div>
//                       <div className="text-sm text-gray-400">
//                         Coming soon: Detailed analytics, engagement metrics, and performance insights
//                       </div>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="space-y-6">
//                     {/* Enhanced Post Queue */}
//                     <div className="bg-white rounded-xl shadow-sm border">
//                       <div className="p-6 border-b border-gray-200">
//                         <div className="flex justify-between items-center">
//                           <h2 className="text-lg font-semibold text-gray-900">
//                             {activeTab === 'queue' && 'Scheduled Posts'}
//                             {activeTab === 'drafts' && 'Draft Posts'}
//                             {activeTab === 'sent' && 'Published Posts'}
//                           </h2>
//                           <div className="flex items-center space-x-2">
//                             <span className="text-sm text-gray-500">
//                               {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
//                             </span>
//                             <button className="p-2 hover:bg-gray-100 rounded-lg">
//                               <Filter size={16} className="text-gray-500" />
//                             </button>
//                           </div>
//                         </div>
//                       </div>
                      
//                       {/* Posts List */}
//                       <div className="p-6">
//                         {filteredPosts.length === 0 ? (
//                           <div className="text-center py-12">
//                             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                               {activeTab === 'queue' && <Clock className="text-gray-400" size={24} />}
//                               {activeTab === 'drafts' && <Edit3 className="text-gray-400" size={24} />}
//                               {activeTab === 'sent' && <Send className="text-gray-400" size={24} />}
//                             </div>
//                             <h3 className="text-lg font-medium text-gray-900 mb-2">
//                               {activeTab === 'queue' && 'No scheduled posts'}
//                               {activeTab === 'drafts' && 'No draft posts'}
//                               {activeTab === 'sent' && 'No published posts'}
//                             </h3>
//                             <p className="text-gray-500 mb-6">
//                               {activeTab === 'queue' && 'Schedule your first post to get started'}
//                               {activeTab === 'drafts' && 'Create a draft to save your work'}
//                               {activeTab === 'sent' && 'Your published posts will appear here'}
//                             </p>
//                             <button
//                               onClick={() => setShowComposeModal(true)}
//                               className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                             >
//                               <Plus size={16} />
//                               <span>Create New Post</span>
//                             </button>
//                           </div>
//                         ) : (
//                           <div className="space-y-4">
//                             {filteredPosts.map(post => (
//                               <div
//                                 key={post.id}
//                                 className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
//                               >
//                                 <div className="flex justify-between items-start">
//                                   <div className="flex-1">
//                                     <div className="flex items-center space-x-3 mb-3">
//                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                                         post.status === 'scheduled' ? 'bg-blue-100' :
//                                         post.status === 'draft' ? 'bg-gray-100' :
//                                         post.status === 'published' ? 'bg-green-100' : 'bg-red-100'
//                                       }`}>
//                                         {post.status === 'scheduled' && <Clock size={16} className="text-blue-600" />}
//                                         {post.status === 'draft' && <Edit3 size={16} className="text-gray-600" />}
//                                         {post.status === 'published' && <Send size={16} className="text-green-600" />}
//                                       </div>
//                                       <div className="flex items-center space-x-2">
//                                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                                           post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
//                                           post.status === 'draft' ? 'bg-gray-100 text-gray-700' :
//                                           post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//                                         }`}>
//                                           {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
//                                         </span>
//                                         <span className="text-sm text-gray-500">
//                                           {new Date(post.scheduledAt).toLocaleDateString('en-US', {
//                                             month: 'short',
//                                             day: 'numeric',
//                                             hour: '2-digit',
//                                             minute: '2-digit'
//                                           })}
//                                         </span>
//                                       </div>
//                                     </div>
                                    
//                                     <p className="text-gray-900 mb-3 line-clamp-2">
//                                       {post.content || 'No content'}
//                                     </p>
                                    
//                                     {/* Platforms */}
//                                     <div className="flex items-center space-x-2 mb-3">
//                                       <span className="text-xs text-gray-500">Publishing to:</span>
//                                       <div className="flex space-x-1">
//                                         {post.platforms.map(platformId => {
//                                           const platform = connectedAccounts.find(acc => acc.platform === platformId);
//                                           return platform ? (
//                                             <span key={platformId} className="inline-flex items-center" title={platform.username}>
//                                               {renderPlatformIcon(platformId, 16, "text-gray-600")}
//                                             </span>
//                                           ) : null;
//                                         })}
//                                       </div>
//                                     </div>
                                    
//                                     {/* Media preview */}
//                                     {post.media.length > 0 && (
//                                       <div className="flex space-x-1 mb-3">
//                                         {post.media.slice(0, 3).map((file, index) => (
//                                           <div key={index} className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
//                                             <img
//                                               src={URL.createObjectURL(file)}
//                                               alt="Media"
//                                               className="w-full h-full object-cover"
//                                             />
//                                           </div>
//                                         ))}
//                                         {post.media.length > 3 && (
//                                           <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-600">
//                                             +{post.media.length - 3}
//                                           </div>
//                                         )}
//                                       </div>
//                                     )}
                                    
//                                     {/* Analytics for published posts */}
//                                     {post.status === 'published' && post.analytics && (
//                                       <div className="bg-gray-50 rounded-lg p-3 mt-3">
//                                         <div className="grid grid-cols-4 gap-3 text-center">
//                                           <div>
//                                             <div className="text-lg font-semibold text-gray-900">
//                                               {Object.values(post.analytics).reduce((sum, data) => sum + data.reach, 0)}
//                                             </div>
//                                             <div className="text-xs text-gray-500">Reach</div>
//                                           </div>
//                                           <div>
//                                             <div className="text-lg font-semibold text-gray-900">
//                                               {Object.values(post.analytics).reduce((sum, data) => sum + data.likes, 0)}
//                                             </div>
//                                             <div className="text-xs text-gray-500">Likes</div>
//                                           </div>
//                                           <div>
//                                             <div className="text-lg font-semibold text-gray-900">
//                                               {Object.values(post.analytics).reduce((sum, data) => sum + data.clicks, 0)}
//                                             </div>
//                                             <div className="text-xs text-gray-500">Clicks</div>
//                                           </div>
//                                           <div>
//                                             <div className="text-lg font-semibold text-gray-900">
//                                               {Object.values(post.analytics).reduce((sum, data) => sum + data.shares, 0)}
//                                             </div>
//                                             <div className="text-xs text-gray-500">Shares</div>
//                                           </div>
//                                         </div>
//                                       </div>
//                                     )}
//                                   </div>
                                  
//                                   {/* Actions */}
//                                   <div className="flex items-center space-x-2">
//                                     <button
//                                       onClick={() => handleViewPost(post)}
//                                       className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                                       title="View post"
//                                     >
//                                       <Eye size={16} className="text-gray-500" />
//                                     </button>
//                                     {post.status !== 'published' && (
//                                       <button
//                                         onClick={() => handleEditPost(post)}
//                                         className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                                         title="Edit post"
//                                       >
//                                         <Edit3 size={16} className="text-gray-500" />
//                                       </button>
//                                     )}
//                                     <button
//                                       onClick={() => handleDeletePost(post.id)}
//                                       className="p-2 hover:bg-red-50 rounded-lg transition-colors"
//                                       title="Delete post"
//                                     >
//                                       <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                                       </svg>
//                                     </button>
//                                   </div>
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Right Sidebar */}
//       <ChannelSidebar
//         connectedAccounts={connectedAccounts}
//         selectedChannel={selectedChannel}
//         onChannelSelect={setSelectedChannel}
//         onConnectAccount={() => setShowAccountModal(true)}
//         posts={posts}
//       />

//       {/* Modals */}
//       <ComposeModal
//         isOpen={showComposeModal}
//         onClose={() => setShowComposeModal(false)}
//         onPublish={handlePublish}
//         connectedAccounts={connectedAccounts}
//         selectedChannel={selectedChannel}
//       />

//       <SocialAccountConnect
//         isOpen={showAccountModal}
//         onClose={() => setShowAccountModal(false)}
//         onConnect={handleConnect}
//         connectedAccounts={connectedAccounts}
//       />
//     </div>
//   );
// };

// export default PostDashboard;





























































// 'use client';

// import React, { useState } from 'react';
// import { Plus, Settings, BarChart3, Calendar as CalendarIcon, List, Edit3, Send, Clock, Eye, Zap, Filter, Search, Bell } from 'lucide-react';
// import PostQueue from './PostQueue';
// import CalendarView from './CalendarView';
// import SocialAccountConnect from './SocialAccountConnect';
// import ComposeModal from './ComposeModal';
// import ChannelSidebar from './ChannelSidebar';
// import { SocialPost, SocialAccount, PLATFORMS } from '@/lib/types/post-publisher/social-media';

// const PostDashboard: React.FC = () => {
//   // State management
//   const [activeTab, setActiveTab] = useState<'queue' | 'drafts' | 'sent' | 'analytics'>('queue');
//   const [showAccountModal, setShowAccountModal] = useState(false);
//   const [showComposeModal, setShowComposeModal] = useState(false);
//   const [showCalendarView, setShowCalendarView] = useState(false);
//   const [selectedChannel, setSelectedChannel] = useState<string>('all');
//   const [searchQuery, setSearchQuery] = useState('');
  
//   // Connected accounts (mock data)
//   const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([
//     { id: '1', platform: 'facebook', username: '@djombi', connected: true, avatar: 'https://via.placeholder.com/32' },
//     { id: '2', platform: 'instagram', username: '@djombi_app', connected: true, avatar: 'https://via.placeholder.com/32' },
//     { id: '3', platform: 'twitter', username: '@djombi', connected: false },
//     { id: '4', platform: 'linkedin', username: 'Djombi', connected: true, avatar: 'https://via.placeholder.com/32' },
//     { id: '5', platform: 'tiktok', username: '@djombi', connected: false },
//   ]);
  
//   // Posts (mock data)
//   const [posts, setPosts] = useState<SocialPost[]>([
//     {
//       id: '1',
//       content: 'Excited to announce our new feature! 🚀 #innovation #tech',
//       media: [],
//       scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
//       platforms: ['facebook', 'twitter', 'linkedin'],
//       status: 'scheduled',
//       createdBy: 'user1',
//     },
//     {
//       id: '2',
//       content: 'Behind the scenes of our latest project. Stay tuned for more updates!',
//       media: [],
//       scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
//       platforms: ['instagram', 'facebook'],
//       status: 'published',
//       createdBy: 'user1',
//       analytics: {
//         instagram: { reach: 1250, likes: 89, clicks: 23, shares: 5 },
//         facebook: { reach: 856, likes: 45, clicks: 12, shares: 3 }
//       }
//     },
//     {
//       id: '3',
//       content: 'This is a draft post that needs review...',
//       media: [],
//       scheduledAt: new Date(),
//       platforms: ['twitter'],
//       status: 'draft',
//       createdBy: 'user1',
//     },
//     {
//       id: '4',
//       content: 'Check out our latest blog post about social media trends!',
//       media: [],
//       scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
//       platforms: ['linkedin', 'twitter'],
//       status: 'scheduled',
//       createdBy: 'user1',
//     }
//   ]);

//   // Helper function to render platform icon
//   const renderPlatformIcon = (platformId: string, size: number = 16, className: string = "") => {
//     const platform = PLATFORMS.find(p => p.id === platformId);
//     if (!platform) return null;
    
//     const IconComponent = platform.icon;
//     return <IconComponent size={size} className={className} />;
//   };

//   // Handlers
//   const handleConnect = (platform: string) => {
//     setConnectedAccounts(prev => 
//       prev.map(acc => 
//         acc.platform === platform ? { ...acc, connected: true } : acc
//       )
//     );
//     console.log(`Connecting to ${platform}...`);
//   };

//   const handlePublish = (postData: any) => {
//     const newPost: SocialPost = {
//       id: Date.now().toString(),
//       content: postData.content,
//       media: postData.media || [],
//       scheduledAt: postData.scheduledAt || new Date(),
//       platforms: postData.platforms || [],
//       status: postData.status || 'draft',
//       createdBy: 'current-user',
//     };

//     setPosts(prev => [newPost, ...prev]);
//     console.log('Post created:', newPost);
//   };

//   const handleEditPost = (post: SocialPost) => {
//     console.log('Edit post:', post);
//     setShowComposeModal(true);
//   };

//   const handleDeletePost = (postId: string) => {
//     setPosts(prev => prev.filter(p => p.id !== postId));
//   };

//   const handleViewPost = (post: SocialPost) => {
//     console.log('Viewing post:', post);
//   };

//   const handleDateSelect = (date: Date) => {
//     setShowComposeModal(true);
//   };

//   const getConnectedCount = () => {
//     return connectedAccounts.filter(acc => acc.connected).length;
//   };

//   const getFilteredPosts = () => {
//     let filtered = posts;

//     // Filter by channel
//     if (selectedChannel !== 'all') {
//       filtered = filtered.filter(post => post.platforms.includes(selectedChannel as any));
//     }

//     // Filter by tab
//     switch (activeTab) {
//       case 'queue':
//         filtered = filtered.filter(post => post.status === 'scheduled');
//         break;
//       case 'drafts':
//         filtered = filtered.filter(post => post.status === 'draft');
//         break;
//       case 'sent':
//         filtered = filtered.filter(post => post.status === 'published');
//         break;
//     }

//     // Search filter
//     if (searchQuery) {
//       filtered = filtered.filter(post => 
//         post.content.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     return filtered;
//   };

//   const getTabCounts = () => {
//     const channelPosts = selectedChannel === 'all' ? posts : posts.filter(post => post.platforms.includes(selectedChannel as any));
    
//     return {
//       queue: channelPosts.filter(p => p.status === 'scheduled').length,
//       drafts: channelPosts.filter(p => p.status === 'draft').length,
//       sent: channelPosts.filter(p => p.status === 'published').length,
//     };
//   };

//   const tabCounts = getTabCounts();
//   const filteredPosts = getFilteredPosts();

//   return (
//     <div className="flex h-screen">
//       {/* Main Content */}
//       <div className="flex-1 flex flex-col">
//         {/* Header */}
//         <div className="bg-white border-b border-gray-200 p-6">
//           <div className="flex justify-between items-center">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
//                 <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
//                   <Zap className="text-white" size={20} />
//                 </div>
//                 <span>
//                   {selectedChannel === 'all' ? 'All Channels' : 
//                    connectedAccounts.find(acc => acc.platform === selectedChannel)?.username || 'Channel'}
//                 </span>
//               </h1>
//               <p className="text-gray-600 mt-1">
//                 {selectedChannel === 'all' 
//                   ? 'Manage content across all your social media channels' 
//                   : 'Manage posts for this specific channel'}
//               </p>
//             </div>
//             <div className="flex items-center space-x-3">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
//                 <input
//                   type="text"
//                   placeholder="Search posts..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//               <button
//                 onClick={() => setShowCalendarView(!showCalendarView)}
//                 className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
//                   showCalendarView ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
//                 }`}
//               >
//                 <CalendarIcon size={16} />
//                 <span>Calendar</span>
//               </button>
//               <button
//                 onClick={() => setShowAccountModal(true)}
//                 className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//               >
//                 <Settings size={16} />
//                 <span>Accounts ({getConnectedCount()})</span>
//               </button>
//               <button
//                 onClick={() => setShowComposeModal(true)}
//                 className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors shadow-md"
//               >
//                 <Plus size={16} />
//                 <span>New Post</span>
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Content Area */}
//         <div className="flex-1 overflow-hidden">
//           {showCalendarView ? (
//             <div className="h-full p-6">
//               <CalendarView
//                 posts={filteredPosts}
//                 onDateSelect={handleDateSelect}
//                 onPostClick={handleViewPost}
//               />
//             </div>
//           ) : (
//             <div className="h-full flex flex-col">
//               {/* Navigation Tabs */}
//               <div className="bg-white border-b border-gray-200 px-6">
//                 <nav className="flex space-x-8">
//                   {[
//                     { key: 'queue', label: 'Queue', icon: Clock, count: tabCounts.queue },
//                     { key: 'drafts', label: 'Drafts', icon: Edit3, count: tabCounts.drafts },
//                     { key: 'sent', label: 'Sent', icon: Send, count: tabCounts.sent },
//                     { key: 'analytics', label: 'Analytics', icon: BarChart3, count: 0 },
//                   ].map(({ key, label, icon: Icon, count }) => (
//                     <button
//                       key={key}
//                       onClick={() => setActiveTab(key as any)}
//                       className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
//                         activeTab === key
//                           ? 'border-blue-500 text-blue-600'
//                           : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                       }`}
//                     >
//                       <Icon size={16} />
//                       <span>{label}</span>
//                       {count > 0 && (
//                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                           activeTab === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
//                         }`}>
//                           {count}
//                         </span>
//                       )}
//                     </button>
//                   ))}
//                 </nav>
//               </div>

//               {/* Tab Content */}
//               <div className="flex-1 overflow-auto p-6">
//                 {activeTab === 'analytics' ? (
//                   <div className="bg-white rounded-xl border p-8">
//                     <div className="text-center py-12">
//                       <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                         <BarChart3 className="text-blue-600" size={32} />
//                       </div>
//                       <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
//                       <p className="text-gray-500 mb-6">
//                         Track your social media performance across all platforms
//                       </p>
//                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//                         <div className="bg-blue-50 p-4 rounded-lg">
//                           <div className="text-2xl font-bold text-blue-600">2.4K</div>
//                           <div className="text-sm text-blue-500">Total Reach</div>
//                         </div>
//                         <div className="bg-green-50 p-4 rounded-lg">
//                           <div className="text-2xl font-bold text-green-600">134</div>
//                           <div className="text-sm text-green-500">Total Engagement</div>
//                         </div>
//                         <div className="bg-purple-50 p-4 rounded-lg">
//                           <div className="text-2xl font-bold text-purple-600">8</div>
//                           <div className="text-sm text-purple-500">Active Campaigns</div>
//                         </div>
//                       </div>
//                       <div className="text-sm text-gray-400">
//                         Coming soon: Detailed analytics, engagement metrics, and performance insights
//                       </div>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="space-y-6">
//                     {/* Enhanced Post Queue */}
//                     <div className="bg-white rounded-xl shadow-sm border">
//                       <div className="p-6 border-b border-gray-200">
//                         <div className="flex justify-between items-center">
//                           <h2 className="text-lg font-semibold text-gray-900">
//                             {activeTab === 'queue' && 'Scheduled Posts'}
//                             {activeTab === 'drafts' && 'Draft Posts'}
//                             {activeTab === 'sent' && 'Published Posts'}
//                           </h2>
//                           <div className="flex items-center space-x-2">
//                             <span className="text-sm text-gray-500">
//                               {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
//                             </span>
//                             <button className="p-2 hover:bg-gray-100 rounded-lg">
//                               <Filter size={16} className="text-gray-500" />
//                             </button>
//                           </div>
//                         </div>
//                       </div>
                      
//                       {/* Posts List */}
//                       <div className="p-6">
//                         {filteredPosts.length === 0 ? (
//                           <div className="text-center py-12">
//                             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                               {activeTab === 'queue' && <Clock className="text-gray-400" size={24} />}
//                               {activeTab === 'drafts' && <Edit3 className="text-gray-400" size={24} />}
//                               {activeTab === 'sent' && <Send className="text-gray-400" size={24} />}
//                             </div>
//                             <h3 className="text-lg font-medium text-gray-900 mb-2">
//                               {activeTab === 'queue' && 'No scheduled posts'}
//                               {activeTab === 'drafts' && 'No draft posts'}
//                               {activeTab === 'sent' && 'No published posts'}
//                             </h3>
//                             <p className="text-gray-500 mb-6">
//                               {activeTab === 'queue' && 'Schedule your first post to get started'}
//                               {activeTab === 'drafts' && 'Create a draft to save your work'}
//                               {activeTab === 'sent' && 'Your published posts will appear here'}
//                             </p>
//                             <button
//                               onClick={() => setShowComposeModal(true)}
//                               className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                             >
//                               <Plus size={16} />
//                               <span>Create New Post</span>
//                             </button>
//                           </div>
//                         ) : (
//                           <div className="space-y-4">
//                             {filteredPosts.map(post => (
//                               <div
//                                 key={post.id}
//                                 className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
//                               >
//                                 <div className="flex justify-between items-start">
//                                   <div className="flex-1">
//                                     <div className="flex items-center space-x-3 mb-3">
//                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                                         post.status === 'scheduled' ? 'bg-blue-100' :
//                                         post.status === 'draft' ? 'bg-gray-100' :
//                                         post.status === 'published' ? 'bg-green-100' : 'bg-red-100'
//                                       }`}>
//                                         {post.status === 'scheduled' && <Clock size={16} className="text-blue-600" />}
//                                         {post.status === 'draft' && <Edit3 size={16} className="text-gray-600" />}
//                                         {post.status === 'published' && <Send size={16} className="text-green-600" />}
//                                       </div>
//                                       <div className="flex items-center space-x-2">
//                                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                                           post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
//                                           post.status === 'draft' ? 'bg-gray-100 text-gray-700' :
//                                           post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//                                         }`}>
//                                           {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
//                                         </span>
//                                         <span className="text-sm text-gray-500">
//                                           {new Date(post.scheduledAt).toLocaleDateString('en-US', {
//                                             month: 'short',
//                                             day: 'numeric',
//                                             hour: '2-digit',
//                                             minute: '2-digit'
//                                           })}
//                                         </span>
//                                       </div>
//                                     </div>
                                    
//                                     <p className="text-gray-900 mb-3 line-clamp-2">
//                                       {post.content || 'No content'}
//                                     </p>
                                    
//                                     {/* Platforms */}
//                                     <div className="flex items-center space-x-2 mb-3">
//                                       <span className="text-xs text-gray-500">Publishing to:</span>
//                                       <div className="flex space-x-2">
//                                         {post.platforms.map(platformId => {
//                                           const platform = connectedAccounts.find(acc => acc.platform === platformId);
//                                           return platform ? (
//                                             <span key={platformId} className="inline-flex items-center" title={platform.username}>
//                                               {renderPlatformIcon(platformId, 16, "text-gray-600")}
//                                             </span>
//                                           ) : null;
//                                         })}
//                                       </div>
//                                     </div>
                                    
//                                     {/* Media preview */}
//                                     {post.media && post.media.length > 0 && (
//                                       <div className="flex space-x-1 mb-3">
//                                         {post.media.slice(0, 3).map((file, index) => (
//                                           <div key={index} className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
//                                             {file && (
//                                               <img
//                                                 src={URL.createObjectURL(file)}
//                                                 alt="Media"
//                                                 className="w-full h-full object-cover"
//                                               />
//                                             )}
//                                           </div>
//                                         ))}
//                                         {post.media.length > 3 && (
//                                           <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-600">
//                                             +{post.media.length - 3}
//                                           </div>
//                                         )}
//                                       </div>
//                                     )}
                                    
//                                     {/* Analytics for published posts */}
//                                     {post.status === 'published' && post.analytics && (
//                                       <div className="bg-gray-50 rounded-lg p-3 mt-3">
//                                         <div className="grid grid-cols-4 gap-3 text-center">
//                                           <div>
//                                             <div className="text-lg font-semibold text-gray-900">
//                                               {Object.values(post.analytics).reduce((sum, data) => sum + data.reach, 0)}
//                                             </div>
//                                             <div className="text-xs text-gray-500">Reach</div>
//                                           </div>
//                                           <div>
//                                             <div className="text-lg font-semibold text-gray-900">
//                                               {Object.values(post.analytics).reduce((sum, data) => sum + data.likes, 0)}
//                                             </div>
//                                             <div className="text-xs text-gray-500">Likes</div>
//                                           </div>
//                                           <div>
//                                             <div className="text-lg font-semibold text-gray-900">
//                                               {Object.values(post.analytics).reduce((sum, data) => sum + data.clicks, 0)}
//                                             </div>
//                                             <div className="text-xs text-gray-500">Clicks</div>
//                                           </div>
//                                           <div>
//                                             <div className="text-lg font-semibold text-gray-900">
//                                               {Object.values(post.analytics).reduce((sum, data) => sum + data.shares, 0)}
//                                             </div>
//                                             <div className="text-xs text-gray-500">Shares</div>
//                                           </div>
//                                         </div>
//                                       </div>
//                                     )}
//                                   </div>
                                  
//                                   {/* Actions */}
//                                   <div className="flex items-center space-x-2">
//                                     <button
//                                       onClick={() => handleViewPost(post)}
//                                       className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                                       title="View post"
//                                     >
//                                       <Eye size={16} className="text-gray-500" />
//                                     </button>
//                                     {post.status !== 'published' && (
//                                       <button
//                                         onClick={() => handleEditPost(post)}
//                                         className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                                         title="Edit post"
//                                       >
//                                         <Edit3 size={16} className="text-gray-500" />
//                                       </button>
//                                     )}
//                                     <button
//                                       onClick={() => handleDeletePost(post.id)}
//                                       className="p-2 hover:bg-red-50 rounded-lg transition-colors"
//                                       title="Delete post"
//                                     >
//                                       <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                                       </svg>
//                                     </button>
//                                   </div>
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Right Sidebar */}
//       <ChannelSidebar
//         connectedAccounts={connectedAccounts}
//         selectedChannel={selectedChannel}
//         onChannelSelect={setSelectedChannel}
//         onConnectAccount={() => setShowAccountModal(true)}
//         posts={posts}
//       />

//       {/* Modals */}
//       <ComposeModal
//         isOpen={showComposeModal}
//         onClose={() => setShowComposeModal(false)}
//         onPublish={handlePublish}
//         connectedAccounts={connectedAccounts}
//         selectedChannel={selectedChannel}
//       />

//       <SocialAccountConnect
//         isOpen={showAccountModal}
//         onClose={() => setShowAccountModal(false)}
//         onConnect={handleConnect}
//         connectedAccounts={connectedAccounts}
//       />
//     </div>
//   );
// };

// export default PostDashboard;