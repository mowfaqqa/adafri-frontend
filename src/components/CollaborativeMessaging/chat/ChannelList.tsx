import React, { useEffect } from "react";
import { Hash, Lock, Plus } from "lucide-react";
import useChannelStore from "@/lib/store/messaging/channelStore";
import useModalStore from "@/lib/store/messaging/modalStore";
import useWorkspaceStore from "@/lib/store/messaging/workspaceStore";
import Badge from "@/components/custom-ui/badge";

interface ChannelListProps {
  workspaceId?: string | null;
}

const ChannelList: React.FC<ChannelListProps> = ({ workspaceId }) => {
  const {
    channelsByWorkspace,
    selectedChannelId,
    fetchChannels,
    selectChannel,
  } = useChannelStore();

  const { selectedWorkspaceId } = useWorkspaceStore();
  const { openModal } = useModalStore();

  // Determine which workspace ID to use
  const effectiveWorkspaceId = workspaceId || selectedWorkspaceId;

  // Fetch channels - use workspace-aware fetch if workspaceId is provided
  useEffect(() => {
    if (effectiveWorkspaceId) {
      // Use the workspace-aware fetch
      if (typeof fetchChannels === "function" && fetchChannels.length === 1) {
        fetchChannels(effectiveWorkspaceId);
      }
    } else {
      // Fallback to legacy fetch without parameters
      if (typeof fetchChannels === "function" && fetchChannels.length === 0) {
        fetchChannels(selectedWorkspaceId!);
      }
    }
  }, [effectiveWorkspaceId, fetchChannels, selectedWorkspaceId]);

  // Handle channel creation
  const handleCreateChannel = () => {
    if (effectiveWorkspaceId) {
      openModal("createChannel", { workspaceId: effectiveWorkspaceId });
    } else {
      openModal("createChannel");
    }
  };

  // Handle channel selection
  const handleSelectChannel = (channelId: string) => {
    if (
      effectiveWorkspaceId &&
      typeof selectChannel === "function" &&
      selectChannel.length === 2
    ) {
      // Use the workspace-aware select
      selectChannel(effectiveWorkspaceId, channelId);
    } else if (
      typeof selectChannel === "function" &&
      selectChannel.length === 1
    ) {
      // Fallback to legacy select
      selectChannel(selectedWorkspaceId!, channelId);
    }
  };

  // Determine which channels to display
  const displayChannels = effectiveWorkspaceId
    ? channelsByWorkspace?.[effectiveWorkspaceId] || []
    : [];

  // Group channels by public and private
  const publicChannels = displayChannels.filter(
    (channel: any) => !channel.isPrivate
  );
  const privateChannels = displayChannels.filter(
    (channel: any) => channel.isPrivate
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-gray-500 font-semibold text-sm">CHANNELS</h2>
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
              flex justify-between items-center p-2 cursor-pointer rounded text-gray-600 group
              ${
                selectedChannelId === channel.id
                  ? "bg-blue-500 text-white"
                  : "hover:bg-blue-600 hover:text-white"
              }
            `}
          >
            <div className="flex items-center space-x-2 truncate">
              <Hash size={18} className="text-white group-hover:text-white shrink-0" />
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
                      ? "bg-blue-500 text-white"
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
        {displayChannels.length === 0 && (
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
