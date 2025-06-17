"use client";
import React, { useState } from "react";
import { LockKeyhole, Key, MoreVertical } from "lucide-react";

interface SecurityCardProps {
  twoFactorEnabled?: boolean;
}

export const SecurityCard: React.FC<SecurityCardProps> = ({
  twoFactorEnabled: initialTwoFactorEnabled = true
}) => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialTwoFactorEnabled);

  const handleToggleTwoFactor = () => {
    setTwoFactorEnabled(prev => !prev);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-900 font-medium">Security</h3>
        <button className="text-gray-600 hover:text-gray-900">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center mr-3">
              <LockKeyhole className="w-4 h-4 text-gray-700" />
            </div>
            <span className="text-sm text-gray-800">2FA enabled</span>
          </div>
          
          <div
            onClick={handleToggleTwoFactor}
            className={`w-10 h-5 rounded-full cursor-pointer flex items-center ${twoFactorEnabled ? "bg-blue-600" : "bg-gray-300"}`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow-sm transform duration-300 ease-in-out ${
                twoFactorEnabled ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center mr-3">
              <Key className="w-4 h-4 text-gray-700" />
            </div>
            <span className="text-sm text-gray-800">Key</span>
          </div>
          
          <button className="text-xs text-gray-600 border border-gray-300 rounded px-3 py-1 hover:bg-gray-100">
            change
          </button>
        </div>
      </div>
    </div>
  );
};