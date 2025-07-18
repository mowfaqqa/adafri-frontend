// 'use client';

// import React from 'react';
// import { X, Plus, Check, AlertCircle } from 'lucide-react';
// import { SocialAccount, PLATFORMS } from '@/./lib/types/post-publisher/social-media';

// interface SocialAccountConnectProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onConnect: (platform: string) => void;
//   connectedAccounts: SocialAccount[];
// }

// const SocialAccountConnect: React.FC<SocialAccountConnectProps> = ({
//   isOpen,
//   onClose,
//   onConnect,
//   connectedAccounts
// }) => {
//   if (!isOpen) return null;

//   const isConnected = (platformId: string) => 
//     connectedAccounts.some(acc => acc.platform === platformId && acc.connected);

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-xl font-semibold">Connect Social Media</h2>
//           <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
//             <X size={24} />
//           </button>
//         </div>

//         <div className="space-y-3">
//           {PLATFORMS.map(platform => (
//             <div
//               key={platform.id}
//               className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
//             >
//               <div className="flex items-center space-x-3">
//                 <div className={w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center text-white}>
//                   {platform.icon}
//                 </div>
//                 <span className="font-medium">{platform.name}</span>
//               </div>

//               {isConnected(platform.id) ? (
//                 <div className="flex items-center text-green-600">
//                   <Check size={16} className="mr-1" />
//                   Connected
//                 </div>
//               ) : (
//                 <button
//                   onClick={() => onConnect(platform.id)}
//                   className="flex items-center text-blue-600 hover:text-blue-800"
//                 >
//                   <Plus size={16} className="mr-1" />
//                   Connect
//                 </button>
//               )}
//             </div>
//           ))}
//         </div>

//         <div className="mt-6 p-4 bg-blue-50 rounded-lg">
//           <div className="flex items-start space-x-2">
//             <AlertCircle className="text-blue-600 mt-0.5" size={16} />
//             <div className="text-sm text-blue-800">
//               <p className="font-medium">OAuth Integration</p>
//               <p>Connecting accounts will redirect you to authenticate with each platform.</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SocialAccountConnect;



















































































'use client';

import React, { useState } from 'react';
import { X, Plus, Check, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { SocialAccount, PLATFORMS } from '@/lib/types/post-publisher/social-media';

interface ConnectedAccountData {
  id: string;
  platform: string;
  username: string;
  profilePicture?: string;
  connectedAt: Date;
}

interface SocialAccountConnectProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (platform: string) => void;
  connectedAccounts: SocialAccount[];
  onAccountConnected?: (account: ConnectedAccountData) => void;
  onAccountDisconnected?: (platformId: string) => void;
}

const SocialAccountConnect: React.FC<SocialAccountConnectProps> = ({
  isOpen,
  onClose,
  onConnect,
  connectedAccounts,
  onAccountConnected,
  onAccountDisconnected
}) => {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectedAccountsData, setConnectedAccountsData] = useState<ConnectedAccountData[]>([
    // Mock data - replace with actual API calls
    {
      id: '1',
      platform: 'facebook',
      username: 'djombi_official',
      profilePicture: 'https://via.placeholder.com/48',
      connectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      platform: 'instagram',
      username: 'djombi_app',
      profilePicture: 'https://via.placeholder.com/48',
      connectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  ]);

  // Helper function to render platform icon
  const renderPlatformIcon = (platformId: string, size: number = 16, className: string = "") => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform) return null;
    
    const IconComponent = platform.icon;
    return <IconComponent size={size} className={className} />;
  };

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    
    // Simulate API call - replace with actual API call to your backend
    try {
      // Your backend API call would go here
      // const response = await fetch(`/api/auth/${platformId}`);
      
      // Mock success after 2 seconds
      setTimeout(() => {
        const newAccount: ConnectedAccountData = {
          id: Date.now().toString(),
          platform: platformId,
          username: `user_${platformId}`,
          profilePicture: 'https://via.placeholder.com/48',
          connectedAt: new Date()
        };
        
        setConnectedAccountsData(prev => [...prev, newAccount]);
        if (onAccountConnected) {
          onAccountConnected(newAccount);
        }
        onConnect(platformId);
        setConnecting(null);
      }, 2000);
      
    } catch (error) {
      console.error('Error connecting to platform:', error);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    try {
      // Your backend API call would go here
      // const response = await fetch(`/api/social-accounts/${platformId}`, { method: 'DELETE' });
      
      setConnectedAccountsData(prev => 
        prev.filter(acc => acc.platform !== platformId)
      );
      if (onAccountDisconnected) {
        onAccountDisconnected(platformId);
      }
      
    } catch (error) {
      console.error('Error disconnecting account:', error);
    }
  };

  const isConnected = (platformId: string) => 
    connectedAccountsData.some(acc => acc.platform === platformId);

  const getConnectedAccount = (platformId: string) =>
    connectedAccountsData.find(acc => acc.platform === platformId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Connect Social Media</h2>
            <p className="text-gray-600 mt-1">Manage your social media connections</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Available Platforms Grid */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Available Platforms</h3>
            <div className="grid grid-cols-3 gap-6">
              {PLATFORMS.map(platform => {
                const connected = isConnected(platform.id);
                const account = getConnectedAccount(platform.id);
                
                return (
                  <div
                    key={platform.id}
                    className={`relative p-8 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                      connected 
                        ? 'border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {/* Platform Icon and Name */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className={`w-20 h-20 ${platform.color} rounded-3xl flex items-center justify-center text-white shadow-lg transform transition-transform hover:scale-110`}>
                        {renderPlatformIcon(platform.id, 36, "text-white")}
                      </div>
                      <div className="text-center">
                        <h4 className="font-bold text-gray-900 text-lg">{platform.name}</h4>
                        {connected && account && (
                          <p className="text-sm text-gray-600 mt-1 font-medium">@{account.username}</p>
                        )}
                      </div>
                    </div>

                    {/* Connection Status */}
                    <div className="mt-6 flex justify-center">
                      {connected ? (
                        <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
                          <Check size={18} />
                          <span className="text-sm font-semibold">Connected</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConnect(platform.id)}
                          disabled={connecting === platform.id}
                          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                        >
                          {connecting === platform.id ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : (
                            <Plus size={18} />
                          )}
                          <span className="text-sm font-semibold">
                            {connecting === platform.id ? 'Connecting...' : 'Connect'}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Disconnect Button for Connected Accounts */}
                    {connected && (
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() => handleDisconnect(platform.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                          title="Disconnect account"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connected Accounts List */}
          {connectedAccountsData.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Accounts</h3>
              <div className="space-y-3">
                {connectedAccountsData.map(account => {
                  const platform = PLATFORMS.find(p => p.id === account.platform);
                  if (!platform) return null;

                  return (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {/* Profile Picture */}
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm">
                          {account.profilePicture ? (
                            <img
                              src={account.profilePicture}
                              alt={`${account.username} profile`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className={`w-full h-full ${platform.color} flex items-center justify-center`}>
                              {renderPlatformIcon(platform.id, 20, "text-white")}
                            </div>
                          )}
                        </div>
                        
                        {/* Account Info */}
                        <div>
                          <h4 className="font-semibold text-gray-900">@{account.username}</h4>
                          <p className="text-sm text-gray-600">{platform.name}</p>
                          <p className="text-xs text-gray-500">
                            Connected {new Date(account.connectedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                          <Check size={16} />
                          <span className="text-sm font-medium">Active</span>
                        </div>
                        <button
                          onClick={() => handleDisconnect(account.platform)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                          title="Disconnect account"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* OAuth Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">OAuth Integration</p>
                <p className="mb-3">
                  Connecting accounts will redirect you to authenticate with each platform securely.
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Your credentials are never stored on our servers</li>
                  <li>We only store access tokens to publish on your behalf</li>
                  <li>You can disconnect any account at any time</li>
                  <li>Tokens are automatically refreshed when needed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialAccountConnect;