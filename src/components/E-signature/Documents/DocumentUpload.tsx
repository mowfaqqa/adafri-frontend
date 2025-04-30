"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileUp, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  formatFileSize,
  isValidDocumentType,
} from "@/lib/utils/e-signature/utils";
import { documentService } from "@/lib/api/e-signature/client";

export function DocumentUpload({ onUploadSuccess }: any) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<any>(null);

  const handleFileChange = (e: any) => {
    const selectedFile = e?.target.files[0];
    setError("");

    if (!selectedFile) return;

    if (!isValidDocumentType(selectedFile)) {
      setError("Invalid file type. Please upload PDF or DOCX files only.");
      setFile(null);
      return;
    }
    console.log(selectedFile, "SELECTED FILE");
    setFile(selectedFile);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!file || !title.trim()) {
      setError("Please provide both a title and file.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      // Create form data to upload the file
      const formData = new FormData();
      formData.append("title", title);
      formData.append("media", file, file?.name);

      console.log(formData, "formdata");
      // Use axios with custom config for multipart/form-data
      const response = await documentService.createDocument(formData);

      // Reset form
      setTitle("");
      setFile(null);
      if (fileInputRef?.current) {
        fileInputRef.current.value = "";
      }

      toast.success("Document uploaded successfully");

      // Trigger callback to refresh document list
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to upload document. Please try again."
      );
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload New Document</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              placeholder="Enter document title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">Upload Document (PDF or DOCX)</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                id="document"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                required
              />
            </div>
          </div>

          {file && (
            <div className="flex items-center gap-2 p-2 border rounded-md">
              <CheckCircle className="text-green-500" size={18} />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-gray-500 ml-auto">
                {formatFileSize(file.size)}
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            disabled={isUploading || !file}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default DocumentUpload;
