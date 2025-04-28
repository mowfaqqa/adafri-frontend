import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle, Copy, Loader2 } from "lucide-react";
import { getAuthToken, getUserInfo, getCookie } from "@/lib/utils/cookies";
import { toast } from "@/hooks/use-toast";

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
  
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      console.log('Auth token status:', token ? 'Token exists' : 'No token found');
      
      if (token) {
        // Check 2FA status on component mount
        try {
          // You would typically have an API endpoint to check 2FA status
          // For example: GET https://api/v1/accounts/2fa-status
          // const response = await fetch('https://be-auth-server.onrender.com/api/v1/accounts/2fa/status', {
          //   headers: { 'Authorization': `Bearer ${token}` }
          // });
          // const data = await response.json();
          // setTwoFactorEnabled(data.data.twoFactorEnabled);
        } catch (error) {
          console.error("Error checking 2FA status:", error);
        }
      }
    };
    
    checkAuth();
  }, []);

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
      const token = getAuthToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You need to be logged in to enable 2FA",
          variant: "destructive"
        });
        return;
      }
      
      console.log('Fetching 2FA secret with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch('https://be-auth-server.onrender.com/api/v1/accounts/2fa/secret', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('2FA secret fetch failed:', response.status, response.statusText);
        if (response.status === 401) {
          toast({
            title: "Session Expired",
            description: "Please log in again and try enabling 2FA",
            variant: "destructive"
          });
          return;
        }
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setQrCodeData(data.data.qrCode);
        setSecretKey(data.data.secret);
        console.log('Secret key set:', data.data.secret ? 'Yes' : 'No');
        setShowQRModal(true);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch 2FA details",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
      console.error("Error fetching 2FA details:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCodeChange = (index: number, value: string) => {
    if (/^\d?$/.test(value)) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
      
      if (value !== '' && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
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
      const token = getAuthToken();
      
      // Debug the token retrieval
      console.log('Token retrieval check:');
      console.log('- AccessToken from cookie:', getCookie('accessToken'));
      console.log('- Legacy token from cookie:', getCookie('__frsadfrusrtkn'));
      console.log('- Final token from getAuthToken():', token);
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You need to be logged in to verify 2FA",
          variant: "destructive"
        });
        return;
      }
      
      // Try to decode and inspect the token (JWT)
      if (token.includes('.')) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const decodedPayload = JSON.parse(atob(parts[1]));
            console.log('Token payload:', decodedPayload);
            console.log('Token expiration:', new Date(decodedPayload.exp * 1000));
            console.log('Current time:', new Date());
            
            // Check if token has expired
            if (decodedPayload.exp * 1000 < Date.now()) {
              toast({
                title: "Session Expired",
                description: "Your session has expired. Please log in again.",
                variant: "destructive"
              });
              return;
            }
          }
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }
      
      const verifyPayload = {
        token: code,    // The 6-digit code from authenticator app
        secret: secretKey // The secret from QR code setup
      };
      
      console.log('Verification payload:', verifyPayload);
      console.log('Secret key:', secretKey);
      
      // Build and log request details
      const url = 'https://be-auth-server.onrender.com/api/v1/accounts/2fa/verify';
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      console.log('Request URL:', url);
      console.log('Request headers:', headers);
      console.log('Request body:', JSON.stringify(verifyPayload));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(verifyPayload)
      });
      
      console.log('Response status:', response.status);
      
      // If response is not OK, get more details about the error
      if (!response.ok) {
        const rawErrorText = await response.text();
        console.error('Raw error response:', rawErrorText);
        
        // Try to parse as JSON if possible
        let errorData;
        try {
          errorData = JSON.parse(rawErrorText);
          console.error('Parsed error data:', errorData);
        } catch (e) {
          console.error('Error response is not JSON');
        }
        
        if (response.status === 401) {
          // Check if it's a token format issue or actual authentication issue
          console.log('Authorization header sent:', headers.Authorization);
          
          toast({
            title: "Authentication Failed",
            description: errorData?.message || "Invalid token. Please log in again.",
            variant: "destructive"
          });
          return;
        }
        
        toast({
          title: "Verification Failed",
          description: errorData?.message || "Failed to verify code. Please try again.",
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
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
      console.error("Error verifying 2FA code:", error);
    } finally {
      setIsVerifying(false);
    }
  };
  // const handleVerifyCode = async () => {
  //   const code = verificationCode.join('');
    
  //   if (code.length !== 6 || !/^\d+$/.test(code)) {
  //     toast({
  //       title: "Invalid Code",
  //       description: "Please enter a valid 6-digit code",
  //       variant: "destructive"
  //     });
  //     return;
  //   }
    
  //   setIsVerifying(true);
    
  //   try {
  //     const token = getAuthToken();
  //     if (!token) {
  //       toast({
  //         title: "Authentication Error",
  //         description: "You need to be logged in to verify 2FA",
  //         variant: "destructive"
  //       });
  //       return;
  //     }
      
  //     console.log('Verifying with token:', token ? 'Token exists' : 'No token');
  //     console.log('Secret key for verification:', secretKey ? 'Present' : 'Missing');
      
  //     const verifyPayload = {
  //       token: code,
  //       secret: secretKey
  //     };
      
  //     console.log('Verification payload:', verifyPayload);
      
  //     const response = await fetch('https://be-auth-server.onrender.com/api/v1/accounts/2fa/verify', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`
  //       },
  //       body: JSON.stringify(verifyPayload)
  //     });
      
  //     console.log('Verify response status:', response.status);
  //     console.log('Verifying with token:', token ? 'Token exists' : 'No token');

      
  //     if (!response.ok) {
  //       console.error('Verification failed:', response.status, response.statusText);
  //       if (response.status === 401) {
  //         toast({
  //           title: "Session Expired",
  //           description: "Please log in again and try enabling 2FA",
  //           variant: "destructive"
  //         });
  //         return;
  //       }
  //     }
      
  //     const data = await response.json();
  //     console.log('Verification response data:', data);
      
  //     if (data.status === 'success') {
  //       setShowCodeEntryModal(false);
  //       setShowEnabledModal(true);
  //       setTwoFactorEnabled(true);
  //     } else {
  //       toast({
  //         title: "Verification Failed",
  //         description: data.message || "Invalid verification code. Please try again.",
  //         variant: "destructive"
  //       });
  //     }
  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: "Something went wrong. Please try again.",
  //       variant: "destructive"
  //     });
  //     console.error("Error verifying 2FA code:", error);
  //   } finally {
  //     setIsVerifying(false);
  //   }
  // };
  
  const handleQRContinue = () => {
    setShowQRModal(false);
    setShowCodeEntryModal(true);
  };
  
  const handleEnableComplete = () => {
    setShowEnabledModal(false);
    setVerificationCode(['', '', '', '', '', '']);
  };
  
  const handleDisable = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You need to be logged in to disable 2FA",
          variant: "destructive"
        });
        return;
      }
      
      // You would typically call an API endpoint to disable 2FA
      // const response = await fetch('https://be-auth-server.onrender.com/api/v1/accounts/2fa/disable', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${token}`
      //   }
      // });
      
      // For demo purposes, we'll just proceed
      setShowDisableModal(false);
      setShowDisabledModal(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disable 2FA. Please try again.",
        variant: "destructive"
      });
      console.error("Error disabling 2FA:", error);
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
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
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
                  <img 
                    src={qrCodeData} 
                    alt="2FA QR Code" 
                    className="w-48 h-48 object-contain"
                  />
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
          
          <div className="flex justify-center space-x-2 py-4">
            {verificationCode.map((digit, index) => (
              <Input
                key={index}
                id={`code-${index}`}
                className="w-10 h-10 text-center"
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                maxLength={1}
                disabled={isVerifying}
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
          </div>
          
          <Button onClick={handleDisable} variant="destructive" className="w-full">Disable</Button>
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