"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus } from "lucide-react";
import DocumentList from "@/components/E-signature/Documents/DocumentList";
import DocumentUpload from "@/components/E-signature/Documents/DocumentUpload";

export default function DocumentsPage() {
  const [newDocument, setNewDocument] = useState(null);

  const handleUploadSuccess = (document: any) => {
    setNewDocument(document);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-gray-500 mt-1">
          Manage your documents and signature requests
        </p>
      </header>

      <Tabs defaultValue="all-documents">
        <TabsList>
          <TabsTrigger
            value="all-documents"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            All Documents
          </TabsTrigger>
          <TabsTrigger
            value="upload-document"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Upload Document
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-documents" className="mt-6">
          <DocumentList newDocument={newDocument} />
        </TabsContent>

        <TabsContent value="upload-document" className="mt-6">
          <DocumentUpload onUploadSuccess={handleUploadSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
