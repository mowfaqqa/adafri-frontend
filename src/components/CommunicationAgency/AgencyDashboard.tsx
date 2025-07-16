"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  Plus, 
  BarChart3, 
  Settings, 
  Bell, 
  Download,
  RefreshCw,
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Activity
} from 'lucide-react';
import PostBoard from './PostBoard';
import PostModal from './modals/PostModal';
import PostFilter from './PostFilter';
import { 
  Post, 
  PostStatus, 
  PostFilter as PostFilterType,
  TeamMember,
  POST_TYPE_CONFIG,
  STATUS_CONFIG,
  PRIORITY_CONFIG 
} from '@/lib/types/post-publisher/post';

// Mock data
const mockTeamMembers: TeamMember[] = [
  { 
    id: '1', 
    name: 'Alice Johnson', 
    email: 'alice@djombi.com', 
    role: 'Content Manager', 
    department: 'Marketing',
    permissions: ['create', 'edit', 'review', 'publish'],
    status: 'active'
  },
  { 
    id: '2', 
    name: 'Bob Smith', 
    email: 'bob@djombi.com', 
    role: 'Marketing Specialist', 
    department: 'Marketing',
    permissions: ['create', 'edit'],
    status: 'active'
  },
  { 
    id: '3', 
    name: 'Carol Davis', 
    email: 'carol@djombi.com', 
    role: 'Social Media Manager', 
    department: 'Marketing',
    permissions: ['create', 'edit', 'publish'],
    status: 'active'
  },
  { 
    id: '4', 
    name: 'David Wilson', 
    email: 'david@djombi.com', 
    role: 'CRM Manager', 
    department: 'Sales',
    permissions: ['create', 'edit', 'review'],
    status: 'busy'
  },
  { 
    id: '5', 
    name: 'Eva Brown', 
    email: 'eva@djombi.com', 
    role: 'Designer', 
    department: 'Design',
    permissions: ['create', 'edit'],
    status: 'active'
  },
];

const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Q4 Product Launch Campaign',
    content: '<h2>Exciting New Features</h2><p>Our Q4 product launch introduces revolutionary features that will transform how our customers work...</p>',
    type: 'email',
    category: 'marketing',
    tags: ['product', 'launch', 'q4', 'campaign'],
    status: 'draft',
    assignee: 'Alice Johnson',
    media: [],
    createdAt: new Date('2024-12-01'),
    scheduledAt: new Date('2024-12-15'),
    dueDate: new Date('2024-12-10'),
    comments: [
      {
        id: '1',
        content: 'Looking good! Can we add more details about the pricing?',
        author: 'Bob Smith',
        createdAt: new Date('2024-12-02'),
        reactions: []
      }
    ],
    history: [],
    priority: 'high',
    description: 'Main email campaign for Q4 product launch',
    metadata: {
      targetAudience: ['customers', 'prospects'],
      expectedReach: 10000,
      budgetAllocated: 5000,
      customFields: {},
      integrationData: {}
    }
  },
  {
    id: '2',
    title: 'Holiday Social Media Campaign',
    content: '<p>🎄 Season\'s greetings from our team! Join us in celebrating the holidays with special offers...</p>',
    type: 'meta_ads',
    category: 'marketing',
    tags: ['holiday', 'social', 'engagement', 'meta'],
    status: 'in_review',
    assignee: 'Carol Davis',
    media: [],
    createdAt: new Date('2024-11-28'),
    dueDate: new Date('2024-12-05'),
    comments: [],
    history: [],
    priority: 'medium',
    description: 'Holiday-themed social media advertising campaign',
    metadata: {
      targetAudience: ['social media followers'],
      expectedReach: 50000,
      budgetAllocated: 2000,
      customFields: {},
      integrationData: {}
    }
  },
  {
    id: '3',
    title: 'Invoice Payment Reminder System',
    content: '<p>Dear valued customer, this is a friendly reminder about your upcoming payment due date...</p>',
    type: 'invoice_message',
    category: 'finance',
    tags: ['payment', 'reminder', 'finance'],
    status: 'scheduled',
    assignee: 'David Wilson',
    media: [],
    createdAt: new Date('2024-11-30'),
    scheduledAt: new Date('2024-12-05'),
    comments: [],
    history: [],
    priority: 'urgent',
    description: 'Automated payment reminder for overdue invoices',
    metadata: {
      customFields: {},
      integrationData: {}
    }
  },
  {
    id: '4',
    title: 'Website Homepage Redesign Content',
    content: '<h1>Welcome to the Future</h1><p>Discover how our innovative solutions can transform your business...</p>',
    type: 'website_content',
    category: 'marketing',
    tags: ['website', 'homepage', 'redesign'],
    status: 'published',
    assignee: 'Eva Brown',
    media: [],
    createdAt: new Date('2024-11-25'),
    comments: [],
    history: [],
    priority: 'medium',
    description: 'New homepage content with improved messaging',
    metadata: {
      customFields: {},
      integrationData: {}
    }
  },
  {
    id: '5',
    title: 'Customer Support Article: Getting Started',
    content: '<h2>Getting Started Guide</h2><p>This comprehensive guide will help new users get started with our platform...</p>',
    type: 'support_article',
    category: 'support',
    tags: ['support', 'guide', 'onboarding'],
    status: 'approved',
    assignee: 'Alice Johnson',
    media: [],
    createdAt: new Date('2024-11-20'),
    comments: [],
    history: [],
    priority: 'low',
    description: 'Help article for new user onboarding',
    metadata: {
      customFields: {},
      integrationData: {}
    }
  },
  {
    id: '6',
    title: 'Internal Team Meeting Notes',
    content: '<h3>Weekly Team Sync - December 1st</h3><p>Agenda items discussed: Project updates, resource allocation...</p>',
    type: 'meeting_note',
    category: 'internal',
    tags: ['meeting', 'internal', 'sync'],
    status: 'draft',
    assignee: 'Bob Smith',
    media: [],
    createdAt: new Date('2024-12-01'),
    comments: [],
    history: [],
    priority: 'low',
    description: 'Weekly team meeting documentation',
    metadata: {
      customFields: {},
      integrationData: {}
    }
  }
];

const AgencyDashboard: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>(mockPosts);
  const [activeFilters, setActiveFilters] = useState<PostFilterType>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'grid'>('board');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Apply filters and search
  useEffect(() => {
    let filtered = posts;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        post.assignee.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (activeFilters.type && activeFilters.type.length > 0) {
      filtered = filtered.filter(post => activeFilters.type!.includes(post.type));
    }

    if (activeFilters.status && activeFilters.status.length > 0) {
      filtered = filtered.filter(post => activeFilters.status!.includes(post.status));
    }

    if (activeFilters.assignee && activeFilters.assignee.length > 0) {
      filtered = filtered.filter(post => activeFilters.assignee!.includes(post.assignee));
    }

    if (activeFilters.priority && activeFilters.priority.length > 0) {
      filtered = filtered.filter(post => activeFilters.priority!.includes(post.priority));
    }

    if (activeFilters.category && activeFilters.category.length > 0) {
      filtered = filtered.filter(post => activeFilters.category!.includes(post.category));
    }

    if (activeFilters.tags && activeFilters.tags.length > 0) {
      filtered = filtered.filter(post => 
        activeFilters.tags!.some(tag => 
          post.tags.some(postTag => postTag.toLowerCase().includes(tag.toLowerCase()))
        )
      );
    }

    if (activeFilters.hasMedia) {
      filtered = filtered.filter(post => post.media.length > 0);
    }

    if (activeFilters.hasComments) {
      filtered = filtered.filter(post => post.comments.length > 0);
    }

    if (activeFilters.dateRange) {
      filtered = filtered.filter(post => {
        const postDate = new Date(post.createdAt);
        return postDate >= activeFilters.dateRange!.start && postDate <= activeFilters.dateRange!.end;
      });
    }

    setFilteredPosts(filtered);
  }, [posts, activeFilters, searchTerm]);

  // Dashboard stats
  const dashboardStats = useMemo(() => {
    const totalPosts = posts.length;
    const publishedPosts = posts.filter(p => p.status === 'published').length;
    const scheduledPosts = posts.filter(p => p.status === 'scheduled').length;
    const draftPosts = posts.filter(p => p.status === 'draft').length;
    const overduePosts = posts.filter(p => 
      p.dueDate && new Date(p.dueDate) < new Date() && p.status !== 'published'
    ).length;
    const urgentPosts = posts.filter(p => p.priority === 'urgent').length;

    return {
      totalPosts,
      publishedPosts,
      scheduledPosts,
      draftPosts,
      overduePosts,
      urgentPosts
    };
  }, [posts]);

  const handleCreatePost = () => {
    setEditingPost(undefined);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDuplicatePost = (post: Post) => {
    setEditingPost(post);
    setModalMode('duplicate');
    setIsModalOpen(true);
  };

  const handleSavePost = async (postData: Partial<Post>) => {
    setLoading(true);
    
    try {
      if (modalMode === 'edit' && editingPost) {
        // Update existing post
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === editingPost.id 
              ? { ...p, ...postData }
              : p
          )
        );
      } else {
        // Create new post (including duplicates)
        const newPost: Post = {
          id: Date.now().toString(),
          title: postData.title || '',
          content: postData.content || '',
          type: postData.type || 'email',
          category: postData.category || 'communication',
          tags: postData.tags || [],
          status: postData.status || 'draft',
          assignee: postData.assignee || '',
          media: postData.media || [],
          createdAt: new Date(),
          scheduledAt: postData.scheduledAt,
          dueDate: postData.dueDate,
          comments: [],
          history: [{
            id: Date.now().toString(),
            action: 'created',
            details: 'Post created',
            author: 'Current User',
            timestamp: new Date()
          }],
          priority: postData.priority || 'medium',
          description: postData.description || '',
          metadata: postData.metadata || {
            customFields: {},
            integrationData: {}
          }
        };
        
        setPosts(prevPosts => [...prevPosts, newPost]);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = (id: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setPosts(prevPosts => prevPosts.filter(p => p.id !== id));
    }
  };

  const handleStatusChange = (id: string, status: PostStatus) => {
    setPosts(prevPosts => 
      prevPosts.map(p => 
        p.id === id 
          ? { 
              ...p, 
              status,
              history: [
                ...p.history,
                {
                  id: Date.now().toString(),
                  action: 'status_changed',
                  details: `Status changed to ${status}`,
                  author: 'Current User',
                  timestamp: new Date()
                }
              ]
            }
          : p
      )
    );
  };

  const handleArchivePost = (id: string) => {
    handleStatusChange(id, 'archived');
  };

  const handleSharePost = (post: Post) => {
    // Simulate sharing functionality
    console.log('Sharing post:', post.title);
    // In real implementation, this would open a share modal or copy link
  };

  const exportData = () => {
    const dataStr = JSON.stringify(filteredPosts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'posts-export.json';
    link.click();
  };

  return (
    // <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50">
    <div className="bg-white">
      <div className="px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white shadow-lg">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Communication Agency</h1>
              <p className="text-gray-600">
                Manage content across all channels • {dashboardStats.totalPosts} total posts
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={exportData}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            
            <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            
            <button
              onClick={handleCreatePost}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Create Post</span>
            </button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalPosts}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">{dashboardStats.publishedPosts}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{dashboardStats.scheduledPosts}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-gray-600">{dashboardStats.draftPosts}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-100 text-gray-600">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{dashboardStats.urgentPosts}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-100 text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-orange-600">{dashboardStats.overduePosts}</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                <Bell className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <PostFilter
            onFilterChange={setActiveFilters}
            teamMembers={mockTeamMembers}
            activeFilters={activeFilters}
            totalPosts={posts.length}
            filteredCount={filteredPosts.length}
            onViewModeChange={setViewMode}
            viewMode={viewMode}
          />
        </div>

        {/* Main Content */}
        <PostBoard
          posts={filteredPosts}
          onEditPost={handleEditPost}
          onDeletePost={handleDeletePost}
          onStatusChange={handleStatusChange}
          onCreatePost={handleCreatePost}
          onDuplicatePost={handleDuplicatePost}
          onArchivePost={handleArchivePost}
          onSharePost={handleSharePost}
          loading={loading}
          viewMode={viewMode === 'board' ? 'board' : 'compact'}
        />

        {/* Modal */}
        <PostModal
          post={editingPost}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSavePost}
          teamMembers={mockTeamMembers}
          mode={modalMode}
        />
      </div>
    </div>
  );
};

export default AgencyDashboard;