// components/signature/SignatureDetails.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  documentService,
  signatureService,
} from "@/lib/api/e-signature/client";
import { formatDate, getStatusColor } from "@/lib/utils/e-signature/utils";
import DocumentViewer from "../Documents/DocumentViewer";

export function SignatureDetails({ signatureId }: { signatureId: string }) {
  const router = useRouter();
  const [signature, setSignature] = useState<any>(null);
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  // Fetch signature details
  useEffect(() => {
    const fetchSignature = async () => {
      if (!signatureId) return;

      setLoading(true);
      try {
        const signatureResponse = await signatureService.getSignatureById(
          signatureId
        );
        setSignature(signatureResponse.data);

        // Fetch document details
        if (signatureResponse.data.documentId) {
          const documentResponse = await documentService.getDocumentById(
            signatureResponse.data.documentId
          );
          setDocument(documentResponse.data);
        }

        setError("");
      } catch (err) {
        console.error("Error fetching signature details:", err);
        setError("Failed to load signature details. Please try again.");
        toast.error("Signature not found");
      } finally {
        setLoading(false);
      }
    };

    fetchSignature();
  }, [signatureId]);

  // Update signature status
  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await signatureService.updateSignatureStatus(signatureId, {
        status: newStatus,
      });

      // Update local state
      setSignature((prev: any) => ({
        ...prev,
        status: newStatus,
        signedAt: new Date().toISOString(),
      }));

      toast.success(
        `Signature ${
          newStatus === "signed" ? "approved" : "rejected"
        } successfully`
      );
    } catch (err) {
      console.error(`Error ${newStatus} signature:`, err);
      toast.error(`Failed to ${newStatus} signature`);
    } finally {
      setUpdating(false);
    }
  };

  // Handle signature approval
  const handleSign = () => {
    updateStatus("signed");
  };

  // Handle signature rejection
  const handleReject = () => {
    updateStatus("rejected");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!signature && !loading) {
    return (
      <div className="flex justify-center items-center py-12 text-red-500">
        <p>Signature request not found.</p>
      </div>
    );
  }

  const isPending = signature?.status === "pending";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Signature Request</CardTitle>
              <CardDescription>
                Review and manage signature request
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={getStatusColor(signature?.status)}
            >
              {signature?.status || "Pending"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-2 rounded-md bg-red-50 text-red-500">{error}</div>
          )}

          {/* Signature Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <FileText className="h-5 w-5 mt-0.5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Document</p>
                  <p className="font-medium">
                    {document?.title || "Unknown document"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <User className="h-5 w-5 mt-0.5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Signer</p>
                  <p className="font-medium">
                    {signature?.signerEmail || "No email provided"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Calendar className="h-5 w-5 mt-0.5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Requested on
                  </p>
                  <p>{formatDate(signature?.createdAt)}</p>
                </div>
              </div>
            </div>

            {signature?.signedAt && (
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Calendar className="h-5 w-5 mt-0.5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Signed on
                    </p>
                    <p>{formatDate(signature?.signedAt)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Document Preview */}
          {document! && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Document</h3>
              <DocumentViewer
                documentUrl={document?.fileUrl}
                documentTitle={document?.title}
                documentType={document?.fileType}
              />
            </div>
          )}

          {/* Signature Preview */}
          {signature?.signatureData && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Signature</h3>
              <div className="border p-4 rounded-md flex justify-center bg-white">
                <img
                  src={signature?.signatureData}
                  alt="Signature"
                  className="max-h-32 object-contain"
                />
              </div>
            </div>
          )}
        </CardContent>

        {isPending && (
          <CardFooter className="flex justify-end gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={updating}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reject the signature request. This action cannot
                    be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReject}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Reject
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button onClick={handleSign} disabled={updating}>
              {updating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Sign Document
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export default SignatureDetails;
