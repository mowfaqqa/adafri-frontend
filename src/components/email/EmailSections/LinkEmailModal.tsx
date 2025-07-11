"use client";
import React, { useState, useEffect, useContext, useCallback } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Mail, HelpCircle, ExternalLink, Shield, CheckCircle, AlertTriangle, Zap, Star, Lock, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthContext } from "@/lib/context/auth";
import { useCombinedAuth } from "../../providers/useCombinedAuth";
import { 
    setSelectedLinkedEmail, 
    getSelectedLinkedEmailId 
} from "@/lib/utils/cookies";
import Link from "next/link";

// Explicitly define allowed providers
const ALLOWED_PROVIDERS = [
    "gmail", 
    "outlook", 
    "yahoo", 
    "custom", 
    "googleWorkspace"
];

interface DjombiTokens {
  accessTokenAdafri: string;
  accessTokenDjombi: string;
}

interface EmailProviderMap {
    [domain: string]: string;
}

// Define Email account interface
interface LinkedEmail {
    id: string;
    email: string;
    provider: string;
    type?: string | null;
    imapHost?: string;
    imapPort?: number;
    smtpHost?: string;
    smtpPort?: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
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

export function LinkEmailModal(): React.JSX.Element {
    // Use consistent auth pattern like your other components
    const { token, user } = useContext(AuthContext);
    const { djombi } = useCombinedAuth();
    const djombiTokens = djombi.token || "";
    
    const [isOpen, setIsOpen] = useState(false);
    const [emailCredentials, setEmailCredentials] = useState({
        email: "",
        password: "",
        provider: "custom", // Default to custom
        type: "personal", // Default to personal
        imapHost: "",
        imapPort: 993,
        smtpHost: "",
        smtpPort: 587
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const [linkedEmails, setLinkedEmails] = useState<LinkedEmail[]>([]);
    const [fetchingLinkedEmails, setFetchingLinkedEmails] = useState(false);
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    
    // Function to set selected linked email ID and type in cookies
    const handleSetSelectedLinkedEmail = (emailId: string, type: string | null): void => {
        setSelectedLinkedEmail(emailId, type);
        console.log('Stored selected linked email ID and type in cookies:', emailId, type);
    };

    // Function to get selected linked email ID from cookies
    const handleGetSelectedLinkedEmailId = (): string | null => {
        return getSelectedLinkedEmailId();
    };

    // Function to fetch linked emails with proper auth and offset
    const fetchLinkedEmails = useCallback(async () => {
        try {
            setFetchingLinkedEmails(true);
            setErrorMessage('');
            
            // Check if djombi token is available - consistent with your main component pattern
            if (!djombiTokens) {
                console.log('No djombi token available');
                setErrorMessage('Authentication token not available');
                return;
            }

            if (!djombi.isAuthenticated) {
                console.log('User not authenticated with djombi');
                setErrorMessage('User not authenticated');
                return;
            }

            console.log("Djombi token available:", djombiTokens ? `${djombiTokens.substring(0, 10)}...` : 'No token');

            // Fixed: Use offset=0 instead of offset=1 (API expects 0-based indexing)
            const apiEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails?offset=1&limit=20';
            console.log("Fetching linked emails from:", apiEndpoint);

            const response = await fetch(apiEndpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${djombiTokens}`,
                    'Content-Type': 'application/json'
                }
            });

            const responseText = await response.text();
            console.log("Raw response:", responseText);

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Parsed linked emails response:', data);
            } catch (parseError) {
                console.error("Failed to parse response as JSON:", parseError);
                throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
            }

            // Check if there are linked email accounts
            if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
                setLinkedEmails(data.data);
                
                // Set the first email as selected if none is selected
                const currentSelectedId = handleGetSelectedLinkedEmailId();
                if (!currentSelectedId || !data.data.find((email: LinkedEmail) => email.id === currentSelectedId)) {
                    const firstEmail = data.data[0];
                    setSelectedEmailId(firstEmail.id);
                    handleSetSelectedLinkedEmail(firstEmail.id, firstEmail.type ?? null);
                } else {
                    setSelectedEmailId(currentSelectedId);
                }
            } else {
                console.log('No linked emails found or invalid response structure');
                setLinkedEmails([]);
                setSelectedEmailId(null);
            }
        } catch (error) {
            console.error('Error fetching linked emails:', error);
            setErrorMessage(error instanceof Error ? error.message : 'Failed to fetch linked emails');
            setLinkedEmails([]);
        } finally {
            setFetchingLinkedEmails(false);
        }
    }, [djombiTokens, djombi.isAuthenticated]); // Dependencies match your main component pattern

    // Fetch linked emails when djombi auth is ready - consistent with your main component
    useEffect(() => {
        if (djombi.isAuthenticated && djombiTokens) {
            fetchLinkedEmails();
        }
    }, [djombi.isAuthenticated, djombiTokens, fetchLinkedEmails]);

    // Function to handle email selection
    const handleEmailSelection = (emailId: string): void => {
        const selectedEmail = linkedEmails.find(email => email.id === emailId);
        if (selectedEmail) {
            setSelectedEmailId(emailId);
            handleSetSelectedLinkedEmail(emailId, selectedEmail.type ?? null);
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
    const handleEmailChange = (email: string): void => {
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

    const handleLinkEmail = async (): Promise<void> => {
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
    
            // Check if djombi token is available
            if (!djombiTokens) {
                throw new Error('Authentication token not available. Please log in again.');
            }

            if (!djombi.isAuthenticated) {
                throw new Error('User not authenticated. Please log in again.');
            }

            console.log("Using djombi token for link email:", djombiTokens ? `${djombiTokens.substring(0, 10)}...` : 'No token');
    
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
                type: emailCredentials.type, // Add the type field
                ...(showAdvancedSettings && {
                    imapHost: emailCredentials.imapHost,
                    imapPort: Number(emailCredentials.imapPort),
                    smtpHost: emailCredentials.smtpHost,
                    smtpPort: Number(emailCredentials.smtpPort)
                })
            };
    
            console.log('Sending request payload:', JSON.stringify(requestPayload));

            const apiEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/link';
            console.log("Linking email to:", apiEndpoint);
    
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${djombiTokens}`,
                },
                body: JSON.stringify(requestPayload),
            });

            const responseText = await response.text();
            console.log("Link email raw response:", responseText);
    
            // Check response
            if (!response.ok) {
                let errorData;
                try {
                    errorData = JSON.parse(responseText);
                } catch (e) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                throw new Error(errorData.message || 'Failed to link email');
            }
    
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Email linked successfully:', data);
            } catch (parseError) {
                console.error("Failed to parse link response as JSON:", parseError);
                throw new Error(`Invalid response format from server`);
            }
    
            // Fetch the linked emails to update our state
            await fetchLinkedEmails();
    
            // Show success and reset
            setSuccessMessage('Email linked successfully!');
            setEmailCredentials({
                email: "",
                password: "",
                provider: "custom",
                type: "personal",
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
    const getButtonText = (): string => {
        if (fetchingLinkedEmails) {
            return "Checking...";
        }
        if (linkedEmails.length > 0) {
            return linkedEmails.length === 1 ? "Manage Email" : "Manage Emails";
        }
        return "Link Email";
    };

    // Get selected email object
    const getSelectedEmail = (): LinkedEmail | null => {
        return linkedEmails.find(email => email.id === selectedEmailId) || null;
    };

    // Get provider icon
    const getProviderIcon = (provider: string): string => {
        switch (provider) {
            case 'gmail':
                return '📧';
            case 'outlook':
                return '📮';
            case 'yahoo':
                return '💌';
            default:
                return '✉️';
        }
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setIsOpen(true)}
                className="bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-2 border-gradient-to-r from-blue-200 to-purple-200 transition-all duration-300 hover:shadow-lg group"
            >
                <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-medium">
                        {getButtonText()}
                    </span>
                    {linkedEmails.length > 0 && (
                        <div className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                            {linkedEmails.length}
                        </div>
                    )}
                </div>
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                                <Mail className="w-5 h-5 text-white" />
                            </div>
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {linkedEmails.length > 0 ? "Manage Email Accounts" : "Link Email Account"}
                            </span>
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                            {linkedEmails.length > 0 
                                ? `You have ${linkedEmails.length} linked email account${linkedEmails.length > 1 ? 's' : ''}. Select an active account or add a new one.`
                                : "Connect your email account to enable automated email processing and professional communication."}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Display linked emails if any */}
                    {linkedEmails.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    <span>Linked Accounts ({linkedEmails.length})</span>
                                </Label>
                            </div>
                            <div className="space-y-3 max-h-40 overflow-y-auto">
                                {linkedEmails.map((email) => (
                                    <div
                                        key={email.id}
                                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                                            selectedEmailId === email.id 
                                                ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg' 
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                        onClick={() => handleEmailSelection(email.id)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <span className="text-lg">{getProviderIcon(email.provider)}</span>
                                                    <div className="font-medium text-sm text-gray-900">{email.email}</div>
                                                </div>
                                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                    <span className="capitalize bg-gray-100 px-2 py-1 rounded-full">
                                                        {email.provider}
                                                    </span>
                                                    <span className="capitalize bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                        {email.type || 'No type'}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full ${
                                                        email.isActive 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {email.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                            {selectedEmailId === email.id && (
                                                <div className="flex items-center space-x-1">
                                                    <CheckCircle className="w-4 h-4 text-blue-600" />
                                                    <span className="text-xs text-blue-600 font-medium">Selected</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {errorMessage && (
                        <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
                            <AlertTriangle className="w-4 h-4" />
                            <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
                        </Alert>
                    )}

                    {successMessage && (
                        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                            <CheckCircle className="w-4 h-4" />
                            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
                        </Alert>
                    )}

                    <div className="border-t-2 border-gray-100 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                                <Zap className="w-4 h-4 text-yellow-500" />
                                <span>Add New Email Account</span>
                            </Label>
                        </div>

                        {/* Help text with FAQ link */}
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                                <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-blue-800">
                                    <p className="mb-2">
                                        <strong>Need help generating an App Password?</strong>
                                    </p>
                                    <p className="mb-2">
                                        For Gmail, Yahoo, and Outlook, you'll need to generate an App Password instead of using your regular password for security.
                                    </p>
                                    <Link 
                                        href="/dashboard/faqs" 
                                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors duration-200"
                                    >
                                        <span>📖 Click here for step-by-step guide</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right font-medium text-gray-700">
                                    Email
                                </Label>
                                <div className="col-span-3">
                                    <Input
                                        id="email"
                                        type="email"
                                        value={emailCredentials.email}
                                        onChange={(e) => handleEmailChange(e.target.value)}
                                        placeholder="youremail@example.com"
                                        className="border-2 focus:border-blue-500 transition-colors duration-200"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="password" className="text-right font-medium text-gray-700">
                                    {/* <Lock className="w-3 h-3" /> */}
                                    Password
                                </Label>
                                <div className="col-span-3">
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
                                        placeholder="App Password"
                                        className="border-2 focus:border-blue-500 transition-colors duration-200"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Email Type Selection */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-medium text-gray-700">
                                    Type
                                </Label>
                                <div className="col-span-3">
                                    <RadioGroup
                                        value={emailCredentials.type}
                                        onValueChange={(value) =>
                                            setEmailCredentials({
                                                ...emailCredentials,
                                                type: value,
                                            })
                                        }
                                        className="flex flex-row space-x-6"
                                        disabled={isLoading}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="personal" id="personal" className="border-2 border-blue-500" />
                                            <Label htmlFor="personal" className="text-sm font-normal cursor-pointer">
                                                Personal
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="professional" id="professional" className="border-2 border-purple-500" />
                                            <Label htmlFor="professional" className="text-sm font-normal cursor-pointer">
                                                Professional
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            </div>

                            {/* Display detected provider */}
                            {emailCredentials.provider && !showAdvancedSettings && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <div className="text-right text-sm text-gray-500 font-medium">
                                        Provider:
                                    </div>
                                    <div className="col-span-3">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-lg">{getProviderIcon(emailCredentials.provider)}</span>
                                            <span className="font-medium capitalize bg-gray-100 px-3 py-1 rounded-full text-sm">
                                                {emailCredentials.provider}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {emailCredentials.provider === 'custom' 
                                                    ? 'custom/unknown provider' 
                                                    : 'auto-detected'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Advanced settings for custom email providers */}
                            {showAdvancedSettings && (
                                <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Settings className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm font-semibold text-gray-700">Custom Server Settings</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="imapHost" className="text-right text-sm font-medium">
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
                                                className="col-span-3 border-2 focus:border-blue-500"
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="imapPort" className="text-right text-sm font-medium">
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
                                                className="col-span-3 border-2 focus:border-blue-500"
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="smtpHost" className="text-right text-sm font-medium">
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
                                                className="col-span-3 border-2 focus:border-blue-500"
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="smtpPort" className="text-right text-sm font-medium">
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
                                                className="col-span-3 border-2 focus:border-blue-500"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="space-x-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isLoading}
                            className="border-2 hover:bg-gray-50 transition-colors duration-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleLinkEmail}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            {isLoading ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Linking...</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Mail className="w-4 h-4" />
                                    <span>Link New Account</span>
                                </div>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}





























































































// "use client";
// import { useState, useEffect, useContext, useCallback } from "react";
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
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Mail } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { AuthContext } from "@/lib/context/auth";
// import { useCombinedAuth } from "../../providers/useCombinedAuth";
// import { 
//     setSelectedLinkedEmail, 
//     getSelectedLinkedEmailId 
// } from "@/lib/utils/cookies";

// // Explicitly define allowed providers
// const ALLOWED_PROVIDERS = [
//     "gmail", 
//     "outlook", 
//     "yahoo", 
//     "custom", 
//     "googleWorkspace"
// ];

// interface DjombiTokens {
//   accessTokenAdafri: string;
//   accessTokenDjombi: string;
// }

// interface EmailProviderMap {
//     [domain: string]: string;
// }

// // Define Email account interface
// interface LinkedEmail {
//     id: string;
//     email: string;
//     provider: string;
//     type?: string | null;
//     imapHost?: string;
//     imapPort?: number;
//     smtpHost?: string;
//     smtpPort?: number;
//     isActive: boolean;
//     createdAt: string;
//     updatedAt: string;
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
//     // Use consistent auth pattern like your other components
//     const { token, user } = useContext(AuthContext);
//     const { djombi } = useCombinedAuth();
//     const djombiTokens = djombi.token || "";
    
//     const [isOpen, setIsOpen] = useState(false);
//     const [emailCredentials, setEmailCredentials] = useState({
//         email: "",
//         password: "",
//         provider: "custom", // Default to custom
//         type: "personal", // Default to personal
//         imapHost: "",
//         imapPort: 993,
//         smtpHost: "",
//         smtpPort: 587
//     });
//     const [isLoading, setIsLoading] = useState(false);
//     const [errorMessage, setErrorMessage] = useState('');
//     const [successMessage, setSuccessMessage] = useState('');
//     const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
//     const [linkedEmails, setLinkedEmails] = useState<LinkedEmail[]>([]);
//     const [fetchingLinkedEmails, setFetchingLinkedEmails] = useState(false);
//     const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    
//     // Function to set selected linked email ID and type in cookies
//     const handleSetSelectedLinkedEmail = (emailId: string, type: string | null): void => {
//         setSelectedLinkedEmail(emailId, type);
//         console.log('Stored selected linked email ID and type in cookies:', emailId, type);
//     };

//     // Function to get selected linked email ID from cookies
//     const handleGetSelectedLinkedEmailId = (): string | null => {
//         return getSelectedLinkedEmailId();
//     };

//     // Function to fetch linked emails with proper auth and offset
//     const fetchLinkedEmails = useCallback(async () => {
//         try {
//             setFetchingLinkedEmails(true);
//             setErrorMessage('');
            
//             // Check if djombi token is available - consistent with your main component pattern
//             if (!djombiTokens) {
//                 console.log('No djombi token available');
//                 setErrorMessage('Authentication token not available');
//                 return;
//             }

//             if (!djombi.isAuthenticated) {
//                 console.log('User not authenticated with djombi');
//                 setErrorMessage('User not authenticated');
//                 return;
//             }

//             console.log("Djombi token available:", djombiTokens ? `${djombiTokens.substring(0, 10)}...` : 'No token');

//             // Fixed: Use offset=0 instead of offset=1 (API expects 0-based indexing)
//             const apiEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails?offset=1&limit=20';
//             console.log("Fetching linked emails from:", apiEndpoint);

//             const response = await fetch(apiEndpoint, {
//                 method: 'GET',
//                 headers: {
//                     'Authorization': `Bearer ${djombiTokens}`,
//                     'Content-Type': 'application/json'
//                 }
//             });

//             const responseText = await response.text();
//             console.log("Raw response:", responseText);

//             if (!response.ok) {
//                 throw new Error(`API error: ${response.status} ${response.statusText}`);
//             }

//             let data;
//             try {
//                 data = JSON.parse(responseText);
//                 console.log('Parsed linked emails response:', data);
//             } catch (parseError) {
//                 console.error("Failed to parse response as JSON:", parseError);
//                 throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
//             }

//             // Check if there are linked email accounts
//             if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
//                 setLinkedEmails(data.data);
                
//                 // Set the first email as selected if none is selected
//                 const currentSelectedId = handleGetSelectedLinkedEmailId();
//                 if (!currentSelectedId || !data.data.find((email: LinkedEmail) => email.id === currentSelectedId)) {
//                     const firstEmail = data.data[0];
//                     setSelectedEmailId(firstEmail.id);
//                     handleSetSelectedLinkedEmail(firstEmail.id, firstEmail.type ?? null);
//                 } else {
//                     setSelectedEmailId(currentSelectedId);
//                 }
//             } else {
//                 console.log('No linked emails found or invalid response structure');
//                 setLinkedEmails([]);
//                 setSelectedEmailId(null);
//             }
//         } catch (error) {
//             console.error('Error fetching linked emails:', error);
//             setErrorMessage(error instanceof Error ? error.message : 'Failed to fetch linked emails');
//             setLinkedEmails([]);
//         } finally {
//             setFetchingLinkedEmails(false);
//         }
//     }, [djombiTokens, djombi.isAuthenticated]); // Dependencies match your main component pattern

//     // Fetch linked emails when djombi auth is ready - consistent with your main component
//     useEffect(() => {
//         if (djombi.isAuthenticated && djombiTokens) {
//             fetchLinkedEmails();
//         }
//     }, [djombi.isAuthenticated, djombiTokens, fetchLinkedEmails]);

//     // Function to handle email selection
//     const handleEmailSelection = (emailId: string) => {
//         const selectedEmail = linkedEmails.find(email => email.id === emailId);
//         if (selectedEmail) {
//             setSelectedEmailId(emailId);
//             handleSetSelectedLinkedEmail(emailId, selectedEmail.type ?? null);
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
    
//             // Check if djombi token is available
//             if (!djombiTokens) {
//                 throw new Error('Authentication token not available. Please log in again.');
//             }

//             if (!djombi.isAuthenticated) {
//                 throw new Error('User not authenticated. Please log in again.');
//             }

//             console.log("Using djombi token for link email:", djombiTokens ? `${djombiTokens.substring(0, 10)}...` : 'No token');
    
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
//                 type: emailCredentials.type, // Add the type field
//                 ...(showAdvancedSettings && {
//                     imapHost: emailCredentials.imapHost,
//                     imapPort: Number(emailCredentials.imapPort),
//                     smtpHost: emailCredentials.smtpHost,
//                     smtpPort: Number(emailCredentials.smtpPort)
//                 })
//             };
    
//             console.log('Sending request payload:', JSON.stringify(requestPayload));

//             const apiEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/link';
//             console.log("Linking email to:", apiEndpoint);
    
//             const response = await fetch(apiEndpoint, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${djombiTokens}`,
//                 },
//                 body: JSON.stringify(requestPayload),
//             });

//             const responseText = await response.text();
//             console.log("Link email raw response:", responseText);
    
//             // Check response
//             if (!response.ok) {
//                 let errorData;
//                 try {
//                     errorData = JSON.parse(responseText);
//                 } catch (e) {
//                     throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//                 }
//                 throw new Error(errorData.message || 'Failed to link email');
//             }
    
//             let data;
//             try {
//                 data = JSON.parse(responseText);
//                 console.log('Email linked successfully:', data);
//             } catch (parseError) {
//                 console.error("Failed to parse link response as JSON:", parseError);
//                 throw new Error(`Invalid response format from server`);
//             }
    
//             // Fetch the linked emails to update our state
//             await fetchLinkedEmails();
    
//             // Show success and reset
//             setSuccessMessage('Email linked successfully!');
//             setEmailCredentials({
//                 email: "",
//                 password: "",
//                 provider: "custom",
//                 type: "personal",
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
//         if (fetchingLinkedEmails) {
//             return "Checking...";
//         }
//         if (linkedEmails.length > 0) {
//             return linkedEmails.length === 1 ? "Manage Email" : "Manage Emails";
//         }
//         return "Link Email";
//     };

//     // Get selected email object
//     const getSelectedEmail = () => {
//         return linkedEmails.find(email => email.id === selectedEmailId) || null;
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
//                             {linkedEmails.length > 0 ? "Manage Email Accounts" : "Link Email Account"}
//                         </DialogTitle>
//                         <DialogDescription>
//                             {linkedEmails.length > 0 
//                                 ? `You have ${linkedEmails.length} linked email account${linkedEmails.length > 1 ? 's' : ''}. Select an active account or add a new one.`
//                                 : "Connect your email account to enable automated email processing."}
//                         </DialogDescription>
//                     </DialogHeader>

//                     {/* Display linked emails if any */}
//                     {linkedEmails.length > 0 && (
//                         <div className="mb-4">
//                             <Label className="text-sm font-medium mb-2 block">
//                                 Linked Accounts ({linkedEmails.length})
//                             </Label>
//                             <div className="space-y-2 max-h-32 overflow-y-auto">
//                                 {linkedEmails.map((email) => (
//                                     <div
//                                         key={email.id}
//                                         className={`p-3 border rounded-lg cursor-pointer transition-colors ${
//                                             selectedEmailId === email.id 
//                                                 ? 'border-blue-500 bg-blue-50' 
//                                                 : 'border-gray-200 hover:border-gray-300'
//                                         }`}
//                                         onClick={() => handleEmailSelection(email.id)}
//                                     >
//                                         <div className="flex justify-between items-start">
//                                             <div className="flex-1">
//                                                 <div className="font-medium text-sm">{email.email}</div>
//                                                 <div className="text-xs text-gray-500 mt-1">
//                                                     {email.provider} • {email.type || 'No type'} • {email.isActive ? 'Active' : 'Inactive'}
//                                                 </div>
//                                             </div>
//                                             {selectedEmailId === email.id && (
//                                                 <div className="text-xs text-blue-600 font-medium">
//                                                     Selected
//                                                 </div>
//                                             )}
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     )}

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

//                     <div className="border-t pt-4">
//                         <Label className="text-sm font-medium mb-3 block">
//                             Add New Email Account
//                         </Label>
                        
//                         <div className="grid gap-4">
//                             <div className="grid grid-cols-4 items-center gap-4">
//                                 <Label htmlFor="email" className="text-right">
//                                     Email
//                                 </Label>
//                                 <Input
//                                     id="email"
//                                     type="email"
//                                     value={emailCredentials.email}
//                                     onChange={(e) => handleEmailChange(e.target.value)}
//                                     placeholder="youremail@example.com"
//                                     className="col-span-3"
//                                     disabled={isLoading}
//                                 />
//                             </div>
//                             <div className="grid grid-cols-4 items-center gap-4">
//                                 <Label htmlFor="password" className="text-right">
//                                     Password
//                                 </Label>
//                                 <Input
//                                     id="password"
//                                     type="password"
//                                     value={emailCredentials.password}
//                                     onChange={(e) =>
//                                         setEmailCredentials({
//                                             ...emailCredentials,
//                                             password: e.target.value,
//                                         })
//                                     }
//                                     className="col-span-3"
//                                     disabled={isLoading}
//                                 />
//                             </div>

//                             {/* Email Type Selection */}
//                             <div className="grid grid-cols-4 items-center gap-4">
//                                 <Label className="text-right">
//                                     Type
//                                 </Label>
//                                 <div className="col-span-3">
//                                     <RadioGroup
//                                         value={emailCredentials.type}
//                                         onValueChange={(value) =>
//                                             setEmailCredentials({
//                                                 ...emailCredentials,
//                                                 type: value,
//                                             })
//                                         }
//                                         className="flex flex-row space-x-6"
//                                         disabled={isLoading}
//                                     >
//                                         <div className="flex items-center space-x-2">
//                                             <RadioGroupItem value="personal" id="personal" />
//                                             <Label htmlFor="personal" className="text-sm font-normal">
//                                                 Personal
//                                             </Label>
//                                         </div>
//                                         <div className="flex items-center space-x-2">
//                                             <RadioGroupItem value="professional" id="professional" />
//                                             <Label htmlFor="professional" className="text-sm font-normal">
//                                                 Professional
//                                             </Label>
//                                         </div>
//                                     </RadioGroup>
//                                 </div>
//                             </div>

//                             {/* Display detected provider */}
//                             {emailCredentials.provider && !showAdvancedSettings && (
//                                 <div className="grid grid-cols-4 items-center gap-4">
//                                     <div className="text-right text-sm text-gray-500">
//                                         Provider:
//                                     </div>
//                                     <div className="col-span-3 text-sm">
//                                         <span className="font-medium capitalize">
//                                             {emailCredentials.provider}
//                                         </span>
//                                         <span className="text-gray-500 ml-1">
//                                             {emailCredentials.provider === 'custom' 
//                                                 ? 'custom/unknown provider' 
//                                                 : 'detected'}
//                                         </span>
//                                     </div>
//                                 </div>
//                             )}

//                             {/* Advanced settings for custom email providers */}
//                             {showAdvancedSettings && (
//                                 <>
//                                     <div className="grid grid-cols-1 gap-2 mt-2">
//                                         <div className="text-sm font-medium text-gray-500 mb-2">
//                                             Custom Server Settings
//                                         </div>
//                                         <div className="grid grid-cols-4 items-center gap-4">
//                                             <Label htmlFor="imapHost" className="text-right">
//                                                 IMAP Host
//                                             </Label>
//                                             <Input
//                                                 id="imapHost"
//                                                 type="text"
//                                                 value={emailCredentials.imapHost}
//                                                 onChange={(e) =>
//                                                     setEmailCredentials({
//                                                         ...emailCredentials,
//                                                         imapHost: e.target.value,
//                                                     })
//                                                 }
//                                                 placeholder="imap.example.com"
//                                                 className="col-span-3"
//                                                 disabled={isLoading}
//                                             />
//                                         </div>
//                                         <div className="grid grid-cols-4 items-center gap-4">
//                                             <Label htmlFor="imapPort" className="text-right">
//                                                 IMAP Port
//                                             </Label>
//                                             <Input
//                                                 id="imapPort"
//                                                 type="number"
//                                                 value={emailCredentials.imapPort}
//                                                 onChange={(e) =>
//                                                     setEmailCredentials({
//                                                         ...emailCredentials,
//                                                         imapPort: parseInt(e.target.value) || 993,
//                                                     })
//                                                 }
//                                                 className="col-span-3"
//                                                 disabled={isLoading}
//                                             />
//                                         </div>
//                                         <div className="grid grid-cols-4 items-center gap-4">
//                                             <Label htmlFor="smtpHost" className="text-right">
//                                                 SMTP Host
//                                             </Label>
//                                             <Input
//                                                 id="smtpHost"
//                                                 type="text"
//                                                 value={emailCredentials.smtpHost}
//                                                 onChange={(e) =>
//                                                     setEmailCredentials({
//                                                         ...emailCredentials,
//                                                         smtpHost: e.target.value,
//                                                     })
//                                                 }
//                                                 placeholder="smtp.example.com"
//                                                 className="col-span-3"
//                                                 disabled={isLoading}
//                                             />
//                                         </div>
//                                         <div className="grid grid-cols-4 items-center gap-4">
//                                             <Label htmlFor="smtpPort" className="text-right">
//                                                 SMTP Port
//                                             </Label>
//                                             <Input
//                                                 id="smtpPort"
//                                                 type="number"
//                                                 value={emailCredentials.smtpPort}
//                                                 onChange={(e) =>
//                                                     setEmailCredentials({
//                                                         ...emailCredentials,
//                                                         smtpPort: parseInt(e.target.value) || 587,
//                                                     })
//                                                 }
//                                                 className="col-span-3"
//                                                 disabled={isLoading}
//                                             />
//                                         </div>
//                                     </div>
//                                 </>
//                             )}
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
//                             {isLoading ? 'Linking...' : 'Link New Account'}
//                         </Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>
//         </>
//     );
// }










































































// 7/8/2025
// "use client";
// import { useState, useEffect, useContext, useCallback } from "react";
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
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Mail } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { AuthContext } from "@/lib/context/auth";
// import { useCombinedAuth } from "../../providers/useCombinedAuth";

// // Explicitly define allowed providers
// const ALLOWED_PROVIDERS = [
//     "gmail", 
//     "outlook", 
//     "yahoo", 
//     "custom", 
//     "googleWorkspace"
// ];

// interface DjombiTokens {
//   accessTokenAdafri: string;
//   accessTokenDjombi: string;
// }

// interface EmailProviderMap {
//     [domain: string]: string;
//     // djombiTokens?: DjombiTokens | null;
// }

// // Define Email account interface
// interface LinkedEmail {
//     id: string;
//     email: string;
//     provider: string;
//     type?: string;
//     imapHost?: string;
//     imapPort?: number;
//     smtpHost?: string;
//     smtpPort?: number;
//     // Add other fields as needed
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
//     // Get auth context inside the component body
//     const { token, user } = useContext(AuthContext);
//     const { djombi } = useCombinedAuth();
//     const djombiTokens = djombi.token || "";
    
//     const [isOpen, setIsOpen] = useState(false);
//     const [emailCredentials, setEmailCredentials] = useState({
//         email: "",
//         password: "",
//         provider: "custom", // Default to custom
//         type: "personal", // Default to personal
//         imapHost: "",
//         imapPort: 993,
//         smtpHost: "",
//         smtpPort: 587
//     });
//     const [isLoading, setIsLoading] = useState(false);
//     const [errorMessage, setErrorMessage] = useState('');
//     const [successMessage, setSuccessMessage] = useState('');
//     const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
//     const [linkedEmail, setLinkedEmail] = useState<LinkedEmail | null>(null);
//     const [fetchingLinkedEmail, setFetchingLinkedEmail] = useState(false);
    
//     // Function to get access token from localStorage
//     const getAccessToken = (): string | null => {
//         if (typeof window !== 'undefined') {
//             return localStorage.getItem('access_token');
//         }
//         return null;
//     };

//     // Function to set access token in localStorage
//     const setAccessTokenInStorage = (tokenValue: string): void => {
//         if (typeof window !== 'undefined') {
//             localStorage.setItem('access_token', tokenValue);
//         }
//     };

//     // Function to set linked email ID in localStorage
//     const setLinkedEmailId = (emailId: string): void => {
//         if (typeof window !== 'undefined') {
//             localStorage.setItem('linkedEmailId', emailId);
//             console.log('Stored linked email ID in localStorage:', emailId);
//         }
//     };

//     // Function to fetch linked email - memoized to prevent unnecessary re-renders
//     const fetchLinkedEmail = useCallback(async () => {
//         try {
//             setFetchingLinkedEmail(true);
            
//             // Get access token from localStorage or context
//             const accessToken = getAccessToken() || token?.access_token;
            
//             if (!accessToken) {
//                 console.log('User not logged in, cannot fetch linked email');
//                 return;
//             }

//             const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails?offset=1&limit=20', {
//                 method: 'GET',
//                 headers: {
//                     'Authorization': `Bearer ${djombiTokens}`,
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
                
//                 // Store linked email ID in localStorage
//                 if (emailAccount.id) {
//                     setLinkedEmailId(emailAccount.id);
//                 }
//             }
//         } catch (error) {
//             console.error('Error fetching linked email:', error);
//         } finally {
//             setFetchingLinkedEmail(false);
//         }
//     }, [djombiTokens, token?.access_token]);

//     // Fetch linked email on component mount
//     useEffect(() => {
//         fetchLinkedEmail();
//     }, [fetchLinkedEmail]);

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
    
//             // Get access token from localStorage or context
//             const accessToken = getAccessToken() || token?.access_token;
//             console.log('Access token from storage/context:', accessToken ? 'Token exists' : 'No token');
            
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
//                 type: emailCredentials.type, // Add the type field
//                 ...(showAdvancedSettings && {
//                     imapHost: emailCredentials.imapHost,
//                     imapPort: Number(emailCredentials.imapPort),
//                     smtpHost: emailCredentials.smtpHost,
//                     smtpPort: Number(emailCredentials.smtpPort)
//                 })
//             };
    
//             console.log('Sending request payload:', JSON.stringify(requestPayload));
    
//             const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/link', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${djombiTokens}`,
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
    
//             // Store linked email ID in localStorage
//             if (data.id) {
//                 setLinkedEmailId(data.id);
//             } else if (data.data && data.data.id) {
//                 setLinkedEmailId(data.data.id);
//             }
            
//             // Fetch the linked email to update our state
//             await fetchLinkedEmail();
    
//             // Show success and reset
//             setSuccessMessage('Email linked successfully!');
//             setEmailCredentials({
//                 email: "",
//                 password: "",
//                 provider: "custom",
//                 type: "personal",
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
//                                 ? `Currently linked to ${linkedEmail.email}${linkedEmail.type ? ` (${linkedEmail.type})` : ''}. You can update your settings or link a different account.` 
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

//                         {/* Email Type Selection */}
//                         <div className="grid grid-cols-4 items-center gap-4">
//                             <Label className="text-right">
//                                 Type
//                             </Label>
//                             <div className="col-span-3">
//                                 <RadioGroup
//                                     value={emailCredentials.type}
//                                     onValueChange={(value) =>
//                                         setEmailCredentials({
//                                             ...emailCredentials,
//                                             type: value,
//                                         })
//                                     }
//                                     className="flex flex-row space-x-6"
//                                     disabled={isLoading}
//                                 >
//                                     <div className="flex items-center space-x-2">
//                                         <RadioGroupItem value="personal" id="personal" />
//                                         <Label htmlFor="personal" className="text-sm font-normal">
//                                             Personal
//                                         </Label>
//                                     </div>
//                                     <div className="flex items-center space-x-2">
//                                         <RadioGroupItem value="professional" id="professional" />
//                                         <Label htmlFor="professional" className="text-sm font-normal">
//                                             Professional
//                                         </Label>
//                                     </div>
//                                 </RadioGroup>
//                             </div>
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



















































































// 6/29/2025 03:00am
// "use client";
// import { useState, useEffect, useContext } from "react";
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
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Mail } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { AuthContext } from "@/lib/context/auth";
// import { useCombinedAuth } from "../../providers/useCombinedAuth";

// // Explicitly define allowed providers
// const ALLOWED_PROVIDERS = [
//     "gmail", 
//     "outlook", 
//     "yahoo", 
//     "custom", 
//     "googleWorkspace"
// ];

// interface DjombiTokens {
//   accessTokenAdafri: string;
//   accessTokenDjombi: string;
// }

// interface EmailProviderMap {
//     [domain: string]: string;
//     // djombiTokens?: DjombiTokens | null;
// }

// // Define Email account interface
// interface LinkedEmail {
//     id: string;
//     email: string;
//     provider: string;
//     type?: string;
//     imapHost?: string;
//     imapPort?: number;
//     smtpHost?: string;
//     smtpPort?: number;
//     // Add other fields as needed
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
//     // Get auth context inside the component body
//     const { token, user } = useContext(AuthContext);
//     const { djombi } = useCombinedAuth();
//     const djombiTokens = djombi.token || "";
    
//     const [isOpen, setIsOpen] = useState(false);
//     const [emailCredentials, setEmailCredentials] = useState({
//         email: "",
//         password: "",
//         provider: "custom", // Default to custom
//         type: "personal", // Default to personal
//         imapHost: "",
//         imapPort: 993,
//         smtpHost: "",
//         smtpPort: 587
//     });
//     const [isLoading, setIsLoading] = useState(false);
//     const [errorMessage, setErrorMessage] = useState('');
//     const [successMessage, setSuccessMessage] = useState('');
//     const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
//     const [linkedEmail, setLinkedEmail] = useState<LinkedEmail | null>(null);
//     const [fetchingLinkedEmail, setFetchingLinkedEmail] = useState(false);
    
//     // Fetch linked email on component mount
//     useEffect(() => {
//         fetchLinkedEmail();
//     }, [token]); // Add token as dependency

//     // Function to get access token from localStorage
//     const getAccessToken = (): string | null => {
//         if (typeof window !== 'undefined') {
//             return localStorage.getItem('access_token');
//         }
//         return null;
//     };

//     // Function to set access token in localStorage
//     const setAccessTokenInStorage = (tokenValue: string): void => {
//         if (typeof window !== 'undefined') {
//             localStorage.setItem('access_token', tokenValue);
//         }
//     };

//     // Function to set linked email ID in localStorage
//     const setLinkedEmailId = (emailId: string): void => {
//         if (typeof window !== 'undefined') {
//             localStorage.setItem('linkedEmailId', emailId);
//             console.log('Stored linked email ID in localStorage:', emailId);
//         }
//     };

//     // Function to fetch linked email
//     const fetchLinkedEmail = async () => {
//         try {
//             setFetchingLinkedEmail(true);
            
//             // Get access token from localStorage or context
//             const accessToken = getAccessToken() || token?.access_token;
            
//             if (!accessToken) {
//                 console.log('User not logged in, cannot fetch linked email');
//                 return;
//             }

//             const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails?offset=1&limit=20', {
//                 method: 'GET',
//                 headers: {
//                     'Authorization': `Bearer ${djombiTokens}`,
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
                
//                 // Store linked email ID in localStorage
//                 if (emailAccount.id) {
//                     setLinkedEmailId(emailAccount.id);
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
    
//             // Get access token from localStorage or context
//             const accessToken = getAccessToken() || token?.access_token;
//             console.log('Access token from storage/context:', accessToken ? 'Token exists' : 'No token');
            
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
//                 type: emailCredentials.type, // Add the type field
//                 ...(showAdvancedSettings && {
//                     imapHost: emailCredentials.imapHost,
//                     imapPort: Number(emailCredentials.imapPort),
//                     smtpHost: emailCredentials.smtpHost,
//                     smtpPort: Number(emailCredentials.smtpPort)
//                 })
//             };
    
//             console.log('Sending request payload:', JSON.stringify(requestPayload));
    
//             const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/link', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${djombiTokens}`,
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
    
//             // Store linked email ID in localStorage
//             if (data.id) {
//                 setLinkedEmailId(data.id);
//             } else if (data.data && data.data.id) {
//                 setLinkedEmailId(data.data.id);
//             }
            
//             // Fetch the linked email to update our state
//             await fetchLinkedEmail();
    
//             // Show success and reset
//             setSuccessMessage('Email linked successfully!');
//             setEmailCredentials({
//                 email: "",
//                 password: "",
//                 provider: "custom",
//                 type: "personal",
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
//                                 ? `Currently linked to ${linkedEmail.email}${linkedEmail.type ? ` (${linkedEmail.type})` : ''}. You can update your settings or link a different account.` 
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

//                         {/* Email Type Selection */}
//                         <div className="grid grid-cols-4 items-center gap-4">
//                             <Label className="text-right">
//                                 Type
//                             </Label>
//                             <div className="col-span-3">
//                                 <RadioGroup
//                                     value={emailCredentials.type}
//                                     onValueChange={(value) =>
//                                         setEmailCredentials({
//                                             ...emailCredentials,
//                                             type: value,
//                                         })
//                                     }
//                                     className="flex flex-row space-x-6"
//                                     disabled={isLoading}
//                                 >
//                                     <div className="flex items-center space-x-2">
//                                         <RadioGroupItem value="personal" id="personal" />
//                                         <Label htmlFor="personal" className="text-sm font-normal">
//                                             Personal
//                                         </Label>
//                                     </div>
//                                     <div className="flex items-center space-x-2">
//                                         <RadioGroupItem value="professional" id="professional" />
//                                         <Label htmlFor="professional" className="text-sm font-normal">
//                                             Professional
//                                         </Label>
//                                     </div>
//                                 </RadioGroup>
//                             </div>
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
// import { useState, useEffect, useContext } from "react";
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
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Mail } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { AuthContext } from "@/lib/context/auth";
// import { useCombinedAuth } from "../../providers/useCombinedAuth";

//  // Get auth context at the top level
//     const { token, user } = useContext(AuthContext);
//     const {djombi} = useCombinedAuth()
//     const djombiTokens = djombi.token || ""

// // Explicitly define allowed providers
// const ALLOWED_PROVIDERS = [
//     "gmail", 
//     "outlook", 
//     "yahoo", 
//     "custom", 
//     "googleWorkspace"
// ];


// interface DjombiTokens {
//   accessTokenAdafri: string;
//   accessTokenDjombi: string;
// }

// interface EmailProviderMap {
//     [domain: string]: string;
//     // djombiTokens?: DjombiTokens | null;
// }

// // Define Email account interface
// interface LinkedEmail {
//     id: string;
//     email: string;
//     provider: string;
//     type?: string;
//     imapHost?: string;
//     imapPort?: number;
//     smtpHost?: string;
//     smtpPort?: number;
//     // Add other fields as needed
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
//         type: "personal", // Default to personal
//         imapHost: "",
//         imapPort: 993,
//         smtpHost: "",
//         smtpPort: 587
//     });
//     const [isLoading, setIsLoading] = useState(false);
//     const [errorMessage, setErrorMessage] = useState('');
//     const [successMessage, setSuccessMessage] = useState('');
//     const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
//     const [linkedEmail, setLinkedEmail] = useState<LinkedEmail | null>(null);
//     const [fetchingLinkedEmail, setFetchingLinkedEmail] = useState(false);
    
//     // Fetch linked email on component mount
//     useEffect(() => {
//         fetchLinkedEmail();
//     }, [token]); // Add token as dependency

//     // Function to get access token from localStorage
//     const getAccessToken = (): string | null => {
//         if (typeof window !== 'undefined') {
//             return localStorage.getItem('access_token');
//         }
//         return null;
//     };

//     // Function to set access token in localStorage
//     const setAccessTokenInStorage = (tokenValue: string): void => {
//         if (typeof window !== 'undefined') {
//             localStorage.setItem('access_token', tokenValue);
//         }
//     };

//     // Function to set linked email ID in localStorage
//     const setLinkedEmailId = (emailId: string): void => {
//         if (typeof window !== 'undefined') {
//             localStorage.setItem('linkedEmailId', emailId);
//             console.log('Stored linked email ID in localStorage:', emailId);
//         }
//     };

//     // Function to fetch linked email
//     const fetchLinkedEmail = async () => {
//         try {
//             setFetchingLinkedEmail(true);
            
//             // Get access token from localStorage or context
//             const accessToken = getAccessToken() || token?.access_token;
            
//             if (!accessToken) {
//                 console.log('User not logged in, cannot fetch linked email');
//                 return;
//             }

//             const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails?offset=1&limit=20', {
//                 method: 'GET',
//                 headers: {
//                     'Authorization': `Bearer ${djombiTokens}`,
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
                
//                 // Store linked email ID in localStorage
//                 if (emailAccount.id) {
//                     setLinkedEmailId(emailAccount.id);
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
    
//             // Get access token from localStorage or context
//             const accessToken = getAccessToken() || token?.access_token;
//             console.log('Access token from storage/context:', accessToken ? 'Token exists' : 'No token');
            
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
//                 type: emailCredentials.type, // Add the type field
//                 ...(showAdvancedSettings && {
//                     imapHost: emailCredentials.imapHost,
//                     imapPort: Number(emailCredentials.imapPort),
//                     smtpHost: emailCredentials.smtpHost,
//                     smtpPort: Number(emailCredentials.smtpPort)
//                 })
//             };
    
//             console.log('Sending request payload:', JSON.stringify(requestPayload));
    
//             const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/link', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${djombiTokens}`,
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
    
//             // Store linked email ID in localStorage
//             if (data.id) {
//                 setLinkedEmailId(data.id);
//             } else if (data.data && data.data.id) {
//                 setLinkedEmailId(data.data.id);
//             }
            
//             // Fetch the linked email to update our state
//             await fetchLinkedEmail();
    
//             // Show success and reset
//             setSuccessMessage('Email linked successfully!');
//             setEmailCredentials({
//                 email: "",
//                 password: "",
//                 provider: "custom",
//                 type: "personal",
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
//                                 ? `Currently linked to ${linkedEmail.email}${linkedEmail.type ? ` (${linkedEmail.type})` : ''}. You can update your settings or link a different account.` 
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

//                         {/* Email Type Selection */}
//                         <div className="grid grid-cols-4 items-center gap-4">
//                             <Label className="text-right">
//                                 Type
//                             </Label>
//                             <div className="col-span-3">
//                                 <RadioGroup
//                                     value={emailCredentials.type}
//                                     onValueChange={(value) =>
//                                         setEmailCredentials({
//                                             ...emailCredentials,
//                                             type: value,
//                                         })
//                                     }
//                                     className="flex flex-row space-x-6"
//                                     disabled={isLoading}
//                                 >
//                                     <div className="flex items-center space-x-2">
//                                         <RadioGroupItem value="personal" id="personal" />
//                                         <Label htmlFor="personal" className="text-sm font-normal">
//                                             Personal
//                                         </Label>
//                                     </div>
//                                     <div className="flex items-center space-x-2">
//                                         <RadioGroupItem value="professional" id="professional" />
//                                         <Label htmlFor="professional" className="text-sm font-normal">
//                                             Professional
//                                         </Label>
//                                     </div>
//                                 </RadioGroup>
//                             </div>
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
// import { useState, useEffect, useContext } from "react";
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
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Mail } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { AuthContext } from "@/lib/context/auth";

// // Explicitly define allowed providers
// const ALLOWED_PROVIDERS = [
//     "gmail", 
//     "outlook", 
//     "yahoo", 
//     "custom", 
//     "googleWorkspace"
// ];

// interface DjombiTokens {
//   accessTokenAdafri: string;
//   accessTokenDjombi: string;
// }

// interface EmailProviderMap {
//     [domain: string]: string;
// }

// // Define Email account interface
// interface LinkedEmail {
//     id: string;
//     email: string;
//     provider: string;
//     type?: string;
//     imapHost?: string;
//     imapPort?: number;
//     smtpHost?: string;
//     smtpPort?: number;
//     // Add other fields as needed
// }

// // Props interface for the component
// interface LinkEmailModalProps {
//     djombiTokens?: DjombiTokens | null;
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

// export function LinkEmailModal({ djombiTokens }: LinkEmailModalProps) {
//     // Get auth context at the top level
//     const { token, user } = useContext(AuthContext);
    
//     const [isOpen, setIsOpen] = useState(false);
//     const [emailCredentials, setEmailCredentials] = useState({
//         email: "",
//         password: "",
//         provider: "custom", // Default to custom
//         type: "personal", // Default to personal
//         imapHost: "",
//         imapPort: 993,
//         smtpHost: "",
//         smtpPort: 587
//     });
//     const [isLoading, setIsLoading] = useState(false);
//     const [errorMessage, setErrorMessage] = useState('');
//     const [successMessage, setSuccessMessage] = useState('');
//     const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
//     const [linkedEmail, setLinkedEmail] = useState<LinkedEmail | null>(null);
//     const [fetchingLinkedEmail, setFetchingLinkedEmail] = useState(false);
    
//     // Fetch linked email on component mount
//     useEffect(() => {
//         // Only fetch when djombiTokens are available
//         if (djombiTokens) {
//             fetchLinkedEmail();
//         }
//     }, [token, djombiTokens]); // Add djombiTokens as dependency

//     // Function to get access token from localStorage
//     const getAccessToken = (): string | null => {
//         if (typeof window !== 'undefined') {
//             return localStorage.getItem('access_token');
//         }
//         return null;
//     };

//     // Function to set access token in localStorage
//     const setAccessTokenInStorage = (tokenValue: string): void => {
//         if (typeof window !== 'undefined') {
//             localStorage.setItem('access_token', tokenValue);
//         }
//     };

//     // Function to set linked email ID in localStorage
//     const setLinkedEmailId = (emailId: string): void => {
//         if (typeof window !== 'undefined') {
//             localStorage.setItem('linkedEmailId', emailId);
//             console.log('Stored linked email ID in localStorage:', emailId);
//         }
//     };

//     // Function to perform Djombi-specific actions
//     const performDjombiAction = async (emailId: string, action: string) => {
//         if (!djombiTokens) {
//             console.error('Djombi tokens not available for action:', action);
//             return;
//         }

//         try {
//             const response = await fetch(`https://be-auth-server.onrender.com/api/v1/emails/link`, {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Bearer ${djombiTokens.accessTokenDjombi}`,
//                     'Content-Type': 'application/json',
//                     'X-Djombi-Token': djombiTokens.accessTokenDjombi,
//                     'X-Adafri-Token': djombiTokens.accessTokenAdafri,
//                 },
//                 body: JSON.stringify({
//                     emailId,
//                     action
//                 })
//             });

//             if (!response.ok) {
//                 throw new Error('Djombi action failed');
//             }

//             const data = await response.json();
//             console.log('Djombi action completed:', data);
//             return data;
//         } catch (error) {
//             console.error('Djombi action failed:', error);
//             throw error;
//         }
//     };

//     // Function to fetch linked email with Djombi integration
//     const fetchLinkedEmail = async () => {
//         if (!djombiTokens) {
//             console.log('Djombi tokens not available, skipping email fetch');
//             return;
//         }

//         try {
//             setFetchingLinkedEmail(true);
            
//             console.log("Using Djombi tokens for fetching linked email:", {
//                 adafri: djombiTokens.accessTokenAdafri ? `${djombiTokens.accessTokenAdafri.substring(0, 10)}...` : 'No token',
//                 djombi: djombiTokens.accessTokenDjombi ? `${djombiTokens.accessTokenDjombi.substring(0, 10)}...` : 'No token'
//             });

//             // Get access token from localStorage or context, fallback to Djombi token
//             const accessToken = getAccessToken() || token?.access_token || djombiTokens.accessTokenDjombi;
            
//             if (!accessToken) {
//                 console.log('No access token available, cannot fetch linked email');
//                 return;
//             }

//             const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails', {
//                 method: 'GET',
//                 headers: {
//                     'Authorization': `Bearer ${accessToken}`,
//                     'Content-Type': 'application/json',
//                     // Add Djombi-specific headers
//                     'X-Djombi-Token': djombiTokens.accessTokenDjombi,
//                     'X-Adafri-Token': djombiTokens.accessTokenAdafri,
//                 }
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to fetch linked email');
//             }

//             const data = await response.json();
//             console.log('Fetched linked email with Djombi integration:', data);

//             // Check if there's a linked email account
//             if (data && data.data && data.data.length > 0) {
//                 const emailAccount = data.data[0]; // Get first linked email
//                 setLinkedEmail(emailAccount);
                
//                 // Store linked email ID in localStorage
//                 if (emailAccount.id) {
//                     setLinkedEmailId(emailAccount.id);
                    
//                     // Track email fetch with Djombi
//                     try {
//                         await performDjombiAction(emailAccount.id, 'fetch');
//                     } catch (djombiError) {
//                         console.warn('Djombi tracking failed, but continuing:', djombiError);
//                     }
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
//         // Check if Djombi tokens are available
//         if (!djombiTokens) {
//             setErrorMessage('Djombi integration not available. Please try again.');
//             return;
//         }

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

//             console.log("Using Djombi tokens for linking email:", {
//                 adafri: djombiTokens.accessTokenAdafri ? `${djombiTokens.accessTokenAdafri.substring(0, 10)}...` : 'No token',
//                 djombi: djombiTokens.accessTokenDjombi ? `${djombiTokens.accessTokenDjombi.substring(0, 10)}...` : 'No token'
//             });
    
//             // Get access token from localStorage or context, fallback to Djombi token
//             const accessToken = getAccessToken() || token?.access_token || djombiTokens.accessTokenDjombi;
//             console.log('Access token from storage/context/djombi:', accessToken ? 'Token exists' : 'No token');
            
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
//                 type: emailCredentials.type, // Add the type field
//                 ...(showAdvancedSettings && {
//                     imapHost: emailCredentials.imapHost,
//                     imapPort: Number(emailCredentials.imapPort),
//                     smtpHost: emailCredentials.smtpHost,
//                     smtpPort: Number(emailCredentials.smtpPort)
//                 })
//             };
    
//             console.log('Sending request payload with Djombi integration:', JSON.stringify(requestPayload));
    
//             // Use the correct endpoint as specified
//             const response = await fetch('https://be-auth-server.onrender.com/api/v1/emails/link', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${accessToken}`,
//                     // Add Djombi-specific headers
//                     'X-Djombi-Token': djombiTokens.accessTokenDjombi,
//                     'X-Adafri-Token': djombiTokens.accessTokenAdafri,
//                 },
//                 body: JSON.stringify(requestPayload),
//             });
    
//             // Check response
//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Failed to link email');
//             }
    
//             const data = await response.json();
//             console.log('Email linked successfully with Djombi integration:', data);
    
//             // Store linked email ID in localStorage
//             let linkedEmailId = null;
//             if (data.id) {
//                 linkedEmailId = data.id;
//                 setLinkedEmailId(data.id);
//             } else if (data.data && data.data.id) {
//                 linkedEmailId = data.data.id;
//                 setLinkedEmailId(data.data.id);
//             }
            
//             // Track email linking with Djombi
//             if (linkedEmailId) {
//                 try {
//                     await performDjombiAction(linkedEmailId, 'link');
//                 } catch (djombiError) {
//                     console.warn('Djombi tracking failed, but email linking succeeded:', djombiError);
//                 }
//             }
            
//             // Fetch the linked email to update our state
//             await fetchLinkedEmail();
    
//             // Show success and reset
//             setSuccessMessage('Email linked successfully with Djombi integration!');
//             setEmailCredentials({
//                 email: "",
//                 password: "",
//                 provider: "custom",
//                 type: "personal",
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

//     // Show loading state if Djombi tokens are not yet available
//     if (!djombiTokens) {
//         return (
//             <Button variant="outline" disabled>
//                 <Mail className="w-4 h-4 mr-2" />
//                 <div className="flex items-center gap-2">
//                     <div className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
//                     Initializing...
//                 </div>
//             </Button>
//         );
//     }

//     return (
//         <>
//             <Button
//                 variant="outline"
//                 onClick={() => setIsOpen(true)}
//             >
//                 <Mail className="w-4 h-4 mr-2" />
//                 {getButtonText()}
//                 {/* Djombi status indicator */}
//                 <div className="ml-2 flex items-center gap-1 text-xs text-green-600">
//                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
//                 </div>
//             </Button>

//             <Dialog open={isOpen} onOpenChange={setIsOpen}>
//                 <DialogContent className="sm:max-w-md">
//                     <DialogHeader>
//                         <DialogTitle className="flex items-center gap-2">
//                             {linkedEmail ? "Update Email Account" : "Link Email Account"}
//                             {/* Djombi status indicator in dialog */}
//                             <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
//                                 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//                                 Djombi
//                             </div>
//                         </DialogTitle>
//                         <DialogDescription>
//                             {linkedEmail 
//                                 ? `Currently linked to ${linkedEmail.email}${linkedEmail.type ? ` (${linkedEmail.type})` : ''}. You can update your settings or link a different account.` 
//                                 : "Connect your email account to enable automated email processing with Djombi integration."}
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

//                         {/* Email Type Selection */}
//                         <div className="grid grid-cols-4 items-center gap-4">
//                             <Label className="text-right">
//                                 Type
//                             </Label>
//                             <div className="col-span-3">
//                                 <RadioGroup
//                                     value={emailCredentials.type}
//                                     onValueChange={(value) =>
//                                         setEmailCredentials({
//                                             ...emailCredentials,
//                                             type: value,
//                                         })
//                                     }
//                                     className="flex flex-row space-x-6"
//                                     disabled={isLoading}
//                                 >
//                                     <div className="flex items-center space-x-2">
//                                         <RadioGroupItem value="personal" id="personal" />
//                                         <Label htmlFor="personal" className="text-sm font-normal">
//                                             Personal
//                                         </Label>
//                                     </div>
//                                     <div className="flex items-center space-x-2">
//                                         <RadioGroupItem value="professional" id="professional" />
//                                         <Label htmlFor="professional" className="text-sm font-normal">
//                                             Professional
//                                         </Label>
//                                     </div>
//                                 </RadioGroup>
//                             </div>
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
// import { useState, useEffect, useContext } from "react";
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
// import { AuthContext } from "@/lib/context/auth";

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

// // Define Email account interface
// interface LinkedEmail {
//     id: string;
//     email: string;
//     provider: string;
//     imapHost?: string;
//     imapPort?: number;
//     smtpHost?: string;
//     smtpPort?: number;
//     // Add other fields as needed
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
//     // Get auth context at the top level
//     const { token, user } = useContext(AuthContext);
    
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
//     const [linkedEmail, setLinkedEmail] = useState<LinkedEmail | null>(null);
//     const [fetchingLinkedEmail, setFetchingLinkedEmail] = useState(false);
    
//     // Fetch linked email on component mount
//     useEffect(() => {
//         fetchLinkedEmail();
//     }, [token]); // Add token as dependency

//     // Function to get access token from localStorage
//     const getAccessToken = (): string | null => {
//         if (typeof window !== 'undefined') {
//             return localStorage.getItem('access_token');
//         }
//         return null;
//     };

//     // Function to set access token in localStorage
//     const setAccessTokenInStorage = (tokenValue: string): void => {
//         if (typeof window !== 'undefined') {
//             localStorage.setItem('access_token', tokenValue);
//         }
//     };

//     // Function to set linked email ID in localStorage
//     const setLinkedEmailId = (emailId: string): void => {
//         if (typeof window !== 'undefined') {
//             localStorage.setItem('linkedEmailId', emailId);
//             console.log('Stored linked email ID in localStorage:', emailId);
//         }
//     };

//     // Function to fetch linked email
//     const fetchLinkedEmail = async () => {
//         try {
//             setFetchingLinkedEmail(true);
            
//             // Get access token from localStorage or context
//             const accessToken = getAccessToken() || token?.access_token;
            
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
                
//                 // Store linked email ID in localStorage
//                 if (emailAccount.id) {
//                     setLinkedEmailId(emailAccount.id);
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
    
//             // Get access token from localStorage or context
//             const accessToken = getAccessToken() || token?.access_token;
//             console.log('Access token from storage/context:', accessToken ? 'Token exists' : 'No token');
            
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
    
//             // Store linked email ID in localStorage
//             if (data.id) {
//                 setLinkedEmailId(data.id);
//             } else if (data.data && data.data.id) {
//                 setLinkedEmailId(data.data.id);
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





























































































