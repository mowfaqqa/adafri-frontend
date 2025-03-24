import React from "react";
import {
  WhatsAppClientStatus,
  WhatsAppProfile,
} from "../../lib/types/whatsapp";
import WhatsAppStatus from "./WhatsAppStatus";
import { User, LogOut } from "lucide-react";

interface ProfilePanelProps {
  profile?: WhatsAppProfile;
  isLoading?: boolean;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

const ProfilePanel: React.FC<ProfilePanelProps> = ({
  profile,
  isLoading = false,
  onLogout,
  isLoggingOut = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="bg-gray-200 h-16 w-16 rounded-full mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">
          <p>Profile not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex flex-col items-center">
        {profile.profilePicture ? (
          <img
            src={profile.profilePicture}
            alt={profile.name}
            className="h-20 w-20 rounded-full mb-3 object-cover border"
          />
        ) : (
          <div className="bg-gray-200 h-20 w-20 rounded-full mb-3 flex items-center justify-center">
            <User className="h-10 w-10 text-gray-400" />
          </div>
        )}

        <h3 className="font-bold text-lg mb-1">{profile.name}</h3>

        <div className="mb-3">
          <WhatsAppStatus
            status={
              profile.connected
                ? WhatsAppClientStatus.CONNECTED
                : WhatsAppClientStatus.DISCONNECTED
            }
          />
        </div>

        {profile.number && (
          <div className="text-sm text-gray-600 mb-1">{profile.number}</div>
        )}

        {profile.about && (
          <div className="text-sm text-gray-600 mb-3 text-center max-w-xs">
            {profile.about}
          </div>
        )}

        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className="mt-2 flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoggingOut ? "Disconnecting..." : "Disconnect WhatsApp"}
        </button>
      </div>
    </div>
  );
};

export default ProfilePanel;
