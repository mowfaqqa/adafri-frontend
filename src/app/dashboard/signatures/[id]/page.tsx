"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SignatureDetails from "@/components/E-signature/Signature/SignatureDetails";

export default function SignatureDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { id } = params;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push("/dashboard/signatures")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Signatures
        </Button>
      </div>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">Signature Details</h1>
        <p className="text-gray-500 mt-1">View and manage signature request</p>
      </header>

      <SignatureDetails signatureId={id} />
    </div>
  );
}
