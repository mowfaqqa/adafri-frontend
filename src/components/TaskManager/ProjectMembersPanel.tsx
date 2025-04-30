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
import { ChevronDown, MoreHorizontal, Plus, UserPlus } from "lucide-react";
import { ProjectRole } from "@/lib/types/taskManager/types";
import { useTaskManagerApi } from "@/lib/hooks/useTaskmanagerApi";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";

const ProjectMembersPanel: React.FC = () => {
  const { currentProject, projectId, isProjectAdmin } = useProjectContext();
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<ProjectRole>("member");

  const {
    useAddProjectMemberMutation,
    useRemoveProjectMemberMutation,
    useUpdateMemberRoleMutation,
  } = useTaskManagerApi();

  const addMemberMutation = useAddProjectMemberMutation();
  const removeMemberMutation = useRemoveProjectMemberMutation();
  const updateRoleMutation = useUpdateMemberRoleMutation();

  if (!currentProject) {
    return null;
  }

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId || !newMemberEmail.trim()) {
      return;
    }

    // In a real app, you would search for the user by email first
    // For this example, we'll assume the email directly maps to a user ID
    const mockUserId = `user-${newMemberEmail.replace(/@.*/, "")}`;

    addMemberMutation.mutate(
      {
        projectId,
        memberId: mockUserId,
        role: newMemberRole,
      },
      {
        onSuccess: () => {
          setNewMemberEmail("");
          setShowAddMemberDialog(false);
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project Members</CardTitle>
        {isProjectAdmin && (
          <Dialog
            open={showAddMemberDialog}
            onOpenChange={setShowAddMemberDialog}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="bg-teal-600">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Project Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddMember}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="member@example.com"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          {newMemberRole === "admin" ? "Admin" : "Member"}
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => setNewMemberRole("admin")}
                        >
                          Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setNewMemberRole("member")}
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
                    disabled={addMemberMutation.isPending}
                  >
                    {addMemberMutation.isPending ? "Adding..." : "Add Member"}
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
                    <AvatarImage src={`/api/placeholder/32/32`} />
                    <AvatarFallback>
                      {member?.userId.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{member?.userId}</span>
                    <span className="text-xs text-gray-500">
                      {member?.userId}@example.com
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
                  {new Date(member?.addedAt).toLocaleDateString()}
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
