"use client";
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCookie, setCookie, getAuthToken } from "@/lib/utils/cookies";

// Explicitly define allowed providers
const ALLOWED_PROVIDERS = [
    "gmail", 
    "outlook", 
    "yahoo", 
    "custom", 
    "googleWorkspace"
];

interface EmailProviderMap {
    [domain: string]: string;
}

// Define Email account interface
interface LinkedEmail {
    id: string;
    email: string;
    provider: string;
    imapHost?: string;
    imapPort?: number;
    smtpHost?: string;
    smtpPort?: number;
    // Add other fields as needed
}

// Email provider detection configuration
const EMAIL_PROVIDERS: EmailProviderMap = {
    "gmail.com": "gmail",
    "googlemail.com": "gmail",
    "outlook.com": "outlook",
    "hotmail.com": "outlook",
    "live.com": "outlook", 
    "msn.com": "outlook",
    "yahoo.com": "yahoo",
    "yahoo.co.uk": "yahoo",
    "ymail.com": "yahoo",
};

export function LinkEmailModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [emailCredentials, setEmailCredentials] = useState({
        email: "",
        password: "",
        provider: "custom", // Default to custom
        imapHost: "",
        imapPort: 993,
        smtpHost: "",
        smtpPort: 587
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const [linkedEmail, setLinkedEmail] = useState<LinkedEmail | null>(null);
    const [fetchingLinkedEmail, setFetchingLinkedEmail] = useState(false);

    // Fetch linked email on component mount
    useEffect(() => {
        fetchLinkedEmail();
    }, []);

    // Function to fetch linked email
    const fetchLinkedEmail = async () => {
        try {
            setFetchingLinkedEmail(true);
            
            // Get access token
            const accessToken = getAuthToken();
            if (!accessToken) {
                console.log('User not logged in, cannot fetch linked email');
                return;
            }

            const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch linked email');
            }

            const data = await response.json();
            console.log('Fetched linked email:', data);

            // Check if there's a linked email account
            if (data && data.data && data.data.length > 0) {
                const emailAccount = data.data[0]; // Get first linked email
                setLinkedEmail(emailAccount);
                
                // Store linked email ID in cookie
                if (emailAccount.id) {
                    setCookie('linkedEmailId', emailAccount.id);
                    console.log('Stored linked email ID in cookie:', emailAccount.id);
                }
            }
        } catch (error) {
            console.error('Error fetching linked email:', error);
        } finally {
            setFetchingLinkedEmail(false);
        }
    };

    // Detect provider from email address
    const detectProviderFromEmail = (email: string): string | null => {
        if (!email || !email.includes('@')) return null;
        
        const domain = email.split('@')[1].toLowerCase().trim();
      
        // Return provider if in predefined list, otherwise return null
        return EMAIL_PROVIDERS[domain] || null;
    };

    // Update email and check provider
    const handleEmailChange = (email: string) => {
        const detectedProvider = detectProviderFromEmail(email);
        
        const newCredentials = { 
            ...emailCredentials, 
            email,
            provider: detectedProvider || "custom" // Default to custom if no provider detected
        };
        
        // Show advanced settings for unknown providers
        setShowAdvancedSettings(detectedProvider === null);
        
        setEmailCredentials(newCredentials);
        console.log("Updated credentials:", newCredentials);
    };

    const handleLinkEmail = async () => {
        // Reset messages
        setErrorMessage('');
        setSuccessMessage('');
    
        // Basic validation
        if (!emailCredentials.email || !emailCredentials.password) {
            setErrorMessage('Please enter both email and password');
            return;
        }
    
        // Validation for custom providers
        if (showAdvancedSettings) {
            if (!emailCredentials.imapHost || !emailCredentials.smtpHost) {
                setErrorMessage('Please enter IMAP and SMTP server details');
                return;
            }
        }
    
        try {
            setIsLoading(true);
    
            // Get access token using the correct function
            const accessToken = getAuthToken();
            console.log('Access token from cookie:', accessToken);
            
            if (!accessToken) {
                throw new Error('You must be logged in to link an email');
            }
    
            // Ensure provider is valid
            const provider = emailCredentials.provider || "custom";
            
            // Validate provider
            if (!ALLOWED_PROVIDERS.includes(provider)) {
                throw new Error(`Invalid provider. Must be one of: ${ALLOWED_PROVIDERS.join(', ')}`);
            }
    
            // Prepare request payload
            const requestPayload = {
                provider,
                email: emailCredentials.email,
                password: emailCredentials.password,
                ...(showAdvancedSettings && {
                    imapHost: emailCredentials.imapHost,
                    imapPort: Number(emailCredentials.imapPort),
                    smtpHost: emailCredentials.smtpHost,
                    smtpPort: Number(emailCredentials.smtpPort)
                })
            };
    
            console.log('Sending request payload:', JSON.stringify(requestPayload));
    
            // Use the accessToken from getAuthToken() function
            const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(requestPayload),
            });
    
            // Check response
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to link email');
            }
    
            const data = await response.json();
            console.log('Email linked successfully:', data);
    
            // Store linked email ID
            if (data.id) {
                setCookie('linkedEmailId', data.id);
            } else if (data.data && data.data.id) {
                setCookie('linkedEmailId', data.data.id);
            }
            
            // Fetch the linked email to update our state
            await fetchLinkedEmail();
    
            // Show success and reset
            setSuccessMessage('Email linked successfully!');
            setEmailCredentials({
                email: "",
                password: "",
                provider: "custom",
                imapHost: "",
                imapPort: 993,
                smtpHost: "",
                smtpPort: 587
            });
            setShowAdvancedSettings(false);
    
            // Close modal after delay
            setTimeout(() => {
                setIsOpen(false);
                setSuccessMessage('');
            }, 2000);
    
        } catch (error) {
            console.error('Error linking email:', error);
            setErrorMessage(
                error instanceof Error 
                    ? error.message 
                    : 'Failed to link email. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Display different button text based on linked email status
    const getButtonText = () => {
        if (fetchingLinkedEmail) {
            return "Checking...";
        }
        if (linkedEmail) {
            return "Update Email";
        }
        return "Link Email";
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setIsOpen(true)}
            >
                <Mail className="w-4 h-4 mr-2" />
                {getButtonText()}
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {linkedEmail ? "Update Email Account" : "Link Email Account"}
                        </DialogTitle>
                        <DialogDescription>
                            {linkedEmail 
                                ? `Currently linked to ${linkedEmail.email}. You can update your settings or link a different account.` 
                                : "Connect your email account to enable automated email processing."}
                        </DialogDescription>
                    </DialogHeader>

                    {errorMessage && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                    )}

                    {successMessage && (
                        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                            <AlertDescription>{successMessage}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={emailCredentials.email}
                                onChange={(e) => handleEmailChange(e.target.value)}
                                placeholder={linkedEmail ? linkedEmail.email : "youremail@example.com"}
                                className="col-span-3"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={emailCredentials.password}
                                onChange={(e) =>
                                    setEmailCredentials({
                                        ...emailCredentials,
                                        password: e.target.value,
                                    })
                                }
                                className="col-span-3"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Display detected provider */}
                        {emailCredentials.provider && !showAdvancedSettings && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right text-sm text-gray-500">
                                    Provider:
                                </div>
                                <div className="col-span-3 text-sm">
                                    <span className="font-medium capitalize">
                                        {emailCredentials.provider}
                                    </span>
                                    <span className="text-gray-500 ml-1">
                                        {emailCredentials.provider === 'custom' 
                                            ? 'custom/unknown provider' 
                                            : 'detected'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Advanced settings for custom email providers */}
                        {showAdvancedSettings && (
                            <>
                                <div className="grid grid-cols-1 gap-2 mt-2">
                                    <div className="text-sm font-medium text-gray-500 mb-2">
                                        Custom Server Settings
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="imapHost" className="text-right">
                                            IMAP Host
                                        </Label>
                                        <Input
                                            id="imapHost"
                                            type="text"
                                            value={emailCredentials.imapHost}
                                            onChange={(e) =>
                                                setEmailCredentials({
                                                    ...emailCredentials,
                                                    imapHost: e.target.value,
                                                })
                                            }
                                            placeholder="imap.example.com"
                                            className="col-span-3"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="imapPort" className="text-right">
                                            IMAP Port
                                        </Label>
                                        <Input
                                            id="imapPort"
                                            type="number"
                                            value={emailCredentials.imapPort}
                                            onChange={(e) =>
                                                setEmailCredentials({
                                                    ...emailCredentials,
                                                    imapPort: parseInt(e.target.value) || 993,
                                                })
                                            }
                                            className="col-span-3"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="smtpHost" className="text-right">
                                            SMTP Host
                                        </Label>
                                        <Input
                                            id="smtpHost"
                                            type="text"
                                            value={emailCredentials.smtpHost}
                                            onChange={(e) =>
                                                setEmailCredentials({
                                                    ...emailCredentials,
                                                    smtpHost: e.target.value,
                                                })
                                            }
                                            placeholder="smtp.example.com"
                                            className="col-span-3"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="smtpPort" className="text-right">
                                            SMTP Port
                                        </Label>
                                        <Input
                                            id="smtpPort"
                                            type="number"
                                            value={emailCredentials.smtpPort}
                                            onChange={(e) =>
                                                setEmailCredentials({
                                                    ...emailCredentials,
                                                    smtpPort: parseInt(e.target.value) || 587,
                                                })
                                            }
                                            className="col-span-3"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleLinkEmail}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Linking...' : linkedEmail ? 'Update Account' : 'Link Account'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
































// "use client";
// import { useState, useEffect } from "react";
// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
//     DialogFooter,
//     DialogDescription,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Mail } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { getCookie, setCookie, getAuthToken } from "@/lib/utils/cookies";

// // Explicitly define allowed providers
// const ALLOWED_PROVIDERS = [
//     "gmail", 
//     "outlook", 
//     "yahoo", 
//     "custom", 
//     "googleWorkspace"
// ];

// interface EmailProviderMap {
//     [domain: string]: string;
// }

// // interface EmailCardProps {
// //   email: Email;
// //   index: number;
// // }

// // Email provider detection configuration
// const EMAIL_PROVIDERS: EmailProviderMap = {
//     "gmail.com": "gmail",
//     "googlemail.com": "gmail",
//     "outlook.com": "outlook",
//     "hotmail.com": "outlook",
//     "live.com": "outlook", 
//     "msn.com": "outlook",
//     "yahoo.com": "yahoo",
//     "yahoo.co.uk": "yahoo",
//     "ymail.com": "yahoo",
// };

// export function LinkEmailModal() {
//     const [isOpen, setIsOpen] = useState(false);
//     const [emailCredentials, setEmailCredentials] = useState({
//         email: "",
//         password: "",
//         provider: "custom", // Default to custom
//         imapHost: "",
//         imapPort: 993,
//         smtpHost: "",
//         smtpPort: 587
//     });
//     const [isLoading, setIsLoading] = useState(false);
//     const [errorMessage, setErrorMessage] = useState('');
//     const [successMessage, setSuccessMessage] = useState('');
//     const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
//     const [linkedEmail, setLinkedEmail] = useState(null);
//     const [fetchingLinkedEmail, setFetchingLinkedEmail] = useState(false);

//     // Fetch linked email on component mount
//     useEffect(() => {
//         fetchLinkedEmail();
//     }, []);

//     // Function to fetch linked email
//     const fetchLinkedEmail = async () => {
//         try {
//             setFetchingLinkedEmail(true);
            
//             // Get access token
//             const accessToken = getAuthToken();
//             if (!accessToken) {
//                 console.log('User not logged in, cannot fetch linked email');
//                 return;
//             }

//             const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails', {
//                 method: 'GET',
//                 headers: {
//                     'Authorization': `Bearer ${accessToken}`,
//                     'Content-Type': 'application/json'
//                 }
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to fetch linked email');
//             }

//             const data = await response.json();
//             console.log('Fetched linked email:', data);

//             // Check if there's a linked email account
//             if (data && data.data && data.data.length > 0) {
//                 const emailAccount = data.data[0]; // Get first linked email
//                 setLinkedEmail(emailAccount);
                
//                 // Store linked email ID in cookie
//                 if (emailAccount.id) {
//                     setCookie('linkedEmailId', emailAccount.id);
//                     console.log('Stored linked email ID in cookie:', emailAccount.id);
//                 }
//             }
//         } catch (error) {
//             console.error('Error fetching linked email:', error);
//         } finally {
//             setFetchingLinkedEmail(false);
//         }
//     };

//     // Detect provider from email address
//     const detectProviderFromEmail = (email: string): string | null => {
//         if (!email || !email.includes('@')) return null;
        
//         const domain = email.split('@')[1].toLowerCase().trim();
      
//         // Return provider if in predefined list, otherwise return null
//         return EMAIL_PROVIDERS[domain] || null;
//     };

//     // Update email and check provider
//     const handleEmailChange = (email: string) => {
//         const detectedProvider = detectProviderFromEmail(email);
        
//         const newCredentials = { 
//             ...emailCredentials, 
//             email,
//             provider: detectedProvider || "custom" // Default to custom if no provider detected
//         };
        
//         // Show advanced settings for unknown providers
//         setShowAdvancedSettings(detectedProvider === null);
        
//         setEmailCredentials(newCredentials);
//         console.log("Updated credentials:", newCredentials);
//     };

//     const handleLinkEmail = async () => {
//         // Reset messages
//         setErrorMessage('');
//         setSuccessMessage('');
    
//         // Basic validation
//         if (!emailCredentials.email || !emailCredentials.password) {
//             setErrorMessage('Please enter both email and password');
//             return;
//         }
    
//         // Validation for custom providers
//         if (showAdvancedSettings) {
//             if (!emailCredentials.imapHost || !emailCredentials.smtpHost) {
//                 setErrorMessage('Please enter IMAP and SMTP server details');
//                 return;
//             }
//         }
    
//         try {
//             setIsLoading(true);
    
//             // Get access token using the correct function
//             const accessToken = getAuthToken();
//             console.log('Access token from cookie:', accessToken);
            
//             if (!accessToken) {
//                 throw new Error('You must be logged in to link an email');
//             }
    
//             // Ensure provider is valid
//             const provider = emailCredentials.provider || "custom";
            
//             // Validate provider
//             if (!ALLOWED_PROVIDERS.includes(provider)) {
//                 throw new Error(`Invalid provider. Must be one of: ${ALLOWED_PROVIDERS.join(', ')}`);
//             }
    
//             // Prepare request payload
//             const requestPayload = {
//                 provider,
//                 email: emailCredentials.email,
//                 password: emailCredentials.password,
//                 ...(showAdvancedSettings && {
//                     imapHost: emailCredentials.imapHost,
//                     imapPort: Number(emailCredentials.imapPort),
//                     smtpHost: emailCredentials.smtpHost,
//                     smtpPort: Number(emailCredentials.smtpPort)
//                 })
//             };
    
//             console.log('Sending request payload:', JSON.stringify(requestPayload));
    
//             // Use the accessToken from getAuthToken() function
//             const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/link', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${accessToken}`,
//                 },
//                 body: JSON.stringify(requestPayload),
//             });
    
//             // Check response
//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Failed to link email');
//             }
    
//             const data = await response.json();
//             console.log('Email linked successfully:', data);
    
//             // Store linked email ID
//             if (data.id) {
//                 setCookie('linkedEmailId', data.id);
//             } else if (data.data && data.data.id) {
//                 setCookie('linkedEmailId', data.data.id);
//             }
            
//             // Fetch the linked email to update our state
//             await fetchLinkedEmail();
    
//             // Show success and reset
//             setSuccessMessage('Email linked successfully!');
//             setEmailCredentials({
//                 email: "",
//                 password: "",
//                 provider: "custom",
//                 imapHost: "",
//                 imapPort: 993,
//                 smtpHost: "",
//                 smtpPort: 587
//             });
//             setShowAdvancedSettings(false);
    
//             // Close modal after delay
//             setTimeout(() => {
//                 setIsOpen(false);
//                 setSuccessMessage('');
//             }, 2000);
    
//         } catch (error) {
//             console.error('Error linking email:', error);
//             setErrorMessage(
//                 error instanceof Error 
//                     ? error.message 
//                     : 'Failed to link email. Please try again.'
//             );
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     // Display different button text based on linked email status
//     const getButtonText = () => {
//         if (fetchingLinkedEmail) {
//             return "Checking...";
//         }
//         if (linkedEmail) {
//             return "Update Email";
//         }
//         return "Link Email";
//     };

//     return (
//         <>
//             <Button
//                 variant="outline"
//                 onClick={() => setIsOpen(true)}
//             >
//                 <Mail className="w-4 h-4 mr-2" />
//                 {getButtonText()}
//             </Button>

//             <Dialog open={isOpen} onOpenChange={setIsOpen}>
//                 <DialogContent className="sm:max-w-md">
//                     <DialogHeader>
//                         <DialogTitle>
//                             {linkedEmail ? "Update Email Account" : "Link Email Account"}
//                         </DialogTitle>
//                         <DialogDescription>
//                             {linkedEmail 
//                                 ? `Currently linked to ${linkedEmail.email}. You can update your settings or link a different account.` 
//                                 : "Connect your email account to enable automated email processing."}
//                         </DialogDescription>
//                     </DialogHeader>

//                     {errorMessage && (
//                         <Alert variant="destructive" className="mb-4">
//                             <AlertDescription>{errorMessage}</AlertDescription>
//                         </Alert>
//                     )}

//                     {successMessage && (
//                         <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
//                             <AlertDescription>{successMessage}</AlertDescription>
//                         </Alert>
//                     )}

//                     <div className="grid gap-4 py-4">
//                         <div className="grid grid-cols-4 items-center gap-4">
//                             <Label htmlFor="email" className="text-right">
//                                 Email
//                             </Label>
//                             <Input
//                                 id="email"
//                                 type="email"
//                                 value={emailCredentials.email}
//                                 onChange={(e) => handleEmailChange(e.target.value)}
//                                 placeholder={linkedEmail ? linkedEmail.email : "youremail@example.com"}
//                                 className="col-span-3"
//                                 disabled={isLoading}
//                             />
//                         </div>
//                         <div className="grid grid-cols-4 items-center gap-4">
//                             <Label htmlFor="password" className="text-right">
//                                 Password
//                             </Label>
//                             <Input
//                                 id="password"
//                                 type="password"
//                                 value={emailCredentials.password}
//                                 onChange={(e) =>
//                                     setEmailCredentials({
//                                         ...emailCredentials,
//                                         password: e.target.value,
//                                     })
//                                 }
//                                 className="col-span-3"
//                                 disabled={isLoading}
//                             />
//                         </div>

//                         {/* Display detected provider */}
//                         {emailCredentials.provider && !showAdvancedSettings && (
//                             <div className="grid grid-cols-4 items-center gap-4">
//                                 <div className="text-right text-sm text-gray-500">
//                                     Provider:
//                                 </div>
//                                 <div className="col-span-3 text-sm">
//                                     <span className="font-medium capitalize">
//                                         {emailCredentials.provider}
//                                     </span>
//                                     <span className="text-gray-500 ml-1">
//                                         {emailCredentials.provider === 'custom' 
//                                             ? 'custom/unknown provider' 
//                                             : 'detected'}
//                                     </span>
//                                 </div>
//                             </div>
//                         )}

//                         {/* Advanced settings for custom email providers */}
//                         {showAdvancedSettings && (
//                             <>
//                                 <div className="grid grid-cols-1 gap-2 mt-2">
//                                     <div className="text-sm font-medium text-gray-500 mb-2">
//                                         Custom Server Settings
//                                     </div>
//                                     <div className="grid grid-cols-4 items-center gap-4">
//                                         <Label htmlFor="imapHost" className="text-right">
//                                             IMAP Host
//                                         </Label>
//                                         <Input
//                                             id="imapHost"
//                                             type="text"
//                                             value={emailCredentials.imapHost}
//                                             onChange={(e) =>
//                                                 setEmailCredentials({
//                                                     ...emailCredentials,
//                                                     imapHost: e.target.value,
//                                                 })
//                                             }
//                                             placeholder="imap.example.com"
//                                             className="col-span-3"
//                                             disabled={isLoading}
//                                         />
//                                     </div>
//                                     <div className="grid grid-cols-4 items-center gap-4">
//                                         <Label htmlFor="imapPort" className="text-right">
//                                             IMAP Port
//                                         </Label>
//                                         <Input
//                                             id="imapPort"
//                                             type="number"
//                                             value={emailCredentials.imapPort}
//                                             onChange={(e) =>
//                                                 setEmailCredentials({
//                                                     ...emailCredentials,
//                                                     imapPort: parseInt(e.target.value) || 993,
//                                                 })
//                                             }
//                                             className="col-span-3"
//                                             disabled={isLoading}
//                                         />
//                                     </div>
//                                     <div className="grid grid-cols-4 items-center gap-4">
//                                         <Label htmlFor="smtpHost" className="text-right">
//                                             SMTP Host
//                                         </Label>
//                                         <Input
//                                             id="smtpHost"
//                                             type="text"
//                                             value={emailCredentials.smtpHost}
//                                             onChange={(e) =>
//                                                 setEmailCredentials({
//                                                     ...emailCredentials,
//                                                     smtpHost: e.target.value,
//                                                 })
//                                             }
//                                             placeholder="smtp.example.com"
//                                             className="col-span-3"
//                                             disabled={isLoading}
//                                         />
//                                     </div>
//                                     <div className="grid grid-cols-4 items-center gap-4">
//                                         <Label htmlFor="smtpPort" className="text-right">
//                                             SMTP Port
//                                         </Label>
//                                         <Input
//                                             id="smtpPort"
//                                             type="number"
//                                             value={emailCredentials.smtpPort}
//                                             onChange={(e) =>
//                                                 setEmailCredentials({
//                                                     ...emailCredentials,
//                                                     smtpPort: parseInt(e.target.value) || 587,
//                                                 })
//                                             }
//                                             className="col-span-3"
//                                             disabled={isLoading}
//                                         />
//                                     </div>
//                                 </div>
//                             </>
//                         )}
//                     </div>
//                     <DialogFooter>
//                         <Button
//                             type="button"
//                             variant="outline"
//                             onClick={() => setIsOpen(false)}
//                             disabled={isLoading}
//                         >
//                             Cancel
//                         </Button>
//                         <Button
//                             type="button"
//                             onClick={handleLinkEmail}
//                             disabled={isLoading}
//                         >
//                             {isLoading ? 'Linking...' : linkedEmail ? 'Update Account' : 'Link Account'}
//                         </Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>
//         </>
//     );
// }









































// "use client";
// import { useState, useEffect } from "react";
// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
//     DialogFooter,
//     DialogDescription,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Mail } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { getCookie, setCookie, getAuthToken } from "@/lib/utils/cookies";

// // Explicitly define allowed providers
// const ALLOWED_PROVIDERS = [
//     "gmail", 
//     "outlook", 
//     "yahoo", 
//     "custom", 
//     "googleWorkspace"
// ];

// interface EmailProviderMap {
//     [domain: string]: string;
// }

// // Email provider detection configuration
// const EMAIL_PROVIDERS: EmailProviderMap = {
//     "gmail.com": "gmail",
//     "googlemail.com": "gmail",
//     "outlook.com": "outlook",
//     "hotmail.com": "outlook",
//     "live.com": "outlook", 
//     "msn.com": "outlook",
//     "yahoo.com": "yahoo",
//     "yahoo.co.uk": "yahoo",
//     "ymail.com": "yahoo",
// };

// export function LinkEmailModal() {
//     const [isOpen, setIsOpen] = useState(false);
//     const [emailCredentials, setEmailCredentials] = useState({
//         email: "",
//         password: "",
//         provider: "custom", // Default to custom
//         imapHost: "",
//         imapPort: 993,
//         smtpHost: "",
//         smtpPort: 587
//     });
//     const [isLoading, setIsLoading] = useState(false);
//     const [errorMessage, setErrorMessage] = useState('');
//     const [successMessage, setSuccessMessage] = useState('');
//     const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
//     // Get access token
//     // const accessToken = getAuthToken();

//     // Detect provider from email address
//     const detectProviderFromEmail = (email: string): string | null => {
//         if (!email || !email.includes('@')) return null;
        
//         const domain = email.split('@')[1].toLowerCase().trim();
      
//         // Return provider if in predefined list, otherwise return null
//         return EMAIL_PROVIDERS[domain] || null;
//     };

//     // Update email and check provider
//     const handleEmailChange = (email: string) => {
//         const detectedProvider = detectProviderFromEmail(email);
        
//         const newCredentials = { 
//             ...emailCredentials, 
//             email,
//             provider: detectedProvider || "custom" // Default to custom if no provider detected
//         };
        
//         // Show advanced settings for unknown providers
//         setShowAdvancedSettings(detectedProvider === null);
        
//         setEmailCredentials(newCredentials);
//         console.log("Updated credentials:", newCredentials);
//     };

//     const handleLinkEmail = async () => {
//         // Reset messages
//         setErrorMessage('');
//         setSuccessMessage('');
    
//         // Basic validation
//         if (!emailCredentials.email || !emailCredentials.password) {
//             setErrorMessage('Please enter both email and password');
//             return;
//         }
    
//         // Validation for custom providers
//         if (showAdvancedSettings) {
//             if (!emailCredentials.imapHost || !emailCredentials.smtpHost) {
//                 setErrorMessage('Please enter IMAP and SMTP server details');
//                 return;
//             }
//         }
    
//         try {
//             setIsLoading(true);
    
//             // Get access token using the correct function
//             // This correctly checks both 'accessToken' and '__frsadfrusrtkn' cookies
//             const accessToken = getAuthToken();
//             console.log('Access token from cookie:', accessToken);
            
//             if (!accessToken) {
//                 throw new Error('You must be logged in to link an email');
//             }
    
//             // Ensure provider is valid
//             const provider = emailCredentials.provider || "custom";
            
//             // Validate provider
//             if (!ALLOWED_PROVIDERS.includes(provider)) {
//                 throw new Error(`Invalid provider. Must be one of: ${ALLOWED_PROVIDERS.join(', ')}`);
//             }
    
//             // Prepare request payload
//             const requestPayload = {
//                 provider,
//                 email: emailCredentials.email,
//                 password: emailCredentials.password,
//                 ...(showAdvancedSettings && {
//                     imapHost: emailCredentials.imapHost,
//                     imapPort: Number(emailCredentials.imapPort),
//                     smtpHost: emailCredentials.smtpHost,
//                     smtpPort: Number(emailCredentials.smtpPort)
//                 })
//             };
    
//             console.log('Sending request payload:', JSON.stringify(requestPayload));
    
//             // Use the accessToken from getAuthToken() function
//             const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/link', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${accessToken}`,
//                 },
//                 body: JSON.stringify(requestPayload),
//             });
    
//             // Check response
//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Failed to link email');
//             }
    
//             const data = await response.json();
//             console.log('Email linked successfully:', data);
    
//             // Store linked email ID
//             if (data.id) {
//                 setCookie('linkedEmailId', data.id);
//             } else if (data.data && data.data.id) {
//                 setCookie('linkedEmailId', data.data.id);
//             }
    
//             // Show success and reset
//             setSuccessMessage('Email linked successfully!');
//             setEmailCredentials({
//                 email: "",
//                 password: "",
//                 provider: "custom",
//                 imapHost: "",
//                 imapPort: 993,
//                 smtpHost: "",
//                 smtpPort: 587
//             });
//             setShowAdvancedSettings(false);
    
//             // Close modal after delay
//             setTimeout(() => {
//                 setIsOpen(false);
//                 setSuccessMessage('');
//             }, 2000);
    
//         } catch (error) {
//             console.error('Error linking email:', error);
//             setErrorMessage(
//                 error instanceof Error 
//                     ? error.message 
//                     : 'Failed to link email. Please try again.'
//             );
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <>
//             <Button
//                 variant="outline"
//                 onClick={() => setIsOpen(true)}
//             >
//                 <Mail className="w-4 h-4 mr-2" />
//                 Link Email
//             </Button>

//             <Dialog open={isOpen} onOpenChange={setIsOpen}>
//                 <DialogContent className="sm:max-w-md">
//                     <DialogHeader>
//                         <DialogTitle>Link Email Account</DialogTitle>
//                         <DialogDescription>
//                             Connect your email account to enable automated email processing.
//                         </DialogDescription>
//                     </DialogHeader>

//                     {errorMessage && (
//                         <Alert variant="destructive" className="mb-4">
//                             <AlertDescription>{errorMessage}</AlertDescription>
//                         </Alert>
//                     )}

//                     {successMessage && (
//                         <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
//                             <AlertDescription>{successMessage}</AlertDescription>
//                         </Alert>
//                     )}

//                     <div className="grid gap-4 py-4">
//                         <div className="grid grid-cols-4 items-center gap-4">
//                             <Label htmlFor="email" className="text-right">
//                                 Email
//                             </Label>
//                             <Input
//                                 id="email"
//                                 type="email"
//                                 value={emailCredentials.email}
//                                 onChange={(e) => handleEmailChange(e.target.value)}
//                                 placeholder="youremail@example.com"
//                                 className="col-span-3"
//                                 disabled={isLoading}
//                             />
//                         </div>
//                         <div className="grid grid-cols-4 items-center gap-4">
//                             <Label htmlFor="password" className="text-right">
//                                 Password
//                             </Label>
//                             <Input
//                                 id="password"
//                                 type="password"
//                                 value={emailCredentials.password}
//                                 onChange={(e) =>
//                                     setEmailCredentials({
//                                         ...emailCredentials,
//                                         password: e.target.value,
//                                     })
//                                 }
//                                 className="col-span-3"
//                                 disabled={isLoading}
//                             />
//                         </div>

//                         {/* Display detected provider */}
//                         {emailCredentials.provider && !showAdvancedSettings && (
//                             <div className="grid grid-cols-4 items-center gap-4">
//                                 <div className="text-right text-sm text-gray-500">
//                                     Provider:
//                                 </div>
//                                 <div className="col-span-3 text-sm">
//                                     <span className="font-medium capitalize">
//                                         {emailCredentials.provider}
//                                     </span>
//                                     <span className="text-gray-500 ml-1">
//                                         {emailCredentials.provider === 'custom' 
//                                             ? 'custom/unknown provider' 
//                                             : 'detected'}
//                                     </span>
//                                 </div>
//                             </div>
//                         )}

//                         {/* Advanced settings for custom email providers */}
//                         {showAdvancedSettings && (
//                             <>
//                                 <div className="grid grid-cols-1 gap-2 mt-2">
//                                     <div className="text-sm font-medium text-gray-500 mb-2">
//                                         Custom Server Settings
//                                     </div>
//                                     <div className="grid grid-cols-4 items-center gap-4">
//                                         <Label htmlFor="imapHost" className="text-right">
//                                             IMAP Host
//                                         </Label>
//                                         <Input
//                                             id="imapHost"
//                                             type="text"
//                                             value={emailCredentials.imapHost}
//                                             onChange={(e) =>
//                                                 setEmailCredentials({
//                                                     ...emailCredentials,
//                                                     imapHost: e.target.value,
//                                                 })
//                                             }
//                                             placeholder="imap.example.com"
//                                             className="col-span-3"
//                                             disabled={isLoading}
//                                         />
//                                     </div>
//                                     <div className="grid grid-cols-4 items-center gap-4">
//                                         <Label htmlFor="imapPort" className="text-right">
//                                             IMAP Port
//                                         </Label>
//                                         <Input
//                                             id="imapPort"
//                                             type="number"
//                                             value={emailCredentials.imapPort}
//                                             onChange={(e) =>
//                                                 setEmailCredentials({
//                                                     ...emailCredentials,
//                                                     imapPort: parseInt(e.target.value) || 993,
//                                                 })
//                                             }
//                                             className="col-span-3"
//                                             disabled={isLoading}
//                                         />
//                                     </div>
//                                     <div className="grid grid-cols-4 items-center gap-4">
//                                         <Label htmlFor="smtpHost" className="text-right">
//                                             SMTP Host
//                                         </Label>
//                                         <Input
//                                             id="smtpHost"
//                                             type="text"
//                                             value={emailCredentials.smtpHost}
//                                             onChange={(e) =>
//                                                 setEmailCredentials({
//                                                     ...emailCredentials,
//                                                     smtpHost: e.target.value,
//                                                 })
//                                             }
//                                             placeholder="smtp.example.com"
//                                             className="col-span-3"
//                                             disabled={isLoading}
//                                         />
//                                     </div>
//                                     <div className="grid grid-cols-4 items-center gap-4">
//                                         <Label htmlFor="smtpPort" className="text-right">
//                                             SMTP Port
//                                         </Label>
//                                         <Input
//                                             id="smtpPort"
//                                             type="number"
//                                             value={emailCredentials.smtpPort}
//                                             onChange={(e) =>
//                                                 setEmailCredentials({
//                                                     ...emailCredentials,
//                                                     smtpPort: parseInt(e.target.value) || 587,
//                                                 })
//                                             }
//                                             className="col-span-3"
//                                             disabled={isLoading}
//                                         />
//                                     </div>
//                                 </div>
//                             </>
//                         )}
//                     </div>
//                     <DialogFooter>
//                         <Button
//                             type="button"
//                             variant="outline"
//                             onClick={() => setIsOpen(false)}
//                             disabled={isLoading}
//                         >
//                             Cancel
//                         </Button>
//                         <Button
//                             type="button"
//                             onClick={handleLinkEmail}
//                             disabled={isLoading}
//                         >
//                             {isLoading ? 'Linking...' : 'Link Account'}
//                         </Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>
//         </>
//     );
// }


























// "use client";
// import { useState, useEffect } from "react";
// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
//     DialogFooter,
//     DialogDescription,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Mail } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { getCookie, setCookie, getAuthToken } from "@/lib/utils/cookies";

// // Email provider detection configuration with exact provider values
// const EMAIL_PROVIDERS = {
//     "gmail.com": "gmail",
//     "googlemail.com": "gmail",
//     "outlook.com": "outlook",
//     "hotmail.com": "outlook",
//     "live.com": "outlook", 
//     "msn.com": "outlook",
//     "yahoo.com": "yahoo",
//     "yahoo.co.uk": "yahoo",
//     "ymail.com": "yahoo",
//     // Add more known domains as needed
// }

// export function LinkEmailModal() {
//     const [isOpen, setIsOpen] = useState(false);
//     const [emailCredentials, setEmailCredentials] = useState({
//         email: "",
//         password: "",
//         provider: "",
//         imapHost: "",
//         imapPort: 993,
//         smtpHost: "",
//         smtpPort: 587
//     });
//     const [isLoading, setIsLoading] = useState(false);
//     const [errorMessage, setErrorMessage] = useState('');
//     const [successMessage, setSuccessMessage] = useState('');
//     const [accessToken, setAccessToken] = useState('');
//     const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

//     // Get access token from cookies
//     const getAccessToken = () => {
//         return getAuthToken();
//     };

//     // Set access token on component mount and check for linked email ID
//     useEffect(() => {
//         const token = getAccessToken();
//         if (token) {
//             setAccessToken(token);
//             console.log('Access token found in cookies');
//         } else {
//             console.log('No access token found in cookies');
//         }

//         // Check if email ID is already stored in cookies
//         const linkedEmailId = getCookie('linkedEmailId');
//         console.log('Currently linked email ID:', linkedEmailId);
//     }, []);

//     // Detect provider from email address
//     const detectProviderFromEmail = (email) => {
//         if (!email || !email.includes('@')) return null;
        
//         const domain = email.split('@')[1].toLowerCase().trim();
        
//         // Check for Google Workspace (domain with Google MX records)
//         if (domain !== 'gmail.com' && domain.includes('.')) {
//             // Simple check for Google Workspace - in production you might want a more robust solution
//             // For demo purposes we'll leave this empty for now
//         }
        
//         return EMAIL_PROVIDERS[domain] || null;
//     };

//     // Log the provider detection for debugging
//     const logProviderDetection = (email, provider) => {
//         console.log(`Email domain detected: ${email.split('@')[1]}`);
//         console.log(`Provider detected: ${provider || 'none'}`);
//     };

//     // Update email and check provider
//     const handleEmailChange = (email) => {
//         const provider = detectProviderFromEmail(email);
//         logProviderDetection(email, provider);
        
//         let newCredentials = { ...emailCredentials, email };
        
//         if (provider) {
//             // Known provider - hide advanced settings
//             setShowAdvancedSettings(false);
//             newCredentials = {
//                 ...newCredentials,
//                 provider, // This is the exact value from EMAIL_PROVIDERS
//                 // Clear server fields as they're handled by backend
//                 imapHost: "",
//                 imapPort: 993,
//                 smtpHost: "",
//                 smtpPort: 587
//             };
//         } else if (email.includes('@')) {
//             // Unknown provider with valid email format - show advanced settings
//             setShowAdvancedSettings(true);
//             newCredentials = {
//                 ...newCredentials,
//                 provider: "other", // Generic provider value for unknown domains
//                 imapHost: "",
//                 imapPort: 993,
//                 smtpHost: "",
//                 smtpPort: 587
//             };
//         }
        
//         setEmailCredentials(newCredentials);
//         console.log("Updated credentials:", newCredentials);
//     };

//     const handleLinkEmail = async () => {
//         // Reset error and success messages
//         setErrorMessage('');
//         setSuccessMessage('');

//         // Basic validation
//         if (!emailCredentials.email || !emailCredentials.password) {
//             setErrorMessage('Please enter both email and password');
//             return;
//         }

//         // Additional validation for custom email providers
//         if (showAdvancedSettings) {
//             if (!emailCredentials.imapHost || !emailCredentials.smtpHost) {
//                 setErrorMessage('Please enter IMAP and SMTP server details');
//                 return;
//             }
//         }

//         try {
//             setIsLoading(true);

//             // Get access token from cookies
//             const accessToken = getAccessToken();
//             console.log('Access token:', accessToken);

//             if (!accessToken) {
//                 throw new Error('You must be logged in to link an email');
//             }

//             // Ensure provider is one of the allowed values
//             const provider = emailCredentials.provider || "other";
            
//             // Create the request payload based on whether we're using a known provider or custom settings
//             const requestPayload = showAdvancedSettings 
//                 ? {
//                     provider,
//                     email: emailCredentials.email,
//                     password: emailCredentials.password,
//                     imapHost: emailCredentials.imapHost,
//                     imapPort: Number(emailCredentials.imapPort),
//                     smtpHost: emailCredentials.smtpHost,
//                     smtpPort: Number(emailCredentials.smtpPort)
//                 } 
//                 : {
//                     provider,
//                     email: emailCredentials.email,
//                     password: emailCredentials.password
//                 };

//             console.log('Sending request payload:', JSON.stringify(requestPayload));

//             const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/link', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${accessToken}`,
//                 },
//                 body: JSON.stringify(requestPayload),
//             });

//             // Log the response for debugging
//             console.log('Response status:', response.status);

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 console.error('Error response:', errorData);
//                 throw new Error(errorData.message || 'Failed to link email');
//             }

//             const data = await response.json();
//             console.log('Email linked successfully - full response:', data);

//             // Check for ID property and log available keys
//             if (data.id) {
//                 console.log('Found ID property:', data.id);
//                 setCookie('linkedEmailId', data.id);
//                 console.log('Stored linkedEmailId in cookies');

//                 // Verify storage
//                 const storedId = getCookie('linkedEmailId');
//                 console.log('Verified storage - linkedEmailId value:', storedId);
//             } else {
//                 console.log('No ID found in response data. Available keys:', Object.keys(data));

//                 // Check for nested properties
//                 if (data.data && typeof data.data === 'object') {
//                     console.log('Data has nested data object. Keys:', Object.keys(data.data));

//                     // Try to find ID in nested object
//                     if (data.data.id) {
//                         setCookie('linkedEmailId', data.data.id);
//                         console.log('Stored nested ID from data.data.id:', data.data.id);
//                     }
//                 }
//             }

//             // Show success message
//             setSuccessMessage('Email linked successfully!');

//             // Reset the form
//             setEmailCredentials({
//                 email: "",
//                 password: "",
//                 provider: "",
//                 imapHost: "",
//                 imapPort: 993,
//                 smtpHost: "",
//                 smtpPort: 587
//             });
//             setShowAdvancedSettings(false);

//             // Close the modal after a short delay
//             setTimeout(() => {
//                 setIsOpen(false);
//                 setSuccessMessage('');
//             }, 2000);

//         } catch (error: unknown) {
//             console.error('Error linking email:', error);

//             // Type guard to check if error is an Error object with a message
//             const errorMessage = error instanceof Error
//                 ? error.message
//                 : 'Failed to link email. Please try again.';

//             setErrorMessage(errorMessage);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <>
//             <Button
//                 variant="outline"
//                 onClick={() => setIsOpen(true)}
//             >
//                 <Mail className="w-4 h-4 mr-2" />
//                 Link Email
//             </Button>

//             <Dialog open={isOpen} onOpenChange={setIsOpen}>
//                 <DialogContent className="sm:max-w-md">
//                     <DialogHeader>
//                         <DialogTitle>Link Email Account</DialogTitle>
//                         <DialogDescription>
//                             Connect your email account to enable automated email processing.
//                         </DialogDescription>
//                     </DialogHeader>

//                     {errorMessage && (
//                         <Alert variant="destructive" className="mb-4">
//                             <AlertDescription>{errorMessage}</AlertDescription>
//                         </Alert>
//                     )}

//                     {successMessage && (
//                         <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
//                             <AlertDescription>{successMessage}</AlertDescription>
//                         </Alert>
//                     )}

//                     <div className="grid gap-4 py-4">
//                         <div className="grid grid-cols-4 items-center gap-4">
//                             <Label htmlFor="email" className="text-right">
//                                 Email
//                             </Label>
//                             <Input
//                                 id="email"
//                                 type="email"
//                                 value={emailCredentials.email}
//                                 onChange={(e) => handleEmailChange(e.target.value)}
//                                 placeholder="youremail@example.com"
//                                 className="col-span-3"
//                                 disabled={isLoading}
//                             />
//                         </div>
//                         <div className="grid grid-cols-4 items-center gap-4">
//                             <Label htmlFor="password" className="text-right">
//                                 Password
//                             </Label>
//                             <Input
//                                 id="password"
//                                 type="password"
//                                 value={emailCredentials.password}
//                                 onChange={(e) =>
//                                     setEmailCredentials({
//                                         ...emailCredentials,
//                                         password: e.target.value,
//                                     })
//                                 }
//                                 className="col-span-3"
//                                 disabled={isLoading}
//                             />
//                         </div>

//                         {/* Display detected provider if known */}
//                         {emailCredentials.provider && !showAdvancedSettings && (
//                             <div className="grid grid-cols-4 items-center gap-4">
//                                 <div className="text-right text-sm text-gray-500">
//                                     Provider:
//                                 </div>
//                                 <div className="col-span-3 text-sm">
//                                     <span className="font-medium capitalize">{emailCredentials.provider}</span>
//                                     <span className="text-gray-500 ml-1">detected</span>
//                                 </div>
//                             </div>
//                         )}

//                         {/* Advanced settings for custom email providers */}
//                         {showAdvancedSettings && (
//                             <>
//                                 <div className="grid grid-cols-1 gap-2 mt-2">
//                                     <div className="text-sm font-medium text-gray-500 mb-2">
//                                         Custom Server Settings Required
//                                     </div>
//                                     <div className="grid grid-cols-4 items-center gap-4">
//                                         <Label htmlFor="imapHost" className="text-right">
//                                             IMAP Host
//                                         </Label>
//                                         <Input
//                                             id="imapHost"
//                                             type="text"
//                                             value={emailCredentials.imapHost}
//                                             onChange={(e) =>
//                                                 setEmailCredentials({
//                                                     ...emailCredentials,
//                                                     imapHost: e.target.value,
//                                                 })
//                                             }
//                                             placeholder="imap.example.com"
//                                             className="col-span-3"
//                                             disabled={isLoading}
//                                         />
//                                     </div>
//                                     <div className="grid grid-cols-4 items-center gap-4">
//                                         <Label htmlFor="imapPort" className="text-right">
//                                             IMAP Port
//                                         </Label>
//                                         <Input
//                                             id="imapPort"
//                                             type="number"
//                                             value={emailCredentials.imapPort}
//                                             onChange={(e) =>
//                                                 setEmailCredentials({
//                                                     ...emailCredentials,
//                                                     imapPort: parseInt(e.target.value) || 993,
//                                                 })
//                                             }
//                                             className="col-span-3"
//                                             disabled={isLoading}
//                                         />
//                                     </div>
//                                     <div className="grid grid-cols-4 items-center gap-4">
//                                         <Label htmlFor="smtpHost" className="text-right">
//                                             SMTP Host
//                                         </Label>
//                                         <Input
//                                             id="smtpHost"
//                                             type="text"
//                                             value={emailCredentials.smtpHost}
//                                             onChange={(e) =>
//                                                 setEmailCredentials({
//                                                     ...emailCredentials,
//                                                     smtpHost: e.target.value,
//                                                 })
//                                             }
//                                             placeholder="smtp.example.com"
//                                             className="col-span-3"
//                                             disabled={isLoading}
//                                         />
//                                     </div>
//                                     <div className="grid grid-cols-4 items-center gap-4">
//                                         <Label htmlFor="smtpPort" className="text-right">
//                                             SMTP Port
//                                         </Label>
//                                         <Input
//                                             id="smtpPort"
//                                             type="number"
//                                             value={emailCredentials.smtpPort}
//                                             onChange={(e) =>
//                                                 setEmailCredentials({
//                                                     ...emailCredentials,
//                                                     smtpPort: parseInt(e.target.value) || 587,
//                                                 })
//                                             }
//                                             className="col-span-3"
//                                             disabled={isLoading}
//                                         />
//                                     </div>
//                                 </div>
//                             </>
//                         )}
//                     </div>
//                     <DialogFooter>
//                         <Button
//                             type="button"
//                             variant="outline"
//                             onClick={() => setIsOpen(false)}
//                             disabled={isLoading}
//                         >
//                             Cancel
//                         </Button>
//                         <Button
//                             type="button"
//                             onClick={handleLinkEmail}
//                             disabled={isLoading}
//                         >
//                             {isLoading ? 'Linking...' : 'Link Account'}
//                         </Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>
//         </>
//     );
// }
































// "use client";
// import { useState, useEffect } from "react";
// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
//     DialogFooter,
//     DialogDescription,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Mail } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { getCookie, setCookie, getAuthToken } from "@/lib/utils/cookies";

// export function LinkEmailModal() {
//     const [isOpen, setIsOpen] = useState(false);
//     const [emailCredentials, setEmailCredentials] = useState({
//         email: "",
//         password: "",
//     });
//     const [isLoading, setIsLoading] = useState(false);
//     const [errorMessage, setErrorMessage] = useState('');
//     const [successMessage, setSuccessMessage] = useState('');
//     const [accessToken, setAccessToken] = useState('');

//     // Get access token from cookies
//     const getAccessToken = () => {
//         return getAuthToken();
//     };

//     // Set access token on component mount and check for linked email ID
//     useEffect(() => {
//         const token = getAccessToken();
//         if (token) {
//             setAccessToken(token);
//             console.log('Access token found in cookies');
//         } else {
//             console.log('No access token found in cookies');
//         }

//         // Check if email ID is already stored in cookies
//         const linkedEmailId = getCookie('linkedEmailId');
//         console.log('Currently linked email ID:', linkedEmailId);
//     }, []);

//     const handleLinkEmail = async () => {
//         // Reset error and success messages
//         setErrorMessage('');
//         setSuccessMessage('');

//         // Basic validation
//         if (!emailCredentials.email || !emailCredentials.password) {
//             setErrorMessage('Please enter both email and password');
//             return;
//         }

//         try {
//             setIsLoading(true);

//             // Get access token from cookies
//             const accessToken = getAccessToken();
//             console.log('Access token:', accessToken);

//             if (!accessToken) {
//                 throw new Error('You must be logged in to link an email');
//             }

//             const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/link', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${accessToken}`,
//                 },
//                 body: JSON.stringify({
//                     email: emailCredentials.email,
//                     password: emailCredentials.password
//                 }),
//             });

//             // Log the response for debugging
//             console.log('Response status:', response.status);

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Failed to link email');
//             }

//             const data = await response.json();
//             console.log('Email linked successfully - full response:', data);

//             // Check for ID property and log available keys
//             if (data.id) {
//                 console.log('Found ID property:', data.id);
//                 setCookie('linkedEmailId', data.id);
//                 console.log('Stored linkedEmailId in cookies');

//                 // Verify storage
//                 const storedId = getCookie('linkedEmailId');
//                 console.log('Verified storage - linkedEmailId value:', storedId);
//             } else {
//                 console.log('No ID found in response data. Available keys:', Object.keys(data));

//                 // Check for nested properties
//                 if (data.data && typeof data.data === 'object') {
//                     console.log('Data has nested data object. Keys:', Object.keys(data.data));

//                     // Try to find ID in nested object
//                     if (data.data.id) {
//                         setCookie('linkedEmailId', data.data.id);
//                         console.log('Stored nested ID from data.data.id:', data.data.id);
//                     }
//                 }
//             }

//             // Show success message
//             setSuccessMessage('Email linked successfully!');

//             // Reset the form
//             setEmailCredentials({ email: "", password: "" });

//             // Close the modal after a short delay
//             setTimeout(() => {
//                 setIsOpen(false);
//                 setSuccessMessage('');
//             }, 2000);

//         } catch (error: unknown) {
//             console.error('Error linking email:', error);

//             // Type guard to check if error is an Error object with a message
//             const errorMessage = error instanceof Error
//                 ? error.message
//                 : 'Failed to link email. Please try again.';

//             setErrorMessage(errorMessage);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <>
//             <Button
//                 variant="outline"
//                 onClick={() => setIsOpen(true)}
//             >
//                 <Mail className="w-4 h-4 mr-2" />
//                 Link Email
//             </Button>

//             <Dialog open={isOpen} onOpenChange={setIsOpen}>
//                 <DialogContent className="sm:max-w-md">
//                     <DialogHeader>
//                         <DialogTitle>Link Email Account</DialogTitle>
//                         <DialogDescription>
//                             Connect your email account to enable automated email processing.
//                         </DialogDescription>
//                     </DialogHeader>

//                     {errorMessage && (
//                         <Alert variant="destructive" className="mb-4">
//                             <AlertDescription>{errorMessage}</AlertDescription>
//                         </Alert>
//                     )}

//                     {successMessage && (
//                         <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
//                             <AlertDescription>{successMessage}</AlertDescription>
//                         </Alert>
//                     )}

//                     <div className="grid gap-4 py-4">
//                         <div className="grid grid-cols-4 items-center gap-4">
//                             <Label htmlFor="email" className="text-right">
//                                 Email
//                             </Label>
//                             <Input
//                                 id="email"
//                                 type="email"
//                                 value={emailCredentials.email}
//                                 onChange={(e) =>
//                                     setEmailCredentials({
//                                         ...emailCredentials,
//                                         email: e.target.value,
//                                     })
//                                 }
//                                 placeholder="youremail@example.com"
//                                 className="col-span-3"
//                                 disabled={isLoading}
//                             />
//                         </div>
//                         <div className="grid grid-cols-4 items-center gap-4">
//                             <Label htmlFor="password" className="text-right">
//                                 Password
//                             </Label>
//                             <Input
//                                 id="password"
//                                 type="password"
//                                 value={emailCredentials.password}
//                                 onChange={(e) =>
//                                     setEmailCredentials({
//                                         ...emailCredentials,
//                                         password: e.target.value,
//                                     })
//                                 }
//                                 className="col-span-3"
//                                 disabled={isLoading}
//                             />
//                         </div>
//                     </div>
//                     <DialogFooter>
//                         <Button
//                             type="button"
//                             variant="outline"
//                             onClick={() => setIsOpen(false)}
//                             disabled={isLoading}
//                         >
//                             Cancel
//                         </Button>
//                         <Button
//                             type="button"
//                             onClick={handleLinkEmail}
//                             disabled={isLoading}
//                         >
//                             {isLoading ? 'Linking...' : 'Link Account'}
//                         </Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>
//         </>
//     );
// }
























// "use client";
// import { useState, useEffect } from "react";
// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
//     DialogFooter,
//     DialogDescription,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Mail } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";

// export function LinkEmailModal() {
//     const [isOpen, setIsOpen] = useState(false);
//     const [emailCredentials, setEmailCredentials] = useState({
//         email: "",
//         password: "",
//     });
//     const [isLoading, setIsLoading] = useState(false);
//     const [errorMessage, setErrorMessage] = useState('');
//     const [successMessage, setSuccessMessage] = useState('');
//     const [accessToken, setAccessToken] = useState('');

//     // Safely get access token using the correct key 'token'
//     const getAccessToken = () => {
//         if (typeof window !== 'undefined') {
//             return localStorage.getItem('token');
//         }
//         return null;
//     };

//     // Set access token on component mount and check for linked email ID
//     useEffect(() => {
//         const token = getAccessToken();
//         if (token) {
//             setAccessToken(token);
//             console.log('Access token found in localStorage');
//         } else {
//             console.log('No access token found in localStorage');
//         }

//         // Check if email ID is already stored
//         const linkedEmailId = localStorage.getItem('linkedEmailId');
//         console.log('Currently linked email ID:', linkedEmailId);
//     }, []);

//     const handleLinkEmail = async () => {
//         // Reset error and success messages
//         setErrorMessage('');
//         setSuccessMessage('');

//         // Basic validation
//         if (!emailCredentials.email || !emailCredentials.password) {
//             setErrorMessage('Please enter both email and password');
//             return;
//         }

//         try {
//             setIsLoading(true);

//             // Safely get access token with the correct key
//             const accessToken = getAccessToken();
//             console.log('Access token:', accessToken);

//             if (!accessToken) {
//                 throw new Error('You must be logged in to link an email');
//             }

//             const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/link', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${accessToken}`,
//                 },
//                 body: JSON.stringify({
//                     email: emailCredentials.email,
//                     password: emailCredentials.password
//                 }),
//             });

//             // Log the response for debugging
//             console.log('Response status:', response.status);

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Failed to link email');
//             }

//             const data = await response.json();
//             console.log('Email linked successfully - full response:', data);

//             // Check for ID property and log available keys
//             if (data.id) {
//                 console.log('Found ID property:', data.id);
//                 localStorage.setItem('linkedEmailId', data.id);
//                 console.log('Stored linkedEmailId in localStorage');

//                 // Verify storage
//                 const storedId = localStorage.getItem('linkedEmailId');
//                 console.log('Verified storage - linkedEmailId value:', storedId);
//             } else {
//                 console.log('No ID found in response data. Available keys:', Object.keys(data));

//                 // Check for nested properties
//                 if (data.data && typeof data.data === 'object') {
//                     console.log('Data has nested data object. Keys:', Object.keys(data.data));

//                     // Try to find ID in nested object
//                     if (data.data.id) {
//                         localStorage.setItem('linkedEmailId', data.data.id);
//                         console.log('Stored nested ID from data.data.id:', data.data.id);
//                     }
//                 }
//             }

//             // Show success message
//             setSuccessMessage('Email linked successfully!');

//             // Reset the form
//             setEmailCredentials({ email: "", password: "" });

//             // Close the modal after a short delay
//             setTimeout(() => {
//                 setIsOpen(false);
//                 setSuccessMessage('');
//             }, 2000);

//         } catch (error: unknown) {
//             console.error('Error linking email:', error);

//             // Type guard to check if error is an Error object with a message
//             const errorMessage = error instanceof Error
//                 ? error.message
//                 : 'Failed to link email. Please try again.';

//             setErrorMessage(errorMessage);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <>
//             <Button
//                 variant="outline"
//                 onClick={() => setIsOpen(true)}
//             >
//                 <Mail className="w-4 h-4 mr-2" />
//                 Link Email
//             </Button>

//             <Dialog open={isOpen} onOpenChange={setIsOpen}>
//                 <DialogContent className="sm:max-w-md">
//                     <DialogHeader>
//                         <DialogTitle>Link Email Account</DialogTitle>
//                         <DialogDescription>
//                             Connect your email account to enable automated email processing.
//                         </DialogDescription>
//                     </DialogHeader>

//                     {errorMessage && (
//                         <Alert variant="destructive" className="mb-4">
//                             <AlertDescription>{errorMessage}</AlertDescription>
//                         </Alert>
//                     )}

//                     {successMessage && (
//                         <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
//                             <AlertDescription>{successMessage}</AlertDescription>
//                         </Alert>
//                     )}

//                     <div className="grid gap-4 py-4">
//                         <div className="grid grid-cols-4 items-center gap-4">
//                             <Label htmlFor="email" className="text-right">
//                                 Email
//                             </Label>
//                             <Input
//                                 id="email"
//                                 type="email"
//                                 value={emailCredentials.email}
//                                 onChange={(e) =>
//                                     setEmailCredentials({
//                                         ...emailCredentials,
//                                         email: e.target.value,
//                                     })
//                                 }
//                                 placeholder="youremail@example.com"
//                                 className="col-span-3"
//                                 disabled={isLoading}
//                             />
//                         </div>
//                         <div className="grid grid-cols-4 items-center gap-4">
//                             <Label htmlFor="password" className="text-right">
//                                 Password
//                             </Label>
//                             <Input
//                                 id="password"
//                                 type="password"
//                                 value={emailCredentials.password}
//                                 onChange={(e) =>
//                                     setEmailCredentials({
//                                         ...emailCredentials,
//                                         password: e.target.value,
//                                     })
//                                 }
//                                 className="col-span-3"
//                                 disabled={isLoading}
//                             />
//                         </div>
//                     </div>
//                     <DialogFooter>
//                         <Button
//                             type="button"
//                             variant="outline"
//                             onClick={() => setIsOpen(false)}
//                             disabled={isLoading}
//                         >
//                             Cancel
//                         </Button>
//                         <Button
//                             type="button"
//                             onClick={handleLinkEmail}
//                             disabled={isLoading}
//                         >
//                             {isLoading ? 'Linking...' : 'Link Account'}
//                         </Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>
//         </>
//     );
// }
