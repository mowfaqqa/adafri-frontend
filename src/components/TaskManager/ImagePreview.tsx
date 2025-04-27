import React, { useState } from "react";
import { FileAttachment } from "@/lib/types/taskManager/types";
import { getFileUrl } from "@/lib/api/task-manager/fileApi";
import { X, ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePreviewProps {
  file: FileAttachment;
  onClose: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ file, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = getFileUrl(file);
    link.download = file.originalname;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Build transformation params for Cloudinary URL if needed
  // This assumes the URL is from Cloudinary and supports transformations
  const getTransformedUrl = () => {
    return getFileUrl(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg overflow-hidden max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 flex items-center justify-between border-b">
          <h3 className="font-medium truncate max-w-[300px]">
            {file.originalname}
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRotate}>
              <RotateCw className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload}>
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="overflow-auto p-4 flex items-center justify-center flex-1">
          <div
            className="transition-all duration-200 ease-in-out"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            <img
              src={getTransformedUrl()}
              alt={file.originalname}
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
