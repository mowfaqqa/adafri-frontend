import React, { useState } from 'react';
import { InviteTeamService, InviteRequest } from '@/lib/api/messaging/InviteTeamService';
import { Mail, Users, Share2, Clock, Plus, X, Trash2, Copy, Check, Send, RefreshCw, UserPlus, Link } from 'lucide-react';
import { PendingInvitationsModal } from '../CollaborativeMessaging/workspace/PendingInvitationsModal';

interface InviteTeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

type InviteType = 'teammate' | 'temporary';
type TemporaryDuration = '1week' | '2weeks' | '1month';

export const InviteTeamMembersModal: React.FC<InviteTeamMembersModalProps> = ({ 
  isOpen, 
  onClose,
  workspaceId
}) => {
  const [activeTab, setActiveTab] = useState<'invite' | 'share' | 'pending'>('invite');
  const [emails, setEmails] = useState<string[]>(['']);
  const [shareEmails, setShareEmails] = useState<string[]>(['']);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'member'>('member');
  const [inviteType, setInviteType] = useState<InviteType>('teammate');
  const [temporaryDuration, setTemporaryDuration] = useState<TemporaryDuration>('1week');
  const [inviteSent, setInviteSent] = useState(false);
  const [shareSent, setShareSent] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);

  const handleCloseModal = () => {
    setEmails(['']);
    setShareEmails(['']);
    setInviteSent(false);
    setShareSent(false);
    setLinkCopied(false);
    setError(null);
    setActiveTab('invite');
    setInviteType('teammate');
    setTemporaryDuration('1week');
    onClose();
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleShareEmailChange = (index: number, value: string) => {
    const newEmails = [...shareEmails];
    newEmails[index] = value;
    setShareEmails(newEmails);
  };

  const addEmailField = () => {
    setEmails([...emails, '']);
  };

  const addShareEmailField = () => {
    setShareEmails([...shareEmails, '']);
  };

  const removeEmailField = (index: number) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index);
      setEmails(newEmails);
    }
  };

  const removeShareEmailField = (index: number) => {
    if (shareEmails.length > 1) {
      const newEmails = shareEmails.filter((_, i) => i !== index);
      setShareEmails(newEmails);
    }
  };

  const getDurationLabel = (duration: TemporaryDuration): string => {
    switch (duration) {
      case '1week': return '1 Week';
      case '2weeks': return '2 Weeks';
      case '1month': return '1 Month';
      default: return '1 Week';
    }
  };

  const handleSendInvites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const validEmails = emails.filter(email => email.trim() !== '');
      if (validEmails.length === 0) {
        setError('Please enter at least one valid email address');
        return;
      }

      const invites: InviteRequest[] = validEmails.map(email => ({
        email: email.trim(),
        role: selectedRole,
        inviteType,
        temporaryDuration: inviteType === 'temporary' ? temporaryDuration : undefined
      }));

      await InviteTeamService.sendMultipleInvitations(workspaceId, invites);
      
      setInviteSent(true);
      setTimeout(() => {
        setInviteSent(false);
        handleCloseModal();
      }, 3000);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to send invitations. Please try again.';
      setError(errorMessage);
      console.error('Error sending invites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendShareLinks = () => {
    console.log('Sending share links to:', shareEmails.filter(email => email.trim() !== ''));
    setShareSent(true);
    setTimeout(() => {
      setShareSent(false);
      handleCloseModal();
    }, 3000);
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText('https://adafri-frontend.vercel.app/');
    setLinkCopied(true);
    setTimeout(() => {
      setLinkCopied(false);
    }, 3000);
  };

  const handlePendingTabClick = () => {
    setShowPendingModal(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6 text-white">
            <button 
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition-all duration-200"
              onClick={handleCloseModal}
            >
              <X size={20} />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Users size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Team Invitations</h2>
                <p className="text-white/80">Invite members to collaborate</p>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
            {/* Error display */}
            {error && (
              <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
                <X size={16} className="text-red-500" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Tabs */}
            <div className="px-6 pt-6">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
                <button 
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                    activeTab === 'invite' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('invite')}
                >
                  <Mail size={16} />
                  <span>Invite</span>
                </button>
                <button 
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                    activeTab === 'share' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('share')}
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </button>
                <button 
                  className="flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  onClick={handlePendingTabClick}
                >
                  <Clock size={16} />
                  <span>Pending</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Invite Tab */}
              {activeTab === 'invite' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Mail size={24} className="text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Invite by Email</h3>
                    <p className="text-gray-600">Send invitation emails to team members</p>
                  </div>

                  {/* Invite Type Selection */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Invitation Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setInviteType('teammate')}
                        className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                          inviteType === 'teammate'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <UserPlus size={16} />
                          <span className="font-medium">Team mate</span>
                        </div>
                        <div className="text-xs opacity-70">Permanent team member access</div>
                      </button>
                      <button
                        onClick={() => setInviteType('temporary')}
                        className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                          inviteType === 'temporary'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <Link size={16} />
                          <span className="font-medium">Temporary link</span>
                        </div>
                        <div className="text-xs opacity-70">Time-limited external access</div>
                      </button>
                    </div>
                  </div>

                  {/* Duration Selection for Temporary Links */}
                  {inviteType === 'temporary' && (
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <label className="block text-sm font-semibold text-amber-800 mb-3">Access Duration</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['1week', '2weeks', '1month'] as TemporaryDuration[]).map((duration) => (
                          <button
                            key={duration}
                            onClick={() => setTemporaryDuration(duration)}
                            className={`p-2 rounded-lg border-2 text-center transition-all duration-200 ${
                              temporaryDuration === duration
                                ? 'border-amber-500 bg-amber-100 text-amber-800'
                                : 'border-amber-200 bg-white text-amber-700 hover:border-amber-300'
                            }`}
                          >
                            <div className="font-medium text-sm">{getDurationLabel(duration)}</div>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-amber-700 mt-2">
                        External users will lose access after the selected duration
                      </p>
                    </div>
                  )}

                  {/* Role selection - Only show for teammates */}
                  {inviteType === 'teammate' && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Select Role</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setSelectedRole('member')}
                          className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                            selectedRole === 'member'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">Member</div>
                          <div className="text-xs opacity-70">Can view and participate</div>
                        </button>
                        <button
                          onClick={() => setSelectedRole('admin')}
                          className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                            selectedRole === 'admin'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">Admin</div>
                          <div className="text-xs opacity-70">Full access & management</div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Email inputs */}
                  <div className="space-y-3">
                    {emails.map((email, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <input
                            type="email"
                            placeholder="Enter email address"
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                            value={email}
                            onChange={(e) => handleEmailChange(index, e.target.value)}
                          />
                        </div>
                        {emails.length > 1 && (
                          <button 
                            className="w-10 h-10 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 flex items-center justify-center"
                            onClick={() => removeEmailField(index)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    className="w-full py-3 text-blue-600 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
                    onClick={addEmailField}
                  >
                    <Plus size={18} />
                    <span>Add another email</span>
                  </button>
                  
                  <button 
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                    onClick={handleSendInvites}
                    disabled={inviteSent || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : inviteSent ? (
                      <>
                        <Check size={18} />
                        <span>{inviteType === 'temporary' ? 'Temporary Links Sent!' : 'Invitations Sent!'}</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>{inviteType === 'temporary' ? 'Send Temporary Links' : 'Send Invitations'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Share Tab */}
              {activeTab === 'share' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Share2 size={24} className="text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Invite Link</h3>
                    <p className="text-gray-600">Share a direct link to join the workspace</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Workspace Link</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value="https://adafri-frontend.vercel.app/"
                        className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-3 bg-white text-gray-700 focus:outline-none"
                        readOnly
                      />
                      <button 
                        className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                          linkCopied 
                            ? 'bg-green-500 text-white' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        onClick={copyLinkToClipboard}
                      >
                        {linkCopied ? <Check size={16} /> : <Copy size={16} />}
                        <span>{linkCopied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700">Or send via email:</h4>
                    {shareEmails.map((email, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <input
                            type="email"
                            placeholder="Enter email address"
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                            value={email}
                            onChange={(e) => handleShareEmailChange(index, e.target.value)}
                          />
                        </div>
                        {shareEmails.length > 1 && (
                          <button 
                            className="w-10 h-10 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 flex items-center justify-center"
                            onClick={() => removeShareEmailField(index)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    className="w-full py-3 text-blue-600 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
                    onClick={addShareEmailField}
                  >
                    <Plus size={18} />
                    <span>Add another email</span>
                  </button>
                  
                  <button 
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 flex items-center justify-center space-x-2"
                    onClick={handleSendShareLinks}
                    disabled={shareSent}
                  >
                    {shareSent ? (
                      <>
                        <Check size={18} />
                        <span>Links Sent!</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Send Links</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Invitations Modal */}
      <PendingInvitationsModal
        isOpen={showPendingModal}
        onClose={() => setShowPendingModal(false)}
        workspaceId={workspaceId}
      />
    </>
  );
};







































// import React, { useState } from 'react';
// import { InviteTeamService, InviteRequest } from '@/lib/api/messaging/InviteTeamService';
// import { Mail, Users, Share2, Clock, Plus, X, Trash2, Copy, Check, Send, RefreshCw } from 'lucide-react';
// import { PendingInvitationsModal } from '../CollaborativeMessaging/workspace/PendingInvitationsModal';

// interface InviteTeamMembersModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   workspaceId: string;
// }

// export const InviteTeamMembersModal: React.FC<InviteTeamMembersModalProps> = ({ 
//   isOpen, 
//   onClose,
//   workspaceId
// }) => {
//   const [activeTab, setActiveTab] = useState<'invite' | 'share' | 'pending'>('invite');
//   const [emails, setEmails] = useState<string[]>(['']);
//   const [shareEmails, setShareEmails] = useState<string[]>(['']);
//   const [selectedRole, setSelectedRole] = useState<'admin' | 'member'>('member');
//   const [inviteSent, setInviteSent] = useState(false);
//   const [shareSent, setShareSent] = useState(false);
//   const [linkCopied, setLinkCopied] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [showPendingModal, setShowPendingModal] = useState(false);

//   const handleCloseModal = () => {
//     setEmails(['']);
//     setShareEmails(['']);
//     setInviteSent(false);
//     setShareSent(false);
//     setLinkCopied(false);
//     setError(null);
//     setActiveTab('invite');
//     onClose();
//   };

//   const handleEmailChange = (index: number, value: string) => {
//     const newEmails = [...emails];
//     newEmails[index] = value;
//     setEmails(newEmails);
//   };

//   const handleShareEmailChange = (index: number, value: string) => {
//     const newEmails = [...shareEmails];
//     newEmails[index] = value;
//     setShareEmails(newEmails);
//   };

//   const addEmailField = () => {
//     setEmails([...emails, '']);
//   };

//   const addShareEmailField = () => {
//     setShareEmails([...shareEmails, '']);
//   };

//   const removeEmailField = (index: number) => {
//     if (emails.length > 1) {
//       const newEmails = emails.filter((_, i) => i !== index);
//       setEmails(newEmails);
//     }
//   };

//   const removeShareEmailField = (index: number) => {
//     if (shareEmails.length > 1) {
//       const newEmails = shareEmails.filter((_, i) => i !== index);
//       setShareEmails(newEmails);
//     }
//   };

//   const handleSendInvites = async () => {
//     try {
//       setIsLoading(true);
//       setError(null);
      
//       const validEmails = emails.filter(email => email.trim() !== '');
//       if (validEmails.length === 0) {
//         setError('Please enter at least one valid email address');
//         return;
//       }

//       const invites: InviteRequest[] = validEmails.map(email => ({
//         email: email.trim(),
//         role: selectedRole
//       }));

//       await InviteTeamService.sendMultipleInvitations(workspaceId, invites);
      
//       setInviteSent(true);
//       setTimeout(() => {
//         setInviteSent(false);
//         handleCloseModal();
//       }, 3000);
//     } catch (error: any) {
//       const errorMessage = error?.response?.data?.message || 'Failed to send invitations. Please try again.';
//       setError(errorMessage);
//       console.error('Error sending invites:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSendShareLinks = () => {
//     console.log('Sending share links to:', shareEmails.filter(email => email.trim() !== ''));
//     setShareSent(true);
//     setTimeout(() => {
//       setShareSent(false);
//       handleCloseModal();
//     }, 3000);
//   };

//   const copyLinkToClipboard = () => {
//     navigator.clipboard.writeText('https://adafri-frontend.vercel.app/');
//     setLinkCopied(true);
//     setTimeout(() => {
//       setLinkCopied(false);
//     }, 3000);
//   };

//   const handlePendingTabClick = () => {
//     setShowPendingModal(true);
//   };

//   if (!isOpen) return null;

//   return (
//     <>
//       <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//         <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-gray-100 overflow-hidden">
//           {/* Header */}
//           <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6 text-white">
//             <button 
//               className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition-all duration-200"
//               onClick={handleCloseModal}
//             >
//               <X size={20} />
//             </button>
//             <div className="flex items-center space-x-3">
//               <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
//                 <Users size={28} />
//               </div>
//               <div>
//                 <h2 className="text-2xl font-bold">Team Invitations</h2>
//                 <p className="text-white/80">Invite members to collaborate</p>
//               </div>
//             </div>
//           </div>

//           <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
//             {/* Error display */}
//             {error && (
//               <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
//                 <X size={16} className="text-red-500" />
//                 <span className="text-sm">{error}</span>
//               </div>
//             )}

//             {/* Tabs */}
//             <div className="px-6 pt-6">
//               <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
//                 <button 
//                   className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
//                     activeTab === 'invite' 
//                       ? 'bg-white text-blue-600 shadow-sm' 
//                       : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
//                   }`}
//                   onClick={() => setActiveTab('invite')}
//                 >
//                   <Mail size={16} />
//                   <span>Invite</span>
//                 </button>
//                 <button 
//                   className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
//                     activeTab === 'share' 
//                       ? 'bg-white text-blue-600 shadow-sm' 
//                       : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
//                   }`}
//                   onClick={() => setActiveTab('share')}
//                 >
//                   <Share2 size={16} />
//                   <span>Share</span>
//                 </button>
//                 <button 
//                   className="flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
//                   onClick={handlePendingTabClick}
//                 >
//                   <Clock size={16} />
//                   <span>Pending</span>
//                 </button>
//               </div>
//             </div>

//             <div className="p-6">
//               {/* Invite Tab */}
//               {activeTab === 'invite' && (
//                 <div className="space-y-6">
//                   <div className="text-center">
//                     <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
//                       <Mail size={24} className="text-blue-600" />
//                     </div>
//                     <h3 className="text-lg font-semibold text-gray-900 mb-2">Invite by Email</h3>
//                     <p className="text-gray-600">Send invitation emails to team members</p>
//                   </div>

//                   {/* Role selection */}
//                   <div className="bg-gray-50 rounded-xl p-4">
//                     <label className="block text-sm font-semibold text-gray-700 mb-3">Select Role</label>
//                     <div className="grid grid-cols-2 gap-3">
//                       <button
//                         onClick={() => setSelectedRole('member')}
//                         className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
//                           selectedRole === 'member'
//                             ? 'border-blue-500 bg-blue-50 text-blue-700'
//                             : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
//                         }`}
//                       >
//                         <div className="font-medium">Member</div>
//                         <div className="text-xs opacity-70">Can view and participate</div>
//                       </button>
//                       <button
//                         onClick={() => setSelectedRole('admin')}
//                         className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
//                           selectedRole === 'admin'
//                             ? 'border-blue-500 bg-blue-50 text-blue-700'
//                             : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
//                         }`}
//                       >
//                         <div className="font-medium">Admin</div>
//                         <div className="text-xs opacity-70">Full access & management</div>
//                       </button>
//                     </div>
//                   </div>

//                   {/* Email inputs */}
//                   <div className="space-y-3">
//                     {emails.map((email, index) => (
//                       <div key={index} className="flex items-center space-x-3">
//                         <div className="flex-1">
//                           <input
//                             type="email"
//                             placeholder="Enter email address"
//                             className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors duration-200"
//                             value={email}
//                             onChange={(e) => handleEmailChange(index, e.target.value)}
//                           />
//                         </div>
//                         {emails.length > 1 && (
//                           <button 
//                             className="w-10 h-10 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 flex items-center justify-center"
//                             onClick={() => removeEmailField(index)}
//                           >
//                             <Trash2 size={16} />
//                           </button>
//                         )}
//                       </div>
//                     ))}
//                   </div>
                  
//                   <button 
//                     className="w-full py-3 text-blue-600 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
//                     onClick={addEmailField}
//                   >
//                     <Plus size={18} />
//                     <span>Add another email</span>
//                   </button>
                  
//                   <button 
//                     className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
//                     onClick={handleSendInvites}
//                     disabled={inviteSent || isLoading}
//                   >
//                     {isLoading ? (
//                       <>
//                         <RefreshCw size={18} className="animate-spin" />
//                         <span>Sending...</span>
//                       </>
//                     ) : inviteSent ? (
//                       <>
//                         <Check size={18} />
//                         <span>Invitations Sent!</span>
//                       </>
//                     ) : (
//                       <>
//                         <Send size={18} />
//                         <span>Send Invitations</span>
//                       </>
//                     )}
//                   </button>
//                 </div>
//               )}

//               {/* Share Tab */}
//               {activeTab === 'share' && (
//                 <div className="space-y-6">
//                   <div className="text-center">
//                     <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
//                       <Share2 size={24} className="text-green-600" />
//                     </div>
//                     <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Invite Link</h3>
//                     <p className="text-gray-600">Share a direct link to join the workspace</p>
//                   </div>

//                   <div className="bg-gray-50 rounded-xl p-4">
//                     <label className="block text-sm font-semibold text-gray-700 mb-3">Workspace Link</label>
//                     <div className="flex items-center space-x-2">
//                       <input
//                         type="text"
//                         value="https://adafri-frontend.vercel.app/"
//                         className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-3 bg-white text-gray-700 focus:outline-none"
//                         readOnly
//                       />
//                       <button 
//                         className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
//                           linkCopied 
//                             ? 'bg-green-500 text-white' 
//                             : 'bg-blue-600 text-white hover:bg-blue-700'
//                         }`}
//                         onClick={copyLinkToClipboard}
//                       >
//                         {linkCopied ? <Check size={16} /> : <Copy size={16} />}
//                         <span>{linkCopied ? 'Copied!' : 'Copy'}</span>
//                       </button>
//                     </div>
//                   </div>

//                   <div className="space-y-3">
//                     <h4 className="font-semibold text-gray-700">Or send via email:</h4>
//                     {shareEmails.map((email, index) => (
//                       <div key={index} className="flex items-center space-x-3">
//                         <div className="flex-1">
//                           <input
//                             type="email"
//                             placeholder="Enter email address"
//                             className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors duration-200"
//                             value={email}
//                             onChange={(e) => handleShareEmailChange(index, e.target.value)}
//                           />
//                         </div>
//                         {shareEmails.length > 1 && (
//                           <button 
//                             className="w-10 h-10 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 flex items-center justify-center"
//                             onClick={() => removeShareEmailField(index)}
//                           >
//                             <Trash2 size={16} />
//                           </button>
//                         )}
//                       </div>
//                     ))}
//                   </div>
                  
//                   <button 
//                     className="w-full py-3 text-blue-600 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
//                     onClick={addShareEmailField}
//                   >
//                     <Plus size={18} />
//                     <span>Add another email</span>
//                   </button>
                  
//                   <button 
//                     className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 flex items-center justify-center space-x-2"
//                     onClick={handleSendShareLinks}
//                     disabled={shareSent}
//                   >
//                     {shareSent ? (
//                       <>
//                         <Check size={18} />
//                         <span>Links Sent!</span>
//                       </>
//                     ) : (
//                       <>
//                         <Send size={18} />
//                         <span>Send Links</span>
//                       </>
//                     )}
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Pending Invitations Modal */}
//       <PendingInvitationsModal
//         isOpen={showPendingModal}
//         onClose={() => setShowPendingModal(false)}
//         workspaceId={workspaceId}
//       />
//     </>
//   );
// };















































































// 7/2/2025
// import React, { useState, useEffect } from 'react';
// import { InviteTeamService, InviteRequest, InviteResponse } from '@/lib/api/messaging/InviteTeamService';
// import { Mail, Users, Share2, Clock, Plus, X, Trash2, Copy, Check, UserPlus, Send, RefreshCw } from 'lucide-react';

// interface InviteTeamMembersModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   workspaceId: string;
// }

// export const InviteTeamMembersModal: React.FC<InviteTeamMembersModalProps> = ({ 
//   isOpen, 
//   onClose,
//   workspaceId
// }) => {
//   const [activeTab, setActiveTab] = useState<'invite' | 'share' | 'pending'>('invite');
//   const [emails, setEmails] = useState<string[]>(['']);
//   const [shareEmails, setShareEmails] = useState<string[]>(['']);
//   const [selectedRole, setSelectedRole] = useState<'admin' | 'member'>('member');
//   const [inviteSent, setInviteSent] = useState(false);
//   const [shareSent, setShareSent] = useState(false);
//   const [linkCopied, setLinkCopied] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [pendingInvites, setPendingInvites] = useState<InviteResponse[]>([]);
//   const [showAcceptInvite, setShowAcceptInvite] = useState(false);
//   const [inviteToken, setInviteToken] = useState<string | null>(null);

//   // Check for invite token on component mount
//   useEffect(() => {
//     const token = InviteTeamService.extractTokenFromUrl();
//     if (token) {
//       setInviteToken(token);
//       setShowAcceptInvite(true);
//     }
//   }, []);

//   // Fetch pending invitations when modal opens
//   useEffect(() => {
//     if (isOpen && activeTab === 'pending') {
//       fetchPendingInvites();
//     }
//   }, [isOpen, activeTab, workspaceId]);

//   const handleCloseModal = () => {
//     setEmails(['']);
//     setShareEmails(['']);
//     setInviteSent(false);
//     setShareSent(false);
//     setLinkCopied(false);
//     setError(null);
//     setShowAcceptInvite(false);
//     setInviteToken(null);
//     onClose();
//   };

//   const handleEmailChange = (index: number, value: string) => {
//     const newEmails = [...emails];
//     newEmails[index] = value;
//     setEmails(newEmails);
//   };

//   const handleShareEmailChange = (index: number, value: string) => {
//     const newEmails = [...shareEmails];
//     newEmails[index] = value;
//     setShareEmails(newEmails);
//   };

//   const addEmailField = () => {
//     setEmails([...emails, '']);
//   };

//   const addShareEmailField = () => {
//     setShareEmails([...shareEmails, '']);
//   };

//   const removeEmailField = (index: number) => {
//     if (emails.length > 1) {
//       const newEmails = emails.filter((_, i) => i !== index);
//       setEmails(newEmails);
//     }
//   };

//   const removeShareEmailField = (index: number) => {
//     if (shareEmails.length > 1) {
//       const newEmails = shareEmails.filter((_, i) => i !== index);
//       setShareEmails(newEmails);
//     }
//   };

//   const fetchPendingInvites = async () => {
//     try {
//       setIsLoading(true);
//       const invites = await InviteTeamService.getInvitations(workspaceId);
//       setPendingInvites(invites);
//     } catch (error) {
//       setError('Failed to fetch pending invitations');
//       console.error('Error fetching invites:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSendInvites = async () => {
//     try {
//       setIsLoading(true);
//       setError(null);
      
//       const validEmails = emails.filter(email => email.trim() !== '');
//       if (validEmails.length === 0) {
//         setError('Please enter at least one valid email address');
//         return;
//       }

//       const invites: InviteRequest[] = validEmails.map(email => ({
//         email: email.trim(),
//         role: selectedRole
//       }));

//       await InviteTeamService.sendMultipleInvitations(workspaceId, invites);
      
//       setInviteSent(true);
//       setTimeout(() => {
//         setInviteSent(false);
//         handleCloseModal();
//       }, 3000);
//     } catch (error) {
//       setError('Failed to send invitations. Please try again.');
//       console.error('Error sending invites:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSendShareLinks = () => {
//     console.log('Sending share links to:', shareEmails.filter(email => email.trim() !== ''));
//     setShareSent(true);
//     setTimeout(() => {
//       setShareSent(false);
//       handleCloseModal();
//     }, 3000);
//   };

//   const handleAcceptInvite = async () => {
//     if (!inviteToken) return;
    
//     try {
//       setIsLoading(true);
//       setError(null);
      
//       await InviteTeamService.acceptInvitation(inviteToken);
      
//       alert('Invitation accepted successfully!');
//       handleCloseModal();
//     } catch (error) {
//       setError('Failed to accept invitation. Please try again.');
//       console.error('Error accepting invite:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const copyLinkToClipboard = () => {
//     navigator.clipboard.writeText('https://adafri-frontend.vercel.app/');
//     setLinkCopied(true);
//     setTimeout(() => {
//       setLinkCopied(false);
//     }, 3000);
//   };

//   if (!isOpen) return null;

//   // Show accept invite dialog if there's an invite token
//   if (showAcceptInvite && inviteToken) {
//     return (
//       <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//         <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
//           <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
//             <button 
//               className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition-all duration-200"
//               onClick={handleCloseModal}
//             >
//               <X size={18} />
//             </button>
//             <div className="flex items-center space-x-3">
//               <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
//                 <UserPlus size={24} />
//               </div>
//               <div>
//                 <h2 className="text-xl font-bold">Accept Invitation</h2>
//                 <p className="text-white/80 text-sm">Join the workspace</p>
//               </div>
//             </div>
//           </div>
          
//           <div className="p-6">
//             {error && (
//               <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
//                 <X size={16} className="text-red-500" />
//                 <span className="text-sm">{error}</span>
//               </div>
//             )}

//             <p className="mb-6 text-gray-600 leading-relaxed">
//               You've been invited to join this workspace. Click the button below to accept the invitation and start collaborating.
//             </p>

//             <button 
//               className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
//               onClick={handleAcceptInvite}
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <>
//                   <RefreshCw size={18} className="animate-spin" />
//                   <span>Accepting...</span>
//                 </>
//               ) : (
//                 <>
//                   <Check size={18} />
//                   <span>Accept Invitation</span>
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-gray-100 overflow-hidden">
//         {/* Header */}
//         <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6 text-white">
//           <button 
//             className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition-all duration-200"
//             onClick={handleCloseModal}
//           >
//             <X size={20} />
//           </button>
//           <div className="flex items-center space-x-3">
//             <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
//               <Users size={28} />
//             </div>
//             <div>
//               <h2 className="text-2xl font-bold">Team Invitations</h2>
//               <p className="text-white/80">Invite members to collaborate</p>
//             </div>
//           </div>
//         </div>

//         <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
//           {/* Error display */}
//           {error && (
//             <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
//               <X size={16} className="text-red-500" />
//               <span className="text-sm">{error}</span>
//             </div>
//           )}

//           {/* Tabs */}
//           <div className="px-6 pt-6">
//             <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
//               <button 
//                 className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
//                   activeTab === 'invite' 
//                     ? 'bg-white text-blue-600 shadow-sm' 
//                     : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
//                 }`}
//                 onClick={() => setActiveTab('invite')}
//               >
//                 <Mail size={16} />
//                 <span>Invite</span>
//               </button>
//               <button 
//                 className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
//                   activeTab === 'share' 
//                     ? 'bg-white text-blue-600 shadow-sm' 
//                     : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
//                 }`}
//                 onClick={() => setActiveTab('share')}
//               >
//                 <Share2 size={16} />
//                 <span>Share</span>
//               </button>
//               <button 
//                 className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
//                   activeTab === 'pending' 
//                     ? 'bg-white text-blue-600 shadow-sm' 
//                     : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
//                 }`}
//                 onClick={() => setActiveTab('pending')}
//               >
//                 <Clock size={16} />
//                 <span>Pending</span>
//               </button>
//             </div>
//           </div>

//           <div className="p-6">
//             {/* Invite Tab */}
//             {activeTab === 'invite' && (
//               <div className="space-y-6">
//                 <div className="text-center">
//                   <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
//                     <Mail size={24} className="text-blue-600" />
//                   </div>
//                   <h3 className="text-lg font-semibold text-gray-900 mb-2">Invite by Email</h3>
//                   <p className="text-gray-600">Send invitation emails to team members</p>
//                 </div>

//                 {/* Role selection */}
//                 <div className="bg-gray-50 rounded-xl p-4">
//                   <label className="block text-sm font-semibold text-gray-700 mb-3">Select Role</label>
//                   <div className="grid grid-cols-2 gap-3">
//                     <button
//                       onClick={() => setSelectedRole('member')}
//                       className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
//                         selectedRole === 'member'
//                           ? 'border-blue-500 bg-blue-50 text-blue-700'
//                           : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
//                       }`}
//                     >
//                       <div className="font-medium">Member</div>
//                       <div className="text-xs opacity-70">Can view and participate</div>
//                     </button>
//                     <button
//                       onClick={() => setSelectedRole('admin')}
//                       className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
//                         selectedRole === 'admin'
//                           ? 'border-blue-500 bg-blue-50 text-blue-700'
//                           : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
//                       }`}
//                     >
//                       <div className="font-medium">Admin</div>
//                       <div className="text-xs opacity-70">Full access & management</div>
//                     </button>
//                   </div>
//                 </div>

//                 {/* Email inputs */}
//                 <div className="space-y-3">
//                   {emails.map((email, index) => (
//                     <div key={index} className="flex items-center space-x-3">
//                       <div className="flex-1">
//                         <input
//                           type="email"
//                           placeholder="Enter email address"
//                           className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors duration-200"
//                           value={email}
//                           onChange={(e) => handleEmailChange(index, e.target.value)}
//                         />
//                       </div>
//                       {emails.length > 1 && (
//                         <button 
//                           className="w-10 h-10 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 flex items-center justify-center"
//                           onClick={() => removeEmailField(index)}
//                         >
//                           <Trash2 size={16} />
//                         </button>
//                       )}
//                     </div>
//                   ))}
//                 </div>
                
//                 <button 
//                   className="w-full py-3 text-blue-600 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
//                   onClick={addEmailField}
//                 >
//                   <Plus size={18} />
//                   <span>Add another email</span>
//                 </button>
                
//                 <button 
//                   className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
//                   onClick={handleSendInvites}
//                   disabled={inviteSent || isLoading}
//                 >
//                   {isLoading ? (
//                     <>
//                       <RefreshCw size={18} className="animate-spin" />
//                       <span>Sending...</span>
//                     </>
//                   ) : inviteSent ? (
//                     <>
//                       <Check size={18} />
//                       <span>Invitations Sent!</span>
//                     </>
//                   ) : (
//                     <>
//                       <Send size={18} />
//                       <span>Send Invitations</span>
//                     </>
//                   )}
//                 </button>
//               </div>
//             )}

//             {/* Share Tab */}
//             {activeTab === 'share' && (
//               <div className="space-y-6">
//                 <div className="text-center">
//                   <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
//                     <Share2 size={24} className="text-green-600" />
//                   </div>
//                   <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Invite Link</h3>
//                   <p className="text-gray-600">Share a direct link to join the workspace</p>
//                 </div>

//                 <div className="bg-gray-50 rounded-xl p-4">
//                   <label className="block text-sm font-semibold text-gray-700 mb-3">Workspace Link</label>
//                   <div className="flex items-center space-x-2">
//                     <input
//                       type="text"
//                       value="https://adafri-frontend.vercel.app/"
//                       className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-3 bg-white text-gray-700 focus:outline-none"
//                       readOnly
//                     />
//                     <button 
//                       className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
//                         linkCopied 
//                           ? 'bg-green-500 text-white' 
//                           : 'bg-blue-600 text-white hover:bg-blue-700'
//                       }`}
//                       onClick={copyLinkToClipboard}
//                     >
//                       {linkCopied ? <Check size={16} /> : <Copy size={16} />}
//                       <span>{linkCopied ? 'Copied!' : 'Copy'}</span>
//                     </button>
//                   </div>
//                 </div>

//                 <div className="space-y-3">
//                   <h4 className="font-semibold text-gray-700">Or send via email:</h4>
//                   {shareEmails.map((email, index) => (
//                     <div key={index} className="flex items-center space-x-3">
//                       <div className="flex-1">
//                         <input
//                           type="email"
//                           placeholder="Enter email address"
//                           className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors duration-200"
//                           value={email}
//                           onChange={(e) => handleShareEmailChange(index, e.target.value)}
//                         />
//                       </div>
//                       {shareEmails.length > 1 && (
//                         <button 
//                           className="w-10 h-10 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 flex items-center justify-center"
//                           onClick={() => removeShareEmailField(index)}
//                         >
//                           <Trash2 size={16} />
//                         </button>
//                       )}
//                     </div>
//                   ))}
//                 </div>
                
//                 <button 
//                   className="w-full py-3 text-blue-600 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
//                   onClick={addShareEmailField}
//                 >
//                   <Plus size={18} />
//                   <span>Add another email</span>
//                 </button>
                
//                 <button 
//                   className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 flex items-center justify-center space-x-2"
//                   onClick={handleSendShareLinks}
//                   disabled={shareSent}
//                 >
//                   {shareSent ? (
//                     <>
//                       <Check size={18} />
//                       <span>Links Sent!</span>
//                     </>
//                   ) : (
//                     <>
//                       <Send size={18} />
//                       <span>Send Links</span>
//                     </>
//                   )}
//                 </button>
//               </div>
//             )}

//             {/* Pending Tab */}
//             {activeTab === 'pending' && (
//               <div className="space-y-6">
//                 <div className="flex items-center justify-between">
//                   <div className="text-center flex-1">
//                     <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
//                       <Clock size={24} className="text-orange-600" />
//                     </div>
//                     <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Invitations</h3>
//                     <p className="text-gray-600">Manage sent invitations</p>
//                   </div>
//                   <button 
//                     onClick={fetchPendingInvites}
//                     className="px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium flex items-center space-x-2"
//                     disabled={isLoading}
//                   >
//                     <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
//                     <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
//                   </button>
//                 </div>
                
//                 {isLoading ? (
//                   <div className="text-center py-12">
//                     <RefreshCw size={32} className="animate-spin text-blue-500 mx-auto mb-4" />
//                     <p className="text-gray-500">Loading invitations...</p>
//                   </div>
//                 ) : pendingInvites.length === 0 ? (
//                   <div className="text-center py-12">
//                     <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
//                       <Mail size={28} className="text-gray-400" />
//                     </div>
//                     <h4 className="font-medium text-gray-900 mb-2">No pending invitations</h4>
//                     <p className="text-gray-500 text-sm">All invitations have been accepted or none have been sent yet.</p>
//                   </div>
//                 ) : (
//                   <div className="space-y-3">
//                     {pendingInvites.map((invite) => (
//                       <div key={invite.id} className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-all duration-200">
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center space-x-3">
//                             <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
//                               <Mail size={16} className="text-white" />
//                             </div>
//                             <div>
//                               <p className="font-semibold text-gray-900">{invite.email}</p>
//                               <div className="flex items-center space-x-3 text-sm text-gray-500">
//                                 <span>Role: <span className="font-medium">{invite.role}</span></span>
//                                 <span>•</span>
//                                 <span>Sent: {new Date(invite.createdAt).toLocaleDateString()}</span>
//                               </div>
//                             </div>
//                           </div>
//                           <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                             invite.status === 'pending' 
//                               ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' 
//                               : invite.status === 'accepted'
//                               ? 'bg-green-100 text-green-700 border border-green-200'
//                               : 'bg-gray-100 text-gray-700 border border-gray-200'
//                           }`}>
//                             {invite.status}
//                           </span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };




























































// import React, { useState } from 'react';

// interface InviteTeamMembersModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// export const InviteTeamMembersModal: React.FC<InviteTeamMembersModalProps> = ({ 
//   isOpen, 
//   onClose 
// }) => {
//   const [activeTab, setActiveTab] = useState<'invite' | 'share'>('invite');
//   const [emails, setEmails] = useState<string[]>(['']);
//   const [shareEmails, setShareEmails] = useState<string[]>(['']);
//   const [inviteSent, setInviteSent] = useState(false);
//   const [shareSent, setShareSent] = useState(false);
//   const [linkCopied, setLinkCopied] = useState(false);

//   const handleCloseModal = () => {
//     setEmails(['']);
//     setShareEmails(['']);
//     setInviteSent(false);
//     setShareSent(false);
//     setLinkCopied(false);
//     onClose();
//   };

//   const handleEmailChange = (index: number, value: string) => {
//     const newEmails = [...emails];
//     newEmails[index] = value;
//     setEmails(newEmails);
//   };

//   const handleShareEmailChange = (index: number, value: string) => {
//     const newEmails = [...shareEmails];
//     newEmails[index] = value;
//     setShareEmails(newEmails);
//   };

//   const addEmailField = () => {
//     setEmails([...emails, '']);
//   };

//   const addShareEmailField = () => {
//     setShareEmails([...shareEmails, '']);
//   };

//   const removeEmailField = (index: number) => {
//     if (emails.length > 1) {
//       const newEmails = emails.filter((_, i) => i !== index);
//       setEmails(newEmails);
//     }
//   };

//   const removeShareEmailField = (index: number) => {
//     if (shareEmails.length > 1) {
//       const newEmails = shareEmails.filter((_, i) => i !== index);
//       setShareEmails(newEmails);
//     }
//   };

//   const handleSendInvites = () => {
//     // Here you would implement the actual email sending logic
//     console.log('Sending invites to:', emails.filter(email => email.trim() !== ''));
//     setInviteSent(true);
//     // Reset after 3 seconds
//     setTimeout(() => {
//       setInviteSent(false);
//       handleCloseModal();
//     }, 3000);
//   };

//   const handleSendShareLinks = () => {
//     // Here you would implement the actual share email sending logic
//     console.log('Sending share links to:', shareEmails.filter(email => email.trim() !== ''));
//     setShareSent(true);
//     // Reset after 3 seconds
//     setTimeout(() => {
//       setShareSent(false);
//       handleCloseModal();
//     }, 3000);
//   };

//   const copyLinkToClipboard = () => {
//     navigator.clipboard.writeText('https://adafri-frontend.vercel.app/');
//     setLinkCopied(true);
//     setTimeout(() => {
//       setLinkCopied(false);
//     }, 3000);
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
//         {/* Close button */}
//         <button 
//           className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
//           onClick={handleCloseModal}
//         >
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//           </svg>
//         </button>

//         <h2 className="text-xl font-bold mb-6">Invite Team Members</h2>

//         {/* Tabs */}
//         <div className="flex mb-6 border-b">
//           <button 
//             className={`pb-2 px-4 ${activeTab === 'invite' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
//             onClick={() => setActiveTab('invite')}
//           >
//             Invite to Workspace
//           </button>
//           <button 
//             className={`pb-2 px-4 ${activeTab === 'share' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
//             onClick={() => setActiveTab('share')}
//           >
//             Share Link
//           </button>
//         </div>

//         {/* Invite to Workspace Content */}
//         {activeTab === 'invite' && (
//           <div>
//             <p className="mb-4 text-gray-700">Invite team members by email. They'll receive an invitation to join your workspace.</p>
            
//             {emails.map((email, index) => (
//               <div key={index} className="flex mb-3">
//                 <input
//                   type="email"
//                   placeholder="Enter email address"
//                   className="flex-1 border rounded-lg px-3 py-2 mr-2"
//                   value={email}
//                   onChange={(e) => handleEmailChange(index, e.target.value)}
//                 />
//                 {emails.length > 1 && (
//                   <button 
//                     className="text-red-500 hover:text-red-700"
//                     onClick={() => removeEmailField(index)}
//                   >
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                     </svg>
//                   </button>
//                 )}
//               </div>
//             ))}
            
//             <div className="flex justify-between items-center mb-6">
//               <button 
//                 className="text-blue-500 hover:text-blue-700 flex items-center"
//                 onClick={addEmailField}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                 </svg>
//                 Add another
//               </button>
//             </div>
            
//             <button 
//               className="w-full py-3 bg-blue-500 text-white rounded-lg text-center font-medium hover:bg-blue-600"
//               onClick={handleSendInvites}
//               disabled={inviteSent}
//             >
//               {inviteSent ? 'Invitations Sent!' : 'Send Invitations'}
//             </button>
//           </div>
//         )}

//         {/* Share Link Content */}
//         {activeTab === 'share' && (
//           <div>
//             <div className="mb-6">
//               <p className="mb-3 text-gray-700">Share this link with others:</p>
//               <div className="flex">
//                 <input
//                   type="text"
//                   value="https://adafri-frontend.vercel.app/"
//                   className="flex-1 border rounded-l-lg px-3 py-2"
//                   readOnly
//                 />
//                 <button 
//                   className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600"
//                   onClick={copyLinkToClipboard}
//                 >
//                   {linkCopied ? 'Copied!' : 'Copy'}
//                 </button>
//               </div>
//             </div>

//             <p className="mb-3 text-gray-700">Or send via email:</p>
            
//             {shareEmails.map((email, index) => (
//               <div key={index} className="flex mb-3">
//                 <input
//                   type="email"
//                   placeholder="Enter email address"
//                   className="flex-1 border rounded-lg px-3 py-2 mr-2"
//                   value={email}
//                   onChange={(e) => handleShareEmailChange(index, e.target.value)}
//                 />
//                 {shareEmails.length > 1 && (
//                   <button 
//                     className="text-red-500 hover:text-red-700"
//                     onClick={() => removeShareEmailField(index)}
//                   >
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                     </svg>
//                   </button>
//                 )}
//               </div>
//             ))}
            
//             <div className="flex justify-between items-center mb-6">
//               <button 
//                 className="text-blue-500 hover:text-blue-700 flex items-center"
//                 onClick={addShareEmailField}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                 </svg>
//                 Add another
//               </button>
//             </div>
            
//             <button 
//               className="w-full py-3 bg-blue-500 text-white rounded-lg text-center font-medium hover:bg-blue-600"
//               onClick={handleSendShareLinks}
//               disabled={shareSent}
//             >
//               {shareSent ? 'Links Sent!' : 'Send Links'}
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };