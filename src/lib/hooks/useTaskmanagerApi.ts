import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Task,
  Project,
  ProjectFormData,
  Epic,
  Milestone,
  ProjectTag,
  ProjectStatus,
  EpicFormData,
  MilestoneFormData,
  ProjectRole,
} from "../types/taskManager/types";
import {
  getProjectTasks,
  getMyTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskProgress,
  updateTaskAssignees,
  disableTaskPublicSharing,
  enableTaskPublicSharing,
  getTaskPublicSharingStatus,
} from "../api/task-manager/taskApi";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  updateMemberRole,
  getProjectTags,
  createProjectTag,
  updateProjectTag,
  deleteProjectTag,
  getProjectStatuses,
  createProjectStatus,
  updateProjectStatus,
  deleteProjectStatus,
  reorderProjectStatuses,
  disableProjectPublicSharing,
  getProjectPublicSharingStatus,
  enableProjectPublicSharing,
} from "../api/task-manager/projectApi";
import {
  getEpics,
  getEpicById,
  createEpic,
  updateEpic,
  deleteEpic,
  getEpicTasks,
  updateEpicProgress,
  getMilestones,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getMilestoneTasks,
} from "../api/task-manager/epicMilestoneApi";
import {
  uploadFile,
  getTaskFiles,
  deleteFile,
} from "../api/task-manager/fileApi";
import { toast } from "sonner";
import taskApiClient from "../api/task-manager/client";

export const useTaskManagerApi = () => {
  const queryClient = useQueryClient();

  // Project Queries
  const useProjectsQuery = () => {
    return useQuery({
      queryKey: ["projects"],
      queryFn: () => getProjects(),
    });
  };

  const useProjectQuery = (projectId: string) => {
    return useQuery({
      queryKey: ["project", projectId],
      queryFn: () => getProjectById(projectId),
      enabled: !!projectId,
    });
  };

  // Task queries
  const useProjectTasksQuery = (
    projectId: string,
    category?: string,
    status?: string,
    epicId?: string,
    milestoneId?: string,
    assignee?: string
  ) => {
    return useQuery({
      queryKey: [
        "projectTasks",
        projectId,
        category,
        status,
        epicId,
        milestoneId,
        assignee,
      ],
      queryFn: () =>
        getProjectTasks(
          projectId,
          category,
          status,
          epicId,
          milestoneId,
          assignee
        ),
      enabled: !!projectId,
    });
  };

  const useMyTasksQuery = (status?: string) => {
    return useQuery({
      queryKey: ["myTasks", status],
      queryFn: () => getMyTasks(status),
    });
  };

  const useTaskQuery = (projectId: string, taskId: string) => {
    return useQuery({
      queryKey: ["task", projectId, taskId],
      queryFn: () => getTaskById(projectId, taskId),
      enabled: !!projectId && !!taskId,
    });
  };

  // Epic queries
  const useEpicsQuery = (projectId: string) => {
    return useQuery({
      queryKey: ["epics", projectId],
      queryFn: () => getEpics(projectId),
      enabled: !!projectId,
    });
  };

  const useEpicQuery = (projectId: string, epicId: string) => {
    return useQuery({
      queryKey: ["epic", projectId, epicId],
      queryFn: () => getEpicById(projectId, epicId),
      enabled: !!projectId && !!epicId,
    });
  };

  const useEpicTasksQuery = (projectId: string, epicId: string) => {
    return useQuery({
      queryKey: ["epicTasks", projectId, epicId],
      queryFn: () => getEpicTasks(projectId, epicId),
      enabled: !!projectId && !!epicId,
    });
  };

  // Milestone queries
  const useMilestonesQuery = (projectId: string) => {
    return useQuery({
      queryKey: ["milestones", projectId],
      queryFn: () => getMilestones(projectId),
      enabled: !!projectId,
    });
  };

  const useMilestoneQuery = (projectId: string, milestoneId: string) => {
    return useQuery({
      queryKey: ["milestone", projectId, milestoneId],
      queryFn: () => getMilestoneById(projectId, milestoneId),
      enabled: !!projectId && !!milestoneId,
    });
  };

  const useMilestoneTasksQuery = (projectId: string, milestoneId: string) => {
    return useQuery({
      queryKey: ["milestoneTasks", projectId, milestoneId],
      queryFn: () => getMilestoneTasks(projectId, milestoneId),
      enabled: !!projectId && !!milestoneId,
    });
  };

  // Project Tags queries
  const useProjectTagsQuery = (projectId: string) => {
    return useQuery({
      queryKey: ["projectTags", projectId],
      queryFn: () => getProjectTags(projectId),
      enabled: !!projectId,
    });
  };

  // Project Statuses queries
  const useProjectStatusesQuery = (projectId: string) => {
    return useQuery({
      queryKey: ["projectStatuses", projectId],
      queryFn: () => getProjectStatuses(projectId),
      enabled: !!projectId,
    });
  };

  // File queries
  const useTaskFilesQuery = (projectId: string, taskId: string) => {
    return useQuery({
      queryKey: ["taskFiles", projectId, taskId],
      queryFn: () => getTaskFiles(projectId, taskId),
      enabled: !!projectId && !!taskId,
    });
  };

  // Project Mutations
  const useCreateProjectMutation = () => {
    return useMutation({
      mutationFn: (projectData: ProjectFormData) => createProject(projectData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        toast("Project created successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to create project");
      },
    });
  };

  const useUpdateProjectMutation = () => {
    return useMutation({
      mutationFn: ({
        id,
        updates,
      }: {
        id: string;
        updates: Partial<ProjectFormData>;
      }) => updateProject(id, updates),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        queryClient.invalidateQueries({ queryKey: ["project", data?.id] });
        toast("Project updated successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to update project");
      },
    });
  };

  const useDeleteProjectMutation = () => {
    return useMutation({
      mutationFn: (id: string) => deleteProject(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        toast("Project deleted successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to delete project");
      },
    });
  };

  // Project Members Mutations
  const useAddProjectMemberMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        memberId,
        role,
      }: {
        projectId: string;
        memberId: string;
        role: ProjectRole;
      }) => addProjectMember(projectId, memberId, role),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["project", data?.id] });
        toast("Member added to project successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to add member to project");
      },
    });
  };

  const useRemoveProjectMemberMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        memberId,
      }: {
        projectId: string;
        memberId: string;
      }) => removeProjectMember(projectId, memberId),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["project", data?.id] });
        toast("Member removed from project successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to remove member from project");
      },
    });
  };

  const useUpdateMemberRoleMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        memberId,
        role,
      }: {
        projectId: string;
        memberId: string;
        role: ProjectRole;
      }) => updateMemberRole(projectId, memberId, role),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["project", data?.id] });
        toast("Member role updated successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to update member role");
      },
    });
  };

  // Epic Mutations
  const useCreateEpicMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        epicData,
      }: {
        projectId: string;
        epicData: EpicFormData;
      }) => createEpic(projectId, epicData),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["epics", data?.projectId] });
        toast("Epic created successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to create epic");
      },
    });
  };

  const useUpdateEpicMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        epicId,
        updates,
      }: {
        projectId: string;
        epicId: string;
        updates: Partial<EpicFormData>;
      }) => updateEpic(projectId, epicId, updates),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["epics", data?.projectId] });
        queryClient.invalidateQueries({
          queryKey: ["epic", data?.projectId, data?.id],
        });
        toast("Epic updated successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to update epic");
      },
    });
  };

  const useDeleteEpicMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        epicId,
      }: {
        projectId: string;
        epicId: string;
      }) => deleteEpic(projectId, epicId),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: ["epics", variables.projectId],
        });
        toast("Epic deleted successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to delete epic");
      },
    });
  };

  const useUpdateEpicProgressMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        epicId,
      }: {
        projectId: string;
        epicId: string;
      }) => updateEpicProgress(projectId, epicId),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["epics", data?.projectId] });
        queryClient.invalidateQueries({
          queryKey: ["epic", data?.projectId, data?.id],
        });
        toast("Epic progress updated successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to update epic progress");
      },
    });
  };

  // Milestone Mutations
  const useCreateMilestoneMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        milestoneData,
      }: {
        projectId: string;
        milestoneData: MilestoneFormData;
      }) => createMilestone(projectId, milestoneData),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["milestones", data?.projectId],
        });
        toast("Milestone created successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to create milestone");
      },
    });
  };

  const useUpdateMilestoneMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        milestoneId,
        updates,
      }: {
        projectId: string;
        milestoneId: string;
        updates: Partial<MilestoneFormData>;
      }) => updateMilestone(projectId, milestoneId, updates),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["milestones", data?.projectId],
        });
        queryClient.invalidateQueries({
          queryKey: ["milestone", data?.projectId, data?.id],
        });
        toast("Milestone updated successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to update milestone");
      },
    });
  };

  const useDeleteMilestoneMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        milestoneId,
      }: {
        projectId: string;
        milestoneId: string;
      }) => deleteMilestone(projectId, milestoneId),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: ["milestones", variables.projectId],
        });
        toast("Milestone deleted successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to delete milestone");
      },
    });
  };

  // Project Tag Mutations
  const useCreateProjectTagMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        name,
        color,
      }: {
        projectId: string;
        name: string;
        color: string;
      }) => createProjectTag(projectId, name, color),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["projectTags", data?.projectId],
        });
        toast("Tag created successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to create tag");
      },
    });
  };

  const useUpdateProjectTagMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        tagId,
        updates,
      }: {
        projectId: string;
        tagId: string;
        updates: Partial<ProjectTag>;
      }) => updateProjectTag(projectId, tagId, updates),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["projectTags", data?.projectId],
        });
        toast("Tag updated successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to update tag");
      },
    });
  };

  const useDeleteProjectTagMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        tagId,
      }: {
        projectId: string;
        tagId: string;
      }) => deleteProjectTag(projectId, tagId),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: ["projectTags", variables.projectId],
        });
        toast("Tag deleted successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to delete tag");
      },
    });
  };

  // Project Status Mutations
  const useCreateProjectStatusMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        name,
        color,
      }: {
        projectId: string;
        name: string;
        color: string;
      }) => createProjectStatus(projectId, name, color),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["projectStatuses", data?.projectId],
        });
        toast("Status created successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to create status");
      },
    });
  };

  const useUpdateProjectStatusMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        statusId,
        updates,
      }: {
        projectId: string;
        statusId: string;
        updates: Partial<ProjectStatus>;
      }) => updateProjectStatus(projectId, statusId, updates),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["projectStatuses", data?.projectId],
        });
        toast("Status updated successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to update status");
      },
    });
  };

  const useDeleteProjectStatusMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        statusId,
      }: {
        projectId: string;
        statusId: string;
      }) => deleteProjectStatus(projectId, statusId),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: ["projectStatuses", variables.projectId],
        });
        toast("Status deleted successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to delete status");
      },
    });
  };

  const useReorderProjectStatusesMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        statusIds,
      }: {
        projectId: string;
        statusIds: string[];
      }) => reorderProjectStatuses(projectId, statusIds),
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({
          queryKey: ["projectStatuses", variables.projectId],
        });
        toast("Status order updated successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to reorder statuses");
      },
    });
  };

  // Task Mutations
  const useCreateTaskMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        taskData,
      }: {
        projectId: string;
        taskData: any;
      }) => createTask(projectId, taskData),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["projectTasks", data?.projectId],
        });
        queryClient.invalidateQueries({ queryKey: ["myTasks"] });

        // If task is part of an epic, invalidate epic tasks
        if (data?.epicId) {
          queryClient.invalidateQueries({
            queryKey: ["epicTasks", data.projectId, data.epicId],
          });
          queryClient.invalidateQueries({
            queryKey: ["epic", data.projectId, data.epicId],
          });
        }

        // If task is part of a milestone, invalidate milestone tasks
        if (data?.milestoneId) {
          queryClient.invalidateQueries({
            queryKey: ["milestoneTasks", data.projectId, data.milestoneId],
          });
        }

        toast("Task created successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to create task");
      },
    });
  };

  const useUpdateTaskMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        taskId,
        updates,
      }: {
        projectId: string;
        taskId: string;
        updates: Partial<Task>;
      }) => updateTask(projectId, taskId, updates),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["projectTasks", data?.projectId],
        });
        queryClient.invalidateQueries({
          queryKey: ["task", data?.projectId, data?.id],
        });
        queryClient.invalidateQueries({ queryKey: ["myTasks"] });

        // If task is part of an epic, invalidate epic tasks
        if (data?.epicId) {
          queryClient.invalidateQueries({
            queryKey: ["epicTasks", data.projectId, data.epicId],
          });
          queryClient.invalidateQueries({
            queryKey: ["epic", data.projectId, data.epicId],
          });
        }

        // If task is part of a milestone, invalidate milestone tasks
        if (data?.milestoneId) {
          queryClient.invalidateQueries({
            queryKey: ["milestoneTasks", data.projectId, data.milestoneId],
          });
        }

        toast("Task updated successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to update task");
      },
    });
  };

  const useDeleteTaskMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        taskId,
      }: {
        projectId: string;
        taskId: string;
      }) => deleteTask(projectId, taskId),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: ["projectTasks", variables.projectId],
        });
        queryClient.invalidateQueries({ queryKey: ["myTasks"] });
        toast("Task deleted successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to delete task");
      },
    });
  };

  const useUpdateTaskStatusMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        taskId,
        status,
      }: {
        projectId: string;
        taskId: string;
        status: string;
      }) => updateTaskStatus(projectId, taskId, status),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["projectTasks", data?.projectId],
        });
        queryClient.invalidateQueries({
          queryKey: ["task", data?.projectId, data?.id],
        });
        queryClient.invalidateQueries({ queryKey: ["myTasks"] });

        // If task is part of an epic, invalidate epic tasks
        if (data?.epicId) {
          queryClient.invalidateQueries({
            queryKey: ["epicTasks", data.projectId, data.epicId],
          });
          queryClient.invalidateQueries({
            queryKey: ["epic", data.projectId, data.epicId],
          });
        }

        toast(`Task status updated to ${data?.status}`);
      },
      onError: (error: any) => {
        toast(error.message || "Failed to update task status");
      },
    });
  };

  const useUpdateTaskProgressMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        taskId,
        progress,
      }: {
        projectId: string;
        taskId: string;
        progress: number;
      }) => updateTaskProgress(projectId, taskId, progress),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["projectTasks", data?.projectId],
        });
        queryClient.invalidateQueries({
          queryKey: ["task", data?.projectId, data?.id],
        });
        queryClient.invalidateQueries({ queryKey: ["myTasks"] });

        // If task is part of an epic, invalidate epic progress
        if (data?.epicId) {
          queryClient.invalidateQueries({
            queryKey: ["epicTasks", data.projectId, data.epicId],
          });
          queryClient.invalidateQueries({
            queryKey: ["epic", data.projectId, data.epicId],
          });
        }

        toast(`Task progress updated to ${data?.progress}%`);
      },
      onError: (error: any) => {
        toast(error.message || "Failed to update task progress");
      },
    });
  };

  const useUpdateTaskAssigneesMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        taskId,
        assignees,
      }: {
        projectId: string;
        taskId: string;
        assignees: string[];
      }) => updateTaskAssignees(projectId, taskId, assignees),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["projectTasks", data?.projectId],
        });
        queryClient.invalidateQueries({
          queryKey: ["task", data?.projectId, data?.id],
        });
        queryClient.invalidateQueries({ queryKey: ["myTasks"] });
        toast("Task assignees updated successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to update task assignees");
      },
    });
  };

  // File mutations
  const useUploadFileMutation = () => {
    return useMutation({
      mutationFn: ({
        projectId,
        taskId,
        file,
      }: {
        projectId: string;
        taskId: string;
        file: File;
      }) => uploadFile(projectId, taskId, file),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["taskFiles", data?.taskId],
        });
        queryClient.invalidateQueries({ queryKey: ["task", data?.taskId] });
        toast("File uploaded successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to upload file");
      },
    });
  };

  const useDeleteFileMutation = () => {
    return useMutation({
      mutationFn: ({ projectId, fileId }: { projectId: any; fileId: string }) =>
        deleteFile(projectId, fileId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["taskFiles"] });
        toast("File deleted successfully");
      },
      onError: (error: any) => {
        toast(error.message || "Failed to delete file");
      },
    });
  };
  const useInviteProjectMemberMutation = () => {
  return useMutation({
    mutationFn: async ({ 
      projectId, 
      email, 
      role 
    }: { 
      projectId: string; 
      email: string; 
      role: ProjectRole;
    }) => {
      const response = await taskApiClient.post(
        `/projects/${projectId}/invite`,
        { email, role }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({queryKey: ['projects', data.projectId]});
    },
  });
};
// Project Public Sharing Queries
const useProjectPublicSharingStatusQuery = (projectId: string) => {
  return useQuery({
    queryKey: ["projectPublicSharing", projectId],
    queryFn: () => getProjectPublicSharingStatus(projectId),
    enabled: !!projectId,
  });
};

// Project Public Sharing Mutations
const useEnableProjectPublicSharingMutation = () => {
  return useMutation({
    mutationFn: (projectId: string) => enableProjectPublicSharing(projectId),
    onSuccess: (data, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["projectPublicSharing", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Public sharing enabled successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to enable public sharing");
    },
  });
};

const useDisableProjectPublicSharingMutation = () => {
  return useMutation({
    mutationFn: (projectId: string) => disableProjectPublicSharing(projectId),
    onSuccess: (data, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["projectPublicSharing", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Public sharing disabled successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to disable public sharing");
    },
  });
};

// Task Public Sharing Queries
const useTaskPublicSharingStatusQuery = (projectId: string, taskId: string) => {
  return useQuery({
    queryKey: ["taskPublicSharing", projectId, taskId],
    queryFn: () => getTaskPublicSharingStatus(projectId, taskId),
    enabled: !!projectId && !!taskId,
  });
};

// Task Public Sharing Mutations
const useEnableTaskPublicSharingMutation = () => {
  return useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: string; taskId: string }) => 
      enableTaskPublicSharing(projectId, taskId),
    onSuccess: (data, { projectId, taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["taskPublicSharing", projectId, taskId] });
      queryClient.invalidateQueries({ queryKey: ["task", projectId, taskId] });
      queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] });
      toast.success("Task public sharing enabled successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to enable task public sharing");
    },
  });
};

const useDisableTaskPublicSharingMutation = () => {
  return useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: string; taskId: string }) => 
      disableTaskPublicSharing(projectId, taskId),
    onSuccess: (data, { projectId, taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["taskPublicSharing", projectId, taskId] });
      queryClient.invalidateQueries({ queryKey: ["task", projectId, taskId] });
      queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] });
      toast.success("Task public sharing disabled successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to disable task public sharing");
    },
  });
};

  return {
    // Project queries
    useProjectsQuery,
    useProjectQuery,

    // Project mutations
    useCreateProjectMutation,
    useUpdateProjectMutation,
    useDeleteProjectMutation,

    // Project member mutations
    useAddProjectMemberMutation,
    useRemoveProjectMemberMutation,
    useUpdateMemberRoleMutation,

    // Task queries
    useProjectTasksQuery,
    useMyTasksQuery,
    useTaskQuery,

    // Task mutations
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
    useUpdateTaskStatusMutation,
    useUpdateTaskProgressMutation,
    useUpdateTaskAssigneesMutation,

    // Epic queries and mutations
    useEpicsQuery,
    useEpicQuery,
    useEpicTasksQuery,
    useCreateEpicMutation,
    useUpdateEpicMutation,
    useDeleteEpicMutation,
    useUpdateEpicProgressMutation,

    // Milestone queries and mutations
    useMilestonesQuery,
    useMilestoneQuery,
    useMilestoneTasksQuery,
    useCreateMilestoneMutation,
    useUpdateMilestoneMutation,
    useDeleteMilestoneMutation,

    // Project tag queries and mutations
    useProjectTagsQuery,
    useCreateProjectTagMutation,
    useUpdateProjectTagMutation,
    useDeleteProjectTagMutation,

    // Project status queries and mutations
    useProjectStatusesQuery,
    useCreateProjectStatusMutation,
    useUpdateProjectStatusMutation,
    useDeleteProjectStatusMutation,
    useReorderProjectStatusesMutation,
    useInviteProjectMemberMutation,

    // File queries and mutations
    useTaskFilesQuery,
    useUploadFileMutation,
    useDeleteFileMutation,

    // Project public sharing
  useProjectPublicSharingStatusQuery,
  useEnableProjectPublicSharingMutation,
  useDisableProjectPublicSharingMutation,

  // Task public sharing
  useTaskPublicSharingStatusQuery,
  useEnableTaskPublicSharingMutation,
  useDisableTaskPublicSharingMutation,

  };
};
