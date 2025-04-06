// app/(dashboard)/signatures/request/layout.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from 'next/link';

export default function SignatureRequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link href="/signatures">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">Request Signature</h1>
        <p className="text-gray-500 mt-1">Send a document for electronic signature</p>
      </header>

      {children}
    </div>
  );
}