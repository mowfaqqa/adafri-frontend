"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Pencil, 
  Search, 
  Menu, 
  X, 
  Mail, 
  Send, 
  FileText, 
  Shield, 
  Calendar,
  Bell,
  Settings,
  User,
  ChevronDown,
  Inbox,
  Filter,
  RefreshCw
} from "lucide-react";
import { useEmailStore } from "@/lib/store/email-store";
import { EmailCategory } from "@/lib/types/email";
import { EmailColumns2 } from "@/components/email/EmailColumns2";
import { EmailSent } from "@/components/email/EmailSections/EmailSent";
import { LinkEmailModal } from "@/components/email/EmailSections/LinkEmailModal";
import { ComposeModal } from "@/components/email/EmailSections/AddEmailComponents/ComposeModal";
import { EmailDraft } from "@/components/email/EmailSections/EmailDraftComponents/EmailDraft";
import { EmailSpam } from "@/components/email/EmailSections/EmailSpamComponents/EmailSpam";
import ProfessionalEmailInbox from "@/components/email/EmailSections/EmailInboxComponents/ProfessionalEmailInbox";
import { useCombinedAuth } from "@/components/providers/useCombinedAuth";

export default function EmailDashboard() {
  // Get combined authentication state at the page level
  const { isFullyAuthenticated, isLoading: authLoading, hasError, adafri, djombi } = useCombinedAuth();
  
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    activeCategory,
    setActiveCategory,
    fetchEmails,
    isLoading,
    loadingError,
    draftEmail,
    updateDraft
  } = useEmailStore();

  // Check if email is linked
  const [isEmailLinked, setIsEmailLinked] = useState(false);

  // Tab configuration with icons and colors
  const tabConfig = {
    inbox: { icon: Inbox, label: "Inbox", color: "from-blue-500 to-blue-600", count: 12 },
    sent: { icon: Send, label: "Sent", color: "from-green-500 to-green-600", count: 8 },
    draft: { icon: FileText, label: "Draft", color: "from-yellow-500 to-yellow-600", count: 3 },
    spam: { icon: Shield, label: "Spam", color: "from-red-500 to-red-600", count: 2 },
    agenda: { icon: Calendar, label: "Agenda", color: "from-purple-500 to-purple-600", count: 5 }
  };

  useEffect(() => {
    // Only run email-related logic if user is fully authenticated
    if (!isFullyAuthenticated) return;

    // Check localStorage on component mount
    const checkEmailLink = () => {
      const accessToken = localStorage.getItem('accessToken');
      const linkedEmailId = localStorage.getItem('linkedEmailId');
      setIsEmailLinked(!!accessToken && !!linkedEmailId);
    };

    checkEmailLink();

    // Also fetch initial emails for the active category
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('accessToken');
      const linkedEmailId = localStorage.getItem('linkedEmailId');

      if (accessToken && linkedEmailId) {
        fetchEmails(activeCategory);
      }
    }

    // Listen for storage changes (in case user links email in another tab)
    window.addEventListener('storage', checkEmailLink);

    return () => {
      window.removeEventListener('storage', checkEmailLink);
    };
  }, [activeCategory, fetchEmails, isFullyAuthenticated]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const category = value as EmailCategory;
    setActiveCategory(category);
    setIsMobileMenuOpen(false); // Close mobile menu on tab change
  };

  // Handler for editing a draft
  const handleEditDraft = (draft: any) => {
    updateDraft(draft);
    setIsComposeOpen(true);
  };

  // Show loading state during authentication
  if (authLoading) {
    return (
      // <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20">
          <div className="relative mb-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
              <div className="absolute inset-2 bg-white rounded-full"></div>
            </div>
            <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-ping opacity-20"></div>
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Setting Up Your Account
          </h3>
          <p className="text-gray-600">Please wait while we prepare your email dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-50 p-4">
        <div className="text-center max-w-md w-full p-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-red-100">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-red-400 to-pink-500 flex items-center justify-center">
            <X className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-red-600 mb-2">Authentication Error</h3>
          <p className="text-gray-600 mb-6">{djombi.error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl py-3 transition-all duration-300 hover:scale-105"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show login prompt if not fully authenticated
  if (!isFullyAuthenticated) {
    return (
      // <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="flex items-center justify-center min-h-screen bg-white p-4">
        <div className="text-center max-w-md w-full p-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Welcome Back
          </h2>
          <p className="text-gray-600 mb-6">
            {adafri.isAuthenticated 
              ? 'Setting up your Djombi profile...' 
              : 'Please log in to access your email dashboard'
            }
          </p>
          {!adafri.isAuthenticated && (
            <Button
              onClick={adafri.login}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl py-3 transition-all duration-300 hover:scale-105"
            >
              <Mail className="w-4 h-4 mr-2" />
              Login to Continue
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Component to render for the selected category
  const renderEmailComponent = () => {
    // Show loading state
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 p-4">
          <div className="relative mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
              <div className="absolute inset-2 bg-white rounded-full"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading your emails...</p>
        </div>
      );
    }

    // Show error state
    if (loadingError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-red-400 to-pink-500 flex items-center justify-center">
            <X className="w-8 h-8 text-white" />
          </div>
          <p className="text-red-500 mb-4 font-medium">{loadingError}</p>
          <Button 
            onClick={() => fetchEmails(activeCategory)}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      );
    }

    // Render the appropriate component based on category
    switch (activeCategory) {
      case "sent":
        return <EmailSent />;
      case "draft":
        return <EmailDraft />;
      case "spam":
        return <EmailSpam />;
      case "agenda":
        return (
          <div className="text-center p-8">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-purple-500" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Agenda Coming Soon</h3>
            <p className="text-gray-600">We're working on bringing you calendar integration.</p>
          </div>
        );
      case "inbox":
      default:
        return <ProfessionalEmailInbox />;
    }
  };

  const currentTab = tabConfig[activeCategory as keyof typeof tabConfig];

  // At this point, user is fully authenticated, render the email dashboard
  return (
    <div className="min-h-screen bg-white/90 backdrop-blur-sm p-4 lg:p-6">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentTab?.color}`}></div>
              <h1 className="font-bold text-gray-800">{currentTab?.label}</h1>
              {currentTab?.count && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {currentTab.count}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="p-2"
            >
              <Filter className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/60 border-gray-200/50 rounded-xl"
            />
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-2 pt-3">
              <Button variant="outline" size="sm" className="rounded-full text-xs">
                Unread
              </Button>
              <Button variant="outline" size="sm" className="rounded-full text-xs">
                Attachments
              </Button>
              <Button variant="outline" size="sm" className="rounded-full text-xs">
                Important
              </Button>
              <Button variant="outline" size="sm" className="rounded-full text-xs">
                Today
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white/95 backdrop-blur-md shadow-2xl border-r border-gray-200/50" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Email Dashboard
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="space-y-2">
                {Object.entries(tabConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  const isActive = activeCategory === key;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => handleTabChange(key)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
                        isActive
                          ? `bg-gradient-to-r ${config.color} text-white shadow-lg transform scale-105`
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                        <span className="font-medium">{config.label}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {config.count}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <LinkEmailModal />
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="p-4 lg:p-6">
        <Tabs
          value={activeCategory}
          onValueChange={handleTabChange}
        >
          {/* Desktop Header */}
          <div className="hidden lg:flex justify-between items-center mb-8">
           
          </div>

          {/* Desktop Tabs */}
          <div className="hidden lg:block">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="grid grid-cols-5 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-2">
                {Object.entries(tabConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  
                  return (
                    <TabsTrigger 
                      key={key}
                      value={key} 
                      className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:text-black data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3"
                      style={{
                        background: activeCategory === key ? `linear-gradient(to right, ${config.color.replace('from-', '').replace(' to-', ', ')})` : ''
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-4 h-4 ${activeCategory === key ? 'animate-pulse' : ''}`} />
                        <span className="font-medium">{config.label}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          activeCategory === key ? 'bg-white/20' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {config.count}
                        </span>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              
              <div className="ml-4">
                <LinkEmailModal />
              </div>
            </div>   
          </div>

          {/* Content Area */}
          <TabsContent value={activeCategory} className="mt-0">
            <div className="bg-white/40 backdrop-blur-sm rounded-3xl border border-white/20 min-h-[600px] p-2 lg:p-6">
              {renderEmailComponent()}
            </div>
          </TabsContent>
        </Tabs>

        {/* Floating Compose Button */}
        <Button
          className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-2xl border-4 border-white/20 transition-all duration-300 hover:scale-110 z-30"
          onClick={() => setIsComposeOpen(true)}
        >
          <Pencil className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
        </Button>
      </main>

      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
      />

      <style jsx>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }
      `}</style>
    </div>
  );
}















































// "use client";
// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Pencil } from "lucide-react";
// import { useEmailStore } from "@/lib/store/email-store";
// import { EmailCategory } from "@/lib/types/email";
// import { EmailColumns2 } from "@/components/email/EmailColumns2";
// import { EmailSent } from "@/components/email/EmailSections/EmailSent";
// import { LinkEmailModal } from "@/components/email/EmailSections/LinkEmailModal";
// import { ComposeModal } from "@/components/email/EmailSections/ComposeModal";
// import { EmailDraft } from "@/components/email/EmailSections/EmailDraft";
// import { EmailSpam } from "@/components/email/EmailSections/EmailSpam";
// import ProfessionalEmailInbox from "@/components/email/EmailSections/ProfessionalEmailInbox";
// import { useCombinedAuth } from "@/components/providers/useCombinedAuth";

// export default function EmailDashboard() {
//   // Get combined authentication state at the page level
//   const { isFullyAuthenticated, isLoading: authLoading, hasError, adafri, djombi } = useCombinedAuth();
  
//   const [isComposeOpen, setIsComposeOpen] = useState(false);
//   const {
//     activeCategory,
//     setActiveCategory,
//     fetchEmails,
//     isLoading,
//     loadingError,
//     draftEmail,
//     updateDraft
//   } = useEmailStore();

//   // Check if email is linked
//   const [isEmailLinked, setIsEmailLinked] = useState(false);

//   useEffect(() => {
//     // Only run email-related logic if user is fully authenticated
//     if (!isFullyAuthenticated) return;

//     // Check localStorage on component mount
//     const checkEmailLink = () => {
//       const accessToken = localStorage.getItem('accessToken');
//       const linkedEmailId = localStorage.getItem('linkedEmailId');
//       setIsEmailLinked(!!accessToken && !!linkedEmailId);
//     };

//     checkEmailLink();

//     // Also fetch initial emails for the active category
//     if (typeof window !== 'undefined') {
//       const accessToken = localStorage.getItem('accessToken');
//       const linkedEmailId = localStorage.getItem('linkedEmailId');

//       if (accessToken && linkedEmailId) {
//         fetchEmails(activeCategory);
//       }
//     }

//     // Listen for storage changes (in case user links email in another tab)
//     window.addEventListener('storage', checkEmailLink);

//     return () => {
//       window.removeEventListener('storage', checkEmailLink);
//     };
//   }, [activeCategory, fetchEmails, isFullyAuthenticated]);

//   // Handle tab change
//   const handleTabChange = (value: string) => {
//     const category = value as EmailCategory;
//     setActiveCategory(category);
//   };

//   // Handler for editing a draft
//   const handleEditDraft = (draft: any) => {
//     updateDraft(draft);
//     setIsComposeOpen(true);
//   };

//   // Show loading state during authentication
//   if (authLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Setting up your account...</p>
//         </div>
//       </div>
//     );
//   }

//   // Show error state
//   if (hasError) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <div className="text-red-600 text-xl mb-2">Authentication Error</div>
//           <p className="text-gray-600 mb-4">{djombi.error}</p>
//           <button
//             onClick={() => window.location.reload()}
//             className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Show login prompt if not fully authenticated
//   if (!isFullyAuthenticated) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
//           <p className="text-gray-600 mb-4">
//             {adafri.isAuthenticated 
//               ? 'Setting up your Djombi profile...' 
//               : 'Please log in to access your email dashboard'
//             }
//           </p>
//           {!adafri.isAuthenticated && (
//             <button
//               onClick={adafri.login}
//               className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
//             >
//               Login
//             </button>
//           )}
//         </div>
//       </div>
//     );
//   }

//   // Component to render for the selected category
//   const renderEmailComponent = () => {
//     // Show loading state
//     if (isLoading) {
//       return (
//         <div className="flex items-center justify-center h-64">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
//           <span>Loading emails...</span>
//         </div>
//       );
//     }

//     // Show error state
//     if (loadingError) {
//       return (
//         <div className="flex flex-col items-center justify-center h-64 p-4">
//           <p className="text-red-500 mb-4">{loadingError}</p>
//           <Button onClick={() => fetchEmails(activeCategory)}>Try Again</Button>
//         </div>
//       );
//     }

//     // Render the appropriate component based on category
//     switch (activeCategory) {
//       case "sent":
//         return <EmailSent />;
//       case "draft":
//         return <EmailDraft />;
//       case "spam":
//         return <EmailSpam />;
//       case "agenda":
//         // return <EmailAgenda />;
//         return <div>Agenda component coming soon...</div>;
//       case "inbox":
//       default:
//         return <ProfessionalEmailInbox />;
//     }
//   };

//   // At this point, user is fully authenticated, render the email dashboard
//   return (
//     <div className="min-h-screen">

//       <main className="p-6">
//         <Tabs
//           value={activeCategory}
//           onValueChange={handleTabChange}
//         >
//           <div className="flex justify-between items-center mb-6">
//             <TabsList>
//               <TabsTrigger value="inbox" className="">Inbox</TabsTrigger>
//               <TabsTrigger value="sent" className="">Sent</TabsTrigger>
//               <TabsTrigger value="draft" className="">Draft</TabsTrigger>
//               <TabsTrigger value="spam" className="">Spam</TabsTrigger>
//               <TabsTrigger value="agenda" className="">Agenda</TabsTrigger>
//             </TabsList>
//             <div className="flex items-center gap-3">
//               <LinkEmailModal />
//               <Input placeholder="Search mail..." className="max-w-sm " />
//             </div>
//           </div>

//           {/* Render the appropriate component based on active category */}
//           <TabsContent value={activeCategory}>
//             {renderEmailComponent()}
//           </TabsContent>
//         </Tabs>

//        <Button
//           className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-2xl border-4 border-white/20 transition-all duration-300 hover:scale-110 z-30"
//           onClick={() => setIsComposeOpen(true)}
//         >
//           <Pencil className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
//         </Button>
//       </main>

//       <ComposeModal
//         isOpen={isComposeOpen}
//         onClose={() => setIsComposeOpen(false)}
//       />
//     </div>
//   );
// }












































// "use client";
// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Pencil } from "lucide-react";
// import { useEmailStore } from "@/lib/store/email-store";
// import { EmailCategory } from "@/lib/types/email";
// // import { EmailAgenda } from "@/components/EmailAgenda";
// import { EmailColumns2 } from "@/components/email/EmailColumns2";
// import { EmailSent } from "@/components/email/EmailSent";
// import { LinkEmailModal } from "@/components/email/LinkEmailModal";
// import { ComposeModal } from "@/components/email/ComposeModal";
// import { EmailDraft } from "@/components/email/EmailDraft";
// import { EmailSpam } from "@/components/email/EmailSpam";
// import ProfessionalEmailInbox from "@/components/email/ProfessionalEmailInbox";
// import { DjombiProfileService, DjombiServiceResult } from "@/lib/services/DjombiProfileService";
// import { useAuth } from "@/hooks/useAuth";
// import { AuthContext } from "@/lib/context/auth";
// // import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// export default function EmailDashboard() {
//   const [isComposeOpen, setIsComposeOpen] = useState(false);
//   const [djombiTokens, setDjombiTokens] = useState<{
//     accessTokenAdafri: string;
//     accessTokenDjombi: string;
//   } | null>(null);
//   const [djombiProfile, setDjombiProfile] = useState<any>(null);
//   const [isDjombiLoading, setIsDjombiLoading] = useState(false);
//   const [djombiError, setDjombiError] = useState<string | null>(null);

//   const {
//     activeCategory,
//     setActiveCategory,
//     fetchEmails,
//     isLoading,
//     loadingError,
//     draftEmail,
//     updateDraft
//   } = useEmailStore();

//   const { token: accessTokenAdafri, isAuthenticated } = useAuth();

//   // Check if email is linked
//   const [isEmailLinked, setIsEmailLinked] = useState(false);

//   // Initialize Djombi integration
//   const initializeDjombi = async () => {
//     if (!isAuthenticated || !accessTokenAdafri) {
//       setDjombiError("Authentication required");
//       return;
//     }

//     setIsDjombiLoading(true);
//     setDjombiError(null);

//     try {
//       const result: DjombiServiceResult = await DjombiProfileService.getDjombiProfile(accessTokenAdafri);

//       if (result.success && result.tokens) {
//         setDjombiTokens(result.tokens);
//         setDjombiProfile(result.profile);
        
//         // Store tokens in localStorage for persistence (optional)
//         localStorage.setItem('djombiTokenAdafri', result.tokens.accessTokenAdafri);
//         localStorage.setItem('djombiTokenDjombi', result.tokens.accessTokenDjombi);
        
//         console.log('Djombi integration successful:', {
//           adafriToken: result.tokens.accessTokenAdafri,
//           djombiToken: result.tokens.accessTokenDjombi
//         });
//       } else {
//         setDjombiError(result.error || "Failed to initialize Djombi");
//       }
//     } catch (error) {
//       console.error('Djombi initialization error:', error);
//       setDjombiError("An unexpected error occurred");
//     } finally {
//       setIsDjombiLoading(false);
//     }
//   };

//   useEffect(() => {
//     // Check localStorage on component mount
//     const checkEmailLink = () => {
//       const accessToken = localStorage.getItem('accessToken');
//       const linkedEmailId = localStorage.getItem('linkedEmailId');
//       setIsEmailLinked(!!accessToken && !!linkedEmailId);
//     };

//     checkEmailLink();

//     // Initialize Djombi when component mounts and user is authenticated
//     if (isAuthenticated && accessTokenAdafri) {
//       initializeDjombi();
//     }

//     // Also fetch initial emails for the active category
//     if (typeof window !== 'undefined') {
//       const accessToken = localStorage.getItem('accessToken');
//       const linkedEmailId = localStorage.getItem('linkedEmailId');

//       if (accessToken && linkedEmailId) {
//         fetchEmails(activeCategory);
//       }
//     }

//     // Listen for storage changes (in case user links email in another tab)
//     window.addEventListener('storage', checkEmailLink);

//     return () => {
//       window.removeEventListener('storage', checkEmailLink);
//     };
//   }, [activeCategory, fetchEmails, isAuthenticated, accessTokenAdafri]);

//   // Handle tab change
//   const handleTabChange = (value: string) => {
//     const category = value as EmailCategory;
//     setActiveCategory(category);
//   };

//   // Handler for editing a draft
//   const handleEditDraft = (draft: any) => {
//     updateDraft(draft);
//     setIsComposeOpen(true);
//   };

//   // Handler to retry Djombi initialization
//   const handleRetryDjombi = () => {
//     initializeDjombi();
//   };

//   // Component to render for the selected category
//   const renderEmailComponent = () => {
//     // Show Djombi loading state
//     if (isDjombiLoading) {
//       return (
//         <div className="flex items-center justify-center h-64">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
//           <span>Initializing Djombi integration...</span>
//         </div>
//       );
//     }

//     // Show Djombi error state
//     if (djombiError && !djombiTokens) {
//       return (
//         <div className="flex flex-col items-center justify-center h-64 p-4">
//           <p className="text-red-500 mb-4">Djombi Error: {djombiError}</p>
//           <Button onClick={handleRetryDjombi}>Retry Djombi Integration</Button>
//         </div>
//       );
//     }

//     // If email is not linked yet, show a message
//     // if (!isEmailLinked) {
//     //   return (
//     //     <div className="flex flex-col items-center justify-center h-64 p-4">
//     //       <h3 className="text-xl font-medium mb-4">Link your email account to continue</h3>
//     //       <LinkEmailModal />
//     //       <LinkEmailModal buttonText="Link Email Account" />
//     //     </div>
//     //   );
//     // }

//     // Show loading state
//     if (isLoading) {
//       return (
//         <div className="flex items-center justify-center h-64">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
//           <span>Loading emails...</span>
//         </div>
//       );
//     }

//     // Show error state
//     if (loadingError) {
//       return (
//         <div className="flex flex-col items-center justify-center h-64 p-4">
//           <p className="text-red-500 mb-4">{loadingError}</p>
//           <Button onClick={() => fetchEmails(activeCategory)}>Try Again</Button>
//         </div>
//       );
//     }

//     // Render the appropriate component based on category
//     // Pass djombiTokens as props to components that need them
//     switch (activeCategory) {
//       case "sent":
//         return <EmailSent djombiTokens={djombiTokens} />;
//       case "draft":
//         return <EmailDraft djombiTokens={djombiTokens} />;
//       case "spam":
//         return <EmailSpam djombiTokens={djombiTokens} />;
//       case "agenda":
//         // return <EmailAgenda djombiTokens={djombiTokens} />;
//       case "inbox":
//       default:
//         return <ProfessionalEmailInbox djombiTokens={djombiTokens} />;
//     }
//   };

//   return (
//     // <ProtectedRoute>
//       <div className="min-h-screen">
//         <main className="p-6">
//           {/* Debug info (remove in production) */}
//           {process.env.NODE_ENV === 'development' && djombiTokens && (
//             <div className="mb-4 p-2 bg-green-100 rounded text-sm">
//               <strong>Djombi Status:</strong> ✅ Connected
//               <br />
//               <strong>Adafri Token:</strong> {djombiTokens.accessTokenAdafri.substring(0, 10)}...
//               <br />
//               <strong>Djombi Token:</strong> {djombiTokens.accessTokenDjombi.substring(0, 10)}...
//             </div>
//           )}

//           <Tabs
//             value={activeCategory}
//             onValueChange={handleTabChange}
//           >
//             <div className="flex justify-between items-center mb-6">
//               <TabsList>
//                 <TabsTrigger value="inbox" className="">Inbox</TabsTrigger>
//                 <TabsTrigger value="sent" className="">Sent</TabsTrigger>
//                 <TabsTrigger value="draft" className="">Draft</TabsTrigger>
//                 <TabsTrigger value="spam" className="">Spam</TabsTrigger>
//                 <TabsTrigger value="agenda" className="">Agenda</TabsTrigger>
//               </TabsList>
//               <div className="flex items-center gap-3">
//                 <LinkEmailModal />
//                 <Input placeholder="Search mail..." className="max-w-sm " />
//                 {djombiError && (
//                   <Button 
//                     variant="outline" 
//                     size="sm" 
//                     onClick={handleRetryDjombi}
//                     className="text-red-600 border-red-300 hover:bg-red-50"
//                   >
//                     Retry Djombi
//                   </Button>
//                 )}
//               </div>
//             </div>

//             {/* Render the appropriate component based on active category */}
//             <TabsContent value={activeCategory}>
//               {renderEmailComponent()}
//             </TabsContent>
//           </Tabs>

//           <Button
//             className="fixed bottom-8 md:right-[90px] shadow-lg"
//             onClick={() => setIsComposeOpen(true)}
//           >
//             <Pencil className="w-4 h-4 mr-2" />
//             Compose
//           </Button>
//         </main>

//         <ComposeModal
//           isOpen={isComposeOpen}
//           onClose={() => setIsComposeOpen(false)}
//           djombiTokens={djombiTokens}
//         />
//       </div>
//     // </ProtectedRoute>
//   );
// }

















































// This is working code for the email dashboard with tabs and email components.
// "use client";
// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Pencil } from "lucide-react";
// import { useEmailStore } from "@/lib/store/email-store";
// import { EmailCategory } from "@/lib/types/email";
// // import { EmailAgenda } from "@/components/EmailAgenda";
// import { EmailColumns2 } from "@/components/email/EmailColumns2";
// import { EmailSent } from "@/components/email/EmailSent";
// import { LinkEmailModal } from "@/components/email/LinkEmailModal";
// import { ComposeModal } from "@/components/email/ComposeModal";
// import { EmailDraft } from "@/components/email/EmailDraft";
// import { EmailSpam } from "@/components/email/EmailSpam";
// import ProfessionalEmailInbox from "@/components/email/ProfessionalEmailInbox";
// // import { ProtectedRoute } from "@/components/auth/ProtectedRoute";


// export default function EmailDashboard() {
//   const [isComposeOpen, setIsComposeOpen] = useState(false);
//   const {
//     activeCategory,
//     setActiveCategory,
//     fetchEmails,
//     isLoading,
//     loadingError,
//     draftEmail,
//     updateDraft
//   } = useEmailStore();

//   // Check if email is linked
//   const [isEmailLinked, setIsEmailLinked] = useState(false);

//   useEffect(() => {
//     // Check localStorage on component mount
//     const checkEmailLink = () => {
//       const accessToken = localStorage.getItem('accessToken');
//       const linkedEmailId = localStorage.getItem('linkedEmailId');
//       setIsEmailLinked(!!accessToken && !!linkedEmailId);
//     };

//     checkEmailLink();

//     // Also fetch initial emails for the active category
//     if (typeof window !== 'undefined') {
//       const accessToken = localStorage.getItem('accessToken');
//       const linkedEmailId = localStorage.getItem('linkedEmailId');

//       if (accessToken && linkedEmailId) {
//         fetchEmails(activeCategory);
//       }
//     }

//     // Listen for storage changes (in case user links email in another tab)
//     window.addEventListener('storage', checkEmailLink);

//     return () => {
//       window.removeEventListener('storage', checkEmailLink);
//     };
//   }, [activeCategory, fetchEmails]);

//   // Handle tab change
//   const handleTabChange = (value: string) => {
//     const category = value as EmailCategory;
//     setActiveCategory(category);
//   };

//   // Handler for editing a draft
//   const handleEditDraft = (draft: any) => {
//     updateDraft(draft);
//     setIsComposeOpen(true);
//   };

//   // Component to render for the selected category
//   const renderEmailComponent = () => {
//     // If email is not linked yet, show a message
//     // if (!isEmailLinked) {
//     //   return (
//     //     <div className="flex flex-col items-center justify-center h-64 p-4">
//     //       <h3 className="text-xl font-medium mb-4">Link your email account to continue</h3>
//     //       <LinkEmailModal />
//     //       <LinkEmailModal buttonText="Link Email Account" />
//     //     </div>
//     //   );
//     // }

//     // Show loading state
//     if (isLoading) {
//       return (
//         <div className="flex items-center justify-center h-64">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
//           <span>Loading emails...</span>
//         </div>
//       );
//     }

//     // Show error state
//     if (loadingError) {
//       return (
//         <div className="flex flex-col items-center justify-center h-64 p-4">
//           <p className="text-red-500 mb-4">{loadingError}</p>
//           <Button onClick={() => fetchEmails(activeCategory)}>Try Again</Button>
//         </div>
//       );
//     }

//     // Render the appropriate component based on category
//     switch (activeCategory) {
//       case "sent":
//         return <EmailSent />;
//       case "draft":
//         return <EmailDraft />;
//       // return <EmailDraft onEditDraft={handleEditDraft} />;
//       case "spam":
//         return <EmailSpam />;
//       case "agenda":
//       // return <EmailAgenda />;
//       case "inbox":
//       default:
//         return <ProfessionalEmailInbox />;
//     }
//   };

//   return (
//     // <ProtectedRoute>
//       <div className="min-h-screen">
//         <main className="p-6">
//           <Tabs
//             value={activeCategory}
//             onValueChange={handleTabChange}
//           >
//             <div className="flex justify-between items-center mb-6">
//               <TabsList>
//                 <TabsTrigger value="inbox" className="">Inbox</TabsTrigger>
//                 <TabsTrigger value="sent" className="">Sent</TabsTrigger>
//                 <TabsTrigger value="draft" className="">Draft</TabsTrigger>
//                 <TabsTrigger value="spam" className="">Spam</TabsTrigger>
//                 <TabsTrigger value="agenda" className="">Agenda</TabsTrigger>
//               </TabsList>
//               <div className="flex items-center gap-3">
//                 <LinkEmailModal />
//                 <Input placeholder="Search mail..." className="max-w-sm " />
//               </div>
//             </div>

//             {/* Render the appropriate component based on active category */}
//             <TabsContent value={activeCategory}>
//               {renderEmailComponent()}
//             </TabsContent>
//           </Tabs>

//           <Button
//             className="fixed bottom-8 md:right-[90px] shadow-lg"
//             onClick={() => setIsComposeOpen(true)}
//           >
//             <Pencil className="w-4 h-4 mr-2" />
//             Compose
//           </Button>
//         </main>

//         <ComposeModal
//           isOpen={isComposeOpen}
//           onClose={() => setIsComposeOpen(false)}
//         />
//       </div>
//     // </ProtectedRoute>
//   );
// }









































// "use client";
// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Pencil } from "lucide-react";
// import { useEmailStore } from "@/store/email-store";
// import { EmailCategory } from "@/lib/types/email";
// // import { EmailAgenda } from "@/components/EmailAgenda";
// import { EmailColumns2 } from "@/components/email/EmailColumns2";
// import { EmailSent } from "@/components/email/EmailSent";
// import { LinkEmailModal } from "@/components/email/LinkEmailModal";
// import { ComposeModal } from "@/components/email/ComposeModal";
// import { EmailDraft } from "@/components/email/EmailDraft";
// import { EmailSpam } from "@/components/email/EmailSpam";
// import ProfessionalEmailInbox from "@/components/email/ProfessionalEmailInbox";
// // import { ProtectedRoute } from "@/components/auth/ProtectedRoute";


// export default function EmailDashboard() {
//   const [isComposeOpen, setIsComposeOpen] = useState(false);
//   const {
//     activeCategory,
//     setActiveCategory,
//     fetchEmails,
//     isLoading,
//     loadingError,
//     draftEmail,
//     updateDraft
//   } = useEmailStore();

//   // Check if email is linked
//   const [isEmailLinked, setIsEmailLinked] = useState(false);

//   useEffect(() => {
//     // Check localStorage on component mount
//     const checkEmailLink = () => {
//       const accessToken = localStorage.getItem('accessToken');
//       const linkedEmailId = localStorage.getItem('linkedEmailId');
//       setIsEmailLinked(!!accessToken && !!linkedEmailId);
//     };

//     checkEmailLink();

//     // Also fetch initial emails for the active category
//     if (typeof window !== 'undefined') {
//       const accessToken = localStorage.getItem('accessToken');
//       const linkedEmailId = localStorage.getItem('linkedEmailId');

//       if (accessToken && linkedEmailId) {
//         fetchEmails(activeCategory);
//       }
//     }

//     // Listen for storage changes (in case user links email in another tab)
//     window.addEventListener('storage', checkEmailLink);

//     return () => {
//       window.removeEventListener('storage', checkEmailLink);
//     };
//   }, []);

//   // Handle tab change
//   const handleTabChange = (value: string) => {
//     const category = value as EmailCategory;
//     setActiveCategory(category);
//   };

//   // Handler for editing a draft
//   const handleEditDraft = (draft: any) => {
//     updateDraft(draft);
//     setIsComposeOpen(true);
//   };

//   // Component to render for the selected category
//   const renderEmailComponent = () => {
//     // If email is not linked yet, show a message
//     // if (!isEmailLinked) {
//     //   return (
//     //     <div className="flex flex-col items-center justify-center h-64 p-4">
//     //       <h3 className="text-xl font-medium mb-4">Link your email account to continue</h3>
//     //       <LinkEmailModal />
//     //       <LinkEmailModal buttonText="Link Email Account" />
//     //     </div>
//     //   );
//     // }

//     // Show loading state
//     if (isLoading) {
//       return (
//         <div className="flex items-center justify-center h-64">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
//           <span>Loading emails...</span>
//         </div>
//       );
//     }

//     // Show error state
//     if (loadingError) {
//       return (
//         <div className="flex flex-col items-center justify-center h-64 p-4">
//           <p className="text-red-500 mb-4">{loadingError}</p>
//           <Button onClick={() => fetchEmails(activeCategory)}>Try Again</Button>
//         </div>
//       );
//     }

//     // Render the appropriate component based on category
//     switch (activeCategory) {
//       case "sent":
//         return <EmailSent />;
//       case "draft":
//         return <EmailDraft />;
//       // return <EmailDraft onEditDraft={handleEditDraft} />;
//       case "spam":
//         return <EmailSpam />;
//       case "agenda":
//       // return <EmailAgenda />;
//       case "inbox":
//       default:
//         return <ProfessionalEmailInbox />;
//     }
//   };

//   return (
//     // <ProtectedRoute>
//       <div className="min-h-screen">
//         <main className="p-6">
//           <Tabs
//             value={activeCategory}
//             onValueChange={handleTabChange}
//           >
//             <div className="flex justify-between items-center mb-6">
//               <TabsList>
//                 <TabsTrigger value="inbox" className="">Inbox</TabsTrigger>
//                 <TabsTrigger value="sent" className="">Sent</TabsTrigger>
//                 <TabsTrigger value="draft" className="">Draft</TabsTrigger>
//                 <TabsTrigger value="spam" className="">Spam</TabsTrigger>
//                 <TabsTrigger value="agenda" className="">Agenda</TabsTrigger>
//               </TabsList>
//               <div className="flex items-center gap-3">
//                 <LinkEmailModal />
//                 <Input placeholder="Search mail..." className="max-w-sm " />
//               </div>
//             </div>

//             {/* Render the appropriate component based on active category */}
//             <TabsContent value={activeCategory}>
//               {renderEmailComponent()}
//             </TabsContent>
//           </Tabs>

//           <Button
//             className="fixed bottom-8 md:right-[90px] shadow-lg"
//             onClick={() => setIsComposeOpen(true)}
//           >
//             <Pencil className="w-4 h-4 mr-2" />
//             Compose
//           </Button>
//         </main>

//         <ComposeModal
//           isOpen={isComposeOpen}
//           onClose={() => setIsComposeOpen(false)}
//         />
//       </div>
//     // </ProtectedRoute>
//   );
// }
















// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { EmailColumns } from "@/components/email/EmailColumns";
// import { ComposeModal } from "@/components/email/ComposeModal";
// import { useState } from "react";
// import { useEmailStore } from "@/store/email-store";
// import { ArrowLeft, Bell, Settings, Pencil } from "lucide-react";
// import { EmailCategory } from "@/lib/types/email";
// import { EmailSent } from "@/components/email/EmailSent";
// import { LinkEmailModal } from "@/components/email/LinkEmailModal";

// export default function EmailDashboard() {
//   const [isComposeOpen, setIsComposeOpen] = useState(false);
//   const { activeCategory, setActiveCategory } = useEmailStore();

//   return (
//     <div className="min-h-screen">

//       <main className="p-6 ">
//         <Tabs
//           value={activeCategory}
//           onValueChange={(value) => setActiveCategory(value as EmailCategory)}
//         >
//           <div className="flex justify-between items-center mb-6">
//             <TabsList>
//               <TabsTrigger value="inbox" className="">Inbox</TabsTrigger>
//               <TabsTrigger value="sent" className="">Sent</TabsTrigger>
//               <TabsTrigger value="draft" className="">Draft</TabsTrigger>
//               <TabsTrigger value="spam" className="">Spam</TabsTrigger>
//               <TabsTrigger value="agenda" className="">Agenda</TabsTrigger>
//             </TabsList>
//             <div className="flex items-center gap-3">
//               <LinkEmailModal />
//               <Input placeholder="Search mail..." className="max-w-sm" />
//             </div>
//           </div>

//           <TabsContent value={activeCategory}>
//             <EmailColumns />
//           </TabsContent>
//           {/* <TabsContent value="sent">
//             <EmailSent />
//           </TabsContent> */}
//         </Tabs>

//         <Button
//           className="fixed bottom-8 md:right-[90px] shadow-lg"
//           onClick={() => setIsComposeOpen(true)}
//         > <Pencil className="w-4 h-4" />
//           Compose
//         </Button>
//       </main>

//       <ComposeModal
//         isOpen={isComposeOpen}
//         onClose={() => setIsComposeOpen(false)}
//       />
//     </div>
//   );
// }
