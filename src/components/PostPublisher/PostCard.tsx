import React, { useState } from 'react';
import { 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Copy, 
  Archive, 
  ExternalLink, 
  MessageSquare, 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  Eye,
  CheckCircle,
  AlertCircle,
  Zap,
  Star,
  Share2,
  Download
} from 'lucide-react';
import { Post, PostStatus, POST_TYPE_CONFIG, STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/types/post-publisher/post';

interface PostCardProps {
  post: Post;
  onEdit: (post: Post) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: PostStatus) => void;
  onDuplicate?: (post: Post) => void;
  onArchive?: (id: string) => void;
  onShare?: (post: Post) => void;
  showCompactView?: boolean;
  showActions?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onEdit,
  onDelete,
  onStatusChange,
  onDuplicate,
  onArchive,
  onShare,
  showCompactView = false,
  showActions = true
}) => {
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const postTypeConfig = POST_TYPE_CONFIG[post.type];
  const statusConfig = STATUS_CONFIG[post.status];
  const priorityConfig = PRIORITY_CONFIG[post.priority];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return formatDate(date);
  };

  const getStatusIcon = () => {
    switch (post.status) {
      case 'draft': return <Edit3 className="w-4 h-4" />;
      case 'in_review': return <Eye className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'published': return <Zap className="w-4 h-4" />;
      case 'archived': return <Archive className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityIndicator = () => {
    const sizes = {
      low: 'w-2 h-2',
      medium: 'w-2.5 h-2.5',
      high: 'w-3 h-3',
      urgent: 'w-3 h-3 animate-pulse'
    };

    const colors = {
      low: 'bg-green-400',
      medium: 'bg-yellow-400',
      high: 'bg-orange-400',
      urgent: 'bg-red-500'
    };

    return (
      <div className={`${sizes[post.priority]} ${colors[post.priority]} rounded-full`} />
    );
  };

  const getAssigneeAvatar = () => {
    const initials = post.assignee.split(' ').map(n => n[0]).join('').toUpperCase();
    const colors = [
      'from-purple-400 to-pink-400',
      'from-blue-400 to-indigo-400',
      'from-green-400 to-teal-400',
      'from-yellow-400 to-orange-400',
      'from-red-400 to-pink-400',
      'from-indigo-400 to-purple-400'
    ];
    const colorIndex = post.assignee.length % colors.length;

    return (
      <div className={`w-8 h-8 bg-gradient-to-r ${colors[colorIndex]} rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm`}>
        {initials}
      </div>
    );
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent.length > maxLength 
      ? textContent.substring(0, maxLength) + '...' 
      : textContent;
  };

  const ActionMenu = () => {
    if (!showActionMenu) return null;

    return (
      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[160px]">
        <button
          onClick={() => {
            onEdit(post);
            setShowActionMenu(false);
          }}
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 text-gray-700"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit</span>
        </button>
        
        {onDuplicate && (
          <button
            onClick={() => {
              onDuplicate(post);
              setShowActionMenu(false);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 text-gray-700"
          >
            <Copy className="w-4 h-4" />
            <span>Duplicate</span>
          </button>
        )}
        
        {onShare && (
          <button
            onClick={() => {
              onShare(post);
              setShowActionMenu(false);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 text-gray-700"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        )}
        
        <button
          onClick={() => {
            // Export functionality
            setShowActionMenu(false);
          }}
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 text-gray-700"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
        
        {onArchive && post.status !== 'archived' && (
          <button
            onClick={() => {
              onArchive(post.id);
              setShowActionMenu(false);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 text-gray-700"
          >
            <Archive className="w-4 h-4" />
            <span>Archive</span>
          </button>
        )}
        
        <div className="border-t border-gray-100 my-1" />
        
        <button
          onClick={() => {
            onDelete(post.id);
            setShowActionMenu(false);
          }}
          className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center space-x-2 text-red-600"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>
    );
  };

  if (showCompactView) {
    return (
      <div 
        className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={() => onEdit(post)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${postTypeConfig.color} text-white flex-shrink-0`}>
              <span className="text-sm">{postTypeConfig.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{post.title}</h4>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{postTypeConfig.label}</span>
                <span>•</span>
                <span>{formatRelativeTime(post.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-2 py-1 rounded-full text-xs border ${statusConfig.bgColor} ${statusConfig.color} flex items-center space-x-1`}>
              {getStatusIcon()}
              <span>{statusConfig.label}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-200 group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl ${postTypeConfig.color} text-white shadow-sm`}>
            <span className="text-lg">{postTypeConfig.icon}</span>
          </div>
          <div className="flex items-center space-x-3">
            {getPriorityIndicator()}
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                {postTypeConfig.label}
              </span>
              <div className="text-xs text-gray-400">
                {postTypeConfig.category}
              </div>
            </div>
          </div>
        </div>
        
        {showActions && (
          <div className="relative">
            <button
              onClick={() => setShowActionMenu(!showActionMenu)}
              className={`p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            <ActionMenu />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-lg">
          {post.title}
        </h3>
        
        {post.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {post.description}
          </p>
        )}
        
        {post.content && (
          <p className="text-sm text-gray-500 line-clamp-3">
            {truncateContent(post.content, 150)}
          </p>
        )}
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200"
            >
              #{tag}
            </span>
          ))}
          {post.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
              +{post.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Media indicator */}
      {post.media.length > 0 && (
        <div className="flex items-center space-x-1 mb-4 text-sm text-gray-500">
          <Eye className="w-4 h-4" />
          <span>{post.media.length} attachment{post.media.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          {getAssigneeAvatar()}
          <div>
            <div className="text-sm font-medium text-gray-900">{post.assignee}</div>
            <div className="text-xs text-gray-500">
              {post.scheduledAt 
                ? `Scheduled ${formatDate(post.scheduledAt)}` 
                : `Created ${formatRelativeTime(post.createdAt)}`
              }
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Comments indicator */}
          {post.comments.length > 0 && (
            <div className="flex items-center space-x-1 text-gray-500">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">{post.comments.length}</span>
            </div>
          )}

          {/* Status badge */}
          <div className={`px-3 py-1.5 rounded-full text-xs border-2 ${statusConfig.bgColor} ${statusConfig.color} flex items-center space-x-1.5 font-medium`}>
            {getStatusIcon()}
            <span>{statusConfig.label}</span>
          </div>
        </div>
      </div>

      {/* Due date warning */}
      {post.dueDate && new Date(post.dueDate) < new Date() && post.status !== 'published' && (
        <div className="absolute top-2 right-2">
          <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>Overdue</span>
          </div>
        </div>
      )}

      {/* Scheduled indicator */}
      {post.status === 'scheduled' && post.scheduledAt && (
        <div className="absolute top-2 left-2">
          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Scheduled</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;