import { WhatsAppClientStatus } from '@/lib/types/whatsapp';
import React from 'react';

interface WhatsAppStatusProps {
  status: WhatsAppClientStatus;
}

const WhatsAppStatus: React.FC<WhatsAppStatusProps> = ({ status }) => {
  // Define status colors and labels
  const getStatusColor = (): string => {
    switch (status) {
      case WhatsAppClientStatus.CONNECTED:
        return 'bg-green-500';
      case WhatsAppClientStatus.AUTHENTICATED:
        return 'bg-blue-500';
      case WhatsAppClientStatus.QR_READY:
        return 'bg-yellow-500';
      case WhatsAppClientStatus.INITIALIZING:
        return 'bg-blue-300';
      case WhatsAppClientStatus.AUTH_FAILURE:
        return 'bg-red-500';
      case WhatsAppClientStatus.DISCONNECTED:
        return 'bg-gray-500';
      case WhatsAppClientStatus.NOT_INITIALIZED:
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusLabel = (): string => {
    switch (status) {
      case WhatsAppClientStatus.CONNECTED:
        return 'Connected';
      case WhatsAppClientStatus.AUTHENTICATED:
        return 'Authenticated';
      case WhatsAppClientStatus.QR_READY:
        return 'QR Code Ready';
      case WhatsAppClientStatus.INITIALIZING:
        return 'Initializing';
      case WhatsAppClientStatus.AUTH_FAILURE:
        return 'Authentication Failed';
      case WhatsAppClientStatus.DISCONNECTED:
        return 'Disconnected';
      case WhatsAppClientStatus.ALREADY_CONNECTED:
        return 'Already Connected';
      case WhatsAppClientStatus.NOT_INITIALIZED:
      default:
        return 'Not Connected';
    }
  };

  return (
    <div className="flex items-center">
      <div className={`h-2.5 w-2.5 rounded-full mr-2 ${getStatusColor()}`}></div>
      <span className="text-sm text-gray-500">{getStatusLabel()}</span>
    </div>
  );
};

export default WhatsAppStatus;