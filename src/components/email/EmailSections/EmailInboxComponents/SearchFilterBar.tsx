import { Search, Filter, User, Briefcase, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmailFilter, EmailAccountType } from "@/lib/types/email";
import { useState, useEffect, useCallback } from "react";
import { getSelectedLinkedEmail, setSelectedLinkedEmail } from "@/lib/utils/cookies";
import { useCombinedAuth } from "@/components/providers/useCombinedAuth";
import { useEmailStore } from "@/store/email-store";

interface SearchFilterBarProps {
  emailFilter: EmailFilter;
  onFilterChange: (filter: EmailFilter) => void;
  emailAccountType: EmailAccountType;
  onAccountTypeChange: (type: EmailAccountType) => void;
}

interface LinkedEmail {
  id: string;
  email: string;
  provider: string;
  type: string | null;
  imapHost?: string;
  imapPort?: number;
  smtpHost?: string;
  smtpPort?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmailResponse {
  message: string;
  count: number;
  data: LinkedEmail[];
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  emailFilter,
  onFilterChange,
  emailAccountType,
  onAccountTypeChange
}) => {
  const [availableEmails, setAvailableEmails] = useState<LinkedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSelectedEmail, setCurrentSelectedEmail] = useState<{ id: string; type: string | null } | null>(null);
  
  // Use combined auth to get djombi token
  const { djombi } = useCombinedAuth();
  const djombiTokens = djombi.token || "";
  
  // Import email store actions
  const { updateSelectedEmail, refreshCurrentCategory } = useEmailStore();

  // Enhanced email selection logic with proper type prioritization
  const selectBestEmailForType = (targetType: EmailAccountType): LinkedEmail | null => {
    console.log(`Selecting best email for type: ${targetType}`);
    console.log('Available emails:', availableEmails.map(e => ({ id: e.id, email: e.email, type: e.type })));
    
    if (targetType === "personal") {
      // For personal: prioritize type="personal", then fallback to type=null
      const personalEmails = availableEmails.filter(email => 
        email.type === "personal" || email.type === null
      );
      
      // Sort to prioritize actual "personal" type over null
      personalEmails.sort((a, b) => {
        if (a.type === "personal" && b.type === null) return -1;
        if (a.type === null && b.type === "personal") return 1;
        return 0;
      });
      
      const selected = personalEmails[0] || null;
      console.log('Selected personal email:', selected);
      return selected;
      
    } else if (targetType === "professional") {
      // For professional: only use type="professional", no fallback to null
      const professionalEmails = availableEmails.filter(email => 
        email.type === "professional"
      );
      
      const selected = professionalEmails[0] || null;
      console.log('Selected professional email:', selected);
      return selected;
    }
    
    return null;
  };

  // Fetch linked emails with improved error handling
  const fetchLinkedEmails = useCallback(async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (!djombiTokens) {
        console.log('No djombi token available');
        setError('Authentication token not available');
        return;
      }

      if (!djombi.isAuthenticated) {
        console.log('User not authenticated with djombi');
        setError('User not authenticated');
        return;
      }

      console.log("Fetching linked emails...");

      const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails?offset=1&limit=20`;
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

      let data: EmailResponse;
      try {
        data = JSON.parse(responseText);
        console.log("Parsed linked emails response:", data);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
      }

      if (data.data && Array.isArray(data.data)) {
        setAvailableEmails(data.data);
        
        // Smart email selection logic
        const selectedEmail = getSelectedLinkedEmail();
        
        if (selectedEmail) {
          // Verify the selected email still exists in the available emails
          const emailExists = data.data.find(email => 
            email.id === selectedEmail.id && email.type === selectedEmail.type
          );
          
          if (emailExists) {
            setCurrentSelectedEmail(selectedEmail);
            console.log('Keeping existing selected email:', selectedEmail);
          } else {
            console.log('Previously selected email no longer available, selecting new one');
            // Previously selected email doesn't exist, select a new one
            const bestEmail = selectBestEmailForType(emailAccountType);
            if (bestEmail) {
              setCurrentSelectedEmail({ id: bestEmail.id, type: bestEmail.type });
              setSelectedLinkedEmail(bestEmail.id, bestEmail.type);
              updateSelectedEmail(bestEmail.id, bestEmail.type);
            }
          }
        } else {
          // No email selected, select the best one for current account type
          console.log('No email previously selected, selecting best for type:', emailAccountType);
          const bestEmail = selectBestEmailForType(emailAccountType);
          if (bestEmail) {
            setCurrentSelectedEmail({ id: bestEmail.id, type: bestEmail.type });
            setSelectedLinkedEmail(bestEmail.id, bestEmail.type);
            updateSelectedEmail(bestEmail.id, bestEmail.type);
            console.log('Auto-selected email:', bestEmail);
          }
        }
      } else {
        console.error('Unexpected response structure:', data);
        setError('Unexpected response structure from server');
      }
    } catch (error) {
      console.error('Error fetching linked emails:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch linked emails');
    } finally {
      setIsLoading(false);
    }
  }, [djombiTokens, djombi.isAuthenticated, emailAccountType, updateSelectedEmail]);

  // Fetch emails when djombi auth is ready
  useEffect(() => {
    if (djombi.isAuthenticated && djombiTokens) {
      fetchLinkedEmails();
    }
  }, [djombi.isAuthenticated, djombiTokens, fetchLinkedEmails]);

  // Enhanced account type change handler with immediate email switching
  const handleAccountTypeChange = async (type: EmailAccountType) => {
    console.log(`Switching to ${type} account type`);
    
    const emailWithType = selectBestEmailForType(type);
    
    if (emailWithType) {
      // Update account type first
      onAccountTypeChange(type);
      
      // Update selected email in cookies
      setSelectedLinkedEmail(emailWithType.id, emailWithType.type);
      setCurrentSelectedEmail({ id: emailWithType.id, type: emailWithType.type });
      
      console.log(`Switched to ${type} email account:`, {
        email: emailWithType.email,
        id: emailWithType.id,
        type: emailWithType.type,
        prioritized: emailWithType.type !== null ? 'typed email' : 'null fallback'
      });
      
      // Update the email store to use the new selected email and force refresh
      updateSelectedEmail(emailWithType.id, emailWithType.type);
      
      // Force refresh current category with new email selection
      setTimeout(() => {
        refreshCurrentCategory();
      }, 200);
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('emailAccountChanged', { 
        detail: { 
          emailId: emailWithType.id, 
          type: emailWithType.type,
          email: emailWithType.email,
          accountType: type
        } 
      }));
    } else {
      console.warn(`No email found for type: ${type}`);
      setError(`No ${type} email account found. Please add a ${type} email account.`);
    }
  };

  const handleFilterChange = (key: keyof EmailFilter, value: any) => {
    onFilterChange({ ...emailFilter, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({ 
      searchTerm: "", 
      dateRange: "all", 
      hasAttachment: null, 
      isRead: null 
    });
  };

  // Get current account type display with better null handling
  const getCurrentAccountTypeDisplay = (): string => {
    if (!currentSelectedEmail) return "No Email Selected";
    
    if (currentSelectedEmail.type === "professional") return "Professional Email";
    if (currentSelectedEmail.type === "personal") return "Personal Email";
    if (currentSelectedEmail.type === null) {
      // Check if there's a proper personal email available
      const hasProperPersonal = availableEmails.some(email => email.type === "personal");
      return hasProperPersonal ? "Personal Email (Legacy)" : "Personal Email";
    }
    return "Personal Email";
  };

  // Check if email type is available
  const isEmailTypeAvailable = (type: EmailAccountType): boolean => {
    if (type === "personal") {
      return availableEmails.some(email => 
        email.type === "personal" || email.type === null
      );
    } else if (type === "professional") {
      return availableEmails.some(email => email.type === "professional");
    }
    return false;
  };

  // Get display email for type
  const getDisplayEmailForType = (type: EmailAccountType): string => {
    const bestEmail = selectBestEmailForType(type);
    return bestEmail ? bestEmail.email : "Not available";
  };

  // Retry function for error state
  const handleRetry = () => {
    setError(null);
    fetchLinkedEmails();
  };

  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
      <div className="sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-2">
          <div className="flex-shrink-0">
            {/* Email Inbox title with dropdown chevron */}
            <div className="flex items-center gap-3 mb-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 hover:bg-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-500"
                    title="Switch email account type"
                    disabled={isLoading}
                  >
                    <ChevronDown className="w-5 h-5 text-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {/* Personal Email Option */}
                  <DropdownMenuItem 
                    onClick={() => handleAccountTypeChange("personal")}
                    className={`flex items-center gap-2 ${
                      emailAccountType === "personal" ? 'bg-blue-50' : ''
                    }`}
                    disabled={!isEmailTypeAvailable("personal")}
                  >
                    <User className="w-4 h-4" />
                    <div className="flex flex-col flex-1">
                      <span className="font-medium">Personal Email</span>
                      <span className="text-xs text-gray-500 truncate">
                        {getDisplayEmailForType("personal")}
                      </span>
                    </div>
                    {emailAccountType === "personal" && (
                      <span className="text-xs text-blue-600">✓</span>
                    )}
                  </DropdownMenuItem>
                  
                  {/* Professional Email Option */}
                  <DropdownMenuItem 
                    onClick={() => handleAccountTypeChange("professional")}
                    className={`flex items-center gap-2 ${
                      emailAccountType === "professional" ? 'bg-blue-50' : ''
                    }`}
                    disabled={!isEmailTypeAvailable("professional")}
                  >
                    <Briefcase className="w-4 h-4" />
                    <div className="flex flex-col flex-1">
                      <span className="font-medium">Professional Email</span>
                      <span className="text-xs text-gray-500 truncate">
                        {getDisplayEmailForType("professional")}
                      </span>
                    </div>
                    {emailAccountType === "professional" && (
                      <span className="text-xs text-blue-600">✓</span>
                    )}
                  </DropdownMenuItem>
                  
                  {availableEmails.length === 0 && !isLoading && !error && (
                    <DropdownMenuItem disabled>
                      No linked emails found
                    </DropdownMenuItem>
                  )}
                  
                  {isLoading && (
                    <DropdownMenuItem disabled>
                      Loading emails...
                    </DropdownMenuItem>
                  )}

                  {error && (
                    <DropdownMenuItem onClick={handleRetry} className="text-red-600">
                      Error: {error.length > 30 ? `${error.substring(0, 30)}...` : error}
                      <br />
                      <span className="text-xs text-blue-600">Click to retry</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex flex-col">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Email Inbox
                </h1>
                {currentSelectedEmail && (
                  <p className="text-sm text-white/80">
                    {getCurrentAccountTypeDisplay()}
                  </p>
                )}
                {error && (
                  <p className="text-xs text-red-200 mt-1">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto sm:justify-start">
            {/* Search and Filter Section */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search..."
                  value={emailFilter.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="pl-10 pr-4 w-48 h-10 bg-white/90 backdrop-blur-sm border-white/20 rounded-xl text-sm"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/90 backdrop-blur-sm h-10 px-3 border-white/20 hover:bg-white">
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">Filters</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => handleFilterChange('hasAttachment', emailFilter.hasAttachment === true ? null : true)}
                  >
                    {emailFilter.hasAttachment === true ? "✓ " : ""}With Attachments
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleFilterChange('isRead', emailFilter.isRead === false ? null : false)}
                  >
                    {emailFilter.isRead === false ? "✓ " : ""}Unread Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={clearFilters}>
                    Clear Filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilterBar;















































// 10:34
// import { Search, Filter, User, Briefcase, ChevronDown } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { EmailFilter, EmailAccountType } from "@/lib/types/email2";
// import { useState, useEffect, useCallback } from "react";
// import { getSelectedLinkedEmail, setSelectedLinkedEmail } from "@/lib/utils/cookies";
// import { useCombinedAuth } from "@/components/providers/useCombinedAuth";
// import { useEmailStore } from "@/store/email-store";

// interface SearchFilterBarProps {
//   emailFilter: EmailFilter;
//   onFilterChange: (filter: EmailFilter) => void;
//   emailAccountType: EmailAccountType;
//   onAccountTypeChange: (type: EmailAccountType) => void;
// }

// interface LinkedEmail {
//   id: string;
//   email: string;
//   provider: string;
//   type: string | null;
//   imapHost?: string;
//   imapPort?: number;
//   smtpHost?: string;
//   smtpPort?: number;
//   isActive: boolean;
//   createdAt: string;
//   updatedAt: string;
// }

// interface EmailResponse {
//   message: string;
//   count: number;
//   data: LinkedEmail[];
// }

// const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
//   emailFilter,
//   onFilterChange,
//   emailAccountType,
//   onAccountTypeChange
// }) => {
//   const [availableEmails, setAvailableEmails] = useState<LinkedEmail[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [currentSelectedEmail, setCurrentSelectedEmail] = useState<{ id: string; type: string | null } | null>(null);
  
//   // Use combined auth to get djombi token - following the same pattern as your main component
//   const { djombi } = useCombinedAuth();
//   const djombiTokens = djombi.token || "";
  
//   // Import email store actions
//   const { updateSelectedEmail, refreshCurrentCategory } = useEmailStore();

//   // Fetch linked emails with improved error handling
//   const fetchLinkedEmails = useCallback(async () => {
//     // Prevent multiple simultaneous calls
//     if (isLoading) return;
    
//     try {
//       setIsLoading(true);
//       setError(null);
      
//       // Check if djombi token is available - consistent with your main component pattern
//       if (!djombiTokens) {
//         console.log('No djombi token available');
//         setError('Authentication token not available');
//         return;
//       }

//       if (!djombi.isAuthenticated) {
//         console.log('User not authenticated with djombi');
//         setError('User not authenticated');
//         return;
//       }

//       console.log("Djombi token available:", djombiTokens ? `${djombiTokens.substring(0, 10)}...` : 'No token');

//       const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails?offset=1&limit=20`;
//       console.log("Fetching linked emails from:", apiEndpoint);

//       const response = await fetch(apiEndpoint, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${djombiTokens}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       const responseText = await response.text();
//       console.log("Raw response:", responseText);

//       if (!response.ok) {
//         throw new Error(`API error: ${response.status} ${response.statusText}`);
//       }

//       let data: EmailResponse;
//       try {
//         data = JSON.parse(responseText);
//         console.log("Parsed linked emails response:", data);
//       } catch (parseError) {
//         console.error("Failed to parse response as JSON:", parseError);
//         throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
//       }

//       if (data.data && Array.isArray(data.data)) {
//         setAvailableEmails(data.data);
        
//         // Set current selected email from cookies
//         const selectedEmail = getSelectedLinkedEmail();
//         if (selectedEmail) {
//           setCurrentSelectedEmail(selectedEmail);
//         } else if (data.data.length > 0) {
//           // If no email is selected, select the first one
//           const firstEmail = data.data[0];
//           setCurrentSelectedEmail({ id: firstEmail.id, type: firstEmail.type || null });
//           setSelectedLinkedEmail(firstEmail.id, firstEmail.type || null);
//         }
//       } else {
//         console.error('Unexpected response structure:', data);
//         setError('Unexpected response structure from server');
//       }
//     } catch (error) {
//       console.error('Error fetching linked emails:', error);
//       setError(error instanceof Error ? error.message : 'Failed to fetch linked emails');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [djombiTokens, djombi.isAuthenticated]); // Dependencies match your main component pattern

//   // Fetch emails when djombi auth is ready - consistent with your main component
//   useEffect(() => {
//     if (djombi.isAuthenticated && djombiTokens) {
//       fetchLinkedEmails();
//     }
//   }, [djombi.isAuthenticated, djombiTokens, fetchLinkedEmails]);

//   // Handle account type change - Updated to prioritize typed emails over null
//   const handleAccountTypeChange = (type: EmailAccountType) => {
//     // Find emails with the matching type, prioritizing non-null types
//     const emailsWithType = availableEmails.filter(email => {
//       if (type === "personal") {
//         return email.type === "personal" || email.type === null;
//       } else if (type === "professional") {
//         return email.type === "professional";
//       }
//       return false;
//     });
    
//     // Sort to prioritize emails with actual type over null
//     emailsWithType.sort((a, b) => {
//       // If one has a type and the other is null, prioritize the one with type
//       if (a.type !== null && b.type === null) return -1;
//       if (a.type === null && b.type !== null) return 1;
//       return 0;
//     });
    
//     const emailWithType = emailsWithType[0]; // Take the first (highest priority) email
    
//     if (emailWithType) {
//       // Update selected email in cookies using the proper function
//       setSelectedLinkedEmail(emailWithType.id, emailWithType.type || null);
//       setCurrentSelectedEmail({ id: emailWithType.id, type: emailWithType.type || null });
//       onAccountTypeChange(type);
      
//       // Update the email store to use the new selected email and refresh current category
//       updateSelectedEmail(emailWithType.id, emailWithType.type || null);
      
//       console.log(`Switched to ${type} email account:`, {
//         email: emailWithType.email,
//         id: emailWithType.id,
//         type: emailWithType.type,
//         prioritized: emailWithType.type !== null ? 'typed email' : 'null fallback'
//       });
      
//       // Dispatch custom event for other components that might need to know about the change
//       window.dispatchEvent(new CustomEvent('emailAccountChanged', { 
//         detail: { 
//           emailId: emailWithType.id, 
//           type: emailWithType.type,
//           email: emailWithType.email,
//           accountType: type
//         } 
//       }));
//     } else {
//       console.warn(`No email found for type: ${type}`);
//     }
//   };

//   const handleFilterChange = (key: keyof EmailFilter, value: any) => {
//     onFilterChange({ ...emailFilter, [key]: value });
//   };

//   const clearFilters = () => {
//     onFilterChange({ 
//       searchTerm: "", 
//       dateRange: "all", 
//       hasAttachment: null, 
//       isRead: null 
//     });
//   };

//   // Get unique types from available emails
//   const getUniqueTypes = (): string[] => {
//     const types = availableEmails.map(email => email.type || "personal");
//     return [...new Set(types)];
//   };

//   // Get current account type display - Updated to handle null types better
//   const getCurrentAccountTypeDisplay = (): string => {
//     if (currentSelectedEmail?.type === "professional") return "Professional Email";
//     if (currentSelectedEmail?.type === "personal") return "Personal Email";
//     if (currentSelectedEmail?.type === null) {
//       // Check if there's a proper personal email available
//       const hasProperPersonal = availableEmails.some(email => email.type === "personal");
//       return hasProperPersonal ? "Personal Email (Legacy)" : "Personal Email";
//     }
//     return "Personal Email";
//   };

//   // Retry function for error state
//   const handleRetry = () => {
//     setError(null);
//     fetchLinkedEmails();
//   };

//   return (
//     <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
//       <div className="sm:p-6">
//         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-2">
//           <div className="flex-shrink-0">
//             {/* Email Inbox title with dropdown chevron */}
//             <div className="flex items-center gap-3 mb-2">
//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <button
//                     className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 hover:bg-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-500"
//                     title="Switch email account type"
//                     disabled={isLoading}
//                   >
//                     <ChevronDown className="w-5 h-5 text-white" />
//                   </button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent align="start" className="w-64">
//                   {/* First show Personal and Professional options */}
//                   {/* Personal Email Option - Show proper prioritization */}
//                   <DropdownMenuItem 
//                     onClick={() => handleAccountTypeChange("personal")}
//                     className={`flex items-center gap-2 ${
//                       (currentSelectedEmail?.type === "personal" || 
//                        (currentSelectedEmail?.type === null && !availableEmails.find(e => e.type === "personal"))) 
//                         ? 'bg-blue-50' : ''
//                     }`}
//                   >
//                     <User className="w-4 h-4" />
//                     <div className="flex flex-col flex-1">
//                       <span className="font-medium">Personal Email</span>
//                       {(() => {
//                         // Find the best personal email to display
//                         const personalEmails = availableEmails.filter(email => 
//                           email.type === "personal" || email.type === null
//                         );
//                         personalEmails.sort((a, b) => {
//                           if (a.type !== null && b.type === null) return -1;
//                           if (a.type === null && b.type !== null) return 1;
//                           return 0;
//                         });
//                         const bestPersonalEmail = personalEmails[0];
                        
//                         return bestPersonalEmail ? (
//                           <span className="text-xs text-gray-500 truncate">
//                             {bestPersonalEmail.email}
//                             {bestPersonalEmail.type === null && personalEmails.length > 1 && (
//                               <span className="text-orange-500 ml-1">(legacy)</span>
//                             )}
//                           </span>
//                         ) : null;
//                       })()}
//                     </div>
//                     {(currentSelectedEmail?.type === "personal" || 
//                       (currentSelectedEmail?.type === null && !availableEmails.find(e => e.type === "personal"))) && (
//                       <span className="text-xs text-blue-600">✓</span>
//                     )}
//                   </DropdownMenuItem>
                  
//                   <DropdownMenuItem 
//                     onClick={() => handleAccountTypeChange("professional")}
//                     className={`flex items-center gap-2 ${
//                       currentSelectedEmail?.type === "professional" ? 'bg-blue-50' : ''
//                     }`}
//                   >
//                     <Briefcase className="w-4 h-4" />
//                     <div className="flex flex-col flex-1">
//                       <span className="font-medium">Professional Email</span>
//                       {availableEmails.find(email => email.type === "professional") && (
//                         <span className="text-xs text-gray-500 truncate">
//                           {availableEmails.find(email => email.type === "professional")?.email}
//                         </span>
//                       )}
//                     </div>
//                     {currentSelectedEmail?.type === "professional" && (
//                       <span className="text-xs text-blue-600">✓</span>
//                     )}
//                   </DropdownMenuItem>
                  
//                   {availableEmails.length === 0 && !isLoading && !error && (
//                     <DropdownMenuItem disabled>
//                       No linked emails found
//                     </DropdownMenuItem>
//                   )}
                  
//                   {isLoading && (
//                     <DropdownMenuItem disabled>
//                       Loading emails...
//                     </DropdownMenuItem>
//                   )}

//                   {error && (
//                     <DropdownMenuItem onClick={handleRetry} className="text-red-600">
//                       Error: {error.length > 30 ? `${error.substring(0, 30)}...` : error}
//                       <br />
//                       <span className="text-xs text-blue-600">Click to retry</span>
//                     </DropdownMenuItem>
//                   )}
//                 </DropdownMenuContent>
//               </DropdownMenu>
//               <div className="flex flex-col">
//                 <h1 className="text-2xl sm:text-3xl font-bold text-white">
//                   Email Inbox
//                 </h1>
//                 {currentSelectedEmail && (
//                   <p className="text-sm text-white/80">
//                     {getCurrentAccountTypeDisplay()}
//                   </p>
//                 )}
//                 {error && (
//                   <p className="text-xs text-red-200 mt-1">
//                     Failed to load email accounts
//                   </p>
//                 )}
//               </div>
//             </div>
//           </div>
          
//           <div className="flex items-center gap-4 w-full sm:w-auto sm:justify-start">
//             {/* Search and Filter Section */}
//             <div className="flex items-center gap-2">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                 <Input
//                   placeholder="Search..."
//                   value={emailFilter.searchTerm}
//                   onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
//                   className="pl-10 pr-4 w-48 h-10 bg-white/90 backdrop-blur-sm border-white/20 rounded-xl text-sm"
//                 />
//               </div>
              
//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/90 backdrop-blur-sm h-10 px-3 border-white/20 hover:bg-white">
//                     <Filter className="w-4 h-4" />
//                     <span className="hidden sm:inline">Filters</span>
//                   </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent align="end" className="w-48">
//                   <DropdownMenuItem 
//                     onClick={() => handleFilterChange('hasAttachment', emailFilter.hasAttachment === true ? null : true)}
//                   >
//                     {emailFilter.hasAttachment === true ? "✓ " : ""}With Attachments
//                   </DropdownMenuItem>
//                   <DropdownMenuItem 
//                     onClick={() => handleFilterChange('isRead', emailFilter.isRead === false ? null : false)}
//                   >
//                     {emailFilter.isRead === false ? "✓ " : ""}Unread Only
//                   </DropdownMenuItem>
//                   <DropdownMenuItem onClick={clearFilters}>
//                     Clear Filters
//                   </DropdownMenuItem>
//                 </DropdownMenuContent>
//               </DropdownMenu>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SearchFilterBar;
















































// import { Search, Filter, User, Briefcase, ChevronDown } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { EmailFilter, EmailAccountType } from "@/lib/types/email2";
// import { useState, useEffect } from "react";

// interface SearchFilterBarProps {
//   emailFilter: EmailFilter;
//   onFilterChange: (filter: EmailFilter) => void;
//   emailAccountType: EmailAccountType;
//   onAccountTypeChange: (type: EmailAccountType) => void;
// }

// interface EmailResponse {
//   type: string;
//   // Add other properties as needed
// }

// const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
//   emailFilter,
//   onFilterChange,
//   emailAccountType,
//   onAccountTypeChange
// }) => {
//   const [availableTypes, setAvailableTypes] = useState<string[]>([]);

//   // Fetch email data and extract available types
//   useEffect(() => {
//     const fetchEmailTypes = async () => {
//       try {
//         const linkedEmailId = localStorage.getItem('linkedEmailId');
//         if (!linkedEmailId) return;

//         const response = await fetch(
//           `https://email-service-latest-agqz.onrender.com/api/v1/emails?offset=1&limit=20`
//         );
        
//         if (response.ok) {
//           const data: EmailResponse[] = await response.json();
//           // Extract unique types from the response
//           const types = [...new Set(data.map(email => email.type))];
//           setAvailableTypes(types);
//         }
//       } catch (error) {
//         console.error('Error fetching email types:', error);
//       }
//     };

//     fetchEmailTypes();
//   }, []);

//   const handleFilterChange = (key: keyof EmailFilter, value: any) => {
//     onFilterChange({ ...emailFilter, [key]: value });
//   };

//   const clearFilters = () => {
//     onFilterChange({ 
//       searchTerm: "", 
//       dateRange: "all", 
//       hasAttachment: null, 
//       isRead: null 
//     });
//   };

//   return (
//     <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
//       <div className="sm:p-6">
//         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-2">
//           <div className="flex-shrink-0">
//             {/* Email Inbox title with dropdown chevron */}
//             <div className="flex items-center gap-3 mb-2">
//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <button
//                     className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 hover:bg-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-500"
//                     title="Switch email account type"
//                   >
//                     <ChevronDown className="w-5 h-5 text-white" />
//                   </button>
//                 </DropdownMenuTrigger>
//               <DropdownMenuContent align="start" className="w-48">
//                 <DropdownMenuItem 
//                   onClick={() => onAccountTypeChange("personal")}
//                   className="flex items-center gap-2"
//                 >
//                   <User className="w-4 h-4" />
//                   Personal Email
//                 </DropdownMenuItem>
//                 <DropdownMenuItem 
//                   onClick={() => onAccountTypeChange("professional")}
//                   className="flex items-center gap-2"
//                 >
//                   <Briefcase className="w-4 h-4" />
//                   Professional Email
//                 </DropdownMenuItem>
//                 {/* Dynamic types from API response */}
//                 {availableTypes.map((type) => (
//                   <DropdownMenuItem 
//                     key={type}
//                     onClick={() => onAccountTypeChange(type as EmailAccountType)}
//                     className="flex items-center gap-2"
//                   >
//                     {type === "personal" ? (
//                       <User className="w-4 h-4" />
//                     ) : (
//                       <Briefcase className="w-4 h-4" />
//                     )}
//                     <span className="capitalize">{type}</span>
//                   </DropdownMenuItem>
//                 ))}
//               </DropdownMenuContent>
//             </DropdownMenu>
//               <h1 className="text-2xl sm:text-3xl font-bold text-white">
//                 Email Inbox
//               </h1>
//             </div>
//           </div>
          
//           <div className="flex items-center gap-4 w-full sm:w-auto sm:justify-start">
//             {/* Search and Filter Section */}
//             <div className="flex items-center gap-2">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                 <Input
//                   placeholder="Search..."
//                   value={emailFilter.searchTerm}
//                   onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
//                   className="pl-10 pr-4 w-48 h-10 bg-white/90 backdrop-blur-sm border-white/20 rounded-xl text-sm"
//                 />
//               </div>
              
//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/90 backdrop-blur-sm h-10 px-3 border-white/20 hover:bg-white">
//                     <Filter className="w-4 h-4" />
//                     <span className="hidden sm:inline">Filters</span>
//                   </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent align="end" className="w-48">
//                   <DropdownMenuItem 
//                     onClick={() => handleFilterChange('hasAttachment', emailFilter.hasAttachment === true ? null : true)}
//                   >
//                     {emailFilter.hasAttachment === true ? "✓ " : ""}With Attachments
//                   </DropdownMenuItem>
//                   <DropdownMenuItem 
//                     onClick={() => handleFilterChange('isRead', emailFilter.isRead === false ? null : false)}
//                   >
//                     {emailFilter.isRead === false ? "✓ " : ""}Unread Only
//                   </DropdownMenuItem>
//                   <DropdownMenuItem onClick={clearFilters}>
//                     Clear Filters
//                   </DropdownMenuItem>
//                 </DropdownMenuContent>
//               </DropdownMenu>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SearchFilterBar;



















































// import { Search, Filter, User, Briefcase, ChevronDown } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { EmailFilter, EmailAccountType } from "@/lib/types/email2";

// interface SearchFilterBarProps {
//   emailFilter: EmailFilter;
//   onFilterChange: (filter: EmailFilter) => void;
//   emailAccountType: EmailAccountType;
//   onAccountTypeChange: (type: EmailAccountType) => void;
// }

// const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
//   emailFilter,
//   onFilterChange,
//   emailAccountType,
//   onAccountTypeChange
// }) => {
//   const handleFilterChange = (key: keyof EmailFilter, value: any) => {
//     onFilterChange({ ...emailFilter, [key]: value });
//   };

//   const clearFilters = () => {
//     onFilterChange({ 
//       searchTerm: "", 
//       dateRange: "all", 
//       hasAttachment: null, 
//       isRead: null 
//     });
//   };

//   return (
//     <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-2">
//       <div className="flex-shrink-0">
//         <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 mb-2">
//           Email Inbox
//         </h1>
//       </div>
      
//       <div className="flex items-center gap-4 w-full sm:w-auto sm:justify-start">
//         {/* Email Account Type Toggle */}
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button
//               variant="outline"
//               className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50"
//             >
//               {emailAccountType === "personal" ? (
//                 <User className="w-4 h-4" />
//               ) : (
//                 <Briefcase className="w-4 h-4" />
//               )}
//               <span className="capitalize">{emailAccountType}</span>
//               <ChevronDown className="w-4 h-4" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end" className="w-48">
//             <DropdownMenuItem 
//               onClick={() => onAccountTypeChange("personal")}
//               className="flex items-center gap-2"
//             >
//               <User className="w-4 h-4" />
//               Personal Email
//             </DropdownMenuItem>
//             <DropdownMenuItem 
//               onClick={() => onAccountTypeChange("professional")}
//               className="flex items-center gap-2"
//             >
//               <Briefcase className="w-4 h-4" />
//               Professional Email
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>

//         {/* Search and Filter Section */}
//         <div className="flex items-center gap-2">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//             <Input
//               placeholder="Search..."
//               value={emailFilter.searchTerm}
//               onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
//               className="pl-10 pr-4 w-48 h-10 bg-white/80 backdrop-blur-sm border-gray-200 rounded-xl text-sm"
//             />
//           </div>
          
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/80 backdrop-blur-sm h-10 px-3">
//                 <Filter className="w-4 h-4" />
//                 <span className="hidden sm:inline">Filters</span>
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-48">
//               <DropdownMenuItem 
//                 onClick={() => handleFilterChange('hasAttachment', emailFilter.hasAttachment === true ? null : true)}
//               >
//                 {emailFilter.hasAttachment === true ? "✓ " : ""}With Attachments
//               </DropdownMenuItem>
//               <DropdownMenuItem 
//                 onClick={() => handleFilterChange('isRead', emailFilter.isRead === false ? null : false)}
//               >
//                 {emailFilter.isRead === false ? "✓ " : ""}Unread Only
//               </DropdownMenuItem>
//               <DropdownMenuItem onClick={clearFilters}>
//                 Clear Filters
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SearchFilterBar;