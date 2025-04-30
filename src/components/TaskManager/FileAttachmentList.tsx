import React, { useState } from "react";
import { useTaskManagerApi } from "@/lib/hooks/useTaskmanagerApi";
import { FileAttachment } from "@/lib/types/taskManager/types";
import {
  Download,
  File,
  Image,
  FileText,
  Video,
  Music,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFileUrl } from "@/lib/api/task-manager/fileApi";
import { FilePreview } from "./FilePreview";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";

interface FileAttachmentListProps {
  taskId: string;
}

// Helper function to get the appropriate file icon based on mimetype
const getFileIcon = (mimetype: string) => {
  if (mimetype.startsWith("image/")) {
    return <Image className="w-5 h-5" />;
  } else if (mimetype.startsWith("video/")) {
    return <Video className="w-5 h-5" />;
  } else if (mimetype.startsWith("audio/")) {
    return <Music className="w-5 h-5" />;
  } else if (mimetype.startsWith("text/") || mimetype.includes("document")) {
    return <FileText className="w-5 h-5" />;
  } else {
    return <File className="w-5 h-5" />;
  }
};

const FileAttachmentList: React.FC<FileAttachmentListProps> = ({ taskId }) => {
  const { currentProject, projectId, loading } = useProjectContext();
  const { useTaskFilesQuery, useDeleteFileMutation } = useTaskManagerApi();
  const { data: files, isLoading } = useTaskFilesQuery(projectId!, taskId);
  const deleteFileMutation = useDeleteFileMutation();
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);

  const handleDeleteFile = (fileId: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      deleteFileMutation.mutate({ projectId: projectId!, fileId });
    }
  };

  const handlePreview = (file: FileAttachment) => {
    setPreviewFile(file);
  };
  const openFile = (file: FileAttachment) => {
    // Using Cloudinary URL directly
    window.open(getFileUrl(file), "_blank");
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading attachments...</div>;
  }

  if (!files || files.length === 0) {
    return <div className="p-4 text-center text-gray-500">No attachments</div>;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-medium mb-2">Attachments ({files.length})</h3>
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
        >
          <div className="flex items-center gap-2">
            {getFileIcon(file.mimetype)}
            <div className="truncate max-w-[200px]">{file.originalname}</div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handlePreview(file)}
              title="View"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => openFile(file)}
              title="Open/Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600"
              onClick={() => handleDeleteFile(file.id)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      {previewFile && (
        <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
};

export default FileAttachmentList;
