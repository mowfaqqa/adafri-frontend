import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  MoreVertical, 
  FileText, 
  TrendingUp, 
  Clock, 
  Users,
  Filter,
  SortAsc,
  Eye,
  Archive,
  Calendar,
  Target
} from 'lucide-react';
import PostCard from './PostCard';
import { 
  Post, 
  PostStatus, 
  STATUS_CONFIG, 
  POST_TYPE_CONFIG,
  PRIORITY_CONFIG 
} from '@/lib/types/post-publisher/post';

interface PostBoardProps {
  posts: Post[];
  onEditPost: (post: Post) => void;
  onDeletePost: (id: string) => void;
  onStatusChange: (id: string, status: PostStatus) => void;
  onCreatePost?: () => void;
  onDuplicatePost?: (post: Post) => void;
  onArchivePost?: (id: string) => void;
  onSharePost?: (post: Post) => void;
  loading?: boolean;
  viewMode?: 'board' | 'compact';
  sortBy?: 'priority' | 'date' | 'assignee' | 'type';
  sortOrder?: 'asc' | 'desc';
}

const PostBoard: React.FC<PostBoardProps> = ({
  posts,
  onEditPost,
  onDeletePost,
  onStatusChange,
  onCreatePost,
  onDuplicatePost,
  onArchivePost,
  onSharePost,
  loading = false,
  viewMode = 'board',
  sortBy = 'priority',
  sortOrder = 'desc'
}) => {
  const [expandedColumns, setExpandedColumns] = useState<Record<PostStatus, boolean>>({
    draft: true,
    in_review: true,
    approved: true,
    scheduled: true,
    published: true,
    archived: false,
    cancelled: false
  });

  const statusColumns: Array<{
    status: PostStatus;
    title: string;
    color: string;
    bgColor: string;
    icon: React.ReactNode;
    description: string;
  }> = [
    {
      status: 'draft',
      title: 'Draft',
      color: 'text-gray-700',
      bgColor: 'bg-gray-50 border-gray-200',
      icon: <FileText className="w-5 h-5" />,
      description: 'Posts in progress'
    },
    {
      status: 'in_review',
      title: 'In Review',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50 border-yellow-200',
      icon: <Eye className="w-5 h-5" />,
      description: 'Awaiting approval'
    },
    {
      status: 'approved',
      title: 'Approved',
      color: 'text-green-700',
      bgColor: 'bg-green-50 border-green-200',
      icon: <Users className="w-5 h-5" />,
      description: 'Ready to schedule'
    },
    {
      status: 'scheduled',
      title: 'Scheduled',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 border-blue-200',
      icon: <Clock className="w-5 h-5" />,
      description: 'Scheduled for publishing'
    },
    {
      status: 'published',
      title: 'Published',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 border-emerald-200',
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Live and active'
    },
    {
      status: 'archived',
      title: 'Archived',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 border-gray-200',
      icon: <Archive className="w-5 h-5" />,
      description: 'Archived posts'
    },
    {
      status: 'cancelled',
      title: 'Cancelled',
      color: 'text-red-700',
      bgColor: 'bg-red-50 border-red-200',
      icon: <Target className="w-5 h-5" />,
      description: 'Cancelled posts'
    }
  ];

  const sortPosts = (postsToSort: Post[]) => {
    return [...postsToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'assignee':
          comparison = a.assignee.localeCompare(b.assignee);
          break;
        case 'type':
          comparison = POST_TYPE_CONFIG[a.type].label.localeCompare(POST_TYPE_CONFIG[b.type].label);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  };

  const getPostsByStatus = (status: PostStatus) => {
    const filtered = posts.filter(post => post.status === status);
    return sortPosts(filtered);
  };

  const getColumnStats = (status: PostStatus) => {
    const columnPosts = getPostsByStatus(status);
    const priorityCount = {
      urgent: columnPosts.filter(p => p.priority === 'urgent').length,
      high: columnPosts.filter(p => p.priority === 'high').length,
      medium: columnPosts.filter(p => p.priority === 'medium').length,
      low: columnPosts.filter(p => p.priority === 'low').length
    };
    
    const overduePosts = columnPosts.filter(p => 
      p.dueDate && new Date(p.dueDate) < new Date() && status !== 'published'
    ).length;

    return { priorityCount, overduePosts, total: columnPosts.length };
  };

  const toggleColumnExpanded = (status: PostStatus) => {
    setExpandedColumns(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const handleDragStart = (e: React.DragEvent, post: Post) => {
    e.dataTransfer.setData('text/plain', post.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: PostStatus) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData('text/plain');
    onStatusChange(postId, targetStatus);
  };

  const visibleColumns = statusColumns.filter(col => 
    col.status !== 'archived' && col.status !== 'cancelled' || 
    getPostsByStatus(col.status).length > 0
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleColumns.map((column) => (
          <div key={column.status} className="bg-gray-50 rounded-xl p-4 animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Board Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">Post Pipeline</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{posts.length} total posts</span>
            <span>•</span>
            <span>{posts.filter(p => p.priority === 'urgent').length} urgent</span>
            <span>•</span>
            <span>{posts.filter(p => p.dueDate && new Date(p.dueDate) < new Date()).length} overdue</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <SortAsc className="w-4 h-4" />
            <span>Sort: {sortBy}</span>
          </button>
          
          {onCreatePost && (
            <button
              onClick={onCreatePost}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Post</span>
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className={`grid gap-6 ${
        viewMode === 'compact' 
          ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'
      } min-h-screen`}>
        {visibleColumns.map((column) => {
          const columnPosts = getPostsByStatus(column.status);
          const stats = getColumnStats(column.status);
          const isExpanded = expandedColumns[column.status];

          return (
            <div key={column.status} className="flex flex-col">
              {/* Column Header */}
              <div 
                className={`p-4 rounded-t-xl border-2 ${column.bgColor} ${column.color} sticky top-0 z-10`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {column.icon}
                    <h3 className="font-semibold">{column.title}</h3>
                    <span className="bg-white bg-opacity-80 text-gray-700 px-2 py-1 rounded-full text-sm font-medium">
                      {stats.total}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {stats.overduePosts > 0 && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                        {stats.overduePosts} overdue
                      </span>
                    )}
                    
                    <button
                      onClick={() => toggleColumnExpanded(column.status)}
                      className="p-1 hover:bg-white hover:bg-opacity-50 rounded"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm opacity-80 mb-3">{column.description}</p>

                {/* Priority Indicators */}
                {stats.total > 0 && (
                  <div className="flex items-center space-x-2">
                    {stats.priorityCount.urgent > 0 && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-xs">{stats.priorityCount.urgent}</span>
                      </div>
                    )}
                    {stats.priorityCount.high > 0 && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-xs">{stats.priorityCount.high}</span>
                      </div>
                    )}
                    {stats.priorityCount.medium > 0 && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-xs">{stats.priorityCount.medium}</span>
                      </div>
                    )}
                    {stats.priorityCount.low > 0 && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs">{stats.priorityCount.low}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Column Content */}
              <div 
                className={`flex-1 bg-gray-50 ${isExpanded ? 'rounded-b-xl' : ''} border-l-2 border-r-2 border-b-2 border-gray-200`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                {isExpanded && (
                  <div className="p-4 space-y-4 min-h-96">
                    {columnPosts.length > 0 ? (
                      columnPosts.map((post) => (
                        <div
                          key={post.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, post)}
                          className="cursor-move"
                        >
                          <PostCard
                            post={post}
                            onEdit={onEditPost}
                            onDelete={onDeletePost}
                            onStatusChange={onStatusChange}
                            onDuplicate={onDuplicatePost}
                            onArchive={onArchivePost}
                            onShare={onSharePost}
                            showCompactView={viewMode === 'compact'}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          {column.icon}
                        </div>
                        <p className="text-gray-500 text-sm mb-4">
                          No posts in {column.title.toLowerCase()}
                        </p>
                        {column.status === 'draft' && onCreatePost && (
                          <button
                            onClick={onCreatePost}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Create Post</span>
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Quick Add Button */}
                    {column.status === 'draft' && columnPosts.length > 0 && onCreatePost && (
                      <button
                        onClick={onCreatePost}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors text-sm font-medium"
                      >
                        + Add another post
                      </button>
                    )}
                  </div>
                )}
                
                {!isExpanded && (
                  <div className="p-4 text-center">
                    <button
                      onClick={() => toggleColumnExpanded(column.status)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Show {stats.total} posts
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Board Footer Stats */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Pipeline Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {statusColumns.map((column) => {
            const count = getPostsByStatus(column.status).length;
            const percentage = posts.length > 0 ? (count / posts.length) * 100 : 0;
            
            return (
              <div key={column.status} className="text-center">
                <div className={`w-12 h-12 rounded-full ${column.bgColor.replace('bg-', 'bg-').replace('-50', '-100')} flex items-center justify-center mx-auto mb-2`}>
                  {column.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-500">{column.title}</div>
                <div className="text-xs text-gray-400">{percentage.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PostBoard;