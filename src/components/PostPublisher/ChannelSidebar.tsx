'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Settings, Grid3X3, Users } from 'lucide-react';
import { SocialAccount, PLATFORMS } from '@/lib/types/post-publisher/social-media';

interface ChannelSidebarProps {
  connectedAccounts: SocialAccount[];
  selectedChannel: string;
  onChannelSelect: (channel: string) => void;
  onConnectAccount: () => void;
  posts: any[];
}

const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  connectedAccounts,
  selectedChannel,
  onChannelSelect,
  onConnectAccount,
  posts
}) => {
  const [showMoreChannels, setShowMoreChannels] = useState(false);

  // Helper function to render platform icon
  const renderPlatformIcon = (platformId: string, size: number = 16, className: string = "") => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform) return null;
    
    const IconComponent = platform.icon;
    // return <IconComponent size={size} className={className} />;
  };

  const getChannelPosts = (channel: string) => {
    if (channel === 'all') return posts;
    return posts.filter(post => post.platforms.includes(channel));
  };

  const getPlatformConfig = (platformId: string) => {
    return PLATFORMS.find(p => p.id === platformId);
  };

  const getConnectedPlatforms = () => {
    return connectedAccounts.filter(acc => acc.connected);
  };

  const getDisconnectedPlatforms = () => {
    return PLATFORMS.filter(platform => 
      !connectedAccounts.some(acc => acc.platform === platform.id && acc.connected)
    );
  };

  const allChannelCount = posts.length;

  return (
    <div className="w-64 bg-white border-l border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center space-x-2">
            <Grid3X3 size={20} className="text-blue-600" />
            <span>Channels</span>
          </h2>
          <button
            onClick={onConnectAccount}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Connect Account"
          >
            <Plus size={16} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {/* All Channels */}
          <button
            onClick={() => onChannelSelect('all')}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
              selectedChannel === 'all'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Users size={16} className="text-white" />
              </div>
              <span className="font-medium">All Channels</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              selectedChannel === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {allChannelCount}
            </span>
          </button>

          {/* Connected Platforms */}
          {getConnectedPlatforms().map(account => {
            const platform = getPlatformConfig(account.platform);
            const channelPosts = getChannelPosts(account.platform);
            
            if (!platform) return null;

            return (
              <button
                key={account.id}
                onClick={() => onChannelSelect(account.platform)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  selectedChannel === account.platform
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${platform.color} rounded-lg flex items-center justify-center`}>
                    {renderPlatformIcon(platform.id, 16, "text-white")}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{platform.name}</div>
                    <div className="text-xs text-gray-500">{account.username}</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedChannel === account.platform ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {channelPosts.length}
                </span>
              </button>
            );
          })}

          {/* Show More Channels Toggle */}
          {getDisconnectedPlatforms().length > 0 && (
            <button
              onClick={() => setShowMoreChannels(!showMoreChannels)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {showMoreChannels ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                <span className="text-sm">Show more channels</span>
              </div>
            </button>
          )}

          {/* Additional Channels (when expanded) */}
          {showMoreChannels && (
            <div className="ml-4 space-y-1">
              {getDisconnectedPlatforms().map(platform => (
                <button
                  key={platform.id}
                  onClick={onConnectAccount}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${platform.color} opacity-50 rounded-lg flex items-center justify-center`}>
                      {renderPlatformIcon(platform.id, 16, "text-white")}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{platform.name}</div>
                      <div className="text-xs text-gray-400">Not connected</div>
                    </div>
                  </div>
                  <Plus size={14} className="text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Connected:</span>
            <span className="font-medium">{getConnectedPlatforms().length}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Posts:</span>
            <span className="font-medium">{posts.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelSidebar;