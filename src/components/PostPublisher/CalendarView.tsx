'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, Clock, Edit3, Send } from 'lucide-react';
import { SocialPost, PLATFORMS, renderPlatformIcon } from '@/lib/types/post-publisher/social-media';

interface CalendarViewProps {
  posts: SocialPost[];
  onDateSelect: (date: Date) => void;
  onPostClick: (post: SocialPost) => void;
  selectedDate?: Date;
  onNewPost?: (date: Date, time: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  posts,
  onDateSelect,
  onPostClick,
  selectedDate,
  onNewPost
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

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

  const handleDayClick = (date: Date) => {
    setSelectedDay(date);
    onDateSelect(date);
  };

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
                        onClick={(e) => {
                          e.stopPropagation();
                          onNewPost?.(date, '09:00');
                        }}
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
                  onClick={() => onPostClick(post)}
                  className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(post.status)}
                      <span className="text-sm font-medium">
                        {formatTime(new Date(post.scheduledAt))}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      {post.platforms.map(platformId => (
                        <div key={platformId} className="flex items-center justify-center w-5 h-5 bg-gray-100 rounded-full">
                          {renderPlatformIcon(platformId, 12, "text-gray-600")}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-900 line-clamp-2">
                    {post.content || 'No content'}
                  </p>
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
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
                  onClick={() => onNewPost?.(selectedDay, '09:00')}
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
    </div>
  );
};

export default CalendarView;



































































// 'use client';

// import React, { useState } from 'react';
// import { ChevronLeft, ChevronRight, Calendar, Plus, Clock, Edit3, Send } from 'lucide-react';
// import { SocialPost, PLATFORMS } from '@/lib/types/post-publisher/social-media';

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

//   const getPlatformIcon = (platformId: string) => {
//     const platform = PLATFORMS.find(p => p.id === platformId);
//     return platform ? platform.icon : '📱';
//   };

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
//                               <span key={platformId} className="text-xs">
//                                 {getPlatformIcon(platformId)}
//                               </span>
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
//                         <span key={platformId} className="text-sm">
//                           {getPlatformIcon(platformId)}
//                         </span>
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