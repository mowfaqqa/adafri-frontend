"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import SignaturePad from "./SignaturePad";
import {
  documentService,
  signatureService,
} from "@/lib/api/e-signature/client";
import DocumentViewer from "../Documents/DocumentViewer";

export function SignatureRequestForm({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [signature, setSignature] = useState(null);
  const [signatureType, setSignatureType] = useState("");

  // Fetch document details
  useEffect(() => {
    const fetchDocument = async () => {
      if (!documentId) return;

      setLoading(true);
      try {
        const response = await documentService.getDocumentById(documentId);
        setDocument(response.data);
        setError("");
      } catch (err) {
        console.error("Error fetching document:", err);
        setError("Failed to load document. Please try again.");
        toast.error("Document not found");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  // Handle signature capture
  const handleSignatureCapture = (signatureData: any, type: string) => {
    setSignature(signatureData);
    setSignatureType(type);
    toast.success("Signature captured");
  };

  // Submit signature request
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter the signer's email address");
      return;
    }

    if (!signature) {
      setError("Please provide a signature");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const requestData = {
        documentId: document.id,
        signerEmail: email,
        signatureData: signature,
        signatureType: signatureType,
      };

      await signatureService.requestSignature(requestData);

      toast.success("Signature request sent successfully");
      router.push("/documents");
    } catch (err: any) {
      console.error("Error sending signature request:", err);
      setError(
        err.response?.data?.message ||
          "Failed to send signature request. Please try again."
      );
      toast.error("Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!document && !loading) {
    return (
      <div className="flex justify-center items-center py-12 text-red-500">
        <p>Document not found. Please select a valid document.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Request Signature for &quot;{document.title}&quot;
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-2 mb-4 rounded-md text-red-500 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Signer&apos;s Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Document Preview */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Document Preview</h3>
              <DocumentViewer
                documentUrl={document.fileUrl}
                documentTitle={document.title}
                documentType={document.fileType}
              />
            </div>

            {/* Signature Capture */}
            <SignaturePad onSignatureCapture={handleSignatureCapture} />

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="mr-2"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !signature}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send for Signature
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default SignatureRequestForm;
