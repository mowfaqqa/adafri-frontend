"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SignatureRequestForm from "@/components/E-signature/Signature/SignatureRequestForm";

export default function SignatureRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId");

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

      <SignatureRequestForm documentId={documentId!} />
    </div>
  );
}
