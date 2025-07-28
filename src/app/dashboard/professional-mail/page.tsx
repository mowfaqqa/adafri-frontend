"use client";
import { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  AlertCircle,
  Building2
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
  const { 
    isFullyAuthenticated, 
    isLoading: authLoading, 
    hasError, 
    adafri, 
    djombi, 
    organization 
  } = useCombinedAuth();
  
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const {
    activeCategory,
    setActiveCategory,
    fetchEmails,
    isLoading,
    loadingError,
    draftEmail,
    updateDraft,
    updateOrganizationContext
  } = useEmailStore();

  const [isEmailLinked, setIsEmailLinked] = useState(false);

  const tabConfig = {
    inbox: { icon: Inbox, label: "Inbox", color: "from-blue-500 to-blue-600", count: 12 },
    sent: { icon: Send, label: "Sent", color: "from-green-500 to-green-600", count: 8 },
    draft: { icon: FileText, label: "Draft", color: "from-yellow-500 to-yellow-600", count: 3 },
    spam: { icon: Shield, label: "Spam", color: "from-red-500 to-red-600", count: 2 },
    agenda: { icon: Calendar, label: "Agenda", color: "from-purple-500 to-purple-600", count: 5 }
  };

  // Enhanced email linking check
  const checkEmailLink = useCallback(() => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const linkedEmailId = localStorage.getItem('linkedEmailId');
      setIsEmailLinked(!!accessToken && !!linkedEmailId);
    } catch (error) {
      console.error("Error checking email link:", error);
      setIsEmailLinked(false);
    }
  }, []);

  // Update organization context when current organization changes
  useEffect(() => {
    if (organization.current?.organization?.id) {
      console.log('🏢 Current organization changed:', organization.current.organization.id);
      updateOrganizationContext(organization.current.organization.id);
    }
  }, [organization.current?.organization?.id, updateOrganizationContext]);

  // Initial setup effect with enhanced organization handling
  useEffect(() => {
    if (!isFullyAuthenticated) return;

    console.log('🔧 Email dashboard setup - Enhanced auth state:', {
      isFullyAuthenticated,
      adafriAuth: adafri.isAuthenticated,
      djombiAuth: djombi.isAuthenticated,
      hasOrganizations: organization.hasOrganizations,
      currentOrg: organization.current?.organization?.id,
      adafriToken: !!adafri.token,
      djombiToken: !!djombi.token
    });

    checkEmailLink();

    // Initial email fetch with delay to ensure all contexts are stable
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && isFullyAuthenticated && organization.current) {
        const accessToken = localStorage.getItem('accessToken');
        const linkedEmailId = localStorage.getItem('linkedEmailId');

        if (accessToken && linkedEmailId) {
          console.log('📧 Fetching initial emails for category:', activeCategory, 'with org:', organization.current.organization.id);
          fetchEmails(activeCategory);
        } else {
          console.log('⚠️ Missing email credentials for fetch');
        }
      }
    }, 1500); // Increased delay for organization context

    // Listen for storage changes
    const handleStorageChange = () => {
      checkEmailLink();
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [
    isFullyAuthenticated, 
    activeCategory, 
    fetchEmails, 
    checkEmailLink, 
    adafri.isAuthenticated, 
    djombi.isAuthenticated,
    organization.hasOrganizations,
    organization.current?.organization?.id
  ]);

  const handleTabChange = useCallback((value: string) => {
    const category = value as EmailCategory;
    console.log('📂 Switching to category:', category);
    setActiveCategory(category);
    setIsMobileMenuOpen(false);
  }, [setActiveCategory]);

  const handleEditDraft = useCallback((draft: any) => {
    updateDraft(draft);
    setIsComposeOpen(true);
  }, [updateDraft]);

  // Enhanced loading state that includes organization setup
  if (authLoading) {
    return (
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
          <p className="text-gray-600 mb-4">Please wait while we prepare your email dashboard...</p>
          
          {/* Enhanced loading state with organization info */}
          <div className="text-sm text-gray-500 space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${adafri.isAuthenticated ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span>Adafri Authentication</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${djombi.isAuthenticated ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
              <span>Djombi Profile Setup</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${organization.hasOrganizations ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></div>
              <span>Organization Context</span>
            </div>
          </div>
          
          {/* Show current organization if available */}
          {organization.current && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-sm text-blue-700">
                <Building2 className="w-4 h-4" />
                <span>{organization.current.organization.business_name}</span>
              </div>
            </div>
          )}
          
          <div className="mt-6 text-xs text-gray-400">
            If this takes too long, try refreshing the page
          </div>
        </div>
      </div>
    );
  }

  // Enhanced error state with organization context
  if (hasError || authError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-50 p-4">
        <div className="text-center max-w-md w-full p-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-red-100">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-red-400 to-pink-500 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-red-600 mb-2">Authentication Error</h3>
          <p className="text-gray-600 mb-6">
            {djombi.error || authError || 'Failed to authenticate. Please try again.'}
          </p>
          
          {/* Enhanced debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 bg-gray-100 rounded text-xs text-left">
              <strong>Debug Info:</strong><br/>
              Adafri Auth: {adafri.isAuthenticated ? '✅' : '❌'}<br/>
              Djombi Auth: {djombi.isAuthenticated ? '✅' : '❌'}<br/>
              Organizations: {organization.hasOrganizations ? '✅' : '❌'}<br/>
              Current Org: {organization.current?.organization?.business_name || 'None'}<br/>
              Error: {djombi.error || 'None'}<br/>
            </div>
          )}
          
          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl py-3 transition-all duration-300 hover:scale-105"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button
              onClick={() => {
                setAuthError(null);
                adafri.logout();
              }}
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
            >
              Logout and Login Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced login prompt with organization context
  if (!isFullyAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white p-4">
        <div className="text-center max-w-md w-full p-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Welcome Back
          </h2>
          <p className="text-gray-600 mb-6">
            {!adafri.isAuthenticated 
              ? 'Please log in to access your email dashboard'
              : !djombi.isAuthenticated
              ? 'Setting up your Djombi profile...'
              : 'Loading your organization context...'
            }
          </p>
          
          {/* Enhanced auth status with organization */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Adafri Login:</span>
              <span className={adafri.isAuthenticated ? 'text-green-600' : 'text-gray-400'}>
                {adafri.isAuthenticated ? '✅ Connected' : '⏳ Pending'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Profile Setup:</span>
              <span className={djombi.isAuthenticated ? 'text-green-600' : 'text-gray-400'}>
                {djombi.isAuthenticated ? '✅ Complete' : '⏳ In Progress'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Organization:</span>
              <span className={organization.hasOrganizations ? 'text-green-600' : 'text-gray-400'}>
                {organization.hasOrganizations ? '✅ Ready' : '⏳ Loading'}
              </span>
            </div>
          </div>
          
          {/* Show current organization if available */}
          {organization.current && (
            <div className="mb-6 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-sm text-blue-700">
                <Building2 className="w-4 h-4" />
                <span>{organization.current.organization.business_name}</span>
                <span className="text-xs bg-blue-200 px-2 py-1 rounded-full">
                  {organization.current.role}
                </span>
              </div>
            </div>
          )}
          
          {!adafri.isAuthenticated && (
            <Button
              onClick={adafri.login}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl py-3 transition-all duration-300 hover:scale-105"
            >
              <Mail className="w-4 h-4 mr-2" />
              Login to Continue
            </Button>
          )}
          
          {adafri.isAuthenticated && !isFullyAuthenticated && (
            <div className="text-sm text-gray-500">
              {!djombi.isAuthenticated 
                ? 'Finalizing your profile setup...'
                : 'Setting up organization context...'
              }
            </div>
          )}
        </div>
      </div>
    );
  }

  // Enhanced email component renderer with organization context
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
          <p className="text-gray-400 text-sm mt-1">Category: {activeCategory}</p>
          {organization.current && (
            <p className="text-gray-400 text-xs mt-1">
              Organization: {organization.current.organization.business_name}
            </p>
          )}
        </div>
      );
    }

    // Enhanced error state with organization context
    if (loadingError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-red-400 to-pink-500 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <p className="text-red-500 mb-4 font-medium">{loadingError}</p>
          
          {/* Enhanced debug info with organization context */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 bg-gray-100 rounded text-xs text-left max-w-md">
              <strong>Debug Info:</strong><br/>
              Category: {activeCategory}<br/>
              Djombi Token: {djombi.token ? `${djombi.token.substring(0, 10)}...` : 'Missing'}<br/>
              Email Linked: {isEmailLinked ? 'Yes' : 'No'}<br/>
              Organization: {organization.current?.organization?.business_name || 'None'}<br/>
              Org ID: {organization.current?.organization?.id || 'None'}<br/>
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={() => fetchEmails(activeCategory)}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            {!isEmailLinked && (
              <p className="text-sm text-gray-500">
                Make sure you have linked an email account
              </p>
            )}
            
            {!organization.current && (
              <p className="text-sm text-gray-500">
                Make sure you have selected an organization
              </p>
            )}
          </div>
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

  // Enhanced main dashboard with organization context
  return (
    <div className="min-h-screen bg-white/90 backdrop-blur-sm p-4 lg:p-6">
      {/* Enhanced Mobile Header with Organization Info */}
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

        {/* Organization indicator on mobile */}
        {organization.current && (
          <div className="px-4 pb-2">
            <div className="flex items-center space-x-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
              <Building2 className="w-3 h-3" />
              <span>{organization.current.organization.business_name}</span>
              <span className="bg-gray-200 px-1 rounded text-xs">
                {organization.current.role}
              </span>
            </div>
          </div>
        )}

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

      {/* Enhanced Mobile Navigation Overlay with Organization Info */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white/95 backdrop-blur-md shadow-2xl border-r border-gray-200/50" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
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

              {/* Organization info in mobile menu */}
              {organization.current && (
                <div className="mb-6 p-4 bg-blue-50 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">
                        {organization.current.organization.business_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {organization.current.role} • {organization.current.organization.business_industry}
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
          {/* Enhanced Desktop Header with Organization Info */}
          <div className="hidden lg:flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Email Dashboard
              </h1>
              
              {/* Organization indicator on desktop */}
              {organization.current && (
                <div className="flex items-center space-x-3 bg-blue-50 rounded-2xl p-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">
                      {organization.current.organization.business_name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {organization.current.role} • {organization.current.organization.business_industry}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="text-gray-600">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" className="text-gray-600">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
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