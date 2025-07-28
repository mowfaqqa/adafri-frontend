"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Link, Check, Copy, Share, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";

interface ShareButtonProps {
  type: "project" | "task";
  projectId: string;
  taskId?: string; // Only required for tasks
  size?: "sm" | "default" | "lg";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  type,
  projectId,
  taskId,
  size = "sm",
  variant = "ghost",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    useProjectPublicSharingStatusQuery,
    useEnableProjectPublicSharingMutation,
    useDisableProjectPublicSharingMutation,
    useTaskPublicSharingStatusQuery,
    useEnableTaskPublicSharingMutation,
    useDisableTaskPublicSharingMutation,
  } = useAuthAwareTaskManagerApi();

  // Get sharing status
  const { data: projectSharingStatus } = useProjectPublicSharingStatusQuery(projectId);
  const { data: taskSharingStatus } = useTaskPublicSharingStatusQuery(
    projectId, 
    taskId || ""
  );

  // Get mutations
  const enableProjectSharing = useEnableProjectPublicSharingMutation();
  const disableProjectSharing = useDisableProjectPublicSharingMutation();
  const enableTaskSharing = useEnableTaskPublicSharingMutation();
  const disableTaskSharing = useDisableTaskPublicSharingMutation();

  // Determine current status
  const isEnabled = type === "project" 
    ? projectSharingStatus?.isPublicSharingEnabled 
    : taskSharingStatus?.isPublicSharingEnabled;

  const publicUrl = type === "project"
    ? projectSharingStatus?.publicUrl
    : taskSharingStatus?.publicUrl;

  // Handle enable/disable sharing
  const handleToggleSharing = async () => {
    if (type === "project") {
      if (isEnabled) {
        disableProjectSharing.mutate(projectId);
      } else {
        enableProjectSharing.mutate(projectId);
      }
    } else if (taskId) {
      if (isEnabled) {
        disableTaskSharing.mutate({ projectId, taskId });
      } else {
        enableTaskSharing.mutate({ projectId, taskId });
      }
    }
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!publicUrl) return;
    
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const isLoading = 
    enableProjectSharing.isPending || 
    disableProjectSharing.isPending ||
    enableTaskSharing.isPending ||
    disableTaskSharing.isPending;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={`${className} ${isEnabled ? 'text-blue-600' : 'text-gray-500'}`}
          disabled={isLoading}
        >
          {size === "sm" ? (
            <Share className="h-4 w-4" />
          ) : (
            <>
              <Share className="h-4 w-4 mr-2" />
              Share
            </>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">
              Share {type === "project" ? "Project" : "Task"}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleSharing}
              disabled={isLoading}
              className={`h-8 px-3 text-xs ${
                isEnabled 
                  ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                  : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              {isLoading ? (
                "Loading..."
              ) : isEnabled ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Disable
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Enable
                </>
              )}
            </Button>
          </div>

          {/* Status indicator */}
          <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
            isEnabled 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-gray-50 text-gray-600 border border-gray-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isEnabled ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            {isEnabled ? "Public sharing is enabled" : "Public sharing is disabled"}
          </div>

          {/* URL input and copy button */}
          {isEnabled && publicUrl && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Public Link</label>
              <div className="flex gap-2">
                <Input
                  value={publicUrl}
                  readOnly
                  className="flex-1 text-xs bg-gray-50 border-gray-200"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="px-3"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Anyone with this link can view this {type} without signing in.
              </p>
            </div>
          )}

          {/* Help text when disabled */}
          {!isEnabled && (
            <p className="text-xs text-gray-500">
              Enable public sharing to generate a shareable link that anyone can access.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ShareButton;