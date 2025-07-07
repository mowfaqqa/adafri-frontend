"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, Building2, X, Sparkles, Globe, Phone, Hash, Briefcase, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { organizationApi, CreateOrganizationData, Organization, OrganizationMember } from "@/lib/api/organization/organizationApi";
import { useDjombiAuth } from '@/components/providers/DjombiAuthProvider';

interface OrganizationSelectorProps {
  isCollapsed: boolean;
  isMobile?: boolean;
}

interface CreateOrganizationFormData extends CreateOrganizationData {
  [key: string]: string;
}

// Modal component for creating new organization with modern design
interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOrganizationFormData) => void;
  loading: boolean;
  error: string | null;
}

const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading, 
  error 
}) => {
  const [formData, setFormData] = useState<CreateOrganizationFormData>({
    business_name: '',
    business_address: '',
    business_phone: '',
    business_taxId: '',
    business_industry: ''
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      business_name: '',
      business_address: '',
      business_phone: '',
      business_taxId: '',
      business_industry: ''
    });
    setFocusedField(null);
    onClose();
  };

  if (!isOpen) return null;

  const formFields = [
    { 
      key: 'business_name', 
      label: 'Business Name', 
      type: 'text', 
      required: true,
      icon: Building2,
      placeholder: 'Enter your business name',
      description: 'The official name of your organization'
    },
    { 
      key: 'business_address', 
      label: 'Business Address', 
      type: 'text', 
      required: true,
      icon: MapPin,
      placeholder: 'Enter your business address',
      description: 'Your organization\'s physical location'
    },
    { 
      key: 'business_phone', 
      label: 'Business Phone', 
      type: 'tel', 
      required: true,
      icon: Phone,
      placeholder: '+1 (555) 123-4567',
      description: 'Primary contact number'
    },
    { 
      key: 'business_taxId', 
      label: 'Tax ID', 
      type: 'text', 
      required: true,
      icon: Hash,
      placeholder: 'Enter tax identification number',
      description: 'Government issued tax identifier'
    },
    { 
      key: 'business_industry', 
      label: 'Industry', 
      type: 'text', 
      required: true,
      icon: Briefcase,
      placeholder: 'e.g. Technology, Healthcare, Finance',
      description: 'Your business sector or industry'
    }
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Create Organization</h2>
                <p className="text-blue-100 text-sm">Build something amazing</p>
              </div>
            </div>
            <button 
              onClick={handleClose} 
              className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Error message with modern design */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {formFields.map(({ key, label, type, required, icon: Icon, placeholder, description }) => (
              <div key={key} className="group">
                <label 
                  htmlFor={key} 
                  className="block text-sm font-semibold text-gray-800 mb-2 transition-colors group-focus-within:text-blue-600"
                >
                  <div className="flex items-center space-x-2">
                    <Icon size={16} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <span>{label}</span>
                    {required && <span className="text-red-500 text-xs">*</span>}
                  </div>
                </label>
                
                <div className="relative">
                  <input
                    id={key}
                    name={key}
                    type={type}
                    required={required}
                    className={cn(
                      "w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl",
                      "focus:outline-none focus:ring-0 focus:border-blue-500 focus:bg-white",
                      "transition-all duration-300 placeholder:text-gray-400",
                      "hover:border-gray-300 hover:bg-gray-100/50",
                      focusedField === key && "ring-4 ring-blue-100 border-blue-500 bg-white transform scale-[1.02]"
                    )}
                    value={formData[key]}
                    onChange={handleChange}
                    onFocus={() => setFocusedField(key)}
                    onBlur={() => setFocusedField(null)}
                    placeholder={placeholder}
                  />
                  
                  {/* Animated border effect */}
                  <div 
                    className={cn(
                      "absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300",
                      focusedField === key 
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-100" 
                        : "opacity-0"
                    )}
                  />
                </div>
                
                {/* Field description */}
                <p className="text-xs text-gray-500 mt-1 ml-1 transition-colors group-focus-within:text-gray-600">
                  {description}
                </p>
              </div>
            ))}
            
            {/* Submit button with modern design */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-4 rounded-2xl font-semibold text-white transition-all duration-300 relative overflow-hidden",
                "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                "transform hover:scale-[1.02] active:scale-[0.98]",
                "disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none",
                "shadow-lg hover:shadow-xl"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating Organization...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Create Organization</span>
                  </>
                )}
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({ 
  isCollapsed, 
  isMobile = false 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationMember[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Hooks must be inside the component body
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { djombiUser, isDjombiAuthenticated, isLoading: authLoading } = useDjombiAuth();

  // Fetch organizations on component mount
  const fetchOrganizations = useCallback(async () => {
    if (!isDjombiAuthenticated) {
      setError('Please log in to access organizations');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await organizationApi.getOrganizations();
      setOrganizations(response.data);
      
      // Auto-select first organization if none selected
      if (response.data.length > 0 && !selectedOrganization) {
        setSelectedOrganization(response.data[0]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organizations';
      setError(errorMessage);
      console.error('Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedOrganization, isDjombiAuthenticated]);

  useEffect(() => {
    // Only fetch if authenticated and not currently loading auth
    if (isDjombiAuthenticated && !authLoading) {
      fetchOrganizations();
    }
  }, [fetchOrganizations, isDjombiAuthenticated, authLoading]);

  // Handle clicks outside of the dropdown
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowDropdown(false);
    }
  }, []);

  useEffect(() => {
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown, handleClickOutside]);

  // Handle organization selection
  const handleSelectOrganization = useCallback(async (org: OrganizationMember) => {
    if (selectedOrganization?.organization.id === org.organization.id) {
      // Already selected, just close dropdown
      setShowDropdown(false);
      return;
    }

    if (!isDjombiAuthenticated) {
      setError('Please log in to switch organizations');
      return;
    }

    setSwitchLoading(true);
    setError(null);
    
    try {
      await organizationApi.switchOrganization({ organizationId: org.organization.id });
      setSelectedOrganization(org);
      setShowDropdown(false);
      console.log('Successfully switched to organization:', org.organization);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch organization';
      setError(errorMessage);
      console.error('Error switching organization:', err);
    } finally {
      setSwitchLoading(false);
    }
  }, [selectedOrganization, isDjombiAuthenticated]);

  // Handle organization creation
  const handleCreateOrganization = useCallback(async (formData: CreateOrganizationFormData) => {
    if (!isDjombiAuthenticated) {
      setError('Please log in to create organizations');
      return;
    }

    setCreateLoading(true);
    setError(null);

    try {
      await organizationApi.createOrganization(formData);
      setShowCreateModal(false);
      // Refresh organizations list
      await fetchOrganizations();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create organization';
      setError(errorMessage);
      console.error('Error creating organization:', err);
    } finally {
      setCreateLoading(false);
    }
  }, [fetchOrganizations, isDjombiAuthenticated]);

  const toggleDropdown = useCallback(() => {
    setShowDropdown(prev => !prev);
  }, []);

  const handleShowCreateModal = useCallback(() => {
    setShowCreateModal(true);
    setShowDropdown(false);
    setError(null);
  }, []);

  // Generate display name and initials (maintain workspace UI design)
  const displayName = selectedOrganization?.organization.business_name || 
                     (djombiUser ? `${djombiUser.first_name} ${djombiUser.last_name}`.trim() : '') || 
                     "User";
  const userInitials = displayName ? displayName.substring(0, 2).toUpperCase() : "US";

  // Show authentication loading state
  if (authLoading) {
    return (
      <div className={cn(
        "px-4 relative",
        isCollapsed && !isMobile ? "py-3" : "py-3"
      )}>
        <div className="flex items-center p-3 border-2 rounded-2xl">
          <div className="w-7 h-7 bg-gray-300 rounded-xl mr-3 flex items-center justify-center animate-pulse">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
          </div>
          {(!isCollapsed || isMobile) && (
            <span className="font-semibold text-gray-500">Loading...</span>
          )}
        </div>
      </div>
    );
  }

  // Show authentication required state
  if (!isDjombiAuthenticated) {
    return (
      <div className={cn(
        "px-4 relative",
        isCollapsed && !isMobile ? "py-3" : "py-3"
      )}>
        <div className="flex items-center p-3 border-2 border-red-200 rounded-2xl bg-red-50">
          <div className="w-7 h-7 bg-red-500 rounded-xl mr-3 flex items-center justify-center text-white text-xs font-bold">
            !
          </div>
          {(!isCollapsed || isMobile) && (
            <span className="font-semibold text-red-600">Please Log In</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "px-4 relative",
        isCollapsed && !isMobile ? "py-3" : "py-3"
      )} 
      ref={dropdownRef}
    >
      {/* Modern selector button */}
      <div
        className={cn(
          "flex items-center p-3 border-2 rounded-2xl cursor-pointer transition-all duration-300",
          "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-200",
          "focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-400",
          isCollapsed && !isMobile ? "justify-center" : "justify-between",
          showDropdown && "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 ring-4 ring-blue-100"
        )}
        onClick={toggleDropdown}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown();
          }
        }}
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
      >
        <div className={cn(
          "flex items-center min-w-0",
          isCollapsed && !isMobile ? "justify-center" : "flex-1"
        )}>
          {/* Modern avatar with gradient */}
          <div 
            className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mr-3 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg"
            aria-label={`${displayName} avatar`}
          >
            {userInitials}
          </div>
          {(!isCollapsed || isMobile) && (
            <span className="font-semibold text-gray-800 truncate">{displayName}</span>
          )}
        </div>
        {(!isCollapsed || isMobile) && (
          <ChevronDown 
            size={18} 
            className={cn(
              "flex-shrink-0 transition-all duration-300 text-gray-500",
              showDropdown && "rotate-180 text-blue-500"
            )}
          />
        )}
      </div>

      {/* Modern dropdown */}
      {showDropdown && (!isCollapsed || isMobile) && (
        <div className="absolute left-4 right-4 mt-3 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-2 duration-300 overflow-hidden">
          <div className="p-4">
            {/* Error message with modern styling */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl animate-in slide-in-from-top-1 duration-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center space-x-2 mb-4">
              <Globe size={16} className="text-gray-400" />
              <p className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Organizations</p>
            </div>

            {/* Loading state with modern design */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="relative">
                  <div className="w-8 h-8 border-4 border-gray-200 rounded-full"></div>
                  <div className="absolute inset-0 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            ) : (
              <>
                {/* Organization list with modern cards */}
                <div className="space-y-2 mb-4">
                  {organizations.map((orgMember) => (
                    <div
                      key={orgMember.organization.id}
                      className={cn(
                        "flex items-center p-3 rounded-xl cursor-pointer group relative transition-all duration-300",
                        "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50",
                        selectedOrganization?.organization.id === orgMember.organization.id 
                          ? "bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-200 shadow-md" 
                          : "hover:shadow-md border-2 border-transparent",
                        switchLoading && "opacity-50 pointer-events-none"
                      )}
                      onClick={() => handleSelectOrganization(orgMember)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectOrganization(orgMember);
                        }
                      }}
                    >
                      {/* Modern organization avatar */}
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold mr-3 flex-shrink-0 shadow-lg transition-all duration-300",
                        selectedOrganization?.organization.id === orgMember.organization.id 
                          ? "bg-gradient-to-br from-blue-500 to-purple-600 scale-110" 
                          : "bg-gradient-to-br from-gray-400 to-gray-600 group-hover:scale-105"
                      )}>
                        {orgMember.organization.business_name ? (
                          orgMember.organization.business_name.substring(0, 2).toUpperCase()
                        ) : (
                          <Building2 size={18} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate text-sm">
                          {orgMember.organization.business_name || 'Unnamed Organization'}
                        </p>
                        {selectedOrganization?.organization.id === orgMember.organization.id && (
                          <div className="flex items-center space-x-1 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-xs text-green-600 font-medium">Active Organization</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Modern settings button */}
                      <button 
                        className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-gray-800/80 backdrop-blur-sm rounded-xl 
                                  flex items-center justify-center transition-all duration-300 hover:bg-gray-700 ml-2 flex-shrink-0
                                  focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                                  hover:scale-110 active:scale-95"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Organization settings clicked for:', orgMember.organization.id);
                        }}
                        title="Organization settings"
                        type="button"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
                          <path 
                            d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Modern create button */}
                <button
                  type="button"
                  className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
                            rounded-2xl text-white font-semibold flex items-center justify-center space-x-2 
                            transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                            focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-lg hover:shadow-xl"
                  onClick={handleShowCreateModal}
                >
                  <Sparkles size={18} />
                  <span>Create New Organization</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateOrganization}
        loading={createLoading}
        error={error}
      />
    </div>
  );
};

export default OrganizationSelector;

























































// 7/7/2025
// "use client";
// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { ChevronDown, Building2, X, Sparkles, Globe, Phone, Hash, Briefcase, MapPin } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { organizationApi, CreateOrganizationData, Organization, OrganizationMember } from "@/lib/api/organization/organizationApi";
// import useAuthStore from '@/lib/store/messaging/authStore';

// interface OrganizationSelectorProps {
//   isCollapsed: boolean;
//   isMobile?: boolean;
// }

// interface CreateOrganizationFormData extends CreateOrganizationData {
//   [key: string]: string;
// }

// // Modal component for creating new organization with modern design
// interface CreateOrganizationModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSubmit: (data: CreateOrganizationFormData) => void;
//   loading: boolean;
//   error: string | null;
// }

// const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({ 
//   isOpen, 
//   onClose, 
//   onSubmit, 
//   loading, 
//   error 
// }) => {
//   const [formData, setFormData] = useState<CreateOrganizationFormData>({
//     business_name: '',
//     business_address: '',
//     business_phone: '',
//     business_taxId: '',
//     business_industry: ''
//   });

//   const [focusedField, setFocusedField] = useState<string | null>(null);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onSubmit(formData);
//   };

//   const handleClose = () => {
//     setFormData({
//       business_name: '',
//       business_address: '',
//       business_phone: '',
//       business_taxId: '',
//       business_industry: ''
//     });
//     setFocusedField(null);
//     onClose();
//   };

//   if (!isOpen) return null;

//   const formFields = [
//     { 
//       key: 'business_name', 
//       label: 'Business Name', 
//       type: 'text', 
//       required: true,
//       icon: Building2,
//       placeholder: 'Enter your business name',
//       description: 'The official name of your organization'
//     },
//     { 
//       key: 'business_address', 
//       label: 'Business Address', 
//       type: 'text', 
//       required: true,
//       icon: MapPin,
//       placeholder: 'Enter your business address',
//       description: 'Your organization\'s physical location'
//     },
//     { 
//       key: 'business_phone', 
//       label: 'Business Phone', 
//       type: 'tel', 
//       required: true,
//       icon: Phone,
//       placeholder: '+1 (555) 123-4567',
//       description: 'Primary contact number'
//     },
//     { 
//       key: 'business_taxId', 
//       label: 'Tax ID', 
//       type: 'text', 
//       required: true,
//       icon: Hash,
//       placeholder: 'Enter tax identification number',
//       description: 'Government issued tax identifier'
//     },
//     { 
//       key: 'business_industry', 
//       label: 'Industry', 
//       type: 'text', 
//       required: true,
//       icon: Briefcase,
//       placeholder: 'e.g. Technology, Healthcare, Finance',
//       description: 'Your business sector or industry'
//     }
//   ] as const;

//   return (
//     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
//         {/* Header with gradient */}
//         <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 p-6 text-white relative overflow-hidden">
//           <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20"></div>
//           <div className="relative flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
//                 <Sparkles className="w-5 h-5" />
//               </div>
//               <div>
//                 <h2 className="text-xl font-bold">Create Organization</h2>
//                 <p className="text-blue-100 text-sm">Build something amazing</p>
//               </div>
//             </div>
//             <button 
//               onClick={handleClose} 
//               className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors"
//             >
//               <X size={18} />
//             </button>
//           </div>
//         </div>

//         <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
//           {/* Error message with modern design */}
//           {error && (
//             <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in slide-in-from-top-2 duration-300">
//               <div className="flex items-center space-x-2">
//                 <div className="w-2 h-2 bg-red-500 rounded-full"></div>
//                 <p className="text-sm text-red-700 font-medium">{error}</p>
//               </div>
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-6">
//             {formFields.map(({ key, label, type, required, icon: Icon, placeholder }) => (
//               <div key={key} className="group">
//                 <label 
//                   htmlFor={key} 
//                   className="block text-sm font-semibold text-gray-800 mb-2 transition-colors group-focus-within:text-blue-600"
//                 >
//                   <div className="flex items-center space-x-2">
//                     <Icon size={16} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
//                     <span>{label}</span>
//                     {required && <span className="text-red-500 text-xs">*</span>}
//                   </div>
//                 </label>
                
//                 <div className="relative">
//                   <input
//                     id={key}
//                     name={key}
//                     type={type}
//                     required={required}
//                     className={cn(
//                       "w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl",
//                       "focus:outline-none focus:ring-0 focus:border-blue-500 focus:bg-white",
//                       "transition-all duration-300 placeholder:text-gray-400",
//                       "hover:border-gray-300 hover:bg-gray-100/50",
//                       focusedField === key && "ring-4 ring-blue-100 border-blue-500 bg-white transform scale-[1.02]"
//                     )}
//                     value={formData[key]}
//                     onChange={handleChange}
//                     onFocus={() => setFocusedField(key)}
//                     onBlur={() => setFocusedField(null)}
//                     placeholder={placeholder}
//                   />
                  
//                   {/* Animated border effect */}
//                   <div 
//                     className={cn(
//                       "absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300",
//                       focusedField === key 
//                         ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-100" 
//                         : "opacity-0"
//                     )}
//                   />
//                 </div>
                
//               </div>
//             ))}
            
//             {/* Submit button with modern design */}
//             <button
//               type="submit"
//               disabled={loading}
//               className={cn(
//                 "w-full py-4 rounded-2xl font-semibold text-white transition-all duration-300 relative overflow-hidden",
//                 "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
//                 "transform hover:scale-[1.02] active:scale-[0.98]",
//                 "disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none",
//                 "shadow-lg hover:shadow-xl"
//               )}
//             >
//               <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
//               <div className="relative flex items-center justify-center space-x-2">
//                 {loading ? (
//                   <>
//                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                     <span>Creating Organization...</span>
//                   </>
//                 ) : (
//                   <>
//                     <Sparkles size={18} />
//                     <span>Create Organization</span>
//                   </>
//                 )}
//               </div>
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({ 
//   isCollapsed, 
//   isMobile = false 
// }) => {
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [organizations, setOrganizations] = useState<OrganizationMember[]>([]);
//   const [selectedOrganization, setSelectedOrganization] = useState<OrganizationMember | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [createLoading, setCreateLoading] = useState(false);
//   const [switchLoading, setSwitchLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
  
//   // Hooks must be inside the component body
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const { user } = useAuthStore();

//   // Fetch organizations on component mount
//   const fetchOrganizations = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await organizationApi.getOrganizations();
//       setOrganizations(response.data);
      
//       // Auto-select first organization if none selected
//       if (response.data.length > 0 && !selectedOrganization) {
//         setSelectedOrganization(response.data[0]);
//       }
//     } catch (err) {
//       setError('Failed to fetch organizations');
//       console.error('Error fetching organizations:', err);
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedOrganization]);

//   useEffect(() => {
//     fetchOrganizations();
//   }, [fetchOrganizations]);

//   // Handle clicks outside of the dropdown
//   const handleClickOutside = useCallback((event: MouseEvent) => {
//     if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//       setShowDropdown(false);
//     }
//   }, []);

//   useEffect(() => {
//     if (showDropdown) {
//       document.addEventListener("mousedown", handleClickOutside);
//     } else {
//       document.removeEventListener("mousedown", handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [showDropdown, handleClickOutside]);

//   // Handle organization selection
//   const handleSelectOrganization = useCallback(async (org: OrganizationMember) => {
//     if (selectedOrganization?.organization.id === org.organization.id) {
//       // Already selected, just close dropdown
//       setShowDropdown(false);
//       return;
//     }

//     setSwitchLoading(true);
//     setError(null);
    
//     try {
//       await organizationApi.switchOrganization({ organizationId: org.organization.id });
//       setSelectedOrganization(org);
//       setShowDropdown(false);
//       console.log('Successfully switched to organization:', org.organization);
//     } catch (err) {
//       setError('Failed to switch organization');
//       console.error('Error switching organization:', err);
//     } finally {
//       setSwitchLoading(false);
//     }
//   }, [selectedOrganization]);

//   // Handle organization creation
//   const handleCreateOrganization = useCallback(async (formData: CreateOrganizationFormData) => {
//     setCreateLoading(true);
//     setError(null);

//     try {
//       await organizationApi.createOrganization(formData);
//       setShowCreateModal(false);
//       // Refresh organizations list
//       await fetchOrganizations();
//     } catch (err) {
//       setError('Failed to create organization');
//       console.error('Error creating organization:', err);
//     } finally {
//       setCreateLoading(false);
//     }
//   }, [fetchOrganizations]);

//   const toggleDropdown = useCallback(() => {
//     setShowDropdown(prev => !prev);
//   }, []);

//   const handleShowCreateModal = useCallback(() => {
//     setShowCreateModal(true);
//     setShowDropdown(false);
//     setError(null);
//   }, []);

//   // Generate display name and initials (maintain workspace UI design)
//   const displayName = selectedOrganization?.organization.business_name || user?.fullName || "Organization";
//   const userInitials = displayName ? displayName.substring(0, 2).toUpperCase() : "US";

//   return (
//     <div 
//       className={cn(
//         "px-4 relative",
//         isCollapsed && !isMobile ? "py-3" : "py-3"
//       )} 
//       ref={dropdownRef}
//     >
//       {/* Modern selector button */}
//       <div
//         className={cn(
//           "flex items-center p-3 rounded-2xl cursor-pointer transition-all duration-300",
//           "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-200",
//           "focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-400",
//           isCollapsed && !isMobile ? "justify-center" : "justify-between",
//           showDropdown && "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 ring-4 ring-blue-100"
//         )}
//         onClick={toggleDropdown}
//         role="button"
//         tabIndex={0}
//         onKeyDown={(e) => {
//           if (e.key === 'Enter' || e.key === ' ') {
//             e.preventDefault();
//             toggleDropdown();
//           }
//         }}
//         aria-expanded={showDropdown}
//         aria-haspopup="listbox"
//       >
//         <div className={cn(
//           "flex items-center min-w-0",
//           isCollapsed && !isMobile ? "justify-center" : "flex-1"
//         )}>
//           {/* Modern avatar with gradient */}
//           <div 
//             className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mr-3 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg"
//             aria-label={`${displayName} avatar`}
//           >
//             {userInitials}
//           </div>
//           {(!isCollapsed || isMobile) && (
//             <span className="font-semibold text-gray-800 truncate">{displayName}</span>
//           )}
//         </div>
//         {(!isCollapsed || isMobile) && (
//           <ChevronDown 
//             size={18} 
//             className={cn(
//               "flex-shrink-0 transition-all duration-300 text-gray-500",
//               showDropdown && "rotate-180 text-blue-500"
//             )}
//           />
//         )}
//       </div>

//       {/* Modern dropdown */}
//       {showDropdown && (!isCollapsed || isMobile) && (
//         <div className="absolute left-4 right-4 mt-3 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-2 duration-300 overflow-hidden">
//           <div className="p-4">
//             {/* Error message with modern styling */}
//             {error && (
//               <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl animate-in slide-in-from-top-1 duration-200">
//                 <div className="flex items-center space-x-2">
//                   <div className="w-2 h-2 bg-red-500 rounded-full"></div>
//                   <p className="text-sm text-red-700 font-medium">{error}</p>
//                 </div>
//               </div>
//             )}

//             {/* Header */}
//             <div className="flex items-center space-x-2 mb-4">
//               <Globe size={16} className="text-gray-400" />
//               <p className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Organizations</p>
//             </div>

//             {/* Loading state with modern design */}
//             {loading ? (
//               <div className="flex items-center justify-center py-8">
//                 <div className="relative">
//                   <div className="w-8 h-8 border-4 border-gray-200 rounded-full"></div>
//                   <div className="absolute inset-0 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
//                 </div>
//               </div>
//             ) : (
//               <>
//                 {/* Organization list with modern cards */}
//                 <div className="space-y-2 mb-4">
//                   {organizations.map((orgMember) => (
//                     <div
//                       key={orgMember.organization.id}
//                       className={cn(
//                         "flex items-center p-3 rounded-xl cursor-pointer group relative transition-all duration-300",
//                         "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50",
//                         selectedOrganization?.organization.id === orgMember.organization.id 
//                           ? "bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-200 shadow-md" 
//                           : "hover:shadow-md border-2 border-transparent",
//                         switchLoading && "opacity-50 pointer-events-none"
//                       )}
//                       onClick={() => handleSelectOrganization(orgMember)}
//                       role="button"
//                       tabIndex={0}
//                       onKeyDown={(e) => {
//                         if (e.key === 'Enter' || e.key === ' ') {
//                           e.preventDefault();
//                           handleSelectOrganization(orgMember);
//                         }
//                       }}
//                     >
//                       {/* Modern organization avatar */}
//                       <div className={cn(
//                         "w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold mr-3 flex-shrink-0 shadow-lg transition-all duration-300",
//                         selectedOrganization?.organization.id === orgMember.organization.id 
//                           ? "bg-gradient-to-br from-blue-500 to-purple-600 scale-110" 
//                           : "bg-gradient-to-br from-gray-400 to-gray-600 group-hover:scale-105"
//                       )}>
//                         {orgMember.organization.business_name ? (
//                           orgMember.organization.business_name.substring(0, 2).toUpperCase()
//                         ) : (
//                           <Building2 size={18} />
//                         )}
//                       </div>
                      
//                       <div className="flex-1 min-w-0">
//                         <p className="font-semibold text-gray-800 truncate text-sm">
//                           {orgMember.organization.business_name || 'Unnamed Organization'}
//                         </p>
//                         {selectedOrganization?.organization.id === orgMember.organization.id && (
//                           <div className="flex items-center space-x-1 mt-1">
//                             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//                             <p className="text-xs text-green-600 font-medium">Active Organization</p>
//                           </div>
//                         )}
//                       </div>
                      
//                       {/* Modern settings button */}
//                       <button 
//                         className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-gray-800/80 backdrop-blur-sm rounded-xl 
//                                   flex items-center justify-center transition-all duration-300 hover:bg-gray-700 ml-2 flex-shrink-0
//                                   focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
//                                   hover:scale-110 active:scale-95"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           console.log('Organization settings clicked for:', orgMember.organization.id);
//                         }}
//                         title="Organization settings"
//                         type="button"
//                       >
//                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
//                           <path 
//                             d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" 
//                             stroke="currentColor" 
//                             strokeWidth="2" 
//                             strokeLinecap="round" 
//                             strokeLinejoin="round"
//                           />
//                         </svg>
//                       </button>
//                     </div>
//                   ))}
//                 </div>

//                 {/* Modern create button */}
//                 <button
//                   type="button"
//                   className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
//                             rounded-2xl text-white font-normal flex items-center justify-center space-x-2 
//                             transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
//                             focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-lg hover:shadow-xl"
//                   onClick={handleShowCreateModal}
//                 >
//                   <Sparkles size={18} />
//                   <span className="whitespace-nowrap">New Organization</span>
//                 </button>
//               </>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Create Organization Modal */}
//       <CreateOrganizationModal
//         isOpen={showCreateModal}
//         onClose={() => setShowCreateModal(false)}
//         onSubmit={handleCreateOrganization}
//         loading={createLoading}
//         error={error}
//       />
//     </div>
//   );
// };

// export default OrganizationSelector;