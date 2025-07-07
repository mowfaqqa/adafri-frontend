// components/modals/UpdateOrganizationModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  MapPin,
  Phone,
  Hash,
  Briefcase,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Organization,
  UpdateOrganizationData,
} from "@/lib/api/organization/organizationApi";

interface UpdateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: UpdateOrganizationData,
    twoFactorCode?: string
  ) => Promise<void>;
  loading: boolean;
  error: string | null;
  organization: Organization;
}

interface FormData {
  business_name: string;
  business_address: string;
  business_phone: string;
  business_taxId: string;
  business_industry: string;
}

const UpdateOrganizationModal: React.FC<UpdateOrganizationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  error,
  organization,
}) => {
  const [formData, setFormData] = useState<FormData>({
    business_name: "",
    business_address: "",
    business_phone: "",
    business_taxId: "",
    business_industry: "",
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when modal opens or organization changes
  useEffect(() => {
    if (isOpen && organization) {
      const initialData = {
        business_name: organization.business_name || "",
        business_address: organization.business_address || "",
        business_phone: organization.business_phone || "",
        business_taxId: organization.business_taxId || "",
        business_industry: organization.business_industry || "",
      };
      setFormData(initialData);
      setHasChanges(false);
    }
  }, [isOpen, organization]);

  // Check for changes
  useEffect(() => {
    if (!organization) return;

    const hasChanged =
      formData.business_name !== (organization.business_name || "") ||
      formData.business_address !== (organization.business_address || "") ||
      formData.business_phone !== (organization.business_phone || "") ||
      formData.business_taxId !== (organization.business_taxId || "") ||
      formData.business_industry !== (organization.business_industry || "");

    setHasChanges(hasChanged);
  }, [formData, organization]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    // Prepare update data (only include changed fields)
    const updateData: UpdateOrganizationData = {
      organizationId: organization.id,
    };

    if (formData.business_name !== (organization.business_name || "")) {
      updateData.business_name = formData.business_name;
    }
    if (formData.business_address !== (organization.business_address || "")) {
      updateData.business_address = formData.business_address;
    }
    if (formData.business_phone !== (organization.business_phone || "")) {
      updateData.business_phone = formData.business_phone;
    }
    if (formData.business_taxId !== (organization.business_taxId || "")) {
      updateData.business_taxId = formData.business_taxId;
    }
    if (formData.business_industry !== (organization.business_industry || "")) {
      updateData.business_industry = formData.business_industry;
    }

    await onSubmit(updateData);
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        business_name: "",
        business_address: "",
        business_phone: "",
        business_taxId: "",
        business_industry: "",
      });
      setFocusedField(null);
      setHasChanges(false);
      onClose();
    }
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
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Update Organization</h2>
                <p className="text-blue-100 text-sm">
                  Modify your organization details
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Changes indicator */}
          {hasChanges && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-blue-700 font-medium">
                  You have unsaved changes
                </p>
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
                      disabled={loading}
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

            {/* Action buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-2xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || !hasChanges}
                className={cn(
                  "flex-1 py-3 px-4 rounded-2xl font-semibold text-white transition-all duration-300 relative overflow-hidden",
                  "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                  "transform hover:scale-[1.02] active:scale-[0.98]",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
                  "shadow-lg hover:shadow-xl"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Update Organization</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateOrganizationModal;
