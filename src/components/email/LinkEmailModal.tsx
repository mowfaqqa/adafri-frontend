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

export function LinkEmailModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [emailCredentials, setEmailCredentials] = useState({
        email: "",
        password: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [accessToken, setAccessToken] = useState('');

    // Safely get access token using the correct key 'token'
    const getAccessToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    };

    // Set access token on component mount and check for linked email ID
    useEffect(() => {
        const token = getAccessToken();
        if (token) {
            setAccessToken(token);
            console.log('Access token found in localStorage');
        } else {
            console.log('No access token found in localStorage');
        }

        // Check if email ID is already stored
        const linkedEmailId = localStorage.getItem('linkedEmailId');
        console.log('Currently linked email ID:', linkedEmailId);
    }, []);

    const handleLinkEmail = async () => {
        // Reset error and success messages
        setErrorMessage('');
        setSuccessMessage('');

        // Basic validation
        if (!emailCredentials.email || !emailCredentials.password) {
            setErrorMessage('Please enter both email and password');
            return;
        }

        try {
            setIsLoading(true);

            // Safely get access token with the correct key
            const accessToken = getAccessToken();
            console.log('Access token:', accessToken);

            if (!accessToken) {
                throw new Error('You must be logged in to link an email');
            }

            const response = await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    email: emailCredentials.email,
                    password: emailCredentials.password
                }),
            });

            // Log the response for debugging
            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to link email');
            }

            const data = await response.json();
            console.log('Email linked successfully - full response:', data);

            // Check for ID property and log available keys
            if (data.id) {
                console.log('Found ID property:', data.id);
                localStorage.setItem('linkedEmailId', data.id);
                console.log('Stored linkedEmailId in localStorage');

                // Verify storage
                const storedId = localStorage.getItem('linkedEmailId');
                console.log('Verified storage - linkedEmailId value:', storedId);
            } else {
                console.log('No ID found in response data. Available keys:', Object.keys(data));

                // Check for nested properties
                if (data.data && typeof data.data === 'object') {
                    console.log('Data has nested data object. Keys:', Object.keys(data.data));

                    // Try to find ID in nested object
                    if (data.data.id) {
                        localStorage.setItem('linkedEmailId', data.data.id);
                        console.log('Stored nested ID from data.data.id:', data.data.id);
                    }
                }
            }

            // Show success message
            setSuccessMessage('Email linked successfully!');

            // Reset the form
            setEmailCredentials({ email: "", password: "" });

            // Close the modal after a short delay
            setTimeout(() => {
                setIsOpen(false);
                setSuccessMessage('');
            }, 2000);

        } catch (error: unknown) {
            console.error('Error linking email:', error);

            // Type guard to check if error is an Error object with a message
            const errorMessage = error instanceof Error
                ? error.message
                : 'Failed to link email. Please try again.';

            setErrorMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setIsOpen(true)}
            >
                <Mail className="w-4 h-4 mr-2" />
                Link Email
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Link Email Account</DialogTitle>
                        <DialogDescription>
                            Connect your email account to enable automated email processing.
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
                                onChange={(e) =>
                                    setEmailCredentials({
                                        ...emailCredentials,
                                        email: e.target.value,
                                    })
                                }
                                placeholder="youremail@example.com"
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
                            {isLoading ? 'Linking...' : 'Link Account'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}