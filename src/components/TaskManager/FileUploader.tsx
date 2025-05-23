"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import { Paperclip, Upload, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";

interface FileUploaderProps {
  taskId: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ taskId }) => {
  const { projectId } = useProjectContext();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { useUploadFileMutation } = useAuthAwareTaskManagerApi();
  const uploadFileMutation = useUploadFileMutation();
  // Simulate upload progress
  useEffect(() => {
    if (uploadFileMutation.isPending && uploadProgress < 90) {
      const timer = setTimeout(() => {
        setUploadProgress((prev) => prev + 10);
      }, 200);
      return () => clearTimeout(timer);
    }

    if (!uploadFileMutation.isPending) {
      setUploadProgress(0);
    }
  }, [uploadFileMutation.isPending, uploadProgress]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile && taskId) {
      uploadFileMutation.mutate(
        {
          taskId,
          file: selectedFile,
          projectId: projectId!,
        },
        {
          onSuccess: () => {
            setSelectedFile(null);
            // Reset the file input
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          },
        }
      );
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {!selectedFile && !uploadFileMutation.isPending && (
        <Button
          type="button"
          variant="outline"
          onClick={handleTriggerFileInput}
          className="w-full flex items-center gap-2"
        >
          <Paperclip className="w-4 h-4" />
          Attach File
        </Button>
      )}

      {selectedFile && !uploadFileMutation.isPending && (
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              <span className="text-sm font-medium truncate max-w-[200px]">
                {selectedFile.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </div>
          <Button
            size="sm"
            onClick={handleUpload}
            className="w-full flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload
          </Button>
        </div>
      )}

      {uploadFileMutation.isPending && (
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Uploading...</span>
            <span className="text-xs">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
    </div>
  );
};

export default FileUploader;
