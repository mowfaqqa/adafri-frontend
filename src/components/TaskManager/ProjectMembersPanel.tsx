"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, MoreHorizontal, Plus, UserPlus, Mail } from "lucide-react";
import { ProjectRole } from "@/lib/types/taskManager/types";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";

const ProjectMembersPanel: React.FC = () => {
  const { currentProject, projectId, isProjectAdmin } = useProjectContext();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ProjectRole>("member");

  const {
    useInviteProjectMemberMutation, // ✅ Use invitation instead of direct addition
    useRemoveProjectMemberMutation,
    useUpdateMemberRoleMutation,
  } = useAuthAwareTaskManagerApi();

  const inviteMemberMutation = useInviteProjectMemberMutation();
  const removeMemberMutation = useRemoveProjectMemberMutation();
  const updateRoleMutation = useUpdateMemberRoleMutation();

  if (!currentProject) {
    return null;
  }

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId || !inviteEmail.trim()) {
      return;
    }

    // ✅ Send invitation with email and role
    inviteMemberMutation.mutate(
      {
        projectId,
        email: inviteEmail.trim(),
        role: inviteRole,
      },
      {
        onSuccess: () => {
          setInviteEmail("");
          setInviteRole("member");
          setShowInviteDialog(false);
        },
      }
    );
  };

  const handleRemoveMember = (memberId: string) => {
    if (!projectId) return;

    if (
      confirm("Are you sure you want to remove this member from the project?")
    ) {
      removeMemberMutation.mutate({
        projectId,
        memberId,
      });
    }
  };

  const handleUpdateRole = (memberId: string, newRole: ProjectRole) => {
    if (!projectId) return;

    updateRoleMutation.mutate({
      projectId,
      memberId,
      role: newRole,
    });
  };

  // ✅ Helper function to get member display name
  const getMemberDisplayName = (member: any) => {
    if (member.displayName) return member.displayName;
    if (member.firstName && member.lastName) {
      return `${member.firstName} ${member.lastName}`;
    }
    if (member.firstName) return member.firstName;
    return member.email || member.userId;
  };

  // ✅ Helper function to get member initials
  const getMemberInitials = (member: any) => {
    if (member.firstName && member.lastName) {
      return `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
    }
    if (member.displayName) {
      const names = member.displayName.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    if (member.email) {
      return member.email.substring(0, 2).toUpperCase();
    }
    return member.userId?.substring(0, 2).toUpperCase() || "??";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project Members</CardTitle>
        {isProjectAdmin && (
          <Dialog
            open={showInviteDialog}
            onOpenChange={setShowInviteDialog}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="bg-teal-600">
                <Mail className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Project Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInviteMember}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="member@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      An invitation will be sent to this email address
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          {inviteRole === "admin" ? "Admin" : "Member"}
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => setInviteRole("admin")}
                        >
                          Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setInviteRole("member")}
                        >
                          Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <p className="text-xs text-gray-500">
                      Admins can manage project settings and members. Members
                      can only view and work on tasks.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-teal-600"
                    disabled={inviteMemberMutation.isPending}
                  >
                    {inviteMemberMutation.isPending ? "Sending..." : "Send Invitation"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              {isProjectAdmin && (
                <TableHead className="w-[100px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentProject.members.map((member: any) => (
              <TableRow key={member?.userId}>
                <TableCell className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member?.photoURL || `/api/placeholder/32/32`} />
                    <AvatarFallback>
                      {getMemberInitials(member)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {getMemberDisplayName(member)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {member?.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {member?.role === "admin" ? (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                      Admin
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      Member
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(member?.addedAt)?.toLocaleDateString()}
                </TableCell>
                {isProjectAdmin && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member?.role === "member" ? (
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateRole(member?.userId, "admin")
                            }
                          >
                            Make Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateRole(member?.userId, "member")
                            }
                          >
                            Remove Admin
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleRemoveMember(member?.userId)}
                        >
                          Remove from Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ProjectMembersPanel;