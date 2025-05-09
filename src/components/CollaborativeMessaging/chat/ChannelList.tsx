"use client";

import React, { useEffect } from "react";
import { Hash, Lock, Plus } from "lucide-react";
import useChannelStore from "@/lib/store/messaging/channelStore";
import useModalStore from "@/lib/store/messaging/modalStore";
import Badge from "@/components/custom-ui/badge";

const ChannelList = () => {
  const { channels, fetchChannels, selectChannel, selectedChannelId } =
    useChannelStore();
  const { openModal } = useModalStore();

  // Fetch channels on component mount
  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Handle channel creation
  const handleCreateChannel = () => {
    openModal("createChannel");
  };

  // Handle channel selection
  const handleSelectChannel = (channelId: string) => {
    selectChannel(channelId);
  };

  // Group channels by public and private
  const publicChannels = channels.filter((channel) => !channel.isPrivate);
  const privateChannels = channels.filter((channel) => channel.isPrivate);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-gray-400 text-sm">CHANNELS</h2>
        <button
          onClick={handleCreateChannel}
          className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-md hover:bg-gray-100"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="space-y-1">
        {/* Public Channels */}
        {publicChannels.map((channel) => (
          <div
            key={channel.id}
            onClick={() => handleSelectChannel(channel.id)}
            className={`
              flex justify-between items-center p-2 cursor-pointer rounded
              ${
                selectedChannelId === channel.id
                  ? "bg-emerald-200"
                  : "hover:bg-gray-100"
              }
            `}
          >
            <div className="flex items-center space-x-2 truncate">
              <Hash size={18} className="text-gray-500 shrink-0" />
              <span className="truncate">{channel.name}</span>
            </div>

            {channel.unreadCount && channel.unreadCount > 0 && (
              <Badge variant="primary" rounded size="sm">
                {channel.unreadCount}
              </Badge>
            )}
          </div>
        ))}

        {/* Private Channels */}
        {privateChannels.length > 0 && (
          <>
            <div className="mt-4 mb-2">
              <h3 className="text-gray-400 text-xs">PRIVATE CHANNELS</h3>
            </div>

            {privateChannels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => handleSelectChannel(channel.id)}
                className={`
                  flex justify-between items-center p-2 cursor-pointer rounded
                  ${
                    selectedChannelId === channel.id
                      ? "bg-emerald-200"
                      : "hover:bg-gray-100"
                  }
                `}
              >
                <div className="flex items-center space-x-2 truncate">
                  <Lock size={18} className="text-gray-500 shrink-0" />
                  <span className="truncate">{channel.name}</span>
                </div>

                {channel.unreadCount && channel.unreadCount > 0 && (
                  <Badge variant="primary" rounded size="sm">
                    {channel.unreadCount}
                  </Badge>
                )}
              </div>
            ))}
          </>
        )}

        {/* Empty state */}
        {channels.length === 0 && (
          <div className="py-4 text-center">
            <p className="text-sm text-gray-500">No channels yet</p>
            <button
              onClick={handleCreateChannel}
              className="mt-2 text-sm text-emerald-600 hover:underline"
            >
              Create your first channel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelList;
