// components/organization/OrganizationSwitcher.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Building2, Check, Plus, Settings, Users } from 'lucide-react';
import { useOrganization } from '@/lib/context/organization';
import CreateOrganizationModal from '@/components/modals/CreateOrganizationModal';

interface OrganizationSwitcherProps {
  className?: string;
  showCreateOption?: boolean;
  showManageOption?: boolean;
}

const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({
  className = '',
  showCreateOption = true,
  showManageOption = true
}) => {
  const {
    organizations,
    currentOrganization,
    switchOrganization,
    isLoadingOrganizations,
    userRole
  } = useOrganization();

  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle organization switch
  const handleSwitchOrganization = async (organizationId: string) => {
    if (currentOrganization?.organization.id === organizationId) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(organizationId);
    
    try {
      const success = await switchOrganization(organizationId);
      
      if (success) {
        setIsOpen(false);
        // Optionally refresh the page to ensure all components get the new organization context
        window.location.reload();
      } else {
        console.error('Failed to switch organization');
      }
    } catch (error) {
      console.error('Error switching organization:', error);
    } finally {
      setIsSwitching(null);
    }
  };

  // Get organization initials for avatar
  const getOrganizationInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role badge color
  const getRoleBadge = (role: string) => {
    const roleConfig = {
      OWNER: { color: 'bg-yellow-100 text-yellow-800', label: 'Owner' },
      ADMIN: { color: 'bg-purple-100 text-purple-800', label: 'Admin' },
      MEMBER: { color: 'bg-blue-100 text-blue-800', label: 'Member' },
      GUEST: { color: 'bg-gray-100 text-gray-800', label: 'Guest' }
    };
    
    return roleConfig[role as keyof typeof roleConfig] || roleConfig.GUEST;
  };

  if (isLoadingOrganizations) {
    return (
      <div className={`flex items-center space-x-2 p-2 ${className}`}>
        <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className={`flex items-center space-x-2 p-2 ${className}`}>
        <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
          <Building2 className="w-4 h-4 text-gray-400" />
        </div>
        <span className="text-sm text-gray-500">No organization</span>
      </div>
    );
  }

  const roleBadge = getRoleBadge(currentOrganization.role);

  return (
    <>
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-3 w-full p-2 rounded-xl hover:bg-gray-50 transition-colors group"
        >
          {/* Organization Avatar */}
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getOrganizationInitials(currentOrganization.organization.business_name)}
          </div>
          
          {/* Organization Info */}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-gray-800 truncate">
              {currentOrganization.organization.business_name}
            </p>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
              <span className="text-xs text-gray-500">
                {organizations.length} {organizations.length === 1 ? 'org' : 'orgs'}
              </span>
            </div>
          </div>
          
          {/* Dropdown Arrow */}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
            {/* Current Organizations */}
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Your Organizations
              </p>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {organizations.map((org) => {
                const isCurrentOrg = org.organization.id === currentOrganization.organization.id;
                const isSwitchingToThis = isSwitching === org.organization.id;
                const orgRoleBadge = getRoleBadge(org.role);
                
                return (
                  <button
                    key={org.organization.id}
                    onClick={() => handleSwitchOrganization(org.organization.id)}
                    disabled={isSwitchingToThis}
                    className="flex items-center space-x-3 w-full px-3 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {/* Organization Avatar */}
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {getOrganizationInitials(org.organization.business_name)}
                    </div>
                    
                    {/* Organization Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {org.organization.business_name}
                        </p>
                        {isCurrentOrg && (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${orgRoleBadge.color}`}>
                          {orgRoleBadge.label}
                        </span>
                        {org.organization.business_industry && (
                          <span className="text-xs text-gray-500 truncate">
                            {org.organization.business_industry}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Loading indicator */}
                    {isSwitchingToThis && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Separator */}
            {(showCreateOption || showManageOption) && (
              <div className="border-t border-gray-100 my-2"></div>
            )}

            {/* Action Items */}
            {showCreateOption && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
                className="flex items-center space-x-3 w-full px-3 py-2 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Create Organization</p>
                  <p className="text-xs text-gray-500">Start a new workspace</p>
                </div>
              </button>
            )}

            {showManageOption && userRole && ['ADMIN', 'OWNER'].includes(userRole) && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to organization settings
                  window.location.href = '/dashboard/organization/settings';
                }}
                className="flex items-center space-x-3 w-full px-3 py-2 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Organization Settings</p>
                  <p className="text-xs text-gray-500">Manage members and settings</p>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          // Refresh the page to load the new organization
          window.location.reload();
        }}
      />
    </>
  );
};

export default OrganizationSwitcher;