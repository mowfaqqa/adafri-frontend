/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import QRCode from "react-qr-code";
import { WhatsAppClientStatus } from "../../lib/types/whatsapp";
import WhatsAppStatus from "./WhatsAppStatus";

interface ConnectWhatsAppProps {
  status: WhatsAppClientStatus;
  qrCode?: any;
  onInitialize: () => void;
  isInitializing: boolean;
}

const ConnectWhatsApp: React.FC<ConnectWhatsAppProps> = ({
  status,
  qrCode,
  onInitialize,
  isInitializing,
}) => {
  // Helper to display the right message based on status
  const getInstructions = () => {
    switch (status) {
      case WhatsAppClientStatus.NOT_INITIALIZED:
        return "Connect your WhatsApp account to get started";
      case WhatsAppClientStatus.INITIALIZING:
        return "Initializing WhatsApp client... Please wait";
      case WhatsAppClientStatus.QR_READY:
        return "Scan the QR code with your WhatsApp mobile app";
      case WhatsAppClientStatus.AUTHENTICATED:
        return "Authenticated! Initializing connection...";
      case WhatsAppClientStatus.AUTH_FAILURE:
        return "Authentication failed. Please try again.";
      default:
        return "Please follow the instructions below";
    }
  };

  return (
    <div className="max-w-md w-full p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-3">
        Connect WhatsApp
      </h2>

      <div className="mb-4 flex justify-center">
        <WhatsAppStatus status={status} />
      </div>

      <div className="mb-6 text-center text-gray-600">{getInstructions()}</div>

      {status === WhatsAppClientStatus.QR_READY && qrCode! ? (
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white border border-gray-200 rounded-md">
            {qrCode.startsWith("data:image") ? (
              // If it's already a data URL (base64 image)
              <img src={qrCode} alt="QR Code" width={200} height={200} />
            ) : (
              // If it's just the QR data as a string, try rendering it with react-qr-code
              // but limit the size
              <QRCode
                value={
                  qrCode?.length > 10000 ? qrCode.substring(0, 10000) : qrCode
                }
                size={200}
                level="L" // Use lowest error correction level to fit more data
              />
            )}
          </div>
        </div>
      ) : status === WhatsAppClientStatus.INITIALIZING ||
        status === WhatsAppClientStatus.AUTHENTICATED ? (
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : null}

      {status === WhatsAppClientStatus.NOT_INITIALIZED ? (
        <button
          onClick={onInitialize}
          disabled={isInitializing}
          className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isInitializing ? "Connecting..." : "Connect WhatsApp"}
        </button>
      ) : status === WhatsAppClientStatus.AUTH_FAILURE ? (
        <button
          onClick={onInitialize}
          disabled={isInitializing}
          className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isInitializing ? "Retrying..." : "Try Again"}
        </button>
      ) : null}

      <div className="mt-6 text-sm text-gray-500">
        <p className="font-medium mb-2">Instructions:</p>
        <ol className="list-decimal text-left pl-6 space-y-1">
          <li>Open WhatsApp on your phone</li>
          <li>Tap Menu or Settings and select WhatsApp Web</li>
          <li>Point your phone camera to this screen to scan the QR code</li>
          <li>
            Keep your phone connected to the internet while using WhatsApp Web
          </li>
        </ol>
      </div>
    </div>
  );
};

export default ConnectWhatsApp;
