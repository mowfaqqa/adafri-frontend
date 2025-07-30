'use client';

import React from 'react';
import { CalendarDays, Mail, Users, X, Calendar, Download } from 'lucide-react';
import { SocialPost, renderPlatformIcon } from '@/lib/types/post-publisher/social-media';

interface ShareCalendarModalProps {
  isOpen: boolean;
  currentDate: Date;
  selectedMonths: number;
  shareEmails: string;
  shareMessage: string;
  posts: SocialPost[];
  onMonthsChange: (months: number) => void;
  onEmailChange: (emails: string) => void;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  onClose: () => void;
}

const ShareCalendarModal: React.FC<ShareCalendarModalProps> = ({
  isOpen,
  currentDate,
  selectedMonths,
  shareEmails,
  shareMessage,
  posts,
  onMonthsChange,
  onEmailChange,
  onMessageChange,
  onSend,
  onClose
}) => {
  if (!isOpen) return null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getPostsForDateRange = (startDate: Date, endDate: Date) => {
    return posts.filter(post => {
      const postDate = new Date(post.scheduledAt);
      return postDate >= startDate && postDate <= endDate;
    }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  };

  const groupPostsByMonth = (posts: SocialPost[], startDate: Date, monthCount: number) => {
    const result = [];
    
    for (let i = 0; i < monthCount; i++) {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const monthPosts = posts.filter(post => {
        const postDate = new Date(post.scheduledAt);
        return postDate >= monthStart && postDate <= monthEnd;
      });
      
      result.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        posts: monthPosts
      });
    }
    
    return result;
  };

  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + selectedMonths, 0);
  const calendarPosts = getPostsForDateRange(startDate, endDate);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <CalendarDays size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Share Content Calendar</h3>
                <p className="text-green-100">Share your entire content calendar with team members</p>
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
        <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Calendar Range Selection */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
              <Calendar size={16} className="mr-2" />
              Select Calendar Range
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Month
                </label>
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <span className="font-medium text-gray-900">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Months
                </label>
                <select
                  value={selectedMonths}
                  onChange={(e) => onMonthsChange(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>
                      {num} Month{num > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Date Range:</span>
                <span className="font-medium text-gray-900">
                  {startDate.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })} - {endDate.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Total Posts:</span>
                <span className="font-medium text-green-600">
                  {calendarPosts.length} posts
                </span>
              </div>
            </div>
          </div>

          {/* Calendar Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border max-h-60 overflow-y-auto">
            <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
              <Download size={16} className="mr-2" />
              Calendar Preview
            </h4>
            {groupPostsByMonth(calendarPosts, startDate, selectedMonths).map(({ month, posts: monthPosts }) => (
              <div key={month} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{month}</h5>
                  <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-full">
                    {monthPosts.length} posts
                  </span>
                </div>
                <div className="space-y-1">
                  {monthPosts.slice(0, 3).map(post => (
                    <div key={post.id} className="bg-white p-2 rounded border text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {new Date(post.scheduledAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          post.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {post.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1 line-clamp-1">
                        {post.content ? post.content.substring(0, 60) + '...' : 'No content'}
                      </p>
                      <div className="flex items-center mt-1 space-x-1">
                        {post.platforms.slice(0, 3).map(platformId => (
                          <div key={platformId} className="w-4 h-4">
                            {renderPlatformIcon(platformId, 12, "text-gray-500")}
                          </div>
                        ))}
                        {post.platforms.length > 3 && (
                          <span className="text-xs text-gray-500">+{post.platforms.length - 3}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {monthPosts.length > 3 && (
                    <div className="text-center text-sm text-gray-500 py-1">
                      ... and {monthPosts.length - 3} more posts
                    </div>
                  )}
                  {monthPosts.length === 0 && (
                    <div className="text-center text-sm text-gray-400 py-2">
                      No posts scheduled for this month
                    </div>
                  )}
                </div>
              </div>
            ))}
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              rows={8}
              placeholder="Add a custom message for your team..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSend}
              disabled={!shareEmails.trim()}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                shareEmails.trim()
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <CalendarDays size={16} />
              <span>Share Calendar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareCalendarModal;