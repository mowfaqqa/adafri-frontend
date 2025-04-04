"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Eye,
  FileSignature,
  Loader2,
  RefreshCw,
  Search,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { documentService } from "@/lib/api/e-signature/client";
import { formatDate, getStatusColor } from "@/lib/utils/e-signature/utils";

// Define the Document type to avoid using 'any'
interface Document {
  id: string;
  title: string;
  createdAt: string;
  status?: string;
  // Add other document properties as needed
}

interface DocumentListProps {
  newDocument?: Document | null;
}

export function DocumentList({ newDocument }: DocumentListProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger refresh

  // Fetch documents from API
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const response = await documentService.getDocuments();

        // Check if response.data is an array
        const documentsData = Array.isArray(response.data)
          ? response.data
          : response.data?.documents || []; // Try to get documents array or fallback to empty array

        setDocuments(documentsData);
        setError("");
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError("Failed to load documents. Please try again.");
        toast.error("Could not load documents");
        // Initialize with empty array on error
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [refreshKey]);

  // When a new document is added, add it to the list
  useEffect(() => {
    if (newDocument) {
      setDocuments((prev) => [newDocument, ...prev]);
    }
  }, [newDocument]);

  // Filter documents based on search term - add a null check before filtering
  const filteredDocuments =
    documents && Array.isArray(documents)
      ? documents.filter((doc) =>
          doc?.title?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : [];

  // Refresh document list
  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  // View document details
  const handleViewDocument = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  // Request signature for a document
  const handleRequestSignature = (documentId: string) => {
    router.push(`/signatures/request?documentId=${documentId}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Your Documents</CardTitle>
            <CardDescription>
              Manage your documents and signature requests
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No documents found. Upload a document to get started.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document?.id}>
                    <TableCell className="font-medium">
                      {document.title || "Untitled"}
                    </TableCell>
                    <TableCell>{formatDate(document?.createdAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusColor(
                          document?.status || "pending"
                        )}
                      >
                        {document?.status || "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(document?.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleRequestSignature(document?.id)}
                        >
                          <FileSignature className="h-4 w-4 mr-1" />
                          Request Signature
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DocumentList;
