// components/organization/EnhancedOrganizationSelector.tsx
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronDown,
  Building2,
  X,
  Sparkles,
  Globe,
  Phone,
  Hash,
  Briefcase,
  MapPin,
  Settings,
  Edit3,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/errors/apiErrors";
import { useApiError } from "@/lib/hooks/useApiError";
import useAuthStore from "@/lib/store/messaging/authStore";
import TwoFactorModal from "../modals/TwoFactorModal";
import UpdateOrganizationModal from "../modals/UpdateOrganizationModal";
import MemberManagement from "./MemberManagement";
import {
  CreateOrganizationData,
  organizationApi,
  OrganizationMember,
  UpdateOrganizationData,
} from "@/lib/api/organization/organizationApi";

interface OrganizationSelectorProps {
  isCollapsed: boolean;
  isMobile?: boolean;
}

interface CreateOrganizationFormData extends CreateOrganizationData {
  [key: string]: string;
}

// Enhanced Create Organization Modal
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
  error,
}) => {
  const [formData, setFormData] = useState<CreateOrganizationFormData>({
    business_name: "",
    business_address: "",
    business_phone: "",
    business_taxId: "",
    business_industry: "",
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      business_name: "",
      business_address: "",
      business_phone: "",
      business_taxId: "",
      business_industry: "",
    });
    setFocusedField(null);
    onClose();
  };

  if (!isOpen) return null;

  const formFields = [
    {
      key: "business_name",
      label: "Business Name",
      type: "text",
      required: true,
      icon: Building2,
      placeholder: "Enter your business name",
      description: "The official name of your organization",
    },
    {
      key: "business_address",
      label: "Business Address",
      type: "text",
      required: true,
      icon: MapPin,
      placeholder: "Enter your business address",
      description: "Your organization's physical location",
    },
    {
      key: "business_phone",
      label: "Business Phone",
      type: "tel",
      required: true,
      icon: Phone,
      placeholder: "+1 (555) 123-4567",
      description: "Primary contact number",
    },
    {
      key: "business_taxId",
      label: "Tax ID",
      type: "text",
      required: true,
      icon: Hash,
      placeholder: "Enter tax identification number",
      description: "Government issued tax identifier",
    },
    {
      key: "business_industry",
      label: "Industry",
      type: "text",
      required: true,
      icon: Briefcase,
      placeholder: "e.g. Technology, Healthcare, Finance",
      description: "Your business sector or industry",
    },
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
            {formFields.map(
              ({ key, label, type, required, icon: Icon, placeholder }) => (
                <div key={key} className="group">
                  <label
                    htmlFor={key}
                    className="block text-sm font-semibold text-gray-800 mb-2 transition-colors group-focus-within:text-blue-600"
                  >
                    <div className="flex items-center space-x-2">
                      <Icon
                        size={16}
                        className="text-gray-400 group-focus-within:text-blue-500 transition-colors"
                      />
                      <span>{label}</span>
                      {required && (
                        <span className="text-red-500 text-xs">*</span>
                      )}
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
                        focusedField === key &&
                          "ring-4 ring-blue-100 border-blue-500 bg-white transform scale-[1.02]"
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
                </div>
              )
            )}

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

const EnhancedOrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  isCollapsed,
  isMobile = false,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationMember[]>([]);
  const [selectedOrganization, setSelectedOrganization] =
    useState<OrganizationMember | null>(null);
  const [switchLoading, setSwitchLoading] = useState(false);

  const {
    error,
    isLoading,
    handleError,
    clearError,
    executeWithErrorHandling,
  } = useApiError();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  // Fetch organizations on component mount
  const fetchOrganizations = useCallback(async () => {
    const result = await executeWithErrorHandling(async () => {
      const response = await organizationApi.getOrganizations();
      return response.data;
    });

    if (result) {
      setOrganizations(result);

      // Auto-select first organization if none selected
      if (result.length > 0 && !selectedOrganization) {
        setSelectedOrganization(result[0]);
      }
    }
  }, [selectedOrganization, executeWithErrorHandling]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Handle clicks outside of the dropdown
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
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

  // Handle organization selection with retry logic
  const handleSelectOrganization = useCallback(
    async (org: OrganizationMember, twoFactorCode?: string) => {
      if (selectedOrganization?.organization.id === org.organization.id) {
        setShowDropdown(false);
        return;
      }

      setSwitchLoading(true);

      const result = await executeWithErrorHandling(async () => {
        await organizationApi.switchOrganization({
          organizationId: org.organization.id,
        });
        return org;
      });

      if (result) {
        setSelectedOrganization(result);
        setShowDropdown(false);
        setShowTwoFactorModal(false);
        console.log(
          "Successfully switched to organization:",
          result.organization
        );
      } else if (error?.requiresTwoFactor()) {
        setShowTwoFactorModal(true);
      }

      setSwitchLoading(false);
    },
    [selectedOrganization, error, executeWithErrorHandling]
  );

  // Handle organization creation
  const handleCreateOrganization = useCallback(
    async (formData: CreateOrganizationFormData) => {
      const result = await executeWithErrorHandling(async () => {
        await organizationApi.createOrganization(formData);
      });

      if (result !== null) {
        setShowCreateModal(false);
        await fetchOrganizations();
      }
    },
    [executeWithErrorHandling, fetchOrganizations]
  );

  // Handle organization update
  const handleUpdateOrganization = useCallback(
    async (updateData: UpdateOrganizationData, twoFactorCode?: string) => {
      const result = await executeWithErrorHandling(async () => {
        await organizationApi.updateOrganization(updateData, twoFactorCode);
      });

      if (result !== null) {
        setShowUpdateModal(false);
        setShowTwoFactorModal(false);
        await fetchOrganizations();
      } else if (error?.requiresTwoFactor()) {
        setShowTwoFactorModal(true);
      }
    },
    [executeWithErrorHandling, fetchOrganizations, error]
  );

  // Handle 2FA submission
  const handleTwoFactorSubmit = async (code: string) => {
    if (organizationApi.hasPendingTwoFactorOperation()) {
      await organizationApi.retryWithTwoFactor(code);
      setShowTwoFactorModal(false);
      await fetchOrganizations();
    }
  };

  const toggleDropdown = useCallback(() => {
    setShowDropdown((prev) => !prev);
  }, []);

  const handleShowCreateModal = useCallback(() => {
    setShowCreateModal(true);
    setShowDropdown(false);
    clearError();
  }, [clearError]);

  const handleShowUpdateModal = useCallback(() => {
    setShowUpdateModal(true);
    setShowDropdown(false);
    clearError();
  }, [clearError]);

  const handleShowMemberModal = useCallback(() => {
    setShowMemberModal(true);
    setShowDropdown(false);
    clearError();
  }, [clearError]);

  // Generate display name and initials
  const displayName =
    selectedOrganization?.organization.business_name ||
    user?.fullName ||
    "Organization";
  const userInitials = displayName
    ? displayName.substring(0, 2).toUpperCase()
    : "US";

  return (
    <>
      <div
        className={cn(
          "px-4 relative",
          isCollapsed && !isMobile ? "py-3" : "py-3"
        )}
        ref={dropdownRef}
      >
        {/* Enhanced selector button */}
        <div
          className={cn(
            "flex items-center p-3 rounded-2xl cursor-pointer transition-all duration-300",
            "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-200",
            "focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-400",
            isCollapsed && !isMobile ? "justify-center" : "justify-between",
            showDropdown &&
              "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 ring-4 ring-blue-100"
          )}
          onClick={toggleDropdown}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleDropdown();
            }
          }}
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        >
          <div
            className={cn(
              "flex items-center min-w-0",
              isCollapsed && !isMobile ? "justify-center" : "flex-1"
            )}
          >
            {/* Modern avatar with gradient */}
            <div
              className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mr-3 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg"
              aria-label={`${displayName} avatar`}
            >
              {userInitials}
            </div>
            {(!isCollapsed || isMobile) && (
              <span className="font-semibold text-gray-800 truncate">
                {displayName}
              </span>
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

        {/* Enhanced dropdown */}
        {showDropdown && (!isCollapsed || isMobile) && (
          <div className="absolute left-4 right-4 mt-3 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-2 duration-300 overflow-hidden">
            <div className="p-4">
              {/* Error message with modern styling */}
              {error && !showTwoFactorModal && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl animate-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-sm text-red-700 font-medium">
                      {error.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center space-x-2 mb-4">
                <Globe size={16} className="text-gray-400" />
                <p className="text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  Organizations
                </p>
              </div>

              {/* Loading state with modern design */}
              {isLoading ? (
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
                          selectedOrganization?.organization.id ===
                            orgMember.organization.id
                            ? "bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-200 shadow-md"
                            : "hover:shadow-md border-2 border-transparent",
                          switchLoading && "opacity-50 pointer-events-none"
                        )}
                        onClick={() => handleSelectOrganization(orgMember)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSelectOrganization(orgMember);
                          }
                        }}
                      >
                        {/* Modern organization avatar */}
                        <div
                          className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold mr-3 flex-shrink-0 shadow-lg transition-all duration-300",
                            selectedOrganization?.organization.id ===
                              orgMember.organization.id
                              ? "bg-gradient-to-br from-blue-500 to-purple-600 scale-110"
                              : "bg-gradient-to-br from-gray-400 to-gray-600 group-hover:scale-105"
                          )}
                        >
                          {orgMember.organization.business_name ? (
                            orgMember.organization.business_name
                              .substring(0, 2)
                              .toUpperCase()
                          ) : (
                            <Building2 size={18} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate text-sm">
                            {orgMember.organization.business_name ||
                              "Unnamed Organization"}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span
                              className={cn(
                                "inline-flex px-2 py-1 rounded-lg text-xs font-medium",
                                orgMember.role === "ADMIN"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : orgMember.role === "MEMBER"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                              )}
                            >
                              {orgMember.role}
                            </span>
                            {selectedOrganization?.organization.id ===
                              orgMember.organization.id && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <p className="text-xs text-green-600 font-medium">
                                  Active
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Enhanced action buttons */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {orgMember.role === "ADMIN" && (
                            <>
                              <button
                                className="w-8 h-8 bg-blue-600/80 backdrop-blur-sm rounded-xl 
                                          flex items-center justify-center transition-all duration-300 hover:bg-blue-700 
                                          focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                                          hover:scale-110 active:scale-95"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShowUpdateModal();
                                }}
                                title="Edit organization"
                                type="button"
                              >
                                <Edit3 size={14} className="text-white" />
                              </button>

                              <button
                                className="w-8 h-8 bg-purple-600/80 backdrop-blur-sm rounded-xl 
                                          flex items-center justify-center transition-all duration-300 hover:bg-purple-700 
                                          focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1
                                          hover:scale-110 active:scale-95"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShowMemberModal();
                                }}
                                title="Manage members"
                                type="button"
                              >
                                <Users size={14} className="text-white" />
                              </button>
                            </>
                          )}

                          <button
                            className="w-8 h-8 bg-gray-800/80 backdrop-blur-sm rounded-xl 
                                      flex items-center justify-center transition-all duration-300 hover:bg-gray-700 
                                      focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1
                                      hover:scale-110 active:scale-95"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(
                                "Organization settings clicked for:",
                                orgMember.organization.id
                              );
                            }}
                            title="Organization settings"
                            type="button"
                          >
                            <Settings size={14} className="text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Modern create button */}
                  <button
                    type="button"
                    className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
                              rounded-2xl text-white font-normal flex items-center justify-center space-x-2 
                              transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                              focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-lg hover:shadow-xl"
                    onClick={handleShowCreateModal}
                  >
                    <Sparkles size={18} />
                    <span className="whitespace-nowrap">New Organization</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateOrganization}
        loading={isLoading}
        error={error?.message || null}
      />

      {/* Update Organization Modal */}
      {selectedOrganization && (
        <UpdateOrganizationModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          onSubmit={handleUpdateOrganization}
          loading={isLoading}
          error={error?.message || null}
          organization={selectedOrganization.organization}
        />
      )}

      {/* Two Factor Modal */}
      <TwoFactorModal
        isOpen={showTwoFactorModal}
        onClose={() => {
          setShowTwoFactorModal(false);
          organizationApi.clearPendingOperation();
        }}
        onSubmit={handleTwoFactorSubmit}
        loading={isLoading}
        error={error?.message || null}
        operation="complete this action"
      />

      {/* Member Management Modal */}
      {selectedOrganization && showMemberModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                Manage Team Members
              </h2>
              <button
                onClick={() => setShowMemberModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
              <MemberManagement
                organizationId={selectedOrganization.organization.id}
                userRole={selectedOrganization.role}
                currentUserId={user?.id || ""}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedOrganizationSelector;
