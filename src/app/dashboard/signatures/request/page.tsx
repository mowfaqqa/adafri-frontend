"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import SignatureRequestForm from "@/components/E-signature/Signature/SignatureRequestForm";

export default function SignatureRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use state to safely store the documentId
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This will only run on the client side
    setDocumentId(searchParams.get("documentId"));
    setIsLoading(false);
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">Request Signature</h1>
        <p className="text-gray-500 mt-1">
          Send a document for electronic signature
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading signature request...</span>
        </div>
      ) : (
        <SignatureRequestForm documentId={documentId!} />
      )}
    </div>
  );
}
