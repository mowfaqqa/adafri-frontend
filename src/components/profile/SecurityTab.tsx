import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle, Copy, Loader2 } from "lucide-react";
import { getAuthToken, getUserInfo, getCookie } from "@/lib/utils/cookies";
import { toast } from "@/hooks/use-toast";
import { debugAuthTokens, makeAuthenticatedRequest } from "@/lib/utils/tokenHelper";

export const SecurityTab: React.FC = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCodeEntryModal, setShowCodeEntryModal] = useState(false);
  const [showEnabledModal, setShowEnabledModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showDisabledModal, setShowDisabledModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [qrCodeData, setQrCodeData] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  
  // useEffect(() => {
  //   const checkTwoFactorStatus = async () => {
  //     try {
  //       // Debug all available tokens
  //       debugAuthTokens();

  //       console.log('Checking 2FA status...');
        
  //       try {
  //         const response = await makeAuthenticatedRequest(
  //           'https://be-auth-server.onrender.com/api/v1/accounts/2fa/status',
  //           'GET'
  //         );
          
  //         console.log('2FA status response:', response);
          
  //         if (response.status === 'success') {
  //           setTwoFactorEnabled(response.data.enabled || false);
  //         } else {
  //           console.error('Failed to fetch 2FA status:', response.message);
  //         }
  //       } catch (error) {
  //         console.error('Error checking 2FA status:', error);
  //       }
  //     } catch (error) {
  //       console.error('Error in checkTwoFactorStatus:', error);
  //     }
  //   };
    
  //   checkTwoFactorStatus();
  // }, []);

  const handleToggle2FA = () => {
    if (!twoFactorEnabled) {
      fetchTwoFactorSecret();
    } else {
      setShowDisableModal(true);
    }
  };
  
  const fetchTwoFactorSecret = async () => {
    setIsLoading(true);
    try {
      // Get the auth token and log details
      const token = getAuthToken();
      console.log('Fetching 2FA secret - Auth token:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You need to be logged in to enable 2FA",
          variant: "destructive"
        });
        return;
      }
      
      // Check access token cookie specifically
      const accessTokenCookie = getCookie('accessToken');
      const legacyTokenCookie = getCookie('__frsadfrusrtkn');
      console.log('Access token cookie check:', {
        accessTokenExists: accessTokenCookie ? 'Yes' : 'No',
        legacyTokenExists: legacyTokenCookie ? 'Yes' : 'No',
        tokenSource: accessTokenCookie ? 'Using accessToken' : (legacyTokenCookie ? 'Using legacy token' : 'No token available')
      });
      
      // Format Authorization header - try with Bearer prefix first
      let authHeader = `Bearer ${token}`;
      
      // Log token format to check if it's in expected format
      console.log('Token format check:', {
        length: token.length,
        includesDots: token.includes('.'),
        startsWithEy: token.startsWith('ey')
      });
      
      const url = 'https://be-auth-server.onrender.com/api/v1/accounts/2fa/secret';
      console.log('Requesting 2FA secret from:', url);
      
      console.log('Making request with standard Bearer token');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        credentials: 'include' // Include cookies in the request
      });
      
      console.log('2FA secret fetch response status:', response.status, response.statusText);
      
      if (!response.ok) {
        // Try alternative auth header format if the first attempt fails with 401
        if (response.status === 401) {
          console.log('Unauthorized with Bearer prefix, trying without prefix as fallback');
          
          // Try without Bearer prefix
          const fallbackResponse = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token // Try without Bearer prefix
            },
            credentials: 'include'
          });
          
          console.log('Fallback response status:', fallbackResponse.status);
          
          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            console.log('Fallback request succeeded:', data);
            
            if (data.status === 'success') {
              setQrCodeData(data.data.qrCode);
              setSecretKey(data.data.secret);
              console.log('Secret key received successfully via fallback method');
              setShowQRModal(true);
              return;
            }
          }
          
          // If even the fallback failed with 401
          toast({
            title: "Session Expired",
            description: "Please log in again and try enabling 2FA",
            variant: "destructive"
          });
          return;
        }
        
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorMessage = "Failed to fetch 2FA details. Please try again.";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
          console.error('Error details:', errorData);
        } catch (e) {
          console.error('Raw error response (not JSON):', errorText);
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }
      
      const data = await response.json();
      console.log('2FA secret fetch response data:', data);
      
      if (data.status === 'success') {
        setQrCodeData(data.data.qrCode);
        setSecretKey(data.data.secret);
        console.log('Secret key received successfully:', {
          qrCodeExists: data.data.qrCode ? 'Yes' : 'No',
          secretExists: data.data.secret ? 'Yes' : 'No',
          secretLength: data.data.secret ? data.data.secret.length : 0
        });
        setShowQRModal(true);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch 2FA details",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching 2FA details:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCodeChange = (index: number, value: string) => {
    if (/^\d?$/.test(value)) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
      
      // Auto-focus next input field
      if (value !== '' && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };
  
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to go to previous input
    if (e.key === 'Backspace' && index > 0 && verificationCode[index] === '') {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };
  
  const handleVerifyCode = async () => {
    const code = verificationCode.join('');
    
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit code",
        variant: "destructive"
      });
      return;
    }
    
    setIsVerifying(true);
    
    try {
      // Get authentication token and log for debugging
      const token = getAuthToken();
      console.log('Verify 2FA - Auth token:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You need to be logged in to verify 2FA",
          variant: "destructive"
        });
        setIsVerifying(false);
        return;
      }
      
      // Log user info for debugging
      const userInfo = getUserInfo();
      console.log('User info for verification:', {
        email: userInfo.email ? 'Has email' : 'No email',
        userId: userInfo.userId ? 'Has userId' : 'No userId'
      });
      
      // Format Authorization header - try both with and without "Bearer" prefix
      // Some APIs require "Bearer", others might expect just the token
      let authHeader = `Bearer ${token}`;
      
      // Log to check if token is in expected format
      console.log('Token format check:', {
        length: token.length,
        includesDots: token.includes('.'),
        startsWithEy: token.startsWith('ey')
      });
      
      // If it doesn't look like a JWT, try without Bearer prefix
      if (!token.includes('.')) {
        console.log('Token does not appear to be a JWT, trying without Bearer prefix');
        authHeader = token;
      }
      
      const verifyPayload = {
        token: code,     // The 6-digit code from authenticator app
        secret: secretKey // The secret from QR code setup
      };
      
      console.log('Sending verification request with payload:', {
        codeLength: code.length,
        hasSecret: secretKey ? 'Yes' : 'No',
        secretLength: secretKey.length
      });
      
      const url = 'https://be-auth-server.onrender.com/api/v1/accounts/2fa/verify';
      console.log('Sending request to:', url);
      
      // First try with Bearer token format
      console.log('Attempting verification with standard Bearer token format');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify(verifyPayload)
      });
      
      console.log('Verification response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Verification failed:', response.status, errorText);
        
        // If 401 unauthorized, try without Bearer prefix as fallback
        if (response.status === 401 && authHeader.startsWith('Bearer ')) {
          console.log('Unauthorized with Bearer prefix, trying without prefix as fallback');
          
          const fallbackResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token // Try without Bearer prefix
            },
            credentials: 'include',
            body: JSON.stringify(verifyPayload)
          });
          
          console.log('Fallback response status:', fallbackResponse.status);
          
          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            console.log('Fallback verification succeeded:', data);
            
            if (data.status === 'success') {
              setShowCodeEntryModal(false);
              setShowEnabledModal(true);
              setTwoFactorEnabled(true);
              return;
            }
          }
        }
        
        let errorMessage = "Failed to verify code. Please try again.";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
          console.error('Error details:', errorData);
        } catch (e) {
          console.error('Raw error response (not JSON):', errorText);
        }
        
        toast({
          title: "Verification Failed",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }
      
      const data = await response.json();
      console.log('Verification response data:', data);
      
      if (data.status === 'success') {
        setShowCodeEntryModal(false);
        setShowEnabledModal(true);
        setTwoFactorEnabled(true);
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Invalid verification code. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error verifying 2FA code:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQRContinue = () => {
    setShowQRModal(false);
    setShowCodeEntryModal(true);
  };
  
  const handleEnableComplete = () => {
    setShowEnabledModal(false);
    setVerificationCode(['', '', '', '', '', '']);
  };
  
  const handleDisable = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      console.log('Disabling 2FA - Auth token:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You need to be logged in to disable 2FA",
          variant: "destructive"
        });
        return;
      }
      
      // Log token format for debugging
      console.log('Token format check:', {
        length: token.length,
        includesDots: token.includes('.'),
        startsWithEy: token.startsWith('ey')
      });
      
      // Format Authorization header - try with Bearer prefix
      let authHeader = `Bearer ${token}`;
      
      const url = 'https://be-auth-server.onrender.com/api/v1/accounts/2fa/disable';
      console.log('Sending disable 2FA request to:', url);
      
      console.log('Making request with standard Bearer token');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        credentials: 'include' // Include cookies in the request
      });
      
      console.log('Disable 2FA response status:', response.status, response.statusText);
      
      if (!response.ok) {
        // If unauthorized, try without Bearer prefix
        if (response.status === 401 && authHeader.startsWith('Bearer ')) {
          console.log('Unauthorized with Bearer prefix, trying without prefix');
          
          const fallbackResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token // Try without Bearer prefix
            },
            credentials: 'include'
          });
          
          console.log('Fallback response status:', fallbackResponse.status);
          
          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            console.log('Fallback disable request succeeded:', data);
            
            if (data.status === 'success') {
              setShowDisableModal(false);
              setShowDisabledModal(true);
              return;
            }
          }
        }
        
        const errorText = await response.text();
        console.error('Disable 2FA failed:', response.status, errorText);
        
        let errorMessage = "Failed to disable 2FA. Please try again.";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
          console.error('Error details:', errorData);
        } catch (e) {
          console.error('Raw error response (not JSON):', errorText);
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }
      
      const data = await response.json();
      console.log('Disable 2FA response data:', data);
      
      if (data.status === 'success') {
        setShowDisableModal(false);
        setShowDisabledModal(true);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to disable 2FA",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      toast({
        title: "Error",
        description: "Failed to disable 2FA. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDisableComplete = () => {
    setShowDisabledModal(false);
    setTwoFactorEnabled(false);
    // Clear stored secret and QR code
    setSecretKey('');
    setQrCodeData('');
  };
  
  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    toast({
      title: "Copied",
      description: "Secret key copied to clipboard",
    });
  };

  // Handle paste for verification code
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    // Only process if it's a 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = [...verificationCode];
      for (let i = 0; i < 6; i++) {
        newCode[i] = pastedData[i] || '';
      }
      setVerificationCode(newCode);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
        
        {/* Two Factor Authentication Section */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Setup Two Factor Authentication</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Each time you log in, in addition to your password, you'll use an 
                authenticator app to generate a one-time code.
              </p>
            </div>
            <Switch 
              checked={twoFactorEnabled}
              onCheckedChange={handleToggle2FA}
              disabled={isLoading}
            />
          </div>
        </div>
        
        {/* Password Section */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Change Password</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Update your account password regularly for better security
              </p>
            </div>
            <Button variant="outline">Change Password</Button>
          </div>
        </div>
        
        {/* Login History Section */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Login History</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                View your recent login activity
              </p>
            </div>
            <Button variant="outline">View History</Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4">
          <Button variant="outline">Reset Defaults</Button>
          <Button>Save Changes</Button>
        </div>
      </div>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={(open) => {
        if (!open && !showCodeEntryModal) setIsLoading(false);
        setShowQRModal(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Scan QR Code</DialogTitle>
            <DialogDescription className="text-center text-xs">
              Use your authenticator application to scan the QR code.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : (
              <>
                <div className="bg-white p-2 rounded mb-4">
                  {qrCodeData ? (
                    <img 
                      src={qrCodeData} 
                      alt="2FA QR Code" 
                      className="w-48 h-48 object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-gray-100">
                      <p className="text-sm text-gray-400">QR Code not available</p>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 mt-2 mb-1">If unable to scan, use this code manually</p>
                
                <div className="flex items-center w-full mb-4">
                  <div className="relative flex-1">
                    <Input 
                      className="text-xs text-center pr-10" 
                      value={secretKey} 
                      readOnly 
                    />
                    <button 
                      onClick={handleCopySecret}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      type="button"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <Button 
            onClick={handleQRContinue} 
            className="w-full"
            disabled={isLoading || !qrCodeData}
          >
            Continue
          </Button>
        </DialogContent>
      </Dialog>

      {/* 6-Digit Code Entry Modal */}
      <Dialog open={showCodeEntryModal} onOpenChange={setShowCodeEntryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Verify Authentication</DialogTitle>
            <DialogDescription className="text-center text-xs">
              Enter the 6-digit code displayed in your authenticator app.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center space-x-2 py-4" onPaste={handlePaste}>
            {verificationCode.map((digit, index) => (
              <Input
                key={index}
                id={`code-${index}`}
                className="w-10 h-10 text-center"
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                maxLength={1}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                disabled={isVerifying}
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>
          
          <Button 
            onClick={handleVerifyCode} 
            className="w-full"
            disabled={isVerifying || verificationCode.join('').length !== 6}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
        </DialogContent>
      </Dialog>

      {/* 2FA Enabled Success Modal */}
      <Dialog open={showEnabledModal} onOpenChange={setShowEnabledModal}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 text-green-500">
              <CheckCircle size={48} />
            </div>
            <p className="text-green-500 font-medium">Two-step authentication successfully enabled</p>
          </div>
          
          <Button onClick={handleEnableComplete} className="w-full">Done</Button>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Confirmation Modal */}
      <Dialog open={showDisableModal} onOpenChange={setShowDisableModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Disable Two-step Authentication</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-center">Are you sure you want to disable two-step authentication?</p>
            <p className="text-center text-sm text-gray-500 mt-2">
              This will make your account less secure.
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={() => setShowDisableModal(false)} 
              variant="outline" 
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDisable} 
              variant="destructive" 
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Disabled Success Modal */}
      <Dialog open={showDisabledModal} onOpenChange={setShowDisabledModal}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 text-gray-500">
              <CheckCircle size={48} />
            </div>
            <p className="text-gray-500 font-medium">Two-step authentication disabled</p>
          </div>
          
          <Button onClick={handleDisableComplete} className="w-full">Done</Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SecurityTab;














































// import React, { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Switch } from "@/components/ui/switch";
// import { Input } from "@/components/ui/input";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// import { CheckCircle, Copy, Loader2 } from "lucide-react";
// import { getAuthToken, getUserInfo } from "@/lib/utils/cookies";
// import { toast } from "@/hooks/use-toast";

// export const SecurityTab: React.FC = () => {
//   const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
//   const [showQRModal, setShowQRModal] = useState(false);
//   const [showCodeEntryModal, setShowCodeEntryModal] = useState(false);
//   const [showEnabledModal, setShowEnabledModal] = useState(false);
//   const [showDisableModal, setShowDisableModal] = useState(false);
//   const [showDisabledModal, setShowDisabledModal] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isVerifying, setIsVerifying] = useState(false);
//   const [qrCodeData, setQrCodeData] = useState("");
//   const [secretKey, setSecretKey] = useState("");
//   const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  
//   useEffect(() => {
//     const checkTwoFactorStatus = async () => {
//       try {
//         const token = getAuthToken();
//         if (!token) {
//           console.log('No auth token found');
//           return;
//         }

//         // In a production app, you would fetch the 2FA status here
//         const response = await fetch('https://be-auth-server.onrender.com/api/v1/accounts/2fa/status', {
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         });

//         if (response.ok) {
//           const data = await response.json();
//           setTwoFactorEnabled(data.data?.twoFactorEnabled || false);
//         } else {
//           console.error('Failed to fetch 2FA status:', response.status);
//         }
//       } catch (error) {
//         console.error("Error checking 2FA status:", error);
//       }
//     };
    
//     checkTwoFactorStatus();
//   }, []);

//   const handleToggle2FA = () => {
//     if (!twoFactorEnabled) {
//       fetchTwoFactorSecret();
//     } else {
//       setShowDisableModal(true);
//     }
//   };
  
//   const fetchTwoFactorSecret = async () => {
//     setIsLoading(true);
//     try {
//       const token = getAuthToken();
//       if (!token) {
//         toast({
//           title: "Authentication Error",
//           description: "You need to be logged in to enable 2FA",
//           variant: "destructive"
//         });
//         return;
//       }
      
//       console.log('Fetching 2FA secret with token');
      
//       const response = await fetch('https://be-auth-server.onrender.com/api/v1/accounts/2fa/secret', {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         credentials: 'include' // Include cookies in the request
//       });
      
//       if (!response.ok) {
//         console.error('2FA secret fetch failed:', response.status, response.statusText);
//         if (response.status === 401) {
//           toast({
//             title: "Session Expired",
//             description: "Please log in again and try enabling 2FA",
//             variant: "destructive"
//           });
//           return;
//         }
        
//         const errorText = await response.text();
//         console.error('Error response:', errorText);
        
//         toast({
//           title: "Error",
//           description: "Failed to fetch 2FA details. Please try again.",
//           variant: "destructive"
//         });
//         return;
//       }
      
//       const data = await response.json();
      
//       if (data.status === 'success') {
//         setQrCodeData(data.data.qrCode);
//         setSecretKey(data.data.secret);
//         console.log('Secret key received successfully');
//         setShowQRModal(true);
//       } else {
//         toast({
//           title: "Error",
//           description: data.message || "Failed to fetch 2FA details",
//           variant: "destructive"
//         });
//       }
//     } catch (error) {
//       console.error("Error fetching 2FA details:", error);
//       toast({
//         title: "Error",
//         description: "Something went wrong. Please try again.",
//         variant: "destructive"
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };
  
//   const handleCodeChange = (index: number, value: string) => {
//     if (/^\d?$/.test(value)) {
//       const newCode = [...verificationCode];
//       newCode[index] = value;
//       setVerificationCode(newCode);
      
//       // Auto-focus next input field
//       if (value !== '' && index < 5) {
//         const nextInput = document.getElementById(`code-${index + 1}`);
//         if (nextInput) nextInput.focus();
//       }
//     }
//   };
  
//   const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
//     // Handle backspace to go to previous input
//     if (e.key === 'Backspace' && index > 0 && verificationCode[index] === '') {
//       const prevInput = document.getElementById(`code-${index - 1}`);
//       if (prevInput) prevInput.focus();
//     }
//   };
  
//   const handleVerifyCode = async () => {
//     const code = verificationCode.join('');
    
//     if (code.length !== 6 || !/^\d+$/.test(code)) {
//       toast({
//         title: "Invalid Code",
//         description: "Please enter a valid 6-digit code",
//         variant: "destructive"
//       });
//       return;
//     }
    
//     setIsVerifying(true);
    
//     try {
//       const token = getAuthToken();
      
//       if (!token) {
//         toast({
//           title: "Authentication Error",
//           description: "You need to be logged in to verify 2FA",
//           variant: "destructive"
//         });
//         setIsVerifying(false);
//         return;
//       }
      
//       const verifyPayload = {
//         token: code,    // The 6-digit code from authenticator app
//         secret: secretKey // The secret from QR code setup
//       };
      
//       console.log('Sending verification request');
      
//       const response = await fetch('https://be-auth-server.onrender.com/api/v1/accounts/2fa/verify', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         credentials: 'include', // Include cookies in the request
//         body: JSON.stringify(verifyPayload)
//       });
      
//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('Verification failed:', response.status, errorText);
        
//         let errorMessage = "Failed to verify code. Please try again.";
//         try {
//           const errorData = JSON.parse(errorText);
//           errorMessage = errorData.message || errorMessage;
//         } catch (e) {
//           // If parsing fails, use the default message
//         }
        
//         toast({
//           title: "Verification Failed",
//           description: errorMessage,
//           variant: "destructive"
//         });
//         return;
//       }
      
//       const data = await response.json();
      
//       if (data.status === 'success') {
//         setShowCodeEntryModal(false);
//         setShowEnabledModal(true);
//         setTwoFactorEnabled(true);
//       } else {
//         toast({
//           title: "Verification Failed",
//           description: data.message || "Invalid verification code. Please try again.",
//           variant: "destructive"
//         });
//       }
//     } catch (error) {
//       console.error("Error verifying 2FA code:", error);
//       toast({
//         title: "Error",
//         description: "Something went wrong. Please try again.",
//         variant: "destructive"
//       });
//     } finally {
//       setIsVerifying(false);
//     }
//   };

//   const handleQRContinue = () => {
//     setShowQRModal(false);
//     setShowCodeEntryModal(true);
//   };
  
//   const handleEnableComplete = () => {
//     setShowEnabledModal(false);
//     setVerificationCode(['', '', '', '', '', '']);
//   };
  
//   const handleDisable = async () => {
//     setIsLoading(true);
//     try {
//       const token = getAuthToken();
//       if (!token) {
//         toast({
//           title: "Authentication Error",
//           description: "You need to be logged in to disable 2FA",
//           variant: "destructive"
//         });
//         return;
//       }
      
//       const response = await fetch('https://be-auth-server.onrender.com/api/v1/accounts/2fa/disable', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         credentials: 'include' // Include cookies in the request
//       });
      
//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('Disable 2FA failed:', response.status, errorText);
        
//         toast({
//           title: "Error",
//           description: "Failed to disable 2FA. Please try again.",
//           variant: "destructive"
//         });
//         return;
//       }
      
//       const data = await response.json();
      
//       if (data.status === 'success') {
//         setShowDisableModal(false);
//         setShowDisabledModal(true);
//       } else {
//         toast({
//           title: "Error",
//           description: data.message || "Failed to disable 2FA",
//           variant: "destructive"
//         });
//       }
//     } catch (error) {
//       console.error("Error disabling 2FA:", error);
//       toast({
//         title: "Error",
//         description: "Failed to disable 2FA. Please try again.",
//         variant: "destructive"
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };
  
//   const handleDisableComplete = () => {
//     setShowDisabledModal(false);
//     setTwoFactorEnabled(false);
//     // Clear stored secret and QR code
//     setSecretKey('');
//     setQrCodeData('');
//   };
  
//   const handleCopySecret = () => {
//     navigator.clipboard.writeText(secretKey);
//     toast({
//       title: "Copied",
//       description: "Secret key copied to clipboard",
//     });
//   };

//   // Handle paste for verification code
//   const handlePaste = (e: React.ClipboardEvent) => {
//     e.preventDefault();
//     const pastedData = e.clipboardData.getData('text');
    
//     // Only process if it's a 6-digit number
//     if (/^\d{6}$/.test(pastedData)) {
//       const newCode = [...verificationCode];
//       for (let i = 0; i < 6; i++) {
//         newCode[i] = pastedData[i] || '';
//       }
//       setVerificationCode(newCode);
//     }
//   };

//   return (
//     <>
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
//         <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
        
//         {/* Two Factor Authentication Section */}
//         <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="font-medium">Setup Two Factor Authentication</h3>
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 Each time you log in, in addition to your password, you'll use an 
//                 authenticator app to generate a one-time code.
//               </p>
//             </div>
//             <Switch 
//               checked={twoFactorEnabled}
//               onCheckedChange={handleToggle2FA}
//               disabled={isLoading}
//             />
//           </div>
//         </div>
        
//         {/* Password Section */}
//         <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="font-medium">Change Password</h3>
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 Update your account password regularly for better security
//               </p>
//             </div>
//             <Button variant="outline">Change Password</Button>
//           </div>
//         </div>
        
//         {/* Login History Section */}
//         <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="font-medium">Login History</h3>
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 View your recent login activity
//               </p>
//             </div>
//             <Button variant="outline">View History</Button>
//           </div>
//         </div>
        
//         <div className="flex items-center justify-between pt-4">
//           <Button variant="outline">Reset Defaults</Button>
//           <Button>Save Changes</Button>
//         </div>
//       </div>

//       {/* QR Code Modal */}
//       <Dialog open={showQRModal} onOpenChange={(open) => {
//         if (!open && !showCodeEntryModal) setIsLoading(false);
//         setShowQRModal(open);
//       }}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle className="text-center">Scan QR Code</DialogTitle>
//             <DialogDescription className="text-center text-xs">
//               Use your authenticator application to scan the QR code.
//             </DialogDescription>
//           </DialogHeader>
          
//           <div className="flex flex-col items-center justify-center py-4">
//             {isLoading ? (
//               <div className="flex items-center justify-center py-8">
//                 <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
//               </div>
//             ) : (
//               <>
//                 <div className="bg-white p-2 rounded mb-4">
//                   {qrCodeData ? (
//                     <img 
//                       src={qrCodeData} 
//                       alt="2FA QR Code" 
//                       className="w-48 h-48 object-contain"
//                     />
//                   ) : (
//                     <div className="w-48 h-48 flex items-center justify-center bg-gray-100">
//                       <p className="text-sm text-gray-400">QR Code not available</p>
//                     </div>
//                   )}
//                 </div>
                
//                 <p className="text-xs text-gray-500 mt-2 mb-1">If unable to scan, use this code manually</p>
                
//                 <div className="flex items-center w-full mb-4">
//                   <div className="relative flex-1">
//                     <Input 
//                       className="text-xs text-center pr-10" 
//                       value={secretKey} 
//                       readOnly 
//                     />
//                     <button 
//                       onClick={handleCopySecret}
//                       className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                       type="button"
//                     >
//                       <Copy size={16} />
//                     </button>
//                   </div>
//                 </div>
//               </>
//             )}
//           </div>
          
//           <Button 
//             onClick={handleQRContinue} 
//             className="w-full"
//             disabled={isLoading || !qrCodeData}
//           >
//             Continue
//           </Button>
//         </DialogContent>
//       </Dialog>

//       {/* 6-Digit Code Entry Modal */}
//       <Dialog open={showCodeEntryModal} onOpenChange={setShowCodeEntryModal}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle className="text-center">Verify Authentication</DialogTitle>
//             <DialogDescription className="text-center text-xs">
//               Enter the 6-digit code displayed in your authenticator app.
//             </DialogDescription>
//           </DialogHeader>
          
//           <div className="flex justify-center space-x-2 py-4" onPaste={handlePaste}>
//             {verificationCode.map((digit, index) => (
//               <Input
//                 key={index}
//                 id={`code-${index}`}
//                 className="w-10 h-10 text-center"
//                 value={digit}
//                 onChange={(e) => handleCodeChange(index, e.target.value)}
//                 onKeyDown={(e) => handleKeyDown(index, e)}
//                 maxLength={1}
//                 inputMode="numeric"
//                 pattern="[0-9]*"
//                 autoComplete="one-time-code"
//                 disabled={isVerifying}
//                 aria-label={`Digit ${index + 1}`}
//               />
//             ))}
//           </div>
          
//           <Button 
//             onClick={handleVerifyCode} 
//             className="w-full"
//             disabled={isVerifying || verificationCode.join('').length !== 6}
//           >
//             {isVerifying ? (
//               <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 Verifying...
//               </>
//             ) : (
//               "Verify"
//             )}
//           </Button>
//         </DialogContent>
//       </Dialog>

//       {/* 2FA Enabled Success Modal */}
//       <Dialog open={showEnabledModal} onOpenChange={setShowEnabledModal}>
//         <DialogContent className="max-w-md">
//           <div className="flex flex-col items-center justify-center py-8">
//             <div className="mb-4 text-green-500">
//               <CheckCircle size={48} />
//             </div>
//             <p className="text-green-500 font-medium">Two-step authentication successfully enabled</p>
//           </div>
          
//           <Button onClick={handleEnableComplete} className="w-full">Done</Button>
//         </DialogContent>
//       </Dialog>

//       {/* Disable 2FA Confirmation Modal */}
//       <Dialog open={showDisableModal} onOpenChange={setShowDisableModal}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle className="text-center">Disable Two-step Authentication</DialogTitle>
//           </DialogHeader>
          
//           <div className="py-4">
//             <p className="text-center">Are you sure you want to disable two-step authentication?</p>
//             <p className="text-center text-sm text-gray-500 mt-2">
//               This will make your account less secure.
//             </p>
//           </div>
          
//           <div className="flex space-x-2">
//             <Button 
//               onClick={() => setShowDisableModal(false)} 
//               variant="outline" 
//               className="flex-1"
//               disabled={isLoading}
//             >
//               Cancel
//             </Button>
//             <Button 
//               onClick={handleDisable} 
//               variant="destructive" 
//               className="flex-1"
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Disabling...
//                 </>
//               ) : (
//                 "Disable"
//               )}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* 2FA Disabled Success Modal */}
//       <Dialog open={showDisabledModal} onOpenChange={setShowDisabledModal}>
//         <DialogContent className="max-w-md">
//           <div className="flex flex-col items-center justify-center py-8">
//             <div className="mb-4 text-gray-500">
//               <CheckCircle size={48} />
//             </div>
//             <p className="text-gray-500 font-medium">Two-step authentication disabled</p>
//           </div>
          
//           <Button onClick={handleDisableComplete} className="w-full">Done</Button>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// };

// export default SecurityTab;











































// import React, { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Switch } from "@/components/ui/switch";
// import { Input } from "@/components/ui/input";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// import { CheckCircle, Copy, Loader2 } from "lucide-react";
// import { getAuthToken, getUserInfo } from "@/lib/utils/cookies";
// import { toast } from "@/hooks/use-toast";

// export const SecurityTab: React.FC = () => {
//   const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
//   // Modal states
//   const [showQRModal, setShowQRModal] = useState(false);
//   const [showCodeEntryModal, setShowCodeEntryModal] = useState(false);
//   const [showEnabledModal, setShowEnabledModal] = useState(false);
//   const [showDisableModal, setShowDisableModal] = useState(false);
//   const [showDisabledModal, setShowDisabledModal] = useState(false);
  
//   // Loading states
//   const [isLoading, setIsLoading] = useState(false);
//   const [isVerifying, setIsVerifying] = useState(false);
  
//   // 2FA data states
//   const [qrCodeData, setQrCodeData] = useState("");
//   const [secretKey, setSecretKey] = useState("");
  
//   // Verification code state
//   const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  
//   // Toggle 2FA state
//   const handleToggle2FA = () => {
//     if (!twoFactorEnabled) {
//       // Enable flow: Fetch QR code and show modal
//       fetchTwoFactorSecret();
//     } else {
//       // Disable flow: Show confirmation modal
//       setShowDisableModal(true);
//     }
//   };
  
//   // Fetch 2FA secret and QR code from backend
//   const fetchTwoFactorSecret = async () => {
//     setIsLoading(true);
//     try {
//       const token = getAuthToken();
//       if (!token) {
//         toast({
//           title: "Authentication Error",
//           description: "You need to be logged in to enable 2FA",
//           variant: "destructive"
//         });
//         return;
//       }
      
//       const response = await fetch('https://be-auth-server.onrender.com/api/v1/accounts/2fa/secret', {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         }
//       });
      
//       const data = await response.json();
      
//       if (data.status === 'success') {
//         setQrCodeData(data.data.qrCode);
//         setSecretKey(data.data.secret);
//         setShowQRModal(true);
//       } else {
//         toast({
//           title: "Error",
//           description: data.message || "Failed to fetch 2FA details",
//           variant: "destructive"
//         });
//       }
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Something went wrong. Please try again.",
//         variant: "destructive"
//       });
//       console.error("Error fetching 2FA details:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };
  
//   // Handle verification code input
//   const handleCodeChange = (index: number, value: string) => {
//     // Only allow numbers and limit to 1 character
//     if (/^\d?$/.test(value)) {
//       const newCode = [...verificationCode];
//       newCode[index] = value;
//       setVerificationCode(newCode);
      
//       // Auto-focus next input if value is filled
//       if (value !== '' && index < 5) {
//         const nextInput = document.getElementById(`code-${index + 1}`);
//         if (nextInput) nextInput.focus();
//       }
//     }
//   };
  
//   // Handle verification code submission
//   const handleVerifyCode = async () => {
//     const code = verificationCode.join('');
    
//     // Validate code format
//     if (code.length !== 6 || !/^\d+$/.test(code)) {
//       toast({
//         title: "Invalid Code",
//         description: "Please enter a valid 6-digit code",
//         variant: "destructive"
//       });
//       return;
//     }
    
//     setIsVerifying(true);
    
//     try {
//       const token = getAuthToken();
//       if (!token) {
//         toast({
//           title: "Authentication Error",
//           description: "You need to be logged in to verify 2FA",
//           variant: "destructive"
//         });
//         return;
//       }
      
//       const response = await fetch('https://be-auth-server.onrender.com/api/v1/accounts/2fa/verify', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({
//           token: code,
//           secret: secretKey
//         })
//       });
      
//       const data = await response.json();
      
//       if (data.status === 'success') {
//         setShowCodeEntryModal(false);
//         setShowEnabledModal(true);
//       } else {
//         toast({
//           title: "Verification Failed",
//           description: data.message || "Invalid verification code. Please try again.",
//           variant: "destructive"
//         });
//       }
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Something went wrong. Please try again.",
//         variant: "destructive"
//       });
//       console.error("Error verifying 2FA code:", error);
//     } finally {
//       setIsVerifying(false);
//     }
//   };
  
//   // Handle QR code scanning completion
//   const handleQRContinue = () => {
//     setShowQRModal(false);
//     setShowCodeEntryModal(true);
//   };
  
//   // Handle enabling 2FA
//   const handleEnableComplete = () => {
//     setShowEnabledModal(false);
//     setTwoFactorEnabled(true);
//     // Reset verification code
//     setVerificationCode(['', '', '', '', '', '']);
//   };
  
//   // Handle disabling 2FA
//   const handleDisable = async () => {
//     // Here you would add the API call to disable 2FA
//     // For demo purposes, we'll just proceed to the next step
//     // In a real implementation, you would call an endpoint like:
//     // POST https://api/v1/accounts/disable-2fa with appropriate authentication
    
//     setShowDisableModal(false);
//     setShowDisabledModal(true);
//   };
  
//   // Handle disable completion
//   const handleDisableComplete = () => {
//     setShowDisabledModal(false);
//     setTwoFactorEnabled(false);
//   };
  
//   // Handle copy to clipboard
//   const handleCopySecret = () => {
//     navigator.clipboard.writeText(secretKey);
//     toast({
//       title: "Copied",
//       description: "Secret key copied to clipboard",
//     });
//   };

//   // Check if 2FA is enabled on component mount
//   useEffect(() => {
//     const checkTwoFactorStatus = async () => {
//       try {
//         const token = getAuthToken();
//         if (!token) return;
        
//         // You would typically have an API endpoint to check 2FA status
//         // For example: GET https://api/v1/accounts/2fa-status
        
//         // For now, we'll just leave it as false
//         // In a real implementation, you would fetch and set the actual status
//       } catch (error) {
//         console.error("Error checking 2FA status:", error);
//       }
//     };
    
//     checkTwoFactorStatus();
//   }, []);

//   return (
//     <>
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
//         <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
        
//         {/* Two Factor Authentication Section */}
//         <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="font-medium">Setup Two Factor Authentication</h3>
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 Each time you log in, in addition to your password, you'll use an 
//                 authenticator app to generate a one-time code.
//               </p>
//             </div>
//             <Switch 
//               checked={twoFactorEnabled}
//               onCheckedChange={handleToggle2FA}
//               disabled={isLoading}
//             />
//           </div>
//         </div>
        
//         {/* Password Section */}
//         <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="font-medium">Change Password</h3>
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 Update your account password regularly for better security
//               </p>
//             </div>
//             <Button variant="outline">Change Password</Button>
//           </div>
//         </div>
        
//         {/* Login History Section */}
//         <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="font-medium">Login History</h3>
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 View your recent login activity
//               </p>
//             </div>
//             <Button variant="outline">View History</Button>
//           </div>
//         </div>
        
//         <div className="flex items-center justify-between pt-4">
//           <Button variant="outline">Reset Defaults</Button>
//           <Button>Save Changes</Button>
//         </div>
//       </div>

//       {/* QR Code Modal */}
//       <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle className="text-center">Scan QR Code</DialogTitle>
//             <DialogDescription className="text-center text-xs">
//               Use your authenticator application to scan the QR code.
//             </DialogDescription>
//           </DialogHeader>
          
//           <div className="flex flex-col items-center justify-center py-4">
//             {isLoading ? (
//               <div className="flex items-center justify-center py-8">
//                 <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
//               </div>
//             ) : (
//               <>
//                 <div className="bg-white p-2 rounded mb-4">
//                   {/* Display the actual QR code from the API */}
//                   <img 
//                     src={qrCodeData} 
//                     alt="2FA QR Code" 
//                     className="w-48 h-48 object-contain"
//                   />
//                 </div>
                
//                 <p className="text-xs text-gray-500 mt-2 mb-1">If unable to scan, use this code manually</p>
                
//                 <div className="flex items-center w-full mb-4">
//                   <div className="relative flex-1">
//                     <Input 
//                       className="text-xs text-center pr-10" 
//                       value={secretKey} 
//                       readOnly 
//                     />
//                     <button 
//                       onClick={handleCopySecret}
//                       className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                     >
//                       <Copy size={16} />
//                     </button>
//                   </div>
//                 </div>
//               </>
//             )}
//           </div>
          
//           <Button 
//             onClick={handleQRContinue} 
//             className="w-full"
//             disabled={isLoading || !qrCodeData}
//           >
//             Continue
//           </Button>
//         </DialogContent>
//       </Dialog>

//       {/* 6-Digit Code Entry Modal */}
//       <Dialog open={showCodeEntryModal} onOpenChange={setShowCodeEntryModal}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle className="text-center">Verify Authentication</DialogTitle>
//             <DialogDescription className="text-center text-xs">
//               Enter the 6-digit code displayed in your authenticator app.
//             </DialogDescription>
//           </DialogHeader>
          
//           <div className="flex justify-center space-x-2 py-4">
//             {verificationCode.map((digit, index) => (
//               <Input
//                 key={index}
//                 id={`code-${index}`}
//                 className="w-10 h-10 text-center"
//                 value={digit}
//                 onChange={(e) => handleCodeChange(index, e.target.value)}
//                 maxLength={1}
//                 disabled={isVerifying}
//               />
//             ))}
//           </div>
          
//           <Button 
//             onClick={handleVerifyCode} 
//             className="w-full"
//             disabled={isVerifying || verificationCode.join('').length !== 6}
//           >
//             {isVerifying ? (
//               <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 Verifying...
//               </>
//             ) : (
//               "Verify"
//             )}
//           </Button>
//         </DialogContent>
//       </Dialog>

//       {/* 2FA Enabled Success Modal */}
//       <Dialog open={showEnabledModal} onOpenChange={setShowEnabledModal}>
//         <DialogContent className="max-w-md">
//           <div className="flex flex-col items-center justify-center py-8">
//             <div className="mb-4 text-green-500">
//               <CheckCircle size={48} />
//             </div>
//             <p className="text-green-500 font-medium">Two-step authentication successfully enabled</p>
//           </div>
          
//           <Button onClick={handleEnableComplete} className="w-full">Done</Button>
//         </DialogContent>
//       </Dialog>

//       {/* Disable 2FA Confirmation Modal */}
//       <Dialog open={showDisableModal} onOpenChange={setShowDisableModal}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle className="text-center">Disable Two-step Authentication</DialogTitle>
//           </DialogHeader>
          
//           <div className="py-4">
//             <p className="text-center">Are you sure you want to disable two-step authentication?</p>
//           </div>
          
//           <Button onClick={handleDisable} variant="destructive" className="w-full">Disable</Button>
//         </DialogContent>
//       </Dialog>

//       {/* 2FA Disabled Success Modal */}
//       <Dialog open={showDisabledModal} onOpenChange={setShowDisabledModal}>
//         <DialogContent className="max-w-md">
//           <div className="flex flex-col items-center justify-center py-8">
//             <div className="mb-4 text-gray-500">
//               <CheckCircle size={48} />
//             </div>
//             <p className="text-gray-500 font-medium">Two-step authentication disabled</p>
//           </div>
          
//           <Button onClick={handleDisableComplete} className="w-full">Done</Button>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// };

// export default SecurityTab;



































// import React, { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Switch } from "@/components/ui/switch";
// import { Input } from "@/components/ui/input";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import { CheckCircle } from "lucide-react";

// export const SecurityTab: React.FC = () => {
//   const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
//   // Modal states
//   const [showQRModal, setShowQRModal] = useState(false);
//   const [showCodeEntryModal, setShowCodeEntryModal] = useState(false);
//   const [showEnabledModal, setShowEnabledModal] = useState(false);
//   const [showDisableModal, setShowDisableModal] = useState(false);
//   const [showDisabledModal, setShowDisabledModal] = useState(false);
  
//   // Verification code state
//   const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  
//   // Toggle 2FA state
//   const handleToggle2FA = () => {
//     if (!twoFactorEnabled) {
//       // Enable flow: Show QR code modal first
//       setShowQRModal(true);
//     } else {
//       // Disable flow: Show confirmation modal
//       setShowDisableModal(true);
//     }
//   };
  
//   // Handle verification code input
//   const handleCodeChange = (index: number, value: string) => {
//     // Only allow numbers and limit to 1 character
//     if (/^\d?$/.test(value)) {
//       const newCode = [...verificationCode];
//       newCode[index] = value;
//       setVerificationCode(newCode);
      
//       // Auto-focus next input if value is filled
//       if (value !== '' && index < 5) {
//         const nextInput = document.getElementById(`code-${index + 1}`);
//         if (nextInput) nextInput.focus();
//       }
//     }
//   };
  
//   // Handle verification code submission
//   const handleVerifyCode = () => {
//     // Here you would verify the code with your backend
//     // For demo purposes, we'll just move to the next step
//     setShowCodeEntryModal(false);
//     setShowEnabledModal(true);
//   };
  
//   // Handle QR code scanning completion
//   const handleQRContinue = () => {
//     setShowQRModal(false);
//     setShowCodeEntryModal(true);
//   };
  
//   // Handle enabling 2FA
//   const handleEnableComplete = () => {
//     setShowEnabledModal(false);
//     setTwoFactorEnabled(true);
//   };
  
//   // Handle disabling 2FA
//   const handleDisable = () => {
//     setShowDisableModal(false);
//     setShowDisabledModal(true);
//   };
  
//   // Handle disable completion
//   const handleDisableComplete = () => {
//     setShowDisabledModal(false);
//     setTwoFactorEnabled(false);
//   };

//   return (
//     <>
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
//         <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
        
//         {/* Two Factor Authentication Section */}
//         <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="font-medium">Setup Two Factor Authentication</h3>
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 Each time you log in, in addition to your password, you'll use an 
//                 authenticator app to generate a one-time code.
//               </p>
//             </div>
//             <Switch 
//               checked={twoFactorEnabled}
//               onCheckedChange={handleToggle2FA}
//             />
//           </div>
//         </div>
        
//         {/* Password Section */}
//         <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="font-medium">Change Password</h3>
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 Update your account password regularly for better security
//               </p>
//             </div>
//             <Button variant="outline">Change Password</Button>
//           </div>
//         </div>
        
//         {/* Login History Section */}
//         <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="font-medium">Login History</h3>
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 View your recent login activity
//               </p>
//             </div>
//             <Button variant="outline">View History</Button>
//           </div>
//         </div>
        
//         <div className="flex items-center justify-between pt-4">
//           <Button variant="outline">Reset Defaults</Button>
//           <Button>Save Changes</Button>
//         </div>
//       </div>

//       {/* QR Code Modal */}
//       <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle className="text-center">Scan QR Code</DialogTitle>
//             <DialogDescription className="text-center text-xs">
//               Use your QR code scanner or authenticator application to scan the QR code. Use this step for all your accounts.
//             </DialogDescription>
//           </DialogHeader>
          
//           <div className="flex flex-col items-center justify-center py-4">
//             <div className="bg-white p-2 rounded">
//               {/* Replace with actual QR code component or image */}
//               <div className="w-32 h-32 border border-black relative">
//                 {/* This is a placeholder for the QR code */}
//                 <div className="absolute inset-6 border-4 border-black grid grid-cols-3 grid-rows-3">
//                   <div className="border-4 border-black col-span-1 row-span-1"></div>
//                   <div className="col-span-1 row-span-1"></div>
//                   <div className="border-4 border-black col-span-1 row-span-1"></div>
//                   <div className="col-span-1 row-span-1"></div>
//                   <div className="border-4 border-black col-span-1 row-span-1"></div>
//                   <div className="col-span-1 row-span-1"></div>
//                   <div className="border-4 border-black col-span-1 row-span-1"></div>
//                   <div className="col-span-1 row-span-1"></div>
//                   <div className="col-span-1 row-span-1"></div>
//                 </div>
//               </div>
//             </div>
            
//             <p className="text-xs text-gray-500 mt-4">If unable to scan, use this code manually</p>
            
//             <div className="flex mt-2">
//               <Input className="text-xs text-center" value="HGXDGJ3355DGFD" readOnly />
//             </div>
//           </div>
          
//           <Button onClick={handleQRContinue} className="w-full">Continue</Button>
//         </DialogContent>
//       </Dialog>

//       {/* 6-Digit Code Entry Modal */}
//       <Dialog open={showCodeEntryModal} onOpenChange={setShowCodeEntryModal}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle className="text-center">Scan QR Code</DialogTitle>
//             <DialogDescription className="text-center text-xs">
//               Enter the 6-digit code displayed in your authenticator app when prompted by the form.
//             </DialogDescription>
//           </DialogHeader>
          
//           <div className="flex justify-center space-x-2 py-4">
//             {verificationCode.map((digit, index) => (
//               <Input
//                 key={index}
//                 id={`code-${index}`}
//                 className="w-10 h-10 text-center"
//                 value={digit}
//                 onChange={(e) => handleCodeChange(index, e.target.value)}
//                 maxLength={1}
//               />
//             ))}
//           </div>
          
//           <Button onClick={handleVerifyCode} className="w-full">Done</Button>
//         </DialogContent>
//       </Dialog>

//       {/* 2FA Enabled Success Modal */}
//       <Dialog open={showEnabledModal} onOpenChange={setShowEnabledModal}>
//         <DialogContent className="max-w-md">
//           <div className="flex flex-col items-center justify-center py-8">
//             <div className="mb-4 text-green-500">
//               <CheckCircle size={48} />
//             </div>
//             <p className="text-green-500 font-medium">Two-step authentication successfully enabled</p>
//           </div>
          
//           <Button onClick={handleEnableComplete} className="w-full">Done</Button>
//         </DialogContent>
//       </Dialog>

//       {/* Disable 2FA Confirmation Modal */}
//       <Dialog open={showDisableModal} onOpenChange={setShowDisableModal}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle className="text-center">Disable Two-step Authentication</DialogTitle>
//           </DialogHeader>
          
//           <div className="py-4">
//             <p className="text-center">Are you sure you want to disable two-step authentication?</p>
//           </div>
          
//           <Button onClick={handleDisable} variant="destructive" className="w-full">Disable</Button>
//         </DialogContent>
//       </Dialog>

//       {/* 2FA Disabled Success Modal */}
//       <Dialog open={showDisabledModal} onOpenChange={setShowDisabledModal}>
//         <DialogContent className="max-w-md">
//           <div className="flex flex-col items-center justify-center py-8">
//             <div className="mb-4 text-gray-500">
//               <CheckCircle size={48} />
//             </div>
//             <p className="text-gray-500 font-medium">Two-step authentication disabled</p>
//           </div>
          
//           <Button onClick={handleDisableComplete} className="w-full">Done</Button>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// };

// export default SecurityTab;