// components/organization/MemberManagement.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  MoreVertical,
  Crown,
  User,
  Eye,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/errors/apiErrors";
import { useApiError } from "@/lib/hooks/useApiError";
import TwoFactorModal from "../modals/TwoFactorModal";
import {
  organizationApi,
  OrganizationMember,
} from "@/lib/api/organization/organizationApi";

interface MemberManagementProps {
  organizationId: string;
  userRole: "ADMIN" | "MEMBER" | "GUEST";
  currentUserId: string;
}

interface InviteModalData {
  email: string;
  role: "ADMIN" | "MEMBER" | "GUEST";
}

const MemberManagement: React.FC<MemberManagementProps> = ({
  organizationId,
  userRole,
  currentUserId,
}) => {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [inviteData, setInviteData] = useState<InviteModalData>({
    email: "",
    role: "MEMBER",
  });
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [pendingOperation, setPendingOperation] = useState<string | null>(null);

  const {
    error,
    isLoading,
    handleError,
    clearError,
    executeWithErrorHandling,
  } = useApiError();

  const canManageMembers = userRole === "ADMIN";
  const canInviteMembers = canManageMembers;
  const canRemoveMembers = canManageMembers;
  const canUpdateRoles = canManageMembers;

  // Fetch members
  const fetchMembers = useCallback(async () => {
    const result = await executeWithErrorHandling(async () => {
      const response = await organizationApi.getMembers(organizationId);
      return response.data;
    });

    if (result) {
      setMembers(result);
    }
  }, [organizationId, executeWithErrorHandling]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Handle member invitation
  const handleInviteMember = async (twoFactorCode?: string) => {
    if (!canInviteMembers) return;

    const result = await executeWithErrorHandling(async () => {
      await organizationApi.inviteMember(
        {
          organizationId,
          email: inviteData.email,
          role: inviteData.role,
        },
        twoFactorCode
      );
    });

    if (result !== null) {
      setShowInviteModal(false);
      setShowTwoFactorModal(false);
      setInviteData({ email: "", role: "MEMBER" });
      setPendingOperation(null);
      await fetchMembers();
    } else if (error?.requiresTwoFactor()) {
      setPendingOperation("invite");
      setShowTwoFactorModal(true);
    }
  };

  // Handle role update
  const handleUpdateRole = async (
    memberId: string,
    newRole: "ADMIN" | "MEMBER" | "GUEST",
    twoFactorCode?: string
  ) => {
    if (!canUpdateRoles) return;

    const result = await executeWithErrorHandling(async () => {
      await organizationApi.updateMemberRole({
        organizationId,
        memberId,
        role: newRole,
        twoFactorCode,
      });
    });

    if (result !== null) {
      setShowTwoFactorModal(false);
      setPendingOperation(null);
      setSelectedMemberId(null);
      await fetchMembers();
    } else if (error?.requiresTwoFactor()) {
      setPendingOperation(`updateRole-${memberId}-${newRole}`);
      setSelectedMemberId(memberId);
      setShowTwoFactorModal(true);
    }
  };

  // Handle member removal
  const handleRemoveMember = async (
    memberId: string,
    twoFactorCode?: string
  ) => {
    if (!canRemoveMembers) return;

    const result = await executeWithErrorHandling(async () => {
      await organizationApi.removeMember(
        organizationId,
        memberId,
        twoFactorCode
      );
    });

    if (result !== null) {
      setShowTwoFactorModal(false);
      setPendingOperation(null);
      setSelectedMemberId(null);
      await fetchMembers();
    } else if (error?.requiresTwoFactor()) {
      setPendingOperation(`remove-${memberId}`);
      setSelectedMemberId(memberId);
      setShowTwoFactorModal(true);
    }
  };

  // Handle 2FA submission
  const handleTwoFactorSubmit = async (code: string) => {
    if (!pendingOperation) return;

    if (pendingOperation === "invite") {
      await handleInviteMember(code);
    } else if (pendingOperation.startsWith("updateRole-")) {
      const [, memberId, newRole] = pendingOperation.split("-");
      await handleUpdateRole(
        memberId,
        newRole as "ADMIN" | "MEMBER" | "GUEST",
        code
      );
    } else if (pendingOperation.startsWith("remove-")) {
      const memberId = pendingOperation.split("-")[1];
      await handleRemoveMember(memberId, code);
    }
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case "MEMBER":
        return <User className="w-4 h-4 text-blue-600" />;
      case "GUEST":
        return <Eye className="w-4 h-4 text-gray-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get role color classes
  const getRoleColorClasses = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "MEMBER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "GUEST":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Handle close modals
  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
    setInviteData({ email: "", role: "MEMBER" });
    clearError();
  };

  const handleCloseTwoFactorModal = () => {
    setShowTwoFactorModal(false);
    setPendingOperation(null);
    setSelectedMemberId(null);
    clearError();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Team Members</h2>
              <p className="text-sm text-gray-500">{members.length} members</p>
            </div>
          </div>

          {canInviteMembers && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && !showTwoFactorModal && (
        <div className="p-4 mx-6 mt-4 bg-red-50 border border-red-100 rounded-xl">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">{error.message}</p>
            <button
              onClick={clearError}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              <div className="w-8 h-8 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <span className="ml-3 text-gray-600">Loading members...</span>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No members found</p>
            <p className="text-sm text-gray-400">
              Invite your first team member to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const isCurrentUser = member.user.id === currentUserId;
              const canModifyThisMember = canManageMembers && !isCurrentUser;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors group"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                      {member.user.first_name?.charAt(0)}
                      {member.user.last_name?.charAt(0)}
                    </div>

                    {/* Member info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-gray-800 truncate">
                          {member.user.first_name} {member.user.last_name}
                          {isCurrentUser && (
                            <span className="text-xs text-blue-600 font-medium ml-2">
                              (You)
                            </span>
                          )}
                        </p>
                        {member.twoFactorEnabled && (
                          <Shield className="w-4 h-4 text-green-500">
                            <title>2FA Enabled</title>
                          </Shield>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {member.user.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={cn(
                            "inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium border",
                            getRoleColorClasses(member.role)
                          )}
                        >
                          {getRoleIcon(member.role)}
                          <span>{member.role}</span>
                        </span>
                        <span
                          className={cn(
                            "inline-flex px-2 py-1 rounded-lg text-xs font-medium",
                            member.status === "active"
                              ? "bg-green-100 text-green-800"
                              : member.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          )}
                        >
                          {member.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {canModifyThisMember && (
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Role selector */}
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateRole(
                            member.id,
                            e.target.value as "ADMIN" | "MEMBER" | "GUEST"
                          )
                        }
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isLoading}
                      >
                        <option value="GUEST">Guest</option>
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove member"
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">
                  Invite Team Member
                </h3>
                <button
                  onClick={handleCloseInviteModal}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleInviteMember();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteData.email}
                    onChange={(e) =>
                      setInviteData({ ...inviteData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="colleague@company.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteData.role}
                    onChange={(e) =>
                      setInviteData({
                        ...inviteData,
                        role: e.target.value as "ADMIN" | "MEMBER" | "GUEST",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="GUEST">Guest - View only access</option>
                    <option value="MEMBER">Member - Standard access</option>
                    <option value="ADMIN">Admin - Full access</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseInviteModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !inviteData.email}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Sending..." : "Send Invite"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Two Factor Modal */}
      <TwoFactorModal
        isOpen={showTwoFactorModal}
        onClose={handleCloseTwoFactorModal}
        onSubmit={handleTwoFactorSubmit}
        loading={isLoading}
        error={error?.message}
        operation={
          pendingOperation === "invite"
            ? "invite this member"
            : pendingOperation?.startsWith("updateRole-")
              ? "update member role"
              : pendingOperation?.startsWith("remove-")
                ? "remove this member"
                : "complete this action"
        }
      />
    </div>
  );
};

export default MemberManagement;
