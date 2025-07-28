'use client';

import React from 'react';
import { Share2, Mail, Users, X } from 'lucide-react';
import { SocialPost, renderPlatformIcon } from '@/lib/types/post-publisher/social-media';

interface SharePostModalProps {
  isOpen: boolean;
  post: SocialPost | null;
  shareEmails: string;
  shareMessage: string;
  onEmailChange: (emails: string) => void;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  onClose: () => void;
}

const SharePostModal: React.FC<SharePostModalProps> = ({
  isOpen,
  post,
  shareEmails,
  shareMessage,
  onEmailChange,
  onMessageChange,
  onSend,
  onClose
}) => {
  if (!isOpen || !post) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <div className="w-3 h-3 bg-gray-500 rounded-full"></div>;
      case 'scheduled': return <div className="w-3 h-3 bg-blue-500 rounded-full"></div>;
      case 'published': return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
      default: return <div className="w-3 h-3 bg-gray-500 rounded-full"></div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Share2 size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Share Post with Team</h3>
                <p className="text-blue-100">Collaborate on your scheduled content</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Post Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex items-center space-x-2 mb-3">
              {getStatusIcon(post.status)}
              <span className="text-sm font-medium">
                {new Date(post.scheduledAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <div className="flex space-x-1 ml-auto">
                {post.platforms.map(platformId => (
                  <div key={platformId} className="flex items-center justify-center w-5 h-5 bg-white rounded-full">
                    {renderPlatformIcon(platformId, 12, "text-gray-600")}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-gray-900 mb-2">
              {post.content || 'No content'}
            </p>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
              post.status === 'draft' ? 'bg-gray-100 text-gray-700' :
              'bg-green-100 text-green-700'
            }`}>
              {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
            </span>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} className="inline mr-2" />
              Team Member Emails
            </label>
            <input
              type="text"
              value={shareEmails}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="Enter email addresses separated by commas (e.g., john@company.com, sarah@company.com)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple emails with commas
            </p>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users size={16} className="inline mr-2" />
              Message (Optional)
            </label>
            <textarea
              value={shareMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              rows={6}
              placeholder="Add a custom message for your team..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSend}
              disabled={!shareEmails.trim()}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                shareEmails.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Share2 size={16} className="inline mr-2" />
              Share Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;