'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, Clock, Edit3, Send, Share2, CalendarDays } from 'lucide-react';
import { SocialPost, renderPlatformIcon } from '@/lib/types/post-publisher/social-media';
import SharePostModal from './calendarPost/SharePostModal';
import ShareCalendarModal from './calendarPost/ShareCalendarModal';
import SuccessModal from './calendarPost/SuccessModal';

interface CalendarViewProps {
  posts: SocialPost[];
  onDateSelect: (date: Date) => void;
  onPostClick: (post: SocialPost) => void;
  selectedDate?: Date;
  onNewPost?: (date: Date, time: string) => void;
  onEditPost?: (post: SocialPost) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  posts,
  onDateSelect,
  onPostClick,
  selectedDate,
  onNewPost,
  onEditPost
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  // Post sharing state
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPostForShare, setSelectedPostForShare] = useState<SocialPost | null>(null);
  const [shareEmails, setShareEmails] = useState<string>('');
  const [shareMessage, setShareMessage] = useState('');
  
  // Calendar sharing state
  const [showCalendarShareModal, setShowCalendarShareModal] = useState(false);
  const [calendarShareEmails, setCalendarShareEmails] = useState<string>('');
  const [calendarShareMessage, setCalendarShareMessage] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<number>(1);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    type: 'post' | 'calendar';
    recipientCount: number;
    details: string;
  } | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getPostsForDate = (date: Date) => {
    return posts.filter(post => {
      const postDate = new Date(post.scheduledAt);
      return postDate.toDateString() === date.toDateString();
    }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDay && date.toDateString() === selectedDay.toDateString();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit3 size={12} className="text-gray-500" />;
      case 'scheduled': return <Clock size={12} className="text-blue-500" />;
      case 'published': return <Send size={12} className="text-green-500" />;
      default: return <Clock size={12} className="text-gray-500" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  // Event handlers
  const handleDayClick = (date: Date) => {
    setSelectedDay(date);
    onDateSelect(date);
  };

  const handleNewPostClick = (date: Date, time: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (onNewPost) {
      onNewPost(date, time);
    }
  };

  const handleEditPost = (post: SocialPost, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (onEditPost) {
      onEditPost(post);
    }
  };

  // Post sharing handlers
  const handleSharePost = (post: SocialPost, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setSelectedPostForShare(post);
    setShareMessage(`Hi team,\n\nI'd like to share this scheduled post with you:\n\n"${post.content}"\n\nScheduled for: ${new Date(post.scheduledAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}\n\nPlatforms: ${post.platforms.join(', ')}\n\nBest regards`);
    setShowShareModal(true);
  };

  const handleSendShare = () => {
    if (!selectedPostForShare || !shareEmails.trim()) return;
    
    const emails = shareEmails.split(',').map(email => email.trim()).filter(email => email);
    
    console.log('Sharing post with:', {
      post: selectedPostForShare,
      emails: emails,
      message: shareMessage
    });
    
    setSuccessModalData({
      type: 'post',
      recipientCount: emails.length,
      details: `Post "${selectedPostForShare.content?.substring(0, 50)}..." shared successfully`
    });
    setShowSuccessModal(true);
    
    setShowShareModal(false);
    setSelectedPostForShare(null);
    setShareEmails('');
    setShareMessage('');
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setSelectedPostForShare(null);
    setShareEmails('');
    setShareMessage('');
  };

  // Calendar sharing handlers
  const handleShareCalendar = () => {
    console.log('Calendar share button clicked');
    const message = generateCalendarShareMessage();
    setCalendarShareMessage(message);
    setShowCalendarShareModal(true);
  };

  const generateCalendarShareMessage = () => {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + selectedMonths, 0);
    
    let message = `Hi team,\n\nI'm sharing our content calendar from ${startDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })} to ${endDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })}.\n\n`;

    const calendarPosts = getPostsForDateRange(startDate, endDate);
    
    if (calendarPosts.length === 0) {
      message += "No posts scheduled for this period.\n\n";
    } else {
      message += `Total Posts: ${calendarPosts.length}\n\n`;
      
      const postsByMonth = groupPostsByMonth(calendarPosts, startDate, selectedMonths);
      
      postsByMonth.forEach(({ month, posts: monthPosts }) => {
        message += `📅 ${month}\n`;
        message += `Posts: ${monthPosts.length}\n\n`;
        
        monthPosts.slice(0, 5).forEach(post => {
          message += `• ${new Date(post.scheduledAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })} - ${post.content ? post.content.substring(0, 50) + '...' : 'No content'}\n`;
          message += `  Platforms: ${post.platforms.join(', ')}\n`;
          message += `  Status: ${post.status}\n\n`;
        });
        
        if (monthPosts.length > 5) {
          message += `  ... and ${monthPosts.length - 5} more posts\n\n`;
        }
      });
    }
    
    message += "Best regards";
    return message;
  };

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

  const handleCalendarMonthsChange = (months: number) => {
    setSelectedMonths(months);
    const updatedMessage = generateCalendarShareMessage();
    setCalendarShareMessage(updatedMessage);
  };

  const handleSendCalendarShare = () => {
    if (!calendarShareEmails.trim()) return;
    
    const emails = calendarShareEmails.split(',').map(email => email.trim()).filter(email => email);
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + selectedMonths, 0);
    const calendarPosts = getPostsForDateRange(startDate, endDate);
    
    console.log('Sharing calendar with:', {
      emails: emails,
      message: calendarShareMessage,
      dateRange: { startDate, endDate },
      monthCount: selectedMonths,
      totalPosts: calendarPosts.length,
      posts: calendarPosts
    });
    
    setSuccessModalData({
      type: 'calendar',
      recipientCount: emails.length,
      details: `${selectedMonths} month${selectedMonths > 1 ? 's' : ''} with ${calendarPosts.length} posts shared successfully`
    });
    setShowSuccessModal(true);
    
    handleCloseCalendarShareModal();
  };

  const handleCloseCalendarShareModal = () => {
    setShowCalendarShareModal(false);
    setCalendarShareEmails('');
    setCalendarShareMessage('');
    setSelectedMonths(1);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessModalData(null);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Content Calendar</h3>
              <p className="text-blue-100">Plan and schedule your social media posts</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleShareCalendar();
              }}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors flex items-center justify-center"
              title="Share Calendar"
              type="button"
            >
              <CalendarDays size={20} />
            </button>
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h4 className="font-semibold text-lg min-w-[180px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h4>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Calendar Grid */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-7 gap-1 mb-4">
            {/* Day Headers */}
            {dayNames.map(day => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDay }, (_, index) => (
              <div key={`empty-${index}`} className="h-32 bg-gray-50 rounded-lg"></div>
            ))}

            {/* Calendar Days */}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dayPosts = getPostsForDate(date);
              const isCurrentDay = isToday(date);
              const isSelectedDay = isSelected(date);
              const isPast = isPastDate(date);

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(date)}
                  className={`h-32 p-2 rounded-lg cursor-pointer transition-all ${
                    isCurrentDay 
                      ? 'bg-blue-50 border-2 border-blue-300' 
                      : isSelectedDay 
                        ? 'bg-purple-50 border-2 border-purple-300' 
                        : isPast 
                          ? 'bg-gray-50 hover:bg-gray-100' 
                          : 'bg-white hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${
                    isCurrentDay ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {day}
                  </div>

                  {/* Posts for this day */}
                  <div className="space-y-1">
                    {dayPosts.slice(0, 3).map(post => (
                      <div
                        key={post.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPostClick(post);
                        }}
                        className={`p-1 rounded text-xs cursor-pointer transition-colors ${
                          post.status === 'scheduled' ? 'bg-blue-100 hover:bg-blue-200' :
                          post.status === 'draft' ? 'bg-gray-100 hover:bg-gray-200' :
                          post.status === 'published' ? 'bg-green-100 hover:bg-green-200' : 'bg-red-100 hover:bg-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(post.status)}
                            <span className="text-xs font-medium">
                              {formatTime(new Date(post.scheduledAt))}
                            </span>
                          </div>
                          <div className="flex space-x-0.5">
                            {post.platforms.slice(0, 2).map(platformId => (
                              <div key={platformId} className="flex items-center justify-center w-4 h-4">
                                {renderPlatformIcon(platformId, 10, "text-gray-600")}
                              </div>
                            ))}
                            {post.platforms.length > 2 && (
                              <span className="text-xs">+{post.platforms.length - 2}</span>
                            )}
                          </div>
                        </div>
                        <div className="truncate text-xs text-gray-600 mt-1">
                          {post.content ? post.content.substring(0, 25) + '...' : 'No content'}
                        </div>
                      </div>
                    ))}

                    {dayPosts.length > 3 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        +{dayPosts.length - 3} more
                      </div>
                    )}

                    {dayPosts.length === 0 && !isPast && (
                      <button
                        onClick={(e) => handleNewPostClick(date, '09:00', e)}
                        className="w-full h-8 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                      >
                        <Plus size={14} className="text-gray-400 group-hover:text-blue-500" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar - Selected Day Details */}
        {selectedDay && (
          <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
            <div className="mb-6">
              <h4 className="font-semibold text-lg text-gray-900 mb-2">
                {formatDateForDisplay(selectedDay)}
              </h4>
              <div className="text-sm text-gray-500">
                {getPostsForDate(selectedDay).length} post{getPostsForDate(selectedDay).length !== 1 ? 's' : ''} scheduled
              </div>
            </div>

            <div className="space-y-3">
              {getPostsForDate(selectedDay).map(post => (
                <div
                  key={post.id}
                  className="bg-white rounded-lg p-4 border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(post.status)}
                      <span className="text-sm font-medium">
                        {formatTime(new Date(post.scheduledAt))}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {post.platforms.map(platformId => (
                          <div key={platformId} className="flex items-center justify-center w-5 h-5 bg-gray-100 rounded-full">
                            {renderPlatformIcon(platformId, 12, "text-gray-600")}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => handleEditPost(post, e)}
                          className="p-1 hover:bg-blue-50 rounded transition-colors"
                          title="Edit post"
                        >
                          <Edit3 size={14} className="text-blue-500" />
                        </button>
                        {(post.status === 'scheduled' || post.status === 'draft') && (
                          <button
                            onClick={(e) => handleSharePost(post, e)}
                            className="p-1 hover:bg-green-50 rounded transition-colors"
                            title="Share with team"
                          >
                            <Share2 size={14} className="text-green-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-900 line-clamp-2 mb-2">
                    {post.content || 'No content'}
                  </p>
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    post.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                    post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </div>
                </div>
              ))}

              {/* Add new post button */}
              {!isPastDate(selectedDay) && (
                <button
                  onClick={(e) => handleNewPostClick(selectedDay, '09:00', e)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Plus size={16} className="text-gray-400 group-hover:text-blue-500" />
                    <span className="text-sm text-gray-600 group-hover:text-blue-600">
                      Add new post
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-100 rounded-full"></div>
              <span className="text-gray-600">Draft</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
              <span className="text-gray-600">Scheduled</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-100 rounded-full"></div>
              <span className="text-gray-600">Published</span>
            </div>
          </div>
          <div className="text-gray-500">
            Total posts this month: {posts.filter(post => {
              const postDate = new Date(post.scheduledAt);
              return postDate.getMonth() === currentDate.getMonth() && 
                     postDate.getFullYear() === currentDate.getFullYear();
            }).length}
          </div>
        </div>
      </div>

      {/* Modals */}
      <SharePostModal
        isOpen={showShareModal}
        post={selectedPostForShare}
        shareEmails={shareEmails}
        shareMessage={shareMessage}
        onEmailChange={setShareEmails}
        onMessageChange={setShareMessage}
        onSend={handleSendShare}
        onClose={handleCloseShareModal}
      />

      <ShareCalendarModal
        isOpen={showCalendarShareModal}
        currentDate={currentDate}
        selectedMonths={selectedMonths}
        shareEmails={calendarShareEmails}
        shareMessage={calendarShareMessage}
        posts={posts}
        onMonthsChange={handleCalendarMonthsChange}
        onEmailChange={setCalendarShareEmails}
        onMessageChange={setCalendarShareMessage}
        onSend={handleSendCalendarShare}
        onClose={handleCloseCalendarShareModal}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        data={successModalData}
        onClose={handleCloseSuccessModal}
      />
    </div>
  );
};

export default CalendarView;











































































// calendar code 7/25/2025
// 'use client';

// import React, { useState } from 'react';
// import { ChevronLeft, ChevronRight, Calendar, Plus, Clock, Edit3, Send, Share2, Mail, Users, X, CalendarDays, Download, CheckCircle, Sparkles } from 'lucide-react';
// import { SocialPost, PLATFORMS, renderPlatformIcon } from '@/lib/types/post-publisher/social-media';

// interface CalendarViewProps {
//   posts: SocialPost[];
//   onDateSelect: (date: Date) => void;
//   onPostClick: (post: SocialPost) => void;
//   selectedDate?: Date;
//   onNewPost?: (date: Date, time: string) => void;
//   onEditPost?: (post: SocialPost) => void;
// }

// const CalendarView: React.FC<CalendarViewProps> = ({
//   posts,
//   onDateSelect,
//   onPostClick,
//   selectedDate,
//   onNewPost,
//   onEditPost
// }) => {
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [selectedDay, setSelectedDay] = useState<Date | null>(null);
//   const [showShareModal, setShowShareModal] = useState(false);
//   const [selectedPostForShare, setSelectedPostForShare] = useState<SocialPost | null>(null);
//   const [shareEmails, setShareEmails] = useState<string>('');
//   const [shareMessage, setShareMessage] = useState('');
//   const [showCalendarShareModal, setShowCalendarShareModal] = useState(false);
//   const [calendarShareEmails, setCalendarShareEmails] = useState<string>('');
//   const [calendarShareMessage, setCalendarShareMessage] = useState('');
//   const [selectedMonths, setSelectedMonths] = useState<number>(1);
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
//   const [successModalData, setSuccessModalData] = useState<{
//     type: 'post' | 'calendar';
//     recipientCount: number;
//     details: string;
//   } | null>(null);

//   const getDaysInMonth = (date: Date) => {
//     return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
//   };

//   const getFirstDayOfMonth = (date: Date) => {
//     return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
//   };

//   const getPostsForDate = (date: Date) => {
//     return posts.filter(post => {
//       const postDate = new Date(post.scheduledAt);
//       return postDate.toDateString() === date.toDateString();
//     }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
//   };

//   const navigateMonth = (direction: 'prev' | 'next') => {
//     setCurrentDate(prev => {
//       const newDate = new Date(prev);
//       if (direction === 'prev') {
//         newDate.setMonth(prev.getMonth() - 1);
//       } else {
//         newDate.setMonth(prev.getMonth() + 1);
//       }
//       return newDate;
//     });
//   };

//   const isToday = (date: Date) => {
//     const today = new Date();
//     return date.toDateString() === today.toDateString();
//   };

//   const isSelected = (date: Date) => {
//     return selectedDay && date.toDateString() === selectedDay.toDateString();
//   };

//   const isPastDate = (date: Date) => {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     return date < today;
//   };

//   const monthNames = [
//     'January', 'February', 'March', 'April', 'May', 'June',
//     'July', 'August', 'September', 'October', 'November', 'December'
//   ];

//   const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

//   const daysInMonth = getDaysInMonth(currentDate);
//   const firstDay = getFirstDayOfMonth(currentDate);

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case 'draft': return <Edit3 size={12} className="text-gray-500" />;
//       case 'scheduled': return <Clock size={12} className="text-blue-500" />;
//       case 'published': return <Send size={12} className="text-green-500" />;
//       default: return <Clock size={12} className="text-gray-500" />;
//     }
//   };

//   const formatTime = (date: Date) => {
//     return date.toLocaleTimeString('en-US', { 
//       hour: 'numeric', 
//       minute: '2-digit',
//       hour12: true 
//     });
//   };

//   const formatDateForDisplay = (date: Date) => {
//     return date.toLocaleDateString('en-US', {
//       weekday: 'long',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   const handleDayClick = (date: Date) => {
//     setSelectedDay(date);
//     onDateSelect(date);
//   };

//   const handleNewPostClick = (date: Date, time: string, event: React.MouseEvent) => {
//     event.stopPropagation();
//     event.preventDefault();
//     if (onNewPost) {
//       onNewPost(date, time);
//     }
//   };

//   const handleEditPost = (post: SocialPost, event: React.MouseEvent) => {
//     event.stopPropagation();
//     event.preventDefault();
//     if (onEditPost) {
//       onEditPost(post);
//     }
//   };

//   const handleSharePost = (post: SocialPost, event: React.MouseEvent) => {
//     event.stopPropagation();
//     event.preventDefault();
//     setSelectedPostForShare(post);
//     setShareMessage(`Hi team,\n\nI'd like to share this scheduled post with you:\n\n"${post.content}"\n\nScheduled for: ${new Date(post.scheduledAt).toLocaleDateString('en-US', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     })}\n\nPlatforms: ${post.platforms.join(', ')}\n\nBest regards`);
//     setShowShareModal(true);
//   };

//   const handleSendShare = () => {
//     if (!selectedPostForShare || !shareEmails.trim()) return;
    
//     const emails = shareEmails.split(',').map(email => email.trim()).filter(email => email);
    
//     // In a real app, you would send this to your backend API
//     console.log('Sharing post with:', {
//       post: selectedPostForShare,
//       emails: emails,
//       message: shareMessage
//     });
    
//     // Show success modal instead of alert
//     setSuccessModalData({
//       type: 'post',
//       recipientCount: emails.length,
//       details: `Post "${selectedPostForShare.content?.substring(0, 50)}..." shared successfully`
//     });
//     setShowSuccessModal(true);
    
//     // Close share modal and reset
//     setShowShareModal(false);
//     setSelectedPostForShare(null);
//     setShareEmails('');
//     setShareMessage('');
//   };

//   const handleCloseShareModal = () => {
//     setShowShareModal(false);
//     setSelectedPostForShare(null);
//     setShareEmails('');
//     setShareMessage('');
//   };

//   const handleShareCalendar = () => {
//     console.log('Calendar share button clicked'); // Debug log
//     const message = generateCalendarShareMessage();
//     setCalendarShareMessage(message);
//     setShowCalendarShareModal(true);
//   };

//   const generateCalendarShareMessage = () => {
//     const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
//     const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + selectedMonths, 0);
    
//     console.log('Generating message for date range:', startDate, 'to', endDate); // Debug log
    
//     let message = `Hi team,\n\nI'm sharing our content calendar from ${startDate.toLocaleDateString('en-US', {
//       month: 'long',
//       year: 'numeric'
//     })} to ${endDate.toLocaleDateString('en-US', {
//       month: 'long',
//       year: 'numeric'
//     })}.\n\n`;

//     // Get posts for the selected months
//     const calendarPosts = getPostsForDateRange(startDate, endDate);
    
//     console.log('Found posts:', calendarPosts.length); // Debug log
    
//     if (calendarPosts.length === 0) {
//       message += "No posts scheduled for this period.\n\n";
//     } else {
//       message += `Total Posts: ${calendarPosts.length}\n\n`;
      
//       // Group posts by month
//       const postsByMonth = groupPostsByMonth(calendarPosts, startDate, selectedMonths);
      
//       postsByMonth.forEach(({ month, posts: monthPosts }) => {
//         message += `📅 ${month}\n`;
//         message += `Posts: ${monthPosts.length}\n\n`;
        
//         monthPosts.slice(0, 5).forEach(post => {
//           message += `• ${new Date(post.scheduledAt).toLocaleDateString('en-US', {
//             month: 'short',
//             day: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit'
//           })} - ${post.content ? post.content.substring(0, 50) + '...' : 'No content'}\n`;
//           message += `  Platforms: ${post.platforms.join(', ')}\n`;
//           message += `  Status: ${post.status}\n\n`;
//         });
        
//         if (monthPosts.length > 5) {
//           message += `  ... and ${monthPosts.length - 5} more posts\n\n`;
//         }
//       });
//     }
    
//     message += "Best regards";
//     return message;
//   };

//   const getPostsForDateRange = (startDate: Date, endDate: Date) => {
//     return posts.filter(post => {
//       const postDate = new Date(post.scheduledAt);
//       return postDate >= startDate && postDate <= endDate;
//     }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
//   };

//   const groupPostsByMonth = (posts: SocialPost[], startDate: Date, monthCount: number) => {
//     const result = [];
    
//     for (let i = 0; i < monthCount; i++) {
//       const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
//       const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
//       const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
//       const monthPosts = posts.filter(post => {
//         const postDate = new Date(post.scheduledAt);
//         return postDate >= monthStart && postDate <= monthEnd;
//       });
      
//       result.push({
//         month: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
//         posts: monthPosts
//       });
//     }
    
//     return result;
//   };

//   const handleSendCalendarShare = () => {
//     if (!calendarShareEmails.trim()) return;
    
//     const emails = calendarShareEmails.split(',').map(email => email.trim()).filter(email => email);
//     const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
//     const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + selectedMonths, 0);
//     const calendarPosts = getPostsForDateRange(startDate, endDate);
    
//     console.log('Sending calendar share:', { // Debug log
//       emails,
//       dateRange: { startDate, endDate },
//       monthCount: selectedMonths,
//       totalPosts: calendarPosts.length
//     });
    
//     // In a real app, you would send this to your backend API
//     console.log('Sharing calendar with:', {
//       emails: emails,
//       message: calendarShareMessage,
//       dateRange: { startDate, endDate },
//       monthCount: selectedMonths,
//       totalPosts: calendarPosts.length,
//       posts: calendarPosts
//     });
    
//     // Show success modal instead of alert
//     setSuccessModalData({
//       type: 'calendar',
//       recipientCount: emails.length,
//       details: `${selectedMonths} month${selectedMonths > 1 ? 's' : ''} with ${calendarPosts.length} posts shared successfully`
//     });
//     setShowSuccessModal(true);
    
//     // Close modal and reset
//     handleCloseCalendarShareModal();
//   };

//   const handleCloseCalendarShareModal = () => {
//     setShowCalendarShareModal(false);
//     setCalendarShareEmails('');
//     setCalendarShareMessage('');
//     setSelectedMonths(1);
//   };

//   const handleCloseSuccessModal = () => {
//     setShowSuccessModal(false);
//     setSuccessModalData(null);
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
//       {/* Calendar Header */}
//       <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
//         <div className="flex justify-between items-center">
//           <div className="flex items-center space-x-3">
//             <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
//               <Calendar size={20} />
//             </div>
//             <div>
//               <h3 className="text-xl font-semibold">Content Calendar</h3>
//               <p className="text-blue-100">Plan and schedule your social media posts</p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={(e) => {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 handleShareCalendar();
//               }}
//               className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors flex items-center justify-center"
//               title="Share Calendar"
//               type="button"
//             >
//               <CalendarDays size={20} />
//             </button>
//             <button
//               onClick={() => navigateMonth('prev')}
//               className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
//             >
//               <ChevronLeft size={20} />
//             </button>
//             <h4 className="font-semibold text-lg min-w-[180px] text-center">
//               {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
//             </h4>
//             <button
//               onClick={() => navigateMonth('next')}
//               className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
//             >
//               <ChevronRight size={20} />
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="flex">
//         {/* Calendar Grid */}
//         <div className="flex-1 p-6">
//           <div className="grid grid-cols-7 gap-1 mb-4">
//             {/* Day Headers */}
//             {dayNames.map(day => (
//               <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg">
//                 {day}
//               </div>
//             ))}
//           </div>

//           <div className="grid grid-cols-7 gap-1">
//             {/* Empty cells for days before month starts */}
//             {Array.from({ length: firstDay }, (_, index) => (
//               <div key={`empty-${index}`} className="h-32 bg-gray-50 rounded-lg"></div>
//             ))}

//             {/* Calendar Days */}
//             {Array.from({ length: daysInMonth }, (_, index) => {
//               const day = index + 1;
//               const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
//               const dayPosts = getPostsForDate(date);
//               const isCurrentDay = isToday(date);
//               const isSelectedDay = isSelected(date);
//               const isPast = isPastDate(date);

//               return (
//                 <div
//                   key={day}
//                   onClick={() => handleDayClick(date)}
//                   className={`h-32 p-2 rounded-lg cursor-pointer transition-all ${
//                     isCurrentDay 
//                       ? 'bg-blue-50 border-2 border-blue-300' 
//                       : isSelectedDay 
//                         ? 'bg-purple-50 border-2 border-purple-300' 
//                         : isPast 
//                           ? 'bg-gray-50 hover:bg-gray-100' 
//                           : 'bg-white hover:bg-gray-50 border border-gray-200'
//                   }`}
//                 >
//                   <div className={`text-sm font-semibold mb-1 ${
//                     isCurrentDay ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-900'
//                   }`}>
//                     {day}
//                   </div>

//                   {/* Posts for this day */}
//                   <div className="space-y-1">
//                     {dayPosts.slice(0, 3).map(post => (
//                       <div
//                         key={post.id}
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           onPostClick(post);
//                         }}
//                         className={`p-1 rounded text-xs cursor-pointer transition-colors ${
//                           post.status === 'scheduled' ? 'bg-blue-100 hover:bg-blue-200' :
//                           post.status === 'draft' ? 'bg-gray-100 hover:bg-gray-200' :
//                           post.status === 'published' ? 'bg-green-100 hover:bg-green-200' : 'bg-red-100 hover:bg-red-200'
//                         }`}
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center space-x-1">
//                             {getStatusIcon(post.status)}
//                             <span className="text-xs font-medium">
//                               {formatTime(new Date(post.scheduledAt))}
//                             </span>
//                           </div>
//                           <div className="flex space-x-0.5">
//                             {post.platforms.slice(0, 2).map(platformId => (
//                               <div key={platformId} className="flex items-center justify-center w-4 h-4">
//                                 {renderPlatformIcon(platformId, 10, "text-gray-600")}
//                               </div>
//                             ))}
//                             {post.platforms.length > 2 && (
//                               <span className="text-xs">+{post.platforms.length - 2}</span>
//                             )}
//                           </div>
//                         </div>
//                         <div className="truncate text-xs text-gray-600 mt-1">
//                           {post.content ? post.content.substring(0, 25) + '...' : 'No content'}
//                         </div>
//                       </div>
//                     ))}

//                     {dayPosts.length > 3 && (
//                       <div className="text-xs text-gray-500 text-center py-1">
//                         +{dayPosts.length - 3} more
//                       </div>
//                     )}

//                     {dayPosts.length === 0 && !isPast && (
//                       <button
//                         onClick={(e) => handleNewPostClick(date, '09:00', e)}
//                         className="w-full h-8 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors group"
//                       >
//                         <Plus size={14} className="text-gray-400 group-hover:text-blue-500" />
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Sidebar - Selected Day Details */}
//         {selectedDay && (
//           <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
//             <div className="mb-6">
//               <h4 className="font-semibold text-lg text-gray-900 mb-2">
//                 {formatDateForDisplay(selectedDay)}
//               </h4>
//               <div className="text-sm text-gray-500">
//                 {getPostsForDate(selectedDay).length} post{getPostsForDate(selectedDay).length !== 1 ? 's' : ''} scheduled
//               </div>
//             </div>

//             <div className="space-y-3">
//               {getPostsForDate(selectedDay).map(post => (
//                 <div
//                   key={post.id}
//                   className="bg-white rounded-lg p-4 border hover:shadow-md transition-shadow"
//                 >
//                   <div className="flex items-center justify-between mb-2">
//                     <div className="flex items-center space-x-2">
//                       {getStatusIcon(post.status)}
//                       <span className="text-sm font-medium">
//                         {formatTime(new Date(post.scheduledAt))}
//                       </span>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <div className="flex space-x-1">
//                         {post.platforms.map(platformId => (
//                           <div key={platformId} className="flex items-center justify-center w-5 h-5 bg-gray-100 rounded-full">
//                             {renderPlatformIcon(platformId, 12, "text-gray-600")}
//                           </div>
//                         ))}
//                       </div>
//                       <div className="flex items-center space-x-1">
//                         <button
//                           onClick={(e) => handleEditPost(post, e)}
//                           className="p-1 hover:bg-blue-50 rounded transition-colors"
//                           title="Edit post"
//                         >
//                           <Edit3 size={14} className="text-blue-500" />
//                         </button>
//                         {(post.status === 'scheduled' || post.status === 'draft') && (
//                           <button
//                             onClick={(e) => handleSharePost(post, e)}
//                             className="p-1 hover:bg-green-50 rounded transition-colors"
//                             title="Share with team"
//                           >
//                             <Share2 size={14} className="text-green-500" />
//                           </button>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                   <p className="text-sm text-gray-900 line-clamp-2 mb-2">
//                     {post.content || 'No content'}
//                   </p>
//                   <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
//                     post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
//                     post.status === 'draft' ? 'bg-gray-100 text-gray-700' :
//                     post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//                   }`}>
//                     {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
//                   </div>
//                 </div>
//               ))}

//               {/* Add new post button */}
//               {!isPastDate(selectedDay) && (
//                 <button
//                   onClick={(e) => handleNewPostClick(selectedDay, '09:00', e)}
//                   className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
//                 >
//                   <div className="flex items-center justify-center space-x-2">
//                     <Plus size={16} className="text-gray-400 group-hover:text-blue-500" />
//                     <span className="text-sm text-gray-600 group-hover:text-blue-600">
//                       Add new post
//                     </span>
//                   </div>
//                 </button>
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Legend */}
//       <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
//         <div className="flex items-center justify-between text-xs">
//           <div className="flex items-center space-x-6">
//             <div className="flex items-center space-x-2">
//               <div className="w-3 h-3 bg-gray-100 rounded-full"></div>
//               <span className="text-gray-600">Draft</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
//               <span className="text-gray-600">Scheduled</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <div className="w-3 h-3 bg-green-100 rounded-full"></div>
//               <span className="text-gray-600">Published</span>
//             </div>
//           </div>
//           <div className="text-gray-500">
//             Total posts this month: {posts.filter(post => {
//               const postDate = new Date(post.scheduledAt);
//               return postDate.getMonth() === currentDate.getMonth() && 
//                      postDate.getFullYear() === currentDate.getFullYear();
//             }).length}
//           </div>
//         </div>
//       </div>

//       {/* Share Modal */}
//       {showShareModal && selectedPostForShare && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl">
//             {/* Modal Header */}
//             <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
//               <div className="flex justify-between items-center">
//                 <div className="flex items-center space-x-3">
//                   <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
//                     <Share2 size={20} />
//                   </div>
//                   <div>
//                     <h3 className="text-xl font-semibold">Share Post with Team</h3>
//                     <p className="text-blue-100">Collaborate on your scheduled content</p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={handleCloseShareModal}
//                   className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
//                 >
//                   <X size={20} />
//                 </button>
//               </div>
//             </div>

//             {/* Modal Content */}
//             <div className="p-6 space-y-6">
//               {/* Post Preview */}
//               <div className="bg-gray-50 rounded-lg p-4 border">
//                 <div className="flex items-center space-x-2 mb-3">
//                   {getStatusIcon(selectedPostForShare.status)}
//                   <span className="text-sm font-medium">
//                     {new Date(selectedPostForShare.scheduledAt).toLocaleDateString('en-US', {
//                       weekday: 'long',
//                       month: 'long',
//                       day: 'numeric',
//                       hour: '2-digit',
//                       minute: '2-digit'
//                     })}
//                   </span>
//                   <div className="flex space-x-1 ml-auto">
//                     {selectedPostForShare.platforms.map(platformId => (
//                       <div key={platformId} className="flex items-center justify-center w-5 h-5 bg-white rounded-full">
//                         {renderPlatformIcon(platformId, 12, "text-gray-600")}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//                 <p className="text-gray-900 mb-2">
//                   {selectedPostForShare.content || 'No content'}
//                 </p>
//                 <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
//                   selectedPostForShare.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
//                   selectedPostForShare.status === 'draft' ? 'bg-gray-100 text-gray-700' :
//                   'bg-green-100 text-green-700'
//                 }`}>
//                   {selectedPostForShare.status.charAt(0).toUpperCase() + selectedPostForShare.status.slice(1)}
//                 </span>
//               </div>

//               {/* Email Input */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   <Mail size={16} className="inline mr-2" />
//                   Team Member Emails
//                 </label>
//                 <input
//                   type="text"
//                   value={shareEmails}
//                   onChange={(e) => setShareEmails(e.target.value)}
//                   placeholder="Enter email addresses separated by commas (e.g., john@company.com, sarah@company.com)"
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//                 <p className="text-xs text-gray-500 mt-1">
//                   Separate multiple emails with commas
//                 </p>
//               </div>

//               {/* Message Input */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   <Users size={16} className="inline mr-2" />
//                   Message (Optional)
//                 </label>
//                 <textarea
//                   value={shareMessage}
//                   onChange={(e) => setShareMessage(e.target.value)}
//                   rows={6}
//                   placeholder="Add a custom message for your team..."
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
//                 />
//               </div>

//               {/* Action Buttons */}
//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   onClick={handleCloseShareModal}
//                   className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSendShare}
//                   disabled={!shareEmails.trim()}
//                   className={`px-6 py-2 rounded-lg font-medium transition-colors ${
//                     shareEmails.trim()
//                       ? 'bg-blue-600 text-white hover:bg-blue-700'
//                       : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                   }`}
//                 >
//                   <Share2 size={16} className="inline mr-2" />
//                   Share Post
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Calendar Share Modal */}
//       {showCalendarShareModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden">
//             {/* Modal Header */}
//             <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-t-xl">
//               <div className="flex justify-between items-center">
//                 <div className="flex items-center space-x-3">
//                   <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
//                     <CalendarDays size={20} />
//                   </div>
//                   <div>
//                     <h3 className="text-xl font-semibold">Share Content Calendar</h3>
//                     <p className="text-green-100">Share your entire content calendar with team members</p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={handleCloseCalendarShareModal}
//                   className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
//                 >
//                   <X size={20} />
//                 </button>
//               </div>
//             </div>

//             {/* Modal Content */}
//             <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
//               {/* Calendar Range Selection */}
//               <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4 border border-green-200">
//                 <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
//                   <Calendar size={16} className="mr-2" />
//                   Select Calendar Range
//                 </h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Starting Month
//                     </label>
//                     <div className="p-3 bg-white rounded-lg border border-gray-200">
//                       <span className="font-medium text-gray-900">
//                         {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
//                       </span>
//                     </div>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Number of Months
//                     </label>
//                     <select
//                       value={selectedMonths}
//                       onChange={(e) => {
//                         const newMonthCount = parseInt(e.target.value);
//                         console.log('Selected months changed to:', newMonthCount); // Debug log
//                         setSelectedMonths(newMonthCount);
//                         // Regenerate message when months change
//                         const updatedMessage = generateCalendarShareMessage();
//                         setCalendarShareMessage(updatedMessage);
//                       }}
//                       className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
//                     >
//                       {[1, 2, 3, 4, 5, 6].map(num => (
//                         <option key={num} value={num}>
//                           {num} Month{num > 1 ? 's' : ''}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//                 <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-gray-600">Date Range:</span>
//                     <span className="font-medium text-gray-900">
//                       {new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toLocaleDateString('en-US', {
//                         month: 'long',
//                         year: 'numeric'
//                       })} - {new Date(currentDate.getFullYear(), currentDate.getMonth() + selectedMonths, 0).toLocaleDateString('en-US', {
//                         month: 'long',
//                         year: 'numeric'
//                       })}
//                     </span>
//                   </div>
//                   <div className="flex items-center justify-between text-sm mt-1">
//                     <span className="text-gray-600">Total Posts:</span>
//                     <span className="font-medium text-green-600">
//                       {getPostsForDateRange(
//                         new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
//                         new Date(currentDate.getFullYear(), currentDate.getMonth() + selectedMonths, 0)
//                       ).length} posts
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               {/* Calendar Preview */}
//               <div className="bg-gray-50 rounded-lg p-4 border max-h-60 overflow-y-auto">
//                 <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
//                   <Download size={16} className="mr-2" />
//                   Calendar Preview
//                 </h4>
//                 {groupPostsByMonth(
//                   getPostsForDateRange(
//                     new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
//                     new Date(currentDate.getFullYear(), currentDate.getMonth() + selectedMonths, 0)
//                   ),
//                   new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
//                   selectedMonths
//                 ).map(({ month, posts: monthPosts }) => (
//                   <div key={month} className="mb-4 last:mb-0">
//                     <div className="flex items-center justify-between mb-2">
//                       <h5 className="font-medium text-gray-900">{month}</h5>
//                       <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-full">
//                         {monthPosts.length} posts
//                       </span>
//                     </div>
//                     <div className="space-y-1">
//                       {monthPosts.slice(0, 3).map(post => (
//                         <div key={post.id} className="bg-white p-2 rounded border text-sm">
//                           <div className="flex items-center justify-between">
//                             <span className="font-medium">
//                               {new Date(post.scheduledAt).toLocaleDateString('en-US', {
//                                 month: 'short',
//                                 day: 'numeric'
//                               })}
//                             </span>
//                             <span className={`px-2 py-1 rounded-full text-xs ${
//                               post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
//                               post.status === 'draft' ? 'bg-gray-100 text-gray-700' :
//                               'bg-green-100 text-green-700'
//                             }`}>
//                               {post.status}
//                             </span>
//                           </div>
//                           <p className="text-gray-600 mt-1 line-clamp-1">
//                             {post.content ? post.content.substring(0, 60) + '...' : 'No content'}
//                           </p>
//                           <div className="flex items-center mt-1 space-x-1">
//                             {post.platforms.slice(0, 3).map(platformId => (
//                               <div key={platformId} className="w-4 h-4">
//                                 {renderPlatformIcon(platformId, 12, "text-gray-500")}
//                               </div>
//                             ))}
//                             {post.platforms.length > 3 && (
//                               <span className="text-xs text-gray-500">+{post.platforms.length - 3}</span>
//                             )}
//                           </div>
//                         </div>
//                       ))}
//                       {monthPosts.length > 3 && (
//                         <div className="text-center text-sm text-gray-500 py-1">
//                           ... and {monthPosts.length - 3} more posts
//                         </div>
//                       )}
//                       {monthPosts.length === 0 && (
//                         <div className="text-center text-sm text-gray-400 py-2">
//                           No posts scheduled for this month
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {/* Email Input */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   <Mail size={16} className="inline mr-2" />
//                   Team Member Emails
//                 </label>
//                 <input
//                   type="text"
//                   value={calendarShareEmails}
//                   onChange={(e) => setCalendarShareEmails(e.target.value)}
//                   placeholder="Enter email addresses separated by commas (e.g., john@company.com, sarah@company.com)"
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
//                 />
//                 <p className="text-xs text-gray-500 mt-1">
//                   Separate multiple emails with commas
//                 </p>
//               </div>

//               {/* Message Input */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   <Users size={16} className="inline mr-2" />
//                   Message (Optional)
//                 </label>
//                 <textarea
//                   value={calendarShareMessage}
//                   onChange={(e) => setCalendarShareMessage(e.target.value)}
//                   rows={8}
//                   placeholder="Add a custom message for your team..."
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
//                 />
//               </div>

//               {/* Action Buttons */}
//               <div className="flex justify-end space-x-3 pt-4 border-t">
//                 <button
//                   onClick={handleCloseCalendarShareModal}
//                   className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSendCalendarShare}
//                   disabled={!calendarShareEmails.trim()}
//                   className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
//                     calendarShareEmails.trim()
//                       ? 'bg-green-600 text-white hover:bg-green-700'
//                       : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                   }`}
//                 >
//                   <CalendarDays size={16} />
//                   <span>Share Calendar</span>
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Success Modal */}
//       {showSuccessModal && successModalData && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
//             {/* Modal Header */}
//             <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 text-center">
//               <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
//                 <CheckCircle size={32} />
//               </div>
//               <h3 className="text-xl font-bold mb-2">Success!</h3>
//               <div className="flex items-center justify-center space-x-1">
//                 <Sparkles size={16} className="animate-bounce" />
//                 <p className="text-green-100">
//                   {successModalData.type === 'post' ? 'Post' : 'Calendar'} shared successfully
//                 </p>
//                 <Sparkles size={16} className="animate-bounce" style={{ animationDelay: '0.2s' }} />
//               </div>
//             </div>

//             {/* Modal Content */}
//             <div className="p-6 text-center">
//               <div className="mb-6">
//                 <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
//                   {successModalData.type === 'post' ? (
//                     <Share2 size={32} className="text-green-600" />
//                   ) : (
//                     <CalendarDays size={32} className="text-green-600" />
//                   )}
//                 </div>
                
//                 <h4 className="text-lg font-semibold text-gray-900 mb-2">
//                   Shared with {successModalData.recipientCount} team member{successModalData.recipientCount > 1 ? 's' : ''}
//                 </h4>
                
//                 <p className="text-gray-600 mb-4">
//                   {successModalData.details}
//                 </p>

//                 <div className="bg-gray-50 rounded-lg p-4 mb-6">
//                   <div className="grid grid-cols-2 gap-4 text-sm">
//                     <div className="text-center">
//                       <div className="text-2xl font-bold text-green-600">
//                         {successModalData.recipientCount}
//                       </div>
//                       <div className="text-gray-500">Recipients</div>
//                     </div>
//                     <div className="text-center">
//                       <div className="text-2xl font-bold text-blue-600">
//                         {successModalData.type === 'post' ? '1' : 
//                          successModalData.details.includes('month') ? 
//                          successModalData.details.match(/(\d+) month/)?.[1] || '1' : '1'}
//                       </div>
//                       <div className="text-gray-500">
//                         {successModalData.type === 'post' ? 'Post' : 'Months'}
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-6">
//                   <CheckCircle size={16} className="text-green-500" />
//                   <span>Email notifications sent</span>
//                 </div>
//               </div>

//               {/* Action Button */}
//               <button
//                 onClick={handleCloseSuccessModal}
//                 className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
//               >
//                 Awesome! Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CalendarView;





















































































//  7/24/2025 11:00
// 'use client';

// import React, { useState } from 'react';
// import { ChevronLeft, ChevronRight, Calendar, Plus, Clock, Edit3, Send, Share2, Mail, Users, X } from 'lucide-react';
// import { SocialPost, PLATFORMS, renderPlatformIcon } from '@/lib/types/post-publisher/social-media';

// interface CalendarViewProps {
//   posts: SocialPost[];
//   onDateSelect: (date: Date) => void;
//   onPostClick: (post: SocialPost) => void;
//   selectedDate?: Date;
//   onNewPost?: (date: Date, time: string) => void;
//   onEditPost?: (post: SocialPost) => void;
// }

// const CalendarView: React.FC<CalendarViewProps> = ({
//   posts,
//   onDateSelect,
//   onPostClick,
//   selectedDate,
//   onNewPost,
//   onEditPost
// }) => {
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [selectedDay, setSelectedDay] = useState<Date | null>(null);
//   const [showShareModal, setShowShareModal] = useState(false);
//   const [selectedPostForShare, setSelectedPostForShare] = useState<SocialPost | null>(null);
//   const [shareEmails, setShareEmails] = useState<string>('');
//   const [shareMessage, setShareMessage] = useState('');

//   const getDaysInMonth = (date: Date) => {
//     return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
//   };

//   const getFirstDayOfMonth = (date: Date) => {
//     return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
//   };

//   const getPostsForDate = (date: Date) => {
//     return posts.filter(post => {
//       const postDate = new Date(post.scheduledAt);
//       return postDate.toDateString() === date.toDateString();
//     }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
//   };

//   const navigateMonth = (direction: 'prev' | 'next') => {
//     setCurrentDate(prev => {
//       const newDate = new Date(prev);
//       if (direction === 'prev') {
//         newDate.setMonth(prev.getMonth() - 1);
//       } else {
//         newDate.setMonth(prev.getMonth() + 1);
//       }
//       return newDate;
//     });
//   };

//   const isToday = (date: Date) => {
//     const today = new Date();
//     return date.toDateString() === today.toDateString();
//   };

//   const isSelected = (date: Date) => {
//     return selectedDay && date.toDateString() === selectedDay.toDateString();
//   };

//   const isPastDate = (date: Date) => {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     return date < today;
//   };

//   const monthNames = [
//     'January', 'February', 'March', 'April', 'May', 'June',
//     'July', 'August', 'September', 'October', 'November', 'December'
//   ];

//   const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

//   const daysInMonth = getDaysInMonth(currentDate);
//   const firstDay = getFirstDayOfMonth(currentDate);

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case 'draft': return <Edit3 size={12} className="text-gray-500" />;
//       case 'scheduled': return <Clock size={12} className="text-blue-500" />;
//       case 'published': return <Send size={12} className="text-green-500" />;
//       default: return <Clock size={12} className="text-gray-500" />;
//     }
//   };

//   const formatTime = (date: Date) => {
//     return date.toLocaleTimeString('en-US', { 
//       hour: 'numeric', 
//       minute: '2-digit',
//       hour12: true 
//     });
//   };

//   const formatDateForDisplay = (date: Date) => {
//     return date.toLocaleDateString('en-US', {
//       weekday: 'long',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   const handleDayClick = (date: Date) => {
//     setSelectedDay(date);
//     onDateSelect(date);
//   };

//   const handleNewPostClick = (date: Date, time: string, event: React.MouseEvent) => {
//     event.stopPropagation();
//     event.preventDefault();
//     if (onNewPost) {
//       onNewPost(date, time);
//     }
//   };

//   const handleEditPost = (post: SocialPost, event: React.MouseEvent) => {
//     event.stopPropagation();
//     event.preventDefault();
//     if (onEditPost) {
//       onEditPost(post);
//     }
//   };

//   const handleSharePost = (post: SocialPost, event: React.MouseEvent) => {
//     event.stopPropagation();
//     event.preventDefault();
//     setSelectedPostForShare(post);
//     setShareMessage(`Hi team,\n\nI'd like to share this scheduled post with you:\n\n"${post.content}"\n\nScheduled for: ${new Date(post.scheduledAt).toLocaleDateString('en-US', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     })}\n\nPlatforms: ${post.platforms.join(', ')}\n\nBest regards`);
//     setShowShareModal(true);
//   };

//   const handleSendShare = () => {
//     if (!selectedPostForShare || !shareEmails.trim()) return;
    
//     const emails = shareEmails.split(',').map(email => email.trim()).filter(email => email);
    
//     // In a real app, you would send this to your backend API
//     console.log('Sharing post with:', {
//       post: selectedPostForShare,
//       emails: emails,
//       message: shareMessage
//     });
    
//     // Simulate email sending
//     alert(`Post shared successfully with ${emails.length} team member${emails.length > 1 ? 's' : ''}!`);
    
//     // Close modal and reset
//     setShowShareModal(false);
//     setSelectedPostForShare(null);
//     setShareEmails('');
//     setShareMessage('');
//   };

//   const handleCloseShareModal = () => {
//     setShowShareModal(false);
//     setSelectedPostForShare(null);
//     setShareEmails('');
//     setShareMessage('');
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
//       {/* Calendar Header */}
//       <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
//         <div className="flex justify-between items-center">
//           <div className="flex items-center space-x-3">
//             <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
//               <Calendar size={20} />
//             </div>
//             <div>
//               <h3 className="text-xl font-semibold">Content Calendar</h3>
//               <p className="text-blue-100">Plan and schedule your social media posts</p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={() => navigateMonth('prev')}
//               className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
//             >
//               <ChevronLeft size={20} />
//             </button>
//             <h4 className="font-semibold text-lg min-w-[180px] text-center">
//               {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
//             </h4>
//             <button
//               onClick={() => navigateMonth('next')}
//               className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
//             >
//               <ChevronRight size={20} />
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="flex">
//         {/* Calendar Grid */}
//         <div className="flex-1 p-6">
//           <div className="grid grid-cols-7 gap-1 mb-4">
//             {/* Day Headers */}
//             {dayNames.map(day => (
//               <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg">
//                 {day}
//               </div>
//             ))}
//           </div>

//           <div className="grid grid-cols-7 gap-1">
//             {/* Empty cells for days before month starts */}
//             {Array.from({ length: firstDay }, (_, index) => (
//               <div key={`empty-${index}`} className="h-32 bg-gray-50 rounded-lg"></div>
//             ))}

//             {/* Calendar Days */}
//             {Array.from({ length: daysInMonth }, (_, index) => {
//               const day = index + 1;
//               const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
//               const dayPosts = getPostsForDate(date);
//               const isCurrentDay = isToday(date);
//               const isSelectedDay = isSelected(date);
//               const isPast = isPastDate(date);

//               return (
//                 <div
//                   key={day}
//                   onClick={() => handleDayClick(date)}
//                   className={`h-32 p-2 rounded-lg cursor-pointer transition-all ${
//                     isCurrentDay 
//                       ? 'bg-blue-50 border-2 border-blue-300' 
//                       : isSelectedDay 
//                         ? 'bg-purple-50 border-2 border-purple-300' 
//                         : isPast 
//                           ? 'bg-gray-50 hover:bg-gray-100' 
//                           : 'bg-white hover:bg-gray-50 border border-gray-200'
//                   }`}
//                 >
//                   <div className={`text-sm font-semibold mb-1 ${
//                     isCurrentDay ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-900'
//                   }`}>
//                     {day}
//                   </div>

//                   {/* Posts for this day */}
//                   <div className="space-y-1">
//                     {dayPosts.slice(0, 3).map(post => (
//                       <div
//                         key={post.id}
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           onPostClick(post);
//                         }}
//                         className={`p-1 rounded text-xs cursor-pointer transition-colors ${
//                           post.status === 'scheduled' ? 'bg-blue-100 hover:bg-blue-200' :
//                           post.status === 'draft' ? 'bg-gray-100 hover:bg-gray-200' :
//                           post.status === 'published' ? 'bg-green-100 hover:bg-green-200' : 'bg-red-100 hover:bg-red-200'
//                         }`}
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center space-x-1">
//                             {getStatusIcon(post.status)}
//                             <span className="text-xs font-medium">
//                               {formatTime(new Date(post.scheduledAt))}
//                             </span>
//                           </div>
//                           <div className="flex space-x-0.5">
//                             {post.platforms.slice(0, 2).map(platformId => (
//                               <div key={platformId} className="flex items-center justify-center w-4 h-4">
//                                 {renderPlatformIcon(platformId, 10, "text-gray-600")}
//                               </div>
//                             ))}
//                             {post.platforms.length > 2 && (
//                               <span className="text-xs">+{post.platforms.length - 2}</span>
//                             )}
//                           </div>
//                         </div>
//                         <div className="truncate text-xs text-gray-600 mt-1">
//                           {post.content ? post.content.substring(0, 25) + '...' : 'No content'}
//                         </div>
//                       </div>
//                     ))}

//                     {dayPosts.length > 3 && (
//                       <div className="text-xs text-gray-500 text-center py-1">
//                         +{dayPosts.length - 3} more
//                       </div>
//                     )}

//                     {dayPosts.length === 0 && !isPast && (
//                       <button
//                         onClick={(e) => handleNewPostClick(date, '09:00', e)}
//                         className="w-full h-8 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors group"
//                       >
//                         <Plus size={14} className="text-gray-400 group-hover:text-blue-500" />
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Sidebar - Selected Day Details */}
//         {selectedDay && (
//           <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
//             <div className="mb-6">
//               <h4 className="font-semibold text-lg text-gray-900 mb-2">
//                 {formatDateForDisplay(selectedDay)}
//               </h4>
//               <div className="text-sm text-gray-500">
//                 {getPostsForDate(selectedDay).length} post{getPostsForDate(selectedDay).length !== 1 ? 's' : ''} scheduled
//               </div>
//             </div>

//             <div className="space-y-3">
//               {getPostsForDate(selectedDay).map(post => (
//                 <div
//                   key={post.id}
//                   className="bg-white rounded-lg p-4 border hover:shadow-md transition-shadow"
//                 >
//                   <div className="flex items-center justify-between mb-2">
//                     <div className="flex items-center space-x-2">
//                       {getStatusIcon(post.status)}
//                       <span className="text-sm font-medium">
//                         {formatTime(new Date(post.scheduledAt))}
//                       </span>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <div className="flex space-x-1">
//                         {post.platforms.map(platformId => (
//                           <div key={platformId} className="flex items-center justify-center w-5 h-5 bg-gray-100 rounded-full">
//                             {renderPlatformIcon(platformId, 12, "text-gray-600")}
//                           </div>
//                         ))}
//                       </div>
//                       <div className="flex items-center space-x-1">
//                         <button
//                           onClick={(e) => handleEditPost(post, e)}
//                           className="p-1 hover:bg-blue-50 rounded transition-colors"
//                           title="Edit post"
//                         >
//                           <Edit3 size={14} className="text-blue-500" />
//                         </button>
//                         {(post.status === 'scheduled' || post.status === 'draft') && (
//                           <button
//                             onClick={(e) => handleSharePost(post, e)}
//                             className="p-1 hover:bg-green-50 rounded transition-colors"
//                             title="Share with team"
//                           >
//                             <Share2 size={14} className="text-green-500" />
//                           </button>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                   <p className="text-sm text-gray-900 line-clamp-2 mb-2">
//                     {post.content || 'No content'}
//                   </p>
//                   <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
//                     post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
//                     post.status === 'draft' ? 'bg-gray-100 text-gray-700' :
//                     post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//                   }`}>
//                     {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
//                   </div>
//                 </div>
//               ))}

//               {/* Add new post button */}
//               {!isPastDate(selectedDay) && (
//                 <button
//                   onClick={(e) => handleNewPostClick(selectedDay, '09:00', e)}
//                   className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
//                 >
//                   <div className="flex items-center justify-center space-x-2">
//                     <Plus size={16} className="text-gray-400 group-hover:text-blue-500" />
//                     <span className="text-sm text-gray-600 group-hover:text-blue-600">
//                       Add new post
//                     </span>
//                   </div>
//                 </button>
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Legend */}
//       <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
//         <div className="flex items-center justify-between text-xs">
//           <div className="flex items-center space-x-6">
//             <div className="flex items-center space-x-2">
//               <div className="w-3 h-3 bg-gray-100 rounded-full"></div>
//               <span className="text-gray-600">Draft</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
//               <span className="text-gray-600">Scheduled</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <div className="w-3 h-3 bg-green-100 rounded-full"></div>
//               <span className="text-gray-600">Published</span>
//             </div>
//           </div>
//           <div className="text-gray-500">
//             Total posts this month: {posts.filter(post => {
//               const postDate = new Date(post.scheduledAt);
//               return postDate.getMonth() === currentDate.getMonth() && 
//                      postDate.getFullYear() === currentDate.getFullYear();
//             }).length}
//           </div>
//         </div>
//       </div>

//       {/* Share Modal */}
//       {showShareModal && selectedPostForShare && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl">
//             {/* Modal Header */}
//             <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
//               <div className="flex justify-between items-center">
//                 <div className="flex items-center space-x-3">
//                   <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
//                     <Share2 size={20} />
//                   </div>
//                   <div>
//                     <h3 className="text-xl font-semibold">Share Post with Team</h3>
//                     <p className="text-blue-100">Collaborate on your scheduled content</p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={handleCloseShareModal}
//                   className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
//                 >
//                   <X size={20} />
//                 </button>
//               </div>
//             </div>

//             {/* Modal Content */}
//             <div className="p-6 space-y-6">
//               {/* Post Preview */}
//               <div className="bg-gray-50 rounded-lg p-4 border">
//                 <div className="flex items-center space-x-2 mb-3">
//                   {getStatusIcon(selectedPostForShare.status)}
//                   <span className="text-sm font-medium">
//                     {new Date(selectedPostForShare.scheduledAt).toLocaleDateString('en-US', {
//                       weekday: 'long',
//                       month: 'long',
//                       day: 'numeric',
//                       hour: '2-digit',
//                       minute: '2-digit'
//                     })}
//                   </span>
//                   <div className="flex space-x-1 ml-auto">
//                     {selectedPostForShare.platforms.map(platformId => (
//                       <div key={platformId} className="flex items-center justify-center w-5 h-5 bg-white rounded-full">
//                         {renderPlatformIcon(platformId, 12, "text-gray-600")}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//                 <p className="text-gray-900 mb-2">
//                   {selectedPostForShare.content || 'No content'}
//                 </p>
//                 <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
//                   selectedPostForShare.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
//                   selectedPostForShare.status === 'draft' ? 'bg-gray-100 text-gray-700' :
//                   'bg-green-100 text-green-700'
//                 }`}>
//                   {selectedPostForShare.status.charAt(0).toUpperCase() + selectedPostForShare.status.slice(1)}
//                 </span>
//               </div>

//               {/* Email Input */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   <Mail size={16} className="inline mr-2" />
//                   Team Member Emails
//                 </label>
//                 <input
//                   type="text"
//                   value={shareEmails}
//                   onChange={(e) => setShareEmails(e.target.value)}
//                   placeholder="Enter email addresses separated by commas (e.g., john@company.com, sarah@company.com)"
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//                 <p className="text-xs text-gray-500 mt-1">
//                   Separate multiple emails with commas
//                 </p>
//               </div>

//               {/* Message Input */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   <Users size={16} className="inline mr-2" />
//                   Message (Optional)
//                 </label>
//                 <textarea
//                   value={shareMessage}
//                   onChange={(e) => setShareMessage(e.target.value)}
//                   rows={6}
//                   placeholder="Add a custom message for your team..."
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
//                 />
//               </div>

//               {/* Action Buttons */}
//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   onClick={handleCloseShareModal}
//                   className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSendShare}
//                   disabled={!shareEmails.trim()}
//                   className={`px-6 py-2 rounded-lg font-medium transition-colors ${
//                     shareEmails.trim()
//                       ? 'bg-blue-600 text-white hover:bg-blue-700'
//                       : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                   }`}
//                 >
//                   <Share2 size={16} className="inline mr-2" />
//                   Share Post
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CalendarView;
















































































// 7/18/2025 2:55
// 'use client';

// import React, { useState } from 'react';
// import { ChevronLeft, ChevronRight, Calendar, Plus, Clock, Edit3, Send, Share2, Mail, Users, X } from 'lucide-react';
// import { SocialPost, PLATFORMS, renderPlatformIcon } from '@/lib/types/post-publisher/social-media';

// interface CalendarViewProps {
//   posts: SocialPost[];
//   onDateSelect: (date: Date) => void;
//   onPostClick: (post: SocialPost) => void;
//   selectedDate?: Date;
//   onNewPost?: (date: Date, time: string) => void;
// }

// const CalendarView: React.FC<CalendarViewProps> = ({
//   posts,
//   onDateSelect,
//   onPostClick,
//   selectedDate,
//   onNewPost
// }) => {
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [selectedDay, setSelectedDay] = useState<Date | null>(null);
//   const [showShareModal, setShowShareModal] = useState(false);
//   const [selectedPostForShare, setSelectedPostForShare] = useState<SocialPost | null>(null);
//   const [shareEmails, setShareEmails] = useState<string>('');
//   const [shareMessage, setShareMessage] = useState('');

//   const getDaysInMonth = (date: Date) => {
//     return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
//   };

//   const getFirstDayOfMonth = (date: Date) => {
//     return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
//   };

//   const getPostsForDate = (date: Date) => {
//     return posts.filter(post => {
//       const postDate = new Date(post.scheduledAt);
//       return postDate.toDateString() === date.toDateString();
//     }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
//   };

//   const navigateMonth = (direction: 'prev' | 'next') => {
//     setCurrentDate(prev => {
//       const newDate = new Date(prev);
//       if (direction === 'prev') {
//         newDate.setMonth(prev.getMonth() - 1);
//       } else {
//         newDate.setMonth(prev.getMonth() + 1);
//       }
//       return newDate;
//     });
//   };

//   const isToday = (date: Date) => {
//     const today = new Date();
//     return date.toDateString() === today.toDateString();
//   };

//   const isSelected = (date: Date) => {
//     return selectedDay && date.toDateString() === selectedDay.toDateString();
//   };

//   const isPastDate = (date: Date) => {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     return date < today;
//   };

//   const monthNames = [
//     'January', 'February', 'March', 'April', 'May', 'June',
//     'July', 'August', 'September', 'October', 'November', 'December'
//   ];

//   const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

//   const daysInMonth = getDaysInMonth(currentDate);
//   const firstDay = getFirstDayOfMonth(currentDate);

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case 'draft': return <Edit3 size={12} className="text-gray-500" />;
//       case 'scheduled': return <Clock size={12} className="text-blue-500" />;
//       case 'published': return <Send size={12} className="text-green-500" />;
//       default: return <Clock size={12} className="text-gray-500" />;
//     }
//   };

//   const formatTime = (date: Date) => {
//     return date.toLocaleTimeString('en-US', { 
//       hour: 'numeric', 
//       minute: '2-digit',
//       hour12: true 
//     });
//   };

//   const formatDateForDisplay = (date: Date) => {
//     return date.toLocaleDateString('en-US', {
//       weekday: 'long',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   const handleDayClick = (date: Date) => {
//     setSelectedDay(date);
//     onDateSelect(date);
//   };

//   const handleNewPostClick = (date: Date, time: string, event: React.MouseEvent) => {
//     event.stopPropagation();
//     event.preventDefault();
//     if (onNewPost) {
//       onNewPost(date, time);
//     }
//   };

//   const handleSharePost = (post: SocialPost, event: React.MouseEvent) => {
//     event.stopPropagation();
//     event.preventDefault();
//     setSelectedPostForShare(post);
//     setShareMessage(`Hi team,\n\nI'd like to share this scheduled post with you:\n\n"${post.content}"\n\nScheduled for: ${new Date(post.scheduledAt).toLocaleDateString('en-US', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     })}\n\nPlatforms: ${post.platforms.join(', ')}\n\nBest regards`);
//     setShowShareModal(true);
//   };

//   const handleSendShare = () => {
//     if (!selectedPostForShare || !shareEmails.trim()) return;
    
//     const emails = shareEmails.split(',').map(email => email.trim()).filter(email => email);
    
//     // In a real app, you would send this to your backend API
//     console.log('Sharing post with:', {
//       post: selectedPostForShare,
//       emails: emails,
//       message: shareMessage
//     });
    
//     // Simulate email sending
//     alert(`Post shared successfully with ${emails.length} team member${emails.length > 1 ? 's' : ''}!`);
    
//     // Close modal and reset
//     setShowShareModal(false);
//     setSelectedPostForShare(null);
//     setShareEmails('');
//     setShareMessage('');
//   };

//   const handleCloseShareModal = () => {
//     setShowShareModal(false);
//     setSelectedPostForShare(null);
//     setShareEmails('');
//     setShareMessage('');
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
//       {/* Calendar Header */}
//       <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
//         <div className="flex justify-between items-center">
//           <div className="flex items-center space-x-3">
//             <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
//               <Calendar size={20} />
//             </div>
//             <div>
//               <h3 className="text-xl font-semibold">Content Calendar</h3>
//               <p className="text-blue-100">Plan and schedule your social media posts</p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={() => navigateMonth('prev')}
//               className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
//             >
//               <ChevronLeft size={20} />
//             </button>
//             <h4 className="font-semibold text-lg min-w-[180px] text-center">
//               {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
//             </h4>
//             <button
//               onClick={() => navigateMonth('next')}
//               className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
//             >
//               <ChevronRight size={20} />
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="flex">
//         {/* Calendar Grid */}
//         <div className="flex-1 p-6">
//           <div className="grid grid-cols-7 gap-1 mb-4">
//             {/* Day Headers */}
//             {dayNames.map(day => (
//               <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg">
//                 {day}
//               </div>
//             ))}
//           </div>

//           <div className="grid grid-cols-7 gap-1">
//             {/* Empty cells for days before month starts */}
//             {Array.from({ length: firstDay }, (_, index) => (
//               <div key={`empty-${index}`} className="h-32 bg-gray-50 rounded-lg"></div>
//             ))}

//             {/* Calendar Days */}
//             {Array.from({ length: daysInMonth }, (_, index) => {
//               const day = index + 1;
//               const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
//               const dayPosts = getPostsForDate(date);
//               const isCurrentDay = isToday(date);
//               const isSelectedDay = isSelected(date);
//               const isPast = isPastDate(date);

//               return (
//                 <div
//                   key={day}
//                   onClick={() => handleDayClick(date)}
//                   className={`h-32 p-2 rounded-lg cursor-pointer transition-all ${
//                     isCurrentDay 
//                       ? 'bg-blue-50 border-2 border-blue-300' 
//                       : isSelectedDay 
//                         ? 'bg-purple-50 border-2 border-purple-300' 
//                         : isPast 
//                           ? 'bg-gray-50 hover:bg-gray-100' 
//                           : 'bg-white hover:bg-gray-50 border border-gray-200'
//                   }`}
//                 >
//                   <div className={`text-sm font-semibold mb-1 ${
//                     isCurrentDay ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-900'
//                   }`}>
//                     {day}
//                   </div>

//                   {/* Posts for this day */}
//                   <div className="space-y-1">
//                     {dayPosts.slice(0, 3).map(post => (
//                       <div
//                         key={post.id}
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           onPostClick(post);
//                         }}
//                         className={`p-1 rounded text-xs cursor-pointer transition-colors ${
//                           post.status === 'scheduled' ? 'bg-blue-100 hover:bg-blue-200' :
//                           post.status === 'draft' ? 'bg-gray-100 hover:bg-gray-200' :
//                           post.status === 'published' ? 'bg-green-100 hover:bg-green-200' : 'bg-red-100 hover:bg-red-200'
//                         }`}
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center space-x-1">
//                             {getStatusIcon(post.status)}
//                             <span className="text-xs font-medium">
//                               {formatTime(new Date(post.scheduledAt))}
//                             </span>
//                           </div>
//                           <div className="flex space-x-0.5">
//                             {post.platforms.slice(0, 2).map(platformId => (
//                               <div key={platformId} className="flex items-center justify-center w-4 h-4">
//                                 {renderPlatformIcon(platformId, 10, "text-gray-600")}
//                               </div>
//                             ))}
//                             {post.platforms.length > 2 && (
//                               <span className="text-xs">+{post.platforms.length - 2}</span>
//                             )}
//                           </div>
//                         </div>
//                         <div className="truncate text-xs text-gray-600 mt-1">
//                           {post.content ? post.content.substring(0, 25) + '...' : 'No content'}
//                         </div>
//                       </div>
//                     ))}

//                     {dayPosts.length > 3 && (
//                       <div className="text-xs text-gray-500 text-center py-1">
//                         +{dayPosts.length - 3} more
//                       </div>
//                     )}

//                     {dayPosts.length === 0 && !isPast && (
//                       <button
//                         onClick={(e) => handleNewPostClick(date, '09:00', e)}
//                         className="w-full h-8 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors group"
//                       >
//                         <Plus size={14} className="text-gray-400 group-hover:text-blue-500" />
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Sidebar - Selected Day Details */}
//         {selectedDay && (
//           <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
//             <div className="mb-6">
//               <h4 className="font-semibold text-lg text-gray-900 mb-2">
//                 {formatDateForDisplay(selectedDay)}
//               </h4>
//               <div className="text-sm text-gray-500">
//                 {getPostsForDate(selectedDay).length} post{getPostsForDate(selectedDay).length !== 1 ? 's' : ''} scheduled
//               </div>
//             </div>

//             <div className="space-y-3">
//               {getPostsForDate(selectedDay).map(post => (
//                 <div
//                   key={post.id}
//                   className="bg-white rounded-lg p-4 border hover:shadow-md transition-shadow"
//                 >
//                   <div className="flex items-center justify-between mb-2">
//                     <div className="flex items-center space-x-2">
//                       {getStatusIcon(post.status)}
//                       <span className="text-sm font-medium">
//                         {formatTime(new Date(post.scheduledAt))}
//                       </span>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <div className="flex space-x-1">
//                         {post.platforms.map(platformId => (
//                           <div key={platformId} className="flex items-center justify-center w-5 h-5 bg-gray-100 rounded-full">
//                             {renderPlatformIcon(platformId, 12, "text-gray-600")}
//                           </div>
//                         ))}
//                       </div>
//                       <div className="flex items-center space-x-1">
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             onPostClick(post);
//                           }}
//                           className="p-1 hover:bg-gray-100 rounded transition-colors"
//                           title="View post"
//                         >
//                           <Edit3 size={14} className="text-gray-500" />
//                         </button>
//                         {(post.status === 'scheduled' || post.status === 'draft') && (
//                           <button
//                             onClick={(e) => handleSharePost(post, e)}
//                             className="p-1 hover:bg-blue-50 rounded transition-colors"
//                             title="Share with team"
//                           >
//                             <Share2 size={14} className="text-blue-500" />
//                           </button>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                   <p className="text-sm text-gray-900 line-clamp-2 mb-2">
//                     {post.content || 'No content'}
//                   </p>
//                   <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
//                     post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
//                     post.status === 'draft' ? 'bg-gray-100 text-gray-700' :
//                     post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//                   }`}>
//                     {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
//                   </div>
//                 </div>
//               ))}

//               {/* Add new post button */}
//               {!isPastDate(selectedDay) && (
//                 <button
//                   onClick={(e) => handleNewPostClick(selectedDay, '09:00', e)}
//                   className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
//                 >
//                   <div className="flex items-center justify-center space-x-2">
//                     <Plus size={16} className="text-gray-400 group-hover:text-blue-500" />
//                     <span className="text-sm text-gray-600 group-hover:text-blue-600">
//                       Add new post
//                     </span>
//                   </div>
//                 </button>
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Legend */}
//       <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
//         <div className="flex items-center justify-between text-xs">
//           <div className="flex items-center space-x-6">
//             <div className="flex items-center space-x-2">
//               <div className="w-3 h-3 bg-gray-100 rounded-full"></div>
//               <span className="text-gray-600">Draft</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
//               <span className="text-gray-600">Scheduled</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <div className="w-3 h-3 bg-green-100 rounded-full"></div>
//               <span className="text-gray-600">Published</span>
//             </div>
//           </div>
//           <div className="text-gray-500">
//             Total posts this month: {posts.filter(post => {
//               const postDate = new Date(post.scheduledAt);
//               return postDate.getMonth() === currentDate.getMonth() && 
//                      postDate.getFullYear() === currentDate.getFullYear();
//             }).length}
//           </div>
//         </div>
//       </div>

//       {/* Share Modal */}
//       {showShareModal && selectedPostForShare && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl">
//             {/* Modal Header */}
//             <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
//               <div className="flex justify-between items-center">
//                 <div className="flex items-center space-x-3">
//                   <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
//                     <Share2 size={20} />
//                   </div>
//                   <div>
//                     <h3 className="text-xl font-semibold">Share Post with Team</h3>
//                     <p className="text-blue-100">Collaborate on your scheduled content</p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={handleCloseShareModal}
//                   className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
//                 >
//                   <X size={20} />
//                 </button>
//               </div>
//             </div>

//             {/* Modal Content */}
//             <div className="p-6 space-y-6">
//               {/* Post Preview */}
//               <div className="bg-gray-50 rounded-lg p-4 border">
//                 <div className="flex items-center space-x-2 mb-3">
//                   {getStatusIcon(selectedPostForShare.status)}
//                   <span className="text-sm font-medium">
//                     {new Date(selectedPostForShare.scheduledAt).toLocaleDateString('en-US', {
//                       weekday: 'long',
//                       month: 'long',
//                       day: 'numeric',
//                       hour: '2-digit',
//                       minute: '2-digit'
//                     })}
//                   </span>
//                   <div className="flex space-x-1 ml-auto">
//                     {selectedPostForShare.platforms.map(platformId => (
//                       <div key={platformId} className="flex items-center justify-center w-5 h-5 bg-white rounded-full">
//                         {renderPlatformIcon(platformId, 12, "text-gray-600")}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//                 <p className="text-gray-900 mb-2">
//                   {selectedPostForShare.content || 'No content'}
//                 </p>
//                 <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
//                   selectedPostForShare.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
//                   selectedPostForShare.status === 'draft' ? 'bg-gray-100 text-gray-700' :
//                   'bg-green-100 text-green-700'
//                 }`}>
//                   {selectedPostForShare.status.charAt(0).toUpperCase() + selectedPostForShare.status.slice(1)}
//                 </span>
//               </div>

//               {/* Email Input */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   <Mail size={16} className="inline mr-2" />
//                   Team Member Emails
//                 </label>
//                 <input
//                   type="text"
//                   value={shareEmails}
//                   onChange={(e) => setShareEmails(e.target.value)}
//                   placeholder="Enter email addresses separated by commas (e.g., john@company.com, sarah@company.com)"
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//                 <p className="text-xs text-gray-500 mt-1">
//                   Separate multiple emails with commas
//                 </p>
//               </div>

//               {/* Message Input */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   <Users size={16} className="inline mr-2" />
//                   Message (Optional)
//                 </label>
//                 <textarea
//                   value={shareMessage}
//                   onChange={(e) => setShareMessage(e.target.value)}
//                   rows={6}
//                   placeholder="Add a custom message for your team..."
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
//                 />
//               </div>

//               {/* Action Buttons */}
//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   onClick={handleCloseShareModal}
//                   className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSendShare}
//                   disabled={!shareEmails.trim()}
//                   className={`px-6 py-2 rounded-lg font-medium transition-colors ${
//                     shareEmails.trim()
//                       ? 'bg-blue-600 text-white hover:bg-blue-700'
//                       : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                   }`}
//                 >
//                   <Share2 size={16} className="inline mr-2" />
//                   Share Post
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CalendarView;































































































// working code
// 'use client';

// import React, { useState } from 'react';
// import { ChevronLeft, ChevronRight, Calendar, Plus, Clock, Edit3, Send } from 'lucide-react';
// import { SocialPost, PLATFORMS, renderPlatformIcon } from '@/lib/types/post-publisher/social-media';

// interface CalendarViewProps {
//   posts: SocialPost[];
//   onDateSelect: (date: Date) => void;
//   onPostClick: (post: SocialPost) => void;
//   selectedDate?: Date;
//   onNewPost?: (date: Date, time: string) => void;
// }

// const CalendarView: React.FC<CalendarViewProps> = ({
//   posts,
//   onDateSelect,
//   onPostClick,
//   selectedDate,
//   onNewPost
// }) => {
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [selectedDay, setSelectedDay] = useState<Date | null>(null);

//   const getDaysInMonth = (date: Date) => {
//     return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
//   };

//   const getFirstDayOfMonth = (date: Date) => {
//     return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
//   };

//   const getPostsForDate = (date: Date) => {
//     return posts.filter(post => {
//       const postDate = new Date(post.scheduledAt);
//       return postDate.toDateString() === date.toDateString();
//     }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
//   };

//   const navigateMonth = (direction: 'prev' | 'next') => {
//     setCurrentDate(prev => {
//       const newDate = new Date(prev);
//       if (direction === 'prev') {
//         newDate.setMonth(prev.getMonth() - 1);
//       } else {
//         newDate.setMonth(prev.getMonth() + 1);
//       }
//       return newDate;
//     });
//   };

//   const isToday = (date: Date) => {
//     const today = new Date();
//     return date.toDateString() === today.toDateString();
//   };

//   const isSelected = (date: Date) => {
//     return selectedDay && date.toDateString() === selectedDay.toDateString();
//   };

//   const isPastDate = (date: Date) => {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     return date < today;
//   };

//   const monthNames = [
//     'January', 'February', 'March', 'April', 'May', 'June',
//     'July', 'August', 'September', 'October', 'November', 'December'
//   ];

//   const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

//   const daysInMonth = getDaysInMonth(currentDate);
//   const firstDay = getFirstDayOfMonth(currentDate);

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case 'draft': return <Edit3 size={12} className="text-gray-500" />;
//       case 'scheduled': return <Clock size={12} className="text-blue-500" />;
//       case 'published': return <Send size={12} className="text-green-500" />;
//       default: return <Clock size={12} className="text-gray-500" />;
//     }
//   };

//   const formatTime = (date: Date) => {
//     return date.toLocaleTimeString('en-US', { 
//       hour: 'numeric', 
//       minute: '2-digit',
//       hour12: true 
//     });
//   };

//   const formatDateForDisplay = (date: Date) => {
//     return date.toLocaleDateString('en-US', {
//       weekday: 'long',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   const handleDayClick = (date: Date) => {
//     setSelectedDay(date);
//     onDateSelect(date);
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
//       {/* Calendar Header */}
//       <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
//         <div className="flex justify-between items-center">
//           <div className="flex items-center space-x-3">
//             <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
//               <Calendar size={20} />
//             </div>
//             <div>
//               <h3 className="text-xl font-semibold">Content Calendar</h3>
//               <p className="text-blue-100">Plan and schedule your social media posts</p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={() => navigateMonth('prev')}
//               className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
//             >
//               <ChevronLeft size={20} />
//             </button>
//             <h4 className="font-semibold text-lg min-w-[180px] text-center">
//               {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
//             </h4>
//             <button
//               onClick={() => navigateMonth('next')}
//               className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
//             >
//               <ChevronRight size={20} />
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="flex">
//         {/* Calendar Grid */}
//         <div className="flex-1 p-6">
//           <div className="grid grid-cols-7 gap-1 mb-4">
//             {/* Day Headers */}
//             {dayNames.map(day => (
//               <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg">
//                 {day}
//               </div>
//             ))}
//           </div>

//           <div className="grid grid-cols-7 gap-1">
//             {/* Empty cells for days before month starts */}
//             {Array.from({ length: firstDay }, (_, index) => (
//               <div key={`empty-${index}`} className="h-32 bg-gray-50 rounded-lg"></div>
//             ))}

//             {/* Calendar Days */}
//             {Array.from({ length: daysInMonth }, (_, index) => {
//               const day = index + 1;
//               const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
//               const dayPosts = getPostsForDate(date);
//               const isCurrentDay = isToday(date);
//               const isSelectedDay = isSelected(date);
//               const isPast = isPastDate(date);

//               return (
//                 <div
//                   key={day}
//                   onClick={() => handleDayClick(date)}
//                   className={`h-32 p-2 rounded-lg cursor-pointer transition-all ${
//                     isCurrentDay 
//                       ? 'bg-blue-50 border-2 border-blue-300' 
//                       : isSelectedDay 
//                         ? 'bg-purple-50 border-2 border-purple-300' 
//                         : isPast 
//                           ? 'bg-gray-50 hover:bg-gray-100' 
//                           : 'bg-white hover:bg-gray-50 border border-gray-200'
//                   }`}
//                 >
//                   <div className={`text-sm font-semibold mb-1 ${
//                     isCurrentDay ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-900'
//                   }`}>
//                     {day}
//                   </div>

//                   {/* Posts for this day */}
//                   <div className="space-y-1">
//                     {dayPosts.slice(0, 3).map(post => (
//                       <div
//                         key={post.id}
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           onPostClick(post);
//                         }}
//                         className={`p-1 rounded text-xs cursor-pointer transition-colors ${
//                           post.status === 'scheduled' ? 'bg-blue-100 hover:bg-blue-200' :
//                           post.status === 'draft' ? 'bg-gray-100 hover:bg-gray-200' :
//                           post.status === 'published' ? 'bg-green-100 hover:bg-green-200' : 'bg-red-100 hover:bg-red-200'
//                         }`}
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center space-x-1">
//                             {getStatusIcon(post.status)}
//                             <span className="text-xs font-medium">
//                               {formatTime(new Date(post.scheduledAt))}
//                             </span>
//                           </div>
//                           <div className="flex space-x-0.5">
//                             {post.platforms.slice(0, 2).map(platformId => (
//                               <div key={platformId} className="flex items-center justify-center w-4 h-4">
//                                 {renderPlatformIcon(platformId, 10, "text-gray-600")}
//                               </div>
//                             ))}
//                             {post.platforms.length > 2 && (
//                               <span className="text-xs">+{post.platforms.length - 2}</span>
//                             )}
//                           </div>
//                         </div>
//                         <div className="truncate text-xs text-gray-600 mt-1">
//                           {post.content ? post.content.substring(0, 25) + '...' : 'No content'}
//                         </div>
//                       </div>
//                     ))}

//                     {dayPosts.length > 3 && (
//                       <div className="text-xs text-gray-500 text-center py-1">
//                         +{dayPosts.length - 3} more
//                       </div>
//                     )}

//                     {dayPosts.length === 0 && !isPast && (
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           onNewPost?.(date, '09:00');
//                         }}
//                         className="w-full h-8 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors group"
//                       >
//                         <Plus size={14} className="text-gray-400 group-hover:text-blue-500" />
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Sidebar - Selected Day Details */}
//         {selectedDay && (
//           <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
//             <div className="mb-6">
//               <h4 className="font-semibold text-lg text-gray-900 mb-2">
//                 {formatDateForDisplay(selectedDay)}
//               </h4>
//               <div className="text-sm text-gray-500">
//                 {getPostsForDate(selectedDay).length} post{getPostsForDate(selectedDay).length !== 1 ? 's' : ''} scheduled
//               </div>
//             </div>

//             <div className="space-y-3">
//               {getPostsForDate(selectedDay).map(post => (
//                 <div
//                   key={post.id}
//                   onClick={() => onPostClick(post)}
//                   className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow border"
//                 >
//                   <div className="flex items-center justify-between mb-2">
//                     <div className="flex items-center space-x-2">
//                       {getStatusIcon(post.status)}
//                       <span className="text-sm font-medium">
//                         {formatTime(new Date(post.scheduledAt))}
//                       </span>
//                     </div>
//                     <div className="flex space-x-1">
//                       {post.platforms.map(platformId => (
//                         <div key={platformId} className="flex items-center justify-center w-5 h-5 bg-gray-100 rounded-full">
//                           {renderPlatformIcon(platformId, 12, "text-gray-600")}
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                   <p className="text-sm text-gray-900 line-clamp-2">
//                     {post.content || 'No content'}
//                   </p>
//                   <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
//                     post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
//                     post.status === 'draft' ? 'bg-gray-100 text-gray-700' :
//                     post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//                   }`}>
//                     {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
//                   </div>
//                 </div>
//               ))}

//               {/* Add new post button */}
//               {!isPastDate(selectedDay) && (
//                 <button
//                   onClick={() => onNewPost?.(selectedDay, '09:00')}
//                   className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
//                 >
//                   <div className="flex items-center justify-center space-x-2">
//                     <Plus size={16} className="text-gray-400 group-hover:text-blue-500" />
//                     <span className="text-sm text-gray-600 group-hover:text-blue-600">
//                       Add new post
//                     </span>
//                   </div>
//                 </button>
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Legend */}
//       <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
//         <div className="flex items-center justify-between text-xs">
//           <div className="flex items-center space-x-6">
//             <div className="flex items-center space-x-2">
//               <div className="w-3 h-3 bg-gray-100 rounded-full"></div>
//               <span className="text-gray-600">Draft</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
//               <span className="text-gray-600">Scheduled</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <div className="w-3 h-3 bg-green-100 rounded-full"></div>
//               <span className="text-gray-600">Published</span>
//             </div>
//           </div>
//           <div className="text-gray-500">
//             Total posts this month: {posts.filter(post => {
//               const postDate = new Date(post.scheduledAt);
//               return postDate.getMonth() === currentDate.getMonth() && 
//                      postDate.getFullYear() === currentDate.getFullYear();
//             }).length}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CalendarView;



































































