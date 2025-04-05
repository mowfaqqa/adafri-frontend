"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  FileSignature,
  Download,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { documentService } from "@/lib/api/e-signature/client";
import {
  downloadSignedDocument,
  formatDate,
  getStatusColor,
} from "@/lib/utils/e-signature/utils";
import DocumentViewer from "@/components/E-signature/Documents/DocumentViewer";

export default function DocumentDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { id } = params;
  const [document, setDocument] = useState<any>(null);
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch document details and signatures
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get document details
        const documentResponse = await documentService.getDocumentById(id);
        setDocument(documentResponse.data);

        // Get document signatures
        const signaturesResponse = await documentService.getDocumentSignatures(
          id
        );
        setSignatures(signaturesResponse.data);

        setError("");
      } catch (err) {
        console.error("Error fetching document details:", err);
        setError("Failed to load document details. Please try again.");
        toast.error("Document not found");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, refreshKey]);

  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  // Request a new signature
  const handleRequestSignature = () => {
    router.push(`/signatures/request?documentId=${id}`);
  };

  // View a specific signature
  const handleViewSignature = (signatureId: string) => {
    router.push(`/signatures/${signatureId}`);
  };

  // Download document
  const handleDownloadDocument = () => {
    if (document?.fileUrl) {
      downloadSignedDocument(document.fileUrl, document.title + ".pdf");
      toast.success("Document download started");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!document && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500 mb-4">Document not found</p>
        <Button variant="outline" onClick={() => router.push("/documents")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push("/documents")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Button>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">{document?.title}</h1>
        <div className="flex items-center mt-2">
          <Badge
            variant="outline"
            className={getStatusColor(document?.status || "pending")}
          >
            {document?.status || "Pending"}
          </Badge>
          <p className="text-gray-500 ml-4">
            Created on {formatDate(document?.createdAt)}
          </p>
        </div>
      </header>

      {/* Document Viewer */}
      <Card>
        <CardHeader>
          <CardTitle>Document Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentViewer
            documentUrl={document?.fileUrl}
            documentTitle={document?.title}
            documentType={document?.fileType}
          />
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" onClick={handleDownloadDocument}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleRequestSignature}>
            <FileSignature className="h-4 w-4 mr-2" />
            Request Signature
          </Button>
        </CardFooter>
      </Card>

      {/* Signature List */}
      <Card>
        <CardHeader>
          <CardTitle>Signatures</CardTitle>
          <CardDescription>
            All signature requests for this document
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signatures.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileSignature className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No signatures requested yet</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Signer</TableHead>
                    <TableHead>Date Requested</TableHead>
                    <TableHead>Date Signed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signatures.map((signature: any) => (
                    <TableRow key={signature?.id}>
                      <TableCell>{signature?.signerEmail}</TableCell>
                      <TableCell>{formatDate(signature?.createdAt)}</TableCell>
                      <TableCell>
                        {signature?.signedAt
                          ? formatDate(signature?.signedAt)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(signature?.status)}
                        >
                          {signature?.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSignature(signature?.id)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleRequestSignature}>
            <FileSignature className="h-4 w-4 mr-2" />
            Request New Signature
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
