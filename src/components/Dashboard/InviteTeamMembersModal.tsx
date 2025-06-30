import React, { useState } from 'react';

interface InviteTeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteTeamMembersModal: React.FC<InviteTeamMembersModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'invite' | 'share'>('invite');
  const [emails, setEmails] = useState<string[]>(['']);
  const [shareEmails, setShareEmails] = useState<string[]>(['']);
  const [inviteSent, setInviteSent] = useState(false);
  const [shareSent, setShareSent] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCloseModal = () => {
    setEmails(['']);
    setShareEmails(['']);
    setInviteSent(false);
    setShareSent(false);
    setLinkCopied(false);
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

  const handleSendInvites = () => {
    // Here you would implement the actual email sending logic
    console.log('Sending invites to:', emails.filter(email => email.trim() !== ''));
    setInviteSent(true);
    // Reset after 3 seconds
    setTimeout(() => {
      setInviteSent(false);
      handleCloseModal();
    }, 3000);
  };

  const handleSendShareLinks = () => {
    // Here you would implement the actual share email sending logic
    console.log('Sending share links to:', shareEmails.filter(email => email.trim() !== ''));
    setShareSent(true);
    // Reset after 3 seconds
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
        {/* Close button */}
        <button 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={handleCloseModal}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold mb-6">Invite Team Members</h2>

        {/* Tabs */}
        <div className="flex mb-6 border-b">
          <button 
            className={`pb-2 px-4 ${activeTab === 'invite' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('invite')}
          >
            Invite to Workspace
          </button>
          <button 
            className={`pb-2 px-4 ${activeTab === 'share' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('share')}
          >
            Share Link
          </button>
        </div>

        {/* Invite to Workspace Content */}
        {activeTab === 'invite' && (
          <div>
            <p className="mb-4 text-gray-700">Invite team members by email. They'll receive an invitation to join your workspace.</p>
            
            {emails.map((email, index) => (
              <div key={index} className="flex mb-3">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="flex-1 border rounded-lg px-3 py-2 mr-2"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                />
                {emails.length > 1 && (
                  <button 
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeEmailField(index)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            
            <div className="flex justify-between items-center mb-6">
              <button 
                className="text-blue-500 hover:text-blue-700 flex items-center"
                onClick={addEmailField}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add another
              </button>
            </div>
            
            <button 
              className="w-full py-3 bg-blue-500 text-white rounded-lg text-center font-medium hover:bg-blue-600"
              onClick={handleSendInvites}
              disabled={inviteSent}
            >
              {inviteSent ? 'Invitations Sent!' : 'Send Invitations'}
            </button>
          </div>
        )}

        {/* Share Link Content */}
        {activeTab === 'share' && (
          <div>
            <div className="mb-6">
              <p className="mb-3 text-gray-700">Share this link with others:</p>
              <div className="flex">
                <input
                  type="text"
                  value="https://adafri-frontend.vercel.app/"
                  className="flex-1 border rounded-l-lg px-3 py-2"
                  readOnly
                />
                <button 
                  className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600"
                  onClick={copyLinkToClipboard}
                >
                  {linkCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <p className="mb-3 text-gray-700">Or send via email:</p>
            
            {shareEmails.map((email, index) => (
              <div key={index} className="flex mb-3">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="flex-1 border rounded-lg px-3 py-2 mr-2"
                  value={email}
                  onChange={(e) => handleShareEmailChange(index, e.target.value)}
                />
                {shareEmails.length > 1 && (
                  <button 
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeShareEmailField(index)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            
            <div className="flex justify-between items-center mb-6">
              <button 
                className="text-blue-500 hover:text-blue-700 flex items-center"
                onClick={addShareEmailField}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add another
              </button>
            </div>
            
            <button 
              className="w-full py-3 bg-blue-500 text-white rounded-lg text-center font-medium hover:bg-blue-600"
              onClick={handleSendShareLinks}
              disabled={shareSent}
            >
              {shareSent ? 'Links Sent!' : 'Send Links'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};